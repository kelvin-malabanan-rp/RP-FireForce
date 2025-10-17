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
import {ReminderService} from "./reminder.service";
import {AuditService} from "./audit.services";

export class IncidentService {
	private env: Env;
	private dbService: DatabaseService;
	private pushService: PushNotificationService;
	private emailService: EmailService;
	private oncallService: OnCallService;
	private auditService: AuditService;

	constructor(env: Env) {
		this.env = env;
		this.dbService = new DatabaseService(env);
		this.pushService = new PushNotificationService(env);
		this.emailService = new EmailService(env);
		this.oncallService = new OnCallService(env);
		this.auditService = new AuditService(env);
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
			console.error('[incident] Error calculating stats:', error);
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

	private determineTeamFromAlarm(alarm: any): string {
		const name = (alarm.AlarmName || '').toLowerCase();

		// Database-related alarms → Database Operations (team-3)
		if (name.includes('database') || name.includes('rds') || name.includes('sql') || name.includes('dynamodb')) {
			console.log('[incident] 🎯 Routing to Database Operations (team-3)');
			return 'team-3';
		}

		// Application-level alarms → Application Support (team-2)
		if (name.includes('api') || name.includes('app') || name.includes('lambda') || name.includes('application')) {
			console.log('[incident] 🎯 Routing to Application Support (team-2)');
			return 'team-2';
		}

		// Network/Security alarms → Network Operations (team-4)
		if (name.includes('network') || name.includes('vpc') || name.includes('security') || name.includes('firewall')) {
			console.log('[incident] 🎯 Routing to Network Operations (team-4)');
			return 'team-4';
		}

		// Default to Platform Engineering for infrastructure (team-1)
		console.log('[incident] 🎯 Routing to Platform Engineering (team-1) - default');
		return 'team-1';
	}

// ✅ Update your processCloudWatchAlarm method
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
				console.log('[incident] Incident resolved for alarm:', alarm.AlarmName);
			}

