# Attendance & Check-in System Documentation

Dokumentasi lengkap sistem absensi (attendance) dan check-in otomatis untuk EventFlow Dashboard.

---

## 📋 Overview

Sistem attendance EventFlow menggunakan **auto check-in berbasis geofence**. Participant akan otomatis ter-check-in saat lokasi mereka memasuki area event yang ditentukan organizer.

### **Key Features:**
1. ✅ **Auto Check-in** - Check-in otomatis saat masuk geofence
2. ✅ **Real-time Update** - Socket.io untuk update status langsung
3. ✅ **Attendance Statistics** - Dashboard stats dengan fallback calculation
4. ✅ **Manual Override** - Organizer bisa manually update status
5. ✅ **Visual Indicators** - Map markers dengan color-coded attendance status

---

## 🎯 Attendance Flow

### **1. Participant Mengirim Lokasi**
```
Participant App (Mobile/Web)
  ↓ POST /locations/:eventId
  { latitude, longitude }
  ↓
Backend Geofence Detection
  ↓ Check if location inside event area
  ↓ If INSIDE → Auto Check-in
Socket Emit 'attendanceUpdate'
  ↓
Organizer Dashboard (Real-time)
  ↓ Update participants list
  ↓ Update map markers
  ↓ Update attendance stats
```

### **2. Backend Geofence Detection**
**File:** `locationController.ts`

```typescript
export const updateParticipantLocation = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { latitude, longitude } = req.body;
  const userId = getUserIdFromToken(req);

  // 1. Save location to database
  const savedLocation = await saveLocation(eventId, userId, latitude, longitude);

  // 2. ⚡ EMIT SOCKET EVENT FOR REAL-TIME MAP UPDATE
  // CRITICAL: Emit IMMEDIATELY after save, BEFORE geofence check
  io.to(eventId).emit('locationUpdate', {
    userId,
    latitude,
    longitude,
    timestamp: new Date(),
    user: savedLocation.user // Include user info for marker popup
  });

  // 3. Check geofence (is participant inside event area?)
  const event = await getEventById(eventId);
  const isInside = checkGeofence(latitude, longitude, event.geofence);

  // 4. Auto check-in if inside and not yet checked in
  if (isInside) {
    const participant = await getParticipant(eventId, userId);
    
    if (participant.attendanceStatus === 'PENDING') {
      // Auto check-in!
      await updateAttendance(eventId, userId, 'PRESENT');
      
      // Emit socket event for attendance update
      io.to(eventId).emit('attendanceUpdate', {
        eventId,
        userId,
        attendanceStatus: 'PRESENT',
        checkInTime: new Date()
      });
    }
  }

  res.json({ success: true });
};
```

---

### **⚠️ CRITICAL: Socket Event Emission Order**

**Backend MUST emit 2 socket events:**

1. **`locationUpdate`** - Emit IMMEDIATELY after location save (for real-time map)
2. **`attendanceUpdate`** - Emit ONLY if status changes (PENDING → PRESENT)

**Why emit `locationUpdate` BEFORE geofence check?**
- Organizer dashboard map needs to update **IMMEDIATELY** when participant moves
- Geofence check can take 100-500ms (database query + calculation)
- If we emit after geofence, map will lag behind participant's real location

---

### **3. Socket.io Server Setup**

**File:** `socketHandler.ts`

