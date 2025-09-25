// services/database.service.ts
import {Env, Incident, IncidentFilters, User} from '../types';

export class DatabaseService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	private get db() {
		return this.env.DB || this.env.incident_management;
	}

	async getIncidents(params: IncidentFilters): Promise<Incident[]> {
		let query = 'SELECT * FROM incidents';
		const conditions: string[] = [];
		const queryParams: string[] = [];

		// Filter by timeframe
		if (params.timeframe) {
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

		try {
			const { results } = await this.db.prepare(query).bind(...queryParams).all();
			return (results as unknown as Incident[]) || [];
		} catch (error) {
			console.error('Database query error:', error);
			throw error;
		}
	}

	async insertIncident(incident: Partial<Incident>): Promise<{ id: string; changes: number }> {
		const query = `
			INSERT INTO incidents
			(id, title, description, severity, status, timestamp, reported_by, location,
			 aws_alarm_name, aws_account_id, state_reason, metric_name, aws_console_url)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		// Critical fix: Convert all undefined values to null for D1 compatibility
		const params = [
			incident.id || null,
			incident.title || 'Unknown Incident',
			incident.description || null,
			incident.severity || 'medium',
			incident.status || 'open',
			incident.timestamp || new Date().toISOString(),
			incident.reportedBy || 'AWS CloudWatch',
			incident.location || null,
			incident.awsAlarmName || null,
			incident.awsAccountId || null,
			incident.stateReason || null,
			incident.metricName || null,
			incident.awsConsoleUrl || null
		];

		console.log('Database insert - sanitized params:', params);

		try {
			if (!this.db) {
				throw new Error('Database connection not available');
			}

			const result = await this.db.prepare(query).bind(...params).run();
			console.log('Incident inserted successfully with ID:', incident.id);
			return { id: incident.id!, changes: result.changes || 1 };
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

	// User authentication methods
	async getUserByEmail(email: string): Promise<User | null> {
		const query = `
			SELECT id, email, password_hash as passwordHash, role,
				   first_name as firstName, last_name as lastName,
				   is_active as isActive, created_at as createdAt,
				   updated_at as updatedAt, last_login as lastLogin
			FROM users
			WHERE email = ? AND is_active = 1
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
}
