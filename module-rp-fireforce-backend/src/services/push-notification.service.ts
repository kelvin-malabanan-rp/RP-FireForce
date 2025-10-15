// services/push-notification.service.ts
import { Env, Incident } from '../types';
import { DatabaseService } from './database.service';
import {OnCallService} from "./oncall.service";

interface PushMessage {
	to: string;
	title: string;
	body: string;
	data?: any;
	priority?: 'default' | 'normal' | 'high';
	sound?: string | null;
	channelId?: string;
	categoryId?: string;
}

export class PushNotificationService {
	private env: Env;
	private dbService: DatabaseService;
	private expoPushUrl = 'https://exp.host/--/api/v2/push/send';
	private oncallService: OnCallService;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
		this.oncallService = new OnCallService(env);
	}

	private async logDelivery(incidentId: string, kind: 'alert' | 'all_clear' | 'reminder' | 'escalation', token?: string, fcmToken?: string) {
		if (!this.dbService.db) return;
		const sql = `
			INSERT OR IGNORE INTO incident_notifications (id, incident_id, token, fcm_token, kind)
			VALUES (?, ?, ?, ?, ?)
		`;
		const uuid = this.dbService.generateUUID()
		await this.dbService.db.prepare(sql).bind(
			`deliv-${uuid ?? Date.now()}`,
			incidentId,
			token ?? null,
			fcmToken ?? null,
			kind
		).run();
	}

	// ✅ Send initial incident alert to all on-call members
	async sendIncidentAlert(incident: Incident): Promise<void> {
		try {
			// Get current on-call assignments with push tokens for today
			const currentOnCallResponse = await this.oncallService.getAllCurrentOnCall();

			if (!currentOnCallResponse) {
				console.log('[push] No on-call assignments found for today - skipping notifications');
				return;
			}

			// ✅ Handle the new response format: {primary: [], backup: [], escalation: []}
			const { primary = [], backup = [], escalation = [] } = currentOnCallResponse;

			// Combine all members from all roles
			const allMembers = [...primary, ...backup, ...escalation];

			if (allMembers.length === 0) {
				console.log('[push] No on-call members found - skipping notifications');
				return;
			}

			const message = this.createNotificationMessage(incident, 'incident_alert');
			let sentCount = 0;
			let skippedCount = 0;

			// Loop through each on-call member
			for (const member of allMembers) {
				// Only send if member has a push token
				if (member.pushToken) {
					const success = await this.sendPushNotification(member.pushToken, message);
					if (success) {
						sentCount++;
						await this.logDelivery(
							incident.id,
							'alert',
							member.pushToken,
							member.fcmToken
						);
						console.log(`[push] ✓ Sent to ${member.fullname} (${member.role}) - Team: ${member.teamName}`);
					}
				} else {
					skippedCount++;
					console.log(`[push] ⊘ No token for ${member.fullname} (${member.role}) - Team: ${member.teamName}`);
				}
			}

			console.log(`[push] Sent incident alert to ${sentCount} on-call members, ${skippedCount} skipped (no token)`);
		} catch (error) {
			console.error('[push] Error sending incident alerts:', error);
		}
	}

	// ✅ Send reminder notification (called by ReminderService)
	async sendReminderNotification(
		incident: Incident,
		members: any[],
		reminderNumber: number,
		totalReminders: number
	): Promise<{ sent: number; skipped: number }> {
		try {
			console.log(`[push] Sending reminder #${reminderNumber}/${totalReminders} for incident:`, incident.id);

			const message = this.createReminderMessage(incident, reminderNumber, totalReminders);
			let sentCount = 0;
			let skippedCount = 0;

			for (const member of members) {
				if (!member.pushToken) {
					skippedCount++;
					continue;
				}

				// ✅ Add role to message for personalization
				const personalizedMessage = {
					...message,
					title: `[${member.role?.toUpperCase() || 'TEAM'}] ⏰ REMINDER #${reminderNumber}/${totalReminders}: ${incident.severity.toUpperCase()} - ${incident.title}`,
					data: {
						...message.data,
						role: member.role
					}
				};

				const success = await this.sendPushNotification(member.pushToken, personalizedMessage);
				if (success) {
					sentCount++;
					await this.logDelivery(
						incident.id,
						'reminder',
						member.pushToken,
						member.fcmToken
					);
					console.log(`[push] ✓ Reminder sent to ${member.fullname} (${member.role})`);
				}
			}

			console.log(`[push] Reminder #${reminderNumber}: ${sentCount} sent, ${skippedCount} skipped`);
			return { sent: sentCount, skipped: skippedCount };
		} catch (error) {
			console.error('[push] Error sending reminder notifications:', error);
			return { sent: 0, skipped: 0 };
		}
	}

	// ✅ Send escalation notification (called by ReminderService)
	async sendEscalationNotification(
		incident: Incident,
		members: any[]
	): Promise<{ sent: number; skipped: number }> {
		try {
			console.log(`[push] Sending escalation notification for incident:`, incident.id);

			const message = this.createEscalationMessage(incident);
			let sentCount = 0;
			let skippedCount = 0;

			for (const member of members) {
				if (!member.pushToken) {
					skippedCount++;
					continue;
				}

				const success = await this.sendPushNotification(member.pushToken, message);
				if (success) {
					sentCount++;
					await this.logDelivery(
						incident.id,
						'escalation',
						member.pushToken,
						member.fcmToken
					);
					console.log(`[push] ✓ Escalation sent to ${member.fullname}`);
				}
			}

			console.log(`[push] Escalation: ${sentCount} sent, ${skippedCount} skipped`);
			return { sent: sentCount, skipped: skippedCount };
		} catch (error) {
			console.error('[push] Error sending escalation notifications:', error);
			return { sent: 0, skipped: 0 };
		}
	}

	// EMERGENCY OVERRIDE
	async sendEmergencyOverrideAlert(incident: Incident, userEmails: string[]): Promise<void> {
		try {
			if (!userEmails || userEmails.length === 0) {
				console.log('[push] No users specified for emergency override');
				return;
			}

			// Get users with their push tokens using the existing service method
			const usersWithTokens = await this.oncallService.usersForEmergencyOverride(userEmails);

			if (!usersWithTokens || usersWithTokens.length === 0) {
				console.log('[push] No users found for emergency override');
				return;
			}

			const message = this.createNotificationMessage(incident, 'incident_alert');
			let sentCount = 0;
			let skippedCount = 0;

			// Send to each selected user
			for (const user of usersWithTokens) {
				if (user.pushToken) {
					const success = await this.sendPushNotification(user.pushToken, message);
					if (success) {
						sentCount++;
						await this.logDelivery(
							incident.id,
							'alert',
							user.pushToken,
							user.fcmToken
						);
						console.log(`[push] ✓ EMERGENCY: Sent to ${user.fullname}`);
					} else {
						console.error(`[push] ✗ EMERGENCY: Failed to send to ${user.fullname}`);
					}
				} else {
					skippedCount++;
					console.log(`[push] ⊘ EMERGENCY: No token for ${user.fullname}`);
				}
			}

			console.log(`[push] Emergency override: ${sentCount} notified, ${skippedCount} skipped (no token)`);
		} catch (error) {
			console.error('[push] Error sending emergency override alerts:', error);
		}
	}

	async sendAllClear(incidentId: string): Promise<{
		notifiedCount: number;
		users: Array<{ name: string; email: string }>;
	}> {
		if (!this.dbService.db) {
			return { notifiedCount: 0, users: [] };
		}

		// 1) Fetch the incident (title/body context)
		const incidentRow = await this.dbService.db
			.prepare('SELECT * FROM incidents WHERE id = ?')
			.bind(incidentId)
			.first();
		if (!incidentRow) {
			console.warn('[push] [all_clear] incident not found:', incidentId);
			return { notifiedCount: 0, users: [] };
		}

		// 2) Find everyone who previously received 'alert' for this incident
		const { results } = await this.dbService.db
			.prepare(`
				SELECT DISTINCT
					n.token,
					n.fcm_token,
					u.name,
					u.email
				FROM incident_notifications n
				LEFT JOIN users u ON n.token = u.expo_token OR n.fcm_token = u.fcm_token
				WHERE n.incident_id = ? AND n.kind = 'alert'
			`)
			.bind(incidentId)
			.all();

		const recipients = (results as any[]) || [];
		if (recipients.length === 0) {
			console.log('[push] [all_clear] no prior recipients to notify for', incidentId);
			return { notifiedCount: 0, users: [] };
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
			priority: 'normal',
			sound: 'default',
			channelId: 'default-v4',
		};

		// 4) Send, then log as 'all_clear'
		let sent = 0;
		const notifiedUsers: Array<{ name: string; email: string }> = [];

		for (const r of recipients) {
			const tokenUsed = r.fcm_token || r.token;
			if (!tokenUsed) continue;

			const ok = await this.sendPushNotification(tokenUsed, message);
			if (ok) {
				sent++;

				if (r.name && r.email) {
					notifiedUsers.push({
						name: r.name,
						email: r.email
					});
				}

				await this.logDelivery(
					incidentId,
					'all_clear',
					tokenUsed.startsWith('ExponentPushToken') ? tokenUsed : undefined,
					tokenUsed.startsWith('ExponentPushToken') ? undefined : tokenUsed
				);
			}
		}

		console.log(`[push] [all_clear] sent to ${sent}/${recipients.length} recipients`, { incidentId });

		return {
			notifiedCount: sent,
			users: notifiedUsers
		};
	}

	// ✅ Create initial incident notification message
	private createNotificationMessage(incident: Incident, type: string): Omit<PushMessage, 'to'> {
		const severityConfig = {
			critical: {
				channelId: 'critical-alerts-v4',
				sound: 'alarm_sound.mp3',
				priority: 'high' as const,
			},
			high: {
				channelId: 'high-priority-v4',
				sound: 'alarm_sound.mp3',
				priority: 'high' as const,
			},
			medium: {
				channelId: 'medium-priority-v4',
				sound: 'alarm_sound.mp3',
				priority: 'normal' as const,
			},
			low: {
				channelId: 'default-v4',
				sound: 'alarm_sound.mp3',
				priority: 'normal' as const,
			},
		};

		const severity = (incident.severity || 'low') as keyof typeof severityConfig;
		const config = severityConfig[severity] || severityConfig.low;

		return {
			title: `${(incident.severity || 'low').toUpperCase()}: ${incident.title}`,
			body: incident.description,
			data: {
				incidentId: incident.id,
				severity: incident.severity || 'low',
				status: incident.status,
				type: type,
				awsConsoleUrl: incident.aws_console_url,
			},
			priority: config.priority,
			sound: config.sound,
			channelId: config.channelId,
			categoryId: 'incident-actions',
		};
	}

	// ✅ Create reminder notification message
	private createReminderMessage(incident: Incident, reminderNumber: number, totalReminders: number): Omit<PushMessage, 'to'> {
		const severityConfig = {
			critical: { channelId: 'critical-alerts-v4', sound: 'alarm_sound.mp3', priority: 'high' as const },
			high: { channelId: 'high-priority-v4', sound: 'alarm_sound.mp3', priority: 'high' as const },
			medium: { channelId: 'medium-priority-v4', sound: 'alarm_sound.mp3', priority: 'normal' as const },
			low: { channelId: 'default-v4', sound: 'alarm_sound.mp3', priority: 'normal' as const },
		};

		const severity = (incident.severity || 'low') as keyof typeof severityConfig;
		const config = severityConfig[severity] || severityConfig.low;

		return {
			title: `⏰ REMINDER #${reminderNumber}/${totalReminders}: ${incident.severity.toUpperCase()} - ${incident.title}`,
			body: `This incident still requires attention. ${incident.description}`,
			data: {
				incidentId: incident.id,
				severity: incident.severity || 'low',
				type: 'auto_reminder',
				reminderNumber: reminderNumber,
				totalReminders: totalReminders,
			},
			priority: config.priority,
			sound: config.sound,
			channelId: config.channelId,
			categoryId: 'incident-actions',
		};
	}

	// ✅ Create escalation notification message
	private createEscalationMessage(incident: Incident): Omit<PushMessage, 'to'> {
		const severityConfig = {
			critical: { channelId: 'critical-alerts-v4', sound: 'alarm_sound.mp3', priority: 'high' as const },
			high: { channelId: 'high-priority-v4', sound: 'alarm_sound.mp3', priority: 'high' as const },
			medium: { channelId: 'medium-priority-v4', sound: 'alarm_sound.mp3', priority: 'normal' as const },
			low: { channelId: 'default-v4', sound: 'alarm_sound.mp3', priority: 'normal' as const },
		};

		const severity = (incident.severity || 'low') as keyof typeof severityConfig;
		const config = severityConfig[severity] || severityConfig.low;

		return {
			title: `[ESCALATION] 🚨 ESCALATED: ${incident.severity.toUpperCase()} - ${incident.title}`,
			body: `This incident has been escalated to you after no response. ${incident.description}`,
			data: {
				incidentId: incident.id,
				severity: incident.severity || 'low',
				type: 'escalation',
				role: 'escalation'
			},
			priority: 'high',
			sound: config.sound,
			channelId: config.channelId,
			categoryId: 'incident-actions',
		};
	}

	private async sendPushNotification(token: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		try {
			if (token.startsWith('ExponentPushToken')) {
				return await this.sendExpoNotification(token, message);
			} else {
				return await this.sendFCMNotification(token, message);
			}
		} catch (error) {
			console.error('[push] Error sending push notification:', error);
			return false;
		}
	}

	private async sendExpoNotification(token: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		try {
			const payload: PushMessage = {
				to: token,
				...message,
				sound: 'default',
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
				console.error('[push] Expo push notification failed:', response.status, await response.text());
				return false;
			}

			const result = await response.json();
			console.log('[push] Expo push notification sent:', result);
			return true;
		} catch (error) {
			console.error('[push] Error sending Expo notification:', error);
			return false;
		}
	}

	private async sendFCMNotification(fcmToken: string, message: Omit<PushMessage, 'to'>): Promise<boolean> {
		try {
			const accessToken = await this.getFirebaseAccessToken();

			if (!accessToken) {
				console.error('[push] Failed to get Firebase access token');
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
						},
						priority: message.priority === 'high' ? 'high' : 'normal',
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
				console.error('[push] FCM v1 notification failed:', response.status, await response.text());
				return false;
			}

			const result = await response.json();
			console.log('[push] FCM v1 notification sent:', result);
			return true;
		} catch (error) {
			console.error('[push] Error sending FCM v1 notification:', error);
			return false;
		}
	}

	private async getFirebaseAccessToken(): Promise<string | null> {
		try {
			if (!this.env.FIREBASE_PROJECT_ID || !this.env.FIREBASE_CLIENT_EMAIL || !this.env.FIREBASE_PRIVATE_KEY) {
				console.log('[push] Firebase credentials not configured, skipping FCM');
				return null;
			}

			const serviceAccount = {
				type: "service_account",
				project_id: this.env.FIREBASE_PROJECT_ID,
				client_email: this.env.FIREBASE_CLIENT_EMAIL,
				private_key: this.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
			};

			const jwt = await this.createJWT(serviceAccount);

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
				console.error('[push] Failed to get Firebase access token:', error);
				return null;
			}

			const data = await response.json() as { access_token?: string };
			return data.access_token || null;
		} catch (error) {
			console.error('[push] Error getting Firebase access token:', error);
			return null;
		}
	}

	private async createJWT(serviceAccount: any): Promise<string> {
		const header = { alg: 'RS256', typ: 'JWT' };
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			iss: serviceAccount.client_email,
			scope: 'https://www.googleapis.com/auth/firebase.messaging',
			aud: 'https://oauth2.googleapis.com/token',
			exp: now + 3600,
			iat: now
		};

		const encodedHeader = this.base64URLEncode(JSON.stringify(header));
		const encodedPayload = this.base64URLEncode(JSON.stringify(payload));
		const signingInput = `${encodedHeader}.${encodedPayload}`;

		const privateKey = await this.importPrivateKey(serviceAccount.private_key);
		const signature = await crypto.subtle.sign(
			'RSASSA-PKCS1-v1_5',
			privateKey,
			new TextEncoder().encode(signingInput)
		);

		const encodedSignature = this.base64URLEncode(signature);
		return `${signingInput}.${encodedSignature}`;
	}

	private async importPrivateKey(privateKeyPem: string): Promise<CryptoKey> {
		const pemContents = privateKeyPem
			.replace('-----BEGIN PRIVATE KEY-----', '')
			.replace('-----END PRIVATE KEY-----', '')
			.replace(/\s/g, '');

		const binaryString = atob(pemContents);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		return await crypto.subtle.importKey(
			'pkcs8',
			bytes.buffer,
			{ name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
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

		return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
	}

	// ✅ Register push token with user settings (includes reminderConfig)
	async registerPushToken(userId: string, token: string, deviceType?: string, fcmToken?: string, settings?: any) {
		const deviceId = `device-${token.slice(-8)}-${Date.now()}`;

		try {
			if (!this.dbService.db) {
				throw new Error("Database connection not available");
			}

			console.log(`[push-token] 🔄 Starting registration for user: ${userId}`);

			// ✅ STEP 1: Find all existing tokens for this user
			const existingAssociations = await this.dbService.db.prepare(`
            SELECT push_token_id FROM push_token_user_assoc WHERE user_id = ?
        `).bind(userId).all();

			const tokenIdsToDelete = existingAssociations.results?.map((row: any) => row.push_token_id) || [];

			// ✅ STEP 2: Delete all associations for this user
			if (tokenIdsToDelete.length > 0) {
				console.log(`[push-token] 🗑️ Removing ${tokenIdsToDelete.length} existing associations`);

				await this.dbService.db.prepare(`
                DELETE FROM push_token_user_assoc WHERE user_id = ?
            `).bind(userId).run();

				// ✅ STEP 3: Delete all old tokens
				for (const tokenId of tokenIdsToDelete) {
					try {
						await this.dbService.db.prepare(`
                        DELETE FROM push_tokens WHERE id = ?
                    `).bind(tokenId).run();
						console.log(`[push-token] 🗑️ Deleted token: ${tokenId}`);
					} catch (error) {
						console.warn(`[push-token] ⚠️ Failed to delete token ${tokenId}:`, error);
					}
				}

				console.log(`[push-token] ✅ Cleaned up ${tokenIdsToDelete.length} old tokens`);
			} else {
				console.log(`[push-token] ℹ️ No existing tokens found for user`);
			}

			// ✅ STEP 4: Also delete any token that matches this exact token value (safety cleanup)
			// This handles edge cases where the same token might exist for other users
			try {
				const duplicateTokens = await this.dbService.db.prepare(`
                SELECT id FROM push_tokens WHERE token = ?
            `).bind(token).all();

				if (duplicateTokens.results && duplicateTokens.results.length > 0) {
					console.log(`[push-token] 🗑️ Found ${duplicateTokens.results.length} duplicate tokens with same value`);

					for (const row of duplicateTokens.results) {
						const tokenId = (row as any).id;

						// Delete associations first
						await this.dbService.db.prepare(`
                        DELETE FROM push_token_user_assoc WHERE push_token_id = ?
                    `).bind(tokenId).run();

						// Then delete the token
						await this.dbService.db.prepare(`
                        DELETE FROM push_tokens WHERE id = ?
                    `).bind(tokenId).run();

						console.log(`[push-token] 🗑️ Removed duplicate token: ${tokenId}`);
					}
				}
			} catch (error) {
				console.warn(`[push-token] ⚠️ Error cleaning duplicate tokens:`, error);
				// Continue anyway - this is just safety cleanup
			}

			// ✅ STEP 5: Prepare settings with reminder config
			const settingsJson = JSON.stringify(settings || {
				enableAlerts: true,
				reminderConfig: {
					enabled: true,
					maxReminders: 3,
					intervalSeconds: 10
				}
			});

			// ✅ STEP 6: Insert new push token
			console.log(`[push-token] ➕ Creating new token: ${deviceId}`);

			const tokenQuery = `
            INSERT INTO push_tokens
            (id, token, fcm_token, device_type, settings, is_active, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;

			await this.dbService.db.prepare(tokenQuery).bind(
				deviceId,
				token,
				fcmToken || null,
				deviceType,
				settingsJson,
				1
			).run();

			console.log(`[push-token] ✅ Token created successfully`);

			// ✅ STEP 7: Create new association between user and token
			const assocQuery = `
            INSERT INTO push_token_user_assoc
            (push_token_id, user_id, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
        `;

			await this.dbService.db.prepare(assocQuery).bind(
				deviceId,
				userId
			).run();

			console.log(`[push-token] ✅ Association created successfully`);

			// ✅ STEP 8: Verify registration
			const verifyQuery = await this.dbService.db.prepare(`
            SELECT COUNT(*) as count
            FROM push_token_user_assoc
            WHERE user_id = ?
        `).bind(userId).first();

			const activeTokenCount = (verifyQuery as any)?.count || 0;

			console.log(`[push-token] ✅ Registration complete for user: ${userId}`);
			console.log(`[push-token] 📱 Device: ${deviceId}`);
			console.log(`[push-token] 📲 Type: ${deviceType || 'unknown'}`);
			console.log(`[push-token] 🔔 FCM: ${!!fcmToken ? 'Yes' : 'No'}`);
			console.log(`[push-token] 🎯 Active tokens for this user: ${activeTokenCount}`);

			// Log reminder config if present
			if (settings?.reminderConfig) {
				console.log(`[push-token] ⏰ Reminders: ${settings.reminderConfig.maxReminders}x every ${settings.reminderConfig.intervalSeconds}s (${settings.reminderConfig.enabled ? 'enabled' : 'disabled'})`);
			}

			return {
				success: true,
				deviceId,
				userId,
				activeTokens: activeTokenCount,
				message: 'Device registered successfully. All previous devices have been logged out.'
			};
		} catch (error) {
			console.error("[push-token] ❌ Error registering push token:", error);
			console.error("[push-token] ❌ User:", userId);
			console.error("[push-token] ❌ Token (last 8):", token.slice(-8));
			throw error;
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
