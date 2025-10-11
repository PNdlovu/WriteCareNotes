/**
 * ============================================================================
 * Medical Consent Entity
 * ============================================================================
 * 
 * @fileoverview Entity representing medical consent records for looked after
 *               children, including Gillick competence assessments.
 * 
 * @module domains/health/entities/MedicalConsent
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages medical consent for treatments, procedures, and healthcare decisions.
 * Includes Gillick competence assessment for children under 16, parental
 * responsibility tracking, and consent withdrawal mechanisms. Essential for
 * legal compliance and safeguarding children's health rights.
 * 
 * @compliance
 * - OFSTED Regulation 9 (Health and wellbeing)
 * - Children Act 1989, Section 3(5)
 * - Mental Capacity Act 2005
 * - Gillick v West Norfolk and Wisbech AHA [1986]
 * - GDPR 2018 (Special category data - health)
 * - Human Rights Act 1998, Article 8
 * 
 * @features
 * - Gillick competence assessment
 * - Parental responsibility tracking
 * - Treatment-specific consent
 * - Emergency consent protocols
 * - Consent withdrawal tracking
 * - Mental capacity assessment
 * - Fraser guidelines compliance
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Child } from '../../children/entities/Child';
import { Organization } from '../../../entities/Organization';

export enum ConsentType {
  GENERAL_MEDICAL_TREATMENT = 'GENERAL_MEDICAL_TREATMENT',
  EMERGENCY_TREATMENT = 'EMERGENCY_TREATMENT',
  ROUTINE_MEDICAL_CARE = 'ROUTINE_MEDICAL_CARE',
  DENTAL_TREATMENT = 'DENTAL_TREATMENT',
  MENTAL_HEALTH_TREATMENT = 'MENTAL_HEALTH_TREATMENT',
  SURGICAL_PROCEDURE = 'SURGICAL_PROCEDURE',
  ANESTHETIC = 'ANESTHETIC',
  MEDICATION = 'MEDICATION',
  IMMUNIZATION = 'IMMUNIZATION',
  CONTRACEPTION = 'CONTRACEPTION',
  SEXUAL_HEALTH_SERVICES = 'SEXUAL_HEALTH_SERVICES',
  RESEARCH_PARTICIPATION = 'RESEARCH_PARTICIPATION',
  INFORMATION_SHARING = 'INFORMATION_SHARING'
}

export enum ConsentStatus {
  GRANTED = 'GRANTED',
  REFUSED = 'REFUSED',
  WITHDRAWN = 'WITHDRAWN',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED'
}

export enum ConsentGivenBy {
  CHILD = 'CHILD',
  PARENT = 'PARENT',
  LOCAL_AUTHORITY = 'LOCAL_AUTHORITY',
  COURT_ORDER = 'COURT_ORDER',
  EMERGENCY_OVERRIDE = 'EMERGENCY_OVERRIDE'
}

@Entity('medical_consents')
@Index(['childId'])
@Index(['consentType'])
@Index(['status'])
@Index(['validFrom'])
@Index(['validUntil'])
export class MedicalConsent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Child Reference
  @Column({ name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  // Organization
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Consent Details
  @Column({ name: 'consent_reference', length: 100, unique: true })
  consentReference: string;

  @Column({ name: 'consent_type', type: 'enum', enum: ConsentType })
  consentType: ConsentType;

  @Column({ name: 'status', type: 'enum', enum: ConsentStatus, default: ConsentStatus.PENDING })
  status: ConsentStatus;

  @Column({ name: 'specific_treatment', type: 'text', nullable: true })
  specificTreatment?: string;

  @Column({ name: 'treatment_description', type: 'text', nullable: true })
  treatmentDescription?: string;

  // Consent Provider
  @Column({ name: 'consent_given_by', type: 'enum', enum: ConsentGivenBy })
  consentGivenBy: ConsentGivenBy;

  @Column({ name: 'consenter_name', length: 255 })
  consenterName: string;

  @Column({ name: 'consenter_relationship', length: 100 })
  consenterRelationship: string;

  @Column({ name: 'consenter_contact', length: 255, nullable: true })
  consenterContact?: string;

  // Parental Responsibility
  @Column({ name: 'parental_responsibility_confirmed', type: 'boolean', default: false })
  parentalResponsibilityConfirmed: boolean;

  @Column({ name: 'parental_responsibility_evidence', type: 'text', nullable: true })
  parentalResponsibilityEvidence?: string;

  @Column({ name: 'court_order_reference', length: 100, nullable: true })
  courtOrderReference?: string;

  // Gillick Competence (for children under 16)
  @Column({ name: 'child_age_at_consent', type: 'integer' })
  childAgeAtConsent: number;

  @Column({ name: 'gillick_assessment_required', type: 'boolean', default: false })
  gillickAssessmentRequired: boolean;

  @Column({ name: 'gillick_competent', type: 'boolean', nullable: true })
  gillickCompetent?: boolean;

  @Column({ name: 'gillick_assessment_date', type: 'timestamp', nullable: true })
  gillickAssessmentDate?: Date;

  @Column({ name: 'gillick_assessed_by', length: 255, nullable: true })
  gillickAssessedBy?: string;

  @Column({ name: 'gillick_assessment_notes', type: 'text', nullable: true })
  gillickAssessmentNotes?: string;

  @Column({ name: 'gillick_criteria_met', type: 'jsonb', nullable: true })
  gillickCriteriaMet?: {
    understandsAdvice: boolean;
    cannotBePersuadedToInformParents: boolean;
    likelyToContinueWithoutAdvice: boolean;
    physicalOrMentalHealthAtRisk: boolean;
    bestInterestsRequireTreatment: boolean;
  };

  // Fraser Guidelines (for contraception/sexual health)
  @Column({ name: 'fraser_guidelines_applied', type: 'boolean', default: false })
  fraserGuidelinesApplied: boolean;

  @Column({ name: 'fraser_criteria_met', type: 'jsonb', nullable: true })
  fraserCriteriaMet?: {
    understandsAdviceGiven: boolean;
    cannotBePersuadedToTellParents: boolean;
    likelyToHaveSexWithoutContraception: boolean;
    healthWouldSuffer: boolean;
    bestInterestsToProvideAdvice: boolean;
  };

  // Mental Capacity (for over 16s or complex decisions)
  @Column({ name: 'mental_capacity_assessed', type: 'boolean', default: false })
  mentalCapacityAssessed: boolean;

  @Column({ name: 'has_mental_capacity', type: 'boolean', nullable: true })
  hasMentalCapacity?: boolean;

  @Column({ name: 'mental_capacity_assessment_date', type: 'timestamp', nullable: true })
  mentalCapacityAssessmentDate?: Date;

  @Column({ name: 'mental_capacity_assessed_by', length: 255, nullable: true })
  mentalCapacityAssessedBy?: string;

  @Column({ name: 'mental_capacity_notes', type: 'text', nullable: true })
  mentalCapacityNotes?: string;

  // Consent Validity
  @Column({ name: 'consent_date', type: 'timestamp' })
  consentDate: Date;

  @Column({ name: 'valid_from', type: 'timestamp' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamp', nullable: true })
  validUntil?: Date;

  @Column({ name: 'ongoing_consent', type: 'boolean', default: false })
  ongoingConsent: boolean;

  // Information Provided
  @Column({ name: 'information_provided', type: 'jsonb' })
  informationProvided: {
    treatmentExplained: boolean;
    risksExplained: boolean;
    benefitsExplained: boolean;
    alternativesDiscussed: boolean;
    consequencesOfRefusalExplained: boolean;
    questionsAnswered: boolean;
    writtenInformationGiven: boolean;
  };

  @Column({ name: 'information_sheet_url', length: 500, nullable: true })
  informationSheetUrl?: string;

  @Column({ name: 'interpreter_used', type: 'boolean', default: false })
  interpreterUsed: boolean;

  @Column({ name: 'interpreter_language', length: 100, nullable: true })
  interpreterLanguage?: string;

  // Witnessed Consent
  @Column({ name: 'witnessed', type: 'boolean', default: false })
  witnessed: boolean;

  @Column({ name: 'witness_name', length: 255, nullable: true })
  witnessName?: string;

  @Column({ name: 'witness_role', length: 100, nullable: true })
  witnessRole?: string;

  @Column({ name: 'witness_signature_date', type: 'timestamp', nullable: true })
  witnessSignatureDate?: Date;

  // Refusal Details
  @Column({ name: 'refusal_reason', type: 'text', nullable: true })
  refusalReason?: string;

  @Column({ name: 'refusal_date', type: 'timestamp', nullable: true })
  refusalDate?: Date;

  @Column({ name: 'alternative_agreed', type: 'text', nullable: true })
  alternativeAgreed?: string;

  // Withdrawal
  @Column({ name: 'withdrawal_date', type: 'timestamp', nullable: true })
  withdrawalDate?: Date;

  @Column({ name: 'withdrawal_reason', type: 'text', nullable: true })
  withdrawalReason?: string;

  @Column({ name: 'withdrawn_by', length: 255, nullable: true })
  withdrawnBy?: string;

  // Emergency Override
  @Column({ name: 'emergency_override', type: 'boolean', default: false })
  emergencyOverride: boolean;

  @Column({ name: 'emergency_justification', type: 'text', nullable: true })
  emergencyJustification?: string;

  @Column({ name: 'emergency_authorized_by', length: 255, nullable: true })
  emergencyAuthorizedBy?: string;

  @Column({ name: 'emergency_authorization_date', type: 'timestamp', nullable: true })
  emergencyAuthorizationDate?: Date;

  // Treatment Outcome
  @Column({ name: 'treatment_proceeded', type: 'boolean', nullable: true })
  treatmentProceeded?: boolean;

  @Column({ name: 'treatment_date', type: 'timestamp', nullable: true })
  treatmentDate?: Date;

  @Column({ name: 'treatment_provider', length: 255, nullable: true })
  treatmentProvider?: string;

  @Column({ name: 'treatment_outcome', type: 'text', nullable: true })
  treatmentOutcome?: string;

  // Review and Monitoring
  @Column({ name: 'review_required', type: 'boolean', default: false })
  reviewRequired: boolean;

  @Column({ name: 'review_date', type: 'timestamp', nullable: true })
  reviewDate?: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  // Documents
  @Column({ name: 'documents', type: 'jsonb', default: '[]' })
  documents: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  // Audit Trail
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 255 })
  createdBy: string;

  @Column({ name: 'updated_by', length: 255 })
  updatedBy: string;

  // ========================================
  // METHODS
  // ========================================

  /**
   * Check if consent is currently valid
   */
  isValid(): boolean {
    if (this.status !== ConsentStatus.GRANTED) return false;
    
    const now = new Date();
    if (this.validFrom > now) return false;
    if (this.validUntil && this.validUntil < now) return false;
    
    return true;
  }

  /**
   * Check if consent is expired
   */
  isExpired(): boolean {
    if (!this.validUntil) return false;
    return new Date() > this.validUntil;
  }

  /**
   * Check if Gillick competence assessment is required
   */
  requiresGillickAssessment(): boolean {
    return this.childAgeAtConsent < 16 && 
           [ConsentType.CONTRACEPTION, ConsentType.SEXUAL_HEALTH_SERVICES, 
            ConsentType.MENTAL_HEALTH_TREATMENT].includes(this.consentType);
  }

  /**
   * Check if all Gillick criteria are met
   */
  hasAllGillickCriteriaMet(): boolean {
    if (!this.gillickCriteriaMet) return false;
    
    return Object.values(this.gillickCriteriaMet).every(criteria => criteria === true);
  }

  /**
   * Check if all Fraser criteria are met
   */
  hasAllFraserCriteriaMet(): boolean {
    if (!this.fraserCriteriaMet) return false;
    
    return Object.values(this.fraserCriteriaMet).every(criteria => criteria === true);
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(): number | null {
    if (!this.validUntil) return null;
    
    const now = new Date();
    const expiry = new Date(this.validUntil);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if consent requires urgent review
   */
  requiresUrgentReview(): boolean {
    const daysUntilExpiry = this.getDaysUntilExpiry();
    returndaysUntilExpiry !== null && daysUntilExpiry <= 7;
  }
}
