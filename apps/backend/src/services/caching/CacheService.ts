/**
 * @fileoverview Distributed caching service for WriteCareNotes healthcare system
 * @module CacheService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides comprehensive distributed caching capabilities with healthcare-specific
 * optimizations, data protection, and compliance features. Supports Redis cluster operations,
 * cache invalidation strategies, and healthcare data caching patterns.
 * 
 * @example
 * // Basic usage
 * const cacheService = new CacheService();
 * await cacheService.set('resident:123', residentData, 3600);
 * const resident = await cacheService.get('resident:123');
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements data encryption for PII in cache
 * - Follows GDPR data protection requirements
 * - Includes audit trail for cache operations
 */

import Redis from 'ioredis';
import { Logger } from 'winston';
import { createLogger } from '../../utils/logger';
import { EncryptionService } from '../../utils/encryption';
import { AuditService } from '../audit/AuditService';
import { HealthCheckService } from '../monitoring/HealthCheckService';

export interface CacheOptions {
  ttl?: number;
  compress?: boolean;
  encrypt?: boolean;
  tags?: string[];
  healthcareContext?: string;
  containsPII?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  memoryUsage: number;
  connectedClients: number;
  keyspaceHits: number;
  keyspaceMisses: number;
}

export interface CacheKey {
  key: string;
  type: string;
  ttl: number;
  size: number;
  tags: string[];
  createdAt: Date;
  lastAccessed: Date;
}

export interface CacheInvalidationRule {
  pattern: string;
  tags: string[];
  condition: (key: string, value: any) => boolean;
  healthcareContext?: string;
}

export class CacheService {
  privateredis: Redis.Cluster;
  privatelogger: Logger;
  privateencryptionService: EncryptionService;
  privateauditService: AuditService;
  privatehealthCheckService: HealthCheckService;
  privatestats: CacheStats;
  privateinvalidationRules: Map<string, CacheInvalidationRule>;

  const ructor() {
    this.logger = createLogger('CacheService');
    this.encryptionService = new EncryptionService();
    this.auditService = new AuditService();
    this.healthCheckService = new HealthCheckService();
    this.invalidationRules = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalOperations: 0,
      memoryUsage: 0,
      connectedClients: 0,
      keyspaceHits: 0,
      keyspaceMisses: 0
    };

