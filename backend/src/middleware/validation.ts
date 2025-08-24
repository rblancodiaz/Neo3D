import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { sendValidationError } from '../utils/response';

// Validation schemas
export const normalizedCoordinatesSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0.005).max(1),
  height: z.number().min(0.005).max(1),
}).refine(data => data.x + data.width <= 1, {
  message: 'Room extends beyond right edge (x + width > 1)',
}).refine(data => data.y + data.height <= 1, {
  message: 'Room extends beyond bottom edge (y + height > 1)',
});

// Hotel schemas
export const createHotelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).trim(),
    description: z.string().optional(),
  }),
});

export const updateHotelSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
  }),
});

export const hotelQuerySchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().positive().max(50)).optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['ASC', 'DESC']).optional(),
  }),
});

// Floor schemas
export const createFloorSchema = z.object({
  body: z.object({
    floorNumber: z.number().min(-10).max(200),
    name: z.string().min(1).max(255).trim(),
    displayOrder: z.number().optional(),
    floorAreaSqm: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const updateFloorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).trim().optional(),
    displayOrder: z.number().optional(),
    floorAreaSqm: z.number().positive().optional(),
    status: z.enum(['active', 'inactive', 'maintenance']).optional(),
    notes: z.string().optional(),
  }),
});

// Room schemas
export const createRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1).max(50).trim(),
    roomType: z.enum(['standard', 'deluxe', 'suite', 'presidential', 'accessible']).optional(),
    bedType: z.enum(['single', 'double', 'queen', 'king', 'twin', 'sofa_bed']).optional(),
    capacity: z.number().min(1).max(20).optional(),
    coordinates: normalizedCoordinatesSchema,
    basePrice: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateRoomSchema = z.object({
  body: z.object({
    roomNumber: z.string().min(1).max(50).trim().optional(),
    roomType: z.enum(['standard', 'deluxe', 'suite', 'presidential', 'accessible']).optional(),
    bedType: z.enum(['single', 'double', 'queen', 'king', 'twin', 'sofa_bed']).optional(),
    capacity: z.number().min(1).max(20).optional(),
    status: z.enum(['available', 'occupied', 'maintenance', 'out_of_order', 'cleaning']).optional(),
    basePrice: z.number().positive().optional(),
    currency: z.string().length(3).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateRoomCoordinatesSchema = z.object({
  body: z.object({
    coordinates: normalizedCoordinatesSchema,
  }),
});

// ID validation schemas
export const uuidParamSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const hotelIdParamSchema = z.object({
  params: z.object({
    hotelId: z.string().uuid(),
  }),
});

export const floorIdParamSchema = z.object({
  params: z.object({
    floorId: z.string().uuid(),
  }),
});

// Pagination schema
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().positive()).default('1').optional(),
    limit: z.string().transform(Number).pipe(z.number().positive().max(100)).default('10').optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['ASC', 'DESC']).default('ASC').optional(),
  }),
});

// Validation middleware factory
export const validate = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        return sendValidationError(res, formattedErrors);
      }
      next(error);
    }
  };
};

// Combined validation middleware for common patterns
export const validateCreateHotel = validate(createHotelSchema);
export const validateUpdateHotel = validate(updateHotelSchema.merge(uuidParamSchema));
export const validateHotelQuery = validate(hotelQuerySchema);

export const validateCreateFloor = validate(createFloorSchema.merge(hotelIdParamSchema));
export const validateUpdateFloor = validate(updateFloorSchema.merge(uuidParamSchema));

export const validateCreateRoom = validate(createRoomSchema.merge(floorIdParamSchema));
export const validateUpdateRoom = validate(updateRoomSchema.merge(uuidParamSchema));
export const validateUpdateRoomCoordinates = validate(updateRoomCoordinatesSchema.merge(uuidParamSchema));

export const validateUuidParam = validate(uuidParamSchema);
export const validatePagination = validate(paginationSchema);