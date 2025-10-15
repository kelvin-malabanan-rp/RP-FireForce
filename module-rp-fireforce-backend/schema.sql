/* ======= DROP (order matters - drop dependent tables first) ======= */
DROP TABLE IF EXISTS notification_responses;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS incident_reminders;
DROP TABLE IF EXISTS incident_reminder_config;
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

/* ======= REMINDER SYSTEM ======= */

CREATE TABLE incident_reminder_config (
										  incident_id      TEXT PRIMARY KEY,
										  max_reminders    INTEGER DEFAULT 3,
										  interval_seconds INTEGER DEFAULT 10,
										  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
										  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);
CREATE INDEX idx_reminder_config_incident ON incident_reminder_config(incident_id);

CREATE TABLE incident_reminders (
									id                TEXT PRIMARY KEY,
									incident_id       TEXT NOT NULL,
									reminder_number   INTEGER NOT NULL,
									sent_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
									recipients_count  INTEGER DEFAULT 0,
									FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);
CREATE INDEX idx_reminders_incident ON incident_reminders(incident_id);
CREATE INDEX idx_reminders_number   ON incident_reminders(incident_id, reminder_number);
CREATE INDEX idx_reminders_sent_at  ON incident_reminders(sent_at);

/* ======= ON-CALL SYSTEM ======= */

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

-- ✅ SIMPLIFIED: Just an array of individual dates
CREATE TABLE oncall_assignments (
									id          TEXT PRIMARY KEY,
									schedule_id TEXT,
									user_id     TEXT,
									team_id     TEXT,
									dates       TEXT NOT NULL,  -- ✅ JSON array: ["2025-10-15","2025-10-16","2025-10-17"]
									role        TEXT,
									is_active   INTEGER,
									created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
									FOREIGN KEY (schedule_id) REFERENCES oncall_schedules(id) ON DELETE CASCADE,
									FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
									FOREIGN KEY (team_id) REFERENCES oncall_teams(id) ON DELETE CASCADE
);
CREATE INDEX idx_oncall_assignments_team     ON oncall_assignments(team_id);
CREATE INDEX idx_oncall_assignments_user     ON oncall_assignments(user_id);
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
									  triggered_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
									  created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
									  acknowledged_at        DATETIME,
									  resolved_at            DATETIME
);
CREATE INDEX idx_incident_escalations_incident     ON incident_escalations(incident_id);
CREATE INDEX idx_incident_escalations_status       ON incident_escalations(status);
CREATE INDEX idx_incident_escalations_triggered_at ON incident_escalations(triggered_at);

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
    ('test-1', 'Database Connection Pool Exhausted', 'Primary database connection pool has reached maximum capacity.', 'critical', 'investigating', 'critical', 1, datetime('now', '-2 hours'), 'Data Center A', 'TEST-HighCPU-WebServer', 'user-11'),
    ('test-2', 'API Response Time Elevated', 'Authentication API experiencing 5x normal response times.', 'high', 'open', 'high', 0, datetime('now', '-4 hours'), 'API Gateway', 'TEST-HighErrorRate-API', 'user-4'),
    ('test-3', 'Memory Usage Resolved', 'High memory usage on database server has been resolved.', 'medium', 'resolved', 'medium', 0, datetime('now', '-12 hours'), 'Database Server', 'TEST-HighMemory-Database', NULL);

INSERT OR IGNORE INTO oncall_teams (id, name, description, timezone, is_active)
VALUES
    ('team-1', 'Platform Engineering', 'Primary platform and infrastructure team', 'America/New_York', 1),
    ('team-2', 'Application Support', 'Application-level incident response team', 'America/Los_Angeles', 1),
    ('team-3', 'Database Operations', 'Database reliability and performance team', 'America/Chicago', 1),
    ('team-4', 'Network Operations', 'Network infrastructure and connectivity team', 'America/Denver', 1),
    ('team-5', 'Security Response', 'Security incidents and threat response team', 'America/New_York', 1);

