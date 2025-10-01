import { BASE_URL_DEV } from "@/utils/backend-url";
import apiManager from "./api-manager";
import {
    CreateIncidentData,
    GetAllIncidentCommentsResponse,
    IncidentResponseApi,
    IncidentStatsResponse,
    PostIncidentComments,
    PostIncidentCommentsResponse, UpdateIncidentStatusResponse
} from "@/types/incident-types";
import {GetIncidentsByIdResponse, ResponseCreatedIncident} from "@/types";
import {ApiResponse} from "@/types/oncall-types";

// Get all incidents
export const getAllIncidents = async (): Promise<IncidentResponseApi> => {
  try {
    const response = await apiManager.get<IncidentResponseApi>(
        `${BASE_URL_DEV}/api/incidents`
    );
    return response.data;
  } catch (error) {
    console.error("Get incidents error:", error);
    throw error;
  }
};

// Get incident statistics
export const getAllIncidentStats = async (timeframe: string): Promise<{ data: IncidentStatsResponse }> => {
  try {
    const response = await apiManager.get<{ data: IncidentStatsResponse }>(
        `${BASE_URL_DEV}/api/incidents/stats?timeframe=${timeframe}`
    );
    return response.data;
  } catch (error) {
    console.error("Get incident stats error:", error);
    throw error;
  }
};

export const getIncidentById = async (
    incidentId: string
): Promise<GetIncidentsByIdResponse> => {
    try {
        const response = await apiManager.get<GetIncidentsByIdResponse>(
            `${BASE_URL_DEV}/api/incidents/select?incidentId=${incidentId}`
        );
        return response.data;
    } catch (error) {
        console.error("Get incident error:", error);
        throw error;
    }
};

// Create new incident
export const createIncident = async (
    data: CreateIncidentData
): Promise<ResponseCreatedIncident> => {
    try {
        const response = await apiManager.post<ResponseCreatedIncident>(
            `${BASE_URL_DEV}/api/incidents`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error Creating Incident: ", error);
        throw error;
    }
};


// Incident Comments
export const postIncidentComment = async (
    data: PostIncidentComments
): Promise<PostIncidentCommentsResponse> => {
    try {
        console.log('Posting to URL:', `${BASE_URL_DEV}/api/incidents-comment`);
        console.log('Payload being sent:', data);

        const response = await apiManager.post<PostIncidentCommentsResponse>(
            `${BASE_URL_DEV}/api/incidents-comment`,
            data
        );
        return response.data;
    } catch (error) {
        console.error("Error posting comment:", error);
        console.error("Full error:", JSON.stringify(error, null, 2));
        throw error;
    }
}

export const getAllIncidentComments = async (
    incidentId: string
): Promise<GetAllIncidentCommentsResponse> => {
    try {
        const response = await apiManager.get<GetAllIncidentCommentsResponse>(
            `${BASE_URL_DEV}/api/incidents-comment?incidentId=${incidentId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
}

export const updateIncidentStatus = async (
    data: {
        incidentId: string
        newStatus: string
        resolvedBy?: string
    }
): Promise<ApiResponse<{
    id: string;
    status: string;
    updatedAt: string;
    notifiedCount?: number;
    users?: Array<{ name: string; email: string }>;
}>> => {
    try {
        const response = await apiManager.put<ApiResponse<{
            id: string;
            status: string;
            updatedAt: string;
            notifiedCount?: number;
            users?: Array<{ name: string; email: string }>;
        }>>(
            `${BASE_URL_DEV}/api/incidents-status`,
            data
        );

        // Backend returns 'data' field, not 'object'
        if (!response.data.data && !response.data.object) {
            throw new Error('Failed to update incident status');
        }

        return response.data;
    } catch (error) {
        console.error("Error updating incident status:", error);
        throw error;
    }
}

export const resolveIncident = async (
    incidentId: string,
    resolvedBy: string | undefined
): Promise<{ notifiedCount: number; users: Array<{ name: string; email: string }> }> => {
    try {
        const response = await apiManager.post<ApiResponse<{ notifiedCount: number; users: Array<{ name: string; email: string }> }>>(
            `${BASE_URL_DEV}/api/incidents/${incidentId}/resolve`,
            { incidentId, resolvedBy }
        );

        if (!response.data.object) {
            throw new Error(response.data.error || response.data.message || 'Failed to resolve incident');
        }

        return response.data.object;
    } catch (error) {
        console.error("Error resolving incident:", error);
        throw error;
    }
}



