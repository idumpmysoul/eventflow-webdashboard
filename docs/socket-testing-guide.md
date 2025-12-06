# Socket.io Real-time Location Testing Guide

Panduan lengkap untuk testing implementasi Socket.io real-time location update di EventFlow Dashboard.

---

## ✅ Yang Sudah Diimplementasikan

### **Backend (locationController.ts)**
```typescript
// ✅ Emit socket event setelah save location
io.to(eventId).emit('locationUpdate', {
  userId,
  eventId,
  latitude,
  longitude,
  geofenceStatus: 'INSIDE' | 'OUTSIDE',
  updatedAt: new Date(),
  user: {
    id: user.id,
    name: user.name,
    avatarUrl: user.avatarUrl
  }
});
```

### **Frontend (DashboardPage.jsx)**
```javascript
// ✅ Socket connection dengan debugging
socket.connect();
socket.emit('joinEventRoom', selectedEventId);

// ✅ Location update listener dengan console logs
socket.on('locationUpdate', (payload) => {
  console.log('[Socket] Location update received:', payload);
  
  setParticipantLocations((prevLocations) => {
    // Update existing or add new participant location
    const existingIndex = prevLocations.findIndex(
      (p) => p.userId === payload.userId
    );
    
    if (existingIndex > -1) {
      // Update position, status, timestamp
      updatedLocations[existingIndex] = {
        ...updatedLocations[existingIndex],
        latitude: payload.latitude,
        longitude: payload.longitude,
        geofenceStatus: payload.geofenceStatus,
        updatedAt: payload.updatedAt,
        user: payload.user
      };
    } else {
      // Add new participant
      return [...prevLocations, payload];
    }
  });
});

// ✅ Cleanup on unmount
return () => {
  socket.emit('leaveEventRoom', selectedEventId);
  socket.off('locationUpdate');
  socket.disconnect();
};
```

### **Map Component (MapComponent.jsx)**
```javascript
// ✅ Auto-update markers when participantLocations changes
useEffect(() => {
  participantLocations.forEach(p => {
    if (participantMarkers.current[p.userId]) {
      // Update existing marker position
      participantMarkers.current[p.userId].setLngLat([p.longitude, p.latitude]);
    }
  });
}, [participantLocations]);
```

---

## 🧪 Testing Steps

### **Test 1: Verify Socket Connection**

1. **Open Dashboard** (`http://localhost:5173`)
2. **Login as Organizer**
3. **Open Browser Console** (F12 → Console tab)

**Expected Logs:**
```
[Socket] Initializing socket connection...
[Socket] Selected Event ID: event-abc123
✅ [Socket] Connected successfully, Socket ID: xyz789
[Socket] Emitted joinEventRoom for: event-abc123
```

**✅ Pass:** Semua log muncul
**❌ Fail:** Tidak ada log atau error

---

### **Test 2: Simulate Participant Location Update**

#### **Option A: Manual API Call (Postman/cURL)**

```bash
# Backend URL
POST http://localhost:4000/api/events/event-abc123/location

# Headers
Authorization: Bearer PARTICIPANT_JWT_TOKEN
Content-Type: application/json

# Body
{
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

#### **Option B: Browser Console (Organizer Dashboard)**

```javascript
// Open console on dashboard, paste this:
fetch('http://localhost:4000/api/events/event-abc123/location', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_PARTICIPANT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    latitude: -6.2088,
    longitude: 106.8456
  })
})
.then(r => r.json())
.then(data => console.log('Location updated:', data))
.catch(err => console.error('Error:', err));
```

**Expected Console Logs (Dashboard):**
```
[Socket] Location update received: {
  userId: "user-123",
  eventId: "event-abc123",
  latitude: -6.2088,
  longitude: 106.8456,
  geofenceStatus: "INSIDE",
  updatedAt: "2025-12-07T10:30:00.000Z",
  user: {
    id: "user-123",
    name: "John Doe",
    avatarUrl: "https://..."
  }
}
[Socket] Existing participant index: 0
[Socket] Updated location: { userId: "user-123", latitude: -6.2088, ... }
```

**Expected UI Behavior:**
- ✅ Map marker moves to new position immediately
- ✅ Marker color updates (green if INSIDE, red if OUTSIDE)
- ✅ Popup shows updated coordinates
- ✅ No page refresh needed

---

### **Test 3: Multiple Participants Test**

**Scenario:** 3 participants update location simultaneously

**Test Code (Run in Backend Node.js REPL or test script):**

```javascript
const { io } = require('./socketHandler'); // Your socket instance

