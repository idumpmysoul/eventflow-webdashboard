
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
import { Card, Title, Text, Grid, Col } from '@tremor/react';
import { FireIcon } from '@heroicons/react/24/solid';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';

const MOCK_DATA_TIMEOUT = 5000;

const EventsSelectionPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const navigate = useNavigate();
  const { user, selectEvent, logout } = useAuth();
  
  const dataLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    dataLoadedRef.current = false;

    const loadMockData = async () => {
        if (dataLoadedRef.current || !isMountedRef.current) return;
        dataLoadedRef.current = true;
        console.warn("Falling back to mock event data.");
        setUsingMockData(true);
        try {
            const mockEvents = await mockApi.getEvents();
            if (isMountedRef.current) setEvents(mockEvents);
        } catch (mockErr) {
            if (isMountedRef.current) setError(mockErr.message);
        } finally {
            if (isMountedRef.current) setLoading(false);
        }
    };

    const timeoutId = setTimeout(loadMockData, MOCK_DATA_TIMEOUT);

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      setUsingMockData(false);
      try {
        const response = await api.getEvents();
        if (dataLoadedRef.current || !isMountedRef.current) return;
        clearTimeout(timeoutId);
        dataLoadedRef.current = true;
        const eventsList = Array.isArray(response) ? response : response.data || [];
        setEvents(eventsList);
        setLoading(false);
      } catch (err) {
        if (dataLoadedRef.current || !isMountedRef.current) return;
        clearTimeout(timeoutId);
        setError(err.message);
        console.error('Error fetching events:', err);
        loadMockData();
      }
    };

    fetchEvents();
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSelectEvent = (eventId) => {
    selectEvent(eventId);
    navigate('/');
  };

  const handleLogout = async () => {
    try {
        await api.logoutUser();
    } catch (error) {
        console.error("Logout API call failed, logging out client-side.", error);
    } finally {
        logout();
        navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-dark-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground dark:text-dark-muted-foreground">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background">
    <div className="min-h-screen bg-background dark:bg-dark-background">
      {/* Header */}
      <div className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <FireIcon className="w-8 h-8 text-primary" />
             <div>
                <h1 className="text-2xl font-bold text-foreground dark:text-dark-foreground">EventFlow</h1>
                <p className="text-sm text-muted-foreground dark:text-dark-muted-foreground">Select an event to monitor</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground dark:text-dark-muted-foreground hidden sm:block">
              Welcome, <strong>{user?.name || user?.email || 'User'}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {usingMockData && <div className="mb-6"><MockDataBanner /></div>}
        {error && !usingMockData && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 rounded-lg">
            <p className="font-medium">Error loading events: {error}</p>
          </div>
        )}

        {events.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground dark:text-dark-muted-foreground">
              No events available at this time.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Title>Available Events</Title>
              <Text>Select an event to start monitoring</Text>
            </div>

            <Grid numItemsLg={3} numItemsMd={2} numItemsSm={1} className="gap-6">
              {events.map((event) => (
                <Col key={event.id}>
                  <Card
                    onClick={() => handleSelectEvent(event.id)}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200 group"
                  >
                    <div>
                      <Title className="text-lg group-hover:text-primary transition-colors">{event.name}</Title>
                      <Text className="mt-2 h-10">{event.description || 'No description available.'}</Text>
                      <div className="mt-4 space-y-2 text-sm">
                        <p className="text-muted-foreground dark:text-dark-muted-foreground">
                          📅 {new Date(event.startDate).toLocaleDateString()}
                        </p>
                        {event.location && (
                          <p className="text-muted-foreground dark:text-dark-muted-foreground">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectEvent(event.id); }}
                        className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-lg transition"
                      >
                        View Dashboard
                      </button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Grid>
          </>
        )}
      </div>
    </div>
    <ThemeToggleButton />
    </div>
  );
};

export default EventsSelectionPage;