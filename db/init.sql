-- Wutsup database initialization script
-- This script is mounted into PostgreSQL's docker-entrypoint-initdb.d directory
-- and runs automatically on first container startup. It is idempotent and safe
-- to run multiple times (e.g., if also applied by EF Core migrations).

-- Create the logs table if it doesn't already exist (matches EF Core schema)
CREATE TABLE IF NOT EXISTS logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level VARCHAR(10) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(255) NOT NULL,
    correlation_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS prevents errors when EF Core migrations run first)
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs ("timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs (level);
CREATE INDEX IF NOT EXISTS idx_logs_correlation_id ON logs (correlation_id);

-- Seed sample log entries for local development
-- Only insert if the table is empty to avoid duplicates on repeated runs
INSERT INTO logs ("timestamp", level, message, source, correlation_id, created_at)
SELECT t.*
FROM (VALUES
    (NOW() - INTERVAL '5 minutes', 'info',  'Application started successfully',       'Wutsup.Api',              'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID, NOW() - INTERVAL '5 minutes'),
    (NOW() - INTERVAL '4 minutes', 'debug', 'Database connection established',         'Wutsup.Api.Data',         'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID, NOW() - INTERVAL '4 minutes'),
    (NOW() - INTERVAL '3 minutes', 'info',  'Health check endpoint called',            'HealthController',         'b2c3d4e5-f6a7-8901-bcde-f12345678901'::UUID, NOW() - INTERVAL '3 minutes'),
    (NOW() - INTERVAL '2 minutes', 'warn',  'Slow query detected: 1200ms',            'Wutsup.Api.Data',         'c3d4e5f6-a7b8-9012-cdef-123456789012'::UUID, NOW() - INTERVAL '2 minutes'),
    (NOW() - INTERVAL '1 minute',  'error', 'Failed to connect to GrowthBook service', 'LogLevelFilter',           'd4e5f6a7-b8c9-0123-defa-234567890123'::UUID, NOW() - INTERVAL '1 minute')
) AS t(timestamp, level, message, source, correlation_id, created_at)
WHERE NOT EXISTS (SELECT 1 FROM logs LIMIT 1);
