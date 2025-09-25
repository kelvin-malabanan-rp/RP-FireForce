import {AllIncidents, Incident, IncidentStatsResponse} from "@/types/incident-types";

export type APIResponse<T> = {
  httpStatus: string;
  message: string;
  object: T;
};

export type AuthenticateResponse = {
  httpStatus: string;
  message: string;
  data: {
    id: number;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    token: string;
  }
};

export type WrappedIncidentByIdResponse = APIResponse<Incident>;

export type WrappedIncidentsResponse = APIResponse<Incident[]>;

export type WrappedIncidentStatsResponse = APIResponse<IncidentStatsResponse>;

export type WrappedIncidentsListResponse = APIResponse<AllIncidents>;

export type WrappedCreateIncidentResponse = APIResponse<Incident>;


// Response types for incident operations
export type IncidentResponse = {
  object: Incident;
  httpStatus: string;
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved";
  timestamp: string;
  reported_by: string;
  location?: string | null;
  assigned_to?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  aws_alarm_name?: string | null;
  aws_account_id?: string | null;
  state_reason?: string | null;
  metric_name?: string | null;
  aws_console_url?: string | null;
  created_at: string;
  updated_at: string;
};


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

export interface AlertSettings {
  enableAlerts: boolean;
  criticalOnly: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  pollInterval?: number;
}

export interface PushTokenRegistration {
  token: string;
  deviceType: string;
  settings?: AlertSettings;
  userId?: string;
}

export interface DeviceInfo {
  deviceId: string;
  platform: string;
  appVersion: string;
  registeredAt: string;
}

// Push Token Response Types
export type PushTokenRegistrationResponse = {
  success: boolean;
  deviceId: string;
  registeredAt?: string;
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