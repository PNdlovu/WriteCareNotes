/**
 * @fileoverview Data migration service for WriteCareNotes monolith to microservices transition
 * @module DataMigrationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Provides comprehensive data migration capabilities for transitioning from
 * monolithic database to microservices architecture with healthcare-specific data handling,
 * validation, and compliance requirements.
 * 
 * @example
 * // Basic migration usage
 * const migrationService = new DataMigrationService();
 * await migrationService.migrateResidentData();
 * await migrationService.migrateMedicationData();
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements data encryption during migration
 * - Follows GDPR data protection requirements
 * - Includes comprehensive audit trail for all migrations
 */

import { Pool, PoolClient } from 'pg';
import { Logger } from 'winston';
import { createLogger } from '../../utils/logger';
import { EncryptionService } from '../../utils/encryption';
import { AuditService } from '../audit/AuditService';
import { EventStoreService } from '../event-store/EventStoreService';
import { HealthCheckService } from '../monitoring/HealthCheckService';

export interface MigrationConfig {
  sourceDatabase: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  targetDatabases: {
    [serviceName: string]: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
  };
  batchSize: number;
  maxRetries: number;
  retryDelayMs: number;
  validationEnabled: boolean;
  dryRun: boolean;
}

export interface MigrationResult {
  serviceName: string;
  tableName: string;
  totalRecords: number;
  migratedRecords: number;
  failedRecords: number;
  validationErrors: string[];
  duration: number;
  status: 'completed' | 'failed' | 'partial';
}

export interface MigrationPlan {
  phase: number;
  serviceName: string;
  tables: MigrationTableConfig[];
  dependencies: string[];
  rollbackProcedure: string;
}

export interface MigrationTableConfig {
  sourceTable: string;
  targetTable: string;
  transformationRules: TransformationRule[];
  validationRules: ValidationRule[];
  containsPII: boolean;
  healthcareContext: string;
  retentionYears: number;
}

export interface TransformationRule {
  sourceColumn: string;
  targetColumn: string;
  transformation: (value: any) => any;
  required: boolean;
}

export interface ValidationRule {
  column: string;
  rule: 'required' | 'nhs_number' | 'date' | 'email' | 'phone' | 'custom';
  customValidator?: (value: any) => boolean;
  errorMessage: string;
}

export interface MigrationProgress {
  totalPhases: number;
  currentPhase: number;
  totalTables: number;
  completedTables: number;
  totalRecords: number;
  migratedRecords: number;
  startTime: Date;
  estimatedCompletion?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed' | 'paused';
}

export class DataMigrationService {
  privatelogger: Logger;
  privateencryptionService: EncryptionService;
  privateauditService: AuditService;
  privateeventStoreService: EventStoreService;
  privatehealthCheckService: HealthCheckService;
  privatesourcePool: Pool;
  privatetargetPools: Map<string, Pool>;
  privatemigrationPlans: MigrationPlan[];
  privateprogress: MigrationProgress;

  constructor(private config: MigrationConfig) {
    this.logger = createLogger('DataMigrationService');
    this.encryptionService = new EncryptionService();
    this.auditService = new AuditService();
    this.eventStoreService = new EventStoreService();
    this.healthCheckService = new HealthCheckService();
    this.targetPools = new Map();
    this.migrationPlans = [];
    this.progress = {
      totalPhases: 0,
      currentPhase: 0,
      totalTables: 0,
      completedTables: 0,
      totalRecords: 0,
      migratedRecords: 0,
      startTime: new Date(),
      status: 'not_started'
    };

    this.initializeDatabaseConnections();
    this.initializeMigrationPlans();
  }

