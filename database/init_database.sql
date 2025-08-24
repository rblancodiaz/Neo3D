-- =====================================================
-- Hotel Room Mapper Database Initialization Script
-- PostgreSQL 15+
-- =====================================================
-- Run this as superuser (postgres) to create database
-- =====================================================

-- Terminate existing connections to the database if it exists
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'hotel_mapper' 
  AND pid <> pg_backend_pid();

-- Drop existing database if needed (BE CAREFUL!)
DROP DATABASE IF EXISTS hotel_mapper;

-- Drop existing roles if needed
DROP ROLE IF EXISTS hotel_app;
DROP ROLE IF EXISTS hotel_backup;

-- Create database with proper encoding
CREATE DATABASE hotel_mapper
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Create application user with limited privileges
CREATE ROLE hotel_app WITH LOGIN PASSWORD 'SecurePassword2024';

-- Create backup user with read-only access
CREATE ROLE hotel_backup WITH LOGIN PASSWORD 'BackupPassword2024';

-- Grant basic permissions
GRANT CONNECT ON DATABASE hotel_mapper TO hotel_app;
GRANT CONNECT ON DATABASE hotel_mapper TO hotel_backup;

-- Set statement timeout for application user (30 seconds)
ALTER ROLE hotel_app SET statement_timeout = '30s';

\echo 'Database and users created successfully!'
\echo 'Now connect to hotel_mapper database and run setup_schema.sql'