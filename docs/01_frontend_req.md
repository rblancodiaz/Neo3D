# Frontend Developer - Especificaciones Técnicas Completas

## Contexto y Rol
Eres un Frontend Developer Senior especializado en React + TypeScript con amplia experiencia en Canvas API y aplicaciones interactivas complejas. Tu misión es crear una interfaz intuitiva para mapear habitaciones de hotel sobre imágenes usando Canvas HTML5 nativo.

## Setup Técnico Requerido
- **Base**: React 18 + TypeScript 5.0 + Vite
- **Estado**: Zustand para estado global ligero
- **Formularios**: React Hook Form + Zod validation
- **Estilos**: TailwindCSS con configuración custom
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library

## Arquitectura de Componentes Detallada

### Estructura de Carpetas Obligatoriasrc/
├── components/
│   ├── ImageMapper/          # Canvas principal + lógica dibujo
│   ├── DrawingTools/         # Toolbar herramientas
│   ├── RoomPopup/           # Tooltips + Modal habitaciones
│   ├── FloorSelector/       # Navegación plantas
│   ├── ImageUploader/       # Drag & drop upload
│   └── ui/                  # Componentes base reutilizables
├── hooks/
│   ├── useCanvasDrawing.ts  # Lógica dibujo Canvas
│   ├── useImageLoader.ts    # Carga optimizada imágenes
│   ├── useRoomManagement.ts # CRUD habitaciones
│   └── useCoordinates.ts    # Conversiones coordenadas
├── stores/
│   ├── mapperStore.ts       # Estado Canvas + herramientas
│   ├── hotelStore.ts        # Datos hoteles/plantas
│   └── uiStore.ts           # Estados UI (modales, etc)
├── services/
│   ├── api.ts               # Cliente HTTP + endpoints
│   ├── imageService.ts      # Procesamiento client-side
│   └── canvasUtils.ts       # Utilities Canvas
├── types/
│   └── index.ts             # Interfaces TypeScript
└── utils/
├── coordinates.ts       # Matemáticas coordenadas
├── validation.ts        # Esquemas Zod
└── constants.ts         # Constantes aplicación

## Especificaciones de Componentes Core

### 1. ImageMapper Component
**Responsabilidades Principales:**
- Renderizar imagen en Canvas responsive con aspect ratio correcto
- Gestionar eventos mouse/touch unificados para dibujo
- Implementar zoom suave con límites lógicos (min 0.5x, max 5x)
- Pan con restricciones dentro imagen
- Renderizar rectángulos habitaciones existentes
- Detectar hover/click preciso en rectángulos
- Estados visuales diferenciados: normal, hover, selected, drawing

**Props Interface Requerida:**
```typescriptinterface ImageMapperProps {
imageUrl: string;
rooms: Room[];
selectedFloor: number;
drawingMode: 'navigate' | 'draw' | 'edit';
onRoomCreate: (coordinates: NormalizedCoordinates) => void;
onRoomSelect: (room: Room | null) => void;
onRoomHover: (room: Room | null) => void;
}

**Funcionalidades Críticas:**
- Canvas auto-resize manteniendo aspect ratio imagen original
- Coordenadas normalizadas (0-1) independientes tamaño canvas
- Rendering optimizado máximo 60fps
- Touch gestures: pinch-zoom, pan de dos dedos
- Keyboard shortcuts: Escape (cancelar), Space (pan mode)

### 2. useCanvasDrawing Hook
**Responsabilidades:**
- Gestionar estado drawing completo (idle, drawing, complete)
- Convertir eventos mouse/touch a coordenadas normalizadas
- Validar dimensiones mínimas rectángulos (min 0.005 = 0.5%)
- Implementar snap-to-grid opcional con sensibilidad ajustable
- Feedback visual durante dibujo (rectángulo temporal)

**Interface Requerida:**
```typescriptinterface UseCanvasDrawingReturn {
isDrawing: boolean;
currentRect: RectInProgress | null;
startDrawing: (event: PointerEvent) => void;
updateDrawing: (event: PointerEvent) => void;
finishDrawing: () => NormalizedCoordinates | null;
cancelDrawing: () => void;
canDraw: boolean;
}

