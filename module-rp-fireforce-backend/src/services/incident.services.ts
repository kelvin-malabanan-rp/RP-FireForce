// services/incident.services.ts
import {
	CreateIncidentTypes,
	Env,
	Incident,
	IncidentCommentPayload,
	IncidentCommentResponse,
	IncidentFilters,
	IncidentStats,
} from '../types';
import {DatabaseService} from './database.service';
import {PushNotificationService} from './push-notification.service';
import {EmailService} from "./email.service";
import {OnCallService} from "./oncall.service";

export class IncidentService {
	private env: Env;
	private dbService: DatabaseService;
	private pushService: PushNotificationService;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
		this.pushService = new PushNotificationService(env);
	}

	async getIncidents(params: IncidentFilters): Promise<Incident[]> {
		return this.dbService.getIncidents(params);
	}

	async getStats(timeframe: "24h" | "7d" | "30d" | "all"): Promise<IncidentStats> {
		try {
			const incidents = await this.dbService.getIncidents({ timeframe });

			const stats: IncidentStats = {
				total: incidents.length,
				open: incidents.filter(i => i.status === 'open').length,
				investigating: incidents.filter(i => i.status === 'investigating').length,
				resolved: incidents.filter(i => i.status === 'resolved').length,
				severities: {
					critical: incidents.filter(i => i.severity === 'critical').length,
					high: incidents.filter(i => i.severity === 'high').length,
					medium: incidents.filter(i => i.severity === 'medium').length,
					low: incidents.filter(i => i.severity === 'low').length,
				}
			};

			return stats;
		} catch (error) {
			console.error('Error calculating stats:', error);
			throw error;
		}
	}

	createTestAlarm() {
		return {
			AlarmName: `TEST-Manual-${Date.now()}`,
			AlarmDescription: 'Manually triggered test incident',
			NewStateValue: 'ALARM' as const,
			OldStateValue: 'OK' as const,
			StateChangeTime: new Date().toISOString(),
			Region: this.env.AWS_REGION || 'us-east-1',
			StateReason: 'Manual test trigger via API endpoint',
			AWSAccountId: '914556845169'
		};
	}

	async processCloudWatchAlarm(alarm: any): Promise<{ action: string; changes?: number; incident?: Incident; reason?: string }> {
		const isAlarmState = alarm.NewStateValue === 'ALARM';
		const isResolved = alarm.NewStateValue === 'OK';

		if (isResolved) {
			const result = await this.dbService.updateIncidentStatus(
				alarm.AlarmName,
				'resolved',
				new Date().toISOString()
			);

			if (result.changes > 0) {
				console.log('Incident resolved for alarm:', alarm.AlarmName);
			}

			return { action: 'resolved', changes: result.changes };
		}

		if (!isAlarmState) {
			return { action: 'ignored', reason: 'Not an ALARM state' };
		}

		// Create new incident with proper null handling
		const incident: Partial<Incident> = {
			id: `aws-${alarm.AlarmName}-${Date.now()}`,
			title: alarm.AlarmName || 'Unknown Alarm',
			description: alarm.AlarmDescription || 'CloudWatch alarm triggered',
			severity: this.mapAlarmToSeverity(alarm),
			status: 'open',
			timestamp: new Date(alarm.StateChangeTime).toISOString(),
			reportedBy: 'AWS CloudWatch',
			location: alarm.Region || null,
			awsAlarmName: alarm.AlarmName || null,
			awsAccountId: alarm.AWSAccountId || null,
			stateReason: alarm.StateReason || null,
			metricName: null,
			aws_console_url: alarm.AlarmName ? this.generateAwsConsoleUrl(alarm) : null
		};

		// Insert incident using DatabaseService
		const result = await this.dbService.insertIncident(incident);
		console.log('New incident created:', result.id);

		// Send push notifications using PushNotificationService instance
		try {
			await this.pushService.sendIncidentAlert({
				...incident,
				id: result.id
			} as Incident);
			console.log('Push notifications sent for incident:', incident);
		} catch (error) {
			console.error('Failed to send push notifications:', error);
			// Don't fail the entire operation if push notifications fail
		}

		return { action: 'created', incident: incident as Incident };
	}

	async resolveIncident(incidentId: string, resolvedBy?: string) {
		if (!this.dbService.db) throw new Error('DB not available');

		const sql = `
			UPDATE incidents
			SET status = 'resolved',
				resolved_by = ?,
				resolved_at = CURRENT_TIMESTAMP,
				updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`;
		await this.dbService.db.prepare(sql).bind(resolvedBy ?? null, incidentId).run();

		// Fire all clear after successful resolve and capture the result
		const notificationResult = await this.pushService.sendAllClear(incidentId);

		return {
			incidentId,
			status: 'resolved',
			notifiedCount: notificationResult?.notifiedCount || 0,
			users: notificationResult?.users || []
		};
	}


	private mapAlarmToSeverity(alarm: any): 'low' | 'medium' | 'high' | 'critical' {
		const alarmName = (alarm.AlarmName || '').toLowerCase();

		if (alarmName.includes('critical') || alarmName.includes('outage') || alarmName.includes('down')) {
			return 'critical';
		}
		if (alarmName.includes('high') || alarmName.includes('cpu') || alarmName.includes('error')) {
			return 'high';
		}
		if (alarmName.includes('medium') || alarmName.includes('memory')) {
			return 'medium';
		}
		return 'low';
	}

	private generateAwsConsoleUrl(alarm: any): string {
		const region = alarm.Region || 'us-east-1';
		return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:alarm/${encodeURIComponent(alarm.AlarmName)}`;
	}

	public async createIncident(data: CreateIncidentTypes) {
		await this.validateUserByEmail(data.reportedBy);

		const incidentData: Partial<Incident> = {
			title: data.title,
			description: data.description,
			location: data.location,
			reportedBy: data.reportedBy,
			severity: data.severity,
			status: 'open',
			timestamp: new Date().toISOString()
		};

		const result = await this.dbService.insertIncident(incidentData);

		// Handle notifications based on whether it's an override or normal rotation
		if (data.notify_users && Array.isArray(data.notify_users) && data.notify_users.length > 0) {
			// Emergency override - notify specific users
			await this.notifySpecificUsers(result.id, data.notify_users);
		} else {
			// Normal rotation - notify current on-call
			await this.notifyCurrentOnCall(result.id);
		}

		return result;
	}

	private async notifySpecificUsers(incidentId: string, userIds: string[]): Promise<void> {
		const incident = await this.dbService.getIncidentBy(incidentId);
		const emailService = new EmailService(this.env);

		for (const userId of userIds) {
			const user = await this.dbService.getUserById(userId);
			if (user) {
				try {
					await emailService.sendIncidentAlert(incident, user.email);
					await this.trackNotification(incidentId, userId, 'initial');
				} catch (error) {
					console.error(`Failed to notify user ${userId}:`, error);
				}
			}
		}
	}

	private async notifyCurrentOnCall(incidentId: string): Promise<void> {
		const incident = await this.dbService.getIncidentBy(incidentId);
		const emailService = new EmailService(this.env);

		// Get all teams and their current on-call members
		const oncallService = new OnCallService(this.env);
		const teams = await oncallService.getOnCallTeams();

		for (const team of teams) {
			const currentOnCall = await oncallService.getAllCurrentOnCall(team.id);

			if (currentOnCall) {
				// Notify primary
				if (currentOnCall.primary) {
					try {
						await emailService.sendIncidentAlert(incident, currentOnCall.primary.email);
						await this.trackNotification(incidentId, currentOnCall.primary.id, 'initial');
					} catch (error) {
						console.error(`Failed to notify primary:`, error);
					}
				}

				// Notify backup
				if (currentOnCall.backup) {
					try {
						await emailService.sendIncidentAlert(incident, currentOnCall.backup.email);
						await this.trackNotification(incidentId, currentOnCall.backup.id, 'initial');
					} catch (error) {
						console.error(`Failed to notify backup:`, error);
					}
				}
			}
		}
	}

	private async trackNotification(incidentId: string, userId: string, type: string): Promise<void> {
		await this.dbService.db.prepare(`
        INSERT INTO incident_notifications (id, incident_id, user_id, notification_type, sent_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(crypto.randomUUID(), incidentId, userId, type).run();
	}

	private validateUserById(userId: string){
		try {
			this.dbService.getUserById(userId);
		} catch (error) {
			console.error(error);
			throw error; // Re-throw so the calling function knows validation failed
		}
	}

	private async validateUserByEmail(email: string): Promise<void> {
		try {
			await this.dbService.getUserByEmail(email);
		} catch (error) {
			console.error(error);
			throw error;
		}
	}

	public async selectIncidentById(incidentId: string): Promise<Incident> {
		const incident = await this.dbService.getIncidentBy(incidentId);

		if (!incident) {
			throw new Error(`Incident with ID ${incidentId} not found`);
		}

		return incident;
	}

	async submitIncidentComment(data: IncidentCommentPayload): Promise<IncidentCommentResponse> {
		this.validateUserById(data.userId);
		const result = await this.dbService.postIncidentComment(data);

		if (!result) {
			throw new Error('Failed to post incident comment');
		}
		return result;
	}

	async fetchIncidentComments(incidentId: string): Promise<IncidentCommentResponse[]> {
		return await this.dbService.getIncidentComments(incidentId);
	}

	async changeIncidentStatus(
		id: string,
		status: string,
		resolvedBy?: string
	): Promise<{
		id: string;
		status: string;
		updatedAt: string;
		notifiedCount?: number;
		users?: Array<{ name: string; email: string }>;
	}> {
		return await this.dbService.updateSpecificIncidentStatus(id, status, resolvedBy);
	}
}
