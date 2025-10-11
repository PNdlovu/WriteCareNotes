import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingDataMigrationService } from '../../../services/onboarding/OnboardingDataMigrationService';
import { DataMigration } from '../../../entities/onboarding/DataMigration';
import { MigrationMapping } from '../../../entities/onboarding/MigrationMapping';

describe('Onboarding Data Migration E2E Tests', () => {
  let app: INestApplication;
  let service: OnboardingDataMigrationService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [DataMigration, MigrationMapping],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([DataMigration, MigrationMapping]),
      ],
      providers: [OnboardingDataMigrationService],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get<OnboardingDataMigrationService>(OnboardingDataMigrationService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete Data Migration Workflow', () => {
    it('should handle complete data migration lifecycle from creation to completion', async () => {
      // Step 1: Create a data migration
      const migrationData = {
        sourceSystem: 'Legacy System',
        targetSystem: 'New System',
        migrationType: 'Full' as const,
        status: 'Pending' as const,
        totalRecords: 1000,
        migratedRecords: 0,
        failedRecords: 0,
        startTime: new Date(),
        endTime: null,
        errorLog: null,
        migrationConfig: { batchSize: 100, retryAttempts: 3 }
      };

      const createdMigration = await service.createDataMigration(migrationData);
      expect(createdMigration).toBeDefined();
      expect(createdMigration.sourceSystem).toBe('Legacy System');
      expect(createdMigration.targetSystem).toBe('New System');
      expect(createdMigration.status).toBe('Pending');

      // Step 2: Create migration mappings
      const mapping1 = await service.createMigrationMapping({
        migrationId: createdMigration.id,
        sourceField: 'old_field_name',
        targetField: 'new_field_name',
        dataType: 'string' as const,
        transformationRule: 'UPPERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'NOT_NULL'
      });

      const mapping2 = await service.createMigrationMapping({
        migrationId: createdMigration.id,
        sourceField: 'old_field_age',
        targetField: 'new_field_age',
        dataType: 'number' as const,
        transformationRule: 'CONVERT_TO_INT',
        isRequired: false,
        defaultValue: 0,
        validationRule: 'MIN_0'
      });

      const mapping3 = await service.createMigrationMapping({
        migrationId: createdMigration.id,
        sourceField: 'old_field_email',
        targetField: 'new_field_email',
        dataType: 'string' as const,
        transformationRule: 'LOWERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'EMAIL_FORMAT'
      });

      expect(mapping1).toBeDefined();
      expect(mapping2).toBeDefined();
      expect(mapping3).toBeDefined();

      // Step 3: Verify migration mappings
      const allMappings = await service.getMigrationMappings(createdMigration.id);
      expect(allMappings).toHaveLength(3);
      expect(allMappings.some(mapping => mapping.sourceField === 'old_field_name')).toBe(true);
      expect(allMappings.some(mapping => mapping.sourceField === 'old_field_age')).toBe(true);
      expect(allMappings.some(mapping => mapping.sourceField === 'old_field_email')).toBe(true);

      // Step 4: Start migration
      await service.updateDataMigration(createdMigration.id, {
        status: 'In Progress' as const,
        startTime: new Date()
      });

      let updatedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(updatedMigration.status).toBe('In Progress');

      // Step 5: Simulate migration progress
      await service.updateDataMigration(createdMigration.id, {
        migratedRecords: 250,
        failedRecords: 5
      });

      updatedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(updatedMigration.migratedRecords).toBe(250);
      expect(updatedMigration.failedRecords).toBe(5);

      // Step 6: Continue migration progress
      await service.updateDataMigration(createdMigration.id, {
        migratedRecords: 500,
        failedRecords: 10
      });

      updatedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(updatedMigration.migratedRecords).toBe(500);
      expect(updatedMigration.failedRecords).toBe(10);

      // Step 7: Complete migration
      await service.updateDataMigration(createdMigration.id, {
        status: 'Completed' as const,
        migratedRecords: 990,
        failedRecords: 10,
        endTime: new Date(),
        errorLog: '10 records failed due to data validation errors'
      });

      updatedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(updatedMigration.status).toBe('Completed');
      expect(updatedMigration.migratedRecords).toBe(990);
      expect(updatedMigration.failedRecords).toBe(10);
      expect(updatedMigration.endTime).toBeDefined();
      expect(updatedMigration.errorLog).toBe('10 records failed due to data validation errors');

      // Step 8: Update mapping during migration
      await service.updateMigrationMapping(mapping1.id, {
        transformationRule: 'LOWERCASE',
        isRequired: false
      });

      const updatedMapping = await service.getMigrationMappings(createdMigration.id);
      const updatedMapping1 = updatedMapping.find(mapping => mapping.id === mapping1.id);
      expect(updatedMapping1.transformationRule).toBe('LOWERCASE');
      expect(updatedMapping1.isRequired).toBe(false);

      // Step 9: Clean up - delete migration and mappings
      await service.deleteMigrationMapping(mapping1.id);
      await service.deleteMigrationMapping(mapping2.id);
      await service.deleteMigrationMapping(mapping3.id);
      await service.deleteDataMigration(createdMigration.id);

      // Verify deletion
      const finalMigrations = await service.getAllDataMigrations();
      expect(finalMigrations).toHaveLength(0);
    });

    it('should handle multiple concurrent migrations', async () => {
      // Create multiple migrations
      const migration1 = await service.createDataMigration({
        sourceSystem: 'Legacy System A',
        targetSystem: 'New System',
        migrationType: 'Full' as const,
        status: 'Pending' as const,
        totalRecords: 1000,
        migratedRecords: 0,
        failedRecords: 0,
        startTime: new Date(),
        endTime: null,
        errorLog: null,
        migrationConfig: { batchSize: 100, retryAttempts: 3 }
      });

      const migration2 = await service.createDataMigration({
        sourceSystem: 'Legacy System B',
        targetSystem: 'New System',
        migrationType: 'Incremental' as const,
        status: 'Pending' as const,
        totalRecords: 500,
        migratedRecords: 0,
        failedRecords: 0,
        startTime: new Date(),
        endTime: null,
        errorLog: null,
        migrationConfig: { batchSize: 50, retryAttempts: 3 }
      });

      const migration3 = await service.createDataMigration({
        sourceSystem: 'Legacy System C',
        targetSystem: 'New System',
        migrationType: 'Full' as const,
        status: 'Pending' as const,
        totalRecords: 2000,
        migratedRecords: 0,
        failedRecords: 0,
        startTime: new Date(),
        endTime: null,
        errorLog: null,
        migrationConfig: { batchSize: 200, retryAttempts: 3 }
      });

      // Create mappings for each migration
      await service.createMigrationMapping({
        migrationId: migration1.id,
        sourceField: 'field_a',
        targetField: 'field_a_new',
        dataType: 'string' as const,
        transformationRule: 'UPPERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'NOT_NULL'
      });

      await service.createMigrationMapping({
        migrationId: migration2.id,
        sourceField: 'field_b',
        targetField: 'field_b_new',
        dataType: 'number' as const,
        transformationRule: 'CONVERT_TO_INT',
        isRequired: false,
        defaultValue: 0,
        validationRule: 'MIN_0'
      });

      await service.createMigrationMapping({
        migrationId: migration3.id,
        sourceField: 'field_c',
        targetField: 'field_c_new',
        dataType: 'string' as const,
        transformationRule: 'LOWERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'EMAIL_FORMAT'
      });

      // Start all migrations
      await service.updateDataMigration(migration1.id, { status: 'In Progress' as const });
      await service.updateDataMigration(migration2.id, { status: 'In Progress' as const });
      await service.updateDataMigration(migration3.id, { status: 'In Progress' as const });

      // Verify all migrations are in progress
      const inProgressMigrations = await service.getMigrationsByStatus('In Progress');
      expect(inProgressMigrations).toHaveLength(3);

      // Complete migration 1
      await service.updateDataMigration(migration1.id, {
        status: 'Completed' as const,
        migratedRecords: 1000,
        failedRecords: 0,
        endTime: new Date()
      });

      // Complete migration 2
      await service.updateDataMigration(migration2.id, {
        status: 'Completed' as const,
        migratedRecords: 500,
        failedRecords: 0,
        endTime: new Date()
      });

      // Fail migration 3
      await service.updateDataMigration(migration3.id, {
        status: 'Failed' as const,
        migratedRecords: 500,
        failedRecords: 1500,
        endTime: new Date(),
        errorLog: 'System failure during migration'
      });

      // Verify final statuses
      const completedMigrations = await service.getMigrationsByStatus('Completed');
      expect(completedMigrations).toHaveLength(2);

      const failedMigrations = await service.getMigrationsByStatus('Failed');
      expect(failedMigrations).toHaveLength(1);

      // Verify source system filtering
      const legacySystemAMigrations = await service.getMigrationsBySourceSystem('Legacy System A');
      expect(legacySystemAMigrations).toHaveLength(1);
      expect(legacySystemAMigrations[0].status).toBe('Completed');

      const legacySystemBMigrations = await service.getMigrationsBySourceSystem('Legacy System B');
      expect(legacySystemBMigrations).toHaveLength(1);
      expect(legacySystemBMigrations[0].status).toBe('Completed');

      const legacySystemCMigrations = await service.getMigrationsBySourceSystem('Legacy System C');
      expect(legacySystemCMigrations).toHaveLength(1);
      expect(legacySystemCMigrations[0].status).toBe('Failed');

      // Clean up
      await service.deleteDataMigration(migration1.id);
      await service.deleteDataMigration(migration2.id);
      await service.deleteDataMigration(migration3.id);
    });

    it('should handle error scenarios gracefully', async () => {
      // Test operations on non-existent migration
      await expect(service.getDataMigrationById('non-existent-id'))
        .rejects.toThrow('Data migration not found');

      await expect(service.updateDataMigration('non-existent-id', { status: 'In Progress' }))
        .rejects.toThrow('Data migration not found');

      await expect(service.deleteDataMigration('non-existent-id'))
        .rejects.toThrow('Data migration not found');

      // Test operations on non-existent mapping
      await expect(service.updateMigrationMapping('non-existent-id', { transformationRule: 'UPPERCASE' }))
        .rejects.toThrow('Migration mapping not found');

      await expect(service.deleteMigrationMapping('non-existent-id'))
        .rejects.toThrow('Migration mapping not found');

      // Test creating mapping for non-existent migration
      await expect(service.createMigrationMapping({
        migrationId: 'non-existent-migration-id',
        sourceField: 'field',
        targetField: 'field_new',
        dataType: 'string' as const,
        transformationRule: 'UPPERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'NOT_NULL'
      })).rejects.toThrow('Data migration not found');
    });
  });
});
