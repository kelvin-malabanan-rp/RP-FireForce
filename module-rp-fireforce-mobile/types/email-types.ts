/**
 * Email notification payloads
 */
export interface IncidentAlertEmailPayload {
    to: string;
    incidentId: string;
    title: string;
    description: string;
    severity: string;
    reportedBy: string;
    timestamp: string;
}

export interface StatusChangeEmailPayload {
    to: string;
    incidentId: string;
    title: string;
    status: 'investigating' | 'resolved';
    changedBy: string;
    timestamp: string;
}

export interface ReminderEmailPayload {
    to: string;
    incidentId: string;
    title: string;
    description: string;
    severity: string;
    reminderNumber: number;
    totalReminders: number;
}

export interface EscalationEmailPayload {
    to: string;
    incidentId: string;
    title: string;
    description: string;
    severity: string;
    escalatedFrom: number;
    escalatedTo: number;
    reason?: string;
}

export interface EmailResponse {
    success: boolean;
    message?: string;
}