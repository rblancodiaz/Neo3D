-- =====================================================
-- Hotel Room Mapper - Optimized Views
-- PostgreSQL 15+
-- =====================================================
-- Pre-computed views for complex queries and reporting
-- =====================================================

\c hotel_mapper;

-- =====================================================
-- VIEW: hotel_summary
-- Aggregated hotel statistics for dashboard/listing
-- =====================================================
DROP VIEW IF EXISTS hotel_summary CASCADE;

CREATE VIEW hotel_summary AS
SELECT 
    h.id,
    h.name,
    h.slug,
    h.description,
    h.status,
    h.processed_image_url,
    h.thumbnail_url,
    h.image_width,
    h.image_height, 
    h.image_aspect_ratio,
    h.total_floors,
    h.total_rooms,
    -- Room availability breakdown
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'maintenance') as maintenance_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'out_of_order') as out_of_order_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'cleaning') as cleaning_rooms,
    -- Occupancy rate
    CASE 
        WHEN COUNT(DISTINCT r.id) > 0 THEN
            ROUND(
                COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'occupied')::NUMERIC / 
                COUNT(DISTINCT r.id) * 100, 
                2
            )
        ELSE 0
    END as occupancy_rate,
    -- Price statistics
    MIN(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as min_room_price,
    MAX(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as max_room_price,
    AVG(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as avg_room_price,
    -- Room type distribution
    COUNT(DISTINCT r.id) FILTER (WHERE r.room_type = 'standard') as standard_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.room_type = 'deluxe') as deluxe_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.room_type = 'suite') as suite_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.room_type = 'presidential') as presidential_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.room_type = 'accessible') as accessible_rooms,
    -- Active floors count
    COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'active') as active_floors,
    -- Timestamps
    h.created_at,
    h.updated_at,
    MAX(r.updated_at) as last_room_update
FROM hotels h
LEFT JOIN floors f ON h.id = f.hotel_id
LEFT JOIN rooms r ON f.id = r.floor_id
GROUP BY 
    h.id, h.name, h.slug, h.description, h.status, 
    h.processed_image_url, h.thumbnail_url, 
    h.image_width, h.image_height, h.image_aspect_ratio,
    h.total_floors, h.total_rooms, 
    h.created_at, h.updated_at;

CREATE INDEX ON hotel_summary(status) WHERE status = 'active';

COMMENT ON VIEW hotel_summary IS 'Aggregated hotel statistics with room availability and pricing';

-- =====================================================
-- VIEW: floor_details
-- Floor information with room statistics
-- =====================================================
DROP VIEW IF EXISTS floor_details CASCADE;

