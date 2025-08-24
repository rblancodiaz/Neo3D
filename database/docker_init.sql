-- =====================================================
-- Hotel Room Mapper - Docker Database Initialization
-- PostgreSQL 15+
-- =====================================================
-- This script runs automatically when Docker container starts
-- =====================================================

-- Switch to postgres database to create our database
\c postgres;

-- Drop existing database if needed
DROP DATABASE IF EXISTS hotel_mapper;

-- Drop existing roles if needed
DROP ROLE IF EXISTS hotel_app;
DROP ROLE IF EXISTS hotel_backup;

-- Create application user
CREATE ROLE hotel_app WITH LOGIN PASSWORD 'SecurePassword2024';

-- Create backup user
CREATE ROLE hotel_backup WITH LOGIN PASSWORD 'BackupPassword2024';

-- Create database
CREATE DATABASE hotel_mapper
    WITH 
    OWNER = hotel_app
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE hotel_mapper TO hotel_app;
GRANT CONNECT ON DATABASE hotel_mapper TO hotel_backup;

-- Connect to the new database
\c hotel_mapper;

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO hotel_app;
GRANT USAGE ON SCHEMA public TO hotel_backup;

-- Create tables
\echo 'Creating tables...'

-- Hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    total_floors INTEGER DEFAULT 1,
    image_url TEXT,
    thumbnail_url TEXT,
    image_width INTEGER,
    image_height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Floors table
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name VARCHAR(100),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(hotel_id, floor_number)
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    room_type VARCHAR(50),
    status VARCHAR(30) DEFAULT 'available',
    x_start DECIMAL(10, 6) NOT NULL CHECK (x_start >= 0 AND x_start <= 1),
    y_start DECIMAL(10, 6) NOT NULL CHECK (y_start >= 0 AND y_start <= 1),
    x_end DECIMAL(10, 6) NOT NULL CHECK (x_end >= 0 AND x_end <= 1),
    y_end DECIMAL(10, 6) NOT NULL CHECK (y_end >= 0 AND y_end <= 1),
    price_per_night DECIMAL(10, 2),
    max_occupancy INTEGER DEFAULT 2,
    amenities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_coordinates CHECK (x_end > x_start AND y_end > y_start),
    UNIQUE(hotel_id, room_number)
);

-- Room coordinate history table
CREATE TABLE IF NOT EXISTS room_coordinate_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    x_start DECIMAL(10, 6) NOT NULL,
    y_start DECIMAL(10, 6) NOT NULL,
    x_end DECIMAL(10, 6) NOT NULL,
    y_end DECIMAL(10, 6) NOT NULL,
    changed_by VARCHAR(255),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT
);

-- Create indexes
\echo 'Creating indexes...'

CREATE INDEX idx_hotels_name ON hotels(name);
CREATE INDEX idx_floors_hotel_id ON floors(hotel_id);
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);
CREATE INDEX idx_rooms_floor_id ON rooms(floor_id);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_coordinates ON rooms(x_start, y_start, x_end, y_end);
CREATE INDEX idx_room_history_room_id ON room_coordinate_history(room_id);
CREATE INDEX idx_room_history_changed_at ON room_coordinate_history(changed_at DESC);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
\echo 'Creating triggers...'

