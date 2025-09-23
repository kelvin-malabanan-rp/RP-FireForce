-- Migration: Add user management to existing incident management system

-- Step 1: Create users table
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Step 2: Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
											 id TEXT PRIMARY KEY,
											 user_id TEXT NOT NULL REFERENCES users(id),
	token_hash TEXT NOT NULL UNIQUE,
	expires_at DATETIME NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

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

CREATE INDEX IF NOT EXISTS idx_comments_incident ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON incident_comments(user_id);

-- Step 4: Add new columns to incidents table if they don't exist
-- SQLite doesn't support "ADD COLUMN IF NOT EXISTS", so we'll add them one by one
-- These statements will fail silently if columns already exist

-- Try to add assigned_to column
ALTER TABLE incidents ADD COLUMN assigned_to TEXT REFERENCES users(id);

-- Try to add resolved_by column
ALTER TABLE incidents ADD COLUMN resolved_by TEXT REFERENCES users(id);

-- Step 5: Create index for the new column (will fail silently if exists)
CREATE INDEX IF NOT EXISTS idx_assigned_to ON incidents(assigned_to);

-- Step 6: Insert default users
INSERT OR IGNORE INTO users
(id, email, username, password_hash, first_name, last_name, role, is_active, is_verified)
VALUES
('user-1', 'admin@rocketpartners.io', 'admin', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Admin', 'User', 'admin', TRUE, TRUE),
('user-2', 'operator@rocketpartners.io', 'operator1', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'John', 'Doe', 'operator', TRUE, TRUE),
('user-3', 'viewer@rocketpartners.io', 'viewer1', '$2a$10$XQqJQ8M7HJ9Dc0kRgJwKs.VUEDFLjH5e5Gz4NWpc/7YaHgR4t6COe', 'Jane', 'Smith', 'viewer', TRUE, TRUE);

-- Step 7: Update existing incidents to assign them to the operator user (optional)
UPDATE incidents
SET assigned_to = 'user-2'
WHERE status IN ('open', 'investigating')
  AND assigned_to IS NULL;
