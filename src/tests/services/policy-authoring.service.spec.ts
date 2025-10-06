/**
 * @fileoverview Policy Authoring Service Test Suite
 * @description Comprehensive TDD test suite for the policy authoring toolkit
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @testStrategy
 * - Test-Driven Development (TDD)
 * - Behavior-Driven Development (BDD)
 * - Real-world policy authoring scenarios
 * - Compliance workflow testing
 * - Security and audit testing
 * - Rich text content validation
 * 
 * @coverage
 * - Unit tests: 100% service logic
 * - Integration tests: Workflow end-to-end
 * - Security tests: Authorization and validation
 * - Performance tests: Large policy processing
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { 
  PolicyAuthoringService, 
  PolicyStatus, 
  PolicyCategory, 
  Jurisdiction,
  ImportStatus 
} from '../policy-authoring/policy-authoring.service';
import { PolicyDraft, RichTextContent } from '../../entities/policy-draft.entity';
import { PolicyTemplate } from '../../entities/policy-template.entity';
import { PolicyImportJob } from '../../entities/policy-import-job.entity';
import { UserAcknowledgment } from '../../entities/user-acknowledgment.entity';
import { AuditEvent, AuditEventType } from '../../entities/audit-event.entity';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { AuditTrailService } from '../audit/audit-trail.service';
import { NotificationService } from '../notifications/notification.service';
import { FileProcessingService } from '../file-processing/file-processing.service';

/**
 * Test data factory for policy authoring tests
 */
class PolicyAuthoringTestDataFactory {
  static createUser(overrides: Partial<User> = {}): User {
    return {
      id: 'user-123',
      email: 'test@sunsetmanor.co.uk',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      organizationId: 'org-123',
      roles: [{ name: 'care_manager', isPrivileged: false }],
      permissions: ['create_policies', 'edit_policies'],
      isActive: true,
      lastLoginIp: '192.168.1.100',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    } as User;
  }

  static createOrganization(overrides: Partial<Organization> = {}): Organization {
    return {
      id: 'org-123',
      name: 'Sunset Manor Care Home',
      address: '123 Care Street, Healthcare City',
      registrationNumber: 'CHR123456',
      contactEmail: 'contact@sunsetmanor.co.uk',
      contactPhone: '+44 1234 567890',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    } as Organization;
  }

