## 📁 05_project_coordination.md

```markdown
# Coordinador de Proyecto - Integración y Especificaciones Claude Code

## Contexto General del Proyecto
Eres el Coordinador Senior de este proyecto de desarrollo Full Stack. Tu misión es orquestar la ejecución ordenada de todos los componentes del sistema Hotel Room Mapper usando Claude Code de manera eficiente y coordinada.

## Resumen de Arquitectura Global
- **Frontend**: React 18 + TypeScript + Canvas API + Zustand
- **Backend**: Node.js + Express + TypeScript + Sequelize + PostgreSQL
- **DevOps**: Docker + Docker Compose + CI/CD + Monitoring
- **Database**: PostgreSQL con esquemas optimizados para coordenadas geométricas

## Plan de Ejecución por Fases

### FASE 1: Fundaciones y Setup (Prioridad Máxima)
**Orden de Ejecución Crítico:**

1. **Database Schema Setup** (Primer paso obligatorio)
   - Crear estructura completa PostgreSQL con tablas, índices y funciones
   - Implementar triggers para contadores e historial
   - Configurar constraints y validaciones geométricas
   - Testing queries de performance críticas

2. **Backend API Foundation** (Segundo paso)
   - Setup proyecto Express + TypeScript + Sequelize
   - Configurar modelos de base de datos y relaciones
   - Implementar middleware básicos (cors, helmet, validation)
   - Crear endpoints CRUD básicos sin lógica compleja

3. **DevOps Development Environment** (Tercer paso)
   - Docker Compose para desarrollo local
   - Configuración Nginx básica
   - Scripts setup automatizado
   - Health checks básicos

### FASE 2: Core Business Logic (Construcción Principal)
**Orden de Ejecución:**

1. **Backend Services Completos**
   - Image processing con Sharp + Multer
   - Coordinate validation services
   - Hotel/Floor/Room business logic
   - Error handling centralizado
   - Testing unitario e integración

2. **Frontend Foundation**
   - Setup React + TypeScript + Zustand
   - Componentes UI básicos y layouts
   - Hooks personalizados para API
   - Servicios y utilities matemáticas

3. **Frontend Canvas Core**
   - ImageMapper component con Canvas API
   - Sistema coordenadas normalizadas
   - Drawing tools básicos
   - Integration con backend APIs

### FASE 3: Features Avanzadas (Funcionalidades Completas)
**Orden de Ejecución:**

1. **Frontend Advanced Features**
   - RoomPopup system (tooltips + modals)
   - Advanced drawing tools (zoom, pan, undo/redo)
   - FloorSelector y navegación
   - Validación formularios en tiempo real

2. **Backend Advanced Features**
   - Image upload + processing pipeline completo
   - Overlap detection geométrica
   - Coordinate history tracking
   - Performance optimizations

3. **Integration & Testing**
   - E2E testing completo
   - Performance testing
   - Bug fixing y optimizations
   - Documentation API

### FASE 4: Production Ready (Despliegue y Monitoring)
**Orden de Ejecución:**

1. **DevOps Production Setup**
   - CI/CD pipeline completo
   - Production Docker configurations
   - Monitoring con Prometheus + Grafana
   - Backup/restore automatizado

2. **Security & Performance**
   - Security headers y validaciones
   - Performance monitoring
   - Load testing
   - Security scanning

## Especificaciones para Claude Code

### Comandos Iniciales Requeridos
```bash
# Crear estructura de proyecto
mkdir hotel-mapper
cd hotel-mapper
mkdir -p {frontend,backend,database,devops}

# Frontend setup
cd frontend
npm create vite@latest . -- --template react-ts
npm install zustand react-hook-form @hookform/resolvers zod lucide-react

# Backend setup  
cd ../backend
npm init -y
npm install express typescript @types/node sequelize pg multer sharp zod helmet cors winston

# Database setup
cd ../database
# Scripts SQL y migraciones

# DevOps setup
cd ../devops
mkdir -p {docker/{development,production,nginx},scripts,monitoring,config}
Estructura Directorios Final Esperada
hotel-mapper/
├── frontend/                    # React + TypeScript app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   ├── public/
│   └── package.json
├── backend/                     # Node.js + Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── types/
│   │   └── utils/
│   ├── uploads/
│   └── package.json
├── database/                    # SQL schemas y migraciones
│   ├── migrations/
│   ├── seeds/
│   ├── functions/
│   └── views/
├── devops/                      # Infrastructure as code
│   ├── docker/
│   ├── scripts/
│   ├── monitoring/
│   └── config/
└── README.md
Dependencias Críticas Entre Componentes
Database → Backend Dependencies

Backend models requieren schema DB completo
Sequelize migrations dependen de SQL base
Coordinate services necesitan funciones SQL

Backend → Frontend Dependencies

Frontend APIs requieren endpoints backend funcionando
Stores Zustand necesitan servicios API definidos
Canvas coordinates dependen de validación backend

