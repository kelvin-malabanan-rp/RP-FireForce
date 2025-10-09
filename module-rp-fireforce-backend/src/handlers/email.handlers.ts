// handlers/emailHandler.ts
import { Env } from '../types';
import { EmailService } from '../services/email.service';

/**
 * Send incident alert email
 * POST /api/email/incident-alert
 */
export async function handleSendIncidentAlertEmail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as any;

		const { to, incidentId, title, description, severity, reportedBy, timestamp } = body;

		if (!to || !incidentId || !title || !description || !severity) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Missing required fields',
					required: ['to', 'incidentId', 'title', 'description', 'severity']
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log('[email-handler] Sending incident alert email to:', to);

		const emailService = new EmailService(env);
		const success = await emailService.sendIncidentAlert({
			to,
			incidentId,
			title,
			description,
			severity,
			reportedBy: reportedBy || 'System',
			timestamp: timestamp || new Date().toISOString()
		});

		return new Response(
			JSON.stringify({
				success,
				httpStatus: success ? 'OK' : 'ERROR',
				message: success ? 'Incident alert email sent' : 'Failed to send email'
			}),
			{
				status: success ? 200 : 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('[email-handler] Error sending incident alert:', error);
		return new Response(
			JSON.stringify({
				success: false,
				httpStatus: 'ERROR',
				error: 'Failed to send incident alert email',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Send status change email
 * POST /api/email/status-change
 */
export async function handleSendStatusChangeEmail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as any;

		const { to, incidentId, title, status, changedBy, timestamp } = body;

		if (!to || !incidentId || !title || !status || !changedBy) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Missing required fields',
					required: ['to', 'incidentId', 'title', 'status', 'changedBy']
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		if (!['investigating', 'resolved'].includes(status)) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Invalid status. Must be "investigating" or "resolved"'
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log('[email-handler] Sending status change email to:', to, 'Status:', status);

		const emailService = new EmailService(env);
		const success = await emailService.sendStatusChangeEmail({
			to,
			incidentId,
			title,
			status: status as 'investigating' | 'resolved',
			changedBy,
			timestamp: timestamp || new Date().toISOString()
		});

		return new Response(
			JSON.stringify({
				success,
				httpStatus: success ? 'OK' : 'ERROR',
				message: success ? 'Status change email sent' : 'Failed to send email'
			}),
			{
				status: success ? 200 : 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('[email-handler] Error sending status change email:', error);
		return new Response(
			JSON.stringify({
				success: false,
				httpStatus: 'ERROR',
				error: 'Failed to send status change email',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Send reminder email
 * POST /api/email/reminder
 */
export async function handleSendReminderEmail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as any;

		const { to, incidentId, title, description, severity, reminderNumber, totalReminders } = body;

		if (!to || !incidentId || !title || !description || !severity || reminderNumber === undefined || !totalReminders) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Missing required fields',
					required: ['to', 'incidentId', 'title', 'description', 'severity', 'reminderNumber', 'totalReminders']
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log(`[email-handler] Sending reminder email #${reminderNumber}/${totalReminders} to:`, to);

		const emailService = new EmailService(env);
		const success = await emailService.sendReminderEmail({
			to,
			incidentId,
			title,
			description,
			severity,
			reminderNumber: typeof reminderNumber === 'string' ? parseInt(reminderNumber) : reminderNumber,
			totalReminders: typeof totalReminders === 'string' ? parseInt(totalReminders) : totalReminders
		});

		return new Response(
			JSON.stringify({
				success,
				httpStatus: success ? 'OK' : 'ERROR',
				message: success ? `Reminder email #${reminderNumber} sent` : 'Failed to send email'
			}),
			{
				status: success ? 200 : 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('[email-handler] Error sending reminder email:', error);
		return new Response(
			JSON.stringify({
				success: false,
				httpStatus: 'ERROR',
				error: 'Failed to send reminder email',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Send escalation email
 * POST /api/email/escalation
 */
export async function handleSendEscalationEmail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as any;

		const { to, incidentId, title, description, severity, escalatedFrom, escalatedTo, reason } = body;

		if (!to || !incidentId || !title || !description || !severity) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Missing required fields',
					required: ['to', 'incidentId', 'title', 'description', 'severity']
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log('[email-handler] Sending escalation email to:', to);

		const emailService = new EmailService(env);

		// Create escalation email using the base sendEmail method
		const severityColors: Record<string, string> = {
			critical: '#DC2626',
			high: '#EA580C',
			medium: '#F59E0B',
			low: '#84CC16',
		};
		const color = severityColors[severity] || '#6B7280';

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
                                🚨 INCIDENT ESCALATED
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px;">${title}</h2>
                            <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px;">
                                This incident has been escalated to you${reason ? `: ${reason}` : ''}.
                            </p>
                            <p style="margin: 0 0 20px 0; color: #374151; line-height: 1.5;">${description}</p>
                            <table width="100%" style="margin: 20px 0; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; font-weight: bold; color: #6b7280;">Incident ID:</td>
                                    <td style="padding: 10px; background-color: #f9fafb; color: #111827;">${incidentId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #6b7280;">Severity:</td>
                                    <td style="padding: 10px; color: ${color}; font-weight: bold; text-transform: uppercase;">${severity}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; background-color: #f9fafb; font-weight: bold; color: #6b7280;">Escalated From Level:</td>
                                    <td style="padding: 10px; background-color: #f9fafb; color: #111827;">${escalatedFrom || 0}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; font-weight: bold; color: #6b7280;">Escalated To Level:</td>
                                    <td style="padding: 10px; color: #111827;">${escalatedTo || 1}</td>
                                </tr>
                            </table>
                            <div style="text-align: center; margin-top: 30px;">
                                <a href="https://your-app-url.com/incidents/${incidentId}"
                                   style="display: inline-block; background-color: #DC2626; color: #ffffff;
                                          padding: 12px 30px; text-decoration: none; border-radius: 6px;
                                          font-weight: bold; font-size: 16px;">
                                    Respond Immediately
                                </a>
                            </div>
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
🚨 INCIDENT ESCALATED

${title}

This incident has been escalated to you${reason ? `: ${reason}` : ''}.

${description}

Incident ID: ${incidentId}
Severity: ${severity.toUpperCase()}
Escalated From Level: ${escalatedFrom || 0}
Escalated To Level: ${escalatedTo || 1}

⚠️ URGENT: Please respond immediately.

---
FireForce Incident Management System
        `;

		const success = await emailService.sendEmail({
			to,
			subject: `🚨 ESCALATED: ${severity.toUpperCase()} - ${title}`,
			htmlBody,
			textBody
		});

		return new Response(
			JSON.stringify({
				success,
				httpStatus: success ? 'OK' : 'ERROR',
				message: success ? 'Escalation email sent' : 'Failed to send email'
			}),
			{
				status: success ? 200 : 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('[email-handler] Error sending escalation email:', error);
		return new Response(
			JSON.stringify({
				success: false,
				httpStatus: 'ERROR',
				error: 'Failed to send escalation email',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}

/**
 * Send bulk email to multiple recipients
 * POST /api/email/bulk
 */
export async function handleSendBulkEmail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as any;

		const { recipients, subject, htmlBody, textBody } = body;

		if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Recipients array is required and must not be empty'
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		if (!subject || !htmlBody || !textBody) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Missing required fields',
					required: ['recipients', 'subject', 'htmlBody', 'textBody']
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log('[email-handler] Sending bulk email to', recipients.length, 'recipients');

		const emailService = new EmailService(env);
		let sent = 0;
		let failed = 0;
		const results: Array<{ email: string; success: boolean; error?: string }> = [];

		for (const recipient of recipients) {
			try {
				const success = await emailService.sendEmail({
					to: recipient,
					subject,
					htmlBody,
					textBody
				});

				if (success) {
					sent++;
					results.push({ email: recipient, success: true });
				} else {
					failed++;
					results.push({ email: recipient, success: false, error: 'Send failed' });
				}
			} catch (error) {
				console.error('[email-handler] Failed to send to:', recipient, error);
				failed++;
				results.push({
					email: recipient,
					success: false,
					error: error instanceof Error ? error.message : 'Unknown error'
				});
			}
		}

		console.log(`[email-handler] Bulk email complete: ${sent} sent, ${failed} failed`);

		return new Response(
			JSON.stringify({
				success: true,
				httpStatus: 'OK',
				sent,
				failed,
				total: recipients.length,
				results
			}),
			{
				status: 200,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('[email-handler] Error sending bulk email:', error);
		return new Response(
			JSON.stringify({
				success: false,
				httpStatus: 'ERROR',
				error: 'Failed to send bulk email',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}
/**
 * Send test email
 * POST /api/email/test
 */
export async function handleSendTestEmail(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as any;

		const { to } = body;

		if (!to) {
			return new Response(
				JSON.stringify({
					success: false,
					httpStatus: 'ERROR',
					error: 'Email address (to) is required'
				}),
				{
					status: 400,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				}
			);
		}

		console.log('[email-handler] Sending test email to:', to);

		const emailService = new EmailService(env);
		const success = await emailService.sendEmail({
			to,
			subject: '✅ Test Email from FireForce',
			htmlBody: `
                <h2>✅ Email System Test</h2>
                <p>This is a test email from your FireForce Incident Management System.</p>
                <p>If you received this, your email configuration is working correctly!</p>
                <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                    Sent at: ${new Date().toLocaleString()}
                </p>
            `,
			textBody: `
✅ Email System Test

This is a test email from your FireForce Incident Management System.

If you received this, your email configuration is working correctly!

Sent at: ${new Date().toLocaleString()}
            `
		});

		return new Response(
			JSON.stringify({
				success,
				httpStatus: success ? 'OK' : 'ERROR',
				message: success ? 'Test email sent successfully' : 'Failed to send test email'
			}),
			{
				status: success ? 200 : 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	} catch (error) {
		console.error('[email-handler] Error sending test email:', error);
		return new Response(
			JSON.stringify({
				success: false,
				httpStatus: 'ERROR',
				error: 'Failed to send test email',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			}
		);
	}
}