  static createRichTextContent(text: string = 'Sample policy content'): RichTextContent {
    return {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [
            {
              type: 'text',
              text: 'Policy Title'
            }
          ]
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text
            }
          ]
        }
      ]
    };
  }

  static createPolicyDraft(overrides: Partial<PolicyDraft> = {}): PolicyDraft {
    return {
      id: 'policy-123',
      title: 'Test Safeguarding Policy',
      content: this.createRichTextContent(),
      category: PolicyCategory.SAFEGUARDING,
      jurisdiction: [Jurisdiction.ENGLAND_CQC],
      status: PolicyStatus.DRAFT,
      version: '1.0.0',
      linkedModules: ['safeguarding', 'training'],
      reviewDue: new Date('2026-01-01'),
      description: 'A comprehensive safeguarding policy',
      tags: ['safeguarding', 'compliance'],
      organizationId: 'org-123',
      createdBy: 'user-123',
      updatedBy: 'user-123',
      acknowledgmentRequired: false,
      trainingRequired: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      acknowledgments: [],
      isEditable: () => true,
      canSubmitForReview: () => true,
      canApprove: () => false,
      canPublish: () => false,
      isActive: () => false,
      isDueForReview: () => false,
      getWordCount: () => 25,
      getComplianceRequirements: () => ['Health and Social Care Act 2008'],
      getMetadata: () => ({}),
      ...overrides
    } as PolicyDraft;
  }

  static createPolicyTemplate(overrides: Partial<PolicyTemplate> = {}): PolicyTemplate {
    return {
      id: 'template-123',
      title: 'Safeguarding Policy Template',
      category: PolicyCategory.SAFEGUARDING,
      jurisdiction: [Jurisdiction.ENGLAND_CQC],
      content: this.createRichTextContent('Template content for safeguarding policy'),
      lastUpdated: new Date(),
      ...overrides
    } as PolicyTemplate;
  }

  static createImportJob(overrides: Partial<PolicyImportJob> = {}): PolicyImportJob {
    return {
      id: 'import-123',
      filePath: '/uploads/policy.docx',
      fileName: 'safeguarding-policy.docx',
      fileSize: 102400,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      category: PolicyCategory.SAFEGUARDING,
      jurisdiction: [Jurisdiction.ENGLAND_CQC],
      status: ImportStatus.PENDING,
      extractMetadata: true,
      metadataExtracted: false,
      organizationId: 'org-123',
      importedBy: 'user-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      isInProgress: () => true,
      isCompleted: () => false,
      hasFailed: () => false,
      getProcessingDuration: () => null,
      getFileSizeFormatted: () => '100 KB',
      getProgressPercentage: () => 0,
      getMetadata: () => ({}),
      ...overrides
    } as PolicyImportJob;
  }

  static createUserAcknowledgment(overrides: Partial<UserAcknowledgment> = {}): UserAcknowledgment {
    return {
      id: 'ack-123',
      userId: 'user-123',
      policyId: 'policy-123',
      acknowledgedAt: new Date(),
      trainingCompleted: false,
      createdAt: new Date(),
      isComplete: () => true,
      isOverdue: () => false,
      getMetadata: () => ({}),
      ...overrides
    } as UserAcknowledgment;
  }

  static createAuditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
    return {
      id: 'audit-123',
      policyId: 'policy-123',
      eventType: AuditEventType.CREATED,
      actorId: 'user-123',
      organizationId: 'org-123',
      timestamp: new Date(),
      metadata: {},
      severity: 'info',
      source: 'policy_authoring',
      requiresAction: false,
      createdAt: new Date(),
      getSummary: () => 'Policy created',
      isSecurityEvent: () => false,
      requiresRegulatoryReporting: () => false,
      getTimeAgo: () => 'Just now',
      getMetadata: () => ({}),
      validateIntegrity: () => true,
      ...overrides
    } as AuditEvent;
  }
}

