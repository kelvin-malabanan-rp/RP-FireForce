// services/push-notification.service.ts
import { Env, Incident } from '../types';
import { DatabaseService } from './database.service';

interface PushMessage {
	to: string;
	title: string;
	body: string;
	data?: any;
	priority?: 'default' | 'normal' | 'high';
	sound?: string | null;
	channelId?: string;
}

export class PushNotificationService {
	private env: Env;
	private dbService: DatabaseService;
	private expoPushUrl = 'https://exp.host/--/api/v2/push/send';
	private fcmUrl = 'https://fcm.googleapis.com/fcm/send';

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
			let sentCount = 0;
			for (const tokenData of pushTokens) {
				// Check if user wants this type of alert
				if (this.shouldSendAlert(incident, tokenData.settings)) {
					// Use FCM token if available, otherwise fall back to Expo token
					const token = tokenData.fcmToken || tokenData.token;
					const success = await this.sendPushNotification(token, message);
					if (success) sentCount++;
				}
			}

			console.log(`Sent incident alert to ${sentCount}/${pushTokens.length} device(s)`);
		} catch (error) {
			console.error('Error sending incident alerts:', error);
		}
	}

	private createNotificationMessage(incident: Incident): Omit<PushMessage, 'to'> {
		const severityConfig = {
			critical: {
				channelId: 'critical-alerts-v3',
				sound: 'alarm_sound',
				priority: 'high' as const,
			},
			high: {
				channelId: 'high-priority-v3',
				sound: 'alarm_sound',
				priority: 'high' as const,
			},
			medium: {
				channelId: 'medium-priority-v3',
				sound: 'alarm_sound',
				priority: 'normal' as const,
			},
			low: {
				channelId: 'default-v3',
				sound: 'default',
				priority: 'normal' as const,
			},
		};

		const config = severityConfig[incident.severity] || severityConfig.low;

		return {
			title: `${incident.severity.toUpperCase()}: ${incident.title}`,
			body: incident.description,
			data: {
				incidentId: incident.id,
				severity: incident.severity,
				status: incident.status,
				type: 'incident_alert',
				awsConsoleUrl: incident.aws_console_url
			},
			priority: config.priority,
			sound: config.sound,
			channelId: config.channelId
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
			// Check if this is FCM token (direct) or Expo token
			if (token.startsWith('ExponentPushToken')) {
				// For Expo tokens, use Expo's service (no custom sounds)
				return await this.sendExpoNotification(token, message);
			} else {
				// For FCM tokens, send directly to FCM with custom sounds
				return await this.sendFCMNotification(token, message);
			}
		} catch (error) {
			console.error('Error sending push notification:', error);
			return false;
		}
	}

	private async sendExpoNotification(token: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		try {
			const payload: PushMessage = {
				to: token,
				...message,
				sound: 'default' // Expo only supports default sound
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
				console.error('Expo push notification failed:', response.status, errorText);
				return false;
			}

			const result = await response.json();
			console.log('Expo push notification sent:', result);
			return true;
		} catch (error) {
			console.error('Error sending Expo notification:', error);
			return false;
		}
	}

	private async sendFCMNotification(fcmToken: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		if (!this.env.FCM_SERVER_KEY) {
			console.error('FCM_SERVER_KEY not configured');
			return false;
		}

		try {
			const payload = {
				to: fcmToken,
				notification: {
					title: message.title,
					body: message.body,
					sound: message.sound || 'default',
					android_channel_id: message.channelId,
				},
				data: message.data,
				priority: 'high',
				// Android specific
				android: {
					notification: {
						sound: message.sound || 'default',
						channel_id: message.channelId,
						priority: message.priority === 'high' ? 'high' : 'normal',
					}
				}
			};

			const response = await fetch(this.fcmUrl, {
				method: 'POST',
				headers: {
					'Authorization': `key=${this.env.FCM_SERVER_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('FCM notification failed:', response.status, errorText);
				return false;
			}

			const result = await response.json();
			console.log('FCM notification sent:', result);
			return true;
		} catch (error) {
			console.error('Error sending FCM notification:', error);
			return false;
		}
	}

	async registerPushToken(
		token: string,
		deviceType: string | undefined,
		fcmToken: string | undefined,
		settings: any
	): Promise<{ success: boolean; deviceId: string }> {
		const query = `
            INSERT OR REPLACE INTO push_tokens
            (id, token, fcm_token, device_type, settings, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

		const deviceId = `device-${token.slice(-8)}-${Date.now()}`;

		try {
			if (!this.dbService.db) {
				throw new Error('Database connection not available');
			}

			await this.dbService.db.prepare(query).bind(
				deviceId,
				token,
				fcmToken || null,
				deviceType,
				JSON.stringify(settings || {}),
				1 // is_active = true
			).run();

			console.log('Push token registered:', deviceId, 'FCM:', !!fcmToken);
			return { success: true, deviceId };
		} catch (error) {
			console.error('Error registering push token:', error);
			throw error;
		}
	}

	private async getActivePushTokens(): Promise<Array<{
		token: string;
		fcmToken: string | null;
		settings: any
	}>> {
		const query = 'SELECT token, fcm_token, settings FROM push_tokens WHERE is_active = 1';

		try {
			if (!this.dbService.db) {
				return [];
			}

			const { results } = await this.dbService.db.prepare(query).all();

			return (results as any[]).map(row => ({
				token: row.token,
				fcmToken: row.fcm_token,
				settings: row.settings ? JSON.parse(row.settings) : {}
			}));
		} catch (error) {
			console.error('Error fetching push tokens:', error);
			return [];
		}
	}

	async sendTestAlert(
		token: string,
		alertType: 'critical' | 'high' | 'medium' | 'low' | 'default' = 'high'
	): Promise<boolean> {
		const severityConfig = {
			critical: {
				channelId: 'critical-alerts-v3',
				sound: 'alarm_sound',
			},
			high: {
				channelId: 'high-priority-v3',
				sound: 'alarm_sound',
			},
			medium: {
				channelId: 'medium-priority-v3',
				sound: 'alarm_sound',
			},
			low: {
				channelId: 'default-v3',
				sound: 'default',
			},
			default: {
				channelId: 'default-v3',
				sound: 'default',
			},
		};

		const config = severityConfig[alertType] || severityConfig.default;

		const message = {
			title: `${alertType.toUpperCase()} Test Alert`,
			body: 'This is a test notification to verify your alert system is working.',
			data: {
				type: 'test',
				severity: alertType,
				timestamp: new Date().toISOString()
			},
			priority: 'high' as const,
			sound: config.sound,
			channelId: config.channelId
		};

		return await this.sendPushNotification(token, message);
	}
}
