/**
 * @fileoverview Unit tests for DataMigrationService
 * @module DataMigrationService.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { DataMigrationService, MigrationConfig, MigrationResult } from '../DataMigrationService';
import { Pool, PoolClient } from 'pg';
import { EncryptionService } from '../../../utils/encryption';
import { AuditService } from '../../audit/AuditService';
import { EventStoreService } from '../../event-store/EventStoreService';

// Mock dependencies
jest.mock('pg');
jest.mock('../../../utils/encryption');
jest.mock('../../audit/AuditService');
jest.mock('../../event-store/EventStoreService');
jest.mock('../../../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('DataMigrationService', () => {
  let migrationService: DataMigrationService;
  let mockConfig: MigrationConfig;
  let mockSourcePool: jest.Mocked<Pool>;
  let mockTargetPool: jest.Mocked<Pool>;
  let mockSourceClient: jest.Mocked<PoolClient>;
  let mockTargetClient: jest.Mocked<PoolClient>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockEventStoreService: jest.Mocked<EventStoreService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock configuration
    mockConfig = {
      sourceDatabase: {
        host: 'localhost',
        port: 5432,
        database: 'source_db',
        username: 'user',
        password: 'pass'
      },
      targetDatabases: {
        'resident-service': {
          host: 'localhost',
          port: 5433,
          database: 'resident_db',
          username: 'resident_user',
          password: 'resident_pass'
        }
      },
      batchSize: 100,
      maxRetries: 3,
      retryDelayMs: 1000,
      validationEnabled: true,
      dryRun: false
    };

    // Mock Pool clients
    mockSourceClient = {
      query: jest.fn(),
      release: jest.fn()
    } as any;

    mockTargetClient = {
      query: jest.fn(),
      release: jest.fn()
    } as any;

    // Mock Pools
    mockSourcePool = {
      connect: jest.fn().mockResolvedValue(mockSourceClient),
      end: jest.fn()
    } as any;

    mockTargetPool = {
      connect: jest.fn().mockResolvedValue(mockTargetClient),
      end: jest.fn()
    } as any;

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation((config) => {
      if (config.database === 'source_db') {
        return mockSourcePool;
      } else {
        return mockTargetPool;
      }
    });

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

    // Mock EventStoreService
    mockEventStoreService = {
      appendEvent: jest.fn()
    } as any;

    (EventStoreService as jest.MockedClass<typeof EventStoreService>).mockImplementation(() => mockEventStoreService);

    migrationService = new DataMigrationService(mockConfig);
  });

  describe('const ructor', () => {
    it('should initialize with correct configuration', () => {
      expect(Pool).toHaveBeenCalledTimes(2); // Source + 1 target
      expect(mockAuditService).toBeDefined();
      expect(mockEncryptionService).toBeDefined();
      expect(mockEventStoreService).toBeDefined();
    });
  });

  describe('executeMigration', () => {
    it('should execute complete migration successfully', async () => {
      // Mock database responses
      mockSourceClient.query
        .mockResolvedValueOnce({ rows: [{ count: '10' }] }) // Count query
        .mockResolvedValueOnce({ // Data query
          rows: [
            {
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              nhs_number: '1234567890',
              date_of_birth: '1950-01-01',
              care_level: 'residential'
            }
          ]
        });

      mockTargetClient.query.mockResolvedValue({ rows: [] });

      const results = await migrationService.executeMigration();

      expect(results).toHaveLength(2); // 2 tables in resident service
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MIGRATION_STARTED'
        })
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MIGRATION_COMPLETED'
        })
      );
    });

    it('should handle migration failures gracefully', async () => {
      mockSourceClient.query.mockRejectedValue(new Error('Database connection failed'));

      await expect(migrationService.executeMigration()).rejects.toThrow('Database connection failed');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MIGRATION_FAILED'
        })
      );
    });
  });

  describe('migrateTable', () => {
    it('should migrate table data with transformations', async () => {
      const tableConfig = {
        sourceTable: 'residents',
        targetTable: 'residents',
        containsPII: true,
        healthcareContext: 'resident-management',
        retentionYears: 7,
        transformationRules: [
          {
            sourceColumn: 'id',
            targetColumn: 'resident_id',
            transformation: (value: any) => value,
            required: true
          },
          {
            sourceColumn: 'first_name',
            targetColumn: 'first_name',
            transformation: (value: any) => value?.trim(),
            required: true
          }
        ],
        validationRules: [
          {
            column: 'first_name',
            rule: 'required' as const,
            errorMessage: 'First name is required'
          }
        ]
      };

      // Mock count query
      mockSourceClient.query
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({
          rows: [
            { id: 1, first_name: 'John', last_name: 'Doe' },
            { id: 2, first_name: 'Jane', last_name: 'Smith' }
          ]
        });

      mockTargetClient.query.mockResolvedValue({ rows: [] });
      mockEncryptionService.encrypt.mockResolvedValue('encrypted_value');

      const result = await (migrationService as any).migrateTable(
        tableConfig,
        mockTargetPool,
        'resident-service'
      );

      expect(result.status).toBe('completed');
      expect(result.totalRecords).toBe(2);
      expect(result.migratedRecords).toBe(2);
      expect(result.failedRecords).toBe(0);
      expect(mockEventStoreService.appendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'TableMigrationCompleted'
        })
      );
    });

    it('should handle validation errors', async () => {
      const tableConfig = {
        sourceTable: 'residents',
        targetTable: 'residents',
        containsPII: false,
        healthcareContext: 'resident-management',
        retentionYears: 7,
        transformationRules: [
          {
            sourceColumn: 'id',
            targetColumn: 'resident_id',
            transformation: (value: any) => value,
            required: true
          },
          {
            sourceColumn: 'first_name',
            targetColumn: 'first_name',
            transformation: (value: any) => value?.trim(),
            required: true
          }
        ],
        validationRules: [
          {
            column: 'first_name',
            rule: 'required' as const,
            errorMessage: 'First name is required'
          }
        ]
      };

      // Mock data with validation error (missing first_name)
      mockSourceClient.query
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({
          rows: [{ id: 1, first_name: null, last_name: 'Doe' }]
        });

      mockTargetClient.query.mockResolvedValue({ rows: [] });

      const result = await (migrationService as any).migrateTable(
        tableConfig,
        mockTargetPool,
        'resident-service'
      );

      expect(result.status).toBe('partial');
      expect(result.failedRecords).toBe(1);
      expect(result.validationErrors).toContain('first_name: First name is required');
    });
  });

  describe('transformRecord', () => {
    it('should transform record according to rules', () => {
      const sourceRecord = {
        id: 1,
        first_name: '  John  ',
        last_name: 'Doe',
        nhs_number: '123 456 7890'
      };

      const transformationRules = [
        {
          sourceColumn: 'id',
          targetColumn: 'resident_id',
          transformation: (value: any) => value,
          required: true
        },
        {
          sourceColumn: 'first_name',
          targetColumn: 'first_name',
          transformation: (value: any) => value?.trim(),
          required: true
        },
        {
          sourceColumn: 'nhs_number',
          targetColumn: 'nhs_number',
          transformation: (value: any) => value?.replace(/\s/g, ''),
          required: true
        }
      ];

      const result = (migrationService as any).transformRecord(sourceRecord, transformationRules);

      expect(result.resident_id).toBe(1);
      expect(result.first_name).toBe('John');
      expect(result.nhs_number).toBe('1234567890');
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.migration_source).toBe('monolith');
    });

    it('should throw error for missing required fields', () => {
      const sourceRecord = {
        id: 1,
        last_name: 'Doe'
      };

      const transformationRules = [
        {
          sourceColumn: 'first_name',
          targetColumn: 'first_name',
          transformation: (value: any) => value,
          required: true
        }
      ];

      expect(() => {
        (migrationService as any).transformRecord(sourceRecord, transformationRules);
      }).toThrow('Required field first_name is missing or null');
    });
  });

  describe('validateRecord', () => {
    it('should validate required fields', () => {
      const record = { first_name: 'John', last_name: '' };
      const validationRules = [
        {
          column: 'first_name',
          rule: 'required' as const,
          errorMessage: 'First name is required'
        },
        {
          column: 'last_name',
          rule: 'required' as const,
          errorMessage: 'Last name is required'
        }
      ];

      const result = (migrationService as any).validateRecord(record, validationRules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('last_name: Last name is required');
      expect(result.errors).not.toContain('first_name: First name is required');
    });

    it('should validate NHS numbers', () => {
      const record = { nhs_number: '1234567890' };
      const validationRules = [
        {
          column: 'nhs_number',
          rule: 'nhs_number' as const,
          errorMessage: 'Invalid NHS number'
        }
      ];

      const result = (migrationService as any).validateRecord(record, validationRules);

      expect(result.isValid).toBe(true);
    });

    it('should validate email addresses', () => {
      const record = { email: 'invalid-email' };
      const validationRules = [
        {
          column: 'email',
          rule: 'email' as const,
          errorMessage: 'Invalid email format'
        }
      ];

      const result = (migrationService as any).validateRecord(record, validationRules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email: Invalid email format');
    });

    it('should validate custom rules', () => {
      const record = { age: -5 };
      const validationRules = [
        {
          column: 'age',
          rule: 'custom' as const,
          customValidator: (value: any) => value > 0,
          errorMessage: 'Age must be positive'
        }
      ];

      const result = (migrationService as any).validateRecord(record, validationRules);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('age: Age must be positive');
    });
  });

  describe('validateNHSNumber', () => {
    it('should validate correct NHS numbers', () => {
      const validNHSNumbers = ['9434765919', '9434765870'];
      
      for (const nhsNumber of validNHSNumbers) {
        const result = (migrationService as any).validateNHSNumber(nhsNumber);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid NHS numbers', () => {
      const invalidNHSNumbers = ['123456789', '12345678901', 'abcdefghij', '9434765918'];
      
      for (const nhsNumber of invalidNHSNumbers) {
        const result = (migrationService as any).validateNHSNumber(nhsNumber);
        expect(result).toBe(false);
      }
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'admin+test@site.org'];
      
      for (const email of validEmails) {
        const result = (migrationService as any).validateEmail(email);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = ['invalid', '@domain.com', 'user@', 'user@domain', 'user name@domain.com'];
      
      for (const email of invalidEmails) {
        const result = (migrationService as any).validateEmail(email);
        expect(result).toBe(false);
      }
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate UK phone numbers', () => {
      const validPhones = ['+441234567890', '01234567890', '+447123456789', '07123456789'];
      
      for (const phone of validPhones) {
        const result = (migrationService as any).validatePhoneNumber(phone);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = ['123', '+1234567890', '001234567890', '+44012345678'];
      
      for (const phone of invalidPhones) {
        const result = (migrationService as any).validatePhoneNumber(phone);
        expect(result).toBe(false);
      }
    });
  });

  describe('getMigrationProgress', () => {
    it('should return current migration progress', () => {
      const progress = migrationService.getMigrationProgress();

      expect(progress).toEqual(
        expect.objectContaining({
          totalPhases: expect.any(Number),
          currentPhase: expect.any(Number),
          totalTables: expect.any(Number),
          completedTables: expect.any(Number),
          totalRecords: expect.any(Number),
          migratedRecords: expect.any(Number),
          startTime: expect.any(Date),
          status: expect.any(String)
        })
      );
    });

    it('should calculate estimated completion time when in progress', () => {
      // Simulate migration in progress
      (migrationService as any).progress.status = 'in_progress';
      (migrationService as any).progress.totalRecords = 1000;
      (migrationService as any).progress.migratedRecords = 500;
      (migrationService as any).progress.startTime = new Date(Date.now() - 60000); // 1 minute ago

      const progress = migrationService.getMigrationProgress();

      expect(progress.estimatedCompletion).toBeInstanceOf(Date);
    });
  });

  describe('rollbackService', () => {
    it('should rollback service migration', async () => {
      mockTargetClient.query.mockResolvedValue({ rows: [] });

      await migrationService.rollbackService('resident-service');

      expect(mockTargetClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockTargetClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MIGRATION_ROLLBACK'
        })
      );
    });

    it('should handle rollback failures', async () => {
      mockTargetClient.query.mockRejectedValue(new Error('Rollback failed'));

      await expect(migrationService.rollbackService('resident-service')).rejects.toThrow('Rollback failed');

      expect(mockTargetClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('shutdown', () => {
    it('should close all database connections', async () => {
      await migrationService.shutdown();

      expect(mockSourcePool.end).toHaveBeenCalled();
      expect(mockTargetPool.end).toHaveBeenCalled();
    });
  });
});