INSERT OR IGNORE INTO oncall_team_members (id, team_id, user_id, role, order_index, is_active)
VALUES
-- ✅ TEAM-1: Keannu (primary), Kelvin (backup), Sean (escalation)
    ('member-1', 'team-1', 'user-11', 'primary', 0, 1),    -- Keannu Brillante
    ('member-2', 'team-1', 'user-4', 'backup', 1, 1),      -- Kelvin Malabanan
    ('member-3', 'team-1', 'user-12', 'escalation', 2, 1), -- Sean Ticzon

-- TEAM-2
    ('member-6', 'team-2', 'user-6', 'primary', 0, 1),
    ('member-7', 'team-2', 'user-7', 'primary', 1, 1),
    ('member-8', 'team-2', 'user-8', 'backup', 2, 1),
    ('member-9', 'team-2', 'user-9', 'backup', 3, 1),
    ('member-10', 'team-2', 'user-10', 'escalation', 4, 1),

-- TEAM-3
    ('member-11', 'team-3', 'user-2', 'primary', 0, 1),
    ('member-12', 'team-3', 'user-5', 'backup', 1, 1),
    ('member-13', 'team-3', 'user-1', 'escalation', 2, 1);

INSERT OR IGNORE INTO escalation_chains (id, team_id, user_id, level, is_active)
VALUES
-- ✅ TEAM-1: Level 1 → Keannu, Level 2 → Kelvin, Level 3 → Sean
    ('ec-1', 'team-1', 'user-11', 1, 1),  -- Keannu
    ('ec-2', 'team-1', 'user-4', 2, 1),   -- Kelvin
    ('ec-3', 'team-1', 'user-12', 3, 1),  -- Sean

-- TEAM-2
    ('ec-4', 'team-2', 'user-6', 1, 1),
    ('ec-5', 'team-2', 'user-7', 2, 1),
    ('ec-6', 'team-2', 'user-10', 3, 1),

-- TEAM-3
    ('ec-7', 'team-3', 'user-2', 1, 1),
    ('ec-8', 'team-3', 'user-5', 2, 1),
    ('ec-9', 'team-3', 'user-1', 3, 1);

INSERT OR IGNORE INTO oncall_schedules (id, team_id, name, rotation_type, rotation_start, rotation_length_hours, is_active)
VALUES
    ('schedule-1', 'team-1', 'October 2025 Platform Schedule', 'manual', datetime('now'), 0, 1),
    ('schedule-2', 'team-2', 'October 2025 App Support', 'manual', datetime('now'), 0, 1),
    ('schedule-3', 'team-3', 'October 2025 Database Ops', 'manual', datetime('now'), 0, 1);

-- ✅ TEAM-1: Keannu (primary) works weekdays Mon-Fri in October
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-1', 'schedule-1', 'user-11', 'team-1',
        '["2025-10-13","2025-10-14","2025-10-15","2025-10-16","2025-10-17","2025-10-20","2025-10-21","2025-10-22","2025-10-23","2025-10-24","2025-10-27","2025-10-28","2025-10-29","2025-10-30","2025-10-31"]',
        'primary', 1);

-- ✅ TEAM-1: Kelvin (backup) works weekends Sat-Sun in October
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-2', 'schedule-1', 'user-4', 'team-1',
        '["2025-10-11","2025-10-12","2025-10-18","2025-10-19","2025-10-25","2025-10-26"]',
        'backup', 1);

-- ✅ TEAM-1: Sean (escalation) always available every day
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-3', 'schedule-1', 'user-12', 'team-1',
        '["2025-10-01","2025-10-02","2025-10-03","2025-10-04","2025-10-05","2025-10-06","2025-10-07","2025-10-08","2025-10-09","2025-10-10","2025-10-11","2025-10-12","2025-10-13","2025-10-14","2025-10-15","2025-10-16","2025-10-17","2025-10-18","2025-10-19","2025-10-20","2025-10-21","2025-10-22","2025-10-23","2025-10-24","2025-10-25","2025-10-26","2025-10-27","2025-10-28","2025-10-29","2025-10-30","2025-10-31"]',
        'escalation', 1);

