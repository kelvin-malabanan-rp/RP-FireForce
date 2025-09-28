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
	categoryId?: string; // 👈 NEW
}

export class PushNotificationService {
	private env: Env;
	private dbService: DatabaseService;
	private expoPushUrl = 'https://exp.host/--/api/v2/push/send';

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
	}

	private async logDelivery(incidentId: string, kind: 'alert' | 'all_clear', token?: string, fcmToken?: string) {
		if (!this.dbService.db) return;
		const sql = `
      INSERT OR IGNORE INTO incident_notifications (id, incident_id, token, fcm_token, kind)
      VALUES (?, ?, ?, ?, ?)
    `;
		const uuid = this.dbService.generateUUID()
		await this.dbService.db.prepare(sql).bind(
			`deliv-${uuid ?? Date.now()}`, // fallback if no randomUUID
			incidentId,
			token ?? null,
			fcmToken ?? null,
			kind
		).run();
	}

	async sendIncidentAlert(incident: Incident): Promise<void> {
		try {
			const pushTokens = await this.getActivePushTokens();
			if (pushTokens.length === 0) {
				console.log('No push tokens registered - skipping notifications');
				return;
			}

			const message = this.createNotificationMessage(incident);
			let sentCount = 0;

			for (const tokenData of pushTokens) {
				if (this.shouldSendAlert(incident, tokenData.settings)) {
					const tokenUsed = tokenData.fcmToken || tokenData.token;
					const success = await this.sendPushNotification(tokenUsed, message);
					if (success) {
						sentCount++;
						await this.logDelivery(incident.id, 'alert',
							tokenUsed.startsWith('ExponentPushToken') ? tokenUsed : undefined,
							tokenUsed.startsWith('ExponentPushToken') ? undefined : tokenUsed
						);
					}
				}
			}

			console.log(`Sent incident alert to ${sentCount}/${pushTokens.length} device(s)`);
		} catch (error) {
			console.error('Error sending incident alerts:', error);
		}
	}

	async sendAllClear(incidentId: string): Promise<void> {
		if (!this.dbService.db) return;

		// 1) Fetch the incident (title/body context)
		const incidentRow = await this.dbService.db
			.prepare('SELECT * FROM incidents WHERE id = ?')
			.bind(incidentId)
			.first();
		if (!incidentRow) {
			console.warn('[all_clear] incident not found:', incidentId);
			return;
		}

		// 2) Find everyone who previously received 'alert' for this incident
		const { results } = await this.dbService.db
			.prepare(`SELECT DISTINCT token, fcm_token FROM incident_notifications
                WHERE incident_id = ? AND kind = 'alert'`)
			.bind(incidentId)
			.all();

		const recipients = (results as any[]) || [];
		if (recipients.length === 0) {
			console.log('[all_clear] no prior recipients to notify for', incidentId);
			return;
		}

		// 3) Build an all-clear message (gentle sound/channel)
		const message: Omit<PushMessage, 'to'> = {
			title: `ALL CLEAR: ${incidentRow.title ?? 'Incident resolved'}`,
			body: 'The incident has been resolved. Thanks for jumping in!',
			data: {
				type: 'all_clear',
				incidentId,
				resolved_at: new Date().toISOString(),
			},
			// Use default sound / a light channel
			priority: 'normal',
			sound: 'default',            // Expo: still default; FCM: default or your chime
			channelId: 'default-v4',     // keep it non-intrusive
			// no categoryId; no actions here
		};

		// 4) Send, then log as 'all_clear'
		let sent = 0;
		for (const r of recipients) {
			const tokenUsed = r.fcm_token || r.token;
			if (!tokenUsed) continue;

			const ok = await this.sendPushNotification(tokenUsed, message);
			if (ok) {
				sent++;
				await this.logDelivery(incidentId, 'all_clear',
					tokenUsed.startsWith('ExponentPushToken') ? tokenUsed : undefined,
					tokenUsed.startsWith('ExponentPushToken') ? undefined : tokenUsed
				);
			}
		}

		console.log(`[all_clear] sent to ${sent}/${recipients.length} recipients`, { incidentId });
	}

	private createNotificationMessage(incident: Incident): Omit<PushMessage, 'to'> {
		const severityConfig = {
			critical: {
				channelId: 'critical-alerts-v4',
				sound: 'alarm_sound.mp3',
				priority: 'high' as const,
			},
			high: {
				channelId: 'high-priority-v4',
				sound: 'alarm_sound.mp3', // Changed to use same sound
				priority: 'high' as const,
			},
			medium: {
				channelId: 'medium-priority-v4',
				sound: 'alarm_sound.mp3', // Changed to use same sound
				priority: 'normal' as const,
			},
			low: {
				channelId: 'default-v4',
				sound: 'alarm_sound.mp3', // Changed to use same sound
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
				awsConsoleUrl: incident.aws_console_url,
			},
			priority: config.priority,
			sound: config.sound,
			channelId: config.channelId,
		};
	}

	private shouldSendAlert(incident: Incident, settings: any): boolean {
		if (!settings || !settings.enableAlerts) return false;
		if (settings.criticalOnly && incident.severity !== 'critical') return false;
		if (incident.status === 'resolved') return false;
		return true;
	}

	private async sendPushNotification(token: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		try {
			if (token.startsWith('ExponentPushToken')) {
				return await this.sendExpoNotification(token, message);
			} else {
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
				sound: 'default', // Expo-only limitation
			};

			const response = await fetch(this.expoPushUrl, {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				console.error('Expo push notification failed:', response.status, await response.text());
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
		try {
			const accessToken = await this.getFirebaseAccessToken();

			if (!accessToken) {
				console.error('Failed to get Firebase access token');
				return false;
			}

			const payload = {
				message: {
					token: fcmToken,
					notification: {
						title: message.title,
						body: message.body,
					},
					data: {
						...message.data,
						categoryId: message.categoryId || '',
					},
					android: {
						notification: {
							sound: message.sound || 'default',
							channel_id: message.channelId,
							// Remove priority from here - it's not valid in FCM v1
						},
						priority: message.priority === 'high' ? 'high' : 'normal', // Move priority here
					},
				}
			};

			const fcmV1Url = `https://fcm.googleapis.com/v1/projects/${this.env.FIREBASE_PROJECT_ID}/messages:send`;

			const response = await fetch(fcmV1Url, {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${accessToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				console.error('FCM v1 notification failed:', response.status, await response.text());
				return false;
			}

			const result = await response.json();
			console.log('FCM v1 notification sent:', result);
			return true;
		} catch (error) {
			console.error('Error sending FCM v1 notification:', error);
			return false;
		}
	}

	private async getFirebaseAccessToken(): Promise<string | null> {
		try {
			console.log('Available env vars:', Object.keys(this.env));
			console.log('FIREBASE_PROJECT_ID:', this.env.FIREBASE_PROJECT_ID);
			console.log('FIREBASE_CLIENT_EMAIL:', this.env.FIREBASE_CLIENT_EMAIL);
			console.log('FIREBASE_PRIVATE_KEY exists:', !!this.env.FIREBASE_PRIVATE_KEY);

			if (!this.env.FIREBASE_PROJECT_ID || !this.env.FIREBASE_CLIENT_EMAIL || !this.env.FIREBASE_PRIVATE_KEY) {
				console.log('Firebase credentials not configured, skipping FCM');
				return null;
			}

			const serviceAccount = {
				type: "service_account",
				project_id: this.env.FIREBASE_PROJECT_ID,
				client_email: this.env.FIREBASE_CLIENT_EMAIL,
				private_key: this.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			};

			// Create JWT for Firebase
			const jwt = await this.createJWT(serviceAccount);

			// Exchange JWT for access token
			const response = await fetch('https://oauth2.googleapis.com/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
					assertion: jwt,
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				console.error('Failed to get Firebase access token:', error);
				return null;
			}

			const data = await response.json();
			console.log('getFirebaseAccessToken data:', data);
			return data.access_token;
		} catch (error) {
			console.error('Error getting Firebase access token:', error);
			return null;
		}
	}

	private async createJWT(serviceAccount: any): Promise<string> {
		const header = {
			alg: 'RS256',
			typ: 'JWT'
		};

		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: serviceAccount.client_email,
			scope: 'https://www.googleapis.com/auth/firebase.messaging',
			aud: 'https://oauth2.googleapis.com/token',
			exp: now + 3600,
			iat: now
		};

		// Base64URL encode header and payload
		const encodedHeader = this.base64URLEncode(JSON.stringify(header));
		const encodedPayload = this.base64URLEncode(JSON.stringify(payload));

		// Create signing input
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		// Import private key
		const privateKey = await this.importPrivateKey(serviceAccount.private_key);

		// Sign with WebCrypto
		const signature = await crypto.subtle.sign(
			'RSASSA-PKCS1-v1_5',
			privateKey,
			new TextEncoder().encode(signingInput)
		);

		// Base64URL encode signature
		const encodedSignature = this.base64URLEncode(signature);

		return `${signingInput}.${encodedSignature}`;
	}

	private async importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
		// Remove PEM header/footer and newlines
		const pemContents = privateKeyPem
			.replace('-----BEGIN PRIVATE KEY-----', '')
			.replace('-----END PRIVATE KEY-----', '')
			.replace(/\s/g, '');

		// Convert base64 to ArrayBuffer
		const binaryString = atob(pemContents);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		// Import the key
		return await crypto.subtle.importKey(
			'pkcs8',
			bytes.buffer,
			{
				name: 'RSASSA-PKCS1-v1_5',
				hash: 'SHA-256',
			},
			false,
			['sign']
		);
	}

	private base64URLEncode(data: string | ArrayBuffer): string {
		let base64: string;

		if (typeof data === 'string') {
			base64 = btoa(data);
		} else {
			const bytes = new Uint8Array(data);
			const binaryString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
			base64 = btoa(binaryString);
		}

		// Convert base64 to base64URL
		return base64
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=/g, '');
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

	async sendTestAlert(token: string, alertType: 'critical' | 'high' | 'medium' | 'low' | 'default' = 'high'): Promise<boolean> {
		const config = {
			channelId: 'default-v4',
			sound: 'default',
		};
		if (alertType === 'critical') {
			config.channelId = 'critical-alerts-v4';
			config.sound = 'alarm_sound';
		} else if (alertType === 'high') {
			config.channelId = 'high-priority-v4';
			config.sound = 'alarm_sound';
		} else if (alertType === 'medium') {
			config.channelId = 'medium-priority-v4';
			config.sound = 'alarm_sound';
		}

		const message = {
			title: `${alertType.toUpperCase()} Test Alert`,
			body: 'This is a test notification to verify your alert system is working.',
			data: {
				type: 'test',
				severity: alertType,
				timestamp: new Date().toISOString(),
			},
			priority: 'high' as const,
			sound: config.sound,
			channelId: config.channelId,
			categoryId: alertType === 'critical' ? 'incident-actions' : undefined,
		};

		return await this.sendPushNotification(token, message);
	}
}
