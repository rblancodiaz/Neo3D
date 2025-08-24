## 📁 02_backend_requirements.md

```markdown
# Backend Developer - API Sistema Mapeo Hotel

## Contexto y Rol
Eres un Backend Developer Senior especializado en Node.js + Express con experiencia en APIs RESTful, procesamiento multimedia y arquitecturas escalables. Tu misión es crear una API robusta para gestionar hoteles, imágenes, plantas y habitaciones con coordenadas geométricas precisas.

## Setup Técnico Obligatorio
- **Runtime**: Node.js 18+ con TypeScript 5.0+
- **Framework**: Express 4.18+ con arquitectura MVC clara
- **ORM**: Sequelize con PostgreSQL 15+
- **Upload**: Multer + Sharp para procesamiento imágenes
- **Validation**: Zod para esquemas request/response
- **Security**: Helmet + CORS + express-rate-limit
- **Logging**: Winston con rotación archivos
- **Testing**: Jest + Supertest + Test DB

## Arquitectura Backend Requerida

### Estructura de Proyecto Obligatoria
src/
├── config/
│   ├── database.ts          # Config Sequelize + pools
│   ├── multer.ts            # Config upload files
│   ├── redis.ts             # Config cache (futuro)
│   └── environment.ts       # Variables entorno tipadas
├── controllers/
│   ├── hotelController.ts   # CRUD hoteles + imágenes
│   ├── roomController.ts    # CRUD habitaciones + coordenadas
│   ├── floorController.ts   # CRUD plantas
│   └── uploadController.ts  # Gestión archivos multimedia
├── middleware/
│   ├── validation.ts        # Middleware Zod schemas
│   ├── errorHandler.ts      # Error handling centralizado
│   ├── fileUpload.ts        # Validación archivos
│   ├── rateLimiter.ts       # Rate limiting diferenciado
│   └── auth.ts             # Autenticación JWT (preparar)
├── models/
│   ├── Hotel.ts            # Modelo hotel + relaciones
│   ├── Floor.ts            # Modelo planta
│   ├── Room.ts             # Modelo habitación + coordenadas
│   └── index.ts            # Setup relaciones Sequelize
├── routes/
│   ├── hotels.ts           # Rutas CRUD hoteles
│   ├── floors.ts           # Rutas CRUD plantas
│   ├── rooms.ts            # Rutas CRUD habitaciones
│   └── uploads.ts          # Rutas procesamiento archivos
├── services/
│   ├── imageService.ts     # Procesamiento Sharp + validación
│   ├── hotelService.ts     # Lógica negocio hoteles
│   ├── roomService.ts      # Lógica negocio habitaciones
│   └── coordinateService.ts # Validación geométrica
├── types/
│   ├── api.ts              # Request/Response interfaces
│   ├── database.ts         # Tipos modelos DB
│   └── uploads.ts          # Tipos procesamiento archivos
├── utils/
│   ├── asyncHandler.ts     # Wrapper async routes
│   ├── logger.ts           # Config Winston
│   ├── response.ts         # Respuestas estandarizadas
│   └── validation.ts       # Helpers validación
└── app.ts                  # App Express + middleware setup

## Especificaciones de Modelos Base de Datos

### Hotel Model - Entidad Principal
**Campos Obligatorios:**
- `id`: UUID primary key
- `name`: VARCHAR(255) NOT NULL con validación length
- `slug`: VARCHAR(255) UNIQUE para URLs amigables
- `description`: TEXT opcional
- `originalImageUrl`: VARCHAR(500) imagen subida
- `processedImageUrl`: VARCHAR(500) imagen optimizada
- `thumbnailUrl`: VARCHAR(500) thumbnail 200x200
- `imageWidth`: INTEGER dimensiones originales
- `imageHeight`: INTEGER dimensiones originales
- `imageAspectRatio`: DECIMAL calculado automáticamente
- `totalFloors`: INTEGER contador automático
- `totalRooms`: INTEGER contador automático
- `status`: ENUM ('active', 'inactive', 'draft')
- Campos audit: `createdAt`, `updatedAt`

**Validaciones Model Level:**
- `name`: longitud 1-255, no vacío después trim
- `imageWidth/Height`: positivos, máximo 10000px
- `status`: valores enum válidos
- `aspectRatio`: calculado en hook beforeSave

### Floor Model - Plantas del Hotel
**Campos Obligatorios:**
- `id`: UUID primary key
- `hotelId`: UUID foreign key CASCADE delete
- `floorNumber`: INTEGER (-10 a 200 rango válido)
- `name`: VARCHAR(255) nombre display
- `displayOrder`: INTEGER para ordenación custom
- `totalRooms`: INTEGER contador automático
- `status`: ENUM ('active', 'inactive', 'maintenance')
- Constraint: UNIQUE(hotelId, floorNumber)

### Room Model - Habitaciones con Coordenadas
**Campos Obligatorios:**
- `id`: UUID primary key
- `floorId`: UUID foreign key CASCADE delete
- `roomNumber`: VARCHAR(50) número habitación
- `roomType`: ENUM tipos habitación estándar
- `bedType`: ENUM tipos cama
- `capacity`: INTEGER (1-20) personas
- `status`: ENUM ('available', 'occupied', 'maintenance', 'out_of_order')

**Coordenadas Normalizadas (CRÍTICO):**
- `xCoordinate`: DECIMAL(12,10) rango 0.0-1.0
- `yCoordinate`: DECIMAL(12,10) rango 0.0-1.0
- `width`: DECIMAL(12,10) rango 0.005-1.0 (min 0.5%)
- `height`: DECIMAL(12,10) rango 0.005-1.0 (min 0.5%)

**Campos Calculados Automáticamente:**
- `xEnd`: DECIMAL(12,10) = xCoordinate + width
- `yEnd`: DECIMAL(12,10) = yCoordinate + height
- `centerX`: DECIMAL(12,10) = xCoordinate + (width/2)
- `centerY`: DECIMAL(12,10) = yCoordinate + (height/2)
- `area`: DECIMAL(12,10) = width * height

**Validaciones Críticas:**
- Coordenadas dentro imagen: x+width ≤ 1.0, y+height ≤ 1.0
- Dimensiones mínimas: width ≥ 0.005, height ≥ 0.005
- UNIQUE(floorId, roomNumber)

**Metadata Flexible:**
- `metadata`: JSONB para datos adicionales
- `basePrice`: DECIMAL(10,2) precio opcional
- `currency`: VARCHAR(3) código moneda

## API Endpoints Especificación Completa

### 1. Hotels Management API

#### POST /api/hotels - Crear Hotel con Imagen
**Request (multipart/form-data):**
- `name`: string (required)
- `description`: string (optional)
- `image`: File (required, max 10MB, JPG/PNG)

**Response Success (201):**
```typescript
{
  success: true,
  data: {
    hotel: {
      id: string,
      name: string,
      slug: string,
      originalImageUrl: string,
      processedImageUrl: string,
      thumbnailUrl: string,
      imageWidth: number,
      imageHeight: number,
      imageAspectRatio: number,
      createdAt: string
    }
  }
}
GET /api/hotels - Listar Hoteles
Query Parameters:

