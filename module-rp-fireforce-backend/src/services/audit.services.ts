import { v4 as uuidv4 } from 'uuid';
import {
	AuditDataForCSV,
	AuditLog,
	AuditLogDetails,
	AuditRequest, AuditStats, AuditSummary,
	DatabaseConnection, Escalation, FullIncidentAudit, Incident, IncidentStats,
	Notification,
	NotificationRecord, NotificationStats,
	ResponseResult, TopResponder
} from "../types";

/**
 * Generate unique ID
 */
export function generateId(prefix: string = 'audit'): string {
	return `${prefix}-${uuidv4()}`;
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
	db: DatabaseConnection,
	action: string,
	details: AuditLogDetails,
	incidentId: string | null = null,
	userId: string | null = null,
	request: AuditRequest | null = null
): Promise<string> {
	try {
		const auditId = generateId('audit');
		const ipAddress = request
			? request.headers['x-forwarded-for'] ||
			request.headers['cf-connecting-ip'] ||
			request.connection?.remoteAddress || null
			: null;
		const userAgent = request ? request.headers['user-agent'] || null : null;

		const query = `
			INSERT INTO audit_log (id, incident_id, user_id, action, details, ip_address, user_agent, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
		`;

		await db.run(query, [
			auditId,
			incidentId,
			userId,
			action,
			JSON.stringify(details),
			ipAddress,
			userAgent
		]);

		console.log(`📝 Audit log created: ${action} for incident ${incidentId}`);
		return auditId;
	} catch (error) {
		console.error('Error creating audit log:', error);
		throw error;
	}
}

/**
 * Record notification response with response time tracking
 */
export async function recordNotificationResponse(
	db: DatabaseConnection,
	notificationId: string,
	incidentId: string,
	userId: string,
	response: 'acknowledge' | 'decline' | 'resolve',
	request: AuditRequest | null = null
): Promise<ResponseResult> {
	try {
		// Get notification sent time to calculate response time
		const notification = await db.get(
			'SELECT delivered_at FROM incident_notifications WHERE id = ?',
			[notificationId]
		) as NotificationRecord | undefined;

		const now = new Date();
		const responseTime = notification?.delivered_at
			? (now.getTime() - new Date(notification.delivered_at).getTime()) / 1000
			: null;

		const responseId = generateId('response');
		const ipAddress = request
			? request.headers['x-forwarded-for'] || request.headers['cf-connecting-ip'] || null
			: null;
		const userAgent = request ? request.headers['user-agent'] || null : null;

		// Insert response record
		await db.run(
			`
				INSERT INTO notification_responses
				(id, notification_id, incident_id, user_id, response, response_time, responded_at, ip_address, user_agent)
				VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
			`,
			[responseId, notificationId, incidentId, userId, response, responseTime, ipAddress, userAgent]
		);

		// Update incident_notifications table if you have response column
		await db.run(
			`
				UPDATE incident_notifications
				SET response = ?, responded_at = CURRENT_TIMESTAMP, response_time = ?
				WHERE id = ?
			`,
			[response, responseTime, notificationId]
		);

		// Create audit log
		await createAuditLog(
			db,
			`user_${response}`,
			{
				userId: userId,
				response: response,
				responseTime: responseTime,
				notificationId: notificationId
			},
			incidentId,
			userId,
			request
		);

		console.log(
			`✅ Response recorded: ${response} (${responseTime ? responseTime.toFixed(2) + 's' : 'N/A'})`
		);
		return { responseId, responseTime };
	} catch (error) {
		console.error('Error recording response:', error);
		throw error;
	}
}

/**
 * Get notification history for an incident
 */
export async function getNotificationHistory(
	db: DatabaseConnection,
	incidentId: string
): Promise<Notification[]> {
	try {
		const query = `
			SELECT
				n.*,
				u.first_name,
				u.last_name,
				u.email,
				nr.response,
				nr.response_time,
				nr.responded_at
			FROM incident_notifications n
					 LEFT JOIN users u ON n.user_id = u.id
					 LEFT JOIN notification_responses nr ON n.id = nr.notification_id
			WHERE n.incident_id = ?
			ORDER BY n.delivered_at ASC
		`;

		const notifications = await db.all(query, [incidentId]);
		return notifications as Notification[];
	} catch (error) {
		console.error('Error getting notification history:', error);
		throw error;
	}
}

