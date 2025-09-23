export type APIResponse<T = {}> = {
  data: any;
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

// Incident data types
export interface Incident {
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
}

export interface IncidentsResponse {
  incidents: Incident[];
  total: number;
  timeframe: string;
}

export interface IncidentStatsResponse {
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
}

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

export type IncidentsListResponse = {
  object: IncidentsResponse;
  httpStatus: string;
  incidents: Incident[];
  total: number;
  timeframe: string;
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

// Request types for incident operations
export interface CreateIncidentData {
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  location?: string;
  reported_by?: string;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  severity?: "low" | "medium" | "high" | "critical";
  status?: "open" | "investigating" | "resolved";
  location?: string;
  assigned_to?: string;
  resolved_by?: string;
}