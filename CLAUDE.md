# Hotel Room Mapper - Especificación General del Proyecto

## Resumen Ejecutivo
Desarrollar una aplicación web Full Stack que permita subir imágenes aéreas de hoteles y crear mapas interactivos clickeables. Los usuarios podrán dibujar rectángulos sobre la imagen para delimitar habitaciones por planta, con sistema de popups informativos al hacer hover.

## Objetivos del Sistema
1. **Gestión de Imágenes**: Upload, validación y procesamiento de imágenes de hoteles
2. **Editor Interactivo**: Canvas HTML5 para dibujo de zonas rectangulares sobre imágenes
3. **Mapeo de Coordenadas**: Sistema preciso de coordenadas normalizadas (0-1)
4. **Gestión de Habitaciones**: CRUD completo con metadatos por habitación
5. **Interfaz Responsiva**: Funcionalidad completa en desktop, tablet y móvil

## Stack Tecnológico Definido
- **Frontend**: React 18 + TypeScript + Canvas API + Zustand
- **Backend**: Node.js + Express + TypeScript + Multer + Sharp
- **Base de Datos**: PostgreSQL 15 + Sequelize ORM
- **Storage**: Sistema archivos local (futuro: S3/MinIO)
- **Development**: Docker Compose para entorno local

## Especificaciones técnicas segmentadas por equipo.
Debes analizar estas instrucciones siempre, son tu guía para un desarrollo robusto y eficaz.
1. **/docs/00_manager_req.md**
2. **/docs/01_frontend_req.md**
3. **/docs/02_backend_req.md**
4. **/docs/03_database_req.md**
5. **/docs/04_devops_req.md**

## Agentes disponibles en el proyecto
Debes invocar a los agentes disponibles siempre que sea necesario:
1. **/@devops-enginee**
2. **/@database-architect**
3. **/@backend-api-developer**
4. **/@frontend-full-stack-developer**
5. **/@project-manager**  

## Arquitectura del Sistema

### Componentes Frontend Principales
- **ImageMapper**: Componente Canvas principal con zoom/pan
- **DrawingTools**: Toolbar con herramientas de dibujo
- **RoomPopup**: Sistema tooltips/modals para habitaciones
- **ImageUploader**: Drag & drop con validaciones
- **FloorSelector**: Navegación entre plantas

### Componentes Backend Principales
- **Hotel Management**: CRUD hoteles con imágenes
- **Room Management**: CRUD habitaciones con coordenadas
- **Image Processing**: Upload, resize, thumbnail generation
- **Coordinate Validation**: Validación overlap y límites

### Estructura de Base de Datos
- **hotels**: Datos principales + URLs imágenes procesadas
- **floors**: Plantas por hotel con numeración
- **rooms**: Habitaciones con coordenadas normalizadas
- **room_coordinate_history**: Auditoría movimientos

## Funcionalidades Core MVP

### Gestión de Imágenes
- Upload drag & drop con preview inmediato
- Validación: JPG/PNG, máx 10MB, mín 800px
- Procesamiento automático: resize + thumbnail
- Metadatos: dimensiones, aspect ratio

### Editor de Mapas
- Canvas responsivo manteniendo aspect ratio
- Herramientas: dibujo rectángulos, zoom, pan
- Detección hover/click precisa en rectángulos
- Estados visuales: hover, selected, drawing
- Grid opcional para precisión

### Sistema de Habitaciones
- Formulario metadatos: número, tipo, estado
- Categorización por plantas
- Validación overlap entre habitaciones
- Numeración automática/manual

### Interactividad
- Tooltips hover con info básica
- Modal detallado al click
- Navegación entre plantas
- Undo/Redo básico (10 acciones)

## Consideraciones Técnicas Críticas

### Performance
- Canvas rendering optimizado (requestAnimationFrame)
- Coordenadas normalizadas independientes del tamaño
- Debouncing eventos mouse para 60fps
- Lazy loading imágenes grandes

### UX/UI
- Feedback visual inmediato todas las acciones
- Estados loading y error informativos
- Shortcuts teclado para power users
- Touch support completo tablets

### Escalabilidad
- APIs RESTful bien documentadas
- Separación clara responsabilidades
- Código modular y reutilizable
- Preparado para múltiples hoteles

### Seguridad
- Validación exhaustiva uploads
- Sanitización datos entrada
- Rate limiting APIs
- Headers seguridad estándar

## Criterios de Aceptación MVP
1. Usuario sube imagen hotel exitosamente
2. Usuario dibuja rectángulos sobre imagen
3. Rectángulos se guardan con coordenadas precisas
4. Hover muestra popup información básica
5. Datos persisten correctamente en BD
6. Interfaz responsive móvil/tablet
7. Carga rápida (<2s imágenes medianas)
8. No overlap significativo entre habitaciones

## Fases de Desarrollo
1. **Fase 1**: Setup proyecto + Base de datos + API básica
2. **Fase 2**: Upload imágenes + Procesamiento
3. **Fase 3**: Canvas básico + Dibujo rectángulos
4. **Fase 4**: Sistema habitaciones + Coordenadas
5. **Fase 5**: Interactividad + Popups
6. **Fase 6**: Refinamiento UX + Testing


