import { Env } from '../types';
import { OnCallService } from '../services/oncall.service';

export async function handleGetCurrentOnCall(
	url: URL,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId');

		const onCallService = new OnCallService(env);
		const currentOnCall = await onCallService.getCurrentOnCall(teamId || undefined);

		if (!currentOnCall) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'No active on-call found'
				}),
				{ status: 404, headers }
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				object: currentOnCall
			}),
			{ headers }
		);
	} catch (error) {
		console.error('Error getting current on-call:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to get current on-call',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{ status: 500, headers }
		);
	}
}

export async function handleGetOnCallSchedule(
	url: URL,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const teamId = url.searchParams.get('teamId');
		const days = parseInt(url.searchParams.get('days') || '7', 10);

		if (!teamId) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'teamId is required'
				}),
				{ status: 400, headers }
			);
		}

		const onCallService = new OnCallService(env);
		const schedule = await onCallService.getOnCallSchedule(teamId, days);

		return new Response(
			JSON.stringify({
				success: true,
				object: { schedule, teamId, days }
			}),
			{ headers }
		);
	} catch (error) {
		console.error('Error getting on-call schedule:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to get on-call schedule',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{ status: 500, headers }
		);
	}
}

export async function handleGetOnCallTeams(
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const onCallService = new OnCallService(env);
		const teams = await onCallService.getOnCallTeams();

		return new Response(
			JSON.stringify({
				success: true,
				object: teams
			}),
			{ headers }
		);
	} catch (error) {
		console.error('Error getting on-call teams:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to get on-call teams',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{ status: 500, headers }
		);
	}
}

export async function handleCreateOverride(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
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

		// Validate required fields
		if (!body.teamId || !body.startTime || !body.endTime || !body.userId || !body.role) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Missing required fields'
				}),
				{ status: 400, headers }
			);
		}

		const onCallService = new OnCallService(env);

		// First, get the current schedule for this team and time period
		const currentSchedule = await env.DB.prepare(`
			SELECT id, user_id
			FROM oncall_assignments
			WHERE team_id = ?
			  AND role = ?
			  AND start_time <= ?
			  AND end_time >= ?
			  AND is_active = 1
			ORDER BY start_time DESC
			LIMIT 1
		`).bind(
			body.teamId,
			body.role,
			body.startTime,
			body.endTime
		).first();

		const scheduleId = currentSchedule?.id || `schedule-${body.teamId}`;
		const originalUserId = body.originalUserId || currentSchedule?.user_id || body.userId;

		// Create the override
		const overrideId = await onCallService.createOverride(
			scheduleId,
			originalUserId,
			body.userId,
			new Date(body.startTime),
			new Date(body.endTime),
			body.reason || '',
			body.createdBy || 'system'
		);

		return new Response(
			JSON.stringify({
				success: true,
				object: {
					id: overrideId,
					...body
				}
			}),
			{ headers }
		);
	} catch (error) {
		console.error('Error creating override:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to create override',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{ status: 500, headers }
		);
	}
}

export async function handleEscalateIncident(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const body = await request.json() as {
			teamId: string;
			incidentId: string;
			reason: string;
			priority?: 'low' | 'medium' | 'high' | 'critical';
			currentLevel?: number;
		};

		// Validate required fields
		if (!body.teamId || !body.incidentId || !body.reason) {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Missing required fields'
				}),
				{ status: 400, headers }
			);
		}

		const now = new Date().toISOString();
		const currentLevel = body.currentLevel || 0;

		// Get the on-call service to find escalation policy
		const onCallService = new OnCallService(env);
		const escalationPolicy = await onCallService.getEscalationPolicy(body.teamId);

		// Get escalation chain for the team
		let escalationChain = await env.DB.prepare(`
			SELECT
				ec.level,
				ec.user_id,
				u.email,
				u.first_name,
				u.last_name,
				u.phone_number
			FROM escalation_chains ec
					 JOIN users u ON ec.user_id = u.id
			WHERE ec.team_id = ?
			  AND ec.level > ?
			  AND ec.is_active = 1
			ORDER BY ec.level
			LIMIT 1
		`).bind(body.teamId, currentLevel).first();

		if (!escalationChain) {
			// No more escalation levels, try to get team lead or manager
			const teamLead = await env.DB.prepare(`
				SELECT
					u.id as user_id,
					u.email,
					u.first_name,
					u.last_name,
					u.phone_number
				FROM team_members tm
						 JOIN users u ON tm.user_id = u.id
				WHERE tm.team_id = ?
				  AND tm.role IN ('lead', 'manager')
				  AND tm.is_active = 1
				LIMIT 1
			`).bind(body.teamId).first();

			if (!teamLead) {
				// Try to get current on-call as last resort
				const currentOnCall = await onCallService.getCurrentOnCall(body.teamId);
				if (currentOnCall?.primary) {
					escalationChain = {
						user_id: currentOnCall.primary.id,
						email: currentOnCall.primary.email,
						first_name: currentOnCall.primary.firstName,
						last_name: currentOnCall.primary.lastName,
						phone_number: currentOnCall.primary.phoneNumber,
						level: 999
					};
				} else {
					return new Response(
						JSON.stringify({
							success: false,
							error: 'No escalation path available'
						}),
						{ status: 404, headers }
					);
				}
			} else {
				escalationChain = { ...teamLead, level: 999 };
			}
		}

		// Create escalation record
		const escalationId = crypto.randomUUID();
		await env.DB.prepare(`
			INSERT INTO incident_escalations (
				id, incident_id, team_id, escalated_to_user_id,
				escalation_level, reason, priority, created_at, status
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
		`).bind(
			escalationId,
			body.incidentId,
			body.teamId,
			escalationChain.user_id,
			escalationChain.level,
			body.reason,
			body.priority || 'high',
			now
		).run();

		// Update incident with new escalation level
		await env.DB.prepare(`
			UPDATE incidents
			SET escalation_level = ?,
				updated_at = ?,
				priority = CASE
							   WHEN ? = 'critical' THEN 'critical'
							   WHEN priority = 'critical' THEN 'critical'
							   ELSE ?
					END
			WHERE id = ?
		`).bind(
			escalationChain.level,
			now,
			body.priority || 'high',
			body.priority || 'high',
			body.incidentId
		).run();

		const escalation = {
			id: escalationId,
			incidentId: body.incidentId,
			teamId: body.teamId,
			escalatedTo: {
				userId: escalationChain.user_id,
				email: escalationChain.email,
				name: `${escalationChain.first_name} ${escalationChain.last_name}`,
				level: escalationChain.level
			},
			reason: body.reason,
			priority: body.priority || 'high',
			timestamp: now,
			status: 'active',
			escalationPolicy: escalationPolicy
		};

		return new Response(
			JSON.stringify({
				success: true,
				object: escalation
			}),
			{ headers }
		);
	} catch (error) {
		console.error('Error escalating incident:', error);
		return new Response(
			JSON.stringify({
				success: false,
				error: 'Failed to escalate incident',
				message: error instanceof Error ? error.message : 'Unknown error'
			}),
			{ status: 500, headers }
		);
	}
}
