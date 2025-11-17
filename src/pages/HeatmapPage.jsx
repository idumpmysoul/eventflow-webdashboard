
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import * as mockApi from '../services/mockApi.js';
import MapComponent from '../components/MapComponent.jsx';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { Title, Subtitle } from '@tremor/react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext.jsx';

const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const MOCK_DATA_TIMEOUT = 5000; // 5 seconds

const HeatmapPage = () => {
    const { theme } = useTheme();
    const { selectedEventId } = useAuth();
    const navigate = useNavigate();
    const [eventDetails, setEventDetails] = useState(null);
    const [participantLocations, setParticipantLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);

    const dataLoadedRef = useRef(false);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => { isMountedRef.current = false; };
    }, []);

    useEffect(() => {
        if (!selectedEventId) {
            navigate('/events');
            return;
        }
        
        dataLoadedRef.current = false;

        const loadMockData = async () => {
            if (dataLoadedRef.current || !isMountedRef.current) return;
            dataLoadedRef.current = true;
            console.warn("Falling back to mock heatmap data.");
            setUsingMockData(true);
            try {
                const [mockEvent, mockLocations] = await Promise.all([
                    mockApi.getEventDetails(),
                    mockApi.getParticipantLocations(),
                ]);
                if (isMountedRef.current) {
                    setEventDetails(mockEvent);
                    setParticipantLocations(mockLocations);
                }
            } catch (mockErr) {
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
                const [eventResponse, locationsResponse] = await Promise.all([
                    api.getEventById(selectedEventId),
                    api.getParticipantLocations(selectedEventId),
                ]);

                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                dataLoadedRef.current = true;

                setEventDetails(eventResponse.data || eventResponse);
                setParticipantLocations(locationsResponse.data || locationsResponse);
                setLoading(false);
            } catch (err) {
                if (dataLoadedRef.current || !isMountedRef.current) return;
                clearTimeout(timeoutId);
                console.error("Failed to fetch heatmap data:", err);
                setError(err.message);
                loadMockData();
            }
        };

        fetchData();
        return () => clearTimeout(timeoutId);
    }, [selectedEventId, navigate]);
    
    const mapCenter = eventDetails ? [eventDetails.longitude, eventDetails.latitude] : null;

    return (
        <div className="h-full flex flex-col">
            {usingMockData && <MockDataBanner />}
            <header className="p-6">
                <Title className='text-2xl'>Participant Heatmap</Title>
                <Subtitle>Crowd density visualization</Subtitle>
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
