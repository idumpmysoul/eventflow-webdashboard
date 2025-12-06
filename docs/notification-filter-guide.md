# Panduan Filter Notifikasi

Dokumentasi lengkap sistem filter notifikasi untuk ORGANIZER dan PARTICIPANT di EventFlow Dashboard.

## 📋 Overview

Sistem notifikasi memiliki 5 jenis filter yang dapat dikombinasikan:
1. **Pengirim/Penerima** (Semua/Saya Kirim/Saya Terima)
2. **Tipe Notifikasi** (Semua/Feedback Laporan/Update Event/Keamanan/Umum)
3. **Metode Pengiriman** (Semua/Individual/Broadcast)
4. **Partisipan** (Filter berdasarkan nama partisipan)
5. **Kategori Laporan** (Medis/Keamanan/Fasilitas/Lainnya)

## 👤 Role-Based Behavior

### ORGANIZER
Organizer adalah penyelenggara event yang memiliki kemampuan:
- ✅ Mengirim broadcast ke semua partisipan
- ✅ Memberikan feedback pada laporan partisipan
- ✅ Menerima notifikasi individual dari partisipan
- ❌ Tidak menerima broadcast yang dibuat sendiri

### PARTICIPANT
Participant adalah peserta event yang memiliki kemampuan:
- ✅ Membuat laporan insiden
- ✅ Menerima broadcast dari organizer
- ✅ Menerima feedback individual dari organizer
- ❌ Tidak bisa mengirim notifikasi (sistem otomatis saat laporan)

---

## 🔍 Filter: Pengirim/Penerima

### 1. **Semua** (Default)
Menampilkan semua notifikasi tanpa filter pengirim/penerima.

**ORGANIZER:**
- Semua notifikasi yang terkait dengan event
- Broadcast yang dibuat sendiri
- Feedback yang dikirim ke partisipan
- Notifikasi individual dari partisipan

**PARTICIPANT:**
- Semua notifikasi yang terkait dengan diri sendiri
- Broadcast dari organizer
- Feedback dari organizer
- Report feedback otomatis yang dibuat sistem

---

### 2. **Saya Kirim** (SENT)

**ORGANIZER:**
Menampilkan notifikasi yang **dibuat oleh organizer**, termasuk:
- ✅ Broadcast yang dikirim ke semua partisipan
- ✅ Feedback individual yang dikirim ke partisipan tertentu
- ✅ Notifikasi update event yang dibuat organizer

**Logic:**
```javascript
if (user.role === 'ORGANIZER') {
  return notif.createdBy.id === user.id; // Organizer adalah pembuat
}
```

**PARTICIPANT:**
- ❌ **Selalu return false** - participant tidak bisa mengirim notifikasi
- Filter ini akan kosong untuk participant karena mereka tidak memiliki kemampuan mengirim notifikasi secara manual

**Logic:**
```javascript
if (user.role === 'PARTICIPANT') {
  return false; // Participant tidak pernah mengirim notifikasi
}
```

---

### 3. **Saya Terima** (RECEIVED)

**ORGANIZER:**

#### A. Notifikasi INDIVIDUAL
- ✅ **PASS**: Notifikasi individual yang ditujukan ke organizer
  - Contoh: Report feedback dari partisipan yang menyebut organizer sebagai penerima
- ❌ **REJECT**: Notifikasi individual yang dibuat organizer sendiri

**Logic:**
```javascript
if (notif.deliveryMethod === 'INDIVIDUAL') {
  const receiverId = notif.receiverId || notif.UserNotification?.[0]?.userId;
  if (notif.createdBy.id === user.id) return false; // Reject: organizer buat sendiri
  return receiverId === user.id; // Pass: ditujukan ke organizer
}
```

#### B. Notifikasi BROADCAST
- ❌ **SELALU REJECT** - Organizer tidak bisa menerima broadcast
- Alasan: Organizer adalah pembuat broadcast, tidak mungkin menjadi penerima
- Backend sudah exclude organizer dari daftar penerima broadcast

**Logic:**
```javascript
if (notif.deliveryMethod === 'BROADCAST') {
  if (user.role.toUpperCase() === 'ORGANIZER') {
    return false; // REJECT: Organizer tidak terima broadcast
  }
}
```

---

**PARTICIPANT:**

#### A. Notifikasi INDIVIDUAL
- ✅ **PASS**: Notifikasi individual dari organizer (feedback)
- ❌ **REJECT**: Notifikasi individual yang participant sebagai creator (REPORT_FEEDBACK)

**Logic:**
```javascript
if (notif.deliveryMethod === 'INDIVIDUAL') {
  const receiverId = notif.receiverId || notif.UserNotification?.[0]?.userId;
  
  // REJECT: Participant sebagai creator (REPORT_FEEDBACK otomatis)
  if (notif.type === 'REPORT_FEEDBACK' && notif.createdBy.id === user.id) {
    return false;
  }
  
  // PASS: Notifikasi ditujukan ke participant
  return receiverId === user.id;
}
```

