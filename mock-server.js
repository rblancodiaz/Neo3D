const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalname = file.originalname.replace(/\s+/g, '-');
    cb(null, `${timestamp}-${originalname}`);
  },
});

const upload = multer({ storage });

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Mock data
let hotelIdCounter = 1;
let floorIdCounter = 1;
let roomIdCounter = 1;
const hotels = [];

// API Routes
app.get('/api/hotels', (req, res) => {
  console.log('GET /api/hotels - returning hotels:', hotels.length);
  res.json({
    success: true,
    data: {
      items: hotels,
      total: hotels.length,
      page: 1,
      pageSize: 10,
      totalPages: 1
    }
  });
});

app.get('/api/hotels/:id', (req, res) => {
  const hotel = hotels.find(h => h.id === req.params.id);
  if (!hotel) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Hotel not found' }
    });
  }
  
  console.log('GET /api/hotels/:id - returning hotel:', hotel.id);
  res.json({
    success: true,
    data: { hotel }
  });
});

app.post('/api/hotels', upload.single('image'), (req, res) => {
  console.log('POST /api/hotels - Creating new hotel');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  
  try {
    const { name, description } = req.body;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Image file is required' }
      });
    }
    
    // Create mock hotel
    const hotel = {
      id: `hotel-${hotelIdCounter++}`,
      name: name || 'Unnamed Hotel',
      slug: `hotel-${Date.now()}`,
      description: description || '',
      originalImageUrl: `/uploads/${file.filename}`,
      processedImageUrl: `/uploads/${file.filename}`, // In real app, this would be processed
      thumbnailUrl: `/uploads/${file.filename}`, // In real app, this would be a thumbnail
      imageWidth: 1920,
      imageHeight: 1080,
      floors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    hotels.push(hotel);
    
    console.log('Created hotel:', hotel);
    res.status(201).json({
      success: true,
      data: { hotel }
    });
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create hotel' }
    });
  }
});

app.post('/api/hotels/:hotelId/floors', (req, res) => {
  console.log('POST /api/hotels/:hotelId/floors - Creating floor');
  console.log('HotelId:', req.params.hotelId);
  console.log('Body:', req.body);
  
  const hotel = hotels.find(h => h.id === req.params.hotelId);
  if (!hotel) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Hotel not found' }
    });
  }
  
  const { floorNumber, name } = req.body;
  
  const floor = {
    id: `floor-${floorIdCounter++}`,
    hotelId: req.params.hotelId,
    floorNumber: floorNumber || 1,
    name: name || 'Ground Floor',
    displayOrder: floorNumber || 1,
    status: 'active',
    totalRooms: 0,
    rooms: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  hotel.floors.push(floor);
  
  console.log('Created floor:', floor);
  res.status(201).json({
    success: true,
    data: { floor }
  });
});

app.get('/api/floors/:floorId/rooms', (req, res) => {
  console.log('GET /api/floors/:floorId/rooms');
  
  // Find the hotel that contains this floor
  const hotel = hotels.find(h => h.floors.some(f => f.id === req.params.floorId));
  if (!hotel) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Floor not found' }
    });
  }
  
  const floor = hotel.floors.find(f => f.id === req.params.floorId);
  const rooms = floor.rooms || [];
  
  console.log('Returning rooms:', rooms.length);
  res.json({
    success: true,
    data: { rooms }
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Mock server error:', error);
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
  });
});

app.listen(port, () => {
  console.log(`🚀 Mock server running on http://localhost:${port}`);
  console.log('✅ Ready to test hotel creation flow');
});