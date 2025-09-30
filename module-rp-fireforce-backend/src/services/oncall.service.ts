// services/oncall.service.ts
import {Env, OnCallTeam, OnCallUser} from '../types';
import { DatabaseService } from './database.service';
import { CurrentOnCall} from '../types/index';

export class OnCallService {
	private dbService: DatabaseService;

	constructor(env: Env) {
		this.dbService = new DatabaseService(env);
	}

	async getCurrentOnCall(teamId?: string): Promise<CurrentOnCall | null> {
		try {
			const now = new Date().toISOString();

			let query = `
                SELECT
                    oa.id, oa.schedule_id, oa.team_id, oa.user_id, oa.role,
                    oa.start_time, oa.end_time,
                    u.email, u.first_name, u.last_name, u.phone_number,
                    t.name as team_name, t.timezone
                FROM oncall_assignments oa
                JOIN users u ON oa.user_id = u.id
                JOIN oncall_teams t ON oa.team_id = t.id
                WHERE oa.is_active = 1
                AND oa.start_time <= ?
                AND oa.end_time > ?
            `;

			const params = [now, now];

			if (teamId) {
				query += ' AND oa.team_id = ?';
				params.push(teamId);
			}

			query += ' ORDER BY oa.team_id, oa.role';
			console.log('Query:', query);
			console.log('params:', params);
			const { results } = await this.dbService.db.prepare(query).bind(...params).all();

			if (!results || results.length === 0) {
				return await this.generateCurrentAssignment(teamId);
			}

			return this.parseOnCallResults(results as any[]);
		} catch (error) {
			console.error('Error getting current on-call:', error);
			return null;
		}
	}

	private parseOnCallResults(results: any[]): CurrentOnCall {
		const assignment: CurrentOnCall = {
			scheduleId: results[0].schedule_id,
			teamId: results[0].team_id,
			startTime: new Date(results[0].start_time),
			endTime: new Date(results[0].end_time),
			escalation: []
		};

		for (const row of results) {
			const user: OnCallUser = {
				id: row.user_id,
				email: row.email,
				firstName: row.first_name,
				lastName: row.last_name,
				phoneNumber: row.phone_number,
				role: row.role
			};

			switch (row.role) {
				case 'primary':
					assignment.primary = user;
					break;
				case 'backup':
					assignment.backup = user;
					break;
				case 'escalation':
					assignment.escalation?.push(user);
					break;
			}
		}

		return assignment;
	}

	async generateCurrentAssignment(teamId?: string): Promise<CurrentOnCall | null> {
		try {
			// Get active schedules
			let query = `
                SELECT s.*, t.timezone
                FROM oncall_schedules s
                JOIN oncall_teams t ON s.team_id = t.id
                WHERE s.is_active = 1
            `;

			if (teamId) {
				query += ' AND s.team_id = ?';
			}

			const schedules = await this.dbService.db.prepare(query)
				.bind(...(teamId ? [teamId] : []))
				.all();

			if (!schedules.results || schedules.results.length === 0) {
				return null;
			}

			// Calculate current rotation for first active schedule
			const schedule = schedules.results[0] as any;
			return await this.calculateRotation(schedule);
		} catch (error) {
			console.error('Error generating assignment:', error);
			return null;
		}
	}

	private async calculateRotation(schedule: any): Promise<CurrentOnCall | null> {
		try {
			// Get team members in rotation order
			const members = await this.getTeamMembers(schedule.team_id);
			if (members.length === 0) return null;

			const now = new Date();
			const rotationStart = new Date(schedule.rotation_start);
			const rotationHours = schedule.rotation_length_hours;

			// Calculate which rotation period we're in
			const timeSinceStart = now.getTime() - rotationStart.getTime();
			const rotationNumber = Math.floor(timeSinceStart / (rotationHours * 60 * 60 * 1000));

			// Calculate current assignment period
			const currentPeriodStart = new Date(rotationStart.getTime() + (rotationNumber * rotationHours * 60 * 60 * 1000));
			const currentPeriodEnd = new Date(currentPeriodStart.getTime() + (rotationHours * 60 * 60 * 1000));

			// Select primary on-call user (round-robin)
			const primaryIndex = rotationNumber % members.length;
			const backupIndex = (rotationNumber + 1) % members.length;

			const assignment: CurrentOnCall = {
				primary: members[primaryIndex],
				backup: members[backupIndex],
				escalation: members.filter((_, i) => i !== primaryIndex && i !== backupIndex),
				scheduleId: schedule.id,
				teamId: schedule.team_id,
				startTime: currentPeriodStart,
				endTime: currentPeriodEnd
			};

			// Save this assignment to database
			await this.saveAssignment(assignment);

			return assignment;
		} catch (error) {
			console.error('Error calculating rotation:', error);
			return null;
		}
	}

