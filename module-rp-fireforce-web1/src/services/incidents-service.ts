// services/incident-service.ts - WEB VERSION
import { apiService } from './apiService';

// You'll need to adjust these imports based on your actual type definitions
// If these don't exist, you can remove them or create simple interfaces
interface Incident {
    id: string;
    title: string;
    description?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: string;
    timestamp: string;
    location?: string;
    reported_by?: string;
}

interface IncidentComment {
    id: string;
    incident_id: string;
    user_id: string;
    comment: string;
    created_at: string;
}

interface CreateIncidentData {
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    reportedBy: string;
    notifyUsers?: string[];
}

interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
    status: number;
}

// ==================== INCIDENTS ====================

/**
 * Get all incidents
 */
export const getAllIncidents = async () => {
    try {
        const response = await apiService.get('/api/incidents');
        return response;
    } catch (error) {
        console.error("Get incidents error:", error);
        throw error;
    }
};

/**
 * Get incident statistics
 */
export const getAllIncidentStats = async (timeframe: string = '24h') => {
    try {
        const response = await apiService.get(`/api/incidents/stats?timeframe=${timeframe}`);
        return response;
    } catch (error) {
        console.error("Get incident stats error:", error);
        throw error;
    }
};

/**
 * Get incident by ID
 */
export const getIncidentById = async (incidentId: string) => {
    try {
        const response = await apiService.get(`/api/incidents/select?incidentId=${incidentId}`);
        return response;
    } catch (error) {
        console.error("Get incident error:", error);
        throw error;
    }
};

/**
 * Create new incident
 */
export const createIncident = async (data: CreateIncidentData) => {
    try {
        const response = await apiService.post('/api/incidents', data);
        return response;
    } catch (error) {
        console.error("Error Creating Incident:", error);
        throw error;
    }
};

/**
 * Update incident status
 */
export const updateIncidentStatus = async (
    incidentId: string,
    newStatus: string,
    resolvedBy?: string
) => {
    try {
        const response = await apiService.put('/api/incidents-status', {
            incidentId,
            newStatus,
            resolvedBy
        });
        return response;
    } catch (error) {
        console.error("Error updating incident status:", error);
        throw error;
    }
};

/**
 * Resolve incident
 */
export const resolveIncident = async (
    incidentId: string,
    resolvedBy?: string
) => {
    try {
        const response = await apiService.post(`/api/incidents/${incidentId}/resolve`, {
            incidentId,
            resolvedBy
        });
        return response;
    } catch (error) {
        console.error("Error resolving incident:", error);
        throw error;
    }
};

/**
 * Respond to incident (Acknowledge or Escalate)
 * NEW: This is what the GlobalAlertModal and IncidentDetailsPage need
 */
export const respondToIncident = async (data: {
    incidentId: string;
    action: 'acknowledge' | 'escalate';
    userId: string;
    reason?: string;
}) => {
    try {
        const response = await apiService.post('/api/incidents/respond', data);
        return response;
    } catch (error) {
        console.error("Error responding to incident:", error);
        throw error;
    }
};

// ==================== COMMENTS ====================

/**
 * Post incident comment
 */
export const postIncidentComment = async (data: {
    incidentId: string;
    userId: string;
    comment: string;
}) => {
    try {
        const response = await apiService.post('/api/incidents-comment', data);
        return response;
    } catch (error) {
        console.error("Error posting comment:", error);
        throw error;
    }
};

/**
 * Get all incident comments
 */
export const getIncidentComments = async (incidentId: string) => {
    try {
        const response = await apiService.get(`/api/incidents-comment?incidentId=${incidentId}`);
        return response;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
};

// ==================== SERVICE OBJECT ====================

/**
 * Unified incident service object
 * This is what you import in your components
 */
export const incidentService = {
    // Incidents
    getAllIncidents,
    getAllIncidentStats,
    getIncidentById,
    createIncident,
    updateIncidentStatus,
    resolveIncident,
    respondToIncident, // NEW - for acknowledge/escalate with reason

    // Comments
    postIncidentComment,
    getIncidentComments,
};

// Default export
export default incidentService;