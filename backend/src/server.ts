import app from './app';
import { config } from './config/environment';
import { initDatabase } from './models';
import { logInfo, logError } from './utils/logger';
import imageService from './services/imageService';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logInfo(`${signal} received, starting graceful shutdown...`);
  
  // Close database connection
  try {
    const { sequelize } = await import('./models');
    await sequelize.close();
    logInfo('Database connection closed');
  } catch (error) {
    logError(error as Error, { context: 'Database shutdown' });
  }

  process.exit(0);
};

// Start server
const startServer = async () => {
  try {
    // Initialize database
    await initDatabase();
    
    // Start periodic cleanup of temp files
    setInterval(() => {
      imageService.cleanupTempFiles().catch(error => {
        logError(error as Error, { context: 'Temp file cleanup' });
      });
    }, 60 * 60 * 1000); // Run every hour

    // Start server
    const PORT = config.PORT || 3001;
    
    app.listen(PORT, () => {
      logInfo(`Server is running on port ${PORT}`, {
        environment: config.NODE_ENV,
        url: `${config.APP_URL}`,
        apiPrefix: config.API_PREFIX,
      });
      
      console.log(`
========================================
Hotel Room Mapper API
========================================
Environment: ${config.NODE_ENV}
Server URL: ${config.APP_URL}
API Prefix: ${config.API_PREFIX}
Port: ${PORT}
========================================
      `);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logError(error, { context: 'Uncaught Exception' });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logError(new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`), {
        context: 'Unhandled Rejection',
      });
      process.exit(1);
    });

  } catch (error) {
    logError(error as Error, { context: 'Server startup' });
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();