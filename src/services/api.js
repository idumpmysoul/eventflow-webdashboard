
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getAuthToken = () => localStorage.getItem('authToken');

// Helper to extract data from backend response
const extractData = (response) => {
  return response.data !== undefined ? response.data : response;
};

const handleResponse = async (res) => {
  if (res.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedEventId');
    window.location.href = '#/login';
    throw new Error('Unauthorized - Please login again');
  }

  const json = await res.json().catch(() => ({ message: res.statusText }));

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${json.message || json.error || res.statusText}`);
  }

  // Handle backend response wrapper
  if (json.success === false) {
    throw new Error(json.message || json.error || 'API Error');
  }

  return extractData(json);
};

const headers = (includeAuth = true) => {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      h['Authorization'] = `Bearer ${token}`;
    }
  }
  return h;
};

const api = {
  // ============ AUTHENTICATION ============
  async loginUser(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async registerUser(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async logoutUser() {
    // Logout often doesn't return data, just success status
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: headers(true),
    });
    // We still verify response is OK
    if (res.status === 401 || res.ok) {
        return true;
    }
    return handleResponse(res);
  },

  // ============ EVENTS ============
  async getEvents() {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  async getEventById(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ VIRTUAL AREAS (ZONES) ============
  async getVirtualAreas(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/virtual-areas`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  async createVirtualArea(eventId, areaData) {
    const res = await fetch(`${API_BASE}/events/${eventId}/virtual-areas`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(areaData),
    });
    return handleResponse(res);
  },

  async deleteVirtualArea(areaId) {
    const res = await fetch(`${API_BASE}/events/virtual-areas/${areaId}`, {
      method: 'DELETE',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ PARTICIPANT LOCATIONS ============
  async getParticipantLocations(eventId) {
    // Endpoint: GET /events/:eventId/locations
    const res = await fetch(`${API_BASE}/events/${eventId}/locations`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ PARTICIPANTS ============
  async getEventParticipants(eventId) {
    // Endpoint: GET /events/:eventId/participants
    const res = await fetch(`${API_BASE}/events/${eventId}/participants`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ REPORTS ============
  async getReports(eventId) {
     // Endpoint: GET /reports/events/:eventId/reports
     const res = await fetch(`${API_BASE}/reports/events/${eventId}/reports`, {
        method: 'GET',
        headers: headers(true),
      });
    const reports = await handleResponse(res);
    
    // Ensure reports is an array before mapping
    if (Array.isArray(reports)) {
        return reports.map(report => ({
            ...report,
            createdAt: new Date(report.createdAt) // Ensure createdAt is a Date object
        }));
    }
    return [];
  },
};

export default api;