CREATE TRIGGER update_hotels_updated_at BEFORE UPDATE ON hotels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_floors_updated_at BEFORE UPDATE ON floors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create coordinate history trigger
CREATE OR REPLACE FUNCTION log_room_coordinate_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.x_start IS DISTINCT FROM NEW.x_start OR
        OLD.y_start IS DISTINCT FROM NEW.y_start OR
        OLD.x_end IS DISTINCT FROM NEW.x_end OR
        OLD.y_end IS DISTINCT FROM NEW.y_end) THEN
        
        INSERT INTO room_coordinate_history (
            room_id, x_start, y_start, x_end, y_end, changed_by, change_reason
        ) VALUES (
            NEW.id, OLD.x_start, OLD.y_start, OLD.x_end, OLD.y_end, 
            COALESCE(current_setting('app.current_user', true), 'system'),
            COALESCE(current_setting('app.change_reason', true), 'Manual update')
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_room_coordinates AFTER UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION log_room_coordinate_changes();

-- Create helper functions
\echo 'Creating helper functions...'

-- Function to check room overlap
CREATE OR REPLACE FUNCTION check_room_overlap(
    p_hotel_id UUID,
    p_floor_id UUID,
    p_x_start DECIMAL,
    p_y_start DECIMAL,
    p_x_end DECIMAL,
    p_y_end DECIMAL,
    p_exclude_room_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    overlap_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM rooms
        WHERE hotel_id = p_hotel_id
          AND floor_id = p_floor_id
          AND id != COALESCE(p_exclude_room_id, '00000000-0000-0000-0000-000000000000'::UUID)
          AND NOT (
              p_x_end <= x_start OR
              p_x_start >= x_end OR
              p_y_end <= y_start OR
              p_y_start >= y_end
          )
    ) INTO overlap_exists;
    
    RETURN overlap_exists;
END;
$$ LANGUAGE plpgsql;

-- Function to get room at coordinates
CREATE OR REPLACE FUNCTION get_room_at_coordinates(
    p_hotel_id UUID,
    p_floor_id UUID,
    p_x DECIMAL,
    p_y DECIMAL
)
RETURNS TABLE (
    room_id UUID,
    room_number VARCHAR,
    room_type VARCHAR,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.room_number,
        r.room_type,
        r.status
    FROM rooms r
    WHERE r.hotel_id = p_hotel_id
      AND r.floor_id = p_floor_id
      AND p_x >= r.x_start
      AND p_x <= r.x_end
      AND p_y >= r.y_start
      AND p_y <= r.y_end
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Create views
\echo 'Creating views...'

-- Hotel summary view
CREATE OR REPLACE VIEW hotel_summary AS
SELECT 
    h.id,
    h.name,
    h.city,
    h.country,
    h.total_floors,
    COUNT(DISTINCT f.id) as actual_floors,
    COUNT(DISTINCT r.id) as total_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    AVG(r.price_per_night) as avg_price_per_night,
    h.created_at,
    h.updated_at
FROM hotels h
LEFT JOIN floors f ON h.id = f.hotel_id
LEFT JOIN rooms r ON h.id = r.hotel_id
GROUP BY h.id;

-- Floor occupancy view
CREATE OR REPLACE VIEW floor_occupancy AS
SELECT 
    f.id as floor_id,
    f.hotel_id,
    f.floor_number,
    f.name as floor_name,
    COUNT(r.id) as total_rooms,
    COUNT(r.id) FILTER (WHERE r.status = 'available') as available_rooms,
    COUNT(r.id) FILTER (WHERE r.status = 'occupied') as occupied_rooms,
    CASE 
        WHEN COUNT(r.id) > 0 
        THEN ROUND(COUNT(r.id) FILTER (WHERE r.status = 'occupied')::DECIMAL / COUNT(r.id) * 100, 2)
        ELSE 0
    END as occupancy_rate
FROM floors f
LEFT JOIN rooms r ON f.id = r.floor_id
GROUP BY f.id;

-- Grant permissions
\echo 'Setting up permissions...'

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hotel_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hotel_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hotel_app;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO hotel_backup;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO hotel_backup;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON TABLES TO hotel_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT ALL ON SEQUENCES TO hotel_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT EXECUTE ON FUNCTIONS TO hotel_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT ON TABLES TO hotel_backup;

-- Insert sample data
\echo 'Inserting sample data...'

-- Insert sample hotel
INSERT INTO hotels (id, name, address, city, country, total_floors, image_url)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
    'Grand Plaza Hotel',
    '123 Main Street',
    'New York',
    'USA',
    5,
    '/images/grand-plaza-aerial.jpg'
);

-- Insert sample floors
INSERT INTO floors (hotel_id, floor_number, name)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 1, 'Ground Floor'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 2, 'Second Floor'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID, 3, 'Third Floor');

-- Insert sample rooms
INSERT INTO rooms (hotel_id, floor_id, room_number, room_type, status, x_start, y_start, x_end, y_end, price_per_night, max_occupancy)
SELECT 
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
    f.id,
    '10' || f.floor_number,
    'Standard',
    'available',
    0.1, 0.1, 0.25, 0.3,
    150.00,
    2
FROM floors f
WHERE f.hotel_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID
  AND f.floor_number = 1;

-- Final message
\echo ''
\echo '============================================='
\echo 'Database initialization complete!'
\echo '============================================='
\echo 'Database: hotel_mapper'
\echo 'User: hotel_app'
\echo 'Password: SecurePassword2024'
\echo 'Connection: postgresql://hotel_app:SecurePassword2024@localhost:5432/hotel_mapper'
\echo '============================================='