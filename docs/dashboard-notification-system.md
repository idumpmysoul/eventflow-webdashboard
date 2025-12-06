# Dashboard Notification System

Dokumentasi lengkap sistem notifikasi real-time di Dashboard dengan fitur toast auto-hide dan unread/read tracking untuk ORGANIZER.

---

## 📋 Overview

Sistem notifikasi Dashboard memiliki 2 komponen utama:

1. **Toast Notifications** (Auto-hide after 5 seconds)
   - Muncul di kanan atas saat notifikasi baru datang via socket
   - Animasi slide-in dari kanan dengan gradient indigo-purple
   - Otomatis hilang setelah 5 detik
   - Menampilkan maksimal 3 notifikasi terbaru

2. **Unread Notifications** (Persistent)
   - Menampilkan semua notifikasi yang belum dibaca
   - Badge merah menunjukkan jumlah unread
   - Red dot indicator pada setiap notifikasi unread
   - Click notifikasi untuk mark as read
   - Tombol "Tandai Semua Dibaca" untuk bulk action

---

## 🎯 User Flow

### Skenario 1: Organizer Kirim Broadcast
1. **Organizer A** kirim broadcast "Event dimulai pukul 14:00"
2. **Backend** emit via socket ke semua participant (exclude organizer)
3. **Participant Dashboard:**
   - ✅ Toast muncul 5 detik dengan gradient indigo-purple
   - ✅ Notifikasi masuk ke "Belum Dibaca" section
   - ✅ Badge count +1
   - ✅ Browser notification "📬 Event dimulai pukul 14:00"

### Skenario 2: Participant Buka Dashboard Setelah Offline
1. **Participant B** offline saat ada 5 broadcast baru
2. **Participant B** buka dashboard
3. **System:**
   - ✅ Fetch unread notifications dari backend
   - ✅ Tampilkan 5 notifikasi di "Belum Dibaca" section
   - ✅ Badge merah "5" di header
   - ❌ Tidak muncul toast (karena bukan real-time)

### Skenario 3: Mark Notification as Read
1. **Participant** click notifikasi di "Belum Dibaca" section
2. **System:**
   - ✅ Call API `POST /user-notifications/:notificationId/read`
   - ✅ Remove notifikasi dari list unread
   - ✅ Badge count -1
   - ✅ Toast konfirmasi "✓ Ditandai sudah dibaca"

### Skenario 4: Mark All as Read
1. **Participant** click "Tandai Semua Dibaca"
2. **System:**
   - ✅ Call API `POST /user-notifications/read-all`
   - ✅ Clear semua notifikasi dari list unread
   - ✅ Badge count = 0
   - ✅ Toast konfirmasi "✅ Semua notifikasi ditandai sudah dibaca"

---

## 🔧 Technical Implementation

### Frontend: DashboardPage.jsx

#### State Management
```javascript
const [notifications, setNotifications] = useState([]); 
// Toast notifications (auto-hide after 5s)

const [unreadNotifications, setUnreadNotifications] = useState([]); 
// Persistent unread notifications
```

#### Initial Data Fetch
```javascript
useEffect(() => {
  const fetchUnreadNotifications = async () => {
    try {
      // 1. Get unread notification IDs
      const response = await api.getUnreadNotifications();
      const unreadData = response?.unreadNotifications || [];
      
      // 2. Get full notification details
      const notificationIds = [...new Set(unreadData.map(un => un.notificationId))];
      const allEventNotifications = await api.getEventNotifications(selectedEventId);
      
      // 3. Filter to only unread
      const unreadNotifs = allEventNotifications.filter(notif => 
        notificationIds.includes(notif.id)
      );
      
      setUnreadNotifications(unreadNotifs);
    } catch (err) {
      console.error('Failed to fetch unread notifications:', err);
      setUnreadNotifications([]);
    }
  };
  
  if (selectedEventId) {
    fetchUnreadNotifications();
  }
}, [selectedEventId]);
```

