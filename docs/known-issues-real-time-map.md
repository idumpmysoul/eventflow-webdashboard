# Known Issues - Real-Time Map Update

## Tanggal: 7 Desember 2025

---

## ✅ Issues yang Sudah Diperbaiki

### 1. Map Tidak Update Real-Time (Harus Refresh Browser)
**Status**: ✅ **FIXED**

**Problem**: 
- Socket menerima `locationUpdate` event
- State `participantLocations` berhasil di-update
- Tapi map visual tidak update tanpa refresh browser

**Root Cause**:
- Field name mismatch antara socket payload dan MapComponent expectations
- Backend emit: `geofenceStatus`, `updatedAt`
- MapComponent expect: `lastGeofenceStatus`, `lastUpdatedAt`

**Solution**:
```javascript
// DashboardPage.jsx - Socket listener
socket.on('locationUpdate', (payload) => {
    setParticipantLocations(prevLocations => {
        // ... 
        return {
            ...oldData,
            lastGeofenceStatus: payload.geofenceStatus, // ✅ Renamed
            lastUpdatedAt: payload.updatedAt            // ✅ Renamed
        };
    });
});
```

---

### 2. Zones dan Spots Hilang Saat Participant Update
**Status**: ✅ **FIXED**

**Problem**:
- Saat location update → Zones dan spots hilang dari map
- Harus klik UI atau refresh browser untuk muncul kembali

**Root Cause**:
- MapComponent remount karena `key` prop berubah setiap render
- Props `zones`/`spots` reference berubah setiap DashboardPage re-render
- Map style belum loaded saat zones/spots di-add

**Solution**:
1. **Stabilize props dengan useMemo + JSON.stringify**:
```javascript
// DashboardPage.jsx
const zonesJson = JSON.stringify(zones);
const spotsJson = JSON.stringify(spots);
const stableZones = useMemo(() => zones, [zonesJson]);
const stableSpots = useMemo(() => spots, [spotsJson]);
```

2. **Auto re-attach zones/spots saat hilang**:
```javascript
// MapComponent.jsx - useEffect participants
if (shouldHaveZones && (!hasZonesLayer || !hasZonesSource)) {
    const reAddZones = () => { /* ... */ };
    
    if (map.current.isStyleLoaded()) {
        reAddZones();
    } else {
        map.current.on('styledata', onStyleData);
    }
}

if (shouldHaveSpots && currentSpotMarkersCount > 0) {
    spots.forEach(spot => {
        spotMarkers.current[spot.id].addTo(map.current);
    });
}
```

3. **Re-attach participant markers**:
```javascript
// MapComponent.jsx - Participant marker update
if (participantMarkers.current[p.userId]) {
    participantMarkers.current[p.userId].addTo(map.current); // ✅ Re-attach
    participantMarkers.current[p.userId].setLngLat([p.longitude, p.latitude]);
}
```

---

### 3. MapComponent Remount Berlebihan
**Status**: ✅ **FIXED**

**Problem**:
- Setiap klik UI (expand attendance, toggle mode) → MapComponent remount
- Semua markers hilang dan harus re-render dari awal

**Root Cause**:
```javascript
// BEFORE (BROKEN):
<MapComponent 
    key={JSON.stringify(zones) + JSON.stringify(spots) + isManageZonesMode + ...} 
/>
```

**Solution**:
```javascript
// AFTER (FIXED):
const [mapKey, setMapKey] = useState(0);

<MapComponent key={mapKey} />

// Only increment mapKey when zones/spots actually change (create/update/delete)
setMapKey(prev => prev + 1);
```

---

## ⚠️ Known Issues (Belum Diperbaiki)

### 1. Klik "Live Map" Menu Menghilangkan Semua Markers
**Status**: ⚠️ **OPEN**

**Problem**:
- Saat klik menu "Live Map" di navbar
- DashboardPage remount dari awal
- Semua zones, spots, dan participant nodes hilang
- Markers baru muncul setelah data reload selesai

