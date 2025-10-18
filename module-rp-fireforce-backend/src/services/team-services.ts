// services/team.service.ts - FIXED TO MATCH SCHEMA
import { Env } from "../types";

/**
 * TABLES MODIFIED BY THIS SERVICE:
 *
 * 1. oncall_teams - Team information
 * 2. oncall_team_members - Team membership and roles
 * 3. oncall_assignments - Schedule assignments and dates
 * 4. escalation_chains - Escalation order levels
 * 5. oncall_schedules - Team schedules
 *
 * Role to Level Mapping:
 * - primary = level 0
 * - backup = level 1
 * - escalation = level 2
 */

interface TeamMember {
	id: string;
	userId: string;
	email: string;
	firstName: string;
	lastName: string;
	displayName: string;
	avatarUrl: string;
	role: string;
	orderIndex: number;
	isActive: boolean;
}

interface CreateTeamRequest {
	name: string;
	description?: string;
	createdBy: string;  // Still accept it from frontend, but won't store in DB
}

interface Team {
	id: string;
	name: string;
	description: string;
	timezone: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

interface AddMemberRequest {
	userId: string;
	teamId: string;
	role: 'primary' | 'backup' | 'escalation';
	orderIndex?: number;
}

interface RemoveMemberRequest {
	userId: string;
	teamId: string;
}

interface ChangeRoleRequest {
	userId: string;
	teamId: string;
	newRole: 'primary' | 'backup' | 'escalation';
}

export class TeamServices {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * Map role to escalation level
	 */
	private getRoleLevel(role: string): number {
		if (role === 'primary') return 0;
		if (role === 'backup') return 1;
		if (role === 'escalation') return 2;
		return 3;
	}

	/**
	 * Create a new team
	 * MODIFIES: oncall_teams, oncall_schedules
	 *
	 * SCHEMA MATCH:
	 * oncall_teams: id, name, description, timezone, is_active, created_at, updated_at
	 * oncall_schedules: id, team_id, name, rotation_type, rotation_start, rotation_length_hours, is_active, created_at, updated_at
	 */
	async createTeam(request: CreateTeamRequest): Promise<{ success: boolean; message: string; teamId?: string }> {
		try {
			console.log('🏗️ Creating new team:', request.name);

			// Validate inputs
			if (!request.name || request.name.trim().length === 0) {
				return { success: false, message: 'Team name is required' };
			}

			// Check for duplicate team name
			const existingTeam = await this.env.DB.prepare(`
				SELECT id FROM oncall_teams WHERE LOWER(name) = LOWER(?) AND is_active = 1
			`).bind(request.name.trim()).first();

			if (existingTeam) {
				return { success: false, message: 'A team with this name already exists' };
			}

			const teamId = crypto.randomUUID();
			const description = request.description?.trim() || '';

			// 1️⃣ Create the team - EXACT SCHEMA MATCH
			await this.env.DB.prepare(`
				INSERT INTO oncall_teams (
					id, name, description, timezone, is_active, created_at, updated_at
				) VALUES (?, ?, ?, 'America/New_York', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`).bind(teamId, request.name.trim(), description).run();

			console.log(`✅ Team created: ${teamId}`);

			// 2️⃣ Create default schedule for the team - EXACT SCHEMA MATCH
			const scheduleId = crypto.randomUUID();
			await this.env.DB.prepare(`
				INSERT INTO oncall_schedules (
					id, team_id, name, rotation_type, rotation_start, rotation_length_hours,
					is_active, created_at, updated_at
				) VALUES (?, ?, ?, 'manual', datetime('now'), 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`).bind(
				scheduleId,
				teamId,
				`${request.name.trim()} Schedule`
			).run();

			console.log(`✅ Default schedule created: ${scheduleId}`);

			return {
				success: true,
				message: 'Team created successfully',
				teamId
			};

		} catch (error) {
			console.error('❌ Error creating team:', error);
			throw new Error('Failed to create team');
		}
	}