```typescript
import { Server } from 'socket.io';

export const initializeSocket = (server: any) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join event-specific room
    socket.on('joinEventRoom', (eventId: string) => {
      socket.join(eventId);
      console.log(`[Socket] Client ${socket.id} joined event room: ${eventId}`);
    });

    // Leave event room
    socket.on('leaveEventRoom', (eventId: string) => {
      socket.leave(eventId);
      console.log(`[Socket] Client ${socket.id} left event room: ${eventId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Export io instance for use in controllers
export let io: Server;
export const setIo = (socketIo: Server) => {
  io = socketIo;
};
```

---

## 🗺️ Geofence Detection

### **How It Works:**

**Event Area Definition:**
```javascript
// Event memiliki geofence boundary (polygon atau circle)
const event = {
  id: 'event-123',
  name: 'Tech Conference 2025',
  geofence: {
    type: 'CIRCLE',
    center: { lat: -6.200000, lng: 106.816666 }, // Jakarta
    radius: 500 // meters
  }
};
```

**Detection Algorithm:**
```javascript
function checkGeofence(lat, lng, geofence) {
  if (geofence.type === 'CIRCLE') {
    // Calculate distance from center
    const distance = calculateDistance(
      lat, lng, 
      geofence.center.lat, geofence.center.lng
    );
    
    return distance <= geofence.radius; // Inside if within radius
  }
  
  if (geofence.type === 'POLYGON') {
    // Point-in-polygon algorithm
    return pointInPolygon({ lat, lng }, geofence.coordinates);
  }
  
  return false;
}
```

---

## 📊 Attendance Status Types

### **Status Enum:**
```typescript
enum AttendanceStatus {
  PENDING = 'PENDING',     // Belum check-in
  PRESENT = 'PRESENT',     // Sudah check-in (hadir)
  ABSENT = 'ABSENT',       // Tidak hadir
  EXCUSED = 'EXCUSED'      // Izin tidak hadir
}
```

### **Status Meanings:**

| Status | Deskripsi | Cara Mendapat | Color Indicator |
|--------|-----------|---------------|-----------------|
| **PENDING** | Belum check-in | Default saat participant register | Gray/Yellow |
| **PRESENT** | Hadir (auto check-in) | Masuk geofence event area | Green |
| **ABSENT** | Tidak hadir | Manual set by organizer (setelah event selesai) | Red |
| **EXCUSED** | Izin tidak hadir | Manual set by organizer (participant konfirmasi tidak bisa hadir) | Orange |

---

## 🔧 Backend Implementation

### **Database Schema**

**EventParticipant Table:**
```prisma
model EventParticipant {
  id                String            @id @default(cuid())
  eventId           String
  userId            String
  attendanceStatus  AttendanceStatus  @default(PENDING)
  checkInTime       DateTime?
  registeredAt      DateTime          @default(now())
  
  event             Event             @relation(fields: [eventId], references: [id])
  user              User              @relation(fields: [userId], references: [id])
  
  @@unique([eventId, userId])
}
```

### **Key Endpoints**

#### 1. **Get Attendance Statistics**
```
GET /event-participants/:eventId/attendance-stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalParticipants": 150,
    "presentCount": 120,
    "pendingCount": 20,
    "absentCount": 8,
    "excusedCount": 2,
    "checkInRate": 80.0
  }
}
```

**Backend Code:**
```typescript
export const getAttendanceStatistics = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  
  const participants = await prisma.eventParticipant.findMany({
    where: { eventId }
  });
  
  const stats = {
    totalParticipants: participants.length,
    presentCount: participants.filter(p => p.attendanceStatus === 'PRESENT').length,
    pendingCount: participants.filter(p => p.attendanceStatus === 'PENDING').length,
    absentCount: participants.filter(p => p.attendanceStatus === 'ABSENT').length,
    excusedCount: participants.filter(p => p.attendanceStatus === 'EXCUSED').length,
    checkInRate: (presentCount / totalParticipants) * 100
  };
  
  res.json(baseResponse({ success: true, data: stats }));
};
```

#### 2. **Update Participant Attendance (Manual)**
```
PATCH /event-participants/:eventId/:userId/attendance
```

**Request Body:**
```json
{
  "attendanceStatus": "PRESENT"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "participant-123",
    "attendanceStatus": "PRESENT",
    "checkInTime": "2025-12-07T10:30:00.000Z"
  }
}
```

**Backend Code:**
```typescript
export const updateParticipantAttendance = async (req: Request, res: Response) => {
  const { eventId, userId } = req.params;
  const { attendanceStatus } = req.body;
  
  const updated = await prisma.eventParticipant.update({
    where: { 
      eventId_userId: { eventId, userId } 
    },
    data: {
      attendanceStatus,
      checkInTime: attendanceStatus === 'PRESENT' ? new Date() : null
    }
  });
  
  // Emit socket event for real-time update
  emitAttendanceUpdate({
    eventId,
    userId,
    attendanceStatus: updated.attendanceStatus,
    checkInTime: updated.checkInTime
  });
  
  res.json(baseResponse({ success: true, data: updated }));
};
```

---

## 💻 Frontend Implementation

### **1. AttendanceStatsCard Component**

**Location:** `src/components/AttendanceStatsCard.jsx`

**Features:**
- Fetch stats from backend (with fallback)
- Auto-refresh every 30 seconds
- Real-time update via socket

**Code:**
```javascript
const AttendanceStatsCard = ({ eventId }) => {
  const [stats, setStats] = useState(null);
  
  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      // Try backend endpoint first
      const response = await api.getAttendanceStatistics(eventId);
      console.log('✅ Using backend endpoint');
      setStats(response);
    } catch (err) {
      // Fallback: Calculate manually from participants
      console.warn('⚠️ Backend endpoint failed, using fallback');
      const participants = await api.getEventParticipants(eventId);
      const calculated = calculateStatsManually(participants);
      setStats(calculated);
    }
  };
  
  // Auto-refresh every 30s
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [eventId]);
  
  // Real-time socket update
  useEffect(() => {
    socket.on('attendanceUpdate', (payload) => {
      if (payload.eventId === eventId) {
        fetchStats(); // Refresh stats
      }
    });
    
    return () => socket.off('attendanceUpdate');
  }, [eventId]);
  
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatBox 
        label="Hadir" 
        count={stats?.presentCount || 0}
        color="green"
      />
      <StatBox 
        label="Pending" 
        count={stats?.pendingCount || 0}
        color="yellow"
      />
      <StatBox 
        label="Tidak Hadir" 
        count={stats?.absentCount || 0}
        color="red"
      />
      <StatBox 
        label="Izin" 
        count={stats?.excusedCount || 0}
        color="orange"
      />
    </div>
  );
};
```

### **2. Dashboard Real-time Update**

**Location:** `src/pages/DashboardPage.jsx`

**Socket Handler for Location Update:**
```javascript
useEffect(() => {
  if (!selectedEventId || loading) return;

  // Connect to socket and join event room
  socket.connect();
  socket.emit('joinEventRoom', selectedEventId);

  // 🗺️ Listen for LOCATION updates (real-time map)
  socket.on('locationUpdate', (newLocation) => {
    console.log('[Socket] Location updated:', newLocation);
    
    setParticipantLocations((prevLocations) => {
      if (!prevLocations) return [newLocation];
      
      // Find existing participant
      const existingIndex = prevLocations.findIndex(
        (p) => p.userId === newLocation.userId
      );
      
      if (existingIndex > -1) {
        // Update existing location
        const updatedLocations = [...prevLocations];
        updatedLocations[existingIndex] = {
          ...updatedLocations[existingIndex],
          ...newLocation,
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          timestamp: newLocation.timestamp
        };
        return updatedLocations;
      }
      
      // Add new participant location
      return [...prevLocations, newLocation];
    });
  });

  // 👤 Listen for ATTENDANCE updates (status changes)
  socket.on('attendanceUpdate', (payload) => {
    if (payload.eventId === selectedEventId) {
      console.log('[Socket] Attendance updated:', payload);
      
      // 1. Update participants list (for stats)
      setParticipants(prev => 
        prev.map(p => 
          (p.userId === payload.userId || p.user?.id === payload.userId)
            ? { 
                ...p, 
                attendanceStatus: payload.attendanceStatus,
                checkInTime: payload.checkInTime 
              }
            : p
        )
      );
      
      // 2. Update participant locations (for map marker color)
      setParticipantLocations(prev => 
        prev?.map(p => 
          p.userId === payload.userId
            ? { 
                ...p, 
                attendanceStatus: payload.attendanceStatus 
              }
            : p
        ) || prev
      );
    }
  });

  // 📬 Listen for NOTIFICATION broadcast
  socket.on('notification', (notif) => {
    // Toast notification (auto-hide after 5s)
    setNotifications((prev) => [notif, ...prev]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== notif.id));
    }, 5000);
    
    // Persistent unread notification
    setUnreadNotifications((prev) => {
      if (prev.some(n => n.id === notif.id)) return prev;
      return [notif, ...prev];
    });
  });

  // Cleanup on unmount
  return () => {
    socket.off('locationUpdate');
    socket.off('attendanceUpdate');
    socket.off('notification');
    socket.emit('leaveEventRoom', selectedEventId);
    socket.disconnect();
  };
}, [selectedEventId, loading]);
```

**Socket Handler for Attendance Update:**
**Socket Handler for Attendance Update:**
```javascript
// This is ONLY for attendance status changes (PENDING → PRESENT)
// Already included in the useEffect above
```

---

### **🔍 Debugging Socket Events**

**Backend Logs:**
```typescript
// In locationController.ts
console.log(`[Socket] Emitting locationUpdate to room ${eventId}:`, {
  userId,
  latitude,
  longitude
});
io.to(eventId).emit('locationUpdate', { userId, latitude, longitude });
```

**Frontend Logs:**
```javascript
// In DashboardPage.jsx
socket.on('locationUpdate', (newLocation) => {
  console.log('[Socket] Location received:', newLocation);
  console.log('[Socket] Current locations count:', participantLocations?.length || 0);
  // ... update state
});
```

**Check Socket Connection:**
```javascript
// In DashboardPage.jsx
useEffect(() => {
  console.log('[Socket] Connection status:', socket.connected);
  console.log('[Socket] Socket ID:', socket.id);
  console.log('[Socket] Joined event room:', selectedEventId);
}, [selectedEventId]);
```

---

### **❌ Common Issues & Solutions**

#### **Problem 1: Map tidak update saat participant bergerak**

**Root Cause:**
- Backend tidak emit `locationUpdate` event
- Backend emit ke wrong room (eventId mismatch)
- Frontend tidak join event room

**Solution:**
```typescript
// Backend: Check if io.to() uses correct eventId
io.to(eventId).emit('locationUpdate', payload);