CREATE VIEW floor_details AS
SELECT 
    f.id,
    f.hotel_id,
    f.floor_number,
    f.name,
    f.display_order,
    f.status,
    f.floor_area_sqm,
    f.notes,
    f.total_rooms,
    h.name as hotel_name,
    h.slug as hotel_slug,
    h.processed_image_url as hotel_image_url,
    -- Actual room count (for validation)
    COUNT(r.id) as actual_room_count,
    -- Room availability
    COUNT(r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    COUNT(r.id) FILTER (WHERE r.status IN ('maintenance', 'out_of_order', 'cleaning')) as unavailable_rooms,
    -- Occupancy percentage
    CASE 
        WHEN COUNT(r.id) > 0 THEN
            ROUND(
                COUNT(r.id) FILTER (WHERE r.status = 'occupied')::NUMERIC / 
                COUNT(r.id) * 100, 
                2
            )
        ELSE 0
    END as occupancy_percentage,
    -- Price range
    MIN(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as min_price,
    MAX(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as max_price,
    AVG(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as avg_price,
    -- Room types available
    STRING_AGG(DISTINCT r.room_type, ', ' ORDER BY r.room_type) as room_types,
    -- Bed types available
    STRING_AGG(DISTINCT r.bed_type, ', ' ORDER BY r.bed_type) as bed_types,
    -- Capacity summary
    MIN(r.capacity) as min_capacity,
    MAX(r.capacity) as max_capacity,
    SUM(r.capacity) FILTER (WHERE r.status = 'available') as total_available_capacity,
    -- Floor coverage (percentage of image covered by rooms)
    ROUND(SUM(r.area) * 100, 2) as floor_coverage_percentage,
    -- Timestamps
    f.created_at,
    f.updated_at,
    MAX(r.updated_at) as last_room_update
FROM floors f
JOIN hotels h ON f.hotel_id = h.id
LEFT JOIN rooms r ON f.id = r.floor_id
GROUP BY 
    f.id, f.hotel_id, f.floor_number, f.name, f.display_order,
    f.status, f.floor_area_sqm, f.notes, f.total_rooms, 
    h.name, h.slug, h.processed_image_url,
    f.created_at, f.updated_at;

CREATE INDEX ON floor_details(hotel_id, floor_number);
CREATE INDEX ON floor_details(status) WHERE status = 'active';

COMMENT ON VIEW floor_details IS 'Floor information with aggregated room statistics';

-- =====================================================
-- VIEW: room_availability
-- Quick lookup for available rooms
-- =====================================================
DROP VIEW IF EXISTS room_availability CASCADE;

CREATE VIEW room_availability AS
SELECT 
    r.id as room_id,
    r.room_number,
    r.room_type,
    r.bed_type,
    r.capacity,
    r.status,
    r.base_price,
    r.currency,
    f.id as floor_id,
    f.floor_number,
    f.name as floor_name,
    h.id as hotel_id,
    h.name as hotel_name,
    h.slug as hotel_slug,
    -- Coordinates for mapping
    r.x_coordinate,
    r.y_coordinate,
    r.width,
    r.height,
    r.center_x,
    r.center_y,
    -- Availability flag
    (r.status = 'available') as is_available,
    -- Price tier calculation
    CASE 
        WHEN r.base_price IS NULL THEN NULL
        WHEN r.base_price < 100 THEN 'budget'
        WHEN r.base_price < 200 THEN 'standard'
        WHEN r.base_price < 500 THEN 'premium'
        ELSE 'luxury'
    END as price_tier,
    -- Size classification
    CASE 
        WHEN r.area < 0.01 THEN 'small'
        WHEN r.area < 0.025 THEN 'medium'
        WHEN r.area < 0.05 THEN 'large'
        ELSE 'extra_large'
    END as size_category
FROM rooms r
JOIN floors f ON r.floor_id = f.id
JOIN hotels h ON f.hotel_id = h.id
WHERE h.status = 'active' 
  AND f.status = 'active';

CREATE INDEX ON room_availability(status);
CREATE INDEX ON room_availability(hotel_id, status) WHERE status = 'available';
CREATE INDEX ON room_availability(room_type, status) WHERE status = 'available';

COMMENT ON VIEW room_availability IS 'Quick lookup view for room availability with classification';

-- =====================================================
-- VIEW: room_coordinate_map
-- Optimized view for canvas rendering
-- =====================================================
DROP VIEW IF EXISTS room_coordinate_map CASCADE;

CREATE VIEW room_coordinate_map AS
SELECT 
    r.id,
    r.room_number,
    r.room_type,
    r.status,
    -- Normalized coordinates for canvas
    r.x_coordinate,
    r.y_coordinate,
    r.width,
    r.height,
    r.x_end,
    r.y_end,
    r.center_x,
    r.center_y,
    -- Display properties
    CASE r.status
        WHEN 'available' THEN '#4CAF50'      -- Green
        WHEN 'occupied' THEN '#FF9800'       -- Orange
        WHEN 'maintenance' THEN '#F44336'    -- Red
        WHEN 'out_of_order' THEN '#9E9E9E'   -- Gray
        WHEN 'cleaning' THEN '#2196F3'       -- Blue
        ELSE '#607D8B'                       -- Blue Gray
    END as fill_color,
    CASE 
        WHEN r.status = 'available' THEN 0.7
        ELSE 0.5
    END as opacity,
    -- Hover information
    format('%s - %s', r.room_number, r.room_type) as hover_text,
    r.capacity,
    r.base_price,
    r.metadata,
    -- Floor and hotel context
    f.id as floor_id,
    f.floor_number,
    h.id as hotel_id,
    h.image_width,
    h.image_height,
    h.image_aspect_ratio
FROM rooms r
JOIN floors f ON r.floor_id = f.id
JOIN hotels h ON f.hotel_id = h.id
WHERE h.status = 'active' 
  AND f.status = 'active';

CREATE INDEX ON room_coordinate_map(floor_id);
CREATE INDEX ON room_coordinate_map(hotel_id, floor_number);

COMMENT ON VIEW room_coordinate_map IS 'Optimized view for canvas rendering with display properties';

-- =====================================================
-- VIEW: overlap_analysis
-- Identifies potential room overlaps for maintenance
-- =====================================================
DROP VIEW IF EXISTS overlap_analysis CASCADE;

CREATE VIEW overlap_analysis AS
WITH room_pairs AS (
    SELECT 
        r1.id as room1_id,
        r1.room_number as room1_number,
        r1.floor_id,
        r2.id as room2_id,
        r2.room_number as room2_number,
        -- Calculate overlap area
        GREATEST(0, 
            LEAST(r1.x_end, r2.x_end) - 
            GREATEST(r1.x_coordinate, r2.x_coordinate)
        ) * 
        GREATEST(0, 
            LEAST(r1.y_end, r2.y_end) - 
            GREATEST(r1.y_coordinate, r2.y_coordinate)
        ) as overlap_area,
        r1.area as room1_area,
        r2.area as room2_area
    FROM rooms r1
    JOIN rooms r2 ON r1.floor_id = r2.floor_id AND r1.id < r2.id
    WHERE 
        -- Check for intersection
        r1.x_coordinate < r2.x_end AND 
        r1.x_end > r2.x_coordinate AND
        r1.y_coordinate < r2.y_end AND 
        r1.y_end > r2.y_coordinate
)
SELECT 
    rp.*,
    f.floor_number,
    f.name as floor_name,
    h.id as hotel_id,
    h.name as hotel_name,
    -- Calculate overlap percentages
    ROUND((overlap_area / room1_area) * 100, 2) as room1_overlap_percentage,
    ROUND((overlap_area / room2_area) * 100, 2) as room2_overlap_percentage,
    GREATEST(
        (overlap_area / room1_area) * 100,
        (overlap_area / room2_area) * 100
    ) as max_overlap_percentage
FROM room_pairs rp
JOIN floors f ON rp.floor_id = f.id
JOIN hotels h ON f.hotel_id = h.id
WHERE overlap_area > 0
ORDER BY max_overlap_percentage DESC;

COMMENT ON VIEW overlap_analysis IS 'Identifies and analyzes room overlaps for data quality maintenance';

-- =====================================================
-- VIEW: hotel_statistics
-- Comprehensive statistics for reporting
-- =====================================================
DROP VIEW IF EXISTS hotel_statistics CASCADE;

CREATE VIEW hotel_statistics AS
SELECT 
    h.id as hotel_id,
    h.name as hotel_name,
    h.status as hotel_status,
    -- Floor statistics
    COUNT(DISTINCT f.id) as total_floors,
    COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'active') as active_floors,
    -- Room statistics
    COUNT(DISTINCT r.id) as total_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    -- Occupancy metrics
    CASE 
        WHEN COUNT(DISTINCT r.id) > 0 THEN
            ROUND(
                COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'occupied')::NUMERIC / 
                COUNT(DISTINCT r.id) * 100, 
                2
            )
        ELSE 0
    END as occupancy_rate,
    -- Room type distribution
    jsonb_build_object(
        'standard', COUNT(r.id) FILTER (WHERE r.room_type = 'standard'),
        'deluxe', COUNT(r.id) FILTER (WHERE r.room_type = 'deluxe'),
        'suite', COUNT(r.id) FILTER (WHERE r.room_type = 'suite'),
        'presidential', COUNT(r.id) FILTER (WHERE r.room_type = 'presidential'),
        'accessible', COUNT(r.id) FILTER (WHERE r.room_type = 'accessible')
    ) as room_type_distribution,
    -- Capacity metrics
    SUM(r.capacity) as total_capacity,
    SUM(r.capacity) FILTER (WHERE r.status = 'available') as available_capacity,
    AVG(r.capacity) as avg_room_capacity,
    -- Price metrics
    MIN(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as min_price,
    MAX(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as max_price,
    AVG(r.base_price) FILTER (WHERE r.base_price IS NOT NULL) as avg_price,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY r.base_price) 
        FILTER (WHERE r.base_price IS NOT NULL) as median_price,
    -- Coverage metrics
    AVG(r.area) * 100 as avg_room_size_percentage,
    SUM(r.area) * 100 as total_coverage_percentage,
    -- Data quality metrics
    COUNT(DISTINCT rch.room_id) as rooms_with_changes,
    COUNT(rch.id) as total_coordinate_changes
FROM hotels h
LEFT JOIN floors f ON h.id = f.hotel_id
LEFT JOIN rooms r ON f.id = r.floor_id
LEFT JOIN room_coordinate_history rch ON r.id = rch.room_id
GROUP BY h.id, h.name, h.status;

COMMENT ON VIEW hotel_statistics IS 'Comprehensive hotel statistics for reporting and analytics';

-- =====================================================
-- MATERIALIZED VIEW: floor_room_cache
-- Pre-computed room data for high-performance queries
-- =====================================================
DROP MATERIALIZED VIEW IF EXISTS floor_room_cache CASCADE;

CREATE MATERIALIZED VIEW floor_room_cache AS
SELECT 
    f.id as floor_id,
    f.hotel_id,
    f.floor_number,
    f.name as floor_name,
    f.display_order,
    h.slug as hotel_slug,
    h.image_width,
    h.image_height,
    h.image_aspect_ratio,
    -- Aggregate room data as JSON for single query retrieval
    jsonb_agg(
        jsonb_build_object(
            'id', r.id,
            'room_number', r.room_number,
            'room_type', r.room_type,
            'bed_type', r.bed_type,
            'capacity', r.capacity,
            'status', r.status,
            'x', r.x_coordinate,
            'y', r.y_coordinate,
            'width', r.width,
            'height', r.height,
            'center_x', r.center_x,
            'center_y', r.center_y,
            'base_price', r.base_price,
            'metadata', r.metadata
        ) ORDER BY r.room_number
    ) FILTER (WHERE r.id IS NOT NULL) as rooms_json,
    COUNT(r.id) as room_count,
    COUNT(r.id) FILTER (WHERE r.status = 'available') as available_count
FROM floors f
JOIN hotels h ON f.hotel_id = h.id
LEFT JOIN rooms r ON f.id = r.floor_id
WHERE h.status = 'active' AND f.status = 'active'
GROUP BY 
    f.id, f.hotel_id, f.floor_number, f.name, f.display_order,
    h.slug, h.image_width, h.image_height, h.image_aspect_ratio;

CREATE UNIQUE INDEX ON floor_room_cache(floor_id);
CREATE INDEX ON floor_room_cache(hotel_id, floor_number);

COMMENT ON MATERIALIZED VIEW floor_room_cache IS 'Pre-computed room data for high-performance floor rendering';

-- =====================================================
-- Refresh function for materialized view
-- =====================================================
CREATE OR REPLACE FUNCTION refresh_floor_room_cache()
RETURNS void 
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY floor_room_cache;
END;
$$;

COMMENT ON FUNCTION refresh_floor_room_cache IS 'Refreshes the floor_room_cache materialized view';

-- Grant permissions on views
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_app;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_backup;