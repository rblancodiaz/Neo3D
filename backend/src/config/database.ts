import { Sequelize } from 'sequelize';
import { dbConfig, isDevelopment } from './environment';

// Create Sequelize instance
export const sequelize = new Sequelize({
  ...dbConfig,
  dialectOptions: {
    ssl: false,
    decimalNumbers: true, // Important for coordinate precision
  },
  timezone: '+00:00',
  benchmark: isDevelopment,
});

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Sync database (use with caution in production)
export const syncDatabase = async (force = false): Promise<void> => {
  try {
    await sequelize.sync({ force, alter: !force });
    console.log('Database synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database:', error);
    throw error;
  }
};

// Close database connection
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

export default sequelize;