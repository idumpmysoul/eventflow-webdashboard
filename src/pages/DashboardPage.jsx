
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import socket from '../services/socket.js';
import MapComponent from '../components/MapComponent.jsx';
import IncidentFeed from '../components/IncidentFeed.jsx';
import IncidentDetailModal from '../components/IncidentDetailModal.jsx';
import ZoneSidebar from '../components/ZoneSidebar.jsx';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { useAuth } from '../contexts/AuthContext';

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
    Square3Stack3DIcon
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
    
    // Data States
    const [eventDetails, setEventDetails] = useState(null);
    const [reports, setReports] = useState([]);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [zones, setZones] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState(null);
    
    // Zone Management States
    const [isManageZonesMode, setIsManageZonesMode] = useState(false);
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [tempZoneFeature, setTempZoneFeature] = useState(null);
    const [newZoneName, setNewZoneName] = useState('');
    const [newZoneColor, setNewZoneColor] = useState(ZONE_COLORS[0].value);

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

        const loadMockData = async () => {
            if (dataLoadedRef.current || !isMountedRef.current) return;
            dataLoadedRef.current = true;
            console.warn("API fetch failed or timed out, falling back to mock dashboard data.");
            setUsingMockData(true);
            try {
                const [mockEvent, mockReports, mockLocations, mockZones] = await Promise.all([
                    mockApi.getEventDetails(),
                    mockApi.getReports(),
                    mockApi.getParticipantLocations(),
                    mockApi.getVirtualAreas()
                ]);
                if (isMountedRef.current) {
                    setEventDetails(mockEvent);
                    setReports(mockReports);
                    setParticipantLocations(mockLocations);
                    setZones(mockZones || []);
                    setLoading(false);
                }
            } catch (mockErr) {
                console.error("Failed to load mock data:", mockErr);
                if (isMountedRef.current) {
                    setError("Live data failed and mock data could not be loaded.");
                    setLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(loadMockData, MOCK_DATA_TIMEOUT);

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setUsingMockData(false);
            try {
                const [eventResponse, reportsResponse, locationsResponse, zonesResponse] = await Promise.all([
                    api.getEventById(selectedEventId),
                    api.getReports(selectedEventId),
                    api.getParticipantLocations(selectedEventId),
                    api.getVirtualAreas(selectedEventId)
                ]);

                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                dataLoadedRef.current = true;
                
                setEventDetails(eventResponse);
                setReports(reportsResponse);
                setParticipantLocations(locationsResponse);
                setZones(zonesResponse);
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                console.error("Failed to fetch dashboard data:", err);
                loadMockData();
            }
        };

        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId]);

    // Fetch Notifications
    useEffect(() => {
        if(usingMockData) return;
        const fetchNotifs = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/user-notifications/me/unread-list`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
                });
                const data = await res.json();
                if (data.success) setNotifications(data.data.unreadNotifications || []);
            } catch (e) { console.error(e); }
        };
        fetchNotifs();
    }, [selectedEventId, usingMockData]);

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

        return () => {
            socket.emit('leaveEventRoom', selectedEventId);
            socket.off('locationUpdate');
            socket.off('liveReport');
            socket.disconnect();
        };
    }, [selectedEventId, usingMockData, loading]);

    // --- Zone Management Handlers ---
    const handleZoneCreated = (feature) => {
        setTempZoneFeature(feature);
        setNewZoneName(`Zone ${zones.length + 1}`);
        setNewZoneColor(ZONE_COLORS[0].value);
        setIsZoneModalOpen(true);
    };

    const saveZone = async () => {
        if (!tempZoneFeature) return;
        const areaData = {
            name: newZoneName,
            color: newZoneColor,
            area: tempZoneFeature.geometry 
        };
        try {
            let savedZone;
            if (usingMockData) {
                savedZone = await mockApi.createVirtualArea(selectedEventId, areaData);
            } else {
                savedZone = await api.createVirtualArea(selectedEventId, areaData);
            }
            setZones([...zones, savedZone]);
            closeZoneModal();
        } catch (err) {
            console.error("Failed to save zone:", err);
            alert("Failed to save zone. Please try again.");
        }
    };

    const handleDeleteZone = async (zoneId) => {
        if(!confirm("Delete this zone?")) return;
        try {
            if(!usingMockData) await api.deleteVirtualArea(zoneId);
            else await mockApi.deleteVirtualArea(zoneId);
            setZones(prev => prev.filter(z => z.id !== zoneId));
        } catch(err) {
            console.error(err);
            alert("Failed to delete zone");
        }
    };

    const handleUpdateZone = async (zoneId, updateData) => {
        // In a real app, you'd implement api.updateVirtualArea
        // For now, just update local state to reflect changes
        setZones(prev => prev.map(z => z.id === zoneId ? { ...z, ...updateData } : z));
    };

    const closeZoneModal = () => {
        setIsZoneModalOpen(false);
        setTempZoneFeature(null);
    };

    // Filter Logic
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

    // Effect to fly to searched item
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
            {/* Zone Creation Modal */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 shadow-2xl rounded-xl p-6 animate-fadeIn">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Zone</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-400">Zone Name</label>
                                <input 
                                    type="text"
                                    value={newZoneName}
                                    onChange={(e) => setNewZoneName(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none"
                                    placeholder="e.g. Main Stage"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-400">Zone Color</label>
                                <div className="flex gap-3">
                                    {ZONE_COLORS.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setNewZoneColor(color.value)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${newZoneColor === color.value ? 'border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button 
                                onClick={closeZoneModal}
                                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveZone}
                                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
                            >
                                Save Zone
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incident Detail Modal */}
            {selectedIncident && (
                <IncidentDetailModal 
                    report={selectedIncident} 
                    onClose={() => setSelectedIncident(null)}
                    onUpdate={(updated) => {
                        setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
                    }}
                />
            )}

            {usingMockData && <div className="absolute top-0 w-full z-50 pointer-events-none"><MockDataBanner /></div>}

            {/* Top Bar */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 z-20">
                <div className="flex flex-col">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
                        {eventDetails?.name || 'Loading...'}
                    </h2>
                    <span className="text-[10px] text-green-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
                         <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Live Monitoring
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Zone Toggle */}
                    <button 
                        onClick={() => setIsManageZonesMode(!isManageZonesMode)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isManageZonesMode ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'}`}
                    >
                        {isManageZonesMode ? <CheckIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
                        {isManageZonesMode ? 'Done Editing' : 'Manage Zones'}
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-2"></div>

                    {/* Search */}
                    <div className="relative group">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search map & feed..." 
                            className="bg-slate-950 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-64 text-slate-300 transition-all focus:w-72" 
                        />
                    </div>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button 
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="relative p-2 text-slate-400 hover:text-white transition-colors hover:bg-slate-800 rounded-full"
                        >
                            <BellIcon className="w-6 h-6" />
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {isNotificationOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                                <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Notifications</span>
                                    <button className="text-xs text-indigo-400 hover:text-indigo-300">Mark all read</button>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-4 text-center text-slate-500 text-sm">No new notifications</div>
                                    ) : (
                                        notifications.map((n) => (
                                            <div key={n.id} className="p-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors cursor-pointer">
                                                <p className="text-sm text-white font-medium">{n.title}</p>
                                                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
                    {[
                        { label: 'Active Participants', val: activeParticipantsCount, sub: '+12% vs last hr', icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Open Incidents', val: openIncidentsCount, sub: 'Requires attention', icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Crowd Density', val: 'Moderate', sub: 'Zone B peaking', icon: SignalIcon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                        { label: 'Active Zones', val: zones.length, sub: 'Geofenced areas', icon: Square3Stack3DIcon, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start justify-between hover:border-slate-700 transition-colors">
                            <div>
                                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">{stat.label}</div>
                                <div className="text-2xl font-bold text-white">{stat.val}</div>
                                <div className="text-xs text-slate-600 mt-1 font-medium">{stat.sub}</div>
                            </div>
                            <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex gap-6 min-h-0 relative">
                    {/* Map Section */}
                    <div className="flex-grow bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden shadow-inner group flex flex-col">
                        {isManageZonesMode && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-indigo-600 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-bold uppercase tracking-wide animate-pulse">
                                Drawing Mode Active
                            </div>
                        )}
                        
                        {!VITE_MAPBOX_TOKEN ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                                <ExclamationTriangleIcon className="w-12 h-12 mb-2 opacity-50" />
                                <p>Mapbox Token Missing</p>
                            </div>
                        ) : loading || !mapCenter ? (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
                                Initializing Map...
                            </div>
                        ) : (
                            <MapComponent
                                ref={mapRef}
                                center={mapCenter}
                                participantLocations={filteredParticipants}
                                mapboxToken={VITE_MAPBOX_TOKEN}
                                participantDisplayMode="dots"
                                theme="dark" 
                                isManageZonesMode={isManageZonesMode}
                                zones={zones}
                                onZoneCreated={handleZoneCreated}
                            />
                        )}
                    </div>

                    {/* Zone Sidebar Panel (Conditional) */}
                    {isManageZonesMode && (
                         <ZoneSidebar 
                            zones={zones} 
                            onDelete={handleDeleteZone} 
                            onUpdate={handleUpdateZone}
                            onClose={() => setIsManageZonesMode(false)}
                         />
                    )}

                    {/* Right Side Feed (Hidden if Zone Manager is open to save space, or stacked) */}
                    {!isManageZonesMode && (
                        <div className="w-96 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur z-10">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    Incident Feed
                                </h3>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                                    {filteredReports.length} Active
                                </span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            <IncidentFeed 
                                    reports={filteredReports} 
                                    onIncidentSelect={(report) => {
                                        mapRef.current?.flyTo(report.longitude, report.latitude);
                                        setSelectedIncident(report);
                                    }} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
