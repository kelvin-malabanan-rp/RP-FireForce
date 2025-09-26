export interface IncidentUI {
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved";
    timestamp: Date;
    reportedBy: string;
    location?: string;
    assignedTo?: string;
    resolvedBy?: string;
    resolvedAt?: Date;
    awsAlarmName?: string;
}

export interface Stats {
    total: number;
    open: number;
    investigating: number;
    resolved: number;
    critical: number;
}

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

// AllIncidentApiResponse
export interface IncidentResponseApi {
    httpStatus: string;
    message: string;
    data: Incident[];
}

// AllIncidentApiResponse
export interface CreateIncidentResponseApi {
    httpStatus: string;
    message: string;
    data: Incident;
}

export type IncidentPayload = {
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

export type IncidentPayloadApi = {
    httpStatus: string;
    message: string;
    data: IncidentPayload[];
}


export interface AllIncidents {
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

// Request types for incident operations
export interface CreateIncidentData {
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    location?: string | null;
    reportedBy: string;  // Changed from reported_by and made required to match backend
}

// Response types for created incident
export interface CreatedIncidentData {
    id: string;
    title: string;
    description: string;
    location: string | null;
    reportedBy: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved";
    timestamp: string;
}

export interface UpdateIncidentData {
    title?: string;
    description?: string;
    severity?: "low" | "medium" | "high" | "critical";
    status?: "open" | "investigating" | "resolved";
    location?: string;
    assigned_to?: string;
    resolved_by?: string;
    resolved_at?: string;
}