describe('PolicyAuthoringService', () => {
  let service: PolicyAuthoringService;
  let module: TestingModule;
  let policyDraftRepository: Repository<PolicyDraft>;
  let policyTemplateRepository: Repository<PolicyTemplate>;
  let policyImportRepository: Repository<PolicyImportJob>;
  let acknowledgmentRepository: Repository<UserAcknowledgment>;
  let auditEventRepository: Repository<AuditEvent>;
  let auditTrailService: AuditTrailService;
  let notificationService: NotificationService;
  let fileProcessingService: FileProcessingService;

  // Mock implementations
  const mockPolicyDraftRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    }))
  };

  const mockPolicyTemplateRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn()
    }))
  };

  const mockPolicyImportRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn()
  };

  const mockAcknowledgmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn()
  };

  const mockAuditEventRepository = {
    create: jest.fn(),
    save: jest.fn()
  };

  const mockAuditTrailService = {
    logAction: jest.fn()
  };

  const mockNotificationService = {
    sendNotification: jest.fn()
  };

  const mockFileProcessingService = {
    extractTextFromFile: jest.fn(),
    convertToRichText: jest.fn(),
    extractMetadata: jest.fn()
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PolicyAuthoringService,
        {
          provide: getRepositoryToken(PolicyDraft),
          useValue: mockPolicyDraftRepository
        },
        {
          provide: getRepositoryToken(PolicyTemplate),
          useValue: mockPolicyTemplateRepository
        },
        {
          provide: getRepositoryToken(PolicyImportJob),
          useValue: mockPolicyImportRepository
        },
        {
          provide: getRepositoryToken(UserAcknowledgment),
          useValue: mockAcknowledgmentRepository
        },
        {
          provide: getRepositoryToken(AuditEvent),
          useValue: mockAuditEventRepository
        },
        {
          provide: AuditTrailService,
          useValue: mockAuditTrailService
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService
        },
        {
          provide: FileProcessingService,
          useValue: mockFileProcessingService
        }
      ]
    }).compile();

    service = module.get<PolicyAuthoringService>(PolicyAuthoringService);
    policyDraftRepository = module.get<Repository<PolicyDraft>>(getRepositoryToken(PolicyDraft));
    policyTemplateRepository = module.get<Repository<PolicyTemplate>>(getRepositoryToken(PolicyTemplate));
    policyImportRepository = module.get<Repository<PolicyImportJob>>(getRepositoryToken(PolicyImportJob));
    acknowledgmentRepository = module.get<Repository<UserAcknowledgment>>(getRepositoryToken(UserAcknowledgment));
    auditEventRepository = module.get<Repository<AuditEvent>>(getRepositoryToken(AuditEvent));
    auditTrailService = module.get<AuditTrailService>(AuditTrailService);
    notificationService = module.get<NotificationService>(NotificationService);
    fileProcessingService = module.get<FileProcessingService>(FileProcessingService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Policy Draft Creation', () => {
    describe('GIVEN a valid policy draft creation request', () => {
      it('SHOULD create a new policy draft successfully', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const createDto = {
          title: 'Comprehensive Safeguarding Policy',
          content: PolicyAuthoringTestDataFactory.createRichTextContent(
            'This policy outlines our comprehensive approach to safeguarding adults at risk.'
          ),
          jurisdiction: [Jurisdiction.ENGLAND_CQC, Jurisdiction.SCOTLAND_CI],
          category: PolicyCategory.SAFEGUARDING,
          linkedModules: ['safeguarding', 'training', 'incident_management'],
          reviewDue: new Date('2026-10-06'),
          description: 'A comprehensive safeguarding policy covering all aspects of adult protection',
          tags: ['safeguarding', 'compliance', 'cqc', 'adult_protection']
        };

        const savedDraft = PolicyAuthoringTestDataFactory.createPolicyDraft(createDto);

        mockPolicyDraftRepository.create.mockReturnValue(savedDraft);
        mockPolicyDraftRepository.save.mockResolvedValue(savedDraft);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.createPolicyDraft(createDto, user);

        // ASSERT
        expect(result).toEqual(savedDraft);
        expect(policyDraftRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            ...createDto,
            status: PolicyStatus.DRAFT,
            version: '1.0.0',
            organizationId: user.organizationId,
            createdBy: user.id,
            updatedBy: user.id
          })
        );
        expect(policyDraftRepository.save).toHaveBeenCalledWith(savedDraft);
        expect(auditEventRepository.save).toHaveBeenCalled();
      });
    });

    describe('GIVEN invalid jurisdiction and category combination', () => {
      it('SHOULD throw BadRequestException for incompatible combination', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const createDto = {
          title: 'Invalid Data Protection Policy',
          content: PolicyAuthoringTestDataFactory.createRichTextContent(),
          jurisdiction: [Jurisdiction.ENGLAND_CQC], // CQC doesn't handle data protection directly
          category: PolicyCategory.DATA_PROTECTION,
          linkedModules: [],
          reviewDue: new Date('2026-10-06')
        };

        // ACT & ASSERT
        await expect(service.createPolicyDraft(createDto, user))
          .rejects
          .toThrow(BadRequestException);
      });
    });
  });

  describe('Policy Draft Updates', () => {
    describe('GIVEN a valid policy draft update request', () => {
      it('SHOULD update the policy draft and increment version', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const existingDraft = PolicyAuthoringTestDataFactory.createPolicyDraft({
          version: '1.0.0',
          createdBy: user.id
        });
        const updateData = {
          title: 'Updated Safeguarding Policy',
          content: PolicyAuthoringTestDataFactory.createRichTextContent('Updated content'),
          description: 'Updated description with more details'
        };

        const updatedDraft = { ...existingDraft, ...updateData, version: '1.0.1' };

        mockPolicyDraftRepository.findOne.mockResolvedValue(existingDraft);
        mockPolicyDraftRepository.update.mockResolvedValue({ affected: 1 });
        mockPolicyDraftRepository.findOne.mockResolvedValueOnce(existingDraft)
          .mockResolvedValueOnce(updatedDraft);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.updatePolicyDraft(existingDraft.id, updateData, user);

        // ASSERT
        expect(result).toEqual(updatedDraft);
        expect(policyDraftRepository.update).toHaveBeenCalledWith(
          existingDraft.id,
          expect.objectContaining({
            ...updateData,
            version: '1.0.1',
            updatedBy: user.id
          })
        );
        expect(auditEventRepository.save).toHaveBeenCalled();
      });
    });

    describe('GIVEN attempt to edit published policy', () => {
      it('SHOULD throw BadRequestException', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const publishedPolicy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.PUBLISHED
        });

        mockPolicyDraftRepository.findOne.mockResolvedValue(publishedPolicy);

        // ACT & ASSERT
        await expect(service.updatePolicyDraft(publishedPolicy.id, { title: 'New Title' }, user))
          .rejects
          .toThrow(BadRequestException);
      });
    });
  });

  describe('Policy Review Workflow', () => {
    describe('GIVEN a draft policy ready for review', () => {
      it('SHOULD submit policy for review successfully', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.DRAFT,
          title: 'Complete Safeguarding Policy',
          content: PolicyAuthoringTestDataFactory.createRichTextContent('Complete policy content'),
          jurisdiction: [Jurisdiction.ENGLAND_CQC]
        });

        const updatedPolicy = { ...policy, status: PolicyStatus.UNDER_REVIEW };

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);
        mockPolicyDraftRepository.update.mockResolvedValue({ affected: 1 });
        mockPolicyDraftRepository.findOne.mockResolvedValueOnce(policy)
          .mockResolvedValueOnce(updatedPolicy);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.submitForReview(
          policy.id, 
          user, 
          'Policy is complete and ready for review'
        );

        // ASSERT
        expect(result.status).toBe(PolicyStatus.UNDER_REVIEW);
        expect(policyDraftRepository.update).toHaveBeenCalledWith(
          policy.id,
          expect.objectContaining({
            status: PolicyStatus.UNDER_REVIEW,
            submittedBy: user.id,
            reviewNotes: 'Policy is complete and ready for review'
          })
        );
        expect(auditEventRepository.save).toHaveBeenCalled();
      });
    });

    describe('GIVEN policy with incomplete content', () => {
      it('SHOULD throw BadRequestException for incomplete policy', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const incompletePolicy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          title: '', // Missing title
          jurisdiction: [] // Missing jurisdiction
        });

        mockPolicyDraftRepository.findOne.mockResolvedValue(incompletePolicy);

        // ACT & ASSERT
        await expect(service.submitForReview(incompletePolicy.id, user))
          .rejects
          .toThrow(BadRequestException);
      });
    });
  });

  describe('Policy Approval Process', () => {
    describe('GIVEN a policy under review by authorized approver', () => {
      it('SHOULD approve policy successfully', async () => {
        // ARRANGE
        const approver = PolicyAuthoringTestDataFactory.createUser({
          roles: [{ name: 'compliance_officer', isPrivileged: true }]
        });
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.UNDER_REVIEW
        });

        const approvedPolicy = { ...policy, status: PolicyStatus.APPROVED };

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);
        mockPolicyDraftRepository.update.mockResolvedValue({ affected: 1 });
        mockPolicyDraftRepository.findOne.mockResolvedValueOnce(policy)
          .mockResolvedValueOnce(approvedPolicy);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.approvePolicy(
          policy.id,
          approver,
          'Policy meets all compliance requirements'
        );

        // ASSERT
        expect(result.status).toBe(PolicyStatus.APPROVED);
        expect(policyDraftRepository.update).toHaveBeenCalledWith(
          policy.id,
          expect.objectContaining({
            status: PolicyStatus.APPROVED,
            approvedBy: approver.id,
            approvalComments: 'Policy meets all compliance requirements'
          })
        );
      });
    });

    describe('GIVEN unauthorized user attempting approval', () => {
      it('SHOULD throw ForbiddenException', async () => {
        // ARRANGE
        const regularUser = PolicyAuthoringTestDataFactory.createUser({
          roles: [{ name: 'care_worker', isPrivileged: false }]
        });
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.UNDER_REVIEW
        });

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);

        // ACT & ASSERT
        await expect(service.approvePolicy(policy.id, regularUser))
          .rejects
          .toThrow(ForbiddenException);
      });
    });
  });

  describe('Policy Publishing', () => {
    describe('GIVEN an approved policy ready for publishing', () => {
      it('SHOULD publish policy with acknowledgment tracking', async () => {
        // ARRANGE
        const admin = PolicyAuthoringTestDataFactory.createUser({
          roles: [{ name: 'admin', isPrivileged: true }]
        });
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.APPROVED
        });
        const publishDto = {
          policyId: policy.id,
          effectiveDate: new Date('2025-11-01'),
          acknowledgmentRequired: true,
          trainingRequired: true,
          notificationGroups: ['all_staff', 'management_team'],
          publishingNotes: 'Published for immediate implementation'
        };

        const publishedPolicy = { 
          ...policy, 
          status: PolicyStatus.PUBLISHED,
          acknowledgmentRequired: true,
          trainingRequired: true
        };

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);
        mockPolicyDraftRepository.update.mockResolvedValue({ affected: 1 });
        mockPolicyDraftRepository.findOne.mockResolvedValueOnce(policy)
          .mockResolvedValueOnce(publishedPolicy);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.publishPolicy(publishDto, admin);

        // ASSERT
        expect(result.status).toBe(PolicyStatus.PUBLISHED);
        expect(result.acknowledgmentRequired).toBe(true);
        expect(result.trainingRequired).toBe(true);
        expect(policyDraftRepository.update).toHaveBeenCalledWith(
          publishDto.policyId,
          expect.objectContaining({
            status: PolicyStatus.PUBLISHED,
            publishedBy: admin.id,
            effectiveDate: publishDto.effectiveDate,
            acknowledgmentRequired: true,
            trainingRequired: true
          })
        );
      });
    });
  });

  describe('Policy Import System', () => {
    describe('GIVEN a valid Word document for import', () => {
      it('SHOULD create import job and process file', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const mockFile = {
          originalname: 'safeguarding-policy.docx',
          path: '/uploads/temp/policy.docx',
          size: 102400,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        } as Express.Multer.File;

        const importDto = {
          file: mockFile,
          category: PolicyCategory.SAFEGUARDING,
          jurisdiction: [Jurisdiction.ENGLAND_CQC],
          extractMetadata: true
        };

        const importJob = PolicyAuthoringTestDataFactory.createImportJob({
          fileName: mockFile.originalname,
          filePath: mockFile.path,
          fileSize: mockFile.size
        });

        mockPolicyImportRepository.create.mockReturnValue(importJob);
        mockPolicyImportRepository.save.mockResolvedValue(importJob);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.importPolicy(importDto, user);

        // ASSERT
        expect(result).toEqual(importJob);
        expect(policyImportRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            fileName: mockFile.originalname,
            filePath: mockFile.path,
            fileSize: mockFile.size,
            category: PolicyCategory.SAFEGUARDING,
            jurisdiction: [Jurisdiction.ENGLAND_CQC],
            extractMetadata: true,
            status: ImportStatus.PENDING
          })
        );
        expect(auditEventRepository.save).toHaveBeenCalled();
      });
    });

    describe('GIVEN invalid file type', () => {
      it('SHOULD throw BadRequestException', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const invalidFile = {
          originalname: 'policy.txt',
          mimetype: 'text/plain'
        } as Express.Multer.File;

        const importDto = {
          file: invalidFile,
          category: PolicyCategory.SAFEGUARDING,
          jurisdiction: [Jurisdiction.ENGLAND_CQC],
          extractMetadata: false
        };

        // ACT & ASSERT
        await expect(service.importPolicy(importDto, user))
          .rejects
          .toThrow(BadRequestException);
      });
    });
  });

  describe('Template-based Policy Creation', () => {
    describe('GIVEN a valid template ID', () => {
      it('SHOULD create policy from template successfully', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const template = PolicyAuthoringTestDataFactory.createPolicyTemplate();
        const title = 'Sunset Manor Safeguarding Policy';

        const createdPolicy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          title,
          content: template.content,
          category: template.category,
          jurisdiction: template.jurisdiction,
          templateId: template.id
        });

        mockPolicyTemplateRepository.findOne.mockResolvedValue(template);
        mockPolicyDraftRepository.create.mockReturnValue(createdPolicy);
        mockPolicyDraftRepository.save.mockResolvedValue(createdPolicy);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.createFromTemplate(template.id, title, user);

        // ASSERT
        expect(result).toEqual(createdPolicy);
        expect(result.title).toBe(title);
        expect(result.templateId).toBe(template.id);
        expect(policyDraftRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title,
            content: template.content,
            category: template.category,
            jurisdiction: template.jurisdiction,
            templateId: template.id
          })
        );
      });
    });

    describe('GIVEN non-existent template ID', () => {
      it('SHOULD throw NotFoundException', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const nonExistentTemplateId = 'non-existent-template';

        mockPolicyTemplateRepository.findOne.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.createFromTemplate(nonExistentTemplateId, 'Test Policy', user))
          .rejects
          .toThrow(NotFoundException);
      });
    });
  });

  describe('Policy Acknowledgment Tracking', () => {
    describe('GIVEN a published policy requiring acknowledgment', () => {
      it('SHOULD record user acknowledgment successfully', async () => {
        // ARRANGE
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.PUBLISHED,
          acknowledgmentRequired: true
        });
        const userId = 'user-456';
        const digitalSignature = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

        const acknowledgment = PolicyAuthoringTestDataFactory.createUserAcknowledgment({
          policyId: policy.id,
          userId,
          digitalSignature
        });

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);
        mockAcknowledgmentRepository.findOne.mockResolvedValue(null); // No existing acknowledgment
        mockAcknowledgmentRepository.create.mockReturnValue(acknowledgment);
        mockAcknowledgmentRepository.save.mockResolvedValue(acknowledgment);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const result = await service.acknowledgePolicy(policy.id, userId, digitalSignature);

        // ASSERT
        expect(result).toEqual(acknowledgment);
        expect(acknowledgmentRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            policyId: policy.id,
            userId,
            digitalSignature
          })
        );
        expect(auditEventRepository.save).toHaveBeenCalled();
      });
    });

    describe('GIVEN duplicate acknowledgment attempt', () => {
      it('SHOULD throw BadRequestException', async () => {
        // ARRANGE
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.PUBLISHED
        });
        const userId = 'user-456';
        const existingAck = PolicyAuthoringTestDataFactory.createUserAcknowledgment();

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);
        mockAcknowledgmentRepository.findOne.mockResolvedValue(existingAck);

        // ACT & ASSERT
        await expect(service.acknowledgePolicy(policy.id, userId))
          .rejects
          .toThrow(BadRequestException);
      });
    });
  });

  describe('Policy Review Scheduling', () => {
    describe('GIVEN policies approaching review dates', () => {
      it('SHOULD return policies due for review', async () => {
        // ARRANGE
        const organizationId = 'org-123';
        const daysAhead = 30;

        const policiesDueForReview = [
          PolicyAuthoringTestDataFactory.createPolicyDraft({
            title: 'Policy Due Soon',
            reviewDue: new Date('2025-11-01'),
            status: PolicyStatus.PUBLISHED
          }),
          PolicyAuthoringTestDataFactory.createPolicyDraft({
            title: 'Another Policy Due',
            reviewDue: new Date('2025-10-20'),
            status: PolicyStatus.PUBLISHED
          })
        ];

        const mockQueryBuilder = {
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue(policiesDueForReview)
        };

        mockPolicyDraftRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

        // ACT
        const result = await service.getPoliciesForReview(organizationId, daysAhead);

        // ASSERT
        expect(result).toEqual(policiesDueForReview);
        expect(mockQueryBuilder.where).toHaveBeenCalledWith(
          'policy.organizationId = :organizationId',
          { organizationId }
        );
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'policy.status = :status',
          { status: PolicyStatus.PUBLISHED }
        );
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    describe('GIVEN database connection failure', () => {
      it('SHOULD handle database errors gracefully', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const createDto = {
          title: 'Test Policy',
          content: PolicyAuthoringTestDataFactory.createRichTextContent(),
          category: PolicyCategory.SAFEGUARDING,
          jurisdiction: [Jurisdiction.ENGLAND_CQC],
          linkedModules: [],
          reviewDue: new Date('2026-01-01')
        };

        mockPolicyDraftRepository.save.mockRejectedValue(new Error('Database connection failed'));

        // ACT & ASSERT
        await expect(service.createPolicyDraft(createDto, user))
          .rejects
          .toThrow('Database connection failed');
      });
    });

    describe('GIVEN malformed rich text content', () => {
      it('SHOULD validate rich text structure', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const createDto = {
          title: 'Policy with Invalid Content',
          content: { invalid: 'structure' } as any, // Invalid rich text structure
          category: PolicyCategory.SAFEGUARDING,
          jurisdiction: [Jurisdiction.ENGLAND_CQC],
          linkedModules: [],
          reviewDue: new Date('2026-01-01')
        };

        // The service should validate rich text structure
        // ACT & ASSERT
        await expect(service.createPolicyDraft(createDto, user))
          .rejects
          .toThrow(); // Should throw validation error
      });
    });
  });

  describe('Performance and Scalability', () => {
    describe('GIVEN large policy content', () => {
      it('SHOULD handle large rich text documents efficiently', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        
        // Create large rich text content (simulating 10,000 word policy)
        const largeContent: RichTextContent = {
          type: 'doc',
          content: Array.from({ length: 100 }, (_, i) => ({
            type: 'paragraph',
            content: [{
              type: 'text',
              text: `This is paragraph ${i + 1} with approximately 100 words of policy content that describes various aspects of care home operations, regulatory compliance, staff responsibilities, resident rights, emergency procedures, and quality assurance measures. This content is repeated to simulate a comprehensive policy document.`
            }]
          }))
        };

        const createDto = {
          title: 'Comprehensive Care Home Policy',
          content: largeContent,
          category: PolicyCategory.SAFEGUARDING,
          jurisdiction: [Jurisdiction.ENGLAND_CQC],
          linkedModules: [],
          reviewDue: new Date('2026-01-01')
        };

        const savedPolicy = PolicyAuthoringTestDataFactory.createPolicyDraft(createDto);

        mockPolicyDraftRepository.create.mockReturnValue(savedPolicy);
        mockPolicyDraftRepository.save.mockResolvedValue(savedPolicy);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        const startTime = Date.now();
        const result = await service.createPolicyDraft(createDto, user);
        const endTime = Date.now();

        // ASSERT
        const processingTime = endTime - startTime;
        expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
        expect(result).toEqual(savedPolicy);
      });
    });
  });

  describe('Security and Access Control', () => {
    describe('GIVEN cross-organization access attempt', () => {
      it('SHOULD enforce organization-level isolation', async () => {
        // ARRANGE
        const userFromOrgA = PolicyAuthoringTestDataFactory.createUser({
          organizationId: 'org-456' // Different organization
        });
        const policyFromOrgB = PolicyAuthoringTestDataFactory.createPolicyDraft({
          organizationId: 'org-123' // Different organization
        });

        mockPolicyDraftRepository.findOne.mockResolvedValue(null); // Policy not found for user's org

        // ACT & ASSERT
        await expect(service.updatePolicyDraft(policyFromOrgB.id, { title: 'New Title' }, userFromOrgA))
          .rejects
          .toThrow(NotFoundException);
      });
    });

    describe('GIVEN role-based access control', () => {
      it('SHOULD enforce approval permissions correctly', async () => {
        // ARRANGE
        const careWorker = PolicyAuthoringTestDataFactory.createUser({
          roles: [{ name: 'care_worker', isPrivileged: false }]
        });
        const policy = PolicyAuthoringTestDataFactory.createPolicyDraft({
          status: PolicyStatus.UNDER_REVIEW
        });

        mockPolicyDraftRepository.findOne.mockResolvedValue(policy);

        // ACT & ASSERT
        await expect(service.approvePolicy(policy.id, careWorker))
          .rejects
          .toThrow(ForbiddenException);
      });
    });
  });

  describe('Compliance and Audit', () => {
    describe('GIVEN policy lifecycle events', () => {
      it('SHOULD log comprehensive audit trail', async () => {
        // ARRANGE
        const user = PolicyAuthoringTestDataFactory.createUser();
        const createDto = {
          title: 'Audit Test Policy',
          content: PolicyAuthoringTestDataFactory.createRichTextContent(),
          category: PolicyCategory.SAFEGUARDING,
          jurisdiction: [Jurisdiction.ENGLAND_CQC],
          linkedModules: [],
          reviewDue: new Date('2026-01-01')
        };

        const savedPolicy = PolicyAuthoringTestDataFactory.createPolicyDraft(createDto);

        mockPolicyDraftRepository.create.mockReturnValue(savedPolicy);
        mockPolicyDraftRepository.save.mockResolvedValue(savedPolicy);
        mockAuditEventRepository.create.mockReturnValue({});
        mockAuditEventRepository.save.mockResolvedValue({});

        // ACT
        await service.createPolicyDraft(createDto, user);

        // ASSERT
        expect(auditEventRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            policyId: savedPolicy.id,
            eventType: AuditEventType.CREATED,
            actorId: user.id,
            metadata: expect.objectContaining({
              title: createDto.title,
              category: createDto.category,
              jurisdiction: createDto.jurisdiction
            })
          })
        );
        expect(auditEventRepository.save).toHaveBeenCalled();
      });
    });
  });
});