**Root Cause**:
- Klik "Live Map" → React Router navigate ke `/`
- DashboardPage component **unmount** kemudian **mount ulang**
- Semua state (`zones`, `spots`, `participantLocations`) kembali ke initial value `[]`
- `mapKey` kembali ke `0`
- Data fetch async → Ada delay sebelum markers muncul

**Temporary Workaround**:
- MapComponent sudah punya auto re-attach logic
- Markers akan muncul kembali setelah data load (1-2 detik)
- User bisa tunggu sebentar atau klik UI lain untuk trigger re-attach

**Potential Solutions** (Belum Diimplementasi):
1. **Persist state dengan React Context atau Redux**
   - Store zones/spots/participants di global state
   - Tidak hilang saat component remount
   
2. **Use sessionStorage/localStorage**
   ```javascript
   // Save to storage before unmount
   useEffect(() => {
       return () => {
           sessionStorage.setItem('mapData', JSON.stringify({zones, spots, participants}));
       };
   }, [zones, spots, participants]);
   
   // Restore from storage on mount
   useEffect(() => {
       const saved = sessionStorage.getItem('mapData');
       if (saved) {
           const {zones, spots, participants} = JSON.parse(saved);
           setZones(zones);
           setSpots(spots);
           // ...
       }
   }, []);
   ```

3. **Prevent navigation remount**
   - Lift DashboardPage state ke parent (App.jsx)
   - Atau gunakan React Router `loader` untuk pre-fetch data

4. **Show loading overlay instead of unmounting**
   - Jangan unmount MapComponent saat navigate
   - Show overlay "Loading..." di atas map yang existing

---

## 📊 Testing Summary

### ✅ Working Features:
- Real-time location update via Socket.io
- Zones auto re-attach when missing
- Spots auto re-attach when missing
- Participant markers auto re-attach when missing
- Map tidak remount saat UI toggle (expand, search, etc.)
- Field mapping correct (lastGeofenceStatus, lastUpdatedAt)

### ⚠️ Known Limitations:
- Navigate ke "Live Map" menu causes temporary marker disappearance
- Markers akan muncul kembali setelah 1-2 detik (data reload)

---

## 🔧 Debugging Tips

### Console Logs untuk Troubleshooting:

**Check Socket Connection**:
```
[Socket] Connected: <socket_id>
[Socket] Emitted joinEventRoom for: <event_id>
```

**Check Location Update Received**:
```
🗺️ [Socket] Location update received: { userId, latitude, longitude, ... }
🗺️ [Socket] ✅ Updated location from: [old] to: [new]
```

**Check MapComponent Rendering**:
```
🗺️ [MapComponent] useEffect triggered - updating markers
🗺️ [MapComponent] Participant locations: <count>
🗺️ [MapComponent] Current spot markers: <count>
🗺️ [MapComponent] Map has zones-fill layer: true/false
```

**Check Auto Re-attach**:
```
⚠️ [MapComponent] Zones missing! Layer: false Source: false
⏳ [MapComponent] Waiting for style to load before re-adding zones...
✅ [MapComponent] Zones re-added successfully

🔧 [MapComponent] Spots exist in memory, re-attaching to map...
✅ [MapComponent] Spots re-attached successfully
```

---

## 📝 Related Documentation

- `attendance-checkin-system.md` - Complete socket event documentation
- `socket-testing-guide.md` - Testing procedures
- `QUICK-TEST-LOCATION-UPDATE.md` - Quick testing steps

---

## 🎯 Priority untuk Future Fix

1. **HIGH**: Fix "Live Map" navigation issue (data persistence)
2. **MEDIUM**: Optimize re-attach logic (reduce console logs)
3. **LOW**: Add loading spinner saat zones/spots re-attach

---

**Last Updated**: 7 Desember 2025, 23:45 WIB
**Status**: Production-ready dengan known limitation pada navigation
