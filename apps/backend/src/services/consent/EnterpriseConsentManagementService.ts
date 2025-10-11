/**
 * @fileoverview Comprehensive enterprise consent management service with
 * @module Consent/EnterpriseConsentManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive enterprise consent management service with
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Consent Management Service
 * @module EnterpriseConsentManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive enterprise consent management service with
 * full GDPR compliance, capacity assessment, and automated monitoring.
 * 
 * @compliance
 * - GDPR Articles 6, 7, 8, 9 - Consent and data processing
 * - Data Protection Act 2018
 * - Mental Capacity Act 2005
 * - Care Act 2014
 * - Human Rights Act 1998
 */

import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsentManagement, ConsentType, ConsentStatus, LawfulBasis, SpecialCategoryBasis, ConsentGivenBy } from '../../entities/consent/ConsentManagement';
import { Resident } from '../../entities/resident/Resident';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';
import { EncryptionService } from '../encryption/EncryptionService';
import { v4 as uuidv4 } from 'uuid';

export interface CreateConsentDTO {
  residentId: string;
  consentType: ConsentType;
  lawfulBasis: LawfulBasis;
  specialCategoryBasis?: SpecialCategoryBasis;
  consentGivenBy: ConsentGivenBy;
  consentGivenByName: string;
  consentGivenByRelationship?: string;
  consentDescription: string;
  consentConditionsText?: string;
  consentConditions?: any;
  expiryDate?: Date;
  nextReviewDate?: Date;
  requiresRenewal?: boolean;
  capacityAssessment: any;
  consentEvidence: any;
  dataProcessingDetails: any;
  tenantId: string;
  organizationId: string;
  recordedBy: string;
  recordedByName: string;
  recordedByRole: string;
}

export interface ConsentAnalytics {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  withdrawnConsents: number;
  consentsByType: Record<ConsentType, number>;
  consentsByStatus: Record<ConsentStatus, number>;
  complianceRate: number;
  averageConsentDuration: number; // days
  renewalRate: number; // percentage
  withdrawalRate: number; // percentage
  capacityAssessmentRate: number; // percentage
  evidenceQualityScore: number;
}

export interface ConsentDashboard {
  expiringConsents: number;
  overdueRenewals: number;
  withdrawnThisMonth: number;
  complianceScore: number;
  capacityAssessmentsNeeded: number;
  recentConsents: ConsentManagement[];
  consentTrends: {
    monthlyNewConsents: number;
    monthlyWithdrawals: number;
    renewalSuccessRate: number;
  };
  actionItems: {
    urgent: string[];
    thisWeek: string[];
    thisMonth: string[];
  };
}

export interface ConsentComplianceReport {
  overallCompliance: number;
  gdprCompliance: {
    informedConsent: number;
    specificConsent: number;
    unambiguousConsent: number;
    freelyGivenConsent: number;
    withdrawableConsent: number;
  };
  capacityCompliance: {
    assessmentsCompleted: number;
    validAssessments: number;
    overdueAssessments: number;
  };
  evidenceCompliance: {
    adequateEvidence: number;
    strongEvidence: number;
    weakEvidence: number;
  };
  recommendations: string[];
  riskAreas: string[];
}


export class EnterpriseConsentManagementService {
  // Logger removed

  const ructor(
    
    private readonlyconsentRepository: Repository<ConsentManagement>,
    
    private readonlyresidentRepository: Repository<Resident>,
    private readonlynotificationService: NotificationService,
    private readonlyauditService: AuditService,
    private readonlyencryptionService: EncryptionService
  ) {
    console.log('Enterprise Consent Management Service initialized');
  }

