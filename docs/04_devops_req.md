## 📁 04_devops_requirements.md

```markdown
# DevOps Engineer - Infraestructura y Despliegue Hotel Mapper

## Contexto y Rol  
Eres un DevOps Engineer Senior especializado en containerización Docker, CI/CD automatizado y arquitecturas cloud-native escalables. Tu misión es crear una infraestructura completa de desarrollo y producción para el sistema de mapeo de hotel con focus en performance, seguridad y observabilidad.

## Stack de Infraestructura Requerido

### Tecnologías Core Obligatorias
- **Containerización**: Docker + Docker Compose para desarrollo local
- **CI/CD**: GitHub Actions con workflows automatizados
- **Monitoring**: Prometheus + Grafana para métricas
- **Logging**: Centralized logging con structured JSON
- **Security**: Container security scanning + secrets managementRBContinuarmarkdown- **Proxy/Load Balancer**: Nginx optimizado para archivos estáticos
- **Storage**: Volumes Docker para uploads + backup strategy
- **Database**: PostgreSQL containerizado con persistent volumes

## Arquitectura de Despliegue Completa

### Estructura DevOps Obligatoriadevops/
├── docker/
│   ├── development/
│   │   ├── docker-compose.yml       # Stack desarrollo completo
│   │   ├── docker-compose.override.yml
│   │   └── .env.example
│   ├── production/
│   │   ├── backend.Dockerfile       # Multi-stage optimizado
│   │   ├── frontend.Dockerfile      # Nginx + build estático
│   │   └── docker-compose.prod.yml
│   └── nginx/
│       ├── nginx.conf               # Configuración base
│       ├── development.conf         # Config desarrollo
│       └── production.conf          # Config producción
├── scripts/
│   ├── deploy.sh                    # Script despliegue automatizado
│   ├── backup.sh                    # Backup base de datos
│   ├── restore.sh                   # Restore desde backup
│   ├── health-check.sh              # Health checks servicios
│   └── setup-dev.sh                 # Setup entorno desarrollo
├── monitoring/
│   ├── prometheus/
│   │   ├── prometheus.yml           # Config métricas
│   │   └── alerts.yml               # Reglas alerting
│   ├── grafana/
│   │   ├── dashboards/              # Dashboards JSON
│   │   └── datasources/             # Config datasources
│   └── logs/
│       └── loki-config.yml          # Config logging
├── ci-cd/
│   ├── .github/
│   │   └── workflows/
│   │       ├── ci.yml               # CI testing + building
│   │       ├── cd.yml               # CD deployment
│   │       └── security.yml         # Security scanning
│   └── scripts/
│       ├── test.sh                  # Script testing
│       └── build.sh                 # Script building
└── config/
├── environments/
│   ├── development.env
│   ├── staging.env
│   └── production.env
└── secrets/
└── secrets.example.env

## Docker Configuration Detallada

### 1. Docker Compose Desarrollo Completo
**Servicios Requeridos:**
- **PostgreSQL 15**: Base de datos principal con persistent volume
- **Redis**: Cache layer para sesiones (preparación futura)
- **Backend**: API Node.js con hot reload
- **Frontend**: React dev server con HMR
- **Nginx**: Reverse proxy + static files serving
- **Prometheus**: Monitoring métricas
- **Grafana**: Visualización métricas

**Configuración Crítica:**
```yamldocker/development/docker-compose.yml
version: '3.8'services:
Base de datos PostgreSQL
postgres:
image: postgres:15-alpine
container_name: hotel_mapper_db
restart: unless-stopped
environment:
POSTGRES_DB: ${DB_NAME:-hotel_mapper}
POSTGRES_USER: ${DB_USER:-postgres}
POSTGRES_PASSWORD: ${DB_PASS:-postgres}
PGDATA: /var/lib/postgresql/data/pgdata
ports:
- "${DB_PORT:-5432}:5432"
volumes:
- postgres_data:/var/lib/postgresql/data
- ./init-scripts:/docker-entrypoint-initdb.d:ro
healthcheck:
test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-postgres} -d ${DB_NAME:-hotel_mapper}"]
interval: 30s
timeout: 10s
retries: 3
start_period: 10s
networks:
- hotel_networkCache Redis
redis:
image: redis:7-alpine
container_name: hotel_mapper_redis
restart: unless-stopped
ports:
- "${REDIS_PORT:-6379}:6379"
volumes:
- redis_data:/data
command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
healthcheck:
test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
interval: 30s
timeout: 10s
retries: 3
networks:
- hotel_networkBackend API
backend:
build:
context: ../../backend
dockerfile: ../devops/docker/development/backend.Dockerfile
target: development
container_name: hotel_mapper_backend
restart: unless-stopped
environment:
NODE_ENV: development
PORT: 3001
DB_HOST: postgres
DB_PORT: 5432
DB_NAME: ${DB_NAME:-hotel_mapper}
DB_USER: ${DB_USER:-postgres}
DB_PASS: ${DB_PASS:-postgres}
REDIS_URL: redis://redis:6379
UPLOAD_PATH: /app/uploads
CORS_ORIGIN: http://localhost:5173
LOG_LEVEL: debug
ports:
- "3001:3001"
- "9229:9229"  # Node.js debug port
volumes:
- ../../backend:/app:delegated
- /app/node_modules
- uploads_data:/app/uploads
- backend_logs:/app/logs
depends_on:
postgres:
condition: service_healthy
redis:
condition: service_healthy
networks:
- hotel_networkFrontend React
frontend:
build:
context: ../../frontend
dockerfile: ../devops/docker/development/frontend.Dockerfile
target: development
container_name: hotel_mapper_frontend
restart: unless-stopped
environment:
VITE_API_BASE_URL: http://localhost:3001/api
VITE_NODE_ENV: development
VITE_HMR_PORT: 5173
ports:
- "5173:5173"
volumes:
- ../../frontend:/app:delegated
- /app/node_modules
networks:
- hotel_networkNginx Reverse Proxy
nginx:
image: nginx:alpine
container_name: hotel_mapper_nginx
restart: unless-stopped
ports:
- "80:80"
- "443:443"
volumes:
- ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
- ./nginx/development.conf:/etc/nginx/conf.d/default.conf:ro
- uploads_data:/var/www/uploads:ro
- nginx_logs:/var/log/nginx
depends_on:
- backend
- frontend
networks:
- hotel_networkvolumes:
postgres_data:
driver: local
redis_data:
driver: local
uploads_data:
driver: local
backend_logs:
driver: local
nginx_logs:
driver: localnetworks:
hotel_network:
driver: bridge
ipam:
config:
- subnet: 172.20.0.0/16

