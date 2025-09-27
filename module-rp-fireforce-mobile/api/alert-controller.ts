// api/alert-controller.ts
import apiManager from './api-manager';
import {
    APIResponse,
    PushTokenRegistration,
    PushTokenRegistrationResponse,
    PushTokenStatusResponse,
    TestAlertResponse,
    BackendHealthResponse,
    AlertSettings
} from '@/types/response-types';
import { BASE_URL_DEV } from '@/utils/backend-url';

const ALERT_API_BASE_URL = BASE_URL_DEV;

export const registerPushToken = async (
    registration: PushTokenRegistration
): Promise<APIResponse<PushTokenRegistrationResponse>> => {
    const { data } = await apiManager.post<APIResponse<PushTokenRegistrationResponse>>(
        `${ALERT_API_BASE_URL}/api/push-token`,
        registration
    );
    return data; // unwrap once
};

export const updateAlertSettings = async (
    token: string,
    settings: AlertSettings
): Promise<{ updated: boolean }> => {
    const { data } = await apiManager.put<APIResponse<{ updated: boolean }>>(
        `${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}/settings`,
        { settings }
    );
    return data.data;
};

export const unregisterDevice = async (
    token: string
): Promise<{ unregistered: boolean }> => {
    const { data } = await apiManager.delete<APIResponse<{ unregistered: boolean }>>(
        `${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}`
    );
    return data.data;
};

export const getDeviceAlertStatus = async (
    token: string
): Promise<PushTokenStatusResponse> => {
    const { data } = await apiManager.get<APIResponse<PushTokenStatusResponse>>(
        `${ALERT_API_BASE_URL}/api/push-token/${encodeURIComponent(token)}/status`
    );
    return data.data;
};

export const sendTestAlert = async (
    token: string,
    alertType: 'low' | 'medium' | 'high' | 'critical' = 'high'
): Promise<TestAlertResponse> => {
    const { data } = await apiManager.post<APIResponse<TestAlertResponse>>(
        `${ALERT_API_BASE_URL}/api/test/send-alert`,
        {
            token,
            alertType,
            message: {
                title: `${alertType.toUpperCase()} Test Alert`,
                body: 'This is a test notification to verify your alert system is working.',
                data: { type: 'test', severity: alertType, timestamp: new Date().toISOString() }
            }
        }
    );
    return data.data;
};

export const checkAlertSystemHealth = async (): Promise<BackendHealthResponse> => {
    const { data } = await apiManager.get<BackendHealthResponse>(
        `${ALERT_API_BASE_URL}/health`
    );
    console.log('Alert system health:', data);
    return data; // unwrap inner data, then return status
};
