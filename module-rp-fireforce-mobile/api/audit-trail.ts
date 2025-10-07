import {CreateAuditLogPayload, CreateAuditLogResponse} from "@/types/audit-trail-types";
import {BASE_URL_DEV} from "@/utils/backend-url";
import apiManager from "@/api/api-manager";

export const createAuditLog = async (
    data: CreateAuditLogPayload
): Promise<CreateAuditLogResponse> => {
    try {
        const response = await apiManager.post<CreateAuditLogResponse>(
            `${BASE_URL_DEV}/api/audit/logs`,
            data
        );
        return response.data; // Axios wraps the response, so extract .data
    } catch (error) {
        console.error("Error creating audit log:", error);
        throw error;
    }
};