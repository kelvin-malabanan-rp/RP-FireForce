// services/email.service.ts
import { Env } from '../types';

export class EmailService {
	private env: Env;

	constructor(env: Env) {
		this.env = env;
	}

	async sendIncidentAlert(incident: any, recipient: string): Promise<void> {
		try {
			const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					personalizations: [
						{
							to: [{ email: recipient }],
						},
					],
					from: {
						email: 'alerts@yourdomain.com',
						name: 'RPFireForce Alerts',
					},
					subject: `[${incident.severity.toUpperCase()}] ${incident.title}`,
					content: [
						{
							type: 'text/html',
							value: this.generateIncidentEmailHTML(incident),
						},
					],
				}),
			});

			if (!response.ok) {
				throw new Error(`Email API error: ${response.statusText}`);
			}

			console.log(`Email sent to ${recipient} for incident ${incident.id}`);
		} catch (error) {
			console.error('Failed to send email:', error);
			throw error;
		}
	}

	async sendAllClearEmail(incident: any, recipient: string): Promise<void> {
		try {
			await fetch('https://api.mailchannels.net/tx/v1/send', {
				method: 'POST',
				headers: {
					'content-type': 'application/json',
				},
				body: JSON.stringify({
					personalizations: [
						{
							to: [{ email: recipient }],
						},
					],
					from: {
						email: 'alerts@yourdomain.com',
						name: 'RPFireForce Alerts',
					},
					subject: `[RESOLVED] ${incident.title}`,
					content: [
						{
							type: 'text/html',
							value: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: #10B981; color: white; padding: 20px; border-radius: 8px;">
                                        <h2>Incident Resolved</h2>
                                        <h3>${incident.title}</h3>
                                    </div>
                                    <div style="padding: 20px; background: #f9fafb; margin-top: 20px; border-radius: 8px;">
                                        <p>The incident has been resolved. You can stand down.</p>
                                        <p><strong>Resolved at:</strong> ${new Date().toLocaleString()}</p>
                                    </div>
                                </div>
                            `,
						},
					],
				}),
			});

			console.log(`All-clear email sent to ${recipient}`);
		} catch (error) {
			console.error('Failed to send all-clear email:', error);
		}
	}

	private generateIncidentEmailHTML(incident: any): string {
		const severityColors: Record<string, string> = {
			critical: '#DC2626',
			high: '#EA580C',
			medium: '#3B82F6',
			low: '#10B981',
		};

		return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header {
                        background: ${severityColors[incident.severity]};
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    .content {
                        padding: 20px;
                        background: #f9fafb;
                        margin-top: 20px;
                        border-radius: 8px;
                    }
                    .info-row {
                        margin: 10px 0;
                        padding: 10px;
                        background: white;
                        border-radius: 4px;
                    }
                    .button {
                        background: #3B82F6;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 6px;
                        display: inline-block;
                        margin-top: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>${incident.severity.toUpperCase()} ALERT</h1>
                        <h2>${incident.title}</h2>
                    </div>
                    <div class="content">
                        <div class="info-row">
                            <strong>Description:</strong><br/>
                            ${incident.description}
                        </div>
                        <div class="info-row">
                            <strong>Time:</strong> ${new Date(incident.timestamp).toLocaleString()}
                        </div>
                        ${incident.location ? `
                            <div class="info-row">
                                <strong>Location:</strong> ${incident.location}
                            </div>
                        ` : ''}
                        <div class="info-row">
                            <strong>Reported by:</strong> ${incident.reportedBy}
                        </div>
                        <a href="https://your-app-url.com/incidents/${incident.id}" class="button">
                            View Incident Details
                        </a>
                    </div>
                </div>
            </body>
            </html>
        `;
	}
}
