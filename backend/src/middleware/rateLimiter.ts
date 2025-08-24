import rateLimit from 'express-rate-limit';
import { config } from '../config/environment';
import { sendError } from '../utils/response';
import { ErrorCode } from '../types/api';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many requests from this IP, please try again later.',
      429,
      ErrorCode.INTERNAL_ERROR,
    );
  },
});

// Upload rate limiter (more restrictive)
export const uploadLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_UPLOAD_MAX,
  message: 'Too many upload requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many upload requests from this IP, please try again later.',
      429,
      ErrorCode.UPLOAD_ERROR,
    );
  },
});

// Coordinates update rate limiter
export const coordinatesLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_COORDINATES_MAX,
  message: 'Too many coordinate update requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many coordinate update requests from this IP, please try again later.',
      429,
      ErrorCode.INTERNAL_ERROR,
    );
  },
});

// Strict rate limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many requests from this IP, please try again later.',
      429,
      ErrorCode.INTERNAL_ERROR,
    );
  },
});