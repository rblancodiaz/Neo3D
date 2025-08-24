-- Hotel Room Mapper - Demo Data Script
-- This script creates sample data for demonstration and testing

-- Connect to the hotel_mapper database
\c hotel_mapper;

-- Clear existing demo data (optional - uncomment if needed)
-- DELETE FROM room_coordinate_history WHERE room_id IN (SELECT id FROM rooms WHERE floor_id IN (SELECT id FROM floors WHERE hotel_id IN (SELECT id FROM hotels WHERE name LIKE 'Demo %')));
-- DELETE FROM rooms WHERE floor_id IN (SELECT id FROM floors WHERE hotel_id IN (SELECT id FROM hotels WHERE name LIKE 'Demo %'));
-- DELETE FROM floors WHERE hotel_id IN (SELECT id FROM hotels WHERE name LIKE 'Demo %');
-- DELETE FROM hotels WHERE name LIKE 'Demo %';

-- Insert demo hotels
INSERT INTO hotels (id, name, address, city, country, description, total_floors, total_rooms, image_url, thumbnail_url, image_width, image_height, created_at, updated_at)
VALUES 
(
    gen_random_uuid(),
    'Demo Grand Plaza Hotel',
    '123 Main Street',
    'New York',
    'USA',
    'Luxury 5-star hotel in the heart of Manhattan with stunning city views',
    12,
    250,
    '/uploads/hotels/grand-plaza-aerial.jpg',
    '/uploads/hotels/thumbs/grand-plaza-aerial.jpg',
    2048,
    1536,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Demo Beachside Resort',
    '456 Ocean Boulevard',
    'Miami',
    'USA',
    'Tropical paradise resort with direct beach access and water sports',
    5,
    120,
    '/uploads/hotels/beachside-aerial.jpg',
    '/uploads/hotels/thumbs/beachside-aerial.jpg',
    1920,
    1080,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Demo Mountain Lodge',
    '789 Alpine Road',
    'Aspen',
    'USA',
    'Cozy mountain retreat perfect for skiing and outdoor adventures',
    3,
    45,
    '/uploads/hotels/mountain-lodge-aerial.jpg',
    '/uploads/hotels/thumbs/mountain-lodge-aerial.jpg',
    1600,
    1200,
    NOW(),
    NOW()
);

-- Get hotel IDs for foreign key references
DO $$
DECLARE
    grand_plaza_id UUID;
    beachside_id UUID;
    mountain_id UUID;
    floor_id UUID;
