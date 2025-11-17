import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import socket from '../services/socket.js';
import IncidentFeed from '../components/IncidentFeed.jsx';
import MapComponent from '../components/MapComponent.jsx';
import { Title, Subtitle } from '@tremor/react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DashboardPage = () => {
    const { theme } = useTheme();
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    
    const [eventDetails, setEventDetails] = useState(null);
    const [reports, setReports] = useState([]);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mapRef = useRef(null);

    // Redirect if no event selected
    useEffect(() => {
        if (!selectedEventId) {
            navigate('/events');
        }
    }, [selectedEventId, navigate]);

    useEffect(() => {
        if (!selectedEventId) return;

        let isMounted = true;

        const fetchData = async () => {
            try {
                if (!VITE_MAPBOX_TOKEN) {
                    console.error("Mapbox token is not configured.");
                }
                setLoading(true);
                const [eventResponse, reportsResponse, locationsResponse] = await Promise.all([
                    api.getEventById(selectedEventId),
                    api.getReports(selectedEventId),
                    api.getParticipantLocations(selectedEventId),
                ]);

                if (isMounted) {
                    setEventDetails(eventResponse.data || eventResponse);
                    setReports(reportsResponse.data || reportsResponse);
                    setParticipantLocations(locationsResponse.data || locationsResponse);
                    setError(null);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
                if (isMounted) setError(err.message);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();

        // Connect socket and listen for live updates
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
            // Prepend new report to the feed
             setReports((prevReports) => [{ ...newReport, createdAt: new Date(newReport.createdAt) }, ...prevReports]);
        });


        return () => {
            isMounted = false;
            socket.emit('leaveEventRoom', selectedEventId);
            socket.off('participantLocation');
            socket.off('notification');
            socket.disconnect();
        };
    }, [selectedEventId]);

    const handleIncidentSelect = (report) => {
        mapRef.current?.flyTo(report.longitude, report.latitude);
    };

    const mapCenter = eventDetails ? [eventDetails.longitude, eventDetails.latitude] : null;

    if (error) {
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
            <header className="p-6">
                <Title>{eventDetails?.name || 'Loading Event...'}</Title>
                <Subtitle>Real-time Operations Dashboard</Subtitle>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 pt-0 overflow-hidden">
                <aside className="lg:col-span-1 h-full overflow-hidden">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center bg-card dark:bg-dark-card rounded-lg p-4">
                           <p>Loading incident feed...</p>
                        </div>
                    ) : (
                        <IncidentFeed reports={reports} onIncidentSelect={handleIncidentSelect} />
                    )}
                </aside>
                <main className="lg:col-span-2 h-full rounded-lg overflow-hidden">
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
