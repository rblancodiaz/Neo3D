# Hotel Room Mapper - Database Setup

## Estado Actual: ✅ OPERATIVO

La base de datos PostgreSQL está completamente inicializada y funcionando en Docker.

## Información de Conexión

### Para Docker (Recomendado)
- **Host:** localhost
- **Port:** 5433
- **Database:** hotel_mapper
- **User:** hotel_app
- **Password:** SecurePassword2024
- **Connection String:** `postgresql://hotel_app:SecurePassword2024@localhost:5433/hotel_mapper`

### Para PostgreSQL Local (si está instalado)
- **Port:** 5432 (estándar)
- **Connection String:** `postgresql://hotel_app:SecurePassword2024@localhost:5432/hotel_mapper`

## Estructura de Base de Datos Creada

### Tablas (4)
- `hotels` - Información de hoteles
- `floors` - Plantas/pisos de cada hotel
- `rooms` - Habitaciones con coordenadas normalizadas
- `room_coordinate_history` - Historial de cambios en coordenadas

### Vistas (2)
- `hotel_summary` - Resumen de ocupación por hotel
- `floor_occupancy` - Ocupación por planta

### Funciones Principales (4)
- `check_room_overlap()` - Valida superposición de habitaciones
- `get_room_at_coordinates()` - Obtiene habitación en coordenadas específicas
- `update_updated_at_column()` - Trigger para actualizar timestamps
- `log_room_coordinate_changes()` - Trigger para auditoría de cambios

### Índices
- Índices en claves foráneas y campos de búsqueda frecuente
- Índice espacial en coordenadas de habitaciones

### Datos de Ejemplo
- 1 Hotel: Grand Plaza Hotel
- 3 Plantas: Ground Floor, Second Floor, Third Floor
- 1 Habitación de ejemplo en la primera planta

## Comandos Útiles

### Iniciar la base de datos
```bash
cd D:\devprojects\Neo3D\database
docker-compose up -d
```

### Detener la base de datos
```bash
docker-compose down
```

### Ver logs
```bash
docker logs hotel_mapper_db
```

### Conectar con psql
```bash
docker exec -it hotel_mapper_db psql -U hotel_app -d hotel_mapper
```

### Verificar estado
```bash
docker ps | grep hotel_mapper_db
```

### Resetear base de datos (CUIDADO: borra todos los datos)
```bash
docker-compose down -v
docker-compose up -d
```

## Archivos Importantes

- `docker-compose.yml` - Configuración de Docker
- `docker_init.sql` - Script de inicialización completo
- `.env.docker` - Variables de entorno para conexión
- `verify_database.bat` - Script de verificación (Windows)

## Configuración del Backend

El backend debe usar la siguiente configuración en su archivo `.env`:

```env
DATABASE_URL=postgresql://hotel_app:SecurePassword2024@localhost:5433/hotel_mapper
```

## Troubleshooting

### Error: Puerto 5432 ya en uso
- La configuración Docker usa puerto 5433 para evitar conflictos
- Si tienes PostgreSQL local, puedes usarlo en puerto 5432

### Error: Container name already in use
```bash
docker stop hotel_mapper_db
docker rm hotel_mapper_db
docker-compose up -d
```

### Error: Volume already exists
```bash
docker-compose down -v
docker-compose up -d
```

## Próximos Pasos

1. ✅ Base de datos inicializada
2. ✅ Tablas, vistas y funciones creadas
3. ✅ Datos de ejemplo cargados
4. ⏳ Configurar backend para conectar a la BD
5. ⏳ Implementar API REST
6. ⏳ Implementar frontend con Canvas