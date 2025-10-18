// handlers/team-handlers.ts
import { Env, ApiResponse } from '../types';
import {TeamServices} from "../services/team-services";

/**
 * POST /api/teams/create
 * Create a new team
 */
export async function handleCreateTeam(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			name: string;
			description?: string;
			createdBy: string;
		};

		// Validate request body
		if (!body.name || !body.createdBy) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "name and createdBy are required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const result = await teamService.createTeam({
			name: body.name,
			description: body.description,
			createdBy: body.createdBy
		});

		if (!result.success) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: result.message,
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: result.message,
			data: {
				teamId: result.teamId,
				name: body.name,
				description: body.description
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Create team error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to create team",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * GET /api/teams/all
 * Get all teams
 */
export async function handleGetAllTeams(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const teamService = new TeamServices(env);
		const teams = await teamService.getAllTeams();

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: "Teams retrieved successfully",
			data: {
				teamCount: teams.length,
				teams
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Get all teams error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to get teams",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * GET /api/teams/by-id
 * Get a specific team by ID
 */
export async function handleGetTeamById(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const teamId = url.searchParams.get('teamId');

		if (!teamId) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "teamId is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const team = await teamService.getTeamById(teamId);

		if (!team) {
			return new Response(JSON.stringify({
				httpStatus: "NOT_FOUND",
				message: "Team not found",
				data: null
			}), {
				status: 404,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: "Team retrieved successfully",
			data: team
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Get team by ID error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to get team",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * GET /api/teams/members
 * Get all members of a team
 */
export async function handleGetTeamMembers(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const url = new URL(request.url);
		const teamId = url.searchParams.get('teamId');

		if (!teamId) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "Team ID is required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const members = await teamService.getTeamMembers(teamId);

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: "Team members retrieved successfully",
			data: {
				teamId,
				memberCount: members.length,
				members
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Get team members error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to get team members",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * GET /api/teams/available-users
 * Get users not assigned to any team
 */
export async function handleGetAvailableUsers(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const teamService = new TeamServices(env);
		const users = await teamService.getAvailableUsers();

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: "Available users retrieved successfully",
			data: {
				userCount: users.length,
				users
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Get available users error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to get available users",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * POST /api/teams/members/add
 * Add a user to a team
 */
export async function handleAddTeamMember(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			userId: string;
			teamId: string;
			teamRole: 'primary' | 'backup' | 'escalation';
		};

		// Validate request body
		if (!body.userId || !body.teamId || !body.teamRole) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "userId, teamId, and teamRole are required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const result = await teamService.addMemberToTeam({
			userId: body.userId,
			teamId: body.teamId,
			role: body.teamRole
		});

		if (!result.success) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: result.message,
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: result.message,
			data: {
				userId: body.userId,
				teamId: body.teamId,
				teamRole: body.teamRole
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Add team member error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to add team member",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * POST /api/teams/members/remove
 * Remove a user from a team
 */
export async function handleRemoveTeamMember(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			userId: string;
			teamId: string;
		};

		// Validate request body
		if (!body.userId || !body.teamId) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "userId and teamId are required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const result = await teamService.removeMemberFromTeam({
			userId: body.userId,
			teamId: body.teamId
		});

		if (!result.success) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: result.message,
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: result.message,
			data: {
				userId: body.userId,
				teamId: body.teamId
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Remove team member error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to remove team member",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * PUT /api/teams/members/role
 * Change a user's role in their team
 * IMPORTANT: Automatically swaps roles when changing Primary ↔ Backup
 */
export async function handleChangeTeamRole(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			userId: string;
			teamId: string;
			newRole: 'primary' | 'backup' | 'escalation';
		};

		// Validate request body
		if (!body.userId || !body.teamId || !body.newRole) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "userId, teamId, and newRole are required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const result = await teamService.changeTeamRole({
			userId: body.userId,
			teamId: body.teamId,
			newRole: body.newRole
		});

		if (!result.success) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: result.message,
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: result.message,
			data: {
				userId: body.userId,
				teamId: body.teamId,
				newRole: body.newRole
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Change team role error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to change team role",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

/**
 * POST /api/teams/members/transfer
 * Transfer a user from one team to another
 */
export async function handleTransferTeamMember(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			userId: string;
			fromTeamId: string;
			toTeamId: string;
			newRole: 'primary' | 'backup' | 'escalation';
		};

		// Validate request body
		if (!body.userId || !body.fromTeamId || !body.toTeamId || !body.newRole) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: "userId, fromTeamId, toTeamId, and newRole are required",
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const teamService = new TeamServices(env);
		const result = await teamService.transferMember(
			body.userId,
			body.fromTeamId,
			body.toTeamId,
			body.newRole
		);

		if (!result.success) {
			return new Response(JSON.stringify({
				httpStatus: "BAD_REQUEST",
				message: result.message,
				data: null
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const response: ApiResponse<any> = {
			httpStatus: "OK",
			message: result.message,
			data: {
				userId: body.userId,
				fromTeamId: body.fromTeamId,
				toTeamId: body.toTeamId,
				newRole: body.newRole
			}
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Transfer team member error:', error);
		return new Response(JSON.stringify({
			httpStatus: "INTERNAL_SERVER_ERROR",
			message: error instanceof Error ? error.message : "Failed to transfer team member",
			data: null
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}
