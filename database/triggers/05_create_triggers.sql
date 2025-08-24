-- =====================================================
-- Hotel Room Mapper - Database Triggers
-- PostgreSQL 15+
-- =====================================================
-- Automatic data maintenance and audit triggers
-- =====================================================

\c hotel_mapper;

-- =====================================================
-- FUNCTION: update_updated_at_column
-- Auto-updates updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates the updated_at timestamp on row modification';

-- =====================================================
-- FUNCTION: update_counters
-- Maintains counter fields in parent tables
-- =====================================================
CREATE OR REPLACE FUNCTION update_counters()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    v_hotel_id UUID;
BEGIN
    -- Handle floors table operations
    IF TG_TABLE_NAME = 'floors' THEN
        IF TG_OP = 'INSERT' THEN
            -- Increment hotel floor count
            UPDATE hotels 
            SET total_floors = total_floors + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.hotel_id;
            RETURN NEW;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Decrement hotel floor count
            UPDATE hotels 
            SET total_floors = total_floors - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.hotel_id;
            RETURN OLD;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- Handle hotel change (rare case)
            IF OLD.hotel_id != NEW.hotel_id THEN
                UPDATE hotels 
                SET total_floors = total_floors - 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = OLD.hotel_id;
                
                UPDATE hotels 
                SET total_floors = total_floors + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.hotel_id;
            END IF;
            RETURN NEW;
        END IF;
    END IF;
    
    -- Handle rooms table operations
    IF TG_TABLE_NAME = 'rooms' THEN
        IF TG_OP = 'INSERT' THEN
            -- Increment floor room count
            UPDATE floors 
            SET total_rooms = total_rooms + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = NEW.floor_id;
            
            -- Increment hotel room count
            SELECT hotel_id INTO v_hotel_id 
            FROM floors 
            WHERE id = NEW.floor_id;
            
            UPDATE hotels 
            SET total_rooms = total_rooms + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_hotel_id;
            
            RETURN NEW;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- Decrement floor room count
            UPDATE floors 
            SET total_rooms = total_rooms - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.floor_id;
            
            -- Decrement hotel room count
            SELECT hotel_id INTO v_hotel_id 
            FROM floors 
            WHERE id = OLD.floor_id;
            
            UPDATE hotels 
            SET total_rooms = total_rooms - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_hotel_id;
            
            RETURN OLD;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- Handle floor change
            IF OLD.floor_id != NEW.floor_id THEN
                -- Decrement old floor
                UPDATE floors 
                SET total_rooms = total_rooms - 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = OLD.floor_id;
                
                -- Increment new floor
                UPDATE floors 
                SET total_rooms = total_rooms + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = NEW.floor_id;
                
                -- Update hotel counts if floors are in different hotels
                DECLARE
                    v_old_hotel_id UUID;
                    v_new_hotel_id UUID;
                BEGIN
                    SELECT hotel_id INTO v_old_hotel_id FROM floors WHERE id = OLD.floor_id;
                    SELECT hotel_id INTO v_new_hotel_id FROM floors WHERE id = NEW.floor_id;
                    
                    IF v_old_hotel_id != v_new_hotel_id THEN
                        UPDATE hotels 
                        SET total_rooms = total_rooms - 1,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = v_old_hotel_id;
                        
                        UPDATE hotels 
                        SET total_rooms = total_rooms + 1,
                            updated_at = CURRENT_TIMESTAMP
                        WHERE id = v_new_hotel_id;
                    END IF;
                END;
            END IF;
            RETURN NEW;
        END IF;
    END IF;
    
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION update_counters IS 'Maintains counter fields in parent tables (hotels.total_floors, floors.total_rooms, etc.)';

-- =====================================================
-- FUNCTION: track_coordinate_changes
-- Records coordinate history for audit trail
-- =====================================================
CREATE OR REPLACE FUNCTION track_coordinate_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    -- Only track if coordinates actually changed
    IF (OLD.x_coordinate IS DISTINCT FROM NEW.x_coordinate OR 
        OLD.y_coordinate IS DISTINCT FROM NEW.y_coordinate OR 
        OLD.width IS DISTINCT FROM NEW.width OR 
        OLD.height IS DISTINCT FROM NEW.height) THEN
        
        INSERT INTO room_coordinate_history (
            room_id,
            old_x_coordinate, 
            old_y_coordinate, 
            old_width, 
            old_height,
            new_x_coordinate, 
            new_y_coordinate, 
            new_width, 
            new_height,
            change_reason,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.x_coordinate, 
            OLD.y_coordinate, 
            OLD.width, 
            OLD.height,
            NEW.x_coordinate, 
            NEW.y_coordinate, 
            NEW.width, 
            NEW.height,
            COALESCE(
                current_setting('app.change_reason', true),
                'Coordinate update via API'
            ),
            CURRENT_TIMESTAMP
        );
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION track_coordinate_changes IS 'Records room coordinate changes to history table for audit trail';

-- =====================================================
-- FUNCTION: validate_room_overlap_trigger
-- Prevents excessive room overlap on insert/update
-- =====================================================
CREATE OR REPLACE FUNCTION validate_room_overlap_trigger()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    v_overlap_count INTEGER;
    v_max_overlap DECIMAL(5,2);
    v_validation RECORD;
