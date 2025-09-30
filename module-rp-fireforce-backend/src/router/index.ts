// router/index.ts
import { Env } from '../types';
import { CORS_HEADERS } from '../constants/cors';
import { handleHealth } from "../handlers/health.handlers";
import {
	handleCreateIncident,
	handleGetIncidents,
	handleGetStats,
	handleIncidentResponse, handlePostIncidentComment,
	handleSelectIncident,
	handleTestIncident, handleUpdateIncidentStatus
} from "../handlers/incident.handlers";
import { handleWebhook } from "../handlers/webook.handlers";
import {handleLogin, handleLogout} from "../handlers/auth.handlers";
import {handleRegisterPushToken, handleSendTestAlert} from "../handlers/push-notification.handlers";
import {handleFetchIncidentComment} from "../handlers/incident-comment.handlers";
import {
	handleCreateOverride, handleEscalateIncident,
	handleGetCurrentOnCall,
	handleGetOnCallSchedule,
	handleGetOnCallTeams
} from "../handlers/oncall.handler";

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
