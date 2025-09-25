import { BASE_URL_DEV } from "@/utils/backend-url";
import {
    APIResponse,
    IncidentResponse,
    WrappedIncidentsResponse,
    WrappedIncidentByIdResponse, WrappedIncidentStatsResponse,
} from "@/types/response-types";
import apiManager from "./api-manager";
import {AllIncidents, CreateIncidentData, Incident, UpdateIncidentData} from "@/types/incident-types";

// Get all incidents
export const getIncidents = async (): Promise<WrappedIncidentsResponse> => {
  try {
    const timeframe: string = '24h'
    const response = await apiManager.get<WrappedIncidentsResponse>(
        `${BASE_URL_DEV}/api/incidents?timeframe=${timeframe}`
    );
    return response.data;
  } catch (error) {
    console.error("Get incidents error:", error);
    throw error;
  }
};

// Get incident by ID
export const getIncidentById = async (
    id: string
): Promise<WrappedIncidentByIdResponse> => {
  try {
    const response = await apiManager.get<WrappedIncidentByIdResponse>(
        `${BASE_URL_DEV}/api/incidents/${id}`
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
): Promise<WrappedIncidentByIdResponse> => {
  try {
    const response = await apiManager.post<WrappedIncidentByIdResponse>(
        `${BASE_URL_DEV}/api/incidents`,
        data
    );
    return response.data;
  } catch (error) {
    console.error("Create incident error:", error);
    throw error;
  }
};

// Update incident
export const updateIncident = async (
    id: string,
    data: UpdateIncidentData
): Promise<Incident> => {
  try {
    const response = await apiManager.put<Incident>(
        `${BASE_URL_DEV}/api/incidents/${id}`,
        data
    );
    return response.data;
  } catch (error) {
    console.error("Update incident error:", error);
    throw error;
  }
};

// Delete incident
export const deleteIncident = async (
    id: string
): Promise<void> => {
  try {
    const response = await apiManager.delete<void>(
        `${BASE_URL_DEV}/api/incidents/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Delete incident error:", error);
    throw error;
  }
};

// Get incidents by status
export const getIncidentsByStatus = async (
    status: string,
    timeframe: string = '24h'
): Promise<AllIncidents> => {
  try {
    const response = await apiManager.get<AllIncidents>(
        `${BASE_URL_DEV}/api/incidents?status=${status}&timeframe=${timeframe}`
    );
    return response.data;
  } catch (error) {
    console.error("Get incidents by status error:", error);
    throw error;
  }
};

// Get incident statistics
export const getIncidentStats = async (
    timeframe: string = '24h'
): Promise<WrappedIncidentStatsResponse> => {
  try {
    const response = await apiManager.get<WrappedIncidentStatsResponse>(
        `${BASE_URL_DEV}/api/incidents/stats?timeframe=${timeframe}`
    );
    return response.data;
  } catch (error) {
    console.error("Get incident stats error:", error);
    throw error;
  }
};

// Assign incident to user
export const assignIncident = async (
    id: string,
    userId: string
): Promise<APIResponse<IncidentResponse>> => {
  try {
    const response = await apiManager.put<APIResponse<IncidentResponse>>(
        `${BASE_URL_DEV}/v1/api/incidents/${id}`,
        { assigned_to: userId }
    );
    return response.data;
  } catch (error) {
    console.error("Assign incident error:", error);
    throw error;
  }
};

// Resolve incident
export const resolveIncident = async (
    id: string,
    resolvedBy: string
): Promise<APIResponse<IncidentResponse>> => {
  try {
    const response = await apiManager.put<APIResponse<IncidentResponse>>(
        `${BASE_URL_DEV}/v1/api/incidents/${id}`,
        {
          status: "resolved",
          resolved_by: resolvedBy,
          resolved_at: new Date().toISOString()
        }
    );
    return response.data;
  } catch (error) {
    console.error("Resolve incident error:", error);
    throw error;
  }
};

// Change incident status
export const changeIncidentStatus = async (
    id: string,
    status: "open" | "investigating" | "resolved"
): Promise<APIResponse<IncidentResponse>> => {
  try {
    const updateData: UpdateIncidentData = { status };

    // If resolving, add resolved timestamp
    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const response = await apiManager.put<APIResponse<IncidentResponse>>(
        `${BASE_URL_DEV}/v1/api/incidents/${id}`,
        updateData
    );
    return response.data;
  } catch (error) {
    console.error("Change incident status error:", error);
    throw error;
  }
};