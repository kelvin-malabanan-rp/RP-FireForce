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

// Audit Trail API Services
export const auditTrailService = {
  // Create audit log entry
  async createAuditLog(data) {
    try {
      const response = await apiRequest('/api/audit/logs', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response;
    } catch (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit logging shouldn't break main functionality
      return { success: false, error: error.message };
    }
  },

  // Get all audit logs with filtering
  async getAuditLogs(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.incidentId) queryParams.append('incidentId', params.incidentId);
      if (params.userId) queryParams.append('userId', params.userId);
      if (params.action) queryParams.append('action', params.action);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      
      const response = await apiRequest(`/api/audit/logs?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Get audit trail for a specific incident
  async getIncidentAuditTrail(incidentId) {
    const response = await apiRequest(`/api/audit/incidents/${incidentId}/trail`);
    return response;
  },

  // Get full incident audit (comprehensive data)
  async getFullIncidentAudit(incidentId) {
    const response = await apiRequest(`/api/audit/incidents/${incidentId}/full`);
    return response;
  },

  // Get notification history for an incident
  async getIncidentNotifications(incidentId) {
    try {
      const response = await apiRequest(`/api/audit/incidents/${incidentId}/notifications`);
      return response;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      return { success: false, notifications: [], error: error.message };
    }
  },

  // Record notification response
  async recordNotificationResponse(notificationId, responseData) {
    try {
      const response = await apiRequest(`/api/audit/notifications/${notificationId}/response`, {
        method: 'POST',
        body: JSON.stringify(responseData),
      });
      return response;
    } catch (error) {
      console.error('Error recording notification response:', error);
      return { success: false, error: error.message };
    }
  },

  // Get audit statistics
  async getAuditStatistics(incidentId = null) {
    try {
      const endpoint = incidentId 
        ? `/api/audit/incidents/${incidentId}/statistics`
        : '/api/audit/statistics';
      const response = await apiRequest(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching audit statistics:', error);
      return { success: false, data: {}, error: error.message };
    }
  },

  // Get all audit trail events with filters (general audit trail)
  async getAuditTrail(params = {}) {
    try {
      // If specific incident ID is provided, use the incident audit endpoint
      if (params.incidentId) {
        const response = await apiRequest(`/api/audit/incidents/${params.incidentId}/trail`);
        return transformAuditTrailResponse(response, params);
      }
      
      // For general audit trail, we need to aggregate from all incidents
      // First, get all incidents
      const incidentsResponse = await apiRequest('/api/incidents');
      const incidents = incidentsResponse.data || [];
      
      // Fetch audit trails for recent incidents (last 50 to avoid too many requests)
      const recentIncidents = incidents.slice(0, 50);
      
      // Fetch audit logs for each incident in parallel
      const auditPromises = recentIncidents.map(incident => 
        apiRequest(`/api/audit/incidents/${incident.id}/trail`)
          .then(response => ({
            ...response,
            incident: incident
          }))
          .catch(error => {
            console.warn(`Failed to fetch audit for incident ${incident.id}:`, error);
            return { audit_logs: [], incident };
          })
      );
      
      const auditResults = await Promise.all(auditPromises);
      
      // Combine all audit logs
      let allAuditLogs = [];
      auditResults.forEach(result => {
        if (result.audit_logs && Array.isArray(result.audit_logs)) {
          // Add incident info to each log
          const logsWithIncident = result.audit_logs.map(log => ({
            ...log,
            incident_id: result.incident?.id || log.incident_id,
            incident_title: result.incident?.title || log.incident_title,
            incident_severity: result.incident?.severity || log.incident_severity,
          }));
          allAuditLogs = allAuditLogs.concat(logsWithIncident);
        }
      });
      
      // Sort by created_at descending (most recent first)
      allAuditLogs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      // Apply filters
      let filteredLogs = allAuditLogs;
      
      if (params.eventType) {
        filteredLogs = filteredLogs.filter(log => 
          mapActionToEventType(log.action) === params.eventType
        );
      }
      
      if (params.severity) {
        filteredLogs = filteredLogs.filter(log => 
          log.incident_severity === params.severity
        );
      }
      
      if (params.userId) {
        filteredLogs = filteredLogs.filter(log => 
          log.user_id === params.userId
        );
      }
      
      if (params.searchQuery) {
        const query = params.searchQuery.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.action?.toLowerCase().includes(query) ||
          log.first_name?.toLowerCase().includes(query) ||
          log.last_name?.toLowerCase().includes(query) ||
          log.email?.toLowerCase().includes(query) ||
          log.incident_title?.toLowerCase().includes(query)
        );
      }
      
      if (params.startDate) {
        const startDate = new Date(params.startDate);
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.created_at) >= startDate
        );
      }
      
      if (params.endDate) {
        const endDate = new Date(params.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.created_at) <= endDate
        );
      }
      
      // Apply pagination
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
      
      // Transform to frontend format
      return transformAuditTrailResponse({
        success: true,
        count: filteredLogs.length,
        audit_logs: paginatedLogs,
      }, params, filteredLogs.length);
      
    } catch (error) {
      console.error('Error fetching general audit trail:', error);
      // Fallback to mock data
      console.warn('Using mock data as fallback');
      return getMockAuditTrailData(params);
    }
  },

  // Export incident audit trail as CSV
  async exportIncidentAuditCSV(incidentId) {
    try {
      const response = await fetch(`${BASE_URL}/api/audit/incidents/${incidentId}/export/csv`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `incident-${incidentId}-audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      throw error;
    }
  },

  // Export general audit trail (with filters)
  async exportAuditTrail(params = {}) {
    try {
      // If specific incident, use incident export endpoint
      if (params.incidentId) {
        return await this.exportIncidentAuditCSV(params.incidentId);
      }
      
      // For general export, fetch all data and create CSV manually
      // since the backend might not have a general export endpoint yet
      const allParams = {
        ...params,
        page: 1,
        limit: 10000, // Get many records for export
      };
      
      const response = await this.getAuditTrail(allParams);
      
      if (response.success && response.data?.events) {
        return exportEventsAsCSV(response.data.events);
      }
      
      throw new Error('Failed to fetch audit trail data for export');
    } catch (error) {
      console.error('Error exporting audit trail:', error);
      // Fallback: export mock data as CSV
      return exportMockDataAsCSV(params);
    }
  },

  // Get audit trail statistics
  async getAuditStats(timeframe = '7days') {
    try {
      const response = await apiRequest(`/api/audit-trail/stats?timeframe=${timeframe}`);
      return response.data || {};
    } catch (error) {
      console.warn('Audit stats API not available:', error);
      return {};
    }
  },

  // Log new audit trail entry (if needed for frontend actions)
  async logAuditEvent(data) {
    return await apiRequest('/api/audit-trail/log', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Transform backend audit trail response to frontend format
function transformAuditTrailResponse(backendResponse, params = {}, totalCount = null) {
  // If it's already in the correct format, return as is
  if (backendResponse.data?.events) {
    return backendResponse;
  }

  // Transform from backend format to frontend format
  const auditLogs = backendResponse.audit_logs || backendResponse.data?.audit_logs || [];
  
  const events = auditLogs.map(log => ({
    id: log.id,
    eventType: mapActionToEventType(log.action),
    timestamp: log.created_at,
    user: {
      id: log.user_id,
      name: `${log.first_name || ''} ${log.last_name || ''}`.trim() || 'System',
      email: log.email || '',
    },
    incident: log.incident_id ? {
      id: log.incident_id,
      title: log.incident_title || 'Unknown Incident',
      severity: log.incident_severity || 'medium',
    } : null,
    notificationType: extractNotificationType(log.details),
    severity: log.incident_severity || extractSeverity(log.details),
    channelId: extractChannelId(log.details),
    deliveryStatus: extractDeliveryStatus(log.action),
    responseStatus: extractResponseStatus(log.action),
    responseTime: extractResponseTime(log.details),
    metadata: parseDetails(log.details),
    ipAddress: log.ip_address || '',
    userAgent: log.user_agent || '',
  }));

  // Calculate pagination
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || 20;
  const total = totalCount !== null ? totalCount : (backendResponse.count || events.length);
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data: {
      events: events,
      pagination: {
        total: total,
        page: page,
        limit: limit,
        totalPages: totalPages,
      },
    },
  };
}

// Helper functions for transformation
function mapActionToEventType(action) {
  const mapping = {
    'incident_created': 'alert_sent',
    'incident_acknowledged': 'acknowledged',
    'user_acknowledge': 'acknowledged',
    'incident_resolved': 'resolved',
    'user_resolve': 'resolved',
    'incident_escalated': 'escalated',
    'escalation_created': 'escalated',
    'comment_added': 'comment_added',
    'status_changed': 'alert_sent',
    'notification_sent': 'alert_sent',
  };
  
  return mapping[action] || action;
}

function extractNotificationType(details) {
  const parsed = parseDetails(details);
  return parsed?.notificationType || parsed?.notification_type || null;
}

function extractSeverity(details) {
  const parsed = parseDetails(details);
  return parsed?.severity || 'medium';
}

function extractChannelId(details) {
  const parsed = parseDetails(details);
  return parsed?.channelId || parsed?.channel_id || null;
}

function extractDeliveryStatus(action) {
  if (action.includes('notification') || action.includes('sent')) return 'delivered';
  if (action.includes('failed')) return 'failed';
  return null;
}

function extractResponseStatus(action) {
  if (action.includes('acknowledge')) return 'acknowledged';
  if (action.includes('resolve')) return 'resolved';
  if (action.includes('decline')) return 'declined';
  return 'pending';
}

function extractResponseTime(details) {
  const parsed = parseDetails(details);
  return parsed?.responseTime || parsed?.response_time || null;
}

function parseDetails(details) {
  if (!details) return {};
  if (typeof details === 'object') return details;
  
  try {
    return JSON.parse(details);
  } catch {
    return {};
  }
}

// Export events array as CSV
function exportEventsAsCSV(events) {
  const csvHeaders = 'Timestamp,Type,Action,User,Email,Incident,Incident ID,Severity,Delivery Status,Response Status,Response Time,IP Address\n';
  const csvRows = events.map(event => {
    return [
      event.timestamp,
      event.eventType,
      event.eventType.replace(/_/g, ' '),
      event.user?.name || 'System',
      event.user?.email || '',
      event.incident?.title || '',
      event.incident?.id || '',
      event.severity || '',
      event.deliveryStatus || '',
      event.responseStatus || '',
      event.responseTime ? `${event.responseTime}s` : '',
      event.ipAddress || '',
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
  }).join('\n');
  
  const csv = csvHeaders + csvRows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return { success: true, message: 'Export completed successfully' };
}

// Export mock data as CSV
function exportMockDataAsCSV(params) {
  const mockData = getMockAuditTrailData(params);
  const events = mockData.data.events;
  
  const csvHeaders = 'Timestamp,Type,Action,User,Email,Incident,Severity,Delivery Status,Response Status,IP Address\n';
  const csvRows = events.map(event => {
    return [
      event.timestamp,
      event.eventType,
      event.eventType.replace(/_/g, ' '),
      event.user.name,
      event.user.email,
      event.incident?.title || '',
      event.severity || '',
      event.deliveryStatus || '',
      event.responseStatus || '',
      event.ipAddress || '',
    ].map(val => `"${val}"`).join(',');
  }).join('\n');
  
  const csv = csvHeaders + csvRows;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  
  return { success: true, data: csv };
}

// Mock data function for development
function getMockAuditTrailData(params = {}) {
  const mockEvents = [
    {
      id: 'audit-1',
      eventType: 'alert_sent',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      user: {
        id: 'user-4',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
      },
      incident: {
        id: 'incident-123',
        title: 'Database Connection Pool Exhausted',
        severity: 'critical',
      },
      notificationType: 'push',
      severity: 'critical',
      channelId: 'critical-alerts-v4',
      deliveryStatus: 'delivered',
      responseStatus: 'pending',
      responseTime: null,
      metadata: {
        token: 'ExpoToken[xxx]',
        title: 'CRITICAL: Database Down',
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mobile App/iOS',
    },
    {
      id: 'audit-2',
      eventType: 'acknowledged',
      timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
      user: {
        id: 'user-4',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      incident: {
        id: 'incident-123',
        title: 'Database Connection Pool Exhausted',
        severity: 'critical',
      },
      notificationType: null,
      severity: 'critical',
      channelId: null,
      deliveryStatus: null,
      responseStatus: 'acknowledged',
      responseTime: 120,
      metadata: {
        comment: 'Investigating now',
        action: 'acknowledged',
      },
      ipAddress: '192.168.1.100',
      userAgent: 'Mobile App/iOS',
    },
    {
      id: 'audit-3',
      eventType: 'escalated',
      timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      user: {
        id: 'user-2',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
      },
      incident: {
        id: 'incident-123',
        title: 'Database Connection Pool Exhausted',
        severity: 'critical',
      },
      notificationType: 'email',
      severity: 'high',
      channelId: 'high-priority-v4',
      deliveryStatus: 'sent',
      responseStatus: 'pending',
      responseTime: null,
      metadata: {
        escalationLevel: 2,
        reason: 'No resolution after 5 min',
      },
      ipAddress: 'system',
      userAgent: 'Backend Worker',
    },
    {
      id: 'audit-4',
      eventType: 'resolved',
      timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      user: {
        id: 'user-2',
        name: 'Sarah Chen',
        email: 'sarah.chen@example.com',
      },
      incident: {
        id: 'incident-123',
        title: 'Database Connection Pool Exhausted',
        severity: 'critical',
      },
      notificationType: null,
      severity: 'critical',
      channelId: null,
      deliveryStatus: null,
      responseStatus: 'resolved',
      responseTime: 900,
      metadata: {
        resolution: 'Increased connection pool limit',
        comment: 'Fixed by increasing max connections from 100 to 200',
      },
      ipAddress: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
    },
    {
      id: 'audit-5',
      eventType: 'alert_sent',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      user: {
        id: 'user-1',
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
      },
      incident: {
        id: 'incident-124',
        title: 'High Memory Usage on Web Server',
        severity: 'high',
      },
      notificationType: 'sms',
      severity: 'high',
      channelId: 'high-priority-v4',
      deliveryStatus: 'delivered',
      responseStatus: 'acknowledged',
      responseTime: 180,
      metadata: {
        phoneNumber: '+1-555-0199',
      },
      ipAddress: '192.168.1.150',
      userAgent: 'SMS Gateway',
    },
  ];

  // Apply filters
  let filteredEvents = [...mockEvents];
  
  if (params.eventType) {
    filteredEvents = filteredEvents.filter(e => e.eventType === params.eventType);
  }
  
  if (params.severity) {
    filteredEvents = filteredEvents.filter(e => e.severity === params.severity);
  }
  
  if (params.deliveryStatus) {
    filteredEvents = filteredEvents.filter(e => e.deliveryStatus === params.deliveryStatus);
  }

  // Pagination
  const page = params.page || 1;
  const limit = params.limit || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  return {
    success: true,
    data: {
      events: paginatedEvents,
      pagination: {
        total: filteredEvents.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(filteredEvents.length / limit),
      },
    },
  };
}

export default {
  incidents: incidentService,
  onCall: onCallService,
  auditTrail: auditTrailService,
};
