import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { DBSVerificationService } from '../../../services/hr/DBSVerificationService';
import { DBSVerification, DBSStatus, DBSVerificationType, DBSVerificationPriority } from '../../../entities/hr/DBSVerification';

// Mock the database and other dependencies
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn()
  }
}));

jest.mock('../../../services/audit/AuditTrailService', () => ({
  AuditTrailService: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn()
  }))
}));

jest.mock('../../../services/notifications/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn()
  }))
}));

jest.mock('eventemitter2', () => ({
  EventEmitter2: jest.fn().mockImplementation(() => ({
    emit: jest.fn()
  }))
}));

describe('DBSVerificationService', () => {
  let service: DBSVerificationService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn()
    };

    const { AppDataSource } = require('../../../config/database');
    AppDataSource.getRepository.mockReturnValue(mockRepository);
    AppDataSource.transaction.mockImplementation(async (callback) => {
      return await callback(mockRepository);
    });

    service = new DBSVerificationService();
  });

  describe('createDBSVerification', () => {
    it('should create a new DBS verification successfully', async () => {
      const request = {
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        verificationType: DBSVerificationType.ENHANCED,
        priority: DBSVerificationPriority.HIGH,
        careHomeId: 'care-home-001',
        department: 'nursing',
        costCenter: 'nursing-001',
        notes: 'New employee verification'
      };

      const mockVerification = {
        id: 'dbs-001',
        ...request,
        status: DBSStatus.NOT_STARTED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRepository.create.mockReturnValue(mockVerification);
      mockRepository.save.mockResolvedValue(mockVerification);

      const result = await service.createDBSVerification(request, 'user-001');

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...request,
          status: DBSStatus.NOT_STARTED,
          createdBy: 'user-001'
        })
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockVerification);
      expect(result).toEqual(mockVerification);
    });

    it('should throw error for invalid verification type', async () => {
      const request = {
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        verificationType: 'invalid-type' as any,
        priority: DBSVerificationPriority.HIGH,
        careHomeId: 'care-home-001'
      };

      await expect(service.createDBSVerification(request, 'user-001'))
        .rejects.toThrow('Invalid verification type');
    });

    it('should throw error for invalid priority', async () => {
      const request = {
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        verificationType: DBSVerificationType.ENHANCED,
        priority: 'invalid-priority' as any,
        careHomeId: 'care-home-001'
      };

      await expect(service.createDBSVerification(request, 'user-001'))
        .rejects.toThrow('Invalid priority');
    });
  });

  describe('getDBSVerificationById', () => {
    it('should return DBS verification by ID', async () => {
      const mockVerification = {
        id: 'dbs-001',
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        status: DBSStatus.COMPLETED
      };

      mockRepository.findOne.mockResolvedValue(mockVerification);

      const result = await service.getDBSVerificationById('dbs-001');

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'dbs-001' }
      });
      expect(result).toEqual(mockVerification);
    });

    it('should return null if verification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getDBSVerificationById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchDBSVerifications', () => {
    it('should search DBS verifications with criteria', async () => {
      const criteria = {
        status: DBSStatus.COMPLETED,
        careHomeId: 'care-home-001'
      };

      const mockVerifications = [
        { id: 'dbs-001', status: DBSStatus.COMPLETED },
        { id: 'dbs-002', status: DBSStatus.COMPLETED }
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockVerifications)
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchDBSVerifications(criteria);

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('verification');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'verification.status = :status',
        { status: DBSStatus.COMPLETED }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'verification.careHomeId = :careHomeId',
        { careHomeId: 'care-home-001' }
      );
      expect(result).toEqual(mockVerifications);
    });
  });

  describe('startDBSApplication', () => {
    it('should start DBS application successfully', async () => {
      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.NOT_STARTED,
        startApplication: jest.fn(),
        save: jest.fn()
      };

      mockRepository.findOne.mockResolvedValue(mockVerification);
      mockRepository.save.mockResolvedValue(mockVerification);

      const result = await service.startDBSApplication('dbs-001', 'DBS-APP-001', 'user-001');

      expect(mockVerification.startApplication).toHaveBeenCalledWith('DBS-APP-001', 'user-001');
      expect(mockRepository.save).toHaveBeenCalledWith(mockVerification);
      expect(result).toEqual(mockVerification);
    });

    it('should throw error if verification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.startDBSApplication('non-existent', 'DBS-APP-001', 'user-001'))
        .rejects.toThrow('DBS verification not found');
    });

    it('should throw error if verification not in correct status', async () => {
      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.COMPLETED
      };

      mockRepository.findOne.mockResolvedValue(mockVerification);

      await expect(service.startDBSApplication('dbs-001', 'DBS-APP-001', 'user-001'))
        .rejects.toThrow('DBS verification is not in NOT_STARTED status');
    });
  });

  describe('completeDBSVerification', () => {
    it('should complete DBS verification successfully', async () => {
      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.IN_PROGRESS,
        completeVerification: jest.fn(),
        save: jest.fn()
      };

      mockRepository.findOne.mockResolvedValue(mockVerification);
      mockRepository.save.mockResolvedValue(mockVerification);

      const result = await service.completeDBSVerification(
        'dbs-001',
        'CERT-001',
        true,
        'user-001',
        'Verification completed successfully'
      );

      expect(mockVerification.completeVerification).toHaveBeenCalledWith(
        'CERT-001',
        true,
        'user-001',
        'Verification completed successfully'
      );
      expect(mockRepository.save).toHaveBeenCalledWith(mockVerification);
      expect(result).toEqual(mockVerification);
    });

    it('should throw error if verification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.completeDBSVerification('non-existent', 'CERT-001', true, 'user-001'))
        .rejects.toThrow('DBS verification not found');
    });
  });

  describe('getDBSComplianceReport', () => {
    it('should generate compliance report', async () => {
      const mockVerifications = [
        { id: 'dbs-001', status: DBSStatus.COMPLETED, complianceStatus: 'compliant' },
        { id: 'dbs-002', status: DBSStatus.COMPLETED, complianceStatus: 'compliant' },
        { id: 'dbs-003', status: DBSStatus.EXPIRED, complianceStatus: 'non_compliant' }
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockVerifications)
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getDBSComplianceReport('care-home-001');

      expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('verification');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'verification.careHomeId = :careHomeId',
        { careHomeId: 'care-home-001' }
      );
      expect(result).toEqual({
        totalVerifications: 3,
        compliantVerifications: 2,
        nonCompliantVerifications: 1,
        complianceRate: 66.67,
        expiringVerifications: 0,
        expiredVerifications: 1
      });
    });
  });

  describe('deleteDBSVerification', () => {
    it('should delete DBS verification successfully', async () => {
      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.NOT_STARTED
      };

      mockRepository.findOne.mockResolvedValue(mockVerification);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteDBSVerification('dbs-001', 'user-001');

      expect(mockRepository.softDelete).toHaveBeenCalledWith('dbs-001');
    });

    it('should throw error if verification not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteDBSVerification('non-existent', 'user-001'))
        .rejects.toThrow('DBS verification not found');
    });

    it('should throw error if verification is completed', async () => {
      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.COMPLETED
      };

      mockRepository.findOne.mockResolvedValue(mockVerification);

      await expect(service.deleteDBSVerification('dbs-001', 'user-001'))
        .rejects.toThrow('Cannot delete a completed DBS verification');
    });
  });
});
