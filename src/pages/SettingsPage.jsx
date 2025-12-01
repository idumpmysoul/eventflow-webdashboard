
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
    const [confirmDeleteText, setConfirmDeleteText] = useState('');
    const [statusUpdate, setStatusUpdate] = useState(null);
    const [statusLoading, setStatusLoading] = useState(false);
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
                setStatusUpdate(data.status);
            } catch (error) {
                notify(`Error fetching event details: ${error.message}`, 'alert');
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [selectedEventId, navigate, notify]);
    const handleStatusUpdate = async () => {
        setStatusLoading(true);
        try {
            await api.updateEvent(selectedEventId, { status: statusUpdate });
            notify('Event status updated!', 'info');
        } catch (error) {
            notify(`Failed to update status: ${error.message}`, 'alert');
        } finally {
            setStatusLoading(false);
        }
    };

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

    const handleDeleteEvent = async () => {
        if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
        setIsUpdating(true);
        try {
            await api.deleteEvent(selectedEventId);
            notify('Event has been deleted.', 'info');
            navigate('/events');
        } catch (error) {
            notify(`Failed to delete event: ${error.message}`, 'alert');
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

                {/* Event Status Update Section */}
                <div className="bg-blue-900/40 border border-blue-700 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-blue-300 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-pen-to-square mr-2" /> Update Event Status
                    </h2>
                    <p className="text-blue-200 mb-4">Change the status of your event below. Status will affect participant activity and event visibility.</p>
                    <div className="flex gap-4 items-center">
                        <select
                            className="bg-blue-950 text-blue-200 px-4 py-2 rounded border border-blue-700 focus:outline-none"
                            value={statusUpdate}
                            onChange={e => setStatusUpdate(e.target.value)}
                        >
                            <option value="UPCOMING">UPCOMING</option>
                            <option value="ONGOING">ONGOING</option>
                            <option value="COMPLETED">COMPLETED</option>
                            <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <button
                            className="bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                            disabled={statusLoading || statusUpdate === eventDetails.status}
                            onClick={handleStatusUpdate}
                        >
                            {statusLoading ? 'Updating...' : 'Update Status'}
                        </button>
                    </div>
                </div>

                {/* Finish Event Section */}
                <div className="bg-yellow-900/40 border border-yellow-700 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-flag-checkered mr-2" /> Finish Event
                    </h2>
                    <p className="text-yellow-300 mb-4">
                        This will mark the event as <b>COMPLETED</b> and deactivate all participants. This action cannot be undone.
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-yellow-200">To confirm, type "FINISH" below:</span>
                    </div>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            className="bg-yellow-950 text-yellow-200 px-4 py-2 rounded w-40 border border-yellow-700 focus:outline-none"
                            value={confirmFinishText}
                            onChange={e => setConfirmFinishText(e.target.value)}
                            placeholder="FINISH"
                        />
                        <button
                            className="bg-yellow-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                            disabled={isUpdating || confirmFinishText !== 'FINISH'}
                            onClick={handleFinishEvent}
                        >
                            {isUpdating ? 'Finishing...' : 'Finish Event'}
                        </button>
                    </div>
                </div>

                {/* Danger Zone: Delete Event Only */}
                <div className="bg-red-900/40 border border-red-700 p-6 rounded-xl">
                    <h2 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-6 h-6" /> Danger Zone
                    </h2>
                    <p className="text-red-300 mb-4">
                        <b>Delete this event permanently.</b> This action is irreversible and will remove all event data.
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-red-200">To delete this event, type <b>DELETE {eventDetails.name}</b> below:</span>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="bg-red-950 text-red-200 px-4 py-2 rounded w-56 border border-red-700 focus:outline-none"
                            value={confirmDeleteText}
                            onChange={e => setConfirmDeleteText(e.target.value)}
                            placeholder={`DELETE ${eventDetails.name}`}
                        />
                        <button
                            className="bg-red-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50"
                            disabled={isUpdating || confirmDeleteText !== `DELETE ${eventDetails.name}`}
                            onClick={handleDeleteEvent}
                        >
                            {isUpdating ? 'Deleting...' : 'Delete Event'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;