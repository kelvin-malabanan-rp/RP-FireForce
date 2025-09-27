// api/alert-controller.ts
import apiManager from './api-manager';
import {
    APIResponse,
    PushTokenRegistration,
    PushTokenRegistrationResponse,
    PushTokenStatusResponse,
    TestAlertResponse,
    BackendHealthResponse,
    AlertSettings,
} from '@/types/response-types';
import { BASE_URL_DEV } from '@/utils/backend-url';

const ALERT_API_BASE_URL = BASE_URL_DEV;

/**
 * Register device push tokens (Expo + optional FCM/APNs).
 */
export const registerPushToken = async (
    registration: PushTokenRegistration & {
        fcmToken?: string; // extra field for Android
    }
): Promise<APIResponse<PushTokenRegistrationResponse>> => {
    const { data } = await apiManager.post<
        APIResponse<PushTokenRegistrationResponse>
    >(`${ALERT_API_BASE_URL}/api/push-token`, registration);

    return data;
};

/**
 * Update user alert preferences (sound, vibration, etc).
 */
export const updateAlertSettings = async (
    token: string,
    settings: AlertSettings
): Promise<{ updated: boolean }> => {
    const { data } = await apiManager.put<
        APIResponse<{ updated: boolean }>
    >(`${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}/settings`, {
        settings,
    });
    return data.data;
};

/**
 * Unregister device completely.
 */
export const unregisterDevice = async (
    token: string
): Promise<{ unregistered: boolean }> => {
    const { data } = await apiManager.delete<
        APIResponse<{ unregistered: boolean }>
    >(`${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}`);
    return data.data;
};

/**
 * Get current device registration status.
 */
export const getDeviceAlertStatus = async (
    token: string
): Promise<PushTokenStatusResponse> => {
    const { data } = await apiManager.get<
        APIResponse<PushTokenStatusResponse>
    >(`${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}/status`);
    return data.data;
};

/**
 * Send a test alert to verify sounds + channel mapping.
 */
export const sendTestAlert = async (
    token: string,
    alertType: 'low' | 'medium' | 'high' | 'critical' = 'high',
    fcmToken?: string
): Promise<TestAlertResponse> => {
    // Map severity → channelId used on Android
    const channelMap: Record<string, string> = {
        critical: 'critical-alerts-v4',
        high: 'high-priority-v4',
        medium: 'medium-priority-v4',
        low: 'default-v4',
    };

    const channelId = channelMap[alertType] ?? channelMap.low;

    const { data } = await apiManager.post<APIResponse<TestAlertResponse>>(
        `${ALERT_API_BASE_URL}/api/test/send-alert`,
        {
            token, // Expo token (still works for Expo push delivery)
            fcmToken, // optional for backend if you want to support FCM direct
            alertType,
            channelId, // 👈 tells backend which Android channel to use
            message: {
                title: `${alertType.toUpperCase()} Test Alert`,
                body: 'This is a test notification to verify your alert system is working.',
                channelId, // ensure Expo payload includes it too
                data: {
                    type: 'test',
                    severity: alertType,
                    timestamp: new Date().toISOString(),
                },
            },
        }
    );

    return data.data;
};

/**
 * Simple health check for backend.
 */
export const checkAlertSystemHealth =
    async (): Promise<BackendHealthResponse> => {
        const { data } = await apiManager.get<BackendHealthResponse>(
            `${ALERT_API_BASE_URL}/health`
        );
        return data;
    };
