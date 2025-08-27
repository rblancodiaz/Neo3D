# Sistema de Guardado de Habitaciones - Guía de Pruebas

## Cambios Implementados

### 1. **Evento SaveChanges Conectado**
- Agregado listener para el evento 'saveChanges' en App.tsx
- El botón de guardar ahora detecta rectángulos pendientes
- Convierte coordenadas canvas a normalizadas (0-1)

### 2. **Transformación de Coordenadas Frontend → Backend**
- API service transforma el objeto `coordinates` a campos planos
- Backend recibe: `xCoordinate`, `yCoordinate`, `width`, `height`

### 3. **Transformación de Coordenadas Backend → Frontend** 
- Store transforma respuestas del backend a formato frontend
- Rooms siempre tienen objeto `coordinates` con {x, y, width, height}

### 4. **Store Global Accesible**
- MapperStore expuesto en `window.__mapperStore`
- Permite acceso desde eventos externos

## Pruebas Manuales Recomendadas

### Test 1: Crear Habitación con Rectángulo
1. Cargar una imagen de hotel
2. Seleccionar herramienta rectángulo (R)
3. Dibujar un rectángulo en el canvas
4. Click en botón Save (💾)
5. **Resultado esperado:** Se abre formulario de habitación
6. Llenar datos y guardar
7. **Resultado esperado:** Habitación se renderiza en canvas con borde azul

### Test 2: Hover sobre Habitación Guardada
1. Mover mouse sobre habitación guardada
2. **Resultado esperado:** 
   - Habitación cambia a color azul claro
   - Cursor cambia a pointer
   - Estado muestra "Hover: [número habitación]"

### Test 3: Click en Habitación Guardada
1. Cambiar a herramienta Select (V)
2. Click en habitación guardada
3. **Resultado esperado:**
   - Habitación se selecciona (borde azul brillante)
   - Se muestra popup con información
   - Estado muestra "Selected: [número habitación]"

### Test 4: Editar Habitación
1. Con habitación seleccionada, click en Edit en el popup
2. **Resultado esperado:** Se abre formulario con datos actuales
3. Modificar datos y guardar
4. **Resultado esperado:** Cambios se reflejan inmediatamente

### Test 5: Eliminar Habitación
1. Con habitación seleccionada, click en Delete en el popup
2. **Resultado esperado:** Habitación desaparece del canvas

## Debugging en Consola

### Verificar Estado del Store
```javascript
// Ver estado actual del mapper
window.__mapperStore.getState()

// Ver habitaciones actuales
const hotelStore = window.debugCurrentState()

// Crear habitación de prueba
window.debugHotelUpload()
```

### Verificar Coordenadas
```javascript
// Ver coordenadas del último rectángulo dibujado
const state = window.__mapperStore.getState()
console.log(state.drawingState.currentRect)
```

## Posibles Problemas y Soluciones

### Problema: Habitaciones no se renderizan
**Verificar:**
1. Abrir consola: `window.debugCurrentState()`
2. Verificar que rooms tengan coordenadas válidas
3. Verificar que currentFloor esté seleccionado

### Problema: Click/Hover no funciona
**Verificar:**
1. Herramienta SELECT debe estar activa
2. Coordenadas deben estar en rango 0-1
3. Canvas debe tener imagen cargada

### Problema: Save button no hace nada
**Verificar:**
1. Debe haber un rectángulo dibujado primero
2. Verificar en consola: `window.__mapperStore.getState().drawingState.currentRect`

## Logs para Monitorear

Buscar estos logs en la consola:
- `🔥` - Operaciones del store
- `🌐` - Llamadas API
- `🚀` - Requests axios
- `💾` - Operaciones de guardado
- `🆕` - Creación de habitaciones
- `🖱️` - Eventos de mouse/canvas

## Estructura de Datos

### Frontend Room:
```typescript
{
  id: string,
  roomNumber: string,
  coordinates: {
    x: number,      // 0-1
    y: number,      // 0-1
    width: number,  // 0-1
    height: number  // 0-1
  }
}
```

### Backend Room:
```typescript
{
  id: string,
  roomNumber: string,
  xCoordinate: number,  // 0-1
  yCoordinate: number,  // 0-1
  width: number,        // 0-1
  height: number        // 0-1
}
```