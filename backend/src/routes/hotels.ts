import { Router } from 'express';
import * as hotelController from '../controllers/hotelController';
import { uploadHotelImage } from '../config/multer';
import { uploadLimiter } from '../middleware/rateLimiter';
import {
  validateCreateHotel,
  validateUpdateHotel,
  validateHotelQuery,
  validateUuidParam,
} from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Get all hotels with pagination and filtering
router.get(
  '/',
  validateHotelQuery,
  asyncHandler(hotelController.getHotels),
);

// Get single hotel by ID
router.get(
  '/:id',
  validateUuidParam,
  asyncHandler(hotelController.getHotelById),
);

// Get hotel statistics
router.get(
  '/:id/stats',
  validateUuidParam,
  asyncHandler(hotelController.getHotelStats),
);

// Create new hotel with image
router.post(
  '/',
  // uploadLimiter, // TEMPORARILY DISABLED FOR TESTING
  uploadHotelImage,
  validateCreateHotel,
  asyncHandler(hotelController.createHotel),
);

// Update hotel details
router.put(
  '/:id',
  validateUpdateHotel,
  asyncHandler(hotelController.updateHotel),
);

// Update hotel image
router.patch(
  '/:id/image',
  uploadLimiter,
  uploadHotelImage,
  validateUuidParam,
  asyncHandler(hotelController.updateHotelImage),
);

// Delete hotel
router.delete(
  '/:id',
  validateUuidParam,
  asyncHandler(hotelController.deleteHotel),
);

// Import floor routes (nested under hotels)
import floorRoutes from './floors';
router.use('/:hotelId/floors', floorRoutes);

export default router;