    this.initializeRedisCluster();
    this.setupInvalidationRules();
    this.startStatsCollection();
  }

  /**
   * Initialize Redis cluster connection with healthcare-specific configuration
   */
  private initializeRedisCluster(): void {
    try {
      const redisNodes = process.env.REDIS_CLUSTER_NODES?.split(',') || [
        'redis-cluster-0.redis-cluster-headless.caching.svc.cluster.local:6379',
        'redis-cluster-1.redis-cluster-headless.caching.svc.cluster.local:6379',
        'redis-cluster-2.redis-cluster-headless.caching.svc.cluster.local:6379',
        'redis-cluster-3.redis-cluster-headless.caching.svc.cluster.local:6379',
        'redis-cluster-4.redis-cluster-headless.caching.svc.cluster.local:6379',
        'redis-cluster-5.redis-cluster-headless.caching.svc.cluster.local:6379'
      ];

      this.redis = new Redis.Cluster(redisNodes, {
        redisOptions: {
          password: process.env.REDIS_PASSWORD,
          connectTimeout: 10000,
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 100,
          enableReadyCheck: true,
          maxLoadingTimeout: 5000
        },
        enableOfflineQueue: false,
        redisOptions: {
          password: process.env.REDIS_PASSWORD
        },
        clusterRetryDelayOnFailover: 100,
        clusterRetryDelayOnClusterDown: 300,
        clusterMaxRedirections: 16,
        scaleReads: 'slave',
        maxRetriesPerRequest: 3
      });

      this.redis.on('connect', () => {
        this.logger.info('Connected to Redis cluster');
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis clustererror:', error);
      });

      this.redis.on('node error', (error, node) => {
        this.logger.error(`Redis node error on ${node.options.host}:${node.options.port}:`, error);
      });

      this.redis.on('ready', () => {
        this.logger.info('Redis cluster ready');
        this.healthCheckService.registerHealthCheck('redis-cluster', this.checkHealth.bind(this));
      });

    } catch (error) {
      this.logger.error('Failed to initialize Rediscluster:', error);
      throw error;
    }
  }

  /**
   * Set up healthcare-specific cache invalidation rules
   */
  private setupInvalidationRules(): void {
    // Resident data invalidation
    this.invalidationRules.set('resident-update', {
      pattern: 'resident:*',
      tags: ['resident', 'care-plan', 'medication'],
      condition: (key: string, value: any) => key.includes('resident:'),
      healthcareContext: 'resident-management'
    });

    // Medication invalidation
    this.invalidationRules.set('medication-update', {
      pattern: 'medication:*',
      tags: ['medication', 'prescription', 'mar'],
      condition: (key: string, value: any) => key.includes('medication:'),
      healthcareContext: 'medication-management'
    });

    // Care plan invalidation
    this.invalidationRules.set('care-plan-update', {
      pattern: 'care-plan:*',
      tags: ['care-plan', 'assessment', 'goals'],
      condition: (key: string, value: any) => key.includes('care-plan:'),
      healthcareContext: 'care-planning'
    });

    // Assessment invalidation
    this.invalidationRules.set('assessment-update', {
      pattern: 'assessment:*',
      tags: ['assessment', 'risk', 'health-record'],
      condition: (key: string, value: any) => key.includes('assessment:'),
      healthcareContext: 'assessment'
    });

    // Staff data invalidation
    this.invalidationRules.set('staff-update', {
      pattern: 'staff:*',
      tags: ['staff', 'schedule', 'training'],
      condition: (key: string, value: any) => key.includes('staff:'),
      healthcareContext: 'hr-management'
    });
  }

  /**
   * Get value from cache with healthcare-specific handling
   */
  async get<T>(key: string, options: Partial<CacheOptions> = {}): Promise<T | null> {
    try {
      const startTime = Date.now();
      const cachedValue = await this.redis.get(key);
      
      if (cachedValue === null) {
        this.stats.misses++;
        this.updateStats();
        
        await this.auditService.log({
          action: 'CACHE_MISS',
          resourceType: 'cache',
          resourceId: key,
          details: { key, healthcareContext: options.healthcareContext },
          timestamp: new Date(),
          userId: 'system',
          correlationId: this.generateCorrelationId()
        });
        
        return null;
      }

      this.stats.hits++;
      this.updateStats();

      let parsedValue: any;
      
      try {
        parsedValue = JSON.parse(cachedValue);
      } catch (parseError) {
        this.logger.warn(`Failed to parse cached value for key ${key}:`, parseError);
        return cachedValue as T;
      }

      // Decrypt if encrypted
      if (parsedValue._encrypted && options.encrypt !== false) {
        try {
          const decryptedData = await this.encryptionService.decrypt(parsedValue.data);
          parsedValue = JSON.parse(decryptedData);
        } catch (decryptError) {
          this.logger.error(`Failed to decrypt cached value for key ${key}:`, decryptError);
          return null;
        }
      }

      // Update last accessed time
      await this.redis.expire(key, await this.redis.ttl(key));

      const duration = Date.now() - startTime;
      this.logger.debug(`Cache hit for key ${key} in ${duration}ms`);

      await this.auditService.log({
        action: 'CACHE_HIT',
        resourceType: 'cache',
        resourceId: key,
        details: { 
          key, 
          duration, 
          healthcareContext: options.healthcareContext,
          containsPII: options.containsPII 
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      return parsedValue;

    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      this.stats.misses++;
      this.updateStats();
      return null;
    }
  }

  /**
   * Set value in cache with healthcare-specific options
   */
  async set(key: string, value: any, ttl: number = 3600, options: CacheOptions = {}): Promise<boolean> {
    try {
      const startTime = Date.now();
      let processedValue = value;

      // Encrypt PII data
      if (options.encrypt || options.containsPII) {
        const encryptedData = await this.encryptionService.encrypt(JSON.stringify(value));
        processedValue = {
          _encrypted: true,
          data: encryptedData,
          _metadata: {
            containsPII: options.containsPII,
            healthcareContext: options.healthcareContext,
            tags: options.tags,
            createdAt: new Date().toISOString()
          }
        };
      }

      const serializedValue = JSON.stringify(processedValue);
      
      // Set with TTL
      const result = await this.redis.setex(key, ttl, serializedValue);
      
      // Add tags for invalidation
      if (options.tags && options.tags.length > 0) {
        const tagPromises = options.tags.map(tag => 
          this.redis.sadd(`tag:${tag}`, key)
        );
        await Promise.all(tagPromises);
        
        // Set TTL for tag sets
        const tagTtlPromises = options.tags.map(tag => 
          this.redis.expire(`tag:${tag}`, ttl + 300) // Tag TTL slightly longer
        );
        await Promise.all(tagTtlPromises);
      }

      const duration = Date.now() - startTime;
      this.logger.debug(`Cache set for key ${key} in ${duration}ms`);

      await this.auditService.log({
        action: 'CACHE_SET',
        resourceType: 'cache',
        resourceId: key,
        details: { 
          key, 
          ttl, 
          duration,
          size: serializedValue.length,
          healthcareContext: options.healthcareContext,
          containsPII: options.containsPII,
          tags: options.tags
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      returnresult === 'OK';

    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string, healthcareContext?: string): Promise<boolean> {
    try {
      const result = await this.redis.del(key);
      
      await this.auditService.log({
        action: 'CACHE_DELETE',
        resourceType: 'cache',
        resourceId: key,
        details: { key, healthcareContext },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      return result > 0;

    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string, healthcareContext?: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      
      await this.auditService.log({
        action: 'CACHE_INVALIDATE_PATTERN',
        resourceType: 'cache',
        resourceId: pattern,
        details: { 
          pattern, 
          keysInvalidated: keys.length,
          healthcareContext 
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      this.logger.info(`Invalidated ${result} keys matchingpattern: ${pattern}`);
      return result;

    } catch (error) {
      this.logger.error(`Cache invalidation error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[], healthcareContext?: string): Promise<number> {
    try {
      let allKeys: string[] = [];
      
      for (const tag of tags) {
        const keys = await this.redis.smembers(`tag:${tag}`);
        allKeys = [...allKeys, ...keys];
      }

      // Remove duplicates
      const uniqueKeys = [...new Set(allKeys)];
      
      if (uniqueKeys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...uniqueKeys);
      
      // Clean up tag sets
      const tagCleanupPromises = tags.map(tag => this.redis.del(`tag:${tag}`));
      await Promise.all(tagCleanupPromises);

      await this.auditService.log({
        action: 'CACHE_INVALIDATE_TAGS',
        resourceType: 'cache',
        resourceId: tags.join(','),
        details: { 
          tags, 
          keysInvalidated: uniqueKeys.length,
          healthcareContext 
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      this.logger.info(`Invalidated ${result} keys fortags: ${tags.join(', ')}`);
      return result;

    } catch (error) {
      this.logger.error(`Cache invalidation error for tags ${tags.join(', ')}:`, error);
      return 0;
    }
  }

  /**
   * Warm cache with preloaded data
   */
  async warmCache(data: Array<{ key: string; value: any; ttl?: number; options?: CacheOptions }>): Promise<number> {
    try {
      let successCount = 0;
      
      const warmPromises = data.map(async (item) => {
        const success = await this.set(item.key, item.value, item.ttl || 3600, item.options || {});
        if (success) successCount++;
        return success;
      });

      await Promise.all(warmPromises);

      await this.auditService.log({
        action: 'CACHE_WARM',
        resourceType: 'cache',
        resourceId: 'bulk-warm',
        details: { 
          totalItems: data.length,
          successfulItems: successCount
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      this.logger.info(`Cache warmed with ${successCount}/${data.length} items`);
      return successCount;

    } catch (error) {
      this.logger.error('Cache warmingerror:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');
      const clients = await this.redis.info('clients');

      // Parse Redis info
      const statsLines = info.split('\r\n');
      const memoryLines = memory.split('\r\n');
      const clientLines = clients.split('\r\n');

      const parseInfo = (lines: string[]) => {
        const result: any = {};
        lines.forEach(line => {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            result[key] = isNaN(Number(value)) ? value : Number(value);
          }
        });
        return result;
      };

      const statsInfo = parseInfo(statsLines);
      const memoryInfo = parseInfo(memoryLines);
      const clientInfo = parseInfo(clientLines);

      this.stats.keyspaceHits = statsInfo.keyspace_hits || 0;
      this.stats.keyspaceMisses = statsInfo.keyspace_misses || 0;
      this.stats.memoryUsage = memoryInfo.used_memory || 0;
      this.stats.connectedClients = clientInfo.connected_clients || 0;
      this.stats.totalOperations = this.stats.hits + this.stats.misses;
      this.stats.hitRate = this.stats.totalOperations > 0 ? 
        (this.stats.hits / this.stats.totalOperations) * 100 : 0;

      return { ...this.stats };

    } catch (error) {
      this.logger.error('Error getting cachestats:', error);
      return this.stats;
    }
  }

  /**
   * Health check for cache service
   */
  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const startTime = Date.now();
      await this.redis.ping();
      const responseTime = Date.now() - startTime;

      const stats = await this.getStats();
      
      const isHealthy = responseTime < 100 && stats.connectedClients > 0;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          responseTime,
          connectedClients: stats.connectedClients,
          memoryUsage: stats.memoryUsage,
          hitRate: stats.hitRate,
          totalOperations: stats.totalOperations
        }
      };

    } catch (error) {
      this.logger.error('Cache health checkfailed:', error);
      return {
        status: 'unhealthy',
        details: { error: error.message }
      };
    }
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.stats.totalOperations = this.stats.hits + this.stats.misses;
    this.stats.hitRate = this.stats.totalOperations > 0 ? 
      (this.stats.hits / this.stats.totalOperations) * 100 : 0;
  }

  /**
   * Start periodic statistics collection
   */
  private startStatsCollection(): void {
    setInterval(async () => {
      try {
        await this.getStats();
      } catch (error) {
        this.logger.error('Error collecting cachestats:', error);
      }
    }, 60000); // Every minute
  }

  /**
   * Generate correlation ID for audit trails
   */
  private generateCorrelationId(): string {
    return `cache-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.info('Cache service shutdown completed');
    } catch (error) {
      this.logger.error('Error during cache serviceshutdown:', error);
    }
  }
}
