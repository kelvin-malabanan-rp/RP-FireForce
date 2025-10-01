// handlers/oncall.handlers.ts
import { Env } from '../types';
import { OnCallService } from '../services/oncall.service';

const json = (obj: any, init?: ResponseInit) =>
	new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init });

export async function handleGetCurrentOnCall(url: URL, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId') || undefined;
		const svc = new OnCallService(env);
		const current = await svc.getCurrentOnCall(teamId);
		if (!current) return json({ success: false, error: 'No active on-call found' }, { status: 404, headers });
		return json({ success: true, object: current }, { headers });
	} catch (err) {
		console.error('Error getting current on-call:', err);
		return json({ success: false, error: 'Failed to get current on-call', message: (err as Error).message }, { status: 500, headers });
	}
}

export async function handleGetOnCallSchedule(url: URL, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId');
		const days = parseInt(url.searchParams.get('days') || '7', 10);
		if (!teamId) return json({ success: false, error: 'teamId is required' }, { status: 400, headers });

		const svc = new OnCallService(env);
		const schedule = await svc.getOnCallSchedule(teamId, days);
		return json({ success: true, object: { schedule, teamId, days } }, { headers });
	} catch (err) {
		console.error('Error getting on-call schedule:', err);
		return json({ success: false, error: 'Failed to get on-call schedule', message: (err as Error).message }, { status: 500, headers });
	}
}

export async function handleGetOnCallTeams(env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const svc = new OnCallService(env);
		const teams = await svc.getOnCallTeams();
		return json({ success: true, object: teams }, { headers });
	} catch (err) {
		console.error('Error getting on-call teams:', err);
		return json({ success: false, error: 'Failed to get on-call teams', message: (err as Error).message }, { status: 500, headers });
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
			return json({ success: false, error: 'Missing required fields' }, { status: 400, headers });
		}

		const svc = new OnCallService(env);

		// Service locates the active assignment in the given window.
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

		return json({ success: true, object: { id: overrideId, ...body } }, { headers });
	} catch (err) {
		console.error('Error creating override:', err);
		return json({ success: false, error: 'Failed to create override', message: (err as Error).message }, { status: 500, headers });
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
			return json({ success: false, error: 'Missing required fields' }, { status: 400, headers });
		}

		const svc = new OnCallService(env);
		const result = await svc.escalateIncident({
			teamId: body.teamId,
			incidentId: body.incidentId,
			reason: body.reason,
			priority: body.priority ?? 'high',
			currentLevel: body.currentLevel ?? 0,
		});

		return json({ success: true, object: result }, { headers });
	} catch (err) {
		console.error('Error escalating incident:', err);
		return json({ success: false, error: 'Failed to escalate incident', message: (err as Error).message }, { status: 500, headers });
	}
}

/* ------------------------- NEW: Schedule Config -------------------------- */

/**
 * GET /api/oncall/schedule/config?teamId=...
 * Returns rotation settings + ordered members for Manage Schedule screen.
 */
export async function handleGetScheduleConfig(url: URL, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId');
		if (!teamId) return json({ success: false, error: 'teamId is required' }, { status: 400, headers });

		const svc = new OnCallService(env);
		const config = await svc.getScheduleConfig(teamId);
		return json({ success: true, object: config }, { headers });
	} catch (err) {
		console.error('Error getting schedule config:', err);
		return json({ success: false, error: 'Failed to get schedule config', message: (err as Error).message }, { status: 500, headers });
	}
}

/**
 * PUT /api/oncall/schedule/config
 * Body:
 * {
 *   teamId: string,
 *   rotationType: 'daily'|'weekly'|'biweekly'|'monthly',
 *   rotationLengthHours: number,
 *   rotationStartISO: string,
 *   members: [{ userId, role, orderIndex, isActive }]
 * }
 */
export async function handleUpdateScheduleConfig(request: Request, env: Env, headers: HeadersInit): Promise<Response> {
	try {
		const body = await request.json() as {
			teamId: string;
			rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
			rotationLengthHours: number;
			rotationStartISO: string;
			members: Array<{ userId: string; role: 'primary'|'backup'|'escalation'; orderIndex: number; isActive: boolean }>;
		};

		if (!body?.teamId || !body?.rotationType || !body?.rotationLengthHours || !body?.rotationStartISO || !Array.isArray(body?.members)) {
			return json({ success: false, error: 'Missing or invalid fields' }, { status: 400, headers });
		}

		const svc = new OnCallService(env);
		await svc.updateScheduleConfig({
			teamId: body.teamId,
			rotationType: body.rotationType,
			rotationLengthHours: body.rotationLengthHours,
			rotationStartISO: body.rotationStartISO,
			members: body.members,
		});

		// Optionally re-materialize current assignment after changes:
		await svc.refreshCurrentAssignments(body.teamId).catch(() => { /* non-fatal */ });

		return json({ success: true }, { headers });
	} catch (err) {
		console.error('Error updating schedule config:', err);
		return json({ success: false, error: 'Failed to update schedule config', message: (err as Error).message }, { status: 500, headers });
	}
}
