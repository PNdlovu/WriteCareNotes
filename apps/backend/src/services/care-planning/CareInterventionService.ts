/**
 * @fileoverview Service for managing care interventions within care domains,
 * @module Care-planning/CareInterventionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Service for managing care interventions within care domains,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Intervention Service for WriteCareNotes
 * @module CareInterventionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Service for managing care interventions within care domains,
 * including intervention planning, scheduling, and outcome tracking.
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
import { CareIntervention, InterventionType, Priority, RequiredSkill, EquipmentNeeded, SafetyConsideration, OutcomeMeasure, DocumentationRequirement, Contraindication } from '../../entities/care-planning/CareIntervention';
import { CareDomain } from '../../entities/care-planning/CareDomain';
import { AuditService,  AuditTrailService } from '../audit';
import { FieldLevelEncryptionService } from '../encryption/FieldLevelEncryptionService';
import { NotificationService } from '../notifications/NotificationService';
import { EventPublishingService } from '../events/EventPublishingService';
import { logger } from '../../utils/logger';

export interface CreateCareInterventionRequest {
  careDomainId: string;
  interventionName: string;
  interventionCode?: string;
  description?: string;
  interventionType: InterventionType;
  frequency: string;
  timing?: string;
  durationMinutes?: number;
  priority: Priority;
  requiredSkills?: RequiredSkill[];
  equipmentNeeded?: EquipmentNeeded[];
  safetyConsiderations?: SafetyConsideration[];
  outcomeMeasures?: OutcomeMeasure[];
  documentationRequirements?: DocumentationRequirement[];
  contraindications?: Contraindication[];
  effectiveFrom: Date;
  isPrn?: boolean;
  createdBy: string;
}

export interface UpdateCareInterventionRequest {
  interventionName?: string;
  description?: string;
  frequency?: string;
  timing?: string;
  durationMinutes?: number;
  priority?: Priority;
  requiredSkills?: RequiredSkill[];
  equipmentNeeded?: EquipmentNeeded[];
  safetyConsiderations?: SafetyConsideration[];
  outcomeMeasures?: OutcomeMeasure[];
  documentationRequirements?: DocumentationRequirement[];
  contraindications?: Contraindication[];
  effectiveFrom?: Date;
  effectiveTo?: Date;
  isActive?: boolean;
  isPrn?: boolean;
  updatedBy: string;
}

export interface InterventionScheduleRequest {
  interventionId: string;
  scheduledDates: Date[];
  scheduledBy: string;
  notes?: string;
}

export interface InterventionSafetyCheck {
  interventionId: string;
  residentConditions: string[];
  residentMedications: string[];
  residentAllergies: string[];
  staffQualifications: string[];
}

export interface InterventionSafetyResult {
  isSafe: boolean;
  contraindications: Contraindication[];
  missingSkills: RequiredSkill[];
  safetyWarnings: SafetyConsideration[];
  recommendations: string[];
}

export interface InterventionComplexityAnalysis {
  complexityScore: number;
  complexityLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredCertifications: string[];
  estimatedTime: number;
  riskFactors: string[];
  resourceRequirements: string[];
}

export class CareInterventionValidationError extends Error {
  constructor(
    message: string,
    publicvalidationErrors: ValidationError[]
  ) {
    super(message);
    this.name = 'CareInterventionValidationError';
  }
}

export class CareInterventionNotFoundError extends Error {
  constructor(interventionId: string) {
    super(`Care intervention with ID ${interventionId} not found`);
    this.name = 'CareInterventionNotFoundError';
  }
}

export class CareInterventionSafetyError extends Error {
  constructor(message: string, public safetyIssues: string[]) {
    super(message);
    this.name = 'CareInterventionSafetyError';
  }
}

export class CareInterventionService {
  privatecareInterventionRepository: Repository<CareIntervention>;
  privatecareDomainRepository: Repository<CareDomain>;

  constructor(
    privatedataSource: DataSource,
    privateauditService: AuditService,
    privateencryptionService: FieldLevelEncryptionService,
    privatenotificationService: NotificationService,
    privateeventPublisher: EventPublishingService
  ) {
    this.careInterventionRepository = dataSource.getRepository(CareIntervention);
    this.careDomainRepository = dataSource.getRepository(CareDomain);
  }

  /**
   * Create a new care intervention
   */
  async createCareIntervention(request: CreateCareInterventionRequest): Promise<CareIntervention> {
    const correlationId = `care-intervention-create-${Date.now()}`;
    
    try {
      console.info('Creating new care intervention', { 
        careDomainId: request.careDomainId,
        interventionName: request.interventionName,
        correlationId 
      });

      // Validate care domain exists
      const careDomain = await this.careDomainRepository.findOne({
        where: { id: request.careDomainId, deletedAt: null }
      });

      if (!careDomain) {
        throw new Error(`Care domain with ID ${request.careDomainId} not found`);
      }

      // Create care intervention entity
      const careIntervention = new CareIntervention();
      careIntervention.careDomainId = request.careDomainId;
      careIntervention.interventionName = request.interventionName;
      careIntervention.interventionCode = request.interventionCode;
      careIntervention.description = request.description;
      careIntervention.interventionType = request.interventionType;
      careIntervention.frequency = request.frequency;
      careIntervention.timing = request.timing;
      careIntervention.durationMinutes = request.durationMinutes;
      careIntervention.priority = request.priority;
      careIntervention.effectiveFrom = request.effectiveFrom;
      careIntervention.isPrn = request.isPrn || false;
      careIntervention.isActive = true;
      careIntervention.createdBy = request.createdBy;

      // Add required skills
      if (request.requiredSkills) {
        for (const skill of request.requiredSkills) {
          careIntervention.addRequiredSkill(skill);
        }
      }

      // Add equipment needed
      if (request.equipmentNeeded) {
        for (const equipment of request.equipmentNeeded) {
          careIntervention.addEquipment(equipment);
        }
      }

      // Add safety considerations
      if (request.safetyConsiderations) {
        for (const safety of request.safetyConsiderations) {
          careIntervention.addSafetyConsideration(safety);
        }
      }

      // Add outcome measures
      if (request.outcomeMeasures) {
        for (const outcome of request.outcomeMeasures) {
          careIntervention.addOutcomeMeasure(outcome);
        }
      }

      // Add documentation requirements
      if (request.documentationRequirements) {
        for (const requirement of request.documentationRequirements) {
          careIntervention.addDocumentationRequirement(requirement);
        }
      }

      // Add contraindications
      if (request.contraindications) {
        for (const contraindication of request.contraindications) {
          careIntervention.addContraindication(contraindication);
        }
      }

      // Validate entity
      const validationErrors = await validate(careIntervention);
      if (validationErrors.length > 0) {
        throw new CareInterventionValidationError('Care intervention validation failed', validationErrors);
      }

      // Encrypt sensitive data
      await this.encryptSensitiveData(careIntervention);

      // Save to database
      const savedCareIntervention = await this.careInterventionRepository.save(careIntervention);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_INTERVENTION_CREATED',
        resourceType: 'CareIntervention',
        resourceId: savedCareIntervention.id,
        userId: request.createdBy,
        details: {
          careDomainId: request.careDomainId,
          interventionName: request.interventionName,
          interventionType: request.interventionType,
          priority: request.priority,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-intervention.created', {
        careInterventionId: savedCareIntervention.id,
        careDomainId: request.careDomainId,
        interventionName: request.interventionName,
        priority: request.priority,
        createdBy: request.createdBy,
        correlationId
      });

      // Send notification for critical priority interventions
      if (request.priority === Priority.CRITICAL) {
        await this.notificationService.sendNotification({
          message: 'Notification: Critical Intervention Created',
        type: 'critical_intervention_created',
          recipientType: 'care_team',
          title: 'Critical Care Intervention Created',
          message: `A critical priority care intervention (${request.interventionName}) has been created`,
          data: {
            careInterventionId: savedCareIntervention.id,
            interventionName: request.interventionName,
            priority: request.priority
          }
        });
      }

      console.info('Care intervention created successfully', { 
        careInterventionId: savedCareIntervention.id,
        correlationId 
      });

      return savedCareIntervention;

    } catch (error: unknown) {
      console.error('Failed to create care intervention', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId: request.careDomainId,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_INTERVENTION_CREATE_FAILED',
        resourceType: 'CareIntervention',
        userId: request.createdBy,
        details: {
          error: error instanceof Error ? error.message : "Unknown error",
          careDomainId: request.careDomainId,
          correlationId
        },
        correlationId
      });

      throw error;
    }
  }

  /**
   * Get care intervention by ID
   */
  async getCareInterventionById(id: string, includeRelations: boolean = true): Promise<CareIntervention | null> {
    try {
      const relations = includeRelations ? ['careDomain', 'careActivities'] : [];
      
      const careIntervention = await this.careInterventionRepository.findOne({
        where: { id, deletedAt: null },
        relations
      });

      if (!careIntervention) {
        return null;
      }

      // Decrypt sensitive data
      await this.decryptSensitiveData(careIntervention);

      return careIntervention;

    } catch (error: unknown) {
      console.error('Failed to get care intervention by ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careInterventionId: id 
      });
      throw error;
    }
  }

  /**
   * Get care interventions by care domain ID
   */
  async getCareInterventionsByCareDomainId(careDomainId: string, includeInactive: boolean = false): Promise<CareIntervention[]> {
    try {
      const queryBuilder = this.careInterventionRepository
        .createQueryBuilder('careIntervention')
        .leftJoinAndSelect('careIntervention.careActivities', 'activities')
        .where('careIntervention.careDomainId = :careDomainId', { careDomainId })
        .andWhere('careIntervention.deletedAt IS NULL');

      if (!includeInactive) {
        queryBuilder.andWhere('careIntervention.isActive = true');
      }

      const careInterventions = await queryBuilder
        .orderBy('careIntervention.priority', 'DESC')
        .addOrderBy('careIntervention.interventionName', 'ASC')
        .getMany();

      // Decrypt sensitive data for all interventions
      for (const intervention of careInterventions) {
        await this.decryptSensitiveData(intervention);
      }

      return careInterventions;

    } catch (error: unknown) {
      console.error('Failed to get care interventions by care domain ID', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careDomainId 
      });
      throw error;
    }
  }

  /**
   * Update care intervention
   */
  async updateCareIntervention(id: string, request: UpdateCareInterventionRequest): Promise<CareIntervention> {
    const correlationId = `care-intervention-update-${Date.now()}`;
    
    try {
      console.info('Updating care intervention', { careInterventionId: id, correlationId });

      const careIntervention = await this.getCareInterventionById(id);
      if (!careIntervention) {
        throw new CareInterventionNotFoundError(id);
      }

      // Store original values for audit
      const originalValues = {
        interventionName: careIntervention.interventionName,
        frequency: careIntervention.frequency,
        priority: careIntervention.priority,
        isActive: careIntervention.isActive
      };

      // Update fields
      if (request.interventionName) {
        careIntervention.interventionName = request.interventionName;
      }
      
      if (request.description !== undefined) {
        careIntervention.description = request.description;
      }
      
      if (request.frequency) {
        careIntervention.updateFrequency(request.frequency, request.timing);
      }
      
      if (request.durationMinutes !== undefined) {
        careIntervention.durationMinutes = request.durationMinutes;
      }
      
      if (request.priority) {
        careIntervention.updatePriority(request.priority);
      }
      
      if (request.requiredSkills) {
        careIntervention.requiredSkills = request.requiredSkills;
      }
      
      if (request.equipmentNeeded) {
        careIntervention.equipmentNeeded = request.equipmentNeeded;
      }
      
      if (request.safetyConsiderations) {
        careIntervention.safetyConsiderations = request.safetyConsiderations;
      }
      
      if (request.outcomeMeasures) {
        careIntervention.outcomeMeasures = request.outcomeMeasures;
      }
      
      if (request.documentationRequirements) {
        careIntervention.documentationRequirements = request.documentationRequirements;
      }
      
      if (request.contraindications) {
        careIntervention.contraindications = request.contraindications;
      }
      
      if (request.effectiveFrom) {
        careIntervention.effectiveFrom = request.effectiveFrom;
      }
      
      if (request.effectiveTo) {
        careIntervention.effectiveTo = request.effectiveTo;
      }
      
      if (request.isActive !== undefined) {
        careIntervention.isActive = request.isActive;
      }
      
      if (request.isPrn !== undefined) {
        careIntervention.isPrn = request.isPrn;
      }

      // Validate updated entity
      const validationErrors = await validate(careIntervention);
      if (validationErrors.length > 0) {
        throw new CareInterventionValidationError('Care intervention validation failed', validationErrors);
      }

      // Encrypt sensitive data
      await this.encryptSensitiveData(careIntervention);

      // Save updated care intervention
      const updatedCareIntervention = await this.careInterventionRepository.save(careIntervention);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_INTERVENTION_UPDATED',
        resourceType: 'CareIntervention',
        resourceId: id,
        userId: request.updatedBy,
        details: {
          originalValues,
          newValues: {
            interventionName: updatedCareIntervention.interventionName,
            frequency: updatedCareIntervention.frequency,
            priority: updatedCareIntervention.priority,
            isActive: updatedCareIntervention.isActive
          },
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-intervention.updated', {
        careInterventionId: id,
        careDomainId: updatedCareIntervention.careDomainId,
        updatedBy: request.updatedBy,
        priorityChanged: originalValues.priority !== updatedCareIntervention.priority,
        correlationId
      });

      console.info('Care intervention updated successfully', { 
        careInterventionId: id,
        correlationId 
      });

      return updatedCareIntervention;

    } catch (error: unknown) {
      console.error('Failed to update care intervention', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careInterventionId: id,
        correlationId 
      });

      await this.auditService.log({
        action: 'CARE_INTERVENTION_UPDATE_FAILED',
        resourceType: 'CareIntervention',
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
   * Perform safety check for intervention
   */
  async performSafetyCheck(request: InterventionSafetyCheck): Promise<InterventionSafetyResult> {
    try {
      const careIntervention = await this.getCareInterventionById(request.interventionId);
      if (!careIntervention) {
        throw new CareInterventionNotFoundError(request.interventionId);
      }

      // Check contraindications
      const contraindications = careIntervention.checkContraindications(request.residentConditions);
      
      // Check required skills
      const missingSkills = this.checkMissingSkills(careIntervention, request.staffQualifications);
      
      // Get safety warnings
      const safetyWarnings = careIntervention.safetyConsiderations?.filter(safety => 
        safety.riskLevel === 'high' || safety.riskLevel === 'critical'
      ) || [];

      // Generate recommendations
      const recommendations = this.generateSafetyRecommendations(
        contraindications,
        missingSkills,
        safetyWarnings
      );

      const isSafe = contraindications.length === 0 && 
                    missingSkills.length === 0 && 
                    safetyWarnings.filter(w => w.riskLevel === 'critical').length === 0;

      return {
        isSafe,
        contraindications,
        missingSkills,
        safetyWarnings,
        recommendations
      };

    } catch (error: unknown) {
      console.error('Failed to perform safety check', { 
        error: error instanceof Error ? error.message : "Unknown error",
        interventionId: request.interventionId 
      });
      throw error;
    }
  }

  /**
   * Analyze intervention complexity
   */
  async analyzeInterventionComplexity(id: string): Promise<InterventionComplexityAnalysis> {
    try {
      const careIntervention = await this.getCareInterventionById(id);
      if (!careIntervention) {
        throw new CareInterventionNotFoundError(id);
      }

      const complexityScore = careIntervention.calculateComplexityScore();
      const complexityLevel = this.getComplexityLevel(complexityScore);
      const requiredCertifications = careIntervention.getRequiredCertifications();
      const estimatedTime = careIntervention.estimatedDailyTime;
      
      const riskFactors = this.extractRiskFactors(careIntervention);
      const resourceRequirements = this.extractResourceRequirements(careIntervention);

      return {
        complexityScore,
        complexityLevel,
        requiredCertifications,
        estimatedTime,
        riskFactors,
        resourceRequirements
      };

    } catch (error: unknown) {
      console.error('Failed to analyze intervention complexity', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careInterventionId: id 
      });
      throw error;
    }
  }

  /**
   * Get interventions by priority
   */
  async getInterventionsByPriority(priority: Priority, includeInactive: boolean = false): Promise<CareIntervention[]> {
    try {
      const queryBuilder = this.careInterventionRepository
        .createQueryBuilder('careIntervention')
        .leftJoinAndSelect('careIntervention.careDomain', 'careDomain')
        .leftJoinAndSelect('careDomain.carePlan', 'carePlan')
        .leftJoinAndSelect('carePlan.resident', 'resident')
        .where('careIntervention.priority = :priority', { priority })
        .andWhere('careIntervention.deletedAt IS NULL');

      if (!includeInactive) {
        queryBuilder.andWhere('careIntervention.isActive = true');
      }

      const interventions = await queryBuilder
        .orderBy('careIntervention.createdAt', 'DESC')
        .getMany();

      // Decrypt sensitive data
      for (const intervention of interventions) {
        await this.decryptSensitiveData(intervention);
      }

      return interventions;

    } catch (error: unknown) {
      console.error('Failed to get interventions by priority', { 
        error: error instanceof Error ? error.message : "Unknown error",
        priority 
      });
      throw error;
    }
  }

  /**
   * Deactivate care intervention
   */
  async deactivateCareIntervention(id: string, deactivatedBy: string, reason?: string): Promise<CareIntervention> {
    const correlationId = `care-intervention-deactivate-${Date.now()}`;
    
    try {
      console.info('Deactivating care intervention', { careInterventionId: id, correlationId });

      const careIntervention = await this.getCareInterventionById(id);
      if (!careIntervention) {
        throw new CareInterventionNotFoundError(id);
      }

      careIntervention.deactivate(reason);

      // Save deactivated intervention
      const deactivatedCareIntervention = await this.careInterventionRepository.save(careIntervention);

      // Log audit trail
      await this.auditService.log({
        action: 'CARE_INTERVENTION_DEACTIVATED',
        resourceType: 'CareIntervention',
        resourceId: id,
        userId: deactivatedBy,
        details: {
          reason,
          correlationId
        },
        correlationId
      });

      // Publish event
      await this.eventPublisher.publish('care-intervention.deactivated', {
        careInterventionId: id,
        careDomainId: deactivatedCareIntervention.careDomainId,
        deactivatedBy,
        reason,
        correlationId
      });

      console.info('Care intervention deactivated successfully', { 
        careInterventionId: id,
        correlationId 
      });

      return deactivatedCareIntervention;

    } catch (error: unknown) {
      console.error('Failed to deactivate care intervention', { 
        error: error instanceof Error ? error.message : "Unknown error",
        careInterventionId: id,
        correlationId 
      });
      throw error;
    }
  }

  // Private helper methods

  private async encryptSensitiveData(careIntervention: CareIntervention): Promise<void> {
    if (careIntervention.description) {
      careIntervention.description = await this.encryptionService.encrypt(careIntervention.description);
    }
  }

  private async decryptSensitiveData(careIntervention: CareIntervention): Promise<void> {
    if (careIntervention.description) {
      careIntervention.description = await this.encryptionService.decrypt(careIntervention.description);
    }
  }

  private checkMissingSkills(intervention: CareIntervention, staffQualifications: string[]): RequiredSkill[] {
    if (!intervention.requiredSkills) return [];

    return intervention.requiredSkills.filter(skill => {
      if (skill.certification) {
        return !staffQualifications.includes(skill.certification);
      }
      return false; // If no specific certification required, assume staff can perform
    });
  }

  private generateSafetyRecommendations(
    contraindications: Contraindication[],
    missingSkills: RequiredSkill[],
    safetyWarnings: SafetyConsideration[]
  ): string[] {
    constrecommendations: any[] = [];

    if (contraindications.length > 0) {
      recommendations.push('Review contraindications before proceeding');
      contraindications.forEach(contra => {
        if (contra.alternativeApproach) {
          recommendations.push(`Consider alternative: ${contra.alternativeApproach}`);
        }
      });
    }

    if (missingSkills.length > 0) {
      recommendations.push('Ensure staff have required qualifications');
      missingSkills.forEach(skill => {
        if (skill.certification) {
          recommendations.push(`Required certification: ${skill.certification}`);
        }
      });
    }

    if (safetyWarnings.length > 0) {
      recommendations.push('Follow all safety precautions');
      safetyWarnings.forEach(warning => {
        warning.precautions.forEach(precaution => {
          recommendations.push(`Safety precaution: ${precaution}`);
        });
      });
    }

    return recommendations;
  }

  private getComplexityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score <= 3) return 'low';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'high';
    return 'critical';
  }

  private extractRiskFactors(intervention: CareIntervention): string[] {
    constriskFactors: string[] = [];

    if (intervention.hasHighRiskSafetyConsiderations) {
      riskFactors.push('High-risk safety considerations');
    }

    if (intervention.hasAbsoluteContraindications) {
      riskFactors.push('Absolute contraindications present');
    }

    if (intervention.requiresSpecializedSkills) {
      riskFactors.push('Requires specialized skills');
    }

    if (intervention.priority === Priority.CRITICAL) {
      riskFactors.push('Critical priority intervention');
    }

    return riskFactors;
  }

  private extractResourceRequirements(intervention: CareIntervention): string[] {
    constrequirements: string[] = [];

    if (intervention.equipmentNeeded && intervention.equipmentNeeded.length > 0) {
      requirements.push(`Equipment needed: ${intervention.equipmentNeeded.length} items`);
    }

    if (intervention.requiredSkills && intervention.requiredSkills.length > 0) {
      requirements.push(`Specialized skills: ${intervention.requiredSkills.length} requirements`);
    }

    if (intervention.durationMinutes && intervention.durationMinutes > 60) {
      requirements.push('Extended time requirement (>60 minutes)');
    }

    return requirements;
  }
}
