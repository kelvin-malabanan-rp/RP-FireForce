// services/oncall.service.ts
import {Env, OnCallTeam, OnCallTeamOfUser, OnCallUser} from '../types';
import { DatabaseService } from './database.service';
import { CurrentOnCall } from '../types';
import {EmailService} from "./email.service";

export class OnCallService {
	private dbService: DatabaseService;

	constructor(env: Env) {
		this.dbService = new DatabaseService(env);
	}

	// ✅ Helper: Check if today's date is in the dates array
	private isOnCallToday(datesJson: string): boolean {
		try {
			const dates = JSON.parse(datesJson) as string[];
			const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD
			return dates.includes(today);
		} catch (error) {
			console.error('[oncall] Error parsing dates JSON:', error);
			return false;
		}
	}

	// ✅ Helper: Check if a specific date is in the dates array
	private isOnCallOnDate(datesJson: string, targetDate: string): boolean {
		try {
			const dates = JSON.parse(datesJson) as string[];
			const dateOnly = targetDate.split('T')[0]; // Get YYYY-MM-DD
			return dates.includes(dateOnly);
		} catch (error) {
			console.error('[oncall] Error parsing dates JSON:', error);
			return false;
		}
	}

	// services/oncall.service.ts - KEY METHODS TO UPDATE

// ✅ 1. Update getCurrentOnCallByTeamId to return array format
	async getCurrentOnCallByTeamId(teamId: string): Promise<{
		primary: any[];
		backup: any[];
		escalation: any[];
	} | null> {
		try {
			if (!teamId) {
				console.error('[oncall] getCurrentOnCallByTeamId called with undefined teamId');
				return null;
			}

			const sql = `
				SELECT
					oa.id, oa.schedule_id, oa.team_id, oa.user_id, oa.role,
					oa.dates,
					u.email,
					u.first_name || ' ' || u.last_name as fullname,
					t.name as team_name,
					t.timezone,
					pt.id as push_token_id,
					pt.token as push_token,
					pt.fcm_token as fcm_token,
					pt.device_type as device_type
				FROM oncall_assignments oa
						 JOIN users u ON oa.user_id = u.id
						 JOIN oncall_teams t ON oa.team_id = t.id
						 LEFT JOIN push_token_user_assoc ptua ON ptua.user_id = u.id
						 LEFT JOIN push_tokens pt ON pt.id = ptua.push_token_id AND pt.is_active = 1
				WHERE oa.is_active = 1
				  AND oa.team_id = ?
				ORDER BY
					CASE oa.role
						WHEN 'primary' THEN 1
						WHEN 'backup' THEN 2
						WHEN 'escalation' THEN 3
						END
			`;

			const { results } = await this.dbService.db
				.prepare(sql)
				.bind(teamId)
				.all();

			if (!results || results.length === 0) {
				console.log(`[oncall] No assignments found for team ${teamId}`);
				return null;
			}

			// ✅ Filter by checking if today is in their dates array
			const activeToday = (results as any[]).filter(row =>
				this.isOnCallToday(row.dates)
			);

			if (activeToday.length === 0) {
				console.log(`[oncall] No on-call members for team ${teamId} today`);
				return null;
			}

			// ✅ Group by role (same format as getAllCurrentOnCall)
			const groupedByRole = {
				primary: [] as any[],
				backup: [] as any[],
				escalation: [] as any[]
			};

			activeToday.forEach((row: any) => {
				const member = {
					userId: row.user_id,
					fullname: row.fullname,
					email: row.email,
					role: row.role,
					teamId: row.team_id,
					teamName: row.team_name,
					timezone: row.timezone,
					pushTokenId: row.push_token_id || null,
					pushToken: row.push_token || null,
					fcmToken: row.fcm_token || null,
					deviceType: row.device_type || null
				};

				if (row.role === 'primary') {
					groupedByRole.primary.push(member);
				} else if (row.role === 'backup') {
					groupedByRole.backup.push(member);
				} else if (row.role === 'escalation') {
					groupedByRole.escalation.push(member);
				}
			});

			console.log(`[oncall] getCurrentOnCallByTeamId for ${teamId}:`, {
				primary: groupedByRole.primary.length,
				backup: groupedByRole.backup.length,
				escalation: groupedByRole.escalation.length
			});

			return groupedByRole;
		} catch (e) {
			console.error('[oncall] getCurrentOnCallByTeamId error:', e);
			return null;
		}
	}

// ✅ 2. FIXED escalateIncident - now uses numeric levels
	async escalateIncident(args: {
		teamId: string;
		incidentId: string;
		reason: string;
		priority: 'low' | 'medium' | 'high' | 'critical';
		currentLevel: number;  // ✅ Use numeric level instead of userRole
	}) {
		try {
			const now = new Date().toISOString();

			console.log(`[oncall] Escalating incident ${args.incidentId} for team ${args.teamId}`);
			console.log(`[oncall] Current level: ${args.currentLevel}`);

			// ✅ Determine next level (numeric)
			const nextLevel = args.currentLevel + 1;

			// Map level to role name
			const levelToRole: Record<number, string> = {
				1: 'backup',
				2: 'escalation'
			};

			const targetRole = levelToRole[nextLevel];

			if (!targetRole) {
				console.error(`[oncall] Invalid escalation level: ${nextLevel}`);
				throw new Error(`No escalation path available for level ${nextLevel}`);
			}

			console.log(`[oncall] Escalating to level ${nextLevel} (${targetRole})`);

			// Find users with the target role who are on-call today
			const currentOnCall = await this.getCurrentOnCallByTeamId(args.teamId);

			if (!currentOnCall) {
				throw new Error(`No on-call schedule found for team ${args.teamId}`);
			}

			// Get users for the target role
			let targetUsers: any[] = [];

			if (nextLevel === 1) {
				targetUsers = currentOnCall.backup || [];
			} else if (nextLevel === 2) {
				targetUsers = currentOnCall.escalation || [];
			}

			if (targetUsers.length === 0) {
				console.error(`[oncall] No ${targetRole} users found for team ${args.teamId}`);
				throw new Error(`No ${targetRole} users available`);
			}

			console.log(`[oncall] Found ${targetUsers.length} ${targetRole} user(s)`);

			// Record escalation for each user
			const notifiedUsers = [];

			for (const user of targetUsers) {
				const escId = crypto.randomUUID();
				await this.dbService.db.prepare(`
                INSERT INTO incident_escalations
                (id, incident_id, team_id, escalated_to_user_id, escalation_level,
                 reason, priority, status, triggered_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
            `).bind(
					escId,
					args.incidentId,
					args.teamId,
					user.userId,
					nextLevel,  // ✅ Use numeric level (1 or 2)
					args.reason,
					args.priority
				).run();

				notifiedUsers.push({
					userId: user.userId,
					email: user.email,
					fullname: user.fullname,
					role: targetRole,
					pushToken: user.pushToken || null,
					fcmToken: user.fcmToken || null,
				});
			}

			// ✅ Update incident with NUMERIC escalation level
			await this.dbService.db.prepare(`
            UPDATE incidents
            SET escalation_level = ?,
                priority = CASE
                    WHEN ? = 'critical' THEN 'critical'
                    WHEN priority = 'critical' THEN 'critical'
                    ELSE ?
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(nextLevel, args.priority, args.priority, args.incidentId).run();

			const result = {
				success: true,
				object: {
					incidentId: args.incidentId,
					teamId: args.teamId,
					escalatedToLevel: nextLevel,
					escalatedToRole: targetRole,
					notifiedUsers: notifiedUsers
				},
				reason: args.reason,
				priority: args.priority,
				timestamp: now,
				status: 'active',
			};

			console.log(`[oncall] ✅ Escalation completed to level ${nextLevel} (${targetRole})`);
			return result;
		} catch (error) {
			console.error(`[oncall] ❌ Escalation failed:`, error);
			throw error;
		}
	}

	// ✅ UPDATED: Check against dates array
	async getAllCurrentOnCall(): Promise<any> {
		try {
			const sql = `
				SELECT
					oa.id, oa.schedule_id, oa.team_id,
					oa.user_id,
					oa.role,
					oa.dates,
					u.email,
					u.first_name || ' ' || u.last_name as fullname,
					t.name as team_name,
					t.timezone,
					pt.id as push_token_id,
					pt.token as push_token,
					pt.fcm_token as fcm_token,
					pt.device_type as device_type
				FROM oncall_assignments oa
						 JOIN users u ON oa.user_id = u.id
						 JOIN oncall_teams t ON oa.team_id = t.id
						 LEFT JOIN push_token_user_assoc ptua ON ptua.user_id = u.id
						 LEFT JOIN push_tokens pt ON pt.id = ptua.push_token_id AND pt.is_active = 1
				WHERE oa.is_active = 1
				ORDER BY
					CASE oa.role
						WHEN 'primary' THEN 1
						WHEN 'backup' THEN 2
						WHEN 'escalation' THEN 3
						END,
					t.name
			`;

			const { results } = await this.dbService.db.prepare(sql).all();

			// ✅ Filter by checking if today is in their dates array
			const activeToday = (results as any[]).filter(row =>
				this.isOnCallToday(row.dates)
			);

			const groupedByRole = {
				primary: [] as any[],
				backup: [] as any[],
				escalation: [] as any[]
			};

			activeToday.forEach((row: any) => {
				const member = {
					userId: row.user_id,
					fullname: row.fullname,
					email: row.email,
					role: row.role,
					teamId: row.team_id,
					teamName: row.team_name,
					timezone: row.timezone,
					pushTokenId: row.push_token_id || null,
					pushToken: row.push_token || null,
					fcmToken: row.fcm_token || null,
					deviceType: row.device_type || null
				};

				if (row.role === 'primary') {
					groupedByRole.primary.push(member);
				} else if (row.role === 'backup') {
					groupedByRole.backup.push(member);
				} else if (row.role === 'escalation') {
					groupedByRole.escalation.push(member);
				}
			});

			console.log('[oncall] getAllCurrentOnCall results:', {
				primary: groupedByRole.primary.length,
				backup: groupedByRole.backup.length,
				escalation: groupedByRole.escalation.length
			});

			if (groupedByRole.primary.length > 0) {
				console.log('[oncall] Sample PRIMARY user:', {
					userId: groupedByRole.primary[0].userId,
					email: groupedByRole.primary[0].email,
					role: groupedByRole.primary[0].role
				});
			}

			return groupedByRole;
		} catch (e) {
			console.error('[oncall] getAllCurrentOnCall error:', e);
			return null;
		}
	}

	// ✅ NEW: Get all on-call members EXCEPT those active today
	async getAllOnCallUsers(): Promise<any> {
		try {
			const sql = `
				SELECT
					oa.id, oa.schedule_id, oa.team_id,
					oa.user_id,
					oa.role,
					oa.dates,
					u.email,
					u.first_name || ' ' || u.last_name as fullname,
					t.name as team_name,
					t.timezone,
					pt.id as push_token_id,
					pt.token as push_token,
					pt.fcm_token as fcm_token,
					pt.device_type as device_type
				FROM oncall_assignments oa
						 JOIN users u ON oa.user_id = u.id
						 JOIN oncall_teams t ON oa.team_id = t.id
						 LEFT JOIN push_token_user_assoc ptua ON ptua.user_id = u.id
						 LEFT JOIN push_tokens pt ON pt.id = ptua.push_token_id AND pt.is_active = 1
				WHERE oa.is_active = 1
				ORDER BY
					CASE oa.role
						WHEN 'primary' THEN 1
						WHEN 'backup' THEN 2
						WHEN 'escalation' THEN 3
						END,
					t.name
			`;

			const { results } = await this.dbService.db.prepare(sql).all();

			const groupedByRole = {
				primary: [] as any[],
				backup: [] as any[],
				escalation: [] as any[]
			};

			(results as any[]).forEach((row: any) => {
				const member = {
					userId: row.user_id,
					fullname: row.fullname,
					email: row.email,
					role: row.role,
					teamId: row.team_id,
					teamName: row.team_name,
					timezone: row.timezone,
					pushTokenId: row.push_token_id || null,
					pushToken: row.push_token || null,
					fcmToken: row.fcm_token || null,
					deviceType: row.device_type || null
				};

				if (row.role === 'primary') groupedByRole.primary.push(member);
				else if (row.role === 'backup') groupedByRole.backup.push(member);
				else if (row.role === 'escalation') groupedByRole.escalation.push(member);
			});

			return groupedByRole;
		} catch (e) {
			console.error('[oncall] getAllOnCallUsers error:', e);
			return null;
		}
	}

	async usersForEmergencyOverride(emails: string[]): Promise<any[]> {
		try {
			if (!emails || emails.length === 0) {
				return [];
			}

			const placeholders = emails.map(() => '?').join(', ');

			const sql = `
				SELECT
					u.id,
					u.email,
					u.first_name,
					u.last_name,
					u.first_name || ' ' || u.last_name as fullname,
					u.role,
					pt.id as push_token_id,
					pt.token as push_token,
					pt.fcm_token as fcm_token,
					pt.device_type as device_type
				FROM users u
				LEFT JOIN push_token_user_assoc ptua ON ptua.user_id = u.id
				LEFT JOIN push_tokens pt ON pt.id = ptua.push_token_id AND pt.is_active = 1
				WHERE u.email IN (${placeholders})
				  AND u.is_active = 1
				ORDER BY u.first_name, u.last_name
			`;

			const { results } = await this.dbService.db.prepare(sql).bind(...emails).all();

			const mappedResults = (results || []).map((row: any) => ({
				id: row.id,
				userId: row.id,
				email: row.email,
				firstName: row.first_name,
				lastName: row.last_name,
				fullname: row.fullname,
				role: row.role,
				pushTokenId: row.push_token_id || null,
				pushToken: row.push_token || null,
				fcmToken: row.fcm_token || null,
				deviceType: row.device_type || null,
			}));

			console.log('[oncall] usersForEmergencyOverride results:', mappedResults.length);
			if (mappedResults.length > 0) {
				console.log('[oncall] Sample emergency user:', {
					userId: mappedResults[0].userId,
					email: mappedResults[0].email,
					hasPushToken: !!mappedResults[0].pushToken
				});
			}

			return mappedResults;
		} catch (error) {
			console.error('[oncall] Error fetching users with push tokens:', error);
			throw error;
		}
	}

	async getUserTeam(userId: string): Promise<OnCallTeamOfUser | null> {
		try {
			console.log('[oncall] Fetching team for user:', userId);

			const query = `
				SELECT
					ot.id,
					ot.name,
					ot.description,
					ot.timezone
				FROM oncall_teams ot
				INNER JOIN oncall_team_members otm ON otm.team_id = ot.id
				WHERE otm.user_id = ?
				  AND otm.is_active = 1
				  AND ot.is_active = 1
				LIMIT 1
			`;

			const result = await this.dbService.db.prepare(query).bind(userId).first();

			if (!result) {
				console.log('[oncall] No team found for user:', userId);
				return null;
			}

			const team: OnCallTeamOfUser = {
				id: result.id as string,
				name: result.name as string,
				timezone: result.timezone as string,
				fullname: result.description as string,
				email: result.email as string,
			};

			console.log('[oncall] Found team:', team.name, 'for user:', userId);
			return team;
		} catch (error) {
			console.error('[oncall] Error fetching user team:', error);
			throw error;
		}
	}

	private parseOnCallResults(rows: any[]): CurrentOnCall {
		const assignment: CurrentOnCall = {
			scheduleId: rows[0].schedule_id,
			teamId: rows[0].team_id,
			startTime: new Date(),  // Current time
			endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24 hours
			escalation: []
		};

		for (const r of rows) {
			const user: OnCallUser = {
				id: r.user_id,
				email: r.email,
				firstName: r.first_name,
				lastName: r.last_name,
				phoneNumber: r.phone_number,
				role: r.role
			};
			if (r.role === 'primary') assignment.primary = user;
			else if (r.role === 'backup') assignment.backup = user;
			else if (r.role === 'escalation') assignment.escalation!.push(user);
		}
		return assignment;
	}

	async generateCurrentAssignment(teamId?: string): Promise<CurrentOnCall | null> {
		let sql = `
			SELECT s.*, t.timezone
			FROM oncall_schedules s
			JOIN oncall_teams t ON s.team_id = t.id
			WHERE s.is_active = 1
		`;
		const params: any[] = [];
		if (teamId) { sql += ' AND s.team_id = ?'; params.push(teamId); }

		const schedules = await this.dbService.db.prepare(sql).bind(...params).all();
		if (!schedules.results || schedules.results.length === 0) return null;

		return this.calculateRotation(schedules.results[0] as any);
	}

	private async calculateRotation(schedule: any): Promise<CurrentOnCall | null> {
		const members = await this.getTeamMembers(schedule.team_id);
		if (members.length === 0) return null;

		const now = new Date();
		const rotationStart = new Date(schedule.rotation_start);
		const hours = schedule.rotation_length_hours as number;

		const periods = Math.floor((now.getTime() - rotationStart.getTime()) / (hours * 3600_000));
		const periodStart = new Date(rotationStart.getTime() + periods * hours * 3600_000);
		const periodEnd = new Date(periodStart.getTime() + hours * 3600_000);

		const primaryIndex = periods % members.length;
		const backupIndex = (periods + 1) % members.length;

		const assignment: CurrentOnCall = {
			primary: members[primaryIndex],
			backup: members[backupIndex],
			escalation: members.filter((_, i) => i !== primaryIndex && i !== backupIndex),
			scheduleId: schedule.id,
			teamId: schedule.team_id,
			startTime: periodStart,
			endTime: periodEnd
		};

		await this.saveAssignment(assignment);
		return assignment;
	}

	private async getTeamMembers(teamId: string): Promise<OnCallUser[]> {
		const sql = `
			SELECT u.id, u.email, u.first_name, u.last_name, u.phone_number,
				   tm.role, tm.order_index
			FROM oncall_team_members tm
			JOIN users u ON tm.user_id = u.id
			WHERE tm.team_id = ? AND tm.is_active = 1
			ORDER BY tm.order_index, u.first_name
		`;
		const { results } = await this.dbService.db.prepare(sql).bind(teamId).all();
		return (results as any[]).map(r => ({
			id: r.id,
			email: r.email,
			firstName: r.first_name,
			lastName: r.last_name,
			phoneNumber: r.phone_number,
			role: r.role
		}));
	}

	// ✅ UPDATED: Save assignment with dates array for today
	private async saveAssignment(a: CurrentOnCall): Promise<void> {
		const today = new Date().toISOString().split('T')[0];

		const sql = `
			INSERT OR REPLACE INTO oncall_assignments
			(id, schedule_id, user_id, team_id, dates, role, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`;

		if (a.primary) {
			const assignmentId = `assignment-${a.scheduleId}-${a.primary.id}-${Date.now()}`;
			await this.dbService.db.prepare(sql).bind(
				assignmentId,
				a.scheduleId, a.primary.id, a.teamId,
				JSON.stringify([today]), // Single date for today
				'primary', 1
			).run();
		}

		if (a.backup) {
			const assignmentId = `assignment-${a.scheduleId}-${a.backup.id}-${Date.now()}`;
			await this.dbService.db.prepare(sql).bind(
				assignmentId,
				a.scheduleId, a.backup.id, a.teamId,
				JSON.stringify([today]), // Single date for today
				'backup', 1
			).run();
		}
	}

	// ✅ NEW: Create assignment with array of dates
	async createAssignmentWithDates(params: {
		scheduleId: string;
		teamId: string;
		userId: string;
		role: 'primary' | 'backup' | 'escalation';
		dates: string[];  // Array of date strings: ["2025-10-15","2025-10-16"]
	}): Promise<string> {
		try {
			const { scheduleId, teamId, userId, role, dates } = params;

			if (!dates || dates.length === 0) {
				throw new Error('At least one date is required');
			}

			const assignmentId = crypto.randomUUID();
			await this.dbService.db?.prepare(`
				INSERT INTO oncall_assignments
				(id, schedule_id, user_id, team_id, dates, role, is_active, created_at)
				VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
			`).bind(
				assignmentId,
				scheduleId,
				userId,
				teamId,
				JSON.stringify(dates),
				role
			).run();

			console.log(`[oncall] ✅ Created assignment with ${dates.length} date(s) for user ${userId}`);
			return assignmentId;
		} catch (error) {
			console.error('[oncall] Error creating assignment with dates:', error);
			throw error;
		}
	}

	// ✅ NEW: Update assignment dates
	async updateAssignmentDates(params: {
		assignmentId: string;
		dates: string[];
	}): Promise<void> {
		try {
			const { assignmentId, dates } = params;

			await this.dbService.db?.prepare(`
				UPDATE oncall_assignments
				SET dates = ?, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).bind(
				JSON.stringify(dates),
				assignmentId
			).run();

			console.log(`[oncall] ✅ Updated assignment ${assignmentId} with ${dates.length} date(s)`);
		} catch (error) {
			console.error('[oncall] Error updating assignment dates:', error);
			throw error;
		}
	}

	// ✅ NEW: Get dates for an assignment
	async getAssignmentDates(assignmentId: string): Promise<string[]> {
		try {
			const result = await this.dbService.db?.prepare(`
				SELECT dates
				FROM oncall_assignments
				WHERE id = ?
			`).bind(assignmentId).first();

			if (!result || !result.dates) {
				return [];
			}

			return JSON.parse(result.dates as string) as string[];
		} catch (error) {
			console.error('[oncall] Error getting assignment dates:', error);
			return [];
		}
	}

	async getOnCallSchedule(teamId: string, days = 7): Promise<any[]> {
		const out: any[] = [];
		const now = new Date();
		for (let i = 0; i < days; i++) {
			const d = new Date(now);
			d.setDate(d.getDate() + i);
			const dateStr = d.toISOString().split('T')[0];
			const assignment = await this.getOnCallForDate(teamId, dateStr);
			out.push({
				date: dateStr,
				dayOfWeek: d.toLocaleDateString('en-US',{weekday:'long'}),
				assignment
			});
		}
		return out;
	}

	// ✅ NEW: Get on-call for a specific date
	private async getOnCallForDate(teamId: string, date: string): Promise<CurrentOnCall | null> {
		const sql = `
			SELECT oa.*, u.email, u.first_name, u.last_name, u.phone_number
			FROM oncall_assignments oa
					 JOIN users u ON oa.user_id = u.id
			WHERE oa.team_id = ?
			  AND oa.is_active = 1
			ORDER BY oa.role
		`;
		const { results } = await this.dbService.db.prepare(sql).bind(teamId).all();

		if (!results || results.length === 0) return null;

		// Filter by checking if the specific date is in their dates array
		const activeOnDate = (results as any[]).filter(row =>
			this.isOnCallOnDate(row.dates, date)
		);

		if (activeOnDate.length === 0) return null;

		return this.parseOnCallResults(activeOnDate);
	}

	async findActiveAssignmentForWindow(
		teamId: string,
		role: 'primary' | 'backup',
		start: Date,
		end: Date
	): Promise<{ scheduleId: string; userId: string } | null> {
		const startDate = start.toISOString().split('T')[0];

		const sql = `
			SELECT oa.schedule_id, oa.user_id, oa.dates
			FROM oncall_assignments oa
			WHERE oa.team_id = ?
			  AND oa.role = ?
			  AND oa.is_active = 1
		`;

		const { results } = await this.dbService.db.prepare(sql).bind(teamId, role).all();

		if (!results || results.length === 0) return null;

		// Find first assignment that includes the start date
		for (const row of results as any[]) {
			if (this.isOnCallOnDate(row.dates, startDate)) {
				return {
					scheduleId: row.schedule_id,
					userId: row.user_id
				};
			}
		}

		return null;
	}

	async createOverride(
		teamId: string,
		role: 'primary' | 'backup',
		scheduleId: string | null,
		originalUserId: string | null,
		overrideUserId: string,
		start: Date,
		end: Date,
		reason: string,
		createdBy: string
	): Promise<string> {
		const id = crypto.randomUUID();

		await this.dbService.db.prepare(`
			INSERT INTO oncall_overrides
			(id, team_id, schedule_id, original_user_id, replacement_user_id,
			 start_time, end_time, role, reason, status, created_by, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
		`).bind(
			id,
			teamId,
			scheduleId,
			originalUserId ?? null,
			overrideUserId,
			start.toISOString(),
			end.toISOString(),
			role,
			reason ?? '',
			createdBy ?? 'system'
		).run();

		return id;
	}

	async getEscalationPolicy(teamId: string): Promise<any> {
		const row = await this.dbService.db
			.prepare(`SELECT * FROM escalation_policies WHERE team_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1`)
			.bind(teamId)
			.first();
		return row ? { ...(row as any), steps: JSON.parse((row as any).steps) } : null;
	}

	async getOnCallTeams(): Promise<OnCallTeam[]> {
		const sql = `
			SELECT
				t.id,
				t.name,
				t.timezone,
				u.id as user_id,
				u.email,
				u.first_name,
				u.last_name,
				u.phone_number,
				tm.role,
				tm.order_index,
				oa.dates as assignment_dates,
				oa.schedule_id
			FROM oncall_teams t
					 LEFT JOIN oncall_team_members tm ON t.id = tm.team_id AND tm.is_active = 1
					 LEFT JOIN users u ON tm.user_id = u.id
					 LEFT JOIN oncall_assignments oa ON oa.team_id = t.id AND oa.user_id = u.id AND oa.is_active = 1
			WHERE t.is_active = 1
			ORDER BY t.name, tm.order_index
		`;

		const { results } = await this.dbService.db.prepare(sql).all();

		const map = new Map<string, OnCallTeam>();

		for (const r of (results as any[])) {
			if (!map.has(r.id)) {
				map.set(r.id, {
					id: r.id,
					name: r.name,
					timezone: r.timezone,
					members: []
				});
			}

			if (r.user_id) {
				// Parse dates from JSON string
				let dates: string[] = [];
				if (r.assignment_dates) {
					try {
						dates = JSON.parse(r.assignment_dates);
					} catch (error) {
						console.error(`Error parsing dates for user ${r.user_id}:`, error);
						dates = [];
					}
				}

				map.get(r.id)!.members.push({
					id: r.user_id,
					email: r.email,
					firstName: r.first_name,
					lastName: r.last_name,
					phoneNumber: r.phone_number,
					role: r.role,
					scheduleId: r.schedule_id,
					assignedDates: dates  // ✅ Array of dates like ["2025-10-15", "2025-10-16"]
				});
			}
		}

		return Array.from(map.values());
	}

	// ✅ NEW: Create schedule with individual dates
	async createScheduleWithDates(params: {
		teamId: string;
		name: string;
		assignments: Array<{
			userId: string;
			role: 'primary' | 'backup' | 'escalation';
			dates: string[];  // ["2025-10-15","2025-10-16","2025-10-17"]
		}>;
	}): Promise<{ scheduleId: string; assignmentCount: number }> {
		try {
			const { teamId, name, assignments } = params;

			// Create schedule
			const scheduleId = crypto.randomUUID();
			await this.dbService.db?.prepare(`
				INSERT INTO oncall_schedules
				(id, team_id, name, rotation_type, rotation_start, rotation_length_hours, is_active, created_at, updated_at)
				VALUES (?, ?, ?, 'manual', CURRENT_TIMESTAMP, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
			`).bind(scheduleId, teamId, name).run();

			// Deactivate other schedules
			await this.dbService.db?.prepare(`
				UPDATE oncall_schedules SET is_active = 0 WHERE team_id = ? AND id != ?
			`).bind(teamId, scheduleId).run();

			// Create assignments with dates
			for (const assignment of assignments) {
				await this.createAssignmentWithDates({
					scheduleId,
					teamId,
					userId: assignment.userId,
					role: assignment.role,
					dates: assignment.dates
				});
			}

			console.log(`[oncall] ✅ Schedule created with ${assignments.length} assignment(s)`);
			return {
				scheduleId,
				assignmentCount: assignments.length
			};
		} catch (error) {
			console.error('[oncall] Error creating schedule with dates:', error);
			throw error;
		}
	}

	async getScheduleConfig(teamId: string): Promise<{
		teamId: string;
		schedule: {
			id: string;
			rotationType: string;
			rotationLengthHours: number;
			rotationStartISO: string;
		} | null;
		members: Array<{ userId: string; firstName: string; lastName: string; role: string; orderIndex: number; isActive: boolean }>;
	}> {
		const scheduleRow = await this.dbService.db
			.prepare(
				`SELECT id, rotation_type, rotation_length_hours, rotation_start
				 FROM oncall_schedules
				 WHERE team_id = ? AND is_active = 1
				 ORDER BY created_at DESC
				 LIMIT 1`
			)
			.bind(teamId)
			.first();

		const { results: memberRows } = await this.dbService.db
			.prepare(
				`SELECT
					 otm.id, otm.team_id, otm.user_id, otm.role, otm.order_index, otm.is_active,
					 u.username, u.email, u.first_name, u.last_name
				 FROM oncall_team_members otm
						  LEFT JOIN users u ON otm.user_id = u.id
				 WHERE otm.team_id = ?
				 ORDER BY otm.order_index ASC`
			)
			.bind(teamId)
			.all();

		return {
			teamId,
			schedule: scheduleRow
				? {
					id: (scheduleRow as any).id,
					rotationType: (scheduleRow as any).rotation_type,
					rotationLengthHours: (scheduleRow as any).rotation_length_hours,
					rotationStartISO: (scheduleRow as any).rotation_start,
				}
				: null,
			members: (memberRows as any[]).map((r) => ({
				userId: r.user_id,
				role: r.role,
				firstName: r.first_name,
				lastName: r.last_name,
				orderIndex: r.order_index,
				isActive: !!r.is_active,
			})),
		};
	}

	async updateScheduleConfig(args: {
		teamId: string;
		rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
		rotationLengthHours: number;
		rotationStartISO: string;
		members: Array<{ userId: string; role: string; orderIndex: number; isActive: boolean }>;
	}): Promise<void> {
		const { teamId, rotationType, rotationLengthHours, rotationStartISO, members } = args;

		const scheduleId = crypto.randomUUID();
		await this.dbService.db
			.prepare(
				`INSERT INTO oncall_schedules
				 (id, team_id, name, rotation_type, rotation_start, rotation_length_hours, is_active, created_at, updated_at)
				 VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
			)
			.bind(
				scheduleId,
				teamId,
				`${rotationType}-rotation-${Date.now()}`,
				rotationType,
				rotationStartISO,
				rotationLengthHours
			)
			.run();

		await this.dbService.db
			.prepare(`UPDATE oncall_schedules SET is_active = 0 WHERE team_id = ? AND id != ?`)
			.bind(teamId, scheduleId)
			.run();

		await this.dbService.db
			.prepare(`DELETE FROM oncall_team_members WHERE team_id = ?`)
			.bind(teamId)
			.run();

		for (const m of members) {
			await this.dbService.db
				.prepare(
					`INSERT INTO oncall_team_members
						 (id, team_id, user_id, role, order_index, is_active, created_at)
					 VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
				)
				.bind(crypto.randomUUID(), teamId, m.userId, m.role, m.orderIndex, m.isActive ? 1 : 0)
				.run();
		}
	}

