import React, { useEffect, useState, useRef } from 'react';
import { getEventDetails, getReports, getParticipantLocations } from '../services/mockApi.js';
import IncidentFeed from '../components/IncidentFeed.jsx';
import MapComponent from '../components/MapComponent.jsx';
import { Title, Subtitle } from '@tremor/react';
import { useTheme } from '../contexts/ThemeContext.jsx';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const DashboardPage = () => {
    const { theme } = useTheme();
    const [eventDetails, setEventDetails] = useState(null);
    const [reports, setReports] = useState([]);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const mapRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (!VITE_MAPBOX_TOKEN) {
                    console.error("Mapbox token is not configured. Please set VITE_MAPBOX_TOKEN in your .env file.");
                }
                setLoading(true);
                const [eventData, reportsData, locationsData] = await Promise.all([
                    getEventDetails(),
                    getReports(),
                    getParticipantLocations(),
                ]);
                setEventDetails(eventData);
                setReports(reportsData);
                setParticipantLocations(locationsData);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleIncidentSelect = (report) => {
        mapRef.current?.flyTo(report.longitude, report.latitude);
    };

    const mapCenter = eventDetails ? [eventDetails.longitude, eventDetails.latitude] : null;

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