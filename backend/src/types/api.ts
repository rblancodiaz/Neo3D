import { Request } from 'express';

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination Query
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// Hotel API Types
export interface CreateHotelRequest extends Request {
  body: {
    name: string;
    description?: string;
  };
  file?: Express.Multer.File;
}

export interface UpdateHotelRequest extends Request {
  params: {
    id: string;
  };
  body: {
    name?: string;
    description?: string;
    status?: 'active' | 'inactive' | 'draft';
  };
}

export interface GetHotelsQuery extends PaginationQuery {
  status?: 'active' | 'inactive' | 'draft';
  search?: string;
}

// Floor API Types
export interface CreateFloorRequest extends Request {
  params: {
    hotelId: string;
  };
  body: {
    floorNumber: number;
    name: string;
    displayOrder?: number;
    floorAreaSqm?: number;
    notes?: string;
  };
}

export interface UpdateFloorRequest extends Request {
  params: {
    id: string;
  };
  body: {
    name?: string;
    displayOrder?: number;
    floorAreaSqm?: number;
    status?: 'active' | 'inactive' | 'maintenance';
    notes?: string;
  };
}

// Room API Types
export interface CreateRoomRequest extends Request {
  params: {
    floorId: string;
  };
  body: {
    roomNumber: string;
    roomType?: 'standard' | 'deluxe' | 'suite' | 'presidential' | 'accessible';
    bedType?: 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed';
    capacity?: number;
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    basePrice?: number;
    currency?: string;
    metadata?: Record<string, any>;
  };
}

export interface UpdateRoomRequest extends Request {
  params: {
    id: string;
  };
  body: {
    roomNumber?: string;
    roomType?: 'standard' | 'deluxe' | 'suite' | 'presidential' | 'accessible';
    bedType?: 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed';
    capacity?: number;
    status?: 'available' | 'occupied' | 'maintenance' | 'out_of_order' | 'cleaning';
    basePrice?: number;
    currency?: string;
    metadata?: Record<string, any>;
  };
}

export interface UpdateRoomCoordinatesRequest extends Request {
  params: {
    id: string;
  };
  body: {
    coordinates: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

// Upload API Types
export interface UploadImageRequest extends Request {
  file?: Express.Multer.File;
}

export interface ProcessedImageResponse {
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  imageWidth: number;
  imageHeight: number;
  fileSize: number;
  processingTime: number;
}

// Error Types
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  OVERLAP_ERROR = 'OVERLAP_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}