/**
 * Graceful Shutdown Handler
 * Ensures proper cleanup of connections and resources during shutdown
 */

import { Server } from 'http';
import { Connection } from 'typeorm';
import { logger } from '../utils/logger';

// Type placeholder for Redis (install ioredis if needed)
type Redis = any;

interface ShutdownOptions {
  timeout?: number; // Maximum time to wait for shutdown (ms)
  signals?: string[]; // Signals to listen for
}

export class GracefulShutdown {
  private isShuttingDown = false;
  private readonly timeout: number;
  private readonly signals: string[];
  private readonly cleanupHandlers: Array<() => Promise<void>> = [];

  constructor(options: ShutdownOptions = {}) {
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.signals = options.signals || ['SIGTERM', 'SIGINT'];
  }

  /**
   * Register a cleanup handler
   */
  public registerCleanupHandler(handler: () => Promise<void>): void {
    this.cleanupHandlers.push(handler);
  }

  /**
   * Initialize graceful shutdown listeners
   */
  public listen(
    httpServer: Server,
    dbConnection: Connection,
    redisClient?: Redis
  ): void {
    this.signals.forEach(signal => {
      process.on(signal, async () => {
        await this.shutdown(httpServer, dbConnection, redisClient, signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error: Error) => {
      logger.error('Uncaught Exception:', error);
      await this.shutdown(httpServer, dbConnection, redisClient, 'uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason: any) => {
      logger.error('Unhandled Rejection:', reason);
      await this.shutdown(httpServer, dbConnection, redisClient, 'unhandledRejection');
    });

    logger.info('Graceful shutdown handlers registered', {
      signals: this.signals,
      timeout: `${this.timeout}ms`
    });
  }

  /**
   * Perform graceful shutdown
   */
  private async shutdown(
    httpServer: Server,
    dbConnection: Connection,
    redisClient: Redis | undefined,
    trigger: string
  ): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress, ignoring duplicate signal');
      return;
    }

    this.isShuttingDown = true;
    logger.info(`Graceful shutdown initiated by ${trigger}`);

    // Set a timeout to force exit if shutdown takes too long
    const forceExitTimer = setTimeout(() => {
      logger.error(`Shutdown timeout exceeded (${this.timeout}ms), forcing exit`);
      process.exit(1);
    }, this.timeout);

    try {
      // Step 1: Stop accepting new connections
      logger.info('Step 1: Stopping new connections...');
      await this.closeHttpServer(httpServer);

      // Step 2: Execute custom cleanup handlers
      logger.info('Step 2: Running custom cleanup handlers...');
      await this.runCleanupHandlers();

      // Step 3: Close Redis connection
      if (redisClient) {
        logger.info('Step 3: Closing Redis connection...');
        await this.closeRedis(redisClient);
      }

      // Step 4: Close database connection
      logger.info('Step 4: Closing database connection...');
      await this.closeDatabase(dbConnection);

      // Step 5: Clear timers
      clearTimeout(forceExitTimer);

      logger.info('✓ Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      clearTimeout(forceExitTimer);
      process.exit(1);
    }
  }

  /**
   * Close HTTP server and drain connections
   */
  private async closeHttpServer(server: Server): Promise<void> {
    return new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err);
          reject(err);
        } else {
          logger.info('✓ HTTP server closed');
          resolve();
        }
      });

      // Track active connections
      const connections = new Set<any>();
      
      server.on('connection', (conn) => {
        connections.add(conn);
        conn.on('close', () => connections.delete(conn));
      });

      // After 5 seconds, forcefully close remaining connections
      setTimeout(() => {
        logger.info(`Forcefully closing ${connections.size} remaining connections`);
        connections.forEach(conn => conn.destroy());
      }, 5000);
    });
  }

  /**
   * Close database connection
   */
  private async closeDatabase(connection: Connection): Promise<void> {
    if (!connection.isConnected) {
      logger.info('Database already disconnected');
      return;
    }

    try {
      await connection.close();
      logger.info('✓ Database connection closed');
    } catch (error) {
      logger.error('Error closing database connection:', error);
      throw error;
    }
  }

  /**
   * Close Redis connection
   */
  private async closeRedis(client: Redis): Promise<void> {
    try {
      await client.quit();
      logger.info('✓ Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
      // Force disconnect if quit fails
      client.disconnect();
    }
  }

  /**
   * Run all registered cleanup handlers
   */
  private async runCleanupHandlers(): Promise<void> {
    for (const handler of this.cleanupHandlers) {
      try {
        await handler();
      } catch (error) {
        logger.error('Error in cleanup handler:', error);
      }
    }
    logger.info(`✓ Executed ${this.cleanupHandlers.length} cleanup handlers`);
  }
}

/**
 * Default graceful shutdown instance
 */
export const gracefulShutdown = new GracefulShutdown({
  timeout: 30000, // 30 seconds
  signals: ['SIGTERM', 'SIGINT', 'SIGUSR2']
});
