/**
 * @fileoverview Comprehensive tests for Assessment Service
 * @module AssessmentServiceTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Complete test suite for assessment service with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - NICE Guidelines for Assessment and Care Planning
 * - Mental Capacity Act 2005
 */

import { DataSource, Repository } from 'typeorm';
import { AssessmentService, CreateAssessmentRequest, CompleteAssessmentRequest } from '../AssessmentService';
import { Assessment, AssessmentType, AssessmentStatus, RiskLevel } from '../../../entities/assessment/Assessment';
import { AssessmentTemplate } from '../../../entities/assessment/AssessmentTemplate';
import { AssessmentQuestion, QuestionType, ResponseType } from '../../../entities/assessment/AssessmentQuestion';
import { AssessmentResponse } from '../../../entities/assessment/AssessmentResponse';
import { RiskAssessment, RiskCategory } from '../../../entities/assessment/RiskAssessment';
import { Resident } from '../../../entities/resident/Resident';
import { AssessmentRepository } from '../../../repositories/assessment/AssessmentRepository';
import { AssessmentTemplateRepository } from '../../../repositories/assessment/AssessmentTemplateRepository';
import { RiskAssessmentRepository } from '../../../repositories/assessment/RiskAssessmentRepository';
import { AuditTrailService } from '../../audit/AuditTrailService';
import { FieldLevelEncryptionService } from '../../encryption/FieldLevelEncryptionService';
import { NotificationService } from '../../notifications/NotificationService';
import { EventPublishingService } from '../../events/EventPublishingService';
import { HealthcareCacheManager } from '../../caching/HealthcareCacheManager';

// Mock dependencies
jest.mock('../../../repositories/assessment/AssessmentRepository');
jest.mock('../../../repositories/assessment/AssessmentTemplateRepository');
jest.mock('../../../repositories/assessment/RiskAssessmentRepository');
jest.mock('../../audit/AuditTrailService');
jest.mock('../../encryption/FieldLevelEncryptionService');
jest.mock('../../notifications/NotificationService');
jest.mock('../../events/EventPublishingService');
jest.mock('../../caching/HealthcareCacheManager');d
escribe('AssessmentService', () => {
  letservice: AssessmentService;
  letmockDataSource: jest.Mocked<DataSource>;
  letmockAssessmentRepository: jest.Mocked<AssessmentRepository>;
  letmockTemplateRepository: jest.Mocked<AssessmentTemplateRepository>;
  letmockRiskAssessmentRepository: jest.Mocked<RiskAssessmentRepository>;
  letmockResidentRepository: jest.Mocked<Repository<Resident>>;
  letmockQuestionRepository: jest.Mocked<Repository<AssessmentQuestion>>;
  letmockResponseRepository: jest.Mocked<Repository<AssessmentResponse>>;
  letmockAuditService: jest.Mocked<AuditTrailService>;
  letmockEncryptionService: jest.Mocked<FieldLevelEncryptionService>;
  letmockNotificationService: jest.Mocked<NotificationService>;
  letmockEventPublisher: jest.Mocked<EventPublishingService>;
  letmockCacheManager: jest.Mocked<HealthcareCacheManager>;

  const mockResident = {
    id: 'resident-123',
    firstName: 'John',
    lastName: 'Doe',
    nhsNumber: '1234567890',
    dateOfBirth: new Date('1950-01-01'),
    deletedAt: null
  } as Resident;

  const mockAssessment = {
    id: 'assessment-123',
    residentId: 'resident-123',
    assessmentType: AssessmentType.RISK,
    title: 'Falls Risk Assessment',
    description: 'Comprehensive falls risk evaluation',
    scheduledDate: new Date('2025-01-15'),
    dueDate: new Date('2025-01-22'),
    priority: 'high',
    assessorId: 'assessor-123',
    assessorName: 'Dr. Smith',
    status: AssessmentStatus.SCHEDULED,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Assessment;

  const mockTemplate = {
    id: 'template-123',
    name: 'Falls Risk Assessment Template',
    assessmentType: AssessmentType.FALLS_RISK,
    questions: [
      {
        questionText: 'Has the resident fallen in the last 6 months?',
        questionType: QuestionType.RISK_FACTOR,
        responseType: ResponseType.BOOLEAN,
        isRequired: true,
        scoringWeight: 2,
        riskIndicator: true,
        riskCategory: RiskCategory.MOBILITY
      }
    ]
  } as AssessmentTemplate;  b
eforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockAssessmentRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      findDue: jest.fn(),
      findByResidentAndTypeInTimeframe: jest.fn()
    } as unknown as jest.Mocked<AssessmentRepository>;

    mockTemplateRepository = {
      findById: jest.fn()
    } as unknown as jest.Mocked<AssessmentTemplateRepository>;

    mockRiskAssessmentRepository = {
      save: jest.fn()
    } as unknown as jest.Mocked<RiskAssessmentRepository>;

    mockResidentRepository = {
      findOne: jest.fn()
    } as unknown as jest.Mocked<Repository<Resident>>;

    mockQuestionRepository = {
      find: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<Repository<AssessmentQuestion>>;

    mockResponseRepository = {
      save: jest.fn()
    } as unknown as jest.Mocked<Repository<AssessmentResponse>>;

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

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      invalidatePattern: jest.fn()
    } as unknown as jest.Mocked<HealthcareCacheManager>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Resident) return mockResidentRepository;
        if (entity === AssessmentQuestion) return mockQuestionRepository;
        if (entity === AssessmentResponse) return mockResponseRepository;
        return mockAssessmentRepository;
      })
    } as unknown as jest.Mocked<DataSource>;

    // Create service instance
    service = new AssessmentService(
      mockDataSource,
      mockAuditService,
      mockEncryptionService,
      mockNotificationService,
      mockEventPublisher,
      mockCacheManager
    );

    // Override repository properties
    (service as any).assessmentRepository = mockAssessmentRepository;
    (service as any).templateRepository = mockTemplateRepository;
    (service as any).riskAssessmentRepository = mockRiskAssessmentRepository;
  });  descri
