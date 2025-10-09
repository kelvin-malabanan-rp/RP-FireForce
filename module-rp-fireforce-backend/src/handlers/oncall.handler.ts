// handlers/oncall.handlers.ts
import {ApiResponse, CurrentOnCall, Env} from '../types';
import { OnCallService } from '../services/oncall.service';

const json = (obj: any, init?: ResponseInit) =>
	new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init });

export async function handleGetCurrentOnCallByTeamId(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const teamId = url.searchParams.get('teamId');

		if (!teamId) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "teamId is required",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 400,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		const svc = new OnCallService(env);
		const current = await svc.getCurrentOnCallByTeamId(teamId);

		if (!current) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "No active on-call found for this team",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 404,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		const successResponse: ApiResponse<CurrentOnCall> = {
			httpStatus: "OK",
			message: "Current on-call retrieved successfully",
			data: current
		};

		return new Response(JSON.stringify(successResponse), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	} catch (err) {
		console.error('Error getting current on-call:', err);

		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: (err as Error).message || 'Failed to get current on-call',
			data: null
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	}
}

// ALL CURRENT ON CALL USERS
export async function handleGetAllCurrentOnCall(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const svc = new OnCallService(env);
		const current = await svc.getAllCurrentOnCall();

		// ✅ Fix: Check if the object exists and has data
		if (!current || (!current.primary && !current.backup && !current.escalation)) {
			const errorResponse: ApiResponse<null> = {
				httpStatus: "ERROR",
				message: "No active on-call assignments found",
				data: null
			};
			return new Response(JSON.stringify(errorResponse), {
				status: 404,
				headers: { ...corsHeaders, "Content-Type": "application/json" }
			});
		}

		const successResponse: ApiResponse<any> = { // ✅ Change from any[] to any
			httpStatus: "OK",
			message: "Retrieved current on-call assignments successfully",
			data: current // ✅ This is now { primary: [], backup: [], escalation: [] }
		};

		return new Response(JSON.stringify(successResponse), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
	} catch (err) {
		console.error('Error getting all current on-call:', err);

		const errorResponse: ApiResponse<null> = {
			httpStatus: "ERROR",
			message: (err as Error).message || "Failed to get current on-call assignments",
			data: null
		};

		return new Response(JSON.stringify(errorResponse), {
			status: 500,
			headers: { ...corsHeaders, "Content-Type": "application/json" }
		});
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

export async function handleGetUserTeam(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const userId = url.searchParams.get('userId');

		if (!userId) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "userId is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const oncallService = new OnCallService(env);

		const team = await oncallService.getUserTeam(userId);

		if (!team) {
			return new Response(JSON.stringify({
				httpStatus: "NOT_FOUND",
				message: "User is not assigned to any team",
				data: null
			}), {
				status: 404,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<typeof team> = {
			httpStatus: "OK",
			message: `Retrieved team successfully`,
			data: team
		};

		console.log(`Retrieved team for user: ${userId}`);

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Error fetching user team:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: "An error occurred while fetching user team",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
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

		await svc.refreshCurrentAssignments(body.teamId).catch(() => { /* non-fatal */ });

		return json({ success: true }, { headers });
	} catch (err) {
		console.error('Error updating schedule config:', err);
		return json({ success: false, error: 'Failed to update schedule config', message: (err as Error).message }, { status: 500, headers });
	}
}

export async function handleGetUsersForEmergencyOverride(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const body = await request.json() as { emails: string[] };

		if (!body.emails || !Array.isArray(body.emails) || body.emails.length === 0) {
			return json({
				httpStatus: "BAD_REQUEST",
				message: "emails array is required",
				data: null
			}, {
				status: 400,
				headers
			});
		}

		const svc = new OnCallService(env);
		const users = await svc.usersForEmergencyOverride(body.emails);

		return json({
			httpStatus: "OK",
			message: `Retrieved ${users.length} users with push token data`,
			data: users
		}, {
			headers
		});

	} catch (err) {
		console.error('Error getting users for emergency override:', err);
		return json({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: "Failed to get users for emergency override",
			data: null
		}, {
			status: 500,
			headers
		});
	}
}

// ✅ NEW: Get escalation policy for a team
export async function handleGetEscalationPolicy(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const teamId = url.searchParams.get('teamId');

		if (!teamId) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'teamId is required'
			}, {
				status: 400,
				headers
			});
		}

		const svc = new OnCallService(env);
		const policy = await svc.getEscalationPolicy(teamId);

		if (!policy) {
			return json({
				success: false,
				httpStatus: 'NOT_FOUND',
				message: 'No active escalation policy found for this team'
			}, {
				status: 404,
				headers
			});
		}

		return json({
			success: true,
			httpStatus: 'OK',
			data: policy
		}, {
			headers
		});
	} catch (err) {
		console.error('Error getting escalation policy:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to get escalation policy',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}

// ✅ NEW: Get all on-call data for calendar view
export async function handleGetOnCallCalendarData(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const days = parseInt(url.searchParams.get('days') || '30');
		const teamId = url.searchParams.get('teamId') || undefined;

		console.log('[oncall-handler] Getting calendar data for', days, 'days');

		const svc = new OnCallService(env);

		// Get all teams with their members
		const teams = await svc.getOnCallTeams();

		// Build calendar data for each team
		const calendarData = await Promise.all(
			teams.map(async (team) => {
				// Skip if filtering by specific team and this isn't it
				if (teamId && team.id !== teamId) return null;

				// Get schedule for this team
				const schedule = await svc.getOnCallSchedule(team.id, days);

				return {
					teamId: team.id,
					teamName: team.name,
					timezone: team.timezone,
					members: team.members,
					schedule: schedule
				};
			})
		);

		// Filter out null entries
		const filteredData = calendarData.filter(data => data !== null);

		return json({
			success: true,
			httpStatus: 'OK',
			data: filteredData,
			metadata: {
				totalTeams: filteredData.length,
				days: days,
				generatedAt: new Date().toISOString()
			}
		}, {
			headers
		});
	} catch (err) {
		console.error('Error getting calendar data:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to get calendar data',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}

// ✅ NEW: Get detailed team with members and current assignments
export async function handleGetTeamDetails(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const teamId = url.searchParams.get('teamId');

		if (!teamId) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'teamId is required'
			}, {
				status: 400,
				headers
			});
		}

		const svc = new OnCallService(env);

		// Get team info
		const teams = await svc.getOnCallTeams();
		const team = teams.find(t => t.id === teamId);

		if (!team) {
			return json({
				success: false,
				httpStatus: 'NOT_FOUND',
				error: 'Team not found'
			}, {
				status: 404,
				headers
			});
		}

		// Get current on-call for this team
		const currentOnCall = await svc.getCurrentOnCallByTeamId(teamId);

		// Get schedule config
		const scheduleConfig = await svc.getScheduleConfig(teamId);

		return json({
			success: true,
			httpStatus: 'OK',
			data: {
				team: {
					id: team.id,
					name: team.name,
					timezone: team.timezone,
					memberCount: team.members.length
				},
				members: team.members,
				currentOnCall: currentOnCall,
				scheduleConfig: scheduleConfig
			}
		}, {
			headers
		});
	} catch (err) {
		console.error('Error getting team details:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to get team details',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}
// handlers/oncall.handlers.ts

// ✅ UPDATED: Create a new on-call schedule (using service)
export async function handleCreateOnCallSchedule(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const body = await request.json() as {
			teamId: string;
			name?: string;
			rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
			rotationLengthHours: number;
			rotationStartISO: string;
			members: Array<{
				userId: string;
				role: 'primary' | 'backup' | 'escalation';
				orderIndex: number;
				isActive: boolean;
			}>;
		};

		// Validation
		if (!body?.teamId || !body?.rotationType || !body?.rotationLengthHours || !body?.rotationStartISO) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'Missing required fields',
				required: ['teamId', 'rotationType', 'rotationLengthHours', 'rotationStartISO']
			}, {
				status: 400,
				headers
			});
		}

		if (!Array.isArray(body.members) || body.members.length === 0) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'At least one team member is required'
			}, {
				status: 400,
				headers
			});
		}

		console.log('[oncall-handler] Creating new schedule for team:', body.teamId);

		const svc = new OnCallService(env);

		const scheduleName = body.name || `${body.rotationType}-rotation-${Date.now()}`;

		// ✅ Use service method instead of direct SQL
		const result = await svc.createSchedule({
			teamId: body.teamId,
			name: scheduleName,
			rotationType: body.rotationType,
			rotationLengthHours: body.rotationLengthHours,
			rotationStartISO: body.rotationStartISO,
			members: body.members
		});

		// Generate initial current assignments
		await svc.refreshCurrentAssignments(body.teamId);

		return json({
			success: true,
			httpStatus: 'OK',
			data: {
				scheduleId: result.scheduleId,
				teamId: body.teamId,
				name: scheduleName,
				rotationType: body.rotationType,
				memberCount: result.memberCount
			},
			message: 'On-call schedule created successfully'
		}, {
			status: 201,
			headers
		});
	} catch (err) {
		console.error('Error creating on-call schedule:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to create on-call schedule',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}

// ✅ UPDATED: Delete schedule (using service)
export async function handleDeleteOnCallSchedule(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const scheduleId = url.searchParams.get('scheduleId');

		if (!scheduleId) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'scheduleId is required'
			}, {
				status: 400,
				headers
			});
		}

		console.log('[oncall-handler] Deactivating schedule:', scheduleId);

		const svc = new OnCallService(env);
		await svc.deleteSchedule(scheduleId);

		return json({
			success: true,
			httpStatus: 'OK',
			message: 'Schedule deactivated successfully'
		}, {
			headers
		});
	} catch (err) {
		console.error('Error deleting schedule:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to delete schedule',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}

// ✅ UPDATED: Get all schedules (using service)
export async function handleGetAllSchedules(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const teamId = url.searchParams.get('teamId') || undefined;
		const includeInactive = url.searchParams.get('includeInactive') === 'true';

		const svc = new OnCallService(env);
		const schedules = await svc.getAllSchedules({ teamId, includeInactive });

		return json({
			success: true,
			httpStatus: 'OK',
			data: schedules,
			count: schedules.length
		}, {
			headers
		});
	} catch (err) {
		console.error('Error getting all schedules:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to get schedules',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}

// ✅ NEW: Update an existing on-call schedule
export async function handleUpdateOnCallSchedule(
	request: Request,
	env: Env,
	headers: HeadersInit
): Promise<Response> {
	try {
		const body = await request.json() as {
			scheduleId: string;
			name?: string;
			rotationType?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
			rotationLengthHours?: number;
			rotationStartISO?: string;
			isActive?: boolean;
			members?: Array<{
				userId: string;
				role: 'primary' | 'backup' | 'escalation';
				orderIndex: number;
				isActive: boolean;
			}>;
		};

		// Validation
		if (!body?.scheduleId) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'scheduleId is required'
			}, {
				status: 400,
				headers
			});
		}

		// Check if at least one field to update is provided
		if (!body.name && !body.rotationType && !body.rotationLengthHours &&
			!body.rotationStartISO && body.isActive === undefined && !body.members) {
			return json({
				success: false,
				httpStatus: 'ERROR',
				error: 'At least one field to update is required'
			}, {
				status: 400,
				headers
			});
		}

		console.log('[oncall-handler] Updating schedule:', body.scheduleId);

		const svc = new OnCallService(env);
		await svc.updateSchedule(body);

		return json({
			success: true,
			httpStatus: 'OK',
			message: 'Schedule updated successfully'
		}, {
			headers
		});
	} catch (err) {
		console.error('Error updating schedule:', err);
		return json({
			success: false,
			httpStatus: 'ERROR',
			error: 'Failed to update schedule',
			message: (err as Error).message
		}, {
			status: 500,
			headers
		});
	}
}
