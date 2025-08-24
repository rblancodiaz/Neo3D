-- =====================================================
-- Hotel Room Mapper Database Creation Script
-- PostgreSQL 15+
-- =====================================================
-- Database creation and initial configuration
-- Run this script as a superuser (postgres)
-- =====================================================

-- Drop existing database if needed (BE CAREFUL!)
-- DROP DATABASE IF EXISTS hotel_mapper;

-- Create database with proper encoding
CREATE DATABASE hotel_mapper
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the new database
\c hotel_mapper;

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pg_stat_statements extension for monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set default search path
ALTER DATABASE hotel_mapper SET search_path TO public;

-- Create application user with limited privileges
CREATE ROLE hotel_app WITH LOGIN PASSWORD 'hotel_app_password';

-- Grant basic permissions
GRANT CONNECT ON DATABASE hotel_mapper TO hotel_app;
GRANT USAGE ON SCHEMA public TO hotel_app;

-- Create backup user with read-only access
CREATE ROLE hotel_backup WITH LOGIN PASSWORD 'hotel_backup_password';
GRANT CONNECT ON DATABASE hotel_mapper TO hotel_backup;
GRANT USAGE ON SCHEMA public TO hotel_backup;

-- Set statement timeout for application user (30 seconds)
ALTER ROLE hotel_app SET statement_timeout = '30s';

-- Set default timezone
ALTER DATABASE hotel_mapper SET timezone TO 'UTC';

-- Performance configurations
ALTER DATABASE hotel_mapper SET random_page_cost = 1.1;
ALTER DATABASE hotel_mapper SET effective_io_concurrency = 200;
ALTER DATABASE hotel_mapper SET work_mem = '16MB';

COMMENT ON DATABASE hotel_mapper IS 'Hotel Room Mapper - Interactive mapping system for hotel rooms';