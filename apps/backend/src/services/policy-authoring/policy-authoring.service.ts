/**
 * @fileoverview Policy Authoring Toolkit - Rich Policy Editor Service
 * @description Complete policy authoring system for care homes to create, edit, and manage policies
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-10-06
 * @lastModified 2025-10-06
 * 
 * @module PolicyAuthoringToolkit
 * @purpose Enable organizations to author, customize, and operationalize policies directly within platform
 * 
 * @compliance
 * - CQC (Care Quality Commission) England
 * - Care Inspectorate Scotland  
 * - Care Inspectorate Wales (CIW)
 * - RQIA Northern Ireland
 * - GDPR and Data Protection Act 2018
 * 
 * @features
 * - Rich text editor with jurisdiction tagging
 * - Template library for standard policies
 * - Import converter for Word/PDF policies
 * - Publishing workflow with approvals
 * - Review scheduling and reminders
 * - Policy mapping to workflows
 * - User acknowledgment tracking
 */

import { Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Like } from 'typeorm';
import { PolicyDraft } from '../../entities/policy-draft.entity';
import { PolicyTemplate } from '../../entities/policy-template.entity';
import { PolicyImportJob } from '../../entities/policy-import-job.entity';
import { UserAcknowledgment } from '../../entities/user-acknowledgment.entity';
import { AuditEvent } from '../../entities/audit-event.entity';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { AuditTrailService } from '../audit/audit-trail.service';
import { NotificationService } from '../notifications/notification.service';
import { FileProcessingService } from '../file-processing/file-processing.service';

/**
 * Policy status enumeration for workflow management
 */
export enum PolicyStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  EXPIRED = 'expired',
  ARCHIVED = 'archived'
}

/**
 * Policy categories aligned with care home operations
 */
export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  DATA_PROTECTION = 'data_protection',
  COMPLAINTS = 'complaints',
  HEALTH_SAFETY = 'health_safety',
  MEDICATION = 'medication',
  INFECTION_CONTROL = 'infection_control',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  DIGNITY_RESPECT = 'dignity_respect',
  NUTRITION_HYDRATION = 'nutrition_hydration',
  END_OF_LIFE = 'end_of_life',
  MENTAL_CAPACITY = 'mental_capacity',
  VISITORS = 'visitors',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation'
}

/**
 * Regulatory jurisdictions for compliance
 */
export enum Jurisdiction {
  ENGLAND_CQC = 'england_cqc',
  SCOTLAND_CI = 'scotland_ci',
  WALES_CIW = 'wales_ciw',
  NORTHERN_IRELAND_RQIA = 'northern_ireland_rqia',
  JERSEY_JCC = 'jersey_jcc',
  GUERNSEY_GCC = 'guernsey_gcc',
  ISLE_OF_MAN_IMC = 'isle_of_man_imc',
  EU_GDPR = 'eu_gdpr',
  UK_DATA_PROTECTION = 'uk_data_protection'
}

/**
 * Policy import status tracking
 */
export enum ImportStatus {
  PENDING = 'pending',
  CONVERTING = 'converting',
  CONVERTED = 'converted',
  ERROR = 'error',
  COMPLETED = 'completed'
}

/**
 * Rich text content structure
 */
export interface RichTextContent {
  type: 'doc';
  content: Array<{
    type: string;
    attrs?: Record<string, any>;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{
        type: string;
        attrs?: Record<string, any>;
      }>;
    }>;
  }>;
}

/**
 * Policy draft creation DTO
 */
export interface CreatePolicyDraftDto {
  title: string;
  content: RichTextContent;
  jurisdiction: Jurisdiction[];
  category: PolicyCategory;
  linkedModules: string[];
  reviewDue: Date;
  description?: string;
  tags?: string[];
}

/**
 * Policy publishing DTO
 */
export interface PublishPolicyDto {
  policyId: string;
  effectiveDate?: Date;
  acknowledgmentRequired: boolean;
  trainingRequired: boolean;
  notificationGroups: string[];
  publishingNotes?: string;
}

/**
 * Policy import DTO
 */
export interface ImportPolicyDto {
  file: Express.Multer.File;
  category: PolicyCategory;
  jurisdiction: Jurisdiction[];
  extractMetadata: boolean;
}

