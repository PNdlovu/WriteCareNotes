import { EventEmitter2 } from "eventemitter2";

import { Sequelize } from 'sequelize';
import { config } from 'dotenv';

config();

export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'postgres' | 'mysql' | 'sqlite' | 'mariadb' | 'mssql';
  logging: boolean;
  pool: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  ssl?: {
    require: boolean;
    rejectUnauthorized: boolean;
    ca?: string;
    key?: string;
    cert?: string;
  };
}

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
export const databaseConfig: DatabaseConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  username: process.env['DB_USERNAME'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  database: process.env['DB_NAME'] || 'carehome_management',
  dialect: 'postgres',
  logging: process.env['NODE_ENV'] === 'development',
  pool: {
    max: parseInt(process.env['DB_POOL_MAX'] || '20'),
    min: parseInt(process.env['DB_POOL_MIN'] || '2'),
    acquire: parseInt(process.env['DB_ACQUIRE_TIMEOUT'] || '60000'),
    idle: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000')
  },
  ssl: process.env['DB_SSL_ENABLED'] === 'true' ? {
    require: true,
    rejectUnauthorized: process.env['DB_SSL_REJECT_UNAUTHORIZED'] !== 'false',
    ca: process.env['DB_SSL_CA'],
    key: process.env['DB_SSL_KEY'],
    cert: process.env['DB_SSL_CERT']
  } : undefined
};

export class DatabaseConnection {
  private static instance: Sequelize;

  static getInstance(): Sequelize {
    if (!this.instance) {
      this.instance = new Sequelize(
        databaseConfig.database,
        databaseConfig.username,
        databaseConfig.password,
        {
          host: databaseConfig.host,
          port: databaseConfig.port,
          dialect: databaseConfig.dialect,
          logging: databaseConfig.logging,
          pool: databaseConfig.pool,
          ssl: databaseConfig.ssl as any,
          define: {
            timestamps: true,
            underscored: true,
            paranoid: true // Soft deletes
          },
          dialectOptions: {
            ssl: databaseConfig.ssl ? {
              require: databaseConfig.ssl.require,
              rejectUnauthorized: databaseConfig.ssl.rejectUnauthorized,
              ca: databaseConfig.ssl.ca,
              key: databaseConfig.ssl.key,
              cert: databaseConfig.ssl.cert
            } : false
          }
        }
      );
    }
    
    return this.instance;
  }

  static async connect(): Promise<void> {
    try {
      const sequelize = this.getInstance();
      await sequelize.authenticate();
      console.log('Database connection established successfully');
    } catch (error: unknown) {
      console.error('Unable to connect to the database:', error);
      throw error;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null as any;
    }
  }

  static async healthCheck(): Promise<{ status: string; latency: number; details: any }> {
    const start = Date.now();
    try {
      const sequelize = this.getInstance();
      await sequelize.authenticate();
      
      // Get database info
      const [results] = await sequelize.query('SELECT version() as version');
      const version = (results as any)[0]?.version || 'unknown';
      
      return {
        status: 'healthy',
        latency: Date.now() - start,
        details: {
          dialect: sequelize.getDialect(),
          host: process.env.DB_HOST || 'localhost',
          port: 5432,
          database: sequelize.getDatabaseName(),
          version
        }
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start,
        details: {
          error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown database error'
        }
      };
    }
  }

  static async syncModels(): Promise<void> {
    try {
      const sequelize = this.getInstance();
      await sequelize.sync({ alter: process.env['NODE_ENV'] === 'development' });
      console.log('Database models synchronized successfully');
    } catch (error: unknown) {
      console.error('Failed to synchronize database models:', error);
      throw error;
    }
  }
}

export default DatabaseConnection;