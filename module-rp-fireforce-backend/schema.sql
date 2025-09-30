/* ======= DROP (order matters) ======= */
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

/* ======= CORE ======= */

CREATE TABLE users (
					   id            TEXT PRIMARY KEY,
					   email         TEXT UNIQUE,
					   username      TEXT UNIQUE,
					   password_hash TEXT,
					   first_name    TEXT,
					   last_name     TEXT,
					   phone_number  TEXT,
					   role          TEXT,               -- free text now
					   is_active     INTEGER,            -- 0/1
					   is_verified   INTEGER,            -- 0/1
					   last_login    DATETIME,
					   created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
					   updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email    ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role     ON users(role);
CREATE INDEX idx_users_active   ON users(is_active);

CREATE TABLE teams (
					   id          TEXT PRIMARY KEY,
					   name        TEXT UNIQUE,
					   description TEXT,
					   is_active   INTEGER,
					   created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
					   updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_teams_active ON teams(is_active);

CREATE TABLE incidents (
						   id               TEXT PRIMARY KEY,
						   title            TEXT,
						   description      TEXT,
						   severity         TEXT,            -- 'low','medium','high','critical' no check now
						   status           TEXT,            -- 'open','investigating','resolved'
						   priority         TEXT,            -- 'low','medium','high','critical'
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
						   assigned_to      TEXT,            -- free text id
						   resolved_by      TEXT,            -- free text id
						   created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
						   updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_severity      ON incidents(severity);
CREATE INDEX idx_status        ON incidents(status);
CREATE INDEX idx_priority      ON incidents(priority);
CREATE INDEX idx_escalation    ON incidents(escalation_level);
CREATE INDEX idx_timestamp     ON incidents(timestamp);
CREATE INDEX idx_aws_alarm     ON incidents(aws_alarm_name);
CREATE INDEX idx_assigned_to   ON incidents(assigned_to);
CREATE INDEX idx_resolved_by   ON incidents(resolved_by);

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

CREATE TABLE incident_notifications (
										id           TEXT PRIMARY KEY,
										incident_id  TEXT,
										token        TEXT,
										fcm_token    TEXT,
										kind         TEXT,                -- 'alert' | 'all_clear'
										delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inc_notif_incident_kind ON incident_notifications(incident_id, kind);

/* ======= ON-CALL ======= */

CREATE TABLE oncall_teams (
							  id         TEXT PRIMARY KEY,
							  name       TEXT,
							  description TEXT,
							  timezone   TEXT,
							  is_active  INTEGER,
							  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
							  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_teams_active ON oncall_teams(is_active);

CREATE TABLE team_members (
							  id         TEXT PRIMARY KEY,
							  team_id    TEXT,
							  user_id    TEXT,
							  role       TEXT,                  -- 'member','lead','manager','admin'
							  is_active  INTEGER,
							  joined_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);

CREATE TABLE oncall_team_members (
									 id          TEXT PRIMARY KEY,
									 team_id     TEXT,
									 user_id     TEXT,
									 role        TEXT,                 -- 'primary','backup','escalation'
									 order_index INTEGER,
									 is_active   INTEGER,
									 created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX uq_oncall_members_team_user ON oncall_team_members(team_id, user_id);
CREATE INDEX idx_oncall_members_team ON oncall_team_members(team_id);
CREATE INDEX idx_oncall_members_user ON oncall_team_members(user_id);

CREATE TABLE oncall_schedules (
								  id                   TEXT PRIMARY KEY,
								  team_id              TEXT,
								  name                 TEXT,
								  rotation_type        TEXT,        -- 'daily','weekly','biweekly','monthly'
								  rotation_start       DATETIME,
								  rotation_length_hours INTEGER,
								  is_active            INTEGER,
								  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
								  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_schedules_team   ON oncall_schedules(team_id);
CREATE INDEX idx_oncall_schedules_active ON oncall_schedules(is_active);

CREATE TABLE oncall_assignments (
									id         TEXT PRIMARY KEY,
									schedule_id TEXT,
									user_id    TEXT,
									team_id    TEXT,
									start_time DATETIME,
									end_time   DATETIME,
									role       TEXT,                  -- 'primary','backup','escalation'
									is_active  INTEGER,
									created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_assignments_team     ON oncall_assignments(team_id);
CREATE INDEX idx_oncall_assignments_user     ON oncall_assignments(user_id);
CREATE INDEX idx_oncall_assignments_time     ON oncall_assignments(start_time, end_time);
CREATE INDEX idx_oncall_assignments_active   ON oncall_assignments(is_active);
CREATE INDEX idx_oncall_assignments_schedule ON oncall_assignments(schedule_id);

CREATE TABLE oncall_overrides (
								  id                   TEXT PRIMARY KEY,
								  team_id              TEXT,
								  schedule_id          TEXT,
								  original_user_id     TEXT,
								  replacement_user_id  TEXT,        -- << use this in your insert
								  user_id              TEXT,        -- compat field; keep it for code paths
								  start_time           DATETIME,
								  end_time             DATETIME,
								  role                 TEXT,        -- 'primary','backup','escalation'
								  reason               TEXT,
								  status               TEXT,        -- 'active','cancelled','expired'
								  created_by           TEXT,
								  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_oncall_overrides_time ON oncall_overrides(start_time, end_time);
CREATE INDEX idx_oncall_overrides_status ON oncall_overrides(status);
CREATE INDEX idx_oncall_overrides_team ON oncall_overrides(team_id);

CREATE TABLE escalation_policies (
									 id             TEXT PRIMARY KEY,
									 team_id        TEXT,
									 name           TEXT,
									 steps          TEXT,              -- JSON
									 timeout_minutes INTEGER,
									 is_active      INTEGER,
									 created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
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
									  id                   TEXT PRIMARY KEY,
									  incident_id          TEXT,
									  team_id              TEXT,
									  escalated_to_user_id TEXT,
									  escalated_from_user_id TEXT,
									  escalation_level     INTEGER,
									  reason               TEXT,
									  priority             TEXT,
									  status               TEXT,
									  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
									  acknowledged_at      DATETIME,
									  resolved_at          DATETIME
);
CREATE INDEX idx_incident_escalations_incident ON incident_escalations(incident_id);
CREATE INDEX idx_incident_escalations_status   ON incident_escalations(status);

/* ======= SEED ======= */
INSERT OR IGNORE INTO users (id,email,username,password_hash,first_name,last_name,role,is_active,is_verified)
VALUES
('user-1','admin@rocketpartners.io','admin','x','Admin','User','admin',1,1),
('user-2','operator@rocketpartners.io','operator1','x','John','Doe','operator',1,1),
('user-3','viewer@rocketpartners.io','viewer1','x','Jane','Smith','viewer',1,1),
('user-4','kelvin.malabanan@rocketpartners.io','kmalabanan','x','Kelvin','Malabanan','admin',1,1);

INSERT OR IGNORE INTO teams (id,name,description,is_active)
VALUES
('team-1','Platform Engineering','Primary platform and infrastructure team',1),
('team-2','Application Support','Application-level incident response team',1);

INSERT OR IGNORE INTO incidents
(id,title,description,severity,status,priority,escalation_level,timestamp,location,aws_alarm_name,assigned_to)
VALUES
('test-1','Database Connection Pool Exhausted','Primary database connection pool has reached maximum capacity.','critical','investigating','critical',1,datetime('now','-2 hours'),'Data Center A','TEST-HighCPU-WebServer','user-2'),
('test-2','API Response Time Elevated','Authentication API experiencing 5x normal response times.','high','open','high',0,datetime('now','-4 hours'),'API Gateway','TEST-HighErrorRate-API','user-2'),
('test-3','Memory Usage Resolved','High memory usage on database server has been resolved.','medium','resolved','medium',0,datetime('now','-12 hours'),'Database Server','TEST-HighMemory-Database',NULL);

INSERT OR IGNORE INTO oncall_teams (id,name,description,timezone,is_active)
VALUES
('team-1','Platform Engineering','Primary platform and infrastructure team','America/New_York',1),
('team-2','Application Support','Application-level incident response team','America/Los_Angeles',1);

INSERT OR IGNORE INTO team_members (id,team_id,user_id,role,is_active) VALUES
('tm-1','team-1','user-1','manager',1),
('tm-2','team-1','user-2','lead',1),
('tm-3','team-1','user-4','member',1),
('tm-4','team-2','user-3','lead',1);

INSERT OR IGNORE INTO oncall_team_members (id,team_id,user_id,role,order_index,is_active) VALUES
('member-1','team-1','user-4','primary',0,1),
('member-2','team-1','user-2','primary',1,1),
('member-3','team-1','user-1','backup',0,1),
('member-4','team-2','user-3','primary',0,1);

INSERT OR IGNORE INTO escalation_chains (id,team_id,user_id,level,is_active) VALUES
('ec-1','team-1','user-4',1,1),
('ec-2','team-1','user-2',2,1),
('ec-3','team-1','user-1',3,1);

INSERT OR IGNORE INTO oncall_schedules (id,team_id,name,rotation_type,rotation_start,rotation_length_hours,is_active)
VALUES
('schedule-1','team-1','Weekly Platform Rotation','weekly',datetime('now','weekday 1'),168,1),
('schedule-2','team-2','Daily App Support','daily',datetime('now'),24,1);

INSERT OR IGNORE INTO oncall_assignments (id,schedule_id,user_id,team_id,start_time,end_time,role,is_active) VALUES
('assign-1','schedule-1','user-4','team-1',datetime('now','-1 day'),datetime('now','+6 days'),'primary',1),
('assign-2','schedule-1','user-2','team-1',datetime('now','-1 day'),datetime('now','+6 days'),'backup',1),
('assign-3','schedule-1','user-1','team-1',datetime('now','-1 day'),datetime('now','+6 days'),'escalation',1),
('assign-4','schedule-1','user-2','team-1',datetime('now','+6 days'),datetime('now','+13 days'),'primary',1),
('assign-5','schedule-1','user-4','team-1',datetime('now','+6 days'),datetime('now','+13 days'),'backup',1),
('assign-6','schedule-1','user-3','team-1',datetime('now','+6 days'),datetime('now','+13 days'),'escalation',1);

INSERT OR IGNORE INTO escalation_policies (id,team_id,name,steps,timeout_minutes,is_active)
VALUES
('escalation-1','team-1','Platform Escalation','[{"step":1,"notify":["primary"],"wait_minutes":5},{"step":2,"notify":["backup"],"wait_minutes":10},{"step":3,"notify":["primary","backup"],"wait_minutes":15}]',15,1);
