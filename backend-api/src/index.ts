export default {
    async fetch(request, env, ctx) {
        return await handleRequest(request, env, ctx);
    }
};

async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS headers
    const corsHeaders = {
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
async function handleHealth(corsHeaders) {
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
async function handleGetIncidents(url, env, corsHeaders) {
    const params = {
        timeframe: url.searchParams.get('timeframe') || '24h',
        status: url.searchParams.get('status'),
        severity: url.searchParams.get('severity')
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
        return new Response(JSON.stringify({ error: 'Failed to fetch incidents' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// Get statistics handler
async function handleGetStats(url, env, corsHeaders) {
    const timeframe = url.searchParams.get('timeframe') || '24h';

    try {
        const incidents = await getIncidentsFromDB({ timeframe }, env);

        const stats = {
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
        return new Response(JSON.stringify({ error: 'Failed to fetch incident stats' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// Webhook handler
async function handleWebhook(request, env, corsHeaders) {
    const headers = Object.fromEntries(request.headers);
    const messageType = headers['x-amz-sns-message-type'];

    console.log('Webhook received:', messageType);

    try {
        const body = await request.text();
        let parsedBody;

        try {
            parsedBody = JSON.parse(body);
        } catch {
            parsedBody = { test: true }; // Handle non-JSON test requests
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
            const cloudWatchAlarm = JSON.parse(parsedBody.Message);
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
            const testAlarm = {
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
async function handleTestIncident(env, corsHeaders) {
    const testAlarm = {
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
        return new Response(JSON.stringify({ error: 'Failed to create test incident' }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

// Database functions using Cloudflare D1
async function getIncidentsFromDB(params, env) {
    let query = 'SELECT * FROM incidents';
    const conditions = [];
    const queryParams = [];

    // Filter by timeframe
    if (params.timeframe) {
        const now = new Date();
        let cutoffDate;

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

        if (cutoffDate) {
            conditions.push('timestamp >= ?');
            queryParams.push(cutoffDate.toISOString());
        }
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
        const { results } = await env.DB.prepare(query).bind(...queryParams).all();
        return results || [];
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

async function insertIncident(incident, env) {
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
        const result = await env.DB.prepare(query).bind(...params).run();
        console.log('Incident inserted with ID:', incident.id);
        return { id: incident.id, changes: result.changes };
    } catch (error) {
        console.error('Error inserting incident:', error);
        throw error;
    }
}

async function updateIncidentStatus(awsAlarmName, status, resolvedAt, env) {
    const query = `
    UPDATE incidents
    SET status = ?, resolved_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE aws_alarm_name = ? AND status != 'resolved'
  `;

    try {
        const result = await env.DB.prepare(query).bind(status, resolvedAt, awsAlarmName).run();
        return { changes: result.changes };
    } catch (error) {
        console.error('Error updating incident:', error);
        throw error;
    }
}

// Process CloudWatch alarm
async function processCloudWatchAlarm(alarm, env) {
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
    const incident = {
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

    return { action: 'created', incident };
}

function mapAlarmToSeverity(alarm) {
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

function generateAwsConsoleUrl(alarm) {
    const region = alarm.Region || 'us-east-1';
    return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:alarm/${encodeURIComponent(alarm.AlarmName)}`;
}