### 2. Multi-stage Dockerfiles Optimizados

**Backend Dockerfile:**
```dockerfiledocker/production/backend.Dockerfile
Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --forceDevelopment stage
FROM node:18-alpine AS development
WORKDIR /app
RUN apk add --no-cache dumb-init curl
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
EXPOSE 3001 9229
USER node
CMD ["npm", "run", "dev"]Production stage
FROM node:18-alpine AS production
RUN addgroup -g 1001 -S nodejs && adduser -S backend -u 1001
RUN apk add --no-cache dumb-init curl
WORKDIR /app
COPY --from=build --chown=backend:nodejs /app/node_modules ./node_modules
COPY --chown=backend:nodejs . .
RUN mkdir -p uploads logs && chown -R backend:nodejs uploads logs
USER backend
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 
CMD curl -f http://localhost:3001/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]

**Frontend Dockerfile:**
```dockerfiledocker/production/frontend.Dockerfile
Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build && npm run type-checkDevelopment stage
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]Production stage
FROM nginx:alpine AS production
RUN apk add --no-cache curl
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/production.conf /etc/nginx/conf.d/default.conf
RUN touch /var/run/nginx.pid && 
chown -R nginx:nginx /var/run/nginx.pid /usr/share/nginx/html /var/cache/nginx
USER nginx
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 
CMD curl -f http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]

## Nginx Configuration Optimizada