#### Socket Real-time Handler
```javascript
socket.on('notification', (notif) => {
  // 1. Show as toast (auto-hide after 5 seconds)
  setNotifications((prev) => [notif, ...prev]);
  setTimeout(() => {
    setNotifications((prev) => prev.filter(n => n.id !== notif.id));
  }, 5000);
  
  // 2. Add to unread notifications (persistent)
  setUnreadNotifications((prev) => {
    if (prev.some(n => n.id === notif.id)) return prev;
    return [notif, ...prev];
  });
  
  // 3. Show browser notification toast
  notify(`📬 ${notif.title}`, 'info');
});
```

#### Mark as Read Handler
```javascript
const handleMarkAsRead = async (notificationId) => {
  try {
    await api.markNotificationAsRead(notificationId);
    setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
    notify('✓ Ditandai sudah dibaca', 'success');
  } catch (err) {
    console.error('Failed to mark as read:', err);
  }
};
```

#### Mark All as Read Handler
```javascript
const handleMarkAllAsRead = async () => {
  try {
    await api.markAllNotificationsAsRead();
    setUnreadNotifications([]);
    notify('✅ Semua notifikasi ditandai sudah dibaca', 'success');
  } catch (err) {
    notify('❌ Gagal menandai sebagai dibaca', 'error');
  }
};
```

---

### Backend: API Endpoints

#### GET /user-notifications/me/unread-list
**Response:**
```json
{
  "success": true,
  "data": {
    "unreadNotifications": [
      {
        "notificationId": "notif-123",
        "userId": "user-456",
        "isRead": false,
        "createdAt": "2025-12-07T10:30:00.000Z"
      }
    ]
  }
}
```

#### POST /user-notifications/:notificationId/read
**Request:** `POST /user-notifications/notif-123/read`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "notif-123",
    "title": "Event dimulai pukul 14:00",
    "message": "Mohon datang tepat waktu",
    "type": "EVENT_UPDATE",
    "deliveryMethod": "BROADCAST",
    "createdAt": "2025-12-07T10:30:00.000Z"
  }
}
```

#### POST /user-notifications/read-all
**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  }
}
```

---

## 🎨 UI Components

### Toast Notification (Auto-hide)
```jsx
{notifications.length > 0 && (
  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 border border-indigo-400 rounded-xl p-4 shadow-lg animate-slideInRight">
    <div className="flex items-center gap-2 mb-3">
      <BellIcon className="w-5 h-5 text-white animate-bounce" />
      <h3 className="font-bold text-white">Notifikasi Baru</h3>
      <span className="ml-auto bg-white/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {notifications.length}
      </span>
    </div>
    {/* Notification cards */}
  </div>
)}
```

**Features:**
- Gradient background: `from-indigo-500 to-purple-500`
- Bounce animation on bell icon: `animate-bounce`
- Slide-in animation: `animate-slideInRight` (CSS keyframe)
- Auto-hide after 5 seconds via `setTimeout`

### Unread Notifications (Persistent)
```jsx
{unreadNotifications.length > 0 && (
  <div className="bg-white dark:bg-slate-900 border border-gray-200 rounded-xl p-4">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <BellIcon className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold">Belum Dibaca</h3>
        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {unreadNotifications.length}
        </span>
      </div>
      <button onClick={handleMarkAllAsRead}>
        Tandai Semua Dibaca
      </button>
    </div>
    {/* Unread notification cards with red dot indicator */}
  </div>
)}
```

**Features:**
- Red badge count: `bg-red-100 text-red-600`
- Red dot indicator: `bg-red-500 rounded-full animate-pulse`
- Clickable cards: `cursor-pointer hover:bg-gray-100`
- Timestamp: Locale format `dd MMM, HH:mm`
- "Tandai Semua Dibaca" button for bulk action

---

