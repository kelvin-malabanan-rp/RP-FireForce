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
	handleCreateOnCallSchedule,
	handleCreateOverride, handleDeleteOnCallSchedule,
	handleEscalateIncident,
	handleGetAllCurrentOnCall, handleGetAllSchedules,
	handleGetCurrentOnCall, handleGetEscalationPolicy, handleGetOnCallCalendarData,
	handleGetOnCallSchedule,
	handleGetOnCallTeams,
	handleGetScheduleConfig, handleGetTeamDetails,
	handleGetUsersForEmergencyOverride,
	handleGetUserTeam, handleUpdateOnCallSchedule,
	handleUpdateScheduleConfig
} from "../handlers/oncall.handler";
import {handleGetAllUsers, handleGetUserById} from "../handlers/user-handlers";
import {
	handleCreateAuditLog,
	handleGetAuditLogs,
	handleGetAuditStats,
	handleGetIncidentAuditTrail
} from "../handlers/audit.handlers";
import {
	handleSendBulkEmail,
	handleSendEscalationEmail,
	handleSendIncidentAlertEmail,
	handleSendReminderEmail,
	handleSendStatusChangeEmail, handleSendTestEmail
} from "../handlers/email.handlers";

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

			if (path === '/api/oncall/schedule' && method === 'POST') {
				return handleCreateOnCallSchedule(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/schedule' && method === 'DELETE') {
				return handleDeleteOnCallSchedule(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/schedules/all' && method === 'GET') {
				return handleGetAllSchedules(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/escalation-policy' && method === 'GET') {
				return handleGetEscalationPolicy(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/calendar' && method === 'GET') {
				return handleGetOnCallCalendarData(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/team/details' && method === 'GET') {
				return handleGetTeamDetails(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/schedule' && method === 'PUT') {
				return handleUpdateOnCallSchedule(request, this.env, CORS_HEADERS);
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
				return handleCreateAuditLog(request, this.env, CORS_HEADERS);
			}

			// Get all audit logs with filtering
			if (path === '/api/audit/logs' && method === 'GET') {
				return handleGetAuditLogs(request, this.env, CORS_HEADERS);
			}

			// Get audit trail for specific incident
			if (path.match(/^\/api\/audit\/incidents\/[^/]+\/trail$/) && method === 'GET') {
				return handleGetIncidentAuditTrail(request, this.env, CORS_HEADERS);
			}

			// Get audit statistics
			if (path === '/api/audit/stats' && method === 'GET') {
				return handleGetAuditStats(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/email/incident-alert' && method === 'POST') {
				return handleSendIncidentAlertEmail(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/email/status-change' && method === 'POST') {
				return handleSendStatusChangeEmail(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/email/reminder' && method === 'POST') {
				return handleSendReminderEmail(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/email/escalation' && method === 'POST') {
				return handleSendEscalationEmail(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/email/bulk' && method === 'POST') {
				return handleSendBulkEmail(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/email/test' && method === 'POST') {
				return handleSendTestEmail(request, this.env, CORS_HEADERS);
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
