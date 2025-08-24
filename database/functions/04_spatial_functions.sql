-- =====================================================
-- Hotel Room Mapper - Spatial Functions
-- PostgreSQL 15+
-- =====================================================
-- Geometric calculations and spatial queries
-- All coordinates are normalized (0-1 range)
-- =====================================================

\c hotel_mapper;

-- =====================================================
-- FUNCTION: check_room_overlap
-- Detects overlapping rooms with configurable tolerance
-- =====================================================
CREATE OR REPLACE FUNCTION check_room_overlap(
    p_floor_id UUID,
    p_x_coord DECIMAL(12,10),
    p_y_coord DECIMAL(12,10), 
    p_width DECIMAL(12,10),
    p_height DECIMAL(12,10),
    p_exclude_room_id UUID DEFAULT NULL,
    p_tolerance DECIMAL(4,3) DEFAULT 0.050  -- 5% tolerance default
)
RETURNS TABLE(
    overlapping_room_id UUID,
    overlapping_room_number VARCHAR(50),
    overlap_area DECIMAL(12,10),
    overlap_percentage DECIMAL(5,2)
) 
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_new_area DECIMAL(12,10);
BEGIN
    -- Calculate area of new room
    v_new_area := p_width * p_height;
    
    -- Validate input parameters
    IF p_x_coord < 0 OR p_x_coord > 1 OR p_y_coord < 0 OR p_y_coord > 1 THEN
        RAISE EXCEPTION 'Coordinates must be between 0 and 1';
    END IF;
    
    IF p_x_coord + p_width > 1 OR p_y_coord + p_height > 1 THEN
        RAISE EXCEPTION 'Room extends beyond image boundaries';
    END IF;
    
    IF p_width <= 0 OR p_height <= 0 THEN
        RAISE EXCEPTION 'Width and height must be positive';
    END IF;

    RETURN QUERY
    SELECT 
        r.id,
        r.room_number,
        -- Calculate exact overlap area using intersection formula
        GREATEST(0::DECIMAL(12,10), 
            LEAST(p_x_coord + p_width, r.x_coordinate + r.width) - 
            GREATEST(p_x_coord, r.x_coordinate)
        ) * 
        GREATEST(0::DECIMAL(12,10), 
            LEAST(p_y_coord + p_height, r.y_coordinate + r.height) - 
            GREATEST(p_y_coord, r.y_coordinate)
        ) AS calculated_overlap_area,
        -- Calculate overlap percentage relative to new room
        CASE 
            WHEN v_new_area > 0 THEN
                (GREATEST(0::DECIMAL(12,10), 
                    LEAST(p_x_coord + p_width, r.x_coordinate + r.width) - 
                    GREATEST(p_x_coord, r.x_coordinate)
                ) * 
                GREATEST(0::DECIMAL(12,10), 
                    LEAST(p_y_coord + p_height, r.y_coordinate + r.height) - 
                    GREATEST(p_y_coord, r.y_coordinate)
                )) / v_new_area * 100
            ELSE 0
        END AS calculated_overlap_percentage
    FROM rooms r
    WHERE r.floor_id = p_floor_id
    AND (p_exclude_room_id IS NULL OR r.id != p_exclude_room_id)
    -- Check for geometric intersection
    AND p_x_coord < r.x_coordinate + r.width 
    AND p_x_coord + p_width > r.x_coordinate
    AND p_y_coord < r.y_coordinate + r.height
    AND p_y_coord + p_height > r.y_coordinate
    -- Only return significant overlaps (above tolerance threshold)
    AND (GREATEST(0::DECIMAL(12,10), 
        LEAST(p_x_coord + p_width, r.x_coordinate + r.width) - 
        GREATEST(p_x_coord, r.x_coordinate)
    ) * 
    GREATEST(0::DECIMAL(12,10), 
        LEAST(p_y_coord + p_height, r.y_coordinate + r.height) - 
        GREATEST(p_y_coord, r.y_coordinate)
    )) > p_tolerance * v_new_area
    ORDER BY calculated_overlap_percentage DESC;
END;
$$;

COMMENT ON FUNCTION check_room_overlap IS 'Detects overlapping rooms with configurable tolerance threshold';

