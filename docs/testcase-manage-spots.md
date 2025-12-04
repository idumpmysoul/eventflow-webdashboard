# Test Case: Manage Spots (Titik Penting Event)

## Tujuan
Menguji fitur penambahan, pengelolaan, dan validasi titik-titik penting (Spots) pada event, sesuai tipe spot yang didukung backend.

---

## 1. Tipe Spot (Sesuai Backend)
- HOSPITAL
- ENTRY_GATE
- EXIT_GATE
- SHELTER
- INFO_CENTER
- OTHER

---

## 2. Test Case Manage Spots

### 1. Tambah Spot Rumah Sakit
- **Langkah:**
  1. Buka halaman event, pilih menu "Manage Spots".
  2. Klik "Add Spot".
  3. Pilih tipe: HOSPITAL
  4. Isi nama: "RS Pertamina"
  5. Klik di peta lokasi RS.
  6. Submit.
- **Expected:**
  - Spot "RS Pertamina" bertipe HOSPITAL muncul di daftar dan peta.
  - Koordinat sesuai lokasi klik.

### 2. Tambah Spot Entry Gate
- **Langkah:**
  1. Klik "Add Spot".
  2. Pilih tipe: ENTRY_GATE
  3. Isi nama: "Gate Utama"
  4. Klik di peta lokasi gate.
  5. Submit.
- **Expected:**
  - Spot "Gate Utama" bertipe ENTRY_GATE muncul di daftar dan peta.

### 3. Tambah Spot Exit Gate
- **Langkah:**
  1. Klik "Add Spot".
  2. Pilih tipe: EXIT_GATE
  3. Isi nama: "Gate Selatan"
  4. Klik di peta lokasi gate.
  5. Submit.
- **Expected:**
  - Spot "Gate Selatan" bertipe EXIT_GATE muncul di daftar dan peta.

### 4. Tambah Spot Shelter
- **Langkah:**
  1. Klik "Add Spot".
  2. Pilih tipe: SHELTER
  3. Isi nama: "Shelter Barat"
  4. Klik di peta lokasi shelter.
  5. Submit.
- **Expected:**
  - Spot "Shelter Barat" bertipe SHELTER muncul di daftar dan peta.

### 5. Tambah Spot Info Center
- **Langkah:**
  1. Klik "Add Spot".
  2. Pilih tipe: INFO_CENTER
  3. Isi nama: "Info Center Utama"
  4. Klik di peta lokasi info center.
  5. Submit.
- **Expected:**
  - Spot "Info Center Utama" bertipe INFO_CENTER muncul di daftar dan peta.

### 6. Tambah Spot Other
- **Langkah:**
  1. Klik "Add Spot".
  2. Pilih tipe: OTHER
  3. Isi nama: "Tenda VIP"
  4. Klik di peta lokasi tenda.
  5. Submit.
- **Expected:**
  - Spot "Tenda VIP" bertipe OTHER muncul di daftar dan peta.

### 7. Edit Spot
- **Langkah:**
  1. Pilih spot di daftar.
  2. Klik "Edit".
  3. Ubah nama/tipe/koordinat.
  4. Submit.
- **Expected:**
  - Spot terupdate sesuai perubahan.

### 8. Hapus Spot
- **Langkah:**
  1. Pilih spot di daftar.
  2. Klik "Delete".
  3. Konfirmasi hapus.
- **Expected:**
  - Spot hilang dari daftar dan peta.

---

## 3. Validasi
- Tidak bisa tambah spot tanpa nama atau tipe.
- Koordinat spot harus valid (hasil klik di peta).
- Tipe spot harus salah satu dari:
  - HOSPITAL, ENTRY_GATE, EXIT_GATE, SHELTER, INFO_CENTER, OTHER

---

## 4. Payload Spot (Contoh)
```js
const spot = {
  name: "RS Pertamina",
  type: "HOSPITAL",
  latitude: -6.1901,
  longitude: 106.7972
};
```

---

**Test case ini memastikan fitur Manage Spots berjalan sesuai kebutuhan event dan backend!**
