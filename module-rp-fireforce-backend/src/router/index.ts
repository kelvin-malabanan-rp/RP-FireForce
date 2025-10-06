// router/index.ts
import { Env } from '../types';
import { CORS_HEADERS } from '../constants/cors';
import { handleHealth } from "../handlers/health.handlers";
import {
	handleCreateIncident,
	handleGetIncidents,
	handleGetStats,
	handleIncidentResponse, handlePostIncidentComment, handleResolveIncident,
	handleSelectIncident,
	handleTestIncident, handleUpdateIncidentStatus
} from "../handlers/incident.handlers";
import { handleWebhook } from "../handlers/webook.handlers";
import {handleLogin, handleLogout} from "../handlers/auth.handlers";
import {handleRegisterPushToken, handleSendTestAlert} from "../handlers/push-notification.handlers";
import {handleFetchIncidentComment} from "../handlers/incident-comment.handlers";
import {
	handleCreateOverride,
	handleEscalateIncident,
	handleGetAllCurrentOnCall,
	handleGetCurrentOnCall,
	handleGetOnCallSchedule,
	handleGetOnCallTeams,
	handleGetScheduleConfig,
	handleGetUsersForEmergencyOverride,
	handleGetUserTeam,
	handleUpdateScheduleConfig
} from "../handlers/oncall.handler";
import {handleGetAllUsers, handleGetUserById} from "../handlers/user-handlers";
import {
	createAuditLogHandler,
	recordNotificationResponseHandler,
	getNotificationHistoryHandler,
	getAuditTrailHandler,
	getFullIncidentAuditHandler,
	getAuditStatsHandler,
	exportAuditTrailAsCSVHandler,
	getAuditLogsHandler
} from "../handlers/auditHandler";