			return { action: 'resolved', changes: result.changes };
		}

		if (!isAlarmState) {
			return { action: 'ignored', reason: 'Not an ALARM state' };
		}

		// ✅ Determine team BEFORE creating incident
		const teamId = this.determineTeamFromAlarm(alarm);

		// Create new incident with team_id
		const incident: Partial<Incident> = {
			id: `aws-${alarm.AlarmName}-${Date.now()}`,
			title: alarm.AlarmName || 'Unknown Alarm',
			description: alarm.AlarmDescription || 'CloudWatch alarm triggered',
			severity: this.mapAlarmToSeverity(alarm),
			status: 'open',
			timestamp: new Date(alarm.StateChangeTime).toISOString(),
			reported_by: 'AWS CloudWatch',
			location: alarm.Region || null,
			team_id: teamId,  // ✅ ADDED: Assign team_id based on alarm routing
			aws_alarm_name: alarm.AlarmName || null,
			aws_account_id: alarm.AWSAccountId || null,
			state_reason: alarm.StateReason || null,
			metric_name: null,
			aws_console_url: alarm.AlarmName ? this.generateAwsConsoleUrl(alarm) : null
		};

		console.log(`[incident] 📋 Creating incident with team_id: ${teamId}`);

		const result = await this.dbService.insertIncident(incident);
		console.log('[incident] New incident created:', result.id);

		// --- ADDED: Create audit log for CloudWatch-created incident ---
		try {
			const auditPayload = {
				action: "CREATE_INCIDENT",
				incidentId: result.id,
				userId: 'user-1', // source/system user
				description: `CloudWatch alarm "${alarm.AlarmName}" created incident "${incident.title}"`,
				details: {
					alarmName: alarm.AlarmName,
					awsAccountId: alarm.AWSAccountId,
					region: alarm.Region,
					severity: incident.severity,
					teamId: teamId,
					createdFrom: "cloudwatch_alarm_processor",
				},
				metadata: {
					source: 'cloudwatch',
					rawAlarm: alarm,
					timestamp: new Date().toISOString(),
					device: 'aws',
				},
			};

			// createAuditLog should be available like in createNewIncident; adjust call if you use a service method instead
			await this.auditService.createAuditLog(auditPayload);
			console.log('[incident] ✅ Audit log created for CloudWatch incident:', result.id);
		} catch (auditErr) {
			console.warn('[incident] ⚠️ Failed to create audit log for CloudWatch incident:', auditErr);
		}

		// ✅ Get reminder configuration from primary on-call user
		const reminderConfig = await this.getUserReminderSettings(result.id);

		try {
			// ✅ Send initial push notifications to PRIMARY ONLY
			await this.pushService.sendIncidentAlert({
				...incident,
				id: result.id
			} as Incident);
			console.log('[incident] Push notifications sent for incident:', incident.title);

			// ✅ Send initial email notifications to PRIMARY ONLY
			const onCallResponse = await this.oncallService.getAllCurrentOnCall(teamId);  // ✅ Pass teamId
			if (onCallResponse) {
				const { primary = [] } = onCallResponse;

				console.log(`[incident] Sending initial emails to ${primary.length} PRIMARY members of ${teamId}`);

				// Deduplicate emails
				const uniqueEmails = new Set<string>();

				// ✅ Send ONLY to PRIMARY members
				for (const member of primary) {
					if (!uniqueEmails.has(member.email)) {
						uniqueEmails.add(member.email);

						try {
							await this.emailService.sendIncidentAlert({
								to: member.email,
								incidentId: result.id,
								title: incident.title!,
								description: incident.description!,
								severity: incident.severity!,
								reportedBy: incident.reported_by!,
								timestamp: incident.timestamp!,
								role: 'primary'
							});
							console.log('[incident] [email] ✅ Sent to:', member.email, '(primary)');

							// ✅ Wait 600ms between emails
							await this.delay(600);

						} catch (emailError) {
							console.error('[incident] [email] ❌ Failed to send to:', member.email, emailError);
						}
					}
				}
			}

			// ✅ Schedule reminders with user's preferences (if enabled)
			if (reminderConfig.enabled) {
				const reminderService = new ReminderService(this.env);
				await reminderService.scheduleReminders(result.id, {
					maxReminders: reminderConfig.maxReminders,
					intervalSeconds: reminderConfig.intervalSeconds
				});
				console.log(`[incident] ✅ Reminders scheduled: ${reminderConfig.maxReminders}x every ${reminderConfig.intervalSeconds}s`);
			} else {
				console.log('[incident] ⏭️ Reminders disabled for this user');
			}

		} catch (error) {
			console.error('[incident] Failed to send notifications:', error);
		}

		return { action: 'created', incident: incident as Incident };
	}

	private async delay(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// ✅ Get reminder settings from primary on-call user's push token
	private async getUserReminderSettings(incidentId: string): Promise<{
		enabled: boolean;
		maxReminders: number;
		intervalSeconds: number;
	}> {
		try {
			// Get incident to find team
			const incident = await this.dbService.getIncidentById(incidentId);

			// Get on-call users for the team
			const onCallResponse = await this.oncallService.getCurrentOnCallByTeamId(incident.team_id);

			if (!onCallResponse || !onCallResponse.primary || onCallResponse.primary.length === 0) {
				// Default settings if no on-call user found
				console.log('[incident] No primary on-call user found, using default reminder settings');
				return { enabled: true, maxReminders: 3, intervalSeconds: 10 };
			}

			// Get primary user's push token settings
			const primaryUser = onCallResponse.primary[0];

			const tokenSettings = await this.dbService.db?.prepare(`
				SELECT pt.settings
				FROM push_tokens pt
				JOIN push_token_user_assoc pta ON pt.id = pta.push_token_id
				WHERE pta.user_id = ? AND pt.is_active = 1
				ORDER BY pt.created_at DESC
				LIMIT 1
			`).bind(primaryUser.userId).first();

			if (tokenSettings && tokenSettings.settings) {
				try {
					const settings = JSON.parse(tokenSettings.settings as string);

					// Check if reminders are enabled and get config
					if (settings.reminderConfig) {
						const config = settings.reminderConfig;
						console.log(`[incident] Using ${primaryUser.email}'s reminder settings:`, {
							enabled: config.enabled,
							maxReminders: config.maxReminders,
							intervalSeconds: config.intervalSeconds
						});

						return {
							enabled: config.enabled !== false, // Default to true if not explicitly false
							maxReminders: config.maxReminders || 3,
							intervalSeconds: config.intervalSeconds || 10
						};
					}
				} catch (parseError) {
					console.error('[incident] Error parsing settings JSON:', parseError);
				}
			}

			// Default settings if no valid config found
			console.log('[incident] No reminder config found, using defaults');
			return { enabled: true, maxReminders: 3, intervalSeconds: 10 };
		} catch (error) {
			console.error('[incident] Error getting reminder settings:', error);
			return { enabled: true, maxReminders: 3, intervalSeconds: 10 };
		}
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

		// Get incident details
		const incident = await this.dbService.getIncidentById(incidentId);

		// ✅ Send status change emails to all notified users
		const notifiedUsers = await this.getNotifiedUsers(incidentId);
		for (const user of notifiedUsers) {
			try {
				await this.emailService.sendStatusChangeEmail({
					to: user.email,
					incidentId: incident.id,
					title: incident.title,
					status: 'resolved',
					changedBy: resolvedBy || 'System',
					timestamp: new Date().toISOString()
				});
				console.log('[incident] [email] ✅ Resolution email sent to:', user.email);
			} catch (emailError) {
				console.error('[incident] [email] ❌ Failed to send resolution email:', emailError);
			}
		}

		// Send push notifications
		const notificationResult = await this.pushService.sendAllClear(incidentId);

		return {
			incidentId,
			status: 'resolved',
			notifiedCount: notificationResult?.notifiedCount || 0,
			users: notificationResult?.users || []
		};
	}

	// ✅ Helper to get all users who were notified about an incident
	private async getNotifiedUsers(incidentId: string): Promise<any[]> {
		const result = await this.dbService.db?.prepare(`
			SELECT DISTINCT u.*
			FROM incident_notifications n
			JOIN users u ON n.user_id = u.id
			WHERE n.incident_id = ?
		`).bind(incidentId).all();

		return result?.results || [];
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

		// ✅ Send notifications (both push and email)
		if (data.notify_users && Array.isArray(data.notify_users) && data.notify_users.length > 0) {
			await this.notifySpecificUsers(result.id, data.notify_users);
		} else {
			await this.notifyCurrentOnCall(result.id);
		}

		// ✅ Schedule reminders for manually created incidents too
		const reminderConfig = await this.getUserReminderSettings(result.id);
		if (reminderConfig.enabled) {
			const reminderService = new ReminderService(this.env);
			await reminderService.scheduleReminders(result.id, {
				maxReminders: reminderConfig.maxReminders,
				intervalSeconds: reminderConfig.intervalSeconds
			});
			console.log(`[incident] ✅ Reminders scheduled for manual incident: ${reminderConfig.maxReminders}x every ${reminderConfig.intervalSeconds}s`);
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
					// ✅ Send email
					await this.emailService.sendIncidentAlert({
						to: user.email,
						incidentId: incident.id,
						title: incident.title,
						description: incident.description,
						severity: incident.severity,
						reportedBy: incident.reported_by,
						timestamp: incident.timestamp
					});

					await this.trackNotification(incidentId, userId, 'email');
					console.log('[incident] [email] ✅ Sent to:', user.email);
				} catch (error) {
					console.error(`[incident] [email] ❌ Failed to notify user ${userId}:`, error);
				}
			}
		}
	}

	private async notifyCurrentOnCall(incidentId: string): Promise<void> {
		const incident = await this.dbService.getIncidentById(incidentId);
		if (!incident) {
			console.error('[incident] Incident not found:', incidentId);
			return;
		}

		try {
			const teams = await this.oncallService.getUserTeam(incident.reported_by);

			for (const team of teams) {
				const current = await this.oncallService.getAllCurrentOnCall(team.id);

				// ✅ Notify PRIMARY ONLY for initial alert
				if (current?.primary && Array.isArray(current.primary)) {
					console.log(`[incident] Sending initial notifications to ${current.primary.length} PRIMARY members`);

					for (const primaryUser of current.primary) {
						try {
							await this.emailService.sendIncidentAlert({
								to: primaryUser.email,
								incidentId: incident.id,
								title: incident.title,
								description: incident.description,
								severity: incident.severity,
								reportedBy: incident.reported_by,
								timestamp: incident.timestamp,
								role: 'primary'
							});
							await this.trackNotification(incidentId, primaryUser.userId, 'email');
							console.log('[incident] [email] ✅ Sent to primary:', primaryUser.email);
						} catch (err) {
							console.error(`[incident] [email] ❌ Failed to notify primary:`, err);
						}
					}
				}
			}

			// Send push notifications (already fixed to send to PRIMARY only)
			await this.pushService.sendIncidentAlert(incident);
			console.log('[incident] Push notifications sent for incident:', incidentId);
			console.log('[incident] 📝 Backup and escalation will be notified via reminder escalation chain');

		} catch (error) {
			console.error('[incident] Failed to send on-call notifications:', error);
		}
	}

	// ──────────────────────────────────────────────
	private async trackNotification(incidentId: string, userId: string, type: string): Promise<void> {
		await this.dbService.db?.prepare(`
			INSERT INTO incident_notifications (id, incident_id, user_id, notification_type, kind, sent_at, delivered_at)
			VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		`).bind(
			crypto.randomUUID(),
			incidentId,
			userId,
			type,
			'email'
		).run();
	}

	// ──────────────────────────────────────────────
	private async validateUserById(userId: string): Promise<void> {
		try {
			await this.dbService.getUserById(userId);
		} catch (error) {
			console.error('[incident]', error);
			throw error;
		}
	}

	private async validateUserByEmail(email: string): Promise<void> {
		try {
			await this.dbService.getUserByEmail(email);
		} catch (error) {
			console.error('[incident]', error);
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
