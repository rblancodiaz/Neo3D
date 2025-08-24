import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),
  DB_POOL_MIN: z.string().transform(Number).default('5'),
  DB_POOL_MAX: z.string().transform(Number).default('20'),
  DB_POOL_ACQUIRE: z.string().transform(Number).default('30000'),
  DB_POOL_IDLE: z.string().transform(Number).default('10000'),

  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  API_PREFIX: z.string().default('/api'),

  // File Upload
  UPLOAD_PATH: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  UPLOAD_TEMP_PATH: z.string().default('./tmp'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/jpg'),

  // Image Processing
  MAX_IMAGE_DIMENSION: z.string().transform(Number).default('1920'),
  THUMBNAIL_SIZE: z.string().transform(Number).default('200'),
  JPEG_QUALITY: z.string().transform(Number).default('85'),
  PNG_COMPRESSION_LEVEL: z.string().transform(Number).default('9'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  RATE_LIMIT_UPLOAD_MAX: z.string().transform(Number).default('5'),
  RATE_LIMIT_COORDINATES_MAX: z.string().transform(Number).default('50'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),
  LOG_MAX_FILES: z.string().default('10'),
  LOG_MAX_SIZE: z.string().default('10m'),

  // Security (optional for now)
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('10'),

  // Application
  APP_NAME: z.string().default('Hotel Room Mapper API'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().default('http://localhost:3001'),
});

// Parse and validate environment variables
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      console.error('Environment validation failed:');
      console.error(`Missing or invalid variables: ${missingVars}`);
      error.errors.forEach((e) => {
        console.error(`  ${e.path.join('.')}: ${e.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export validated config
export const config = parseEnv();

// Export typed config for convenience
export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';

// Export paths as absolute
export const paths = {
  uploads: path.resolve(config.UPLOAD_PATH),
  temp: path.resolve(config.UPLOAD_TEMP_PATH),
  logs: path.resolve(config.LOG_FILE_PATH),
  processed: path.join(path.resolve(config.UPLOAD_PATH), 'processed'),
  thumbnails: path.join(path.resolve(config.UPLOAD_PATH), 'thumbnails'),
};

// Database URL parser for Sequelize
export const parseDbUrl = (url: string) => {
  const dbUrl = new URL(url);
  return {
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '5432'),
    username: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
  };
};

// Export parsed database config
export const dbConfig = {
  ...parseDbUrl(config.DATABASE_URL),
  dialect: 'postgres' as const,
  logging: isDevelopment ? console.log : false,
  pool: {
    min: config.DB_POOL_MIN,
    max: config.DB_POOL_MAX,
    acquire: config.DB_POOL_ACQUIRE,
    idle: config.DB_POOL_IDLE,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};