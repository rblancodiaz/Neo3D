@echo off
echo =====================================================
echo Hotel Room Mapper - Database Initialization
echo =====================================================
echo.

echo This script will:
echo 1. Drop and recreate the hotel_mapper database
echo 2. Create users hotel_app and hotel_backup
echo 3. Set up the complete schema with tables, functions, and views
echo 4. Load sample data
echo.
echo WARNING: This will DELETE any existing hotel_mapper database!
echo.

set /p confirm=Are you sure you want to continue? (y/n): 
if /i not "%confirm%"=="y" (
    echo Initialization cancelled.
    exit /b 1
)

echo.
echo Step 1: Creating database and users...
echo ----------------------------------------
psql -U postgres -f init_database.sql

if %errorlevel% neq 0 (
    echo ERROR: Failed to create database. Make sure PostgreSQL is running and you have postgres user access.
    pause
    exit /b 1
)

echo.
echo Step 2: Setting up schema...
echo ----------------------------------------
cd /d D:\devprojects\Neo3D\database
psql -U postgres -d hotel_mapper -f setup_schema.sql

if %errorlevel% neq 0 (
    echo ERROR: Failed to set up schema.
    pause
    exit /b 1
)

echo.
echo =====================================================
echo Database initialization completed successfully!
echo =====================================================
echo.
echo Database: hotel_mapper
echo User: hotel_app
echo Password: SecurePassword2024
echo Connection string: postgresql://hotel_app:SecurePassword2024@localhost:5432/hotel_mapper
echo.
echo You can now test the connection with:
echo psql -U hotel_app -d hotel_mapper -h localhost
echo.
pause