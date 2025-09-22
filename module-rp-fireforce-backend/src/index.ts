// Types for the application
interface Env {
	DB: D1Database;
	incident_management: D1Database;
	AWS_REGION: string;
}

interface Incident {
	id: string;
	title: string;
	description: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	status: 'open' | 'investigating' | 'resolved';
	timestamp: string;
	reportedBy: string;
	location: string;
	awsAlarmName: string;
	awsAccountId: string;
	stateReason: string;
	metricName: string;
	awsConsoleUrl: string;
	resolvedAt?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface CloudWatchAlarm {
	AlarmName: string;
	AlarmDescription?: string;
	NewStateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
	OldStateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
	StateChangeTime: string;
	Region?: string;
	StateReason: string;
	AWSAccountId: string;
}

interface SNSMessage {
	Type: string;
	MessageId: string;
	TopicArn: string;
	Message: string;
	SubscribeURL?: string;
	Timestamp: string;
	test?: boolean;
}

interface IncidentFilters {
	timeframe?: '24h' | '7d' | '30d';
	status?: string;
	severity?: string;
}

interface IncidentStats {
	total: number;
	open: number;
	investigating: number;
	resolved: number;
	severities: {
		critical: number;
		high: number;
		medium: number;
		low: number;
	};
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		return await handleRequest(request, env, ctx);
	}
};

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	// CORS headers
	const corsHeaders: Record<string, string> = {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-amz-sns-message-type',
		'Content-Type': 'application/json'
	};

	// Handle CORS preflight
	if (method === 'OPTIONS') {
		return new Response(null, {
			status: 200,
			headers: corsHeaders
		});
	}

	try {
		// Route handlers
		if (path === '/health' && method === 'GET') {
			return handleHealth(corsHeaders);
		}

		if (path === '/api/incidents' && method === 'GET') {
			return handleGetIncidents(url, env, corsHeaders);
		}

		if (path === '/api/incidents/stats' && method === 'GET') {
			return handleGetStats(url, env, corsHeaders);
		}

		if (path === '/webhook/aws-cloudwatch' && method === 'POST') {
			return handleWebhook(request, env, corsHeaders);
		}

		if (path === '/api/test/trigger-incident' && method === 'POST') {
			return handleTestIncident(env, corsHeaders);
		}

		// 404 Not Found
		return new Response(JSON.stringify({ error: 'Not found' }), {
			status: 404,
			headers: corsHeaders
		});

	} catch (error) {
		console.error('Request error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

// Health check handler
async function handleHealth(corsHeaders: Record<string, string>): Promise<Response> {
	const response = {
		status: 'healthy',
		timestamp: new Date().toISOString(),
		environment: 'cloudflare-workers'
	};

	return new Response(JSON.stringify(response), {
		status: 200,
		headers: corsHeaders
	});
}

// Get incidents handler
async function handleGetIncidents(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const params: IncidentFilters = {
		timeframe: (url.searchParams.get('timeframe') as '24h' | '7d' | '30d') || '24h',
		status: url.searchParams.get('status') || undefined,
		severity: url.searchParams.get('severity') || undefined
	};

	try {
		const incidents = await getIncidentsFromDB(params, env);

		const response = {
			incidents,
			total: incidents.length,
			timeframe: params.timeframe
		};

		return new Response(JSON.stringify(response), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error fetching incidents:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch incidents' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

// Get statistics handler
async function handleGetStats(url: URL, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const timeframe = (url.searchParams.get('timeframe') as '24h' | '7d' | '30d') || '24h';

	try {
		const incidents = await getIncidentsFromDB({ timeframe }, env);

		const stats: IncidentStats = {
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

		return new Response(JSON.stringify(stats), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error fetching incident stats:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch incident stats' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

// Webhook handler
async function handleWebhook(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
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

			const result = await processCloudWatchAlarm(cloudWatchAlarm, env);

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

			const result = await processCloudWatchAlarm(testAlarm, env);

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

// Test incident handler
async function handleTestIncident(env: Env, corsHeaders: Record<string, string>): Promise<Response> {
	const testAlarm: CloudWatchAlarm = {
		AlarmName: `TEST-Manual-${Date.now()}`,
		AlarmDescription: 'Manually triggered test incident',
		NewStateValue: 'ALARM',
		OldStateValue: 'OK',
		StateChangeTime: new Date().toISOString(),
		Region: env.AWS_REGION || 'us-east-1',
		StateReason: 'Manual test trigger via API endpoint',
		AWSAccountId: '123456789012'
	};

	try {
		const result = await processCloudWatchAlarm(testAlarm, env);

		return new Response(JSON.stringify({
			message: 'Test incident created',
			result
		}), {
			status: 200,
			headers: corsHeaders
		});
	} catch (error) {
		console.error('Error creating test incident:', error);
		return new Response(JSON.stringify({ error: 'Failed to create test incident' }), {
			status: 500,
			headers: corsHeaders
		});
	}
}

// Database functions using Cloudflare D1
async function getIncidentsFromDB(params: IncidentFilters, env: Env): Promise<Incident[]> {
	let query = 'SELECT * FROM incidents';
	const conditions: string[] = [];
	const queryParams: string[] = [];

	// Filter by timeframe
	if (params.timeframe) {
		const now = new Date();
		let cutoffDate: Date;

		switch (params.timeframe) {
			case '24h':
				cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
				break;
			case '7d':
				cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case '30d':
				cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
		}

		conditions.push('timestamp >= ?');
		queryParams.push(cutoffDate.toISOString());
	}

	// Filter by status
	if (params.status && params.status !== 'all') {
		conditions.push('status = ?');
		queryParams.push(params.status);
	}

	// Filter by severity
	if (params.severity && params.severity !== 'all') {
		conditions.push('severity = ?');
		queryParams.push(params.severity);
	}

	if (conditions.length > 0) {
		query += ' WHERE ' + conditions.join(' AND ');
	}

	query += ' ORDER BY timestamp DESC';

	try {
		// Use the database binding that's available
		const db = env.DB || env.incident_management;
		const { results } = await db.prepare(query).bind(...queryParams).all();
		return (results as Incident[]) || [];
	} catch (error) {
		console.error('Database query error:', error);
		throw error;
	}
}

async function insertIncident(incident: Partial<Incident>, env: Env): Promise<{ id: string; changes: number }> {
	const query = `
        INSERT INTO incidents
        (id, title, description, severity, status, timestamp, reported_by, location,
         aws_alarm_name, aws_account_id, state_reason, metric_name, aws_console_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

	const params = [
		incident.id,
		incident.title,
		incident.description,
		incident.severity,
		incident.status,
		incident.timestamp,
		incident.reportedBy || 'AWS CloudWatch',
		incident.location,
		incident.awsAlarmName,
		incident.awsAccountId,
		incident.stateReason,
		incident.metricName,
		incident.awsConsoleUrl
	];

	try {
		const db = env.DB || env.incident_management;
		const result = await db.prepare(query).bind(...params).run();
		console.log('Incident inserted with ID:', incident.id);
		return { id: incident.id!, changes: result.changes || 1 };
	} catch (error) {
		console.error('Error inserting incident:', error);
		throw error;
	}
}

async function updateIncidentStatus(
	awsAlarmName: string,
	status: string,
	resolvedAt: string,
	env: Env
): Promise<{ changes: number }> {
	const query = `
        UPDATE incidents
        SET status = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
        WHERE aws_alarm_name = ? AND status != 'resolved'
    `;

	try {
		const db = env.DB || env.incident_management;
		const result = await db.prepare(query).bind(status, resolvedAt, awsAlarmName).run();
		return { changes: result.changes || 0 };
	} catch (error) {
		console.error('Error updating incident:', error);
		throw error;
	}
}

// Process CloudWatch alarm
async function processCloudWatchAlarm(
	alarm: CloudWatchAlarm,
	env: Env
): Promise<{ action: string; changes?: number; incident?: Incident; reason?: string }> {
	const isAlarmState = alarm.NewStateValue === 'ALARM';
	const isResolved = alarm.NewStateValue === 'OK';

	if (isResolved) {
		// Update existing incident to resolved
		const result = await updateIncidentStatus(
			alarm.AlarmName,
			'resolved',
			new Date().toISOString(),
			env
		);

		if (result.changes > 0) {
			console.log('Incident resolved for alarm:', alarm.AlarmName);
		}

		return { action: 'resolved', changes: result.changes };
	}

	if (!isAlarmState) {
		return { action: 'ignored', reason: 'Not an ALARM state' };
	}

	// Create new incident
	const incident: Partial<Incident> = {
		id: `aws-${alarm.AlarmName}-${Date.now()}`,
		title: alarm.AlarmName,
		description: alarm.AlarmDescription || 'CloudWatch alarm triggered',
		severity: mapAlarmToSeverity(alarm),
		status: 'open',
		timestamp: new Date(alarm.StateChangeTime).toISOString(),
		reportedBy: 'AWS CloudWatch',
		location: alarm.Region || 'Unknown',
		awsAlarmName: alarm.AlarmName,
		awsAccountId: alarm.AWSAccountId,
		stateReason: alarm.StateReason,
		metricName: 'Unknown',
		awsConsoleUrl: generateAwsConsoleUrl(alarm)
	};

	const result = await insertIncident(incident, env);
	console.log('New incident created:', incident.title);

	return { action: 'created', incident: incident as Incident };
}

function mapAlarmToSeverity(alarm: CloudWatchAlarm): 'low' | 'medium' | 'high' | 'critical' {
	const alarmName = alarm.AlarmName.toLowerCase();

	if (alarmName.includes('critical') || alarmName.includes('outage') || alarmName.includes('down')) {
		return 'critical';
	}
	if (alarmName.includes('high') || alarmName.includes('cpu') || alarmName.includes('error')) {
		return 'high';
	}
	if (alarmName.includes('medium') || alarmName.includes('memory')) {
		return 'medium';
	}
	return 'low';
}

function generateAwsConsoleUrl(alarm: CloudWatchAlarm): string {
	const region = alarm.Region || 'us-east-1';
	return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:alarm/${encodeURIComponent(alarm.AlarmName)}`;
}
