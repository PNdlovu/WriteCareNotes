/**
 * @fileoverview Service for managing care domains within care plans,
 * @module Care-planning/CareDomainService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Service for managing care domains within care plans,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Domain Service for WriteCareNotes
 * @module CareDomainService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Service for managing care domains within care plans,
 * including domain assessment, goal management, and risk evaluation.
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

import { Repository, DataSource } from 'typeorm';
import { validate, ValidationError } from 'class-validator';
import { CareDomain, DomainType, CurrentStatus, RiskLevel, MonitoringFrequency, DomainGoal, RiskFactor, EquipmentRequirement, StaffRequirement } from '../../entities/care-planning/CareDomain';
import { CarePlan } from '../../entities/care-planning/CarePlan';
import { AuditService,  AuditTrailService } from '../audit';
import { FieldLevelEncryptionService } from '../encryption/FieldLevelEncryptionService';
import { NotificationService } from '../notifications/NotificationService';
import { EventPublishingService } from '../events/EventPublishingService';
import { logger } from '../../utils/logger';

export interface CreateCareDomainRequest {
  carePlanId: string;
  domainType: DomainType;
  domainName: string;
  assessmentSummary?: string;
  currentStatus: CurrentStatus;
  goals?: Omit<DomainGoal, 'id' | 'progressNotes'>[];
  riskLevel: RiskLevel;
  riskFactors?: Omit<RiskFactor, 'id'>[];
  equipmentNeeded?: Omit<EquipmentRequirement, 'id'>[];
  staffRequirements?: StaffRequirement;
  monitoringFrequency: MonitoringFrequency;
  createdBy: string;
}

export interface UpdateCareDomainRequest {
  domainName?: string;
  assessmentSummary?: string;
  currentStatus?: CurrentStatus;
  goals?: DomainGoal[];
  riskLevel?: RiskLevel;
  riskFactors?: RiskFactor[];
  equipmentNeeded?: EquipmentRequirement[];
  staffRequirements?: StaffRequirement;
  monitoringFrequency?: MonitoringFrequency;
  lastAssessmentDate?: Date;
  nextAssessmentDate?: Date;
  updatedBy: string;
}

export interface CareDomainAssessmentRequest {
  assessmentSummary: string;
  currentStatus: CurrentStatus;
  riskLevel: RiskLevel;
  assessmentDate: Date;
  assessedBy: string;
  findings: string[];
  recommendations: string[];
  nextAssessmentDate?: Date;
}

export interface DomainRiskAnalysis {
  overallRiskScore: number;
  riskLevel: RiskLevel;
  criticalRiskFactors: RiskFactor[];
  mitigationStrategies: string[];
  recommendedActions: string[];
  nextReviewDate: Date;
}

export class CareDomainValidationError extends Error {
  const ructor(
    message: string,
    publicvalidationErrors: ValidationError[]
  ) {
    super(message);
    this.name = 'CareDomainValidationError';
  }
}

export class CareDomainNotFoundError extends Error {
  const ructor(domainId: string) {
    super(`Care domain with ID ${domainId} not found`);
    this.name = 'CareDomainNotFoundError';
  }
}

export class CareDomainService {
  privatecareDomainRepository: Repository<CareDomain>;
  privatecarePlanRepository: Repository<CarePlan>;

  const ructor(
    privatedataSource: DataSource,
    privateauditService: AuditService,
    privateencryptionService: FieldLevelEncryptionService,
    privatenotificationService: NotificationService,
    privateeventPublisher: EventPublishingService
  ) {
    this.careDomainRepository = dataSource.getRepository(CareDomain);
    this.carePlanRepository = dataSource.getRepository(CarePlan);
  }

  /**
   * Create a new care domain
   */
  async createCareDomain(request: CreateCareDomainRequest): Promise<CareDomain> {
    const correlationId = `care-domain-create-${Date.now()}`;
    
    try {
      console.info('Creating new care domain', { 
        carePlanId: request.carePlanId,
        domainType: request.domainType,
        correlationId 
      });

      // Validate care plan exists
      const carePlan = await this.carePlanRepository.findOne({
        where: { id: request.carePlanId, deletedAt: null }
      });

      if (!carePlan) {
        throw new Error(`Care plan with ID ${request.carePlanId} not found`);
      }

      // Create care domain entity
      const careDomain = new CareDomain();
      careDomain.carePlanId = request.carePlanId;
      careDomain.domainType = request.domainType;
      careDomain.domainName = request.domainName;
      careDomain.assessmentSummary = request.assessmentSummary;
      careDomain.currentStatus = request.currentStatus;
      careDomain.riskLevel = request.riskLevel;
      careDomain.monitoringFrequency = request.monitoringFrequency;
      careDomain.isActive = true;

      // Add goals if provided
      if (request.goals) {
        for (const goal of request.goals) {
          careDomain.addGoal(goal);
        }
      }

      // Add risk factors if provided
      if (request.riskFactors) {
        for (const riskFactor of request.riskFactors) {
          careDomain.addRiskFactor(riskFactor);
        }
      }

      // Add equipment if provided
      if (request.equipmentNeeded) {
        for (const equipment of request.equipmentNeeded) {
          careDomain.addEquipment(equipment);
        }
      }

      // Set staff requirements
      if (request.staffRequirements) {
        careDomain.staffRequirements = request.staffRequirements;
      }

      // Schedule next assessment
      careDomain.scheduleNextAssessment();

      // Validate entity
      const validationErrors = await validate(careDomain);
      if (validationErrors.length > 0) {
        throw new CareDomainValidationError('Care domain validation failed', validationErrors);
      }

      // Encrypt sensitive data
      await this.encryptSensitiveData(careDomain);

      // Save to database
      const savedCareDomain = await this.careDomainRepository.save(careDomain);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_DOMAIN_CREATED',
        resourceType: 'CareDomain',
        resourceId: savedCareDomain.id,
        userId: request.createdBy,
        details: {
          carePlanId: request.carePlanId,
          domainType: request.domainType,
          domainName: request.domainName,
          riskLevel: request.riskLevel,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-domain.created', {
        careDomainId: savedCareDomain.id,
        carePlanId: request.carePlanId,
        domainType: request.domainType,
        riskLevel: request.riskLevel,
        createdBy: request.createdBy,
        correlationId
      });

      // Send notification for high-risk domains
      if (request.riskLevel === RiskLevel.HIGH || request.riskLevel === RiskLevel.CRITICAL) {
        await this.notificationService.sendNotification({
          message: 'Notification: High Risk Domain Created',
        type: 'high_risk_domain_created',
          recipientType: 'care_team',
          residentId: carePlan.residentId,
          title: 'High Risk Care Domain Created',
          message: `A ${request.riskLevel} risk care domain (${request.domainType}) has been created`,
          data: {
            careDomainId: savedCareDomain.id,
            domainType: request.domainType,
            riskLevel: request.riskLevel
          }
        });
      }

      console.info('Care domain created successfully', { 
        careDomainId: savedCareDomain.id,
        correlationId 
      });

      return savedCareDomain;

    } catch (error: unknown) {
      console.error('Failed to create care domain', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId: request.carePlanId,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_DOMAIN_CREATE_FAILED',
        resourceType: 'CareDomain',
        userId: request.createdBy,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          carePlanId: request.carePlanId,
          correlationId
        },
        correlationId
      });

      throw error;
    }
  }

  /**
   * Get care domain by ID
   */
  async getCareDomainById(id: string, includeRelations: boolean = true): Promise<CareDomain | null> {
    try {
      const relations = includeRelations ? ['carePlan', 'careInterventions'] : [];
      
      const careDomain = await this.careDomainRepository.findOne({
        where: { id, deletedAt: null },
        relations
      });

      if (!careDomain) {
        return null;
      }

      // Decrypt sensitive data
      await this.decryptSensitiveData(careDomain);

      return careDomain;

    } catch (error: unknown) {
      console.error('Failed to get care domain by ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId: id 
      });
      throw error;
    }
  }

  /**
   * Get care domains by care plan ID
   */
  async getCareDomainsByCarePlanId(carePlanId: string, includeInactive: boolean = false): Promise<CareDomain[]> {
    try {
      const queryBuilder = this.careDomainRepository
        .createQueryBuilder('careDomain')
        .leftJoinAndSelect('careDomain.careInterventions', 'interventions', 'interventions.isActive = true')
        .where('careDomain.carePlanId = :carePlanId', { carePlanId })
        .andWhere('careDomain.deletedAt IS NULL');

      if (!includeInactive) {
        queryBuilder.andWhere('careDomain.isActive = true');
      }

      const careDomains = await queryBuilder
        .orderBy('careDomain.domainType', 'ASC')
        .getMany();

      // Decrypt sensitive data for all domains
      for (const domain of careDomains) {
        await this.decryptSensitiveData(domain);
      }

      return careDomains;

    } catch (error: unknown) {
      console.error('Failed to get care domains by care plan ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        carePlanId 
      });
      throw error;
    }
  }

  /**
   * Update care domain
   */
  async updateCareDomain(id: string, request: UpdateCareDomainRequest): Promise<CareDomain> {
    const correlationId = `care-domain-update-${Date.now()}`;
    
    try {
      console.info('Updating care domain', { careDomainId: id, correlationId });

      const careDomain = await this.getCareDomainById(id);
      if (!careDomain) {
        throw new CareDomainNotFoundError(id);
      }

      // Store original values for audit
      const originalValues = {
        domainName: careDomain.domainName,
        currentStatus: careDomain.currentStatus,
        riskLevel: careDomain.riskLevel,
        monitoringFrequency: careDomain.monitoringFrequency
      };

      // Update fields
      if (request.domainName) {
        careDomain.domainName = request.domainName;
      }
      
      if (request.assessmentSummary !== undefined) {
        careDomain.assessmentSummary = request.assessmentSummary;
      }
      
      if (request.currentStatus) {
        careDomain.currentStatus = request.currentStatus;
      }
      
      if (request.goals) {
        careDomain.goals = request.goals;
      }
      
      if (request.riskLevel) {
        careDomain.riskLevel = request.riskLevel;
      }
      
      if (request.riskFactors) {
        careDomain.riskFactors = request.riskFactors;
      }
      
      if (request.equipmentNeeded) {
        careDomain.equipmentNeeded = request.equipmentNeeded;
      }
      
      if (request.staffRequirements) {
        careDomain.staffRequirements = request.staffRequirements;
      }
      
      if (request.monitoringFrequency) {
        careDomain.monitoringFrequency = request.monitoringFrequency;
        careDomain.scheduleNextAssessment();
      }
      
      if (request.lastAssessmentDate) {
        careDomain.lastAssessmentDate = request.lastAssessmentDate;
      }
      
      if (request.nextAssessmentDate) {
        careDomain.nextAssessmentDate = request.nextAssessmentDate;
      }

      // Validate updated entity
      const validationErrors = await validate(careDomain);
      if (validationErrors.length > 0) {
        throw new CareDomainValidationError('Care domain validation failed', validationErrors);
      }

      // Encrypt sensitive data
      await this.encryptSensitiveData(careDomain);

      // Save updated care domain
      const updatedCareDomain = await this.careDomainRepository.save(careDomain);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_DOMAIN_UPDATED',
        resourceType: 'CareDomain',
        resourceId: id,
        userId: request.updatedBy,
        details: {
          originalValues,
          newValues: {
            domainName: updatedCareDomain.domainName,
            currentStatus: updatedCareDomain.currentStatus,
            riskLevel: updatedCareDomain.riskLevel,
            monitoringFrequency: updatedCareDomain.monitoringFrequency
          },
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-domain.updated', {
        careDomainId: id,
        carePlanId: updatedCareDomain.carePlanId,
        updatedBy: request.updatedBy,
        riskLevelChanged: originalValues.riskLevel !== updatedCareDomain.riskLevel,
        correlationId
      });

      // Send notification if risk level increased
      if (this.isRiskLevelIncreased(originalValues.riskLevel, updatedCareDomain.riskLevel)) {
        await this.notificationService.sendNotification({
          message: 'Notification: Care Domain Risk Increased',
        type: 'care_domain_risk_increased',
          recipientType: 'care_team',
          title: 'Care Domain Risk Level Increased',
          message: `Risk level for ${updatedCareDomain.domainType} domain has increased to ${updatedCareDomain.riskLevel}`,
          data: {
            careDomainId: id,
            domainType: updatedCareDomain.domainType,
            oldRiskLevel: originalValues.riskLevel,
            newRiskLevel: updatedCareDomain.riskLevel
          }
        });
      }

      console.info('Care domain updated successfully', { 
        careDomainId: id,
        correlationId 
      });

      return updatedCareDomain;

    } catch (error: unknown) {
      console.error('Failed to update care domain', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId: id,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_DOMAIN_UPDATE_FAILED',
        resourceType: 'CareDomain',
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
   * Conduct care domain assessment
   */
  async conductAssessment(id: string, request: CareDomainAssessmentRequest): Promise<CareDomain> {
    const correlationId = `care-domain-assessment-${Date.now()}`;
    
    try {
      console.info('Conducting care domain assessment', { careDomainId: id, correlationId });

      const careDomain = await this.getCareDomainById(id);
      if (!careDomain) {
        throw new CareDomainNotFoundError(id);
      }

      // Update assessment information
      careDomain.assessmentSummary = request.assessmentSummary;
      careDomain.currentStatus = request.currentStatus;
      careDomain.riskLevel = request.riskLevel;
      careDomain.lastAssessmentDate = request.assessmentDate;
      
      if (request.nextAssessmentDate) {
        careDomain.nextAssessmentDate = request.nextAssessmentDate;
      } else {
        careDomain.scheduleNextAssessment();
      }

      // Save updated domain
      const updatedCareDomain = await this.careDomainRepository.save(careDomain);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_DOMAIN_ASSESSED',
        resourceType: 'CareDomain',
        resourceId: id,
        userId: request.assessedBy,
        details: {
          assessmentDate: request.assessmentDate,
          currentStatus: request.currentStatus,
          riskLevel: request.riskLevel,
          findings: request.findings,
          recommendations: request.recommendations,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-domain.assessed', {
        careDomainId: id,
        carePlanId: updatedCareDomain.carePlanId,
        assessedBy: request.assessedBy,
        riskLevel: request.riskLevel,
        correlationId
      });

      console.info('Care domain assessment completed', { 
        careDomainId: id,
        correlationId 
      });

      return updatedCareDomain;

    } catch (error: unknown) {
      console.error('Failed to conduct care domain assessment', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId: id,
        correlationId 
      });
      throw error;
    }
  }

  /**
   * Analyze domain risks
   */
  async analyzeDomainRisks(id: string): Promise<DomainRiskAnalysis> {
    try {
      const careDomain = await this.getCareDomainById(id);
      if (!careDomain) {
        throw new CareDomainNotFoundError(id);
      }

      const overallRiskScore = careDomain.calculateRiskScore();
      const criticalRiskFactors = careDomain.criticalRiskFactors;
      
      // Generate mitigation strategies based on risk factors
      const mitigationStrategies = this.generateMitigationStrategies(careDomain);
      
      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(careDomain);
      
      // Calculate next review date based on risk level
      const nextReviewDate = this.calculateRiskReviewDate(careDomain.riskLevel);

      return {
        overallRiskScore,
        riskLevel: careDomain.riskLevel,
        criticalRiskFactors,
        mitigationStrategies,
        recommendedActions,
        nextReviewDate
      };

    } catch (error: unknown) {
      console.error('Failed to analyze domain risks', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId: id 
      });
      throw error;
    }
  }

  /**
   * Get domains due for assessment
   */
  async getDomainsDueForAssessment(daysAhead: number = 7): Promise<CareDomain[]> {
    try {
      const assessmentDate = new Date();
      assessmentDate.setDate(assessmentDate.getDate() + daysAhead);

      const domains = await this.careDomainRepository
        .createQueryBuilder('careDomain')
        .leftJoinAndSelect('careDomain.carePlan', 'carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('careDomain.isActive = true')
        .andWhere('careDomain.nextAssessmentDate <= :assessmentDate', { assessmentDate })
        .andWhere('careDomain.deletedAt IS NULL')
        .orderBy('careDomain.nextAssessmentDate', 'ASC')
        .getMany();

      // Decrypt sensitive data
      for (const domain of domains) {
        await this.decryptSensitiveData(domain);
      }

      return domains;

    } catch (error: unknown) {
      console.error('Failed to get domains due for assessment', { 
        error: error instanceof Error ? error.message : "Unknown error",
        daysAhead 
      });
      throw error;
    }
  }

  /**
   * Deactivate care domain
   */
  async deactivateCareDomain(id: string, deactivatedBy: string, reason?: string): Promise<CareDomain> {
    const correlationId = `care-domain-deactivate-${Date.now()}`;
    
    try {
      console.info('Deactivating care domain', { careDomainId: id, correlationId });

      const careDomain = await this.getCareDomainById(id);
      if (!careDomain) {
        throw new CareDomainNotFoundError(id);
      }

      careDomain.isActive = false;

      // Save deactivated domain
      const deactivatedCareDomain = await this.careDomainRepository.save(careDomain);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_DOMAIN_DEACTIVATED',
        resourceType: 'CareDomain',
        resourceId: id,
        userId: deactivatedBy,
        details: {
          reason,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-domain.deactivated', {
        careDomainId: id,
        carePlanId: deactivatedCareDomain.carePlanId,
        deactivatedBy,
        reason,
        correlationId
      });

      console.info('Care domain deactivated successfully', { 
        careDomainId: id,
        correlationId 
      });

      return deactivatedCareDomain;

    } catch (error: unknown) {
      console.error('Failed to deactivate care domain', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId: id,
        correlationId 
      });
      throw error;
    }
  }

  // Private helper methods

  private async encryptSensitiveData(careDomain: CareDomain): Promise<void> {
    if (careDomain.assessmentSummary) {
      careDomain.assessmentSummary = await this.encryptionService.encrypt(careDomain.assessmentSummary);
    }

    if (careDomain.goals) {
      for (const goal of careDomain.goals) {
        if (goal.progressNotes && goal.progressNotes.length > 0) {
          goal.progressNotes = await Promise.all(
            goal.progressNotes.map(note => this.encryptionService.encrypt(note))
          );
        }
      }
    }
  }

  private async decryptSensitiveData(careDomain: CareDomain): Promise<void> {
    if (careDomain.assessmentSummary) {
      careDomain.assessmentSummary = await this.encryptionService.decrypt(careDomain.assessmentSummary);
    }

    if (careDomain.goals) {
      for (const goal of careDomain.goals) {
        if (goal.progressNotes && goal.progressNotes.length > 0) {
          goal.progressNotes = await Promise.all(
            goal.progressNotes.map(note => this.encryptionService.decrypt(note))
          );
        }
      }
    }
  }

  private isRiskLevelIncreased(oldLevel: RiskLevel, newLevel: RiskLevel): boolean {
    const riskOrder = {
      [RiskLevel.LOW]: 1,
      [RiskLevel.MEDIUM]: 2,
      [RiskLevel.HIGH]: 3,
      [RiskLevel.CRITICAL]: 4
    };

    return riskOrder[newLevel] > riskOrder[oldLevel];
  }

  private generateMitigationStrategies(careDomain: CareDomain): string[] {
    const strategies: string[] = [];

    // Base strategies by domain type
    switch (careDomain.domainType) {
      case DomainType.PERSONAL_CARE:
        strategies.push('Regular skin integrity assessments', 'Dignity and privacy protocols');
        break;
      case DomainType.MOBILITY:
        strategies.push('Fall prevention measures', 'Mobility aids assessment');
        break;
      case DomainType.NUTRITION:
        strategies.push('Regular weight monitoring', 'Dietary assessment and planning');
        break;
      case DomainType.SOCIAL:
        strategies.push('Social engagement activities', 'Family involvement programs');
        break;
      case DomainType.MEDICAL:
        strategies.push('Regular health monitoring', 'Medication review protocols');
        break;
      case DomainType.MENTAL_HEALTH:
        strategies.push('Mental health assessments', 'Therapeutic interventions');
        break;
    }

    // Add risk-specific strategies
    if (careDomain.riskFactors) {
      for (const risk of careDomain.riskFactors) {
        strategies.push(risk.mitigationStrategy);
      }
    }

    return [...new Set(strategies)]; // Remove duplicates
  }

  private generateRecommendedActions(careDomain: CareDomain): string[] {
    const actions: string[] = [];

    // Actions based on risk level
    switch (careDomain.riskLevel) {
      case RiskLevel.CRITICAL:
        actions.push('Immediate senior staff review required');
        actions.push('Consider 1:1 supervision');
        actions.push('Daily risk assessment');
        break;
      case RiskLevel.HIGH:
        actions.push('Increase monitoring frequency');
        actions.push('Weekly risk review');
        actions.push('Specialist consultation recommended');
        break;
      case RiskLevel.MEDIUM:
        actions.push('Regular monitoring as per care plan');
        actions.push('Monthly risk review');
        break;
      case RiskLevel.LOW:
        actions.push('Continue current care approach');
        actions.push('Quarterly risk review');
        break;
    }

    // Actions based on overdue assessments
    if (careDomain.isOverdueForAssessment) {
      actions.push('Urgent assessment required');
      actions.push('Update care plan based on current status');
    }

    // Actions based on equipment needs
    if (careDomain.equipmentDueForInspection.length > 0) {
      actions.push('Equipment inspection and maintenance required');
    }

    return actions;
  }

  private calculateRiskReviewDate(riskLevel: RiskLevel): Date {
    const today = new Date();
    const reviewDate = new Date(today);

    switch (riskLevel) {
      case RiskLevel.CRITICAL:
        reviewDate.setDate(today.getDate() + 1); // Daily
        break;
      case RiskLevel.HIGH:
        reviewDate.setDate(today.getDate() + 7); // Weekly
        break;
      case RiskLevel.MEDIUM:
        reviewDate.setMonth(today.getMonth() + 1); // Monthly
        break;
      case RiskLevel.LOW:
        reviewDate.setMonth(today.getMonth() + 3); // Quarterly
        break;
    }

    return reviewDate;
  }
}
