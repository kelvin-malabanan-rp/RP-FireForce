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
			fcmToken?: string;  // Added FCM token
			settings?: any;
		};
		const { token, deviceType, fcmToken, settings } = body;

		if (!token) {
			return new Response(JSON.stringify({
				error: 'Push token is required'
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		console.log('Registering tokens - Expo:', token.slice(0, 20), 'FCM:', fcmToken);

		const pushService = new PushNotificationService(env);
		const result = await pushService.registerPushToken(token, deviceType, fcmToken, settings);

		return new Response(JSON.stringify({
			httpStatus: 'OK',
			message: 'Push token registered successfully',
			success: true,
			data: result
		}), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error registering push token:', error);
		return new Response(JSON.stringify({
			httpStatus: 'INTERNAL_SERVER_ERROR',
			error: 'Failed to register push token',
			success: false
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
		const success = await pushService.sendTestAlert(
			token,
			alertType as "high" | "critical" | "medium" | "low" | "default"
		);


		return new Response(JSON.stringify({
			httpStatus: success ? 'OK' : 'INTERNAL_SERVER_ERROR',
			message: success ? 'Test alert sent successfully' : 'Failed to send test alert',
			success: success,
			data: { sent: success, alertType }
		}), {
			status: success ? 200 : 500,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error sending test alert:', error);
		return new Response(JSON.stringify({
			httpStatus: 'INTERNAL_SERVER_ERROR',
			error: 'Failed to send test alert',
			success: false
		}), {
			status: 500,
			headers: corsHeaders
		});
	}
}