	/**
	 * Get all active teams
	 * READS: oncall_teams
	 */
	async getAllTeams(): Promise<Team[]> {
		try {
			console.log('📋 Fetching all teams');

			const result = await this.env.DB.prepare(`
				SELECT
					id,
					name,
					description,
					timezone,
					is_active as isActive,
					created_at as createdAt,
					updated_at as updatedAt
				FROM oncall_teams
				WHERE is_active = 1
				ORDER BY name ASC
			`).all();

			console.log(`✅ Found ${result.results.length} teams`);
			return result.results as Team[];

		} catch (error) {
			console.error('❌ Error fetching teams:', error);
			throw new Error('Failed to fetch teams');
		}
	}

	/**
	 * Get a specific team by ID
	 * READS: oncall_teams
	 */
	async getTeamById(teamId: string): Promise<Team | null> {
		try {
			console.log('🔍 Fetching team:', teamId);

			const result = await this.env.DB.prepare(`
				SELECT
					id,
					name,
					description,
					timezone,
					is_active as isActive,
					created_at as createdAt,
					updated_at as updatedAt
				FROM oncall_teams
				WHERE id = ? AND is_active = 1
			`).bind(teamId).first();

			return result as Team | null;

		} catch (error) {
			console.error('❌ Error fetching team:', error);
			throw new Error('Failed to fetch team');
		}
	}

	/**
	 * Get all members of a team
	 * READS: oncall_team_members, users
	 */
	async getTeamMembers(teamId: string): Promise<TeamMember[]> {
		try {
			console.log('📋 Fetching team members for:', teamId);

			const result = await this.env.DB.prepare(`
				SELECT
					otm.id,
					otm.user_id as userId,
					u.email,
					u.first_name as firstName,
					u.last_name as lastName,
					u.display_name as displayName,
					u.avatar_url as avatarUrl,
					otm.role,
					otm.order_index as orderIndex,
					otm.is_active as isActive
				FROM oncall_team_members otm
						 JOIN users u ON otm.user_id = u.id
				WHERE otm.team_id = ? AND otm.is_active = 1 AND u.is_active = 1
				ORDER BY
					CASE otm.role
						WHEN 'primary' THEN 1
						WHEN 'backup' THEN 2
						WHEN 'escalation' THEN 3
						ELSE 4
						END,
					otm.order_index ASC,
					u.first_name ASC
			`).bind(teamId).all();

			console.log(`✅ Found ${result.results.length} team members`);
			return result.results as TeamMember[];

		} catch (error) {
			console.error('❌ Error fetching team members:', error);
			throw new Error('Failed to fetch team members');
		}
	}

	/**
	 * Get users not in any team (available for assignment)
	 * READS: users, oncall_team_members
	 */
	async getAvailableUsers(): Promise<any[]> {
		try {
			console.log('👥 Fetching available users...');

			const result = await this.env.DB.prepare(`
				SELECT
					u.id,
					u.email,
					u.first_name as firstName,
					u.last_name as lastName,
					u.display_name as displayName,
					u.avatar_url as avatarUrl,
					u.is_active as isActive
				FROM users u
				WHERE u.is_active = 1
				  AND u.id NOT IN (
					SELECT DISTINCT user_id
					FROM oncall_team_members
					WHERE is_active = 1
				)
				ORDER BY u.first_name ASC
			`).all();

			console.log(`✅ Found ${result.results.length} available users`);
			return result.results as any[];

		} catch (error) {
			console.error('❌ Error fetching available users:', error);
			throw new Error('Failed to fetch available users');
		}
	}

