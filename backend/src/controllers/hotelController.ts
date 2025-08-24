import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { Hotel, Floor, Room } from '../models';
import imageService from '../services/imageService';
import { sendSuccess, sendCreated, sendNotFound, sendPaginated, sendNoContent, sendServerError } from '../utils/response';
import { ApiError, ErrorCode } from '../types/api';
import { logInfo } from '../utils/logger';
import slugify from 'slugify';

/**
 * Get all hotels with pagination and filtering
 */
export const getHotels = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;
  const { status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

  const where: any = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Hotel.findAndCountAll({
    where,
    limit,
    offset,
    order: [[sortBy as string, sortOrder as string]],
    attributes: {
      exclude: ['description'], // Exclude large text field from list
    },
  });

  sendPaginated(res, rows, page, limit, count);
};

/**
 * Get single hotel by ID with floors and rooms
 */
export const getHotelById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const hotel = await Hotel.findByPk(id, {
    include: [
      {
        model: Floor,
        as: 'floors',
        attributes: ['id', 'floorNumber', 'name', 'displayOrder', 'totalRooms', 'status'],
        order: [['displayOrder', 'ASC'], ['floorNumber', 'ASC']],
        include: [
          {
            model: Room,
            as: 'rooms',
            attributes: [
              'id',
              'roomNumber',
              'roomType',
              'bedType',
              'capacity',
              'status',
              'xCoordinate',
              'yCoordinate',
              'width',
              'height',
              'basePrice',
              'currency',
            ],
          },
        ],
      },
    ],
  });

  if (!hotel) {
    sendNotFound(res, 'Hotel');
    return;
  }

  sendSuccess(res, { hotel });
};

/**
 * Create new hotel with image
 */
export const createHotel = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  const file = req.file;

  if (!file) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      'Image file is required',
      400,
    );
  }

  // Generate slug
  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${Date.now()}`;

  // Process image
  const processedImages = await imageService.processImage(file, baseSlug);

  // Create hotel
  const hotel = await Hotel.create({
    name,
    slug,
    description,
    originalImageUrl: processedImages.original,
    processedImageUrl: processedImages.processed,
    thumbnailUrl: processedImages.thumbnail,
    imageWidth: processedImages.metadata.width,
    imageHeight: processedImages.metadata.height,
  });

  logInfo('Hotel created', { hotelId: hotel.id, name: hotel.name });

  sendCreated(res, { hotel });
};

/**
 * Update hotel details
 */
export const updateHotel = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const hotel = await Hotel.findByPk(id);

  if (!hotel) {
    sendNotFound(res, 'Hotel');
    return;
  }

  // Update fields
  if (name !== undefined) {
    hotel.name = name;
    // Update slug if name changed
    hotel.slug = slugify(name, { lower: true, strict: true });
  }
  if (description !== undefined) hotel.description = description;
  if (status !== undefined) hotel.status = status;

  await hotel.save();

  logInfo('Hotel updated', { hotelId: hotel.id });

  sendSuccess(res, { hotel });
};

/**
 * Update hotel image
 */
export const updateHotelImage = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    throw new ApiError(
      ErrorCode.VALIDATION_ERROR,
      'Image file is required',
      400,
    );
  }

  const hotel = await Hotel.findByPk(id);

  if (!hotel) {
    sendNotFound(res, 'Hotel');
    return;
  }

  // Delete old images
  await imageService.deleteImages({
    original: hotel.originalImageUrl,
    processed: hotel.processedImageUrl,
    thumbnail: hotel.thumbnailUrl,
  });

  // Process new image
  const processedImages = await imageService.processImage(file, hotel.slug);

  // Update hotel
  hotel.originalImageUrl = processedImages.original;
  hotel.processedImageUrl = processedImages.processed;
  hotel.thumbnailUrl = processedImages.thumbnail;
  hotel.imageWidth = processedImages.metadata.width;
  hotel.imageHeight = processedImages.metadata.height;

  await hotel.save();

  logInfo('Hotel image updated', { hotelId: hotel.id });

  sendSuccess(res, { hotel });
};

/**
 * Delete hotel
 */
export const deleteHotel = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const hotel = await Hotel.findByPk(id);

  if (!hotel) {
    sendNotFound(res, 'Hotel');
    return;
  }

  // Delete images
  await imageService.deleteImages({
    original: hotel.originalImageUrl,
    processed: hotel.processedImageUrl,
    thumbnail: hotel.thumbnailUrl,
  });

  // Delete hotel (cascades to floors and rooms)
  await hotel.destroy();

  logInfo('Hotel deleted', { hotelId: id });

  sendNoContent(res);
};

/**
 * Get hotel statistics
 */
export const getHotelStats = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const hotel = await Hotel.findByPk(id, {
    include: [
      {
        model: Floor,
        as: 'floors',
        include: [
          {
            model: Room,
            as: 'rooms',
          },
        ],
      },
    ],
  });

  if (!hotel) {
    sendNotFound(res, 'Hotel');
    return;
  }

  const floors = hotel.floors || [];
  const totalFloors = floors.length;
  const totalRooms = floors.reduce((sum, floor) => sum + (floor.rooms?.length || 0), 0);

  const roomsByType: Record<string, number> = {};
  const roomsByStatus: Record<string, number> = {};

  floors.forEach(floor => {
    floor.rooms?.forEach(room => {
      roomsByType[room.roomType] = (roomsByType[room.roomType] || 0) + 1;
      roomsByStatus[room.status] = (roomsByStatus[room.status] || 0) + 1;
    });
  });

  const stats = {
    hotelId: hotel.id,
    hotelName: hotel.name,
    totalFloors,
    totalRooms,
    roomsByType,
    roomsByStatus,
    occupancyRate: totalRooms > 0 
      ? ((roomsByStatus.occupied || 0) / totalRooms * 100).toFixed(2) + '%'
      : '0%',
  };

  sendSuccess(res, { stats });
};