#### B. Notifikasi BROADCAST
- ✅ **SELALU PASS** - Participant selalu menerima broadcast
- Broadcast adalah komunikasi dari organizer ke semua partisipan
- Backend otomatis mengirim broadcast ke semua participant (kecuali organizer)

**Logic:**
```javascript
if (notif.deliveryMethod === 'BROADCAST') {
  // Participant selalu terima broadcast, lanjutkan ke filter lain
}
```

---

## 📊 Diagram Alur Filter

### ORGANIZER - "Saya Terima"

```
RECEIVED Filter
    │
    ├─ INDIVIDUAL?
    │   ├─ createdBy === user.id? → REJECT ❌
    │   └─ receiverId === user.id? → PASS ✅
    │
    └─ BROADCAST?
        └─ role === ORGANIZER? → REJECT ❌ (selalu)
```

### PARTICIPANT - "Saya Terima"

```
RECEIVED Filter
    │
    ├─ INDIVIDUAL?
    │   ├─ type === REPORT_FEEDBACK && createdBy === user.id? → REJECT ❌
    │   └─ receiverId === user.id? → PASS ✅
    │
    └─ BROADCAST?
        └─ → PASS ✅ (selalu lanjut ke filter lain)
```

---

## 🎯 Use Cases

### Use Case 1: Organizer Broadcast Event Update
**Scenario:** Organizer kirim broadcast "Acara dimajukan 30 menit"

**Hasil Filter:**
- ORGANIZER:
  - "Semua" ✅ (tampil)
  - "Saya Kirim" ✅ (tampil - organizer adalah creator)
  - "Saya Terima" ❌ (tidak tampil - organizer tidak terima broadcast sendiri)

- PARTICIPANT:
  - "Semua" ✅ (tampil)
  - "Saya Kirim" ❌ (tidak tampil - participant tidak kirim)
  - "Saya Terima" ✅ (tampil - participant menerima broadcast)

---

### Use Case 2: Participant Buat Laporan Medis
**Scenario:** Participant "Budi" lapor insiden medis → sistem buat REPORT_FEEDBACK

**Hasil Filter:**
- ORGANIZER:
  - "Semua" ✅ (tampil)
  - "Saya Kirim" ❌ (tidak tampil - Budi yang buat)
  - "Saya Terima" ✅ (tampil - individual ditujukan ke organizer)

- PARTICIPANT (Budi):
  - "Semua" ✅ (tampil)
  - "Saya Kirim" ❌ (tidak tampil - participant tidak bisa kirim)
  - "Saya Terima" ❌ (tidak tampil - Budi sebagai creator)

---

### Use Case 3: Organizer Beri Feedback ke Participant
**Scenario:** Organizer kirim feedback individual ke "Budi"

**Hasil Filter:**
- ORGANIZER:
  - "Semua" ✅ (tampil)
  - "Saya Kirim" ✅ (tampil - organizer adalah creator)
  - "Saya Terima" ❌ (tidak tampil - organizer buat sendiri)

- PARTICIPANT (Budi):
  - "Semua" ✅ (tampil)
  - "Saya Kirim" ❌ (tidak tampil - participant tidak kirim)
  - "Saya Terima" ✅ (tampil - individual ditujukan ke Budi)

---

## 🔧 Technical Implementation

### Filter Execution Order (PENTING!)
Filter **Pengirim/Penerima** (SENT/RECEIVED) **dijalankan PERTAMA** sebelum filter lainnya.

**Alasan:**
- Filter ini adalah filter paling fundamental yang menentukan apakah notifikasi relevan dengan user
- Jika notifikasi tidak pass filter ini, tidak perlu cek filter lain (optimasi performa)
- Mencegah edge case dimana notifikasi lolos filter tipe/delivery tapi tidak relevan untuk user

```javascript
const filteredNotifications = notifications.filter((notif) => {
  // 1. FILTER PENGIRIM/PENERIMA (PRIORITAS TERTINGGI)
  if (senderReceiverFilter === 'SENT') {
    // ... logic
    return false; // Stop jika tidak pass
  } else if (senderReceiverFilter === 'RECEIVED') {
    // ... logic
    return false; // Stop jika tidak pass
  }

  // 2. FILTER TIPE NOTIFIKASI
  if (typeFilter !== 'all' && notif.type !== typeFilter) {
    return false;
  }

  // 3. FILTER METODE PENGIRIMAN
  if (deliveryMethodFilter !== 'all' && notif.deliveryMethod !== deliveryMethodFilter) {
    return false;
  }

  // 4. FILTER PARTISIPAN & KATEGORI
  // ...

  return true; // Pass semua filter
});
```

---

## 🐛 Case Sensitivity Issue (FIXED)

### Problem
Role dari AuthContext berupa `'ORGANIZER'` (uppercase), tapi code check `'organizer'` (lowercase).