	/**
	 * Add a user to a team
	 * MODIFIES: oncall_team_members, oncall_assignments, escalation_chains
	 *
	 * IMPORTANT: Handles reactivation if user was previously removed
	 * Works with new schema where UNIQUE constraint is on (team_id, user_id)
	 */
	async addMemberToTeam(request: AddMemberRequest): Promise<{ success: boolean; message: string }> {
		try {
			console.log('➕ Adding user to team:', request);

			// Validate inputs
			if (!request.userId || !request.teamId || !request.role) {
				return { success: false, message: 'Missing required fields: userId, teamId, and role are required' };
			}

			// Validate role
			const validRoles = ['primary', 'backup', 'escalation'];
			const normalizedRole = request.role.toLowerCase();
			if (!validRoles.includes(normalizedRole)) {
				return { success: false, message: 'Invalid team role. Must be: primary, backup, or escalation' };
			}

			const level = this.getRoleLevel(normalizedRole);

			// Check if user exists
			const user = await this.env.DB.prepare(`
				SELECT id, email FROM users WHERE id = ? AND is_active = 1
			`).bind(request.userId).first();
			if (!user) {
				return { success: false, message: 'User not found or inactive' };
			}

			// Check if team exists
			const team = await this.env.DB.prepare(`
				SELECT id, name FROM oncall_teams WHERE id = ? AND is_active = 1
			`).bind(request.teamId).first();
			if (!team) {
				return { success: false, message: 'Team not found or inactive' };
			}

			// Check if already active
			const existingActive = await this.env.DB.prepare(`
			SELECT id FROM oncall_team_members
			WHERE team_id = ? AND user_id = ? AND is_active = 1
		`).bind(request.teamId, request.userId).first();
			if (existingActive) {
				return { success: false, message: 'User is already a member of this team' };
			}

			console.log(`✓ Adding ${user.email} as ${normalizedRole} (level ${level})`);

			// Get next order index
			const orderIndexResult = await this.env.DB.prepare(`
			SELECT COALESCE(MAX(order_index), -1) + 1 as nextIndex
			FROM oncall_team_members WHERE team_id = ?
		`).bind(request.teamId).first();
			const orderIndex = request.orderIndex ?? (orderIndexResult?.nextIndex as number) ?? 0;

			// 1️⃣ Handle oncall_team_members
			const existingMember = await this.env.DB.prepare(`
				SELECT id FROM oncall_team_members
				WHERE team_id = ? AND user_id = ?
			`).bind(request.teamId, request.userId).first();

			if (existingMember) {
				// Reactivate
				await this.env.DB.prepare(`
				UPDATE oncall_team_members
				SET is_active = 1, role = ?, order_index = ?
				WHERE team_id = ? AND user_id = ?
			`).bind(normalizedRole, orderIndex, request.teamId, request.userId).run();
				console.log('✅ Reactivated in oncall_team_members');
			} else {
				// New member
				const memberId = crypto.randomUUID();
				await this.env.DB.prepare(`
				INSERT INTO oncall_team_members (
					id, team_id, user_id, role, order_index, is_active, created_at
				) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
			`).bind(memberId, request.teamId, request.userId, normalizedRole, orderIndex).run();
				console.log('✅ Added to oncall_team_members');
			}

			// 2️⃣ Handle escalation_chains - Simple DELETE + INSERT
			// With new constraint on (team_id, user_id), we can safely delete and recreate
			await this.env.DB.prepare(`
			DELETE FROM escalation_chains
			WHERE team_id = ? AND user_id = ?
		`).bind(request.teamId, request.userId).run();

			const chainId = crypto.randomUUID();
			await this.env.DB.prepare(`
			INSERT INTO escalation_chains (
				id, team_id, user_id, level, is_active, created_at
			) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
		`).bind(chainId, request.teamId, request.userId, level).run();

			console.log(`✅ Escalation chain set to level ${level}`);

			// 3️⃣ Handle oncall_assignments
			const activeSchedules = await this.env.DB.prepare(`
			SELECT id FROM oncall_schedules WHERE team_id = ? AND is_active = 1
		`).bind(request.teamId).all();

			if (activeSchedules.results.length > 0) {
				for (const schedule of activeSchedules.results) {
					const existingAssignment = await this.env.DB.prepare(`
						SELECT id FROM oncall_assignments
						WHERE schedule_id = ? AND user_id = ? AND team_id = ?
					`).bind(schedule.id, request.userId, request.teamId).first();

					if (existingAssignment) {
						// Update existing
						await this.env.DB.prepare(`
							UPDATE oncall_assignments
							SET role = ?, is_active = 1, dates = '[]'
							WHERE id = ?
						`).bind(normalizedRole, existingAssignment.id).run();
					} else {
						// Insert new
						const assignmentId = crypto.randomUUID();
						await this.env.DB.prepare(`
							INSERT INTO oncall_assignments (
								id, schedule_id, user_id, team_id, dates, role, is_active, created_at
							) VALUES (?, ?, ?, ?, '[]', ?, 1, CURRENT_TIMESTAMP)
						`).bind(assignmentId, schedule.id, request.userId, request.teamId, normalizedRole).run();
					}
				}
				console.log(`✅ Assignments updated with role "${normalizedRole}"`);
			}

			return {
				success: true,
				message: `User successfully added to team as ${normalizedRole}`
			};

		} catch (error) {
			console.error('❌ Error adding member to team:', error);
			throw new Error(`Failed to add member to team: ${error.message || 'Unknown error'}`);
		}
	}