### Configuración Base Nginx
```nginxdocker/nginx/nginx.conf
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;events {
worker_connections 1024;
use epoll;
multi_accept on;
}http {
include /etc/nginx/mime.types;
default_type application/octet-stream;# Logging optimizado
log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                '$status $body_bytes_sent "$http_referer" '
                '"$http_user_agent" "$http_x_forwarded_for" '
                'rt=$request_time uct="$upstream_connect_time" '
                'uht="$upstream_header_time" urt="$upstream_response_time"';access_log /var/log/nginx/access.log main buffer=16k flush=5s;# Performance optimizations
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
types_hash_max_size 2048;
client_max_body_size 10M;
client_body_timeout 60s;
client_header_timeout 60s;# Compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml+rss
    application/atom+xml
    image/svg+xml;# Security headers básicos
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy strict-origin-when-cross-origin always;include /etc/nginx/conf.d/*.conf;
}

### Configuración Desarrollo
```nginxdocker/nginx/development.conf
upstream backend {
server backend:3001 max_fails=3 fail_timeout=30s;
keepalive 32;
}upstream frontend {
server frontend:5173 max_fails=3 fail_timeout=30s;
keepalive 32;
}Rate limiting básico desarrollo
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=uploads:10m rate=5r/s;server {
listen 80;
server_name localhost;
server_tokens off;# API Backend con rate limiting relajado
location /api/ {
    limit_req zone=api burst=50 nodelay;    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;    # Timeouts development
    proxy_connect_timeout 5s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
}# File uploads
location /api/uploads/ {
    limit_req zone=uploads burst=10 nodelay;    proxy_pass http://backend;
    proxy_request_buffering off;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;    proxy_connect_timeout 10s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;
}# Static uploaded files
location /uploads/ {
    alias /var/www/uploads/;
    expires 1h;
    add_header Cache-Control "public";    # Solo servir imágenes
    location ~* \.(jpg|jpeg|png|webp|gif)$ {
        expires 1h;
    }    location ~* \.(php|html|htm|js|css|txt|xml|json)$ {
        deny all;
    }
}# Frontend React con HMR
location / {
    proxy_pass http://frontend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;    # HMR support
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}# Health check
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
}

## CI/CD Pipeline GitHub Actions

