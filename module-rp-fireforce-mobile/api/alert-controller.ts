import { BASE_URL_DEV } from "@/utils/backend-url";
import {
    APIResponse,
    AlertSettings,
    PushTokenRegistration,
    PushTokenRegistrationResponse,
    PushTokenStatusResponse,
    TestAlertResponse,
    BackendHealthResponse
} from "@/types/response-types";
import apiManager from "./api-manager";

// Use your configured Cloudflare Workers URL for alerts
const ALERT_API_BASE_URL = BASE_URL_DEV;

// Register push token for notifications
export const registerPushToken = async (
    registration: PushTokenRegistration
): Promise<PushTokenRegistrationResponse> => {
    try {
        console.log("Registering push token: ", registration);
        const response = await apiManager.post<PushTokenRegistrationResponse>(
            `${ALERT_API_BASE_URL}/api/push-token`,
            registration
        );
        console.log("Registered push token: ", response);
        return response.data;
    } catch (error) {
        console.error("Register push token error:", error);
        throw error;
    }
};

// Update alert settings for device
export const updateAlertSettings = async (
    token: string,
    settings: AlertSettings
): Promise<APIResponse<{ updated: boolean }>> => {
    try {
        const response = await apiManager.put<APIResponse<{ updated: boolean }>>(
            `${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}/settings`,
            { settings }
        );
        return response.data;
    } catch (error) {
        console.error("Update alert settings error:", error);
        throw error;
    }
};

// Unregister device from notifications
export const unregisterDevice = async (
    token: string
): Promise<APIResponse<{ unregistered: boolean }>> => {
    try {
        const response = await apiManager.delete<APIResponse<{ unregistered: boolean }>>(
            `${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}`
        );
        return response.data;
    } catch (error) {
        console.error("Unregister device error:", error);
        throw error;
    }
};

// Get device alert status and settings
export const getDeviceAlertStatus = async (
    token: string
): Promise<PushTokenStatusResponse> => {
    try {
        const response = await apiManager.get<PushTokenStatusResponse>(
            `${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}/status`
        );
        return response.data;
    } catch (error) {
        console.error("Get device alert status error:", error);
        throw error;
    }
};

// Send test alert to specific device
export const sendTestAlert = async (
    token: string,
    alertType: 'low' | 'medium' | 'high' | 'critical' = 'high'
): Promise<TestAlertResponse> => {
    try {
        const response = await apiManager.post<TestAlertResponse>(
            `${ALERT_API_BASE_URL}/api/test/send-alert`,
            {
                token,
                alertType,
                message: {
                    title: `${alertType.toUpperCase()} Test Alert`,
                    body: 'This is a test notification to verify your alert system is working.',
                    data: {
                        type: 'test',
                        severity: alertType,
                        timestamp: new Date().toISOString()
                    }
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error("Send test alert error:", error);
        throw error;
    }
};

// Check backend health and alert system status
export const checkAlertSystemHealth = async (): Promise<BackendHealthResponse> => {
    try {
        const response = await apiManager.get<BackendHealthResponse>(
            `${ALERT_API_BASE_URL}/health`
        );
        return response.data;
    } catch (error) {
        console.error("Check alert system health error:", error);
        throw error;
    }
};