### 3. DrawingTools Component
**Herramientas Requeridas:**
- Toggle modo navegación/dibujo con indicador visual claro
- Controles zoom: botones +/- y reset (fit-to-container)
- Selector planta con navegación teclado (arrows)
- Undo/Redo con estado disable apropiado (min 10 acciones)
- Toggle grid con opacity ajustable
- Información zoom actual y coordenadas mouse

**Layout Responsive:**
- Desktop: Toolbar lateral izquierda
- Tablet: Toolbar horizontal superior plegable
- Móvil: FAB con menú expandible

### 4. RoomPopup Component
**Modes de Funcionamiento:**
- **Tooltip Mode**: Hover rápido, info básica (número, tipo, estado)
- **Modal Mode**: Click para edición completa metadatos
- **Positioning**: Inteligente evitando bordes pantalla
- **Animations**: Smooth fade in/out, no lag perceptible

**Información Tooltip:**
- Número habitación
- Tipo habitación (Standard, Suite, etc)
- Estado actual (Disponible, Ocupada, Mantenimiento)
- Precio base (opcional)

**Modal Edición:**
- Formulario completo con validación en tiempo real
- Preview coordenadas actuales
- Botón eliminar con confirmación
- Guardado automático con debounce

### 5. ImageUploader Component
**Especificaciones UX:**
- Zona drag & drop visualmente atractiva
- Estados: idle, dragover, uploading, success, error
- Preview inmediato imagen seleccionada
- Progress bar con porcentaje durante upload
- Validaciones client-side antes envío

**Validaciones Obligatorias:**
- Formato: solo JPG/PNG
- Tamaño: máximo 10MB
- Dimensiones: mínimo 800x600px
- Aspect ratio: advertencia si muy extremo (<0.5 o >3.0)

## Estados Zustand Detallados

### mapperStore.ts - Estado Canvas
```typescriptinterface MapperState {
// Canvas viewport
canvasScale: number;           // 0.1 to 5.0
canvasOffset: Point2D;         // Pan offset
canvasSize: Dimensions;        // Current canvas dimensions
imageSize: Dimensions;         // Original image dimensions// Drawing state
drawingMode: DrawingMode;      // navigate | draw | edit
isDrawing: boolean;
currentRect: RectInProgress | null;
snapToGrid: boolean;
gridSize: number;              // Grid spacing (0.05 = 5%)// Selection state
selectedRoom: Room | null;
hoveredRoom: Room | null;// History for undo/redo
history: HistoryEntry[];
historyIndex: number;// Actions
setViewport: (scale: number, offset: Point2D) => void;
toggleDrawingMode: () => void;
setSelectedRoom: (room: Room | null) => void;
setHoveredRoom: (room: Room | null) => void;
pushHistory: (action: HistoryAction) => void;
undo: () => void;
redo: () => void;
}

### hotelStore.ts - Datos del Negocio
```typescriptinterface HotelState {
// Current hotel data
currentHotel: Hotel | null;
floors: Floor[];
rooms: Room[];// UI state
selectedFloor: number;
isLoading: boolean;
error: string | null;// Actions
loadHotel: (hotelId: string) => Promise<void>;
createRoom: (floorId: string, coordinates: NormalizedCoordinates, metadata: RoomMetadata) => Promise<void>;
updateRoom: (roomId: string, updates: Partial<Room>) => Promise<void>;
deleteRoom: (roomId: string) => Promise<void>;
selectFloor: (floorNumber: number) => void;
}

## Utilities Matemáticas Críticas

