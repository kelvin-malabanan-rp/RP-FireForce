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

/**
 * Get all audit logs with filtering
 * GET /api/audit/logs
 */
export async function handleGetAuditLogs(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const incidentId = url.searchParams.get('incidentId') || undefined;
		const userId = url.searchParams.get('userId') || undefined;
		const action = url.searchParams.get('action') || undefined;
		const startDate = url.searchParams.get('startDate') || undefined;
		const endDate = url.searchParams.get('endDate') || undefined;
		const limit = parseInt(url.searchParams.get('limit') || '100');
		const offset = parseInt(url.searchParams.get('offset') || '0');

		const auditService = new AuditService(env);
		const result = await auditService.getAuditLogs({
			incidentId,
			userId,
			action,
			startDate,
			endDate,
			limit,
			offset
		});

		return new Response(
			JSON.stringify({
				success: true,
				count: result.logs.length,
				total: result.total,
				limit,
				offset,
				logs: result.logs
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error in handleGetAuditLogs:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to retrieve audit logs',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Get audit trail for a specific incident
 * GET /api/audit/incidents/:incidentId/trail
 */
export async function handleGetIncidentAuditTrail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		const incidentId = pathParts[pathParts.indexOf('incidents') + 1];

		if (!incidentId) {
			return new Response(
				JSON.stringify({ error: 'Incident ID is required' }),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		const auditService = new AuditService(env);
		const auditTrail = await auditService.getIncidentAuditTrail(incidentId);

		return new Response(
			JSON.stringify({
				success: true,
				count: auditTrail.length,
				incident_id: incidentId,
				audit_trail: auditTrail
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error in handleGetIncidentAuditTrail:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to retrieve audit trail',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Get audit statistics
 * GET /api/audit/stats
 */
export async function handleGetAuditStats(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const startDate = url.searchParams.get('startDate') || undefined;
		const endDate = url.searchParams.get('endDate') || undefined;

		const auditService = new AuditService(env);
		const stats = await auditService.getAuditStats(startDate, endDate);

		return new Response(
			JSON.stringify({
				success: true,
				stats
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('Error in handleGetAuditStats:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to retrieve audit statistics',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}


// Get audit logs with filtering
export async function handleGetAuditLogs(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get('limit') || '50');
		const offset = parseInt(url.searchParams.get('offset') || '0');
		const incidentId = url.searchParams.get('incidentId');

		let query = `
			SELECT
				al.*,
				u.first_name || ' ' || u.last_name as user_name,
				i.title as incident_title
			FROM audit_log al
			LEFT JOIN users u ON al.user_id = u.id
			LEFT JOIN incidents i ON al.incident_id = i.id
		`;

		const params: any[] = [];

		if (incidentId) {
			query += ` WHERE al.incident_id = ?`;
			params.push(incidentId);
		}

		query += ` ORDER BY al.created_at DESC LIMIT ? OFFSET ?`;
		params.push(limit, offset);

		const result = await env.DB.prepare(query).bind(...params).all();

		const logs = result.results?.map((row: any) => ({
			id: row.id,
			incident_id: row.incident_id,
			user_id: row.user_id,
			user_name: row.user_name,
			action: row.action,
			description: row.description,
			details: row.details ? JSON.parse(row.details) : null,
			incident_title: row.incident_title,
			created_at: row.created_at
		})) || [];

		const successResponse: ApiResponse<any> = {
			httpStatus: "OK",
			message: "Audit logs retrieved successfully",
			data: {
				logs,
				total: logs.length,
				limit,
				offset
			}
		};

		return new Response(JSON.stringify(successResponse), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	} catch (error: any) {
		console.error("Error fetching audit logs:", error);

		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: error.message || "Failed to fetch audit logs",
			data: null
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	}
}

// Get audit statistics
export async function handleGetAuditStats(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const startDate = url.searchParams.get('startDate');
		const endDate = url.searchParams.get('endDate');

		let whereClause = '';
		const params: any[] = [];

		if (startDate && endDate) {
			whereClause = 'WHERE created_at BETWEEN ? AND ?';
			params.push(startDate, endDate);
		}

		const query = `
			SELECT
				COUNT(*) as total_logs,
				COUNT(DISTINCT user_id) as unique_users,
				COUNT(DISTINCT incident_id) as unique_incidents,
				action,
				COUNT(*) as action_count
			FROM audit_log
			${whereClause}
			GROUP BY action
		`;

		const result = await env.DB.prepare(query).bind(...params).all();

		const actionBreakdown: Record<string, number> = {};
		let totalLogs = 0;
		let uniqueUsers = 0;
		let uniqueIncidents = 0;

		result.results?.forEach((row: any) => {
			actionBreakdown[row.action] = row.action_count;
			if (!totalLogs) {
				totalLogs = row.total_logs;
				uniqueUsers = row.unique_users;
				uniqueIncidents = row.unique_incidents;
			}
		});

		const successResponse: ApiResponse<any> = {
			httpStatus: "OK",
			message: "Audit statistics retrieved successfully",
			data: {
				total_logs: totalLogs,
				unique_users: uniqueUsers,
				unique_incidents: uniqueIncidents,
				action_breakdown: actionBreakdown,
				recent_activity_trend: 0 // Can be calculated based on time periods
			}
		};

		return new Response(JSON.stringify(successResponse), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	} catch (error: any) {
		console.error("Error fetching audit stats:", error);

		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: error.message || "Failed to fetch audit statistics",
			data: null
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	}
}