## 🔄 Data Flow

### Real-time Notification Flow
```
Backend (Socket.io)
  ↓ emit 'notification'
Frontend Socket Handler
  ↓
Split into 2 paths:
  ├─ Toast State (auto-hide 5s)
  └─ Unread State (persistent)
```

### Initial Load Flow
```
Dashboard Mount
  ↓
Fetch Unread Notifications
  ↓ GET /user-notifications/me/unread-list
Backend Returns UserNotification[]
  ↓ Extract notificationId[]
Fetch Full Notification Details
  ↓ GET /notifications/:eventId
Filter to Unread Only
  ↓
Update Unread State
```

### Mark as Read Flow
```
User Click Notification
  ↓
POST /user-notifications/:id/read
  ↓
Backend Update isRead: true
  ↓
Frontend Remove from Unread State
  ↓
Toast Confirmation "✓ Ditandai sudah dibaca"
```

---

## 📊 Database Schema

### Notification Table
```prisma
model Notification {
  id              String   @id @default(cuid())
  title           String
  message         String
  type            NotificationType
  deliveryMethod  DeliveryMethod
  category        String?
  eventId         String?
  createdById     String
  createdAt       DateTime @default(now())
  
  event           Event?   @relation(fields: [eventId], references: [id])
  createdBy       User     @relation(fields: [createdById], references: [id])
  userNotifications UserNotification[]
}
```

### UserNotification Table (Junction Table)
```prisma
model UserNotification {
  notificationId  String
  userId          String
  isRead          Boolean  @default(false)
  readAt          DateTime?
  createdAt       DateTime @default(now())
  
  notification    Notification @relation(fields: [notificationId], references: [id])
  user            User         @relation(fields: [userId], references: [id])
  
  @@id([notificationId, userId])
}
```

**Key Fields:**
- `isRead`: Boolean flag untuk tracking status baca
- `readAt`: Timestamp saat user mark as read
- Composite primary key: `[notificationId, userId]` untuk junction table

---

## ✅ Testing Checklist

### Real-time Notifications
- [ ] Toast muncul saat notifikasi baru via socket
- [ ] Toast hilang otomatis setelah 5 detik
- [ ] Notifikasi masuk ke "Belum Dibaca" section
- [ ] Badge count bertambah
- [ ] Browser notification muncul

### Unread Notifications
- [ ] Fetch unread notifications saat mount
- [ ] Display unread count badge (merah)
- [ ] Red dot indicator pada setiap notifikasi
- [ ] Click notifikasi → mark as read → hilang dari list
- [ ] Badge count berkurang setelah mark as read

### Mark All as Read
- [ ] Button "Tandai Semua Dibaca" tampil saat ada unread
- [ ] Click button → call API → clear list → badge = 0
- [ ] Toast konfirmasi muncul

### Edge Cases
- [ ] Refresh page → unread notifications persist
- [ ] Offline → online → fetch unread tetap bekerja
- [ ] Duplicate notification tidak muncul 2x
- [ ] Error handling saat API failed (toast error)

---

## 🚀 Performance Optimization

### 1. Debounce Socket Events
Jika notifikasi datang terlalu cepat, gunakan debounce:
```javascript
const debouncedNotification = debounce((notif) => {
  setNotifications((prev) => [notif, ...prev]);
}, 300);
```

### 2. Limit Unread Display
Tampilkan maksimal 50 unread, sisanya load on demand:
```javascript
const displayedUnread = unreadNotifications.slice(0, 50);
```

### 3. Optimize Re-renders
Gunakan `useMemo` untuk filter notifications:
```javascript
const toastNotifications = useMemo(() => 
  notifications.slice(0, 3), 
  [notifications]
);
```

---

## 🎓 Key Learnings

### 1. Dual State Management
**Problem:** Notifikasi hilang setelah refresh karena hanya pakai socket real-time.