### Workflow CI Completo
```yaml.github/workflows/ci.yml
name: Hotel Mapper CIon:
push:
branches: [main, develop]
pull_request:
branches: [main]env:
NODE_VERSION: '18'
POSTGRES_VERSION: '15'jobs:
Frontend Testing
frontend-test:
name: Frontend Tests
runs-on: ubuntu-latest
defaults:
run:
working-directory: frontendsteps:
- name: Checkout code
  uses: actions/checkout@v4- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
    cache-dependency-path: frontend/package-lock.json- name: Install dependencies
  run: npm ci --prefer-offline --no-audit- name: Type checking
  run: npm run type-check- name: Lint code
  run: npm run lint- name: Run unit tests
  run: npm run test:coverage- name: Build frontend
  run: npm run build- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    directory: frontend/coverage
    flags: frontend- name: Upload build artifacts
  uses: actions/upload-artifact@v4
  with:
    name: frontend-build-${{ github.sha }}
    path: frontend/dist
    retention-days: 7Backend Testing
backend-test:
name: Backend Tests
runs-on: ubuntu-latest
defaults:
run:
working-directory: backendservices:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hotel_mapper_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432steps:
- name: Checkout code
  uses: actions/checkout@v4- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json- name: Install dependencies
  run: npm ci --prefer-offline --no-audit- name: Type checking
  run: npm run type-check- name: Lint code
  run: npm run lint- name: Run unit tests
  env:
    DATABASE_URL: postgres://postgres:postgres@localhost:5432/hotel_mapper_test
    NODE_ENV: test
    JWT_SECRET: test-secret
    UPLOAD_PATH: ./test-uploads
  run: npm run test:coverage- name: Run integration tests
  env:
    DATABASE_URL: postgres://postgres:postgres@localhost:5432/hotel_mapper_test
    NODE_ENV: test
    JWT_SECRET: test-secret
    UPLOAD_PATH: ./test-uploads
  run: npm run test:integration- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    directory: backend/coverage
    flags: backendSecurity Scanning
security-scan:
name: Security Scan
runs-on: ubuntu-latest
steps:
- name: Checkout code
uses: actions/checkout@v4- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    scan-ref: '.'
    format: 'sarif'
    output: 'trivy-results.sarif'- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v2
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'- name: Audit npm packages (Frontend)
  run: |
    cd frontend
    npm audit --audit-level moderate- name: Audit npm packages (Backend)
  run: |
    cd backend  
    npm audit --audit-level moderateDocker Build
docker-build:
name: Docker Build Test
runs-on: ubuntu-latest
needs: [frontend-test, backend-test]
if: github.event_name != 'pull_request'strategy:
  matrix:
    component: [frontend, backend]steps:
- name: Checkout code
  uses: actions/checkout@v4- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3- name: Build Docker image
  uses: docker/build-push-action@v5
  with:
    context: ./${{ matrix.component }}
    file: ./devops/docker/production/${{ matrix.component }}.Dockerfile
    target: production
    push: false
    tags: hotel-mapper-${{ matrix.component }}:test
    cache-from: type=gha
    cache-to: type=gha,mode=maxE2E Tests
e2e-test:
name: E2E Tests
runs-on: ubuntu-latest
needs: [frontend-test, backend-test]
if: github.event_name != 'pull_request'steps:
- name: Checkout code
  uses: actions/checkout@v4- name: Start services
  run: |
    cd devops/docker/development
    docker-compose up -d --build
    sleep 30- name: Wait for services
  run: |
    timeout 120 sh -c 'until curl -f http://localhost/health; do sleep 5; done'- name: Run E2E tests
  run: |
    cd frontend
    npm ci
    npm run test:e2e- name: Stop services
  if: always()
  run: |
    cd devops/docker/development
    docker-compose down -v

## Scripts de Automatización

### Script Setup Desarrollo
```bash#!/bin/bash
scripts/setup-dev.sh
set -euo pipefailColors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'log() { echo -e "GREEN[{GREEN}[
GREEN[(date +'%H:%M:%S')] 11
1{NC}"; }
warn() { echo -e "YELLOW[{YELLOW}[
YELLOW[(date +'%H:%M:%S')] WARNING: 11
1{NC}"; }
error() { echo -e "RED[{RED}[
RED[(date +'%H:%M:%S')] ERROR: 11
1{NC}"; exit 1; }
log "🚀 Setting up Hotel Mapper development environment..."Check prerequisites
command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required but not installed"
command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
command -v npm >/dev/null 2>&1 || error "npm is required but not installed"Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
error "Node.js version 18 or higher is required (current: $(node --version))"
fiCreate environment file if not exists
ENV_FILE="devops/docker/development/.env"
if [ ! -f "$ENV_FILE" ]; then
    log "Creating environment file..."
    cp "ENVFILE.example""{ENV_FILE}.example" "
ENVF​ILE.example""ENV_FILE"
    warn "Please review and update $ENV_FILE with your settings"
fi
Install frontend dependencies
log "Installing frontend dependencies..."
cd frontend
npm ci --prefer-offline
cd ..Install backend dependencies
log "Installing backend dependencies..."
cd backend
npm ci --prefer-offline
cd ..Build and start services
log "Building and starting Docker services..."
cd devops/docker/development
docker-compose down -v 2>/dev/null || true
docker-compose up -d --buildWait for services to be ready
log "Waiting for services to start..."
timeout 120 sh -c 'until curl -f http://localhost/health >/dev/null 2>&1; do sleep 5; done' || error "Services failed to start"Run database migrations
log "Running database migrations..."
docker-compose exec backend npm run db:migrateSeed database with example data
log "Seeding database..."
docker-compose exec backend npm run db:seedlog "✅ Development environment setup complete!"
log "🌐 Application available at: http://localhost"
log "📊 API available at: http://localhost/api"
log "📚 API docs available at: http://localhost/api/docs"
log ""
log "Useful commands:"
log "  View logs: docker-compose logs -f"
log "  Stop services: docker-compose down"
log "  Restart backend: docker-compose restart backend"
log "  Access database: docker-compose exec postgres psql -U postgres -d hotel_mapper"

### Script Deploy Automatizado
```bash#!/bin/bash
scripts/deploy.sh
set -euo pipefailENVIRONMENT=${1:-development}
IMAGE_TAG=${2:-latest}
COMPOSE_FILE="devops/docker/production/docker-compose.prod.yml"Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'log() { echo -e "GREEN[{GREEN}[
GREEN[(date +'%H:%M:%S')] 11
1{NC}"; }
warn() { echo -e "YELLOW[{YELLOW}[
YELLOW[(date +'%H:%M:%S')] WARNING: 11
1{NC}"; }
error() { echo -e "RED[{RED}[
RED[(date +'%H:%M:%S')] ERROR: 11
1{NC}"; exit 1; }
Validate environment
if [[ ! "ENVIRONMENT"= (development∣staging∣production)ENVIRONMENT" =~ ^(development|staging|production)
ENVIRONMENT"= (development∣staging∣production) ]]; then
    error "Invalid environment. Must be one of: development, staging, production"
fi
log "🚀 Starting deployment to $ENVIRONMENT with tag $IMAGE_TAG"Check prerequisites
command -v docker >/dev/null 2>&1 || error "Docker is required"
command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is required"Load environment variables
ENV_FILE="devops/config/environments/${ENVIRONMENT}.env"
if [ ! -f "$ENV_FILE" ]; then
error "Environment file not found: $ENV_FILE"
filog "Loading environment from $ENV_FILE"
export (grep -v '^#' "
ENV_FILE" | xargs)
Backup database if production
if [ "$ENVIRONMENT" = "production" ]; then
log "Creating database backup..."
./scripts/backup.sh || warn "Backup failed, continuing deployment"
fiBuild images
log "Building Docker images..."
docker-compose -f "$COMPOSE_FILE" build --no-cacheTag images
log "Tagging images with $IMAGE_TAG"
docker tag hotel-mapper-backend:latest "hotel-mapper-backend:$IMAGE_TAG"
docker tag hotel-mapper-frontend:latest "hotel-mapper-frontend:$IMAGE_TAG"Deploy with zero downtime
log "Deploying services..."
docker-compose -f "$COMPOSE_FILE" up -d --no-deps --force-recreateWait for services to be healthy
log "Waiting for services to be healthy..."
timeout 180 sh -c '
    until [ "(docker−compose−f′(docker-compose -f '
(docker−compose−f′COMPOSE_FILE' ps -q | xargs docker inspect --format="{{.State.Health.Status}}" | grep -v healthy | wc -l)" = "0" ]; do
        echo "Waiting for services to be healthy..."
        sleep 10
    done
' || error "Services failed to become healthy"
Run database migrations
log "Running database migrations..."
docker-compose -f "$COMPOSE_FILE" exec -T backend npm run db:migrate:prodHealth check
log "Running health checks..."
HEALTH_URL="http://localhost/health"
HTTP_STATUS=(curl−s−o/dev/null−w"(curl -s -o /dev/null -w "%{http_code}" "
(curl−s−o/dev/null−w"HEALTH_URL" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
log "✅ Deployment successful!"
log "🌐 Application is available at: http://localhost"
else
error "❌ Health check failed (HTTP $HTTP_STATUS)"
fiCleanup old images
log "Cleaning up old Docker images..."
docker image prune -flog "🎉 Deployment to $ENVIRONMENT completed successfully!"

### Script Backup Base de Datos
```bash#!/bin/bash
scripts/backup.sh
set -euo pipefailBACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
COMPOSE_FILE="devops/docker/development/docker-compose.yml"Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'log() { echo -e "GREEN[{GREEN}[
GREEN[(date +'%H:%M:%S')] 11
1{NC}"; }
error() { echo -e "RED[{RED}[
RED[(date +'%H:%M:%S')] ERROR: 11
1{NC}"; exit 1; }
log "🗄️ Starting database backup..."Check if Docker services are running
if ! docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
error "PostgreSQL container is not running"
fiCreate backup directory
mkdir -p "$BACKUP_DIR"Database backup
log "Creating database backup..."
docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump 
-U postgres 
-d hotel_mapper 
--no-password 
--format=custom 
--compress=9 
--verbose 
> "BACKUP_DIR/hotel_mapper_
{DATE}.backup" || error "Database backup failed"
Backup uploads directory
log "Backing up uploaded files..."
docker cp "(docker−compose−f"(docker-compose -f "
(docker−compose−f"COMPOSE_FILE" ps -q backend):/app/uploads"

"BACKUP_DIR/uploads_
{DATE}/" || error "Files backup failed"
Create archive
log "Creating compressed archive..."
tar -czf "BACKUP_DIR/hotel_mapper_full_
{DATE}.tar.gz"

"BACKUP_DIR/hotel_mapper_
{DATE}.backup"

"BACKUP_DIR/uploads_
{DATE}/" || error "Archive creation failed"
Cleanup individual files
rm "BACKUP_DIR/hotel_mapper_
{DATE}.backup"
rm -rf "BACKUP_DIR/uploads_
{DATE}/"
Cleanup old backups (keep last 7 days)
find "$BACKUP_DIR" -name "hotel_mapper_full_*.tar.gz" -mtime +7 -deleteBACKUP_SIZE=(du−h"(du -h "
(du−h"BACKUP_DIR/hotel_mapper_full_${DATE}.tar.gz" | cut -f1)
log "✅ Backup completed successfully!"
log "📁 Backup file: BACKUP_DIR/hotel_mapper_full_
{DATE}.tar.gz ($BACKUP_SIZE)"


## Monitoring y Observabilidad

### Configuración Prometheus
```yamlmonitoring/prometheus/prometheus.yml
global:
scrape_interval: 15s
evaluation_interval: 15s
external_labels:
environment: developmentrule_files:

"alerts.yml"
scrape_configs:
Hotel Mapper Backend

job_name: 'hotel-mapper-backend'
static_configs:

targets: ['backend:3001']
metrics_path: /metrics
scrape_interval: 10s


PostgreSQL

job_name: 'postgres'
static_configs:

targets: ['postgres-exporter:9187']


Nginx

job_name: 'nginx'
static_configs:

targets: ['nginx-exporter:9113']


Node Exporter (system metrics)

job_name: 'node-exporter'
static_configs:

targets: ['node-exporter:9100']


alerting:
alertmanagers:

static_configs:

targets:

alertmanager:9093






### Reglas de Alerting
```yamlmonitoring/prometheus/alerts.yml
groups:

name: hotel-mapper-alerts
rules:
High error rate

alert: HighErrorRate
expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
for: 5m
labels:
severity: critical
annotations:
summary: High error rate detected
description: "Error rate is {{ $value }} errors per second"


High response time

alert: HighResponseTime
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1
for: 5m
labels:
severity: warning
annotations:
summary: High response time
description: "95th percentile response time is {{ $value }}s"
Database connection issues

alert: DatabaseConnectionHigh
expr: pg_stat_activity_count / pg_settings_max_connections > 0.8
for: 2m
labels:
severity: warning
annotations:
summary: High database connection usage
description: "Database connection usage is at {{ $value }}%"
Low disk space

alert: LowDiskSpace
expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
for: 5m
labels:
severity: critical
annotations:
summary: Low disk space
description: "Disk space usage is above 90%"
Service down

alert: ServiceDown
expr: up == 0
for: 1m
labels:
severity: critical
annotations:
summary: Service is down
description: "{{ $labels.job }} service is down"


## Health Checks y Monitoring

### Script Health Check Completo
```bash#!/bin/bash
scripts/health-check.sh
set -euo pipefailBASE_URL=${1:-http://localhost}
TIMEOUT=30Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'check_endpoint() {
local endpoint=$1
local expected_status=${2:-200}
local description=$3echo -n "Checking $description... "local status_code=$(curl -o /dev/null -s -w "%{http_code}" \
    --connect-timeout $TIMEOUT \
    --max-time $TIMEOUT \
    "$BASE_URL$endpoint" || echo "000")if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    return 0
else
    echo -e "${RED}❌ FAIL (HTTP $status_code)${NC}"
    return 1
fi
}echo "🏥 Running health checks against $BASE_URL"
echo "=========================================="FAILED=0Basic health checks
check_endpoint "/health" 200 "Application health" || ((FAILED++))
check_endpoint "/api/health" 200 "API health" || ((FAILED++))API endpoints
check_endpoint "/api/hotels" 200 "Hotels endpoint" || ((FAILED++))Static files (should return 404 for non-existent, but server should respond)
check_endpoint "/uploads/nonexistent.jpg" 404 "Static file handling" || ((FAILED++))Frontend
check_endpoint "/" 200 "Frontend homepage" || ((FAILED++))echo "=========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "GREEN🎉Allhealthcheckspassed!{GREEN}🎉 All health checks passed!
GREEN🎉Allhealthcheckspassed!{NC}"
    exit 0
else
    echo -e "{RED}❌ $FAILED health check(s) failed
{NC}"
    exit 1
fi


## Criterios de Aceptación DevOps
1. ✅ Setup desarrollo completo con un comando (`./scripts/setup-dev.sh`)
2. ✅ Docker Compose funcional con todos los servicios integrados
3. ✅ CI/CD pipeline automatizado con testing completo
4. ✅ Health checks implementados en todos los servicios
5. ✅ Backup/restore automatizado base de datos + archivos
6. ✅ Monitoring básico con Prometheus + alerting
7. ✅ Nginx optimizado para archivos estáticos + API proxy
8. ✅ Security scanning integrado en pipeline
9. ✅ Logs centralizados con formato estructurado
10. ✅ Scripts automatización para operaciones comunes

## Consideraciones Específicas Claude Code
- Crear estructura de carpetas devops antes que archivos
- Implementar docker-compose development antes que production
- Scripts de setup antes que scripts de deploy
- Configuración nginx básica antes que optimizaciones
- Monitoring básico antes que alerting avanzado
- Testing CI/CD pipeline en environment aislado