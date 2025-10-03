/**
 * @fileoverview Unit tests for CacheService
 * @module CacheService.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { CacheService, CacheOptions } from '../CacheService';
import { EncryptionService } from '../../../utils/encryption';
import { AuditService } from '../../audit/AuditService';
import Redis from 'ioredis';

// Mock dependencies
jest.mock('ioredis');
jest.mock('../../../utils/encryption');
jest.mock('../../audit/AuditService');
jest.mock('../../../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: jest.Mocked<Redis.Cluster>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Redis cluster
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      smembers: jest.fn(),
      sadd: jest.fn(),
      expire: jest.fn(),
      ttl: jest.fn(),
      ping: jest.fn(),
      info: jest.fn(),
      on: jest.fn(),
      quit: jest.fn()
    } as any;

    (Redis.Cluster as jest.MockedClass<typeof Redis.Cluster>).mockImplementation(() => mockRedis);

    // Mock EncryptionService
    mockEncryptionService = {
      encrypt: jest.fn(),
      decrypt: jest.fn()
    } as any;

    (EncryptionService as jest.MockedClass<typeof EncryptionService>).mockImplementation(() => mockEncryptionService);

    // Mock AuditService
    mockAuditService = {
      log: jest.fn()
    } as any;

    (AuditService as jest.MockedClass<typeof AuditService>).mockImplementation(() => mockAuditService);

    cacheService = new CacheService();
  });

  describe('get', () => {
    it('should return cached value when key exists', async () => {
      const testKey = 'test:key';
      const testValue = { id: '123', name: 'Test' };
      
      mockRedis.get.mockResolvedValue(JSON.stringify(testValue));

      const result = await cacheService.get(testKey);

      expect(result).toEqual(testValue);
      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_HIT',
          resourceId: testKey
        })
      );
    });

    it('should return null when key does not exist', async () => {
      const testKey = 'nonexistent:key';
      
      mockRedis.get.mockResolvedValue(null);

      const result = await cacheService.get(testKey);

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith(testKey);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_MISS',
          resourceId: testKey
        })
      );
    });

    it('should decrypt encrypted values', async () => {
      const testKey = 'encrypted:key';
      const encryptedValue = {
        _encrypted: true,
        data: 'encrypted-data'
      };
      const decryptedValue = { id: '123', sensitive: 'data' };
      
      mockRedis.get.mockResolvedValue(JSON.stringify(encryptedValue));
      mockEncryptionService.decrypt.mockResolvedValue(JSON.stringify(decryptedValue));

      const result = await cacheService.get(testKey, { encrypt: true });

      expect(result).toEqual(decryptedValue);
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted-data');
    });

    it('should handle Redis errors gracefully', async () => {
      const testKey = 'error:key';
      
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cacheService.get(testKey);

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with TTL', async () => {
      const testKey = 'test:key';
      const testValue = { id: '123', name: 'Test' };
      const ttl = 3600;
      
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.set(testKey, testValue, ttl);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(testKey, ttl, JSON.stringify(testValue));
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_SET',
          resourceId: testKey
        })
      );
    });

    it('should encrypt PII data', async () => {
      const testKey = 'pii:key';
      const testValue = { firstName: 'John', lastName: 'Doe' };
      const ttl = 3600;
      const options: CacheOptions = { containsPII: true };
      
      mockEncryptionService.encrypt.mockResolvedValue('encrypted-data');
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.set(testKey, testValue, ttl, options);

      expect(result).toBe(true);
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(JSON.stringify(testValue));
      expect(mockRedis.setex).toHaveBeenCalledWith(
        testKey, 
        ttl, 
        expect.stringContaining('encrypted-data')
      );
    });

    it('should handle tags for invalidation', async () => {
      const testKey = 'tagged:key';
      const testValue = { id: '123' };
      const ttl = 3600;
      const options: CacheOptions = { tags: ['resident', 'personal-data'] };
      
      mockRedis.setex.mockResolvedValue('OK');
      mockRedis.sadd.mockResolvedValue(1);
      mockRedis.expire.mockResolvedValue(1);

      const result = await cacheService.set(testKey, testValue, ttl, options);

      expect(result).toBe(true);
      expect(mockRedis.sadd).toHaveBeenCalledWith('tag:resident', testKey);
      expect(mockRedis.sadd).toHaveBeenCalledWith('tag:personal-data', testKey);
      expect(mockRedis.expire).toHaveBeenCalledWith('tag:resident', ttl + 300);
      expect(mockRedis.expire).toHaveBeenCalledWith('tag:personal-data', ttl + 300);
    });

    it('should handle Redis errors gracefully', async () => {
      const testKey = 'error:key';
      const testValue = { id: '123' };
      
      mockRedis.setex.mockRejectedValue(new Error('Redis connection failed'));

      const result = await cacheService.set(testKey, testValue);

      expect(result).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete key successfully', async () => {
      const testKey = 'test:key';
      
      mockRedis.del.mockResolvedValue(1);

      const result = await cacheService.delete(testKey);

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith(testKey);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_DELETE',
          resourceId: testKey
        })
      );
    });

    it('should return false when key does not exist', async () => {
      const testKey = 'nonexistent:key';
      
      mockRedis.del.mockResolvedValue(0);

      const result = await cacheService.delete(testKey);

      expect(result).toBe(false);
    });
  });

  describe('invalidateByPattern', () => {
    it('should invalidate keys matching pattern', async () => {
      const pattern = 'resident:*';
      const matchingKeys = ['resident:123', 'resident:456'];
      
      mockRedis.keys.mockResolvedValue(matchingKeys);
      mockRedis.del.mockResolvedValue(2);

      const result = await cacheService.invalidateByPattern(pattern);

      expect(result).toBe(2);
      expect(mockRedis.keys).toHaveBeenCalledWith(pattern);
      expect(mockRedis.del).toHaveBeenCalledWith(...matchingKeys);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_INVALIDATE_PATTERN',
          resourceId: pattern
        })
      );
    });

    it('should return 0 when no keys match pattern', async () => {
      const pattern = 'nonexistent:*';
      
      mockRedis.keys.mockResolvedValue([]);

      const result = await cacheService.invalidateByPattern(pattern);

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });
  });

  describe('invalidateByTags', () => {
    it('should invalidate keys with specified tags', async () => {
      const tags = ['resident', 'personal-data'];
      const residentKeys = ['resident:123', 'resident:456'];
      const personalDataKeys = ['resident:123', 'profile:789'];
      
      mockRedis.smembers
        .mockResolvedValueOnce(residentKeys)
        .mockResolvedValueOnce(personalDataKeys);
      mockRedis.del.mockResolvedValue(3);

      const result = await cacheService.invalidateByTags(tags);

      expect(result).toBe(3);
      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:resident');
      expect(mockRedis.smembers).toHaveBeenCalledWith('tag:personal-data');
      expect(mockRedis.del).toHaveBeenCalledWith('resident:123', 'resident:456', 'profile:789');
    });
  });

  describe('warmCache', () => {
    it('should warm cache with provided data', async () => {
      const warmData = [
        { key: 'warm:1', value: { id: '1' }, ttl: 3600 },
        { key: 'warm:2', value: { id: '2' }, ttl: 1800 }
      ];
      
      mockRedis.setex.mockResolvedValue('OK');

      const result = await cacheService.warmCache(warmData);

      expect(result).toBe(2);
      expect(mockRedis.setex).toHaveBeenCalledTimes(2);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_WARM'
        })
      );
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      const mockInfo = 'keyspace_hits:100\r\nkeyspace_misses:20\r\n';
      const mockMemory = 'used_memory:1048576\r\n';
      const mockClients = 'connected_clients:5\r\n';
      
      mockRedis.info
        .mockResolvedValueOnce(mockInfo)
        .mockResolvedValueOnce(mockMemory)
        .mockResolvedValueOnce(mockClients);

      const stats = await cacheService.getStats();

      expect(stats).toEqual(
        expect.objectContaining({
          keyspaceHits: 100,
          keyspaceMisses: 20,
          memoryUsage: 1048576,
          connectedClients: 5
        })
      );
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status when Redis is responsive', async () => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info
        .mockResolvedValueOnce('keyspace_hits:100\r\n')
        .mockResolvedValueOnce('used_memory:1048576\r\n')
        .mockResolvedValueOnce('connected_clients:5\r\n');

      const health = await cacheService.checkHealth();

      expect(health.status).toBe('healthy');
      expect(health.details).toEqual(
        expect.objectContaining({
          responseTime: expect.any(Number),
          connectedClients: 5
        })
      );
    });

    it('should return unhealthy status when Redis is not responsive', async () => {
      mockRedis.ping.mockRejectedValue(new Error('Connection failed'));

      const health = await cacheService.checkHealth();

      expect(health.status).toBe('unhealthy');
      expect(health.details).toEqual(
        expect.objectContaining({
          error: 'Connection failed'
        })
      );
    });
  });

  describe('shutdown', () => {
    it('should gracefully shutdown Redis connection', async () => {
      mockRedis.quit.mockResolvedValue('OK');

      await cacheService.shutdown();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});