// Simulate 3 rapid location updates
const updates = [
  {
    userId: 'user-1',
    eventId: 'event-abc123',
    latitude: -6.20,
    longitude: 106.81,
    geofenceStatus: 'INSIDE',
    updatedAt: new Date(),
    user: { id: 'user-1', name: 'Alice', avatarUrl: null }
  },
  {
    userId: 'user-2',
    eventId: 'event-abc123',
    latitude: -6.21,
    longitude: 106.82,
    geofenceStatus: 'OUTSIDE',
    updatedAt: new Date(),
    user: { id: 'user-2', name: 'Bob', avatarUrl: null }
  },
  {
    userId: 'user-3',
    eventId: 'event-abc123',
    latitude: -6.22,
    longitude: 106.83,
    geofenceStatus: 'INSIDE',
    updatedAt: new Date(),
    user: { id: 'user-3', name: 'Charlie', avatarUrl: null }
  }
];

updates.forEach(update => {
  io.to('event-abc123').emit('locationUpdate', update);
  console.log('Emitted location update for:', update.user.name);
});
```

**Expected Frontend Behavior:**
- ✅ All 3 markers appear on map
- ✅ Each marker at correct coordinates
- ✅ Alice & Charlie: Green markers (INSIDE)
- ✅ Bob: Red marker (OUTSIDE)
- ✅ No duplicate markers
- ✅ No race conditions or overwritten data

---

### **Test 4: Geofence Status Change**

**Test Scenario:** Participant moves from INSIDE → OUTSIDE

**Step 1:** Send location INSIDE zone
```json
{
  "latitude": -6.2088,  // Inside geofence
  "longitude": 106.8456
}
```

**Expected:**
- ✅ Marker: Green
- ✅ Popup: "Di dalam area"
- ✅ `geofenceStatus: "INSIDE"`

**Step 2:** Send location OUTSIDE zone
```json
{
  "latitude": -6.2500,  // Outside geofence
  "longitude": 106.9000
}
```

**Expected:**
- ✅ Marker: Red + pulse animation
- ✅ Popup: "Di luar area"
- ✅ `geofenceStatus: "OUTSIDE"`
- ✅ Socket event `geofenceEvent` also emitted
- ✅ Alert notification appears

---

### **Test 5: Auto Check-in Validation**

**Pre-condition:**
- Event status: `ONGOING`
- Participant attendance: `PENDING`
- Current time: Between `startTime` and `endTime`

**Test:** Send location INSIDE geofence

```json
{
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

**Expected Backend Logs:**
```
[Auto Check-in] User user-123 marked PRESENT in event event-abc123
[Socket] Emitting attendanceUpdate to room event-abc123
```

**Expected Frontend:**
- ✅ Marker color updates to green
- ✅ Socket receives `attendanceUpdate` event
- ✅ Participant status badge: "✓ PRESENT"
- ✅ Popup shows check-in time

---

### **Test 6: Stress Test (10+ Participants)**

**Test Code (Backend simulation):**

```javascript
const faker = require('faker'); // npm install faker

// Generate 20 random participants
for (let i = 0; i < 20; i++) {
  const update = {
    userId: `user-${i}`,
    eventId: 'event-abc123',
    latitude: -6.2088 + (Math.random() * 0.01 - 0.005), // Random near center
    longitude: 106.8456 + (Math.random() * 0.01 - 0.005),
    geofenceStatus: Math.random() > 0.3 ? 'INSIDE' : 'OUTSIDE',
    updatedAt: new Date(),
    user: {
      id: `user-${i}`,
      name: faker.name.findName(),
      avatarUrl: faker.image.avatar()
    }
  };
  
  io.to('event-abc123').emit('locationUpdate', update);
  
  // Delay 100ms between updates
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

**Expected Frontend Behavior:**
- ✅ All 20 markers appear
- ✅ No lag or freezing
- ✅ Each marker at correct position
- ✅ Colors match geofence status
- ✅ Popups show correct info
- ✅ No console errors

---

## 🐛 Common Issues & Solutions

### **Issue 1: Map tidak update**

**Symptoms:**
- Location update received in console
- But marker doesn't move on map

**Debugging:**
```javascript
// Check if map component re-renders
useEffect(() => {
  console.log('[MapComponent] participantLocations updated:', participantLocations.length);
}, [participantLocations]);
```

**Solution:**
- Verify `participantLocations` state is actually updating
- Check if MapComponent receives props correctly
- Verify marker update logic in useEffect

---

### **Issue 2: Socket disconnects frequently**

**Symptoms:**
```
✅ [Socket] Connected
❌ [Socket] Disconnected
✅ [Socket] Connected
❌ [Socket] Disconnected
```

**Debugging:**
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnect reason:', reason);
});
```

**Common Reasons:**
- `transport close` - Network issue
- `ping timeout` - Server not responding
- `transport error` - CORS or firewall

**Solution:**
```javascript
// Increase timeout
const socket = io('http://localhost:4000', {
  pingTimeout: 60000,
  pingInterval: 25000,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

---

### **Issue 3: Location update tidak sampai ke frontend**

**Symptoms:**
- Backend emit log muncul
- Frontend tidak receive

**Debugging:**

**Backend:**
```typescript
console.log('[Socket] Clients in room:', io.sockets.adapter.rooms.get(eventId)?.size || 0);
console.log('[Socket] Emitting to room:', eventId);
```

**Frontend:**
```javascript
socket.on('locationUpdate', (payload) => {
  console.log('[Socket] Received at:', new Date().toISOString());
  console.log('[Socket] Payload:', payload);
});
```

**Possible Causes:**
- Frontend tidak join event room
- EventId mismatch
- Socket disconnected
- CORS blocking

**Solution:**
```javascript
// Verify room join
socket.emit('joinEventRoom', selectedEventId);

// Wait for acknowledgement
socket.on('joinedRoom', (roomId) => {
  console.log('Successfully joined room:', roomId);
});
```

---

### **Issue 4: Duplicate markers**

**Symptoms:**
- Multiple markers for same participant
- Marker count increases on every update

**Debugging:**
```javascript
console.log('[MapComponent] Current markers:', Object.keys(participantMarkers.current));
console.log('[MapComponent] Participant locations:', participantLocations.map(p => p.userId));
```

**Solution:**
```javascript
// Proper cleanup before re-creating markers
Object.values(participantMarkers.current).forEach(marker => marker.remove());
participantMarkers.current = {};

// Then create new markers
participantLocations.forEach(p => {
  if (!participantMarkers.current[p.userId]) {
    // Create new marker only if not exists
    const marker = new mapboxgl.Marker()
      .setLngLat([p.longitude, p.latitude])
      .addTo(map.current);
    
    participantMarkers.current[p.userId] = marker;
  }
});
```

---

## ✅ Success Criteria Checklist

### **Socket Connection:**
- [ ] Socket connects successfully on dashboard load
- [ ] Socket ID appears in console logs
- [ ] `joinEventRoom` emitted correctly
- [ ] No disconnect errors in console

### **Location Update:**
- [ ] Backend emits `locationUpdate` after POST /location
- [ ] Frontend receives payload in console
- [ ] `participantLocations` state updates
- [ ] Console shows "Updated location" log

### **Map Visualization:**
- [ ] Marker appears at correct coordinates
- [ ] Marker moves when location updates
- [ ] Marker color matches geofence status:
  - Green: INSIDE + active
  - Red: OUTSIDE + active
  - Gray: Offline
- [ ] Popup shows participant name and status

### **Real-time Features:**
- [ ] Multiple participants update independently
- [ ] No page refresh needed
- [ ] Updates appear within 1 second
- [ ] No lag or freezing with 10+ participants

### **Geofence Integration:**
- [ ] `geofenceStatus` updates correctly
- [ ] Auto check-in triggers when INSIDE
- [ ] `attendanceUpdate` event received
- [ ] Alert notification when exit zone

### **Error Handling:**
- [ ] Graceful handling of disconnects
- [ ] Auto-reconnection works
- [ ] No console errors
- [ ] No memory leaks on unmount

---

## 📊 Performance Benchmarks

### **Expected Latency:**
- **Location POST → Backend Emit:** < 50ms
- **Backend Emit → Frontend Receive:** < 100ms
- **Frontend Receive → UI Update:** < 50ms
- **Total End-to-End:** < 200ms

### **Stress Test Targets:**
- ✅ Handle 50+ concurrent participants
- ✅ Update frequency: 1 update per participant per 5 seconds
- ✅ No memory leak after 1 hour runtime
- ✅ CPU usage < 20% on client
- ✅ Network bandwidth < 10 KB/s per client

---

## 🚀 Next Steps After Testing

### **If All Tests Pass:**
1. Remove excessive console.logs from production code
2. Add error boundaries for map component
3. Implement offline queue for failed location updates
4. Add retry logic for socket disconnections
5. Deploy to staging environment

### **If Tests Fail:**
1. Check backend logs for errors
2. Verify CORS configuration
3. Test socket connection with Postman/Insomnia
4. Check network tab for WebSocket frames
5. Review this guide for debugging steps

---

**Last Updated:** December 7, 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Testing

**Contributors:**
- Backend: locationController.ts + socketHandler.ts
- Frontend: DashboardPage.jsx + MapComponent.jsx
- Documentation: socket-testing-guide.md
