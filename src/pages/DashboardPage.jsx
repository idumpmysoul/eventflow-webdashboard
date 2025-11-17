
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import socket from '../services/socket.js';
import IncidentFeed from '../components/IncidentFeed.jsx';
import MapComponent from '../components/MapComponent.jsx';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { Title, Subtitle } from '@tremor/react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MOCK_DATA_TIMEOUT = 5000; // 5 seconds

const DashboardPage = () => {
    const { theme } = useTheme();
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    
    const [eventDetails, setEventDetails] = useState(null);
    const [reports, setReports] = useState([]);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);
    
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

    useEffect(() => {
        if (!selectedEventId) return;

        dataLoadedRef.current = false;

        const loadMockData = async () => {
            if (dataLoadedRef.current || !isMountedRef.current) return;
            dataLoadedRef.current = true;
            console.warn("API fetch failed or timed out, falling back to mock dashboard data.");
            setUsingMockData(true);
            try {
                const [mockEvent, mockReports, mockLocations] = await Promise.all([
                    mockApi.getEventDetails(),
                    mockApi.getReports(),
                    mockApi.getParticipantLocations(),
                ]);
                if (isMountedRef.current) {
                    setEventDetails(mockEvent);
                    setReports(mockReports);
                    setParticipantLocations(mockLocations);
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
                
                const [eventResponse, reportsResponse, locationsResponse] = await Promise.all([
                    api.getEventById(selectedEventId),
                    api.getReports(selectedEventId),
                    api.getParticipantLocations(selectedEventId),
                ]);

                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                dataLoadedRef.current = true;
                
                setEventDetails(eventResponse.data || eventResponse);
                setReports(reportsResponse.data || reportsResponse);
                setParticipantLocations(locationsResponse.data || locationsResponse);
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                console.error("Failed to fetch dashboard data:", err);
                setError(err.message);
                loadMockData();
            }
        };

        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId]);

    // Effect for handling socket connection separately
    useEffect(() => {
        if (usingMockData || !selectedEventId || loading) {
            return;
        }

        socket.connect();
        socket.emit('joinEventRoom', selectedEventId);

        socket.on('participantLocation', (newLocation) => {
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

        socket.on('notification', (newReport) => {
            setReports((prevReports) => [{ ...newReport, createdAt: new Date(newReport.createdAt) }, ...prevReports]);
        });

        return () => {
            socket.emit('leaveEventRoom', selectedEventId);
            socket.off('participantLocation');
            socket.off('notification');
            socket.disconnect();
        };
    }, [selectedEventId, usingMockData, loading]);


    const handleIncidentSelect = (report) => {
        mapRef.current?.flyTo(report.longitude, report.latitude);
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
        <div className="h-full flex flex-col">
            {usingMockData && <MockDataBanner />}
            <header className="p-6">
                <Title>{eventDetails?.name || 'Loading Event...'}</Title>
                <Subtitle>Real-time Operations Dashboard</Subtitle>
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
                <main className="lg:col-span-2 h-full rounded-lg overflow-hidden shadow-xl">
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
                        />
                    )}
                </main>
            </div>
        </div>
    );
};

export default DashboardPage;
