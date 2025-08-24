## 📁 03_database_requirements.md

```markdown
# Database Analyst - Schema y Optimización Hotel Mapper

## Contexto y Rol
Eres un Database Analyst Senior especializado en PostgreSQL con experiencia en modelado de datos geoespaciales, optimización de queries y diseño de esquemas para aplicaciones high-performance. Tu misión es crear un esquema robusto para coordenadas normalizadas y relaciones complejas hotel-plantas-habitaciones.

## Especificaciones Técnicas Base de Datos

### Stack y Configuración Requerida
- **PostgreSQL**: Versión 15+ con optimizaciones performance
- **Extensions**: pg_stat_statements para monitoring
- **Connection Pooling**: Configuración optimizada (min 5, max 20)
- **Indexing Strategy**: Índices específicos para queries geométricas
- **Backup Strategy**: pg_dump automatizado + WAL archiving

## Schema de Base de Datos Completo

### Tabla hotels - Entidad Principal
**Estructura Completa:**
```sql
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Image management (URLs relativos)
    original_image_url VARCHAR(500) NOT NULL,
    processed_image_url VARCHAR(500) NOT NULL, 
    thumbnail_url VARCHAR(500) NOT NULL,
    image_width INTEGER NOT NULL CHECK (image_width > 0),
    image_height INTEGER NOT NULL CHECK (image_height > 0),
    
    -- Calculated field
    image_aspect_ratio DECIMAL(10,6) GENERATED ALWAYS AS (
        CAST(image_width AS DECIMAL) / CAST(image_height AS DECIMAL)
    ) STORED,
    
    -- Counters (updated via triggers)
    total_floors INTEGER DEFAULT 0,
    total_rooms INTEGER DEFAULT 0,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
Índices Críticos Hotels:
sqlCREATE INDEX idx_hotels_slug ON hotels(slug);
CREATE INDEX idx_hotels_status ON hotels(status) WHERE status = 'active';
CREATE INDEX idx_hotels_created_at ON hotels(created_at DESC);
CREATE INDEX idx_hotels_name_search ON hotels USING gin(to_tsvector('english', name));
Tabla floors - Plantas del Hotel
Estructura Completa:
sqlCREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Floor identification
    floor_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    display_order INTEGER DEFAULT 0,
    
    -- Counters
    total_rooms INTEGER DEFAULT 0,
    
    -- Operational data
    floor_area_sqm DECIMAL(10,2) CHECK (floor_area_sqm > 0),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    
    -- Audit fields  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(hotel_id, floor_number),
    CHECK (floor_number >= -10 AND floor_number <= 200)
);
Índices Críticos Floors:
sqlCREATE INDEX idx_floors_hotel_id ON floors(hotel_id);
CREATE INDEX idx_floors_hotel_floor ON floors(hotel_id, floor_number);
CREATE INDEX idx_floors_display_order ON floors(hotel_id, display_order);
Tabla rooms - Habitaciones con Coordenadas (CRÍTICA)
Estructura Completa:
sqlCREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    
    -- Room identification
    room_number VARCHAR(50) NOT NULL,
    room_type VARCHAR(100) DEFAULT 'standard' CHECK (
        room_type IN ('standard', 'deluxe', 'suite', 'presidential', 'accessible')
    ),
    bed_type VARCHAR(50) DEFAULT 'double' CHECK (
        bed_type IN ('single', 'double', 'queen', 'king', 'twin', 'sofa_bed')
    ),
    capacity INTEGER DEFAULT 2 CHECK (capacity > 0 AND capacity <= 20),
    
    -- Operational status
    status VARCHAR(50) DEFAULT 'available' CHECK (
        status IN ('available', 'occupied', 'maintenance', 'out_of_order', 'cleaning')
    ),
    
    -- COORDENADAS NORMALIZADAS (0.0 - 1.0)
    x_coordinate DECIMAL(12,10) NOT NULL CHECK (x_coordinate >= 0 AND x_coordinate <= 1),
    y_coordinate DECIMAL(12,10) NOT NULL CHECK (y_coordinate >= 0 AND y_coordinate <= 1), 
    width DECIMAL(12,10) NOT NULL CHECK (width > 0 AND width <= 1),
    height DECIMAL(12,10) NOT NULL CHECK (height > 0 AND height <= 1),
    
    -- CAMPOS CALCULADOS PARA QUERIES GEOMÉTRICAS
    x_end DECIMAL(12,10) GENERATED ALWAYS AS (x_coordinate + width) STORED,
    y_end DECIMAL(12,10) GENERATED ALWAYS AS (y_coordinate + height) STORED,
    center_x DECIMAL(12,10) GENERATED ALWAYS AS (x_coordinate + (width / 2)) STORED,
    center_y DECIMAL(12,10) GENERATED ALWAYS AS (y_coordinate + (height / 2)) STORED,
    area DECIMAL(12,10) GENERATED ALWAYS AS (width * height) STORED,
    
    -- VALIDACIONES GEOMÉTRICAS CRÍTICAS
    CHECK (x_coordinate + width <= 1.0),   -- Dentro límites horizontales
    CHECK (y_coordinate + height <= 1.0),  -- Dentro límites verticales  
    CHECK (width >= 0.005),                -- Mínimo 0.5% ancho imagen
    CHECK (height >= 0.005),               -- Mínimo 0.5% alto imagen
    
    -- Business data
    base_price DECIMAL(10,2) CHECK (base_price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Flexible metadata
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(floor_id, room_number)
);
Índices Geométricos Críticos:
sql-- Índices básicos
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX idx_rooms_status ON rooms(status) WHERE status IN ('available', 'occupied');
CREATE INDEX idx_rooms_room_type ON rooms(room_type);

