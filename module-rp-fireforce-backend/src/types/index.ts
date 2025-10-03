// types/index.ts
export interface Env {
	FIREBASE_PROJECT_ID: string;
	FIREBASE_CLIENT_EMAIL: string;
	FIREBASE_PRIVATE_KEY: string;
	DB: D1Database;
	incident_management: D1Database;
	AWS_REGION: string;
}

	export interface Incident {
		id: string;
		title: string;
		description: string;
		severity: 'low' | 'medium' | 'high' | 'critical' | null | undefined;
		status: 'open' | 'investigating' | 'resolved';
		timestamp: string;
		reportedBy: string;
		location: string | null;
		awsAlarmName: string;
		awsAccountId: string;
		stateReason: string;
		metricName: string | null;
		aws_console_url?: string | null;
		resolvedAt?: string;
		createdAt?: string;
		updatedAt?: string;
	}

export interface CreateIncidentTypes {
	title: string;
	description: string;
	location: string | null;
	reportedBy: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	notify_users?: string[];
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
	timeframe?: '24h' | '7d' | '30d' | 'all';
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
	id: string;
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

// POST Incident Comment Payload
export interface IncidentCommentPayload {
	incidentId: string;
	userId: string;
	comment: string;
	createdAt: Date;
}

export interface IncidentCommentResponse {
	id: string;
	incidentId: string;
	userEmail: string;
	userFullname: string | "Full Name Not Found" | null;
	comment: string;
	createdAt: Date;
}

export interface IncidentStatus {
	id: string;
	status: string;
	updatedAt: string | null;
}

export interface OnCallUser {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	role: 'primary' | 'backup' | 'escalation';
}

export interface OnCallTeam {
	id: string;
	name: string;
	timezone: string;
	members: OnCallUser[];
}

export interface OnCallSchedule {
	id: string;
	teamId: string;
	name: string;
	rotationType: 'daily' | 'weekly' | 'biweekly' | 'monthly';
	rotationStart: Date;
	rotationLengthHours: number;
}

export interface CurrentOnCall {
	primary?: OnCallUser;
	backup?: OnCallUser;
	escalation?: OnCallUser[];
	scheduleId: string;
	teamId: string;
	startTime: Date;
	endTime: Date;
}
