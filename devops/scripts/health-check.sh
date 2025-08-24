#!/bin/bash
set -euo pipefail

# Configuration
BASE_URL=${1:-http://localhost}
ENVIRONMENT=${2:-development}
TIMEOUT=30
VERBOSE=${VERBOSE:-false}

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

# Functions
log() { echo -e "${GREEN}✓${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
info() { echo -e "${BLUE}ℹ${NC} $1"; }

# Health check function
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    local description=$3
    local method=${4:-GET}
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $description... "
    
    local status_code=$(curl -X "$method" -o /dev/null -s -w "%{http_code}" \
        --connect-timeout $TIMEOUT \
        --max-time $TIMEOUT \
        "$BASE_URL$endpoint" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        log "OK (HTTP $status_code)"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        error "FAIL (HTTP $status_code, expected $expected_status)"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Docker health check
check_docker_service() {
    local service=$1
    local description=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $description... "
    
    local compose_file="devops/docker/${ENVIRONMENT}/docker-compose.yml"
    if [ "$ENVIRONMENT" = "production" ]; then
        compose_file="devops/docker/production/docker-compose.prod.yml"
    fi
    
    if docker-compose -f "$compose_file" ps "$service" 2>/dev/null | grep -q "Up\|running"; then
        log "Running"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        error "Not running"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Port check
check_port() {
    local host=$1
    local port=$2
    local description=$3
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking $description... "
    
    if nc -zv "$host" "$port" >/dev/null 2>&1; then
        log "Open"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        error "Closed"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Database check
check_database() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking database connectivity... "
    
    local compose_file="devops/docker/${ENVIRONMENT}/docker-compose.yml"
    if [ "$ENVIRONMENT" = "production" ]; then
        compose_file="devops/docker/production/docker-compose.prod.yml"
    fi
    
    if docker-compose -f "$compose_file" exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
        log "Ready"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        
        # Check tables exist
        echo -n "Checking database tables... "
        local table_count=$(docker-compose -f "$compose_file" exec -T postgres psql -U postgres -d hotel_mapper -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'" 2>/dev/null | tr -d ' ')
        
        if [ "$table_count" -gt "0" ]; then
            log "Found $table_count tables"
        else
            warn "No tables found"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 0
    else
        error "Not ready"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Redis check
check_redis() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    echo -n "Checking Redis connectivity... "
    
    local compose_file="devops/docker/${ENVIRONMENT}/docker-compose.yml"
    if [ "$ENVIRONMENT" = "production" ]; then
        compose_file="devops/docker/production/docker-compose.prod.yml"
    fi
    
    if docker-compose -f "$compose_file" exec -T redis redis-cli ping >/dev/null 2>&1; then
        log "PONG"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        error "No response"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Response time check
check_response_time() {
    local endpoint=$1
    local max_time=$2
    local description=$3
    
    echo -n "Checking $description response time... "
    
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL$endpoint" 2>/dev/null || echo "999")
    local response_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < $max_time" | bc -l) )); then
        log "OK (${response_ms}ms)"
        return 0
    else
        warn "SLOW (${response_ms}ms, max ${max_time}s)"
        WARNINGS=$((WARNINGS + 1))
        return 1
    fi
}

# Main health check routine
main() {
    echo ""
    echo "======================================"
    echo "Hotel Room Mapper Health Check"
    echo "======================================"
    info "Environment: $ENVIRONMENT"
    info "Base URL: $BASE_URL"
    info "Timeout: ${TIMEOUT}s"
    echo "======================================"
    echo ""
    
    # Get script directory
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
    cd "$PROJECT_ROOT"
    
    # Section: Docker Services
    echo "Docker Services:"
    echo "----------------"
    check_docker_service "postgres" "PostgreSQL"
    check_docker_service "redis" "Redis"
    check_docker_service "backend" "Backend API"
    check_docker_service "frontend" "Frontend"
    check_docker_service "nginx" "Nginx"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        check_docker_service "prometheus" "Prometheus"
        check_docker_service "grafana" "Grafana"
    fi
    echo ""
    
    # Section: Network Connectivity
    echo "Network Connectivity:"
    echo "--------------------"
    check_port "localhost" "80" "HTTP (80)"
    check_port "localhost" "5432" "PostgreSQL (5432)"
    check_port "localhost" "6379" "Redis (6379)"
    check_port "localhost" "3001" "Backend API (3001)"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        check_port "localhost" "5173" "Frontend Dev (5173)"
        check_port "localhost" "9090" "Prometheus (9090)"
        check_port "localhost" "3000" "Grafana (3000)"
    fi
    echo ""
    
    # Section: HTTP Endpoints
    echo "HTTP Endpoints:"
    echo "---------------"
    check_endpoint "/health" 200 "Application health"
    check_endpoint "/api/health" 200 "API health"
    check_endpoint "/" 200 "Frontend homepage"
    check_endpoint "/api/hotels" 200 "Hotels API" "GET"
    check_endpoint "/uploads/test.jpg" 404 "Static files (404 expected)"
    
    if [ "$ENVIRONMENT" = "development" ]; then
        check_endpoint "/metrics" 200 "Prometheus metrics"
    fi
    echo ""
    
    # Section: Database & Cache
    echo "Database & Cache:"
    echo "-----------------"
    check_database
    check_redis
    echo ""
    
    # Section: Performance
    if [ "$VERBOSE" = "true" ]; then
        echo "Performance Checks:"
        echo "-------------------"
        check_response_time "/" 2 "Frontend"
        check_response_time "/api/health" 1 "API health"
        echo ""
    fi
    
    # Summary
    echo "======================================"
    echo "Health Check Summary"
    echo "======================================"
    
    local status_icon="✅"
    local status_text="HEALTHY"
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        status_icon="❌"
        status_text="UNHEALTHY"
    elif [ $WARNINGS -gt 0 ]; then
        status_icon="⚠️"
        status_text="WARNING"
    fi
    
    echo -e "${status_icon} Status: ${status_text}"
    echo ""
    echo "Total checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    fi
    
    echo ""
    echo "Success rate: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"
    echo "======================================"
    
    # Exit with appropriate code
    if [ $FAILED_CHECKS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main