-- LogIz Database Schema - Supabase SQL Editor'de çalıştırın
-- https://supabase.com/dashboard/project/tmavagzxznmmwecbudux/editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    email_verified TIMESTAMP,
    password TEXT NOT NULL,
    image TEXT,
    role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'ANALYST')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Log Files Table
CREATE TABLE IF NOT EXISTS log_files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_log_files_user_id ON log_files(user_id);
CREATE INDEX idx_log_files_status ON log_files(status);

-- 3. Analyses Table
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    result JSONB NOT NULL,
    threat_count INTEGER NOT NULL DEFAULT 0,
    high_severity INTEGER NOT NULL DEFAULT 0,
    medium_severity INTEGER NOT NULL DEFAULT 0,
    low_severity INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    analyzed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    processing_time INTEGER,
    log_file_id TEXT NOT NULL REFERENCES log_files(id) ON DELETE CASCADE
);

CREATE INDEX idx_analyses_log_file_id ON analyses(log_file_id);
CREATE INDEX idx_analyses_status ON analyses(status);

-- 4. Threats Table
CREATE TABLE IF NOT EXISTS threats (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    description TEXT NOT NULL,
    source_ip TEXT,
    target_ip TEXT,
    port INTEGER,
    timestamp TIMESTAMP,
    raw_log TEXT,
    confidence DOUBLE PRECISION,
    analysis_id TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE INDEX idx_threats_analysis_id ON threats(analysis_id);
CREATE INDEX idx_threats_severity ON threats(severity);
CREATE INDEX idx_threats_type ON threats(type);

-- 5. API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    last_used TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(key);

-- Test User (opsiyonel)
INSERT INTO users (id, email, password, role, created_at, updated_at)
VALUES ('temp-user-id', 'test@logiz.com', '$2a$10$dummy.hash.for.testing', 'ADMIN', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Başarılı mesajı
SELECT 'Tüm tablolar başarıyla oluşturuldu! ✅' as message;