be('createAssessment', () => {
    constcreateRequest: CreateAssessmentRequest = {
      residentId: 'resident-123',
      assessmentType: AssessmentType.RISK,
      title: 'Falls Risk Assessment',
      description: 'Comprehensive falls risk evaluation',
      scheduledDate: new Date('2025-01-15'),
      dueDate: new Date('2025-01-22'),
      priority: 'high',
      assessorId: 'assessor-123',
      assessorName: 'Dr. Smith',
      createdBy: 'user-123'
    };

    it('should create assessment successfully', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockAssessmentRepository.create.mockResolvedValue(mockAssessment);

      // Act
      const result = await service.createAssessment(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockResidentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'resident-123', deletedAt: null }
      });
      expect(mockAssessmentRepository.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASSESSMENT_CREATED',
          resourceType: 'Assessment',
          userId: 'user-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'assessment.created',
        expect.objectContaining({
          residentId: 'resident-123',
          assessmentType: AssessmentType.RISK,
          priority: 'high',
          createdBy: 'user-123'
        })
      );
      expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('assessments:resident:resident-123:*');
    });

    it('should throw error when resident not found', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createAssessment(createRequest)).rejects.toThrow(
        'Resident with ID resident-123 not found'
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASSESSMENT_CREATE_FAILED'
        })
      );
    });

    it('should create assessment from template', async () => {
      // Arrange
      const requestWithTemplate = {
        ...createRequest,
        templateId: 'template-123'
      };
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockTemplateRepository.findById.mockResolvedValue(mockTemplate);
      mockAssessmentRepository.create.mockResolvedValue(mockAssessment);

      // Act
      const result = await service.createAssessment(requestWithTemplate);

      // Assert
      expect(result).toBeDefined();
      expect(mockTemplateRepository.findById).toHaveBeenCalledWith('template-123');
      expect(mockQuestionRepository.save).toHaveBeenCalled();
    });

    it('should encrypt sensitive assessment data', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockAssessmentRepository.create.mockResolvedValue(mockAssessment);

      // Act
      await service.createAssessment(createRequest);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Comprehensive falls risk evaluation');
    });
  });  des
