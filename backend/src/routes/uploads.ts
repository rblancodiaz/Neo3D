import { Router } from 'express';
import { Request, Response } from 'express';
import { uploadHotelImage } from '../config/multer';
import { uploadLimiter } from '../middleware/rateLimiter';
import imageService from '../services/imageService';
import { sendSuccess } from '../utils/response';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError, ErrorCode } from '../types/api';

const router = Router();

// Process hotel image without creating hotel
router.post(
  '/hotel-image',
  uploadLimiter,
  uploadHotelImage,
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Image file is required',
        400,
      );
    }

    const startTime = Date.now();

    // Process image with temporary slug
    const tempSlug = `temp-${Date.now()}`;
    const processedImages = await imageService.processImage(file, tempSlug);

    const processingTime = Date.now() - startTime;

    sendSuccess(res, {
      originalUrl: processedImages.original,
      processedUrl: processedImages.processed,
      thumbnailUrl: processedImages.thumbnail,
      imageWidth: processedImages.metadata.width,
      imageHeight: processedImages.metadata.height,
      fileSize: processedImages.metadata.size,
      processingTime,
    });
  }),
);

// Validate image without processing
router.post(
  '/validate-image',
  uploadLimiter,
  uploadHotelImage,
  asyncHandler(async (req: Request, res: Response) => {
    const file = req.file;

    if (!file) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Image file is required',
        400,
      );
    }

    // Validate image
    await imageService.validateImage(file);

    // Get dimensions
    const dimensions = await imageService.getImageDimensions(file.path);

    // Clean up temp file
    const fs = await import('fs/promises');
    await fs.unlink(file.path);

    sendSuccess(res, {
      valid: true,
      width: dimensions.width,
      height: dimensions.height,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    });
  }),
);

export default router;