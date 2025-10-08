// services/emailService.ts
import { Env } from '../types';

export interface EmailTemplate {
	to: string;
	subject: string;
	htmlBody: string;
	textBody: string;
}

export class EmailService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	/**
	 * Send email using MailChannels (free for Cloudflare Workers)
	 */
	async sendEmail(template: EmailTemplate): Promise<boolean> {
		try {
			const emailPayload = {
				personalizations: [
					{
						to: [{ email: template.to }],
					},
				],
				from: {
					email: this.env.SENDER_EMAIL || 'noreply@fireforces.net',
					name: 'FireForce Incident Management',
				},
				subject: template.subject,
				content: [
					{
						type: 'text/plain',
						value: template.textBody,
					},
					{
						type: 'text/html',
						value: template.htmlBody,
					},
				],
			};

			// Use MailChannels API key if provided. If running from an authorized Cloudflare Worker
			// you can omit the API key, but since you're using CloudFront you must send the key.
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
			};

			// Prefer X-Api-Key header per MailChannels docs
			if (this.env.MAILCHANNELS_API_KEY) {
				headers['X-Api-Key'] = this.env.MAILCHANNELS_API_KEY;
			} else {
				// Helpful log for debugging — if you expect to be sending from an authorized Cloudflare Worker,
				// make sure there's a Domain Lockdown TXT record for your sending domain.
				console.warn('[email] MAILCHANNELS_API_KEY not set. If you are not sending from an authorized Cloudflare Worker, MailChannels will reject requests.');
			}

			const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
				method: 'POST',
				headers,
				body: JSON.stringify(emailPayload),
			});

			if (!response.ok) {
				const error = await response.text();
				console.error('[email] MailChannels error:', error);
				return false;
			}

			console.log('[email] ✅ Email sent to:', template.to);
			return true;
		} catch (error) {
			console.error('[email] Error sending email:', error);
			return false;
		}
	}

	/**
	 * Send incident alert email
	 */
	async sendIncidentAlert(params: {
		to: string;
		incidentId: string;
		title: string;
		description: string;
		severity: string;
		reportedBy: string;
		timestamp: string;
	}): Promise<boolean> {
		const severityColors = {
			critical: '#DC2626',
			high: '#EA580C',
			medium: '#F59E0B',
			low: '#84CC16',
		};

		const color = severityColors[params.severity as keyof typeof severityColors] || '#6B7280';

		const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: ${color}; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                                🚨 ${params.severity.toUpperCase()} INCIDENT
                            </h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px;">
                                ${params.title}
                            </h2>

                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                                ${params.description}
                            </p>

                            <table width="100%" style="margin: 20px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; font-weight: bold; color: #6b7280;">Incident ID:</td>
                                    <td style="padding: 10px; background-color: #f9fafb; color: #111827;">${params.incidentId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #6b7280;">Severity:</td>
                                    <td style="padding: 10px; color: ${color}; font-weight: bold; text-transform: uppercase;">${params.severity}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; font-weight: bold; color: #6b7280;">Reported By:</td>
                                    <td style="padding: 10px; background-color: #f9fafb; color: #111827;">${params.reportedBy}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #6b7280;">Time:</td>
                                    <td style="padding: 10px; color: #111827;">${new Date(params.timestamp).toLocaleString()}</td>
                                </tr>
                            </table>

                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://your-app-url.com/incidents/${params.incidentId}"
                                   style="display: inline-block; background-color: #3b82f6; color: #ffffff;
                                          padding: 12px 30px; text-decoration: none; border-radius: 6px;
                                          font-weight: bold; font-size: 16px;">
                                    View Incident
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                FireForce Incident Management System
                            </p>
                            <p style="margin: 5px 0 0 0; color: #9ca3af; font-size: 12px;">
                                This is an automated notification. Please do not reply to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

		const textBody = `
🚨 ${params.severity.toUpperCase()} INCIDENT

${params.title}

${params.description}

Incident ID: ${params.incidentId}
Severity: ${params.severity.toUpperCase()}
Reported By: ${params.reportedBy}
Time: ${new Date(params.timestamp).toLocaleString()}

---
FireForce Incident Management System
This is an automated notification.
        `;

		return this.sendEmail({
			to: params.to,
			subject: `🚨 ${params.severity.toUpperCase()}: ${params.title}`,
			htmlBody,
			textBody,
		});
	}

	/**
	 * Send status change email
	 */
	async sendStatusChangeEmail(params: {
		to: string;
		incidentId: string;
		title: string;
		status: 'investigating' | 'resolved';
		changedBy: string;
		timestamp: string;
	}): Promise<boolean> {
		const isResolved = params.status === 'resolved';
		const emoji = isResolved ? '✅' : '🔍';
		const statusText = isResolved ? 'RESOLVED' : 'UNDER INVESTIGATION';
		const color = isResolved ? '#10B981' : '#3B82F6';

		const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background-color: ${color}; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                                ${emoji} INCIDENT ${statusText}
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827;">${params.title}</h2>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                                This incident has been marked as <strong>${params.status}</strong> by ${params.changedBy}.
                            </p>
                            <table width="100%" style="margin: 20px 0;">
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; font-weight: bold;">Incident ID:</td>
                                    <td style="padding: 10px; background-color: #f9fafb;">${params.incidentId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold;">Status:</td>
                                    <td style="padding: 10px; color: ${color}; font-weight: bold; text-transform: uppercase;">${params.status}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; font-weight: bold;">Changed By:</td>
                                    <td style="padding: 10px; background-color: #f9fafb;">${params.changedBy}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold;">Time:</td>
                                    <td style="padding: 10px;">${new Date(params.timestamp).toLocaleString()}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">FireForce Incident Management System</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

		const textBody = `
${emoji} INCIDENT ${statusText}

${params.title}

This incident has been marked as ${params.status} by ${params.changedBy}.

Incident ID: ${params.incidentId}
Status: ${params.status.toUpperCase()}
Changed By: ${params.changedBy}
Time: ${new Date(params.timestamp).toLocaleString()}

---
FireForce Incident Management System
        `;

		return this.sendEmail({
			to: params.to,
			subject: `${emoji} Incident ${statusText}: ${params.title}`,
			htmlBody,
			textBody,
		});
	}

	/**
	 * Send reminder email
	 */
	async sendReminderEmail(params: {
		to: string;
		incidentId: string;
		title: string;
		description: string;
		severity: string;
		reminderNumber: number;
		totalReminders: number;
	}): Promise<boolean> {
		const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                    <tr>
                        <td style="background-color: #F59E0B; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px;">
                                ⏰ REMINDER #${params.reminderNumber}/${params.totalReminders}
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827;">${params.title}</h2>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                                This incident still requires your attention.
                            </p>
                            <p style="margin: 0 0 20px 0; color: #374151;">${params.description}</p>
                            <p style="margin: 20px 0; padding: 15px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; color: #92400E;">
                                <strong>⚠️ This is reminder ${params.reminderNumber} of ${params.totalReminders}.</strong><br>
                                Please acknowledge or respond to this incident.
                            </p>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://your-app-url.com/incidents/${params.incidentId}"
                                   style="display: inline-block; background-color: #3b82f6; color: #ffffff;
                                          padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                    View & Respond
                                </a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `;

		const textBody = `
⏰ REMINDER #${params.reminderNumber}/${params.totalReminders}

${params.title}

This incident still requires your attention.

${params.description}

⚠️ This is reminder ${params.reminderNumber} of ${params.totalReminders}.
Please acknowledge or respond to this incident.

Incident ID: ${params.incidentId}
Severity: ${params.severity.toUpperCase()}

---
FireForce Incident Management System
        `;

		return this.sendEmail({
			to: params.to,
			subject: `⏰ REMINDER #${params.reminderNumber}: ${params.severity.toUpperCase()} - ${params.title}`,
			htmlBody,
			textBody,
		});
	}
}
