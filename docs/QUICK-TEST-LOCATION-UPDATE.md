# 🚀 Quick Test: Real-time Location Update

**Problem:** Map tidak update real-time, harus refresh browser dulu

**Fix Applied:** Field name mapping (`geofenceStatus` → `lastGeofenceStatus`, `updatedAt` → `lastUpdatedAt`)

---

## ✅ Testing Steps

### **1. Open Dashboard**
```
http://localhost:5173
Login sebagai Organizer
```

### **2. Open Browser Console (F12)**

**Expected Initial Logs:**
```
[Socket] Initializing socket connection...
[Socket] Selected Event ID: event-abc123
✅ [Socket] Connected successfully, Socket ID: xyz789
[Socket] Emitted joinEventRoom for: event-abc123
🗺️ [MapComponent] useEffect triggered - updating markers
🗺️ [MapComponent] Participant locations: 5
```

### **3. Send Location Update (Pilih salah satu)**

#### **Option A: cURL (Recommended)**
```bash
curl -X POST http://localhost:4000/api/events/YOUR_EVENT_ID/location \
  -H "Authorization: Bearer PARTICIPANT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

#### **Option B: Postman**
```
POST http://localhost:4000/api/events/YOUR_EVENT_ID/location

Headers:
Authorization: Bearer PARTICIPANT_JWT_TOKEN
Content-Type: application/json

