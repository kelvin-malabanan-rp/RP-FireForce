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

export interface Incident {
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved";
    timestamp: string;
    reportedBy: string; // Changed from reported_by
    location?: string | null;
    assignedTo?: string | null; // Changed from assigned_to
    resolvedBy?: string | null; // Changed from resolved_by
    resolvedAt?: string | null; // Changed from resolved_at
    awsAlarmName?: string | null; // Changed from aws_alarm_name
    awsAccountId?: string | null; // Changed from aws_account_id
    stateReason?: string | null; // Changed from state_reason
    metricName?: string | null; // Changed from metric_name
    aws_console_url?: string | null;
    createdAt: string; // Changed from created_at
    updatedAt: string; // Changed from updated_at
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

// Incident Comments
export interface PostIncidentComments {
    "incidentId": string
    "userId": string
    "comment": string;
}

export interface PostIncidentCommentsResponse {
    "httpStatus": string,
    "message": string,
    "data": {
        "id": string;
        "incidentId": string;
        "userId": string;
        "comment": string;
        "createdAt":Date;
    }
}
export interface GetAllIncidentCommentsResponse {
    "httpStatus": string,
    "message": string,
    "data": {
        "id": string;
        "incidentId": string;
        "userId": string;
        "comment": string;
        "createdAt": Date;
    }[]
}
