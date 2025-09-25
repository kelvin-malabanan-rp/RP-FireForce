// handlers/incident.handler.ts
import {ApiResponse, Env, Incident, IncidentFilters, IncidentStats} from '../types';
import {IncidentService} from "../services/incident.services";

export async function handleGetIncidents(
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const params: IncidentFilters = {
		timeframe: (url.searchParams.get('timeframe') as '24h' | '7d' | '30d' | 'all') || 'all', // Add 'all' here and change default
		status: url.searchParams.get('status') || undefined,
		severity: url.searchParams.get('severity') || undefined
	};
	try {
		const incidentService = new IncidentService(env);
		const incidents = await incidentService.getIncidents(params);

		const response: ApiResponse<Incident[]> = {
			httpStatus: "OK",
			message: "Successfully retrieved incidents",
			data: incidents
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error fetching incidents:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch incidents' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleGetStats(
	url: URL,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const timeframe = (url.searchParams.get('timeframe') as '24h' | '7d' | '30d' | 'all') || 'all';

	try {
		const incidentService = new IncidentService(env);
		const stats = await incidentService.getStats(timeframe);
		const response: ApiResponse<IncidentStats> = {
			httpStatus: "OK",
			message: "Successfully retrieved incidents",
			data: stats
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error fetching incident stats:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch incident stats' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleTestIncident(
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const incidentService = new IncidentService(env);
		const testAlarm = incidentService.createTestAlarm();
		const result = await incidentService.processCloudWatchAlarm(testAlarm);

		return new Response(JSON.stringify({
			message: 'Test incident created',
			result
		}), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error creating test incident:', error);
		return new Response(JSON.stringify({ error: 'Failed to create test incident' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}