// Frontend: Verify joinEventRoom is called
socket.emit('joinEventRoom', selectedEventId);
```

#### **Problem 2: Marker muncul di koordinat lama (lag)**

**Root Cause:**
- Socket emit happens AFTER geofence check (slow)
- State update batched/delayed

**Solution:**
```typescript
// Backend: Emit IMMEDIATELY after save, BEFORE geofence
await saveLocation(...);
io.to(eventId).emit('locationUpdate', { ... }); // ✅ Emit here
await checkGeofence(...); // ❌ Not here
```

#### **Problem 3: Multiple markers for same participant**

**Root Cause:**
- `userId` mismatch in findIndex check
- Using `p.id` instead of `p.userId`

**Solution:**
```javascript
// Frontend: Use correct userId field
const existingIndex = prevLocations.findIndex(
  (p) => p.userId === newLocation.userId // ✅ Correct
  // NOT: p.id === newLocation.id // ❌ Wrong
);
```

---

### **3. Map Markers dengan Attendance Status**

**Location:** `src/components/MapComponent.jsx`

**Marker Color Logic:**
```javascript
const getMarkerColor = (participant) => {
  switch (participant.attendanceStatus) {
    case 'PRESENT':
      return '#22c55e'; // Green - Hadir
    case 'PENDING':
      return '#eab308'; // Yellow - Belum check-in
    case 'ABSENT':
      return '#ef4444'; // Red - Tidak hadir
    case 'EXCUSED':
      return '#f97316'; // Orange - Izin
    default:
      return '#6b7280'; // Gray - Unknown
  }
};

