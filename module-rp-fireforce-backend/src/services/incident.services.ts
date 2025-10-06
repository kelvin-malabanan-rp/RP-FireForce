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
import { DatabaseService } from './database.service';
import { PushNotificationService } from './push-notification.service';
import { EmailService } from "./email.service";
import { OnCallService } from "./oncall.service";

export class IncidentService {
	private env: Env;
	private dbService: DatabaseService;
	private pushService: PushNotificationService;
	private emailService: EmailService;
	private oncallService: OnCallService;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
		this.pushService = new PushNotificationService(env);
		this.emailService = new EmailService(env);
		this.oncallService = new OnCallService(env);
	}

	// ──────────────────────────────────────────────
	async getIncidents(params: IncidentFilters): Promise<Incident[]> {
		return this.dbService.getIncidents(params);
	}

	async getStats(timeframe: "24h" | "7d" | "30d" | "all"): Promise<IncidentStats> {
		try {
			const incidents = await this.dbService.getIncidents({ timeframe });

			return {
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
		} catch (error) {
			console.error('Error calculating stats:', error);
			throw error;
		}
	}

	// ──────────────────────────────────────────────
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

	// ──────────────────────────────────────────────
	async processCloudWatchAlarm(alarm: any) {
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

		// Create new incident
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

		const result = await this.dbService.insertIncident(incident);
		console.log('New incident created:', result.id);

		try {
			await this.pushService.sendIncidentAlert({
				...incident,
				id: result.id
			} as Incident);
			console.log('Push notifications sent for incident:', incident.title);
		} catch (error) {
			console.error('Failed to send push notifications:', error);
		}

		return { action: 'created', incident: incident as Incident };
	}

	// ──────────────────────────────────────────────
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

		const notificationResult = await this.pushService.sendAllClear(incidentId);

		return {
			incidentId,
			status: 'resolved',
			notifiedCount: notificationResult?.notifiedCount || 0,
			users: notificationResult?.users || []
		};
	}

	// ──────────────────────────────────────────────
	private mapAlarmToSeverity(alarm: any): 'low' | 'medium' | 'high' | 'critical' {
		const name = (alarm.AlarmName || '').toLowerCase();

		if (name.includes('critical') || name.includes('outage') || name.includes('down')) return 'critical';
		if (name.includes('high') || name.includes('cpu') || name.includes('error')) return 'high';
		if (name.includes('medium') || name.includes('memory')) return 'medium';
		return 'low';
	}

	private generateAwsConsoleUrl(alarm: any): string {
		const region = alarm.Region || 'us-east-1';
		return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:alarm/${encodeURIComponent(alarm.AlarmName)}`;
	}

	// ──────────────────────────────────────────────
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

		if (data.notify_users && Array.isArray(data.notify_users) && data.notify_users.length > 0) {
			await this.notifySpecificUsers(result.id, data.notify_users);
		} else {
			await this.notifyCurrentOnCall(result.id);
		}

		return result;
	}

	// ──────────────────────────────────────────────
	private async notifySpecificUsers(incidentId: string, userIds: string[]): Promise<void> {
		const incident = await this.dbService.getIncidentById(incidentId);

		for (const userId of userIds) {
			const user = await this.dbService.getUserById(userId);
			if (user) {
				try {
					await this.emailService.sendIncidentAlert(incident, user.email);
					await this.trackNotification(incidentId, userId, 'initial');
				} catch (error) {
					console.error(`Failed to notify user ${userId}:`, error);
				}
			}
		}
	}

	private async notifyCurrentOnCall(incidentId: string): Promise<void> {
		const incident = await this.dbService.getIncidentById(incidentId);
		if (!incident) {
			console.error('Incident not found:', incidentId);
			return;
		}

		try {
			const teams = await this.oncallService.getUserTeam(incident.reportedBy);
			for (const team of teams) {
				const current = await this.oncallService.getAllCurrentOnCall(team.id);

				if (current?.primary) {
					try {
						await this.emailService.sendIncidentAlert(incident, current.primary.email);
						await this.trackNotification(incidentId, current.primary.id, 'initial');
					} catch (err) {
						console.error(`Failed to notify primary:`, err);
					}
				}

				if (current?.backup) {
					try {
						await this.emailService.sendIncidentAlert(incident, current.backup.email);
						await this.trackNotification(incidentId, current.backup.id, 'initial');
					} catch (err) {
						console.error(`Failed to notify backup:`, err);
					}
				}
			}

			await this.pushService.sendIncidentAlert(incident);
			console.log('Push notifications sent for incident:', incidentId);
		} catch (error) {
			console.error('Failed to send on-call notifications:', error);
		}
	}

	// ──────────────────────────────────────────────
	private async trackNotification(incidentId: string, userId: string, type: string): Promise<void> {
		await this.dbService.db.prepare(`
			INSERT INTO incident_notifications (id, incident_id, user_id, notification_type, sent_at)
			VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
		`).bind(crypto.randomUUID(), incidentId, userId, type).run();
	}

	// ──────────────────────────────────────────────
	private async validateUserById(userId: string): Promise<void> {
		try {
			await this.dbService.getUserById(userId);
		} catch (error) {
			console.error(error);
			throw error;
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

	// ──────────────────────────────────────────────
	public async selectIncidentById(incidentId: string): Promise<Incident> {
		const incident = await this.dbService.getIncidentById(incidentId);
		if (!incident) throw new Error(`Incident with ID ${incidentId} not found`);
		return incident;
	}

	async submitIncidentComment(data: IncidentCommentPayload): Promise<IncidentCommentResponse> {
		await this.validateUserById(data.userId);
		const result = await this.dbService.postIncidentComment(data);
		if (!result) throw new Error('Failed to post incident comment');
		return result;
	}

	async fetchIncidentComments(incidentId: string): Promise<IncidentCommentResponse[]> {
		return await this.dbService.getIncidentComments(incidentId);
	}

	async changeIncidentStatus(
		id: string,
		status: string,
		resolvedBy?: string
	) {
		return await this.dbService.updateSpecificIncidentStatus(id, status, resolvedBy);
	}
}
