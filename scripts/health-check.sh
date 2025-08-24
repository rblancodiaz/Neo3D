#!/bin/bash

# Hotel Room Mapper - System Health Check Script
# This script verifies all components are properly configured and running

set -e

echo "======================================"
echo "Hotel Room Mapper - System Health Check"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        ERRORS=$((ERRORS + 1))
    fi
}

ERRORS=0

echo "1. Checking Docker Services..."
echo "-------------------------------"

# Check if Docker is running
docker version > /dev/null 2>&1
check_status $? "Docker is installed and running"

# Check if docker-compose is available
docker-compose version > /dev/null 2>&1
check_status $? "Docker Compose is installed"

# Check if services are running
if [ -f "docker-compose.yml" ]; then
    # Check PostgreSQL
    docker-compose ps postgres 2>/dev/null | grep -q "Up"
    check_status $? "PostgreSQL container is running"
    
    # Check Backend
    docker-compose ps backend 2>/dev/null | grep -q "Up"
    check_status $? "Backend API container is running"
    
    # Check PgAdmin
    docker-compose ps pgadmin 2>/dev/null | grep -q "Up"
    check_status $? "PgAdmin container is running"
else
    echo -e "${YELLOW}⚠${NC} docker-compose.yml not found in current directory"
fi

echo ""
echo "2. Checking API Endpoints..."
echo "-----------------------------"

# Check backend health endpoint
if curl -f -s -o /dev/null http://localhost:3001/health 2>/dev/null; then
    check_status 0 "Backend API is responding (http://localhost:3001)"
else
    check_status 1 "Backend API is not responding"
fi

# Check database connection through API
if curl -f -s http://localhost:3001/api/health/db 2>/dev/null | grep -q "connected"; then
    check_status 0 "Database connection is working"
else
    check_status 1 "Database connection failed"
fi

echo ""
echo "3. Checking Frontend..."
echo "------------------------"

# Check if frontend is accessible
if curl -f -s -o /dev/null http://localhost:5173 2>/dev/null; then
    check_status 0 "Frontend is accessible (http://localhost:5173)"
else
    echo -e "${YELLOW}⚠${NC} Frontend not running (run 'npm run dev' in frontend folder)"
fi

echo ""
echo "4. Checking File System..."
echo "---------------------------"

# Check required directories
DIRS=("backend/uploads" "backend/logs" "database")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        check_status 0 "Directory exists: $dir"
    else
        check_status 1 "Directory missing: $dir"
    fi
done

# Check write permissions
if [ -w "backend/uploads" ]; then
    check_status 0 "Upload directory is writable"
else
    check_status 1 "Upload directory is not writable"
fi

echo ""
echo "5. Checking Configuration Files..."
echo "-----------------------------------"

# Check for environment files
if [ -f "backend/.env" ]; then
    check_status 0 "Backend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Backend .env file missing (copy from .env.example)"
fi

if [ -f "frontend/.env" ]; then
    check_status 0 "Frontend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Frontend .env file missing (copy from .env.example)"
fi

echo ""
echo "6. Checking Node.js Dependencies..."
echo "------------------------------------"

# Check backend dependencies
if [ -d "backend/node_modules" ]; then
    check_status 0 "Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Backend dependencies not installed (run 'npm install' in backend folder)"
fi

# Check frontend dependencies
if [ -d "frontend/node_modules" ]; then
    check_status 0 "Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed (run 'npm install' in frontend folder)"
fi

echo ""
echo "7. Database Connectivity Test..."
echo "---------------------------------"

# Test database connection if PostgreSQL is running
if command -v psql &> /dev/null; then
    PGPASSWORD=postgres psql -h localhost -U postgres -d hotel_mapper -c "SELECT 1" > /dev/null 2>&1
    check_status $? "Direct database connection successful"
else
    echo -e "${YELLOW}⚠${NC} psql client not installed (optional for direct DB access)"
fi

echo ""
echo "8. API Functionality Test..."
echo "-----------------------------"

# Test hotel list endpoint
HOTEL_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:3001/api/hotels 2>/dev/null | tail -n1)
if [ "$HOTEL_RESPONSE" = "200" ]; then
    check_status 0 "Hotels API endpoint working"
else
    check_status 1 "Hotels API endpoint not working (HTTP $HOTEL_RESPONSE)"
fi

echo ""
echo "======================================"
echo "Health Check Summary"
echo "======================================"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "The system is ready for use."
    echo ""
    echo "Access the application at:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost:3001"
    echo "  - PgAdmin: http://localhost:5050"
    echo "    Email: admin@hotelmap.com"
    echo "    Password: admin"
else
    echo -e "${RED}✗ $ERRORS check(s) failed${NC}"
    echo "Please resolve the issues above before proceeding."
fi

echo ""
echo "Quick Start Commands:"
echo "---------------------"
echo "Start all services:    docker-compose up -d"
echo "Stop all services:     docker-compose down"
echo "View logs:             docker-compose logs -f"
echo "Rebuild containers:    docker-compose build"
echo ""

exit $ERRORS