// services/reminder.service.ts - CLEANED VERSION

import { Env, Incident } from '../types';
import { DatabaseService } from './database.service';
import { PushNotificationService } from './push-notification.service';
import { OnCallService } from './oncall.service';
import { EmailService } from './email.service';

export class ReminderService {
	private env: Env;
	private dbService: DatabaseService;
	private pushService: PushNotificationService;
	private oncallService: OnCallService;
	private emailService: EmailService;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
		this.pushService = new PushNotificationService(env);
		this.oncallService = new OnCallService(env);
		this.emailService = new EmailService(env);
	}

	// ✅ Schedule reminders for an incident
	async scheduleReminders(incidentId: string, config: {
		maxReminders: number;
		intervalSeconds: number;
	}) {
		try {
			if (config.maxReminders === 0) {
				console.log(`[reminder] ⚡ maxReminders=0 - will escalate immediately without reminders`);
			} else {
				console.log(`[reminder] Scheduling ${config.maxReminders} reminders for incident:`, incidentId);
			}

			await this.dbService.db?.prepare(`
                INSERT OR REPLACE INTO incident_reminder_config
                    (incident_id, max_reminders, interval_seconds, created_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            `).bind(incidentId, config.maxReminders, config.intervalSeconds).run();

			console.log(`[reminder] ✅ Reminder schedule saved for incident:`, incidentId);
		} catch (error) {
			console.error('[reminder] Error scheduling reminders:', error);
		}
	}

	// ✅ Check and send due reminders (called by cron job)
	async processDueReminders() {
		try {
			console.log('[reminder] 🔍 Checking for due reminders...');

			// Get all open incidents with reminder config
			const incidents = await this.dbService.db?.prepare(`
                SELECT
                    i.id, i.title, i.description, i.severity, i.team_id,
                    i.created_at, i.status, i.escalation_level,
                    rc.max_reminders, rc.interval_seconds,
                    COUNT(r.id) as reminders_sent
                FROM incidents i
                JOIN incident_reminder_config rc ON i.id = rc.incident_id
                LEFT JOIN incident_reminders r ON i.id = r.incident_id
                WHERE i.status = 'open'
                GROUP BY i.id, i.title, i.description, i.severity, i.team_id,
                         i.created_at, i.status, i.escalation_level,
                         rc.max_reminders, rc.interval_seconds
            `).all();

			if (!incidents || !incidents.results || incidents.results.length === 0) {
				console.log('[reminder] No open incidents with reminder config');
				return;
			}

			console.log(`[reminder] Found ${incidents.results.length} open incident(s)`);

			for (const row of incidents.results as any[]) {
				const incident = row;

				// Check for team_id
				if (!incident.team_id) {
					console.error(`[reminder] ❌ No team_id for incident ${incident.id}`);
					continue;
				}

				const remindersSent = parseInt(incident.reminders_sent) || 0;
				const maxReminders = incident.max_reminders || 3;
				const intervalSeconds = incident.interval_seconds || 10;
				const escalationLevel = incident.escalation_level || 0;

				console.log(`[reminder] Processing ${incident.id}: Level ${escalationLevel}, ${remindersSent}/${maxReminders} reminders`);

				// ✅ Handle maxReminders = 0 (immediate escalation)
				if (maxReminders === 0) {
					console.log(`[reminder] ⚡ maxReminders=0 detected - immediate escalation without reminders`);

					const shouldEsc = await this.shouldEscalate(incident.id);
					if (shouldEsc) {
						await this.triggerEscalation(incident);

						// Mark as processed
						await this.dbService.db?.prepare(`
                            INSERT OR IGNORE INTO incident_reminders
                            (id, incident_id, reminder_number, sent_at, recipients_count)
                            VALUES (?, ?, 0, CURRENT_TIMESTAMP, 0)
                        `).bind(crypto.randomUUID(), incident.id).run();
					}
					continue;
				}

				// Check if we've exceeded max reminders
				if (remindersSent >= maxReminders) {
					console.log(`[reminder] Max reminders reached for incident: ${incident.id}`);

					// Check if we should escalate to next level
					const shouldEsc = await this.shouldEscalate(incident.id);
					if (shouldEsc) {
						await this.triggerEscalation(incident);

						// Reset reminder counter after escalation
						await this.dbService.db?.prepare(`
                            DELETE FROM incident_reminders WHERE incident_id = ?
                        `).bind(incident.id).run();

						console.log(`[reminder] ✅ Escalated and reset reminder counter`);
					}
					continue;
				}

				// Check if it's time for the next reminder
				const lastReminder = await this.getLastReminder(incident.id);
				const nextReminderNumber = remindersSent + 1;

				if (this.isReminderDue(incident.created_at, lastReminder, intervalSeconds, nextReminderNumber)) {
					console.log(`[reminder] Sending reminder #${nextReminderNumber}/${maxReminders} for incident: ${incident.id}`);
					await this.sendReminder(incident, nextReminderNumber, maxReminders);
				} else {
					const timeUntilDue = this.getTimeUntilDue(incident.created_at, lastReminder, intervalSeconds);
					console.log(`[reminder] Incident ${incident.id}: Next reminder in ${Math.ceil(timeUntilDue / 1000)}s`);
				}
			}

			console.log('[reminder] ✅ Finished processing reminders');
		} catch (error) {
			console.error('[reminder] Error processing due reminders:', error);
		}
	}

	// ✅ SINGLE escalation method - handles level-based escalation
	private async triggerEscalation(incident: any) {
		try {
			console.log('[reminder] 🚨 Triggering escalation for incident:', incident.id);

			if (!incident.team_id) {
				console.error('[reminder] ❌ No team_id for incident:', incident.id);
				return;
			}

			// Get current escalation level
			const currentLevel = incident.escalation_level || 0;
			const nextLevel = currentLevel + 1;

			console.log(`[reminder] Current escalation level: ${currentLevel}, escalating to level: ${nextLevel}`);

			// Determine who to notify based on next level
			let usersToNotify: any[] = [];
			let roleName = '';

			if (nextLevel === 1) {
				// Escalate to BACKUP
				roleName = 'BACKUP';
				const response = await this.oncallService.getCurrentOnCallByTeamId(incident.team_id);
				usersToNotify = response?.backup || [];
			} else if (nextLevel === 2) {
				// Escalate to ESCALATION (final level)
				roleName = 'ESCALATION';
				const response = await this.oncallService.getCurrentOnCallByTeamId(incident.team_id);
				usersToNotify = response?.escalation || [];
			} else {
				console.log('[reminder] ⚠️ Max escalation level reached (level 2)');
				return;
			}

			if (usersToNotify.length === 0) {
				console.error(`[reminder] ❌ No ${roleName} members found for team:`, incident.team_id);
				return;
			}

			console.log(`[reminder] 📢 Escalating to ${roleName}: ${usersToNotify.length} members`);

			// Record escalation in database
			await this.recordEscalation(incident.id, incident.team_id, nextLevel, usersToNotify);

			// Update incident escalation_level
			await this.dbService.db?.prepare(`
                UPDATE incidents
                SET escalation_level = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).bind(nextLevel, incident.id).run();

			// Send notifications
			await this.sendEscalationNotifications(incident, usersToNotify, roleName);

			console.log(`[reminder] ✅ Escalation complete - Level ${nextLevel} (${roleName}) notified`);

		} catch (error) {
			console.error('[reminder] Error triggering escalation:', error);
		}
	}

	// ✅ Send reminder notification
	private async sendReminder(incident: any, reminderNumber: number, totalReminders: number) {
		try {
			console.log(`[reminder] Sending reminder #${reminderNumber}/${totalReminders} for incident:`, incident.id);

			const escalationLevel = incident.escalation_level || 0;

			// Get on-call members for this team
			const onCallResponse = await this.oncallService.getCurrentOnCallByTeamId(incident.team_id);

			if (!onCallResponse) {
				console.log('[reminder] No on-call members found');
				return;
			}

			const { primary = [], backup = [], escalation = [] } = onCallResponse;

			// ✅ Send reminders ONLY to the current escalation level
			let membersToRemind: any[] = [];
			let roleName = '';

			if (escalationLevel === 0) {
				membersToRemind = primary;
				roleName = 'PRIMARY';
			} else if (escalationLevel === 1) {
				membersToRemind = backup;
				roleName = 'BACKUP';
			} else if (escalationLevel === 2) {
				membersToRemind = escalation;
				roleName = 'ESCALATION';
			}

			console.log(`[reminder] Sending to ${roleName} (${membersToRemind.length} members) at escalation level ${escalationLevel}`);

			if (membersToRemind.length === 0) {
				console.log('[reminder] No members to remind at current level');
				return;
			}

			// Send emails with rate limiting
			const uniqueEmails = new Set<string>();

			for (const member of membersToRemind) {
				if (!uniqueEmails.has(member.email)) {
					uniqueEmails.add(member.email);
					try {
						await this.emailService.sendReminderEmail({
							to: member.email,
							incidentId: incident.id,
							title: incident.title,
							description: incident.description,
							severity: incident.severity,
							reminderNumber,
							totalReminders,
							role: member.role
						});
						console.log(`[reminder] ✅ Email sent to: ${member.email} (${roleName})`);

						// Wait 600ms between emails
						await new Promise(resolve => setTimeout(resolve, 600));

					} catch (error) {
						console.error(`[reminder] ❌ Email failed for ${member.email}:`, error);
					}
				}
			}

			// Send push notifications
			const pushResult = await this.pushService.sendReminderNotification(
				{
					id: incident.id,
					title: incident.title,
					description: incident.description,
					severity: incident.severity,
					status: 'open'
				} as Incident,
				membersToRemind,
				reminderNumber,
				totalReminders
			);

			// Record reminder sent
			await this.dbService.db?.prepare(`
                INSERT INTO incident_reminders
                (id, incident_id, reminder_number, sent_at, recipients_count)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
            `).bind(
				crypto.randomUUID(),
				incident.id,
				reminderNumber,
				pushResult.sent
			).run();

			console.log(`[reminder] ✅ Reminder #${reminderNumber} sent to ${pushResult.sent} ${roleName} recipients`);

			if (reminderNumber === totalReminders) {
				console.log(`[reminder] 🏁 Final reminder sent for incident ${incident.id}`);
			}

		} catch (error) {
			console.error('[reminder] Error sending reminder:', error);
		}
	}

	// ✅ Record escalation in database
	private async recordEscalation(
		incidentId: string,
		teamId: string,
		escalationLevel: number,
		users: any[]
	) {
		try {
			for (const user of users) {
				await this.dbService.db?.prepare(`
                    INSERT INTO incident_escalations
                    (id, incident_id, team_id, escalated_to_user_id, escalation_level,
                     reason, priority, status, triggered_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                `).bind(
					crypto.randomUUID(),
					incidentId,
					teamId,
					user.userId,
					escalationLevel,
					`Auto-escalation: No response after reminders (Level ${escalationLevel})`,
					'high',
					'pending'
				).run();
			}

			console.log(`[reminder] ✅ Recorded ${users.length} escalation(s) at level ${escalationLevel}`);
		} catch (error) {
			console.error('[reminder] Error recording escalation:', error);
		}
	}

	// ✅ Send escalation notifications
	private async sendEscalationNotifications(incident: any, escalatedUsers: any[], roleName: string) {
		try {
			console.log(`[reminder] Sending escalation notifications to ${escalatedUsers.length} ${roleName} users`);

			const uniqueEmails = new Set<string>();

			for (const user of escalatedUsers) {
				if (user.email && !uniqueEmails.has(user.email)) {
					uniqueEmails.add(user.email);

					try {
						await this.emailService.sendEscalationEmail({
							to: user.email,
							incidentId: incident.id,
							title: incident.title,
							description: incident.description,
							severity: incident.severity,
							escalatedFrom: (incident.escalation_level || 0),
							escalatedTo: (incident.escalation_level || 0) + 1,
							reason: 'No response after all reminders'
						});
						console.log(`[reminder] ✅ Escalation email sent to: ${user.email}`);

						// Wait 600ms between emails
						await new Promise(resolve => setTimeout(resolve, 600));

					} catch (emailError) {
						console.error(`[reminder] ❌ Escalation email failed for ${user.email}:`, emailError);
					}
				}
			}

			// Send push notifications
			const pushResult = await this.pushService.sendEscalationNotification(
				{
					id: incident.id,
					title: incident.title,
					description: incident.description,
					severity: incident.severity,
					status: 'open'
				} as Incident,
				escalatedUsers
			);

			console.log(`[reminder] ✅ Escalation notifications sent: ${pushResult.sent}/${escalatedUsers.length}`);
		} catch (error) {
			console.error('[reminder] Error sending escalation notifications:', error);
		}
	}

	// ✅ Check if escalation should happen
	private async shouldEscalate(incidentId: string): Promise<boolean> {
		try {
			const incident = await this.dbService.db?.prepare(`
                SELECT status, escalation_level FROM incidents WHERE id = ?
            `).bind(incidentId).first();

			if (!incident) return false;

			const status = (incident as any).status;
			const currentLevel = (incident as any).escalation_level || 0;

			// Don't escalate if resolved or investigating
			if (status === 'resolved' || status === 'investigating') {
				console.log(`[reminder] ⏭️ Not escalating - incident is ${status}`);
				return false;
			}

			// Don't escalate beyond level 2
			if (currentLevel >= 2) {
				console.log('[reminder] ⏭️ Not escalating - max level reached');
				return false;
			}

			return true;
		} catch (error) {
			console.error('[reminder] Error checking shouldEscalate:', error);
			return false;
		}
	}

	// ===== HELPER METHODS =====

	private isReminderDue(
		incidentCreatedAt: string,
		lastReminder: any | null,
		intervalSeconds: number,
		nextReminderNumber: number
	): boolean {
		const now = Date.now();
		const intervalMs = intervalSeconds * 1000;

		if (!lastReminder) {
			const incidentTime = new Date(incidentCreatedAt).getTime();
			const timeSinceCreation = now - incidentTime;
			return timeSinceCreation >= intervalMs;
		} else {
			const lastReminderTime = new Date(lastReminder.sent_at).getTime();
			const timeSinceLastReminder = now - lastReminderTime;
			return timeSinceLastReminder >= intervalMs;
		}
	}

	private getTimeUntilDue(
		incidentCreatedAt: string,
		lastReminder: any | null,
		intervalSeconds: number
	): number {
		const now = Date.now();
		const intervalMs = intervalSeconds * 1000;

		if (!lastReminder) {
			const incidentTime = new Date(incidentCreatedAt).getTime();
			return intervalMs - (now - incidentTime);
		} else {
			const lastReminderTime = new Date(lastReminder.sent_at).getTime();
			return intervalMs - (now - lastReminderTime);
		}
	}

	private async getLastReminder(incidentId: string) {
		const result = await this.dbService.db?.prepare(`
            SELECT * FROM incident_reminders
            WHERE incident_id = ?
            ORDER BY sent_at DESC
            LIMIT 1
        `).bind(incidentId).first();

		return result || null;
	}
}