cribe('completeAssessment', () => {
    constcompleteRequest: CompleteAssessmentRequest = {
      assessmentId: 'assessment-123',
      responses: [
        {
          assessmentId: 'assessment-123',
          questionId: 'question-123',
          responseValue: true,
          responseText: 'Yes, fell twice in last month',
          notes: 'Requires immediate intervention',
          respondedBy: 'assessor-123'
        }
      ],
      overallNotes: 'High risk resident requiring immediate care plan review',
      recommendations: ['Implement fall prevention measures', 'Daily monitoring'],
      actionPlan: 'Review mobility aids and environment modifications',
      completedBy: 'assessor-123'
    };

    it('should complete assessment successfully', async () => {
      // Arrange
      const scheduledAssessment = { ...mockAssessment, status: AssessmentStatus.IN_PROGRESS };
      mockAssessmentRepository.findById.mockResolvedValue(scheduledAssessment);
      mockResponseRepository.save.mockResolvedValue({} as any);
      mockQuestionRepository.find.mockResolvedValue([
        {
          id: 'question-123',
          questionText: 'Has fallen recently?',
          scoringWeight: 2,
          riskIndicator: true,
          riskCategory: RiskCategory.MOBILITY
        }
      ] as any);
      mockRiskAssessmentRepository.save.mockResolvedValue({} as any);
      mockAssessmentRepository.update.mockResolvedValue({
        ...scheduledAssessment,
        status: AssessmentStatus.COMPLETED,
        completedDate: new Date(),
        riskLevel: RiskLevel.HIGH
      });

      // Act
      const result = await service.completeAssessment(completeRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(AssessmentStatus.COMPLETED);
      expect(mockResponseRepository.save).toHaveBeenCalled();
      expect(mockRiskAssessmentRepository.save).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASSESSMENT_COMPLETED',
          resourceType: 'Assessment',
          userId: 'assessor-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'assessment.completed',
        expect.objectContaining({
          assessmentId: 'assessment-123',
          completedBy: 'assessor-123'
        })
      );
    });

    it('should throw error when assessment not found', async () => {
      // Arrange
      mockAssessmentRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.completeAssessment(completeRequest)).rejects.toThrow(
        'Assessment with ID assessment-123 not found'
      );
    });

    it('should throw error when assessment already completed', async () => {
      // Arrange
      const completedAssessment = { ...mockAssessment, status: AssessmentStatus.COMPLETED };
      mockAssessmentRepository.findById.mockResolvedValue(completedAssessment);

      // Act & Assert
      await expect(service.completeAssessment(completeRequest)).rejects.toThrow(
        'Assessment is already completed'
      );
    });

    it('should calculate risk assessment for risk assessment types', async () => {
      // Arrange
      const riskAssessment = { ...mockAssessment, assessmentType: AssessmentType.FALLS_RISK };
      mockAssessmentRepository.findById.mockResolvedValue(riskAssessment);
      mockResponseRepository.save.mockResolvedValue({} as any);
      mockQuestionRepository.find.mockResolvedValue([
        {
          id: 'question-123',
          questionText: 'Has fallen recently?',
          scoringWeight: 3,
          riskIndicator: true,
          riskCategory: RiskCategory.MOBILITY
        }
      ] as any);
      mockRiskAssessmentRepository.save.mockResolvedValue({} as any);
      mockAssessmentRepository.update.mockResolvedValue({
        ...riskAssessment,
        status: AssessmentStatus.COMPLETED,
        riskLevel: RiskLevel.HIGH,
        riskScore: 6
      });

      // Act
      const result = await service.completeAssessment(completeRequest);

      // Assert
      expect(result.riskLevel).toBe(RiskLevel.HIGH);
      expect(mockRiskAssessmentRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          assessmentId: 'assessment-123',
          overallRiskLevel: expect.any(String),
          requiresImmediateAction: expect.any(Boolean)
        })
      );
    });

    it('should send urgent notifications for high-risk assessments', async () => {
      // Arrange
      const riskAssessment = { ...mockAssessment, assessmentType: AssessmentType.FALLS_RISK };
      mockAssessmentRepository.findById.mockResolvedValue(riskAssessment);
      mockResponseRepository.save.mockResolvedValue({} as any);
      mockQuestionRepository.find.mockResolvedValue([
        {
          id: 'question-123',
          scoringWeight: 5,
          riskIndicator: true,
          riskCategory: RiskCategory.MOBILITY
        }
      ] as any);
      mockRiskAssessmentRepository.save.mockResolvedValue({} as any);
      mockAssessmentRepository.update.mockResolvedValue({
        ...riskAssessment,
        status: AssessmentStatus.COMPLETED,
        riskLevel: RiskLevel.SEVERE
      });

      // Act
      await service.completeAssessment(completeRequest);

      // Assert
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'urgent_risk_assessment',
          recipientType: 'care_manager',
          title: 'Urgent: High Risk Assessment'
        })
      );
    });
  });  
