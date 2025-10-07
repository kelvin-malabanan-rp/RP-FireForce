/* ======= DROP (order matters - drop dependent tables first) ======= */
DROP TABLE IF EXISTS notification_responses;
DROP TABLE IF EXISTS audit_log;
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
DROP TABLE IF EXISTS push_token_user_assoc;
DROP TABLE IF EXISTS push_tokens;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS incidents;
DROP TABLE IF EXISTS users;

/* ======= CORE ======= */

CREATE TABLE users (
					   id            TEXT PRIMARY KEY,
					   email         TEXT UNIQUE,
					   username      TEXT UNIQUE,
					   password_hash TEXT,
					   first_name    TEXT,
					   last_name     TEXT,
					   phone_number  TEXT,
					   role          TEXT,
					   is_active     INTEGER,
					   is_verified   INTEGER,
					   last_login    DATETIME,
					   created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
					   updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);

CREATE TABLE incidents (
						   id               TEXT PRIMARY KEY,
						   title            TEXT,
						   description      TEXT,
						   severity         TEXT,
						   status           TEXT,
						   priority         TEXT,
						   escalation_level INTEGER,
						   timestamp        DATETIME,
						   reported_by      TEXT,
						   location         TEXT,
						   aws_alarm_name   TEXT,
						   aws_account_id   TEXT,
						   state_reason     TEXT,
						   metric_name      TEXT,
						   aws_console_url  TEXT,
						   resolved_at      DATETIME,
						   assigned_to      TEXT,
						   team_id          TEXT,
						   resolved_by      TEXT,
						   created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
						   updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_severity           ON incidents(severity);
CREATE INDEX idx_status             ON incidents(status);
CREATE INDEX idx_priority           ON incidents(priority);
CREATE INDEX idx_escalation         ON incidents(escalation_level);
CREATE INDEX idx_timestamp          ON incidents(timestamp);
CREATE INDEX idx_aws_alarm          ON incidents(aws_alarm_name);
CREATE INDEX idx_assigned_to        ON incidents(assigned_to);
CREATE INDEX idx_resolved_by        ON incidents(resolved_by);
CREATE INDEX idx_incidents_team_id  ON incidents(team_id);

CREATE TABLE user_sessions (
							   id         TEXT PRIMARY KEY,
							   user_id    TEXT,
							   token_hash TEXT UNIQUE,
							   expires_at DATETIME,
							   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sessions_user    ON user_sessions(user_id);
CREATE INDEX idx_sessions_token   ON user_sessions(token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

CREATE TABLE incident_comments (
								   id          TEXT PRIMARY KEY,
								   incident_id TEXT,
								   user_id     TEXT,
								   response    TEXT,
								   comment     TEXT,
								   created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_incident ON incident_comments(incident_id);
CREATE INDEX idx_comments_user     ON incident_comments(user_id);

CREATE TABLE push_tokens (
							 id          TEXT PRIMARY KEY,
							 token       TEXT UNIQUE,
							 fcm_token   TEXT,
							 device_type TEXT,
							 settings    TEXT,
							 is_active   INTEGER,
							 created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
							 updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_push_tokens_active ON push_tokens(is_active);
CREATE INDEX idx_push_tokens_token  ON push_tokens(token);

CREATE TABLE push_token_user_assoc (
									   push_token_id TEXT NOT NULL,
									   user_id       TEXT NOT NULL,
									   created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
									   PRIMARY KEY (push_token_id, user_id),
									   FOREIGN KEY (push_token_id) REFERENCES push_tokens(id) ON DELETE CASCADE,
									   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_push_token_user_assoc_user  ON push_token_user_assoc(user_id);
CREATE INDEX idx_push_token_user_assoc_token ON push_token_user_assoc(push_token_id);

CREATE TABLE incident_notifications (
										id               TEXT PRIMARY KEY,
										incident_id      TEXT NOT NULL,
										user_id          TEXT,
										token            TEXT,
										fcm_token        TEXT,
										kind             TEXT NOT NULL,
										status           TEXT DEFAULT 'sent',
										response         TEXT,
										response_time    REAL,
										delivered_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
										read_at          DATETIME,
										responded_at     DATETIME,
										delivery_error   TEXT,
										escalation_level INTEGER DEFAULT 0,
										FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
										FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_inc_notif_incident_kind ON incident_notifications(incident_id, kind);
CREATE INDEX idx_inc_notif_user          ON incident_notifications(user_id);
CREATE INDEX idx_inc_notif_status        ON incident_notifications(status);

/* ======= ON-CALL ======= */
CREATE TABLE oncall_teams (
							  id          TEXT PRIMARY KEY,
							  name        TEXT,
							  description TEXT,
							  timezone    TEXT,
							  is_active   INTEGER,
							  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
							  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_teams_active ON oncall_teams(is_active);

CREATE TABLE oncall_team_members (
									 id          TEXT PRIMARY KEY,
									 team_id     TEXT,
									 user_id     TEXT,
									 role        TEXT,
									 order_index INTEGER,
									 is_active   INTEGER,
									 created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_oncall_members_team_user ON oncall_team_members(team_id, user_id);
CREATE INDEX idx_oncall_members_team ON oncall_team_members(team_id);
CREATE INDEX idx_oncall_members_user ON oncall_team_members(user_id);

CREATE TABLE oncall_schedules (
								  id                    TEXT PRIMARY KEY,
								  team_id               TEXT,
								  name                  TEXT,
								  rotation_type         TEXT,
								  rotation_start        DATETIME,
								  rotation_length_hours INTEGER,
								  is_active             INTEGER,
								  created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
								  updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_schedules_team   ON oncall_schedules(team_id);
CREATE INDEX idx_oncall_schedules_active ON oncall_schedules(is_active);

CREATE TABLE oncall_assignments (
									id          TEXT PRIMARY KEY,
									schedule_id TEXT,
									user_id     TEXT,
									team_id     TEXT,
									start_time  DATETIME,
									end_time    DATETIME,
									role        TEXT,
									is_active   INTEGER,
									created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_assignments_team     ON oncall_assignments(team_id);
CREATE INDEX idx_oncall_assignments_user     ON oncall_assignments(user_id);
CREATE INDEX idx_oncall_assignments_time     ON oncall_assignments(start_time, end_time);
CREATE INDEX idx_oncall_assignments_active   ON oncall_assignments(is_active);
CREATE INDEX idx_oncall_assignments_schedule ON oncall_assignments(schedule_id);

CREATE TABLE oncall_overrides (
								  id                  TEXT PRIMARY KEY,
								  team_id             TEXT,
								  schedule_id         TEXT,
								  original_user_id    TEXT,
								  replacement_user_id TEXT,
								  user_id             TEXT,
								  start_time          DATETIME,
								  end_time            DATETIME,
								  role                TEXT,
								  reason              TEXT,
								  status              TEXT,
								  created_by          TEXT,
								  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_overrides_time   ON oncall_overrides(start_time, end_time);
CREATE INDEX idx_oncall_overrides_status ON oncall_overrides(status);
CREATE INDEX idx_oncall_overrides_team   ON oncall_overrides(team_id);

CREATE TABLE escalation_policies (
									 id              TEXT PRIMARY KEY,
									 team_id         TEXT,
									 name            TEXT,
									 steps           TEXT,
									 timeout_minutes INTEGER,
									 is_active       INTEGER,
									 created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_escalation_policies_team ON escalation_policies(team_id);

CREATE TABLE escalation_chains (
								   id         TEXT PRIMARY KEY,
								   team_id    TEXT,
								   user_id    TEXT,
								   level      INTEGER,
								   is_active  INTEGER,
								   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_escalation_chain_team_level ON escalation_chains(team_id, level);
CREATE INDEX idx_escalation_chains_team  ON escalation_chains(team_id);
CREATE INDEX idx_escalation_chains_level ON escalation_chains(team_id, level);

CREATE TABLE incident_escalations (
									  id                     TEXT PRIMARY KEY,
									  incident_id            TEXT,
									  team_id                TEXT,
									  escalated_to_user_id   TEXT,
									  escalated_from_user_id TEXT,
									  escalation_level       INTEGER,
									  reason                 TEXT,
									  priority               TEXT,
									  status                 TEXT,
									  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
									  acknowledged_at        DATETIME,
									  resolved_at            DATETIME
);
CREATE INDEX idx_incident_escalations_incident ON incident_escalations(incident_id);
CREATE INDEX idx_incident_escalations_status   ON incident_escalations(status);

/* ======= AUDIT TRAIL TABLES ======= */

CREATE TABLE audit_log (
						   id          TEXT PRIMARY KEY,
						   incident_id TEXT,
						   user_id     TEXT,
						   action      TEXT NOT NULL,
						   description TEXT,
						   details     TEXT,
						   metadata    TEXT,
						   created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
						   FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
						   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_audit_log_incident ON audit_log(incident_id);
CREATE INDEX idx_audit_log_user     ON audit_log(user_id);
CREATE INDEX idx_audit_log_action   ON audit_log(action);
CREATE INDEX idx_audit_log_created  ON audit_log(created_at);

CREATE TABLE notification_responses (
										id              TEXT PRIMARY KEY,
										notification_id TEXT NOT NULL,
										incident_id     TEXT NOT NULL,
										user_id         TEXT NOT NULL,
										response        TEXT NOT NULL,
										response_time   REAL,
										responded_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
										ip_address      TEXT,
										user_agent      TEXT,
										FOREIGN KEY (notification_id) REFERENCES incident_notifications(id) ON DELETE CASCADE,
										FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
										FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_notif_responses_incident     ON notification_responses(incident_id);
CREATE INDEX idx_notif_responses_user         ON notification_responses(user_id);
CREATE INDEX idx_notif_responses_notification ON notification_responses(notification_id);

/* ======= SEED DATA ======= */

INSERT OR IGNORE INTO users (id, email, username, password_hash, first_name, last_name, role, is_active, is_verified)
VALUES
('user-1', 'admin@rocketpartners.io', 'admin', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Admin', 'User', 'admin', 1, 1),
('user-2', 'sarah.chen@rocketpartners.io', 'schen', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Sarah', 'Chen', 'operator', 1, 1),
('user-3', 'marcus.williams@rocketpartners.io', 'mwilliams', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Marcus', 'Williams', 'operator', 1, 1),
('user-4', 'kelvin.malabanan@rocketpartners.io', 'kmalabanan', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Kelvin', 'Malabanan', 'admin', 1, 1),
('user-5', 'priya.patel@rocketpartners.io', 'ppatel', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Priya', 'Patel', 'operator', 1, 1),
('user-6', 'james.rodriguez@rocketpartners.io', 'jrodriguez', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'James', 'Rodriguez', 'operator', 1, 1),
('user-7', 'emily.nakamura@rocketpartners.io', 'enakamura', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Emily', 'Nakamura', 'operator', 1, 1),
('user-8', 'david.oconnor@rocketpartners.io', 'doconnor', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'David', 'OConnor', 'operator', 1, 1),
('user-9', 'lisa.anderson@rocketpartners.io', 'landerson', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Lisa', 'Anderson', 'operator', 1, 1),
('user-10', 'alex.kim@rocketpartners.io', 'akim', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Alex', 'Kim', 'operator', 1, 1),
('user-11', 'keannu.brillante@rocketpartners.io', 'kbrillante', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Keannu', 'Brillante', 'admin', 1, 1),
('user-12', 'sean.ticzon@rocketpartners.io', 'sticzon', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Sean', 'Ticzon', 'admin', 1, 1);

INSERT OR IGNORE INTO incidents (id, title, description, severity, status, priority, escalation_level, timestamp, location, aws_alarm_name, assigned_to)
VALUES
('test-1', 'Database Connection Pool Exhausted', 'Primary database connection pool has reached maximum capacity.', 'critical', 'investigating', 'critical', 1, datetime('now', '-2 hours'), 'Data Center A', 'TEST-HighCPU-WebServer', 'user-2'),
('test-2', 'API Response Time Elevated', 'Authentication API experiencing 5x normal response times.', 'high', 'open', 'high', 0, datetime('now', '-4 hours'), 'API Gateway', 'TEST-HighErrorRate-API', 'user-5'),
('test-3', 'Memory Usage Resolved', 'High memory usage on database server has been resolved.', 'medium', 'resolved', 'medium', 0, datetime('now', '-12 hours'), 'Database Server', 'TEST-HighMemory-Database', NULL);

INSERT OR IGNORE INTO oncall_teams (id, name, description, timezone, is_active)
VALUES
('team-1', 'Platform Engineering', 'Primary platform and infrastructure team', 'America/New_York', 1),
('team-2', 'Application Support', 'Application-level incident response team', 'America/Los_Angeles', 1),
('team-3', 'Database Operations', 'Database reliability and performance team', 'America/Chicago', 1),
('team-4', 'Network Operations', 'Network infrastructure and connectivity team', 'America/Denver', 1),
('team-5', 'Security Response', 'Security incidents and threat response team', 'America/New_York', 1),
('team-6', 'DevOps', 'CI/CD pipeline and deployment automation team', 'America/Los_Angeles', 1),
('team-7', 'API Services', 'API gateway and microservices team', 'America/New_York', 1),
('team-8', 'Frontend Engineering', 'Client-side application and user interface team', 'America/Los_Angeles', 1),
('team-9', 'Data Engineering', 'Data pipeline and analytics infrastructure team', 'America/Chicago', 1),
('team-10', 'Cloud Infrastructure', 'Cloud platform and resource management team', 'America/New_York', 1);

INSERT OR IGNORE INTO oncall_team_members (id, team_id, user_id, role, order_index, is_active)
VALUES
('member-1', 'team-1', 'user-4', 'primary', 0, 1),
('member-2', 'team-1', 'user-2', 'primary', 1, 1),
('member-3', 'team-1', 'user-3', 'backup', 2, 1),
('member-4', 'team-1', 'user-5', 'backup', 3, 1),
('member-5', 'team-1', 'user-1', 'escalation', 4, 1),
('member-6', 'team-2', 'user-6', 'primary', 0, 1),
('member-7', 'team-2', 'user-7', 'primary', 1, 1),
('member-8', 'team-2', 'user-8', 'backup', 2, 1),
('member-9', 'team-2', 'user-9', 'backup', 3, 1),
('member-10', 'team-2', 'user-10', 'escalation', 4, 1),
('member-11', 'team-3', 'user-11', 'primary', 0, 1),
('member-12', 'team-3', 'user-2', 'backup', 1, 1),
('member-13', 'team-3', 'user-5', 'escalation', 2, 1),
('member-14', 'team-4', 'user-3', 'primary', 0, 1),
('member-15', 'team-4', 'user-6', 'backup', 1, 1),
('member-16', 'team-5', 'user-1', 'primary', 0, 1),
('member-17', 'team-5', 'user-4', 'backup', 1, 1),
('member-18', 'team-5', 'user-12', 'primary', 2, 1);

INSERT OR IGNORE INTO escalation_chains (id, team_id, user_id, level, is_active)
VALUES
('ec-1', 'team-1', 'user-4', 1, 1),
('ec-2', 'team-1', 'user-2', 2, 1),
('ec-3', 'team-1', 'user-1', 3, 1),
('ec-4', 'team-2', 'user-6', 1, 1),
('ec-5', 'team-2', 'user-7', 2, 1),
('ec-6', 'team-2', 'user-10', 3, 1),
('ec-7', 'team-3', 'user-11', 1, 1),
('ec-8', 'team-3', 'user-2', 2, 1),
('ec-9', 'team-3', 'user-5', 3, 1),
('ec-10', 'team-5', 'user-12', 1, 1);

INSERT OR IGNORE INTO oncall_schedules (id, team_id, name, rotation_type, rotation_start, rotation_length_hours, is_active)
VALUES
('schedule-1', 'team-1', 'Weekly Platform Rotation', 'weekly', datetime('now', 'weekday 1'), 168, 1),
('schedule-2', 'team-2', 'Daily App Support', 'daily', datetime('now'), 24, 1),
('schedule-3', 'team-3', 'Database Ops Weekly', 'weekly', datetime('now', 'weekday 1'), 168, 1);

INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, start_time, end_time, role, is_active)
VALUES
('assign-1', 'schedule-1', 'user-4', 'team-1', datetime('now', '-1 day'), datetime('now', '+6 days'), 'primary', 1),
('assign-2', 'schedule-1', 'user-2', 'team-1', datetime('now', '-1 day'), datetime('now', '+6 days'), 'backup', 1),
('assign-3', 'schedule-1', 'user-1', 'team-1', datetime('now', '-1 day'), datetime('now', '+6 days'), 'escalation', 1),
('assign-4', 'schedule-1', 'user-2', 'team-1', datetime('now', '+6 days'), datetime('now', '+13 days'), 'primary', 1),
('assign-5', 'schedule-1', 'user-4', 'team-1', datetime('now', '+6 days'), datetime('now', '+13 days'), 'backup', 1),
('assign-6', 'schedule-1', 'user-3', 'team-1', datetime('now', '+6 days'), datetime('now', '+13 days'), 'escalation', 1),
('assign-7', 'schedule-2', 'user-6', 'team-2', datetime('now', '-1 day'), datetime('now'), 'primary', 1),
('assign-8', 'schedule-2', 'user-8', 'team-2', datetime('now', '-1 day'), datetime('now'), 'backup', 1),
('assign-9', 'schedule-2', 'user-7', 'team-2', datetime('now'), datetime('now', '+1 day'), 'primary', 1),
('assign-10', 'schedule-2', 'user-9', 'team-2', datetime('now'), datetime('now', '+1 day'), 'backup', 1),
('assign-11', 'schedule-3', 'user-11', 'team-3', datetime('now', '-1 day'), datetime('now', '+6 days'), 'primary', 1),
('assign-12', 'schedule-3', 'user-2', 'team-3', datetime('now', '-1 day'), datetime('now', '+6 days'), 'backup', 1),
('assign-13', 'schedule-3', 'user-12', 'team-5', datetime('now', '-1 day'), datetime('now', '+6 days'), 'primary', 1);

INSERT OR IGNORE INTO escalation_policies (id, team_id, name, steps, timeout_minutes, is_active)
VALUES
('escalation-1', 'team-1', 'Platform Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":5},{"step":2,"notify":["backup"],"wait_minutes":10},{"step":3,"notify":["primary","backup"],"wait_minutes":15}]', 15, 1),
('escalation-2', 'team-2', 'App Support Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":3},{"step":2,"notify":["backup"],"wait_minutes":7},{"step":3,"notify":["escalation"],"wait_minutes":10}]', 10, 1),
('escalation-3', 'team-3', 'Database Ops Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":5},{"step":2,"notify":["backup"],"wait_minutes":10},{"step":3,"notify":["escalation"],"wait_minutes":15}]', 15, 1);