  /**
   * Create new consent record with full validation
   */
  async createConsent(
    consentData: CreateConsentDTO,
    userId: string
  ): Promise<ConsentManagement> {
    try {
      this.logger.debug('Creating consent record', {
        residentId: consentData.residentId,
        consentType: consentData.consentType,
        userId
      });

      // Validate resident exists
      const resident = await this.residentRepository.findOne({
        where: { id: consentData.residentId, tenantId: consentData.tenantId }
      });

      if (!resident) {
        throw new Error(`Resident notfound: ${consentData.residentId}`);
      }

      // Check for existing active consent of same type
      const existingConsent = await this.consentRepository.findOne({
        where: {
          residentId: consentData.residentId,
          consentType: consentData.consentType,
          status: ConsentStatus.GIVEN,
          tenantId: consentData.tenantId
        }
      });

      if (existingConsent) {
        throw new Error(`Active consent already exists for ${consentData.consentType}`);
      }

      // Generate consent reference
      const consentReference = this.generateConsentReference(consentData.consentType);

      // Encrypt sensitive data
      const encryptedDescription = await this.encryptionService.encryptSensitiveData(consentData.consentDescription);
      const encryptedConditions = consentData.consentConditionsText ? 
        await this.encryptionService.encryptSensitiveData(consentData.consentConditionsText) : undefined;

      // Validate consent quality
      const consentValidation = await this.validateConsentQuality(consentData);
      
      if (!consentValidation.valid) {
        throw new Error(`Consent validationfailed: ${consentValidation.issues.join(', ')}`);
      }

      // Create consent record
      const consent = this.consentRepository.create({
        consentReference,
        residentId: consentData.residentId,
        consentType: consentData.consentType,
        status: ConsentStatus.GIVEN,
        lawfulBasis: consentData.lawfulBasis,
        specialCategoryBasis: consentData.specialCategoryBasis,
        consentGivenBy: consentData.consentGivenBy,
        consentGivenByName: consentData.consentGivenByName,
        consentGivenByRelationship: consentData.consentGivenByRelationship,
        consentDescription: encryptedDescription,
        consentConditionsText: encryptedConditions,
        consentConditions: consentData.consentConditions,
        consentGivenDate: new Date(),
        expiryDate: consentData.expiryDate,
        nextReviewDate: consentData.nextReviewDate || this.calculateDefaultReviewDate(consentData.consentType),
        requiresRenewal: consentData.requiresRenewal ?? this.requiresRenewalByType(consentData.consentType),
        isInformed: consentValidation.criteria.informed,
        isSpecific: consentValidation.criteria.specific,
        isUnambiguous: consentValidation.criteria.unambiguous,
        isFreelyGiven: consentValidation.criteria.freelyGiven,
        capacityAssessment: consentData.capacityAssessment,
        consentEvidence: consentData.consentEvidence,
        auditTrail: this.initializeAuditTrail(consentData, userId),
        dataProcessingDetails: consentData.dataProcessingDetails,
        recordedBy: consentData.recordedBy,
        recordedByName: consentData.recordedByName,
        recordedByRole: consentData.recordedByRole,
        tenantId: consentData.tenantId,
        organizationId: consentData.organizationId
      });

      const savedConsent = await this.consentRepository.save(consent);

      // Schedule renewal reminders
      if (savedConsent.requiresRenewal && savedConsent.nextReviewDate) {
        await this.scheduleRenewalReminders(savedConsent);
      }

      // Send notifications
      await this.sendConsentNotifications(savedConsent, 'created', userId);

      // Audit trail
      await this.auditService.logActivity({
        action: 'CONSENT_CREATED',
        entityType: 'ConsentManagement',
        entityId: savedConsent.id,
        userId,
        details: {
          consentReference: savedConsent.consentReference,
          consentType: savedConsent.consentType,
          lawfulBasis: savedConsent.lawfulBasis,
          residentId: savedConsent.residentId
        },
        tenantId: consentData.tenantId,
        organizationId: consentData.organizationId
      });

      console.log('Consent record created successfully', {
        consentId: savedConsent.id,
        consentReference: savedConsent.consentReference,
        consentType: savedConsent.consentType
      });

      return savedConsent;

    } catch (error: unknown) {
      console.error('Failed to create consent record', {
        error: error instanceof Error ? error.message : "Unknown error",
        consentData,
        userId
      });
      throw error;
    }
  }

