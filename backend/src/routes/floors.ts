import { Router } from 'express';
import { Request, Response } from 'express';
import { Floor, Room } from '../models';
import {
  sendSuccess,
  sendCreated,
  sendNotFound,
  sendNoContent,
  sendConflict,
} from '../utils/response';
import {
  validateCreateFloor,
  validateUpdateFloor,
  validateUuidParam,
} from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { logInfo } from '../utils/logger';

const router = Router({ mergeParams: true }); // To access hotelId from parent route

// Get all floors for a hotel
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { hotelId } = req.params;

    const floors = await Floor.findAll({
      where: { hotelId },
      order: [['displayOrder', 'ASC'], ['floorNumber', 'ASC']],
      include: [
        {
          model: Room,
          as: 'rooms',
          attributes: ['id', 'roomNumber', 'status'],
        },
      ],
    });

    sendSuccess(res, { floors });
  }),
);

// Get single floor by ID
router.get(
  '/:id',
  validateUuidParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const floor = await Floor.findByPk(id, {
      include: [
        {
          model: Room,
          as: 'rooms',
        },
      ],
    });

    if (!floor) {
      sendNotFound(res, 'Floor');
      return;
    }

    sendSuccess(res, { floor });
  }),
);

// Create new floor
router.post(
  '/',
  validateCreateFloor,
  asyncHandler(async (req: Request, res: Response) => {
    const { hotelId } = req.params;
    const { floorNumber, name, displayOrder, floorAreaSqm, notes } = req.body;

    // Check if floor number already exists for this hotel
    const existingFloor = await Floor.findOne({
      where: { hotelId, floorNumber },
    });

    if (existingFloor) {
      sendConflict(res, `Floor number ${floorNumber} already exists for this hotel`);
      return;
    }

    const floor = await Floor.create({
      hotelId,
      floorNumber,
      name,
      displayOrder: displayOrder || floorNumber,
      floorAreaSqm,
      notes,
    });

    logInfo('Floor created', { floorId: floor.id, hotelId });

    sendCreated(res, { floor });
  }),
);

// Update floor
router.put(
  '/:id',
  validateUpdateFloor,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, displayOrder, floorAreaSqm, status, notes } = req.body;

    const floor = await Floor.findByPk(id);

    if (!floor) {
      sendNotFound(res, 'Floor');
      return;
    }

    // Update fields
    if (name !== undefined) floor.name = name;
    if (displayOrder !== undefined) floor.displayOrder = displayOrder;
    if (floorAreaSqm !== undefined) floor.floorAreaSqm = floorAreaSqm;
    if (status !== undefined) floor.status = status;
    if (notes !== undefined) floor.notes = notes;

    await floor.save();

    logInfo('Floor updated', { floorId: floor.id });

    sendSuccess(res, { floor });
  }),
);

// Delete floor
router.delete(
  '/:id',
  validateUuidParam,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const floor = await Floor.findByPk(id);

    if (!floor) {
      sendNotFound(res, 'Floor');
      return;
    }

    // Check if floor has rooms
    const roomCount = await floor.countRooms();
    if (roomCount > 0) {
      sendConflict(res, `Cannot delete floor with ${roomCount} rooms. Delete rooms first.`);
      return;
    }

    await floor.destroy();

    logInfo('Floor deleted', { floorId: id });

    sendNoContent(res);
  }),
);

// Import room routes (nested under floors)
import roomRoutes from './rooms';
router.use('/:floorId/rooms', roomRoutes);

export default router;