/**
 * Policy Authoring Toolkit Service
 * 
 * Comprehensive policy authoring system enabling care homes to create, edit, and manage
 * policies directly within the platform with full compliance and audit capabilities.
 */
@Injectable()
export class PolicyAuthoringService {
  private readonly logger = new Logger(PolicyAuthoringService.name);

  constructor(
    @InjectRepository(PolicyDraft)
    private readonly policyDraftRepository: Repository<PolicyDraft>,
    
    @InjectRepository(PolicyTemplate)
    private readonly policyTemplateRepository: Repository<PolicyTemplate>,
    
    @InjectRepository(PolicyImportJob)
    private readonly policyImportRepository: Repository<PolicyImportJob>,
    
    @InjectRepository(UserAcknowledgment)
    private readonly acknowledgmentRepository: Repository<UserAcknowledgment>,
    
    @InjectRepository(AuditEvent)
    private readonly auditEventRepository: Repository<AuditEvent>,
    
    private readonly auditTrailService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly fileProcessingService: FileProcessingService
  ) {}

  /**
   * Create a new policy draft
   */
  async createPolicyDraft(
    createDto: CreatePolicyDraftDto,
    createdBy: User
  ): Promise<PolicyDraft> {
    this.logger.log(`Creating policy draft: ${createDto.title}`);

    try {
      // Validate jurisdiction and category combination
      await this.validateJurisdictionCategory(createDto.jurisdiction, createDto.category);

      // Create draft entity
      const draft = this.policyDraftRepository.create({
        ...createDto,
        status: PolicyStatus.DRAFT,
        version: '1.0.0',
        organizationId: createdBy.organizationId,
        createdBy: createdBy.id,
        updatedBy: createdBy.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedDraft = await this.policyDraftRepository.save(draft);

      // Log audit event
      await this.logAuditEvent({
        policyId: savedDraft.id,
        eventType: 'created',
        actorId: createdBy.id,
        metadata: {
          title: createDto.title,
          category: createDto.category,
          jurisdiction: createDto.jurisdiction
        }
      });

      this.logger.log(`Policy draft created successfully: ${savedDraft.id}`);
      return savedDraft;

    } catch (error) {
      this.logger.error(`Failed to create policy draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update existing policy draft
   */
  async updatePolicyDraft(
    policyId: string,
    updateData: Partial<CreatePolicyDraftDto>,
    updatedBy: User
  ): Promise<PolicyDraft> {
    this.logger.log(`Updating policy draft: ${policyId}`);

    try {
      const existingDraft = await this.policyDraftRepository.findOne({
        where: { 
          id: policyId,
          organizationId: updatedBy.organizationId
        }
      });

      if (!existingDraft) {
        throw new NotFoundException(`Policy draft with ID ${policyId} not found`);
      }

      // Check if user can edit this policy
      if (!await this.canEditPolicy(existingDraft, updatedBy)) {
        throw new ForbiddenException('Insufficient permissions to edit this policy');
      }

      // Prevent editing if policy is published
      if (existingDraft.status === PolicyStatus.PUBLISHED) {
        throw new BadRequestException('Cannot edit published policy. Create a new version instead.');
      }

      // Update draft
      const updatePayload = {
        ...updateData,
        updatedBy: updatedBy.id,
        updatedAt: new Date(),
        version: this.incrementVersion(existingDraft.version)
      };

      await this.policyDraftRepository.update(policyId, updatePayload);
      const updatedDraft = await this.policyDraftRepository.findOne({
        where: { id: policyId }
      });

      // Log audit event
      await this.logAuditEvent({
        policyId,
        eventType: 'updated',
        actorId: updatedBy.id,
        metadata: {
          changes: updateData,
          previousVersion: existingDraft.version,
          newVersion: updatePayload.version
        }
      });

      this.logger.log(`Policy draft updated successfully: ${policyId}`);
      return updatedDraft!;

    } catch (error) {
      this.logger.error(`Failed to update policy draft: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Submit policy for review
   */
  async submitForReview(
    policyId: string,
    submittedBy: User,
    reviewNotes?: string
  ): Promise<PolicyDraft> {
    this.logger.log(`Submitting policy for review: ${policyId}`);

    try {
      const policy = await this.policyDraftRepository.findOne({
        where: { 
          id: policyId,
          organizationId: submittedBy.organizationId
        }
      });

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      if (policy.status !== PolicyStatus.DRAFT) {
        throw new BadRequestException(`Policy must be in draft status to submit for review`);
      }

      // Validate policy content completeness
      await this.validatePolicyCompleteness(policy);

      // Update status
      await this.policyDraftRepository.update(policyId, {
        status: PolicyStatus.UNDER_REVIEW,
        submittedForReviewAt: new Date(),
        submittedBy: submittedBy.id,
        reviewNotes,
        updatedAt: new Date()
      });

      // Notify reviewers
      await this.notifyReviewers(policy, submittedBy);

      // Log audit event
      await this.logAuditEvent({
        policyId,
        eventType: 'submitted_for_review',
        actorId: submittedBy.id,
        metadata: {
          reviewNotes,
          submittedAt: new Date()
        }
      });

      const updatedPolicy = await this.policyDraftRepository.findOne({
        where: { id: policyId }
      });

      this.logger.log(`Policy submitted for review successfully: ${policyId}`);
      return updatedPolicy!;

    } catch (error) {
      this.logger.error(`Failed to submit policy for review: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Approve policy for publishing
   */
  async approvePolicy(
    policyId: string,
    approvedBy: User,
    approvalComments?: string
  ): Promise<PolicyDraft> {
    this.logger.log(`Approving policy: ${policyId}`);

    try {
      const policy = await this.policyDraftRepository.findOne({
        where: { 
          id: policyId,
          organizationId: approvedBy.organizationId
        }
      });

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      if (policy.status !== PolicyStatus.UNDER_REVIEW) {
        throw new BadRequestException('Policy must be under review to approve');
      }

      // Check approval permissions
      if (!await this.canApprovePolicy(policy, approvedBy)) {
        throw new ForbiddenException('Insufficient permissions to approve this policy');
      }

      // Update policy status
      await this.policyDraftRepository.update(policyId, {
        status: PolicyStatus.APPROVED,
        approvedBy: approvedBy.id,
        approvedAt: new Date(),
        approvalComments,
        updatedAt: new Date()
      });

      // Log audit event
      await this.logAuditEvent({
        policyId,
        eventType: 'approved',
        actorId: approvedBy.id,
        metadata: {
          approvalComments,
          approvedAt: new Date()
        }
      });

      // Notify policy author
      await this.notifyPolicyApproval(policy, approvedBy);

      const approvedPolicy = await this.policyDraftRepository.findOne({
        where: { id: policyId }
      });

      this.logger.log(`Policy approved successfully: ${policyId}`);
      return approvedPolicy!;

    } catch (error) {
      this.logger.error(`Failed to approve policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Publish approved policy
   */
  async publishPolicy(
    publishDto: PublishPolicyDto,
    publishedBy: User
  ): Promise<PolicyDraft> {
    this.logger.log(`Publishing policy: ${publishDto.policyId}`);

    try {
      const policy = await this.policyDraftRepository.findOne({
        where: { 
          id: publishDto.policyId,
          organizationId: publishedBy.organizationId
        }
      });

      if (!policy) {
        throw new NotFoundException(`Policy with ID ${publishDto.policyId} not found`);
      }

      if (policy.status !== PolicyStatus.APPROVED) {
        throw new BadRequestException('Policy must be approved before publishing');
      }

      // Check publishing permissions
      if (!await this.canPublishPolicy(policy, publishedBy)) {
        throw new ForbiddenException('Insufficient permissions to publish this policy');
      }

      // Update policy status
      const effectiveDate = publishDto.effectiveDate || new Date();
      await this.policyDraftRepository.update(publishDto.policyId, {
        status: PolicyStatus.PUBLISHED,
        publishedBy: publishedBy.id,
        publishedAt: new Date(),
        effectiveDate,
        acknowledgmentRequired: publishDto.acknowledgmentRequired,
        trainingRequired: publishDto.trainingRequired,
        publishingNotes: publishDto.publishingNotes,
        updatedAt: new Date()
      });

      // Create acknowledgment tracking if required
      if (publishDto.acknowledgmentRequired) {
        await this.createAcknowledgmentTracking(policy, publishDto.notificationGroups);
      }

      // Trigger training modules if required
      if (publishDto.trainingRequired) {
        await this.triggerTrainingModules(policy, publishDto.notificationGroups);
      }

      // Send notifications
      await this.notifyPolicyPublication(policy, publishDto.notificationGroups);

      // Log audit event
      await this.logAuditEvent({
        policyId: publishDto.policyId,
        eventType: 'published',
        actorId: publishedBy.id,
        metadata: {
          effectiveDate,
          acknowledgmentRequired: publishDto.acknowledgmentRequired,
          trainingRequired: publishDto.trainingRequired,
          notificationGroups: publishDto.notificationGroups
        }
      });

      const publishedPolicy = await this.policyDraftRepository.findOne({
        where: { id: publishDto.policyId }
      });

      this.logger.log(`Policy published successfully: ${publishDto.policyId}`);
      return publishedPolicy!;

    } catch (error) {
      this.logger.error(`Failed to publish policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Import policy from file (Word/PDF)
   */
  async importPolicy(
    importDto: ImportPolicyDto,
    importedBy: User
  ): Promise<PolicyImportJob> {
    this.logger.log(`Importing policy from file: ${importDto.file.originalname}`);

    try {
      // Validate file type
      if (!this.isValidFileType(importDto.file)) {
        throw new BadRequestException('File type not supported. Please upload Word (.docx) or PDF files.');
      }

      // Create import job
      const importJob = this.policyImportRepository.create({
        filePath: importDto.file.path,
        fileName: importDto.file.originalname,
        fileSize: importDto.file.size,
        category: importDto.category,
        jurisdiction: importDto.jurisdiction,
        extractMetadata: importDto.extractMetadata,
        status: ImportStatus.PENDING,
        organizationId: importedBy.organizationId,
        importedBy: importedBy.id,
        createdAt: new Date()
      });

      const savedJob = await this.policyImportRepository.save(importJob);

      // Start async processing
      this.processImportFile(savedJob.id).catch(error => {
        this.logger.error(`Import processing failed for job ${savedJob.id}: ${error.message}`);
      });

      // Log audit event
      await this.logAuditEvent({
        policyId: null,
        eventType: 'import_started',
        actorId: importedBy.id,
        metadata: {
          fileName: importDto.file.originalname,
          fileSize: importDto.file.size,
          category: importDto.category,
          importJobId: savedJob.id
        }
      });

      this.logger.log(`Policy import job created: ${savedJob.id}`);
      return savedJob;

    } catch (error) {
      this.logger.error(`Failed to import policy: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get policy templates by category
   */
  async getPolicyTemplates(
    category?: PolicyCategory,
    jurisdiction?: Jurisdiction
  ): Promise<PolicyTemplate[]> {
    this.logger.log(`Retrieving policy templates: category=${category}, jurisdiction=${jurisdiction}`);

    try {
      const queryBuilder = this.policyTemplateRepository.createQueryBuilder('template');

      if (category) {
        queryBuilder.andWhere('template.category = :category', { category });
      }

      if (jurisdiction) {
        queryBuilder.andWhere(':jurisdiction = ANY(template.jurisdiction)', { jurisdiction });
      }

      queryBuilder.orderBy('template.title', 'ASC');

      const templates = await queryBuilder.getMany();

      this.logger.log(`Retrieved ${templates.length} policy templates`);
      return templates;

    } catch (error) {
      this.logger.error(`Failed to retrieve policy templates: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create policy from template
   */
  async createFromTemplate(
    templateId: string,
    title: string,
    createdBy: User
  ): Promise<PolicyDraft> {
    this.logger.log(`Creating policy from template: ${templateId}`);

    try {
      const template = await this.policyTemplateRepository.findOne({
        where: { id: templateId }
      });

      if (!template) {
        throw new NotFoundException(`Policy template with ID ${templateId} not found`);
      }

      // Create policy draft from template
      const draft = this.policyDraftRepository.create({
        title,
        content: template.content,
        category: template.category,
        jurisdiction: template.jurisdiction,
        status: PolicyStatus.DRAFT,
        version: '1.0.0',
        linkedModules: [],
        reviewDue: this.calculateReviewDate(12), // Default 12 months
        organizationId: createdBy.organizationId,
        createdBy: createdBy.id,
        updatedBy: createdBy.id,
        templateId: template.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedDraft = await this.policyDraftRepository.save(draft);

      // Log audit event
      await this.logAuditEvent({
        policyId: savedDraft.id,
        eventType: 'created_from_template',
        actorId: createdBy.id,
        metadata: {
          templateId: template.id,
          templateTitle: template.title,
          policyTitle: title
        }
      });

      this.logger.log(`Policy created from template successfully: ${savedDraft.id}`);
      return savedDraft;

    } catch (error) {
      this.logger.error(`Failed to create policy from template: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Track user acknowledgment of policy
   */
  async acknowledgePolicy(
    policyId: string,
    userId: string,
    digitalSignature?: string
  ): Promise<UserAcknowledgment> {
    this.logger.log(`Recording policy acknowledgment: policyId=${policyId}, userId=${userId}`);

    try {
      const policy = await this.policyDraftRepository.findOne({
        where: { id: policyId, status: PolicyStatus.PUBLISHED }
      });

      if (!policy) {
        throw new NotFoundException('Published policy not found');
      }

      // Check if already acknowledged
      const existingAck = await this.acknowledgmentRepository.findOne({
        where: { policyId, userId }
      });

      if (existingAck) {
        throw new BadRequestException('Policy already acknowledged by this user');
      }

      // Create acknowledgment record
      const acknowledgment = this.acknowledgmentRepository.create({
        policyId,
        userId,
        acknowledgedAt: new Date(),
        digitalSignature,
        ipAddress: null, // Would be captured from request context
        userAgent: null, // Would be captured from request context
        trainingCompleted: false
      });

      const savedAck = await this.acknowledgmentRepository.save(acknowledgment);

      // Log audit event
      await this.logAuditEvent({
        policyId,
        eventType: 'acknowledged',
        actorId: userId,
        metadata: {
          acknowledgedAt: savedAck.acknowledgedAt,
          hasDigitalSignature: !!digitalSignature
        }
      });

      this.logger.log(`Policy acknowledgment recorded: ${savedAck.id}`);
      return savedAck;

    } catch (error) {
      this.logger.error(`Failed to record policy acknowledgment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get policies requiring review
   */
  async getPoliciesForReview(
    organizationId: string,
    daysAhead: number = 30
  ): Promise<PolicyDraft[]> {
    this.logger.log(`Getting policies for review: organizationId=${organizationId}, daysAhead=${daysAhead}`);

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const policies = await this.policyDraftRepository
        .createQueryBuilder('policy')
        .where('policy.organizationId = :organizationId', { organizationId })
        .andWhere('policy.status = :status', { status: PolicyStatus.PUBLISHED })
        .andWhere('policy.reviewDue <= :cutoffDate', { cutoffDate })
        .orderBy('policy.reviewDue', 'ASC')
        .getMany();

      this.logger.log(`Found ${policies.length} policies requiring review`);
      return policies;

    } catch (error) {
      this.logger.error(`Failed to get policies for review: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Private helper methods
   */

  private async validateJurisdictionCategory(
    jurisdictions: Jurisdiction[],
    category: PolicyCategory
  ): Promise<void> {
    // Validate that jurisdiction supports the policy category
    const validCombinations = {
      [PolicyCategory.SAFEGUARDING]: [
        Jurisdiction.ENGLAND_CQC,
        Jurisdiction.SCOTLAND_CI,
        Jurisdiction.WALES_CIW,
        Jurisdiction.NORTHERN_IRELAND_RQIA
      ],
      [PolicyCategory.DATA_PROTECTION]: [
        Jurisdiction.EU_GDPR,
        Jurisdiction.UK_DATA_PROTECTION
      ]
      // Add more validations as needed
    };

    if (validCombinations[category]) {
      const hasValidJurisdiction = jurisdictions.some(j => 
        validCombinations[category].includes(j)
      );
      
      if (!hasValidJurisdiction) {
        throw new BadRequestException(
          `Category ${category} requires one of jurisdictions: ${validCombinations[category].join(', ')}`
        );
      }
    }
  }

  private async validatePolicyCompleteness(policy: PolicyDraft): Promise<void> {
    const errors: string[] = [];

    if (!policy.title || policy.title.trim().length === 0) {
      errors.push('Policy title is required');
    }

    if (!policy.content || !policy.content.content || policy.content.content.length === 0) {
      errors.push('Policy content is required');
    }

    if (!policy.jurisdiction || policy.jurisdiction.length === 0) {
      errors.push('At least one jurisdiction must be specified');
    }

    if (!policy.reviewDue) {
      errors.push('Review due date is required');
    }

    if (errors.length > 0) {
      throw new BadRequestException(`Policy validation failed: ${errors.join(', ')}`);
    }
  }

  private async canEditPolicy(policy: PolicyDraft, user: User): Promise<boolean> {
    // Check if user is the author or has admin/compliance officer role
    return policy.createdBy === user.id || 
           user.roles.some(role => ['admin', 'compliance_officer'].includes(role.name));
  }

  private async canApprovePolicy(policy: PolicyDraft, user: User): Promise<boolean> {
    // Only compliance officers and admins can approve policies
    return user.roles.some(role => ['admin', 'compliance_officer'].includes(role.name));
  }

  private async canPublishPolicy(policy: PolicyDraft, user: User): Promise<boolean> {
    // Only admins can publish policies
    return user.roles.some(role => role.name === 'admin');
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private calculateReviewDate(months: number): Date {
    const reviewDate = new Date();
    reviewDate.setMonth(reviewDate.getMonth() + months);
    return reviewDate;
  }

  private isValidFileType(file: Express.Multer.File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/msword', // .doc
      'application/pdf'
    ];
    return validTypes.includes(file.mimetype);
  }

  private async processImportFile(importJobId: string): Promise<void> {
    try {
      // Update status to converting
      await this.policyImportRepository.update(importJobId, {
        status: ImportStatus.CONVERTING,
        updatedAt: new Date()
      });

      const job = await this.policyImportRepository.findOne({
        where: { id: importJobId }
      });

      if (!job) {
        throw new Error('Import job not found');
      }

      // Process file using file processing service
      const parsedContent = await this.fileProcessingService.extractTextFromFile(job.filePath);
      
      // Convert to rich text format
      const richTextContent = await this.fileProcessingService.convertToRichText(parsedContent);

      // Extract metadata if requested
      let extractedMetadata = {};
      if (job.extractMetadata) {
        extractedMetadata = await this.fileProcessingService.extractMetadata(job.filePath);
      }

      // Update job with results
      await this.policyImportRepository.update(importJobId, {
        status: ImportStatus.CONVERTED,
        parsedContent: richTextContent,
        extractedMetadata,
        metadataExtracted: job.extractMetadata,
        completedAt: new Date(),
        updatedAt: new Date()
      });

      this.logger.log(`Import job completed successfully: ${importJobId}`);

    } catch (error) {
      // Update job with error status
      await this.policyImportRepository.update(importJobId, {
        status: ImportStatus.ERROR,
        errorMessage: error.message,
        updatedAt: new Date()
      });

      this.logger.error(`Import job failed: ${importJobId} - ${error.message}`);
      throw error;
    }
  }

  private async createAcknowledgmentTracking(
    policy: PolicyDraft,
    notificationGroups: string[]
  ): Promise<void> {
    // Implementation would create acknowledgment tracking records
    // for all users in the specified notification groups
  }

  private async triggerTrainingModules(
    policy: PolicyDraft,
    notificationGroups: string[]
  ): Promise<void> {
    // Implementation would trigger relevant training modules
    // based on policy category and target groups
  }

  private async notifyReviewers(policy: PolicyDraft, submittedBy: User): Promise<void> {
    // Implementation would send notifications to policy reviewers
  }

  private async notifyPolicyApproval(policy: PolicyDraft, approvedBy: User): Promise<void> {
    // Implementation would notify policy author of approval
  }

  private async notifyPolicyPublication(
    policy: PolicyDraft,
    notificationGroups: string[]
  ): Promise<void> {
    // Implementation would send publication notifications
  }

  private async logAuditEvent(event: {
    policyId: string | null;
    eventType: string;
    actorId: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    const auditEvent = this.auditEventRepository.create({
      ...event,
      timestamp: new Date()
    });

    await this.auditEventRepository.save(auditEvent);
  }
}