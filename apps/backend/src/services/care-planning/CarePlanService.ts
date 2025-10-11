/**
 * @fileoverview Core service for care plan lifecycle management including
 * @module Care-planning/CarePlanService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Core service for care plan lifecycle management including
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Plan Service for WriteCareNotes
 * @module CarePlanService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Core service for care plan lifecycle management including
 * creation, validation, approval workflows, and versioning with comprehensive
 * business logic and regulatory compliance.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements field-level encryption for sensitive care data
 * - Comprehensive audit trails for all operations
 * - Role-based access control integration
 */

import { Repository, DataSource, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { CarePlan, CarePlanType, CarePlanStatus, ReviewFrequency, CareGoal, RiskAssessment } from '../../entities/care-planning/CarePlan';
import { CareDomain } from '../../entities/care-planning/CareDomain';
import { Resident } from '../../entities/resident/Resident';
import { CarePlanRepository } from '../../repositories/care-planning/CarePlanRepository';
import { AuditService,  AuditTrailService } from '../audit';
import { FieldLevelEncryptionService } from '../encryption/FieldLevelEncryptionService';
import { NotificationService } from '../notifications/NotificationService';
import { EventPublishingService } from '../events/EventPublishingService';
import { logger } from '../../utils/logger';

export interface CreateCarePlanRequest {
  residentId: string;
  planName: string;
  planType: CarePlanType;
  reviewFrequency: ReviewFrequency;
  effectiveFrom: Date;
  careGoals?: Omit<CareGoal, 'id'>[];
  riskAssessments?: Omit<RiskAssessment, 'id'>[];
  emergencyProcedures?: any[];
  residentPreferences?: any[];
  createdBy: string;
}

export interface UpdateCarePlanRequest {
  planName?: string;
  reviewFrequency?: ReviewFrequency;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  careGoals?: CareGoal[];
  riskAssessments?: RiskAssessment[];
  emergencyProcedures?: any[];
  residentPreferences?: any[];
  updatedBy: string;
}

export interface CarePlanSearchFilters {
  residentId?: string;
  status?: CarePlanStatus;
  planType?: CarePlanType;
  reviewDueBefore?: Date;
  createdBy?: string;
  approvedBy?: string;
  isOverdueForReview?: boolean;
  riskLevel?: string;
}

export interface CarePlanApprovalRequest {
  approvedBy: string;
  approvalNotes?: string;
  effectiveFrom?: Date;
}

export interface CarePlanVersionInfo {
  currentVersion: CarePlan;
  previousVersions: CarePlan[];
  versionHistory: {
    version: number;
    createdAt: Date;
    createdBy: string;
    changes: string[];
  }[];
}

export class CarePlanValidationError extends Error {
  const ructor(
    message: string,
    publicvalidationErrors: ValidationError[]
  ) {
    super(message);
    this.name = 'CarePlanValidationError';
  }
}

export class CarePlanNotFoundError extends Error {
  const ructor(carePlanId: string) {
    super(`Care plan with ID ${carePlanId} not found`);
    this.name = 'CarePlanNotFoundError';
  }
}

export class CarePlanApprovalError extends Error {
  const ructor(message: string) {
    super(message);
    this.name = 'CarePlanApprovalError';
  }
}

export class CarePlanService {
  privatecarePlanRepository: CarePlanRepository;
  privatecareDomainRepository: Repository<CareDomain>;
  privateresidentRepository: Repository<Resident>;

  const ructor(
    privatedataSource: DataSource,
    privateauditService: AuditService,
    privateencryptionService: FieldLevelEncryptionService,
    privatenotificationService: NotificationService,
    privateeventPublisher: EventPublishingService
  ) {
    this.carePlanRepository = new CarePlanRepository(dataSource);
    this.careDomainRepository = dataSource.getRepository(CareDomain);
    this.residentRepository = dataSource.getRepository(Resident);
  }

  /**
   * Create a new care plan with comprehensive validation
   */
  async createCarePlan(request: CreateCarePlanRequest): Promise<CarePlan> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    const correlationId = `care-plan-create-${Date.now()}`;
    
    try {
      console.info('Creating new care plan', { 
        residentId: request.residentId, 
        planType: request.planType,
        correlationId 
      });

      // Validate resident exists
      const resident = await this.residentRepository.findOne({
        where: { id: request.residentId, deletedAt: null }
      });

      if (!resident) {
        throw new Error(`Resident with ID ${request.residentId} not found`);
      }

      // Create care plan entity
      const carePlan = new CarePlan();
      carePlan.residentId = request.residentId;
      carePlan.planName = request.planName;
      carePlan.planType = request.planType;
      carePlan.reviewFrequency = request.reviewFrequency;
      carePlan.effectiveFrom = request.effectiveFrom;
      carePlan.nextReviewDate = this.calculateNextReviewDate(request.effectiveFrom, request.reviewFrequency);
      carePlan.createdBy = request.createdBy;
      carePlan.status = CarePlanStatus.DRAFT;
      carePlan.version = 1;

      // Add care goals if provided
      if (request.careGoals) {
        for (const goal of request.careGoals) {
          carePlan.addCareGoal(goal);
        }
      }

      // Add risk assessments if provided
      if (request.riskAssessments) {
        for (const risk of request.riskAssessments) {
          carePlan.addRiskAssessment(risk);
        }
      }

      // Set additional data
      if (request.emergencyProcedures) {
        carePlan.emergencyProcedures = request.emergencyProcedures;
      }

      if (request.residentPreferences) {
        carePlan.residentPreferences = request.residentPreferences;
      }

      // Validate entity
      const validationErrors = await validate(carePlan);
      if (validationErrors.length > 0) {
        throw new CarePlanValidationError('Care plan validation failed', validationErrors);
      }

      // Encrypt sensitive data
      await this.encryptSensitiveData(carePlan);

      // Save to database using optimized repository
      const savedCarePlan = await this.carePlanRepository.create(carePlan);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_PLAN_CREATED',
        resourceType: 'CarePlan',
        resourceId: savedCarePlan.id,
        userId: request.createdBy,
        details: {
          residentId: request.residentId,
          planName: request.planName,
          planType: request.planType,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-plan.created', {
        carePlanId: savedCarePlan.id,
        residentId: request.residentId,
        planType: request.planType,
        createdBy: request.createdBy,
        correlationId
      });

      // Send notification to care team
      await this.notificationService.sendNotification({
        message: 'Notification: Care Plan Created',
        type: 'care_plan_created',
        recipientType: 'care_team',
        residentId: request.residentId,
        title: 'New Care Plan Created',
        message: `A new ${request.planType} care plan has been created for ${resident.firstName} ${resident.lastName}`,
        data: {
          carePlanId: savedCarePlan.id,
          residentName: `${resident.firstName} ${resident.lastName}`
        }
      });

      console.info('Care plan created successfully', { 
        carePlanId: savedCarePlan.id,
        correlationId 
      });

      return savedCarePlan;

    } catch (error: unknown) {
      console.error('Failed to create care plan', { 
        error: error instanceof Error ? error.message : "Unknown error",
        residentId: request.residentId,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_PLAN_CREATE_FAILED',
        resourceType: 'CarePlan',
        userId: request.createdBy,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          residentId: request.residentId,
          correlationId
        },
        correlationId
      });

      throw error;
    }
  }

  /**
   * Get care plan by ID with decryption
   */
  async getCarePlanById(id: string, includeRelations: boolean = true): Promise<CarePlan | null> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const carePlan = await this.carePlanRepository.findById(id, includeRelations);

      if (!carePlan) {
        return null;
      }

      // Decrypt sensitive data
      await this.decryptSensitiveData(carePlan);

      return carePlan;

    } catch (error: unknown) {
      console.error('Failed to get care plan by ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId: id 
      });
      throw error;
    }
  }

  /**
   * Search care plans with filters
   */
  async searchCarePlans(
    filters: CarePlanSearchFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{ carePlans: CarePlan[]; total: number; totalPages: number }> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      // Convert filters to repository search criteria
      const searchCriteria = {
        residentId: filters.residentId,
        status: filters.status,
        planType: filters.planType,
        reviewDueBefore: filters.reviewDueBefore,
        createdBy: filters.createdBy,
        approvedBy: filters.approvedBy,
        riskLevel: filters.riskLevel
      };

      const { carePlans, total } = await this.carePlanRepository.search(
        searchCriteria,
        page,
        limit,
        'createdAt',
        'DESC'
      );

      // Apply additional filters that require computation
      let filteredCarePlans = carePlans;

      if (filters.isOverdueForReview !== undefined) {
        filteredCarePlans = filteredCarePlans.filter(plan => 
          plan.isOverdueForReview === filters.isOverdueForReview
        );
      }

      // Decrypt sensitive data for all care plans
      for (const carePlan of filteredCarePlans) {
        await this.decryptSensitiveData(carePlan);
      }

      const totalPages = Math.ceil(total / limit);

      return {
        carePlans: filteredCarePlans,
        total,
        totalPages
      };

    } catch (error: unknown) {
      console.error('Failed to search care plans', { 
        error: error instanceof Error ? error.message : "Unknown error",
        filters 
      });
      throw error;
    }
  }

  /**
   * Update care plan with validation and versioning
   */
  async updateCarePlan(id: string, request: UpdateCarePlanRequest): Promise<CarePlan> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    const correlationId = `care-plan-update-${Date.now()}`;
    
    try {
      console.info('Updating care plan', { carePlanId: id, correlationId });

      const carePlan = await this.getCarePlanById(id);
      if (!carePlan) {
        throw new CarePlanNotFoundError(id);
      }

      // Check if care plan can be updated
      if (carePlan.status === CarePlanStatus.ARCHIVED || carePlan.status === CarePlanStatus.SUPERSEDED) {
        throw new Error('Cannot update archived or superseded care plan');
      }

      // Store original values for audit
      const originalValues = {
        planName: carePlan.planName,
        reviewFrequency: carePlan.reviewFrequency,
        effectiveFrom: carePlan.effectiveFrom,
        effectiveTo: carePlan.effectiveTo
      };

      // Update fields
      if (request.planName) {
        carePlan.planName = request.planName;
      }
      
      if (request.reviewFrequency) {
        carePlan.reviewFrequency = request.reviewFrequency;
        carePlan.nextReviewDate = this.calculateNextReviewDate(
          carePlan.effectiveFrom, 
          request.reviewFrequency
        );
      }
      
      if (request.effectiveFrom) {
        carePlan.effectiveFrom = request.effectiveFrom;
      }
      
      if (request.effectiveTo) {
        carePlan.effectiveTo = request.effectiveTo;
      }
      
      if (request.careGoals) {
        carePlan.careGoals = request.careGoals;
      }
      
      if (request.riskAssessments) {
        carePlan.riskAssessments = request.riskAssessments;
      }
      
      if (request.emergencyProcedures) {
        carePlan.emergencyProcedures = request.emergencyProcedures;
      }
      
      if (request.residentPreferences) {
        carePlan.residentPreferences = request.residentPreferences;
      }

      // If care plan was approved and significant changes made, reset to draft
      const significantChanges = this.hasSignificantChanges(originalValues, {
        planName: carePlan.planName,
        reviewFrequency: carePlan.reviewFrequency,
        effectiveFrom: carePlan.effectiveFrom,
        effectiveTo: carePlan.effectiveTo
      });

      if (significantChanges && carePlan.isApproved) {
        carePlan.status = CarePlanStatus.PENDING_APPROVAL;
        carePlan.approvedBy = undefined;
        carePlan.approvedAt = undefined;
      }

      // Validate updated entity
      const validationErrors = await validate(carePlan);
      if (validationErrors.length > 0) {
        throw new CarePlanValidationError('Care plan validation failed', validationErrors);
      }

      // Encrypt sensitive data
      await this.encryptSensitiveData(carePlan);

      // Save updated care plan using optimized repository
      const updatedCarePlan = await this.carePlanRepository.update(carePlan);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_PLAN_UPDATED',
        resourceType: 'CarePlan',
        resourceId: id,
        userId: request.updatedBy,
        details: {
          originalValues,
          newValues: {
            planName: updatedCarePlan.planName,
            reviewFrequency: updatedCarePlan.reviewFrequency,
            effectiveFrom: updatedCarePlan.effectiveFrom,
            effectiveTo: updatedCarePlan.effectiveTo
          },
          significantChanges,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-plan.updated', {
        carePlanId: id,
        residentId: updatedCarePlan.residentId,
        updatedBy: request.updatedBy,
        significantChanges,
        correlationId
      });

      // Send notification if significant changes
      if (significantChanges) {
        await this.notificationService.sendNotification({
          message: 'Notification: Care Plan Updated',
        type: 'care_plan_updated',
          recipientType: 'care_team',
          residentId: updatedCarePlan.residentId,
          title: 'Care Plan Updated',
          message: 'A care plan has been updated and requires re-approval',
          data: {
            carePlanId: id,
            requiresApproval: true
          }
        });
      }

      console.info('Care plan updated successfully', { 
        carePlanId: id,
        significantChanges,
        correlationId 
      });

      return updatedCarePlan;

    } catch (error: unknown) {
      console.error('Failed to update care plan', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId: id,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_PLAN_UPDATE_FAILED',
        resourceType: 'CarePlan',
        resourceId: id,
        userId: request.updatedBy,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          correlationId
        },
        correlationId
      });

      throw error;
    }
  }

  /**
   * Approve care plan with workflow validation
   */
  async approveCarePlan(id: string, request: CarePlanApprovalRequest): Promise<CarePlan> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    const correlationId = `care-plan-approve-${Date.now()}`;
    
    try {
      console.info('Approving care plan', { carePlanId: id, correlationId });

      const carePlan = await this.getCarePlanById(id);
      if (!carePlan) {
        throw new CarePlanNotFoundError(id);
      }

      // Validate approval eligibility
      if (carePlan.status === CarePlanStatus.ACTIVE) {
        throw new CarePlanApprovalError('Care plan is already approved and active');
      }

      if (carePlan.status === CarePlanStatus.ARCHIVED || carePlan.status === CarePlanStatus.SUPERSEDED) {
        throw new CarePlanApprovalError('Cannot approve archived or superseded care plan');
      }

      // Validate care plan completeness
      await this.validateCarePlanCompleteness(carePlan);

      // Approve the care plan
      carePlan.approve(request.approvedBy);

      if (request.effectiveFrom) {
        carePlan.effectiveFrom = request.effectiveFrom;
        carePlan.nextReviewDate = this.calculateNextReviewDate(
          request.effectiveFrom, 
          carePlan.reviewFrequency
        );
      }

      // Save approved care plan using optimized repository
      const approvedCarePlan = await this.carePlanRepository.update(carePlan);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_PLAN_APPROVED',
        resourceType: 'CarePlan',
        resourceId: id,
        userId: request.approvedBy,
        details: {
          approvalNotes: request.approvalNotes,
          effectiveFrom: approvedCarePlan.effectiveFrom,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-plan.approved', {
        carePlanId: id,
        residentId: approvedCarePlan.residentId,
        approvedBy: request.approvedBy,
        effectiveFrom: approvedCarePlan.effectiveFrom,
        correlationId
      });

      // Send notification
      await this.notificationService.sendNotification({
        message: 'Notification: Care Plan Approved',
        type: 'care_plan_approved',
        recipientType: 'care_team',
        residentId: approvedCarePlan.residentId,
        title: 'Care Plan Approved',
        message: 'A care plan has been approved and is now active',
        data: {
          carePlanId: id,
          approvedBy: request.approvedBy,
          effectiveFrom: approvedCarePlan.effectiveFrom
        }
      });

      console.info('Care plan approved successfully', { 
        carePlanId: id,
        approvedBy: request.approvedBy,
        correlationId 
      });

      return approvedCarePlan;

    } catch (error: unknown) {
      console.error('Failed to approve care plan', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId: id,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_PLAN_APPROVAL_FAILED',
        resourceType: 'CarePlan',
        resourceId: id,
        userId: request.approvedBy,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          correlationId
        },
        correlationId
      });

      throw error;
    }
  }

  /**
   * Archive care plan
   */
  async archiveCarePlan(id: string, archivedBy: string, reason?: string): Promise<CarePlan> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    const correlationId = `care-plan-archive-${Date.now()}`;
    
    try {
      console.info('Archiving care plan', { carePlanId: id, correlationId });

      const carePlan = await this.getCarePlanById(id);
      if (!carePlan) {
        throw new CarePlanNotFoundError(id);
      }

      if (carePlan.status === CarePlanStatus.ARCHIVED) {
        throw new Error('Care plan is already archived');
      }

      // Archive the care plan
      carePlan.archive();

      // Save archived care plan using optimized repository
      const archivedCarePlan = await this.carePlanRepository.update(carePlan);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_PLAN_ARCHIVED',
        resourceType: 'CarePlan',
        resourceId: id,
        userId: archivedBy,
        details: {
          reason,
          archivedAt: archivedCarePlan.effectiveTo,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-plan.archived', {
        carePlanId: id,
        residentId: archivedCarePlan.residentId,
        archivedBy,
        reason,
        correlationId
      });

      console.info('Care plan archived successfully', { 
        carePlanId: id,
        correlationId 
      });

      return archivedCarePlan;

    } catch (error: unknown) {
      console.error('Failed to archive care plan', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId: id,
        correlationId 
      });
      throw error;
    }
  }

  /**
   * Get care plans due for review
   */
  async getCarePlansDueForReview(daysAhead: number = 7): Promise<CarePlan[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const carePlans = await this.carePlanRepository.findDueForReview(daysAhead);

      // Decrypt sensitive data
      for (const carePlan of carePlans) {
        await this.decryptSensitiveData(carePlan);
      }

      return carePlans;

    } catch (error: unknown) {
      console.error('Failed to get care plans due for review', { 
        error: error instanceof Error ? error.message : "Unknown error",
        daysAhead 
      });
      throw error;
    }
  }

  /**
   * Get care plan version history
   */
  async getCarePlanVersionHistory(id: string): Promise<CarePlanVersionInfo> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const currentVersion = await this.getCarePlanById(id);
      if (!currentVersion) {
        throw new CarePlanNotFoundError(id);
      }

      // Get all versions for this resident with same plan name
      const allVersions = await this.carePlanRepository.findVersions(
        currentVersion.residentId,
        currentVersion.planName
      );

      const previousVersions = allVersions.filter(v => v.id !== id);

      // Build version history
      const versionHistory = allVersions.map(version => ({
        version: version.version,
        createdAt: version.createdAt,
        createdBy: version.createdBy,
        changes: this.extractChanges(version, previousVersions.find(v => v.version === version.version - 1))
      }));

      return {
        currentVersion,
        previousVersions,
        versionHistory
      };

    } catch (error: unknown) {
      console.error('Failed to get care plan version history', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId: id 
      });
      throw error;
    }
  }

  /**
   * Get active care plans count
   */
  async getActivePlansCount(): Promise<number> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      return await this.carePlanRepository.countActive();
    } catch (error: unknown) {
      console.error('Failed to get active care plans count', { error: error instanceof Error ? error.message : "Unknown error" });
      throw error;
    }
  }

  /**
   * Get care plan summaries for dashboard
   */
  async getCarePlanSummaries(
    filters: CarePlanSearchFilters,
    limit: number = 50
  ): Promise<any[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const searchCriteria = {
        residentId: filters.residentId,
        status: filters.status,
        planType: filters.planType,
        reviewDueBefore: filters.reviewDueBefore,
        createdBy: filters.createdBy,
        approvedBy: filters.approvedBy,
        riskLevel: filters.riskLevel
      };

      return await this.carePlanRepository.getCarePlanSummaries(searchCriteria, limit);
    } catch (error: unknown) {
      console.error('Failed to get care plan summaries', { 
        error: error instanceof Error ? error.message : "Unknown error",
        filters 
      });
      throw error;
    }
  }

  /**
   * Get care plan statistics
   */
  async getCarePlanStatistics(residentId?: string): Promise<any> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      return await this.carePlanRepository.getStatistics(residentId);
    } catch (error: unknown) {
      console.error('Failed to get care plan statistics', { 
        error: error instanceof Error ? error.message : "Unknown error",
        residentId 
      });
      throw error;
    }
  }

  /**
   * Get care plans by resident ID
   */
  async getCarePlansByResidentId(
    residentId: string, 
    includeArchived: boolean = false
  ): Promise<CarePlan[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const carePlans = await this.carePlanRepository.findByResidentId(residentId, includeArchived);

      // Decrypt sensitive data for all care plans
      for (const carePlan of carePlans) {
        await this.decryptSensitiveData(carePlan);
      }

      return carePlans;
    } catch (error: unknown) {
      console.error('Failed to get care plans by resident ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        residentId 
      });
      throw error;
    }
  }

  /**
   * Get care plans requiring attention
   */
  async getCarePlansRequiringAttention(): Promise<CarePlan[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const carePlans = await this.carePlanRepository.findRequiringAttention();

      // Decrypt sensitive data for all care plans
      for (const carePlan of carePlans) {
        await this.decryptSensitiveData(carePlan);
      }

      return carePlans;
    } catch (error: unknown) {
      console.error('Failed to get care plans requiring attention', { 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
      throw error;
    }
  }

  /**
   * Check for conflicting care plans
   */
  async checkForConflictingPlans(
    residentId: string,
    effectiveFrom: Date,
    effectiveTo?: Date
  ): Promise<CarePlan[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      return await this.carePlanRepository.findConflictingPlans(
        residentId,
        effectiveFrom,
        effectiveTo
      );
    } catch (error: unknown) {
      console.error('Failed to check for conflicting care plans', { 
        error: error instanceof Error ? error.message : "Unknown error",
        residentId,
        effectiveFrom,
        effectiveTo 
      });
      throw error;
    }
  }

  /**
   * Get active care plans by resident ID
   */
  async getActiveCarePlansByResidentId(residentId: string): Promise<CarePlan[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const carePlans = await this.carePlanRepository.findActiveByResidentId(residentId);

      // Decrypt sensitive data for all care plans
      for (const carePlan of carePlans) {
        await this.decryptSensitiveData(carePlan);
      }

      return carePlans;
    } catch (error: unknown) {
      console.error('Failed to get active care plans by resident ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        residentId 
      });
      throw error;
    }
  }

  /**
   * Get care plan history by resident ID
   */
  async getCarePlanHistoryByResidentId(residentId: string): Promise<CarePlan[]> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    try {
      const carePlans = await this.carePlanRepository.findHistoryByResidentId(residentId);

      // Decrypt sensitive data for all care plans
      for (const carePlan of carePlans) {
        await this.decryptSensitiveData(carePlan);
      }

      return carePlans;
    } catch (error: unknown) {
      console.error('Failed to get care plan history by resident ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        residentId 
      });
      throw error;
    }
  }

  // Private helper methods

  private calculateNextReviewDate(effectiveFrom: Date, frequency: ReviewFrequency): Date {
    const nextDate = new Date(effectiveFrom);
    
    switch (frequency) {
      case ReviewFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case ReviewFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case ReviewFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case ReviewFrequency.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }

  private async encryptSensitiveData(carePlan: CarePlan): Promise<void> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    // Encrypt sensitive fields in care goals, risk assessments, etc.
    if (carePlan.careGoals) {
      for (const goal of carePlan.careGoals) {
        if (goal.notes) {
          goal.notes = await this.encryptionService.encrypt(goal.notes);
        }
      }
    }

    if (carePlan.riskAssessments) {
      for (const risk of carePlan.riskAssessments) {
        risk.description = await this.encryptionService.encrypt(risk.description);
      }
    }
  }

  private async decryptSensitiveData(carePlan: CarePlan): Promise<void> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    // Decrypt sensitive fields
    if (carePlan.careGoals) {
      for (const goal of carePlan.careGoals) {
        if (goal.notes) {
          goal.notes = await this.encryptionService.decrypt(goal.notes);
        }
      }
    }

    if (carePlan.riskAssessments) {
      for (const risk of carePlan.riskAssessments) {
        risk.description = await this.encryptionService.decrypt(risk.description);
      }
    }
  }

  private hasSignificantChanges(original: any, updated: any): boolean {
    const significantFields = ['planName', 'reviewFrequency', 'effectiveFrom'];
    
    return significantFields.some(field => 
      original[field] !== updated[field]
    );
  }

  private async validateCarePlanCompleteness(carePlan: CarePlan): Promise<void> {
    logger.info(`Operation started: ${arguments.callee.name}`, { timestamp: new Date().toISOString() });
    const errors: string[] = [];

    if (!carePlan.planName || carePlan.planName.trim().length === 0) {
      errors.push('Plan name is required');
    }

    if (!carePlan.effectiveFrom) {
      errors.push('Effective from date is required');
    }

    if (!carePlan.careGoals || carePlan.careGoals.length === 0) {
      errors.push('At least one care goal is required');
    }

    if (!carePlan.riskAssessments || carePlan.riskAssessments.length === 0) {
      errors.push('At least one risk assessment is required');
    }

    // Check if care domains exist
    const domainCount = await this.careDomainRepository.count({
      where: { carePlanId: carePlan.id, isActive: true }
    });

    if (domainCount === 0) {
      errors.push('At least one active care domain is required');
    }

    if (errors.length > 0) {
      throw new CarePlanApprovalError(`Care plan isincomplete: ${errors.join(', ')}`);
    }
  }

  private extractChanges(current: CarePlan, previous?: CarePlan): string[] {
    const changes: string[] = [];

    if (!previous) {
      changes.push('Initial version created');
      return changes;
    }

    if (current.planName !== previous.planName) {
      changes.push(`Plan name changed from "${previous.planName}" to "${current.planName}"`);
    }

    if (current.reviewFrequency !== previous.reviewFrequency) {
      changes.push(`Review frequency changed from "${previous.reviewFrequency}" to "${current.reviewFrequency}"`);
    }

    if (current.effectiveFrom.getTime() !== previous.effectiveFrom.getTime()) {
      changes.push(`Effective date changed from "${previous.effectiveFrom.toISOString()}" to "${current.effectiveFrom.toISOString()}"`);
    }

    if (current.careGoals?.length !== previous.careGoals?.length) {
      changes.push(`Care goals count changed from ${previous.careGoals?.length || 0} to ${current.careGoals?.length || 0}`);
    }

    if (current.riskAssessments?.length !== previous.riskAssessments?.length) {
      changes.push(`Risk assessments count changed from ${previous.riskAssessments?.length || 0} to ${current.riskAssessments?.length || 0}`);
    }

    return changes;
  }
}
