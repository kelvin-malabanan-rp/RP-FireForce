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
			userId: string;      // ← NEW: Required userId
			token: string;
			deviceType?: string;
			fcmToken?: string;
			settings?: any;
		};
		const { userId, token, deviceType, fcmToken, settings } = body;

		// Validate required fields
		if (!userId) {
			return new Response(JSON.stringify({
				httpStatus: 'BAD_REQUEST',
				error: 'User ID is required',
				success: false
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		if (!token) {
			return new Response(JSON.stringify({
				httpStatus: 'BAD_REQUEST',
				error: 'Push token is required',
				success: false
			}), {
				status: 400,
				headers: corsHeaders
			});
		}

		console.log('Registering tokens for user:', userId, '- Expo:', token.slice(0, 20), 'FCM:', fcmToken ? fcmToken.slice(0, 20) : 'none');

		const pushService = new PushNotificationService(env);
		const result = await pushService.registerPushToken(
			userId,      // ← NEW: Pass userId as first parameter
			token,
			deviceType,
			fcmToken,
			settings
		);

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
			message: error instanceof Error ? error.message : 'Unknown error',
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