	/**
	 * Remove a user from a team
	 * MODIFIES: oncall_team_members, oncall_assignments, escalation_chains
	 */
	async removeMemberFromTeam(request: RemoveMemberRequest): Promise<{ success: boolean; message: string }> {
		try {
			console.log('➖ Removing user from team:', request);

			const member = await this.env.DB.prepare(`
				SELECT otm.id, u.email
				FROM oncall_team_members otm
						 JOIN users u ON otm.user_id = u.id
				WHERE otm.team_id = ? AND otm.user_id = ? AND otm.is_active = 1
			`).bind(request.teamId, request.userId).first();

			if (!member) {
				return { success: false, message: 'User is not a member of this team' };
			}

			// 1️⃣ Soft delete from oncall_team_members
			await this.env.DB.prepare(`
				UPDATE oncall_team_members SET is_active = 0 WHERE team_id = ? AND user_id = ?
			`).bind(request.teamId, request.userId).run();

			// 2️⃣ Soft delete from oncall_assignments
			await this.env.DB.prepare(`
				UPDATE oncall_assignments SET is_active = 0 WHERE team_id = ? AND user_id = ? AND is_active = 1
			`).bind(request.teamId, request.userId).run();

			// 3️⃣ Soft delete from escalation_chains
			await this.env.DB.prepare(`
				UPDATE escalation_chains SET is_active = 0 WHERE team_id = ? AND user_id = ?
			`).bind(request.teamId, request.userId).run();

			console.log(`✅ User ${member.email} removed from all tables`);

			return { success: true, message: 'User successfully removed from team' };

		} catch (error) {
			console.error('❌ Error removing member from team:', error);
			throw new Error('Failed to remove member from team');
		}
	}

