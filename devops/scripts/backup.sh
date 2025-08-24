#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=${RETENTION_DAYS:-7}
COMPOSE_FILE="${COMPOSE_FILE:-devops/docker/development/docker-compose.yml}"

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

# Parse arguments
BACKUP_TYPE="${1:-full}"
ENVIRONMENT="${2:-development}"

log "Starting backup process..."
info "Backup type: $BACKUP_TYPE"
info "Environment: $ENVIRONMENT"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

cd "$PROJECT_ROOT"

# Adjust compose file based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    COMPOSE_FILE="devops/docker/production/docker-compose.prod.yml"
fi

# Check if Docker services are running
if ! docker-compose -f "$COMPOSE_FILE" ps postgres 2>/dev/null | grep -q "Up\|running"; then
    error "PostgreSQL container is not running. Please start the services first."
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
BACKUP_SUBDIR="$BACKUP_DIR/${ENVIRONMENT}_${DATE}"
mkdir -p "$BACKUP_SUBDIR"

log "Backup directory: $BACKUP_SUBDIR"

# Function to get container name
get_container() {
    local service=$1
    docker-compose -f "$COMPOSE_FILE" ps -q $service 2>/dev/null
}

# Backup database
backup_database() {
    log "Creating database backup..."
    
    local DB_CONTAINER=$(get_container postgres)
    if [ -z "$DB_CONTAINER" ]; then
        error "PostgreSQL container not found"
    fi
    
    # Get database credentials from environment
    local DB_NAME="${DB_NAME:-hotel_mapper}"
    local DB_USER="${DB_USER:-postgres}"
    
    # Create SQL dump
    docker exec "$DB_CONTAINER" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --format=custom \
        --compress=9 \
        --verbose \
        --file=/tmp/backup.dump 2>/dev/null || error "Database backup failed"
    
    # Copy dump from container
    docker cp "$DB_CONTAINER:/tmp/backup.dump" "$BACKUP_SUBDIR/database_${DATE}.dump"
    
    # Clean up container temp file
    docker exec "$DB_CONTAINER" rm /tmp/backup.dump
    
    # Also create a plain SQL backup for easy inspection
    docker exec "$DB_CONTAINER" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --no-password \
        --format=plain \
        --file=/tmp/backup.sql 2>/dev/null
    
    docker cp "$DB_CONTAINER:/tmp/backup.sql" "$BACKUP_SUBDIR/database_${DATE}.sql"
    docker exec "$DB_CONTAINER" rm /tmp/backup.sql
    
    log "✓ Database backup completed"
}

# Backup uploaded files
backup_uploads() {
    log "Backing up uploaded files..."
    
    local BACKEND_CONTAINER=$(get_container backend)
    if [ -z "$BACKEND_CONTAINER" ]; then
        warn "Backend container not found, trying volume backup..."
        
        # Try to backup from volume directly
        docker run --rm \
            -v hotel_mapper_uploads_data:/uploads:ro \
            -v "$(pwd)/$BACKUP_SUBDIR:/backup" \
            alpine tar czf "/backup/uploads_${DATE}.tar.gz" -C / uploads 2>/dev/null || warn "Uploads backup failed"
    else
        # Create tar archive in container
        docker exec "$BACKEND_CONTAINER" tar czf /tmp/uploads.tar.gz -C /app uploads 2>/dev/null || warn "No uploads to backup"
        
        # Copy archive from container
        docker cp "$BACKEND_CONTAINER:/tmp/uploads.tar.gz" "$BACKUP_SUBDIR/uploads_${DATE}.tar.gz" 2>/dev/null || warn "Failed to copy uploads"
        
        # Clean up container temp file
        docker exec "$BACKEND_CONTAINER" rm -f /tmp/uploads.tar.gz 2>/dev/null || true
    fi
    
    log "✓ Uploads backup completed"
}

# Backup configuration files
backup_configs() {
    log "Backing up configuration files..."
    
    # Create configs directory
    mkdir -p "$BACKUP_SUBDIR/configs"
    
    # Backup Docker configurations
    if [ -d "devops/docker" ]; then
        cp -r devops/docker "$BACKUP_SUBDIR/configs/" 2>/dev/null || warn "Failed to backup Docker configs"
    fi
    
    # Backup environment files (exclude secrets)
    find devops -name "*.env.example" -type f -exec cp --parents {} "$BACKUP_SUBDIR/configs/" \; 2>/dev/null || true
    
    # Backup nginx configurations
    if [ -d "devops/docker/nginx" ]; then
        cp -r devops/docker/nginx "$BACKUP_SUBDIR/configs/" 2>/dev/null || warn "Failed to backup Nginx configs"
    fi
    
    log "✓ Configuration backup completed"
}

# Backup Redis data (if needed)
backup_redis() {
    log "Backing up Redis data..."
    
    local REDIS_CONTAINER=$(get_container redis)
    if [ -z "$REDIS_CONTAINER" ]; then
        warn "Redis container not found, skipping..."
        return
    fi
    
    # Trigger Redis save
    docker exec "$REDIS_CONTAINER" redis-cli BGSAVE 2>/dev/null || warn "Redis backup failed"
    sleep 2
    
    # Copy dump file
    docker cp "$REDIS_CONTAINER:/data/dump.rdb" "$BACKUP_SUBDIR/redis_${DATE}.rdb" 2>/dev/null || warn "Failed to copy Redis dump"
    
    log "✓ Redis backup completed"
}

# Main backup process
case "$BACKUP_TYPE" in
    full)
        backup_database
        backup_uploads
        backup_configs
        backup_redis
        ;;
    database)
        backup_database
        ;;
    uploads)
        backup_uploads
        ;;
    configs)
        backup_configs
        ;;
    redis)
        backup_redis
        ;;
    *)
        error "Invalid backup type. Use: full, database, uploads, configs, or redis"
        ;;
esac

# Create compressed archive of all backups
log "Creating compressed archive..."
cd "$BACKUP_DIR"
tar czf "${ENVIRONMENT}_backup_${DATE}.tar.gz" "${ENVIRONMENT}_${DATE}/"

# Remove uncompressed backup directory
rm -rf "${ENVIRONMENT}_${DATE}/"

# Cleanup old backups
log "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "${ENVIRONMENT}_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true

# Calculate backup size
BACKUP_SIZE=$(du -h "${ENVIRONMENT}_backup_${DATE}.tar.gz" | cut -f1)

# Generate backup report
cat > "${ENVIRONMENT}_backup_${DATE}.txt" << EOF
Backup Report
=============
Date: $(date)
Type: $BACKUP_TYPE
Environment: $ENVIRONMENT
File: ${ENVIRONMENT}_backup_${DATE}.tar.gz
Size: $BACKUP_SIZE
Retention: $RETENTION_DAYS days

Contents:
$(tar tzf "${ENVIRONMENT}_backup_${DATE}.tar.gz" | head -20)
...

Restore Command:
./scripts/restore.sh ${ENVIRONMENT}_backup_${DATE}.tar.gz
EOF

# Display summary
echo ""
log "======================================"
log "✅ Backup completed successfully!"
log "======================================"
info "📁 Backup file: $BACKUP_DIR/${ENVIRONMENT}_backup_${DATE}.tar.gz"
info "📊 Size: $BACKUP_SIZE"
info "📋 Report: $BACKUP_DIR/${ENVIRONMENT}_backup_${DATE}.txt"
info "🔄 Retention: $RETENTION_DAYS days"
echo ""
log "To restore this backup, run:"
echo "  ./scripts/restore.sh ${ENVIRONMENT}_backup_${DATE}.tar.gz"