**Symptom:**
```javascript
// ❌ BEFORE (BROKEN)
if (user?.role === 'organizer') {
  return false; // Tidak pernah dijalankan karena 'ORGANIZER' !== 'organizer'
}
```

Console log menunjukkan:
```
[Filter RECEIVED] Processing BROADCAST - role: ORGANIZER
[Filter RECEIVED] PASS - Participant can receive broadcast ← SALAH!
```

### Solution
```javascript
// ✅ AFTER (FIXED)
if (user?.role?.toUpperCase() === 'ORGANIZER') {
  return false; // Sekarang berfungsi dengan benar
}
```

Console log setelah fix:
```
[Filter RECEIVED] Processing BROADCAST - role: ORGANIZER
[Filter RECEIVED] REJECT - Organizer cannot receive broadcast ← BENAR!
```

---

## 📝 Backend Dependencies

### Required Fields from API
Notifikasi dari backend **HARUS** include field berikut:

```javascript
{
  id: string,
  type: 'REPORT_FEEDBACK' | 'EVENT_UPDATE' | 'SECURITY_ALERT' | 'GENERAL',
  deliveryMethod: 'INDIVIDUAL' | 'BROADCAST',
  receiverId: string | null, // Untuk INDIVIDUAL
  createdBy: {
    id: string,
    fullName: string,
    role: 'ORGANIZER' | 'PARTICIPANT'
  },
  UserNotification: [
    {
      userId: string // Fallback jika receiverId null
    }
  ]
}
```

### Backend Logic
```typescript
// eventParticipantRepository.ts
// Organizer TIDAK termasuk dalam daftar participant
const participants = await prisma.eventParticipant.findMany({
  where: {
    eventId,
    userId: { not: event.organizerId } // ← Exclude organizer
  }
});

// Saat broadcast, hanya participant yang dapat notifikasi
// Organizer otomatis excluded
```

---

## ✅ Testing Checklist

### ORGANIZER Tests
- [ ] "Saya Kirim" menampilkan broadcast yang dibuat organizer
- [ ] "Saya Kirim" menampilkan feedback individual yang dikirim organizer
- [ ] "Saya Terima" **TIDAK** menampilkan broadcast organizer sendiri
- [ ] "Saya Terima" menampilkan individual notification dari participant
- [ ] "Saya Terima" **TIDAK** menampilkan individual notification yang organizer buat sendiri

### PARTICIPANT Tests
- [ ] "Saya Kirim" selalu kosong (participant tidak bisa kirim)
- [ ] "Saya Terima" menampilkan broadcast dari organizer
- [ ] "Saya Terima" menampilkan feedback individual dari organizer
- [ ] "Saya Terima" **TIDAK** menampilkan REPORT_FEEDBACK yang participant buat sendiri (saat lapor)

### Combined Filters
- [ ] "Saya Terima" + "Broadcast" (ORGANIZER) = kosong
- [ ] "Saya Terima" + "Broadcast" (PARTICIPANT) = broadcast dari organizer
- [ ] "Saya Terima" + "Individual" = notifikasi yang ditujukan ke user
- [ ] "Saya Kirim" + "Broadcast" (ORGANIZER) = broadcast yang dibuat organizer

---

## 🎓 Key Learnings

### 1. Filter Execution Order Matters
Filter yang paling fundamental harus dijalankan pertama untuk optimasi dan mencegah bug.

### 2. Case Sensitivity Critical
Selalu gunakan case-insensitive comparison untuk enum values dari backend:
```javascript
user?.role?.toUpperCase() === 'ORGANIZER'
// ATAU
user?.role?.toLowerCase() === 'organizer'
```

### 3. Role-Based Logic Complexity
Organizer dan participant memiliki behavior yang sangat berbeda:
- Organizer: **creator** of broadcasts/feedback
- Participant: **receiver** of broadcasts/feedback

### 4. Backend-Frontend Contract
Frontend filter **bergantung sepenuhnya** pada field `createdBy` dari backend. Pastikan backend selalu include field ini dalam response.

### 5. Debugging Console Logs
Console logs sangat penting untuk debug filter logic yang kompleks:
```javascript
console.log('[Filter RECEIVED] Checking:', {
  id: notif.id,
  deliveryMethod: notif.deliveryMethod,
  createdBy: notif.createdBy.id,
  userId: user.id,
  role: user.role
});
```

---

## 📞 Troubleshooting

### Issue: Broadcast muncul di "Saya Terima" organizer
**Solusi:** Check case sensitivity role comparison
```javascript
// ❌ WRONG
if (user?.role === 'organizer')

// ✅ CORRECT
if (user?.role?.toUpperCase() === 'ORGANIZER')
```

### Issue: Filter "Saya Kirim" kosong untuk organizer
**Solusi:** Pastikan backend mengirim field `createdBy` di setiap notifikasi

### Issue: Participant melihat notifikasi sendiri di "Saya Terima"
**Solusi:** Check tipe notifikasi REPORT_FEEDBACK dan reject jika `createdBy.id === user.id`

---

**Last Updated:** December 7, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
