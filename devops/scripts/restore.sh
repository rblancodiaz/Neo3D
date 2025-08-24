#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_FILE="${1:-}"
ENVIRONMENT="${2:-development}"
RESTORE_TYPE="${3:-full}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
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
Usage: $0 <backup_file> [environment] [restore_type]

Arguments:
  backup_file    Path to the backup tar.gz file
  environment    Target environment (development|production) [default: development]
  restore_type   Type of restore (full|database|uploads|configs) [default: full]

Example:
  $0 ./backups/development_backup_20240101_120000.tar.gz
  $0 ./backups/production_backup_20240101_120000.tar.gz production database

EOF
    exit 1
}

# Check arguments
if [ -z "$BACKUP_FILE" ]; then
    error "Backup file not specified"
    usage
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error "Backup file not found: $BACKUP_FILE"
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# Set compose file based on environment
COMPOSE_FILE="devops/docker/${ENVIRONMENT}/docker-compose.yml"
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="devops/docker/production/docker-compose.prod.yml"
fi

log "Starting restore process..."
info "Backup file: $BACKUP_FILE"
info "Environment: $ENVIRONMENT"
info "Restore type: $RESTORE_TYPE"

# Create temp directory for extraction
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Extract backup
log "Extracting backup file..."
tar xzf "$BACKUP_FILE" -C "$TEMP_DIR"

# Find the extracted directory
BACKUP_DIR=$(find "$TEMP_DIR" -maxdepth 1 -type d | grep -v "^$TEMP_DIR$" | head -1)
if [ -z "$BACKUP_DIR" ]; then
    error "Failed to find extracted backup directory"
fi

info "Extracted to: $BACKUP_DIR"

# Function to get container
get_container() {
    local service=$1
    docker-compose -f "$COMPOSE_FILE" ps -q $service 2>/dev/null
}

# Restore database
restore_database() {
    log "Restoring database..."
    
    local DB_CONTAINER=$(get_container postgres)
    if [ -z "$DB_CONTAINER" ]; then
        error "PostgreSQL container not found. Please start services first."
    fi
    
    # Find database backup file
    local DB_DUMP=$(find "$BACKUP_DIR" -name "database_*.dump" | head -1)
    local DB_SQL=$(find "$BACKUP_DIR" -name "database_*.sql" | head -1)
    
    if [ -z "$DB_DUMP" ] && [ -z "$DB_SQL" ]; then
        error "No database backup found in archive"
    fi
    
    # Get database credentials
    local DB_NAME="${DB_NAME:-hotel_mapper}"
    local DB_USER="${DB_USER:-postgres}"
    
    # Create backup of current database
    warn "Creating backup of current database before restore..."
    docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" \
        --format=custom --compress=9 \
        --file=/tmp/pre_restore_backup.dump 2>/dev/null || warn "Pre-restore backup failed"
    
    # Drop and recreate database
    log "Recreating database..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS ${DB_NAME}" 2>/dev/null || true
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -c "CREATE DATABASE ${DB_NAME}" 2>/dev/null
    
    # Restore from dump
    if [ -n "$DB_DUMP" ]; then
        log "Restoring from dump file..."
        docker cp "$DB_DUMP" "$DB_CONTAINER:/tmp/restore.dump"
        docker exec "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" \
            --no-owner --no-acl --clean --if-exists \
            /tmp/restore.dump 2>/dev/null || error "Database restore failed"
        docker exec "$DB_CONTAINER" rm /tmp/restore.dump
    elif [ -n "$DB_SQL" ]; then
        log "Restoring from SQL file..."
        docker cp "$DB_SQL" "$DB_CONTAINER:/tmp/restore.sql"
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -f /tmp/restore.sql 2>/dev/null || error "Database restore failed"
        docker exec "$DB_CONTAINER" rm /tmp/restore.sql
    fi
    
    log "✓ Database restored successfully"
}

