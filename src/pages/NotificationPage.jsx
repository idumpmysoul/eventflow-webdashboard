import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext.jsx';

const NOTIF_TYPE_LABELS = {
  FROM_REPORT: 'Dari Report (Semua)', // Filter khusus: Semua notif yang berasal dari report
  GENERAL: 'General',
  EVENT_UPDATE: 'Event Update',
  SECURITY_ALERT: 'Security Alert',
  REPORT_FEEDBACK: 'Report Feedback', // Otomatis dikirim sistem saat user submit report (TIDAK bisa dipilih manual)
};

const REPORT_CATEGORY_LABELS = {
  SECURITY: 'Keamanan',
  CROWD: 'Kerumunan',
  FACILITY: 'Fasilitas',
  OTHER: 'Lainnya'
};

function NotificationPage() {
  const { selectedEventId, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState('ALL'); // GENERAL, EVENT_UPDATE, SECURITY_ALERT, REPORT_FEEDBACK
  const [deliveryMethodFilter, setDeliveryMethodFilter] = useState('ALL'); // INDIVIDUAL, BROADCAST
  const [participantFilter, setParticipantFilter] = useState(''); // Filter by participant name (untuk INDIVIDUAL)
  const [reportCategoryFilter, setReportCategoryFilter] = useState('ALL'); // SECURITY, CROWD, FACILITY, OTHER (untuk REPORT_FEEDBACK)
  const [senderReceiverFilter, setSenderReceiverFilter] = useState('ALL'); // 'ALL', 'SENT', 'RECEIVED'
  
  const [participants, setParticipants] = useState([]);
  const [notifForm, setNotifForm] = useState({ 
    participantId: '', 
    title: '', 
    message: '', 
    type: 'GENERAL',
    sendMethod: 'individual' // 'individual' atau 'broadcast'
  });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendSuccess, setSendSuccess] = useState(null);

  useEffect(() => {
    if (!selectedEventId) return;
    setLoading(true);
    // Fetch notifications
    api.getEventNotifications(selectedEventId)
      .then((data) => {
        setNotifications(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    // Fetch participants
    api.getEventParticipants(selectedEventId)
      .then((data) => {
        setParticipants(Array.isArray(data) ? data : []);
      })
      .catch(() => setParticipants([]));
  }, [selectedEventId]);

  // Filtering logic
  let filteredNotifications = notifications.filter((notif) => {
    // 1. Filter by NotificationType
    if (typeFilter === 'FROM_REPORT') {
      // Filter khusus: Hanya tampilkan notifikasi yang punya category (dari report)
      if (!notif.category) {
        return false;
      }
    } else if (typeFilter !== 'ALL' && notif.type !== typeFilter) {
      return false;
    }
    
    // 2. Filter by DeliveryMethod
    if (deliveryMethodFilter !== 'ALL' && notif.deliveryMethod !== deliveryMethodFilter) {
      return false;
    }
    
    // 3. Filter by Participant Name (hanya untuk INDIVIDUAL notifications)
    if (participantFilter) {
      // Jika ada filter participant, hanya tampilkan INDIVIDUAL notifications
      if (notif.deliveryMethod !== 'INDIVIDUAL') {
        return false;
      }
      const participantName = notif.receiver?.name?.toLowerCase() || '';
      if (!participantName.includes(participantFilter.toLowerCase())) {
        return false;
      }
    }
    
    // 4. Filter by Report Category (untuk semua notifikasi yang punya category)
    if (reportCategoryFilter !== 'ALL') {
      // Hanya filter notifikasi yang punya category
      if (!notif.category || notif.category !== reportCategoryFilter) {
        return false;
      }
    }

    // 5. Filter by Sender/Receiver
    if (senderReceiverFilter === 'SENT') {
      // Notifikasi yang dikirim oleh user ini
      // Untuk organizer: notifikasi yang dibuat oleh organizer (REPORT_FEEDBACK updates, manual notifications)
      // Cek apakah user adalah receiver (jika INDIVIDUAL) atau bukan
      if (notif.deliveryMethod === 'INDIVIDUAL' && notif.receiver?.id === user?.id) {
        return false; // Ini diterima, bukan dikirim
      }
      // Untuk broadcast, anggap dikirim jika user adalah organizer
      if (notif.deliveryMethod === 'BROADCAST' && user?.role !== 'organizer') {
        return false;
      }
    } else if (senderReceiverFilter === 'RECEIVED') {
      // Notifikasi yang diterima oleh user ini
      if (notif.deliveryMethod === 'INDIVIDUAL') {
        // Individual: harus user adalah receiver
        if (notif.receiver?.id !== user?.id) {
          return false;
        }
      } else if (notif.deliveryMethod === 'BROADCAST') {
        // Broadcast: participant menerima, organizer tidak
        if (user?.role === 'organizer') {
          return false;
        }
      }
    }
    
    return true;
  });

  // Sort latest first
  filteredNotifications = filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Handler send notification
  const handleSendNotif = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    setSendSuccess(null);
    try {
      // Jika metode kirim BROADCAST, gunakan API sendBroadcast
      if (notifForm.sendMethod === 'broadcast') {
        await api.sendBroadcast({
          eventId: selectedEventId,
          title: notifForm.title,
          message: notifForm.message,
          type: notifForm.type, // Gunakan type label yang dipilih (GENERAL, EVENT_UPDATE, SECURITY_ALERT)
        });
      } else {
        // Untuk individual, gunakan sendUserNotification dengan type label yang dipilih
        await api.sendUserNotification({
          eventId: selectedEventId,
          participantId: notifForm.participantId,
          title: notifForm.title,
          message: notifForm.message,
          type: notifForm.type, // Gunakan type label (GENERAL, EVENT_UPDATE, dll)
        });
      }
      setSendSuccess('Notifikasi berhasil dikirim!');
      setNotifForm({ participantId: '', title: '', message: '', type: 'GENERAL', sendMethod: 'individual' });
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-200">
      {/* Header */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-black dark:text-white mb-1">Notifikasi Event</h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">Kelola dan kirim notifikasi ke peserta event Anda</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* --- LEFT SIDEBAR (Form & Filter) --- */}
        {/* Menggunakan fixed width (w-96) agar proporsional dan tidak terpengaruh resize browser */}
        <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-shrink-0 pb-4">
          
          {/* Form Card */}
          <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-black dark:text-white mb-1">Kirim Pesan Baru</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Pesan akan dikirim via aplikasi</p>
            </div>
            
            <form onSubmit={handleSendNotif} className="flex flex-col gap-4">
              {/* Send Method Selector */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Metode Kirim
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNotifForm(f => ({ ...f, sendMethod: 'individual', participantId: '' }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      notifForm.sendMethod === 'individual'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    Individu
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifForm(f => ({ ...f, sendMethod: 'broadcast', participantId: '' }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                      notifForm.sendMethod === 'broadcast'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-300 dark:border-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    Broadcast
                  </button>
                </div>
              </div>

              {/* Participant Select - Only show for individual */}
              {notifForm.sendMethod === 'individual' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                    Kepada Peserta
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={notifForm.participantId}
                      onChange={e => setNotifForm(f => ({ ...f, participantId: e.target.value }))}
                      className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    >
                      <option value="">-- Pilih Peserta --</option>
                      {participants.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.user?.name || p.name || p.id} {p.user?.email ? `(${p.user.email})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Info banner for broadcast */}
              {notifForm.sendMethod === 'broadcast' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-start gap-2">
                  <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <div className="text-xs text-indigo-700 dark:text-indigo-300">
                    <strong>Mode Broadcast:</strong> Pesan akan dikirim ke semua peserta event saat ini.
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Judul
                </label>
                <input
                  required
                  type="text"
                  value={notifForm.title}
                  onChange={e => setNotifForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder="Contoh: Perubahan Jadwal"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Pesan
                </label>
                <textarea
                  required
                  value={notifForm.message}
                  onChange={e => setNotifForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  rows={4}
                  placeholder="Isi pesan notifikasi..."
                />
              </div>

              {/* Type Select - Label/Badge only */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Kategori/Label
                </label>
                <select
                  value={notifForm.type}
                  onChange={e => setNotifForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm"
                >
                  <option value="GENERAL">General</option>
                  <option value="EVENT_UPDATE">Event Update</option>
                  <option value="SECURITY_ALERT">Security Alert</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Label badge yang ditampilkan pada notifikasi</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-wait flex justify-center items-center gap-2"
              >
                {sending ? 'Mengirim...' : 'Kirim Sekarang'}
              </button>

              {/* Feedback Messages */}
              {(sendError || sendSuccess) && (
                <div className={`text-xs p-3 rounded-lg border ${sendError ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                  {sendError || sendSuccess}
                </div>
              )}
            </form>
          </div>

          {/* Filter Card */}
          <div className="p-5 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Filter Tampilan</h3>
            <div className="space-y-3">
              {/* Filter by Notification Type */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Tipe Notifikasi
                </label>
                <select
                  value={typeFilter}
                  onChange={e => {
                    setTypeFilter(e.target.value);
                    // Auto-adjust delivery method filter
                    if (e.target.value === 'REPORT_FEEDBACK') {
                      // REPORT_FEEDBACK hanya bisa INDIVIDUAL
                      setDeliveryMethodFilter('INDIVIDUAL');
                    }
                  }}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm"
                >
                  <option value="ALL">Semua Tipe</option>
                  {Object.entries(NOTIF_TYPE_LABELS).map(([key, label]) => (
                    <option 
                      key={key} 
                      value={key}
                      disabled={key === 'REPORT_FEEDBACK' && deliveryMethodFilter === 'BROADCAST'}
                    >
                      {label}
                      {key === 'REPORT_FEEDBACK' && deliveryMethodFilter === 'BROADCAST' && ' (tidak tersedia untuk Broadcast)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  {typeFilter === 'FROM_REPORT' && '✅ Semua notifikasi dari report (Individual + Broadcast)'}
                  {typeFilter === 'REPORT_FEEDBACK' && '✅ Report Feedback selalu Individual'}
                  {(typeFilter === 'SECURITY_ALERT' || typeFilter === 'EVENT_UPDATE') && '✅ Bisa Individual atau Broadcast'}
                  {typeFilter === 'GENERAL' && '✅ Notifikasi manual (bisa Individual atau Broadcast)'}
                </p>
              </div>

              {/* Filter by Delivery Method */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Metode Pengiriman
                </label>
                <select
                  value={deliveryMethodFilter}
                  onChange={e => {
                    setDeliveryMethodFilter(e.target.value);
                    // Auto-adjust type filter
                    if (e.target.value === 'BROADCAST' && typeFilter === 'REPORT_FEEDBACK') {
                      // BROADCAST tidak bisa dengan REPORT_FEEDBACK
                      setTypeFilter('ALL');
                    }
                    // Reset participant filter jika bukan INDIVIDUAL
                    if (e.target.value !== 'INDIVIDUAL') {
                      setParticipantFilter('');
                    }
                  }}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm"
                >
                  <option value="ALL">Semua Metode</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option 
                    value="BROADCAST"
                    disabled={typeFilter === 'REPORT_FEEDBACK'}
                  >
                    Broadcast{typeFilter === 'REPORT_FEEDBACK' ? ' (tidak tersedia untuk Report Feedback)' : ''}
                  </option>
                </select>
                {deliveryMethodFilter === 'BROADCAST' && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                      <path d="M15 7v2a4 4 0 01-4 4v2a6 6 0 006-6V7h-2z"/>
                    </svg>
                    Menampilkan notifikasi yang dikirim ke semua peserta
                  </p>
                )}
              </div>

              {/* Filter by Sender/Receiver */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Dikirim / Diterima
                </label>
                <select
                  value={senderReceiverFilter}
                  onChange={e => setSenderReceiverFilter(e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm"
                >
                  <option value="ALL">Semua Notifikasi</option>
                  <option value="SENT">
                    {user?.role === 'organizer' ? '↑ Saya Kirim' : '↑ Saya Laporkan'}
                  </option>
                  <option value="RECEIVED">↓ Saya Terima</option>
                </select>
                {senderReceiverFilter !== 'ALL' && (
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 flex items-center gap-1">
                    {senderReceiverFilter === 'SENT' && (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 3.586L6.707 6.879a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L11 3.586v11.586l3.293-3.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L10 15.172V3.586z"/>
                        </svg>
                        <span>
                          {user?.role === 'organizer' ? 'Notifikasi yang Anda kirim (update status, broadcast)' : 'Report yang Anda buat'}
                        </span>
                      </>
                    )}
                    {senderReceiverFilter === 'RECEIVED' && (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v10.586l3.293-3.293a1 1 0 111.414 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L9 14.586V4a1 1 0 011-1z" clipRule="evenodd"/>
                        </svg>
                        <span>Notifikasi yang Anda terima</span>
                      </>
                    )}
                  </p>
                )}
              </div>

              {/* Filter by Participant Name - Only for INDIVIDUAL */}
              {deliveryMethodFilter === 'INDIVIDUAL' && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                    Cari Penerima
                  </label>
                  <input
                    type="text"
                    value={participantFilter}
                    onChange={e => setParticipantFilter(e.target.value)}
                    placeholder="Nama peserta..."
                    className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Filter notifikasi individual berdasarkan nama penerima</p>
                </div>
              )}

              {/* Filter by Report Category - For all notifications with category */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-700 dark:text-slate-300 uppercase tracking-wider">
                  Kategori Laporan
                </label>
                <select
                  value={reportCategoryFilter}
                  onChange={e => setReportCategoryFilter(e.target.value)}
                  className="w-full border border-gray-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-slate-800 text-sm"
                >
                  <option value="ALL">Semua Kategori</option>
                  {Object.entries(REPORT_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">Filter notifikasi yang berasal dari laporan</p>
              </div>

              {/* Reset Filters Button */}
              {(typeFilter !== 'ALL' || deliveryMethodFilter !== 'ALL' || participantFilter || reportCategoryFilter !== 'ALL' || senderReceiverFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setTypeFilter('ALL');
                    setDeliveryMethodFilter('ALL');
                    setParticipantFilter('');
                    setReportCategoryFilter('ALL');
                    setSenderReceiverFilter('ALL');
                  }}
                  className="w-full mt-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- RIGHT CONTENT (List Notifications) --- */}
        {/* Flex-1 agar mengisi sisa ruang. Menggunakan Grid Layout untuk cards */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white/50 dark:bg-slate-900/50 rounded-xl border border-gray-200 dark:border-slate-800">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
            <h2 className="font-bold text-gray-800 dark:text-white">Riwayat Notifikasi</h2>
            <span className="text-xs bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-500">
              {filteredNotifications.length} Item
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                <p className="text-sm">Memuat data...</p>
              </div>
            )}

            {!loading && !error && filteredNotifications.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p>Belum ada notifikasi yang sesuai filter.</p>
              </div>
            )}

            {/* GRID LAYOUT FIX: Menggunakan grid-cols-1 untuk layar kecil, dan xl:grid-cols-2 untuk layar lebar */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
              {filteredNotifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className="flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 group"
                >
                  {/* Header Card */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      {/* Notification Type Badge */}
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        notif.type === 'SECURITY_ALERT' 
                          ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                          : notif.type === 'REPORT_FEEDBACK'
                          ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800'
                          : 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800'
                      }`}>
                        {NOTIF_TYPE_LABELS[notif.type] || notif.type}
                      </span>
                      
                      {/* Delivery Method Badge */}
                      {notif.deliveryMethod === 'BROADCAST' ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z"/>
                            <path d="M15 7v2a4 4 0 01-4 4v2a6 6 0 006-6V7h-2z"/>
                          </svg>
                          BROADCAST
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-600 border border-teal-100 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                          </svg>
                          INDIVIDUAL
                        </span>
                      )}
                      
                      {/* Report Category Badge - Show for any notification with category */}
                      {notif.category && (
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                          notif.category === 'SECURITY' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                          notif.category === 'FACILITY' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' :
                          notif.category === 'CROWD' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800' :
                          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800'
                        }`}>
                          {REPORT_CATEGORY_LABELS[notif.category] || notif.category}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono">
                      {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>

                  {/* Body Card */}
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed mb-4 flex-grow line-clamp-3">
                    {notif.message}
                  </p>

                  {/* Footer Card */}
                  <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500">
                     <div className="flex items-center gap-2">
                        {/* Show receiver only for INDIVIDUAL deliveryMethod */}
                        {notif.deliveryMethod === 'INDIVIDUAL' && notif.receiver && (
                          <div className="flex items-center gap-1" title="Penerima">
                             <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[9px] font-bold text-indigo-700 dark:text-indigo-300">
                                {notif.receiver.name?.[0] || 'R'}
                             </div>
                             <span className="truncate max-w-[120px]">{notif.receiver.name}</span>
                          </div>
                        )}
                        
                        {/* Show "Semua Peserta" for BROADCAST */}
                        {notif.deliveryMethod === 'BROADCAST' && (
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400" title="Dikirim ke semua peserta">
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                               <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                             </svg>
                             <span className="font-medium">Semua Peserta</span>
                          </div>
                        )}
                     </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotificationPage;