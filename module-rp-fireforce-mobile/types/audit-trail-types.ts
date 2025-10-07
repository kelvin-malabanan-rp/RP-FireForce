export interface CreateAuditLogPayload {
    action: string;
    details: Record<string, any>;
    incidentId?: string | null;
    userId?: string | null;
    description?: string;
    metadata?: Record<string, any>;
}

export interface CreateAuditLogResponse {
    success: boolean;
    auditId: string;
    message: string;
}