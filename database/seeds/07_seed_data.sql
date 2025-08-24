-- =====================================================
-- Hotel Room Mapper - Sample Seed Data
-- PostgreSQL 15+
-- =====================================================
-- Test data for development and testing
-- =====================================================

\c hotel_mapper;

-- Clear existing data (BE CAREFUL IN PRODUCTION!)
TRUNCATE TABLE room_coordinate_history CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE floors CASCADE;
TRUNCATE TABLE hotels CASCADE;

-- =====================================================
-- SAMPLE HOTEL 1: Grand Plaza Hotel
-- =====================================================
INSERT INTO hotels (
    id, 
    name, 
    slug, 
    description,
    original_image_url, 
    processed_image_url, 
    thumbnail_url,
    image_width, 
    image_height,
    status
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Grand Plaza Hotel',
    'grand-plaza-hotel',
    'Luxury 5-star hotel in the heart of downtown with panoramic city views',
    '/uploads/hotels/grand-plaza/original.jpg',
    '/uploads/hotels/grand-plaza/processed.jpg',
    '/uploads/hotels/grand-plaza/thumbnail.jpg',
    2400,
    1600,
    'active'
);

-- Floors for Grand Plaza Hotel
INSERT INTO floors (id, hotel_id, floor_number, name, display_order, floor_area_sqm, status) VALUES
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 0, 'Lobby', 0, 500.00, 'active'),
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'First Floor', 1, 450.00, 'active'),
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Second Floor', 2, 450.00, 'active'),
    ('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 3, 'Third Floor', 3, 450.00, 'active'),
    ('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 10, 'Penthouse', 4, 600.00, 'active');

-- Rooms for First Floor (Grid layout example)
INSERT INTO rooms (
    floor_id, room_number, room_type, bed_type, capacity, status,
    x_coordinate, y_coordinate, width, height,
    base_price, currency, metadata
) VALUES
    -- Left side rooms
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '101', 'standard', 'double', 2, 'available',
     0.0500000000, 0.1000000000, 0.1500000000, 0.2000000000, 
     150.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar"]}'),
    
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '102', 'standard', 'twin', 2, 'occupied',
     0.0500000000, 0.3500000000, 0.1500000000, 0.2000000000,
     150.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar"]}'),
    
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '103', 'deluxe', 'king', 2, 'available',
     0.0500000000, 0.6000000000, 0.1500000000, 0.2500000000,
     250.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar", "jacuzzi"]}'),
    
    -- Center corridor
    -- (No rooms - represents hallway)
    
    -- Right side rooms
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '104', 'standard', 'double', 2, 'available',
     0.7500000000, 0.1000000000, 0.1500000000, 0.2000000000,
     150.00, 'USD', '{"view": "city", "amenities": ["wifi", "minibar"]}'),
    
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '105', 'standard', 'queen', 2, 'cleaning',
     0.7500000000, 0.3500000000, 0.1500000000, 0.2000000000,
     175.00, 'USD', '{"view": "city", "amenities": ["wifi", "minibar"]}'),
    
    ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '106', 'suite', 'king', 4, 'available',
     0.7500000000, 0.6000000000, 0.2000000000, 0.2500000000,
     450.00, 'USD', '{"view": "city", "amenities": ["wifi", "minibar", "living_room", "kitchenette"]}');

