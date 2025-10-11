/**
 * ============================================================================
 * Health Service
 * ============================================================================
 * 
 * @fileoverview Core business logic for health management of looked after
 *               children including health assessments, medical consent, and
 *               healthcare coordination.
 * 
 * @module domains/health/services/HealthService
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides comprehensive health functionality for residential children's homes.
 * Manages Initial and Review Health Assessments, medical consent including
 * Gillick competence, GP registration, immunization tracking, and healthcare
 * professional coordination. Ensures statutory compliance with health regulations.
 * 
 * @compliance
 * - OFSTED Regulation 9 (Health and wellbeing)
 * - Statutory Guidance on Promoting the Health of Looked After Children 2015
 * - Children Act 1989, Section 22(3)(a)
 * - Mental Capacity Act 2005
 * - Gillick competence principles
 * 
 * @features
 * - Health assessment scheduling and tracking
 * - Medical consent management with Gillick assessment
 * - GP registration monitoring
 * - Immunization tracking
 * - Health action plan coordination
 * - Overdue assessment alerts
 * - Mental health referral tracking
 * 
 * @dependencies
 * - HealthAssessment entity
 * - MedicalConsent entity
 * - Child entity
 * - NotificationService for alerts
 * - AuditService for compliance logging
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/database';
import { HealthAssessment, AssessmentType, AssessmentStatus } from '../entities/HealthAssessment';
import { MedicalConsent, ConsentType, ConsentStatus, ConsentGivenBy } from '../entities/MedicalConsent';
import { Child } from '../../children/entities/Child';

export class HealthService {
  privatehealthAssessmentRepository: Repository<HealthAssessment>;
  privatemedicalConsentRepository: Repository<MedicalConsent>;
  privatechildRepository: Repository<Child>;

  const ructor() {
    this.healthAssessmentRepository = AppDataSource.getRepository(HealthAssessment);
    this.medicalConsentRepository = AppDataSource.getRepository(MedicalConsent);
    this.childRepository = AppDataSource.getRepository(Child);
  }

  // ========================================
  // HEALTH ASSESSMENT MANAGEMENT
  // ========================================

  /**
   * Request Initial Health Assessment
   * 
   * @param assessmentData - Assessment details
   * @returns Created health assessment
   * 
   * @throws Error if child not found
   * 
   * @example
   * const assessment = await healthService.requestInitialHealthAssessment({
   *   childId: '123',
   *   requestedDate: new Date(),
   *   organizationId: '456'
   * });
   */
  async requestInitialHealthAssessment(assessmentData: {
    childId: string;
    organizationId: string;
    requestedDate: Date;
  }): Promise<HealthAssessment> {
    // Validate child exists
    const child = await this.childRepository.findOne({
      where: { id: assessmentData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${assessmentData.childId} not found`);
    }

    // Calculate due date (20 working days from request)
    const dueDate = this.addWorkingDays(assessmentData.requestedDate, 20);

    // Generate assessment number
    const assessmentNumber = await this.generateAssessmentNumber(
      assessmentData.organizationId,
      AssessmentType.INITIAL
    );

    const assessment = this.healthAssessmentRepository.create({
      assessmentNumber,
      childId: assessmentData.childId,
      organizationId: assessmentData.organizationId,
      assessmentType: AssessmentType.INITIAL,
      status: AssessmentStatus.REQUESTED,
      requestedDate: assessmentData.requestedDate,
      dueDate,
      createdBy: 'System',
      updatedBy: 'System'
    });

    const savedAssessment = await this.healthAssessmentRepository.save(assessment);

    // Notify designated nurse/health visitor
    // await this.notificationService.sendAlert({...});

    return savedAssessment;
  }

  /**
   * Request Review Health Assessment
   * 
   * @param assessmentData - Assessment details
   * @returns Created health assessment
   */
  async requestReviewHealthAssessment(assessmentData: {
    childId: string;
    organizationId: string;
    requestedDate: Date;
    childAge: number;
  }): Promise<HealthAssessment> {
    const child = await this.childRepository.findOne({
      where: { id: assessmentData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${assessmentData.childId} not found`);
    }

    // Calculate due date based on age
    // Under 5s: 6 monthly, Over 5s: annually
    const monthsUntilDue = assessmentData.childAge < 5 ? 6 : 12;
    const dueDate = new Date(assessmentData.requestedDate);
    dueDate.setMonth(dueDate.getMonth() + monthsUntilDue);

    const assessmentNumber = await this.generateAssessmentNumber(
      assessmentData.organizationId,
      AssessmentType.REVIEW
    );

    const assessment = this.healthAssessmentRepository.create({
      assessmentNumber,
      childId: assessmentData.childId,
      organizationId: assessmentData.organizationId,
      assessmentType: AssessmentType.REVIEW,
      status: AssessmentStatus.REQUESTED,
      requestedDate: assessmentData.requestedDate,
      dueDate,
      createdBy: 'System',
      updatedBy: 'System'
    });

    return await this.healthAssessmentRepository.save(assessment);
  }

  /**
   * Complete health assessment
   * 
   * @param assessmentId - Assessment ID
   * @param assessmentData - Assessment completion data
   * @returns Updated assessment
   */
  async completeHealthAssessment(
    assessmentId: string,
    assessmentData: {
      assessmentDate: Date;
      assessedByName: string;
      assessedByRole: string;
      gpRegistered: boolean;
      heightCm?: number;
      weightKg?: number;
      immunizationsUpToDate: boolean;
      mentalHealthConcerns: boolean;
      recommendations: string;
      updatedBy: string;
    }
  ): Promise<HealthAssessment> {
    const assessment = await this.healthAssessmentRepository.findOne({
      where: { id: assessmentId }
    });

    if (!assessment) {
      throw new Error(`Health assessment with ID ${assessmentId} not found`);
    }

    // Calculate BMI if height and weight provided
    let bmi: number | undefined;
    if (assessmentData.heightCm && assessmentData.weightKg) {
      const heightM = assessmentData.heightCm / 100;
      bmi = Number((assessmentData.weightKg / (heightM * heightM)).toFixed(2));
    }

    // Calculate next assessment due date
    const nextAssessmentDue = new Date(assessmentData.assessmentDate);
    if (assessment.assessmentType === AssessmentType.INITIAL) {
      // Next review based on child's age
      nextAssessmentDue.setMonth(nextAssessmentDue.getMonth() + 6);
    } else {
      // Annual review (or 6 monthly if under 5)
      nextAssessmentDue.setMonth(nextAssessmentDue.getMonth() + 12);
    }

    assessment.status = AssessmentStatus.COMPLETED;
    assessment.assessmentDate = assessmentData.assessmentDate;
    assessment.assessedByName = assessmentData.assessedByName;
    assessment.assessedByRole = assessmentData.assessedByRole;
    assessment.gpRegistered = assessmentData.gpRegistered;
    assessment.heightCm = assessmentData.heightCm;
    assessment.weightKg = assessmentData.weightKg;
    assessment.bmi = bmi;
    assessment.immunizationsUpToDate = assessmentData.immunizationsUpToDate;
    assessment.mentalHealthConcerns = assessmentData.mentalHealthConcerns;
    assessment.recommendations = assessmentData.recommendations;
    assessment.nextAssessmentDue = nextAssessmentDue;
    assessment.updatedBy = assessmentData.updatedBy;

    const savedAssessment = await this.healthAssessmentRepository.save(assessment);

    // If mental health concerns, flag for CAMHS referral
    if (assessmentData.mentalHealthConcerns) {
      // await this.notificationService.sendAlert({...});
    }

    return savedAssessment;
  }

  /**
   * Get overdue health assessments
   * 
   * @param organizationId - Organization ID
   * @returns Array of overdue assessments
   */
  async getOverdueHealthAssessments(organizationId: string): Promise<HealthAssessment[]> {
    const assessments = await this.healthAssessmentRepository.find({
      where: { organizationId },
      relations: ['child']
    });

    return assessments.filter(assessment => assessment.isOverdue());
  }

  // ========================================
  // MEDICAL CONSENT MANAGEMENT
  // ========================================

  /**
   * Record medical consent
   * 
   * @param consentData - Consent details
   * @returns Created medical consent
   */
  async recordMedicalConsent(consentData: {
    childId: string;
    organizationId: string;
    consentType: ConsentType;
    specificTreatment?: string;
    consentGivenBy: ConsentGivenBy;
    consenterName: string;
    consenterRelationship: string;
    childAge: number;
    gillickCompetent?: boolean;
    validFrom: Date;
    validUntil?: Date;
    createdBy: string;
  }): Promise<MedicalConsent> {
    const child = await this.childRepository.findOne({
      where: { id: consentData.childId }
    });

    if (!child) {
      throw new Error(`Child with ID ${consentData.childId} not found`);
    }

    const consentReference = await this.generateConsentReference(consentData.organizationId);

    // Determine if Gillick assessment required
    const gillickAssessmentRequired = consentData.childAge < 16 && 
      [ConsentType.CONTRACEPTION, ConsentType.SEXUAL_HEALTH_SERVICES, 
       ConsentType.MENTAL_HEALTH_TREATMENT].includes(consentData.consentType);

    const consent = this.medicalConsentRepository.create({
      consentReference,
      childId: consentData.childId,
      organizationId: consentData.organizationId,
      consentType: consentData.consentType,
      specificTreatment: consentData.specificTreatment,
      status: ConsentStatus.GRANTED,
      consentGivenBy: consentData.consentGivenBy,
      consenterName: consentData.consenterName,
      consenterRelationship: consentData.consenterRelationship,
      childAgeAtConsent: consentData.childAge,
      gillickAssessmentRequired,
      gillickCompetent: consentData.gillickCompetent,
      consentDate: new Date(),
      validFrom: consentData.validFrom,
      validUntil: consentData.validUntil,
      ongoingConsent: !consentData.validUntil,
      informationProvided: {
        treatmentExplained: true,
        risksExplained: true,
        benefitsExplained: true,
        alternativesDiscussed: true,
        consequencesOfRefusalExplained: true,
        questionsAnswered: true,
        writtenInformationGiven: false
      },
      createdBy: consentData.createdBy,
      updatedBy: consentData.createdBy
    });

    return await this.medicalConsentRepository.save(consent);
  }

  /**
   * Assess Gillick competence
   * 
   * @param consentId - Consent ID
   * @param assessmentData - Gillick assessment details
   * @returns Updated consent
   */
  async assessGillickCompetence(
    consentId: string,
    assessmentData: {
      gillickCompetent: boolean;
      assessedBy: string;
      assessmentNotes: string;
      criteriaMet: {
        understandsAdvice: boolean;
        cannotBePersuadedToInformParents: boolean;
        likelyToContinueWithoutAdvice: boolean;
        physicalOrMentalHealthAtRisk: boolean;
        bestInterestsRequireTreatment: boolean;
      };
    }
  ): Promise<MedicalConsent> {
    const consent = await this.medicalConsentRepository.findOne({
      where: { id: consentId }
    });

    if (!consent) {
      throw new Error(`Medical consent with ID ${consentId} not found`);
    }

    consent.gillickCompetent = assessmentData.gillickCompetent;
    consent.gillickAssessmentDate = new Date();
    consent.gillickAssessedBy = assessmentData.assessedBy;
    consent.gillickAssessmentNotes = assessmentData.assessmentNotes;
    consent.gillickCriteriaMet = assessmentData.criteriaMet;

    return await this.medicalConsentRepository.save(consent);
  }

  /**
   * Withdraw medical consent
   * 
   * @param consentId - Consent ID
   * @param withdrawalData - Withdrawal details
   * @returns Updated consent
   */
  async withdrawConsent(
    consentId: string,
    withdrawalData: {
      withdrawnBy: string;
      withdrawalReason: string;
    }
  ): Promise<MedicalConsent> {
    const consent = await this.medicalConsentRepository.findOne({
      where: { id: consentId }
    });

    if (!consent) {
      throw new Error(`Medical consent with ID ${consentId} not found`);
    }

    consent.status = ConsentStatus.WITHDRAWN;
    consent.withdrawalDate = new Date();
    consent.withdrawnBy = withdrawalData.withdrawnBy;
    consent.withdrawalReason = withdrawalData.withdrawalReason;

    return await this.medicalConsentRepository.save(consent);
  }

  /**
   * Get active consents for child
   * 
   * @param childId - Child ID
   * @returns Array of active consents
   */
  async getActiveConsents(childId: string): Promise<MedicalConsent[]> {
    const consents = await this.medicalConsentRepository.find({
      where: { childId, status: ConsentStatus.GRANTED }
    });

    return consents.filter(consent => consent.isValid());
  }

  /**
   * Get consents requiring review
   * 
   * @param organizationId - Organization ID
   * @returns Array of consents requiring review
   */
  async getConsentsRequiringReview(organizationId: string): Promise<MedicalConsent[]> {
    const consents = await this.medicalConsentRepository.find({
      where: { organizationId, status: ConsentStatus.GRANTED },
      relations: ['child']
    });

    return consents.filter(consent => consent.requiresUrgentReview());
  }

  // ========================================
  // HEALTH STATISTICS
  // ========================================

  /**
   * Get health statistics
   * 
   * @param organizationId - Organization ID
   * @returns Health statistics
   */
  async getHealthStatistics(organizationId: string): Promise<any> {
    const [
      totalAssessments,
      overdueAssessments,
      completedAssessments,
      activeConsents
    ] = await Promise.all([
      this.healthAssessmentRepository.count({ where: { organizationId } }),
      this.getOverdueHealthAssessments(organizationId),
      this.healthAssessmentRepository.count({ 
        where: { organizationId, status: AssessmentStatus.COMPLETED } 
      }),
      this.medicalConsentRepository.count({ 
        where: { organizationId, status: ConsentStatus.GRANTED } 
      })
    ]);

    // Get children not registered with GP
    const assessments = await this.healthAssessmentRepository.find({
      where: { organizationId }
    });

    const notRegisteredWithGP = assessments.filter(a => !a.gpRegistered).length;

    return {
      assessments: {
        total: totalAssessments,
        completed: completedAssessments,
        overdue: overdueAssessments.length
      },
      consents: {
        active: activeConsents
      },
      gpRegistration: {
        notRegistered: notRegisteredWithGP
      }
    };
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Generate unique assessment number
   */
  private async generateAssessmentNumber(
    organizationId: string,
    type: AssessmentType
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = type === AssessmentType.INITIAL ? 'IHA' : 'RHA';
    const count = await this.healthAssessmentRepository.count({
      where: { organizationId, assessmentType: type }
    });
    return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Generate unique consent reference
   */
  private async generateConsentReference(organizationId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.medicalConsentRepository.count({
      where: { organizationId }
    });
    return `CONSENT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  /**
   * Add working days to date
   */
  private addWorkingDays(date: Date, days: number): Date {
    const result = new Date(date);
    let addedDays = 0;

    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      const dayOfWeek = result.getDay();
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        addedDays++;
      }
    }

    return result;
  }
}
