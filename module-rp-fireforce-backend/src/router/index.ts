// router/index.ts
import { Env } from '../types';
import { CORS_HEADERS } from '../constants/cors';
import { handleHealth } from "../handlers/health.handlers";
import {
	handleCreateIncident,
	handleGetIncidents,
	handleGetStats,
	handleIncidentResponse,
	handlePostIncidentComment,
	handleResolveIncident,
	handleSelectIncident,
	handleTestIncident,
	handleUpdateIncidentStatus
} from "../handlers/incident.handlers";
import { handleWebhook } from "../handlers/webook.handlers";
import {
	handleGithubCallback,
	handleGoogleCallback,
	handleLogin,
	handleLogout,
	handleMobileGoogleAuth,
	handleMobileGithubAuth
} from "../handlers/auth.handlers";
import {handleRegisterPushToken, handleSendTestAlert} from "../handlers/push-notification.handlers";
import {handleFetchIncidentComment} from "../handlers/incident-comment.handlers";
import {
	handleCreateOnCallSchedule,
	handleCreateOverride,
	handleDeleteOnCallSchedule,
	handleEscalateIncident,
	handleGetAllCurrentOnCall,
	handleGetCurrentOnCallByTeamId,
	handleGetAllSchedules,
	handleGetEscalationPolicy,
	handleGetOnCallCalendarData,
	handleGetOnCallSchedule,
	handleGetOnCallTeams,
	handleGetScheduleConfig,
	handleGetTeamDetails,
	handleGetUsersForEmergencyOverride,
	handleGetUserTeam,
	handleUpdateOnCallSchedule,
	handleUpdateScheduleConfig,
	handleGetAllOnCallUsers
} from "../handlers/oncall.handler";
import {
	handleChangePassword,
	handleGetAllUsers,
	handleGetUserById,
	handleGetUserProfile,
	handleUpdateUserProfile, handleUploadAvatar
} from "../handlers/user-handlers";
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
	handleSendStatusChangeEmail,
	handleSendTestEmail
} from "../handlers/email.handlers";
import {
	handleAddTeamMember, handleChangeTeamRole, handleCreateTeam, handleGetAllTeams,
	handleGetAvailableUsers, handleGetTeamById,
	handleGetTeamMembers,
	handleRemoveTeamMember, handleTransferTeamMember
} from "../handlers/team-handlers";

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
			// ============================================
			// PUBLIC ROUTES (no auth required)
			// ============================================

			if (path === '/health' && method === 'GET') {
				return handleHealth(CORS_HEADERS);
			}

			// ============================================
			// AUTHENTICATION ROUTES
			// ============================================

			// Traditional email/password login
			if (path === '/api/auth/login' && method === 'POST') {
				return handleLogin(request, this.env, CORS_HEADERS);
			}

			// Web OAuth callbacks (redirect-based)
			if (path === '/auth/google/callback' && method === 'GET') {
				return handleGoogleCallback(request, this.env);
			}

			if (path === '/auth/github/callback' && method === 'GET') {
				return handleGithubCallback(request, this.env);
			}

			// ✅ Mobile OAuth endpoints (JSON-based)
			if (path === '/api/auth/google/mobile' && method === 'POST') {
				return handleMobileGoogleAuth(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/auth/github/mobile' && method === 'POST') {
				return handleMobileGithubAuth(request, this.env, CORS_HEADERS);
			}

			// Logout
			if (path === '/api/auth/logout' && method === 'POST') {
				return handleLogout(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// USER ROUTES
			// ============================================

			if (path === '/api/users' && method === 'GET') {
				return handleGetAllUsers(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/users/by-id' && method === 'GET') {
				return handleGetUserById(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/users/emergency-override' && method === 'POST') {
				return handleGetUsersForEmergencyOverride(request, this.env, CORS_HEADERS);
			}

			// Protected routes (auth handled in handlers)
			if (path === '/api/users/profile' && method === 'GET') {
				return handleGetUserProfile(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/users/profile' && method === 'PUT') {
				return handleUpdateUserProfile(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/users/password' && method === 'PUT') {
				return handleChangePassword(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/users/avatar' && method === 'POST') {
				return handleUploadAvatar(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// WEBHOOK ROUTES
			// ============================================

			// Webhook (no auth required for AWS)
			if (path === '/webhook/aws-cloudwatch' && method === 'POST') {
				return handleWebhook(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// PUSH NOTIFICATION ROUTES
			// ============================================

			if (path === '/api/push-token' && method === 'POST') {
				return handleRegisterPushToken(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/test/send-alert' && method === 'POST') {
				return handleSendTestAlert(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// INCIDENT ROUTES
			// ============================================

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

			// Update incident status
			if (path === '/api/incidents-status' && method === 'PUT') {
				return handleUpdateIncidentStatus(request, this.env, CORS_HEADERS);
			}

			// Resolve incident
			if (path.startsWith('/api/incidents/') && path.endsWith('/resolve') && method === 'POST') {
				return handleResolveIncident(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// INCIDENT COMMENT ROUTES
			// ============================================

			if (path === '/api/incidents-comment' && method === 'POST') {
				return handlePostIncidentComment(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/incidents-comment' && method === 'GET') {
				return handleFetchIncidentComment(request, this.env, CORS_HEADERS);
			}

			// ============================================
			// ON-CALL ROUTES
			// ============================================

			if (path === '/api/oncall/team' && method === 'GET') {
				return handleGetCurrentOnCallByTeamId(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/current' && method === 'GET') {
				return handleGetAllCurrentOnCall(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/all' && method === 'GET') {
				return handleGetAllOnCallUsers(request, this.env, CORS_HEADERS);
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

			if (path === '/api/oncall/schedule' && method === 'PUT') {
				return handleUpdateOnCallSchedule(request, this.env, CORS_HEADERS);
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

			if (path === '/api/oncall/schedule/config' && method === 'GET') {
				return handleGetScheduleConfig(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/oncall/schedule/config' && method === 'PUT') {
				return handleUpdateScheduleConfig(request, this.env, CORS_HEADERS);
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

			// ============================================
			// EMAIL ROUTES
			// ============================================

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

			// ============================================
			// TEAM MANAGEMENT ROUTES (Add this section)
			// ============================================

			// Create a new team
			if (path === '/api/teams/create' && method === 'POST') {
				return handleCreateTeam(request, this.env, CORS_HEADERS);
			}

			// Get all teams
			if (path === '/api/teams/all' && method === 'GET') {
				return handleGetAllTeams(request, this.env, CORS_HEADERS);
			}

			// Get team by ID
			if (path === '/api/teams/by-id' && method === 'GET') {
				return handleGetTeamById(request, this.env, CORS_HEADERS);
			}

			// Get team members
			if (path === '/api/teams/members' && method === 'GET') {
				return handleGetTeamMembers(request, this.env, CORS_HEADERS);
			}

			// Get users available for team assignment
			if (path === '/api/teams/available-users' && method === 'GET') {
				return handleGetAvailableUsers(request, this.env, CORS_HEADERS);
			}

			// Add member to team
			if (path === '/api/teams/members/add' && method === 'POST') {
				return handleAddTeamMember(request, this.env, CORS_HEADERS);
			}

			// Remove member from team
			if (path === '/api/teams/members/remove' && method === 'POST') {
				return handleRemoveTeamMember(request, this.env, CORS_HEADERS);
			}

			// Change team member role (with auto-swap for Primary ↔ Backup)
			if (path === '/api/teams/members/role' && method === 'PUT') {
				return handleChangeTeamRole(request, this.env, CORS_HEADERS);
			}

			// Transfer member between teams
			if (path === '/api/teams/members/transfer' && method === 'POST') {
				return handleTransferTeamMember(request, this.env, CORS_HEADERS);
			}


			// ============================================
			// 404 NOT FOUND
			// ============================================

			return new Response(JSON.stringify({
				error: 'Not found',
				path: path,
				method: method
			}), {
				status: 404,
				headers: CORS_HEADERS
			});

		} catch (error) {
			console.error('Request error:', error);
			return new Response(JSON.stringify({
				error: 'Internal server error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}), {
				status: 500,
				headers: CORS_HEADERS
			});
		}
	}
}
