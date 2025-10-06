import { Request, Response } from 'express';
import {
	createAuditLog,
	recordNotificationResponse,
	getNotificationHistory,
	getAuditTrail,
	getFullIncidentAudit,
	getAuditStats,
	formatAuditTrailAsCSV,
	queryAuditLogs
} from '../services/audit.services';
import { DatabaseConnection, AuditRequest } from '../types';

/**
 * Create audit log entry
 * POST /api/audit/logs
 */
export async function createAuditLogHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { action, details, incidentId, userId } = req.body;

		if (!action || !details) {
			res.status(400).json({
				error: 'Missing required fields',
				required: ['action', 'details']
			});
			return;
		}

		const auditRequest: AuditRequest = {
			headers: req.headers as any,
			connection: req.socket
		};

		const auditId = await createAuditLog(
			db,
			action,
			details,
			incidentId || null,
			userId || null,
			auditRequest
		);

		res.status(201).json({
			success: true,
			auditId,
			message: 'Audit log created successfully'
		});
	} catch (error) {
		console.error('Error in createAuditLogHandler:', error);
		res.status(500).json({
			error: 'Failed to create audit log',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Record notification response
 * POST /api/audit/notifications/:notificationId/response
 */
export async function recordNotificationResponseHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { notificationId } = req.params;
		const { incidentId, userId, response } = req.body;

		if (!incidentId || !userId || !response) {
			res.status(400).json({
				error: 'Missing required fields',
				required: ['incidentId', 'userId', 'response']
			});
			return;
		}

		if (!['acknowledge', 'decline', 'resolve'].includes(response)) {
			res.status(400).json({
				error: 'Invalid response type',
				validTypes: ['acknowledge', 'decline', 'resolve']
			});
			return;
		}

		const auditRequest: AuditRequest = {
			headers: req.headers as any,
			connection: req.socket
		};

		const result = await recordNotificationResponse(
			db,
			notificationId,
			incidentId,
			userId,
			response,
			auditRequest
		);

		res.status(200).json({
			success: true,
			...result,
			message: 'Response recorded successfully'
		});
	} catch (error) {
		console.error('Error in recordNotificationResponseHandler:', error);
		res.status(500).json({
			error: 'Failed to record response',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Get notification history for an incident
 * GET /api/audit/incidents/:incidentId/notifications
 */
export async function getNotificationHistoryHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { incidentId } = req.params;

		const notifications = await getNotificationHistory(db, incidentId);

		res.status(200).json({
			success: true,
			count: notifications.length,
			notifications
		});
	} catch (error) {
		console.error('Error in getNotificationHistoryHandler:', error);
		res.status(500).json({
			error: 'Failed to retrieve notification history',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Get audit trail for an incident
 * GET /api/audit/incidents/:incidentId/trail
 */
export async function getAuditTrailHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { incidentId } = req.params;

		const auditLogs = await getAuditTrail(db, incidentId);

		res.status(200).json({
			success: true,
			count: auditLogs.length,
			audit_logs: auditLogs
		});
	} catch (error) {
		console.error('Error in getAuditTrailHandler:', error);
		res.status(500).json({
			error: 'Failed to retrieve audit trail',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Get full incident audit (comprehensive)
 * GET /api/audit/incidents/:incidentId/full
 */
export async function getFullIncidentAuditHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { incidentId } = req.params;

		const fullAudit = await getFullIncidentAudit(db, incidentId);

		res.status(200).json({
			success: true,
			data: fullAudit
		});
	} catch (error) {
		console.error('Error in getFullIncidentAuditHandler:', error);

		if (error instanceof Error && error.message === 'Incident not found') {
			res.status(404).json({
				error: 'Incident not found'
			});
			return;
		}

		res.status(500).json({
			error: 'Failed to retrieve full incident audit',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Get audit statistics
 * GET /api/audit/stats
 */
export async function getAuditStatsHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { startDate, endDate } = req.query;

		const stats = await getAuditStats(
			db,
			startDate as string || null,
			endDate as string || null
		);

		res.status(200).json({
			success: true,
			stats
		});
	} catch (error) {
		console.error('Error in getAuditStatsHandler:', error);
		res.status(500).json({
			error: 'Failed to retrieve audit statistics',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Export audit trail as CSV
 * GET /api/audit/incidents/:incidentId/export/csv
 */
export async function exportAuditTrailAsCSVHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const { incidentId } = req.params;

		const fullAudit = await getFullIncidentAudit(db, incidentId);

		const csvData = formatAuditTrailAsCSV({
			audit_logs: fullAudit.audit_logs,
			notifications: fullAudit.notifications,
			comments: fullAudit.comments
		});

		const filename = `incident-${incidentId}-audit-${Date.now()}.csv`;

		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
		res.status(200).send(csvData);
	} catch (error) {
		console.error('Error in exportAuditTrailAsCSVHandler:', error);

		if (error instanceof Error && error.message === 'Incident not found') {
			res.status(404).json({
				error: 'Incident not found'
			});
			return;
		}

		res.status(500).json({
			error: 'Failed to export audit trail',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}

/**
 * Get audit logs with filtering
 * GET /api/audit/logs
 */
export async function getAuditLogsHandler(
	req: Request,
	res: Response,
	db: DatabaseConnection
): Promise<void> {
	try {
		const {
			incidentId,
			userId,
			action,
			startDate,
			endDate,
			limit = '100',
			offset = '0'
		} = req.query;

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
		params.push(parseInt(limit as string), parseInt(offset as string));

		const logs = await db.all(query, params);

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

		res.status(200).json({
			success: true,
			count: logs.length,
			total: countResult.total,
			limit: parseInt(limit as string),
			offset: parseInt(offset as string),
			logs
		});
	} catch (error) {
		console.error('Error in getAuditLogsHandler:', error);
		res.status(500).json({
			error: 'Failed to retrieve audit logs',
			details: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}
