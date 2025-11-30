
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import * as mockApi from '../services/mockApi.js';
import MockDataBanner from '../components/MockDataBanner.jsx';
import ThemeToggleButton from '../components/ThemeToggleButton.jsx';
import MapComponent from '../components/MapComponent.jsx';
import { 
    CalendarIcon, 
    MapPinIcon, 
    UsersIcon, 
    ArrowRightIcon,
    XMarkIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const MOCK_DATA_TIMEOUT = 5000;
const VITE_MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const generateJoinCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const EventsSelectionPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const navigate = useNavigate();
  const { user, selectEvent, logout } = useAuth();
  
  // --- Create Event Modal State ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
      name: '',
      description: '',
      startDate: '',
      startTime: '',
      endDate: '',
      endTime: '',
      locationName: '',
      latitude: null,
      longitude: null
  });
  const [createdEventCode, setCreatedEventCode] = useState(null);
  const mapRef = useRef(null); // Ref for map resizing
  
  const dataLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  // --- Init & Fetch Events ---
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    dataLoadedRef.current = false;
    const loadMockData = async () => {
        if (dataLoadedRef.current || !isMountedRef.current) return;
        dataLoadedRef.current = true;
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
        setEvents(Array.isArray(response) ? response : []);
        setLoading(false);
      } catch (err) {
        if (dataLoadedRef.current || !isMountedRef.current) return;
        clearTimeout(timeoutId);
        setError(err.message);
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
    try { await api.logoutUser(); } catch (error) { console.error(error); }
    logout();
    navigate('/login');
  };

  // --- Wizard Handlers ---
  const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationSelect = (location) => {
      setFormData(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude
      }));
  };

  const nextStep = () => {
      if (currentStep === 1) {
          if (!formData.name || !formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime || !formData.locationName) {
              alert("Please fill in all required fields.");
              return;
          }
          setCurrentStep(2);
          // Timeout to allow modal render before map resize
          setTimeout(() => mapRef.current?.resize(), 100); 
      } else if (currentStep === 2) {
          if (!formData.latitude || !formData.longitude) {
              alert("Please pin a location on the map.");
              return;
          }
          setCurrentStep(3);
      }
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmitEvent = async () => {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      
      if (endDateTime <= startDateTime) {
          alert("End time must be after start time.");
          return;
      }

      const joinCode = generateJoinCode();
      const payload = {
          name: formData.name,
          description: formData.description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          locationName: formData.locationName,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          joinCode: joinCode
      };

      try {
          setLoading(true);
          // If using mock, simulate success
          if (usingMockData) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              console.log("Mock Event Created:", payload);
          } else {
              await api.createEvent(payload); // Assuming api.createEvent is implemented
          }
          setCreatedEventCode(joinCode);
          setCurrentStep(4); // Success Step
          setLoading(false);
      } catch (err) {
          console.error("Failed to create event:", err);
          alert("Failed to create event: " + err.message);
          setLoading(false);
      }
  };

  const resetModal = () => {
      setIsCreateModalOpen(false);
      setCurrentStep(1);
      setFormData({
          name: '', description: '', startDate: '', startTime: '', endDate: '', endTime: '', locationName: '', latitude: null, longitude: null
      });
      setCreatedEventCode(null);
      // Refresh list
      if (!usingMockData) window.location.reload(); 
  };

  // --- Render Helpers ---
  if (loading && !isCreateModalOpen) {
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
    <div className="min-h-screen bg-slate-950 p-6 md:p-12 font-sans text-slate-200 relative">
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
                    <span className="truncate">{event.location || event.locationName || 'Unknown Location'}</span>
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
          
          {/* Create New Event Card */}
          <div 
            onClick={() => setIsCreateModalOpen(true)}
            className="border border-dashed border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all cursor-pointer min-h-[200px] hover:bg-slate-900/50"
          >
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center mb-3 border border-slate-800">
                <span className="text-2xl">+</span>
            </div>
            <span>Create New Event</span>
          </div>
        </div>
      </div>

      {/* --- CREATE EVENT MODAL --- */}
      {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                      <div>
                          <h2 className="text-xl font-bold text-white">Create New Event</h2>
                          <p className="text-sm text-slate-400">Step {currentStep} of 3</p>
                      </div>
                      <button onClick={resetModal} className="text-slate-400 hover:text-white">
                          <XMarkIcon className="w-6 h-6" />
                      </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                      {currentStep === 1 && (
                          <div className="space-y-4">
                              <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Event Name</label>
                                  <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Summer Music Festival" />
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Event details..." />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
                                      <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-400 mb-1">Start Time</label>
                                      <input type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
                                      <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-400 mb-1">End Time</label>
                                      <input type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" />
                                  </div>
                              </div>
                              <div>
                                  <label className="block text-sm font-medium text-slate-400 mb-1">Location Name</label>
                                  <input name="locationName" value={formData.locationName} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="e.g. Central Park, Gate A" />
                              </div>
                          </div>
                      )}

                      {currentStep === 2 && (
                          <div className="h-full flex flex-col">
                              <div className="mb-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 p-3 rounded-lg text-sm">
                                  Click on the map to pin the exact event location.
                              </div>
                              <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border border-slate-700 relative">
                                  <MapComponent 
                                    ref={mapRef}
                                    mapboxToken={VITE_MAPBOX_TOKEN}
                                    onLocationSelect={handleLocationSelect}
                                    initialSelection={formData.latitude ? { latitude: formData.latitude, longitude: formData.longitude } : null}
                                    theme="dark"
                                  />
                              </div>
                              {formData.latitude && (
                                  <p className="mt-2 text-sm text-green-400 flex items-center gap-2">
                                      <CheckCircleIcon className="w-4 h-4" /> Location Selected: {formData.latitude.toFixed(5)}, {formData.longitude.toFixed(5)}
                                  </p>
                              )}
                          </div>
                      )}

                      {currentStep === 3 && (
                          <div className="space-y-6">
                              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                  <h3 className="text-lg font-bold text-white mb-2">{formData.name}</h3>
                                  <p className="text-slate-400 text-sm mb-4">{formData.description}</p>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                          <span className="block text-slate-500 text-xs uppercase">Starts</span>
                                          <span className="text-white">{formData.startDate} at {formData.startTime}</span>
                                      </div>
                                      <div>
                                          <span className="block text-slate-500 text-xs uppercase">Ends</span>
                                          <span className="text-white">{formData.endDate} at {formData.endTime}</span>
                                      </div>
                                      <div className="col-span-2">
                                          <span className="block text-slate-500 text-xs uppercase">Location</span>
                                          <span className="text-white">{formData.locationName}</span>
                                          <div className="text-xs text-slate-500">({formData.latitude}, {formData.longitude})</div>
                                      </div>
                                  </div>
                              </div>
                              <div className="text-center">
                                  <p className="text-sm text-slate-400">Ready to launch? A unique join code will be generated.</p>
                              </div>
                          </div>
                      )}

                      {currentStep === 4 && (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
                                  <CheckCircleIcon className="w-10 h-10 text-white" />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">Event Created Successfully!</h3>
                              <p className="text-slate-400 mb-8">Share this code with your team to join the event.</p>
                              
                              <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-xs mb-8">
                                  <span className="block text-xs text-slate-500 uppercase tracking-widest mb-2">Join Code</span>
                                  <div className="text-4xl font-mono font-bold text-indigo-400 tracking-wider">
                                      {createdEventCode}
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-6 border-t border-slate-800 flex justify-between">
                      {currentStep < 4 && (
                          <button 
                            onClick={prevStep} 
                            disabled={currentStep === 1}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${currentStep === 1 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:text-white hover:bg-slate-800'}`}
                          >
                              Back
                          </button>
                      )}
                      
                      {currentStep < 3 && (
                          <button 
                            onClick={nextStep}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-indigo-600/20"
                          >
                              Next Step
                          </button>
                      )}

                      {currentStep === 3 && (
                          <button 
                            onClick={handleSubmitEvent}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-green-600/20 flex items-center gap-2"
                          >
                              {loading ? 'Creating...' : 'Launch Event'}
                          </button>
                      )}

                      {currentStep === 4 && (
                          <button 
                            onClick={resetModal}
                            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-indigo-600/20"
                          >
                              Go to Dashboard
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      <ThemeToggleButton />
    </div>
  );
};

export default EventsSelectionPage;
