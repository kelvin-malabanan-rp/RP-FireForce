// services/incident.service.ts
import { CloudWatchAlarm, Env, Incident, IncidentStats, IncidentFilters } from '../types';
import { DatabaseService } from './database.service';
import { mapAlarmToSeverity, generateAwsConsoleUrl } from '../utils/aws.utils';

export class IncidentService {
	private dbService: DatabaseService;
	private env: Env;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
	}

	async processCloudWatchAlarm(
		alarm: CloudWatchAlarm
	): Promise<{ action: string; changes?: number; incident?: Incident; reason?: string }> {
		const isAlarmState = alarm.NewStateValue === 'ALARM';
		const isResolved = alarm.NewStateValue === 'OK';

		if (isResolved) {
			// Update existing incident to resolved
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
			title: alarm.AlarmName,
			description: alarm.AlarmDescription || 'CloudWatch alarm triggered',
			severity: mapAlarmToSeverity(alarm),
			status: 'open',
			timestamp: new Date(alarm.StateChangeTime).toISOString(),
			reportedBy: 'AWS CloudWatch',
			location: alarm.Region || 'Unknown',
			awsAlarmName: alarm.AlarmName,
			awsAccountId: alarm.AWSAccountId,
			stateReason: alarm.StateReason,
			metricName: 'Unknown',
			awsConsoleUrl: generateAwsConsoleUrl(alarm)
		};

		const result = await this.dbService.insertIncident(incident);
		console.log('New incident created:', incident.title);

		return { action: 'created', incident: incident as Incident };
	}

	async getIncidents(filters: IncidentFilters): Promise<Incident[]> {
		return this.dbService.getIncidents(filters);
	}

	async getStats(timeframe: '24h' | '7d' | '30d'): Promise<IncidentStats> {
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
	}

	createTestAlarm(): CloudWatchAlarm {
		return {
			AlarmName: `TEST-Manual-${Date.now()}`,
			AlarmDescription: 'Manually triggered test incident',
			NewStateValue: 'ALARM',
			OldStateValue: 'OK',
			StateChangeTime: new Date().toISOString(),
			Region: this.env.AWS_REGION || 'us-east-1',
			StateReason: 'Manual test trigger via API endpoint',
			AWSAccountId: '123456789012'
		};
	}
}
