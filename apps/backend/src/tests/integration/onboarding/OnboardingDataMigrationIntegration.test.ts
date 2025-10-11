import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingDataMigrationService } from '../../../services/onboarding/OnboardingDataMigrationService';
import { DataMigration } from '../../../entities/onboarding/DataMigration';
import { MigrationMapping } from '../../../entities/onboarding/MigrationMapping';

describe('OnboardingDataMigrationService Integration Tests', () => {
  let service: OnboardingDataMigrationService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
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

    service = module.get<OnboardingDataMigrationService>(OnboardingDataMigrationService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Data Migration Management Integration', () => {
    it('should create, read, update, and delete data migrations', async () => {
      // Create a data migration
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

      // Read the data migration
      const retrievedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(retrievedMigration).toBeDefined();
      expect(retrievedMigration.sourceSystem).toBe('Legacy System');

      // Update the data migration
      const updateData = { status: 'In Progress' as const, migratedRecords: 500 };
      const updatedMigration = await service.updateDataMigration(createdMigration.id, updateData);
      expect(updatedMigration.status).toBe('In Progress');
      expect(updatedMigration.migratedRecords).toBe(500);

      // Delete the data migration
      await service.deleteDataMigration(createdMigration.id);
      await expect(service.getDataMigrationById(createdMigration.id)).rejects.toThrow('Data migration not found');
    });

    it('should handle migration mapping creation and management', async () => {
      // Create a data migration first
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

      // Create migration mappings
      const mappingData1 = {
        migrationId: createdMigration.id,
        sourceField: 'old_field_name',
        targetField: 'new_field_name',
        dataType: 'string' as const,
        transformationRule: 'UPPERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'NOT_NULL'
      };

      const mappingData2 = {
        migrationId: createdMigration.id,
        sourceField: 'old_field_age',
        targetField: 'new_field_age',
        dataType: 'number' as const,
        transformationRule: 'CONVERT_TO_INT',
        isRequired: false,
        defaultValue: 0,
        validationRule: 'MIN_0'
      };

      const createdMapping1 = await service.createMigrationMapping(mappingData1);
      const createdMapping2 = await service.createMigrationMapping(mappingData2);

      expect(createdMapping1).toBeDefined();
      expect(createdMapping1.sourceField).toBe('old_field_name');
      expect(createdMapping1.targetField).toBe('new_field_name');

      expect(createdMapping2).toBeDefined();
      expect(createdMapping2.sourceField).toBe('old_field_age');
      expect(createdMapping2.targetField).toBe('new_field_age');

      // Get migration mappings
      const mappings = await service.getMigrationMappings(createdMigration.id);
      expect(mappings).toHaveLength(2);
      expect(mappings.some(mapping => mapping.sourceField === 'old_field_name')).toBe(true);
      expect(mappings.some(mapping => mapping.sourceField === 'old_field_age')).toBe(true);

      // Update a mapping
      const updateData = { transformationRule: 'LOWERCASE', isRequired: false };
      const updatedMapping = await service.updateMigrationMapping(createdMapping1.id, updateData);
      expect(updatedMapping.transformationRule).toBe('LOWERCASE');
      expect(updatedMapping.isRequired).toBe(false);

      // Delete a mapping
      await service.deleteMigrationMapping(createdMapping1.id);
      const remainingMappings = await service.getMigrationMappings(createdMigration.id);
      expect(remainingMappings).toHaveLength(1);
      expect(remainingMappings[0].sourceField).toBe('old_field_age');
    });

    it('should filter migrations by status and source system', async () => {
      // Create multiple migrations with different statuses and source systems
      const migration1 = await service.createDataMigration({
        sourceSystem: 'Legacy System',
        targetSystem: 'New System',
        migrationType: 'Full' as const,
        status: 'Completed' as const,
        totalRecords: 1000,
        migratedRecords: 1000,
        failedRecords: 0,
        startTime: new Date(),
        endTime: new Date(),
        errorLog: null,
        migrationConfig: { batchSize: 100, retryAttempts: 3 }
      });

      const migration2 = await service.createDataMigration({
        sourceSystem: 'Legacy System',
        targetSystem: 'New System',
        migrationType: 'Incremental' as const,
        status: 'In Progress' as const,
        totalRecords: 500,
        migratedRecords: 250,
        failedRecords: 0,
        startTime: new Date(),
        endTime: null,
        errorLog: null,
        migrationConfig: { batchSize: 50, retryAttempts: 3 }
      });

      const migration3 = await service.createDataMigration({
        sourceSystem: 'Old System',
        targetSystem: 'New System',
        migrationType: 'Full' as const,
        status: 'Completed' as const,
        totalRecords: 2000,
        migratedRecords: 2000,
        failedRecords: 0,
        startTime: new Date(),
        endTime: new Date(),
        errorLog: null,
        migrationConfig: { batchSize: 200, retryAttempts: 3 }
      });

      // Test filtering by status
      const completedMigrations = await service.getMigrationsByStatus('Completed');
      expect(completedMigrations).toHaveLength(2);
      expect(completedMigrations.every(migration => migration.status === 'Completed')).toBe(true);

      const inProgressMigrations = await service.getMigrationsByStatus('In Progress');
      expect(inProgressMigrations).toHaveLength(1);
      expect(inProgressMigrations[0].status).toBe('In Progress');

      // Test filtering by source system
      const legacySystemMigrations = await service.getMigrationsBySourceSystem('Legacy System');
      expect(legacySystemMigrations).toHaveLength(2);
      expect(legacySystemMigrations.every(migration => migration.sourceSystem === 'Legacy System')).toBe(true);

      const oldSystemMigrations = await service.getMigrationsBySourceSystem('Old System');
      expect(oldSystemMigrations).toHaveLength(1);
      expect(oldSystemMigrations[0].sourceSystem).toBe('Old System');
    });

    it('should handle migration progress tracking', async () => {
      // Create a migration
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

      // Simulate migration progress
      await service.updateDataMigration(createdMigration.id, {
        status: 'In Progress' as const,
        migratedRecords: 250,
        failedRecords: 5
      });

      let updatedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(updatedMigration.status).toBe('In Progress');
      expect(updatedMigration.migratedRecords).toBe(250);
      expect(updatedMigration.failedRecords).toBe(5);

      // Complete the migration
      await service.updateDataMigration(createdMigration.id, {
        status: 'Completed' as const,
        migratedRecords: 995,
        failedRecords: 5,
        endTime: new Date()
      });

      updatedMigration = await service.getDataMigrationById(createdMigration.id);
      expect(updatedMigration.status).toBe('Completed');
      expect(updatedMigration.migratedRecords).toBe(995);
      expect(updatedMigration.failedRecords).toBe(5);
      expect(updatedMigration.endTime).toBeDefined();
    });
  });
});