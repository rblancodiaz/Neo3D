// Normalized coordinates (0-1 range)
export interface NormalizedCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Pixel coordinates
export interface PixelCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Point for drawing operations
export interface Point {
  x: number;
  y: number;
}

// Hotel entity
export interface Hotel {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  floors: Floor[];
  createdAt: string;
  updatedAt: string;
}

// Floor entity
export interface Floor {
  id: string;
  hotelId: string;
  number: number;
  name: string;
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

// Room entity
export interface Room {
  id: string;
  floorId: string;
  roomNumber: string;
  type: RoomType;
  status: RoomStatus;
  coordinates: NormalizedCoordinates;
  metadata?: RoomMetadata;
  createdAt: string;
  updatedAt: string;
}

// Room types
export enum RoomType {
  STANDARD = 'standard',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  PRESIDENTIAL = 'presidential',
  ACCESSIBLE = 'accessible',
}

// Room status
export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

// Room metadata
export interface RoomMetadata {
  capacity?: number;
  beds?: number;
  price?: number;
  amenities?: string[];
  notes?: string;
}

// Canvas drawing state
export interface DrawingState {
  isDrawing: boolean;
  startPoint: Point | null;
  currentRect: PixelCoordinates | null;
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
}

// Viewport state for zoom/pan
export interface ViewportState {
  scale: number;
  offsetX: number;
  offsetY: number;
  isDragging: boolean;
  dragStart: Point | null;
}

// Tool types
export enum DrawingTool {
  SELECT = 'select',
  RECTANGLE = 'rectangle',
  PAN = 'pan',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Form data types
export interface HotelFormData {
  name: string;
  description?: string;
  image?: File;
}

export interface RoomFormData {
  roomNumber: string;
  type: RoomType;
  status: RoomStatus;
  capacity?: number;
  beds?: number;
  price?: number;
  amenities?: string[];
  notes?: string;
}

// Upload progress
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// UI State
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface Modal {
  id: string;
  type: 'room-details' | 'room-form' | 'confirm' | 'image-upload';
  data?: any;
}