	/**
	 * Change a user's role in their team
	 * MODIFIES: oncall_team_members, oncall_assignments, escalation_chains
	 * SPECIAL: Swaps dates and levels when changing primary ↔ backup
	 */
	async changeTeamRole(request: ChangeRoleRequest): Promise<{ success: boolean; message: string }> {
		try {
			console.log('🔄 === STARTING ROLE CHANGE ===');

			const member = await this.env.DB.prepare(`
				SELECT otm.id, otm.role, u.email
				FROM oncall_team_members otm
						 JOIN users u ON otm.user_id = u.id
				WHERE otm.team_id = ? AND otm.user_id = ? AND otm.is_active = 1
			`).bind(request.teamId, request.userId).first();

			if (!member) return { success: false, message: 'User is not a member of this team' };

			const normalizedRole = request.newRole.toLowerCase();
			const oldRole = member.role?.toLowerCase();

			if (oldRole === normalizedRole) {
				return { success: false, message: `User already has the role: ${request.newRole}` };
			}

			const validRoles = ['primary', 'backup', 'escalation'];
			if (!validRoles.includes(normalizedRole)) {
				return { success: false, message: 'Invalid team role. Must be: primary, backup, or escalation' };
			}

			const newLevel = this.getRoleLevel(normalizedRole);
			const oldLevel = this.getRoleLevel(oldRole || '');

			console.log(`📝 ${member.email}: ${oldRole} (L${oldLevel}) → ${normalizedRole} (L${newLevel})`);

			// ✅ SWAP when changing primary ↔ backup
			const shouldSwap = (oldRole === 'primary' && normalizedRole === 'backup') ||
				(oldRole === 'backup' && normalizedRole === 'primary');

			if (shouldSwap) {
				console.log('🔄 SWAP MODE');

				const otherPerson = await this.env.DB.prepare(`
					SELECT otm.user_id, u.email
					FROM oncall_team_members otm
							 JOIN users u ON otm.user_id = u.id
					WHERE otm.team_id = ? AND LOWER(otm.role) = ? AND otm.is_active = 1 AND otm.user_id != ?
				`).bind(request.teamId, normalizedRole, request.userId).first();

				if (otherPerson) {
					console.log(`🎯 Swapping with: ${otherPerson.email}`);

					// Get both users' assignments
					const userAssignment = await this.env.DB.prepare(`
						SELECT id, dates FROM oncall_assignments
						WHERE team_id = ? AND user_id = ? AND is_active = 1 LIMIT 1
					`).bind(request.teamId, request.userId).first();

					const otherAssignment = await this.env.DB.prepare(`
						SELECT id, dates FROM oncall_assignments
						WHERE team_id = ? AND user_id = ? AND is_active = 1 LIMIT 1
					`).bind(request.teamId, otherPerson.user_id).first();

					const userDates = userAssignment?.dates || '[]';
					const otherDates = otherAssignment?.dates || '[]';

					// UPDATE USER: new role + other's dates + new level
					await this.env.DB.prepare(`
						UPDATE oncall_team_members SET role = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
					`).bind(normalizedRole, request.teamId, request.userId).run();

					if (userAssignment) {
						await this.env.DB.prepare(`
							UPDATE oncall_assignments SET role = ?, dates = ? WHERE id = ?
						`).bind(normalizedRole, otherDates, userAssignment.id).run();
					}

					await this.env.DB.prepare(`
						UPDATE escalation_chains SET level = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
					`).bind(newLevel, request.teamId, request.userId).run();

					// UPDATE OTHER PERSON: old role + user's dates + old level
					await this.env.DB.prepare(`
						UPDATE oncall_team_members SET role = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
					`).bind(oldRole, request.teamId, otherPerson.user_id).run();

					if (otherAssignment) {
						await this.env.DB.prepare(`
							UPDATE oncall_assignments SET role = ?, dates = ? WHERE id = ?
						`).bind(oldRole, userDates, otherAssignment.id).run();
					}

					await this.env.DB.prepare(`
						UPDATE escalation_chains SET level = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
					`).bind(oldLevel, request.teamId, otherPerson.user_id).run();

					console.log(`✅ SWAPPED: ${member.email} ↔ ${otherPerson.email}`);

					return { success: true, message: `Roles swapped successfully` };
				}
			}

			// NO SWAP - just update role and level
			console.log('📝 No swap - updating role only');

			// 1️⃣ Update oncall_team_members
			await this.env.DB.prepare(`
				UPDATE oncall_team_members SET role = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
			`).bind(normalizedRole, request.teamId, request.userId).run();

			// 2️⃣ Update oncall_assignments
			await this.env.DB.prepare(`
				UPDATE oncall_assignments SET role = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
			`).bind(normalizedRole, request.teamId, request.userId).run();

			// 3️⃣ Update escalation_chains
			await this.env.DB.prepare(`
				UPDATE escalation_chains SET level = ? WHERE team_id = ? AND user_id = ? AND is_active = 1
			`).bind(newLevel, request.teamId, request.userId).run();

			console.log('✅ Updated all 3 tables');

			return { success: true, message: `User role successfully changed to ${normalizedRole}` };

		} catch (error) {
			console.error('❌ Error changing team role:', error);
			throw new Error('Failed to change team role');
		}
	}

