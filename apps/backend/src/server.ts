import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initializeDatabase } from './config/typeorm.config';

// Initialize database before starting server
const startServer = async () => {
  try {
    // Step 1: Initialize TypeORM database connection
    await initializeDatabase();
    logger.info('✅ Database initialized successfully');

    // Step 2: Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔐 Authenticationendpoints: /api/auth/*`);
      logger.info(`🏢 Organizationendpoints: /api/organizations/*`);
      logger.info(`💚 Healthcheck: /api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        // Close database connection
        const { AppDataSource } = await import('./config/typeorm.config');
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('✅ Database connection closed');
        }
        
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      server.close(async () => {
        logger.info('✅ HTTP server closed');
        
        // Close database connection
        const { AppDataSource } = await import('./config/typeorm.config');
        if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
          logger.info('✅ Database connection closed');
        }
        
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    logger.error('❌ Failed to startserver:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default startServer;
