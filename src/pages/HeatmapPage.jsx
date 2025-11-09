import React, { useEffect, useState } from 'react';
import { getEventDetails, getParticipantLocations } from '../services/mockApi.js';
import MapComponent from '../components/MapComponent.jsx';
import { Title, Subtitle } from '@tremor/react';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const HeatmapPage = () => {
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
                <div className="h-full w-full rounded-tremor-default overflow-hidden">
                     { !VITE_MAPBOX_TOKEN ? (
                         <div className="w-full h-full flex items-center justify-center bg-tremor-background-muted dark:bg-dark-tremor-background-muted rounded-tremor-default text-center p-4">
                           <p>Map is unavailable. <br />Please provide a VITE_MAPBOX_TOKEN in your environment configuration.</p>
                        </div>
                    ) : loading || !mapCenter ? (
                        <div className="w-full h-full flex items-center justify-center bg-tremor-background-muted dark:bg-dark-tremor-background-muted rounded-tremor-default">
                           <p>Loading map data...</p>
                        </div>
                    ) : (
                        <MapComponent
                            center={mapCenter}
                            participantLocations={participantLocations}
                            mapboxToken={VITE_MAPBOX_TOKEN}
                            participantDisplayMode="heatmap"
                        />
                    )}
                </div>
            </main>
        </div>
    );
};

export default HeatmapPage;