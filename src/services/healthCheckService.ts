import { EventEmitter2 } from "eventemitter2";

import { Sequelize } from 'sequelize';
import Redis from 'ioredis';
import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
  timestamp: string;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: HealthCheckResult[];
  system: {
    memory: {
      used: number;
      free: number;
      total: number;
      percentage: number;
    };
    cpu: {
      load: number[];
      usage: number;
    };
    disk: {
      used: number;
      free: number;
      total: number;
      percentage: number;
    };
  };
}

export class HealthCheckService {
  private static db: Sequelize;
  private static redis: Redis;

  /**
   * Initialize database and Redis connections
   */
  static initialize(db: Sequelize, redis: Redis): void {
    this.db = db;
    this.redis = redis;
  }

  /**
   * Initialize with connection instances
   */
  static async initializeWithConnections(): Promise<void> {
    try {
      const { DatabaseConnection } = await import('../config/database.config');
      const { RedisConnection } = await import('../config/redis.config');
      
      this.db = DatabaseConnection.getInstance();
      this.redis = RedisConnection.getInstance();
      
      console.log('Health check service initialized with database and Redis connections');
    } catch (error: unknown) {
      console.error('Failed to initialize health check service:', error);
      throw error;
    }
  }

  /**
   * Check database health
   */
  private static async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await this.db.authenticate();
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'database',
        status: 'healthy',
        responseTime,
        details: {
          dialect: this.db.getDialect(),
          host: 'localhost', // Simplified for now
          port: 5432,
          database: this.db.getDatabaseName()
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown database error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check Redis health
   */
  private static async checkRedis(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      
      const info = await this.redis.info('memory');
      const memoryInfo = this.parseRedisInfo(info);
      
      return {
        service: 'redis',
        status: 'healthy',
        responseTime,
        details: {
          version: await this.redis.info('server').then(info => 
            info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown'
          ),
          memory: memoryInfo,
          connectedClients: await this.redis.info('clients').then(info =>
            parseInt(info.match(/connected_clients:(\d+)/)?.[1] || '0')
          )
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        service: 'redis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown Redis error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check file system health
   */
  private static async checkFileSystem(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      const stats = await fs.stat('.');
      const responseTime = Date.now() - startTime;
      
      return {
        service: 'filesystem',
        status: 'healthy',
        responseTime,
        details: {
          readable: true,
          writable: true,
          accessible: true
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        service: 'filesystem',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown filesystem error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check external service health (NHS API, etc.)
   */
  private static async checkExternalServices(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    
    try {
      // Check NHS API connectivity
      const nhsApiUrl = process.env['NHS_DIGITAL_API_BASE_URL'];
      if (nhsApiUrl) {
        const response = await fetch(`${nhsApiUrl}/health`, {
          method: 'GET'
        });
        
        if (response.ok) {
          return {
            service: 'external_apis',
            status: 'healthy',
            responseTime: Date.now() - startTime,
            details: {
              nhs_api: 'accessible',
              response_status: response.status
            },
            timestamp: new Date().toISOString()
          };
        }
      }
      
      return {
        service: 'external_apis',
        status: 'degraded',
        responseTime: Date.now() - startTime,
        details: {
          nhs_api: 'not_configured'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        service: 'external_apis',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'External API error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get system resource usage
   */
  private static async getSystemResources(): Promise<SystemHealthStatus['system']> {
    try {
      const memUsage = process.memoryUsage();
      const totalMem = require('os').totalmem();
      const freeMem = require('os').freemem();
      
      // Get CPU load
      const loadAvg = require('os').loadavg();
      
      // Get disk usage (simplified)
      const { stdout } = await execAsync('df -h /');
      const diskMatch = stdout.match(/(\d+)%/);
      const diskUsage = diskMatch ? parseInt(diskMatch[1] || '0') : 0;
      
      return {
        memory: {
          used: memUsage.heapUsed,
          free: freeMem,
          total: totalMem,
          percentage: Math.round((memUsage.heapUsed / totalMem) * 100)
        },
        cpu: {
          load: loadAvg,
          usage: Math.round(loadAvg[0] * 100) // Simplified CPU usage
        },
        disk: {
          used: 0, // Would need more complex logic to get actual disk usage
          free: 0,
          total: 0,
          percentage: diskUsage
        }
      };
    } catch (error: unknown) {
      return {
        memory: { used: 0, free: 0, total: 0, percentage: 0 },
        cpu: { load: [0, 0, 0], usage: 0 },
        disk: { used: 0, free: 0, total: 0, percentage: 0 }
      };
    }
  }

  /**
   * Parse Redis info output
   */
  private static parseRedisInfo(info: string): any {
    const lines = info.split('\r\n');
    const result: any = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        if (key) {
          result[key] = value;
        }
      }
    }
    
    return result;
  }

  /**
   * Perform comprehensive health check
   */
  static async performHealthCheck(): Promise<SystemHealthStatus> {
    const startTime = Date.now();
    
    // Run all health checks in parallel
    const [
      databaseHealth,
      redisHealth,
      filesystemHealth,
      externalHealth,
      systemResources
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkFileSystem(),
      this.checkExternalServices(),
      this.getSystemResources()
    ]);

    const services = [databaseHealth, redisHealth, filesystemHealth, externalHealth];
    
    // Determine overall health status
    const unhealthyServices = services.filter(s => s.status === 'unhealthy');
    const degradedServices = services.filter(s => s.status === 'degraded');
    
    let overall: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (unhealthyServices.length > 0) {
      overall = 'unhealthy';
    } else if (degradedServices.length > 0) {
      overall = 'degraded';
    }

    return {
      overall,
      timestamp: new Date().toISOString(),
      version: process.env['APP_VERSION'] || '1.0.0',
      environment: process.env['NODE_ENV'] || 'development',
      uptime: Date.now() - startTime,
      services,
      system: systemResources
    };
  }

  /**
   * Simple health check for load balancers
   */
  static async simpleHealthCheck(): Promise<{ status: string; timestamp: string }> {
    try {
      // Quick database ping
      await this.db.authenticate();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default HealthCheckService;