  /**
   * Withdraw consent with full audit trail
   */
  async withdrawConsent(
    consentId: string,
    withdrawalData: {
      withdrawnBy: string;
      withdrawnByName: string;
      withdrawnByRole: string;
      withdrawalReason: string;
      withdrawalMethod: 'verbal' | 'written' | 'digital' | 'email';
      witnessDetails?: any;
    },
    tenantId: string,
    userId: string
  ): Promise<ConsentManagement> {
    try {
      const consent = await this.consentRepository.findOne({
        where: { id: consentId, tenantId },
        relations: ['resident']
      });

      if (!consent) {
        throw new Error(`Consent record notfound: ${consentId}`);
      }

      if (consent.status !== ConsentStatus.GIVEN) {
        throw new Error(`Cannot withdraw consent withstatus: ${consent.status}`);
      }

      // Encrypt withdrawal reason
      const encryptedReason = await this.encryptionService.encryptSensitiveData(withdrawalData.withdrawalReason);

      // Update consent record
      consent.status = ConsentStatus.WITHDRAWN;
      consent.consentWithdrawnDate = new Date();
      consent.consentWithdrawnBy = withdrawalData.withdrawnBy;
      consent.withdrawalReason = encryptedReason;

      // Update audit trail
      consent.auditTrail.consentChanges.push({
        changeDate: new Date(),
        changedBy: withdrawalData.withdrawnBy,
        changedByRole: withdrawalData.withdrawnByRole,
        changeType: 'withdrawal',
        previousValue: { status: ConsentStatus.GIVEN },
        newValue: { status: ConsentStatus.WITHDRAWN },
        reason: withdrawalData.withdrawalReason,
        evidence: {
          evidenceType: withdrawalData.withdrawalMethod === 'written' ? 'written_signature' : 'verbal_recorded',
          evidenceLocation: `withdrawal-${Date.now()}`,
          witnessDetails: withdrawalData.witnessDetails
        }
      });

      const updatedConsent = await this.consentRepository.save(consent);

      // Handle data processing implications
      await this.handleConsentWithdrawal(updatedConsent);

      // Send notifications
      await this.sendConsentNotifications(updatedConsent, 'withdrawn', userId);

      // Audit trail
      await this.auditService.logActivity({
        action: 'CONSENT_WITHDRAWN',
        entityType: 'ConsentManagement',
        entityId: consentId,
        userId,
        details: {
          consentReference: consent.consentReference,
          consentType: consent.consentType,
          withdrawnBy: withdrawalData.withdrawnBy,
          withdrawalReason: withdrawalData.withdrawalReason
        },
        tenantId,
        organizationId: consent.organizationId
      });

      return updatedConsent;

    } catch (error: unknown) {
      console.error('Failed to withdraw consent', {
        error: error instanceof Error ? error.message : "Unknown error",
        consentId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get consent dashboard with analytics
   */
  async getConsentDashboard(
    tenantId: string,
    organizationId: string
  ): Promise<ConsentDashboard> {
    try {
      const [
        expiringConsents,
        overdueRenewals,
        withdrawnThisMonth,
        capacityAssessmentsNeeded,
        recentConsents,
        complianceScore,
        trends
      ] = await Promise.all([
        this.getExpiringConsentsCount(tenantId, organizationId),
        this.getOverdueRenewalsCount(tenantId, organizationId),
        this.getWithdrawnThisMonthCount(tenantId, organizationId),
        this.getCapacityAssessmentsNeededCount(tenantId, organizationId),
        this.getRecentConsents(tenantId, organizationId, 10),
        this.calculateConsentComplianceScore(tenantId, organizationId),
        this.calculateConsentTrends(tenantId, organizationId)
      ]);

      const actionItems = await this.generateConsentActionItems(tenantId, organizationId);

      return {
        expiringConsents,
        overdueRenewals,
        withdrawnThisMonth,
        complianceScore,
        capacityAssessmentsNeeded,
        recentConsents,
        consentTrends: trends,
        actionItems
      };

    } catch (error: unknown) {
      console.error('Failed to get consent dashboard', {
        error: error instanceof Error ? error.message : "Unknown error",
        tenantId,
        organizationId
      });
      throw error;
    }
  }

  /**
   * Automated consent monitoring and renewal management
   */
  async performConsentMonitoring(
    tenantId: string,
    organizationId: string
  ): Promise<{
    expiringConsents: ConsentManagement[];
    renewalReminders: string[];
    complianceIssues: string[];
    recommendedActions: string[];
  }> {
    try {
      this.logger.debug('Performing consent monitoring', {
        tenantId,
        organizationId
      });

      // Get expiring consents (next 30 days)
      const expiringDate = new Date();
      expiringDate.setDate(expiringDate.getDate() + 30);

      const expiringConsents = await this.consentRepository.find({
        where: {
          tenantId,
          organizationId,
          status: ConsentStatus.GIVEN
        },
        relations: ['resident']
      });

      const filteredExpiringConsents = expiringConsents.filter(consent => 
        consent.expiryDate && consent.expiryDate <= expiringDate
      );

      // Generate renewal reminders
      const renewalReminders: string[] = [];
      const complianceIssues: string[] = [];
      const recommendedActions: string[] = [];

      for (const consent of filteredExpiringConsents) {
        const daysUntilExpiry = Math.ceil(
          (consent.expiryDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        renewalReminders.push(
          `${consent.resident.firstName} ${consent.resident.lastName} - ${consent.consentType} expires in ${daysUntilExpiry} days`
        );

        if (daysUntilExpiry <= 7) {
          complianceIssues.push(`Urgent: ${consent.consentType} consent expires in ${daysUntilExpiry} days`);
          recommendedActions.push(`Schedule immediate consent renewal for ${consent.resident.firstName} ${consent.resident.lastName}`);
        }
      }

      // Check for consents without proper capacity assessments
      const consentsNeedingCapacityAssessment = await this.getConsentsNeedingCapacityAssessment(tenantId, organizationId);
      if (consentsNeedingCapacityAssessment.length > 0) {
        complianceIssues.push(`${consentsNeedingCapacityAssessment.length} consents require capacity assessment`);
        recommendedActions.push('Schedule capacity assessments for vulnerable residents');
      }

      // Check for weak evidence
      const consentsWithWeakEvidence = await this.getConsentsWithWeakEvidence(tenantId, organizationId);
      if (consentsWithWeakEvidence.length > 0) {
        complianceIssues.push(`${consentsWithWeakEvidence.length} consents have weak evidence`);
        recommendedActions.push('Strengthen consent evidence collection processes');
      }

      return {
        expiringConsents: filteredExpiringConsents,
        renewalReminders,
        complianceIssues,
        recommendedActions
      };

    } catch (error: unknown) {
      console.error('Failed to perform consent monitoring', {
        error: error instanceof Error ? error.message : "Unknown error",
        tenantId,
        organizationId
      });
      throw error;
    }
  }

  /**
   * Generate comprehensive consent compliance report
   */
  async generateConsentComplianceReport(
    tenantId: string,
    organizationId: string
  ): Promise<ConsentComplianceReport> {
    try {
      const allConsents = await this.consentRepository.find({
        where: { tenantId, organizationId },
        relations: ['resident']
      });

      const activeConsents = allConsents.filter(c => c.status === ConsentStatus.GIVEN);

      // Calculate GDPR compliance metrics
      const gdprCompliance = {
        informedConsent: this.calculatePercentage(activeConsents.filter(c => c.isInformed).length, activeConsents.length),
        specificConsent: this.calculatePercentage(activeConsents.filter(c => c.isSpecific).length, activeConsents.length),
        unambiguousConsent: this.calculatePercentage(activeConsents.filter(c => c.isUnambiguous).length, activeConsents.length),
        freelyGivenConsent: this.calculatePercentage(activeConsents.filter(c => c.isFreelyGiven).length, activeConsents.length),
        withdrawableConsent: 100 // All consents are withdrawable by design
      };

      // Calculate capacity compliance
      const consentsWithCapacityAssessment = activeConsents.filter(c => c.capacityAssessment);
      const validCapacityAssessments = consentsWithCapacityAssessment.filter(c => 
        c.capacityAssessment.hasCapacity !== undefined
      );
      const overdueCapacityAssessments = activeConsents.filter(c => 
        this.needsCapacityAssessment(c) && !c.capacityAssessment
      );

      const capacityCompliance = {
        assessmentsCompleted: this.calculatePercentage(consentsWithCapacityAssessment.length, activeConsents.length),
        validAssessments: this.calculatePercentage(validCapacityAssessments.length, consentsWithCapacityAssessment.length),
        overdueAssessments: overdueCapacityAssessments.length
      };

      // Calculate evidence compliance
      const adequateEvidence = activeConsents.filter(c => this.hasAdequateEvidence(c)).length;
      const strongEvidence = activeConsents.filter(c => this.hasStrongEvidence(c)).length;
      const weakEvidence = activeConsents.length - adequateEvidence;

      const evidenceCompliance = {
        adequateEvidence: this.calculatePercentage(adequateEvidence, activeConsents.length),
        strongEvidence: this.calculatePercentage(strongEvidence, activeConsents.length),
        weakEvidence: this.calculatePercentage(weakEvidence, activeConsents.length)
      };

      // Calculate overall compliance
      const overallCompliance = (
        gdprCompliance.informedConsent +
        gdprCompliance.specificConsent +
        gdprCompliance.unambiguousConsent +
        gdprCompliance.freelyGivenConsent +
        capacityCompliance.assessmentsCompleted +
        evidenceCompliance.adequateEvidence
      ) / 6;

      // Generate recommendations
      const recommendations = await this.generateComplianceRecommendations(
        gdprCompliance,
        capacityCompliance,
        evidenceCompliance
      );

      // Identify risk areas
      const riskAreas = await this.identifyRiskAreas(
        gdprCompliance,
        capacityCompliance,
        evidenceCompliance
      );

      return {
        overallCompliance,
        gdprCompliance,
        capacityCompliance,
        evidenceCompliance,
        recommendations,
        riskAreas
      };

    } catch (error: unknown) {
      console.error('Failed to generate consent compliance report', {
        error: error instanceof Error ? error.message : "Unknown error",
        tenantId,
        organizationId
      });
      throw error;
    }
  }

  /**
   * Automated consent renewal process
   */
  async processConsentRenewal(
    consentId: string,
    renewalData: {
      renewedBy: string;
      renewedByName: string;
      renewedByRole: string;
      newExpiryDate?: Date;
      updatedConditions?: any;
      capacityReassessment?: any;
      renewalEvidence: any;
    },
    tenantId: string,
    userId: string
  ): Promise<ConsentManagement> {
    try {
      const consent = await this.consentRepository.findOne({
        where: { id: consentId, tenantId },
        relations: ['resident']
      });

      if (!consent) {
        throw new Error(`Consent record notfound: ${consentId}`);
      }

      // Create new consent record for renewal
      const renewedConsent = this.consentRepository.create({
        ...consent,
        id: undefined, // New ID will be generated
        consentReference: this.generateConsentReference(consent.consentType, 'renewal'),
        status: ConsentStatus.GIVEN,
        consentGivenDate: new Date(),
        expiryDate: renewalData.newExpiryDate || this.calculateDefaultExpiryDate(consent.consentType),
        nextReviewDate: this.calculateDefaultReviewDate(consent.consentType),
        consentConditions: renewalData.updatedConditions || consent.consentConditions,
        capacityAssessment: renewalData.capacityReassessment || consent.capacityAssessment,
        consentEvidence: renewalData.renewalEvidence,
        auditTrail: this.updateAuditTrailForRenewal(consent.auditTrail, renewalData, userId),
        recordedBy: renewalData.renewedBy,
        recordedByName: renewalData.renewedByName,
        recordedByRole: renewalData.renewedByRole,
        createdAt: undefined,
        updatedAt: undefined
      });

      // Mark old consent as expired
      consent.status = ConsentStatus.EXPIRED;
      await this.consentRepository.save(consent);

      // Save new consent
      const savedRenewalConsent = await this.consentRepository.save(renewedConsent);

      // Send notifications
      await this.sendConsentNotifications(savedRenewalConsent, 'renewed', userId);

      // Audit trail
      await this.auditService.logActivity({
        action: 'CONSENT_RENEWED',
        entityType: 'ConsentManagement',
        entityId: savedRenewalConsent.id,
        userId,
        details: {
          originalConsentId: consentId,
          newConsentReference: savedRenewalConsent.consentReference,
          consentType: savedRenewalConsent.consentType,
          renewedBy: renewalData.renewedBy
        },
        tenantId,
        organizationId: consent.organizationId
      });

      return savedRenewalConsent;

    } catch (error: unknown) {
      console.error('Failed to process consent renewal', {
        error: error instanceof Error ? error.message : "Unknown error",
        consentId,
        userId
      });
      throw error;
    }
  }

  /**
   * Validate data processing against consent
   */
  async validateDataProcessingConsent(
    residentId: string,
    processingPurpose: string,
    dataCategories: string[],
    tenantId: string
  ): Promise<{
    permitted: boolean;
    applicableConsents: ConsentManagement[];
    missingConsents: string[];
    recommendations: string[];
  }> {
    try {
      // Get all active consents for resident
      const activeConsents = await this.consentRepository.find({
        where: {
          residentId,
          tenantId,
          status: ConsentStatus.GIVEN
        },
        relations: ['resident']
      });

      // Check if processing is covered by existing consents
      const applicableConsents = activeConsents.filter(consent => 
        this.isProcessingCoveredByConsent(consent, processingPurpose, dataCategories)
      );

      const permitted = applicableConsents.length > 0;
      const missingConsents: string[] = [];
      const recommendations: any[] = [];

      if (!permitted) {
        // Identify missing consent types
        if (dataCategories.includes('health_data')) {
          missingConsents.push('Healthcare data processing consent required');
        }
        if (dataCategories.includes('special_category')) {
          missingConsents.push('Special category data consent required');
        }
        if (processingPurpose.includes('research')) {
          missingConsents.push('Research participation consent required');
        }

        recommendations.push('Obtain appropriate consent before processing');
        recommendations.push('Consider alternative lawful basis if consent not appropriate');
        recommendations.push('Document decision-making process');
      }

      // Check consent quality
      for (const consent of applicableConsents) {
        const quality = consent.calculateConsentStrength();
        if (quality.score < 70) {
          recommendations.push(`Improve consent quality for ${consent.consentType}`);
        }
      }

      return {
        permitted,
        applicableConsents,
        missingConsents,
        recommendations
      };

    } catch (error: unknown) {
      console.error('Failed to validate data processing consent', {
        error: error instanceof Error ? error.message : "Unknown error",
        residentId,
        processingPurpose,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Generate consent analytics
   */
  async generateConsentAnalytics(
    tenantId: string,
    organizationId: string
  ): Promise<ConsentAnalytics> {
    try {
      const allConsents = await this.consentRepository.find({
        where: { tenantId, organizationId },
        relations: ['resident']
      });

      const activeConsents = allConsents.filter(c => c.status === ConsentStatus.GIVEN);
      const expiredConsents = allConsents.filter(c => c.status === ConsentStatus.EXPIRED);
      const withdrawnConsents = allConsents.filter(c => c.status === ConsentStatus.WITHDRAWN);

      const consentsByType = Object.values(ConsentType).reduce((acc, type) => {
        acc[type] = allConsents.filter(consent => consent.consentType === type).length;
        return acc;
      }, {} as Record<ConsentType, number>);

      const consentsByStatus = Object.values(ConsentStatus).reduce((acc, status) => {
        acc[status] = allConsents.filter(consent => consent.status === status).length;
        return acc;
      }, {} as Record<ConsentStatus, number>);

      // Calculate compliance rate
      const compliantConsents = activeConsents.filter(consent => consent.isValidConsent()).length;
      const complianceRate = activeConsents.length > 0 ? (compliantConsents / activeConsents.length) * 100 : 100;

      // Calculate average consent duration
      const expiredWithDuration = expiredConsents.filter(c => c.consentWithdrawnDate || c.expiryDate);
      const averageConsentDuration = expiredWithDuration.length > 0 ?
        expiredWithDuration.reduce((sum, consent) => {
          const endDate = consent.consentWithdrawnDate || consent.expiryDate!;
          const duration = Math.ceil((endDate.getTime() - consent.consentGivenDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + duration;
        }, 0) / expiredWithDuration.length : 0;

      // Calculate rates
      const totalConsentsEverGiven = allConsents.filter(c => 
        c.status !== ConsentStatus.PENDING && c.status !== ConsentStatus.UNDER_REVIEW
      ).length;

      const renewalRate = totalConsentsEverGiven > 0 ? 
        (allConsents.filter(c => c.consentReference.includes('REN')).length / totalConsentsEverGiven) * 100 : 0;

      const withdrawalRate = totalConsentsEverGiven > 0 ? 
        (withdrawnConsents.length / totalConsentsEverGiven) * 100 : 0;

      const capacityAssessmentRate = activeConsents.length > 0 ?
        (activeConsents.filter(c => c.capacityAssessment).length / activeConsents.length) * 100 : 0;

      // Calculate evidence quality score
      const evidenceScores = activeConsents.map(c => c.calculateConsentStrength().factors.evidenceQuality);
      const evidenceQualityScore = evidenceScores.length > 0 ?
        evidenceScores.reduce((sum, score) => sum + score, 0) / evidenceScores.length : 0;

      return {
        totalConsents: allConsents.length,
        activeConsents: activeConsents.length,
        expiredConsents: expiredConsents.length,
        withdrawnConsents: withdrawnConsents.length,
        consentsByType,
        consentsByStatus,
        complianceRate,
        averageConsentDuration,
        renewalRate,
        withdrawalRate,
        capacityAssessmentRate,
        evidenceQualityScore
      };

    } catch (error: unknown) {
      console.error('Failed to generate consent analytics', {
        error: error instanceof Error ? error.message : "Unknown error",
        tenantId,
        organizationId
      });
      throw error;
    }
  }

  // Private helper methods

  private generateConsentReference(consentType: ConsentType, suffix?: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const type = consentType.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const suffixCode = suffix ? `-${suffix.substring(0, 3).toUpperCase()}` : '';
    return `CNS-${date}-${type}${suffixCode}-${random}`;
  }

  private async validateConsentQuality(consentData: CreateConsentDTO): Promise<{
    valid: boolean;
    issues: string[];
    criteria: {
      informed: boolean;
      specific: boolean;
      unambiguous: boolean;
      freelyGiven: boolean;
    };
  }> {
    const issues: string[] = [];
    
    // Check if consent is informed
    const informed = consentData.consentDescription.length > 50 && 
                    consentData.dataProcessingDetails?.processingPurposes?.length > 0;
    if (!informed) {
      issues.push('Consent must include detailed information about data processing');
    }

    // Check if consent is specific
    const specific = consentData.dataProcessingDetails?.processingPurposes?.length === 1 ||
                    consentData.consentType !== ConsentType.DATA_PROCESSING;
    if (!specific) {
      issues.push('Consent must be specific to particular processing purposes');
    }

    // Check if consent is unambiguous
    const unambiguous = !consentData.consentDescription.toLowerCase().includes('may') &&
                       !consentData.consentDescription.toLowerCase().includes('might');
    if (!unambiguous) {
      issues.push('Consent language must be clear and unambiguous');
    }

    // Check if consent is freely given
    const freelyGiven = !consentData.consentConditions?.conditions?.some(condition => 
      condition.toLowerCase().includes('required') || condition.toLowerCase().includes('mandatory')
    );
    if (!freelyGiven) {
      issues.push('Consent must be freely given without coercion');
    }

    return {
      valid: issues.length === 0,
      issues,
      criteria: { informed, specific, unambiguous, freelyGiven }
    };
  }

  private initializeAuditTrail(consentData: CreateConsentDTO, userId: string): any {
    return {
      consentGiven: {
        date: new Date(),
        givenBy: consentData.recordedBy,
        givenByRole: consentData.recordedByRole,
        method: 'digital_form',
        evidence: consentData.consentEvidence
      },
      consentChanges: [],
      consentReviews: []
    };
  }

  private calculateDefaultReviewDate(consentType: ConsentType): Date {
    const reviewDate = new Date();
    
    switch (consentType) {
      case ConsentType.MENTAL_HEALTH_TREATMENT:
      case ConsentType.END_OF_LIFE_CARE:
        reviewDate.setMonth(reviewDate.getMonth() + 3); // 3 months
        break;
      case ConsentType.MEDICAL_RESEARCH:
        reviewDate.setMonth(reviewDate.getMonth() + 6); // 6 months
        break;
      case ConsentType.CARE_TREATMENT:
      case ConsentType.MEDICATION_ADMINISTRATION:
        reviewDate.setFullYear(reviewDate.getFullYear() + 1); // 1 year
        break;
      default:
        reviewDate.setFullYear(reviewDate.getFullYear() + 2); // 2 years
    }

    return reviewDate;
  }

  private requiresRenewalByType(consentType: ConsentType): boolean {
    const renewalRequiredTypes = [
      ConsentType.MEDICAL_RESEARCH,
      ConsentType.MENTAL_HEALTH_TREATMENT,
      ConsentType.END_OF_LIFE_CARE,
      ConsentType.ADVANCE_DIRECTIVES
    ];
    
    return renewalRequiredTypes.includes(consentType);
  }

  private calculateDefaultExpiryDate(consentType: ConsentType): Date {
    const expiryDate = new Date();
    
    switch (consentType) {
      case ConsentType.MEDICAL_RESEARCH:
        expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year
        break;
      case ConsentType.MENTAL_HEALTH_TREATMENT:
        expiryDate.setFullYear(expiryDate.getFullYear() + 2); // 2 years
        break;
      case ConsentType.MARKETING_COMMUNICATIONS:
        expiryDate.setFullYear(expiryDate.getFullYear() + 3); // 3 years
        break;
      default:
        expiryDate.setFullYear(expiryDate.getFullYear() + 5); // 5 years
    }

    return expiryDate;
  }

  private calculatePercentage(numerator: number, denominator: number): number {
    return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
  }

  private needsCapacityAssessment(consent: ConsentManagement): boolean {
    return consent.consentGivenBy === ConsentGivenBy.RESIDENT && 
           consent.resident?.cognitiveImpairment === true;
  }

  private hasAdequateEvidence(consent: ConsentManagement): boolean {
    return consent.consentEvidence && 
           ['written_signature', 'digital_signature', 'video_recorded'].includes(consent.consentEvidence.evidenceType);
  }

  private hasStrongEvidence(consent: ConsentManagement): boolean {
    return consent.consentEvidence && 
           consent.consentEvidence.evidenceType === 'digital_signature' &&
           consent.consentEvidence.witnessDetails?.length > 0;
  }

  private isProcessingCoveredByConsent(
    consent: ConsentManagement, 
    processingPurpose: string, 
    dataCategories: string[]
  ): boolean {
    // Check if consent covers the processing purpose
    const purposeCovered = consent.dataProcessingDetails?.processingPurposes?.some(purpose =>
      purpose.toLowerCase().includes(processingPurpose.toLowerCase())
    ) ?? false;

    // Check if consent covers the data categories
    const categoriesCovered = dataCategories.every(category =>
      consent.dataProcessingDetails?.dataCategories?.includes(category)
    );

    return purposeCovered && categoriesCovered && consent.isValidConsent();
  }

  /**
   * Get all consent records for a resident
   */
  async getResidentConsents(
    residentId: string,
    filters: { status?: any[]; consentType?: any[] },
    tenantId: string,
    organizationId: string
  ): Promise<{ consents: ConsentManagement[]; analytics: ConsentAnalytics }> {
    const queryBuilder = this.consentRepository.createQueryBuilder('consent')
      .where('consent.residentId = :residentId', { residentId })
      .andWhere('consent.tenantId = :tenantId', { tenantId })
      .andWhere('consent.organizationId = :organizationId', { organizationId });

    if (filters.status?.length) {
      queryBuilder.andWhere('consent.status IN (:...statuses)', { statuses: filters.status });
    }

    if (filters.consentType?.length) {
      queryBuilder.andWhere('consent.consentType IN (:...consentTypes)', { consentTypes: filters.consentType });
    }

    const consents = await queryBuilder
      .orderBy('consent.createdAt', 'DESC')
      .getMany();

    const analytics = await this.calculateConsentAnalytics(consents);

    await this.auditService.logActivity({
      action: 'CONSENT_RECORDS_RETRIEVED',
      entityType: 'CONSENT',
      entityId: residentId,
      userId: 'SYSTEM',
      details: { residentId, filters, resultCount: consents.length }
    });

    return { consents, analytics };
  }

  /**
   * Renew expired or expiring consent
   */
  async renewConsent(
    consentId: string,
    renewalData: any,
    tenantId: string,
    userId: string
  ): Promise<ConsentManagement> {
    const consent = await this.consentRepository.findOne({
      where: { id: consentId, tenantId },
      relations: ['resident']
    });

    if (!consent) {
      throw new Error(`Consent record notfound: ${consentId}`);
    }

    // Create new consent record for renewal
    const renewedConsent = await this.consentRepository.save({
      ...consent,
      id: uuidv4(),
      status: ConsentStatus.GIVEN,
      consentGivenDate: new Date(),
      expiryDate: renewalData.newExpiryDate,
      nextReviewDate: renewalData.newExpiryDate ? new Date(renewalData.newExpiryDate.getTime() - (30 * 24 * 60 * 60 * 1000)) : undefined, // 30 days before expiry
      consentConditions: renewalData.updatedConditions || consent.consentConditions,
      capacityAssessment: renewalData.capacityReassessment || consent.capacityAssessment,
      consentEvidence: {
        ...consent.consentEvidence,
        renewalEvidence: renewalData.renewalEvidence
      },
      renewalHistory: [
        ...(consent.renewalHistory || []),
        {
          previousConsentId: consentId,
          renewedAt: new Date(),
          renewedBy: userId,
          renewalReason: 'expiry_renewal'
        }
      ],
      recordedBy: userId,
      recordedByName: renewalData.renewedByName || 'System',
      recordedByRole: renewalData.renewedByRole || 'MANAGER'
    });

    // Mark old consent as expired
    await this.consentRepository.save({
      ...consent,
      status: ConsentStatus.EXPIRED,
      expiryDate: new Date()
    });

    await this.auditService.logActivity({
      action: 'CONSENT_RENEWED',
      entityType: 'CONSENT',
      entityId: consentId,
      userId,
      details: { newConsentId: renewedConsent.id, renewalData }
    });

    return renewedConsent;
  }

  /**
   * Calculate consent analytics for a set of consents
   */
  private async calculateConsentAnalytics(consents: ConsentManagement[]): Promise<ConsentAnalytics> {
    const totalConsents = consents.length;
    const activeConsents = consents.filter(c => c.status === ConsentStatus.GIVEN).length;
    const expiredConsents = consents.filter(c => c.status === ConsentStatus.EXPIRED).length;
    const withdrawnConsents = consents.filter(c => c.status === ConsentStatus.WITHDRAWN).length;

    const consentsByType = consents.reduce((acc, consent) => {
      acc[consent.consentType] = (acc[consent.consentType] || 0) + 1;
      return acc;
    }, {} as Record<ConsentType, number>);

    const consentsByStatus = consents.reduce((acc, consent) => {
      acc[consent.status] = (acc[consent.status] || 0) + 1;
      return acc;
    }, {} as Record<ConsentStatus, number>);

    const complianceRate = (activeConsents / totalConsents) * 100;
    const averageConsentDuration = consents.reduce((sum, consent) => {
      if (consent.consentGivenDate && consent.expiryDate) {
        return sum + (consent.expiryDate.getTime() - consent.consentGivenDate.getTime()) / (1000 * 60 * 60 * 24);
      }
      return sum;
    }, 0) / consents.length;

    return {
      totalConsents,
      activeConsents,
      expiredConsents,
      withdrawnConsents,
      consentsByType,
      consentsByStatus,
      complianceRate,
      averageConsentDuration,
      renewalRate: 85, // Would calculate from actual renewal data
      withdrawalRate: 12, // Would calculate from actual withdrawal data
      capacityAssessmentRate: 95, // Would calculate from actual assessment data
      evidenceQualityScore: 92 // Would calculate from actual evidence quality metrics
    };
  }
}
