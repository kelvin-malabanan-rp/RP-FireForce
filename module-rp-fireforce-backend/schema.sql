-- Migration: Add user management to existing incident management system

-- Step 1: Create users table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS users (
									 id TEXT PRIMARY KEY,
									 email TEXT NOT NULL UNIQUE,
									 username TEXT NOT NULL UNIQUE,
									 password_hash TEXT NOT NULL,
									 first_name TEXT,
									 last_name TEXT,
									 phone_number TEXT,
									 role TEXT CHECK(role IN ('admin', 'operator', 'viewer')) DEFAULT 'viewer',
	is_active BOOLEAN DEFAULT TRUE,
	is_verified BOOLEAN DEFAULT FALSE,
	last_login DATETIME,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

-- Create users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
										 id TEXT PRIMARY KEY,
										 title TEXT NOT NULL,
										 description TEXT,
										 severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
	status TEXT CHECK(status IN ('open', 'investigating', 'resolved')) DEFAULT 'open',
	timestamp DATETIME NOT NULL,
	reported_by TEXT DEFAULT 'AWS CloudWatch',
	location TEXT,
	aws_alarm_name TEXT,
	aws_account_id TEXT,
	state_reason TEXT,
	metric_name TEXT,
	aws_console_url TEXT,
	resolved_at DATETIME,
	assigned_to TEXT REFERENCES users(id),
	resolved_by TEXT REFERENCES users(id),
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

-- Create incidents indexes
CREATE INDEX IF NOT EXISTS idx_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_timestamp ON incidents(timestamp);
CREATE INDEX IF NOT EXISTS idx_aws_alarm ON incidents(aws_alarm_name);
CREATE INDEX IF NOT EXISTS idx_assigned_to ON incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_resolved_by ON incidents(resolved_by);

-- Step 2: Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
											 id TEXT PRIMARY KEY,
											 user_id TEXT NOT NULL REFERENCES users(id),
	token_hash TEXT NOT NULL UNIQUE,
	expires_at DATETIME NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

-- Create sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

-- Step 3: Create incident comments table
CREATE TABLE IF NOT EXISTS incident_comments (
												 id TEXT PRIMARY KEY,
												 incident_id TEXT NOT NULL REFERENCES incidents(id),
	user_id TEXT NOT NULL REFERENCES users(id),
	comment TEXT NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

-- Create comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_incident ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON incident_comments(user_id);

-- Step 4: Insert users (INSERT OR IGNORE prevents duplicates)
INSERT OR IGNORE INTO users
(id, email, username, password_hash, first_name, last_name, role, is_active, is_verified)
VALUES
('user-1', 'admin@rocketpartners.io', 'admin', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Admin', 'User', 'admin', TRUE, TRUE),
('user-2', 'operator@rocketpartners.io', 'operator1', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'John', 'Doe', 'operator', TRUE, TRUE),
('user-3', 'viewer@rocketpartners.io', 'viewer1', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Jane', 'Smith', 'viewer', TRUE, TRUE),
('user-4', 'kelvin.malabanan@rocketpartners.io', 'kmalabanan', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Kelvin', 'Malabanan', 'admin', TRUE, TRUE);

-- Step 5: Insert test incidents
INSERT OR REPLACE INTO incidents
(id, title, description, severity, status, timestamp, location, aws_alarm_name)
VALUES
('test-1', 'Database Connection Pool Exhausted', 'Primary database connection pool has reached maximum capacity.', 'critical', 'investigating', datetime('now', '-2 hours'), 'Data Center A', 'TEST-HighCPU-WebServer'),
('test-2', 'API Response Time Elevated', 'Authentication API experiencing 5x normal response times.', 'high', 'open', datetime('now', '-4 hours'), 'API Gateway', 'TEST-HighErrorRate-API'),
('test-3', 'Memory Usage Resolved', 'High memory usage on database server has been resolved.', 'medium', 'resolved', datetime('now', '-12 hours'), 'Database Server', 'TEST-HighMemory-Database');

-- Step 6: Update existing incidents to assign them to the operator user (optional)
UPDATE incidents
SET assigned_to = 'user-2'
WHERE status IN ('open', 'investigating')
  AND assigned_to IS NULL;