BEGIN
    -- Get hotel IDs
    SELECT id INTO grand_plaza_id FROM hotels WHERE name = 'Demo Grand Plaza Hotel';
    SELECT id INTO beachside_id FROM hotels WHERE name = 'Demo Beachside Resort';
    SELECT id INTO mountain_id FROM hotels WHERE name = 'Demo Mountain Lodge';

    -- Insert floors for Grand Plaza Hotel
    INSERT INTO floors (id, hotel_id, floor_number, floor_name, total_rooms, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), grand_plaza_id, 1, 'Lobby & Reception', 0, NOW(), NOW()),
    (gen_random_uuid(), grand_plaza_id, 2, 'Conference Rooms', 8, NOW(), NOW()),
    (gen_random_uuid(), grand_plaza_id, 3, 'Standard Rooms', 30, NOW(), NOW()),
    (gen_random_uuid(), grand_plaza_id, 4, 'Standard Rooms', 30, NOW(), NOW()),
    (gen_random_uuid(), grand_plaza_id, 5, 'Deluxe Rooms', 25, NOW(), NOW());

    -- Get a floor ID for room insertion
    SELECT id INTO floor_id FROM floors WHERE hotel_id = grand_plaza_id AND floor_number = 3;

    -- Insert sample rooms for floor 3 of Grand Plaza
    INSERT INTO rooms (id, floor_id, room_number, room_type, status, max_occupancy, coordinates, metadata, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(),
        floor_id,
        '301',
        'standard',
        'available',
        2,
        ROW(0.1000, 0.1000, 0.2000, 0.2500)::box,
        '{"bedType": "queen", "view": "city", "amenities": ["wifi", "minibar", "safe"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '302',
        'standard',
        'occupied',
        2,
        ROW(0.2100, 0.1000, 0.3100, 0.2500)::box,
        '{"bedType": "twin", "view": "courtyard", "amenities": ["wifi", "minibar"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '303',
        'standard',
        'available',
        2,
        ROW(0.3200, 0.1000, 0.4200, 0.2500)::box,
        '{"bedType": "queen", "view": "city", "amenities": ["wifi", "minibar", "safe", "bathtub"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '304',
        'deluxe',
        'available',
        3,
        ROW(0.4300, 0.1000, 0.5800, 0.2500)::box,
        '{"bedType": "king", "view": "city", "amenities": ["wifi", "minibar", "safe", "bathtub", "balcony"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '305',
        'standard',
        'maintenance',
        2,
        ROW(0.5900, 0.1000, 0.6900, 0.2500)::box,
        '{"bedType": "queen", "view": "courtyard", "amenities": ["wifi", "minibar"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '306',
        'standard',
        'available',
        2,
        ROW(0.7000, 0.1000, 0.8000, 0.2500)::box,
        '{"bedType": "twin", "view": "city", "amenities": ["wifi", "minibar", "safe"]}',
        NOW(),
        NOW()
    ),
    -- Second row of rooms
    (
        gen_random_uuid(),
        floor_id,
        '307',
        'standard',
        'available',
        2,
        ROW(0.1000, 0.3500, 0.2000, 0.5000)::box,
        '{"bedType": "queen", "view": "pool", "amenities": ["wifi", "minibar", "safe"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '308',
        'standard',
        'occupied',
        2,
        ROW(0.2100, 0.3500, 0.3100, 0.5000)::box,
        '{"bedType": "queen", "view": "pool", "amenities": ["wifi", "minibar"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '309',
        'suite',
        'available',
        4,
        ROW(0.3200, 0.3500, 0.4700, 0.5000)::box,
        '{"bedType": "king", "view": "pool", "amenities": ["wifi", "minibar", "safe", "jacuzzi", "kitchenette"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '310',
        'suite',
        'available',
        4,
        ROW(0.4800, 0.3500, 0.6300, 0.5000)::box,
        '{"bedType": "king", "view": "pool", "amenities": ["wifi", "minibar", "safe", "jacuzzi", "kitchenette", "balcony"]}',
        NOW(),
        NOW()
    );

    -- Insert floors for Beachside Resort
    INSERT INTO floors (id, hotel_id, floor_number, floor_name, total_rooms, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), beachside_id, 1, 'Garden View', 25, NOW(), NOW()),
    (gen_random_uuid(), beachside_id, 2, 'Ocean View', 25, NOW(), NOW()),
    (gen_random_uuid(), beachside_id, 3, 'Premium Ocean View', 20, NOW(), NOW());

    -- Get a floor ID for Beachside Resort
    SELECT id INTO floor_id FROM floors WHERE hotel_id = beachside_id AND floor_number = 2;

    -- Insert sample rooms for Beachside Resort
    INSERT INTO rooms (id, floor_id, room_number, room_type, status, max_occupancy, coordinates, metadata, created_at, updated_at)
    VALUES 
    (
        gen_random_uuid(),
        floor_id,
        '201',
        'deluxe',
        'available',
        3,
        ROW(0.0500, 0.2000, 0.1500, 0.3500)::box,
        '{"bedType": "king", "view": "ocean", "amenities": ["wifi", "minibar", "safe", "balcony", "beach-access"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '202',
        'deluxe',
        'available',
        3,
        ROW(0.1600, 0.2000, 0.2600, 0.3500)::box,
        '{"bedType": "king", "view": "ocean", "amenities": ["wifi", "minibar", "safe", "balcony"]}',
        NOW(),
        NOW()
    ),
    (
        gen_random_uuid(),
        floor_id,
        '203',
        'standard',
        'occupied',
        2,
        ROW(0.2700, 0.2000, 0.3700, 0.3500)::box,
        '{"bedType": "queen", "view": "partial-ocean", "amenities": ["wifi", "minibar"]}',
        NOW(),
        NOW()
    );

    -- Insert floors for Mountain Lodge
    INSERT INTO floors (id, hotel_id, floor_number, floor_name, total_rooms, created_at, updated_at)
    VALUES 
    (gen_random_uuid(), mountain_id, 1, 'Lodge Rooms', 20, NOW(), NOW()),
    (gen_random_uuid(), mountain_id, 2, 'Cabin Suites', 15, NOW(), NOW());

END $$;

-- Create some coordinate history entries for demonstration
INSERT INTO room_coordinate_history (id, room_id, old_coordinates, new_coordinates, changed_by, change_reason, created_at)
SELECT 
    gen_random_uuid(),
    r.id,
    ROW(0.0900, 0.0900, 0.1900, 0.2400)::box,
    r.coordinates,
    'system',
    'Initial positioning adjustment',
    NOW() - INTERVAL '2 days'
FROM rooms r
WHERE r.room_number = '301'
LIMIT 1;

-- Add statistics view data by updating counts
UPDATE hotels SET 
    total_rooms = (SELECT COUNT(*) FROM rooms r JOIN floors f ON r.floor_id = f.id WHERE f.hotel_id = hotels.id)
WHERE name LIKE 'Demo %';

-- Display summary of created data
SELECT 'Demo Data Creation Summary' as message;
SELECT '===========================' as separator;
SELECT COUNT(*) as total_hotels, 'Hotels created' as description FROM hotels WHERE name LIKE 'Demo %';
SELECT COUNT(*) as total_floors, 'Floors created' as description FROM floors WHERE hotel_id IN (SELECT id FROM hotels WHERE name LIKE 'Demo %');
SELECT COUNT(*) as total_rooms, 'Rooms created' as description FROM rooms WHERE floor_id IN (SELECT id FROM floors WHERE hotel_id IN (SELECT id FROM hotels WHERE name LIKE 'Demo %'));

-- Display sample room coordinates for verification
SELECT 
    h.name as hotel_name,
    f.floor_name,
    r.room_number,
    r.room_type,
    r.status,
    r.coordinates::text as coordinates
FROM rooms r
JOIN floors f ON r.floor_id = f.id
JOIN hotels h ON f.hotel_id = h.id
WHERE h.name LIKE 'Demo %'
ORDER BY h.name, f.floor_number, r.room_number
LIMIT 10;

COMMIT;