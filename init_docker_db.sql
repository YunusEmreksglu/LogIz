DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS threats CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS log_files CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
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

CREATE TABLE log_files (
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

CREATE TABLE analyses (
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

CREATE TABLE threats (
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

CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    "lastUsed" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "expiresAt" TIMESTAMP,
    "isActive" BOOLEAN DEFAULT true,
    "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
