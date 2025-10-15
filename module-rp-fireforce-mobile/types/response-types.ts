import {AllIncidents, CreatedIncidentData, Incident, IncidentStatsResponse} from "@/types/incident-types";

export type AuthenticateResponse = {
  httpStatus: string;
  message: string;
  data: {
    id: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string;
  }
};

export interface UserSession {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  token: string;
}

export type IncidentStatsResponseType = {
  object: IncidentStatsResponse;
  httpStatus: string;
  total: number;
  open: number;
  investigating: number;
  resolved: number;
  severities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
};

export interface ResponseCreatedIncident {
  httpStatus: string;
  message: string;
  data: CreatedIncidentData;
  changes: number;
}

export interface GetIncidentsByIdResponse {
  httpStatus: string;
  message: string;
  data: Incident;
}

export interface AlertSettings {
  enableAlerts: boolean;
  criticalOnly: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pollInterval?: number;
  // ✅ NEW: Reminder configuration
  reminderConfig?: {
    enabled: boolean;           // Enable/disable reminders
    maxReminders: number;       // How many reminders (1-5)
    intervalSeconds: number;    // Interval between reminders (10, 30, 60, 300)
  };
  channelPreferences?: {
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
}

// ✅ UPDATED: userId is now required
export interface PushTokenRegistration {
  userId: string;           // ✅ Changed from optional to required
  token: string;
  deviceType: string;
  settings?: AlertSettings;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  appVersion: string;
  registeredAt: string;
}

// ✅ UPDATED: Added optional message field
export type PushTokenRegistrationResponse = {
  success: boolean;
  deviceId: string;
  userId: string;
  message?: string;         // ✅ Added to show "Other devices logged out" message
};

export type PushTokenStatusResponse = {
  isRegistered: boolean;
  settings?: AlertSettings;
  lastNotification?: string;
  deviceInfo?: DeviceInfo;
};

// Test Alert Response Types
export type TestAlertResponse = {
  sent: boolean;
  notificationId?: string;
  deliveredAt?: string;
};

// Backend Health Response
export type BackendHealthResponse = {
  status: 'healthy' | 'degraded' | 'error';
  timestamp: string;
  environment: string;
  alertsEnabled?: boolean;
  connectedDevices?: number;
  databaseStatus?: string;
};

export type APIResponse<T> = {
  httpStatus: string;
  message: string;
  data: T;
};