-- ✅ TEAM-2: James works first half of Oct, Nov, Dec
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-5', 'schedule-2', 'user-6', 'team-2',
        '["2025-10-01","2025-10-02","2025-10-03","2025-10-04","2025-10-05","2025-10-06","2025-10-07","2025-10-08","2025-10-09","2025-10-10","2025-10-11","2025-10-12","2025-10-13","2025-10-14","2025-10-15","2025-11-01","2025-11-02","2025-11-03","2025-11-04","2025-11-05","2025-11-06","2025-11-07","2025-11-08","2025-11-09","2025-11-10","2025-11-11","2025-11-12","2025-11-13","2025-11-14","2025-11-15"]',
        'primary', 1);

-- ✅ TEAM-2: Emily works second half of Oct (16-31)
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-6', 'schedule-2', 'user-7', 'team-2',
        '["2025-10-16","2025-10-17","2025-10-18","2025-10-19","2025-10-20","2025-10-21","2025-10-22","2025-10-23","2025-10-24","2025-10-25","2025-10-26","2025-10-27","2025-10-28","2025-10-29","2025-10-30","2025-10-31"]',
        'primary', 1);

-- ✅ TEAM-2: David works all Saturdays and Sundays in October
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-7', 'schedule-2', 'user-8', 'team-2',
        '["2025-10-11","2025-10-12","2025-10-18","2025-10-19","2025-10-25","2025-10-26"]',
        'backup', 1);

-- ✅ TEAM-2: Alex always available
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-8', 'schedule-2', 'user-10', 'team-2',
        '["2025-10-01","2025-10-02","2025-10-03","2025-10-04","2025-10-05","2025-10-06","2025-10-07","2025-10-08","2025-10-09","2025-10-10","2025-10-11","2025-10-12","2025-10-13","2025-10-14","2025-10-15","2025-10-16","2025-10-17","2025-10-18","2025-10-19","2025-10-20","2025-10-21","2025-10-22","2025-10-23","2025-10-24","2025-10-25","2025-10-26","2025-10-27","2025-10-28","2025-10-29","2025-10-30","2025-10-31"]',
        'escalation', 1);

-- ✅ TEAM-3: Sarah works weekends only (Sat-Sun)
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-10', 'schedule-3', 'user-2', 'team-3',
        '["2025-10-11","2025-10-12","2025-10-18","2025-10-19","2025-10-25","2025-10-26"]',
        'primary', 1);

-- ✅ TEAM-3: Priya works weekdays (Mon-Fri)
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-11', 'schedule-3', 'user-5', 'team-3',
        '["2025-10-13","2025-10-14","2025-10-15","2025-10-16","2025-10-17","2025-10-20","2025-10-21","2025-10-22","2025-10-23","2025-10-24","2025-10-27","2025-10-28","2025-10-29","2025-10-30","2025-10-31"]',
        'backup', 1);

-- ✅ TEAM-3: Admin always available
INSERT OR IGNORE INTO oncall_assignments (id, schedule_id, user_id, team_id, dates, role, is_active)
VALUES ('assign-12', 'schedule-3', 'user-1', 'team-3',
        '["2025-10-01","2025-10-02","2025-10-03","2025-10-04","2025-10-05","2025-10-06","2025-10-07","2025-10-08","2025-10-09","2025-10-10","2025-10-11","2025-10-12","2025-10-13","2025-10-14","2025-10-15","2025-10-16","2025-10-17","2025-10-18","2025-10-19","2025-10-20","2025-10-21","2025-10-22","2025-10-23","2025-10-24","2025-10-25","2025-10-26","2025-10-27","2025-10-28","2025-10-29","2025-10-30","2025-10-31"]',
        'escalation', 1);

INSERT OR IGNORE INTO escalation_policies (id, team_id, name, steps, timeout_minutes, is_active)
VALUES
    ('escalation-1', 'team-1', 'Platform Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":5},{"step":2,"notify":["backup"],"wait_minutes":10},{"step":3,"notify":["primary","backup"],"wait_minutes":15}]', 15, 1),
    ('escalation-2', 'team-2', 'App Support Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":3},{"step":2,"notify":["backup"],"wait_minutes":7},{"step":3,"notify":["escalation"],"wait_minutes":10}]', 10, 1),
    ('escalation-3', 'team-3', 'Database Ops Escalation', '[{"step":1,"notify":["primary"],"wait_minutes":1},{"step":2,"notify":["backup"],"wait_minutes":1},{"step":3,"notify":["escalation"],"wait_minutes":1}]', 15, 1);
