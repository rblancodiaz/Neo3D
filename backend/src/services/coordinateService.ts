import { Room, NormalizedCoordinates } from '../models/Room';
import { Op } from 'sequelize';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface OverlapResult {
  hasOverlap: boolean;
  overlappingRooms: Room[];
  overlapPercentages: Map<string, number>;
}

export interface RawCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}

class CoordinateService {
  /**
   * Validate normalized coordinates
   */
  validateRoomCoordinates(coords: NormalizedCoordinates): ValidationResult {
    const errors: string[] = [];

    // Check if coordinates are within 0-1 range
    if (coords.x < 0 || coords.x > 1) {
      errors.push(`X coordinate must be between 0 and 1 (got ${coords.x})`);
    }

    if (coords.y < 0 || coords.y > 1) {
      errors.push(`Y coordinate must be between 0 and 1 (got ${coords.y})`);
    }

    if (coords.width < 0 || coords.width > 1) {
      errors.push(`Width must be between 0 and 1 (got ${coords.width})`);
    }

    if (coords.height < 0 || coords.height > 1) {
      errors.push(`Height must be between 0 and 1 (got ${coords.height})`);
    }

    // Check minimum dimensions (0.5% of image)
    const MIN_DIMENSION = 0.005;
    if (coords.width < MIN_DIMENSION) {
      errors.push(`Width must be at least ${MIN_DIMENSION} (0.5% of image)`);
    }

    if (coords.height < MIN_DIMENSION) {
      errors.push(`Height must be at least ${MIN_DIMENSION} (0.5% of image)`);
    }

    // Check if rectangle stays within bounds
    if (coords.x + coords.width > 1.0) {
      errors.push('Room extends beyond right edge of image (x + width > 1.0)');
    }

    if (coords.y + coords.height > 1.0) {
      errors.push('Room extends beyond bottom edge of image (y + height > 1.0)');
    }

    // Check aspect ratio (not too extreme)
    const aspectRatio = coords.width / coords.height;
    if (aspectRatio < 0.1 || aspectRatio > 10) {
      errors.push(`Aspect ratio is too extreme (${aspectRatio.toFixed(2)}). Should be between 0.1 and 10`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for overlapping rooms on the same floor
   */
  async checkRoomOverlap(
    newRoom: NormalizedCoordinates,
    floorId: string,
    excludeRoomId?: string,
    tolerance = 0.05,
  ): Promise<OverlapResult> {
    // Find all rooms on the same floor
    const whereClause: any = { floorId };
    if (excludeRoomId) {
      whereClause.id = { [Op.ne]: excludeRoomId };
    }

    const existingRooms = await Room.findAll({
      where: whereClause,
    });

    const overlappingRooms: Room[] = [];
    const overlapPercentages = new Map<string, number>();

    for (const room of existingRooms) {
      const overlap = this.calculateOverlap(
        newRoom,
        {
          x: Number(room.xCoordinate),
          y: Number(room.yCoordinate),
          width: Number(room.width),
          height: Number(room.height),
        },
      );

      if (overlap > 0) {
        const roomArea = Number(room.width) * Number(room.height);
        const newRoomArea = newRoom.width * newRoom.height;
        const minArea = Math.min(roomArea, newRoomArea);
        const overlapPercentage = overlap / minArea;

        if (overlapPercentage > tolerance) {
          overlappingRooms.push(room);
          overlapPercentages.set(room.id, overlapPercentage * 100);
        }
      }
    }

    return {
      hasOverlap: overlappingRooms.length > 0,
      overlappingRooms,
      overlapPercentages,
    };
  }

  /**
   * Calculate overlap area between two rectangles
   */
  private calculateOverlap(rect1: NormalizedCoordinates, rect2: NormalizedCoordinates): number {
    const x1 = rect1.x;
    const y1 = rect1.y;
    const x1End = rect1.x + rect1.width;
    const y1End = rect1.y + rect1.height;

    const x2 = rect2.x;
    const y2 = rect2.y;
    const x2End = rect2.x + rect2.width;
    const y2End = rect2.y + rect2.height;

    // Check if rectangles don't overlap
    if (x1End <= x2 || x2End <= x1 || y1End <= y2 || y2End <= y1) {
      return 0;
    }

    // Calculate overlap rectangle
    const overlapLeft = Math.max(x1, x2);
    const overlapTop = Math.max(y1, y2);
    const overlapRight = Math.min(x1End, x2End);
    const overlapBottom = Math.min(y1End, y2End);

    const overlapWidth = overlapRight - overlapLeft;
    const overlapHeight = overlapBottom - overlapTop;

    return overlapWidth * overlapHeight;
  }

  /**
   * Convert pixel coordinates to normalized coordinates (0-1)
   */
  normalizeCoordinates(coords: RawCoordinates): NormalizedCoordinates {
    return {
      x: coords.x / coords.imageWidth,
      y: coords.y / coords.imageHeight,
      width: coords.width / coords.imageWidth,
      height: coords.height / coords.imageHeight,
    };
  }

  /**
   * Convert normalized coordinates to pixel coordinates
   */
  denormalizeCoordinates(
    coords: NormalizedCoordinates,
    imageWidth: number,
    imageHeight: number,
  ): RawCoordinates {
    return {
      x: Math.round(coords.x * imageWidth),
      y: Math.round(coords.y * imageHeight),
      width: Math.round(coords.width * imageWidth),
      height: Math.round(coords.height * imageHeight),
      imageWidth,
      imageHeight,
    };
  }

  /**
   * Check if a point is inside a room
   */
  isPointInRoom(
    point: { x: number; y: number },
    room: NormalizedCoordinates,
  ): boolean {
    return (
      point.x >= room.x &&
      point.x <= room.x + room.width &&
      point.y >= room.y &&
      point.y <= room.y + room.height
    );
  }

  /**
   * Find room at given coordinates
   */
  async findRoomAtPoint(
    point: { x: number; y: number },
    floorId: string,
  ): Promise<Room | null> {
    const rooms = await Room.findAll({
      where: { floorId },
    });

    for (const room of rooms) {
      const roomCoords: NormalizedCoordinates = {
        x: Number(room.xCoordinate),
        y: Number(room.yCoordinate),
        width: Number(room.width),
        height: Number(room.height),
      };

      if (this.isPointInRoom(point, roomCoords)) {
        return room;
      }
    }

    return null;
  }

  /**
   * Calculate distance between two rooms
   */
  calculateRoomDistance(room1: NormalizedCoordinates, room2: NormalizedCoordinates): number {
    const center1 = {
      x: room1.x + room1.width / 2,
      y: room1.y + room1.height / 2,
    };

    const center2 = {
      x: room2.x + room2.width / 2,
      y: room2.y + room2.height / 2,
    };

    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Find neighboring rooms within a certain distance
   */
  async findNeighboringRooms(
    roomId: string,
    maxDistance = 0.1,
  ): Promise<Room[]> {
    const room = await Room.findByPk(roomId);
    if (!room) {
      return [];
    }

    const allRooms = await Room.findAll({
      where: {
        floorId: room.floorId,
        id: { [Op.ne]: roomId },
      },
    });

    const roomCoords: NormalizedCoordinates = {
      x: Number(room.xCoordinate),
      y: Number(room.yCoordinate),
      width: Number(room.width),
      height: Number(room.height),
    };

    const neighbors: Room[] = [];

    for (const otherRoom of allRooms) {
      const otherCoords: NormalizedCoordinates = {
        x: Number(otherRoom.xCoordinate),
        y: Number(otherRoom.yCoordinate),
        width: Number(otherRoom.width),
        height: Number(otherRoom.height),
      };

      const distance = this.calculateRoomDistance(roomCoords, otherCoords);
      if (distance <= maxDistance) {
        neighbors.push(otherRoom);
      }
    }

    return neighbors;
  }
}

export default new CoordinateService();