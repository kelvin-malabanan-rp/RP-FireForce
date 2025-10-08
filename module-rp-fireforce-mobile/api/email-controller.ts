// api/email-controller.ts
import apiManager from './api-manager';
import { BASE_URL_DEV } from '@/utils/backend-url';
import { API_RESPONSE } from '@/types/incident-types';
import {
    IncidentAlertEmailPayload,
    StatusChangeEmailPayload,
    ReminderEmailPayload,
    EscalationEmailPayload,
    EmailResponse
} from '@/types/email-types';

/**
 * Send incident alert email
 */
export const sendIncidentAlertEmail = async (
    payload: IncidentAlertEmailPayload
): Promise<API_RESPONSE<EmailResponse>> => {
    try {
        const { data } = await apiManager.post<API_RESPONSE<EmailResponse>>(
            `${BASE_URL_DEV}/api/email/incident-alert`,
            payload
        );
        return data;
    } catch (error) {
        console.error('[email] Error sending incident alert:', error);
        throw error;
    }
};

/**
 * Send status change email
 */
export const sendStatusChangeEmail = async (
    payload: StatusChangeEmailPayload
): Promise<API_RESPONSE<EmailResponse>> => {
    try {
        const { data } = await apiManager.post<API_RESPONSE<EmailResponse>>(
            `${BASE_URL_DEV}/api/email/status-change`,
            payload
        );
        return data;
    } catch (error) {
        console.error('[email] Error sending status change email:', error);
        throw error;
    }
};

/**
 * Send reminder email
 */
export const sendReminderEmail = async (
    payload: ReminderEmailPayload
): Promise<API_RESPONSE<EmailResponse>> => {
    try {
        const { data } = await apiManager.post<API_RESPONSE<EmailResponse>>(
            `${BASE_URL_DEV}/api/email/reminder`,
            payload
        );
        return data;
    } catch (error) {
        console.error('[email] Error sending reminder email:', error);
        throw error;
    }
};

/**
 * Send escalation email
 */
export const sendEscalationEmail = async (
    payload: EscalationEmailPayload
): Promise<API_RESPONSE<EmailResponse>> => {
    try {
        const { data } = await apiManager.post<API_RESPONSE<EmailResponse>>(
            `${BASE_URL_DEV}/api/email/escalation`,
            payload
        );
        return data;
    } catch (error) {
        console.error('[email] Error sending escalation email:', error);
        throw error;
    }
};

/**
 * Send bulk emails to multiple recipients
 */
export const sendBulkEmail = async (params: {
    recipients: string[];
    subject: string;
    htmlBody: string;
    textBody: string;
}): Promise<API_RESPONSE<{ sent: number; failed: number }>> => {
    try {
        const { data } = await apiManager.post<API_RESPONSE<{ sent: number; failed: number }>>(
            `${BASE_URL_DEV}/api/email/bulk`,
            params
        );
        return data;
    } catch (error) {
        console.error('[email] Error sending bulk email:', error);
        throw error;
    }
};