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
    const [notifications, setNotifications] = useState([]);
    
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
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                console.error("Failed to fetch dashboard data:", err);
                setError(err.message);
                setLoading(false); // Even on error, stop loading
            }
        };

        fetchData();
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

        socket.on('liveReport', (newReportPayload) => {
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
        });
        
        socket.on('geofenceEvent', (payload) => {
            notify(`${payload.userName || 'A user'} has ${payload.status === 'outside' ? 'exited' : 'entered'} a zone.`, 'alert');
        });

        return () => {
            socket.emit('leaveEventRoom', selectedEventId);
            socket.off('locationUpdate');
            socket.off('liveReport');
            socket.off('geofenceEvent');
            socket.disconnect();
        };
    }, [selectedEventId, usingMockData, loading, notify]);

    // --- Zone Management Handlers ---
    const handleZoneCreated = (feature) => {
        setTempZoneFeature(feature);
        setNewZoneName(`Zone ${zones.length + 1}`);
        setNewZoneColor(ZONE_COLORS[0].value);
        setIsZoneModalOpen(true);
    };

    const saveZone = async () => {
        if (!tempZoneFeature) return;
        const areaData = { name: newZoneName, color: newZoneColor, area: tempZoneFeature.geometry };
        try {
            const savedZone = await api.createVirtualArea(selectedEventId, areaData);
            setZones([...zones, savedZone]);
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

    const closeZoneModal = () => {
        setIsZoneModalOpen(false);
        setTempZoneFeature(null);
    };

    // --- Spot Management Handlers ---
    const handleAddSpotRequest = () => {
        setIsAddingSpotMode(true);
        notify('Click on the map to place a new spot.', 'info');
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
            const savedSpot = await api.createImportantSpot(selectedEventId, newSpotData);
            setSpots(prev => [...prev, savedSpot]);
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

    const closeSpotModal = () => {
        setIsSpotModalOpen(false);
        setNewSpotData({ name: '', type: 'OTHER', description: '', latitude: null, longitude: null });
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
    const activeParticipantsCount = participantLocations.length;
    const openIncidentsCount = reports.filter(r => r.status !== 'RESOLVED').length;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden relative">
            
            {isBroadcastModalOpen && <BroadcastModal zones={zones} onClose={() => setIsBroadcastModalOpen(false)} />}
            
            {/* Spot Creation Modal */}
            {isSpotModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 shadow-2xl rounded-xl p-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-white mb-4">Add Important Spot</h3>
                        <div className="space-y-4">
                            <input name="name" value={newSpotData.name} onChange={(e) => setNewSpotData({...newSpotData, name: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2" placeholder="Spot Name" />
                            <select name="type" value={newSpotData.type} onChange={(e) => setNewSpotData({...newSpotData, type: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2">
                                {Object.keys(SpotType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={closeSpotModal} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg">Cancel</button>
                            <button onClick={saveSpot} className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg">Save Spot</button>
                        </div>
                    </div>
                </div>
            )}
            
            {selectedIncident && <IncidentDetailModal report={selectedIncident} onClose={() => setSelectedIncident(null)} onUpdate={(updated) => setReports(prev => prev.map(r => r.id === updated.id ? updated : r))} />}
            {usingMockData && <div className="absolute top-0 w-full z-50 pointer-events-none"><MockDataBanner /></div>}

            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white tracking-tight">{eventDetails?.name || 'Loading...'}</h2>
                    <span className="text-[10px] text-green-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Monitoring
                    </span>
                </div>

                <div className="flex items-center gap-3">
                     <button onClick={() => setIsBroadcastModalOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20">
                        <MegaphoneIcon className="w-4 h-4"/> Broadcast
                    </button>
                    <button onClick={() => setIsManageSpotsMode(!isManageSpotsMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isManageSpotsMode ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        {isManageSpotsMode ? <CheckIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />} Manage Spots
                    </button>
                    <button onClick={() => setIsManageZonesMode(!isManageZonesMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isManageZonesMode ? 'bg-green-500/10 text-green-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                        {isManageZonesMode ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />} Manage Zones
                    </button>
                    <div className="h-6 w-px bg-slate-800 mx-1"></div>
                    <div className="relative group">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="bg-slate-950 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm w-52" />
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
                    {[{ label: 'Participants', val: activeParticipantsCount, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                      { label: 'Open Incidents', val: openIncidentsCount, icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
                      { label: 'Density', val: 'Moderate', icon: SignalIcon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                      { label: 'Active Zones', val: zones.length, icon: Square3Stack3DIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start justify-between">
                            <div>
                                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{stat.label}</div>
                                <div className="text-2xl font-bold text-white">{stat.val}</div>
                            </div>
                            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}><stat.icon className="w-5 h-5" /></div>
                        </div>
                    ))}
                </div>

                <div className="flex-1 flex gap-6 min-h-0 relative">
                    <div className="flex-grow bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden flex flex-col">
                        {isManageZonesMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold animate-pulse">Drawing Mode Active</div>}
                        {isAddingSpotMode && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-green-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold animate-pulse">Click on Map to Add Spot</div>}

                        {!VITE_MAPBOX_TOKEN ? <div className="flex items-center justify-center h-full text-slate-500"><p>Mapbox Token Missing</p></div>
                        : loading || !mapCenter ? <div className="flex items-center justify-center h-full text-slate-500">Loading Map...</div>
                        : <MapComponent ref={mapRef} center={mapCenter} participantLocations={filteredParticipants} mapboxToken={VITE_MAPBOX_TOKEN} participantDisplayMode="dots" theme="dark" isManageZonesMode={isManageZonesMode} isAddingSpotMode={isAddingSpotMode} zones={zones} spots={spots} onZoneCreated={handleZoneCreated} onLocationSelect={handleLocationSelectForSpot} />}
                    </div>

                    {isManageZonesMode && <ZoneSidebar zones={zones} onDelete={handleDeleteZone} onUpdate={handleUpdateZone} onClose={() => setIsManageZonesMode(false)} />}
                    {isManageSpotsMode && <SpotSidebar spots={spots} onDelete={handleDeleteSpot} onUpdate={handleUpdateSpot} onClose={() => setIsManageSpotsMode(false)} onAddRequest={handleAddSpotRequest} />}

                    {!isManageZonesMode && !isManageSpotsMode && (
                        <div className="w-96 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-800"><h3 className="font-bold text-white">Incident Feed</h3></div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                                <IncidentFeed reports={filteredReports} onIncidentSelect={(report) => { mapRef.current?.flyTo(report.longitude, report.latitude); setSelectedIncident(report); }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;