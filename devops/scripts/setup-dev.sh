#!/bin/bash
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions for colored output
log() { echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }

# ASCII Art Banner
echo -e "${BLUE}"
cat << "EOF"
 _   _       _       _   ____                        __  __                            
| | | | ___ | |_ ___| | |  _ \ ___   ___  _ __ ___  |  \/  | __ _ _ __  _ __   ___ _ __ 
| |_| |/ _ \| __/ _ \ | | |_) / _ \ / _ \| '_ ` _ \ | |\/| |/ _` | '_ \| '_ \ / _ \ '__|
|  _  | (_) | ||  __/ | |  _ < (_) | (_) | | | | | || |  | | (_| | |_) | |_) |  __/ |   
|_| |_|\___/ \__\___|_| |_| \_\___/ \___/|_| |_| |_||_|  |_|\__,_| .__/| .__/ \___|_|   
                                                                  |_|   |_|              
EOF
echo -e "${NC}"

log "Starting Hotel Room Mapper development environment setup..."

# Check prerequisites
log "Checking prerequisites..."

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
    error "Docker is required but not installed. Please install Docker Desktop."
fi

# Check Docker Compose
if ! command -v docker-compose >/dev/null 2>&1 && ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose is required but not installed."
fi

# Check if Docker daemon is running
if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running. Please start Docker Desktop."
fi

# Detect OS
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    OS="windows"
fi

info "Detected OS: $OS"

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
DEVOPS_DIR="$PROJECT_ROOT/devops"
DOCKER_DIR="$DEVOPS_DIR/docker/development"

cd "$PROJECT_ROOT"

# Create necessary directories
log "Creating necessary directories..."
mkdir -p backend frontend
mkdir -p "$DEVOPS_DIR/monitoring/grafana/dashboards"
mkdir -p "$DEVOPS_DIR/monitoring/grafana/datasources"

# Setup environment file
ENV_FILE="$DOCKER_DIR/.env"
if [ ! -f "$ENV_FILE" ]; then
    log "Creating environment file..."
    if [ -f "$DOCKER_DIR/.env.example" ]; then
        cp "$DOCKER_DIR/.env.example" "$ENV_FILE"
        warn "Environment file created. Please review: $ENV_FILE"
    else
        warn ".env.example not found, creating minimal .env file..."
        cat > "$ENV_FILE" << 'EOL'
# Database Configuration
DB_NAME=hotel_mapper
DB_USER=postgres
DB_PASS=postgres
DB_PORT=5432

# Redis Configuration
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=development-secret-key-change-in-production

# Grafana Configuration
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin

# Application Configuration
NODE_ENV=development
LOG_LEVEL=debug
UPLOAD_MAX_SIZE=10485760
CORS_ORIGIN=http://localhost:5173
EOL
    fi
else
    log "Environment file already exists, skipping..."
fi

# Check if backend/package.json exists
if [ ! -f "$PROJECT_ROOT/backend/package.json" ]; then
    warn "Backend package.json not found. Creating minimal package.json..."
    cat > "$PROJECT_ROOT/backend/package.json" << 'EOL'
{
  "name": "hotel-mapper-backend",
  "version": "1.0.0",
  "description": "Hotel Room Mapper Backend API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --watch src --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "db:migrate": "echo 'Migration placeholder'",
    "db:seed": "echo 'Seed placeholder'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "sequelize": "^6.35.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "nodemon": "^3.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
EOL
fi

# Check if frontend/package.json exists
if [ ! -f "$PROJECT_ROOT/frontend/package.json" ]; then
    warn "Frontend package.json not found. Creating minimal package.json..."
    cat > "$PROJECT_ROOT/frontend/package.json" << 'EOL'
{
  "name": "hotel-mapper-frontend",
  "version": "1.0.0",
  "description": "Hotel Room Mapper Frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
EOL
fi

# Stop any existing containers
log "Stopping any existing containers..."
cd "$DOCKER_DIR"
docker-compose down -v 2>/dev/null || true

# Clean up dangling images and volumes
log "Cleaning up Docker resources..."
docker system prune -f 2>/dev/null || true

# Build and start services
log "Building Docker images (this may take a few minutes)..."
docker-compose build --no-cache

log "Starting Docker services..."
docker-compose up -d

# Wait for PostgreSQL to be ready
log "Waiting for PostgreSQL to be ready..."
MAX_TRIES=30
TRIES=0
while ! docker-compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1; do
    TRIES=$((TRIES + 1))
    if [ $TRIES -gt $MAX_TRIES ]; then
        error "PostgreSQL failed to start after $MAX_TRIES attempts"
    fi
    echo -n "."
    sleep 2
done
echo ""

# Initialize database
log "Initializing database schema..."
if [ -f "$PROJECT_ROOT/database/08_create_all.sql" ]; then
    docker-compose exec -T postgres psql -U postgres -d hotel_mapper < "$PROJECT_ROOT/database/08_create_all.sql" 2>/dev/null || warn "Database might already be initialized"
else
    warn "Database initialization script not found. Skipping database setup."
fi

# Wait for all services to be healthy
log "Waiting for all services to be ready..."
sleep 10

# Health check
log "Running health checks..."
SERVICES=("postgres:5432" "redis:6379" "backend:3001" "nginx:80")
for SERVICE in "${SERVICES[@]}"; do
    HOST="${SERVICE%%:*}"
    PORT="${SERVICE#*:}"
    
    if docker-compose exec -T nginx nc -zv $HOST $PORT 2>/dev/null; then
        log "✓ $HOST is ready on port $PORT"
    else
        warn "✗ $HOST is not responding on port $PORT"
    fi
done

# Display service URLs
echo ""
log "======================================"
log "✅ Development environment is ready!"
log "======================================"
echo ""
info "🌐 Application: http://localhost"
info "📊 API Backend: http://localhost:3001"
info "📈 Prometheus: http://localhost:9090"
info "📊 Grafana: http://localhost:3000 (admin/admin)"
info "🗄️ PostgreSQL: localhost:5432 (postgres/postgres)"
info "💾 Redis: localhost:6379"
echo ""
log "Useful commands:"
echo "  View logs:        docker-compose logs -f [service]"
echo "  Stop services:    docker-compose down"
echo "  Restart service:  docker-compose restart [service]"
echo "  Access database:  docker-compose exec postgres psql -U postgres -d hotel_mapper"
echo "  Redis CLI:        docker-compose exec redis redis-cli"
echo ""
log "To stop all services, run: docker-compose down"
log "To remove all data, run: docker-compose down -v"
echo ""

# Keep script running if in Windows Git Bash
if [[ "$OS" == "windows" ]]; then
    read -p "Press Enter to continue..."
fi