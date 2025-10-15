// api/alert-controller.ts
import apiManager from './api-manager';
import {
    APIResponse,
    PushTokenRegistration,
    PushTokenRegistrationResponse,
    BackendHealthResponse,
} from '@/types/response-types';
import { BASE_URL_DEV } from '@/utils/backend-url';

/**
 * Register device push tokens (Expo + optional FCM/APNs).
 * This will log out all other devices for the user.
 */
export const registerPushToken = async (
    registration: PushTokenRegistration & {
        fcmToken?: string; // extra field for Android
    }
): Promise<APIResponse<PushTokenRegistrationResponse>> => {
    try {
        console.log('[alert-controller] Registering push token for user:', registration.userId);

        const { data } = await apiManager.post<APIResponse<PushTokenRegistrationResponse>>
        (`${BASE_URL_DEV}/api/push-token`, {
            userId: registration.userId,
            token: registration.token,
            deviceType: registration.deviceType,
            fcmToken: registration.fcmToken,
            settings: registration.settings,
        });

        if (data.data?.success) {
            console.log('[alert-controller] ✅ Token registered successfully');
        } else {
            console.warn('[alert-controller] ⚠️ Token registration returned non-success:', data);
        }

        return data;
    } catch (error) {
        console.error('[alert-controller] ❌ Failed to register push token:', error);
        throw error;
    }
};

/**
 * Unregister a device token (for logout).
 */
export const unregisterPushToken = async (
    userId: string,
    token: string
): Promise<APIResponse<{ success: boolean }>> => {
    try {
        console.log('[alert-controller] Unregistering push token for user:', userId);

        const { data } = await apiManager.post<APIResponse<{ success: boolean }>>
        (`${BASE_URL_DEV}/api/push-token/unregister`, {
            userId,
            token,
        });

        return data;
    } catch (error) {
        console.error('[alert-controller] ❌ Failed to unregister push token:', error);
        throw error;
    }
};

/**
 * Simple health check for backend.
 */
export const checkAlertSystemHealth =
    async (): Promise<BackendHealthResponse> => {
        try {
            const { data } = await apiManager.get<BackendHealthResponse>(
                `${BASE_URL_DEV}/health`
            );
            return data;
        } catch (error) {
            console.error('[alert-controller] ❌ Health check failed:', error);
            throw error;
        }
    };

/**
 * Respond to an incident (acknowledge or decline).
 */
export const respondToIncident = async (
    incidentId: string,
    action: "acknowledge" | "decline",
    userId?: string
): Promise<APIResponse<any>> => {
    try {
        console.log(`[alert-controller] Responding to incident ${incidentId}:`, action);

        const { data } = await apiManager.post<APIResponse<any>>(
            `${BASE_URL_DEV}/api/incidents/respond`,
            { incidentId, action, userId }
        );

        return data;
    } catch (error) {
        console.error('[alert-controller] ❌ Failed to respond to incident:', error);
        throw error;
    }
};