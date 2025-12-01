
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useNotifier } from '../contexts/NotificationContext';
import { 
    ClipboardDocumentIcon, 
    CheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const SettingsPage = () => {
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotifier();

    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const [confirmFinishText, setConfirmFinishText] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!selectedEventId) {
            navigate('/events');
            return;
        }

        const fetchEvent = async () => {
            try {
                setLoading(true);
                const data = await api.getEventById(selectedEventId);
                setEventDetails(data);
            } catch (error) {
                notify(`Error fetching event details: ${error.message}`, 'alert');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [selectedEventId, navigate, notify]);

    const handleCopyCode = () => {
        if (eventDetails?.joinCode) {
            navigator.clipboard.writeText(eventDetails.joinCode);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };
    
    const handleUpdateDetails = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const updatedData = { name: eventDetails.name, description: eventDetails.description };
            await api.updateEvent(selectedEventId, updatedData);
            notify('Event details updated successfully!', 'info');
        } catch (error) {
            notify(`Failed to update details: ${error.message}`, 'alert');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleFinishEvent = async () => {
        if (confirmFinishText !== 'FINISH') {
            notify('Please type FINISH to confirm.', 'alert');
            return;
        }
        setIsUpdating(true);
        try {
            await api.finishEvent(selectedEventId);
            notify('Event has been successfully marked as completed.', 'info');
            navigate('/events');
        } catch (error) {
            notify(`Failed to finish event: ${error.message}`, 'alert');
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-center text-slate-400">Loading settings...</div>;
    }

    if (!eventDetails) {
        return <div className="p-6 text-center text-red-400">Could not load event details.</div>;
    }

    return (
        <div className="p-6 md:p-8 h-full overflow-y-auto bg-slate-950 text-slate-200">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white">Event Settings</h1>
                <p className="text-slate-400">Manage your event's configuration and access.</p>
            </header>

            <div className="max-w-3xl space-y-8">
                {/* Event Details Section */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Event Details</h2>
                    <form onSubmit={handleUpdateDetails} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Event Name</label>
                            <input 
                                value={eventDetails.name}
                                onChange={(e) => setEventDetails(prev => ({...prev, name: e.target.value}))}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                            <textarea
                                value={eventDetails.description}
                                onChange={(e) => setEventDetails(prev => ({...prev, description: e.target.value}))}
                                rows="3"
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" 
                            />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={isUpdating} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
                
                {/* Access Code Section */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-white mb-4">Access Code</h2>
                    <p className="text-slate-400 text-sm mb-4">Share this code with participants to allow them to join the event on the mobile app.</p>
                    <div className="bg-slate-950 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
                        <span className="text-2xl font-mono font-bold text-indigo-400 tracking-wider">
                            {eventDetails.joinCode}
                        </span>
                        <button onClick={handleCopyCode} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                            {isCopied ? <CheckIcon className="w-5 h-5 text-green-400"/> : <ClipboardDocumentIcon className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6" /> Danger Zone
                    </h2>
                    <p className="text-red-300/80 text-sm mb-4">This action is irreversible. It will mark the event as completed and deactivate all participants.</p>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-300">To confirm, type "FINISH" below:</label>
                        <input 
                            type="text"
                            value={confirmFinishText}
                            onChange={(e) => setConfirmFinishText(e.target.value)}
                            className="w-full max-w-xs bg-red-950/50 border border-red-500/50 rounded-lg px-4 py-2 text-white placeholder-red-400/30"
                            placeholder="FINISH"
                        />
                        <button 
                            onClick={handleFinishEvent}
                            disabled={isUpdating || confirmFinishText !== 'FINISH'}
                            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUpdating ? 'Finishing...' : 'Finish Event'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;