/**
 * Get complete audit trail for an incident
 */
export async function getAuditTrail(
	db: DatabaseConnection,
	incidentId: string
): Promise<AuditLog[]> {
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

		const logs = await db.all(query, [incidentId]);
		return logs as AuditLog[];
	} catch (error) {
		console.error('Error getting audit trail:', error);
		throw error;
	}
}

/**
 * Get full incident audit trail with all details
 */
export async function getFullIncidentAudit(
	db: DatabaseConnection,
	incidentId: string
): Promise<FullIncidentAudit> {
	try {
		// Get incident details
		const incident = await db.get('SELECT * FROM incidents WHERE id = ?', [incidentId]) as Incident;

		if (!incident) {
			throw new Error('Incident not found');
		}

		// Get audit logs
		const auditLogs = await getAuditTrail(db, incidentId);

		// Get notification history
		const notifications = await getNotificationHistory(db, incidentId);

		// Get comments
		const comments = (await db.all(
			`SELECT c.*, u.first_name, u.last_name, u.email
			 FROM incident_comments c
					  LEFT JOIN users u ON c.user_id = u.id
			 WHERE c.incident_id = ?
			 ORDER BY c.created_at ASC`,
			[incidentId]
		)) as Comment[];

		// Get escalations
		const escalations = (await db.all(
			`SELECT ie.*,
					u1.first_name as escalated_to_first_name,
					u1.last_name as escalated_to_last_name,
					u2.first_name as escalated_from_first_name,
					u2.last_name as escalated_from_last_name
			 FROM incident_escalations ie
					  LEFT JOIN users u1 ON ie.escalated_to_user_id = u1.id
					  LEFT JOIN users u2 ON ie.escalated_from_user_id = u2.id
			 WHERE ie.incident_id = ?
			 ORDER BY ie.created_at ASC`,
			[incidentId]
		)) as Escalation[];

		// Calculate summary stats
		const notificationsWithResponseTime = notifications.filter(n => n.response_time);
		const avgResponseTime =
			notificationsWithResponseTime.length > 0
				? notificationsWithResponseTime.reduce((sum, n) => sum + (n.response_time || 0), 0) /
				notificationsWithResponseTime.length
				: 0;

		const summary: AuditSummary = {
			total_notifications: notifications.length,
			users_notified: [...new Set(notifications.map(n => n.user_id))].length,
			total_comments: comments.length,
			total_escalations: escalations.length,
			responses: {
				acknowledged: notifications.filter(n => n.response === 'acknowledge').length,
				declined: notifications.filter(n => n.response === 'decline').length,
				resolved: notifications.filter(n => n.response === 'resolve').length,
				pending: notifications.filter(n => !n.response).length
			},
			avg_response_time: avgResponseTime
		};

		return {
			incident,
			audit_logs: auditLogs,
			notifications,
			comments,
			escalations,
			summary
		};
	} catch (error) {
		console.error('Error getting full incident audit:', error);
		throw error;
	}
}

/**
 * Get audit statistics
 */