export class Router {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async handleRequest(request: Request, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		const method = request.method;

		// Handle CORS preflight
		if (method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: CORS_HEADERS
			});
		}

		try {
			// Public routes (no auth required)
			if (path === '/health' && method === 'GET') {
				return handleHealth(CORS_HEADERS);
			}
			// Users routes
			if (path === '/api/users' && method === 'GET') {
				return handleGetAllUsers(request, this.env, CORS_HEADERS);
			}

			// In your worker/router file
			if (path === '/api/users/by-id' && method === 'GET') {
				return handleGetUserById(request, this.env, CORS_HEADERS);
			}

			// Authentication routes
			if (path === '/api/auth/login' && method === 'POST') {
				return handleLogin(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/auth/logout' && method === 'POST') {
				return handleLogout(request, this.env, CORS_HEADERS);
			}

			// Webhook (no auth required for AWS)
			if (path === '/webhook/aws-cloudwatch' && method === 'POST') {
				return handleWebhook(request, this.env, CORS_HEADERS);
			}

			// Push notification routes (add these two lines here)
			if (path === '/api/push-token' && method === 'POST') {
				return handleRegisterPushToken(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/test/send-alert' && method === 'POST') {
				return handleSendTestAlert(request, this.env, CORS_HEADERS);
			}

			// Protected routes (will add auth middleware later)
			if (path === '/api/incidents' && method === 'GET') {
				return handleGetIncidents(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/incidents/stats' && method === 'GET') {
				return handleGetStats(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/test/trigger-incident' && method === 'POST') {
				return handleTestIncident(this.env, CORS_HEADERS);
			}

			if (path === '/api/incidents' && method === 'POST') {
				return handleCreateIncident(request, this.env, CORS_HEADERS);
			}

			// Incident response (acknowledge / decline)
			if (path === '/api/incidents/respond' && method === 'POST') {
				return handleIncidentResponse(request, this.env, CORS_HEADERS);
			}

			// Get specific incident by ID
			if (path === '/api/incidents/select' && method === 'GET') {
				return handleSelectIncident(request, this.env, CORS_HEADERS);
			}

			// POST Incident comment
			if (path === '/api/incidents-comment' && method === 'POST') {
				return handlePostIncidentComment(request, this.env, CORS_HEADERS);
			}

			// Get specific incident by ID
			if (path === '/api/incidents-comment' && method === 'GET') {
				return handleFetchIncidentComment(request, this.env, CORS_HEADERS);
			}

			// Update incident status
			if (path === '/api/incidents-status' && method === 'PUT') {
				return handleUpdateIncidentStatus(request, this.env, CORS_HEADERS);
			}

			// OnCall Routes
			if (path === '/api/oncall/current' && method === 'GET') {
				return handleGetCurrentOnCall(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/current/all' && method === 'GET') {
				const url = new URL(request.url);
				return handleGetAllCurrentOnCall(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/schedule' && method === 'GET') {
				return handleGetOnCallSchedule(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/teams' && method === 'GET') {
				return handleGetOnCallTeams(this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/override' && method === 'POST') {
				return handleCreateOverride(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/escalate' && method === 'POST') {
				return handleEscalateIncident(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/user/team' && method === 'GET') {
				return handleGetUserTeam(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/users/emergency-override' && method === 'POST') {
				return handleGetUsersForEmergencyOverride(request, this.env, CORS_HEADERS);
			}

			// router/index.ts (add alongside your other oncall routes)
			if (path === '/api/oncall/schedule/config' && method === 'GET') {
				return handleGetScheduleConfig(url, this.env, CORS_HEADERS);
			}
			if (path === '/api/oncall/schedule/config' && method === 'PUT') {
				return handleUpdateScheduleConfig(request, this.env, CORS_HEADERS);
			}

			if (path.startsWith('/api/incidents/') && path.endsWith('/resolve') && method === 'POST') {
				return handleResolveIncident(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// AUDIT ROUTES
			// ============================================

			// Create audit log entry
			if (path === '/api/audit/logs' && method === 'POST') {
				return createAuditLogHandler(request, this.env, CORS_HEADERS);
			}

			// Get audit logs with filtering
			if (path === '/api/audit/logs' && method === 'GET') {
				return getAuditLogsHandler(request, this.env, CORS_HEADERS);
			}

			// Record notification response
			if (path.match(/^\/api\/audit\/notifications\/[^/]+\/response$/) && method === 'POST') {
				return recordNotificationResponseHandler(request, this.env, CORS_HEADERS);
			}

			// Get notification history for an incident
			if (path.match(/^\/api\/audit\/incidents\/[^/]+\/notifications$/) && method === 'GET') {
				return getNotificationHistoryHandler(request, this.env, CORS_HEADERS);
			}

			// Get audit trail for an incident
			if (path.match(/^\/api\/audit\/incidents\/[^/]+\/trail$/) && method === 'GET') {
				return getAuditTrailHandler(request, this.env, CORS_HEADERS);
			}

			// Get full incident audit (comprehensive)
			if (path.match(/^\/api\/audit\/incidents\/[^/]+\/full$/) && method === 'GET') {
				return getFullIncidentAuditHandler(request, this.env, CORS_HEADERS);
			}

			// Export audit trail as CSV
			if (path.match(/^\/api\/audit\/incidents\/[^/]+\/export\/csv$/) && method === 'GET') {
				return exportAuditTrailAsCSVHandler(request, this.env, CORS_HEADERS);
			}

			// Get audit statistics
			if (path === '/api/audit/stats' && method === 'GET') {
				return getAuditStatsHandler(request, this.env, CORS_HEADERS);
			}

			// 404 Not Found
			return new Response(JSON.stringify({ error: 'Not found' }), {
				status: 404,
				headers: CORS_HEADERS
			});

		} catch (error) {
			console.error('Request error:', error);
			return new Response(JSON.stringify({ error: 'Internal server error' }), {
				status: 500,
				headers: CORS_HEADERS
			});
		}
	}
}