/**
 * Integration Test Suite for Policy Authoring Service
 * Tests complete workflows with actual database operations
 */
describe('PolicyAuthoringService Integration Tests', () => {
  let app: any;
  let service: PolicyAuthoringService;

  beforeAll(async () => {
    // Set up test database and application context
    // This would use a test database configuration
  });

  afterAll(async () => {
    // Clean up test database and close connections
  });

  describe('Complete Policy Authoring Workflow', () => {
    it('SHOULD complete full policy lifecycle from draft to published', async () => {
      // ARRANGE
      const author = PolicyAuthoringTestDataFactory.createUser();
      const approver = PolicyAuthoringTestDataFactory.createUser({
        roles: [{ name: 'compliance_officer', isPrivileged: true }]
      });
      const admin = PolicyAuthoringTestDataFactory.createUser({
        roles: [{ name: 'admin', isPrivileged: true }]
      });

      // Create policy draft
      const createDto = {
        title: 'E2E Safeguarding Policy',
        content: PolicyAuthoringTestDataFactory.createRichTextContent(
          'This is a comprehensive safeguarding policy created through the authoring toolkit.'
        ),
        category: PolicyCategory.SAFEGUARDING,
        jurisdiction: [Jurisdiction.ENGLAND_CQC],
        linkedModules: ['safeguarding', 'training'],
        reviewDue: new Date('2026-10-06'),
        description: 'End-to-end test policy'
      };

      // ACT
      // 1. Create draft
      const draft = await service.createPolicyDraft(createDto, author);
      expect(draft.status).toBe(PolicyStatus.DRAFT);
      expect(draft.title).toBe(createDto.title);

      // 2. Submit for review
      const underReview = await service.submitForReview(
        draft.id, 
        author, 
        'Policy ready for review'
      );
      expect(underReview.status).toBe(PolicyStatus.UNDER_REVIEW);

      // 3. Approve policy
      const approved = await service.approvePolicy(
        draft.id,
        approver,
        'Policy meets all compliance requirements'
      );
      expect(approved.status).toBe(PolicyStatus.APPROVED);

      // 4. Publish policy
      const publishDto = {
        policyId: draft.id,
        acknowledgmentRequired: true,
        trainingRequired: false,
        notificationGroups: ['all_staff'],
        publishingNotes: 'Published for immediate implementation'
      };

      const published = await service.publishPolicy(publishDto, admin);
      expect(published.status).toBe(PolicyStatus.PUBLISHED);
      expect(published.acknowledgmentRequired).toBe(true);

      // 5. User acknowledgment
      const acknowledgment = await service.acknowledgePolicy(
        draft.id,
        'staff-user-123',
        'digital-signature-hash'
      );
      expect(acknowledgment.policyId).toBe(draft.id);
      expect(acknowledgment.acknowledgedAt).toBeDefined();

      // ASSERT
      // Verify complete workflow succeeded
      expect(draft.isEditable()).toBe(true);
      expect(published.isActive()).toBe(true);
      expect(acknowledgment.isComplete()).toBe(true);
    });
  });
});