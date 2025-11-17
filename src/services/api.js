const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const getAuthToken = () => localStorage.getItem('authToken');

const handleResponse = async (res) => {
  if (res.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedEventId');
    window.location.href = '#/login';
    throw new Error('Unauthorized - Please login again');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(`HTTP ${res.status}: ${errorData.message || res.statusText}`);
  }

  return res.json();
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
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: headers(true),
    });
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

  // ============ PARTICIPANT LOCATIONS ============
  async getParticipantLocations(eventId) {
    const res = await fetch(`${API_BASE}/locations/event/${eventId}`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ PARTICIPANTS ============
  async getEventParticipants(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/participants`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ REPORTS ============
  async getReports(eventId) {
     const res = await fetch(`${API_BASE}/reports/event/${eventId}`, {
        method: 'GET',
        headers: headers(true),
      });
    const data = await handleResponse(res);
    // Assuming the API returns reports that need timestamps converted
    const reports = data.data || data;
    return reports.map(report => ({
        ...report,
        createdAt: new Date(report.createdAt) // Ensure createdAt is a Date object
    }));
  },
};

export default api;
