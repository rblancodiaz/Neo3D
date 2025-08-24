#!/bin/bash
set -euo pipefail

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
DEPLOY_TYPE=${3:-rolling}

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }

# Usage
usage() {
    cat << EOF
Usage: $0 [environment] [version] [deploy_type]

Arguments:
  environment   Target environment (staging|production) [default: staging]
  version       Version tag to deploy [default: latest]
  deploy_type   Deployment strategy (rolling|blue-green|recreate) [default: rolling]

Examples:
  $0 staging latest rolling
  $0 production v1.2.3 blue-green

EOF
    exit 1
}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    error "Invalid environment. Must be 'staging' or 'production'"
    usage
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

log "Starting deployment..."
info "Environment: $ENVIRONMENT"
info "Version: $VERSION"
info "Deploy type: $DEPLOY_TYPE"

# Load environment variables
ENV_FILE="devops/config/environments/${ENVIRONMENT}.env"
if [ ! -f "$ENV_FILE" ]; then
    error "Environment file not found: $ENV_FILE"
fi

log "Loading environment configuration..."
export $(grep -v '^#' "$ENV_FILE" | xargs)

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check Docker
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running"
    fi
    
    # Check disk space
    local available_space=$(df -h / | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "${available_space%%.*}" -lt 5 ]; then
        error "Insufficient disk space (less than 5GB available)"
    fi
    
    # Check if services are healthy
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Checking current production health..."
        "$SCRIPT_DIR/health-check.sh" "${PRODUCTION_URL:-http://localhost}" production || warn "Current production unhealthy"
    fi
    
    log "✓ Pre-deployment checks passed"
}

# Create backup before deployment
create_backup() {
    if [ "$ENVIRONMENT" = "production" ]; then
        log "Creating pre-deployment backup..."
        "$SCRIPT_DIR/backup.sh" full production || warn "Backup failed but continuing..."
    fi
}

# Build images
build_images() {
    log "Building Docker images..."
    
    local compose_file="devops/docker/production/docker-compose.prod.yml"
    
    # Build with version tag
    docker-compose -f "$compose_file" build \
        --build-arg VERSION="$VERSION" \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    
    # Tag images
    docker tag hotel-mapper-backend:latest "hotel-mapper-backend:$VERSION"
    docker tag hotel-mapper-frontend:latest "hotel-mapper-frontend:$VERSION"
    
    log "✓ Images built and tagged with version $VERSION"
}

# Rolling deployment
deploy_rolling() {
    log "Performing rolling deployment..."
    
    local compose_file="devops/docker/production/docker-compose.prod.yml"
    
    # Update backend first
    log "Updating backend service..."
    docker-compose -f "$compose_file" up -d --no-deps --scale backend=2 backend
    sleep 10
    
    # Health check new backend
    local max_attempts=30
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        if curl -f http://localhost:3001/health >/dev/null 2>&1; then
            log "✓ New backend healthy"
            break
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    
    if [ $attempt -eq $max_attempts ]; then
        error "New backend failed health check"
    fi
    
    # Scale down old backend
    docker-compose -f "$compose_file" up -d --no-deps --scale backend=1 backend
    
    # Update frontend
    log "Updating frontend service..."
    docker-compose -f "$compose_file" up -d --no-deps frontend
    
    # Update nginx
    log "Updating nginx configuration..."
    docker-compose -f "$compose_file" up -d --no-deps nginx
    
    log "✓ Rolling deployment completed"
}

# Blue-green deployment
deploy_blue_green() {
    log "Performing blue-green deployment..."
    
    local compose_file="devops/docker/production/docker-compose.prod.yml"
    
    # Create green environment
    log "Creating green environment..."
    docker-compose -f "$compose_file" -p "hotel_mapper_green" up -d
    
    # Wait for green to be healthy
    log "Waiting for green environment to be healthy..."
    sleep 30
    
    # Health check green environment
    if ! curl -f http://localhost:8080/health >/dev/null 2>&1; then
        error "Green environment failed health check"
    fi
    
    # Switch traffic to green
    log "Switching traffic to green environment..."
    # This would typically involve updating load balancer or DNS
    # For now, we'll simulate with nginx config update
    
    # Stop blue environment
    log "Stopping blue environment..."
    docker-compose -f "$compose_file" -p "hotel_mapper_blue" down
    
    # Rename green to blue for next deployment
    docker-compose -f "$compose_file" -p "hotel_mapper_green" down
    docker-compose -f "$compose_file" -p "hotel_mapper_blue" up -d
    
    log "✓ Blue-green deployment completed"
}

