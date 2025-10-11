import { Pool } from 'pg';
import { AppDataSource } from './typeorm.config';
import { config } from 'dotenv';

// Database configuration
const dbConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432', 10),
  user: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  database: process.env['DB_NAME'] || 'carehome_management',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

config();

// Create PostgreSQL connection pool
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const pool = new Pool(dbConfig);

// Export TypeORM DataSource for entity operations
export { AppDataSource };

// Test database connection
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};

export class DatabaseConnection {
  static async connect(): Promise<void> {
    try {
      await AppDataSource.initialize();
      console.log('Database connection established successfully');
    } catch (error: unknown) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }

  static getRepository<T>(entity: new () => T) {
    return AppDataSource.getRepository(entity) as any;
  }

  static async healthCheck(): Promise<{ status: string; latency: number; details: any }> {
    const start = Date.now();
    try {
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      
      await AppDataSource.query('SELECT 1');
      
      return {
        status: 'healthy',
        latency: Date.now() - start,
        details: {
          type: 'postgres',
          host: process.env['DB_HOST'] || 'localhost',
          port: parseInt(process.env['DB_PORT'] || '5432'),
          database: process.env['DB_NAME'] || 'carehome_management'
        }
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        details: {
          error: error instanceof Error ? error.message : 'Unknown database error'
        }
      };
    }
  }
}

export default DatabaseConnection;