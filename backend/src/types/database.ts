import { Optional } from 'sequelize';

// Hotel attributes
export interface HotelAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  originalImageUrl: string;
  processedImageUrl: string;
  thumbnailUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageAspectRatio?: number; // Generated field
  totalFloors: number;
  totalRooms: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HotelCreationAttributes extends Optional<HotelAttributes, 'id' | 'slug' | 'totalFloors' | 'totalRooms' | 'status' | 'createdAt' | 'updatedAt' | 'imageAspectRatio'> {}

// Floor attributes
export interface FloorAttributes {
  id: string;
  hotelId: string;
  floorNumber: number;
  name: string;
  displayOrder: number;
  totalRooms: number;
  floorAreaSqm?: number | null;
  status: 'active' | 'inactive' | 'maintenance';
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FloorCreationAttributes extends Optional<FloorAttributes, 'id' | 'displayOrder' | 'totalRooms' | 'status' | 'createdAt' | 'updatedAt'> {}

// Room attributes
export interface RoomAttributes {
  id: string;
  floorId: string;
  roomNumber: string;
  roomType: 'standard' | 'deluxe' | 'suite' | 'presidential' | 'accessible';
  bedType: 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed';
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order' | 'cleaning';
  xCoordinate: number;
  yCoordinate: number;
  width: number;
  height: number;
  xEnd?: number; // Generated field
  yEnd?: number; // Generated field
  centerX?: number; // Generated field
  centerY?: number; // Generated field
  area?: number; // Generated field
  basePrice?: number | null;
  currency: string;
  metadata: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoomCreationAttributes extends Optional<
  RoomAttributes,
  'id' | 'roomType' | 'bedType' | 'capacity' | 'status' | 'currency' | 'metadata' | 'createdAt' | 'updatedAt' | 'xEnd' | 'yEnd' | 'centerX' | 'centerY' | 'area'
> {}

// Room coordinate history attributes
export interface RoomCoordinateHistoryAttributes {
  id: string;
  roomId: string;
  oldXCoordinate?: number | null;
  oldYCoordinate?: number | null;
  oldWidth?: number | null;
  oldHeight?: number | null;
  newXCoordinate?: number | null;
  newYCoordinate?: number | null;
  newWidth?: number | null;
  newHeight?: number | null;
  changeReason?: string | null;
  changedAt?: Date;
  changedBy?: string | null;
}

export interface RoomCoordinateHistoryCreationAttributes
  extends Optional<RoomCoordinateHistoryAttributes, 'id' | 'changedAt'> {}

// Normalized coordinates type
export interface NormalizedCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Raw pixel coordinates (for conversion)
export interface RawCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}

// Room with floor and hotel info
export interface RoomWithRelations extends RoomAttributes {
  floor?: FloorAttributes;
  hotel?: HotelAttributes;
}

// Floor with hotel info
export interface FloorWithRelations extends FloorAttributes {
  hotel?: HotelAttributes;
  rooms?: RoomAttributes[];
}

// Hotel with all relations
export interface HotelWithRelations extends HotelAttributes {
  floors?: FloorWithRelations[];
}