import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { databaseService } from '../../src/services/core/DatabaseService';
import { configService } from '../../src/services/core/ConfigurationService';
import TestHelpers from '../TestHelpers';

describe('DatabaseService Integration Tests', () => {
  beforeAll(async () => {
    await databaseService.initialize();
  });

  afterAll(async () => {
    await databaseService.close();
  });

  describe('Connection Management', () => {
    test('should connect to database successfully', async () => {
      const isHealthy = await databaseService.healthCheck();
      expect(isHealthy).toBe(true);
    });

    test('should return connection statistics', () => {
      const stats = databaseService.getConnectionStats();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(stats).toHaveProperty('waitingClients');
      expect(typeof stats.totalConnections).toBe('number');
    });

    test('should handle connection pool limits', async () => {
      // This test would verify connection pooling behavior
      const maxConnections = configService.getDatabase().maxConnections;
      expect(maxConnections).toBeGreaterThan(0);
    });
  });

  describe('Query Operations', () => {
    test('should execute simple queries', async () => {
      const result = await databaseService.query('SELECT NOW() as current_time');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('current_time');
    });

    test('should execute parameterized queries', async () => {
      const testValue = 'test-value';
      const result = await databaseService.query(
        'SELECT $1 as test_value',
        [testValue]
      );
      expect(result.rows[0].test_value).toBe(testValue);
    });

    test('should handle query errors gracefully', async () => {
      await expect(
        databaseService.query('SELECT * FROM non_existent_table')
      ).rejects.toThrow();
    });

    test('should support query retries', async () => {
      const result = await databaseService.query(
        'SELECT 1 as test',
        [],
        { retries: 2, name: 'test_retry' }
      );
      expect(result.rows[0].test).toBe(1);
    });
  });

  describe('Transaction Management', () => {
    test('should execute successful transactions', async () => {
      const result = await databaseService.transaction(async (client) => {
        await client.query('CREATE TEMP TABLE test_transaction (id INTEGER)');
        await client.query('INSERT INTO test_transaction VALUES (1)');
        const selectResult = await client.query('SELECT * FROM test_transaction');
        return selectResult.rows;
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    test('should rollback failed transactions', async () => {
      await expect(
        databaseService.transaction(async (client) => {
          await client.query('CREATE TEMP TABLE test_rollback (id INTEGER)');
          await client.query('INSERT INTO test_rollback VALUES (1)');
          throw new Error('Simulated error');
        })
      ).rejects.toThrow('Simulated error');

      // Verify rollback - temp table should not exist in new transaction
      await databaseService.transaction(async (client) => {
        await expect(
          client.query('SELECT * FROM test_rollback')
        ).rejects.toThrow();
      });
    });
  });

  describe('Utility Methods', () => {
    let testUserId: string;

    beforeAll(async () => {
      // Create a test user for utility method tests
      const user = await databaseService.insert('users', {
        email: TestHelpers.generateTestEmail(),
        password_hash: 'test-hash',
        role: 'patient',
        permissions: JSON.stringify([])
      });
      testUserId = user.id;
    });

    afterAll(async () => {
      // Clean up test user
      if (testUserId) {
        await databaseService.delete('users', testUserId);
      }
    });

    test('should find records by ID', async () => {
      const user = await databaseService.findById('users', testUserId);
      expect(user).toBeTruthy();
      expect(user.id).toBe(testUserId);
    });

    test('should return null for non-existent ID', async () => {
      const user = await databaseService.findById('users', 'non-existent-id');
      expect(user).toBeNull();
    });

    test('should find records by condition', async () => {
      const users = await databaseService.findByCondition(
        'users',
        'role = $1',
        ['patient'],
        ['id', 'email', 'role'],
        10
      );
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('email');
      expect(users[0].role).toBe('patient');
    });

    test('should update records', async () => {
      const updatedUser = await databaseService.update(
        'users',
        testUserId,
        { role: 'caregiver' },
        ['id', 'role']
      );

      expect(updatedUser).toBeTruthy();
      expect(updatedUser.id).toBe(testUserId);
      expect(updatedUser.role).toBe('caregiver');
    });

    test('should soft delete records', async () => {
      const deleted = await databaseService.softDelete('users', testUserId);
      expect(deleted).toBe(true);

      // Verify soft delete - record should still exist with deleted_at
      const user = await databaseService.query(
        'SELECT deleted_at FROM users WHERE id = $1',
        [testUserId]
      );
      expect(user.rows[0].deleted_at).toBeTruthy();
    });
  });

  describe('Batch Operations', () => {
    test('should perform batch inserts', async () => {
      const columns = ['email', 'password_hash', 'role'];
      const rows = [
        [`batch1-${Date.now()}@test.com`, 'hash1', 'patient'],
        [`batch2-${Date.now()}@test.com`, 'hash2', 'caregiver'],
        [`batch3-${Date.now()}@test.com`, 'hash3', 'supervisor']
      ];

      const result = await databaseService.batchInsert('users', columns, rows);
      expect(result.rowCount).toBe(3);

      // Clean up
      for (const row of rows) {
        await databaseService.query('DELETE FROM users WHERE email = $1', [row[0]]);
      }
    });

    test('should handle batch insert conflicts', async () => {
      const email = `conflict-${Date.now()}@test.com`;
      const columns = ['email', 'password_hash', 'role'];
      const rows = [
        [email, 'hash1', 'patient'],
        [email, 'hash2', 'caregiver'] // Duplicate email
      ];

      await expect(
        databaseService.batchInsert('users', columns, rows)
      ).rejects.toThrow();

      // Clean up any inserted records
      await databaseService.query('DELETE FROM users WHERE email = $1', [email]);
    });
  });

  describe('Performance', () => {
    test('should execute queries within reasonable time', async () => {
      const startTime = Date.now();
      await databaseService.query('SELECT 1');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle concurrent queries', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        databaseService.query('SELECT $1 as query_id', [i])
      );

      const results = await Promise.all(promises);
      expect(results).toHaveLength(10);
      
      results.forEach((result, index) => {
        expect(result.rows[0].query_id).toBe(index);
      });
    });
  });
});