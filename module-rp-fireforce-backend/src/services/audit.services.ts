// services/auditService.ts
import {
	AuditLogPayload,
	AuditLogResponse,
	Env
} from '../types';

/**
 * AuditService - All-in-one service for audit trail and logging operations
 */
export class AuditService {
	private env: Env;
	private db: D1Database; // Add this

	constructor(env: Env) {
		this.env = env;
		this.db = env.DB; // Initialize db
	}

	public generateUUID = (): string => {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			const r = Math.random() * 16 | 0;
			const v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	};

	/**
	 * Create a new audit log entry
	 */
	async createAuditLog(payload: AuditLogPayload): Promise<AuditLogResponse> {
		try {
			const {
				action,
				incidentId,
				userId,
				description,
				details,
				oldValue,
				newValue,
				metadata
			} = payload;

			const auditId = this.generateUUID();

			const query = `
                INSERT INTO audit_log (
                    id,
                    incident_id,
                    user_id,
                    action,
                    description,
                    details,
                    old_value,
                    new_value,
                    metadata,
                    ip_address,
                    user_agent,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `;

			// Use D1 API - prepare().bind().run()
			await this.db.prepare(query).bind(
				auditId,
				incidentId || null,
				userId || null,
				action,
				description || null,
				JSON.stringify(details || {}),
				oldValue ? JSON.stringify(oldValue) : null,
				newValue ? JSON.stringify(newValue) : null,
				metadata ? JSON.stringify(metadata) : null,
				null, // ip_address
				null  // user_agent
			).run();

			console.log(`📝 Audit log created: ${action} for incident ${incidentId}`);

			return {
				id: auditId,
				incident_id: incidentId || null,
				user_id: userId || null,
				action,
				description: description || null,
				details: details || {},
				old_value: oldValue || null,
				new_value: newValue || null,
				metadata: metadata || null,
				created_at: new Date().toISOString()
			};
		} catch (error) {
			console.error('Error creating audit log:', error);
			throw error;
		}
	}

	/**
	 * Get all audit logs with optional filters
	 */
	async getAuditLogs(filters?: {
		incidentId?: string;
		userId?: string;
		action?: string;
		startDate?: string;
		endDate?: string;
		limit?: number;
		offset?: number;
	}): Promise<{ logs: any[]; total: number }> {
		try {
			const {
				incidentId,
				userId,
				action,
				startDate,
				endDate,
				limit = 100,
				offset = 0
			} = filters || {};

			let query = `
            SELECT
                al.*,
                u.first_name,
                u.last_name,
                u.email
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE 1=1
        `;

			const params: any[] = [];

			if (incidentId) {
				query += ' AND al.incident_id = ?';
				params.push(incidentId);
			}

			if (userId) {
				query += ' AND al.user_id = ?';
				params.push(userId);
			}

			if (action) {
				query += ' AND al.action = ?';
				params.push(action);
			}

			if (startDate && endDate) {
				query += ' AND al.created_at BETWEEN ? AND ?';
				params.push(startDate, endDate);
			}

			query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
			params.push(limit, offset);

			const result = await this.db.prepare(query).bind(...params).all();
			const logs = result.results || [];

			// Get total count
			let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE 1=1';
			const countParams: any[] = [];

			if (incidentId) {
				countQuery += ' AND incident_id = ?';
				countParams.push(incidentId);
			}

			if (userId) {
				countQuery += ' AND user_id = ?';
				countParams.push(userId);
			}

			if (action) {
				countQuery += ' AND action = ?';
				countParams.push(action);
			}

			if (startDate && endDate) {
				countQuery += ' AND created_at BETWEEN ? AND ?';
				countParams.push(startDate, endDate);
			}

			const countResult = await this.db.prepare(countQuery).bind(...countParams).first();
			const total = (countResult as any)?.total || 0;

			return { logs, total };
		} catch (error) {
			console.error('Error getting audit logs:', error);
			throw error;
		}
	}

	/**
	 * Get audit trail for a specific incident
	 */
	async getIncidentAuditTrail(incidentId: string): Promise<any[]> {
		try {
			const query = `
            SELECT
                al.*,
                u.first_name,
                u.last_name,
                u.email
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            WHERE al.incident_id = ?
            ORDER BY al.created_at ASC
        `;

			const result = await this.db.prepare(query).bind(incidentId).all();
			return result.results || [];
		} catch (error) {
			console.error('Error getting incident audit trail:', error);
			throw error;
		}
	}

	/**
	 * Get audit statistics
	 */
	async getAuditStats(startDate?: string, endDate?: string): Promise<any> {
		try {
			let dateFilter = '';
			const params: any[] = [];

			if (startDate && endDate) {
				dateFilter = 'WHERE created_at BETWEEN ? AND ?';
				params.push(startDate, endDate);
			}

			// Action distribution
			const actionStats = await this.db.prepare(`
            SELECT
                action,
                COUNT(*) as count
            FROM audit_log
            ${dateFilter}
            GROUP BY action
            ORDER BY count DESC
        `).bind(...params).all();

			// User activity
			const userStats = await this.db.prepare(`
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                COUNT(*) as action_count
            FROM audit_log al
            LEFT JOIN users u ON al.user_id = u.id
            ${dateFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.email
            ORDER BY action_count DESC
            LIMIT 10
        `).bind(...params).all();

			// Total logs
			const totalResult = await this.db.prepare(`
            SELECT COUNT(*) as total FROM audit_log ${dateFilter}
        `).bind(...params).first();

			return {
				total_logs: (totalResult as any)?.total || 0,
				action_distribution: actionStats.results || [],
				top_users: userStats.results || [],
				period: {
					start: startDate || null,
					end: endDate || null
				}
			};
		} catch (error) {
			console.error('Error getting audit stats:', error);
			throw error;
		}
	}
}
