#!/bin/bash
# AWS CloudWatch and SNS Test Setup Script

# Set your region (change as needed)
export AWS_REGION="us-east-1"

# 1. Create SNS Topic for incident notifications
echo "Creating SNS topic..."
TOPIC_ARN=$(aws sns create-topic \
    --name "incident-notifications" \
    --region $AWS_REGION \
    --output text --query 'TopicArn')

echo "SNS Topic created: $TOPIC_ARN"

# 2. Create test CloudWatch alarms that will trigger incidents

# High CPU Alarm (will trigger for testing)
echo "Creating High CPU test alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "TEST-HighCPU-WebServer" \
    --alarm-description "Test alarm for high CPU usage on web server" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 60 \
    --threshold 1 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions "$TOPIC_ARN" \
    --ok-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --tags Key=Environment,Value=Test Key=Severity,Value=critical \
    --region $AWS_REGION

# Memory Usage Alarm
echo "Creating Memory Usage test alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "TEST-HighMemory-Database" \
    --alarm-description "Test alarm for high memory usage on database" \
    --metric-name MemoryUtilization \
    --namespace CWAgent \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions "$TOPIC_ARN" \
    --ok-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --tags Key=Environment,Value=Test Key=Severity,Value=high \
    --region $AWS_REGION

# Disk Space Alarm
echo "Creating Disk Space test alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "TEST-LowDiskSpace-AppServer" \
    --alarm-description "Test alarm for low disk space on application server" \
    --metric-name disk_used_percent \
    --namespace CWAgent \
    --statistic Average \
    --period 300 \
    --threshold 85 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions "$TOPIC_ARN" \
    --ok-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --tags Key=Environment,Value=Test Key=Severity,Value=medium \
    --region $AWS_REGION

# Application Error Rate Alarm  
echo "Creating Application Error Rate test alarm..."
aws cloudwatch put-metric-alarm \
    --alarm-name "TEST-HighErrorRate-API" \
    --alarm-description "Test alarm for high error rate in API" \
    --metric-name ErrorRate \
    --namespace AWS/ApplicationELB \
    --statistic Average \
    --period 60 \
    --threshold 5 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 1 \
    --alarm-actions "$TOPIC_ARN" \
    --ok-actions "$TOPIC_ARN" \
    --treat-missing-data notBreaching \
    --tags Key=Environment,Value=Test Key=Severity,Value=high \
    --region $AWS_REGION

echo "CloudWatch alarms created successfully!"

# 3. Subscribe your webhook endpoint to the SNS topic (replace with your actual endpoint)
echo "Subscribe your webhook endpoint to SNS topic:"
echo "aws sns subscribe \\"
echo "    --topic-arn \"$TOPIC_ARN\" \\"
echo "    --protocol https \\"
echo "    --notification-endpoint \"https://your-backend-api.com/webhook/aws-cloudwatch\" \\"
echo "    --region $AWS_REGION"

# 4. Create custom metric for testing (optional)
echo "Creating test custom metric..."
aws cloudwatch put-metric-data \
    --namespace "TestApp/Performance" \
    --metric-data \
        MetricName=ResponseTime,Value=150,Unit=Milliseconds,Timestamp=$(date -u +%Y-%m-%dT%H:%M:%S) \
        MetricName=RequestCount,Value=100,Unit=Count,Timestamp=$(date -u +%Y-%m-%dT%H:%M:%S) \
    --region $AWS_REGION

echo "Setup complete!"
echo "SNS Topic ARN: $TOPIC_ARN"
echo ""
echo "Next steps:"
echo "1. Deploy your backend API"
echo "2. Subscribe your webhook endpoint to the SNS topic"
echo "3. Test the alarms using the trigger scripts"
