import { z } from 'zod';
import slugify from 'slugify';

/**
 * Common validation schemas
 */

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID format');

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 50) : 10)),
  search: z.string().optional(),
  status: z.string().optional(),
});

// Normalized coordinates schema (0-1 range)
export const normalizedCoordinatesSchema = z
  .object({
    x: z.number().min(0).max(1, 'X coordinate must be between 0 and 1'),
    y: z.number().min(0).max(1, 'Y coordinate must be between 0 and 1'),
    width: z.number().min(0.005, 'Width must be at least 0.5% of image').max(1),
    height: z.number().min(0.005, 'Height must be at least 0.5% of image').max(1),
  })
  .refine((data) => data.x + data.width <= 1.0, {
    message: 'Room extends beyond image horizontal bounds',
  })
  .refine((data) => data.y + data.height <= 1.0, {
    message: 'Room extends beyond image vertical bounds',
  });

// Image dimensions schema
export const imageDimensionsSchema = z.object({
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
});

/**
 * Validation helper functions
 */

/**
 * Generate a URL-friendly slug from a string
 */
export const generateSlug = (text: string): string => {
  return slugify(text, {
    lower: true,
    strict: true,
    replacement: '-',
  });
};

/**
 * Validate and sanitize room number
 */
export const validateRoomNumber = (roomNumber: string): string => {
  const cleaned = roomNumber.trim().toUpperCase();
  if (cleaned.length === 0 || cleaned.length > 50) {
    throw new Error('Room number must be between 1 and 50 characters');
  }
  return cleaned;
};

/**
 * Validate floor number
 */
export const validateFloorNumber = (floorNumber: number): boolean => {
  return floorNumber >= -10 && floorNumber <= 200;
};

/**
 * Check if coordinates overlap with tolerance
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const checkOverlap = (rect1: Rectangle, rect2: Rectangle, tolerance = 0.05): boolean => {
  // Calculate the overlap area
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x),
  );

  const yOverlap = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y),
  );

  const overlapArea = xOverlap * yOverlap;
  const rect1Area = rect1.width * rect1.height;
  const rect2Area = rect2.width * rect2.height;
  const smallerArea = Math.min(rect1Area, rect2Area);

  // Check if overlap exceeds tolerance (as percentage of smaller rectangle)
  return overlapArea / smallerArea > tolerance;
};

/**
 * Calculate overlap percentage between two rectangles
 */
export const calculateOverlapPercentage = (rect1: Rectangle, rect2: Rectangle): number => {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x),
  );

  const yOverlap = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y),
  );

  const overlapArea = xOverlap * yOverlap;
  const rect1Area = rect1.width * rect1.height;
  const rect2Area = rect2.width * rect2.height;
  const smallerArea = Math.min(rect1Area, rect2Area);

  return (overlapArea / smallerArea) * 100;
};

/**
 * Validate aspect ratio
 */
export const validateAspectRatio = (width: number, height: number): boolean => {
  const aspectRatio = width / height;
  // Aspect ratio should be between 0.1 and 10 (not too extreme)
  return aspectRatio >= 0.1 && aspectRatio <= 10;
};

/**
 * Parse and validate JSON safely
 */
export const parseJSON = <T>(jsonString: string, fallback: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
};

/**
 * Validate hex color code
 */
export const isValidHexColor = (color: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
};

/**
 * Sanitize string for safe display
 */
export const sanitizeString = (str: string, maxLength = 255): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, maxLength);
};

export default {
  uuidSchema,
  paginationSchema,
  normalizedCoordinatesSchema,
  imageDimensionsSchema,
  generateSlug,
  validateRoomNumber,
  validateFloorNumber,
  checkOverlap,
  calculateOverlapPercentage,
  validateAspectRatio,
  parseJSON,
  isValidHexColor,
  sanitizeString,
};