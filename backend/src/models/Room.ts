import {
  Model,
  DataTypes,
  Optional,
  BelongsToGetAssociationMixin,
  Association,
} from 'sequelize';
import sequelize from '../config/database';
import type { Floor } from './Floor';

// Room types and bed types
export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential' | 'accessible';
export type BedType = 'single' | 'double' | 'queen' | 'king' | 'twin' | 'sofa_bed';
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'out_of_order' | 'cleaning';

// Coordinate interface for validation
export interface NormalizedCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Room attributes interface
export interface RoomAttributes {
  id: string;
  floorId: string;
  roomNumber: string;
  roomType?: RoomType;
  bedType?: BedType;
  capacity?: number;
  status?: RoomStatus;
  // Normalized coordinates (0-1)
  xCoordinate: number;
  yCoordinate: number;
  width: number;
  height: number;
  // Calculated fields
  xEnd?: number;
  yEnd?: number;
  centerX?: number;
  centerY?: number;
  area?: number;
  // Business data
  basePrice?: number | null;
  currency?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes
export interface RoomCreationAttributes
  extends Optional<
    RoomAttributes,
    | 'id'
    | 'roomType'
    | 'bedType'
    | 'capacity'
    | 'status'
    | 'xEnd'
    | 'yEnd'
    | 'centerX'
    | 'centerY'
    | 'area'
    | 'basePrice'
    | 'currency'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
  > {}

// Room model class
export class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: string;
  public floorId!: string;
  public roomNumber!: string;
  public roomType!: RoomType;
  public bedType!: BedType;
  public capacity!: number;
  public status!: RoomStatus;
  // Coordinates
  public xCoordinate!: number;
  public yCoordinate!: number;
  public width!: number;
  public height!: number;
  // Calculated
  public xEnd!: number;
  public yEnd!: number;
  public centerX!: number;
  public centerY!: number;
  public area!: number;
  // Business
  public basePrice!: number | null;
  public currency!: string;
  public metadata!: Record<string, any>;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getFloor!: BelongsToGetAssociationMixin<Floor>;
  public readonly floor?: Floor;

  public static associations: {
    floor: Association<Room, Floor>;
  };

  // Helper methods
  public getCoordinates(): NormalizedCoordinates {
    return {
      x: this.xCoordinate,
      y: this.yCoordinate,
      width: this.width,
      height: this.height,
    };
  }

  public isOverlapping(other: Room, tolerance = 0.05): boolean {
    const thisRight = this.xCoordinate + this.width;
    const thisBottom = this.yCoordinate + this.height;
    const otherRight = other.xCoordinate + other.width;
    const otherBottom = other.yCoordinate + other.height;

    // Check if rectangles overlap
    const horizontalOverlap = this.xCoordinate < otherRight && thisRight > other.xCoordinate;
    const verticalOverlap = this.yCoordinate < otherBottom && thisBottom > other.yCoordinate;

    if (!horizontalOverlap || !verticalOverlap) {
      return false;
    }

    // Calculate overlap area
    const overlapLeft = Math.max(this.xCoordinate, other.xCoordinate);
    const overlapTop = Math.max(this.yCoordinate, other.yCoordinate);
    const overlapRight = Math.min(thisRight, otherRight);
    const overlapBottom = Math.min(thisBottom, otherBottom);

    const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
    const thisArea = this.width * this.height;
    const otherArea = other.width * other.height;
    const minArea = Math.min(thisArea, otherArea);

    // Check if overlap exceeds tolerance
    return overlapArea / minArea > tolerance;
  }
}