### coordinates.ts - Conversiones Precisas
```typescript// Conversión coordenadas canvas ↔ normalizadas
export const canvasToNormalized = (
canvasPoint: Point2D,
canvasRect: DOMRect,
imageRect: ImageRect,
scale: number,
offset: Point2D
): NormalizedPoint => {
// Implementar conversión precisa considerando zoom y pan
};export const normalizedToCanvas = (
normalizedPoint: NormalizedPoint,
canvasRect: DOMRect,
imageRect: ImageRect,
scale: number,
offset: Point2D
): Point2D => {
// Implementar conversión inversa
};// Detección geométrica
export const isPointInRect = (
point: NormalizedPoint,
rect: NormalizedRect
): boolean => {
// Detección precisa considerando tolerancia
};export const calculateRectOverlap = (
rect1: NormalizedRect,
rect2: NormalizedRect
): number => {
// Calcular área overlap como porcentaje
};

## Consideraciones Performance Críticas

### Canvas Rendering Optimizado
1. **Selective Redraw**: Solo redraw cuando cambie estado
2. **RequestAnimationFrame**: Todas las animaciones
3. **Event Debouncing**: mousemove events (16ms max)
4. **Memory Management**: Cleanup event listeners
5. **Layer Compositing**: Separar imagen de overlays

### React Optimizations
1. **React.memo**: Componentes que no cambian frecuentemente
2. **useCallback**: Event handlers estables
3. **useMemo**: Cálculos costosos coordenadas
4. **Lazy Loading**: Componentes pesados (Modal)

## Validación y Esquemas Zod

### Validation Schemas
```typescript// Coordenadas normalizadas
export const normalizedCoordinatesSchema = z.object({
x: z.number().min(0).max(1),
y: z.number().min(0).max(1),
width: z.number().min(0.005).max(1),    // Min 0.5%
height: z.number().min(0.005).max(1),   // Min 0.5%
}).refine(data => data.x + data.width <= 1, {
message: "Rectangle exceeds image bounds horizontally"
}).refine(data => data.y + data.height <= 1, {
message: "Rectangle exceeds image bounds vertically"
});// Metadatos habitación
export const roomMetadataSchema = z.object({
roomNumber: z.string().min(1).max(10),
roomType: z.enum(['standard', 'deluxe', 'suite', 'presidential']),
bedType: z.enum(['single', 'double', 'queen', 'king', 'twin']),
capacity: z.number().int().min(1).max(8),
basePrice: z.number().positive().optional(),
notes: z.string().max(500).optional(),
});

## Testing Strategy Mínima

### Unit Tests Prioritarios
- Funciones matemáticas coordenadas (edge cases)
- Hooks custom con diferentes estados
- Validación Zod schemas
- Utilities Canvas

### Integration Tests
- Flujo completo: cargar imagen → dibujar → guardar
- Interacciones Canvas (zoom, pan, drawing)
- Estados Zustand con acciones complejas

### E2E Tests Críticos
- Upload imagen + preview
- Dibujar habitación + hover tooltip
- Editar habitación existente
- Navegación entre plantas

## Criterios de Aceptación Frontend
1. ✅ Canvas responsive perfecto en todos los dispositivos
2. ✅ Dibujo rectángulos fluido sin lag (<16ms)
3. ✅ Detección hover precisa en rectángulos existentes
4. ✅ Zoom/pan suave con límites apropiados
5. ✅ Touch support completo tablets/móviles
6. ✅ Estados visuales claros e inmediatos
7. ✅ Validación formularios en tiempo real
8. ✅ Carga inicial aplicación <2s
9. ✅ Undo/redo funcional para todas las acciones
10. ✅ Navegación teclado completamente accesible

## Consideraciones Específicas Claude Code
- Crear estructura de carpetas antes de generar componentes
- Implementar hooks antes que componentes que los usan
- Generar tipos TypeScript primero para referencias
- Configurar Zustand stores antes que componentes consumer
- Testing después de funcionalidad core