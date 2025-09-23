// types/index.ts
export interface Env {
	DB: D1Database;
	incident_management: D1Database;
	AWS_REGION: string;
}

export interface Incident {
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

export interface CloudWatchAlarm {
	AlarmName: string;
	AlarmDescription?: string;
	NewStateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
	OldStateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA';
	StateChangeTime: string;
	Region?: string;
	StateReason: string;
	AWSAccountId: string;
}

export interface SNSMessage {
	Type: string;
	MessageId: string;
	TopicArn: string;
	Message: string;
	SubscribeURL?: string;
	Timestamp: string;
	test?: boolean;
}

export interface IncidentFilters {
	timeframe?: '24h' | '7d' | '30d';
	status?: string;
	severity?: string;
}

export interface IncidentStats {
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

export interface LoginResponse {
	id: number;
	email: string;
	password: string;
	firstName: string;
	lastName: string;
	token: string;
}

export interface ApiResponse<T> {
	httpStatus: string;
	message: string;
	data: T;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface JWTPayload {
	sub: string; // user id
	email: string;
	role: 'admin' | 'operator' | 'viewer';
	iat: number;
	exp: number;
}

// User interface for database.service.ts
export interface User {
	id: string;
	email: string;
	passwordHash: string;
	role: 'admin' | 'operator' | 'viewer';
	firstName?: string;
	lastName?: string;
	isActive: boolean;
	isVerified?: boolean;
	phoneNumber?: string;
	createdAt: string;
	updatedAt: string;
	lastLogin?: string;
}
