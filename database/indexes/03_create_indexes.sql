-- =====================================================
-- Hotel Room Mapper - Performance Indexes
-- PostgreSQL 15+
-- =====================================================
-- Optimized indexes for spatial queries and common operations
-- =====================================================

\c hotel_mapper;

-- =====================================================
-- HOTELS TABLE INDEXES
-- =====================================================

-- Unique slug for URL routing
CREATE INDEX IF NOT EXISTS idx_hotels_slug 
    ON hotels(slug);

-- Active hotels filter (partial index for performance)
CREATE INDEX IF NOT EXISTS idx_hotels_status 
    ON hotels(status) 
    WHERE status = 'active';

-- Recent hotels sorting
CREATE INDEX IF NOT EXISTS idx_hotels_created_at 
    ON hotels(created_at DESC);

-- Full-text search on hotel names
CREATE INDEX IF NOT EXISTS idx_hotels_name_search 
    ON hotels USING gin(to_tsvector('english', name));

-- =====================================================
-- FLOORS TABLE INDEXES
-- =====================================================

-- Foreign key and common joins
CREATE INDEX IF NOT EXISTS idx_floors_hotel_id 
    ON floors(hotel_id);

-- Composite for hotel + floor lookups
CREATE INDEX IF NOT EXISTS idx_floors_hotel_floor 
    ON floors(hotel_id, floor_number);

-- Custom display ordering
CREATE INDEX IF NOT EXISTS idx_floors_display_order 
    ON floors(hotel_id, display_order);

-- Active floors filter
CREATE INDEX IF NOT EXISTS idx_floors_status 
    ON floors(status) 
    WHERE status = 'active';

-- =====================================================
-- ROOMS TABLE INDEXES - CRITICAL FOR PERFORMANCE
-- =====================================================

-- Foreign key and basic lookups
CREATE INDEX IF NOT EXISTS idx_rooms_floor_id 
    ON rooms(floor_id);

-- Status filtering (partial indexes for common queries)
CREATE INDEX IF NOT EXISTS idx_rooms_status 
    ON rooms(status) 
    WHERE status IN ('available', 'occupied');

-- Room type categorization
CREATE INDEX IF NOT EXISTS idx_rooms_room_type 
    ON rooms(room_type);

-- =====================================================
-- GEOMETRIC INDEXES - CRITICAL FOR SPATIAL QUERIES
-- =====================================================

-- Main coordinate index for spatial operations
CREATE INDEX IF NOT EXISTS idx_rooms_coordinates 
    ON rooms(x_coordinate, y_coordinate, width, height);

-- Center point queries (hover detection)
CREATE INDEX IF NOT EXISTS idx_rooms_center_point 
    ON rooms(center_x, center_y);

-- Bounding box queries (overlap detection)
CREATE INDEX IF NOT EXISTS idx_rooms_bounding_box 
    ON rooms(x_coordinate, y_coordinate, x_end, y_end);

-- Composite index for floor + coordinates (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_rooms_floor_coordinates 
    ON rooms(floor_id, x_coordinate, y_coordinate, x_end, y_end);

-- Area-based queries
CREATE INDEX IF NOT EXISTS idx_rooms_area 
    ON rooms(area DESC);

-- =====================================================
-- JSONB INDEXES
-- =====================================================

-- GIN index for metadata queries
CREATE INDEX IF NOT EXISTS idx_rooms_metadata 
    ON rooms USING gin(metadata);

-- Specific metadata paths (if needed)
-- CREATE INDEX IF NOT EXISTS idx_rooms_metadata_features 
--     ON rooms USING gin((metadata->'features'));

-- =====================================================
-- BUSINESS LOGIC INDEXES
-- =====================================================

-- Available rooms by floor and type (common booking query)
CREATE INDEX IF NOT EXISTS idx_rooms_available 
    ON rooms(floor_id, room_type) 
    WHERE status = 'available';

-- Price range queries
CREATE INDEX IF NOT EXISTS idx_rooms_price 
    ON rooms(base_price) 
    WHERE base_price IS NOT NULL;

-- Room number sorting (handles alphanumeric)
CREATE INDEX IF NOT EXISTS idx_rooms_number 
    ON rooms(floor_id, room_number);

-- =====================================================
-- ROOM COORDINATE HISTORY INDEXES
-- =====================================================

-- History lookup by room
CREATE INDEX IF NOT EXISTS idx_coordinate_history_room 
    ON room_coordinate_history(room_id, changed_at DESC);

-- Recent changes across system
CREATE INDEX IF NOT EXISTS idx_coordinate_history_recent 
    ON room_coordinate_history(changed_at DESC);

-- =====================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- =====================================================

-- Hotel summary view optimization
CREATE INDEX IF NOT EXISTS idx_hotels_summary 
    ON hotels(id, status, name, slug) 
    WHERE status = 'active';

-- Floor with rooms count optimization
CREATE INDEX IF NOT EXISTS idx_floors_with_rooms 
    ON floors(id, hotel_id, status, floor_number) 
    WHERE status = 'active';

-- =====================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =====================================================

-- Update statistics for query optimization
ANALYZE hotels;
ANALYZE floors;
ANALYZE rooms;
ANALYZE room_coordinate_history;

-- =====================================================
-- INDEX MAINTENANCE COMMENTS
-- =====================================================

COMMENT ON INDEX idx_rooms_coordinates IS 'Primary spatial index for coordinate-based queries';
COMMENT ON INDEX idx_rooms_bounding_box IS 'Optimized for overlap detection algorithms';
COMMENT ON INDEX idx_rooms_floor_coordinates IS 'Composite index for most common frontend query';
COMMENT ON INDEX idx_rooms_available IS 'Partial index for available room searches';
COMMENT ON INDEX idx_rooms_metadata IS 'GIN index for flexible JSON queries';