  /**
   * Initialize database connections for source and target databases
   */
  private initializeDatabaseConnections(): void {
    try {
      // Initialize source database connection
      this.sourcePool = new Pool({
        host: this.config.sourceDatabase.host,
        port: this.config.sourceDatabase.port,
        database: this.config.sourceDatabase.database,
        user: this.config.sourceDatabase.username,
        password: this.config.sourceDatabase.password,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      // Initialize target database connections
      for (const [serviceName, dbConfig] of Object.entries(this.config.targetDatabases)) {
        const pool = new Pool({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.username,
          password: dbConfig.password,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });
        
        this.targetPools.set(serviceName, pool);
      }

      this.logger.info('Database connections initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize database connections:', error);
      throw error;
    }
  }

  /**
   * Initialize migration plans for all services
   */
  private initializeMigrationPlans(): void {
    this.migrationPlans = [
      // Phase 1: Core Healthcare Services
      {
        phase: 1,
        serviceName: 'resident-service',
        dependencies: [],
        rollbackProcedure: 'DROP_RESIDENT_TABLES',
        tables: [
          {
            sourceTable: 'residents',
            targetTable: 'residents',
            containsPII: true,
            healthcareContext: 'resident-management',
            retentionYears: 7,
            transformationRules: [
              {
                sourceColumn: 'id',
                targetColumn: 'resident_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'first_name',
                targetColumn: 'first_name',
                transformation: (value) => value?.trim(),
                required: true
              },
              {
                sourceColumn: 'last_name',
                targetColumn: 'last_name',
                transformation: (value) => value?.trim(),
                required: true
              },
              {
                sourceColumn: 'nhs_number',
                targetColumn: 'nhs_number',
                transformation: (value) => value?.replace(/\s/g, ''),
                required: true
              },
              {
                sourceColumn: 'date_of_birth',
                targetColumn: 'date_of_birth',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'care_level',
                targetColumn: 'care_level',
                transformation: (value) => value?.toLowerCase(),
                required: true
              }
            ],
            validationRules: [
              {
                column: 'nhs_number',
                rule: 'nhs_number',
                errorMessage: 'Invalid NHS number format'
              },
              {
                column: 'date_of_birth',
                rule: 'date',
                errorMessage: 'Invalid date of birth'
              }
            ]
          },
          {
            sourceTable: 'emergency_contacts',
            targetTable: 'emergency_contacts',
            containsPII: true,
            healthcareContext: 'resident-management',
            retentionYears: 7,
            transformationRules: [
              {
                sourceColumn: 'id',
                targetColumn: 'contact_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'resident_id',
                targetColumn: 'resident_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'name',
                targetColumn: 'contact_name',
                transformation: (value) => value?.trim(),
                required: true
              },
              {
                sourceColumn: 'relationship',
                targetColumn: 'relationship',
                transformation: (value) => value?.toLowerCase(),
                required: true
              },
              {
                sourceColumn: 'phone',
                targetColumn: 'phone_number',
                transformation: (value) => value?.replace(/\s/g, ''),
                required: true
              }
            ],
            validationRules: [
              {
                column: 'phone_number',
                rule: 'phone',
                errorMessage: 'Invalid phone number format'
              }
            ]
          }
        ]
      },
      {
        phase: 1,
        serviceName: 'medication-service',
        dependencies: ['resident-service'],
        rollbackProcedure: 'DROP_MEDICATION_TABLES',
        tables: [
          {
            sourceTable: 'medications',
            targetTable: 'medications',
            containsPII: false,
            healthcareContext: 'medication-management',
            retentionYears: 7,
            transformationRules: [
              {
                sourceColumn: 'id',
                targetColumn: 'medication_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'name',
                targetColumn: 'medication_name',
                transformation: (value) => value?.trim(),
                required: true
              },
              {
                sourceColumn: 'generic_name',
                targetColumn: 'generic_name',
                transformation: (value) => value?.trim(),
                required: false
              },
              {
                sourceColumn: 'strength',
                targetColumn: 'strength',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'unit',
                targetColumn: 'unit',
                transformation: (value) => value?.toLowerCase(),
                required: true
              }
            ],
            validationRules: [
              {
                column: 'medication_name',
                rule: 'required',
                errorMessage: 'Medication name is required'
              }
            ]
          },
          {
            sourceTable: 'prescriptions',
            targetTable: 'prescriptions',
            containsPII: true,
            healthcareContext: 'medication-management',
            retentionYears: 7,
            transformationRules: [
              {
                sourceColumn: 'id',
                targetColumn: 'prescription_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'resident_id',
                targetColumn: 'resident_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'medication_id',
                targetColumn: 'medication_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'dosage',
                targetColumn: 'dosage',
                transformation: (value) => parseFloat(value),
                required: true
              },
              {
                sourceColumn: 'frequency',
                targetColumn: 'frequency',
                transformation: (value) => value?.toLowerCase(),
                required: true
              },
              {
                sourceColumn: 'prescribed_date',
                targetColumn: 'prescribed_date',
                transformation: (value) => value,
                required: true
              }
            ],
            validationRules: [
              {
                column: 'dosage',
                rule: 'custom',
                customValidator: (value) => !isNaN(value) && value > 0,
                errorMessage: 'Dosage must be a positive number'
              }
            ]
          }
        ]
      },
      // Phase 2: Operational Services
      {
        phase: 2,
        serviceName: 'financial-service',
        dependencies: ['resident-service'],
        rollbackProcedure: 'DROP_FINANCIAL_TABLES',
        tables: [
          {
            sourceTable: 'billing',
            targetTable: 'billing_records',
            containsPII: true,
            healthcareContext: 'financial-management',
            retentionYears: 7,
            transformationRules: [
              {
                sourceColumn: 'id',
                targetColumn: 'billing_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'resident_id',
                targetColumn: 'resident_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'amount',
                targetColumn: 'amount',
                transformation: (value) => parseFloat(value),
                required: true
              },
              {
                sourceColumn: 'billing_date',
                targetColumn: 'billing_date',
                transformation: (value) => value,
                required: true
              }
            ],
            validationRules: [
              {
                column: 'amount',
                rule: 'custom',
                customValidator: (value) => !isNaN(value) && value >= 0,
                errorMessage: 'Amount must be a non-negative number'
              }
            ]
          }
        ]
      },
      {
        phase: 2,
        serviceName: 'hr-service',
        dependencies: [],
        rollbackProcedure: 'DROP_HR_TABLES',
        tables: [
          {
            sourceTable: 'staff',
            targetTable: 'staff_members',
            containsPII: true,
            healthcareContext: 'hr-management',
            retentionYears: 7,
            transformationRules: [
              {
                sourceColumn: 'id',
                targetColumn: 'staff_id',
                transformation: (value) => value,
                required: true
              },
              {
                sourceColumn: 'first_name',
                targetColumn: 'first_name',
                transformation: (value) => value?.trim(),
                required: true
              },
              {
                sourceColumn: 'last_name',
                targetColumn: 'last_name',
                transformation: (value) => value?.trim(),
                required: true
              },
              {
                sourceColumn: 'role',
                targetColumn: 'job_role',
                transformation: (value) => value?.toLowerCase(),
                required: true
              },
              {
                sourceColumn: 'email',
                targetColumn: 'email_address',
                transformation: (value) => value?.toLowerCase(),
                required: true
              }
            ],
            validationRules: [
              {
                column: 'email_address',
                rule: 'email',
                errorMessage: 'Invalid email address format'
              }
            ]
          }
        ]
      }
    ];

    this.progress.totalPhases = Math.max(...this.migrationPlans.map(p => p.phase));
    this.progress.totalTables = this.migrationPlans.reduce((sum, plan) => sum + plan.tables.length, 0);

    this.logger.info(`Initialized ${this.migrationPlans.length} migration plans with ${this.progress.totalTables} tables`);
  }

  /**
   * Execute complete data migration
   */
  async executeMigration(): Promise<MigrationResult[]> {
    this.logger.info('Starting complete data migration');
    this.progress.status = 'in_progress';
    this.progress.startTime = new Date();

    constresults: MigrationResult[] = [];

    try {
      await this.auditService.log({
        action: 'MIGRATION_STARTED',
        resourceType: 'migration',
        resourceId: 'complete-migration',
        details: {
          totalPhases: this.progress.totalPhases,
          totalTables: this.progress.totalTables,
          dryRun: this.config.dryRun
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      // Execute migration phases in order
      for (let phase = 1; phase <= this.progress.totalPhases; phase++) {
        this.progress.currentPhase = phase;
        this.logger.info(`Starting migration phase ${phase}`);

        const phasePlans = this.migrationPlans.filter(p => p.phase === phase);
        
        // Execute services in parallel within the same phase
        const phaseResults = await Promise.all(
          phasePlans.map(plan => this.migrateService(plan))
        );

        results.push(...phaseResults.flat());
      }

      this.progress.status = 'completed';
      this.logger.info('Complete data migration finished successfully');

      await this.auditService.log({
        action: 'MIGRATION_COMPLETED',
        resourceType: 'migration',
        resourceId: 'complete-migration',
        details: {
          totalRecords: this.progress.totalRecords,
          migratedRecords: this.progress.migratedRecords,
          duration: Date.now() - this.progress.startTime.getTime(),
          results: results.map(r => ({
            service: r.serviceName,
            table: r.tableName,
            status: r.status,
            records: r.migratedRecords
          }))
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

    } catch (error) {
      this.progress.status = 'failed';
      this.logger.error('Data migration failed:', error);
      
      await this.auditService.log({
        action: 'MIGRATION_FAILED',
        resourceType: 'migration',
        resourceId: 'complete-migration',
        details: {
          error: error.message,
          phase: this.progress.currentPhase,
          completedTables: this.progress.completedTables
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      throw error;
    }

    return results;
  }

  /**
   * Migrate data for a specific service
   */
  async migrateService(plan: MigrationPlan): Promise<MigrationResult[]> {
    this.logger.info(`Migrating service: ${plan.serviceName}`);
    
    const targetPool = this.targetPools.get(plan.serviceName);
    if (!targetPool) {
      throw new Error(`Target database pool not found for service: ${plan.serviceName}`);
    }

    constresults: MigrationResult[] = [];

    for (const tableConfig of plan.tables) {
      const result = await this.migrateTable(tableConfig, targetPool, plan.serviceName);
      results.push(result);
      this.progress.completedTables++;
    }

    return results;
  }

  /**
   * Migrate data for a specific table
   */
  async migrateTable(
    tableConfig: MigrationTableConfig, 
    targetPool: Pool, 
    serviceName: string
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    this.logger.info(`Migrating table: ${tableConfig.sourceTable} -> ${tableConfig.targetTable}`);

    constresult: MigrationResult = {
      serviceName,
      tableName: tableConfig.targetTable,
      totalRecords: 0,
      migratedRecords: 0,
      failedRecords: 0,
      validationErrors: [],
      duration: 0,
      status: 'failed'
    };

    letsourceClient: PoolClient | null = null;
    lettargetClient: PoolClient | null = null;

    try {
      sourceClient = await this.sourcePool.connect();
      targetClient = await targetPool.connect();

      // Get total record count
      const countResult = await sourceClient.query(`SELECT COUNT(*) FROM ${tableConfig.sourceTable}`);
      result.totalRecords = parseInt(countResult.rows[0].count);
      this.progress.totalRecords += result.totalRecords;

      this.logger.info(`Found ${result.totalRecords} records to migrate from ${tableConfig.sourceTable}`);

      // Process records in batches
      let offset = 0;
      const batchSize = this.config.batchSize;

      while (offset < result.totalRecords) {
        const batch = await this.processBatch(
          sourceClient,
          targetClient,
          tableConfig,
          offset,
          batchSize
        );

        result.migratedRecords += batch.successful;
        result.failedRecords += batch.failed;
        result.validationErrors.push(...batch.validationErrors);
        this.progress.migratedRecords += batch.successful;

        offset += batchSize;

        // Log progress
        const progressPercent = Math.round((offset / result.totalRecords) * 100);
        this.logger.info(`Migration progress for ${tableConfig.sourceTable}: ${progressPercent}%`);
      }

      result.status = result.failedRecords === 0 ? 'completed' : 'partial';
      result.duration = Date.now() - startTime;

      this.logger.info(`Table migration completed: ${tableConfig.sourceTable} (${result.migratedRecords}/${result.totalRecords} records)`);

      // Publish migration event
      await this.eventStoreService.appendEvent({
        eventType: 'TableMigrationCompleted',
        aggregateId: `migration-${serviceName}-${tableConfig.targetTable}`,
        aggregateType: 'Migration',
        eventData: {
          serviceName,
          sourceTable: tableConfig.sourceTable,
          targetTable: tableConfig.targetTable,
          totalRecords: result.totalRecords,
          migratedRecords: result.migratedRecords,
          failedRecords: result.failedRecords,
          duration: result.duration
        },
        metadata: {
          healthcareContext: tableConfig.healthcareContext,
          containsPII: tableConfig.containsPII,
          migrationPhase: this.progress.currentPhase
        }
      });

    } catch (error) {
      this.logger.error(`Table migration failed for ${tableConfig.sourceTable}:`, error);
      result.status = 'failed';
      result.duration = Date.now() - startTime;
      throw error;

    } finally {
      if (sourceClient) sourceClient.release();
      if (targetClient) targetClient.release();
    }

    return result;
  }

  /**
   * Process a batch of records
   */
  private async processBatch(
    sourceClient: PoolClient,
    targetClient: PoolClient,
    tableConfig: MigrationTableConfig,
    offset: number,
    batchSize: number
  ): Promise<{ successful: number; failed: number; validationErrors: string[] }> {
    
    const result = { successful: 0, failed: 0, validationErrors: [] };

    try {
      // Fetch batch from source
      const sourceQuery = `SELECT * FROM ${tableConfig.sourceTable} ORDER BY id LIMIT $1 OFFSET $2`;
      const sourceResult = await sourceClient.query(sourceQuery, [batchSize, offset]);

      if (!this.config.dryRun) {
        await targetClient.query('BEGIN');
      }

      for (const sourceRow of sourceResult.rows) {
        try {
          // Transform data
          const transformedData = this.transformRecord(sourceRow, tableConfig.transformationRules);
          
          // Validate data
          const validationResult = this.validateRecord(transformedData, tableConfig.validationRules);
          
          if (!validationResult.isValid) {
            result.validationErrors.push(...validationResult.errors);
            result.failed++;
            continue;
          }

          // Encrypt PII data if required
          if (tableConfig.containsPII) {
            transformedData = await this.encryptPIIFields(transformedData, tableConfig);
          }

          if (!this.config.dryRun) {
            // Insert into target database
            const insertQuery = this.buildInsertQuery(tableConfig.targetTable, transformedData);
            await targetClient.query(insertQuery.query, insertQuery.values);
          }

          result.successful++;

        } catch (error) {
          this.logger.warn(`Failed to migrate record from ${tableConfig.sourceTable}:`, error);
          result.failed++;
          result.validationErrors.push(`Record migration failed: ${error.message}`);
        }
      }

      if (!this.config.dryRun) {
        await targetClient.query('COMMIT');
      }

    } catch (error) {
      if (!this.config.dryRun) {
        await targetClient.query('ROLLBACK');
      }
      throw error;
    }

    return result;
  }

  /**
   * Transform record according to transformation rules
   */
  private transformRecord(sourceRecord: any, transformationRules: TransformationRule[]): any {
    consttransformedRecord: any = {};

    for (const rule of transformationRules) {
      const sourceValue = sourceRecord[rule.sourceColumn];
      
      if (sourceValue !== undefined && sourceValue !== null) {
        transformedRecord[rule.targetColumn] = rule.transformation(sourceValue);
      } else if (rule.required) {
        throw new Error(`Required field ${rule.sourceColumn} is missing or null`);
      }
    }

    // Add metadata fields
    transformedRecord.created_at = new Date();
    transformedRecord.updated_at = new Date();
    transformedRecord.migrated_at = new Date();
    transformedRecord.migration_source = 'monolith';

    return transformedRecord;
  }

  /**
   * Validate record according to validation rules
   */
  private validateRecord(record: any, validationRules: ValidationRule[]): { isValid: boolean; errors: string[] } {
    consterrors: string[] = [];

    for (const rule of validationRules) {
      const value = record[rule.column];

      switch (rule.rule) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push(`${rule.column}: ${rule.errorMessage}`);
          }
          break;

        case 'nhs_number':
          if (value && !this.validateNHSNumber(value)) {
            errors.push(`${rule.column}: ${rule.errorMessage}`);
          }
          break;

        case 'date':
          if (value && isNaN(Date.parse(value))) {
            errors.push(`${rule.column}: ${rule.errorMessage}`);
          }
          break;

        case 'email':
          if (value && !this.validateEmail(value)) {
            errors.push(`${rule.column}: ${rule.errorMessage}`);
          }
          break;

        case 'phone':
          if (value && !this.validatePhoneNumber(value)) {
            errors.push(`${rule.column}: ${rule.errorMessage}`);
          }
          break;

        case 'custom':
          if (rule.customValidator && value && !rule.customValidator(value)) {
            errors.push(`${rule.column}: ${rule.errorMessage}`);
          }
          break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Encrypt PII fields in the record
   */
  private async encryptPIIFields(record: any, tableConfig: MigrationTableConfig): Promise<any> {
    const encryptedRecord = { ...record };
    
    // Define PII fields that need encryption
    const piiFields = ['first_name', 'last_name', 'nhs_number', 'email_address', 'phone_number', 'address'];
    
    for (const field of piiFields) {
      if (encryptedRecord[field]) {
        encryptedRecord[field] = await this.encryptionService.encrypt(encryptedRecord[field]);
        encryptedRecord[`${field}_encrypted`] = true;
      }
    }

    return encryptedRecord;
  }

  /**
   * Build INSERT query for target database
   */
  private buildInsertQuery(tableName: string, data: any): { query: string; values: any[] } {
    const columns = Object.keys(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const values = columns.map(col => data[col]);

    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      ON CONFLICT DO NOTHING
    `;

    return { query, values };
  }

  /**
   * Validate NHS number format and check digit
   */
  private validateNHSNumber(nhsNumber: string): boolean {
    if (!/^\d{10}$/.test(nhsNumber)) return false;
    
    const digits = nhsNumber.split('').map(Number);
    const checkDigit = digits[9];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    
    const remainder = sum % 11;
    const calculatedCheckDigit = 11 - remainder;
    
    return calculatedCheckDigit === checkDigit || 
           (calculatedCheckDigit === 11 && checkDigit === 0);
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate UK phone number format
   */
  private validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Get migration progress
   */
  getMigrationProgress(): MigrationProgress {
    if (this.progress.status === 'in_progress' && this.progress.migratedRecords > 0) {
      const elapsed = Date.now() - this.progress.startTime.getTime();
      const rate = this.progress.migratedRecords / elapsed; // records per ms
      const remaining = this.progress.totalRecords - this.progress.migratedRecords;
      const estimatedRemainingTime = remaining / rate;
      
      this.progress.estimatedCompletion = new Date(Date.now() + estimatedRemainingTime);
    }

    return { ...this.progress };
  }

  /**
   * Rollback migration for a specific service
   */
  async rollbackService(serviceName: string): Promise<void> {
    this.logger.info(`Rolling back migration for service: ${serviceName}`);

    const targetPool = this.targetPools.get(serviceName);
    if (!targetPool) {
      throw new Error(`Target database pool not found for service: ${serviceName}`);
    }

    const plan = this.migrationPlans.find(p => p.serviceName === serviceName);
    if (!plan) {
      throw new Error(`Migration plan not found for service: ${serviceName}`);
    }

    const client = await targetPool.connect();
    
    try {
      await client.query('BEGIN');

      // Drop tables in reverse order
      for (const tableConfig of plan.tables.reverse()) {
        await client.query(`DROP TABLE IF EXISTS ${tableConfig.targetTable} CASCADE`);
        this.logger.info(`Dropped table: ${tableConfig.targetTable}`);
      }

      await client.query('COMMIT');
      
      await this.auditService.log({
        action: 'MIGRATION_ROLLBACK',
        resourceType: 'migration',
        resourceId: serviceName,
        details: {
          serviceName,
          tablesDropped: plan.tables.length
        },
        timestamp: new Date(),
        userId: 'system',
        correlationId: this.generateCorrelationId()
      });

      this.logger.info(`Rollback completed for service: ${serviceName}`);

    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Rollback failed for service ${serviceName}:`, error);
      throw error;

    } finally {
      client.release();
    }
  }

  /**
   * Generate correlation ID for audit trails
   */
  private generateCorrelationId(): string {
    return `migration-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    try {
      await this.sourcePool.end();
      
      for (const [serviceName, pool] of this.targetPools) {
        await pool.end();
        this.logger.info(`Closed connection pool for ${serviceName}`);
      }

      this.logger.info('Data migration service shutdown completed');

    } catch (error) {
      this.logger.error('Error during migration service shutdown:', error);
    }
  }
}
