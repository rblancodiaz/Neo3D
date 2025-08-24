-- =====================================================
-- Hotel Room Mapper - Schema Setup Script
-- PostgreSQL 15+
-- =====================================================
-- Run this script AFTER creating the database
-- Connect to hotel_mapper database first
-- =====================================================

\echo 'Starting Hotel Room Mapper Schema Setup...'
\echo '============================================='

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create pg_stat_statements extension for monitoring (optional)
-- CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Set default search path
SET search_path TO public;

-- Grant schema permissions to application user
GRANT USAGE ON SCHEMA public TO hotel_app;
GRANT CREATE ON SCHEMA public TO hotel_app;

-- Grant read-only schema permissions to backup user
GRANT USAGE ON SCHEMA public TO hotel_backup;

-- Set default timezone
SET timezone TO 'UTC';

-- 2. Create tables
\echo 'Step 1: Creating tables...'
\i schema/02_create_tables.sql

-- 3. Create indexes
\echo 'Step 2: Creating indexes...'
\i indexes/03_create_indexes.sql

-- 4. Create spatial functions
\echo 'Step 3: Creating spatial functions...'
\i functions/04_spatial_functions.sql

-- 5. Create triggers
\echo 'Step 4: Creating triggers...'
\i triggers/05_create_triggers.sql

-- 6. Create views
\echo 'Step 5: Creating views...'
\i views/06_create_views.sql

-- Grant permissions on all tables to hotel_app
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hotel_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hotel_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hotel_app;

-- Grant read-only permissions to hotel_backup
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO hotel_backup;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO hotel_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO hotel_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON FUNCTIONS TO hotel_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO hotel_backup;

-- 7. Load sample data (optional)
\echo 'Step 6: Loading sample data...'
\i seeds/07_seed_data.sql

-- Final verification
\echo '============================================='
\echo 'Schema setup complete!'
\echo ''
\echo 'Verifying installation...'

-- Check tables
\echo 'Tables created:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check functions
\echo ''
\echo 'Functions created:'
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check views
\echo ''
\echo 'Views created:'
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check triggers
\echo ''
\echo 'Triggers created:'
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check indexes
\echo ''
\echo 'Indexes created:'
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- Final statistics
\echo ''
\echo 'Database statistics:'
SELECT 
    'Hotels' as entity,
    COUNT(*) as count
FROM hotels
UNION ALL
SELECT 
    'Floors' as entity,
    COUNT(*) as count
FROM floors
UNION ALL
SELECT 
    'Rooms' as entity,
    COUNT(*) as count
FROM rooms
ORDER BY entity;

\echo ''
\echo '============================================='
\echo 'Setup completed successfully!'
\echo 'Database: hotel_mapper'
\echo 'Connection string for backend:'
\echo 'postgresql://hotel_app:SecurePassword2024@localhost:5432/hotel_mapper'
\echo '============================================='