# Restore uploads
restore_uploads() {
    log "Restoring uploaded files..."
    
    local UPLOADS_ARCHIVE=$(find "$BACKUP_DIR" -name "uploads_*.tar.gz" | head -1)
    if [ -z "$UPLOADS_ARCHIVE" ]; then
        warn "No uploads backup found in archive"
        return
    fi
    
    # Extract uploads to temp directory
    local UPLOADS_TEMP=$(mktemp -d)
    tar xzf "$UPLOADS_ARCHIVE" -C "$UPLOADS_TEMP"
    
    # Copy to backend container
    local BACKEND_CONTAINER=$(get_container backend)
    if [ -n "$BACKEND_CONTAINER" ]; then
        # Remove existing uploads
        docker exec "$BACKEND_CONTAINER" rm -rf /app/uploads/* 2>/dev/null || true
        
        # Copy new uploads
        docker cp "$UPLOADS_TEMP/uploads/." "$BACKEND_CONTAINER:/app/uploads/" 2>/dev/null || warn "Failed to restore uploads"
    else
        warn "Backend container not found, trying volume restore..."
        
        # Restore directly to volume
        docker run --rm \
            -v hotel_mapper_uploads_data:/uploads \
            -v "$UPLOADS_TEMP:/restore:ro" \
            alpine sh -c "rm -rf /uploads/* && cp -r /restore/uploads/* /uploads/" 2>/dev/null || warn "Volume restore failed"
    fi
    
    rm -rf "$UPLOADS_TEMP"
    log "✓ Uploads restored successfully"
}

# Restore configs
restore_configs() {
    log "Restoring configuration files..."
    
    if [ ! -d "$BACKUP_DIR/configs" ]; then
        warn "No configs backup found in archive"
        return
    fi
    
    # Backup current configs
    local CONFIGS_BACKUP="devops/configs_backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$CONFIGS_BACKUP"
    
    # Copy Docker configs
    if [ -d "$BACKUP_DIR/configs/docker" ]; then
        cp -r devops/docker "$CONFIGS_BACKUP/" 2>/dev/null || true
        cp -r "$BACKUP_DIR/configs/docker/"* devops/docker/ 2>/dev/null || warn "Failed to restore Docker configs"
    fi
    
    # Copy Nginx configs
    if [ -d "$BACKUP_DIR/configs/nginx" ]; then
        cp -r "$BACKUP_DIR/configs/nginx/"* devops/docker/nginx/ 2>/dev/null || warn "Failed to restore Nginx configs"
    fi
    
    log "✓ Configs restored (backup saved to $CONFIGS_BACKUP)"
}

# Restore Redis
restore_redis() {
    log "Restoring Redis data..."
    
    local REDIS_DUMP=$(find "$BACKUP_DIR" -name "redis_*.rdb" | head -1)
    if [ -z "$REDIS_DUMP" ]; then
        warn "No Redis backup found in archive"
        return
    fi
    
    local REDIS_CONTAINER=$(get_container redis)
    if [ -z "$REDIS_CONTAINER" ]; then
        warn "Redis container not found"
        return
    fi
    
    # Stop Redis to restore
    docker exec "$REDIS_CONTAINER" redis-cli SHUTDOWN NOSAVE 2>/dev/null || true
    sleep 2
    
    # Copy dump file
    docker cp "$REDIS_DUMP" "$REDIS_CONTAINER:/data/dump.rdb"
    
    # Restart Redis container
    docker-compose -f "$COMPOSE_FILE" restart redis
    sleep 5
    
    log "✓ Redis data restored successfully"
}

# Confirmation prompt
confirm() {
    local message=$1
    read -p "$message (y/N): " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

# Main restore process
warn "This will overwrite existing data!"
if ! confirm "Are you sure you want to restore from this backup?"; then
    error "Restore cancelled by user"
fi

# Stop services if running
log "Stopping services..."
docker-compose -f "$COMPOSE_FILE" stop

# Perform restore based on type
case "$RESTORE_TYPE" in
    full)
        restore_database
        restore_uploads
        restore_configs
        restore_redis
        ;;
    database)
        restore_database
        ;;
    uploads)
        restore_uploads
        ;;
    configs)
        restore_configs
        ;;
    redis)
        restore_redis
        ;;
    *)
        error "Invalid restore type. Use: full, database, uploads, configs, or redis"
        ;;
esac

# Start services
log "Starting services..."
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
log "Waiting for services to be ready..."
sleep 10

# Run health check
log "Running health check..."
"$SCRIPT_DIR/health-check.sh" "http://localhost" "$ENVIRONMENT" || warn "Some services may not be fully ready"

# Display summary
echo ""
log "======================================"
log "✅ Restore completed successfully!"
log "======================================"
info "Environment: $ENVIRONMENT"
info "Restore type: $RESTORE_TYPE"
info "Source backup: $BACKUP_FILE"
echo ""
log "Services have been restarted. Please verify:"
echo "  - Application: http://localhost"
echo "  - Database connectivity"
echo "  - Uploaded files"
echo "  - Application functionality"