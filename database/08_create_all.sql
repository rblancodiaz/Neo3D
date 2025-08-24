-- =====================================================
-- Hotel Room Mapper - Complete Database Setup Script
-- PostgreSQL 15+
-- =====================================================
-- Master script to create entire database schema
-- Run this script to set up the complete database
-- =====================================================

-- Include all SQL files in correct order
\echo 'Starting Hotel Room Mapper Database Setup...'
\echo '============================================='

-- 1. Create database and basic setup
\echo 'Step 1: Creating database...'
\i 01_create_database.sql

-- 2. Create tables
\echo 'Step 2: Creating tables...'
\i schema/02_create_tables.sql

-- 3. Create indexes
\echo 'Step 3: Creating indexes...'
\i indexes/03_create_indexes.sql

-- 4. Create spatial functions
\echo 'Step 4: Creating spatial functions...'
\i functions/04_spatial_functions.sql

-- 5. Create triggers
\echo 'Step 5: Creating triggers...'
\i triggers/05_create_triggers.sql

-- 6. Create views
\echo 'Step 6: Creating views...'
\i views/06_create_views.sql

-- 7. Load sample data (optional)
\echo 'Step 7: Loading sample data...'
\echo 'Do you want to load sample data? (Comment out next line if not)'
\i seeds/07_seed_data.sql

-- Final verification
\echo '============================================='
\echo 'Database setup complete!'
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
\echo 'Default app user: hotel_app'
\echo 'Default backup user: hotel_backup'
\echo '============================================='