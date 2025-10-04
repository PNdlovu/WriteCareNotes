import { EventEmitter2 } from "eventemitter2";

import { config } from 'dotenv';
import Redis from 'ioredis';

config();

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  family: number;
  enableReadyCheck: boolean;
  maxLoadingTimeout: number;
  keyPrefix: string;
  connectTimeout: number;
  commandTimeout: number;
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
export const redisConfig: RedisConfig = {
  host: process.env['REDIS_HOST'] || 'localhost',
  port: parseInt(process.env['REDIS_PORT'] || '6379'),
  password: process.env['REDIS_PASSWORD'],
  db: parseInt(process.env['REDIS_DB'] || '0'),
  retryDelayOnFailover: parseInt(process.env['REDIS_RETRY_DELAY'] || '100'),
  maxRetriesPerRequest: parseInt(process.env['REDIS_MAX_RETRIES'] || '3'),
  lazyConnect: process.env['REDIS_LAZY_CONNECT'] === 'true',
  keepAlive: parseInt(process.env['REDIS_KEEP_ALIVE'] || '30000'),
  family: parseInt(process.env['REDIS_FAMILY'] || '4'),
  enableReadyCheck: process.env['REDIS_ENABLE_READY_CHECK'] !== 'false',
  maxLoadingTimeout: parseInt(process.env['REDIS_MAX_LOADING_TIMEOUT'] || '5000'),
  keyPrefix: process.env['REDIS_KEY_PREFIX'] || 'carehome:',
  connectTimeout: parseInt(process.env['REDIS_CONNECT_TIMEOUT'] || '10000'),
  commandTimeout: parseInt(process.env['REDIS_COMMAND_TIMEOUT'] || '5000')
};

export class RedisConnection {
  private static instance: Redis;

  static getInstance(): Redis {
    if (!this.instance) {
      this.instance = new Redis(redisConfig);
      
      this.instance.on('connect', () => {
        console.log('Redis connected successfully');
      });
      
      this.instance.on('error', (error) => {
        console.error('Redis connection error:', error);
      });
      
      this.instance.on('close', () => {
        console.log('Redis connection closed');
      });
    }
    
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.disconnect();
      this.instance = null as any;
    }
  }

  static async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.instance.ping();
      return {
        status: 'healthy',
        latency: Date.now() - start
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        latency: Date.now() - start
      };
    }
  }
}

export default RedisConnection;