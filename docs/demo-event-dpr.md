# Demo Use Case: Event di Gedung DPR RI

## Tujuan
Menunjukkan cara membuat event dengan lokasi spesifik di Gedung DPR/MPR menggunakan fitur map dan search pada aplikasi event dashboard.

---

## 1. Alur Demo
1. User login ke dashboard.
2. Klik "Create New Event".
3. Isi detail event (nama, deskripsi, tanggal, waktu).
4. Pada step lokasi, user bisa:
   - Ketik "Gedung DPR RI, Jakarta" di kolom search.
   - Pilih hasil yang paling relevan (jika muncul).
   - Jika search tidak menemukan, user klik langsung di peta pada area Gedung DPR/MPR.
5. Koordinat dan nama lokasi otomatis terisi.
6. Lanjutkan ke konfirmasi dan submit event.
7. Event berhasil dibuat dengan lokasi Gedung DPR/MPR.

---

## 2. Cara Menentukan Area Map Gedung DPR/MPR

### A. Search Lokasi
- Ketik: `Gedung DPR RI, Jakarta` atau `Kompleks Parlemen Senayan`.
- Jika hasil search tidak akurat, gunakan klik di peta.

### B. Klik Langsung di Peta
- Zoom in ke area Senayan, Jakarta.
- Cari label "DPR/MPR Building" atau "Gedung Nusantara" di peta.
- Klik di area gedung tersebut.
- Koordinat akan otomatis terisi, misal:
  - Latitude: -6.1901
  - Longitude: 106.7972

### C. Validasi
- Pastikan lokasi yang dipilih sesuai dengan area Gedung DPR/MPR.
- Nama lokasi bisa diubah manual jika perlu.

---

## 3. Contoh Payload Event
```js
const payload = {
  name: "Demo Event Gedung DPR",
  description: "Demo pembuatan event di area Gedung DPR/MPR Senayan.",
  startTime: "2025-12-10T09:00:00",
  endTime: "2025-12-10T12:00:00",
  locationName: "Gedung DPR RI, Jakarta",
  latitude: -6.1901,
  longitude: 106.7972,
};
```

---

## 4. Test Case Demo

### 1. Search Lokasi
- **Langkah:** Ketik "Gedung DPR RI, Jakarta" di kolom search, pilih hasil.
- **Expected:** Marker pindah ke area DPR/MPR, koordinat terisi.

### 2. Klik di Peta
- **Langkah:** Zoom in ke Senayan, klik di area Gedung DPR/MPR.
- **Expected:** Koordinat terisi, nama lokasi bisa diubah manual.

### 3. Submit Event
- **Langkah:** Lanjutkan ke step konfirmasi, submit event.
- **Expected:** Event berhasil dibuat dengan lokasi Gedung DPR/MPR.

---

## 5. Tips Demo
- Jika search tidak menemukan lokasi, gunakan klik di peta.
- Pastikan koordinat dan nama lokasi sesuai area Gedung DPR/MPR.
- Tunjukkan pada peserta demo bahwa sistem fleksibel: bisa search atau klik peta.

---

## 6. Dokumentasi API Mapbox Search
- Endpoint: `https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json?access_token={token}&limit=5&country=ID`
- Untuk area spesifik, gunakan klik di peta.

---

**Demo ini membuktikan aplikasi mendukung event dengan lokasi landmark/gedung secara fleksibel dan akurat!**
