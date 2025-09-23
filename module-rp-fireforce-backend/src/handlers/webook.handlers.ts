// handlers/webhook.handler.ts
import { Env, SNSMessage, CloudWatchAlarm } from '../types';
import {IncidentService} from "../services/incident.services";

export async function handleWebhook(
	request: Request,
	env: Env,
	corsHeaders: Record<string, string>
): Promise<Response> {
	const headers = Object.fromEntries(request.headers);
	const messageType = headers['x-amz-sns-message-type'];

	console.log('Webhook received:', messageType);

	try {
		const body = await request.text();
		let parsedBody: SNSMessage;

		try {
			parsedBody = JSON.parse(body) as SNSMessage;
		} catch {
			parsedBody = { test: true } as any; // Handle non-JSON test requests
		}

		// Handle SNS subscription confirmation
		if (messageType === 'SubscriptionConfirmation') {
			const subscribeURL = parsedBody.SubscribeURL;
			console.log('SNS Subscription confirmation:', subscribeURL);

			return new Response(JSON.stringify({
				message: 'Confirmation received',
				subscribeURL,
				instructions: 'Visit the SubscribeURL to confirm the subscription'
			}), {
				status: 200,
				headers: corsHeaders
			});
		}

		// Handle alarm notifications
		if (messageType === 'Notification') {
			const cloudWatchAlarm: CloudWatchAlarm = JSON.parse(parsedBody.Message);
			console.log('Processing CloudWatch alarm:', cloudWatchAlarm.AlarmName);

			const incidentService = new IncidentService(env);
			const result = await incidentService.processCloudWatchAlarm(cloudWatchAlarm);

			return new Response(JSON.stringify({
				status: 'success',
				result
			}), {
				status: 200,
				headers: corsHeaders
			});
		}

		// Handle test webhooks
		if (parsedBody.test === true) {
			console.log('Processing test webhook');
			const testAlarm: CloudWatchAlarm = {
				AlarmName: 'TEST-Manual-Trigger',
				AlarmDescription: 'Manual test alarm trigger',
				NewStateValue: 'ALARM',
				OldStateValue: 'OK',
				StateChangeTime: new Date().toISOString(),
				Region: env.AWS_REGION || 'us-east-1',
				StateReason: 'Manual test trigger for incident system',
				AWSAccountId: '123456789012'
			};

			const incidentService = new IncidentService(env);
			const result = await incidentService.processCloudWatchAlarm(testAlarm);

			return new Response(JSON.stringify({
				status: 'success',
				result,
				message: 'Test alarm processed'
			}), {
				status: 200,
				headers: corsHeaders
			});
		}

		return new Response(JSON.stringify({ error: 'Invalid webhook request' }), {
			status: 400,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Webhook processing error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}