// Initialize the model
Room.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    floorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'floor_id',
      references: {
        model: 'floors',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    roomNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'room_number',
      validate: {
        notEmpty: {
          msg: 'Room number cannot be empty',
        },
        len: {
          args: [1, 50],
          msg: 'Room number must be between 1 and 50 characters',
        },
      },
    },
    roomType: {
      type: DataTypes.ENUM('standard', 'deluxe', 'suite', 'presidential', 'accessible'),
      defaultValue: 'standard',
      field: 'room_type',
    },
    bedType: {
      type: DataTypes.ENUM('single', 'double', 'queen', 'king', 'twin', 'sofa_bed'),
      defaultValue: 'double',
      field: 'bed_type',
    },
    capacity: {
      type: DataTypes.INTEGER,
      defaultValue: 2,
      validate: {
        min: {
          args: [1],
          msg: 'Capacity must be at least 1',
        },
        max: {
          args: [20],
          msg: 'Capacity cannot exceed 20',
        },
      },
    },
    status: {
      type: DataTypes.ENUM('available', 'occupied', 'maintenance', 'out_of_order', 'cleaning'),
      defaultValue: 'available',
    },
    // Normalized coordinates (0-1)
    xCoordinate: {
      type: DataTypes.DECIMAL(12, 10),
      allowNull: false,
      field: 'x_coordinate',
      validate: {
        min: {
          args: [0],
          msg: 'X coordinate must be at least 0',
        },
        max: {
          args: [1],
          msg: 'X coordinate cannot exceed 1',
        },
      },
    },
    yCoordinate: {
      type: DataTypes.DECIMAL(12, 10),
      allowNull: false,
      field: 'y_coordinate',
      validate: {
        min: {
          args: [0],
          msg: 'Y coordinate must be at least 0',
        },
        max: {
          args: [1],
          msg: 'Y coordinate cannot exceed 1',
        },
      },
    },
    width: {
      type: DataTypes.DECIMAL(12, 10),
      allowNull: false,
      validate: {
        min: {
          args: [0.005],
          msg: 'Width must be at least 0.005 (0.5% of image)',
        },
        max: {
          args: [1],
          msg: 'Width cannot exceed 1',
        },
      },
    },
    height: {
      type: DataTypes.DECIMAL(12, 10),
      allowNull: false,
      validate: {
        min: {
          args: [0.005],
          msg: 'Height must be at least 0.005 (0.5% of image)',
        },
        max: {
          args: [1],
          msg: 'Height cannot exceed 1',
        },
      },
    },
    // Calculated fields
    xEnd: {
      type: DataTypes.VIRTUAL,
      field: 'x_end',
      get() {
        const x = Number(this.getDataValue('xCoordinate'));
        const width = Number(this.getDataValue('width'));
        return x + width;
      },
    },
    yEnd: {
      type: DataTypes.VIRTUAL,
      field: 'y_end',
      get() {
        const y = Number(this.getDataValue('yCoordinate'));
        const height = Number(this.getDataValue('height'));
        return y + height;
      },
    },
    centerX: {
      type: DataTypes.VIRTUAL,
      field: 'center_x',
      get() {
        const x = Number(this.getDataValue('xCoordinate'));
        const width = Number(this.getDataValue('width'));
        return x + width / 2;
      },
    },
    centerY: {
      type: DataTypes.VIRTUAL,
      field: 'center_y',
      get() {
        const y = Number(this.getDataValue('yCoordinate'));
        const height = Number(this.getDataValue('height'));
        return y + height / 2;
      },
    },
    area: {
      type: DataTypes.VIRTUAL,
      get() {
        const width = Number(this.getDataValue('width'));
        const height = Number(this.getDataValue('height'));
        return width * height;
      },
    },
    // Business data
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'base_price',
      validate: {
        min: {
          args: [0],
          msg: 'Base price must be positive',
        },
      },
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'USD',
      validate: {
        len: {
          args: [3, 3],
          msg: 'Currency code must be 3 characters',
        },
      },
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['floor_id', 'room_number'],
        name: 'unique_floor_room_number',
      },
      {
        fields: ['floor_id'],
        name: 'idx_room_floor_id',
      },
      {
        fields: ['room_type'],
        name: 'idx_room_type',
      },
      {
        fields: ['status'],
        name: 'idx_room_status',
      },
    ],
    validate: {
      coordinatesWithinBounds() {
        const x = Number(this.xCoordinate);
        const y = Number(this.yCoordinate);
        const width = Number(this.width);
        const height = Number(this.height);

        if (x + width > 1.0) {
          throw new Error('Room extends beyond right edge of image (x + width > 1.0)');
        }
        if (y + height > 1.0) {
          throw new Error('Room extends beyond bottom edge of image (y + height > 1.0)');
        }
      },
    },
  },
);

export default Room;