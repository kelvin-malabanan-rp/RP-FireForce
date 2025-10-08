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

	// ---------- READS ----------

	async getCurrentOnCallByTeamId(teamId?: string): Promise<CurrentOnCall | null> {
		try {
			const now = new Date().toISOString();
			let sql = `
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
			const params: any[] = [now, now];
			if (teamId) { sql += ' AND oa.team_id = ?'; params.push(teamId); }
			sql += ' ORDER BY oa.team_id, oa.role';

			const { results } = await this.dbService.db.prepare(sql).bind(...params).all();
			if (!results || results.length === 0) return await this.generateCurrentAssignment(teamId);
			return this.parseOnCallResults(results as any[]);
		} catch (e) {
			console.error('getCurrentOnCall error:', e);
			return null;
		}
	}

	async getAllCurrentOnCall(teamId?: string): Promise<any> {
		try {
			let sql = `
				SELECT
					oa.id, oa.schedule_id, oa.team_id,
					oa.user_id, oa.role,
					oa.start_time, oa.end_time,
					u.email,
					u.first_name || ' ' || u.last_name as fullname,
					t.name as team_name,
					t.timezone,
					DATE('now') as today,
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
				  AND oa.start_time <= DATETIME('now')
				  AND oa.end_time > DATETIME('now')
			`;

			const params: any[] = [];
			if (teamId) {
				sql += ' AND oa.team_id = ?';
				params.push(teamId);
			}

			sql += ` ORDER BY t.name,
            CASE oa.role
                WHEN 'primary' THEN 1
                WHEN 'backup' THEN 2
                WHEN 'escalation' THEN 3
            END`;

			const { results } = await this.dbService.db.prepare(sql).bind(...params).all();

			if (!results || results.length === 0) {
				return await this.generateCurrentAssignment(teamId);
			}

			// Group by team
			const teamGroups = results.reduce((acc: any, row: any) => {
				const teamId = row.team_id;
				if (!acc[teamId]) {
					acc[teamId] = {
						teamId: row.team_id,
						teamName: row.team_name,
						timezone: row.timezone,
						today: row.today,
						members: []
					};
				}
				acc[teamId].members.push({
					userId: row.user_id,
					fullname: row.fullname,
					email: row.email,
					role: row.role,
					startTime: row.start_time,
					endTime: row.end_time,
					pushTokenId: row.push_token_id || null,
					pushToken: row.push_token || null,
					fcmToken: row.fcm_token || null,
					deviceType: row.device_type || null
				});
				return acc;
			}, {});

			// Convert to array
			return Object.values(teamGroups);
		} catch (e) {
			console.error('getAllCurrentOnCall error:', e);
			return null;
		}
	}

	async usersForEmergencyOverride(emails: string[]): Promise<any[]> {
		try {
			if (!emails || emails.length === 0) {
				return [];
			}

			// Build placeholders dynamically
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

			return (results || []).map((row: any) => ({
				id: row.id,
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
		} catch (error) {
			console.error('Error fetching users with push tokens:', error);
			throw error;
		}
	}

	async getUserTeam(userId: string): Promise<OnCallTeamOfUser | null> {
		try {
			console.log('Fetching team for user:', userId);

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
				console.log('No team found for user:', userId);
				return null;
			}

			const team: OnCallTeamOfUser = {
				id: result.id as string,
				name: result.name as string,
				timezone: result.timezone as string,
				fullname: result.description as string,
				email: result.email as string,
			};

			console.log('Found team:', team.name, 'for user:', userId);
			return team;
		} catch (error) {
			console.error('Error fetching user team:', error);
			throw error;
		}
	}

	private parseOnCallResults(rows: any[]): CurrentOnCall {
		const assignment: CurrentOnCall = {
			scheduleId: rows[0].schedule_id,
			teamId: rows[0].team_id,
			startTime: new Date(rows[0].start_time),
			endTime: new Date(rows[0].end_time),
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

	private async saveAssignment(a: CurrentOnCall): Promise<void> {
		const sql = `
			INSERT OR REPLACE INTO oncall_assignments
			(id, schedule_id, user_id, team_id, start_time, end_time, role, is_active)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		`;
		if (a.primary) {
			await this.dbService.db.prepare(sql).bind(
				`assignment-${a.scheduleId}-${a.primary.id}-${Date.now()}`,
				a.scheduleId, a.primary.id, a.teamId,
				a.startTime.toISOString(), a.endTime.toISOString(),
				'primary', 1
			).run();
		}
		if (a.backup) {
			await this.dbService.db.prepare(sql).bind(
				`assignment-${a.scheduleId}-${a.backup.id}-${Date.now()}`,
				a.scheduleId, a.backup.id, a.teamId,
				a.startTime.toISOString(), a.endTime.toISOString(),
				'backup', 1
			).run();
		}
	}

	async getOnCallSchedule(teamId: string, days = 7): Promise<any[]> {
		const out: any[] = [];
		const now = new Date();
		for (let i = 0; i < days; i++) {
			const d = new Date(now); d.setDate(d.getDate() + i);
			const start = new Date(d); start.setHours(0,0,0,0);
			const end = new Date(d);   end.setHours(23,59,59,999);
			const assignment = await this.getOnCallForTimeRange(teamId, start, end);
			out.push({ date: d.toISOString().slice(0,10), dayOfWeek: d.toLocaleDateString('en-US',{weekday:'long'}), assignment });
		}
		return out;
	}

	private async getOnCallForTimeRange(teamId: string, start: Date, end: Date): Promise<CurrentOnCall | null> {
		const sql = `
			SELECT oa.*, u.email, u.first_name, u.last_name, u.phone_number
			FROM oncall_assignments oa
					 JOIN users u ON oa.user_id = u.id
			WHERE oa.team_id = ?
			  AND oa.is_active = 1
			  AND oa.start_time <= ?
			  AND oa.end_time > ?
			ORDER BY oa.role
		`;
		const { results } = await this.dbService.db.prepare(sql).bind(teamId, end.toISOString(), start.toISOString()).all();
		if (!results || results.length === 0) return null;
		return this.parseOnCallResults(results as any[]);
	}

	// ---------- HELPERS FOR HANDLERS ----------

	/** Find the active assignment (schedule + user) for a window so handlers don't query directly. */
	async findActiveAssignmentForWindow(
		teamId: string,
		role: 'primary' | 'backup',
		start: Date,
		end: Date
	): Promise<{ scheduleId: string; userId: string } | null> {
		const sql = `
      SELECT id as schedule_id, user_id
      FROM oncall_assignments
      WHERE team_id = ?
        AND role = ?
        AND start_time <= ?
        AND end_time >= ?
        AND is_active = 1
      ORDER BY start_time DESC
      LIMIT 1
    `;
		const row = await this.dbService.db
			.prepare(sql)
			.bind(teamId, role, start.toISOString(), end.toISOString())
			.first();

		if (!row) return null;
		return { scheduleId: (row as any).schedule_id, userId: (row as any).user_id };
	}

	async createOverride(
		teamId: string,
		role: 'primary' | 'backup',
		scheduleId: string | null,
		originalUserId: string | null,
		overrideUserId: string,        // this will go into replacement_user_id
		start: Date,
		end: Date,
		reason: string,
		createdBy: string
	): Promise<string> {
		const id = crypto.randomUUID();

		// status defaults to 'active' per your schema, but you can pass it explicitly
		// services/oncall.service.ts (createOverride)
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
			overrideUserId,               // ✅ replacement_user_id
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
      SELECT t.id, t.name, t.timezone,
             u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number,
             tm.role, tm.order_index
      FROM oncall_teams t
      LEFT JOIN oncall_team_members tm ON t.id = tm.team_id AND tm.is_active = 1
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE t.is_active = 1
      ORDER BY t.name, tm.order_index
    `;
		const { results } = await this.dbService.db.prepare(sql).all();

		const map = new Map<string, OnCallTeam>();
		for (const r of (results as any[])) {
			if (!map.has(r.id)) map.set(r.id, { id: r.id, name: r.name, timezone: r.timezone, members: [] });
			if (r.user_id) {
				map.get(r.id)!.members.push({
					id: r.user_id,
					email: r.email,
					firstName: r.first_name,
					lastName: r.last_name,
					phoneNumber: r.phone_number,
					role: r.role
				});
			}
		}
		return Array.from(map.values());
	}

	// ---------- Escalation encapsulated ----------

	async escalateIncident(args: {
		teamId: string;
		incidentId: string;
		reason: string;
		priority: 'low' | 'medium' | 'high' | 'critical';
		currentLevel: number;
	}) {
		const now = new Date().toISOString();

		// 1) next escalation target
		let target = await this.dbService.db.prepare(`
      SELECT ec.level, ec.user_id, u.email, u.first_name, u.last_name, u.phone_number
      FROM escalation_chains ec
      JOIN users u ON ec.user_id = u.id
      WHERE ec.team_id = ? AND ec.level > ? AND ec.is_active = 1
      ORDER BY ec.level
      LIMIT 1
    `).bind(args.teamId, args.currentLevel).first();

		if (!target) {
			// try team lead/manager
			const lead = await this.dbService.db.prepare(`
        SELECT u.id as user_id, u.email, u.first_name, u.last_name, u.phone_number
        FROM team_members tm
        JOIN users u ON tm.user_id = u.id
        WHERE tm.team_id = ? AND tm.role IN ('lead','manager') AND tm.is_active = 1
        LIMIT 1
      `).bind(args.teamId).first();

			if (!lead) {
				const current = await this.getCurrentOnCallByTeamId(args.teamId);
				if (!current?.primary) throw new Error('No escalation path available');
				target = { user_id: current.primary.id, email: current.primary.email, first_name: current.primary.firstName, last_name: current.primary.lastName, phone_number: current.primary.phoneNumber, level: 999 } as any;
			} else {
				target = { ...(lead as any), level: 999 };
			}
		}

		// 2) write escalation record
		const escId = crypto.randomUUID();
		await this.dbService.db.prepare(`
      INSERT INTO incident_escalations
      (id, incident_id, team_id, escalated_to_user_id, escalation_level, reason, priority, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
			escId, args.incidentId, args.teamId, (target as any).user_id,
			(target as any).level, args.reason, args.priority, now
		).run();

		// 3) update incident
		await this.dbService.db.prepare(`
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
			(target as any).level, now, args.priority, args.priority, args.incidentId
		).run();

		const policy = await this.getEscalationPolicy(args.teamId);

		return {
			id: escId,
			incidentId: args.incidentId,
			teamId: args.teamId,
			escalatedTo: {
				userId: (target as any).user_id,
				email: (target as any).email,
				name: `${(target as any).first_name} ${(target as any).last_name}`,
				level: (target as any).level
			},
			reason: args.reason,
			priority: args.priority,
			timestamp: now,
			status: 'active',
			escalationPolicy: policy
		};
	}

	// ---------------- NEW: Manage Schedule ----------------

	/**
	 * Return rotation config + team members for Manage Schedule screen
	 */
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
		// 1) get active schedule
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

		// 2) get team members
		const { results: memberRows } = await this.dbService.db
			.prepare(
				`SELECT
					 otm.id,
					 otm.team_id,
					 otm.user_id,
					 otm.role,
					 otm.order_index,
					 otm.is_active,
					 u.username,
					 u.email,
					 u.first_name,
					 u.last_name
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

	/**
	 * Update schedule rotation + member list
	 */
	async updateScheduleConfig(args: {
		teamId: string;
		rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
		rotationLengthHours: number;
		rotationStartISO: string;
		members: Array<{ userId: string; role: string; orderIndex: number; isActive: boolean }>;
	}): Promise<void> {
		const { teamId, rotationType, rotationLengthHours, rotationStartISO, members } = args;

		// 1) upsert schedule (replace active schedule)
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

		// Optionally deactivate older schedules
		await this.dbService.db
			.prepare(`UPDATE oncall_schedules SET is_active = 0 WHERE team_id = ? AND id != ?`)
			.bind(teamId, scheduleId)
			.run();

		// 2) replace team members for this team
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
        INSERT INTO incident_notifications
        (id, incident_id, user_id, notification_type, sent_at)
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

				// Log the all-clear notification
				await this.dbService.db.prepare(`
                INSERT INTO incident_notifications
                (id, incident_id, user_id, notification_type, sent_at)
                VALUES (?, ?, ?, 'all_clear', CURRENT_TIMESTAMP)
            `).bind(crypto.randomUUID(), incidentId, user.userId).run();
			} catch (error) {
				console.error(`Failed to send all-clear to ${user.email}:`, error);
			}
		}

		return {
			notifiedCount: notifications.length,
			users: notifications
		};
	}

	/**
	 * After config updates, regenerate current assignment window
	 */
	async refreshCurrentAssignments(teamId: string): Promise<void> {
		const current = await this.generateCurrentAssignment(teamId);
		if (!current) {
			console.warn('No current assignment generated for team', teamId);
		}
	}


	async sendNotification(alert: any, userId: string, type: string, env: Env) {
		const user = await this.dbService.db
			.prepare('SELECT * FROM users WHERE id = ?')
			.bind(userId)
			.first();

		if (!user) return;

		// Send email notification
		try {
			const emailService = new EmailService(env);
			await emailService.sendIncidentAlert(alert, (user as any).email);
			console.log(`Notification sent to ${(user as any).email}`);
		} catch (error) {
			console.error(`Failed to send notification to ${(user as any).email}:`, error);
		}

		// Track notification in database
		const notificationId = crypto.randomUUID();
		await this.dbService.db.prepare(`
        INSERT INTO notifications (id, alert_id, user_id, type, status)
        VALUES (?, ?, ?, ?, 'sent')
    `).bind(notificationId, alert.id, userId, type).run();
	}

	/**
	 * Create a new on-call schedule
	 */
	async createSchedule(params: {
		teamId: string;
		name: string;
		rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
		rotationLengthHours: number;
		rotationStartISO: string;
		members: Array<{
			userId: string;
			role: 'primary' | 'backup' | 'escalation';
			orderIndex: number;
			isActive: boolean;
		}>;
	}): Promise<{ scheduleId: string; memberCount: number }> {
		try {
			const { teamId, name, rotationType, rotationLengthHours, rotationStartISO, members } = params;

			// Generate schedule ID
			const scheduleId = crypto.randomUUID();

			// Create schedule record
			await this.dbService.db.prepare(`
            INSERT INTO oncall_schedules
            (id, team_id, name, rotation_type, rotation_start, rotation_length_hours, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).bind(
				scheduleId,
				teamId,
				name,
				rotationType,
				rotationStartISO,
				rotationLengthHours
			).run();

			// Deactivate other schedules for this team (only one active at a time)
			await this.dbService.db.prepare(`
            UPDATE oncall_schedules
            SET is_active = 0
            WHERE team_id = ? AND id != ?
        `).bind(teamId, scheduleId).run();

			// Add team members
			for (const member of members) {
				const memberId = crypto.randomUUID();
				await this.dbService.db.prepare(`
                INSERT INTO oncall_team_members
                (id, team_id, user_id, role, order_index, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(
					memberId,
					teamId,
					member.userId,
					member.role,
					member.orderIndex,
					member.isActive ? 1 : 0
				).run();
			}

			console.log('[oncall-service] ✅ Schedule created:', scheduleId);

			return {
				scheduleId,
				memberCount: members.length
			};
		} catch (error) {
			console.error('[oncall-service] Error creating schedule:', error);
			throw error;
		}
	}

	/**
	 * Deactivate a schedule
	 */
	async deleteSchedule(scheduleId: string): Promise<void> {
		try {
			await this.dbService.db.prepare(`
            UPDATE oncall_schedules
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).bind(scheduleId).run();

			console.log('[oncall-service] ✅ Schedule deactivated:', scheduleId);
		} catch (error) {
			console.error('[oncall-service] Error deactivating schedule:', error);
			throw error;
		}
	}

	/**
	 * Get all schedules with optional filters
	 */
	async getAllSchedules(params?: {
		teamId?: string;
		includeInactive?: boolean;
	}): Promise<any[]> {
		try {
			let sql = `
            SELECT
                s.*,
                t.name as team_name,
                t.timezone,
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
			console.error('[oncall-service] Error getting all schedules:', error);
			throw error;
		}
	}

	/**
	 * Get calendar data for teams
	 */
	async getCalendarData(days: number = 30, teamId?: string): Promise<any[]> {
		try {
			// Get all teams or specific team
			const teams = await this.getOnCallTeams();

			const filteredTeams = teamId
				? teams.filter(t => t.id === teamId)
				: teams;

			// Build calendar data for each team
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
			console.error('[oncall-service] Error building calendar data:', error);
			throw error;
		}
	}

	/**
	 * Update an existing on-call schedule
	 */
	async updateSchedule(params: {
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
	}): Promise<void> {
		try {
			const { scheduleId, name, rotationType, rotationLengthHours, rotationStartISO, isActive, members } = params;

			// Build dynamic update query
			const updates: string[] = [];
			const queryParams: any[] = [];

			if (name !== undefined) {
				updates.push('name = ?');
				queryParams.push(name);
			}

			if (rotationType !== undefined) {
				updates.push('rotation_type = ?');
				queryParams.push(rotationType);
			}

			if (rotationLengthHours !== undefined) {
				updates.push('rotation_length_hours = ?');
				queryParams.push(rotationLengthHours);
			}

			if (rotationStartISO !== undefined) {
				updates.push('rotation_start = ?');
				queryParams.push(rotationStartISO);
			}

			if (isActive !== undefined) {
				updates.push('is_active = ?');
				queryParams.push(isActive ? 1 : 0);
			}

			// Always update the updated_at timestamp
			updates.push('updated_at = CURRENT_TIMESTAMP');

			// Update schedule if there are changes
			if (updates.length > 1) { // More than just updated_at
				queryParams.push(scheduleId);

				const sql = `
                UPDATE oncall_schedules
                SET ${updates.join(', ')}
                WHERE id = ?
            `;

				await this.dbService.db.prepare(sql).bind(...queryParams).run();
				console.log('[oncall-service] ✅ Schedule updated:', scheduleId);
			}

			// Update members if provided
			if (members && Array.isArray(members)) {
				// Get team_id from schedule
				const schedule = await this.dbService.db.prepare(
					'SELECT team_id FROM oncall_schedules WHERE id = ?'
				).bind(scheduleId).first();

				if (!schedule) {
					throw new Error('Schedule not found');
				}

				const teamId = (schedule as any).team_id;

				// Delete existing members for this team
				await this.dbService.db.prepare(
					'DELETE FROM oncall_team_members WHERE team_id = ?'
				).bind(teamId).run();

				// Insert new members
				for (const member of members) {
					const memberId = crypto.randomUUID();
					await this.dbService.db.prepare(`
                    INSERT INTO oncall_team_members
                    (id, team_id, user_id, role, order_index, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).bind(
						memberId,
						teamId,
						member.userId,
						member.role,
						member.orderIndex,
						member.isActive ? 1 : 0
					).run();
				}

				console.log('[oncall-service] ✅ Team members updated:', members.length);

				// Refresh current assignments after member changes
				await this.refreshCurrentAssignments(teamId);
			}

		} catch (error) {
			console.error('[oncall-service] Error updating schedule:', error);
			throw error;
		}
	}
}
