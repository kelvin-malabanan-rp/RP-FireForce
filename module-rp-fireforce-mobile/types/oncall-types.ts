// types/oncall-types.ts

export interface OnCallUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role: 'primary' | 'backup' | 'escalation';
}

export interface CurrentOnCall {
    primary?: OnCallUser;
    backup?: OnCallUser;
    escalation?: OnCallUser[];
    teamId: string;
    startTime: string;
    endTime: string;
}

export interface OnCallScheduleProps {
    teamId?: string;
}

// Additional types needed for the controller and component

export interface OnCallTeam {
    id: string;
    name: string;
    description?: string;
    members?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface OnCallAssignment {
    primary?: OnCallUser;
    backup?: OnCallUser;
    escalation?: OnCallUser[];
}

export interface OnCallScheduleDay {
    date: string;
    dayOfWeek: string;
    assignment?: OnCallAssignment;
    isToday?: boolean;
    isPast?: boolean;
}

export interface OnCallScheduleResponse {
    schedule: OnCallScheduleDay[];
    teamId: string;
    days: number;
    startDate?: string;
    endDate?: string;
}

export interface OnCallOverride {
    id: string;
    teamId: string;
    userId: string;
    role: 'primary' | 'backup';
    startTime: string;
    endTime: string;
    createdBy?: string;
    reason?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface OnCallEscalation {
    id: string;
    teamId: string;
    incidentId: string;
    escalatedFrom: string;
    escalatedTo: string;
    reason: string;
    timestamp: string;
    resolvedAt?: string;
    status: 'active' | 'resolved' | 'cancelled';
}

// API Response wrapper types
export interface ApiResponse<T> {
    success: boolean;
    object?: T;
    error?: string;
    message?: string;
}

// Request parameter types
export interface CreateOverrideParams {
    teamId: string;
    startTime: string;
    endTime: string;
    userId: string;
    role: 'primary' | 'backup';
    reason?: string;
}

export interface EscalateIncidentParams {
    teamId: string;
    incidentId: string;
    reason: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface GetScheduleParams {
    teamId: string;
    days?: number;
    startDate?: string;
    endDate?: string;
}