BEGIN
    -- Skip validation if explicitly disabled
    IF current_setting('app.skip_overlap_check', true) = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Validate coordinates
    SELECT * INTO v_validation
    FROM validate_room_coordinates(
        NEW.floor_id,
        NEW.x_coordinate,
        NEW.y_coordinate,
        NEW.width,
        NEW.height,
        CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
    
    -- Check validation result
    IF NOT v_validation.is_valid THEN
        RAISE EXCEPTION 'Room validation failed: %', v_validation.error_message;
    END IF;
    
    -- Warning for significant overlaps (but don't block)
    IF v_validation.max_overlap_percentage > 10 THEN
        RAISE NOTICE 'Warning: Room has % overlap with % existing room(s)', 
                     v_validation.max_overlap_percentage || '%', 
                     v_validation.overlapping_rooms;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_room_overlap_trigger IS 'Validates room coordinates and checks for excessive overlap';

-- =====================================================
-- FUNCTION: generate_room_slug
-- Auto-generates unique room identifiers
-- =====================================================
CREATE OR REPLACE FUNCTION generate_room_slug()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
DECLARE
    v_floor_number INTEGER;
    v_hotel_slug VARCHAR(255);
BEGIN
    -- Only generate if room_number is not provided
    IF NEW.room_number IS NULL OR NEW.room_number = '' THEN
        -- Get floor and hotel information
        SELECT f.floor_number, h.slug 
        INTO v_floor_number, v_hotel_slug
        FROM floors f
        JOIN hotels h ON f.hotel_id = h.id
        WHERE f.id = NEW.floor_id;
        
        -- Generate room number based on floor and sequence
        NEW.room_number := v_floor_number || LPAD(
            COALESCE(
                (SELECT COUNT(*) + 1 FROM rooms WHERE floor_id = NEW.floor_id)::TEXT,
                '1'
            ), 
            2, 
            '0'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION generate_room_slug IS 'Auto-generates room numbers if not provided';

-- =====================================================
-- CREATE TRIGGERS ON TABLES
-- =====================================================

-- Updated_at triggers for all tables with timestamp
CREATE TRIGGER hotels_updated_at 
    BEFORE UPDATE ON hotels
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER floors_updated_at 
    BEFORE UPDATE ON floors
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER rooms_updated_at 
    BEFORE UPDATE ON rooms
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Counter maintenance triggers
CREATE TRIGGER floors_counter_trigger
    AFTER INSERT OR DELETE OR UPDATE ON floors
    FOR EACH ROW 
    EXECUTE FUNCTION update_counters();

CREATE TRIGGER rooms_counter_trigger
    AFTER INSERT OR DELETE OR UPDATE ON rooms
    FOR EACH ROW 
    EXECUTE FUNCTION update_counters();

-- Coordinate history tracking
CREATE TRIGGER coordinate_history_trigger
    AFTER UPDATE ON rooms
    FOR EACH ROW 
    WHEN (OLD.x_coordinate IS DISTINCT FROM NEW.x_coordinate OR 
          OLD.y_coordinate IS DISTINCT FROM NEW.y_coordinate OR 
          OLD.width IS DISTINCT FROM NEW.width OR 
          OLD.height IS DISTINCT FROM NEW.height)
    EXECUTE FUNCTION track_coordinate_changes();

-- Room validation trigger
CREATE TRIGGER room_validation_trigger
    BEFORE INSERT OR UPDATE ON rooms
    FOR EACH ROW
    WHEN (NEW.x_coordinate IS NOT NULL AND 
          NEW.y_coordinate IS NOT NULL AND 
          NEW.width IS NOT NULL AND 
          NEW.height IS NOT NULL)
    EXECUTE FUNCTION validate_room_overlap_trigger();

-- Auto-generate room numbers (optional, disabled by default)
-- CREATE TRIGGER room_number_generation_trigger
--     BEFORE INSERT ON rooms
--     FOR EACH ROW
--     WHEN (NEW.room_number IS NULL OR NEW.room_number = '')
--     EXECUTE FUNCTION generate_room_slug();

-- =====================================================
-- TRIGGER MANAGEMENT COMMENTS
-- =====================================================

COMMENT ON TRIGGER hotels_updated_at ON hotels IS 'Auto-updates updated_at timestamp';
COMMENT ON TRIGGER floors_updated_at ON floors IS 'Auto-updates updated_at timestamp';
COMMENT ON TRIGGER rooms_updated_at ON rooms IS 'Auto-updates updated_at timestamp';
COMMENT ON TRIGGER floors_counter_trigger ON floors IS 'Maintains total_floors counter in hotels table';
COMMENT ON TRIGGER rooms_counter_trigger ON rooms IS 'Maintains total_rooms counters in floors and hotels tables';
COMMENT ON TRIGGER coordinate_history_trigger ON rooms IS 'Tracks coordinate changes for audit trail';
COMMENT ON TRIGGER room_validation_trigger ON rooms IS 'Validates room coordinates and checks for overlap';