DevOps → All Components Dependencies

Docker Compose necesita backend/frontend buildables
CI/CD requiere tests implementados
Monitoring necesita health endpoints

Puntos de Integración Críticos
1. Coordinate System Integration
Backend ↔ Frontend:

Coordenadas normalizadas (0-1) en ambos lados
Validación geométrica consistente
Conversión pixel ↔ normalizado sincronizada

2. Image Upload Pipeline
Frontend → Backend → Storage:

Drag & drop frontend validation
Backend processing con Sharp
URL generation y serving estático

3. Real-time Validation
Frontend ↔ Backend:

Overlap detection en tiempo real
Coordinate bounds validation
Error feedback inmediato

Testing Strategy Coordinada
Unit Tests por Componente

Database: Funciones SQL + triggers
Backend: Services + utilities + endpoints
Frontend: Hooks + components + utilities
DevOps: Scripts + configurations

Integration Tests Cross-Component

API Integration: Frontend ↔ Backend
Database Integration: Backend ↔ Database
Full Stack: Upload → Process → Store → Display

E2E Tests Complete User Flows

Upload hotel image → Draw rooms → Save → Edit → Delete
Multiple floors navigation
Error handling scenarios

Performance Targets
Frontend Performance

Canvas rendering: 60fps sustained
Image loading: <2s for 5MB images
UI interactions: <16ms response time
Bundle size: <500KB gzipped

Backend Performance

API endpoints: <200ms average response
Image processing: <5s for 10MB images
Database queries: <50ms simple, <200ms complex
Upload throughput: >1MB/s

DevOps Performance

Development setup: <5min complete
CI/CD pipeline: <10min full cycle
Deploy time: <2min zero downtime
Backup/restore: <30s for typical DB

Quality Gates por Fase
Fase 1 Quality Gates

✅ Database schema passes all constraint tests
✅ Backend basic CRUD endpoints functional
✅ DevOps development environment fully automated
✅ All health checks passing

Fase 2 Quality Gates

✅ Image upload + processing pipeline working
✅ Canvas drawing basic functionality working
✅ Coordinate system validation working
✅ Unit tests >80% coverage critical components

Fase 3 Quality Gates

✅ Complete user workflows functional
✅ Real-time validation and error handling
✅ Performance targets met
✅ Integration tests passing

Fase 4 Quality Gates

✅ Production deployment successful
✅ Monitoring and alerting functional
✅ Security scans passing
✅ Performance monitoring active

Comandos Claude Code por Fase
Fase 1 Commands
bash# Database setup
claude code create-database-schema --sql-files --migrations --indexes

# Backend foundation
claude code create-express-api --typescript --sequelize --basic-crud

# DevOps setup
claude code create-docker-dev-env --compose --services --health-checks
Fase 2 Commands
bash# Backend services
claude code implement-image-services --sharp --multer --validation
claude code implement-coordinate-services --geometry --overlap-detection

# Frontend foundation  
claude code create-react-app --typescript --zustand --canvas-ready
claude code implement-api-hooks --services --error-handling
Fase 3 Commands
bash# Frontend advanced
claude code implement-canvas-drawing --normalized-coordinates --tools
claude code implement-room-management --popups --forms --validation

# Backend advanced
claude code implement-advanced-validation --geometry --business-rules
claude code optimize-performance --caching --queries
Fase 4 Commands
bash# DevOps production
claude code create-cicd-pipeline --github-actions --security-scanning
claude code implement-monitoring --prometheus --grafana --alerts

# Final integration
claude code run-full-test-suite --unit --integration --e2e
claude code optimize-production --performance --security
Troubleshooting Common Issues
Database Connection Issues

Check PostgreSQL container status
Verify connection strings and credentials
Confirm port availability and networking

Canvas Performance Problems

Optimize rendering with requestAnimationFrame
Implement proper cleanup event listeners
Use proper coordinate caching strategies

Docker Build Problems

Clear Docker cache and rebuild from scratch
Check multi-stage build dependencies
Verify file permissions and ownership

CI/CD Pipeline Failures

Check environment variables and secrets
Verify test database availability
Confirm Docker registry permissions

Success Metrics
Development Velocity

Time to setup: <1 hour complete development environment
Feature development: <2 days per major feature
Bug fix cycle: <4 hours average resolution
Deploy frequency: Multiple times per day

Technical Quality

Code coverage: >80% for critical components
Performance benchmarks: All targets met
Security scans: Zero high-severity issues
Documentation: Complete API and deployment docs

User Experience

Load time: <3s first load, <1s subsequent
Interaction responsiveness: <100ms perceived
Error recovery: Graceful handling all scenarios
Mobile compatibility: Full feature parity

Este coordinador debe usarse como referencia para mantener el proyecto organizado y asegurar que Claude Code execute los componentes en el orden correcto para minimizar dependencias y maximizar eficiencia.