export async function getAuditStats(
	db: DatabaseConnection,
	startDate: string | null = null,
	endDate: string | null = null
): Promise<AuditStats> {
	try {
		let dateFilter = '';
		const params: any[] = [];

		if (startDate && endDate) {
			dateFilter = 'WHERE n.delivered_at BETWEEN ? AND ?';
			params.push(startDate, endDate);
		}

		// Notification stats
		const notificationStats = (await db.get(
			`
				SELECT
					COUNT(*) as total_notifications,
					COUNT(CASE WHEN response = 'acknowledge' THEN 1 END) as acknowledged_count,
					COUNT(CASE WHEN response = 'decline' THEN 1 END) as declined_count,
					COUNT(CASE WHEN response = 'resolve' THEN 1 END) as resolved_count,
					COUNT(CASE WHEN response IS NULL THEN 1 END) as pending_count,
					AVG(response_time) as avg_response_time,
					MIN(response_time) as min_response_time,
					MAX(response_time) as max_response_time
				FROM incident_notifications n
					${dateFilter}
			`,
			params
		)) as NotificationStats;

		// Incident stats
		const incidentStats = (await db.get(
			`
				SELECT
					COUNT(*) as total_incidents,
					COUNT(CASE WHEN status = 'open' THEN 1 END) as open_incidents,
					COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating_incidents,
					COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_incidents,
					AVG(CASE
							WHEN resolved_at IS NOT NULL
								THEN CAST((strftime('%s', resolved_at) - strftime('%s', created_at)) AS REAL)
						END) as avg_resolution_time_seconds
				FROM incidents
						 ${dateFilter ? dateFilter.replace('n.delivered_at', 'created_at') : ''}
			`,
			params
		)) as IncidentStats;

		// Top responders
		const topResponders = (await db.all(
			`
				SELECT
					u.id,
					u.first_name,
					u.last_name,
					u.email,
					COUNT(*) as response_count,
					AVG(nr.response_time) as avg_response_time
				FROM notification_responses nr
						 JOIN users u ON nr.user_id = u.id
					${dateFilter ? dateFilter.replace('n.delivered_at', 'nr.responded_at') : ''}
				GROUP BY u.id, u.first_name, u.last_name, u.email
				ORDER BY response_count DESC
				LIMIT 10
			`,
			params
		)) as TopResponder[];

		return {
			notification_stats: notificationStats,
			incident_stats: incidentStats,
			top_responders: topResponders,
			period: {
				start: startDate,
				end: endDate
			}
		};
	} catch (error) {
		console.error('Error getting audit stats:', error);
		throw error;
	}
}

/**
 * Query audit logs with filtering and pagination
 */
export async function queryAuditLogs(
	db: DatabaseConnection,
	filters: {
		incidentId?: string;
		userId?: string;
		action?: string;
		startDate?: string;
		endDate?: string;
		limit?: number;
		offset?: number;
	}
): Promise<{ logs: AuditLog[]; total: number }> {
	try {
		const {
			incidentId,
			userId,
			action,
			startDate,
			endDate,
			limit = 100,
			offset = 0
		} = filters;

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

		const logs = await db.all(query, params) as AuditLog[];

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

		const countResult = await db.get(countQuery, countParams) as { total: number };

		return {
			logs,
			total: countResult.total
		};
	} catch (error) {
		console.error('Error querying audit logs:', error);
		throw error;
	}
}

/**
 * Export audit trail as CSV
 */
export function formatAuditTrailAsCSV(auditData: AuditDataForCSV): string {
	const { audit_logs, notifications, comments } = auditData;

	const rows: string[][] = [['Timestamp', 'Type', 'Action', 'User', 'Details', 'IP Address']];

	// Add audit logs
	audit_logs.forEach(log => {
		rows.push([
			log.created_at,
			'Audit Log',
			log.action,
			log.first_name ? `${log.first_name} ${log.last_name}` : 'System',
			log.details,
			log.ip_address || ''
		]);
	});

	// Add notifications
	notifications.forEach(notif => {
		rows.push([
			notif.delivered_at,
			'Notification',
			`Notified via ${notif.kind}`,
			notif.first_name ? `${notif.first_name} ${notif.last_name}` : '',
			notif.response
				? `Response: ${notif.response} (${notif.response_time}s)`
				: 'No response',
			''
		]);
	});

	// Add comments
	comments.forEach(comment => {
		rows.push([
			comment.created_at,
			'Comment',
			comment.response || 'Added comment',
			comment.first_name ? `${comment.first_name} ${comment.last_name}` : '',
			comment.comment,
			''
		]);
	});

	// Convert to CSV string
	return rows
		.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
		.join('\n');
}
