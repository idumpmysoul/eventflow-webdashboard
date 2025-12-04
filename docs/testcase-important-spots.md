# Test Case: Important Spots (Titik Penting Event)

## Tujuan
Menguji fitur CRUD dan validasi titik penting event (ImportantSpot) sesuai backend dan enum SpotType.

---

## 1. Tipe Spot (Sesuai Backend)
- ENTRY_GATE
- EXIT_GATE
- CHECKPOINT
- SHELTER
- INFO_CENTER
- STAGE
- REST_AREA
- VIEW_POINT
- DANGER_ZONE
- MEETING_POINT
- HOSPITAL
- OTHER (customType)

---

## 2. Test Case Important Spots

### 1. Tambah Spot ENTRY_GATE
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Gate Utama", latitude, longitude, type: "ENTRY_GATE" }
- **Expected:**
  - Spot bertipe ENTRY_GATE muncul di daftar dan peta.

### 2. Tambah Spot EXIT_GATE
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Gate Selatan", latitude, longitude, type: "EXIT_GATE" }
- **Expected:**
  - Spot bertipe EXIT_GATE muncul di daftar dan peta.

### 3. Tambah Spot CHECKPOINT
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Checkpoint 1", latitude, longitude, type: "CHECKPOINT" }
- **Expected:**
  - Spot bertipe CHECKPOINT muncul di daftar dan peta.

### 4. Tambah Spot SHELTER
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Shelter Barat", latitude, longitude, type: "SHELTER" }
- **Expected:**
  - Spot bertipe SHELTER muncul di daftar dan peta.

### 5. Tambah Spot INFO_CENTER
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Info Center Utama", latitude, longitude, type: "INFO_CENTER" }
- **Expected:**
  - Spot bertipe INFO_CENTER muncul di daftar dan peta.

### 6. Tambah Spot STAGE
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Main Stage", latitude, longitude, type: "STAGE" }
- **Expected:**
  - Spot bertipe STAGE muncul di daftar dan peta.

### 7. Tambah Spot REST_AREA
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Rest Area Selatan", latitude, longitude, type: "REST_AREA" }
- **Expected:**
  - Spot bertipe REST_AREA muncul di daftar dan peta.

### 8. Tambah Spot VIEW_POINT
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "View Point Utama", latitude, longitude, type: "VIEW_POINT" }
- **Expected:**
  - Spot bertipe VIEW_POINT muncul di daftar dan peta.

### 9. Tambah Spot DANGER_ZONE
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Zona Bahaya", latitude, longitude, type: "DANGER_ZONE" }
- **Expected:**
  - Spot bertipe DANGER_ZONE muncul di daftar dan peta.

### 10. Tambah Spot MEETING_POINT
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Meeting Point Utama", latitude, longitude, type: "MEETING_POINT" }
- **Expected:**
  - Spot bertipe MEETING_POINT muncul di daftar dan peta.

### 11. Tambah Spot HOSPITAL
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "RS Pertamina", latitude, longitude, type: "HOSPITAL" }
- **Expected:**
  - Spot bertipe HOSPITAL muncul di daftar dan peta.

### 12. Tambah Spot OTHER (Custom)
- **Langkah:**
  1. POST `/important-spots/{eventId}`
  2. Body: { name: "Tenda VIP", latitude, longitude, type: "OTHER", customType: "VIP_TENT" }
- **Expected:**
  - Spot bertipe OTHER dengan customType muncul di daftar dan peta.

### 13. Edit Spot
- **Langkah:**
  1. PUT `/important-spots/update/{id}`
  2. Body: { name, latitude, longitude, type, customType }
- **Expected:**
  - Spot terupdate sesuai perubahan.

### 14. Hapus Spot
- **Langkah:**
  1. DELETE `/important-spots/{id}`
- **Expected:**
  - Spot hilang dari daftar dan peta.

### 15. Ambil Semua Spot Event
- **Langkah:**
  1. GET `/important-spots/event/{eventId}`
- **Expected:**
  - Mendapatkan list semua spot penting event.

### 16. Ambil Detail Spot
- **Langkah:**
  1. GET `/important-spots/{id}`
- **Expected:**
  - Mendapatkan detail spot penting.

---

## 3. Validasi
- Tidak bisa tambah spot tanpa nama, tipe, atau koordinat.
- Tipe spot harus salah satu dari enum SpotType.
- Jika type = OTHER, customType wajib diisi.

---

## 4. Contoh Payload ImportantSpot
```js
const spot = {
  name: "RS Pertamina",
  latitude: -6.1901,
  longitude: 106.7972,
  type: "HOSPITAL"
};

const customSpot = {
  name: "Tenda VIP",
  latitude: -6.1910,
  longitude: 106.7975,
  type: "OTHER",
  customType: "VIP_TENT"
};
```

---

**Test case ini memastikan fitur Important Spots berjalan sesuai kebutuhan event dan backend!**
