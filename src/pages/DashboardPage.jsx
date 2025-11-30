import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import socket from '../services/socket.js';
import MapComponent from '../components/MapComponent.jsx';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

// Icons
import { 
    MapIcon, 
    UsersIcon, 
    ExclamationTriangleIcon, 
    ChartBarIcon, 
    Cog6ToothIcon,
    ShieldExclamationIcon,
    PencilIcon,
    CheckIcon,
    MagnifyingGlassIcon,
    BellIcon
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
    const { theme } = useTheme();
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    
    // Data States
    const [eventDetails, setEventDetails] = useState(null);
    const [reports, setReports] = useState([]);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [zones, setZones] = useState([]);
    
    // UI States
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    
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


    const handleIncidentSelect = (report) => {
        if (report.latitude && report.longitude) {
            mapRef.current?.flyTo(report.longitude, report.latitude);
        }
    };

    // --- Zone Management ---
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

    const closeZoneModal = () => {
        setIsZoneModalOpen(false);
        setTempZoneFeature(null);
    };

    const mapCenter = eventDetails ? [eventDetails.longitude, eventDetails.latitude] : null;

    // Derived Stats
    const activeParticipantsCount = participantLocations.length;
    const openIncidentsCount = reports.filter(r => r.status !== 'RESOLVED').length;

    return (
        <div className="h-full flex flex-col bg-slate-950 text-slate-200 overflow-hidden">
            {/* Zone Creation Modal */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="max-w-md w-full bg-slate-900 border border-slate-800 shadow-2xl rounded-xl p-6">
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

            {usingMockData && <div className="absolute top-0 w-full z-50"><MockDataBanner /></div>}

            {/* Top Bar */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        {eventDetails?.name || 'Loading...'}
                    </h2>
                    <span className="text-xs text-green-400 flex items-center gap-1">
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

                    <div className="h-6 w-px bg-slate-800"></div>

                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" placeholder="Search..." className="bg-slate-950 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-48 text-slate-300" />
                    </div>
                    <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                        <BellIcon className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
                    </button>
                </div>
            </header>

            <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
                    {[
                        { label: 'Active Participants', val: activeParticipantsCount, icon: UsersIcon, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                        { label: 'Open Incidents', val: openIncidentsCount, icon: ExclamationTriangleIcon, color: 'text-red-500', bg: 'bg-red-500/10' },
                        { label: 'Active Zones', val: zones.length, icon: MapIcon, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                        { label: 'System Status', val: 'Optimal', icon: Cog6ToothIcon, color: 'text-green-500', bg: 'bg-green-500/10' },
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="text-slate-500 text-xs uppercase font-medium tracking-wider">{stat.label}</div>
                                <div className="text-2xl font-bold text-white mt-1">{stat.val}</div>
                            </div>
                            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex gap-6 min-h-0">
                    {/* Map Section */}
                    <div className="flex-[3] bg-slate-900 rounded-xl border border-slate-800 relative overflow-hidden shadow-inner">
                        {isManageZonesMode && (
                            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600/90 text-white px-4 py-1.5 rounded-full shadow-lg text-xs font-medium backdrop-blur-sm animate-fadeIn">
                                Drawing Mode Active: Use the tool in top-right
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
                                Loading Map...
                            </div>
                        ) : (
                            <MapComponent
                                ref={mapRef}
                                center={mapCenter}
                                participantLocations={participantLocations}
                                mapboxToken={VITE_MAPBOX_TOKEN}
                                participantDisplayMode="dots"
                                theme="dark" // Force dark theme for this dashboard style
                                isManageZonesMode={isManageZonesMode}
                                zones={zones}
                                onZoneCreated={handleZoneCreated}
                            />
                        )}
                    </div>

                    {/* Right Side Feed */}
                    <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden min-w-[300px]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
                                Live Alerts
                            </h3>
                            <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">REAL-TIME</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {reports.length === 0 ? (
                                <div className="text-center text-slate-500 py-10 text-sm">No incidents reported yet.</div>
                            ) : (
                                reports.map((report) => (
                                    <div 
                                        key={report.id} 
                                        onClick={() => handleIncidentSelect(report)}
                                        className="group bg-slate-950 border-l-2 border-red-500 p-3 rounded-r-lg hover:bg-slate-800 transition-all cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase tracking-wide">
                                                {report.category}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-slate-200 mb-1 line-clamp-2 group-hover:text-white">
                                            {report.description}
                                        </div>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-800/50">
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <UsersIcon className="w-3 h-3" /> {report.reporterName || 'Unknown'}
                                            </span>
                                            <span className={`text-[10px] ${report.status === 'RESOLVED' ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {report.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
