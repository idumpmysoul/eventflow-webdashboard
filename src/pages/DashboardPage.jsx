import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import socket from '../services/socket.js';
import MapComponent from '../components/MapComponent.jsx';
import IncidentFeed from '../components/IncidentFeed.jsx';
import IncidentDetailModal from '../components/IncidentDetailModal.jsx';
import ZoneSidebar from '../components/ZoneSidebar.jsx';
import SpotSidebar from '../components/SpotSidebar.jsx';
import BroadcastModal from '../components/BroadcastModal.jsx';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { useAuth } from '../contexts/AuthContext';
import { useNotifier } from '../contexts/NotificationContext.jsx';
import { SpotType } from '../types.js';

// Icons
import {
    MapIcon,
    UsersIcon,
    ExclamationTriangleIcon,
    PencilIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    BellIcon,
    SignalIcon,
    Square3Stack3DIcon,
    MegaphoneIcon,
    PlusIcon
} from '@heroicons/react/24/outline';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MOCK_DATA_TIMEOUT = 5000;

const ZONE_COLORS = [
    { name: 'Red', value: '#ef4444' },
    { name: 'Green', value: '#22c55e' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Yellow', value: '#eab308' },
    { name: 'Purple', value: '#a855f7' },
];

const DashboardPage = () => {
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const { notify } = useNotifier();
    
    // Data States
    const [eventDetails, setEventDetails] = useState(null);
    const [reports, setReports] = useState([]);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [zones, setZones] = useState([]);
    const [spots, setSpots] = useState([]);
    const [notifications, setNotifications] = useState([]); // <-- Notifikasi event
    const [aiInsights, setAiInsights] = useState([]); // <-- Insight AI dari report
    const [participants, setParticipants] = useState([]); // All event participants
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    
    // Zone Management States
    const [isManageZonesMode, setIsManageZonesMode] = useState(false);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [tempZoneFeature, setTempZoneFeature] = useState(null);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneColor, setNewZoneColor] = useState(ZONE_COLORS[0].value);

    // Spot Management States
    const [isManageSpotsMode, setIsManageSpotsMode] = useState(false);
    const [isAddingSpotMode, setIsAddingSpotMode] = useState(false);
    const [isSpotModalOpen, setIsSpotModalOpen] = useState(false);
    const [newSpotData, setNewSpotData] = useState({ name: '', type: 'OTHER', description: '', latitude: null, longitude: null });

    const mapRef = useRef(null);
    const dataLoadedRef = useRef(false);
    const isMountedRef = useRef(true);

        // --- Event Management Handlers ---
        // Edit Event
        const handleEditEvent = async () => {
            try {
                // Example: Open edit modal or navigate to edit page
                // You can implement modal logic or navigation here
                // For backend update:
                // await api.updateEvent(selectedEventId, eventData);
                notify('Edit event clicked');
            } catch (err) {
                notify('Failed to edit event');
                console.error('Failed to edit event:', err);
            }
        };

        // Start Event
        const handleStartEvent = async () => {
            try {
                // Backend PATCH to update status to ONGOING
                // await api.updateEvent(selectedEventId, { status: 'ONGOING' });
                notify('Start event clicked');
            } catch (err) {
                notify('Failed to start event');
                console.error('Failed to start event:', err);
            }
        };

        // Finish Event
        const handleFinishEvent = async () => {
            try {
                // Backend PATCH to /events/:id/finish
                // await api.finishEvent(selectedEventId);
                notify('Finish event clicked');
            } catch (err) {
                notify('Failed to finish event');
                console.error('Failed to finish event:', err);
            }
        };

        // Broadcast
        const handleBroadcast = async () => {
            try {
                // Implement broadcast logic (open modal, call backend, etc)
                setIsBroadcastModalOpen(true);
                notify('Broadcast clicked');
            } catch (err) {
                notify('Failed to broadcast');
                console.error('Failed to broadcast event:', err);
            }
        };

        // Export Event Data
        const handleExportEvent = async () => {
            try {
                // Implement export logic (call backend, download file, etc)
                notify('Export event clicked');
            } catch (err) {
                notify('Failed to export event');
                console.error('Failed to export event:', err);
            }
        };

        // Delete Event
        const handleDeleteEvent = async () => {
            try {
                // Backend DELETE to /events/:id
                // await api.deleteEvent(selectedEventId);
                notify('Delete event clicked');
            } catch (err) {
                notify('Failed to delete event');
                console.error('Failed to delete event:', err);
            }
        };

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!selectedEventId) {
            navigate('/events');
        }
    }, [selectedEventId, navigate]);

    // Initial Data Fetch
    useEffect(() => {
        if (!selectedEventId) return;
        dataLoadedRef.current = false;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setUsingMockData(false);
            try {
                const [eventResponse, reportsResponse, locationsResponse, zonesResponse, spotsResponse] = await Promise.all([
                    api.getEventById(selectedEventId),
                    api.getReports(selectedEventId),
                    api.getParticipantLocations(selectedEventId),
                    api.getVirtualAreas(selectedEventId),
                    api.getImportantSpots(selectedEventId)
                ]);

                if (dataLoadedRef.current || !isMountedRef.current) return;
                dataLoadedRef.current = true;
                
                setEventDetails(eventResponse);
                                setReports(reportsResponse);
                                setParticipantLocations(locationsResponse);
                                setZones(zonesResponse);
                                setSpots(spotsResponse || []);
                                // Ambil AI Insight untuk semua report
                                if (Array.isArray(reportsResponse)) {
                                    let allInsights = [];
                                    for (const report of reportsResponse) {
                                        try {
                                            const aiResults = await api.getReportAIResultsByReportId(report.id);
                                            if (Array.isArray(aiResults)) {
                                                allInsights = [...allInsights, ...aiResults.map(i => ({ ...i, reportId: report.id }))];
                                            }
                                        } catch {}
                                    }
                                    setAiInsights(allInsights);
                                }
                                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                console.error("Failed to fetch dashboard data:", err);
                setError(err.message);
                setLoading(false); // Even on error, stop loading
            }
        };

        fetchData();
        // Fetch all participants for accurate count (match ParticipantsPage)
        const fetchParticipants = async () => {
            try {
                const response = await api.getEventParticipants(selectedEventId);
                if (!isMountedRef.current) return;
                setParticipants(response);
            } catch (err) {
                // Optionally handle error
                setParticipants([]);
            }
        };
        fetchParticipants();
    }, [selectedEventId]);

    // Socket Connection
    useEffect(() => {
        if (usingMockData || !selectedEventId || loading) return;

        socket.connect();
        socket.emit('joinEventRoom', selectedEventId);

        socket.on('locationUpdate', (newLocation) => {
            setParticipantLocations((prevLocations) => {
                if (!prevLocations) return [newLocation];
                const existingIndex = prevLocations.findIndex((p) => p.userId === newLocation.userId);
                if (existingIndex > -1) {
                    const updatedLocations = [...prevLocations];
                    updatedLocations[existingIndex] = { ...updatedLocations[existingIndex], ...newLocation };
                    return updatedLocations;
                }
                return [...prevLocations, newLocation];
            });
        });

        // --- Listen for broadcast notification ---
        socket.on('notification', (notif) => {
            setNotifications((prev) => [notif, ...prev]);
        });

        // --- Listen for live report (laporan baru) ---
        socket.on('liveReport', async (newReportPayload) => {
            setReports((prevReports) => {
                const existingIndex = prevReports.findIndex(r => r.id === newReportPayload.reportId);
                const reportObj = {
                    id: newReportPayload.reportId,
                    category: newReportPayload.category,
                    description: newReportPayload.description || newReportPayload.message,
                    status: newReportPayload.status || 'PENDING',
                    latitude: newReportPayload.latitude,
                    longitude: newReportPayload.longitude,
                    reporterName: newReportPayload.reporterName || 'Unknown',
                    createdAt: new Date(newReportPayload.createdAt || Date.now()),
                    mediaUrls: newReportPayload.mediaUrl ? [newReportPayload.mediaUrl] : []
                };
                if (existingIndex > -1) {
                    const updated = [...prevReports];
                    updated[existingIndex] = { ...updated[existingIndex], ...reportObj };
                    return updated;
                }
                return [reportObj, ...prevReports];
            });
            // --- Fetch AI insight for this report (if available) ---
            try {
                const res = await api.get(`/reports-ai/report/${newReportPayload.reportId}`);
                if (res.data && res.data.success && Array.isArray(res.data.data)) {
                    setAiInsights((prev) => [
                        ...res.data.data.filter(i => i.reportId === newReportPayload.reportId),
                        ...prev.filter(i => i.reportId !== newReportPayload.reportId)
                    ]);
                }
            } catch (err) {
                // Ignore if no AI insight
            }
        });

        socket.on('geofenceEvent', (payload) => {
            notify(`${payload.userName || 'A user'} has ${payload.status === 'outside' ? 'exited' : 'entered'} a zone.`, 'alert');
        });

        return () => {
            socket.emit('leaveEventRoom', selectedEventId);
            socket.off('locationUpdate');
            socket.off('liveReport');
            socket.off('notification');
            socket.off('geofenceEvent');
            socket.disconnect();
        };
    }, [selectedEventId, usingMockData, loading, notify]);

    const toggleManageZones = async () => {
        const nextState = !isManageZonesMode;
        setIsManageZonesMode(nextState);
        if (nextState) {
            setIsManageSpotsMode(false);
            setIsAddingSpotMode(false);
        } else {
            // Global auto-refresh: Fetch all Live Map data after closing Zone Manager
            await refreshLiveMapData();
        }
    };

    const toggleManageSpots = async () => {
        const nextState = !isManageSpotsMode;
        setIsManageSpotsMode(nextState);
        if (nextState) {
            setIsManageZonesMode(false);
            setIsAddingSpotMode(false);
        } else {
            // Global auto-refresh: Fetch all Live Map data after closing Spot Manager
            await refreshLiveMapData();
        }
    };
    

    // --- Global Live Map Refresh ---
    const refreshLiveMapData = async () => {
        if (selectedEventId) {
            // Refresh Zones
            const zonesResponse = await api.getVirtualAreas(selectedEventId);
            setZones(Array.isArray(zonesResponse) ? [...zonesResponse] : []);
            // Refresh Spots
            const spotsResponse = await api.getImportantSpots(selectedEventId);
            setSpots(Array.isArray(spotsResponse) ? [...spotsResponse] : []);
            // Tambahkan refresh lain jika perlu (misal participants, reports, dsb)
        }
    }

    // --- Zone Management Handlers ---
    const handleZoneCreated = (feature) => {
        // Validate that the drawn feature is a GeoJSON Polygon
        if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon' || !Array.isArray(feature.geometry.coordinates)) {
            notify('Invalid zone shape. Please draw a polygon area.', 'alert');
            return;
        }
        setTempZoneFeature(feature);
        setNewZoneName(`Zone ${zones.length + 1}`);
        setNewZoneColor(ZONE_COLORS[0].value);
        setIsZoneModalOpen(true);
        // --- Auto refresh all Live Map data after manage zone ---
        refreshLiveMapData();
    };

    const saveZone = async () => {
        if (!tempZoneFeature || !tempZoneFeature.geometry || tempZoneFeature.geometry.type !== 'Polygon' || !Array.isArray(tempZoneFeature.geometry.coordinates)) {
            notify('Invalid zone geometry. Please draw a valid polygon.', 'alert');
            return;
        }
        const areaData = { name: newZoneName, color: newZoneColor, area: tempZoneFeature.geometry };
        try {
            await api.createVirtualArea(selectedEventId, areaData);
            // Fetch zones again to get latest data from backend
            const zonesResponse = await api.getVirtualAreas(selectedEventId);
            setZones(zonesResponse);
            closeZoneModal();
        } catch (err) {
            console.error("Failed to save zone:", err);
            notify(`Failed to save zone: ${err.message}`, 'alert');
        }
    };

    const handleDeleteZone = async (zoneId) => {
        if(!confirm("Delete this zone?")) return;
        try {
            await api.deleteVirtualArea(zoneId);
            setZones(prev => prev.filter(z => z.id !== zoneId));
        } catch(err) {
            console.error(err);
            notify(`Failed to delete zone: ${err.message}`, 'alert');
        }
    };

    const handleUpdateZone = async (zoneId, updateData) => {
        try {
            // In a real app, this would be an API call: await api.updateVirtualArea(zoneId, updateData);
            setZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updateData } : z));
        } catch (err) {
            console.error(err);
        }
    };

    const closeZoneModal = async () => {
        setIsZoneModalOpen(false);
        // Global auto-refresh: Fetch all Live Map data after closing Zone modal
        await refreshLiveMapData();
    };

    // --- Spot Management Handlers ---
    const handleAddSpotRequest = () => {
        setIsAddingSpotMode(prev => !prev);
        if (!isAddingSpotMode) {
            notify('Click on the map to place a new spot.', 'info');
        }
    };

    const handleLocationSelectForSpot = (location) => {
        if (!isAddingSpotMode) return;
        setNewSpotData(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
            name: `Spot ${spots.length + 1}`
        }));
        setIsSpotModalOpen(true);
        setIsAddingSpotMode(false);
    };

    const saveSpot = async () => {
        try {
            await api.createImportantSpot(selectedEventId, newSpotData);
            // Fetch spots again to get latest data from backend
            const spotsResponse = await api.getImportantSpots(selectedEventId);
            setSpots(spotsResponse || []);
            closeSpotModal();
        } catch (err) {
            console.error(err);
            notify(`Failed to save spot: ${err.message}`, 'alert');
        }
    };

    const handleDeleteSpot = async (spotId) => {
        if(!confirm("Delete this spot?")) return;
        try {
            await api.deleteImportantSpot(spotId);
            setSpots(prev => prev.filter(s => s.id !== spotId));
        } catch(err) {
            console.error(err);
            notify(`Failed to delete spot: ${err.message}`, 'alert');
        }
    };

    const handleUpdateSpot = async (spotId, updateData) => {
        try {
            const updatedSpot = await api.updateImportantSpot(spotId, updateData);
            setSpots(prev => prev.map(s => s.id === spotId ? updatedSpot : s));
        } catch (err) {
            console.error(err);
            notify(`Failed to update spot: ${err.message}`, 'alert');
        }
    };

    const closeSpotModal = async () => {
        setIsSpotModalOpen(false);
        setNewSpotData({ name: '', type: 'OTHER', description: '', latitude: null, longitude: null });
        // Fetch spots again to restore map state after cancel
        if (selectedEventId) {
            const spotsResponse = await api.getImportantSpots(selectedEventId);
            setSpots(spotsResponse || []);
        }
    };

    // --- Filter Logic ---
    const filteredParticipants = useMemo(() => {
        if (!searchQuery) return participantLocations;
        return participantLocations.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [participantLocations, searchQuery]);

    const filteredReports = useMemo(() => {
        if (!searchQuery) return reports;
        return reports.filter(r => 
            r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            r.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [reports, searchQuery]);

    useEffect(() => {
        if (searchQuery && filteredParticipants.length === 1) {
            const p = filteredParticipants[0];
            mapRef.current?.flyTo(p.longitude, p.latitude);
        }
    }, [searchQuery, filteredParticipants]);

    const mapCenter = eventDetails ? [eventDetails.longitude, eventDetails.latitude] : null;
    // Use all participants for dashboard count (match ParticipantsPage)
    const activeParticipantsCount = participants.length;
    const openIncidentsCount = reports.filter(r => r.status !== 'RESOLVED').length;

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-950 text-black dark:text-slate-200 overflow-hidden relative">
            
            {isBroadcastModalOpen && <BroadcastModal zones={zones} onClose={() => setIsBroadcastModalOpen(false)} />}
            
            {/* Add Zone Modal */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm p-4">
                    <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 shadow-2xl rounded-xl p-6 animate-fadeIn">
                        <h3 className="text-lg font-bold text-black dark:text-white mb-4">Name Your Zone</h3>
                        <div className="space-y-4">
                            <input value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-black dark:text-white rounded-lg px-4 py-2" placeholder="Zone Name" />
                            <div className="flex gap-3">
                                {ZONE_COLORS.map(c => (
                                    <button key={c.value} onClick={() => setNewZoneColor(c.value)} className={`w-8 h-8 rounded-full ${newZoneColor === c.value ? 'ring-2 ring-black dark:ring-white' : ''}`} style={{backgroundColor: c.value}} />
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={closeZoneModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white rounded-lg">Cancel</button>
                            <button onClick={saveZone} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg">Save Zone</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Spot Creation Modal */}
            {isSpotModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-800 shadow-2xl rounded-xl p-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-black dark:text-white mb-4">Add Important Spot</h3>
                        <div className="space-y-4">
                            <input name="name" value={newSpotData.name} onChange={(e) => setNewSpotData({...newSpotData, name: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-black dark:text-white rounded-lg px-4 py-2" placeholder="Spot Name" />
                            <select name="type" value={newSpotData.type} onChange={(e) => setNewSpotData({...newSpotData, type: e.target.value})} className="w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-black dark:text-white rounded-lg px-4 py-2">
                                {Object.keys(SpotType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={closeSpotModal} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:text-black dark:hover:text-white rounded-lg">Cancel</button>
                            <button onClick={saveSpot} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg">Save Spot</button>
                        </div>
                    </div>
                </div>
            )}
            
            {selectedIncident && (
                <IncidentDetailModal
                    report={selectedIncident}
                    aiInsights={aiInsights.filter(i => i.reportId === selectedIncident.id)}
                    onClose={() => setSelectedIncident(null)}
                    onUpdate={(updated) => setReports(prev => prev.map(r => r.id === updated.id ? updated : r))}
                />
            )}
            {usingMockData && <div className="absolute top-0 w-full z-50 pointer-events-none"><MockDataBanner /></div>}

            <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-black dark:text-white tracking-tight">{eventDetails?.name || 'Loading...'}</h2>
                    <span className="text-[10px] text-green-600 dark:text-green-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                        <span className="w-1.5 h-1.5 bg-green-600 dark:bg-green-500 rounded-full animate-pulse"></span> Live Monitoring
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsBroadcastModalOpen(true)} 
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/20 transition-colors"
                    >
                        <MegaphoneIcon className="w-4 h-4"/> Broadcast
                    </button>
                    
                    <button 
                        onClick={toggleManageSpots} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isManageSpotsMode 
                                ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                        }`}
                    >
                        {isManageSpotsMode ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />} 
                        Manage Spots
                    </button>
                    
                    <button 
                        onClick={toggleManageZones} 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            isManageZonesMode 
                                ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20' 
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700'
                        }`}
                    >
                        {isManageZonesMode ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />} 
                        Manage Zones
                    </button>
                    
                    {/* Fixed Manage Status Dropdown - Single Element */}
                    <select
                        value={eventDetails?.status || 'UPCOMING'}
                        onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                                await api.updateEvent(selectedEventId, { status: newStatus });
                                setEventDetails((prev) => ({ ...prev, status: newStatus }));
                                notify(`Status updated to ${newStatus}!`);
                            } catch (err) {
                                notify('Failed to update status', 'alert');
                                console.error(err);
                            }
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-200 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                        style={{ minWidth: 140 }}
                    >
                        <option value="UPCOMING">Upcoming</option>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    
                    <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-1"></div>
                    
                    <div className="relative group">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" />
                        <input 
                            type="text" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder="Search..." 
                            className="bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm w-52 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                        />
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                <div className="w-full p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex gap-4 items-center">
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-black dark:text-white">Notifikasi Event</h2>
                        <div className="flex flex-col gap-2 mt-2">
                            {notifications.length === 0 ? (
                                <span className="text-gray-400 dark:text-slate-400 text-sm">Belum ada notifikasi.</span>
                            ) : notifications.slice(0,5).map((notif) => (
                                <div key={notif.id} className="bg-gray-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-black dark:text-white text-sm border-l-4 border-indigo-500">
                                    <div className="font-bold">{notif.title}</div>
                                    <div>{notif.message}</div>
                                    <div className="text-xs text-gray-400 dark:text-slate-400">{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
                    {[{ label: 'Participants', val: activeParticipantsCount, icon: UsersIcon, color: 'text-blue-600 dark:text-blue-500', bg: 'bg-blue-100 dark:bg-blue-500/10' },
                    { label: 'Open Incidents', val: openIncidentsCount, icon: ExclamationTriangleIcon, color: 'text-red-600 dark:text-red-500', bg: 'bg-red-100 dark:bg-red-500/10' },
                    { label: 'Density', val: 'Moderate', icon: SignalIcon, color: 'text-orange-600 dark:text-orange-500', bg: 'bg-orange-100 dark:bg-orange-500/10' },
                    { label: 'Active Zones', val: zones.length, icon: Square3Stack3DIcon, color: 'text-purple-600 dark:text-purple-500', bg: 'bg-purple-100 dark:bg-purple-500/10' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl flex items-start justify-between">
                            <div>
                                <div className="text-gray-500 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{stat.label}</div>
                                <div className="text-2xl font-bold text-black dark:text-white">{stat.val}</div>
                            </div>
                            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 flex gap-6 min-h-0 relative">
                    <div className="flex-grow bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 relative overflow-hidden flex flex-col">
                        {isManageZonesMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold animate-pulse">Drawing Mode Active</div>}
                        {isAddingSpotMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-green-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold animate-pulse">Click on Map to Add Spot</div>}

                        {!VITE_MAPBOX_TOKEN ? <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-500"><p>Mapbox Token Missing</p></div>
                        : loading || !mapCenter ? <div className="flex items-center justify-center h-full text-gray-500 dark:text-slate-500">Loading Map...</div>
                        : (
                            <>
                                <MapComponent
                                    key={JSON.stringify(zones) + JSON.stringify(spots) + isManageZonesMode + isManageSpotsMode}
                                    ref={mapRef}
                                    center={mapCenter}
                                    participantLocations={filteredParticipants}
                                    mapboxToken={VITE_MAPBOX_TOKEN}
                                    participantDisplayMode="dots"
                                    theme="auto"
                                    isManageZonesMode={isManageZonesMode}
                                    isAddingSpotMode={isAddingSpotMode}
                                    zones={zones}
                                    spots={spots}
                                    onZoneCreated={handleZoneCreated}
                                    onLocationSelect={handleLocationSelectForSpot}
                                />
                                {filteredParticipants.length === 0 && (
                                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 text-black dark:text-white px-4 py-2 rounded-lg shadow-lg text-left z-20 border border-indigo-600 max-w-xs pointer-events-none" style={{width: 'fit-content'}}>
                                        <div className="font-bold text-sm mb-1">Tidak ada peserta yang mengirimkan lokasi</div>
                                        <div className="text-xs text-gray-700 dark:text-slate-300">Pastikan peserta mengupdate lokasi mereka melalui aplikasi.</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {isManageZonesMode && <ZoneSidebar zones={zones} onDelete={handleDeleteZone} onUpdate={handleUpdateZone} onClose={toggleManageZones} />}
                    {isManageSpotsMode && <SpotSidebar spots={spots} onDelete={handleDeleteSpot} onUpdate={handleUpdateSpot} onClose={toggleManageSpots} onAddRequest={handleAddSpotRequest} isAddingSpot={isAddingSpotMode} />}

                    {!isManageZonesMode && !isManageSpotsMode && (
                        <div className="w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-slate-800"><h3 className="font-bold text-black dark:text-white">Incident Feed</h3></div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <IncidentFeed
                                    reports={filteredReports}
                                    onIncidentSelect={(report) => {
                                        mapRef.current?.flyTo(report.longitude, report.latitude);
                                        setSelectedIncident(report);
                                    }}
                                />
                                {/* AI Insight for selected incident */}
                                {selectedIncident && aiInsights.filter(i => i.reportId === selectedIncident.id).length > 0 && (
                                    <div className="mt-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-black dark:text-white">
                                        <h4 className="font-bold mb-2">AI Insight</h4>
                                        {aiInsights.filter(i => i.reportId === selectedIncident.id).map((insight) => (
                                            <div key={insight.id} className="mb-2">
                                                <div className="text-xs text-gray-700 dark:text-slate-300">Model: {insight.meta?.model || 'AI'}</div>
                                                <div>{insight.aiPayload?.insight || '-'}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;