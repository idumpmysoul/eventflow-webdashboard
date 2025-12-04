# Dokumentasi Input Lokasi Event (Manual & Map)

## Tujuan
Memudahkan user memilih lokasi event, baik dengan klik di peta maupun mengetik nama/lokasi secara manual.

## Alur & Implementasi di Frontend


### 1. Penambahan Input Text Lokasi & Fitur Search
Pada step 2 modal pembuatan event (`EventsSelectionPage.jsx`), sekarang tersedia input text dan tombol search:

```jsx
<label className="block text-sm font-medium text-slate-400 mb-1">Nama/Lokasi Tempat (bisa search)</label>
<div className="flex gap-2">
   <input
      name="locationName"
      value={formData.locationName}
      onChange={handleInputChange}
      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
      placeholder="Gedung DPR RI, Jakarta"
   />
   <button
      type="button"
      onClick={handleSearchLocation}
      disabled={searchingLocation || !formData.locationName}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
   >
      {searchingLocation ? 'Mencari...' : 'Cari'}
   </button>
</div>
{searchError && (
   <div className="mt-2 text-red-400 text-sm">{searchError}</div>
)}
```

Ketika user mengetik nama lokasi dan klik "Cari", aplikasi akan melakukan request ke Mapbox Geocoding API dan otomatis memindahkan marker di peta ke lokasi hasil pencarian.

#### Contoh fungsi pencarian lokasi:
```js
const handleSearchLocation = async () => {
   setSearchError('');
   if (!formData.locationName) {
      setSearchError('Silakan ketik nama lokasi.');
      return;
   }
   setSearchingLocation(true);
   try {
      const accessToken = VITE_MAPBOX_TOKEN;
      const query = encodeURIComponent(formData.locationName);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${accessToken}&limit=1&country=ID`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.features && data.features.length > 0) {
         const [lng, lat] = data.features[0].center;
         setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
      } else {
         setSearchError('Lokasi tidak ditemukan.');
      }
   } catch (err) {
      setSearchError('Gagal mencari lokasi.');
   }
   setSearchingLocation(false);
};
```


### 2. Integrasi dengan Map & Search
- User bisa klik di peta untuk memilih koordinat (latitude, longitude).
- User juga bisa mengetik nama lokasi dan klik "Cari" agar marker di peta langsung pindah ke lokasi tersebut.
- Keduanya bisa digunakan bersamaan, dan akan dikirim ke backend saat submit event.


### 3. Logic Submit Event
Pada submit event, data yang dikirim ke backend:

```js
const payload = {
   name: formData.name,
   description: formData.description,
   startTime: startDateTime.toISOString(),
   endTime: endDateTime.toISOString(),
   locationName: formData.locationName, // dari input manual/search
   latitude: formData.latitude,         // dari map atau hasil search
   longitude: formData.longitude,       // dari map atau hasil search
};
```


### 4. Validasi
- User bisa lanjut ke step berikutnya jika sudah memilih lokasi di map **atau** mengisi lokasi dan klik "Cari" agar koordinat otomatis terisi.
- Disarankan tetap memilih di map atau search agar koordinat valid.


### 5. UX

### 6. Contoh UI
```
[Mapbox Map]
[atau]
```




Jika ingin pencarian lokasi lebih spesifik (landmark, gedung, dll), gunakan Google Places API.

#### Langkah Integrasi:
1. **Dapatkan API Key Google Places:**
    - Buat project baru (jika belum ada).
    - Aktifkan API "Places API" dan "Maps JavaScript API".
    - Buat API Key dan whitelist domain aplikasi frontend.

2. **Tambahkan API Key ke .env:**
    VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
    ```

3. **Implementasi di Frontend:**
    - Tambahkan input search lokasi event.
       ```js
       const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${API_KEY}&language=id&components=country:ID`;
       ```
    - Tampilkan hasil suggestion, user pilih salah satu.
       ```js
       const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
       ```
    - Ambil koordinat (lat, lng) dari detail response, update marker di peta.

    - Tampilkan hasil autocomplete (nama, alamat).
    - User klik hasil, marker di peta langsung pindah.

#### Contoh Kode Fetch Autocomplete:
```js
const fetchGooglePlaces = async (query) => {
   const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${API_KEY}&language=id&components=country:ID`;
   const data = await res.json();
   return data.predictions;
```

#### Contoh Kode Fetch Detail:
```js
const fetchPlaceDetail = async (placeId) => {
   const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
   const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}`;
   const res = await fetch(url);
   const data = await res.json();
   return data.result.geometry.location; // { lat, lng }
};
```

#### Catatan:
- Google Places API lebih akurat untuk landmark/gedung.
- Pastikan API Key valid dan domain sudah di-whitelist.
- Bisa digabung dengan Mapbox, tampilkan hasil dari dua sumber.

---

## Test Case Fitur Input Lokasi Event

### 1. Test Case: Input Manual
- **Langkah:**
  1. Buka modal pembuatan event.
  2. Isi semua field event, pada field lokasi ketik "Gedung DPR RI, Jakarta".
  3. Jangan klik peta, langsung lanjut ke step berikutnya.
  4. Submit event.
- **Expected:**
  - Event berhasil dibuat.
  - Field `locationName` di backend berisi "Gedung DPR RI, Jakarta".
  - Koordinat (latitude, longitude) kosong/null jika tidak dipilih di map atau search.

### 2. Test Case: Search Lokasi
- **Langkah:**
  1. Buka modal pembuatan event.
  2. Pada field lokasi, ketik "Gedung DPR RI, Jakarta".
  3. Klik tombol "Cari".
  4. Pastikan marker di peta langsung pindah ke lokasi Gedung DPR RI.
  5. Submit event.
- **Expected:**
  - Event berhasil dibuat.
  - Field `locationName` di backend berisi "Gedung DPR RI, Jakarta".
  - Field `latitude` dan `longitude` berisi koordinat Gedung DPR RI.

### 3. Test Case: Klik di Peta
- **Langkah:**
  1. Buka modal pembuatan event.
  2. Klik di peta untuk memilih lokasi.
  3. Field latitude dan longitude otomatis terisi.
  4. Submit event.
- **Expected:**
  - Event berhasil dibuat.
  - Field `latitude` dan `longitude` berisi koordinat hasil klik.
  - Field `locationName` bisa kosong atau diisi manual.

### 4. Test Case: Error Search
- **Langkah:**
  1. Pada field lokasi, ketik nama lokasi yang tidak valid (misal: "asdfghjkl").
  2. Klik tombol "Cari".
- **Expected:**
  - Muncul pesan error "Lokasi tidak ditemukan." di bawah input.
  - Marker di peta tidak berubah.

### 5. Test Case: Validasi
- **Langkah:**
  1. Coba submit event tanpa memilih lokasi di map dan tanpa search.
- **Expected:**
  - Tidak bisa lanjut/submit, muncul pesan validasi agar user memilih lokasi.

---

**Perubahan ini membuat user lebih fleksibel dan mudah memilih lokasi event!**