	async trackIncidentNotification(incidentId: string, userId: string, notificationType: 'initial' | 'escalation'): Promise<void> {
		const id = crypto.randomUUID();
		await this.dbService.db.prepare(`
			INSERT INTO incident_notifications (id, incident_id, user_id, notification_type, sent_at)
			VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
		`).bind(id, incidentId, userId, notificationType).run();
	}

	async getNotifiedUsers(incidentId: string): Promise<Array<{ userId: string; email: string; firstName: string; lastName: string }>> {
		const sql = `
			SELECT DISTINCT u.id as userId, u.email, u.first_name as firstName, u.last_name as lastName
			FROM incident_notifications n
					 JOIN users u ON n.user_id = u.id
			WHERE n.incident_id = ?
		`;
		const { results } = await this.dbService.db.prepare(sql).bind(incidentId).all();
		return results as any[];
	}

	async sendAllClearNotifications(incidentId: string, resolvedBy: string): Promise<{
		notifiedCount: number;
		users: Array<{ name: string; email: string }>;
	}> {
		const notifiedUsers = await this.getNotifiedUsers(incidentId);
		const incident = await this.dbService.db
			.prepare('SELECT * FROM incidents WHERE id = ?')
			.bind(incidentId)
			.first();

		if (!incident) {
			throw new Error('Incident not found');
		}

		const emailService = new EmailService(this.dbService.env);
		const notifications = [];

		for (const user of notifiedUsers) {
			try {
				await emailService.sendAllClearEmail(incident, user.email);
				notifications.push({
					name: `${user.firstName} ${user.lastName}`,
					email: user.email
				});

				await this.dbService.db.prepare(`
					INSERT INTO incident_notifications (id, incident_id, user_id, notification_type, sent_at)
					VALUES (?, ?, ?, 'all_clear', CURRENT_TIMESTAMP)
				`).bind(crypto.randomUUID(), incidentId, user.userId).run();
			} catch (error) {
				console.error(`[oncall] Failed to send all-clear to ${user.email}:`, error);
			}
		}

		return {
			notifiedCount: notifications.length,
			users: notifications
		};
	}

