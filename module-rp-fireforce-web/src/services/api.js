// API Configuration
const BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

// Generic API request handler
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Incident API Services
export const incidentService = {
  // Get all incidents
  async getAllIncidents() {
    const response = await apiRequest('/api/incidents');
    return response.data || [];
  },

  // Get incident statistics
  async getIncidentStats(timeframe = '24h') {
    const response = await apiRequest(`/api/incidents/stats?timeframe=${timeframe}`);
    return response.data || {};
  },

  // Get incident by ID
  async getIncidentById(incidentId) {
    const response = await apiRequest(`/api/incidents/select?incidentId=${incidentId}`);
    return response.data || null;
  },

  // Create new incident
  async createIncident(data) {
    return await apiRequest('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get incident comments
  async getIncidentComments(incidentId) {
    const response = await apiRequest(`/api/incidents-comment?incidentId=${incidentId}`);
    return response.data || [];
  },

  // Post incident comment
  async postIncidentComment(data) {
    return await apiRequest('/api/incidents-comment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update incident status
  async updateIncidentStatus(incidentId, status) {
    return await apiRequest(`/api/incidents/${incidentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

// On-Call API Services
export const onCallService = {
  // Get current on-call personnel for a team
  async getCurrentOnCall(teamId) {
    const response = await apiRequest(`/api/oncall/current?teamId=${teamId}`);
    return response.object || null;
  },

  // Get on-call schedule
  async getSchedule(teamId, days = 7) {
    const response = await apiRequest(`/api/oncall/schedule?teamId=${teamId}&days=${days}`);
    return response.object?.schedule || [];
  },

  // Get all teams
  async getTeams() {
    const response = await apiRequest('/api/oncall/teams');
    return response.object || [];
  },

  // Load all on-call data at once
  async loadAllOnCallData(teamId, days = 7) {
    try {
      const [currentOnCallRes, scheduleRes, teamsRes] = await Promise.all([
        apiRequest(`/api/oncall/current?teamId=${teamId}`).catch(() => ({ object: null })),
        apiRequest(`/api/oncall/schedule?teamId=${teamId}&days=${days}`).catch(() => ({ object: { schedule: [] } })),
        apiRequest('/api/oncall/teams').catch(() => ({ object: [] })),
      ]);

      return {
        currentOnCall: currentOnCallRes.object,
        schedule: scheduleRes.object?.schedule || [],
        teams: teamsRes.object || [],
      };
    } catch (error) {
      console.error('Error loading on-call data:', error);
      return {
        currentOnCall: null,
        schedule: [],
        teams: [],
      };
    }
  },

  // Create on-call override
  async createOverride(params) {
    return await apiRequest('/api/oncall/override', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Delete override
  async deleteOverride(overrideId) {
    return await apiRequest(`/api/oncall/override/${overrideId}`, {
      method: 'DELETE',
    });
  },

  // Create escalation
  async createEscalation(params) {
    return await apiRequest('/api/oncall/escalate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};

export default {
  incidents: incidentService,
  onCall: onCallService,
};
