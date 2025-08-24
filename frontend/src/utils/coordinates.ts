import { NormalizedCoordinates, PixelCoordinates, Point } from '../types';

/**
 * Convert pixel coordinates to normalized coordinates (0-1 range)
 */
export const normalizeCoordinates = (
  pixelCoords: PixelCoordinates,
  imageWidth: number,
  imageHeight: number
): NormalizedCoordinates => {
  return {
    x: pixelCoords.x / imageWidth,
    y: pixelCoords.y / imageHeight,
    width: pixelCoords.width / imageWidth,
    height: pixelCoords.height / imageHeight,
  };
};

/**
 * Convert normalized coordinates (0-1 range) to pixel coordinates
 */
export const denormalizeCoordinates = (
  normalizedCoords: NormalizedCoordinates,
  imageWidth: number,
  imageHeight: number
): PixelCoordinates => {
  return {
    x: normalizedCoords.x * imageWidth,
    y: normalizedCoords.y * imageHeight,
    width: normalizedCoords.width * imageWidth,
    height: normalizedCoords.height * imageHeight,
  };
};

/**
 * Normalize a single point
 */
export const normalizePoint = (
  point: Point,
  imageWidth: number,
  imageHeight: number
): Point => {
  return {
    x: point.x / imageWidth,
    y: point.y / imageHeight,
  };
};

/**
 * Denormalize a single point
 */
export const denormalizePoint = (
  point: Point,
  imageWidth: number,
  imageHeight: number
): Point => {
  return {
    x: point.x * imageWidth,
    y: point.y * imageHeight,
  };
};

/**
 * Check if two rectangles overlap
 */
export const checkOverlap = (
  rect1: NormalizedCoordinates,
  rect2: NormalizedCoordinates
): boolean => {
  return !(
    rect1.x + rect1.width <= rect2.x ||
    rect2.x + rect2.width <= rect1.x ||
    rect1.y + rect1.height <= rect2.y ||
    rect2.y + rect2.height <= rect1.y
  );
};

/**
 * Calculate the overlap area between two rectangles
 */
export const calculateOverlapArea = (
  rect1: NormalizedCoordinates,
  rect2: NormalizedCoordinates
): number => {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.x + rect1.width, rect2.x + rect2.width) -
      Math.max(rect1.x, rect2.x)
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.y + rect1.height, rect2.y + rect2.height) -
      Math.max(rect1.y, rect2.y)
  );
  return xOverlap * yOverlap;
};

/**
 * Check if a point is inside a rectangle
 */
export const isPointInRectangle = (
  point: Point,
  rect: NormalizedCoordinates | PixelCoordinates
): boolean => {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
};

/**
 * Calculate the center point of a rectangle
 */
export const getRectangleCenter = (
  rect: NormalizedCoordinates | PixelCoordinates
): Point => {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
};

/**
 * Calculate the distance between two points
 */
export const getDistance = (point1: Point, point2: Point): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Snap a point to grid
 */
export const snapToGrid = (point: Point, gridSize: number): Point => {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
};

/**
 * Clamp coordinates within bounds
 */
export const clampCoordinates = (
  coords: NormalizedCoordinates
): NormalizedCoordinates => {
  const x = Math.max(0, Math.min(coords.x, 1));
  const y = Math.max(0, Math.min(coords.y, 1));
  const width = Math.max(0, Math.min(coords.width, 1 - x));
  const height = Math.max(0, Math.min(coords.height, 1 - y));
  
  return { x, y, width, height };
};

/**
 * Get the bounding box of multiple rectangles
 */
export const getBoundingBox = (
  rectangles: (NormalizedCoordinates | PixelCoordinates)[]
): NormalizedCoordinates | PixelCoordinates | null => {
  if (rectangles.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  rectangles.forEach((rect) => {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Scale coordinates by a factor
 */
export const scaleCoordinates = (
  coords: PixelCoordinates,
  scale: number
): PixelCoordinates => {
  return {
    x: coords.x * scale,
    y: coords.y * scale,
    width: coords.width * scale,
    height: coords.height * scale,
  };
};

/**
 * Translate coordinates by an offset
 */
export const translateCoordinates = (
  coords: PixelCoordinates,
  offsetX: number,
  offsetY: number
): PixelCoordinates => {
  return {
    x: coords.x + offsetX,
    y: coords.y + offsetY,
    width: coords.width,
    height: coords.height,
  };
};