-- Rooms for Second Floor (Different layout)
INSERT INTO rooms (
    floor_id, room_number, room_type, bed_type, capacity, status,
    x_coordinate, y_coordinate, width, height,
    base_price, currency, metadata
) VALUES
    -- Large suites on corners
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '201', 'suite', 'king', 4, 'available',
     0.0500000000, 0.0500000000, 0.2500000000, 0.3000000000,
     500.00, 'USD', '{"view": "panoramic", "amenities": ["wifi", "minibar", "living_room", "balcony"]}'),
    
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '202', 'suite', 'king', 4, 'occupied',
     0.7000000000, 0.0500000000, 0.2500000000, 0.3000000000,
     500.00, 'USD', '{"view": "panoramic", "amenities": ["wifi", "minibar", "living_room", "balcony"]}'),
    
    -- Standard rooms in middle
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '203', 'standard', 'double', 2, 'available',
     0.3500000000, 0.1000000000, 0.1200000000, 0.1800000000,
     175.00, 'USD', '{"view": "courtyard", "amenities": ["wifi", "minibar"]}'),
    
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '204', 'standard', 'double', 2, 'maintenance',
     0.5000000000, 0.1000000000, 0.1200000000, 0.1800000000,
     175.00, 'USD', '{"view": "courtyard", "amenities": ["wifi", "minibar"]}'),
    
    -- Bottom row
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '205', 'deluxe', 'queen', 3, 'available',
     0.0500000000, 0.6500000000, 0.2000000000, 0.2500000000,
     300.00, 'USD', '{"view": "pool", "amenities": ["wifi", "minibar", "balcony"]}'),
    
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '206', 'accessible', 'double', 2, 'available',
     0.4000000000, 0.6500000000, 0.1800000000, 0.2500000000,
     200.00, 'USD', '{"view": "pool", "amenities": ["wifi", "minibar", "wheelchair_accessible"]}'),
    
    ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '207', 'deluxe', 'king', 2, 'available',
     0.7500000000, 0.6500000000, 0.2000000000, 0.2500000000,
     300.00, 'USD', '{"view": "pool", "amenities": ["wifi", "minibar", "balcony"]}');

-- Penthouse Floor (Large luxury suites)
INSERT INTO rooms (
    floor_id, room_number, room_type, bed_type, capacity, status,
    x_coordinate, y_coordinate, width, height,
    base_price, currency, metadata
) VALUES
    ('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PH-1', 'presidential', 'king', 6, 'available',
     0.0500000000, 0.1000000000, 0.4000000000, 0.8000000000,
     2500.00, 'USD', '{"view": "360_panoramic", "amenities": ["wifi", "full_kitchen", "jacuzzi", "private_elevator", "butler_service"]}'),
    
    ('b4eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'PH-2', 'presidential', 'king', 6, 'occupied',
     0.5500000000, 0.1000000000, 0.4000000000, 0.8000000000,
     2500.00, 'USD', '{"view": "360_panoramic", "amenities": ["wifi", "full_kitchen", "jacuzzi", "private_elevator", "butler_service"]}');

-- =====================================================
-- SAMPLE HOTEL 2: Seaside Resort
-- =====================================================
INSERT INTO hotels (
    id,
    name,
    slug,
    description,
    original_image_url,
    processed_image_url,
    thumbnail_url,
    image_width,
    image_height,
    status
) VALUES (
    'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Seaside Resort',
    'seaside-resort',
    'Beachfront resort with tropical gardens and ocean views',
    '/uploads/hotels/seaside-resort/original.jpg',
    '/uploads/hotels/seaside-resort/processed.jpg',
    '/uploads/hotels/seaside-resort/thumbnail.jpg',
    3000,
    2000,
    'active'
);

-- Floors for Seaside Resort
INSERT INTO floors (id, hotel_id, floor_number, name, display_order, floor_area_sqm, status) VALUES
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Garden Level', 1, 800.00, 'active'),
    ('b6eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 2, 'Ocean View Level', 2, 800.00, 'active');

-- Garden Level Rooms (Bungalow style layout)
INSERT INTO rooms (
    floor_id, room_number, room_type, bed_type, capacity, status,
    x_coordinate, y_coordinate, width, height,
    base_price, currency, metadata
) VALUES
    -- Bungalows scattered across the garden
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G01', 'deluxe', 'king', 2, 'available',
     0.1000000000, 0.1500000000, 0.1500000000, 0.1500000000,
     350.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar", "private_patio"]}'),
    
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G02', 'deluxe', 'king', 2, 'available',
     0.3000000000, 0.2000000000, 0.1500000000, 0.1500000000,
     350.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar", "private_patio"]}'),
    
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G03', 'suite', 'king', 4, 'occupied',
     0.5500000000, 0.1000000000, 0.2000000000, 0.2000000000,
     550.00, 'USD', '{"view": "partial_ocean", "amenities": ["wifi", "minibar", "private_patio", "outdoor_shower"]}'),
    
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G04', 'deluxe', 'queen', 2, 'available',
     0.8000000000, 0.2500000000, 0.1500000000, 0.1500000000,
     350.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar", "private_patio"]}'),
    
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G05', 'suite', 'king', 4, 'available',
     0.2000000000, 0.5000000000, 0.2000000000, 0.2000000000,
     550.00, 'USD', '{"view": "pool", "amenities": ["wifi", "minibar", "private_patio", "plunge_pool"]}'),
    
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G06', 'deluxe', 'double', 3, 'cleaning',
     0.5000000000, 0.4500000000, 0.1500000000, 0.1500000000,
     375.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar", "private_patio"]}'),
    
    ('b5eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'G07', 'accessible', 'double', 2, 'available',
     0.7500000000, 0.5500000000, 0.1800000000, 0.1800000000,
     325.00, 'USD', '{"view": "garden", "amenities": ["wifi", "minibar", "wheelchair_accessible", "roll_in_shower"]}');

