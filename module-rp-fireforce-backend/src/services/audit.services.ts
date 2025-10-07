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
}