	private async getTeamMembers(teamId: string): Promise<OnCallUser[]> {
		const query = `
            SELECT
                u.id, u.email, u.first_name, u.last_name, u.phone_number,
                tm.role, tm.order_index
            FROM oncall_team_members tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.team_id = ? AND tm.is_active = 1
            ORDER BY tm.order_index, u.first_name
        `;

		const { results } = await this.dbService.db.prepare(query).bind(teamId).all();

		return (results as any[]).map(row => ({
			id: row.id,
			email: row.email,
			firstName: row.first_name,
			lastName: row.last_name,
			phoneNumber: row.phone_number,
			role: row.role
		}));
	}

	private async saveAssignment(assignment: CurrentOnCall): Promise<void> {
		const query = `
            INSERT OR REPLACE INTO oncall_assignments
            (id, schedule_id, user_id, team_id, start_time, end_time, role, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

		// Save primary assignment
		if (assignment.primary) {
			await this.dbService.db.prepare(query).bind(
				`assignment-${assignment.scheduleId}-${assignment.primary.id}-${Date.now()}`,
				assignment.scheduleId,
				assignment.primary.id,
				assignment.teamId,
				assignment.startTime.toISOString(),
				assignment.endTime.toISOString(),
				'primary',
				true
			).run();
		}

		// Save backup assignment
		if (assignment.backup) {
			await this.dbService.db.prepare(query).bind(
				`assignment-${assignment.scheduleId}-${assignment.backup.id}-${Date.now()}`,
				assignment.scheduleId,
				assignment.backup.id,
				assignment.teamId,
				assignment.startTime.toISOString(),
				assignment.endTime.toISOString(),
				'backup',
				true
			).run();
		}
	}

	async getOnCallSchedule(teamId: string, days: number = 7): Promise<any[]> {
		const schedule = [];
		const now = new Date();

		for (let i = 0; i < days; i++) {
			const date = new Date(now);
			date.setDate(date.getDate() + i);

			const dayStart = new Date(date);
			dayStart.setHours(0, 0, 0, 0);

			const dayEnd = new Date(date);
			dayEnd.setHours(23, 59, 59, 999);

			const assignment = await this.getOnCallForTimeRange(teamId, dayStart, dayEnd);

			schedule.push({
				date: date.toISOString().split('T')[0],
				dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
				assignment
			});
		}

		return schedule;
	}

	private async getOnCallForTimeRange(teamId: string, startTime: Date, endTime: Date): Promise<CurrentOnCall | null> {
		const query = `
            SELECT
                oa.*, u.email, u.first_name, u.last_name, u.phone_number
            FROM oncall_assignments oa
            JOIN users u ON oa.user_id = u.id
            WHERE oa.team_id = ?
            AND oa.is_active = 1
            AND oa.start_time <= ?
            AND oa.end_time > ?
            ORDER BY oa.role
        `;

		const { results } = await this.dbService.db.prepare(query).bind(
			teamId,
			endTime.toISOString(),
			startTime.toISOString()
		).all();

		if (!results || results.length === 0) {
			return null;
		}

		return this.parseOnCallResults(results as any[]);
	}

	async createOverride(
		scheduleId: string,
		originalUserId: string,
		replacementUserId: string,
		startTime: Date,
		endTime: Date,
		reason: string,
		createdBy: string
	): Promise<string> {
		const overrideId = `override-${Date.now()}`;

		const query = `
            INSERT INTO oncall_overrides
            (id, schedule_id, original_user_id, replacement_user_id, start_time, end_time, reason, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

		await this.dbService.db.prepare(query).bind(
			overrideId,
			scheduleId,
			originalUserId,
			replacementUserId,
			startTime.toISOString(),
			endTime.toISOString(),
			reason,
			createdBy
		).run();

		console.log('On-call override created:', overrideId);
		return overrideId;
	}

	async getEscalationPolicy(teamId: string): Promise<any> {
		const query = `
            SELECT * FROM escalation_policies
            WHERE team_id = ? AND is_active = 1
            ORDER BY created_at DESC
            LIMIT 1
        `;

		const result = await this.dbService.db.prepare(query).bind(teamId).first();

		if (result) {
			return {
				...result,
				steps: JSON.parse((result as any).steps)
			};
		}

		return null;
	}

	async getOnCallTeams(): Promise<OnCallTeam[]> {
		const query = `
            SELECT
                t.id, t.name, t.timezone,
                u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number,
                tm.role, tm.order_index
            FROM oncall_teams t
            LEFT JOIN oncall_team_members tm ON t.id = tm.team_id AND tm.is_active = 1
            LEFT JOIN users u ON tm.user_id = u.id
            WHERE t.is_active = 1
            ORDER BY t.name, tm.order_index
        `;

		const { results } = await this.dbService.db.prepare(query).all();

		const teamsMap = new Map<string, OnCallTeam>();

		for (const row of (results as any[])) {
			if (!teamsMap.has(row.id)) {
				teamsMap.set(row.id, {
					id: row.id,
					name: row.name,
					timezone: row.timezone,
					members: []
				});
			}

			if (row.user_id) {
				teamsMap.get(row.id)?.members.push({
					id: row.user_id,
					email: row.email,
					firstName: row.first_name,
					lastName: row.last_name,
					phoneNumber: row.phone_number,
					role: row.role
				});
			}
		}

		return Array.from(teamsMap.values());
	}
}
