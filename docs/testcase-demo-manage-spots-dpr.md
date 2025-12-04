# Test Case Demo: Manage Spots di Gedung DPR RI

## Tujuan
Menguji fitur Manage Spots (titik penting) pada event demo di Gedung DPR/MPR, sesuai tipe SpotType backend dan alur nyata.

---

## 1. Use Case
- Event demo di Gedung DPR/MPR membutuhkan beberapa spot penting:
  - ENTRY_GATE: "Gate Utama DPR"
  - EXIT_GATE: "Gate Selatan DPR"
  - CHECKPOINT: "Checkpoint 1"
  - SHELTER: "Shelter Barat"
  - INFO_CENTER: "Info Center DPR"
  - STAGE: "Main Stage DPR"
  - REST_AREA: "Rest Area DPR"
  - VIEW_POINT: "View Point DPR"
  - DANGER_ZONE: "Zona Bahaya DPR"
  - MEETING_POINT: "Meeting Point DPR"
  - HOSPITAL: "RS Pertamina"
  - OTHER: "Tenda VIP" (customType: "VIP_TENT")

---

## 2. Test Case

### 1. Tambah Spot ENTRY_GATE
- **Langkah:**
  1. Klik "Manage Spots".
  2. Klik "Add Spot".
  3. Isi nama: "Gate Utama DPR"
  4. Pastikan warna teks pada popup spot ENTRY_GATE di peta mudah dibaca (misal: putih atau hijau terang di background gelap).
  5. Jika tipe spot adalah OTHER, pastikan popup menampilkan customType (contoh: "OTHER (VIP_TENT)").
  4. Pilih tipe: ENTRY_GATE
  5. Klik di peta area gate utama DPR.
  6. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 2. Tambah Spot EXIT_GATE
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Gate Selatan DPR"
  3. Pilih tipe: EXIT_GATE
  4. Klik di peta area gate selatan DPR.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 3. Tambah Spot HOSPITAL
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "RS Pertamina"
  3. Pilih tipe: HOSPITAL
  4. Klik di peta lokasi RS Pertamina.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 4. Tambah Spot SHELTER
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Shelter Barat"
  3. Pilih tipe: SHELTER
  4. Klik di peta lokasi shelter.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 5. Tambah Spot INFO_CENTER
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Info Center DPR"
  3. Pilih tipe: INFO_CENTER
  4. Klik di peta lokasi info center.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 6. Tambah Spot STAGE
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Main Stage DPR"
  3. Pilih tipe: STAGE
  4. Klik di peta lokasi stage.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 7. Tambah Spot REST_AREA
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Rest Area DPR"
  3. Pilih tipe: REST_AREA
  4. Klik di peta lokasi rest area.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 8. Tambah Spot VIEW_POINT
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "View Point DPR"
  3. Pilih tipe: VIEW_POINT
  4. Klik di peta lokasi view point.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 9. Tambah Spot DANGER_ZONE
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Zona Bahaya DPR"
  3. Pilih tipe: DANGER_ZONE
  4. Klik di peta lokasi zona bahaya.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 10. Tambah Spot MEETING_POINT
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Meeting Point DPR"
  3. Pilih tipe: MEETING_POINT
  4. Klik di peta lokasi meeting point.
  5. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 11. Tambah Spot OTHER (Custom)
- **Langkah:**
  1. Klik "Add Spot".
  2. Isi nama: "Tenda VIP"
  3. Pilih tipe: OTHER
  4. Isi customType: "VIP_TENT"
  5. Klik di peta lokasi tenda VIP.
  6. Submit.
- **Expected:**
  - Spot muncul di daftar dan peta.

### 12. Edit Spot
- **Langkah:**
  1. Pilih spot di daftar.
  2. Klik "Edit".
  3. Ubah nama/tipe/koordinat.
  4. Submit.
- **Expected:**
  - Spot terupdate sesuai perubahan.

### 13. Hapus Spot
- **Langkah:**
  1. Pilih spot di daftar.
  2. Klik "Delete".
  3. Konfirmasi hapus.
- **Expected:**
  - Spot hilang dari daftar dan peta.

---

## 3. Validasi
- Tidak bisa tambah spot tanpa nama, tipe, atau koordinat.
- Tipe spot harus salah satu dari SpotType.
- Jika type = OTHER, customType wajib diisi.

---

**Test case ini memastikan fitur Manage Spots berjalan sesuai kebutuhan demo event Gedung DPR/MPR!**
