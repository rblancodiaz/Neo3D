import { Router } from 'express';
import { Request, Response } from 'express';
import { Room, Floor } from '../models';
import coordinateService from '../services/coordinateService';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
  sendConflict,
  sendValidationError,
} from '../utils/response';
import {
  validateCreateRoom,
  validateUpdateRoom,
  validateUpdateRoomCoordinates,
  validateUuidParam,
} from '../middleware/validation';
import { coordinatesLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../utils/asyncHandler';
import { logInfo } from '../utils/logger';

const router = Router({ mergeParams: true }); // To access floorId from parent route

// Get all rooms for a floor
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { floorId } = req.params;

    const rooms = await Room.findAll({
      where: { floorId },
      order: [['roomNumber', 'ASC']],
    });

    sendSuccess(res, { rooms });
  }),
);

// Get single room by ID
router.get(
  '/:id',
  validateUuidParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const room = await Room.findByPk(id, {
      include: [
        {
          model: Floor,
          as: 'floor',
          attributes: ['id', 'name', 'floorNumber', 'hotelId'],
        },
      ],
    });

    if (!room) {
      sendNotFound(res, 'Room');
      return;
    }

    sendSuccess(res, { room });
  }),
);

// Create new room
router.post(
  '/',
  validateCreateRoom,
  asyncHandler(async (req: Request, res: Response) => {
    const { floorId } = req.params;
    const {
      roomNumber,
      roomType,
      bedType,
      capacity,
      coordinates,
      basePrice,
      currency,
      metadata,
    } = req.body;

    // Check if floor exists
    const floor = await Floor.findByPk(floorId);
    if (!floor) {
      sendNotFound(res, 'Floor');
      return;
    }

    // Check if room number already exists on this floor
    const existingRoom = await Room.findOne({
      where: { floorId, roomNumber },
    });

    if (existingRoom) {
      sendConflict(res, `Room number ${roomNumber} already exists on this floor`);
      return;
    }

    // Validate coordinates
    const validationResult = coordinateService.validateRoomCoordinates(coordinates);
    if (!validationResult.valid) {
      sendValidationError(res, validationResult.errors);
      return;
    }

    // Check for overlapping rooms
    const overlapResult = await coordinateService.checkRoomOverlap(
      coordinates,
      floorId,
    );

    if (overlapResult.hasOverlap) {
      const overlappingRoomNumbers = overlapResult.overlappingRooms
        .map(r => r.roomNumber)
        .join(', ');
      
      sendConflict(res, `Room overlaps with existing rooms: ${overlappingRoomNumbers}`, {
        overlappingRooms: overlapResult.overlappingRooms.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          overlapPercentage: overlapResult.overlapPercentages.get(r.id),
        })),
      });
      return;
    }

    // Create room
    const room = await Room.create({
      floorId,
      roomNumber,
      roomType,
      bedType,
      capacity,
      xCoordinate: coordinates.x,
      yCoordinate: coordinates.y,
      width: coordinates.width,
      height: coordinates.height,
      basePrice,
      currency,
      metadata,
    });

    // Update floor room count
    await floor.increment('totalRooms');

    logInfo('Room created', { roomId: room.id, floorId, roomNumber });

    sendCreated(res, { room });
  }),
);

// Update room details
router.put(
  '/:id',
  validateUpdateRoom,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      roomNumber,
      roomType,
      bedType,
      capacity,
      status,
      basePrice,
      currency,
      metadata,
    } = req.body;

    const room = await Room.findByPk(id);

    if (!room) {
      sendNotFound(res, 'Room');
      return;
    }

    // Check if new room number already exists (if changed)
    if (roomNumber && roomNumber !== room.roomNumber) {
      const existingRoom = await Room.findOne({
        where: { floorId: room.floorId, roomNumber },
      });

      if (existingRoom) {
        sendConflict(res, `Room number ${roomNumber} already exists on this floor`);
        return;
      }
    }

    // Update fields
    if (roomNumber !== undefined) room.roomNumber = roomNumber;
    if (roomType !== undefined) room.roomType = roomType;
    if (bedType !== undefined) room.bedType = bedType;
    if (capacity !== undefined) room.capacity = capacity;
    if (status !== undefined) room.status = status;
    if (basePrice !== undefined) room.basePrice = basePrice;
    if (currency !== undefined) room.currency = currency;
    if (metadata !== undefined) room.metadata = metadata;

    await room.save();

    logInfo('Room updated', { roomId: room.id });

    sendSuccess(res, { room });
  }),
);

// Update room coordinates (special endpoint for drag & drop)
router.patch(
  '/:id/coordinates',
  coordinatesLimiter,
  validateUpdateRoomCoordinates,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { coordinates } = req.body;

    const room = await Room.findByPk(id);

    if (!room) {
      sendNotFound(res, 'Room');
      return;
    }

    // Validate new coordinates
    const validationResult = coordinateService.validateRoomCoordinates(coordinates);
    if (!validationResult.valid) {
      sendValidationError(res, validationResult.errors);
      return;
    }

    // Check for overlapping rooms (exclude current room)
    const overlapResult = await coordinateService.checkRoomOverlap(
      coordinates,
      room.floorId,
      room.id,
    );

    if (overlapResult.hasOverlap) {
      const overlappingRoomNumbers = overlapResult.overlappingRooms
        .map(r => r.roomNumber)
        .join(', ');
      
      sendConflict(res, `Room overlaps with existing rooms: ${overlappingRoomNumbers}`, {
        overlappingRooms: overlapResult.overlappingRooms.map(r => ({
          id: r.id,
          roomNumber: r.roomNumber,
          overlapPercentage: overlapResult.overlapPercentages.get(r.id),
        })),
      });
      return;
    }

    // Update coordinates
    room.xCoordinate = coordinates.x;
    room.yCoordinate = coordinates.y;
    room.width = coordinates.width;
    room.height = coordinates.height;

    await room.save();

    logInfo('Room coordinates updated', { roomId: room.id });

    sendSuccess(res, { room });
  }),
);

// Delete room
router.delete(
  '/:id',
  validateUuidParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const room = await Room.findByPk(id);

    if (!room) {
      sendNotFound(res, 'Room');
      return;
    }

    const floorId = room.floorId;

    await room.destroy();

    // Update floor room count
    const floor = await Floor.findByPk(floorId);
    if (floor) {
      await floor.decrement('totalRooms');
    }

    logInfo('Room deleted', { roomId: id });

    sendNoContent(res);
  }),
);

// Get neighboring rooms
router.get(
  '/:id/neighbors',
  validateUuidParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const maxDistance = parseFloat(req.query.maxDistance as string) || 0.1;

    const neighbors = await coordinateService.findNeighboringRooms(id, maxDistance);

    sendSuccess(res, { neighbors });
  }),
);

export default router;