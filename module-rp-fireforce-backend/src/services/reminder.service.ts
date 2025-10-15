// services/reminder.service.ts
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
			console.log(`[reminder] Scheduling ${config.maxReminders} reminders for incident:`, incidentId);

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
					i.id, i.title, i.description, i.severity, i.team_id, i.created_at,
					rc.max_reminders, rc.interval_seconds,
					COUNT(r.id) as reminders_sent
				FROM incidents i
						 JOIN incident_reminder_config rc ON i.id = rc.incident_id
						 LEFT JOIN incident_reminders r ON i.id = r.incident_id
				WHERE i.status = 'open'
				GROUP BY i.id, i.title, i.description, i.severity, i.team_id, i.created_at, rc.max_reminders, rc.interval_seconds
			`).all();

			if (!incidents || !incidents.results || incidents.results.length === 0) {
				console.log('[reminder] No open incidents with reminder config');
				return;
			}

			console.log(`[reminder] Found ${incidents.results.length} open incident(s) with reminders configured`);

			for (const row of incidents.results as any[]) {
				const incident = row;
				const remindersSent = parseInt(incident.reminders_sent) || 0;
				const maxReminders = incident.max_reminders || 3;
				const intervalSeconds = incident.interval_seconds || 10;

				// Check if we've exceeded max reminders
				if (remindersSent >= maxReminders) {
					console.log(`[reminder] Incident ${incident.id}: Max reminders (${maxReminders}) reached`);

					// Check if we need to escalate
					const shouldEsc = await this.shouldEscalate(incident.id);
					if (shouldEsc) {
						console.log(`[reminder] Triggering escalation for incident: ${incident.id}`);
						await this.triggerEscalation(incident);
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
		} catch (error) {
			console.error('[reminder] Error processing due reminders:', error);
		}
	}

	// ✅ Check if reminder is due
	private isReminderDue(
		incidentCreatedAt: string,
		lastReminder: any | null,
		intervalSeconds: number,
		nextReminderNumber: number
	): boolean {
		const now = Date.now();
		const intervalMs = intervalSeconds * 1000;

		if (!lastReminder) {
			// First reminder: check time since incident creation
			const incidentTime = new Date(incidentCreatedAt).getTime();
			const timeSinceCreation = now - incidentTime;
			return timeSinceCreation >= intervalMs;
		} else {
			// Subsequent reminders: check time since last reminder
			const lastReminderTime = new Date(lastReminder.sent_at).getTime();
			const timeSinceLastReminder = now - lastReminderTime;
			return timeSinceLastReminder >= intervalMs;
		}
	}

	// ✅ Get time until next reminder is due
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

	// ✅ Get last reminder sent
	private async getLastReminder(incidentId: string) {
		const result = await this.dbService.db?.prepare(`
            SELECT * FROM incident_reminders
            WHERE incident_id = ?
            ORDER BY sent_at DESC
            LIMIT 1
        `).bind(incidentId).first();

		return result || null;
	}

	// ✅ Send reminder notification
	private async sendReminder(incident: any, reminderNumber: number, totalReminders: number) {
		try {
			console.log(`[reminder] Sending reminder #${reminderNumber}/${totalReminders} for incident:`, incident.id);

			// Get on-call members
			const onCallResponse = await this.oncallService.getAllCurrentOnCall(incident.team_id);

			if (!onCallResponse) {
				console.log('[reminder] No on-call members found');
				return;
			}

			const { primary = [], backup = [], escalation = [] } = onCallResponse;
			const allMembers = [...primary, ...backup, ...escalation];

			if (allMembers.length === 0) {
				console.log('[reminder] No members to notify');
				return;
			}

			// Send push notifications with reminder indicator
			const uniqueEmails = new Set<string>();

			for (const member of allMembers) {
				// Send email once per unique email
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
							totalReminders
						});
						console.log(`[reminder] Email sent to: ${member.email}`);
					} catch (error) {
						console.error(`[reminder] Email failed for ${member.email}:`, error);
					}
				}
			}

			// Send push notifications using PushNotificationService
			const pushResult = await this.pushService.sendReminderNotification(
				{
					id: incident.id,
					title: incident.title,
					description: incident.description,
					severity: incident.severity,
					status: 'open'
				} as Incident,
				allMembers,
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

			console.log(`[reminder] ✅ Reminder #${reminderNumber} sent to ${pushResult.sent} recipients`);

			// If final reminder, mark for escalation check
			if (reminderNumber === totalReminders) {
				console.log(`[reminder] 🏁 Final reminder sent for incident ${incident.id}`);
			}

		} catch (error) {
			console.error('[reminder] Error sending reminder:', error);
		}
	}

	// ✅ Check if escalation should be triggered
	private async shouldEscalate(incidentId: string): Promise<boolean> {
		const escalation = await this.dbService.db?.prepare(`
			SELECT * FROM incident_escalations
			WHERE incident_id = ?
			  AND status != 'resolved'
		`).bind(incidentId).first();

		return !escalation; // Escalate if not already escalated
	}

	// ✅ Trigger escalation
	private async triggerEscalation(incident: any) {
		try {
			console.log('[reminder] 🚨 Triggering escalation for incident:', incident.id);

			const teamId = incident.team_id || 'team-1';

			// Use existing escalation logic
			const escalationResult = await this.oncallService.escalateIncident({
				teamId: teamId,
				incidentId: incident.id,
				reason: 'Auto-escalation: No response after all reminders',
				priority: incident.severity,
				currentLevel: 0
			});

			if (escalationResult && escalationResult.success !== false) {
				console.log('[reminder] ✅ Escalation successful');

				const escalatedUsers = escalationResult.object?.notifiedUsers ||
				escalationResult.notifiedUsers ||
				escalationResult.escalatedTo ? [escalationResult.escalatedTo] : [];

				if (escalatedUsers.length > 0) {
					// Send escalation notifications
					await this.sendEscalationNotifications(incident, escalatedUsers);
				}

			} else {
				console.error('[reminder] ❌ Escalation failed:', escalationResult);
			}

		} catch (error) {
			console.error('[reminder] Error triggering escalation:', error);
		}
	}

	// ✅ Send escalation notifications
	private async sendEscalationNotifications(incident: any, escalatedUsers: any[]) {
		try {
			console.log('[reminder] Sending escalation notifications to', escalatedUsers.length, 'users');

			const uniqueEmails = new Set<string>();

			for (const user of escalatedUsers) {
				// Send email once per unique email
				if (user.email && !uniqueEmails.has(user.email)) {
					uniqueEmails.add(user.email);

					try {
						await this.emailService.sendEscalationEmail({
							to: user.email,
							incidentId: incident.id,
							title: incident.title,
							description: incident.description,
							severity: incident.severity,
							escalatedFrom: 0,
							escalatedTo: 1,
							reason: 'No response after all reminders'
						});
						console.log(`[reminder] Escalation email sent to: ${user.email}`);
					} catch (emailError) {
						console.error(`[reminder] Escalation email failed for ${user.email}:`, emailError);
					}
				}
			}

			// Send push notifications using PushNotificationService
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
}