// Marker creation
participantLocations.forEach(participant => {
  const marker = new mapboxgl.Marker({ color: getMarkerColor(participant) })
    .setLngLat([participant.longitude, participant.latitude])
    .setPopup(new mapboxgl.Popup().setHTML(`
      <div>
        <strong>${participant.user?.name}</strong>
        <p>Status: ${participant.attendanceStatus}</p>
        ${participant.checkInTime ? `<p>Check-in: ${new Date(participant.checkInTime).toLocaleString()}</p>` : ''}
      </div>
    `))
    .addTo(map);
});
```

---

## 🔄 Check-in Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PARTICIPANT                                                     │
│                                                                 │
│ 1. Open app/website                                            │
│ 2. Enable location sharing                                     │
│ 3. Send location every 10-30 seconds                           │
│    POST /locations/:eventId                                    │
│    { latitude: -6.200, longitude: 106.816 }                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND (Express + Prisma)                                      │
│                                                                 │
│ 1. Receive location update                                     │
│ 2. Save to ParticipantLocation table                           │
│ 3. Get event geofence boundaries                               │
│ 4. Check: Is participant inside geofence?                      │
│                                                                 │
│    ┌─────────────────────────────────────────┐                │
│    │ Geofence Detection Algorithm            │                │
│    │                                         │                │
│    │ if (distance < radius) {                │                │
│    │   // Participant is INSIDE event area   │                │
│    │   if (status === 'PENDING') {           │                │
│    │     updateAttendance('PRESENT');        │                │
│    │     setCheckInTime(now());              │                │
│    │   }                                     │                │
│    │ }                                       │                │
│    └─────────────────────────────────────────┘                │
│                                                                 │
│ 5. Emit Socket.io event: 'attendanceUpdate'                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ ORGANIZER DASHBOARD (React)                                     │
│                                                                 │
│ 1. Socket listener: 'attendanceUpdate'                         │
│ 2. Update participants state                                   │
│    - attendanceStatus: PENDING → PRESENT                       │
│    - checkInTime: 2025-12-07T10:30:00Z                         │
│                                                                 │
│ 3. Update map marker color                                     │
│    - Yellow (PENDING) → Green (PRESENT)                        │
│                                                                 │
│ 4. Update attendance statistics                                │
│    - Present: 100 → 101                                        │
│    - Pending: 50 → 49                                          │
│    - Check-in Rate: 66.7% → 67.1%                              │
│                                                                 │
│ 5. Show toast notification                                     │
│    "John Doe has checked in"                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile App Integration

### **Participant App (React Native / Flutter)**

**Location Tracking:**
```javascript
// Start location tracking when event is active
useEffect(() => {
  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      // Send location to backend every update
      api.updateParticipantLocation(eventId, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    },
    (error) => console.error('Geolocation error:', error),
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // Update every 10 meters movement
      interval: 10000 // Or every 10 seconds
    }
  );
  
  return () => navigator.geolocation.clearWatch(watchId);
}, [eventId]);
```

**Check-in Notification:**
```javascript
// Listen for check-in confirmation
socket.on('attendanceUpdate', (payload) => {
  if (payload.userId === currentUser.id && payload.attendanceStatus === 'PRESENT') {
    // Show success notification
    showNotification({
      title: '✅ Check-in Berhasil',
      message: 'Anda telah check-in ke event',
      type: 'success'
    });
    
    // Update local state
    setIsCheckedIn(true);
  }
});
```

---

## 🎨 UI Components

### **1. Attendance Stats Grid**

```jsx
<div className="grid grid-cols-2 gap-4">
  {/* Present */}
  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">Hadir</p>
        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.presentCount}</p>
      </div>
      <CheckCircleIcon className="w-8 h-8 text-green-500" />
    </div>
  </div>
  
  {/* Pending */}
  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold uppercase">Pending</p>
        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pendingCount}</p>
      </div>
      <ClockIcon className="w-8 h-8 text-yellow-500" />
    </div>
  </div>
  
  {/* Absent */}
  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Tidak Hadir</p>
        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.absentCount}</p>
      </div>
      <XCircleIcon className="w-8 h-8 text-red-500" />
    </div>
  </div>
  
  {/* Excused */}
  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold uppercase">Izin</p>
        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{stats.excusedCount}</p>
      </div>
      <InformationCircleIcon className="w-8 h-8 text-orange-500" />
    </div>
  </div>
