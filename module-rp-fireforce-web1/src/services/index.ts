import { apiService, ApiResponse } from './apiService';
import { auditService } from './auditService';
import type { 
  User, 
  LoginCredentials, 
  LoginResponse,
  Incident,
  IncidentComment,
  CreateIncidentData,
  CreateCommentData
} from '../types';

// Re-export for convenience
export type { User, LoginCredentials, LoginResponse, Incident, IncidentComment };
export { auditService };

// Auth service methods
export const authService = {
  /**
   * Login user with email and password
   * API: POST /api/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await apiService.post<any>('/api/auth/login', credentials);
      
      console.log('📥 Login response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.httpStatus === 'OK' && apiData.data) {
        const userData = apiData.data; // This is the user object directly
        
        // Store auth token (or use a fallback if empty)
        const token = userData.token || 'temp-auth-token';
        apiService.setAuthToken(token);
        localStorage.setItem('authToken', token);
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userId', userData.id);
        localStorage.setItem('userEmail', userData.email);
        localStorage.setItem('isAuthenticated', 'true');
        
        console.log('✅ Login successful - stored user data:', userData);
        
        return {
          data: userData,
          success: true,
          status: 200,
          message: apiData.message,
        };
      } else {
        const errorMessage = apiData?.message || 'Login failed';
        console.error('❌ Login failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      
      if (error.response) {
        const errorData = error.response.data;
        throw {
          message: errorData?.message || error.message || 'Invalid email or password',
          status: error.response.status,
          data: errorData,
        };
      }
      
      throw {
        message: error.message || 'Failed to login',
        status: error.status || 500,
        data: error.data,
      };
    }
  },

  logout: (): void => {
    apiService.removeAuthToken();
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
  },

  isAuthenticated: (): boolean => {
    const isAuth = localStorage.getItem('isAuthenticated');
    const token = localStorage.getItem('authToken');
    return isAuth === 'true' && !!token;
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  },
};

// Incident service methods
export const incidentService = {
  /**
   * Get all incidents
   * API: GET /api/incidents
   */
  getAllIncidents: async (): Promise<ApiResponse<Incident[]>> => {
    try {
      const response = await apiService.get<any>('/api/incidents');
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: [],
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get incidents error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch incidents',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get incident by ID
   * API: GET /api/incidents/select?incidentId={id}
   */
  getIncidentById: async (incidentId: string): Promise<ApiResponse<Incident>> => {
    try {
      const response = await apiService.get<any>(`/api/incidents/select?incidentId=${incidentId}`);
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      throw new Error('Incident not found');
    } catch (error: any) {
      console.error('❌ Get incident error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch incident',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Create new incident
   * API: POST /api/incidents
   */
  createIncident: async (data: CreateIncidentData): Promise<ApiResponse<Incident>> => {
    try {
      const response = await apiService.post<any>('/api/incidents', data);
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      throw new Error('Failed to create incident');
    } catch (error: any) {
      console.error('❌ Create incident error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to create incident',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Update incident status
   * API: PUT /api/incidents/{id}/status
   */
  updateIncidentStatus: async (incidentId: string, newStatus: string, resolvedBy?: string): Promise<ApiResponse<Incident>> => {
    try {
      const response = await apiService.put<any>(
        '/api/incidents-status',
        { incidentId, newStatus, resolvedBy }
      );
      const apiData = response.data;
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      throw new Error('Failed to update incident status');
    } catch (error: any) {
      console.error('❌ Update incident status error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to update incident status',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Respond to incident (acknowledge, escalate, assign)
   * API: POST /api/incidents/respond
   */
  respondToIncident: async (data: { incidentId: string; action: string; userId: string }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.post<any>('/api/incidents/respond', data);
      const apiData = response.data;
      
      if (apiData) {
        return {
          data: apiData.data || apiData,
          success: true,
          status: 200,
          message: apiData.message || 'Incident response recorded successfully'
        };
      }
      
      throw new Error('Failed to respond to incident');
    } catch (error: any) {
      console.error('❌ Respond to incident error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to respond to incident',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Resolve incident
   * API: POST /api/incidents/{id}/resolve
   */
  resolveIncident: async (incidentId: string, data: { resolvedBy: string; resolution: string }): Promise<ApiResponse<Incident>> => {
    try {
      const response = await apiService.post<any>(`/api/incidents/${incidentId}/resolve`, {
        incidentId,
        ...data
      });
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
          message: apiData.message || 'Incident resolved successfully'
        };
      }
      
      throw new Error('Failed to resolve incident');
    } catch (error: any) {
      console.error('❌ Resolve incident error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to resolve incident',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get comments for an incident
   * API: GET /api/incidents-comment?incidentId={id}
   */
  getIncidentComments: async (incidentId: string): Promise<ApiResponse<IncidentComment[]>> => {
    try {
      const response = await apiService.get<any>(`/api/incidents-comment?incidentId=${incidentId}`);
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: [],
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get comments error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to get comments',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Post a comment to an incident
   * API: POST /api/incidents-comment
   */
  postIncidentComment: async (data: CreateCommentData): Promise<ApiResponse<IncidentComment>> => {
    try {
      const response = await apiService.post<any>('/api/incidents-comment', data);
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      throw new Error('Failed to post comment');
    } catch (error: any) {
      console.error('❌ Post comment error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to post comment',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get incident statistics
   * API: GET /api/incidents/stats?timeframe={timeframe}
   * @param timeframe - Options: '24h', '7d', '30d', '90d', '1y', 'all'
   */
  getIncidentStats: async (timeframe: string = '24h'): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/incidents/stats?timeframe=${timeframe}`);
      
      console.log('📊 Get stats response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.httpStatus === 'OK' && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
          message: apiData.message,
        };
      }
      
      return {
        data: {
          total: 0,
          open: 0,
          investigating: 0,
          resolved: 0,
          severities: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        },
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get stats error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch stats',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },
};

// Comment service methods
export const commentService = {
  /**
   * Get comments for an incident
   * API: GET /api/incidents-comment?incidentId={id}
   */
  getIncidentComments: async (incidentId: string): Promise<ApiResponse<IncidentComment[]>> => {
    try {
      const response = await apiService.get<any>(`/api/incidents-comment?incidentId=${incidentId}`);
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: [],
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get comments error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch comments',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Post a comment to an incident
   * API: POST /api/incidents-comment
   */
  postIncidentComment: async (data: CreateCommentData): Promise<ApiResponse<IncidentComment>> => {
    try {
      const response = await apiService.post<any>('/api/incidents-comment', data);
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      throw new Error('Failed to post comment');
    } catch (error: any) {
      console.error('❌ Post comment error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to post comment',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },
};

// Stats service methods
export const statsService = {
  /**
   * Get incident statistics
   * API: GET /api/incidents/stats?timeframe={timeframe}
   */
  getIncidentStats: async (timeframe: string = '24h'): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/incidents/stats?timeframe=${timeframe}`);
      
      console.log('📊 Get stats response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: {},
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get stats error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch stats',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },
};

// On-Call service methods
export const onCallService = {
  /**
   * Get all teams
   * API: GET /api/oncall/teams
   */
  getTeams: async (): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiService.get<any>('/api/oncall/teams');
      
      console.log('👥 Get teams response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.object) {
        return {
          data: apiData.object,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: [],
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get teams error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch teams',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get current on-call personnel for a team
   * API: GET /api/oncall/current?teamId={teamId}
   */
  getCurrentOnCall: async (teamId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/oncall/current?teamId=${teamId}`);
      
      console.log('🚨 Get current on-call response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.object) {
        return {
          data: apiData.object,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: null,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get current on-call error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch current on-call',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get on-call schedule for a team
   * API: GET /api/oncall/schedule?teamId={teamId}&days={days}
   */
  getSchedule: async (teamId: string, days: number = 7): Promise<ApiResponse<any[]>> => {
    try {
      const response = await apiService.get<any>(`/api/oncall/schedule?teamId=${teamId}&days=${days}`);
      
      console.log('📅 Get schedule response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.object && apiData.object.schedule) {
        return {
          data: apiData.object.schedule,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: [],
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get schedule error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch schedule',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get user's team
   * API: GET /api/oncall/user/team?userId={userId}
   */
  getUserTeam: async (userId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/oncall/user/team?userId=${userId}`);
      
      console.log('👤 Get user team response:', response);
      
      const apiData = response.data;
      
      if (apiData && apiData.data) {
        return {
          data: apiData.data,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: null,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get user team error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch user team',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Create on-call override
   * API: POST /api/oncall/override
   */
  createOverride: async (params: any): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.post<any>('/api/oncall/override', params);
      const apiData = response.data;
      
      console.log('✅ Create override response:', apiData);
      
      return {
        data: apiData.data || apiData,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Create override error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to create override',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Delete on-call override
   * API: DELETE /api/oncall/override/{overrideId}
   */
  deleteOverride: async (overrideId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.delete<any>(`/api/oncall/override/${overrideId}`);
      const apiData = response.data;
      
      console.log('🗑️ Delete override response:', apiData);
      
      return {
        data: apiData.data || apiData,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Delete override error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to delete override',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Create escalation
   * API: POST /api/oncall/escalate
   */
  createEscalation: async (params: any): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.post<any>('/api/oncall/escalate', params);
      const apiData = response.data;
      
      console.log('⬆️ Create escalation response:', apiData);
      
      return {
        data: apiData.data || apiData,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Create escalation error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to create escalation',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },
};

// Audit Trail service methods
export const auditTrailService = {
  /**
   * Get audit trail for a specific incident
   * API: GET /api/audit/incidents/{incidentId}/trail
   */
  getIncidentAuditTrail: async (incidentId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/audit/incidents/${incidentId}/trail`);
      const apiData = response.data;
      
      if (apiData) {
        return {
          data: apiData,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: { audit_logs: [] },
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get audit trail error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch audit trail',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get notification history for an incident
   * API: GET /api/audit/incidents/{incidentId}/notifications
   */
  getIncidentNotifications: async (incidentId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/audit/incidents/${incidentId}/notifications`);
      const apiData = response.data;
      
      if (apiData) {
        return {
          data: apiData,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: { notifications: [] },
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get notifications error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch notifications',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },

  /**
   * Get full incident audit (comprehensive data)
   * API: GET /api/audit/incidents/{incidentId}/full
   */
  getFullIncidentAudit: async (incidentId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await apiService.get<any>(`/api/audit/incidents/${incidentId}/full`);
      const apiData = response.data;
      
      if (apiData) {
        return {
          data: apiData,
          success: true,
          status: 200,
        };
      }
      
      return {
        data: null,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get full audit error:', error);
      throw {
        message: error.response?.data?.message || error.message || 'Failed to fetch full audit',
        status: error.response?.status || 500,
        data: error.response?.data,
      };
    }
  },
};

// AI Analytics service methods
export const aiAnalyticsService = {
  /**
   * Get main AI dashboard overview
   * API: GET http://localhost:8000/analytics/dashboard
   */
  getDashboard: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('http://localhost:8000/analytics/dashboard');
      const data = await response.json();
      
      return {
        data,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get AI dashboard error:', error);
      return {
        data: null,
        success: false,
        status: 500,
      };
    }
  },

  /**
   * Get AI confidence metrics
   * API: GET http://localhost:8000/analytics/confidence
   */
  getConfidence: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('http://localhost:8000/analytics/confidence');
      const data = await response.json();
      
      return {
        data,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get AI confidence error:', error);
      return {
        data: null,
        success: false,
        status: 500,
      };
    }
  },

  /**
   * Get AI predictions and risk assessment
   * API: GET http://localhost:8000/analytics/predictions
   */
  getPredictions: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('http://localhost:8000/analytics/predictions');
      const data = await response.json();
      
      return {
        data,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get AI predictions error:', error);
      return {
        data: null,
        success: false,
        status: 500,
      };
    }
  },

  /**
   * Get service health scores
   * API: GET http://localhost:8000/analytics/services
   */
  getServices: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('http://localhost:8000/analytics/services');
      const data = await response.json();
      
      return {
        data,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get AI services error:', error);
      return {
        data: null,
        success: false,
        status: 500,
      };
    }
  },

  /**
   * Get time-based incident patterns
   * API: GET http://localhost:8000/analytics/time-patterns
   */
  getTimePatterns: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('http://localhost:8000/analytics/time-patterns');
      const data = await response.json();
      
      return {
        data,
        success: true,
        status: 200,
      };
    } catch (error: any) {
      console.error('❌ Get AI time patterns error:', error);
      return {
        data: null,
        success: false,
        status: 500,
      };
    }
  },
};

export default authService;
