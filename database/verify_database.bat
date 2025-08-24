@echo off
echo =====================================================
echo Hotel Room Mapper - Database Verification
echo =====================================================
echo.

echo Checking Docker container status...
docker ps --filter "name=hotel_mapper_db" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo Checking database connection...
docker exec hotel_mapper_db psql -U hotel_app -d hotel_mapper -c "SELECT version();" 2>&1 | head -1
echo.

echo Checking tables...
echo ----------------------------------------
docker exec hotel_mapper_db psql -U hotel_app -d hotel_mapper -t -c "SELECT COUNT(*) as count, 'tables' as type FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
echo.

echo Checking views...
docker exec hotel_mapper_db psql -U hotel_app -d hotel_mapper -t -c "SELECT COUNT(*) as count, 'views' as type FROM information_schema.views WHERE table_schema = 'public';"
echo.

echo Checking functions...
docker exec hotel_mapper_db psql -U hotel_app -d hotel_mapper -t -c "SELECT COUNT(*) as count, 'functions' as type FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';"
echo.

echo Checking sample data...
echo ----------------------------------------
docker exec hotel_mapper_db psql -U hotel_app -d hotel_mapper -t -c "SELECT COUNT(*) || ' hotels' FROM hotels UNION ALL SELECT COUNT(*) || ' floors' FROM floors UNION ALL SELECT COUNT(*) || ' rooms' FROM rooms;"
echo.

echo =====================================================
echo Database verification complete!
echo.
echo Connection details:
echo Host: localhost
echo Port: 5433 (Docker) or 5432 (native)
echo Database: hotel_mapper
echo User: hotel_app
echo Password: SecurePassword2024
echo.
echo Connection string for Docker:
echo postgresql://hotel_app:SecurePassword2024@localhost:5433/hotel_mapper
echo =====================================================
pause