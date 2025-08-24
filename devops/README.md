# Hotel Room Mapper - DevOps Infrastructure

## Overview

Complete DevOps infrastructure for the Hotel Room Mapper application, including Docker containerization, CI/CD pipelines, monitoring, and deployment automation.

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Git installed
- Minimum 4GB RAM available
- 10GB free disk space

### Development Environment Setup

```bash
# Clone the repository
git clone <repository-url>
cd Neo3D

# Run the setup script
./devops/scripts/setup-dev.sh

# Access the application
# Frontend: http://localhost
# API: http://localhost:3001
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
```

## Directory Structure

```
devops/
├── docker/                   # Docker configurations
│   ├── development/         # Development environment
│   ├── production/          # Production environment
│   └── nginx/              # Nginx configurations
├── scripts/                 # Automation scripts
│   ├── setup-dev.sh        # Development setup
│   ├── backup.sh           # Backup script
│   ├── restore.sh          # Restore script
│   ├── health-check.sh     # Health monitoring
│   └── deploy.sh           # Deployment script
├── monitoring/              # Monitoring configuration
│   ├── prometheus/         # Prometheus metrics
│   └── grafana/           # Grafana dashboards
├── ci-cd/                  # CI/CD pipelines
│   └── .github/workflows/  # GitHub Actions
└── config/                 # Environment configs
    ├── environments/       # Environment variables
    └── secrets/           # Secret templates
```

## Services

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 5173 (dev) / 80 (prod) | React application |
| Backend API | 3001 | Node.js Express API |
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Cache layer |
| Nginx | 80/443 | Reverse proxy |

### Monitoring Services

| Service | Port | URL | Credentials |
|---------|------|-----|-------------|
| Prometheus | 9090 | http://localhost:9090 | - |
| Grafana | 3000 | http://localhost:3000 | admin/admin |
| PostgreSQL Exporter | 9187 | - | - |

## Commands

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Stop all services
docker-compose down

# Rebuild services
docker-compose up -d --build

# Remove all data
docker-compose down -v
```

### Database Access

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d hotel_mapper

# Run migrations
docker-compose exec backend npm run db:migrate

# Seed database
docker-compose exec backend npm run db:seed
```

### Backup & Restore

```bash
# Create backup
./devops/scripts/backup.sh full development

# Restore from backup
./devops/scripts/restore.sh ./backups/development_backup_20240101_120000.tar.gz

# Backup specific components
./devops/scripts/backup.sh database development
./devops/scripts/backup.sh uploads development
```

### Health Checks

```bash
# Run health check
./devops/scripts/health-check.sh

# Verbose health check
VERBOSE=true ./devops/scripts/health-check.sh
```

## Deployment

### Staging Deployment

```bash
./devops/scripts/deploy.sh staging latest rolling
```

### Production Deployment

```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Deploy to production
./devops/scripts/deploy.sh production v1.0.0 blue-green
```

## Environment Configuration

### Development

Edit `devops/docker/development/.env`:

```env
DB_NAME=hotel_mapper
DB_USER=postgres
DB_PASS=postgres
JWT_SECRET=development-secret-key
```

### Production

Configure `devops/config/environments/production.env`:

```env
NODE_ENV=production
DB_HOST=production-db-host
DB_PASS=secure-password
JWT_SECRET=very-secure-secret
```

## Monitoring

### Prometheus Metrics

Available at: http://localhost:9090

Key metrics:
- `up`: Service availability
- `http_request_duration_seconds`: API response times
- `pg_stat_activity_count`: Database connections
- `process_resident_memory_bytes`: Memory usage

### Grafana Dashboards

Access at: http://localhost:3000 (admin/admin)

Pre-configured dashboards:
- Hotel Mapper Overview
- API Performance
- Database Metrics
- System Resources

### Alerts

Configured alerts in `monitoring/prometheus/alerts.yml`:
- Service down
- High response time (>1s)
- High error rate (>10%)
- Database connection pool exhaustion
- Low disk space (<10%)

## CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`ci.yml`)
   - Frontend tests
   - Backend tests
   - Security scanning
   - Docker build validation
   - E2E tests

2. **CD Pipeline** (`cd.yml`)
   - Build and push Docker images
   - Deploy to staging (automatic on main)
   - Deploy to production (on tags)
   - Rollback on failure

3. **Security Scan** (`security.yml`)
   - Container vulnerability scanning
   - Dependency auditing
   - Secret detection
   - OWASP dependency check

## Security

### Best Practices

- All containers run as non-root users
- Secrets managed via environment variables
- SSL/TLS enabled in production
- Rate limiting configured
- Security headers implemented
- Regular vulnerability scanning

### Secret Management

Never commit secrets. Use the template:

```bash
cp devops/config/secrets/secrets.example.env devops/config/secrets/secrets.env
# Edit secrets.env with actual values
```

## Troubleshooting

### Common Issues

1. **Services not starting**
   ```bash
   docker-compose logs [service]
   docker-compose ps
   ```

2. **Database connection errors**
   ```bash
   docker-compose restart postgres
   docker-compose exec postgres pg_isready
   ```

3. **Port conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep [port]
   # Modify ports in .env file
   ```

4. **Disk space issues**
   ```bash
   docker system prune -a
   docker volume prune
   ```

## Performance Optimization

### Docker Optimization

- Multi-stage builds for smaller images
- Layer caching for faster builds
- Volume mounts for development
- Health checks for all services

### Application Optimization

- Connection pooling for database
- Redis caching layer
- Nginx static file serving
- Gzip compression enabled

## Maintenance

### Regular Tasks

- [ ] Weekly backups
- [ ] Monthly security updates
- [ ] Quarterly dependency updates
- [ ] Annual disaster recovery test

### Monitoring Checklist

- [ ] Check Grafana dashboards daily
- [ ] Review Prometheus alerts
- [ ] Monitor disk usage
- [ ] Check application logs
- [ ] Verify backup integrity

## Support

For issues or questions:

1. Check service logs: `docker-compose logs [service]`
2. Run health check: `./devops/scripts/health-check.sh`
3. Review monitoring dashboards
4. Check GitHub Actions for CI/CD status

## License

[Your License Here]