// Hotel related types
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

export interface Floor {
  id: string;
  hotelId: string;
  number: number;
  name: string;
  rooms: Room[];
  createdAt: string;
  updatedAt: string;
}

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

export enum RoomType {
  STANDARD = 'standard',
  DELUXE = 'deluxe',
  SUITE = 'suite',
  PRESIDENTIAL = 'presidential',
  ACCESSIBLE = 'accessible',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export interface RoomMetadata {
  capacity?: number;
  beds?: number;
  price?: number;
  amenities?: string[];
  notes?: string;
}

export interface NormalizedCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
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

export interface HotelFormData {
  name: string;
  description?: string;
  image?: File;
}