**Solution:** Split state:
- `notifications` → Toast (temporary)
- `unreadNotifications` → Persistent (fetch from backend)

### 2. Auto-hide Toast
**Implementation:**
```javascript
setTimeout(() => {
  setNotifications((prev) => prev.filter(n => n.id !== notif.id));
}, 5000);
```

**Warning:** Pastikan component unmount clear timeout untuk avoid memory leak.

### 3. Backend Integration
**Critical:** Backend harus include field `isRead` dan `readAt` di `UserNotification` table untuk tracking.

**Endpoint Dependencies:**
- `GET /user-notifications/me/unread-list` → Initial load
- `POST /user-notifications/:id/read` → Mark single as read
- `POST /user-notifications/read-all` → Bulk mark as read

---

## 🐛 Common Issues & Solutions

### Issue 1: Toast tidak hilang setelah 5 detik
**Cause:** `setTimeout` tidak properly clear notification dari state.

**Solution:**
```javascript
setTimeout(() => {
  setNotifications((prev) => prev.filter(n => n.id !== notif.id));
}, 5000);
```

### Issue 2: Unread notifications tidak muncul setelah refresh
**Cause:** Lupa fetch unread notifications on mount.

**Solution:** Tambahkan `useEffect` dengan dependency `[selectedEventId]`:
```javascript
useEffect(() => {
  fetchUnreadNotifications();
}, [selectedEventId]);
```

### Issue 3: Badge count tidak sinkron
**Cause:** State `unreadNotifications.length` tidak update setelah mark as read.

**Solution:** Filter state setelah API call:
```javascript
setUnreadNotifications(prev => prev.filter(n => n.id !== notificationId));
```

### Issue 4: Duplicate notifications
**Cause:** Socket emit 2x karena multiple event listeners.

**Solution:** Check duplicate sebelum add:
```javascript
setUnreadNotifications((prev) => {
  if (prev.some(n => n.id === notif.id)) return prev;
  return [notif, ...prev];
});
```

---

## 📞 API Reference

### Frontend: api.js
```javascript
// Get unread notification IDs
async getUnreadNotifications()
// GET /user-notifications/me/unread-list

// Mark single notification as read
async markNotificationAsRead(notificationId)
// POST /user-notifications/:notificationId/read

// Mark all notifications as read
async markAllNotificationsAsRead()
// POST /user-notifications/read-all
```

### Backend: userNotificationController.ts
```typescript
// Get unread notifications list
export const getListUnreadNotifications

// Mark notification as read
export const markNotificationRead

// Mark all notifications as read
export const markAllNotificationsRead
```

---

## 🎯 Future Enhancements

### 1. Notification Categories Filter
Tambahkan filter by type (SECURITY_ALERT, EVENT_UPDATE, etc.):
```javascript
const [selectedType, setSelectedType] = useState('all');
const filteredUnread = unreadNotifications.filter(n => 
  selectedType === 'all' || n.type === selectedType
);
```

### 2. Notification Sound
Play sound saat notifikasi baru:
```javascript
const notificationSound = new Audio('/sounds/notification.mp3');
socket.on('notification', (notif) => {
  notificationSound.play();
  // ...
});
```

### 3. Push Notifications
Integrate with browser Push API untuk notifikasi saat tab tidak aktif.

### 4. Archive Notifications
Tambahkan fitur archive untuk notifikasi lama yang sudah dibaca.

---

**Last Updated:** December 7, 2025  
**Version:** 2.0.0  
**Status:** ✅ Production Ready

**Features Implemented:**
- ✅ Toast notifications with auto-hide (5 seconds)
- ✅ Unread/Read tracking system
- ✅ Mark as read on click
- ✅ Mark all as read bulk action
- ✅ Red badge count indicator
- ✅ Persistent unread notifications after refresh
- ✅ Socket real-time integration
- ✅ Backend API integration
- ✅ Slide-in animation
- ✅ Browser notification toast
