/**
 * @fileoverview Comprehensive tests for Care Planning Service
 * @module CarePlanServiceTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Complete test suite for care planning service with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 */

import { DataSource, Repository } from 'typeorm';
import { CarePlanService, CreateCarePlanRequest, UpdateCarePlanRequest, CarePlanApprovalRequest, CarePlanSearchFilters } from '../CarePlanService';
import { CarePlan, CarePlanType, CarePlanStatus, ReviewFrequency } from '../../../entities/care-planning/CarePlan';
import { CareDomain } from '../../../entities/care-planning/CareDomain';
import { Resident } from '../../../entities/resident/Resident';
import { CarePlanRepository } from '../../../repositories/care-planning/CarePlanRepository';
import { AuditTrailService } from '../../audit/AuditTrailService';
import { FieldLevelEncryptionService } from '../../encryption/FieldLevelEncryptionService';
import { NotificationService } from '../../notifications/NotificationService';
import { EventPublishingService } from '../../events/EventPublishingService';

// Mock dependencies
jest.mock('../../../repositories/care-planning/CarePlanRepository');
jest.mock('../../audit/AuditTrailService');
jest.mock('../../encryption/FieldLevelEncryptionService');
jest.mock('../../notifications/NotificationService');
jest.mock('../../events/EventPublishingService');

