# Validasi Tipe ImportantSpot (Manage Types)

## Tujuan
Memastikan tipe spot yang diinput/diubah di frontend/backend hanya sesuai enum SpotType dari backend.

---

## 1. Daftar Tipe Valid (enum SpotType)
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
- OTHER (customType wajib diisi)

---

## 2. Validasi di Frontend
- Saat user memilih tipe spot, hanya tampilkan pilihan di atas.
- Jika user pilih OTHER, wajib isi customType (nama tipe custom).
- Tidak bisa submit spot tanpa tipe valid.

### Contoh Validasi
```js
const validTypes = [
  "ENTRY_GATE", "EXIT_GATE", "CHECKPOINT", "SHELTER", "INFO_CENTER", "STAGE", "REST_AREA", "VIEW_POINT", "DANGER_ZONE", "MEETING_POINT", "HOSPITAL", "OTHER"
];

function validateSpotType(type, customType) {
  if (!validTypes.includes(type)) return false;
  if (type === "OTHER" && (!customType || customType.trim() === "")) return false;
  return true;
}
```

---

## 3. Validasi di Backend
- Endpoint POST/PUT harus reject tipe di luar enum SpotType.
- Jika type = OTHER, customType wajib diisi.
- Jika tipe tidak valid, return error 400: "Invalid spot type".

---

## 4. Test Case Validasi
- **Submit spot dengan tipe valid:** Berhasil.
- **Submit spot dengan tipe di luar enum:** Gagal, error.
- **Submit spot dengan type OTHER tanpa customType:** Gagal, error.
- **Edit spot, ubah tipe ke valid:** Berhasil.
- **Edit spot, ubah tipe ke invalid:** Gagal, error.

---

**Validasi ini memastikan data ImportantSpot selalu konsisten dan sesuai backend!**
