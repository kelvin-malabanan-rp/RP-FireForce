// services/push-notification.service.ts
import { Env, Incident } from '../types';
import { DatabaseService } from './database.service';

interface PushMessage {
	to: string;
	title: string;
	body: string;
	data?: any;
	priority?: 'default' | 'normal' | 'high';
	sound?: 'default' | null;
	channelId?: string;
}

export class PushNotificationService {
	private env: Env;
	private dbService: DatabaseService;
	private expoPushUrl = 'https://exp.host/--/api/v2/push/send';

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
	}

	async sendIncidentAlert(incident: Incident): Promise<void> {
		try {
			// Get all active push tokens
			const pushTokens = await this.getActivePushTokens();

			if (pushTokens.length === 0) {
				console.log('No push tokens registered - skipping notifications');
				return;
			}

			// Create notification message
			const message = this.createNotificationMessage(incident);

			// Send to all registered devices
			for (const tokenData of pushTokens) {
				// Check if user wants this type of alert
				if (this.shouldSendAlert(incident, tokenData.settings)) {
					await this.sendPushNotification(tokenData.token, message);
				}
			}

			console.log(`Sent incident alert to ${pushTokens.length} device(s)`);
		} catch (error) {
			console.error('Error sending incident alerts:', error);
		}
	}

	private createNotificationMessage(incident: Incident): Omit<PushMessage, 'to'> {
		const isCritical = incident.severity === 'critical';

		return {
			title: `${incident.severity.toUpperCase()} Alert`,
			body: incident.title,
			data: {
				incidentId: incident.id,
				severity: incident.severity,
				status: incident.status,
				type: 'incident_alert',
				awsConsoleUrl: incident.aws_console_url
			},
			priority: isCritical ? 'high' : 'normal',
			sound: isCritical ? 'default' : null,
			channelId: isCritical ? 'critical' : 'normal'
		};
	}

	private shouldSendAlert(incident: Incident, settings: any): boolean {
		if (!settings || !settings.enableAlerts) {
			return false;
		}

		if (settings.criticalOnly && incident.severity !== 'critical') {
			return false;
		}

		// Don't send alerts for resolved incidents
		if (incident.status === 'resolved') {
			return false;
		}

		return true;
	}

	private async sendPushNotification(token: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		try {
			const payload: PushMessage = {
				to: token,
				...message
			};

			const response = await fetch(this.expoPushUrl, {
				method: 'POST',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('Push notification failed:', response.status, errorText);
				return false;
			}

			const result = await response.json();
			return true;
		} catch (error) {
			console.error('Error sending push notification:', error);
			return false;
		}
	}

	async registerPushToken(token: string, deviceType: string | undefined, settings: any): Promise<{
		success: boolean;
		deviceId: string
	}> {
		const query = `
            INSERT OR REPLACE INTO push_tokens
            (id, token, device_type, settings, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

		const deviceId = `device-${token.slice(-8)}-${Date.now()}`;

		try {
			if (!this.dbService.db) {
				throw new Error('Database connection not available');
			}

			await this.dbService.db.prepare(query).bind(
				deviceId,
				token,
				deviceType,
				JSON.stringify(settings || {}),
				true
			).run();

			return { success: true, deviceId };
		} catch (error) {
			console.error('Error registering push token:', error);
			throw error;
		}
	}

	private async getActivePushTokens(): Promise<Array<{ token: string; settings: any }>> {
		const query = 'SELECT token, settings FROM push_tokens WHERE is_active = 1';

		try {
			if (!this.dbService.db) {
				return [];
			}

			const { results } = await this.dbService.db.prepare(query).all();

			return (results as any[]).map(row => ({
				token: row.token,
				settings: row.settings ? JSON.parse(row.settings) : {}
			}));
		} catch (error) {
			console.error('Error fetching push tokens:', error);
			return [];
		}
	}

	async sendTestAlert(token: string, alertType: string): Promise<boolean> {
		const message = {
			title: `${alertType.toUpperCase()} Test Alert`,
			body: 'This is a test notification to verify your alert system is working.',
			data: {
				type: 'test',
				severity: alertType,
				timestamp: new Date().toISOString()
			},
			priority: 'high' as const,
			sound: 'default' as const
		};

		return await this.sendPushNotification(token, message);
	}
}
