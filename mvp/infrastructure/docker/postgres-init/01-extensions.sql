-- ROUAA — PostgreSQL initialization script
-- Enables pgvector extension on database creation
-- This file runs automatically when the postgres container starts with an empty volume.

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Verify pgvector
DO $$
BEGIN
  RAISE NOTICE 'pgvector extension installed — version: %', extversion
  FROM pg_extension WHERE extname = 'pgvector';
END $$;