</div>

{/* Check-in Rate Progress Bar */}
<div className="mt-4">
  <div className="flex justify-between text-sm mb-1">
    <span className="text-gray-600 dark:text-slate-400">Check-in Rate</span>
    <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.checkInRate.toFixed(1)}%</span>
  </div>
  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
    <div 
      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
      style={{ width: `${stats.checkInRate}%` }}
    ></div>
  </div>
</div>
```

### **2. Participant List with Status Badges**

```jsx
<table className="w-full">
  <thead>
    <tr>
      <th>Name</th>
      <th>Status</th>
      <th>Check-in Time</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {participants.map(p => (
      <tr key={p.id}>
        <td>{p.user.name}</td>
        <td>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            p.attendanceStatus === 'PRESENT' ? 'bg-green-100 text-green-700' :
            p.attendanceStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
            p.attendanceStatus === 'ABSENT' ? 'bg-red-100 text-red-700' :
            'bg-orange-100 text-orange-700'
          }`}>
            {p.attendanceStatus}
          </span>
        </td>
        <td>
          {p.checkInTime ? new Date(p.checkInTime).toLocaleString() : '-'}
        </td>
        <td>
          <select 
            value={p.attendanceStatus}
            onChange={(e) => handleUpdateAttendance(p.userId, e.target.value)}
          >
            <option value="PENDING">Pending</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="EXCUSED">Excused</option>
          </select>
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

## 🔐 Security & Privacy

### **Location Permission**
- Participant **MUST** grant location permission
- App request permission on first event join
- Show explanation: "Location needed for auto check-in"

### **Data Privacy**
- Location data only shared with event organizer
- Not visible to other participants
- Automatically deleted after event ends (configurable)

### **Geofence Accuracy**
- Use high-accuracy GPS (not cell tower/wifi)
- Minimum 10-meter accuracy required
- Handle edge cases (GPS drift, tunnels, indoor)

---

## 📊 Analytics & Reports

### **Attendance Report Export**

**Endpoint:**
```
GET /event-participants/:eventId/attendance-report?format=csv
```

**CSV Output:**
```csv
Name,Email,Attendance Status,Check-in Time,Registration Time
John Doe,john@example.com,PRESENT,2025-12-07 10:30:15,2025-12-01 14:20:00
Jane Smith,jane@example.com,ABSENT,-,2025-12-01 15:45:00
Bob Wilson,bob@example.com,EXCUSED,-,2025-12-02 09:10:00
```

### **Real-time Dashboard Metrics**
- Total check-ins per hour (graph)
- Average check-in time
- Late arrivals count
- No-show predictions (ML-based)

---

## 🐛 Troubleshooting

### **Problem: Map tidak update real-time saat participant bergerak**

**Symptoms:**
- Participant send location update (POST /locations/:eventId success)
- Backend save location to database ✅
- Organizer dashboard map **TIDAK update** (marker tetap di posisi lama)
- Refresh page → Map baru update

**Root Cause Analysis:**

1. **❌ Backend tidak emit socket event `locationUpdate`**
   
   **Check:** Backend logs saat participant update location
   ```
   Expected: "[Socket] Emitting locationUpdate to room event-123"
   Actual: (no socket log) ❌
   ```
   
   **Solution:**
   ```typescript
   // locationController.ts
   export const updateParticipantLocation = async (req, res) => {
     const savedLocation = await saveLocation(eventId, userId, lat, lng);
     
     // ✅ ADD THIS: Emit socket event
     io.to(eventId).emit('locationUpdate', {
       userId,
       latitude: lat,
       longitude: lng,
       timestamp: new Date(),
       user: savedLocation.user
     });
     
     res.json({ success: true });
   };
   ```

2. **❌ Frontend tidak join event room**
   
   **Check:** Browser console saat load dashboard
   ```javascript
   Expected: "[Socket] Client abc123 joined event room: event-456"
   Actual: (no join log) ❌
   ```
   
   **Solution:**
   ```javascript
   // DashboardPage.jsx
   useEffect(() => {
     socket.connect();
     socket.emit('joinEventRoom', selectedEventId); // ✅ MUST call this
     
     socket.on('locationUpdate', handleLocationUpdate);
     
     return () => {
       socket.emit('leaveEventRoom', selectedEventId);
       socket.disconnect();
     };
   }, [selectedEventId]);
   ```

3. **❌ Socket emit ke wrong room (eventId mismatch)**
   
   **Check:** Backend event room vs participant's eventId
   ```typescript
   // Backend logs:
   console.log('Emitting to room:', eventId); // "event-123"
   console.log('Participant sent:', req.params.eventId); // "event-456" ❌ MISMATCH
   ```
   
   **Solution:** Verify API endpoint dan request params
   ```
   POST /locations/:eventId  ← Use THIS eventId for socket room
   { latitude, longitude }
   ```

4. **❌ Socket connection disconnected**
   
   **Check:** Browser console
   ```javascript
   console.log('Socket connected?', socket.connected);
   // Expected: true
   // Actual: false ❌
   ```
   
   **Solution:** Check CORS configuration
   ```typescript
   // socketHandler.ts
   const io = new Server(server, {
     cors: {
       origin: 'http://localhost:5173', // ✅ Must match frontend URL
       credentials: true
     }
   });
   ```

5. **❌ State update issue (React batching)**
   
   **Check:** Multiple rapid location updates
   ```javascript
   // Participant moves 10 meters → Send location
   // Participant moves 10 meters → Send location (too fast!)
   // React batches setState → Only last update rendered
   ```
   
   **Solution:** Use functional setState
   ```javascript
   socket.on('locationUpdate', (newLocation) => {
     setParticipantLocations(prevLocations => { // ✅ Functional update
       const existingIndex = prevLocations.findIndex(
         p => p.userId === newLocation.userId
       );
       
       if (existingIndex > -1) {
         const updated = [...prevLocations];
         updated[existingIndex] = { 
           ...updated[existingIndex], 
           ...newLocation 
         };
         return updated;
       }
       
       return [...prevLocations, newLocation];
     });
   });
   ```

---

### **Problem: Participant tidak auto check-in**

**Possible Causes:**
1. ❌ GPS accuracy too low (>50 meters)
   - **Solution:** Wait for better GPS signal
   
2. ❌ Location permission denied
   - **Solution:** Re-request permission with explanation
   
3. ❌ Not inside geofence area
   - **Solution:** Move closer to event location
   
4. ❌ Backend geofence misconfigured
   - **Solution:** Check event geofence radius (should be 100-500m)
   
5. ❌ Already checked in (status = PRESENT)
   - **Solution:** No action needed, already present

### **Problem: Stats tidak update real-time**

**Possible Causes:**
1. ❌ Socket connection disconnected
   - **Solution:** Check `socket.connected` status
   
2. ❌ EventId mismatch in socket room
   - **Solution:** Verify `socket.emit('joinEventRoom', eventId)`
   
3. ❌ Backend not emitting socket event
   - **Solution:** Check backend logs for `emitAttendanceUpdate()` calls

---

## 🧪 Testing Socket Real-time Updates

### **Test 1: Verify Socket Connection**

**Frontend Console:**
```javascript
// Add to DashboardPage.jsx useEffect
useEffect(() => {
  console.log('🔌 [Test] Socket connected:', socket.connected);
  console.log('🔌 [Test] Socket ID:', socket.id);
  console.log('🔌 [Test] Event room:', selectedEventId);
  
  socket.on('connect', () => {
    console.log('✅ [Test] Socket connected successfully');
  });
  
  socket.on('disconnect', () => {
    console.log('❌ [Test] Socket disconnected');
  });
}, [selectedEventId]);
```

**Expected Output:**
```
✅ [Test] Socket connected: true
✅ [Test] Socket ID: "abc123xyz"
✅ [Test] Event room: "event-456"
✅ [Test] Socket connected successfully
```

---

### **Test 2: Verify Room Join**

**Backend Server Logs:**
```
[Socket] Client abc123xyz connected
[Socket] Client abc123xyz joined event room: event-456 ✅
```

**If NOT seeing this:** Frontend didn't call `socket.emit('joinEventRoom')`

---

### **Test 3: Verify Location Update Emission**

**Backend locationController.ts:**
```typescript
export const updateParticipantLocation = async (req, res) => {
  const { eventId } = req.params;
  const { latitude, longitude } = req.body;
  
  console.log('📍 [Test] Location update received:', {
    eventId,
    userId: req.user.id,
    latitude,
    longitude
  });
  
  await saveLocation(eventId, req.user.id, latitude, longitude);
  
  const payload = {
    userId: req.user.id,
    latitude,
    longitude,
    timestamp: new Date()
  };
  
  console.log('📡 [Test] Emitting locationUpdate to room:', eventId, payload);
  io.to(eventId).emit('locationUpdate', payload);
  
  res.json({ success: true });
};
```

**Expected Backend Logs:**
```
📍 [Test] Location update received: { eventId: 'event-456', userId: 'user-123', latitude: -6.2, longitude: 106.8 }
📡 [Test] Emitting locationUpdate to room: event-456 { userId: 'user-123', ... }
```

---

### **Test 4: Verify Frontend Receives Update**

**Frontend DashboardPage.jsx:**
```javascript
socket.on('locationUpdate', (newLocation) => {
  console.log('🗺️ [Test] Location update received:', newLocation);
  console.log('🗺️ [Test] Current locations:', participantLocations?.length || 0);
  console.log('🗺️ [Test] Updating location for userId:', newLocation.userId);
  
  setParticipantLocations((prevLocations) => {
    console.log('🗺️ [Test] Previous locations:', prevLocations);
    
    const existingIndex = prevLocations.findIndex(
      (p) => p.userId === newLocation.userId
    );
    
    console.log('🗺️ [Test] Existing index:', existingIndex);
    
    if (existingIndex > -1) {
      const updated = [...prevLocations];
      updated[existingIndex] = { ...updated[existingIndex], ...newLocation };
      console.log('🗺️ [Test] Updated location:', updated[existingIndex]);
      return updated;
    }
    
    console.log('🗺️ [Test] Adding new location');
    return [...prevLocations, newLocation];
  });
});
```

**Expected Frontend Console:**
```
🗺️ [Test] Location update received: { userId: 'user-123', latitude: -6.2, longitude: 106.8 }
🗺️ [Test] Current locations: 5
🗺️ [Test] Updating location for userId: user-123
🗺️ [Test] Previous locations: [{ userId: 'user-123', lat: -6.19, ... }, ...]
🗺️ [Test] Existing index: 0
🗺️ [Test] Updated location: { userId: 'user-123', latitude: -6.2, longitude: 106.8 }
```

---

### **Test 5: End-to-End Flow Test**

**Simulate Participant Moving:**

1. **Open 2 browser tabs:**
   - Tab A: Participant (send location)
   - Tab B: Organizer Dashboard (watch map)

2. **Tab A - Send Location Update:**
   ```javascript
   // In participant app console
   fetch('http://localhost:3000/locations/event-456', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer participant_token',
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       latitude: -6.200000,
       longitude: 106.816666
     })
   }).then(r => r.json()).then(console.log);
   ```

3. **Tab B - Watch Dashboard Console:**
   ```
   Expected sequence:
   1. 📡 Backend emit locationUpdate
   2. 🗺️ Frontend receive locationUpdate
   3. 🗺️ Map marker moves to new position
   4. ✅ SUCCESS: Real-time update working!
   ```

4. **Verify Map Update:**
   - Open browser DevTools → Elements
   - Inspect marker element
   - Check `transform: translate(X, Y)` values change

---

### **Test 6: Multiple Participants Test**

**Scenario:** 3 participants moving simultaneously

**Expected Behavior:**
- All 3 markers update independently
- No conflicts or race conditions
- Each marker shows correct participant name/status

**Test Code:**
```javascript
// Send 3 rapid location updates (different participants)
const updates = [
  { userId: 'user-1', lat: -6.20, lng: 106.81 },
  { userId: 'user-2', lat: -6.21, lng: 106.82 },
  { userId: 'user-3', lat: -6.22, lng: 106.83 }
];