-- =====================================================
-- FUNCTION: find_rooms_at_point
-- Finds all rooms containing a specific point
-- =====================================================
CREATE OR REPLACE FUNCTION find_rooms_at_point(
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
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Validate input coordinates
    IF p_x < 0 OR p_x > 1 OR p_y < 0 OR p_y > 1 THEN
        RAISE EXCEPTION 'Point coordinates must be between 0 and 1';
    END IF;
    
    RETURN QUERY
    SELECT 
        r.id,
        r.room_number,
        r.room_type,
        r.status,
        -- Calculate Euclidean distance to room center
        SQRT(POWER(p_x - r.center_x, 2) + POWER(p_y - r.center_y, 2))::DECIMAL(12,10) as calculated_distance
    FROM rooms r
    WHERE r.floor_id = p_floor_id
    -- Check if point is inside room rectangle
    AND p_x >= r.x_coordinate 
    AND p_x <= r.x_coordinate + r.width
    AND p_y >= r.y_coordinate
    AND p_y <= r.y_coordinate + r.height
    ORDER BY calculated_distance;
END;
$$;

COMMENT ON FUNCTION find_rooms_at_point IS 'Finds all rooms containing a specific normalized point';

-- =====================================================
-- FUNCTION: find_rooms_in_region
-- Finds rooms within or intersecting a rectangular region
-- =====================================================
CREATE OR REPLACE FUNCTION find_rooms_in_region(
    p_floor_id UUID,
    p_min_x DECIMAL(12,10),
    p_min_y DECIMAL(12,10),
    p_max_x DECIMAL(12,10),
    p_max_y DECIMAL(12,10),
    p_min_overlap_percentage DECIMAL(5,2) DEFAULT 0.01  -- Minimum 1% overlap
)
RETURNS TABLE(
    room_id UUID,
    room_number VARCHAR(50),
    room_type VARCHAR(100),
    status VARCHAR(50),
    overlap_percentage DECIMAL(5,2),
    fully_contained BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Validate region boundaries
    IF p_min_x < 0 OR p_min_x > 1 OR p_max_x < 0 OR p_max_x > 1 OR
       p_min_y < 0 OR p_min_y > 1 OR p_max_y < 0 OR p_max_y > 1 THEN
        RAISE EXCEPTION 'Region coordinates must be between 0 and 1';
    END IF;
    
    IF p_min_x >= p_max_x OR p_min_y >= p_max_y THEN
        RAISE EXCEPTION 'Invalid region: min values must be less than max values';
    END IF;

    RETURN QUERY
    WITH region_data AS (
        SELECT
            r.id,
            r.room_number,
            r.room_type,
            r.status,
            r.x_coordinate,
            r.y_coordinate,
            r.x_end,
            r.y_end,
            r.area,
            -- Calculate intersection area
            GREATEST(0::DECIMAL(12,10), 
                LEAST(p_max_x, r.x_end) - GREATEST(p_min_x, r.x_coordinate)
            ) * 
            GREATEST(0::DECIMAL(12,10), 
                LEAST(p_max_y, r.y_end) - GREATEST(p_min_y, r.y_coordinate)
            ) as intersection_area
        FROM rooms r
        WHERE r.floor_id = p_floor_id
        -- Basic intersection check
        AND r.x_coordinate < p_max_x 
        AND r.x_end > p_min_x
        AND r.y_coordinate < p_max_y
        AND r.y_end > p_min_y
    )
    SELECT 
        id,
        room_number,
        room_type,
        status,
        -- Calculate overlap percentage relative to room area
        CASE 
            WHEN area > 0 THEN (intersection_area / area * 100)::DECIMAL(5,2)
            ELSE 0
        END as overlap_percentage,
        -- Check if room is fully contained in region
        (x_coordinate >= p_min_x AND x_end <= p_max_x AND 
         y_coordinate >= p_min_y AND y_end <= p_max_y) as fully_contained
    FROM region_data
    WHERE intersection_area / area >= p_min_overlap_percentage / 100
    ORDER BY overlap_percentage DESC;
END;
$$;

COMMENT ON FUNCTION find_rooms_in_region IS 'Finds rooms within or intersecting a rectangular region';

-- =====================================================
-- FUNCTION: calculate_room_distance
-- Calculates distance between two rooms
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_room_distance(
    p_room_id_1 UUID,
    p_room_id_2 UUID
)
RETURNS TABLE(
    center_distance DECIMAL(12,10),
    edge_distance DECIMAL(12,10),
    overlapping BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_room1 RECORD;
    v_room2 RECORD;
    v_edge_dist DECIMAL(12,10);
BEGIN
    -- Get room 1 data
    SELECT * INTO v_room1 FROM rooms WHERE id = p_room_id_1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room 1 not found: %', p_room_id_1;
    END IF;
    
    -- Get room 2 data
    SELECT * INTO v_room2 FROM rooms WHERE id = p_room_id_2;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room 2 not found: %', p_room_id_2;
    END IF;
    
    -- Check if rooms are on same floor
    IF v_room1.floor_id != v_room2.floor_id THEN
        RAISE EXCEPTION 'Rooms are on different floors';
    END IF;
    
    -- Calculate edge distance (0 if overlapping)
    IF v_room1.x_coordinate < v_room2.x_end AND 
       v_room1.x_end > v_room2.x_coordinate AND
       v_room1.y_coordinate < v_room2.y_end AND 
       v_room1.y_end > v_room2.y_coordinate THEN
        -- Rooms overlap
        v_edge_dist := 0;
    ELSE
        -- Calculate minimum distance between edges
        v_edge_dist := LEAST(
            -- Horizontal distance
            CASE 
                WHEN v_room1.x_end < v_room2.x_coordinate 
                    THEN v_room2.x_coordinate - v_room1.x_end
                WHEN v_room2.x_end < v_room1.x_coordinate 
                    THEN v_room1.x_coordinate - v_room2.x_end
                ELSE 0
            END,
            -- Vertical distance
            CASE 
                WHEN v_room1.y_end < v_room2.y_coordinate 
                    THEN v_room2.y_coordinate - v_room1.y_end
                WHEN v_room2.y_end < v_room1.y_coordinate 
                    THEN v_room1.y_coordinate - v_room2.y_end
                ELSE 0
            END
        );
    END IF;
    
    RETURN QUERY
    SELECT 
        -- Euclidean distance between centers
        SQRT(POWER(v_room1.center_x - v_room2.center_x, 2) + 
             POWER(v_room1.center_y - v_room2.center_y, 2))::DECIMAL(12,10),
        v_edge_dist,
        v_edge_dist = 0;
END;
$$;

COMMENT ON FUNCTION calculate_room_distance IS 'Calculates various distance metrics between two rooms';

-- =====================================================
-- FUNCTION: validate_room_coordinates
-- Comprehensive validation before insert/update
-- =====================================================
CREATE OR REPLACE FUNCTION validate_room_coordinates(
    p_floor_id UUID,
    p_x_coord DECIMAL(12,10),
    p_y_coord DECIMAL(12,10),
    p_width DECIMAL(12,10),
    p_height DECIMAL(12,10),
    p_room_id UUID DEFAULT NULL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT,
    overlapping_rooms INTEGER,
    max_overlap_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_overlap_count INTEGER;
    v_max_overlap DECIMAL(5,2);
    v_floor_exists BOOLEAN;
BEGIN
    -- Check if floor exists
    SELECT EXISTS(SELECT 1 FROM floors WHERE id = p_floor_id) INTO v_floor_exists;
    IF NOT v_floor_exists THEN
        RETURN QUERY SELECT FALSE, 'Floor does not exist', 0, 0::DECIMAL(5,2);
        RETURN;
    END IF;
    
    -- Validate coordinate ranges
    IF p_x_coord < 0 OR p_x_coord > 1 OR p_y_coord < 0 OR p_y_coord > 1 THEN
        RETURN QUERY SELECT FALSE, 'Coordinates must be between 0 and 1', 0, 0::DECIMAL(5,2);
        RETURN;
    END IF;
    
    -- Validate dimensions
    IF p_width <= 0 OR p_height <= 0 THEN
        RETURN QUERY SELECT FALSE, 'Width and height must be positive', 0, 0::DECIMAL(5,2);
        RETURN;
    END IF;
    
    -- Check minimum size (0.5% of image)
    IF p_width < 0.005 OR p_height < 0.005 THEN
        RETURN QUERY SELECT FALSE, 'Room is too small (minimum 0.5% of image dimensions)', 0, 0::DECIMAL(5,2);
        RETURN;
    END IF;
    
    -- Check boundaries
    IF p_x_coord + p_width > 1 OR p_y_coord + p_height > 1 THEN
        RETURN QUERY SELECT FALSE, 'Room extends beyond image boundaries', 0, 0::DECIMAL(5,2);
        RETURN;
    END IF;
    
    -- Check for overlaps
    SELECT COUNT(*), COALESCE(MAX(overlap_percentage), 0)
    INTO v_overlap_count, v_max_overlap
    FROM check_room_overlap(
        p_floor_id, 
        p_x_coord, 
        p_y_coord, 
        p_width, 
        p_height, 
        p_room_id, 
        0.05  -- 5% tolerance
    );
    
    -- Return validation result
    IF v_overlap_count > 0 AND v_max_overlap > 10 THEN
        RETURN QUERY SELECT 
            FALSE, 
            format('Significant overlap detected with %s room(s), maximum overlap: %s%%', 
                   v_overlap_count, v_max_overlap),
            v_overlap_count,
            v_max_overlap;
    ELSE
        RETURN QUERY SELECT 
            TRUE, 
            'Coordinates are valid', 
            v_overlap_count,
            v_max_overlap;
    END IF;
END;
$$;

COMMENT ON FUNCTION validate_room_coordinates IS 'Comprehensive validation of room coordinates before insert/update';

-- =====================================================
-- FUNCTION: get_floor_coverage
-- Calculates how much of the floor image is covered by rooms
-- =====================================================
CREATE OR REPLACE FUNCTION get_floor_coverage(
    p_floor_id UUID
)
RETURNS TABLE(
    total_rooms INTEGER,
    total_coverage DECIMAL(5,2),
    average_room_size DECIMAL(5,4),
    smallest_room_size DECIMAL(5,4),
    largest_room_size DECIMAL(5,4)
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_rooms,
        (SUM(area) * 100)::DECIMAL(5,2) as total_coverage,
        AVG(area)::DECIMAL(5,4) as average_room_size,
        MIN(area)::DECIMAL(5,4) as smallest_room_size,
        MAX(area)::DECIMAL(5,4) as largest_room_size
    FROM rooms
    WHERE floor_id = p_floor_id;
END;
$$;

COMMENT ON FUNCTION get_floor_coverage IS 'Calculates floor coverage statistics';