describe('getAssessmentTrendAnalysis', () => {
    const timeframe = {
      from: new Date('2025-01-01'),
      to: new Date('2025-01-31')
    };

    it('should return trend analysis from cache if available', async () => {
      // Arrange
      const cachedAnalysis = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.RISK,
        timeframe,
        trends: [],
        overallDirection: 'stable' as const,
        significantChanges: [],
        recommendations: []
      };
      mockCacheManager.get.mockResolvedValue(cachedAnalysis);

      // Act
      const result = await service.getAssessmentTrendAnalysis('resident-123', AssessmentType.RISK, timeframe);

      // Assert
      expect(result).toEqual(cachedAnalysis);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockAssessmentRepository.findByResidentAndTypeInTimeframe).not.toHaveBeenCalled();
    });

    it('should calculate trend analysis from database', async () => {
      // Arrange
      const assessments = [
        {
          ...mockAssessment,
          status: AssessmentStatus.COMPLETED,
          completedDate: new Date('2025-01-05'),
          riskScore: 10,
          riskLevel: RiskLevel.MODERATE,
          recommendations: ['Monitor closely']
        },
        {
          ...mockAssessment,
          id: 'assessment-456',
          status: AssessmentStatus.COMPLETED,
          completedDate: new Date('2025-01-15'),
          riskScore: 15,
          riskLevel: RiskLevel.HIGH,
          recommendations: ['Immediate intervention']
        }
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockAssessmentRepository.findByResidentAndTypeInTimeframe.mockResolvedValue(assessments);

      // Act
      const result = await service.getAssessmentTrendAnalysis('resident-123', AssessmentType.RISK, timeframe);

      // Assert
      expect(result).toBeDefined();
      expect(result.trends).toHaveLength(2);
      expect(result.overallDirection).toBeDefined();
      expect(result.significantChanges).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(mockCacheManager.set).toHaveBeenCalled();
    });

    it('should identify declining trend', async () => {
      // Arrange
      const assessments = [
        {
          ...mockAssessment,
          status: AssessmentStatus.COMPLETED,
          completedDate: new Date('2025-01-05'),
          riskScore: 5,
          riskLevel: RiskLevel.LOW
        },
        {
          ...mockAssessment,
          status: AssessmentStatus.COMPLETED,
          completedDate: new Date('2025-01-15'),
          riskScore: 20,
          riskLevel: RiskLevel.SEVERE
        }
      ];
      mockCacheManager.get.mockResolvedValue(null);
      mockAssessmentRepository.findByResidentAndTypeInTimeframe.mockResolvedValue(assessments);

      // Act
      const result = await service.getAssessmentTrendAnalysis('resident-123', AssessmentType.RISK, timeframe);

      // Assert
      expect(result.overallDirection).toBe('declining');
      expect(result.significantChanges.length).toBeGreaterThan(0);
      expect(result.recommendations).toContain('Review and intensify current interventions');
    });
  });

  describe('getAssessmentsDue', () => {
    it('should retrieve assessments due within specified days', async () => {
      // Arrange
      const dueAssessments = [
        { ...mockAssessment, dueDate: new Date('2025-01-10') },
        { ...mockAssessment, id: 'assessment-456', dueDate: new Date('2025-01-12') }
      ];
      mockAssessmentRepository.findDue.mockResolvedValue(dueAssessments);

      // Act
      const result = await service.getAssessmentsDue(7);

      // Assert
      expect(result).toHaveLength(2);
      expect(mockAssessmentRepository.findDue).toHaveBeenCalled();
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('searchAssessments', () => {
    const searchFilters = {
      residentId: 'resident-123',
      assessmentType: AssessmentType.RISK,
      status: AssessmentStatus.COMPLETED
    };

    it('should search assessments with filters and pagination', async () => {
      // Arrange
      const searchResults = {
        assessments: [mockAssessment],
        total: 1
      };
      mockAssessmentRepository.search.mockResolvedValue(searchResults);

      // Act
      const result = await service.searchAssessments(searchFilters, 1, 20);

      // Assert
      expect(result).toEqual({
        assessments: [mockAssessment],
        total: 1,
        totalPages: 1
      });
      expect(mockAssessmentRepository.search).toHaveBeenCalledWith(searchFilters, 1, 20);
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockResidentRepository.findOne.mockRejectedValue(dbError);

      constcreateRequest: CreateAssessmentRequest = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.RISK,
        title: 'Test Assessment',
        priority: 'medium',
        assessorId: 'assessor-123',
        assessorName: 'Dr. Test',
        createdBy: 'user-123'
      };

      // Act & Assert
      await expect(service.createAssessment(createRequest)).rejects.toThrow('Database connection failed');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASSESSMENT_CREATE_FAILED'
        })
      );
    });

    it('should handle encryption service errors', async () => {
      // Arrange
      const encryptionError = new Error('Encryption failed');
      mockEncryptionService.encrypt.mockRejectedValue(encryptionError);
      mockResidentRepository.findOne.mockResolvedValue(mockResident);

      constcreateRequest: CreateAssessmentRequest = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.RISK,
        title: 'Test Assessment',
        description: 'Sensitive description',
        priority: 'medium',
        assessorId: 'assessor-123',
        assessorName: 'Dr. Test',
        createdBy: 'user-123'
      };

      // Act & Assert
      await expect(service.createAssessment(createRequest)).rejects.toThrow('Encryption failed');
    });
  });

  describe('Healthcare Compliance', () => {
    it('should maintain audit trail for all assessment operations', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockAssessmentRepository.create.mockResolvedValue(mockAssessment);

      constcreateRequest: CreateAssessmentRequest = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.MENTAL_CAPACITY,
        title: 'Mental Capacity Assessment',
        priority: 'high',
        assessorId: 'assessor-123',
        assessorName: 'Dr. Smith',
        createdBy: 'user-123'
      };

      // Act
      await service.createAssessment(createRequest);

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ASSESSMENT_CREATED',
          resourceType: 'Assessment',
          userId: 'user-123',
          details: expect.objectContaining({
            residentId: 'resident-123',
            assessmentType: AssessmentType.MENTAL_CAPACITY
          })
        })
      );
    });

    it('should publish events for assessment lifecycle', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockAssessmentRepository.create.mockResolvedValue(mockAssessment);

      constcreateRequest: CreateAssessmentRequest = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.CARE_REVIEW,
        title: 'Care Review Assessment',
        priority: 'medium',
        assessorId: 'assessor-123',
        assessorName: 'Dr. Jones',
        createdBy: 'user-123'
      };

      // Act
      await service.createAssessment(createRequest);

      // Assert
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'assessment.created',
        expect.objectContaining({
          residentId: 'resident-123',
          assessmentType: AssessmentType.CARE_REVIEW,
          createdBy: 'user-123'
        })
      );
    });

    it('should encrypt sensitive assessment data', async () => {
      // Arrange
      const sensitiveAssessment = {
        ...mockAssessment,
        description: 'Sensitive mental health assessment',
        overallNotes: 'Confidential clinical notes',
        actionPlan: 'Private action plan'
      };

      // Act
      await (service as any).encryptSensitiveAssessmentData(sensitiveAssessment);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Sensitive mental health assessment');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Confidential clinical notes');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Private action plan');
    });
  });

  describe('Performance and Scalability', () => {
    it('should use caching for trend analysis', async () => {
      // Arrange
      const cachedAnalysis = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.RISK,
        timeframe: { from: new Date(), to: new Date() },
        trends: [],
        overallDirection: 'stable' as const,
        significantChanges: [],
        recommendations: []
      };
      mockCacheManager.get.mockResolvedValue(cachedAnalysis);

      // Act
      const result = await service.getAssessmentTrendAnalysis(
        'resident-123',
        AssessmentType.RISK,
        { from: new Date(), to: new Date() }
      );

      // Assert
      expect(result).toEqual(cachedAnalysis);
      expect(mockCacheManager.get).toHaveBeenCalled();
    });

    it('should invalidate cache when assessments change', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockAssessmentRepository.create.mockResolvedValue(mockAssessment);

      constcreateRequest: CreateAssessmentRequest = {
        residentId: 'resident-123',
        assessmentType: AssessmentType.RISK,
        title: 'Cache Test Assessment',
        priority: 'medium',
        assessorId: 'assessor-123',
        assessorName: 'Dr. Test',
        createdBy: 'user-123'
      };

      // Act
      await service.createAssessment(createRequest);

      // Assert
      expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('assessments:resident:resident-123:*');
    });
  });
});
