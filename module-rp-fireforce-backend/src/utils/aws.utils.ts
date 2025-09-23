// utils/aws.utils.ts
import { CloudWatchAlarm } from '../types';

export function mapAlarmToSeverity(alarm: CloudWatchAlarm): 'low' | 'medium' | 'high' | 'critical' {
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

export function generateAwsConsoleUrl(alarm: CloudWatchAlarm): string {
	const region = alarm.Region || 'us-east-1';
	return `https://console.aws.amazon.com/cloudwatch/home?region=${region}#alarmsV2:alarm/${encodeURIComponent(alarm.AlarmName)}`;
}