Body (raw JSON):
{
  "latitude": -6.2088,
  "longitude": 106.8456
}
```

#### **Option C: Browser Console (dari Dashboard)**
```javascript
fetch('http://localhost:4000/api/events/YOUR_EVENT_ID/location', {
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
.then(data => console.log('✅ Location updated:', data))
.catch(err => console.error('❌ Error:', err));
```

### **4. Check Console Logs**

**Expected Sequence:**
```
🗺️ [Socket] Location update received: {
  userId: "user-123",
  eventId: "event-abc123",
  latitude: -6.2088,
  longitude: 106.8456,
  geofenceStatus: "INSIDE",
  updatedAt: "2025-12-07T10:30:00.000Z",
  user: { id: "user-123", name: "John Doe" }
}
🗺️ [Socket] Timestamp: 2025-12-07T10:30:00.123Z
🗺️ [Socket] Previous locations count: 5
🗺️ [Socket] Existing participant index: 2
🗺️ [Socket] ✅ Updated location from: -6.2080, 106.8450 to: -6.2088, 106.8456
🗺️ [Socket] Status: INSIDE
🗺️ [MapComponent] useEffect triggered - updating markers
🗺️ [MapComponent] Participant locations: 5
🗺️ [MapComponent] Processing participant: {
  userId: "user-123",
  name: "John Doe",
  lat: "-6.2088",
  lng: "106.8456",
  status: "INSIDE",
  hasMarker: true
}
🗺️ [MapComponent] ✅ Updating marker position from: -6.2080, 106.8450 to: -6.2088, 106.8456
```

### **5. Visual Verification**

**✅ SUCCESS if you see:**
- Marker moves to new position **WITHOUT** refresh
- Movement is **smooth** (not teleporting)
- Marker color updates:
  - **Green** if `geofenceStatus: "INSIDE"`
  - **Red** if `geofenceStatus: "OUTSIDE"`
- Popup shows updated coordinates
- No page reload needed

**❌ FAIL if:**
- Marker doesn't move
- Console shows errors
- Need to refresh to see update
- Marker disappears

---

## 🐛 Troubleshooting

### **Problem 1: Tidak ada console logs `[Socket] Location update received`**

**Possible Causes:**
- Backend tidak emit socket event
- Socket disconnected
- Frontend tidak join event room

**Solution:**
```javascript
// Check socket status
console.log('Socket connected?', socket.connected);
console.log('Socket ID:', socket.id);

// Manually join room
socket.emit('joinEventRoom', 'YOUR_EVENT_ID');
```

---

### **Problem 2: Log muncul tapi marker tidak bergerak**

**Possible Causes:**
- Field name mismatch (sudah diperbaiki)
- MapComponent useEffect tidak trigger
- Coordinate values invalid

**Debug:**
```javascript
// Check participantLocations state
console.log('Current participantLocations:', participantLocations);

// Check if coordinates valid
console.log('Latitude type:', typeof payload.latitude); // Should be "number"
console.log('Longitude type:', typeof payload.longitude); // Should be "number"
```

---

### **Problem 3: Error "Cannot read property 'setLngLat' of undefined"**

**Possible Causes:**
- Marker belum dibuat
- Marker di-remove sebelum update

**Solution:**
```javascript
// Check marker exists before update
if (participantMarkers.current[userId]) {
  participantMarkers.current[userId].setLngLat([lng, lat]);
} else {
  console.warn('Marker not found for userId:', userId);
}
```

---

### **Problem 4: Marker bergerak tapi data tidak konsisten**

**Possible Causes:**
- Field mapping salah
- Data type tidak match

**Check:**
```javascript
// Verify field names
console.log('Has lastGeofenceStatus?', 'lastGeofenceStatus' in location);
console.log('Has lastUpdatedAt?', 'lastUpdatedAt' in location);

// Should both be true
```

---

## 📊 Performance Check

### **Expected Latency:**
| Step | Target | Acceptable |
|------|--------|------------|
| POST /location → Backend emit | < 50ms | < 100ms |
| Backend emit → Frontend receive | < 100ms | < 200ms |
| Frontend receive → State update | < 10ms | < 50ms |
| State update → Map re-render | < 50ms | < 100ms |
| **TOTAL END-TO-END** | **< 210ms** | **< 450ms** |

### **Test Multiple Updates:**
```bash
# Send 5 rapid updates (1 second apart)
for i in {1..5}; do
  curl -X POST http://localhost:4000/api/events/YOUR_EVENT_ID/location \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"latitude\": -6.208$i, \"longitude\": 106.845$i}"
  sleep 1
done
```

**Expected:**
- All 5 markers update sequentially
- No lag or freezing
- No duplicate markers
- Smooth transitions

---

## ✅ Success Criteria

- [ ] Socket connects on dashboard load
- [ ] `joinEventRoom` emitted successfully
- [ ] POST /location returns 200 OK
- [ ] Backend emits `locationUpdate` event
- [ ] Frontend receives payload in console
- [ ] `participantLocations` state updates
- [ ] MapComponent useEffect triggers
- [ ] Marker position updates (setLngLat called)
- [ ] Visual marker moves on map
- [ ] **NO browser refresh needed** ✨
- [ ] Update completes in < 500ms
- [ ] No console errors

---

## 🔧 Key Changes Made

### **1. Field Name Mapping (DashboardPage.jsx)**
```javascript
// Before (WRONG):
geofenceStatus: payload.geofenceStatus,
updatedAt: payload.updatedAt,

// After (CORRECT):
lastGeofenceStatus: payload.geofenceStatus, // MapComponent uses this
lastUpdatedAt: payload.updatedAt,          // MapComponent uses this
```

### **2. Enhanced Debugging Logs**
```javascript
// Socket listener
console.log('🗺️ [Socket] Location update received:', payload);
console.log('🗺️ [Socket] ✅ Updated location from:', oldCoords, 'to:', newCoords);

// MapComponent
console.log('🗺️ [MapComponent] useEffect triggered');
console.log('🗺️ [MapComponent] ✅ Updating marker position');
```

### **3. State Update with Spread Operator**
```javascript
// Proper immutable update
const updatedLocations = [...prevLocations];
updatedLocations[existingIndex] = {
  ...oldData,           // Preserve existing data
  latitude: payload.latitude,
  longitude: payload.longitude,
  lastGeofenceStatus: payload.geofenceStatus,
  lastUpdatedAt: payload.updatedAt
};
```

---

## 🚀 Next Steps

### **After Successful Test:**
1. Remove excessive `console.log` statements
2. Test with 10+ participants
3. Test rapid updates (5 updates in 5 seconds)
4. Test on mobile device
5. Deploy to staging

### **If Test Fails:**
1. Check backend logs for emit confirmation
2. Verify CORS configuration
3. Check WebSocket frames in Network tab
4. Review this guide step-by-step
5. Open issue with console logs

---

**Last Updated:** December 7, 2025  
**Status:** 🔧 Testing Required  
**Priority:** HIGH - Real-time feature critical

**Files Modified:**
- `src/pages/DashboardPage.jsx` - Field mapping fix + debug logs
- `src/components/MapComponent.jsx` - Debug logs added
- `docs/QUICK-TEST-LOCATION-UPDATE.md` - This testing guide