-- Índices para queries geométricas (PERFORMANCE CRÍTICO)
CREATE INDEX idx_rooms_coordinates ON rooms(x_coordinate, y_coordinate, width, height);
CREATE INDEX idx_rooms_center_point ON rooms(center_x, center_y);
CREATE INDEX idx_rooms_bounding_box ON rooms(x_coordinate, y_coordinate, x_end, y_end);

-- Índice para metadata queries
CREATE INDEX idx_rooms_metadata ON rooms USING gin(metadata);

-- Índice parcial para habitaciones disponibles (query más común)
CREATE INDEX idx_rooms_available ON rooms(floor_id, room_type) 
WHERE status = 'available';
Tabla room_coordinate_history - Auditoría Movimientos
Para tracking cambios coordenadas:
sqlCREATE TABLE room_coordinate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    
    -- Coordenadas anteriores
    old_x_coordinate DECIMAL(12,10),
    old_y_coordinate DECIMAL(12,10), 
    old_width DECIMAL(12,10),
    old_height DECIMAL(12,10),
    
    -- Coordenadas nuevas
    new_x_coordinate DECIMAL(12,10),
    new_y_coordinate DECIMAL(12,10),
    new_width DECIMAL(12,10), 
    new_height DECIMAL(12,10),
    
    -- Metadata del cambio
    change_reason VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID  -- Future: user reference
);

