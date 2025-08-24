import {
  Model,
  DataTypes,
  Optional,
  BelongsToGetAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  Association,
} from 'sequelize';
import sequelize from '../config/database';
import type { Hotel } from './Hotel';
import type { Room } from './Room';

// Floor attributes interface
export interface FloorAttributes {
  id: string;
  hotelId: string;
  floorNumber: number;
  name: string;
  displayOrder?: number;
  totalRooms?: number;
  floorAreaSqm?: number | null;
  status: 'active' | 'inactive' | 'maintenance';
  notes?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes
export interface FloorCreationAttributes
  extends Optional<
    FloorAttributes,
    'id' | 'displayOrder' | 'totalRooms' | 'floorAreaSqm' | 'status' | 'notes' | 'createdAt' | 'updatedAt'
  > {}

// Floor model class
export class Floor
  extends Model<FloorAttributes, FloorCreationAttributes>
  implements FloorAttributes
{
  public id!: string;
  public hotelId!: string;
  public floorNumber!: number;
  public name!: string;
  public displayOrder!: number;
  public totalRooms!: number;
  public floorAreaSqm!: number | null;
  public status!: 'active' | 'inactive' | 'maintenance';
  public notes!: string | null;

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getHotel!: BelongsToGetAssociationMixin<Hotel>;
  public getRooms!: HasManyGetAssociationsMixin<Room>;
  public addRoom!: HasManyAddAssociationMixin<Room, string>;
  public countRooms!: HasManyCountAssociationsMixin;
  public createRoom!: HasManyCreateAssociationMixin<Room>;

  public readonly hotel?: Hotel;
  public readonly rooms?: Room[];

  public static associations: {
    hotel: Association<Floor, Hotel>;
    rooms: Association<Floor, Room>;
  };
}

// Initialize the model
Floor.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    hotelId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'hotel_id',
      references: {
        model: 'hotels',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    floorNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'floor_number',
      validate: {
        min: {
          args: [-10],
          msg: 'Floor number cannot be less than -10',
        },
        max: {
          args: [200],
          msg: 'Floor number cannot exceed 200',
        },
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Floor name cannot be empty',
        },
        len: {
          args: [1, 255],
          msg: 'Floor name must be between 1 and 255 characters',
        },
      },
      set(value: string) {
        this.setDataValue('name', value?.trim());
      },
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order',
    },
    totalRooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_rooms',
      validate: {
        min: {
          args: [0],
          msg: 'Total rooms cannot be negative',
        },
      },
    },
    floorAreaSqm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'floor_area_sqm',
      validate: {
        min: {
          args: [0],
          msg: 'Floor area must be positive',
        },
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      defaultValue: 'active',
      allowNull: false,
      validate: {
        isIn: {
          args: [['active', 'inactive', 'maintenance']],
          msg: 'Status must be active, inactive, or maintenance',
        },
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Floor',
    tableName: 'floors',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['hotel_id', 'floor_number'],
        name: 'unique_hotel_floor_number',
      },
      {
        fields: ['hotel_id'],
        name: 'idx_floor_hotel_id',
      },
      {
        fields: ['display_order', 'floor_number'],
        name: 'idx_floor_ordering',
      },
    ],
    hooks: {
      beforeCreate: async (floor: Floor) => {
        // Set display order based on floor number if not provided
        if (floor.displayOrder === undefined || floor.displayOrder === 0) {
          floor.displayOrder = floor.floorNumber;
        }
      },
    },
  },
);

export default Floor;