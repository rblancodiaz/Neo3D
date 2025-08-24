import {
  Model,
  DataTypes,
  Optional,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  Association,
} from 'sequelize';
import sequelize from '../config/database';
import slugify from 'slugify';
import type { Floor } from './Floor';

// Hotel attributes interface
export interface HotelAttributes {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  originalImageUrl: string;
  processedImageUrl: string;
  thumbnailUrl: string;
  imageWidth: number;
  imageHeight: number;
  imageAspectRatio?: number;
  totalFloors?: number;
  totalRooms?: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt?: Date;
  updatedAt?: Date;
}

// Creation attributes (id is optional)
export interface HotelCreationAttributes extends Optional<HotelAttributes, 'id' | 'slug' | 'description' | 'imageAspectRatio' | 'totalFloors' | 'totalRooms' | 'status' | 'createdAt' | 'updatedAt'> {}

// Hotel model class
export class Hotel extends Model<HotelAttributes, HotelCreationAttributes> implements HotelAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public originalImageUrl!: string;
  public processedImageUrl!: string;
  public thumbnailUrl!: string;
  public imageWidth!: number;
  public imageHeight!: number;
  public imageAspectRatio!: number;
  public totalFloors!: number;
  public totalRooms!: number;
  public status!: 'active' | 'inactive' | 'draft';

  // Timestamps
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations
  public getFloors!: HasManyGetAssociationsMixin<Floor>;
  public addFloor!: HasManyAddAssociationMixin<Floor, string>;
  public countFloors!: HasManyCountAssociationsMixin;
  public createFloor!: HasManyCreateAssociationMixin<Floor>;

  public readonly floors?: Floor[];

  public static associations: {
    floors: Association<Hotel, Floor>;
  };
}

// Initialize the model
Hotel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Hotel name cannot be empty',
        },
        len: {
          args: [1, 255],
          msg: 'Hotel name must be between 1 and 255 characters',
        },
      },
      set(value: string) {
        this.setDataValue('name', value?.trim());
      },
    },
    slug: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    originalImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'original_image_url',
      validate: {
        notEmpty: {
          msg: 'Original image URL is required',
        },
      },
    },
    processedImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'processed_image_url',
      validate: {
        notEmpty: {
          msg: 'Processed image URL is required',
        },
      },
    },
    thumbnailUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'thumbnail_url',
      validate: {
        notEmpty: {
          msg: 'Thumbnail URL is required',
        },
      },
    },
    imageWidth: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'image_width',
      validate: {
        min: {
          args: [1],
          msg: 'Image width must be positive',
        },
        max: {
          args: [10000],
          msg: 'Image width cannot exceed 10000 pixels',
        },
      },
    },
    imageHeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'image_height',
      validate: {
        min: {
          args: [1],
          msg: 'Image height must be positive',
        },
        max: {
          args: [10000],
          msg: 'Image height cannot exceed 10000 pixels',
        },
      },
    },
    imageAspectRatio: {
      type: DataTypes.DECIMAL(10, 6),
      field: 'image_aspect_ratio',
      get() {
        const width = this.getDataValue('imageWidth');
        const height = this.getDataValue('imageHeight');
        if (width && height) {
          return Number((width / height).toFixed(6));
        }
        return null;
      },
    },
    totalFloors: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_floors',
      validate: {
        min: 0,
      },
    },
    totalRooms: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'total_rooms',
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'draft'),
      defaultValue: 'active',
      allowNull: false,
      validate: {
        isIn: {
          args: [['active', 'inactive', 'draft']],
          msg: 'Status must be active, inactive, or draft',
        },
      },
    },
  },
  {
    sequelize,
    modelName: 'Hotel',
    tableName: 'hotels',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeValidate: (hotel: Hotel) => {
        // Generate slug from name if not provided
        if (!hotel.slug && hotel.name) {
          hotel.slug = slugify(hotel.name, {
            lower: true,
            strict: true,
            replacement: '-',
          });
        }
      },
      beforeCreate: (hotel: Hotel) => {
        // Ensure slug is unique by appending timestamp if needed
        if (hotel.slug) {
          hotel.slug = `${hotel.slug}-${Date.now()}`;
        }
      },
      beforeUpdate: (hotel: Hotel) => {
        // Update slug if name changed
        if (hotel.changed('name') && hotel.name) {
          hotel.slug = slugify(hotel.name, {
            lower: true,
            strict: true,
            replacement: '-',
          });
        }
      },
    },
  },
);

export default Hotel;