page: number (default: 1)
limit: number (default: 10, max: 50)
status: 'active' | 'inactive' | 'draft' (optional)
search: string (búsqueda en nombre)

GET /api/hotels/:id - Obtener Hotel Completo
Response incluye: hotel + floors + rooms con coordenadas
PUT /api/hotels/:id - Actualizar Hotel
PATCH /api/hotels/:id/image - Actualizar Solo Imagen
DELETE /api/hotels/:id - Eliminar Hotel
Cascading delete: floors → rooms → archivos imagen
2. Floors Management API
POST /api/hotels/:hotelId/floors - Crear Planta
typescript{
  floorNumber: number,
  name: string,
  displayOrder?: number
}
GET /api/hotels/:hotelId/floors - Listar Plantas Hotel
Ordenadas por: displayOrder ASC, floorNumber ASC
PUT /api/floors/:id - Actualizar Planta
DELETE /api/floors/:id - Eliminar Planta
Validation: No eliminar si tiene habitaciones
3. Rooms Management API
POST /api/floors/:floorId/rooms - Crear Habitación
typescript{
  roomNumber: string,
  roomType?: 'standard' | 'deluxe' | 'suite' | 'presidential',
  bedType?: 'single' | 'double' | 'queen' | 'king',
  capacity?: number,
  coordinates: {
    x: number,      // 0-1 normalized
    y: number,      // 0-1 normalized  
    width: number,  // 0-1 normalized
    height: number  // 0-1 normalized
  },
  basePrice?: number,
  metadata?: Record<string, any>
}
Validaciones Server-Side:

Coordenadas dentro límites imagen
Dimensiones mínimas respetadas
Check overlap con habitaciones existentes (tolerancia 5%)
roomNumber único en planta

GET /api/floors/:floorId/rooms - Listar Habitaciones Planta
Include: coordenadas + metadata + floor info
PUT /api/rooms/:id - Actualizar Habitación Completa
PATCH /api/rooms/:id/coordinates - Actualizar Solo Coordenadas
Especial endpoint para drag & drop frontend
DELETE /api/rooms/:id - Eliminar Habitación
4. Image Upload & Processing API
POST /api/uploads/hotel-image - Procesar Imagen
Proceso Automatizado:

Validar archivo (tipo, tamaño, dimensiones)
Crear versión procesada (max 1920x1920, mantener aspect ratio)
Crear thumbnail (200x200, center crop)
Optimizar compresión (JPEG 85%, PNG optimizado)
Generar URLs públicas
Extraer metadatos (dimensiones, size, tipo)

