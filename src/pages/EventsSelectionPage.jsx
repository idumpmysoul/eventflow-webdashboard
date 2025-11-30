import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';
import { CalendarIcon, MapPinIcon, UsersIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

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
        
        const eventsList = Array.isArray(response) ? response : [];
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto">
        {usingMockData && <div className="mb-6"><MockDataBanner /></div>}
        
        <header className="mb-12 flex justify-between items-end border-b border-slate-800 pb-6">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Select Event</h1>
                <p className="text-slate-400">Manage and monitor your assigned events.</p>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 hidden sm:block">
                  Logged in as <strong>{user?.name || user?.email}</strong>
                </span>
                <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                    Logout
                </button>
            </div>
        </header>

        {error && !usingMockData && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => (
            <div 
              key={event.id} 
              onClick={() => handleSelectEvent(event.id)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500/50 hover:bg-slate-800 transition-all cursor-pointer group relative overflow-hidden shadow-lg"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-slate-800 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-500 transition-colors`}>
                    <CalendarIcon className="w-6 h-6" />
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-900/30 text-green-400 border border-green-500/20">
                    LIVE
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors truncate">{event.name}</h3>
              
              <div className="space-y-2 text-sm text-slate-400 mb-6">
                <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4" />
                    {event.location || event.locationName || 'Unknown Location'}
                </div>
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4" />
                    {event.totalParticipants || 0} participants
                </div>
              </div>

              <div className="flex items-center text-indigo-400 font-medium text-sm group-hover:translate-x-1 transition-transform">
                Open Dashboard <ArrowRightIcon className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
          
          {/* Add New Event Placeholder */}
          <div className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all cursor-pointer min-h-[200px] hover:bg-slate-900/50">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 border border-slate-800">
                <span className="text-2xl">+</span>
            </div>
            <span>Create New Event</span>
          </div>
        </div>
      </div>
      <ThemeToggleButton />
    </div>
  );
};

export default EventsSelectionPage;
