import sequelize from '../config/database';
import Hotel from './Hotel';
import Floor from './Floor';
import Room from './Room';

// Define associations
// Hotel -> Floors (One to Many)
Hotel.hasMany(Floor, {
  foreignKey: 'hotelId',
  as: 'floors',
  onDelete: 'CASCADE',
  hooks: true,
});

Floor.belongsTo(Hotel, {
  foreignKey: 'hotelId',
  as: 'hotel',
});

// Floor -> Rooms (One to Many)
Floor.hasMany(Room, {
  foreignKey: 'floorId',
  as: 'rooms',
  onDelete: 'CASCADE',
  hooks: true,
});

Room.belongsTo(Floor, {
  foreignKey: 'floorId',
  as: 'floor',
});

// Export models and database instance
export { sequelize, Hotel, Floor, Room };

// Export types
export type { HotelAttributes, HotelCreationAttributes } from './Hotel';
export type { FloorAttributes, FloorCreationAttributes } from './Floor';
export type {
  RoomAttributes,
  RoomCreationAttributes,
  NormalizedCoordinates,
  RoomType,
  BedType,
  RoomStatus,
} from './Room';

// Initialize database connection
export const initDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if we're using SQLite and sync models if needed
    const dialect = sequelize.getDialect();
    if (dialect === 'sqlite') {
      console.log('SQLite detected - creating tables if not exist...');
      await sequelize.sync({ force: false });
      console.log('Database schema synchronized for SQLite.');
    } else {
      // Don't sync models for PostgreSQL since tables already exist
      console.log('Using existing database schema.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default {
  sequelize,
  Hotel,
  Floor,
  Room,
  initDatabase,
};