Response:
typescript{
  success: true,
  data: {
    originalUrl: string,
    processedUrl: string,
    thumbnailUrl: string,
    imageWidth: number,
    imageHeight: number,
    fileSize: number,
    processingTime: number
  }
}
Servicios Especializados
imageService.ts - Procesamiento Multimedia
Funcionalidades Clave:

Validación exhaustiva archivos subidos
Procesamiento Sharp con configuraciones optimizadas
Generación thumbnails consistentes
Cleanup automático archivos temporales
Manejo errores específicos procesamiento

Configuraciones Sharp:

Formato output: JPEG para fotos, PNG si transparencia
Calidad: 85% JPEG, PNG optimización completa
Resize: Lanczos resampling, no upscale
Metadata: preservar orientación EXIF

coordinateService.ts - Validación Geométrica
Validaciones Críticas:
typescriptclass CoordinateService {
  validateRoomCoordinates(coords: NormalizedCoordinates): ValidationResult {
    // 1. Rangos 0-1 para todas las coordenadas
    // 2. Dimensiones mínimas (0.005 = 0.5% imagen)
    // 3. Rectángulo dentro límites imagen
    // 4. Aspect ratio no extremo (< 0.1 o > 10.0)
  }

  checkRoomOverlap(
    newRoom: NormalizedCoordinates, 
    existingRooms: Room[], 
    tolerance: number = 0.05
  ): OverlapResult {
    // 1. Calcular intersección con cada habitación existente
    // 2. Permitir overlap mínimo (5% default)
    // 3. Retornar habitaciones conflictivas
    // 4. Calcular porcentaje overlap para warnings
  }

  normalizeCoordinates(coords: RawCoordinates): NormalizedCoordinates {
    // Conversión coordenadas pixel → normalizadas
    // Validación límites automática
  }
}
Middleware Críticos
validation.ts - Validación Zod Integrada
Schemas Principales:
typescript// Coordenadas normalizadas
export const normalizedCoordinatesSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.005).max(1),
  height: z.number().min(0.005).max(1)
}).refine(data => data.x + data.width <= 1)
  .refine(data => data.y + data.height <= 1);

// Request crear habitación
export const createRoomSchema = z.object({
  roomNumber: z.string().min(1).max(50),
  roomType: z.enum(['standard', 'deluxe', 'suite', 'presidential']).optional(),
  coordinates: normalizedCoordinatesSchema,
  basePrice: z.number().positive().optional(),
  metadata: z.record(z.any()).optional()
});
rateLimiter.ts - Rate Limiting Diferenciado
Configuraciones:

API general: 100 requests/15min por IP
Upload images: 5 requests/15min por IP
Coordinate updates: 50 requests/15min por IP
Health checks: sin límite

errorHandler.ts - Error Handling Centralizado
Tipos Error Específicos:

ValidationError (400): Zod validation failures
NotFoundError (404): Recursos no encontrados
OverlapError (409): Conflicto coordenadas habitaciones
UploadError (422): Problemas procesamiento archivos
DatabaseError (500): Errores Sequelize

Configuración Environment
Variables Obligatorias
env# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/hotel_mapper
DB_POOL_MIN=5
DB_POOL_MAX=20

# Server
NODE_ENV=development|production
PORT=3001
CORS_ORIGIN=http://localhost:5173

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
UPLOAD_TEMP_PATH=./tmp

# Image Processing
MAX_IMAGE_DIMENSION=1920
THUMBNAIL_SIZE=200
JPEG_QUALITY=85

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_UPLOAD_MAX=5

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
LOG_MAX_FILES=10
LOG_MAX_SIZE=10m
Testing Strategy Backend
Unit Tests Prioritarios

Servicios: imageService, coordinateService
Utilities: validation, coordinate math
Models: Sequelize validations, hooks
Middleware: validation, error handling

Integration Tests

Endpoints CRUD completos
Upload + procesamiento archivos
Cascade deletes (hotel → floors → rooms)
Coordinate validation + overlap detection

Performance Tests

Upload archivos grandes (8-10MB)
Queries con 100+ habitaciones por planta
Concurrent requests endpoints críticos
Memory usage procesamiento imágenes

Criterios de Aceptación Backend

✅ API RESTful completa con documentación OpenAPI
✅ Upload + procesamiento imágenes robusto
✅ Validación coordenadas geométricas precisa
✅ Error handling informativo y consistente
✅ Performance <200ms endpoints GET básicos
✅ <5s procesamiento imágenes grandes
✅ Rate limiting efectivo sin falsos positivos
✅ Logging completo para debugging/monitoring
✅ Tests unitarios >80% coverage críticos
✅ Zero memory leaks procesamiento archivos

Consideraciones Específicas Claude Code

Configurar Sequelize + modelos antes que controllers
Implementar servicios antes que endpoints que los usan
Middleware validation antes que routes
Setup logging/error handling primero
Testing después de funcionalidad core completa