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
 */
export const registerPushToken = async (
    registration: PushTokenRegistration & {
        fcmToken?: string; // extra field for Android
    }
): Promise<APIResponse<PushTokenRegistrationResponse>> => {
    const { data } = await apiManager.post<
        APIResponse<PushTokenRegistrationResponse>
    >(`${BASE_URL_DEV}/api/push-token`, registration);

    return data;
};

/**
 * Simple health check for backend.
 */
export const checkAlertSystemHealth =
    async (): Promise<BackendHealthResponse> => {
        const { data } = await apiManager.get<BackendHealthResponse>(
            `${BASE_URL_DEV}/health`
        );
        return data;
    };

export const respondToIncident = async (
    incidentId: string,
    action: "acknowledge" | "decline",
    userId?: string
) => {
    const { data } = await apiManager.post(
        `${BASE_URL_DEV}/api/incidents/respond`,
        { incidentId, action, userId }
    );
    return data;
};