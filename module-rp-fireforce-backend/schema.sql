-- Complete OnCall Database Schema
-- Drop tables in correct order to handle foreign key dependencies
DROP TABLE IF EXISTS incident_escalations;
DROP TABLE IF EXISTS escalation_chains;
DROP TABLE IF EXISTS oncall_overrides;
DROP TABLE IF EXISTS oncall_assignments;
DROP TABLE IF EXISTS oncall_schedules;
DROP TABLE IF EXISTS escalation_policies;
DROP TABLE IF EXISTS oncall_team_members;
DROP TABLE IF EXISTS oncall_teams;
DROP TABLE IF EXISTS team_members;
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS incident_notifications;
DROP TABLE IF EXISTS incident_comments;
DROP TABLE IF EXISTS push_tokens;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE IF NOT EXISTS users (
									 id            TEXT PRIMARY KEY,
									 email         TEXT NOT NULL UNIQUE,
									 username      TEXT NOT NULL UNIQUE,
									 password_hash TEXT NOT NULL,
									 first_name    TEXT,
									 last_name     TEXT,
									 phone_number  TEXT,
									 role          TEXT CHECK(role IN ('admin','operator','viewer')) DEFAULT 'viewer',
	is_active     BOOLEAN DEFAULT TRUE,
	is_verified   BOOLEAN DEFAULT FALSE,
	last_login    DATETIME,
	created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active   ON users(is_active);

-- TEAMS (general teams table)
CREATE TABLE IF NOT EXISTS teams (
									 id TEXT PRIMARY KEY,
									 name TEXT NOT NULL UNIQUE,
									 description TEXT,
									 is_active BOOLEAN DEFAULT TRUE,
									 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
									 updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active);

-- INCIDENTS
CREATE TABLE IF NOT EXISTS incidents (
										 id              TEXT PRIMARY KEY,
										 title           TEXT NOT NULL,
										 description     TEXT,
										 severity        TEXT CHECK(severity IN ('low','medium','high','critical')) DEFAULT 'medium',
	status          TEXT CHECK(status IN ('open','investigating','resolved')) DEFAULT 'open',
	priority        TEXT CHECK(priority IN ('low','medium','high','critical')) DEFAULT 'medium',
	escalation_level INTEGER DEFAULT 0,
	timestamp       DATETIME NOT NULL,
	reported_by     TEXT DEFAULT 'AWS CloudWatch',
	location        TEXT,
	aws_alarm_name  TEXT,
	aws_account_id  TEXT,
	state_reason    TEXT,
	metric_name     TEXT,
	aws_console_url TEXT,
	resolved_at     DATETIME,
	assigned_to     TEXT REFERENCES users(id),
	resolved_by     TEXT REFERENCES users(id),
	created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_severity     ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_status       ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_priority     ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_escalation  ON incidents(escalation_level);
CREATE INDEX IF NOT EXISTS idx_timestamp    ON incidents(timestamp);
CREATE INDEX IF NOT EXISTS idx_aws_alarm    ON incidents(aws_alarm_name);
CREATE INDEX IF NOT EXISTS idx_assigned_to  ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_resolved_by  ON incidents(resolved_by);

-- USER SESSIONS
CREATE TABLE IF NOT EXISTS user_sessions (
											 id         TEXT PRIMARY KEY,
											 user_id    TEXT NOT NULL REFERENCES users(id),
	token_hash TEXT NOT NULL UNIQUE,
	expires_at DATETIME NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token   ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- INCIDENT COMMENTS
CREATE TABLE IF NOT EXISTS incident_comments (
												 id          TEXT PRIMARY KEY,
												 incident_id TEXT NOT NULL REFERENCES incidents(id),
	user_id     TEXT NOT NULL REFERENCES users(id),
	response    TEXT NOT NULL,
	comment     TEXT NOT NULL,
	created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_comments_incident ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_comments_user     ON incident_comments(user_id);

-- PUSH TOKENS
CREATE TABLE IF NOT EXISTS push_tokens (
										   id          TEXT PRIMARY KEY,
										   token       TEXT NOT NULL UNIQUE,
										   fcm_token   TEXT,
										   device_type TEXT,
										   settings    TEXT,
										   is_active   BOOLEAN DEFAULT TRUE,
										   created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
										   updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_push_tokens_token  ON push_tokens(token);

-- NOTIFICATION LOG
CREATE TABLE IF NOT EXISTS incident_notifications (
													  id           TEXT PRIMARY KEY,
													  incident_id  TEXT NOT NULL REFERENCES incidents(id),
	token        TEXT,
	fcm_token    TEXT,
	kind         TEXT CHECK(kind IN ('alert','all_clear')) NOT NULL,
	delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(incident_id, token, kind),
	UNIQUE(incident_id, fcm_token, kind)
	);
CREATE INDEX IF NOT EXISTS idx_inc_notif_incident_kind ON incident_notifications(incident_id, kind);

-- On-call specific tables

-- On-call teams
CREATE TABLE IF NOT EXISTS oncall_teams (
											id TEXT PRIMARY KEY,
											name TEXT NOT NULL,
											description TEXT,
											timezone TEXT DEFAULT 'UTC',
											is_active BOOLEAN DEFAULT TRUE,
											created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
											updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_oncall_teams_active ON oncall_teams(is_active);

-- Team members with roles
CREATE TABLE IF NOT EXISTS team_members (
											id TEXT PRIMARY KEY,
											team_id TEXT NOT NULL REFERENCES teams(id),
	user_id TEXT NOT NULL REFERENCES users(id),
	role TEXT CHECK(role IN ('member', 'lead', 'manager', 'admin')) DEFAULT 'member',
	is_active BOOLEAN DEFAULT TRUE,
	joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(team_id, user_id)
	);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(role);

-- On-call team members
CREATE TABLE IF NOT EXISTS oncall_team_members (
												   id TEXT PRIMARY KEY,
												   team_id TEXT NOT NULL REFERENCES oncall_teams(id),
	user_id TEXT NOT NULL REFERENCES users(id),
	role TEXT CHECK(role IN ('primary', 'backup', 'escalation')) DEFAULT 'primary',
	order_index INTEGER DEFAULT 0,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(team_id, user_id)
	);
CREATE INDEX IF NOT EXISTS idx_oncall_members_team ON oncall_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_oncall_members_user ON oncall_team_members(user_id);

-- On-call schedules (rotation configurations)
CREATE TABLE IF NOT EXISTS oncall_schedules (
												id TEXT PRIMARY KEY,
												team_id TEXT NOT NULL REFERENCES oncall_teams(id),
	name TEXT NOT NULL,
	rotation_type TEXT CHECK(rotation_type IN ('daily', 'weekly', 'biweekly', 'monthly')) DEFAULT 'weekly',
	rotation_start DATETIME NOT NULL,
	rotation_length_hours INTEGER DEFAULT 168, -- 1 week in hours
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_oncall_schedules_team ON oncall_schedules(team_id);
CREATE INDEX IF NOT EXISTS idx_oncall_schedules_active ON oncall_schedules(is_active);

-- On-call assignments (actual who is on-call when)
CREATE TABLE IF NOT EXISTS oncall_assignments (
												  id TEXT PRIMARY KEY,
												  schedule_id TEXT,
												  user_id TEXT NOT NULL REFERENCES users(id),
	team_id TEXT NOT NULL REFERENCES oncall_teams(id),
	start_time DATETIME NOT NULL,
	end_time DATETIME NOT NULL,
	role TEXT CHECK(role IN ('primary', 'backup', 'escalation')) DEFAULT 'primary',
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_oncall_assignments_team ON oncall_assignments(team_id);
CREATE INDEX IF NOT EXISTS idx_oncall_assignments_user ON oncall_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_oncall_assignments_time ON oncall_assignments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_oncall_assignments_active ON oncall_assignments(is_active);
CREATE INDEX IF NOT EXISTS idx_oncall_assignments_schedule ON oncall_assignments(schedule_id);

-- Override schedules
CREATE TABLE IF NOT EXISTS oncall_overrides (
												id TEXT PRIMARY KEY,
												team_id TEXT NOT NULL REFERENCES teams(id),
	schedule_id TEXT,
	original_user_id TEXT REFERENCES users(id),
	replacement_user_id TEXT NOT NULL REFERENCES users(id),
	user_id TEXT NOT NULL REFERENCES users(id), -- For compatibility
	start_time DATETIME NOT NULL,
	end_time DATETIME NOT NULL,
	role TEXT CHECK(role IN ('primary', 'backup', 'escalation')) DEFAULT 'primary',
	reason TEXT,
	status TEXT CHECK(status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
	created_by TEXT NOT NULL REFERENCES users(id),
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_oncall_overrides_time ON oncall_overrides(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_oncall_overrides_status ON oncall_overrides(status);
CREATE INDEX IF NOT EXISTS idx_oncall_overrides_team ON oncall_overrides(team_id);

-- Escalation policies
CREATE TABLE IF NOT EXISTS escalation_policies (
												   id TEXT PRIMARY KEY,
												   team_id TEXT NOT NULL REFERENCES oncall_teams(id),
	name TEXT NOT NULL,
	steps TEXT NOT NULL, -- JSON array
	timeout_minutes INTEGER DEFAULT 15,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
CREATE INDEX IF NOT EXISTS idx_escalation_policies_team ON escalation_policies(team_id);

-- Escalation chains
CREATE TABLE IF NOT EXISTS escalation_chains (
												 id TEXT PRIMARY KEY,
												 team_id TEXT NOT NULL REFERENCES teams(id),
	user_id TEXT NOT NULL REFERENCES users(id),
	level INTEGER NOT NULL,
	is_active BOOLEAN DEFAULT TRUE,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	UNIQUE(team_id, level)
	);
CREATE INDEX IF NOT EXISTS idx_escalation_chains_team ON escalation_chains(team_id);
CREATE INDEX IF NOT EXISTS idx_escalation_chains_level ON escalation_chains(team_id, level);

-- Incident escalations history
CREATE TABLE IF NOT EXISTS incident_escalations (
													id TEXT PRIMARY KEY,
													incident_id TEXT NOT NULL REFERENCES incidents(id),
	team_id TEXT NOT NULL REFERENCES teams(id),
	escalated_to_user_id TEXT NOT NULL REFERENCES users(id),
	escalated_from_user_id TEXT REFERENCES users(id),
	escalation_level INTEGER NOT NULL,
	reason TEXT NOT NULL,
	priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'high',
	status TEXT CHECK(status IN ('active', 'acknowledged', 'resolved', 'expired')) DEFAULT 'active',
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	acknowledged_at DATETIME,
	resolved_at DATETIME
	);
CREATE INDEX IF NOT EXISTS idx_incident_escalations_incident ON incident_escalations(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_escalations_status ON incident_escalations(status);

-- SEED DATA

-- Seed users
INSERT OR IGNORE INTO users
(id, email, username, password_hash, first_name, last_name, role, is_active, is_verified)
VALUES
('user-1','admin@rocketpartners.io','admin','$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe','Admin','User','admin',TRUE,TRUE),
('user-2','operator@rocketpartners.io','operator1','$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe','John','Doe','operator',TRUE,TRUE),
('user-3','viewer@rocketpartners.io','viewer1','$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe','Jane','Smith','viewer',TRUE,TRUE),
('user-4','kelvin.malabanan@rocketpartners.io','kmalabanan','$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe','Kelvin','Malabanan','admin',TRUE,TRUE);

-- Seed teams
INSERT OR IGNORE INTO teams (id, name, description) VALUES
('team-1', 'Platform Engineering', 'Primary platform and infrastructure team'),
('team-2', 'Application Support', 'Application-level incident response team');

-- Seed incidents
INSERT OR IGNORE INTO incidents
(id, title, description, severity, status, timestamp, location, aws_alarm_name, assigned_to)
VALUES
('test-1','Database Connection Pool Exhausted','Primary database connection pool has reached maximum capacity.','critical','investigating',datetime('now','-2 hours'),'Data Center A','TEST-HighCPU-WebServer', 'user-2'),
('test-2','API Response Time Elevated','Authentication API experiencing 5x normal response times.','high','open',datetime('now','-4 hours'),'API Gateway','TEST-HighErrorRate-API', 'user-2'),
('test-3','Memory Usage Resolved','High memory usage on database server has been resolved.','medium','resolved',datetime('now','-12 hours'),'Database Server','TEST-HighMemory-Database', NULL);

-- Seed on-call teams
INSERT OR IGNORE INTO oncall_teams (id, name, description, timezone) VALUES
('team-1', 'Platform Engineering', 'Primary platform and infrastructure team', 'America/New_York'),
('team-2', 'Application Support', 'Application-level incident response team', 'America/Los_Angeles');

-- Seed team members
INSERT OR IGNORE INTO team_members (id, team_id, user_id, role) VALUES
('tm-1', 'team-1', 'user-1', 'manager'),
('tm-2', 'team-1', 'user-2', 'lead'),
('tm-3', 'team-1', 'user-4', 'member'),
('tm-4', 'team-2', 'user-3', 'lead');

-- Seed on-call team members
INSERT OR IGNORE INTO oncall_team_members (id, team_id, user_id, role, order_index) VALUES
('member-1', 'team-1', 'user-4', 'primary', 0),
('member-2', 'team-1', 'user-2', 'primary', 1),
('member-3', 'team-1', 'user-1', 'backup', 0),
('member-4', 'team-2', 'user-3', 'primary', 0);

-- Seed escalation chains
INSERT OR IGNORE INTO escalation_chains (id, team_id, user_id, level) VALUES
('ec-1', 'team-1', 'user-4', 1),  -- Level 1: Regular member
('ec-2', 'team-1', 'user-2', 2),  -- Level 2: Team lead
('ec-3', 'team-1', 'user-1', 3);  -- Level 3: Manager

-- Seed on-call rotation schedules
INSERT OR IGNORE INTO oncall_schedules (id, team_id, name, rotation_type, rotation_start, rotation_length_hours) VALUES
('schedule-1', 'team-1', 'Weekly Platform Rotation', 'weekly', datetime('now', 'weekday 1'), 168),
('schedule-2', 'team-2', 'Daily App Support', 'daily', datetime('now'), 24);

-- Seed on-call assignments (current week)
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, start_time, end_time, role, is_active) VALUES
('assign-1', 'schedule-1', 'user-4', 'team-1', datetime('now', '-1 day'), datetime('now', '+6 days'), 'primary', 1),
('assign-2', 'schedule-1', 'user-2', 'team-1', datetime('now', '-1 day'), datetime('now', '+6 days'), 'backup', 1),
('assign-3', 'schedule-1', 'user-1', 'team-1', datetime('now', '-1 day'), datetime('now', '+6 days'), 'escalation', 1);

-- Seed on-call assignments (next week)
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, start_time, end_time, role, is_active) VALUES
('assign-4', 'schedule-1', 'user-2', 'team-1', datetime('now', '+6 days'), datetime('now', '+13 days'), 'primary', 1),
('assign-5', 'schedule-1', 'user-4', 'team-1', datetime('now', '+6 days'), datetime('now', '+13 days'), 'backup', 1),
('assign-6', 'schedule-1', 'user-3', 'team-1', datetime('now', '+6 days'), datetime('now', '+13 days'), 'escalation', 1);

-- Seed escalation policies
INSERT OR IGNORE INTO escalation_policies (id, team_id, name, steps, timeout_minutes) VALUES
('escalation-1', 'team-1', 'Platform Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":5},{"step":2,"notify":["backup"],"wait_minutes":10},{"step":3,"notify":["primary","backup"],"wait_minutes":15}]', 15);
