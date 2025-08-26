import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config, paths } from './config/environment';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
// import { generalLimiter } from './middleware/rateLimiter';
import { stream } from './utils/logger';
import hotelRoutes from './routes/hotels';
import floorRoutes from './routes/floors';
import roomRoutes from './routes/rooms';
import uploadRoutes from './routes/uploads';

// Create Express app
const app: Application = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images to be loaded from different origins
}));

// CORS configuration - Allow multiple origins for development
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting - TEMPORARILY DISABLED FOR TESTING
// app.use(generalLimiter);

// Request logging (only in development)
if (config.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('combined', { stream }));
}

// Static files for uploaded images
app.use('/uploads', express.static(paths.uploads));
app.use('/uploads/processed', express.static(paths.processed));
app.use('/uploads/thumbnails', express.static(paths.thumbnails));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
    version: config.APP_VERSION,
  });
});

// API routes
const apiPrefix = config.API_PREFIX || '/api';
app.use(`${apiPrefix}/hotels`, hotelRoutes);
app.use(`${apiPrefix}/floors`, floorRoutes);
app.use(`${apiPrefix}/rooms`, roomRoutes);
app.use(`${apiPrefix}/uploads`, uploadRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;