updates.forEach(update => {
  io.to('event-456').emit('locationUpdate', update);
});
```

**Verify:**
```javascript
// Frontend should have 3 updated locations
console.log('Locations after updates:', participantLocations);
// Expected: [
//   { userId: 'user-1', latitude: -6.20, ... },
//   { userId: 'user-2', latitude: -6.21, ... },
//   { userId: 'user-3', latitude: -6.22, ... }
// ]
```

---

## ✅ Implementation Checklist

### **Backend Requirements:**

- [ ] **Socket.io Server Initialized**
  ```typescript
  const io = new Server(server, { cors: { origin: FRONTEND_URL } });
  ```

- [ ] **Event Rooms Implemented**
  ```typescript
  socket.on('joinEventRoom', (eventId) => socket.join(eventId));
  ```

- [ ] **Location Update Emits Socket Event**
  ```typescript
  io.to(eventId).emit('locationUpdate', { userId, latitude, longitude });
  ```

- [ ] **Attendance Update Emits Socket Event**
  ```typescript
  io.to(eventId).emit('attendanceUpdate', { userId, attendanceStatus });
  ```

- [ ] **CORS Configured Correctly**
  ```typescript
  cors: { origin: 'http://localhost:5173', credentials: true }
  ```

- [ ] **Backend Logs Added for Debugging**
  ```typescript
  console.log('[Socket] Emitting to room:', eventId);
  ```

### **Frontend Requirements:**

- [ ] **Socket.io Client Connected**
  ```javascript
  import socket from '../services/socket.js';
  ```

- [ ] **Join Event Room on Mount**
  ```javascript
  socket.emit('joinEventRoom', selectedEventId);
  ```

- [ ] **Leave Event Room on Unmount**
  ```javascript
  return () => socket.emit('leaveEventRoom', selectedEventId);
  ```

- [ ] **Location Update Listener Registered**
  ```javascript
  socket.on('locationUpdate', handleLocationUpdate);
  ```

- [ ] **Attendance Update Listener Registered**
  ```javascript
  socket.on('attendanceUpdate', handleAttendanceUpdate);
  ```

- [ ] **State Updates Use Functional Form**
  ```javascript
  setParticipantLocations(prev => [...updated]);
  ```

- [ ] **Cleanup Socket Listeners on Unmount**
  ```javascript
  return () => {
    socket.off('locationUpdate');
    socket.off('attendanceUpdate');
  };
  ```

- [ ] **Console Logs Added for Debugging**
  ```javascript
  console.log('[Socket] Connected:', socket.connected);
  ```

### **Testing Checklist:**

- [ ] Socket connection successful (check `socket.connected === true`)
- [ ] Event room joined (check backend logs)
- [ ] Location update received in frontend console
- [ ] Map marker moves when location updates
- [ ] Multiple participants update independently
- [ ] Auto check-in triggers when entering geofence
- [ ] Attendance status updates marker color
- [ ] No duplicate markers for same participant
- [ ] No memory leaks (cleanup on unmount)
- [ ] Works with 10+ participants simultaneously

---

## ✅ Best Practices

### **For Organizers:**
1. ✅ Set geofence radius 100-500 meters (not too small/big)
2. ✅ Test auto check-in before event starts
3. ✅ Have manual override ready (for GPS issues)
4. ✅ Monitor attendance stats real-time during event
5. ✅ Export attendance report after event

### **For Developers:**
1. ✅ Use high-accuracy GPS positioning
2. ✅ Implement location tracking battery optimization
3. ✅ Handle offline scenarios (queue location updates)
4. ✅ Add retry logic for API failures
5. ✅ Show clear feedback to users (check-in success/fail)

---

## 🚀 Future Enhancements

### **Planned Features:**
- [ ] QR Code check-in (alternative to geofence)
- [ ] NFC tag check-in (for indoor events)
- [ ] Late arrival penalties/warnings
- [ ] Check-out tracking (exit geofence)
- [ ] Multi-session events (multiple check-in points)
- [ ] Attendance gamification (badges, leaderboards)

---

**Last Updated:** December 7, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready

**System Components:**
- ✅ Backend geofence detection
- ✅ Socket.io real-time updates
- ✅ Frontend attendance statistics
- ✅ Map visualization with status colors
- ✅ Manual attendance override
- ✅ CSV export functionality
