// services/database.service.ts
import {
	Env,
	Incident,
	IncidentCommentPayload,
	IncidentCommentResponse,
	IncidentFilters,
	User
} from '../types';
import {PushNotificationService} from "./push-notification.service";
import {OnCallService} from "./oncall.service";

export class DatabaseService {
	private env: Env;
	private pushService?: PushNotificationService;

	constructor(env: Env, pushService?: PushNotificationService) {
		this.env = env;
		this.pushService = pushService;
	}

	get db() {
		return this.env.DB || this.env.incident_management;
	}

	public generateUUID = (): string => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};

	public currentTime = new Date().toISOString();


	async getIncidents(params: IncidentFilters): Promise<Incident[]> {
		let query = 'SELECT * FROM incidents';
		const conditions: string[] = [];
		const queryParams: string[] = [];

		console.log('Input params:', params); // Add this

		// Filter by timeframe
		if (params.timeframe && params.timeframe !== 'all') {
			const now = new Date();
			let cutoffDate: Date;

			switch (params.timeframe) {
				case '24h':
					cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
					break;
				case '7d':
					cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
					break;
				case '30d':
					cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
					break;
			}

			conditions.push('timestamp >= ?');
			queryParams.push(cutoffDate.toISOString());
			console.log('Cutoff date:', cutoffDate.toISOString()); // Add this
		}

		// Filter by status
		if (params.status && params.status !== 'all') {
			conditions.push('status = ?');
			queryParams.push(params.status);
		}

		// Filter by severity
		if (params.severity && params.severity !== 'all') {
			conditions.push('severity = ?');
			queryParams.push(params.severity);
		}

		if (conditions.length > 0) {
			query += ' WHERE ' + conditions.join(' AND ');
		}

		query += ' ORDER BY timestamp DESC';

		console.log('Final query:', query); // Add this
		console.log('Query params:', queryParams); // Add this

		try {
			const { results } = await this.db.prepare(query).bind(...queryParams).all();
			return (results as unknown as Incident[]) || [];
		} catch (error) {
			console.error('Database query error:', error);
			throw error;
		}
	}

	// Updated insertIncident method - generate UUID in the service
	async insertIncident(incident: Partial<Incident>): Promise<{ id: string; changes: number }> {

		const incidentId = this.generateUUID();

		const query = `
			INSERT INTO incidents
			(id, title, description, severity, status, timestamp, reported_by, location,
			 aws_alarm_name, aws_account_id, state_reason, metric_name, aws_console_url,
			 resolved_at, assigned_to, team_id, resolved_by, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const params = [
			incidentId,
			incident.title || 'Unknown Incident',
			incident.description || null,
			incident.severity || 'medium',
			incident.status || 'open',
			incident.timestamp || this.currentTime,
			incident.reported_by || 'AWS CloudWatch',      // ✅ Use snake_case
			incident.location || null,
			incident.aws_alarm_name || null,               // ✅ Use snake_case
			incident.aws_account_id || null,               // ✅ Use snake_case
			incident.state_reason || null,                 // ✅ Use snake_case
			incident.metric_name || null,                  // ✅ Use snake_case
			incident.aws_console_url || null,              // ✅ Already correct
			incident.resolved_at || null,                  // ✅ Use snake_case
			null,                                          // assigned_to
			incident.team_id || null,                      // ✅ Use snake_case - THIS WAS NULL BEFORE
			null,                                          // resolved_by
			incident.created_at || this.currentTime,       // ✅ Use snake_case
			incident.updated_at || this.currentTime        // ✅ Use snake_case
		];

		console.log('Database insert - sanitized params:', params);
		console.log('Total parameters:', params.length);

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}

			const result = await this.db.prepare(query).bind(...params).run();

			console.log('Incident inserted successfully with generated ID:', incidentId);
			return { id: incidentId, changes: result.changes || 1 };
		} catch (error) {
			console.error('Database insert error:', error);
			console.error('Failed incident object:', incident);
			console.error('Failed query params:', params);
			throw error;
		}
	}

	async updateIncidentStatus(
		awsAlarmName: string,
		status: string,
		resolvedAt: string
	): Promise<{ changes: number }> {
		const query = `
			UPDATE incidents
			SET status = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
			WHERE aws_alarm_name = ? AND status != 'resolved'
		`;

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}

			const result = await this.db.prepare(query).bind(
				status,
				resolvedAt || null,
				awsAlarmName
			).run();

			console.log('Incident status updated for alarm:', awsAlarmName);
			return { changes: result.changes || 0 };
		} catch (error) {
			console.error('Error updating incident:', error);
			throw error;
		}
	}

	async getUserByEmail(email: string): Promise<User | null> {
		const query = `
			SELECT
				u.id,
				u.email,
				u.password_hash AS passwordHash,
				u.user_role,  -- ✅ Add this
				u.first_name AS firstName,
				u.last_name AS lastName,
				u.is_active AS isActive,
				u.created_at AS createdAt,
				u.updated_at AS updatedAt,
				u.last_login AS lastLogin,
				otm.team_id AS teamId,      -- ✅ Already there
				otm.role AS teamRole        -- ✅ Already there
			FROM users u
					 LEFT JOIN oncall_team_members otm ON u.id = otm.user_id
			WHERE u.email = ?
			  AND u.is_active = 1;
		`;

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}

			const result = await this.db.prepare(query).bind(email).first();
			return result as User | null;
		} catch (error) {
			console.error('Error fetching user by email:', error);
			throw error;
		}
	}


	// User authentication methods by id
	async getUserById(userId: string): Promise<User | null> {
		const query = `
			SELECT id, email, password_hash as passwordHash, role,
				   first_name as firstName, last_name as lastName,
				   is_active as isActive, created_at as createdAt,
				   updated_at as updatedAt, last_login as lastLogin
			FROM users
			WHERE id = ? AND is_active = 1
		`;
		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}
			const result = await this.db.prepare(query).bind(userId).first();
			return result as User | null;
		} catch (error) {
			console.error('Error fetching user by id:', error);
			throw error;
		}
	}

	// Validate Incident if exists and GET its DATA!
	async getIncidentById(incidentId: string): Promise<Incident | null> {
		const query = `
			SELECT
				id,
				title,
				description,
				severity,
				status,
				timestamp,
				reported_by,              -- Keep snake_case
				location,
				team_id,                  -- ✅ ADD THIS LINE
				escalation_level,         -- ✅ ADD THIS TOO
				aws_alarm_name,
				aws_account_id,
				state_reason,
				metric_name,
				aws_console_url,
				resolved_at,
				assigned_to,              -- ✅ ADD THIS
				resolved_by,              -- ✅ ADD THIS
				created_at,
				updated_at
			FROM incidents
			WHERE id = ?
		`;

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}
			const result = await this.db.prepare(query).bind(incidentId).first();
			return result as Incident | null;
		} catch (error) {
			console.error('Error fetching incident by incidentId:', error);
			throw error;
		}
	}

	// Submit Comment to Specific Incident
	async postIncidentComment(payload: IncidentCommentPayload): Promise<IncidentCommentResponse> {
		const commentId = this.generateUUID();

		const query = `
			INSERT INTO incident_comments (
				id,
				incident_id,
				user_id,
				comment,
				created_at
			) VALUES (?, ?, ?, ?, ?)
		`;

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}

			const result = await this.db.prepare(query)
				.bind(
					commentId,
					payload.incidentId,
					payload.userId,
					payload.comment,
					payload.createdAt.toISOString() // Convert Date to string
				)
				.run();

			if (result.success) {
				return {
					id: commentId,
					incidentId: payload.incidentId,
					userEmail: payload.userId,
					userFullname: null,
					comment: payload.comment,
					createdAt: payload.createdAt
				};
			} else {
				throw new Error('Failed to insert incident comment');
			}
		} catch (error) {
			console.error('Error posting incident comment:', error);
			throw error;
		}
	}

	async getIncidentComments(incidentId: string): Promise<IncidentCommentResponse[]> {
		const query = `
			SELECT
				ic.id,
				ic.incident_id as incidentId,
				u.first_name || ' ' || u.last_name as fullName,
				u.email as userEmail,
				ic.comment,
				ic.created_at as createdAt
			FROM incident_comments ic
			LEFT JOIN users u ON u.id = ic.user_id
			WHERE ic.incident_id = ?
			ORDER BY ic.created_at DESC`;

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}

			const results = await this.db.prepare(query)
				.bind(incidentId)
				.all();

			return results.results.map(result => ({
				id: result.id as string,
				incidentId: result.incidentId as string,
				userEmail: result.userEmail as string,
				userFullname: result.fullName as string,
				comment: result.comment as string,
				createdAt: result.createdAt as Date
			}));
		} catch (error) {
			console.error('Error fetching incident comments:', error);
			throw error;
		}
	}

	async updateSpecificIncidentStatus(
		incidentId: string,
		action: string,  // Changed from newStatus to action
		userId?: string
	): Promise<{
		id: string;
		status: string;
		updatedAt: string;
		escalated?: boolean;
		notifiedCount?: number;
		users?: Array<{ name: string; email: string }>;
	}> {
		if (!this.db) {
			throw new Error('Database connection not available');
		}

		// 1) Verify incident exists
		const incident = await this.db
			.prepare("SELECT id, status, team_id FROM incidents WHERE id = ?")
			.bind(incidentId)
			.first<{ id: string; status: string; team_id: string }>();

		if (!incident) {
			throw new Error(`Incident not found: ${incidentId}`);
		}

		let actualStatus: string;
		let assignedToUserId: string | null = null;
		let shouldEscalate = false;

		// 2) Map action to status and behavior
		if (action === 'acknowledge') {
			// Acknowledge = investigating + assign to user
			actualStatus = 'investigating';
			assignedToUserId = userId || null;
		} else if (action === 'decline') {
			// Decline = stay open + escalate to next person
			actualStatus = 'open';
			assignedToUserId = null; // Unassign
			shouldEscalate = true;
		} else {
			// Direct status update (resolved, etc.)
			actualStatus = action;
			if (userId) {
				const user = await this.db
					.prepare("SELECT id FROM users WHERE id = ?")
					.bind(userId)
					.first<{ id: string }>();
				assignedToUserId = user?.id || null;
			}
		}

		// 3) Update incident
		const updateQuery = `
			UPDATE incidents
			SET status = ?,
				assigned_to = ?,
				resolved_by = CASE WHEN ? = 'resolved' THEN ? ELSE resolved_by END,
				resolved_at = CASE WHEN ? = 'resolved' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
				RETURNING id, status, updated_at as updatedAt
		`;

		const result = await this.db.prepare(updateQuery)
			.bind(actualStatus, assignedToUserId, actualStatus, userId, actualStatus, incidentId)
			.first();

		if (!result) {
			throw new Error('Incident update failed');
		}

		const response: {
			id: string;
			status: string;
			updatedAt: string;
			escalated?: boolean;
			notifiedCount?: number;
			users?: Array<{ name: string; email: string }>;
		} = {
			id: result.id as string,
			status: result.status as string,
			updatedAt: result.updatedAt as string
		};

		// 4) Handle escalation if declined
		if (shouldEscalate && incident.team_id) {
			try {
				const oncallService = new OnCallService(this.env);
				const escalationResult = await oncallService.escalateIncident({
					teamId: incident.team_id,
					incidentId,
					reason: 'Declined by on-call responder',
					priority: 'medium',
					currentLevel: 0
				});
				response.escalated = true;
				console.log(`Incident ${incidentId} escalated to ${escalationResult.escalatedTo.name}`);
			} catch (error) {
				console.error('Failed to escalate incident:', error);
			}
		}

		// 5) If status is being set to 'resolved', send all-clear notifications
		if (actualStatus === 'resolved' && this.pushService) {
			try {
				const notificationResult = await this.pushService.sendAllClear(incidentId);
				response.notifiedCount = notificationResult.notifiedCount;
				response.users = notificationResult.users;
			} catch (error) {
				console.error('Failed to send all-clear notifications:', error);
				response.notifiedCount = 0;
				response.users = [];
			}
		}

		return response;
	}
}
