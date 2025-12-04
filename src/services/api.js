
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
    // ============ ORGANIZER REGISTRATION ============
    async registerAsOrganizer({ name, email, password, phoneNumber }) {
      const res = await fetch(`${API_BASE}/auths/register-as-organizer`, {
        method: 'POST',
        headers: headers(false),
        body: JSON.stringify({ name, email, password, phoneNumber }),
      });
      return handleResponse(res);
    },
    // ============ AUTHENTICATION ============
    async loginUser(email, password) {
    const res = await fetch(`${API_BASE}/auths/login`, {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async registerUser(userData) {
    const res = await fetch(`${API_BASE}/auths/register`, {
      method: 'POST',
      headers: headers(false),
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  async logoutUser() {
    // Remove token and user data from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('selectedEventId');
    return Promise.resolve({ success: true });
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
  
  async createEvent(eventData) {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
          headers: headers(true),
          body: JSON.stringify(eventData)
        });
        return handleResponse(res);
      },
      
  async updateEvent(eventId, eventData) {
    const res = await fetch(`${API_BASE}/events/${eventId}`, {
      method: 'PATCH',
      headers: headers(true),
      body: JSON.stringify(eventData),
    });
    return handleResponse(res);
  },


  // ============ USER NOTIFICATION (INDIVIDUAL) ============
  async sendUserNotification({ userId, eventId, message, title, type = 'GENERAL' }) {
    // POST ke /user-notifications
    const res = await fetch(`${API_BASE}/user-notifications`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ userId, eventId, message, title, type }),
    });
    return handleResponse(res);
  },
  
  async finishEvent(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/finish`, {
      method: 'PATCH',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ VIRTUAL AREAS (ZONES) ============
  async getVirtualAreas(eventId) {
    // Match Backend: GET /virtual-area/:eventId/get-all
    const res = await fetch(`${API_BASE}/virtual-area/${eventId}/get-all`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  async createVirtualArea(eventId, areaData) {
    // Match Backend: POST /virtual-area/:id (id is eventId)
    const res = await fetch(`${API_BASE}/virtual-area/${eventId}`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(areaData),
    });
    return handleResponse(res);
  },

  async deleteVirtualArea(areaId) {
    // Match Backend: DELETE /virtual-area/:areaId
    const res = await fetch(`${API_BASE}/virtual-area/${areaId}`, {
      method: 'DELETE',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ PARTICIPANT LOCATIONS ============
  async getParticipantLocations(eventId) {
    // Match Backend: GET /locations/:eventId
    const res = await fetch(`${API_BASE}/locations/${eventId}`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ PARTICIPANTS ============
  async getEventParticipants(eventId) {
    // Match Backend: GET /event-participants/:eventId/get-list
    const res = await fetch(`${API_BASE}/event-participants/${eventId}/get-list`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ REPORTS ============
  async getReports(eventId) {
     // Match Backend: GET /reports/:id/my-reports
     const res = await fetch(`${API_BASE}/reports/${eventId}/my-reports`, {
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

  async updateReportStatus(reportId, status, adminNotes) {
    const res = await fetch(`${API_BASE}/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: headers(true),
        body: JSON.stringify({ status, adminNotes })
    });
    return handleResponse(res);
  },

  async broadcastReport(reportId, broadcastMessage, severity) {
      const res = await fetch(`${API_BASE}/reports/${reportId}/broadcast`, {
          method: 'POST',
          headers: headers(true),
          body: JSON.stringify({ broadcastMessage, severity })
      });
      return handleResponse(res);
  },
  
  // ============ IMPORTANT SPOTS ============
  async getImportantSpots(eventId) {
    const res = await fetch(`${API_BASE}/important-spots/event/${eventId}`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  async createImportantSpot(eventId, spotData) {
    const res = await fetch(`${API_BASE}/important-spots/${eventId}`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(spotData)
    });
    return handleResponse(res);
  },

  async updateImportantSpot(spotId, spotData) {
    const res = await fetch(`${API_BASE}/important-spots/update/${spotId}`, {
      method: 'PUT',
      headers: headers(true),
      body: JSON.stringify(spotData)
    });
    return handleResponse(res);
  },

  async deleteImportantSpot(spotId) {
    const res = await fetch(`${API_BASE}/important-spots/${spotId}`, {
      method: 'DELETE',
      headers: headers(true),
    });
    return handleResponse(res);
  },

  // ============ NOTIFICATIONS / BROADCAST ============
  async sendBroadcast(broadcastData) {
    const res = await fetch(`${API_BASE}/notifications/broadcast`, {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify(broadcastData)
    });
    return handleResponse(res);
  },

  async getReportAIResultsByReportId(reportId) {
    const res = await fetch(`${API_BASE}/reports-ai/report/${reportId}`, {
      method: 'GET',
      headers: headers(true),
    });
    return handleResponse(res);
  },
};

export default api;