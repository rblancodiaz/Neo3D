import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config, isDevelopment } from '../config/environment';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let metaStr = '';
    
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  }),
);

// Format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );
}

// File transport for errors
transports.push(
  new DailyRotateFile({
    filename: path.join(config.LOG_FILE_PATH, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    format: fileFormat,
    maxFiles: config.LOG_MAX_FILES,
    maxSize: config.LOG_MAX_SIZE,
    handleExceptions: true,
  }),
);

// File transport for all logs
transports.push(
  new DailyRotateFile({
    filename: path.join(config.LOG_FILE_PATH, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    format: fileFormat,
    maxFiles: config.LOG_MAX_FILES,
    maxSize: config.LOG_MAX_SIZE,
  }),
);

// Create the logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false, // Do not exit on handled exceptions
});

// Create a stream object for Morgan middleware
export const stream = {
  write: (message: string) => {
    // Remove trailing newline
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context,
  });
};

export const logInfo = (message: string, data?: Record<string, any>) => {
  logger.info(message, data);
};

export const logWarn = (message: string, data?: Record<string, any>) => {
  logger.warn(message, data);
};

export const logDebug = (message: string, data?: Record<string, any>) => {
  logger.debug(message, data);
};

export const logHttp = (message: string, data?: Record<string, any>) => {
  logger.http(message, data);
};

// Export the logger instance
export default logger;