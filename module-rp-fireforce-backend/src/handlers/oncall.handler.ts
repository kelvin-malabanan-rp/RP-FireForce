// handlers/oncall.handlers.ts
import { Env } from '../types';
import { OnCallService } from '../services/oncall.service';

export async function handleGetCurrentOnCall(url: URL, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId') || undefined;
		const svc = new OnCallService(env);
		const current = await svc.getCurrentOnCall(teamId);

		if (!current) {
			return new Response(JSON.stringify({ success: false, error: 'No active on-call found' }), { status: 404, headers });
		}
		return new Response(JSON.stringify({ success: true, object: current }), { headers });
	} catch (err) {
		console.error('Error getting current on-call:', err);
		return new Response(JSON.stringify({ success: false, error: 'Failed to get current on-call', message: (err as Error).message }), { status: 500, headers });
	}
}

export async function handleGetOnCallSchedule(url: URL, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId');
		const days = parseInt(url.searchParams.get('days') || '7', 10);
		if (!teamId) return new Response(JSON.stringify({ success: false, error: 'teamId is required' }), { status: 400, headers });

		const svc = new OnCallService(env);
		const schedule = await svc.getOnCallSchedule(teamId, days);
		return new Response(JSON.stringify({ success: true, object: { schedule, teamId, days } }), { headers });
	} catch (err) {
		console.error('Error getting on-call schedule:', err);
		return new Response(JSON.stringify({ success: false, error: 'Failed to get on-call schedule', message: (err as Error).message }), { status: 500, headers });
	}
}

export async function handleGetOnCallTeams(env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const svc = new OnCallService(env);
		const teams = await svc.getOnCallTeams();
		return new Response(JSON.stringify({ success: true, object: teams }), { headers });
	} catch (err) {
		console.error('Error getting on-call teams:', err);
		return new Response(JSON.stringify({ success: false, error: 'Failed to get on-call teams', message: (err as Error).message }), { status: 500, headers });
	}
}

export async function handleCreateOverride(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const body = await request.json() as {
			teamId: string;
			startTime: string;
			endTime: string;
			userId: string;
			role: 'primary' | 'backup';
			reason?: string;
			originalUserId?: string;
			createdBy?: string;
		};

		if (!body.teamId || !body.startTime || !body.endTime || !body.userId || !body.role) {
			return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers });
		}

		const svc = new OnCallService(env);

		// Ask the service for the currently active assignment in this window.
		const active = await svc.findActiveAssignmentForWindow(
			body.teamId,
			body.role,
			new Date(body.startTime),
			new Date(body.endTime),
		);

		const scheduleId = active?.scheduleId ?? `schedule-${body.teamId}`;
		const originalUserId = body.originalUserId ?? active?.userId ?? body.userId;

		const overrideId = await svc.createOverride(
			body.teamId,
			body.role,
			scheduleId,
			originalUserId,
			body.userId,
			new Date(body.startTime),
			new Date(body.endTime),
			body.reason || '',
			body.createdBy || 'system'
		);

		return new Response(JSON.stringify({ success: true, object: { id: overrideId, ...body } }), { headers });
	} catch (err) {
		console.error('Error creating override:', err);
		return new Response(JSON.stringify({ success: false, error: 'Failed to create override', message: (err as Error).message }), { status: 500, headers });
	}
}

export async function handleEscalateIncident(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const body = await request.json() as {
			teamId: string;
			incidentId: string;
			reason: string;
			priority?: 'low' | 'medium' | 'high' | 'critical';
			currentLevel?: number;
		};

		if (!body.teamId || !body.incidentId || !body.reason) {
			return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400, headers });
		}

		const svc = new OnCallService(env);
		const result = await svc.escalateIncident({
			teamId: body.teamId,
			incidentId: body.incidentId,
			reason: body.reason,
			priority: body.priority ?? 'high',
			currentLevel: body.currentLevel ?? 0,
		});

		return new Response(JSON.stringify({ success: true, object: result }), { headers });
	} catch (err) {
		console.error('Error escalating incident:', err);
		return new Response(JSON.stringify({ success: false, error: 'Failed to escalate incident', message: (err as Error).message }), { status: 500, headers });
	}
}