CREATE INDEX idx_coordinate_history ON room_coordinate_history(room_id, changed_at DESC);
Funciones SQL Especializadas
Función Detección Overlap Geométrico
sqlCREATE OR REPLACE FUNCTION check_room_overlap(
    p_floor_id UUID,
    p_x_coord DECIMAL(12,10),
    p_y_coord DECIMAL(12,10), 
    p_width DECIMAL(12,10),
    p_height DECIMAL(12,10),
    p_exclude_room_id UUID DEFAULT NULL,
    p_tolerance DECIMAL(4,3) DEFAULT 0.050  -- 5% tolerance
)
RETURNS TABLE(
    overlapping_room_id UUID,
    overlapping_room_number VARCHAR(50),
    overlap_area DECIMAL(12,10),
    overlap_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.room_number,
        -- Calcular área overlap exacta
        GREATEST(0::DECIMAL(12,10), 
            LEAST(p_x_coord + p_width, r.x_coordinate + r.width) - 
            GREATEST(p_x_coord, r.x_coordinate)
        ) * 
        GREATEST(0::DECIMAL(12,10), 
            LEAST(p_y_coord + p_height, r.y_coordinate + r.height) - 
            GREATEST(p_y_coord, r.y_coordinate)
        ) AS calculated_overlap_area,
        -- Porcentaje overlap respecto habitación nueva
        (GREATEST(0::DECIMAL(12,10), 
            LEAST(p_x_coord + p_width, r.x_coordinate + r.width) - 
            GREATEST(p_x_coord, r.x_coordinate)
        ) * 
        GREATEST(0::DECIMAL(12,10), 
            LEAST(p_y_coord + p_height, r.y_coordinate + r.height) - 
            GREATEST(p_y_coord, r.y_coordinate)
        )) / (p_width * p_height) * 100 AS calculated_overlap_percentage
    FROM rooms r
    WHERE r.floor_id = p_floor_id
    AND (p_exclude_room_id IS NULL OR r.id != p_exclude_room_id)
    -- Check intersección geométrica
    AND p_x_coord < r.x_coordinate + r.width 
    AND p_x_coord + p_width > r.x_coordinate
    AND p_y_coord < r.y_coordinate + r.height
    AND p_y_coord + p_height > r.y_coordinate
    -- Solo overlaps significativos (> tolerance)
    AND (GREATEST(0::DECIMAL(12,10), 
        LEAST(p_x_coord + p_width, r.x_coordinate + r.width) - 
        GREATEST(p_x_coord, r.x_coordinate)
    ) * 
    GREATEST(0::DECIMAL(12,10), 
        LEAST(p_y_coord + p_height, r.y_coordinate + r.height) - 
        GREATEST(p_y_coord, r.y_coordinate)
    )) > p_tolerance * (p_width * p_height);
END;
$$ LANGUAGE plpgsql;
Función Búsqueda Habitaciones por Punto
sqlCREATE OR REPLACE FUNCTION find_rooms_at_point(
    p_floor_id UUID,
    p_x DECIMAL(12,10),
    p_y DECIMAL(12,10)
)
RETURNS TABLE(
    room_id UUID,
    room_number VARCHAR(50), 
    room_type VARCHAR(100),
    status VARCHAR(50),
    distance_to_center DECIMAL(12,10)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.room_number,
        r.room_type,
        r.status,
        -- Distancia euclidiana al centro habitación
        SQRT(POWER(p_x - r.center_x, 2) + POWER(p_y - r.center_y, 2)) as calculated_distance
    FROM rooms r
    WHERE r.floor_id = p_floor_id
    -- Punto dentro rectángulo habitación
    AND p_x >= r.x_coordinate 
    AND p_x <= r.x_coordinate + r.width
    AND p_y >= r.y_coordinate
    AND p_y <= r.y_coordinate + r.height
    ORDER BY calculated_distance;
END;
$$ LANGUAGE plpgsql;
Triggers para Integridad de Datos
Auto-update de Contadores
sql-- Función para actualizar contadores
CREATE OR REPLACE FUNCTION update_counters()
RETURNS TRIGGER AS $$
BEGIN
    -- Update floors counter en hotels
    IF TG_TABLE_NAME = 'floors' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE hotels SET total_floors = total_floors + 1 WHERE id = NEW.hotel_id;
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN  
            UPDATE hotels SET total_floors = total_floors - 1 WHERE id = OLD.hotel_id;
            RETURN OLD;
        END IF;
    END IF;
    
    -- Update rooms counter en floors y hotels
    IF TG_TABLE_NAME = 'rooms' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE floors SET total_rooms = total_rooms + 1 WHERE id = NEW.floor_id;
            UPDATE hotels SET total_rooms = total_rooms + 1 
            WHERE id = (SELECT hotel_id FROM floors WHERE id = NEW.floor_id);
            RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE floors SET total_rooms = total_rooms - 1 WHERE id = OLD.floor_id;  
            UPDATE hotels SET total_rooms = total_rooms - 1
            WHERE id = (SELECT hotel_id FROM floors WHERE id = OLD.floor_id);
            RETURN OLD;
        ELSIF TG_OP = 'UPDATE' AND OLD.floor_id != NEW.floor_id THEN
            -- Cambio de planta
            UPDATE floors SET total_rooms = total_rooms - 1 WHERE id = OLD.floor_id;
            UPDATE floors SET total_rooms = total_rooms + 1 WHERE id = NEW.floor_id;
            RETURN NEW;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER floors_counter_trigger
    AFTER INSERT OR DELETE ON floors
    FOR EACH ROW EXECUTE FUNCTION update_counters();

CREATE TRIGGER rooms_counter_trigger  
    AFTER INSERT OR UPDATE OR DELETE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_counters();
Trigger Historial Coordenadas
sqlCREATE OR REPLACE FUNCTION track_coordinate_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si cambió alguna coordenada
    IF (OLD.x_coordinate IS DISTINCT FROM NEW.x_coordinate OR 
        OLD.y_coordinate IS DISTINCT FROM NEW.y_coordinate OR 
        OLD.width IS DISTINCT FROM NEW.width OR 
        OLD.height IS DISTINCT FROM NEW.height) THEN
        
        INSERT INTO room_coordinate_history (
            room_id,
            old_x_coordinate, old_y_coordinate, old_width, old_height,
            new_x_coordinate, new_y_coordinate, new_width, new_height,
            change_reason
        ) VALUES (
            NEW.id,
            OLD.x_coordinate, OLD.y_coordinate, OLD.width, OLD.height, 
            NEW.x_coordinate, NEW.y_coordinate, NEW.width, NEW.height,
            'API coordinate update'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER coordinate_history_trigger
    AFTER UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION track_coordinate_changes();
Trigger Updated_at Automático
sqlCREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con updated_at
CREATE TRIGGER hotels_updated_at BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER floors_updated_at BEFORE UPDATE ON floors  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
Views Optimizadas para Queries Complejas
Vista Hotel Summary (Performance)
sqlCREATE VIEW hotel_summary AS
SELECT 
    h.id,
    h.name,
    h.slug,
    h.status,
    h.processed_image_url,
    h.thumbnail_url,
    h.image_width,
    h.image_height, 
    h.image_aspect_ratio,
    h.total_floors,
    h.total_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'maintenance') as maintenance_rooms,
    AVG(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as avg_room_price,
    h.created_at,
    h.updated_at
FROM hotels h
LEFT JOIN floors f ON h.id = f.hotel_id AND f.status = 'active'
LEFT JOIN rooms r ON f.id = r.floor_id
WHERE h.status = 'active'
GROUP BY h.id, h.name, h.slug, h.status, h.processed_image_url, 
         h.thumbnail_url, h.image_width, h.image_height, h.image_aspect_ratio,
         h.total_floors, h.total_rooms, h.created_at, h.updated_at;
Vista Floor with Room Details
sqlCREATE VIEW floor_details AS  
SELECT 
    f.id,
    f.hotel_id,
    f.floor_number,
    f.name,
    f.display_order,
    f.status,
    f.total_rooms,
    h.name as hotel_name,
    COUNT(r.id) as actual_room_count,
    COUNT(r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    AVG(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as avg_room_price,
    STRING_AGG(DISTINCT r.room_type, ', ' ORDER BY r.room_type) as room_types,
    f.created_at,
    f.updated_at
FROM floors f
JOIN hotels h ON f.hotel_id = h.id
LEFT JOIN rooms r ON f.id = r.floor_id  
GROUP BY f.id, f.hotel_id, f.floor_number, f.name, f.display_order,
         f.status, f.total_rooms, h.name, f.created_at, f.updated_at;
Queries de Performance Críticas
Query Optimizada Rooms por Floor
sql-- Query principal frontend: obtener todas las habitaciones de una planta
SELECT 
    r.id,
    r.room_number,
    r.room_type,
    r.bed_type,
    r.capacity,
    r.status,
    r.x_coordinate,
    r.y_coordinate, 
    r.width,
    r.height,
    r.center_x,
    r.center_y,
    r.area,
    r.base_price,
    r.currency,
    r.metadata,
    f.floor_number,
    h.name as hotel_name
FROM rooms r
JOIN floors f ON r.floor_id = f.id
JOIN hotels h ON f.hotel_id = h.id
WHERE f.id = $1
ORDER BY 
    CASE WHEN r.room_number ~ '^[0-9]+$' 
         THEN LPAD(r.room_number, 10, '0') 
         ELSE r.room_number 
    END;
Query Búsqueda Espacial Optimizada
sql-- Encontrar habitaciones en región específica con porcentaje overlap
WITH search_region AS (
    SELECT 
        $1::UUID as floor_id,
        $2::DECIMAL(12,10) as min_x,
        $3::DECIMAL(12,10) as min_y,
        $4::DECIMAL(12,10) as max_x,
        $5::DECIMAL(12,10) as max_y
)
SELECT 
    r.id,
    r.room_number,
    r.room_type,
    r.status,
    r.center_x,
    r.center_y,
    -- Calcular porcentaje overlap
    (LEAST(sr.max_x, r.x_end) - GREATEST(sr.min_x, r.x_coordinate)) *
    (LEAST(sr.max_y, r.y_end) - GREATEST(sr.min_y, r.y_coordinate)) / r.area * 100 as overlap_percentage
FROM rooms r
CROSS JOIN search_region sr
WHERE r.floor_id = sr.floor_id
-- Intersección básica
AND r.x_coordinate < sr.max_x 
AND r.x_end > sr.min_x
AND r.y_coordinate < sr.max_y
AND r.y_end > sr.min_y
-- Solo overlaps significativos
AND (LEAST(sr.max_x, r.x_end) - GREATEST(sr.min_x, r.x_coordinate)) *
    (LEAST(sr.max_y, r.y_end) - GREATEST(sr.min_y, r.y_coordinate)) > 0.001
ORDER BY overlap_percentage DESC;
Configuración PostgreSQL Optimizada
postgresql.conf Settings Críticos
ini# Memory Configuration
shared_buffers = 256MB                  # 25% RAM disponible
effective_cache_size = 1GB              # 75% RAM disponible  
work_mem = 16MB                         # Para queries complejas
maintenance_work_mem = 64MB             # Operaciones mantenimiento

# Query Optimizer  
random_page_cost = 1.1                  # SSD optimizado
effective_io_concurrency = 200          # SSD optimizado
default_statistics_target = 100         # Mejor query planning

# Logging para Optimización
log_min_duration_statement = 1000       # Log queries >1s
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_statement = 'mod'                   # Log modificaciones

# Performance Monitoring
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.track = all
pg_stat_statements.max = 10000
pg_stat_statements.save = on

# Checkpoint Configuration  
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 1GB
min_wal_size = 80MB

# Connection Settings
max_connections = 100
superuser_reserved_connections = 3
Estrategias Backup y Monitoring
Scripts Backup Automatizado
sql-- Crear usuario backup con permisos mínimos
CREATE ROLE hotel_backup WITH LOGIN PASSWORD 'secure_backup_pass';
GRANT CONNECT ON DATABASE hotel_mapper TO hotel_backup;
GRANT USAGE ON SCHEMA public TO hotel_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO hotel_backup;
Queries Monitoring Performance
sql-- Top queries por tiempo ejecución
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 10;

-- Estadísticas uso índices
SELECT 
    schemaname,
    tablename, 
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
    CASE WHEN idx_tup_read > 0 
         THEN round((idx_tup_fetch::numeric / idx_tup_read) * 100, 2) 
         ELSE 0 
    END as hit_ratio_percent
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Tablas más grandes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    n_tup_ins + n_tup_upd + n_tup_del as total_modifications,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
Criterios Aceptación Database

✅ Schema completamente normalizado con integridad referencial
✅ Índices geométricos optimizados para queries espaciales
✅ Funciones SQL overlap detection con tolerancia configurable
✅ Triggers automáticos para contadores e historial
✅ Views optimizadas para queries complejas frecuentes
✅ Configuración PostgreSQL tunning performance
✅ Backup strategy automatizado y recovery procedures
✅ Monitoring queries para detectar bottlenecks
✅ Validaciones constraints cubren todos edge cases geométricos
✅ Performance <50ms queries básicos, <200ms queries complejos

Consideraciones Específicas Claude Code

Crear tablas en orden dependencias (hotels → floors → rooms)
Implementar functions antes que triggers que las usan
Índices después de estructura completa tablas
Views al final cuando todas las tablas existen
Testing queries performance con datos ejemplo