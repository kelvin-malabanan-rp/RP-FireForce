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
                                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                         updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_timestamp ON incidents(timestamp);
CREATE INDEX IF NOT EXISTS idx_aws_alarm ON incidents(aws_alarm_name);

INSERT OR REPLACE INTO incidents
(id, title, description, severity, status, timestamp, location, aws_alarm_name)
VALUES
('test-1', 'Database Connection Pool Exhausted', 'Primary database connection pool has reached maximum capacity.', 'critical', 'investigating', datetime('now', '-2 hours'), 'Data Center A', 'TEST-HighCPU-WebServer'),
('test-2', 'API Response Time Elevated', 'Authentication API experiencing 5x normal response times.', 'high', 'open', datetime('now', '-4 hours'), 'API Gateway', 'TEST-HighErrorRate-API'),
('test-3', 'Memory Usage Resolved', 'High memory usage on database server has been resolved.', 'medium', 'resolved', datetime('now', '-12 hours'), 'Database Server', 'TEST-HighMemory-Database');