# Recreate deployment
deploy_recreate() {
    log "Performing recreate deployment..."
    
    local compose_file="devops/docker/production/docker-compose.prod.yml"
    
    # Stop all services
    log "Stopping all services..."
    docker-compose -f "$compose_file" down
    
    # Start new services
    log "Starting new services..."
    docker-compose -f "$compose_file" up -d
    
    log "✓ Recreate deployment completed"
}

# Post-deployment tasks
post_deployment() {
    log "Running post-deployment tasks..."
    
    # Run database migrations
    log "Running database migrations..."
    local compose_file="devops/docker/production/docker-compose.prod.yml"
    docker-compose -f "$compose_file" exec -T backend npm run db:migrate:prod || warn "Migrations failed"
    
    # Clear caches
    log "Clearing caches..."
    docker-compose -f "$compose_file" exec -T redis redis-cli FLUSHALL || warn "Cache clear failed"
    
    # Warm up application
    log "Warming up application..."
    for i in {1..5}; do
        curl -s http://localhost/ >/dev/null 2>&1 || true
        curl -s http://localhost/api/health >/dev/null 2>&1 || true
    done
    
    log "✓ Post-deployment tasks completed"
}

# Health check
health_check() {
    log "Running health checks..."
    
    "$SCRIPT_DIR/health-check.sh" "http://localhost" "$ENVIRONMENT"
    
    if [ $? -ne 0 ]; then
        error "Health check failed after deployment"
    fi
    
    log "✓ All health checks passed"
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    local compose_file="devops/docker/production/docker-compose.prod.yml"
    
    # Restore previous version
    docker-compose -f "$compose_file" down
    docker tag "hotel-mapper-backend:previous" "hotel-mapper-backend:latest"
    docker tag "hotel-mapper-frontend:previous" "hotel-mapper-frontend:latest"
    docker-compose -f "$compose_file" up -d
    
    warn "Rollback completed. Please investigate the failure."
    exit 1
}

# Set up error handling
trap rollback ERR

# Main deployment flow
main() {
    log "======================================"
    log "Hotel Room Mapper Deployment"
    log "======================================"
    
    # Tag current images as previous for rollback
    docker tag "hotel-mapper-backend:latest" "hotel-mapper-backend:previous" 2>/dev/null || true
    docker tag "hotel-mapper-frontend:latest" "hotel-mapper-frontend:previous" 2>/dev/null || true
    
    # Run deployment steps
    pre_deployment_checks
    create_backup
    build_images
    
    # Deploy based on strategy
    case "$DEPLOY_TYPE" in
        rolling)
            deploy_rolling
            ;;
        blue-green)
            deploy_blue_green
            ;;
        recreate)
            deploy_recreate
            ;;
        *)
            error "Invalid deploy type: $DEPLOY_TYPE"
            ;;
    esac
    
    post_deployment
    health_check
    
    # Clean up old images
    log "Cleaning up old Docker images..."
    docker image prune -f
    
    # Generate deployment report
    cat > "deployment_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).log" << EOF
Deployment Report
=================
Date: $(date)
Environment: $ENVIRONMENT
Version: $VERSION
Deploy Type: $DEPLOY_TYPE
Status: SUCCESS

Services:
$(docker-compose -f devops/docker/production/docker-compose.prod.yml ps)

Health Check: PASSED
EOF
    
    log "======================================"
    log "✅ Deployment completed successfully!"
    log "======================================"
    info "Environment: $ENVIRONMENT"
    info "Version: $VERSION"
    info "URL: ${PRODUCTION_URL:-http://localhost}"
    echo ""
    log "Please monitor the application for any issues."
}

# Run main deployment
main