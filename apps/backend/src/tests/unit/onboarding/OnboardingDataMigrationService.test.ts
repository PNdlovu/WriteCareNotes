import { EventEmitter2 } from "eventemitter2";

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingDataMigrationService } from '../../../services/onboarding/OnboardingDataMigrationService';
import { DataMigration } from '../../../entities/onboarding/DataMigration';
import { MigrationMapping } from '../../../entities/onboarding/MigrationMapping';

describe('OnboardingDataMigrationService', () => {
  letservice: OnboardingDataMigrationService;
  letdataMigrationRepository: Repository<DataMigration>;
  letmigrationMappingRepository: Repository<MigrationMapping>;

  const mockDataMigrationRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  const mockMigrationMappingRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    constmodule: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingDataMigrationService,
        {
          provide: getRepositoryToken(DataMigration),
          useValue: mockDataMigrationRepository,
        },
        {
          provide: getRepositoryToken(MigrationMapping),
          useValue: mockMigrationMappingRepository,
        },
      ],
    }).compile();

    service = module.get<OnboardingDataMigrationService>(OnboardingDataMigrationService);
    dataMigrationRepository = module.get<Repository<DataMigration>>(getRepositoryToken(DataMigration));
    migrationMappingRepository = module.get<Repository<MigrationMapping>>(getRepositoryToken(MigrationMapping));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDataMigration', () => {
    it('should create a new data migration successfully', async () => {
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

      const mockMigration = { id: '1', ...migrationData, createdAt: new Date(), updatedAt: new Date() };
      mockDataMigrationRepository.create.mockReturnValue(mockMigration);
      mockDataMigrationRepository.save.mockResolvedValue(mockMigration);

      const result = await service.createDataMigration(migrationData);

      expect(mockDataMigrationRepository.create).toHaveBeenCalledWith(migrationData);
      expect(mockDataMigrationRepository.save).toHaveBeenCalledWith(mockMigration);
      expect(result).toEqual(mockMigration);
    });
  });

  describe('getAllDataMigrations', () => {
    it('should return all data migrations', async () => {
      const mockMigrations = [
        { id: '1', sourceSystem: 'Legacy System', targetSystem: 'New System', status: 'Completed' },
        { id: '2', sourceSystem: 'Old System', targetSystem: 'New System', status: 'In Progress' }
      ];

      mockDataMigrationRepository.find.mockResolvedValue(mockMigrations);

      const result = await service.getAllDataMigrations();

      expect(mockDataMigrationRepository.find).toHaveBeenCalled();
      expect(result).toEqual(mockMigrations);
    });
  });

  describe('getDataMigrationById', () => {
    it('should return data migration by id', async () => {
      const mockMigration = { id: '1', sourceSystem: 'Legacy System', targetSystem: 'New System', status: 'Completed' };
      mockDataMigrationRepository.findOne.mockResolvedValue(mockMigration);

      const result = await service.getDataMigrationById('1');

      expect(mockDataMigrationRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(result).toEqual(mockMigration);
    });

    it('should throw error when data migration not found', async () => {
      mockDataMigrationRepository.findOne.mockResolvedValue(null);

      await expect(service.getDataMigrationById('1')).rejects.toThrow('Data migration not found');
    });
  });

  describe('updateDataMigration', () => {
    it('should update data migration successfully', async () => {
      const updateData = { status: 'In Progress' as const, migratedRecords: 500 };
      const mockMigration = { id: '1', sourceSystem: 'Legacy System', targetSystem: 'New System', ...updateData };

      mockDataMigrationRepository.findOne.mockResolvedValue(mockMigration);
      mockDataMigrationRepository.save.mockResolvedValue(mockMigration);

      const result = await service.updateDataMigration('1', updateData);

      expect(mockDataMigrationRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockDataMigrationRepository.save).toHaveBeenCalledWith(mockMigration);
      expect(result).toEqual(mockMigration);
    });

    it('should throw error when data migration not found', async () => {
      mockDataMigrationRepository.findOne.mockResolvedValue(null);

      await expect(service.updateDataMigration('1', { status: 'In Progress' })).rejects.toThrow('Data migration not found');
    });
  });

  describe('deleteDataMigration', () => {
    it('should delete data migration successfully', async () => {
      const mockMigration = { id: '1', sourceSystem: 'Legacy System', targetSystem: 'New System', status: 'Completed' };
      mockDataMigrationRepository.findOne.mockResolvedValue(mockMigration);
      mockDataMigrationRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteDataMigration('1');

      expect(mockDataMigrationRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockDataMigrationRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when data migration not found', async () => {
      mockDataMigrationRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDataMigration('1')).rejects.toThrow('Data migration not found');
    });
  });

  describe('createMigrationMapping', () => {
    it('should create a new migration mapping successfully', async () => {
      const mappingData = {
        migrationId: '1',
        sourceField: 'old_field_name',
        targetField: 'new_field_name',
        dataType: 'string' as const,
        transformationRule: 'UPPERCASE',
        isRequired: true,
        defaultValue: null,
        validationRule: 'NOT_NULL'
      };

      const mockMapping = { id: '1', ...mappingData, createdAt: new Date(), updatedAt: new Date() };
      mockMigrationMappingRepository.create.mockReturnValue(mockMapping);
      mockMigrationMappingRepository.save.mockResolvedValue(mockMapping);

      const result = await service.createMigrationMapping(mappingData);

      expect(mockMigrationMappingRepository.create).toHaveBeenCalledWith(mappingData);
      expect(mockMigrationMappingRepository.save).toHaveBeenCalledWith(mockMapping);
      expect(result).toEqual(mockMapping);
    });
  });

  describe('getMigrationMappings', () => {
    it('should return migration mappings by migration id', async () => {
      const mockMappings = [
        { id: '1', migrationId: '1', sourceField: 'old_field', targetField: 'new_field', dataType: 'string' },
        { id: '2', migrationId: '1', sourceField: 'old_field2', targetField: 'new_field2', dataType: 'number' }
      ];

      mockMigrationMappingRepository.find.mockResolvedValue(mockMappings);

      const result = await service.getMigrationMappings('1');

      expect(mockMigrationMappingRepository.find).toHaveBeenCalledWith({
        where: { migrationId: '1' }
      });
      expect(result).toEqual(mockMappings);
    });
  });

  describe('updateMigrationMapping', () => {
    it('should update migration mapping successfully', async () => {
      const updateData = { transformationRule: 'LOWERCASE', isRequired: false };
      const mockMapping = { id: '1', migrationId: '1', sourceField: 'old_field', targetField: 'new_field', ...updateData };

      mockMigrationMappingRepository.findOne.mockResolvedValue(mockMapping);
      mockMigrationMappingRepository.save.mockResolvedValue(mockMapping);

      const result = await service.updateMigrationMapping('1', updateData);

      expect(mockMigrationMappingRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockMigrationMappingRepository.save).toHaveBeenCalledWith(mockMapping);
      expect(result).toEqual(mockMapping);
    });

    it('should throw error when migration mapping not found', async () => {
      mockMigrationMappingRepository.findOne.mockResolvedValue(null);

      await expect(service.updateMigrationMapping('1', { transformationRule: 'LOWERCASE' })).rejects.toThrow('Migration mapping not found');
    });
  });

  describe('deleteMigrationMapping', () => {
    it('should delete migration mapping successfully', async () => {
      const mockMapping = { id: '1', migrationId: '1', sourceField: 'old_field', targetField: 'new_field', dataType: 'string' };
      mockMigrationMappingRepository.findOne.mockResolvedValue(mockMapping);
      mockMigrationMappingRepository.delete.mockResolvedValue({ affected: 1 });

      await service.deleteMigrationMapping('1');

      expect(mockMigrationMappingRepository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(mockMigrationMappingRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw error when migration mapping not found', async () => {
      mockMigrationMappingRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteMigrationMapping('1')).rejects.toThrow('Migration mapping not found');
    });
  });

  describe('getMigrationsByStatus', () => {
    it('should return migrations by status', async () => {
      const mockMigrations = [
        { id: '1', sourceSystem: 'Legacy System', targetSystem: 'New System', status: 'Completed' }
      ];

      mockDataMigrationRepository.find.mockResolvedValue(mockMigrations);

      const result = await service.getMigrationsByStatus('Completed');

      expect(mockDataMigrationRepository.find).toHaveBeenCalledWith({
        where: { status: 'Completed' }
      });
      expect(result).toEqual(mockMigrations);
    });
  });

  describe('getMigrationsBySourceSystem', () => {
    it('should return migrations by source system', async () => {
      const mockMigrations = [
        { id: '1', sourceSystem: 'Legacy System', targetSystem: 'New System', status: 'Completed' }
      ];

      mockDataMigrationRepository.find.mockResolvedValue(mockMigrations);

      const result = await service.getMigrationsBySourceSystem('Legacy System');

      expect(mockDataMigrationRepository.find).toHaveBeenCalledWith({
        where: { sourceSystem: 'Legacy System' }
      });
      expect(result).toEqual(mockMigrations);
    });
  });
});
