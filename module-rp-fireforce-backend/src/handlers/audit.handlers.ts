// handlers/audit.handler.ts
import {
	ApiResponse,
	Env,
	AuditLogPayload,
	AuditLogResponse,
} from "../types";
import {AuditService} from "../services/audit.services";

export async function handleCreateAuditLog(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		if (request.method !== "POST") {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "Method not allowed. Use POST.",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 405,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		let body: Record<string, any>;
		try {
			body = await request.json();
		} catch {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "Invalid JSON in request body",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		const { action, incidentId, userId, description, details, metadata } = body;

		if (!action || !incidentId || !userId || !details) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "Missing required fields: action, incidentId, userId, and details are required",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		const auditPayload: AuditLogPayload = {
			action,
			incidentId,
			userId,
			description,
			details,
			metadata
		};

		const auditService = new AuditService(env);
		const result = await auditService.createAuditLog(auditPayload);

		const successResponse: ApiResponse<AuditLogResponse> = {
			httpStatus: "OK",
			message: "Audit log created successfully",
			data: result
		};

		return new Response(JSON.stringify(successResponse), {
			status: 201,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	} catch (error: any) {
		console.error("Error creating audit log:", error);

		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: error.message || "Failed to create audit log",
			data: null
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	}
}

