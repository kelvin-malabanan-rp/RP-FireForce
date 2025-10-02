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

export interface API_RESPONSE<T = any> {
    httpStatus: string;
    message: string;
    data: T;
}

export interface Incident {
    id: string;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "resolved";
    timestamp: string;
    reportedBy: string;
    location?: string | null;
    assignedTo?: string | null;
    resolvedBy?: string | null;
    resolvedAt?: string | null;
    awsAlarmName?: string | null;
    awsAccountId?: string | null;
    stateReason?: string | null;
    metricName?: string | null;
    aws_console_url?: string | null;
    createdAt?: string;  // Make optional
    updatedAt?: string;  // Make optional
}

// AllIncidentApiResponse
export interface IncidentResponseApi {
    httpStatus: string;
    message: string;
    data: Incident[];
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

export interface GetAllIncidentComments{
    "id": string;
    "incidentId": string;
    "userFullname": string;
    "userEmail": string;
    "comment": string;
    "createdAt":Date;
}

export interface UpdateIncidentStatusResponse {
    "httpStatus": string,
    "message": string,
    "data": {
        "id": string;
        "status": string;
        "updatedAt": string;
    }
}