// services/auditService.ts

const BASE_URL = 'https://incident-webhook-api.rapidresponse.workers.dev';

export interface CreateAuditLogPayload {
  action: string;
  incidentId?: string | null;
  userId?: string | null;
  description?: string;
  details: Record<string, any>;
  oldValue?: Record<string, any> | null;
  newValue?: Record<string, any> | null;
  metadata?: Record<string, any>;
}

export interface CreateAuditLogResponse {
  success: boolean;
  auditId: string;
  message: string;
}

export interface AuditLog {
  id: string;
  incident_id?: string;
  user_id?: string;
  user_name?: string;
  action: string;
  description?: string;
  details?: any;
  incident_title?: string;
  created_at: string;
}

export interface AuditStats {
  total_logs: number;
  unique_users: number;
  unique_incidents: number;
  action_breakdown: Record<string, number>;
  recent_activity_trend: number;
  top_users?: any[];
}

class AuditService {
  /**
   * Create a new audit log entry
   */
  async createAuditLog(payload: CreateAuditLogPayload): Promise<CreateAuditLogResponse> {
    try {
      const response = await fetch(`${BASE_URL}/api/audit/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to create audit log: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.httpStatus === 'OK') {
        return {
          success: true,
          auditId: result.data?.id || '',
          message: result.message || 'Audit log created successfully',
        };
      }

      throw new Error(result.message || 'Failed to create audit log');
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with optional filtering
   */
  async getAuditLogs(options: {
    limit?: number;
    offset?: number;
    incidentId?: string;
  } = {}): Promise<{ logs: AuditLog[]; total: number; limit?: number; offset?: number }> {
    try {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      if (options.incidentId) params.append('incidentId', options.incidentId);

      const response = await fetch(`${BASE_URL}/api/audit/logs?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.status}`);
      }

      const result = await response.json();

      // Match backend response structure
      if (result.httpStatus === 'OK' && result.data) {
        return {
          logs: result.data.logs || [],
          total: result.data.total || 0,
          limit: result.data.limit,
          offset: result.data.offset
        };
      }

      throw new Error(result.message || 'Failed to fetch audit logs');
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStats(startDate?: string, endDate?: string): Promise<AuditStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`${BASE_URL}/api/audit/stats?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch audit stats: ${response.status}`);
      }

      const result = await response.json();

      // Match backend response structure
      if (result.httpStatus === 'OK' && result.data) {
        return result.data;
      }

      throw new Error(result.message || 'Failed to fetch audit statistics');
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  }

  /**
   * Helper method to log incident creation
   */
  async logIncidentCreation(incident: any, userId: string, userName: string): Promise<void> {
    try {
      await this.createAuditLog({
        action: 'CREATE_INCIDENT',
        incidentId: incident.id,
        userId,
        description: `${userName} created incident "${incident.title}"`,
        details: {
          title: incident.title,
          severity: incident.severity,
          location: incident.location,
          createdFrom: 'web_app',
        },
        metadata: {
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to log incident creation:', error);
      // Don't throw - audit logging should not block the main operation
    }
  }

  /**
   * Helper method to log status updates
   */
  async logStatusUpdate(
    incident: any,
    oldStatus: string,
    newStatus: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action: 'UPDATE_STATUS',
        incidentId: incident.id,
        userId,
        description: `${userName} changed status from ${oldStatus} to ${newStatus}`,
        details: {
          title: incident.title,
          previousStatus: oldStatus,
          newStatus,
          severity: incident.severity,
          actionFrom: 'web_app',
        },
        oldValue: {
          status: oldStatus,
        },
        newValue: {
          status: newStatus,
        },
        metadata: {
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to log status update:', error);
    }
  }

  /**
   * Helper method to log incident acknowledgment
   */
  async logIncidentAcknowledgment(
    incident: any,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action: 'ACKNOWLEDGE_INCIDENT',
        incidentId: incident.id,
        userId,
        description: `${userName} acknowledged incident "${incident.title}"`,
        details: {
          title: incident.title,
          severity: incident.severity,
          previousStatus: incident.status,
          newStatus: 'Acknowledged',
          actionFrom: 'web_app',
        },
        oldValue: {
          status: incident.status,
        },
        newValue: {
          status: 'Acknowledged',
        },
        metadata: {
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to log incident acknowledgment:', error);
    }
  }

  /**
   * Helper method to log incident resolution
   */
  async logIncidentResolution(
    incident: any,
    userId: string,
    userName: string,
    resolution?: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action: 'RESOLVE_INCIDENT',
        incidentId: incident.id,
        userId,
        description: `${userName} resolved incident "${incident.title}"`,
        details: {
          title: incident.title,
          severity: incident.severity,
          previousStatus: incident.status,
          newStatus: 'Resolved',
          resolution: resolution || 'No resolution notes provided',
          actionFrom: 'web_app',
        },
        oldValue: {
          status: incident.status,
          resolved_by: null,
        },
        newValue: {
          status: 'Resolved',
          resolved_by: userName,
        },
        metadata: {
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to log incident resolution:', error);
    }
  }

  /**
   * Helper method to log incident escalation
   */
  async logIncidentEscalation(
    incident: any,
    oldLevel: number,
    newLevel: number,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action: 'ESCALATE_INCIDENT',
        incidentId: incident.id,
        userId,
        description: `${userName} escalated incident "${incident.title}" from level ${oldLevel} to level ${newLevel}`,
        details: {
          title: incident.title,
          severity: incident.severity,
          previousLevel: oldLevel,
          newLevel,
          actionFrom: 'web_app',
        },
        oldValue: {
          escalation_level: oldLevel,
        },
        newValue: {
          escalation_level: newLevel,
        },
        metadata: {
          platform: 'web',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.warn('Failed to log incident escalation:', error);
    }
  }

  /**
   * Helper method to log comment addition
   */
  async logCommentAdded(
    incident: any,
    comment: string,
    userId: string,
    userName: string
  ): Promise<void> {
    try {
      await this.createAuditLog({
        action: 'ADD_COMMENT',
        incidentId: incident.id,
        userId,
        description: `${userName} added a comment to incident "${incident.title}"`,
        details: {
          title: incident.title,
          comment: comment.substring(0, 100) + (comment.length > 100 ? '...' : ''),
          actionFrom: 'web_app',
        },
        metadata: {
          platform: 'web',
          timestamp: new Date().toISOString(),
          commentLength: comment.length,
        },
      });
    } catch (error) {
      console.warn('Failed to log comment addition:', error);
    }
  }
}

export const auditService = new AuditService();
export default auditService;