describe('CarePlanService', () => {
  letservice: CarePlanService;
  letmockDataSource: jest.Mocked<DataSource>;
  letmockCarePlanRepository: jest.Mocked<CarePlanRepository>;
  letmockCareDomainRepository: jest.Mocked<Repository<CareDomain>>;
  letmockResidentRepository: jest.Mocked<Repository<Resident>>;
  letmockAuditService: jest.Mocked<AuditTrailService>;
  letmockEncryptionService: jest.Mocked<FieldLevelEncryptionService>;
  letmockNotificationService: jest.Mocked<NotificationService>;
  letmockEventPublisher: jest.Mocked<EventPublishingService>;

  const mockResident = {
    id: 'resident-123',
    firstName: 'John',
    lastName: 'Doe',
    nhsNumber: '1234567890',
    dateOfBirth: new Date('1950-01-01'),
    deletedAt: null
  } as Resident;

  const mockCarePlan = {
    id: 'care-plan-123',
    residentId: 'resident-123',
    planName: 'Initial Care Plan',
    planType: CarePlanType.INITIAL,
    reviewFrequency: ReviewFrequency.MONTHLY,
    effectiveFrom: new Date('2025-01-01'),
    nextReviewDate: new Date('2025-02-01'),
    status: CarePlanStatus.DRAFT,
    version: 1,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    careGoals: [],
    riskAssessments: [],
    emergencyProcedures: [],
    residentPreferences: [],
    isApproved: false,
    isOverdueForReview: false,
    addCareGoal: jest.fn(),
    addRiskAssessment: jest.fn(),
    approve: jest.fn(),
    archive: jest.fn()
  } as unknown as CarePlan;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockCarePlanRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      findDueForReview: jest.fn(),
      findVersions: jest.fn(),
      countActive: jest.fn(),
      getCarePlanSummaries: jest.fn(),
      getStatistics: jest.fn(),
      findByResidentId: jest.fn(),
      findRequiringAttention: jest.fn(),
      findConflictingPlans: jest.fn(),
      findActiveByResidentId: jest.fn(),
      findHistoryByResidentId: jest.fn()
    } as unknown as jest.Mocked<CarePlanRepository>;

    mockCareDomainRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      remove: jest.fn()
    } as unknown as jest.Mocked<Repository<CareDomain>>;

    mockResidentRepository = {
      findOne: jest.fn()
    } as unknown as jest.Mocked<Repository<Resident>>;

    // Create mock services
    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<AuditTrailService>;

    mockEncryptionService = {
      encrypt: jest.fn().mockImplementation((data: string) => Promise.resolve(`encrypted_${data}`)),
      decrypt: jest.fn().mockImplementation((data: string) => Promise.resolve(data.replace('encrypted_', '')))
    } as unknown as jest.Mocked<FieldLevelEncryptionService>;

    mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<NotificationService>;

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventPublishingService>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === CareDomain) return mockCareDomainRepository;
        if (entity === Resident) return mockResidentRepository;
        return mockCarePlanRepository;
      })
    } as unknown as jest.Mocked<DataSource>;

    // Create service instance
    service = new CarePlanService(
      mockDataSource,
      mockAuditService,
      mockEncryptionService,
      mockNotificationService,
      mockEventPublisher
    );

    // Override repository property
    (service as any).carePlanRepository = mockCarePlanRepository;
  });

  describe('createCarePlan', () => {
    constcreateRequest: CreateCarePlanRequest = {
      residentId: 'resident-123',
      planName: 'Initial Care Plan',
      planType: CarePlanType.INITIAL,
      reviewFrequency: ReviewFrequency.MONTHLY,
      effectiveFrom: new Date('2025-01-01'),
      careGoals: [
        {
          goalType: 'mobility',
          description: 'Improve mobility',
          targetDate: new Date('2025-03-01'),
          priority: 'high',
          status: 'active',
          notes: 'Patient needs assistance with walking'
        }
      ],
      riskAssessments: [
        {
          riskType: 'falls',
          riskLevel: 'high',
          description: 'High risk of falls due to mobility issues',
          mitigationStrategies: ['Use walking aids', 'Ensure clear pathways'],
          assessmentDate: new Date('2025-01-01'),
          nextAssessmentDate: new Date('2025-02-01')
        }
      ],
      createdBy: 'user-123'
    };

    it('should create care plan successfully', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockCarePlanRepository.create.mockResolvedValue(mockCarePlan);

      // Act
      const result = await service.createCarePlan(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockResidentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'resident-123', deletedAt: null }
      });
      expect(mockCarePlanRepository.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_CREATED',
          resourceType: 'CarePlan',
          userId: 'user-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'care-plan.created',
        expect.objectContaining({
          residentId: 'resident-123',
          planType: CarePlanType.INITIAL,
          createdBy: 'user-123'
        })
      );
      expect(mockNotificationService.sendNotification).toHaveBeenCalled();
    });

    it('should throw error when resident not found', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createCarePlan(createRequest)).rejects.toThrow(
        'Resident with ID resident-123 not found'
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_CREATE_FAILED'
        })
      );
    });

    it('should handle care goals and risk assessments', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      const carePlanWithMethods = {
        ...mockCarePlan,
        addCareGoal: jest.fn(),
        addRiskAssessment: jest.fn()
      };
      mockCarePlanRepository.create.mockResolvedValue(carePlanWithMethods);

      // Act
      await service.createCarePlan(createRequest);

      // Assert
      expect(carePlanWithMethods.addCareGoal).toHaveBeenCalledWith(createRequest.careGoals![0]);
      expect(carePlanWithMethods.addRiskAssessment).toHaveBeenCalledWith(createRequest.riskAssessments![0]);
    });

    it('should encrypt sensitive data', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      const carePlanWithSensitiveData = {
        ...mockCarePlan,
        careGoals: [{ notes: 'sensitive notes' }],
        riskAssessments: [{ description: 'sensitive description' }]
      };
      mockCarePlanRepository.create.mockResolvedValue(carePlanWithSensitiveData);

      // Act
      await service.createCarePlan(createRequest);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('sensitive notes');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('sensitive description');
    });
  });

  describe('getCarePlanById', () => {
    it('should retrieve and decrypt care plan successfully', async () => {
      // Arrange
      const encryptedCarePlan = {
        ...mockCarePlan,
        careGoals: [{ notes: 'encrypted_sensitive notes' }],
        riskAssessments: [{ description: 'encrypted_sensitive description' }]
      };
      mockCarePlanRepository.findById.mockResolvedValue(encryptedCarePlan);

      // Act
      const result = await service.getCarePlanById('care-plan-123');

      // Assert
      expect(result).toBeDefined();
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('care-plan-123', true);
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_sensitive notes');
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_sensitive description');
    });

    it('should return null when care plan not found', async () => {
      // Arrange
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Act
      const result = await service.getCarePlanById('non-existent');

      // Assert
      expect(result).toBeNull();
      expect(mockCarePlanRepository.findById).toHaveBeenCalledWith('non-existent', true);
    });
  });

  describe('searchCarePlans', () => {
    constsearchFilters: CarePlanSearchFilters = {
      residentId: 'resident-123',
      status: CarePlanStatus.ACTIVE,
      planType: CarePlanType.INITIAL
    };

    it('should search care plans with filters and pagination', async () => {
      // Arrange
      const mockSearchResults = {
        carePlans: [mockCarePlan],
        total: 1
      };
      mockCarePlanRepository.search.mockResolvedValue(mockSearchResults);

      // Act
      const result = await service.searchCarePlans(searchFilters, 1, 20);

      // Assert
      expect(result).toEqual({
        carePlans: [mockCarePlan],
        total: 1,
        totalPages: 1
      });
      expect(mockCarePlanRepository.search).toHaveBeenCalledWith(
        expect.objectContaining({
          residentId: 'resident-123',
          status: CarePlanStatus.ACTIVE,
          planType: CarePlanType.INITIAL
        }),
        1,
        20,
        'createdAt',
        'DESC'
      );
    });

    it('should filter by overdue review status', async () => {
      // Arrange
      const overdueCarePlan = { ...mockCarePlan, isOverdueForReview: true };
      const mockSearchResults = {
        carePlans: [mockCarePlan, overdueCarePlan],
        total: 2
      };
      mockCarePlanRepository.search.mockResolvedValue(mockSearchResults);

      // Act
      const result = await service.searchCarePlans(
        { ...searchFilters, isOverdueForReview: true },
        1,
        20
      );

      // Assert
      expect(result.carePlans).toHaveLength(1);
      expect(result.carePlans[0].isOverdueForReview).toBe(true);
    });
  });

  describe('updateCarePlan', () => {
    constupdateRequest: UpdateCarePlanRequest = {
      planName: 'Updated Care Plan',
      reviewFrequency: ReviewFrequency.QUARTERLY,
      updatedBy: 'user-456'
    };

    it('should update care plan successfully', async () => {
      // Arrange
      mockCarePlanRepository.findById.mockResolvedValue(mockCarePlan);
      const updatedCarePlan = { ...mockCarePlan, ...updateRequest };
      mockCarePlanRepository.update.mockResolvedValue(updatedCarePlan);

      // Act
      const result = await service.updateCarePlan('care-plan-123', updateRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockCarePlanRepository.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_UPDATED',
          resourceType: 'CarePlan',
          userId: 'user-456'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'care-plan.updated',
        expect.objectContaining({
          carePlanId: 'care-plan-123',
          updatedBy: 'user-456'
        })
      );
    });

    it('should throw error when care plan not found', async () => {
      // Arrange
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateCarePlan('non-existent', updateRequest)).rejects.toThrow(
        'Care plan with ID non-existent not found'
      );
    });

    it('should prevent updating archived care plan', async () => {
      // Arrange
      const archivedCarePlan = { ...mockCarePlan, status: CarePlanStatus.ARCHIVED };
      mockCarePlanRepository.findById.mockResolvedValue(archivedCarePlan);

      // Act & Assert
      await expect(service.updateCarePlan('care-plan-123', updateRequest)).rejects.toThrow(
        'Cannot update archived or superseded care plan'
      );
    });

    it('should reset approval status for significant changes', async () => {
      // Arrange
      const approvedCarePlan = {
        ...mockCarePlan,
        status: CarePlanStatus.ACTIVE,
        isApproved: true,
        approvedBy: 'approver-123',
        approvedAt: new Date()
      };
      mockCarePlanRepository.findById.mockResolvedValue(approvedCarePlan);
      mockCarePlanRepository.update.mockResolvedValue(approvedCarePlan);

      const significantUpdate = {
        ...updateRequest,
        planName: 'Completely Different Plan Name'
      };

      // Act
      await service.updateCarePlan('care-plan-123', significantUpdate);

      // Assert
      expect(approvedCarePlan.status).toBe(CarePlanStatus.PENDING_APPROVAL);
      expect(approvedCarePlan.approvedBy).toBeUndefined();
      expect(approvedCarePlan.approvedAt).toBeUndefined();
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'care_plan_updated',
          title: 'Care Plan Updated'
        })
      );
    });
  });

  describe('approveCarePlan', () => {
    constapprovalRequest: CarePlanApprovalRequest = {
      approvedBy: 'approver-123',
      approvalNotes: 'Plan approved after review',
      effectiveFrom: new Date('2025-01-15')
    };

    it('should approve care plan successfully', async () => {
      // Arrange
      const draftCarePlan = { ...mockCarePlan, status: CarePlanStatus.PENDING_APPROVAL };
      mockCarePlanRepository.findById.mockResolvedValue(draftCarePlan);
      const approvedCarePlan = { ...draftCarePlan, status: CarePlanStatus.ACTIVE };
      mockCarePlanRepository.update.mockResolvedValue(approvedCarePlan);

      // Act
      const result = await service.approveCarePlan('care-plan-123', approvalRequest);

      // Assert
      expect(result).toBeDefined();
      expect(draftCarePlan.approve).toHaveBeenCalledWith('approver-123');
      expect(mockCarePlanRepository.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_APPROVED',
          resourceType: 'CarePlan',
          userId: 'approver-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'care-plan.approved',
        expect.objectContaining({
          carePlanId: 'care-plan-123',
          approvedBy: 'approver-123'
        })
      );
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'care_plan_approved',
          title: 'Care Plan Approved'
        })
      );
    });

    it('should throw error when care plan not found', async () => {
      // Arrange
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.approveCarePlan('non-existent', approvalRequest)).rejects.toThrow(
        'Care plan with ID non-existent not found'
      );
    });

    it('should prevent approving already active care plan', async () => {
      // Arrange
      const activeCarePlan = { ...mockCarePlan, status: CarePlanStatus.ACTIVE };
      mockCarePlanRepository.findById.mockResolvedValue(activeCarePlan);

      // Act & Assert
      await expect(service.approveCarePlan('care-plan-123', approvalRequest)).rejects.toThrow(
        'Care plan is already approved and active'
      );
    });

    it('should prevent approving archived care plan', async () => {
      // Arrange
      const archivedCarePlan = { ...mockCarePlan, status: CarePlanStatus.ARCHIVED };
      mockCarePlanRepository.findById.mockResolvedValue(archivedCarePlan);

      // Act & Assert
      await expect(service.approveCarePlan('care-plan-123', approvalRequest)).rejects.toThrow(
        'Cannot approve archived or superseded care plan'
      );
    });
  });

  describe('archiveCarePlan', () => {
    it('should archive care plan successfully', async () => {
      // Arrange
      const activeCarePlan = { ...mockCarePlan, status: CarePlanStatus.ACTIVE };
      mockCarePlanRepository.findById.mockResolvedValue(activeCarePlan);
      const archivedCarePlan = { ...activeCarePlan, status: CarePlanStatus.ARCHIVED };
      mockCarePlanRepository.update.mockResolvedValue(archivedCarePlan);

      // Act
      const result = await service.archiveCarePlan('care-plan-123', 'user-123', 'Plan completed');

      // Assert
      expect(result).toBeDefined();
      expect(activeCarePlan.archive).toHaveBeenCalled();
      expect(mockCarePlanRepository.update).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_ARCHIVED',
          resourceType: 'CarePlan',
          userId: 'user-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'care-plan.archived',
        expect.objectContaining({
          carePlanId: 'care-plan-123',
          archivedBy: 'user-123',
          reason: 'Plan completed'
        })
      );
    });

    it('should throw error when care plan not found', async () => {
      // Arrange
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.archiveCarePlan('non-existent', 'user-123')).rejects.toThrow(
        'Care plan with ID non-existent not found'
      );
    });

    it('should prevent archiving already archived care plan', async () => {
      // Arrange
      const archivedCarePlan = { ...mockCarePlan, status: CarePlanStatus.ARCHIVED };
      mockCarePlanRepository.findById.mockResolvedValue(archivedCarePlan);

      // Act & Assert
      await expect(service.archiveCarePlan('care-plan-123', 'user-123')).rejects.toThrow(
        'Care plan is already archived'
      );
    });
  });

  describe('getCarePlansDueForReview', () => {
    it('should retrieve care plans due for review', async () => {
      // Arrange
      const dueCarePlans = [mockCarePlan];
      mockCarePlanRepository.findDueForReview.mockResolvedValue(dueCarePlans);

      // Act
      const result = await service.getCarePlansDueForReview(7);

      // Assert
      expect(result).toEqual(dueCarePlans);
      expect(mockCarePlanRepository.findDueForReview).toHaveBeenCalledWith(7);
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('getCarePlanVersionHistory', () => {
    it('should retrieve version history successfully', async () => {
      // Arrange
      const currentVersion = mockCarePlan;
      const previousVersions = [
        { ...mockCarePlan, id: 'care-plan-122', version: 0 }
      ];
      const allVersions = [currentVersion, ...previousVersions];

      mockCarePlanRepository.findById.mockResolvedValue(currentVersion);
      mockCarePlanRepository.findVersions.mockResolvedValue(allVersions);

      // Act
      const result = await service.getCarePlanVersionHistory('care-plan-123');

      // Assert
      expect(result).toBeDefined();
      expect(result.currentVersion).toEqual(currentVersion);
      expect(result.previousVersions).toEqual(previousVersions);
      expect(result.versionHistory).toHaveLength(2);
      expect(mockCarePlanRepository.findVersions).toHaveBeenCalledWith(
        'resident-123',
        'Initial Care Plan'
      );
    });

    it('should throw error when care plan not found', async () => {
      // Arrange
      mockCarePlanRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCarePlanVersionHistory('non-existent')).rejects.toThrow(
        'Care plan with ID non-existent not found'
      );
    });
  });

  describe('getActivePlansCount', () => {
    it('should return active plans count', async () => {
      // Arrange
      mockCarePlanRepository.countActive.mockResolvedValue(42);

      // Act
      const result = await service.getActivePlansCount();

      // Assert
      expect(result).toBe(42);
      expect(mockCarePlanRepository.countActive).toHaveBeenCalled();
    });
  });

  describe('getCarePlansByResidentId', () => {
    it('should retrieve care plans for resident', async () => {
      // Arrange
      const carePlans = [mockCarePlan];
      mockCarePlanRepository.findByResidentId.mockResolvedValue(carePlans);

      // Act
      const result = await service.getCarePlansByResidentId('resident-123', false);

      // Assert
      expect(result).toEqual(carePlans);
      expect(mockCarePlanRepository.findByResidentId).toHaveBeenCalledWith('resident-123', false);
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });

    it('should include archived plans when requested', async () => {
      // Arrange
      const carePlans = [mockCarePlan];
      mockCarePlanRepository.findByResidentId.mockResolvedValue(carePlans);

      // Act
      await service.getCarePlansByResidentId('resident-123', true);

      // Assert
      expect(mockCarePlanRepository.findByResidentId).toHaveBeenCalledWith('resident-123', true);
    });
  });

  describe('getCarePlansRequiringAttention', () => {
    it('should retrieve care plans requiring attention', async () => {
      // Arrange
      const attentionPlans = [mockCarePlan];
      mockCarePlanRepository.findRequiringAttention.mockResolvedValue(attentionPlans);

      // Act
      const result = await service.getCarePlansRequiringAttention();

      // Assert
      expect(result).toEqual(attentionPlans);
      expect(mockCarePlanRepository.findRequiringAttention).toHaveBeenCalled();
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('checkForConflictingPlans', () => {
    it('should check for conflicting care plans', async () => {
      // Arrange
      const conflictingPlans = [mockCarePlan];
      const effectiveFrom = new Date('2025-01-01');
      const effectiveTo = new Date('2025-12-31');
      mockCarePlanRepository.findConflictingPlans.mockResolvedValue(conflictingPlans);

      // Act
      const result = await service.checkForConflictingPlans('resident-123', effectiveFrom, effectiveTo);

      // Assert
      expect(result).toEqual(conflictingPlans);
      expect(mockCarePlanRepository.findConflictingPlans).toHaveBeenCalledWith(
        'resident-123',
        effectiveFrom,
        effectiveTo
      );
    });
  });

  describe('getActiveCarePlansByResidentId', () => {
    it('should retrieve active care plans for resident', async () => {
      // Arrange
      const activeCarePlans = [mockCarePlan];
      mockCarePlanRepository.findActiveByResidentId.mockResolvedValue(activeCarePlans);

      // Act
      const result = await service.getActiveCarePlansByResidentId('resident-123');

      // Assert
      expect(result).toEqual(activeCarePlans);
      expect(mockCarePlanRepository.findActiveByResidentId).toHaveBeenCalledWith('resident-123');
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('getCarePlanHistoryByResidentId', () => {
    it('should retrieve care plan history for resident', async () => {
      // Arrange
      const historyPlans = [mockCarePlan];
      mockCarePlanRepository.findHistoryByResidentId.mockResolvedValue(historyPlans);

      // Act
      const result = await service.getCarePlanHistoryByResidentId('resident-123');

      // Assert
      expect(result).toEqual(historyPlans);
      expect(mockCarePlanRepository.findHistoryByResidentId).toHaveBeenCalledWith('resident-123');
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('getCarePlanSummaries', () => {
    it('should retrieve care plan summaries', async () => {
      // Arrange
      const summaries = [{ id: 'care-plan-123', planName: 'Initial Care Plan' }];
      constfilters: CarePlanSearchFilters = { residentId: 'resident-123' };
      mockCarePlanRepository.getCarePlanSummaries.mockResolvedValue(summaries);

      // Act
      const result = await service.getCarePlanSummaries(filters, 50);

      // Assert
      expect(result).toEqual(summaries);
      expect(mockCarePlanRepository.getCarePlanSummaries).toHaveBeenCalledWith(
        expect.objectContaining({ residentId: 'resident-123' }),
        50
      );
    });
  });

  describe('getCarePlanStatistics', () => {
    it('should retrieve care plan statistics', async () => {
      // Arrange
      const statistics = { totalPlans: 100, activePlans: 80, overdueReviews: 5 };
      mockCarePlanRepository.getStatistics.mockResolvedValue(statistics);

      // Act
      const result = await service.getCarePlanStatistics('resident-123');

      // Assert
      expect(result).toEqual(statistics);
      expect(mockCarePlanRepository.getStatistics).toHaveBeenCalledWith('resident-123');
    });

    it('should retrieve global statistics when no resident ID provided', async () => {
      // Arrange
      const statistics = { totalPlans: 1000, activePlans: 800, overdueReviews: 50 };
      mockCarePlanRepository.getStatistics.mockResolvedValue(statistics);

      // Act
      const result = await service.getCarePlanStatistics();

      // Assert
      expect(result).toEqual(statistics);
      expect(mockCarePlanRepository.getStatistics).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockResidentRepository.findOne.mockRejectedValue(dbError);

      constcreateRequest: CreateCarePlanRequest = {
        residentId: 'resident-123',
        planName: 'Test Plan',
        planType: CarePlanType.INITIAL,
        reviewFrequency: ReviewFrequency.MONTHLY,
        effectiveFrom: new Date(),
        createdBy: 'user-123'
      };

      // Act & Assert
      await expect(service.createCarePlan(createRequest)).rejects.toThrow('Database connection failed');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_CREATE_FAILED'
        })
      );
    });

    it('should handle encryption service errors', async () => {
      // Arrange
      const encryptionError = new Error('Encryption failed');
      mockEncryptionService.encrypt.mockRejectedValue(encryptionError);
      mockResidentRepository.findOne.mockResolvedValue(mockResident);

      constcreateRequest: CreateCarePlanRequest = {
        residentId: 'resident-123',
        planName: 'Test Plan',
        planType: CarePlanType.INITIAL,
        reviewFrequency: ReviewFrequency.MONTHLY,
        effectiveFrom: new Date(),
        careGoals: [{ notes: 'sensitive data' }],
        createdBy: 'user-123'
      };

      // Act & Assert
      await expect(service.createCarePlan(createRequest)).rejects.toThrow('Encryption failed');
    });

    it('should handle notification service errors gracefully', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockCarePlanRepository.create.mockResolvedValue(mockCarePlan);
      mockNotificationService.sendNotification.mockRejectedValue(new Error('Notification failed'));

      constcreateRequest: CreateCarePlanRequest = {
        residentId: 'resident-123',
        planName: 'Test Plan',
        planType: CarePlanType.INITIAL,
        reviewFrequency: ReviewFrequency.MONTHLY,
        effectiveFrom: new Date(),
        createdBy: 'user-123'
      };

      // Act & Assert
      // Should not throw error even if notification fails
      const result = await service.createCarePlan(createRequest);
      expect(result).toBeDefined();
    });
  });

  describe('Healthcare Compliance', () => {
    it('should maintain audit trail for all operations', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockCarePlanRepository.create.mockResolvedValue(mockCarePlan);

      constcreateRequest: CreateCarePlanRequest = {
        residentId: 'resident-123',
        planName: 'Compliance Test Plan',
        planType: CarePlanType.INITIAL,
        reviewFrequency: ReviewFrequency.MONTHLY,
        effectiveFrom: new Date(),
        createdBy: 'user-123'
      };

      // Act
      await service.createCarePlan(createRequest);

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CARE_PLAN_CREATED',
          resourceType: 'CarePlan',
          userId: 'user-123',
          details: expect.objectContaining({
            residentId: 'resident-123',
            planName: 'Compliance Test Plan',
            planType: CarePlanType.INITIAL
          })
        })
      );
    });

    it('should encrypt sensitive care data', async () => {
      // Arrange
      const sensitiveCarePlan = {
        ...mockCarePlan,
        careGoals: [{ notes: 'sensitive care notes' }],
        riskAssessments: [{ description: 'sensitive risk description' }]
      };

      // Act
      await (service as any).encryptSensitiveData(sensitiveCarePlan);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('sensitive care notes');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('sensitive risk description');
    });

    it('should decrypt sensitive care data', async () => {
      // Arrange
      const encryptedCarePlan = {
        ...mockCarePlan,
        careGoals: [{ notes: 'encrypted_sensitive care notes' }],
        riskAssessments: [{ description: 'encrypted_sensitive risk description' }]
      };

      // Act
      await (service as any).decryptSensitiveData(encryptedCarePlan);

      // Assert
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_sensitive care notes');
      expect(mockEncryptionService.decrypt).toHaveBeenCalledWith('encrypted_sensitive risk description');
    });

    it('should publish events for care plan lifecycle', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockCarePlanRepository.create.mockResolvedValue(mockCarePlan);

      constcreateRequest: CreateCarePlanRequest = {
        residentId: 'resident-123',
        planName: 'Event Test Plan',
        planType: CarePlanType.INITIAL,
        reviewFrequency: ReviewFrequency.MONTHLY,
        effectiveFrom: new Date(),
        createdBy: 'user-123'
      };

      // Act
      await service.createCarePlan(createRequest);

      // Assert
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'care-plan.created',
        expect.objectContaining({
          residentId: 'resident-123',
          planType: CarePlanType.INITIAL,
          createdBy: 'user-123'
        })
      );
    });

    it('should send notifications to care team', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockCarePlanRepository.create.mockResolvedValue(mockCarePlan);

      constcreateRequest: CreateCarePlanRequest = {
        residentId: 'resident-123',
        planName: 'Notification Test Plan',
        planType: CarePlanType.INITIAL,
        reviewFrequency: ReviewFrequency.MONTHLY,
        effectiveFrom: new Date(),
        createdBy: 'user-123'
      };

      // Act
      await service.createCarePlan(createRequest);

      // Assert
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'care_plan_created',
          recipientType: 'care_team',
          residentId: 'resident-123',
          title: 'New Care Plan Created'
        })
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large result sets efficiently', async () => {
      // Arrange
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockCarePlan,
        id: `care-plan-${i}`,
        careGoals: [{ notes: `encrypted_notes_${i}` }]
      }));
      mockCarePlanRepository.search.mockResolvedValue({
        carePlans: largeResultSet,
        total: 1000
      });

      // Act
      const result = await service.searchCarePlans({}, 1, 1000);

      // Assert
      expect(result.carePlans).toHaveLength(1000);
      expect(mockEncryptionService.decrypt).toHaveBeenCalledTimes(1000);
    });

    it('should use pagination effectively', async () => {
      // Arrange
      const paginatedResults = {
        carePlans: [mockCarePlan],
        total: 100
      };
      mockCarePlanRepository.search.mockResolvedValue(paginatedResults);

      // Act
      const result = await service.searchCarePlans({}, 5, 10);

      // Assert
      expect(result.totalPages).toBe(10);
      expect(mockCarePlanRepository.search).toHaveBeenCalledWith(
        expect.any(Object),
        5,
        10,
        'createdAt',
        'DESC'
      );
    });
  });
});
