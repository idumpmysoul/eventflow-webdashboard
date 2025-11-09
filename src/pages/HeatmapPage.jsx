import React, { useEffect, useState } from 'react';
import { getEventDetails, getParticipantLocations } from '../services/mockApi.js';
import MapComponent from '../components/MapComponent.jsx';
import { Title, Subtitle } from '@tremor/react';
import { useTheme } from '../contexts/ThemeContext.jsx';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HeatmapPage = () => {
    const { theme } = useTheme();
    const [eventDetails, setEventDetails] = useState(null);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [eventData, locationsData] = await Promise.all([
                    getEventDetails(),
                    getParticipantLocations(),
                ]);
                setEventDetails(eventData);
                setParticipantLocations(locationsData);
            } catch (error) {
                console.error("Failed to fetch heatmap data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);
    
    const mapCenter = eventDetails ? [eventDetails.longitude, eventDetails.latitude] : null;

    return (
        <div className="h-full flex flex-col">
            <header className="p-6">
                <Title>Participant Heatmap</Title>
                <Subtitle>Visualization of crowd density across the event</Subtitle>
            </header>
            <main className="flex-grow p-6 pt-0">
                <div className="h-full w-full rounded-lg overflow-hidden">
                     { !VITE_MAPBOX_TOKEN ? (
                         <div className="w-full h-full flex items-center justify-center bg-background dark:bg-dark-background rounded-lg text-center p-4">
                           <p>Map is unavailable. <br />Please provide a VITE_MAPBOX_TOKEN in your environment configuration.</p>
                        </div>
                    ) : loading || !mapCenter ? (
                        <div className="w-full h-full flex items-center justify-center bg-background dark:bg-dark-background rounded-lg">
                           <p>Loading map data...</p>
                        </div>
                    ) : (
                        <MapComponent
                            center={mapCenter}
                            participantLocations={participantLocations}
                            mapboxToken={VITE_MAPBOX_TOKEN}
                            participantDisplayMode="heatmap"
                            theme={theme}
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default HeatmapPage;