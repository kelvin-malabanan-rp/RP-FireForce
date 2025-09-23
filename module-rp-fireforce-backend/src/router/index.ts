// router/index.ts
import { Env } from '../types';
import { CORS_HEADERS } from '../constants/cors';
import {handleHealth} from "../handlers/health.handlers";
import {handleGetIncidents, handleGetStats, handleTestIncident} from "../handlers/incident.handlers";
import {handleWebhook} from "../handlers/webook.handlers";

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
			// Route handlers
			if (path === '/health' && method === 'GET') {
				return handleHealth(CORS_HEADERS);
			}

			if (path === '/api/incidents' && method === 'GET') {
				return handleGetIncidents(url, this.env, CORS_HEADERS);
			}

			if (path === '/api/incidents/stats' && method === 'GET') {
				return handleGetStats(url, this.env, CORS_HEADERS);
			}

			if (path === '/webhook/aws-cloudwatch' && method === 'POST') {
				return handleWebhook(request, this.env, CORS_HEADERS);
			}

			if (path === '/api/test/trigger-incident' && method === 'POST') {
				return handleTestIncident(this.env, CORS_HEADERS);
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