	/**
	 * Transfer a user from one team to another
	 * MODIFIES: oncall_team_members, oncall_assignments, escalation_chains
	 */
	async transferMember(userId: string, fromTeamId: string, toTeamId: string, newRole: string): Promise<{ success: boolean; message: string }> {
		try {
			console.log('🔀 Transferring user between teams');

			const fromMember = await this.env.DB.prepare(`
				SELECT otm.id, u.email
				FROM oncall_team_members otm
						 JOIN users u ON otm.user_id = u.id
				WHERE otm.team_id = ? AND otm.user_id = ? AND otm.is_active = 1
			`).bind(fromTeamId, userId).first();

			if (!fromMember) {
				return { success: false, message: 'User is not in the source team' };
			}

			const toTeam = await this.env.DB.prepare(`
				SELECT id FROM oncall_teams WHERE id = ? AND is_active = 1
			`).bind(toTeamId).first();

			if (!toTeam) {
				return { success: false, message: 'Destination team not found' };
			}

			const existingInTo = await this.env.DB.prepare(`
				SELECT id FROM oncall_team_members
				WHERE team_id = ? AND user_id = ? AND is_active = 1
			`).bind(toTeamId, userId).first();

			if (existingInTo) {
				return { success: false, message: 'User is already in the destination team' };
			}

			const validRoles = ['primary', 'backup', 'escalation'];
			const normalizedRole = newRole.toLowerCase();

			if (!validRoles.includes(normalizedRole)) {
				return { success: false, message: 'Invalid team role' };
			}

			const orderIndexResult = await this.env.DB.prepare(`
				SELECT COALESCE(MAX(order_index), -1) + 1 as nextIndex
				FROM oncall_team_members WHERE team_id = ?
			`).bind(toTeamId).first();

			const orderIndex = (orderIndexResult?.nextIndex as number) ?? 0;
			const level = this.getRoleLevel(normalizedRole);

			// REMOVE from old team (all 3 tables)
			await this.env.DB.prepare(`
				UPDATE oncall_team_members SET is_active = 0 WHERE team_id = ? AND user_id = ?
			`).bind(fromTeamId, userId).run();

			await this.env.DB.prepare(`
				UPDATE oncall_assignments SET is_active = 0 WHERE team_id = ? AND user_id = ?
			`).bind(fromTeamId, userId).run();

			await this.env.DB.prepare(`
				UPDATE escalation_chains SET is_active = 0 WHERE team_id = ? AND user_id = ?
			`).bind(fromTeamId, userId).run();

			// ADD to new team (all 3 tables)
			const newMemberId = crypto.randomUUID();
			await this.env.DB.prepare(`
				INSERT INTO oncall_team_members (
					id, team_id, user_id, role, order_index, is_active, created_at
				) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
			`).bind(newMemberId, toTeamId, userId, normalizedRole, orderIndex).run();

			const newChainId = crypto.randomUUID();
			await this.env.DB.prepare(`
				INSERT INTO escalation_chains (
					id, team_id, user_id, level, is_active, created_at
				) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
			`).bind(newChainId, toTeamId, userId, level).run();

			const activeSchedules = await this.env.DB.prepare(`
				SELECT id FROM oncall_schedules WHERE team_id = ? AND is_active = 1
			`).bind(toTeamId).all();

			if (activeSchedules.results.length > 0) {
				for (const schedule of activeSchedules.results) {
					const assignmentId = crypto.randomUUID();
					await this.env.DB.prepare(`
						INSERT INTO oncall_assignments (
							id, schedule_id, user_id, team_id, dates, role, is_active, created_at
						) VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
					`).bind(assignmentId, schedule.id, userId, toTeamId, '[]', normalizedRole).run();
				}
			}

			console.log(`✅ Transferred ${fromMember.email} from ${fromTeamId} to ${toTeamId}`);

			return { success: true, message: `User successfully transferred to ${toTeamId} as ${normalizedRole}` };

		} catch (error) {
			console.error('❌ Error transferring member:', error);
			throw new Error('Failed to transfer member');
		}
	}
}
