# AWS CloudWatch Incident Management API

A Cloudflare Workers-based webhook API that processes AWS CloudWatch alarms and manages incident data. This API serves as the bridge between AWS monitoring infrastructure and mobile incident management applications.

## Architecture

```
AWS CloudWatch → SNS Topic → Cloudflare Workers → D1 Database → Mobile App
```

## Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up) with Workers enabled
- [AWS Account](https://aws.amazon.com/console/) with CloudWatch and SNS access
- [Node.js](https://nodejs.org/) (v18 or later)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## Installation

### 1. Install Dependencies

```bash
npm install -g wrangler
wrangler login
```

### 2. Clone and Setup

```bash
git clone <repository-url>
cd backend-api
```

### 3. Configuration

Create or verify your `wrangler.toml`:

```toml
name = "incident-webhook-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
AWS_REGION = "us-east-1"

[dev]
port = 3000

[[d1_databases]]
binding = "DB"
database_name = "incident-management"
database_id = "your-database-id"
```

## Database Setup

### 1. Create D1 Database

```bash
wrangler d1 create incident-management
```

Copy the database ID from the output and update `wrangler.toml`.

### 2. Initialize Database Schema

```bash
# For local development
wrangler d1 execute incident-management --file=schema.sql --local

# For production
wrangler d1 execute incident-management --file=schema.sql --remote
```

### 3. Database Schema

The database includes the following table:

- `incidents` - Stores incident data with fields for severity, status, AWS alarm details, and timestamps
- Indexes on severity, status, timestamp, and AWS alarm names for performance

## Development

### Local Development

```bash
# Start local development server
wrangler dev

# Server runs on http://localhost:3000
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/incidents` | Get incidents with optional filtering |
| GET | `/api/incidents/stats` | Get incident statistics |
| POST | `/webhook/aws-cloudwatch` | SNS webhook endpoint |
| POST | `/api/test/trigger-incident` | Create test incident |

### Query Parameters

- `timeframe`: `24h`, `7d`, `30d` (default: `24h`)
- `status`: `open`, `investigating`, `resolved`, `all`
- `severity`: `low`, `medium`, `high`, `critical`, `all`

### Example Requests

```bash
# Health check
curl http://localhost:3000/health

# Get critical incidents from last 24h
curl "http://localhost:3000/api/incidents?timeframe=24h&severity=critical"

# Get incident statistics
curl http://localhost:3000/api/incidents/stats

# Create test incident
curl -X POST http://localhost:3000/api/test/trigger-incident
```

## Deployment

### 1. Deploy to Cloudflare

```bash
wrangler deploy
```

### 2. Set Up Remote Database

Ensure your remote database has the schema:

```bash
wrangler d1 execute incident-management --file=schema.sql --remote
```

### 3. Production URL

Your API will be available at:
```
https://incident-webhook-api.your-subdomain.workers.dev
```

## AWS Integration

### 1. SNS Topic Setup

Create an SNS topic for CloudWatch notifications:

```bash
aws sns create-topic --name incident-notifications
```

### 2. Subscribe Webhook

```bash
aws sns subscribe \
    --topic-arn "arn:aws:sns:region:account:incident-notifications" \
    --protocol https \
    --notification-endpoint "https://your-worker-url.workers.dev/webhook/aws-cloudwatch"
```

### 3. CloudWatch Alarms

Configure your CloudWatch alarms to publish to the SNS topic:

```bash
aws cloudwatch put-metric-alarm \
    --alarm-name "HighCPU-WebServer" \
    --alarm-description "High CPU usage alert" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "arn:aws:sns:region:account:incident-notifications"
```

### 4. Test Integration

```bash
# Trigger test alarm
aws cloudwatch set-alarm-state \
    --alarm-name "HighCPU-WebServer" \
    --state-value "ALARM" \
    --state-reason "Manual test trigger"
```

## Monitoring and Debugging

### View Real-time Logs

```bash
wrangler tail incident-webhook-api
```

### Database Queries

```bash
# Query incidents
wrangler d1 execute incident-management --command="SELECT * FROM incidents ORDER BY timestamp DESC LIMIT 10;" --remote

# Check database schema
wrangler d1 execute incident-management --command=".schema" --remote
```

### Common Issues

**Database Connection Errors:**
- Verify `database_id` in `wrangler.toml` matches your D1 database
- Ensure schema has been applied to both local and remote databases

**SNS Subscription Issues:**
- Check webhook endpoint URL is correct and publicly accessible
- Confirm SNS subscription status is "Confirmed" not "Pending"
- Verify CloudWatch alarms are configured to publish to correct SNS topic

**Missing Incidents:**
- Check `wrangler tail` logs for webhook requests
- Verify alarm state changes are triggering SNS notifications
- Test webhook endpoint directly with manual requests

## API Response Examples

### Get Incidents
```json
{
  "incidents": [
    {
      "id": "aws-HighCPU-WebServer-1234567890",
      "title": "HighCPU-WebServer",
      "description": "High CPU usage alert",
      "severity": "high",
      "status": "open",
      "timestamp": "2025-01-20T10:30:00.000Z",
      "reportedBy": "AWS CloudWatch",
      "location": "us-east-1",
      "awsAlarmName": "HighCPU-WebServer",
      "awsConsoleUrl": "https://console.aws.amazon.com/cloudwatch/..."
    }
  ],
  "total": 1,
  "timeframe": "24h"
}
```

### Get Statistics
```json
{
  "total": 15,
  "open": 3,
  "investigating": 2,
  "resolved": 10,
  "severities": {
    "critical": 1,
    "high": 4,
    "medium": 7,
    "low": 3
  }
}
```

## Environment Variables

Configure in `wrangler.toml` under `[vars]`:

- `AWS_REGION`: AWS region for console URLs (default: `us-east-1`)

## Security Considerations

- API endpoints are public by design for SNS webhook access
- Consider implementing webhook signature verification for production
- Monitor usage to prevent abuse
- Use Cloudflare's built-in DDoS protection and rate limiting

## Development Scripts

```bash
# Local development
npm run dev        # or: wrangler dev

# Database management
npm run db:init    # Initialize local database
npm run db:remote  # Initialize remote database

# Deployment
npm run deploy     # Deploy to production
```

## Contributing

1. Test all endpoints locally before deployment
2. Verify both local and remote database schemas
3. Test AWS integration with actual CloudWatch alarms
4. Monitor logs during testing to ensure proper webhook processing

## Support

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
