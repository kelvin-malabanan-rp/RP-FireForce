// services/incident.services.ts
import {CreateIncidentTypes, Env, Incident, IncidentFilters, IncidentStats} from '../types';
import { DatabaseService } from './database.service';
import { PushNotificationService } from './push-notification.service';

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
			await this.pushService.sendIncidentAlert(incident as Incident);
			console.log('Push notifications sent for incident:', incident.id);
		} catch (error) {
			console.error('Failed to send push notifications:', error);
			// Don't fail the entire operation if push notifications fail
		}

		return { action: 'created', incident: incident as Incident };
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

	// Updated createIncident method to handle async operations and return the created incident
	public async createIncident(data: CreateIncidentTypes) {
		await this.validateUser(data.reportedBy);

		const incidentData: Partial<Incident> = {
			title: data.title,
			description: data.description,
			location: data.location,
			reportedBy: data.reportedBy,
			severity: data.severity,
			status: 'open',
			timestamp: new Date().toISOString()
		};

		return await this.dbService.insertIncident(incidentData);
	}

	private validateUser(email: string){
		try {
			this.dbService.getUserByEmail(email);
		}
		catch (error) {
			console.error(error);
		}
	}

	// services/incident.services.ts (or wherever this lives)
	async respondToIncident(
		incidentId: string,
		action: "acknowledge" | "decline",
		userId?: string
	): Promise<{ incidentId: string; action: string; escalated?: boolean }> {
		if (!this.dbService?.db) throw new Error("Database not available");

		// 1) Verify the incident exists (optional but helpful)
		const inc = await this.dbService.db
			.prepare("SELECT id FROM incidents WHERE id = ?")
			.bind(incidentId)
			.first<{ id: string }>();
		if (!inc) throw new Error(`Incident not found: ${incidentId}`);

		// 2) If acknowledging, ensure user exists; otherwise set to NULL to avoid FK violation
		let assignee: string | null = null;
		if (action === "acknowledge" && userId) {
			const user = await this.dbService.db
				.prepare("SELECT id FROM users WHERE id = ?")
				.bind(userId)
				.first<{ id: string }>();
			if (user?.id) {
				assignee = user.id;
			} else {
				// User not found → don’t assign to avoid FOREIGN KEY constraint fail
				console.warn(`[incident] User ${userId} not found; leaving assigned_to NULL`);
				assignee = null;
			}
		}

		// 3) Decide new status
		const newStatus = action === "acknowledge" ? "investigating" : "open";

		// 4) Update (assigned_to can be NULL; FK is only enforced when non-NULL)
		const res = await this.dbService.db
			.prepare(
				`UPDATE incidents
         SET status = ?, assigned_to = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
			)
			.bind(newStatus, assignee, incidentId)
			.run();

		if ((res as any)?.meta?.changes === 0) {
			throw new Error(`Update failed for incident ${incidentId}`);
		}

		// 5) Optional: trigger escalation if declined
		const escalated = action === "decline";
		if (escalated) {
			console.log(`[incident] Incident ${incidentId} declined — escalating`);
			// TODO: kick off real escalation here
		}

		return { incidentId, action, ...(escalated ? { escalated } : {}) };
	}

}
