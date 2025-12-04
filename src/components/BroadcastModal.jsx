import React, { useState } from 'react';
import { XMarkIcon, MegaphoneIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifier } from '../contexts/NotificationContext';
import { ReportCategory } from '../types';

const BroadcastModal = ({ zones, onClose }) => {
    const { selectedEventId } = useAuth();
    const { notify } = useNotifier();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [category, setCategory] = useState(ReportCategory.OTHER);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title || !message) {
            alert('Title and message are required.');
            return;
        }
        
        setIsSubmitting(true);
        try {
            await api.sendBroadcast({
                eventId: selectedEventId,
                title,
                message,
                category,
                type: 'BROADCAST',
            });
            notify('Broadcast sent successfully!', 'info');
            onClose();
        } catch (error) {
            console.error("Failed to send broadcast", error);
            notify(`Failed to send broadcast: ${error.message}`, 'alert');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                        <MegaphoneIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        Send Broadcast
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg text-gray-400 dark:text-slate-400 hover:text-black dark:hover:text-white transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Title</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Important Announcement" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Message</label>
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="4" className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Enter your message to all participants..."></textarea>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-400 mb-1">Category</label>
                        <select value={category} onChange={e => setCategory(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2 text-black dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none">
                            {Object.values(ReportCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
                     <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                        {isSubmitting ? 'Sending...' : 'Send Broadcast'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BroadcastModal;