-- =====================================================
-- SAMPLE HOTEL 3: Budget Inn (Inactive/Draft)
-- =====================================================
INSERT INTO hotels (
    id,
    name,
    slug,
    description,
    original_image_url,
    processed_image_url,
    thumbnail_url,
    image_width,
    image_height,
    status
) VALUES (
    'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Budget Inn',
    'budget-inn',
    'Affordable accommodation for budget travelers',
    '/uploads/hotels/budget-inn/original.jpg',
    '/uploads/hotels/budget-inn/processed.jpg',
    '/uploads/hotels/budget-inn/thumbnail.jpg',
    1920,
    1080,
    'draft'
);

-- Single floor for Budget Inn
INSERT INTO floors (id, hotel_id, floor_number, name, display_order, status) VALUES
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 1, 'Main Floor', 1, 'active');

-- Simple grid layout for Budget Inn
INSERT INTO rooms (
    floor_id, room_number, room_type, bed_type, capacity, status,
    x_coordinate, y_coordinate, width, height,
    base_price, currency
) VALUES
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B01', 'standard', 'single', 1, 'available',
     0.1000000000, 0.2000000000, 0.1000000000, 0.1500000000, 50.00, 'USD'),
    
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B02', 'standard', 'single', 1, 'available',
     0.2500000000, 0.2000000000, 0.1000000000, 0.1500000000, 50.00, 'USD'),
    
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B03', 'standard', 'double', 2, 'available',
     0.4000000000, 0.2000000000, 0.1200000000, 0.1500000000, 75.00, 'USD'),
    
    ('b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'B04', 'standard', 'double', 2, 'available',
     0.5500000000, 0.2000000000, 0.1200000000, 0.1500000000, 75.00, 'USD');

-- =====================================================
-- Sample coordinate history (room movements)
-- =====================================================
INSERT INTO room_coordinate_history (
    room_id,
    old_x_coordinate, old_y_coordinate, old_width, old_height,
    new_x_coordinate, new_y_coordinate, new_width, new_height,
    change_reason
)
SELECT 
    id,
    x_coordinate - 0.0100000000,
    y_coordinate - 0.0100000000,
    width,
    height,
    x_coordinate,
    y_coordinate,
    width,
    height,
    'Initial positioning adjustment'
FROM rooms
WHERE room_number IN ('101', '201', 'G01')
LIMIT 3;

-- =====================================================
-- Verify data integrity
-- =====================================================

-- Check counters
SELECT 
    h.name as hotel,
    h.total_floors as counter_floors,
    COUNT(DISTINCT f.id) as actual_floors,
    h.total_rooms as counter_rooms,
    COUNT(DISTINCT r.id) as actual_rooms
FROM hotels h
LEFT JOIN floors f ON h.id = f.hotel_id
LEFT JOIN rooms r ON f.id = r.floor_id
GROUP BY h.id, h.name, h.total_floors, h.total_rooms
ORDER BY h.name;

-- Check room distribution
SELECT 
    h.name as hotel,
    f.name as floor,
    COUNT(r.id) as room_count,
    STRING_AGG(r.room_number, ', ' ORDER BY r.room_number) as rooms
FROM hotels h
JOIN floors f ON h.id = f.hotel_id
LEFT JOIN rooms r ON f.id = r.floor_id
GROUP BY h.id, h.name, f.id, f.name, f.floor_number
ORDER BY h.name, f.floor_number;

-- Check for overlaps
SELECT * FROM overlap_analysis;

-- =====================================================
-- Success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Seed data loaded successfully!';
    RAISE NOTICE 'Hotels created: 3 (2 active, 1 draft)';
    RAISE NOTICE 'Floors created: 9';
    RAISE NOTICE 'Rooms created: 25+';
    RAISE NOTICE 'Sample coordinate history entries created';
END $$;