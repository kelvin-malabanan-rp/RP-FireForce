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
	private logoBase64: string;

	constructor(env: Env) {
		this.env = env;
		// Base64 encoded logo - you'll need to replace this with your actual base64 encoded rp-fireforce-white.png
		// To get the base64: https://www.base64-image.de/ or use: btoa(imageData)
		this.logoBase64 = 'data:image/png;base64,YOUR_BASE64_STRING_HERE';

	}

	/**
	 * Get logo as base64 data URL
	 */
	private getLogoDataUrl(): string {
		return 'https://your-cdn-url.com/rp-fireforce-white.png';
	}

	/**
	 * Send email using Resend
	 */
	async sendEmail(template: EmailTemplate): Promise<boolean> {
		try {
			// Use verified sender email, fallback to Resend's onboarding domain
			const fromEmail = this.env.SENDER_EMAIL && this.env.SENDER_EMAIL.includes('@fireforces.net')
				? this.env.SENDER_EMAIL
				: 'noreply@fireforces.net';

			const emailPayload = {
				from: `FireForce Incident Management <${fromEmail}>`,
				to: [template.to],
				subject: template.subject,
				html: template.htmlBody,
				text: template.textBody,
			};

			console.log('[email] Sending via Resend to:', template.to);

			const response = await fetch('https://api.resend.com/emails', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${this.env.RESEND_API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(emailPayload),
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('[email] Resend error:', errorData);
				return false;
			}

			const result = await response.json();
			console.log('[email] ✅ Email sent successfully, ID:', result.id);
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
			critical: { color: '#DC2626', label: 'CRITICAL' },
			high: { color: '#EA580C', label: 'HIGH' },
			medium: { color: '#F59E0B', label: 'MEDIUM' },
			low: { color: '#84CC16', label: 'LOW' },
		};
		const config = severityColors[params.severity as keyof typeof severityColors] || severityColors.medium;

		const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incident Alert</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #334155;">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); padding: 24px; border-bottom: 3px solid ${config.color};">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <img src="${this.getLogoDataUrl()}" alt="FireForce" style="width: 40px; height: 40px; display: block;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                                            RP FireForce
                                        </h1>
                                        <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                                            Incident Management System
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Alert Badge -->
                    <tr>
                        <td style="padding: 20px 30px 0 30px;">
                            <table cellpadding="0" cellspacing="0" style="background-color: ${config.color}; border-radius: 6px; padding: 8px 16px;">
                                <tr>
                                    <td style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
                                        🚨 ${config.label} INCIDENT
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <h2 style="margin: 0 0 12px 0; color: #f1f5f9; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                ${params.title}
                            </h2>
                            <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                                ${params.description}
                            </p>

                            <!-- Details Table -->
                            <table width="100%" style="margin: 0; border-collapse: collapse; border: 1px solid #334155; border-radius: 6px; overflow: hidden;">
                                <tr style="background-color: #0f172a;">
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; width: 35%; border-bottom: 1px solid #334155;">Incident ID</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px; font-family: monospace; border-bottom: 1px solid #334155;">${params.incidentId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; background-color: #0f172a; border-bottom: 1px solid #334155;">Severity</td>
                                    <td style="padding: 12px 16px; color: ${config.color}; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #334155;">${params.severity}</td>
                                </tr>
                                <tr style="background-color: #0f172a;">
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #334155;">Reported By</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px; border-bottom: 1px solid #334155;">${params.reportedBy}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; background-color: #0f172a;">Time</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px;">${new Date(params.timestamp).toLocaleString()}</td>
                                </tr>
                            </table>

                            <!-- Action Button -->
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="https://your-app-url.com/incidents/${params.incidentId}"
                                   style="display: inline-block; background: linear-gradient(to right, #f97316, #dc2626); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    View Incident →
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #0f172a; border-top: 1px solid #334155;">
                            <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                FireForce Incident Management System
                            </p>
                            <p style="margin: 0; color: #64748b; font-size: 11px; text-align: center;">
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

View incident: https://your-app-url.com/incidents/${params.incidentId}

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
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Status Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #334155;">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); padding: 24px; border-bottom: 3px solid ${color};">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <img src="${this.getLogoDataUrl()}" alt="FireForce" style="width: 40px; height: 40px; display: block;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                                            RP FireForce
                                        </h1>
                                        <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                                            Incident Management System
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Status Badge -->
                    <tr>
                        <td style="padding: 20px 30px 0 30px;">
                            <table cellpadding="0" cellspacing="0" style="background-color: ${color}; border-radius: 6px; padding: 8px 16px;">
                                <tr>
                                    <td style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
                                        ${emoji} INCIDENT ${statusText}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <h2 style="margin: 0 0 12px 0; color: #f1f5f9; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                ${params.title}
                            </h2>

                            <div style="background-color: ${isResolved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; border-left: 3px solid ${color}; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px; border: 1px solid ${isResolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'};">
                                <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5;">
                                    This incident has been marked as <strong style="color: ${color};">${params.status}</strong> by <strong style="color: #f1f5f9;">${params.changedBy}</strong>.
                                </p>
                            </div>

                            <!-- Details Table -->
                            <table width="100%" style="margin: 0; border-collapse: collapse; border: 1px solid #334155; border-radius: 6px; overflow: hidden;">
                                <tr style="background-color: #0f172a;">
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; width: 35%; border-bottom: 1px solid #334155;">Incident ID</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px; font-family: monospace; border-bottom: 1px solid #334155;">${params.incidentId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; background-color: #0f172a; border-bottom: 1px solid #334155;">Status</td>
                                    <td style="padding: 12px 16px; color: ${color}; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #334155;">${params.status}</td>
                                </tr>
                                <tr style="background-color: #0f172a;">
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; border-bottom: 1px solid #334155;">Changed By</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px; border-bottom: 1px solid #334155;">${params.changedBy}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; background-color: #0f172a;">Time</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px;">${new Date(params.timestamp).toLocaleString()}</td>
                                </tr>
                            </table>

                            <!-- Action Button -->
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="https://your-app-url.com/incidents/${params.incidentId}"
                                   style="display: inline-block; background: linear-gradient(to right, #f97316, #dc2626); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    View Details →
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #0f172a; border-top: 1px solid #334155;">
                            <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                FireForce Incident Management System
                            </p>
                            <p style="margin: 0; color: #64748b; font-size: 11px; text-align: center;">
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
${emoji} INCIDENT ${statusText}

${params.title}

This incident has been marked as ${params.status} by ${params.changedBy}.

Incident ID: ${params.incidentId}
Status: ${params.status.toUpperCase()}
Changed By: ${params.changedBy}
Time: ${new Date(params.timestamp).toLocaleString()}

View incident: https://your-app-url.com/incidents/${params.incidentId}

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
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #0f172a;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #334155;">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e293b 0%, #7c3aed 100%); padding: 24px; border-bottom: 3px solid #f59e0b;">
                            <table cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="padding-right: 12px; vertical-align: middle;">
                                        <img src="${this.getLogoDataUrl()}" alt="FireForce" style="width: 40px; height: 40px; display: block;" />
                                    </td>
                                    <td style="vertical-align: middle;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">
                                            RP FireForce
                                        </h1>
                                        <p style="margin: 4px 0 0 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                                            Incident Management System
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Reminder Badge -->
                    <tr>
                        <td style="padding: 20px 30px 0 30px;">
                            <table cellpadding="0" cellspacing="0" style="background-color: #f59e0b; border-radius: 6px; padding: 8px 16px;">
                                <tr>
                                    <td style="color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">
                                        ⏰ REMINDER #${params.reminderNumber}/${params.totalReminders}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 20px 30px;">
                            <h2 style="margin: 0 0 12px 0; color: #f1f5f9; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                ${params.title}
                            </h2>
                            <p style="margin: 0 0 16px 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                                ${params.description}
                            </p>

                            <!-- Warning Box -->
                            <div style="background-color: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin-bottom: 20px; border: 1px solid rgba(245, 158, 11, 0.2);">
                                <p style="margin: 0 0 8px 0; color: #fbbf24; font-weight: 600; font-size: 14px;">
                                    ⚠️ Action Required
                                </p>
                                <p style="margin: 0; color: #fcd34d; font-size: 13px; line-height: 1.5;">
                                    This is reminder <strong>${params.reminderNumber} of ${params.totalReminders}</strong>. Please acknowledge or respond to this incident as soon as possible.
                                </p>
                            </div>

                            <!-- Details Table -->
                            <table width="100%" style="margin: 0; border-collapse: collapse; border: 1px solid #334155; border-radius: 6px; overflow: hidden;">
                                <tr style="background-color: #0f172a;">
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; width: 35%; border-bottom: 1px solid #334155;">Incident ID</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px; font-family: monospace; border-bottom: 1px solid #334155;">${params.incidentId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px; background-color: #0f172a; border-bottom: 1px solid #334155;">Severity</td>
                                    <td style="padding: 12px 16px; color: #ea580c; font-weight: 700; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #334155;">${params.severity}</td>
                                </tr>
                                <tr style="background-color: #0f172a;">
                                    <td style="padding: 12px 16px; font-weight: 600; color: #94a3b8; font-size: 13px;">Reminder</td>
                                    <td style="padding: 12px 16px; color: #e2e8f0; font-size: 13px; font-weight: 600;">${params.reminderNumber} of ${params.totalReminders}</td>
                                </tr>
                            </table>

                            <!-- Action Button -->
                            <div style="margin-top: 24px; text-align: center;">
                                <a href="https://your-app-url.com/incidents/${params.incidentId}"
                                   style="display: inline-block; background: linear-gradient(to right, #f97316, #dc2626); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                                    Respond Now →
                                </a>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; background-color: #0f172a; border-top: 1px solid #334155;">
                            <p style="margin: 0 0 4px 0; color: #94a3b8; font-size: 12px; text-align: center;">
                                FireForce Incident Management System
                            </p>
                            <p style="margin: 0; color: #64748b; font-size: 11px; text-align: center;">
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
⏰ REMINDER #${params.reminderNumber}/${params.totalReminders}

${params.title}

This incident still requires your attention.

${params.description}

⚠️ This is reminder ${params.reminderNumber} of ${params.totalReminders}.
Please acknowledge or respond to this incident.

Incident ID: ${params.incidentId}
Severity: ${params.severity.toUpperCase()}

View incident: https://your-app-url.com/incidents/${params.incidentId}

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
