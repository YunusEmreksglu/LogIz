-- LogIz Database Schema
-- This script runs automatically on first PostgreSQL container start

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    "emailVerified" TIMESTAMP,
    password TEXT NOT NULL,
    image TEXT,
    role TEXT DEFAULT 'USER',
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Log files table
CREATE TABLE IF NOT EXISTS log_files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INT NOT NULL,
    "fileType" TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    "uploadedAt" TIMESTAMP DEFAULT NOW(),
    "userId" TEXT REFERENCES users(id) ON DELETE CASCADE
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    result JSONB,
    "threatCount" INT DEFAULT 0,
    "highSeverity" INT DEFAULT 0,
    "mediumSeverity" INT DEFAULT 0,
    "lowSeverity" INT DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    "analyzedAt" TIMESTAMP DEFAULT NOW(),
    "processingTime" INT,
    "logFileId" TEXT NOT NULL REFERENCES log_files(id) ON DELETE CASCADE
);

-- Threats table
CREATE TABLE IF NOT EXISTS threats (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    "sourceIP" TEXT,
    "targetIP" TEXT,
    port INT,
    timestamp TIMESTAMP,
    "rawLog" TEXT,
    confidence FLOAT,
    "sourceLat" FLOAT,
    "sourceLon" FLOAT,
    "sourceCountry" TEXT,
    "analysisId" TEXT NOT NULL REFERENCES analyses(id) ON DELETE CASCADE
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    "lastUsed" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity);
CREATE INDEX IF NOT EXISTS idx_threats_type ON threats(type);
CREATE INDEX IF NOT EXISTS idx_threats_analysis ON threats("analysisId");
CREATE INDEX IF NOT EXISTS idx_analyses_logfile ON analyses("logFileId");
CREATE INDEX IF NOT EXISTS idx_logfiles_user ON log_files("userId");