	async refreshCurrentAssignments(teamId: string): Promise<void> {
		const current = await this.generateCurrentAssignment(teamId);
		if (!current) {
			console.warn('[oncall] No current assignment generated for team', teamId);
		}
	}

	async sendNotification(alert: any, userId: string, type: string, env: Env) {
		const user = await this.dbService.db
			.prepare('SELECT * FROM users WHERE id = ?')
			.bind(userId)
			.first();

		if (!user) return;

		try {
			const emailService = new EmailService(env);
			await emailService.sendIncidentAlert(alert, (user as any).email);
			console.log(`[oncall] Notification sent to ${(user as any).email}`);
		} catch (error) {
			console.error(`[oncall] Failed to send notification to ${(user as any).email}:`, error);
		}
	}

	async deleteSchedule(scheduleId: string): Promise<void> {
		try {
			await this.dbService.db.prepare(`
				UPDATE oncall_schedules
				SET is_active = 0, updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).bind(scheduleId).run();

			console.log('[oncall] ✅ Schedule deactivated:', scheduleId);
		} catch (error) {
			console.error('[oncall] Error deactivating schedule:', error);
			throw error;
		}
	}

	async getAllSchedules(params?: {
		teamId?: string;
		includeInactive?: boolean;
	}): Promise<any[]> {
		try {
			let sql = `
				SELECT s.*, t.name as team_name, t.timezone,
					   COUNT(DISTINCT tm.id) as member_count
				FROM oncall_schedules s
						 JOIN oncall_teams t ON s.team_id = t.id
						 LEFT JOIN oncall_team_members tm ON tm.team_id = s.team_id
				WHERE 1=1
			`;

			const queryParams: any[] = [];

			if (params?.teamId) {
				sql += ' AND s.team_id = ?';
				queryParams.push(params.teamId);
			}

			if (!params?.includeInactive) {
				sql += ' AND s.is_active = 1';
			}

			sql += ' GROUP BY s.id, t.name, t.timezone ORDER BY s.created_at DESC';

			const { results } = await this.dbService.db.prepare(sql).bind(...queryParams).all();
			return results as any[];
		} catch (error) {
			console.error('[oncall] Error getting all schedules:', error);
			throw error;
		}
	}

	async getCalendarData(days: number = 30, teamId?: string): Promise<any[]> {
		try {
			const teams = await this.getOnCallTeams();
			const filteredTeams = teamId ? teams.filter(t => t.id === teamId) : teams;

			const calendarData = await Promise.all(
				filteredTeams.map(async (team) => {
					const schedule = await this.getOnCallSchedule(team.id, days);
					return {
						teamId: team.id,
						teamName: team.name,
						timezone: team.timezone,
						members: team.members,
						memberCount: team.members.length,
						schedule: schedule
					};
				})
			);

			return calendarData;
		} catch (error) {
			console.error('[oncall] Error building calendar data:', error);
			throw error;
		}
	}

async updateScheduleName(scheduleId: string, name: string): Promise<void> {
  try {
    await this.dbService.db.prepare(`
      UPDATE oncall_schedules
      SET name = ?
      WHERE id = ?
    `).bind(name, scheduleId).run();

    console.log('[oncall] ✅ Schedule name updated:', scheduleId);
  } catch (error) {
    console.error('[oncall] Error updating schedule name:', error);
    throw error;
  }
}

async updateScheduleAssignments(params: {
  scheduleId: string;
  teamId: string;
  assignments: Array<{
    userId: string;
    role: 'primary' | 'backup' | 'escalation';
    dates: string[];
  }>;
}): Promise<void> {
  try {
    const { scheduleId, teamId, assignments } = params;

    console.log('[oncall] Updating assignments for dates:', assignments.map(a => a.dates).flat());

    // For each assignment, update or create the assignment for those specific dates
    for (const assignment of assignments) {
      const { userId, role, dates } = assignment;

      // Check if assignment already exists for this user/role/schedule
      const existing = await this.dbService.db.prepare(`
        SELECT id, dates
        FROM oncall_assignments
        WHERE schedule_id = ?
          AND user_id = ?
          AND role = ?
          AND team_id = ?
          AND is_active = 1
      `).bind(scheduleId, userId, role, teamId).first();

      if (existing) {
        // Merge dates: get existing dates and add new ones
        const existingDates = JSON.parse((existing as any).dates || '[]') as string[];
        const mergedDates = Array.from(new Set([...existingDates, ...dates]));

        await this.dbService.db.prepare(`
          UPDATE oncall_assignments
          SET dates = ?
          WHERE id = ?
        `).bind(
          JSON.stringify(mergedDates),
          (existing as any).id
        ).run();

        console.log(`[oncall] ✅ Updated assignment ${(existing as any).id} with merged dates`);
      } else {
        // Create new assignment
        const assignmentId = crypto.randomUUID();
        await this.dbService.db.prepare(`
          INSERT INTO oncall_assignments
          (id, schedule_id, user_id, team_id, dates, role, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `).bind(
          assignmentId,
          scheduleId,
          userId,
          teamId,
          JSON.stringify(dates),
          role
        ).run();

        console.log(`[oncall] ✅ Created new assignment for ${role}: ${userId} on ${dates.length} date(s)`);
      }
    }

    console.log('[oncall] ✅ All assignments updated successfully');
  } catch (error) {
    console.error('[oncall] Error updating schedule assignments:', error);
    throw error;
  }
}

}

