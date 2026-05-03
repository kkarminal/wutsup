-- Insert script for user kkellogg@gmail.com
-- Password: S@msungPh0n3s420 (bcrypt hash, cost factor 11)
-- Run this against the Wutsup database after migrations have been applied.

INSERT INTO users (username, password_hash, role, created_at, updated_at)
VALUES (
    'kkellogg@gmail.com',
    '$2a$11$TPSqkZ3gxXZLWZchl6Jd3ercqFJcJ5mWFLCwOpnIbrD82LTUBX17i',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (username) DO NOTHING;
