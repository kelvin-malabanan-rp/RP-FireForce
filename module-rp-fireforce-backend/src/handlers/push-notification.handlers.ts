// handlers/push-notification.handlers.ts
import { Env } from '../types';
import { PushNotificationService } from '../services/push-notification.service';

export async function handleRegisterPushToken(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			token: string;
			deviceType?: string;
			settings?: any;
		};
		const { token, deviceType, settings } = body;

		if (!token) {
			return new Response(JSON.stringify({
				error: 'Push token is required'
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const pushService = new PushNotificationService(env);
		const result = await pushService.registerPushToken(token, deviceType, settings);

		return new Response(JSON.stringify({
			message: 'Push token registered successfully',
			object: result
		}), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error registering push token:', error);
		return new Response(JSON.stringify({
			error: 'Failed to register push token'
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}

export async function handleSendTestAlert(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	try {
		const body = await request.json() as {
			token: string;
			alertType?: string;
		};
		const { token, alertType = 'high' } = body;

		if (!token) {
			return new Response(JSON.stringify({
				error: 'Push token is required'
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		const pushService = new PushNotificationService(env);
		const success = await pushService.sendTestAlert(token, alertType);

		return new Response(JSON.stringify({
			message: success ? 'Test alert sent successfully' : 'Failed to send test alert',
			object: { sent: success }
		}), {
			status: success ? 200 : 500,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error sending test alert:', error);
		return new Response(JSON.stringify({
			error: 'Failed to send test alert'
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}
