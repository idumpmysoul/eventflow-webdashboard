
import React, { useState } from 'react';
import { 
    XMarkIcon, 
    MapPinIcon, 
    UserIcon, 
    ClockIcon,
    ChatBubbleLeftRightIcon,
    ShieldCheckIcon,
    MegaphoneIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

const IncidentDetailModal = ({ report, aiInsights = [], onClose, onUpdate }) => {
    const [status, setStatus] = useState(report.status);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Broadcast Modal States
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [broadcastSeverity, setBroadcastSeverity] = useState('high');

    const handleStatusChange = async (newStatus) => {
        try {
            setIsSubmitting(true);
            await api.updateReportStatus(report.id, newStatus, note);
            setStatus(newStatus);
            if (onUpdate) onUpdate({ ...report, status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const openBroadcastModal = () => {
        // Set default message berdasarkan kategori report
        const defaultMessages = {
            SECURITY: `PERINGATAN KEAMANAN: ${report.description.substring(0, 100)}`,
            FACILITY: `PEMBERITAHUAN FASILITAS: ${report.description.substring(0, 100)}`,
            CROWD: `PERINGATAN KEPADATAN: ${report.description.substring(0, 100)}`,
            OTHER: `PENGUMUMAN: ${report.description.substring(0, 100)}`
        };
        setBroadcastMessage(defaultMessages[report.category] || `📢 ${report.description.substring(0, 100)}`);
        setBroadcastSeverity(report.category === 'SECURITY' ? 'high' : 'medium');
        setIsBroadcastModalOpen(true);
    };

    const handleBroadcast = async () => {
        if (!broadcastMessage.trim()) {
            alert("Pesan broadcast tidak boleh kosong!");
            return;
        }
        
        try {
            setIsSubmitting(true);
            await api.broadcastReport(report.id, broadcastMessage, broadcastSeverity);
            alert("Broadcast berhasil dikirim ke semua participants!");
            setIsBroadcastModalOpen(false);
            if (onUpdate) onUpdate({ ...report, status: 'IN_PROGRESS' });
        } catch (error) {
            console.error("Broadcast failed", error);
            alert("Failed to send broadcast: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusColors = {
        PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
        IN_PROGRESS: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
        RESOLVED: 'bg-green-500/20 text-green-400 border-green-500/50',
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusColors[status] || 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}>
                                {status.replace('_', ' ')}
                            </span>
                            <span className="text-gray-400 dark:text-slate-400 text-sm flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {new Date(report.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-black dark:text-white">{report.category} Incident</h2>
                        <p className="text-gray-400 dark:text-slate-400 text-sm mt-1">ID: {report.id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Details */}
                        <div className="md:col-span-2 space-y-6">
                            {/* AI Insight / Description */}
                            <div className="bg-gray-100 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                <h3 className="text-indigo-700 dark:text-indigo-400 font-semibold text-sm uppercase mb-2 flex items-center gap-2">
                                    <ChatBubbleLeftRightIcon className="w-4 h-4" /> Description
                                </h3>
                                <p className="text-black dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                                    {report.description}
                                </p>
                                {aiInsights.length > 0 && (
                                    <div className="mt-4 p-3 bg-indigo-100 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-500/30 rounded-lg">
                                        <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold mb-1">AI Summary</p>
                                        {aiInsights.map((insight) => {
                                            let parsed = null;
                                            let raw = insight.aiPayload?.insight || '';
                                            try {
                                                if (raw.startsWith('```json')) raw = raw.replace(/```json|```/g, '').trim();
                                                parsed = JSON.parse(raw);
                                            } catch { parsed = null; }
                                            return (
                                                <div key={insight.id} className="mb-4">
                                                    <div className="text-xs text-gray-700 dark:text-slate-300 mb-1">Model: {insight.meta?.model || 'AI'}</div>
                                                    {parsed ? (
                                                        <div className="space-y-2">
                                                            <div><span className="font-bold text-indigo-700 dark:text-indigo-200">Severity:</span> <span className="text-red-600 dark:text-red-300">{parsed.severity}</span></div>
                                                            <div><span className="font-bold text-indigo-700 dark:text-indigo-200">Ringkasan:</span> <span className="text-indigo-900 dark:text-indigo-100">{parsed.summary}</span></div>
                                                            {parsed.actions && (
                                                                <div className="space-y-1">
                                                                    <span className="font-bold text-indigo-700 dark:text-indigo-200">Tindakan:</span>
                                                                    {parsed.actions.participant && <div className="text-indigo-900 dark:text-indigo-100 text-xs">Peserta: {parsed.actions.participant}</div>}
                                                                    {parsed.actions.organizer && <div className="text-indigo-900 dark:text-indigo-100 text-xs">Penyelenggara: {parsed.actions.organizer}</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-indigo-900 dark:text-indigo-100 whitespace-pre-line">{raw}</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Location & Reporter */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-100 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <h4 className="text-gray-500 dark:text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                                        <MapPinIcon className="w-4 h-4" /> Location
                                    </h4>
                                    <p className="text-black dark:text-white font-mono text-sm">
                                        Lat: {typeof report.latitude === 'number' ? report.latitude.toFixed(6) : '-'}<br/>
                                        Lng: {typeof report.longitude === 'number' ? report.longitude.toFixed(6) : '-'}
                                    </p>
                                </div>
                                <div className="bg-gray-100 dark:bg-slate-800/30 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                    <h4 className="text-gray-500 dark:text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
                                        <UserIcon className="w-4 h-4" /> Reporter
                                    </h4>
                                    <p className="text-black dark:text-white font-medium">{report.reporterName || report.reporter?.name || 'Anonymous'}</p>
                                    <p className="text-gray-400 dark:text-slate-400 text-xs">{report.reporter?.email || 'No contact info'}</p>
                                </div>
                            </div>

                            {/* Media Gallery */}
                            {report.mediaUrls && report.mediaUrls.length > 0 && (
                                <div>
                                    <h3 className="text-gray-400 dark:text-slate-400 font-semibold text-sm uppercase mb-3">Attached Media</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {report.mediaUrls.map((url, idx) => (
                                            <a key={idx} href={url} target="_blank" rel="noreferrer" className="block relative aspect-video rounded-lg overflow-hidden group">
                                                <img src={url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Actions */}
                        <div className="space-y-6">
                            <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                <h3 className="text-black dark:text-white font-bold mb-4">Actions</h3>
                                <div className="space-y-2">
                                    <p className="text-xs text-gray-400 dark:text-slate-400 font-medium uppercase">Update Status</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <button
                                            onClick={() => handleStatusChange('IN_PROGRESS')}
                                            disabled={isSubmitting || !note.trim()}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!note.trim() ? 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                                        >
                                            <ShieldCheckIcon className="w-4 h-4" /> Update ke Pelapor
                                        </button>
                                        <button
                                            onClick={() => handleStatusChange('RESOLVED')}
                                            disabled={status === 'RESOLVED' || isSubmitting}
                                            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${status === 'RESOLVED' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-300 dark:hover:bg-slate-600'}`}
                                        >
                                            <CheckCircleIcon className="w-4 h-4" /> Resolve
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
                                    <p className="text-xs text-gray-400 dark:text-slate-400 font-medium uppercase mb-2">Emergency</p>
                                    <button 
                                        onClick={openBroadcastModal}
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 border border-red-200 dark:border-red-500/50 rounded-lg text-sm font-bold transition-colors"
                                    >
                                        <MegaphoneIcon className="w-4 h-4" /> Broadcast Alert
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 dark:text-slate-400 font-medium uppercase mb-2">Internal Notes</label>
                                <textarea 
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none resize-none h-32"
                                    placeholder="Add notes for the team..."
                                ></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Broadcast Modal */}
            {isBroadcastModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-lg shadow-2xl animate-fadeIn">
                        <div className="p-6 border-b border-gray-200 dark:border-slate-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 dark:bg-red-500/10 rounded-lg">
                                    <MegaphoneIcon className="w-6 h-6 text-red-600 dark:text-red-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-black dark:text-white">Broadcast Alert</h3>
                                    <p className="text-sm text-gray-500 dark:text-slate-400">Kirim peringatan ke semua participants</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Report Info */}
                            <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase text-gray-500 dark:text-slate-400">Report Category</span>
                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                                        report.category === 'SECURITY' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                        report.category === 'FACILITY' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
                                        report.category === 'CROWD' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                                        'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                    }`}>
                                        {report.category}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-slate-300 line-clamp-2">{report.description}</p>
                            </div>

                            {/* Broadcast Message */}
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                                    Pesan Broadcast <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg p-3 text-sm text-black dark:text-white focus:ring-2 focus:ring-red-500 outline-none resize-none h-32"
                                    placeholder="Tulis pesan peringatan untuk semua participants..."
                                />
                                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                                    {broadcastMessage.length} / 500 karakter
                                </p>
                            </div>

                            {/* Severity Level */}
                            <div>
                                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                                    Tingkat Urgency
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['low', 'medium', 'high'].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setBroadcastSeverity(level)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                                broadcastSeverity === level
                                                    ? level === 'high' ? 'bg-red-600 text-white border-2 border-red-700' :
                                                      level === 'medium' ? 'bg-orange-600 text-white border-2 border-orange-700' :
                                                      'bg-yellow-600 text-white border-2 border-yellow-700'
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {level === 'high' ? '🔴 High' : level === 'medium' ? '🟠 Medium' : '🟡 Low'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30 rounded-lg p-3">
                                <p className="text-xs text-red-700 dark:text-red-400">
                                    ⚠️ Pesan ini akan dikirim ke <strong>SEMUA participants</strong> event ini. Pastikan pesan sudah benar sebelum mengirim.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setIsBroadcastModalOpen(false)}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleBroadcast}
                                disabled={isSubmitting || !broadcastMessage.trim()}
                                className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${
                                    isSubmitting || !broadcastMessage.trim()
                                        ? 'bg-gray-300 dark:bg-slate-700 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                            >
                                {isSubmitting ? 'Mengirim...' : '📢 Kirim Broadcast'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IncidentDetailModal;
