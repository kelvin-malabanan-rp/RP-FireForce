// types/index.ts

// ========================================
// ENVIRONMENT & CONFIGURATION
// ========================================

export interface Env {
	FIREBASE_PROJECT_ID: string;
	FIREBASE_CLIENT_EMAIL: string;
	FIREBASE_PRIVATE_KEY: string;
	SENDER_EMAIL?: string;
	DKIM_PRIVATE_KEY?: string;
	RESEND_API_KEY?: string;
	DB: D1Database;
	incident_management: D1Database;
	AWS_REGION: string;
}

// ========================================
// INCIDENT MANAGEMENT
// ========================================

export interface Incident {
	id: string;
	title: string;
	description: string | null;
	severity: 'low' | 'medium' | 'high' | 'critical' | null | undefined;
	status: 'open' | 'investigating' | 'resolved';
	priority: string;
	escalation_level: number;
	timestamp: string;
	reported_by: string | null;
	location: string | null;
	aws_alarm_name: string | null;
	aws_account_id: string | null;
	state_reason: string | null;
	metric_name: string | null;
	aws_console_url: string | null;
	resolved_at: string | null;
	assigned_to: string | null;
	team_id: string | null;
	resolved_by: string | null;
	created_at: string;
	updated_at: string;
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

// ========================================
// AUTHENTICATION & USERS
// ========================================

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

// ========================================
// ON-CALL MANAGEMENT
// ========================================

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

export interface OnCallTeamOfUser{
	id: string;
	name: string;
	timezone: string;
	fullname: string;
	email: string;
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

// ========================================
// AUDIT TRAIL & LOGGING SYSTEM
// ========================================

export interface DatabaseConnection {
	run(query: string, params?: any[]): Promise<{ changes?: number; lastID?: number }>;
	get(query: string, params?: any[]): Promise<any>;
	all(query: string, params?: any[]): Promise<any[]>;
}

export interface RequestHeaders {
	'x-forwarded-for'?: string;
	'cf-connecting-ip'?: string;
	'user-agent'?: string;
	[key: string]: string | undefined;
}

export interface RequestConnection {
	remoteAddress?: string;
}

export interface AuditRequest {
	headers: RequestHeaders;
	connection?: RequestConnection;
}

export interface NotificationRecord {
	delivered_at: string;
}

export interface ResponseResult {
	responseId: string;
	responseTime: number | null;
}

/**
 * Audit log entry representing a single action/event
 */
export interface AuditLog {
	id: string;
	incident_id: string | null;
	user_id: string | null;
	action: string;
	details: string;
	ip_address: string | null;
	user_agent: string | null;
	created_at: string;
	first_name?: string;
	last_name?: string;
	email?: string;
}

/**
 * Notification record for incident alerts
 */
export interface Notification {
	id: string;
	incident_id: string;
	user_id: string;
	token: string;
	fcm_token: string | null;
	kind: string;
	delivered_at: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	response?: 'acknowledge' | 'decline' | 'resolve' | null;
	response_time?: number | null;
	responded_at?: string | null;
}

/**
 * Comment on an incident
 */
export interface Comment {
	id: string;
	incident_id: string;
	user_id: string;
	response: string | null;
	comment: string;
	created_at: string;
	first_name?: string;
	last_name?: string;
	email?: string;
}

/**
 * Escalation record for incident escalations
 */
export interface Escalation {
	id: string;
	incident_id: string;
	team_id: string;
	escalated_to_user_id: string;
	escalated_from_user_id: string | null;
	escalation_level: number;
	reason: string | null;
	priority: string | null;
	status: string;
	created_at: string;
	acknowledged_at: string | null;
	resolved_at: string | null;
	escalated_to_first_name?: string;
	escalated_to_last_name?: string;
	escalated_from_first_name?: string;
	escalated_from_last_name?: string;
}

/**
 * Summary statistics for incident audit
 */
export interface AuditSummary {
	total_notifications: number;
	users_notified: number;
	total_comments: number;
	total_escalations: number;
	responses: {
		acknowledged: number;
		declined: number;
		resolved: number;
		pending: number;
	};
	avg_response_time: number;
}

/**
 * Complete audit trail for an incident including all related records
 */
export interface FullIncidentAudit {
	incident: Incident;
	audit_logs: AuditLog[];
	notifications: Notification[];
	comments: Comment[];
	escalations: Escalation[];
	summary: AuditSummary;
}

/**
 * Statistics about notifications
 */
export interface NotificationStats {
	total_notifications: number;
	acknowledged_count: number;
	declined_count: number;
	resolved_count: number;
	pending_count: number;
	avg_response_time: number | null;
	min_response_time: number | null;
	max_response_time: number | null;
}

/**
 * Statistics about incidents (used in audit stats)
 */
export interface IncidentStats {
	total_incidents: number;
	open_incidents: number;
	investigating_incidents: number;
	resolved_incidents: number;
	avg_resolution_time_seconds: number | null;
}

/**
 * Top responder information
 */
export interface TopResponder {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	response_count: number;
	avg_response_time: number | null;
}

/**
 * Comprehensive audit statistics
 */
export interface AuditStats {
	notification_stats: NotificationStats;
	incident_stats: IncidentStats;
	top_responders: TopResponder[];
	period: {
		start: string | null;
		end: string | null;
	};
}

/**
 * Data structure for CSV export
 */
export interface AuditDataForCSV {
	audit_logs: AuditLog[];
	notifications: Notification[];
	comments: Comment[];
	escalations: Escalation[];
}

/**
 * Flexible JSON structure for audit log details
 */
export interface AuditLogDetails {
	[key: string]: any;
}

/**
 * Payload for creating a new audit log
 */
export interface AuditLogPayload {
	action: string;
	incidentId?: string | null;
	userId?: string | null;
	description?: string | null;
	details?: AuditLogDetails;
	oldValue?: Record<string, any> | null;
	newValue?: Record<string, any> | null;
	metadata?: Record<string, any> | null;
}

/**
 * Response structure for audit log operations
 */
export interface AuditLogResponse {
	id: string;
	incident_id?: string | null;
	user_id?: string | null;
	action: string;
	description?: string | null;
	details?: AuditLogDetails;
	old_value?: Record<string, any> | null;
	new_value?: Record<string, any> | null;
	metadata?: Record<string, any> | null;
	ip_address?: string | null;
	user_agent?: string | null;
	created_at: string;
	first_name?: string;
	last_name?: string;
	email?: string;
}

/**
 * Filters for querying audit logs
 */
export interface AuditFilters {
	incidentId?: string;
	userId?: string;
	action?: string;
	startDate?: string;
	endDate?: string;
	limit?: number;
	offset?: number;
}
