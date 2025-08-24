-- =====================================================
-- Hotel Room Mapper - Main Tables Creation
-- PostgreSQL 15+
-- =====================================================
-- Core tables with constraints and validations
-- Order: hotels -> floors -> rooms -> room_coordinate_history
-- =====================================================

-- Ensure we're in the correct database
\c hotel_mapper;

-- =====================================================
-- HOTELS TABLE - Main entity
-- =====================================================
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    
    -- Image management (relative URLs)
    original_image_url VARCHAR(500) NOT NULL,
    processed_image_url VARCHAR(500) NOT NULL, 
    thumbnail_url VARCHAR(500) NOT NULL,
    image_width INTEGER NOT NULL CHECK (image_width > 0),
    image_height INTEGER NOT NULL CHECK (image_height > 0),
    
    -- Calculated field for aspect ratio
    image_aspect_ratio DECIMAL(10,6) GENERATED ALWAYS AS (
        CAST(image_width AS DECIMAL) / CAST(image_height AS DECIMAL)
    ) STORED,
    
    -- Counters (maintained via triggers)
    total_floors INTEGER DEFAULT 0,
    total_rooms INTEGER DEFAULT 0,
    
    -- Status and metadata
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for documentation
COMMENT ON TABLE hotels IS 'Main hotel entities with image references and metadata';
COMMENT ON COLUMN hotels.slug IS 'URL-friendly unique identifier for the hotel';
COMMENT ON COLUMN hotels.image_aspect_ratio IS 'Auto-calculated ratio for responsive rendering';
COMMENT ON COLUMN hotels.total_floors IS 'Counter maintained by triggers';
COMMENT ON COLUMN hotels.total_rooms IS 'Counter maintained by triggers';

-- =====================================================
-- FLOORS TABLE - Hotel floors/levels
-- =====================================================
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    
    -- Floor identification
    floor_number INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL CHECK (length(trim(name)) > 0),
    display_order INTEGER DEFAULT 0,
    
    -- Counters
    total_rooms INTEGER DEFAULT 0,
    
    -- Operational data
    floor_area_sqm DECIMAL(10,2) CHECK (floor_area_sqm IS NULL OR floor_area_sqm > 0),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    notes TEXT,
    
    -- Audit fields  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(hotel_id, floor_number),
    CHECK (floor_number >= -10 AND floor_number <= 200)
);

-- Add comments
COMMENT ON TABLE floors IS 'Hotel floors/levels with room counts';
COMMENT ON COLUMN floors.floor_number IS 'Physical floor number (negative for basements)';
COMMENT ON COLUMN floors.display_order IS 'Custom ordering for UI display';
COMMENT ON COLUMN floors.total_rooms IS 'Counter maintained by triggers';

-- =====================================================
-- ROOMS TABLE - Core room entities with coordinates
-- =====================================================
CREATE TABLE IF NOT EXISTS rooms (
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
    
    -- NORMALIZED COORDINATES (0.0 - 1.0)
    -- Critical for responsive rendering
    x_coordinate DECIMAL(12,10) NOT NULL CHECK (x_coordinate >= 0 AND x_coordinate <= 1),
    y_coordinate DECIMAL(12,10) NOT NULL CHECK (y_coordinate >= 0 AND y_coordinate <= 1), 
    width DECIMAL(12,10) NOT NULL CHECK (width > 0 AND width <= 1),
    height DECIMAL(12,10) NOT NULL CHECK (height > 0 AND height <= 1),
    
    -- CALCULATED FIELDS FOR GEOMETRIC QUERIES
    x_end DECIMAL(12,10) GENERATED ALWAYS AS (x_coordinate + width) STORED,
    y_end DECIMAL(12,10) GENERATED ALWAYS AS (y_coordinate + height) STORED,
    center_x DECIMAL(12,10) GENERATED ALWAYS AS (x_coordinate + (width / 2)) STORED,
    center_y DECIMAL(12,10) GENERATED ALWAYS AS (y_coordinate + (height / 2)) STORED,
    area DECIMAL(12,10) GENERATED ALWAYS AS (width * height) STORED,
    
    -- Business data
    base_price DECIMAL(10,2) CHECK (base_price IS NULL OR base_price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Flexible metadata storage
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- CRITICAL GEOMETRIC VALIDATIONS
    CHECK (x_coordinate + width <= 1.0),   -- Must stay within horizontal bounds
    CHECK (y_coordinate + height <= 1.0),  -- Must stay within vertical bounds  
    CHECK (width >= 0.005),                -- Minimum 0.5% of image width
    CHECK (height >= 0.005),               -- Minimum 0.5% of image height
    
    -- Business constraints
    UNIQUE(floor_id, room_number)
);

-- Add comprehensive comments
COMMENT ON TABLE rooms IS 'Room entities with normalized coordinates for responsive mapping';
COMMENT ON COLUMN rooms.x_coordinate IS 'Normalized X position (0-1) from left edge';
COMMENT ON COLUMN rooms.y_coordinate IS 'Normalized Y position (0-1) from top edge';
COMMENT ON COLUMN rooms.width IS 'Normalized width (0-1) of room rectangle';
COMMENT ON COLUMN rooms.height IS 'Normalized height (0-1) of room rectangle';
COMMENT ON COLUMN rooms.x_end IS 'Auto-calculated right edge coordinate';
COMMENT ON COLUMN rooms.y_end IS 'Auto-calculated bottom edge coordinate';
COMMENT ON COLUMN rooms.center_x IS 'Auto-calculated horizontal center';
COMMENT ON COLUMN rooms.center_y IS 'Auto-calculated vertical center';
COMMENT ON COLUMN rooms.area IS 'Auto-calculated normalized area';
COMMENT ON COLUMN rooms.metadata IS 'Flexible JSON storage for additional properties';

-- =====================================================
-- ROOM_COORDINATE_HISTORY TABLE - Audit trail
-- =====================================================
CREATE TABLE IF NOT EXISTS room_coordinate_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    
    -- Previous coordinates
    old_x_coordinate DECIMAL(12,10),
    old_y_coordinate DECIMAL(12,10), 
    old_width DECIMAL(12,10),
    old_height DECIMAL(12,10),
    
    -- New coordinates
    new_x_coordinate DECIMAL(12,10),
    new_y_coordinate DECIMAL(12,10),
    new_width DECIMAL(12,10), 
    new_height DECIMAL(12,10),
    
    -- Change metadata
    change_reason VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID  -- Future: reference to users table
);

-- Add comments
COMMENT ON TABLE room_coordinate_history IS 'Audit trail for room coordinate changes';
COMMENT ON COLUMN room_coordinate_history.change_reason IS 'Human-readable reason for the change';
COMMENT ON COLUMN room_coordinate_history.changed_by IS 'Future reference to user who made the change';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to application user
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hotel_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hotel_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO hotel_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO hotel_app;

-- Grant read-only permissions to backup user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_backup;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO hotel_backup;