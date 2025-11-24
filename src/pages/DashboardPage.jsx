
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import socket from '../services/socket.js';
import IncidentFeed from '../components/IncidentFeed.jsx';
import MapComponent from '../components/MapComponent.jsx';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { Title, Subtitle, Button, Dialog, DialogPanel, TextInput, Card } from '@tremor/react';
import { PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

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

    // Redirect if no event selected
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
                }
            } catch (mockErr) {
                console.error("Failed to load mock data:", mockErr);
                if (isMountedRef.current) setError("Live data failed and mock data could not be loaded.");
            } finally {
                if (isMountedRef.current) setLoading(false);
            }
        };

        const timeoutId = setTimeout(loadMockData, MOCK_DATA_TIMEOUT);

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            setUsingMockData(false);
            try {
                if (!VITE_MAPBOX_TOKEN) console.error("Mapbox token is not configured.");
                
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
                // Don't set error immediately if we can fallback
                loadMockData();
            }
        };

        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId]);

    // Socket Connection
    useEffect(() => {
        if (usingMockData || !selectedEventId || loading) {
            return;
        }

        socket.connect();
        socket.emit('joinEventRoom', selectedEventId);

        // Handle location updates from backend
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

        // Handle live report updates (for immediate map marker)
        socket.on('liveReport', (newReportPayload) => {
             setReports((prevReports) => {
                 // Check if we need to update an existing report (e.g. status change) or add new
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
            area: tempZoneFeature.geometry // Ensure we save geometry
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

    if (error && !usingMockData) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <Title className="text-red-500">Error Loading Dashboard</Title>
                <Subtitle>Could not fetch data from the server.</Subtitle>
                <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col relative">
            {/* --- Creation Dialog --- */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <Card className="max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl rounded-xl p-6">
                        <Title className="text-xl mb-4">Create New Zone</Title>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Zone Name</label>
                                <TextInput 
                                    value={newZoneName}
                                    onChange={(e) => setNewZoneName(e.target.value)}
                                    placeholder="e.g. Main Stage"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Zone Color</label>
                                <div className="flex gap-3">
                                    {ZONE_COLORS.map((color) => (
                                        <button
                                            key={color.name}
                                            onClick={() => setNewZoneColor(color.value)}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${newZoneColor === color.value ? 'border-black dark:border-white scale-110' : 'border-transparent'}`}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-8">
                            <Button 
                                variant="secondary" 
                                color="gray"
                                onClick={closeZoneModal}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={saveZone}
                                color="blue"
                            >
                                Save Zone
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {usingMockData && <MockDataBanner />}
            
            <header className="p-6 flex justify-between items-center">
                <div>
                    <Title className='text-2xl'>{eventDetails?.name || 'Loading Event...'}</Title>
                    <Subtitle>Real-time Operations Dashboard</Subtitle>
                </div>
                
                {/* Manage Zones Toggle */}
                <div className="flex gap-2">
                    <Button 
                        icon={isManageZonesMode ? CheckIcon : PencilIcon}
                        color={isManageZonesMode ? "green" : "blue"}
                        variant={isManageZonesMode ? "primary" : "secondary"}
                        onClick={() => setIsManageZonesMode(!isManageZonesMode)}
                    >
                        {isManageZonesMode ? 'Done Editing' : 'Manage Zones'}
                    </Button>
                </div>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 pt-0 overflow-hidden">
                <aside className="lg:col-span-1 h-full overflow-hidden shadow-xl bg-card dark:bg-dark-card rounded-lg">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-card dark:bg-dark-card rounded-lg p-4 m-4">
                            <p>Loading incident feed...</p>
                        </div>
                    ) : (
                        <IncidentFeed reports={reports} onIncidentSelect={handleIncidentSelect} />
                    )}
                </aside>
                <main className="lg:col-span-2 h-full rounded-lg overflow-hidden shadow-xl relative">
                    {/* Help Text Overlay during Edit Mode */}
                    {isManageZonesMode && (
                        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium animate-pulse">
                            Click the polygon tool (top-right) to draw a zone. Double-click to finish.
                        </div>
                    )}

                    { !VITE_MAPBOX_TOKEN ? (
                            <div className="w-full h-full flex items-center justify-center bg-background dark:bg-dark-background rounded-lg text-center p-4">
                            <p>Map is unavailable. <br />Please provide a VITE_MAPBOX_TOKEN in your environment configuration.</p>
                        </div>
                    ) : loading || !mapCenter ? (
                        <div className="w-full h-full flex items-center justify-center bg-background dark:bg-dark-background rounded-lg">
                            <p>Loading map...</p>
                        </div>
                    ) : (
                        <MapComponent
                            ref={mapRef}
                            center={mapCenter}
                            participantLocations={participantLocations}
                            mapboxToken={VITE_MAPBOX_TOKEN}
                            participantDisplayMode="dots"
                            theme={theme}
                            isManageZonesMode={isManageZonesMode}
                            zones={zones}
                            onZoneCreated={handleZoneCreated}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;