import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Enterprise Consent Management Entity
 * @module ConsentManagement
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive consent management entity for healthcare data
 * processing with full GDPR Article 6 and Article 9 compliance.
 * 
 * @compliance
 * - GDPR Article 6 - Lawful basis for processing
 * - GDPR Article 9 - Special category data
 * - Data Protection Act 2018
 * - Mental Capacity Act 2005
 * - Care Act 2014
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum ConsentType {
  CARE_TREATMENT = 'care_treatment',
  DATA_PROCESSING = 'data_processing',
  PHOTOGRAPHY_VIDEO = 'photography_video',
  MEDICAL_RESEARCH = 'medical_research',
  MARKETING_COMMUNICATIONS = 'marketing_communications',
  DATA_SHARING = 'data_sharing',
  EMERGENCY_CONTACT = 'emergency_contact',
  FAMILY_INVOLVEMENT = 'family_involvement',
  SOCIAL_MEDIA = 'social_media',
  CCTV_MONITORING = 'cctv_monitoring',
  MEDICATION_ADMINISTRATION = 'medication_administration',
  PERSONAL_CARE = 'personal_care',
  MENTAL_HEALTH_TREATMENT = 'mental_health_treatment',
  END_OF_LIFE_CARE = 'end_of_life_care',
  ADVANCE_DIRECTIVES = 'advance_directives',
  DNACPR = 'dnacpr',
  ORGAN_DONATION = 'organ_donation',
  POST_MORTEM = 'post_mortem',
  FINANCIAL_MANAGEMENT = 'financial_management',
  ADVOCACY_SERVICES = 'advocacy_services'
}

export enum ConsentStatus {
  GIVEN = 'given',
  REFUSED = 'refused',
  WITHDRAWN = 'withdrawn',
  PENDING = 'pending',
  EXPIRED = 'expired',
  UNDER_REVIEW = 'under_review',
  CONDITIONAL = 'conditional',
  CAPACITY_ASSESSMENT_REQUIRED = 'capacity_assessment_required'
}

export enum LawfulBasis {
  CONSENT = 'consent',
  CONTRACT = 'contract',
  LEGAL_OBLIGATION = 'legal_obligation',
  VITAL_INTERESTS = 'vital_interests',
  PUBLIC_TASK = 'public_task',
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export enum SpecialCategoryBasis {
  EXPLICIT_CONSENT = 'explicit_consent',
  EMPLOYMENT_LAW = 'employment_law',
  VITAL_INTERESTS = 'vital_interests',
  LEGITIMATE_ACTIVITIES = 'legitimate_activities',
  PUBLIC_DISCLOSURE = 'public_disclosure',
  LEGAL_CLAIMS = 'legal_claims',
  SUBSTANTIAL_PUBLIC_INTEREST = 'substantial_public_interest',
  HEALTHCARE = 'healthcare',
  PUBLIC_HEALTH = 'public_health',
  ARCHIVING_RESEARCH = 'archiving_research'
}

export enum ConsentGivenBy {
  RESIDENT = 'resident',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  COURT_APPOINTED_DEPUTY = 'court_appointed_deputy',
  NEXT_OF_KIN = 'next_of_kin',
  ADVOCATE = 'advocate',
  BEST_INTERESTS_DECISION = 'best_interests_decision',
  EMERGENCY_CONSENT = 'emergency_consent'
}

export interface ConsentConditions {
  conditions: string[];
  limitations: string[];
  exceptions: string[];
  reviewTriggers: string[];
  escalationProcedures: string[];
}

export interface CapacityAssessment {
  assessmentDate: Date;
  assessedBy: string;
  assessorRole: string;
  assessorQualifications: string[];
  hasCapacity: boolean;
  specificDecisionCapacity: boolean;
  fluctuatingCapacity: boolean;
  assessmentMethod: string;
  evidenceOfCapacity: string[];
  supportProvided: string[];
  reasoningAbility: 'full' | 'limited' | 'impaired' | 'absent';
  communicationMethod: string;
  nextReviewDate: Date;
  assessmentNotes: string;
}

export interface ConsentEvidence {
  evidenceType: 'written_signature' | 'verbal_recorded' | 'digital_signature' | 'witnessed_verbal' | 'video_recorded' | 'behavioral_indication';
  evidenceLocation: string;
  witnessDetails?: {
    witnessName: string;
    witnessRole: string;
    witnessSignature?: string;
    witnessDate: Date;
  }[];
  recordingDetails?: {
    recordingId: string;
    recordingDuration: number;
    recordingQuality: 'excellent' | 'good' | 'adequate' | 'poor';
    transcriptionAvailable: boolean;
  };
  digitalSignatureDetails?: {
    certificateId: string;
    timestampService: string;
    verificationHash: string;
    biometricData?: string;
  };
}

export interface ConsentAuditTrail {
  consentGiven: {
    date: Date;
    givenBy: string;
    givenByRole: string;
    method: string;
    evidence: ConsentEvidence;
  };
  consentChanges: {
    changeDate: Date;
    changedBy: string;
    changedByRole: string;
    changeType: 'modification' | 'withdrawal' | 'renewal' | 'conditions_updated';
    previousValue: any;
    newValue: any;
    reason: string;
    evidence: ConsentEvidence;
  }[];
  consentReviews: {
    reviewDate: Date;
    reviewedBy: string;
    reviewerRole: string;
    reviewOutcome: 'confirmed' | 'modified' | 'withdrawn' | 'renewal_required';
    reviewNotes: string;
    nextReviewDate: Date;
  }[];
}

export interface DataProcessingDetails {
  processingPurposes: string[];
  dataCategories: string[];
  dataRecipients: string[];
  dataRetentionPeriod: number; // days
  dataTransfers: {
    transferType: 'internal' | 'external_uk' | 'external_eu' | 'external_non_eu';
    recipient: string;
    safeguards: string[];
    adequacyDecision?: boolean;
  }[];
  automatedDecisionMaking: {
    isUsed: boolean;
    logic?: string;
    significance?: string;
    consequences?: string;
    humanReviewProcess?: string;
  };
}

@Entity('consent_management')
@Index(['residentId', 'consentType'])
@Index(['status', 'expiryDate'])
@Index(['tenantId', 'organizationId'])
@Index(['lawfulBasis', 'specialCategoryBasis'])
export class ConsentManagement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  consentReference: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident, { eager: true })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({ enum: ConsentType })
  consentType: ConsentType;

  @Column({ enum: ConsentStatus })
  status: ConsentStatus;

  @Column({ enum: LawfulBasis })
  lawfulBasis: LawfulBasis;

  @Column({ enum: SpecialCategoryBasis, nullable: true })
  specialCategoryBasis?: SpecialCategoryBasis;

  @Column({ enum: ConsentGivenBy })
  consentGivenBy: ConsentGivenBy;

  @Column()
  consentGivenByName: string;

  @Column({ nullable: true })
  consentGivenByRelationship?: string;

  @Column('text', { encrypted: true })
  consentDescription: string;

  @Column('text', { encrypted: true, nullable: true })
  consentConditionsText?: string;

  @Column('jsonb', { nullable: true })
  consentConditions?: ConsentConditions;

  @Column('timestamp')
  consentGivenDate: Date;

  @Column('timestamp', { nullable: true })
  consentWithdrawnDate?: Date;

  @Column({ nullable: true })
  consentWithdrawnBy?: string;

  @Column('text', { encrypted: true, nullable: true })
  withdrawalReason?: string;

  @Column('timestamp', { nullable: true })
  expiryDate?: Date;

  @Column('timestamp', { nullable: true })
  nextReviewDate?: Date;

  @Column('boolean', { default: false })
  requiresRenewal: boolean;

  @Column('boolean', { default: false })
  isInformed: boolean;

  @Column('boolean', { default: false })
  isSpecific: boolean;

  @Column('boolean', { default: false })
  isUnambiguous: boolean;

  @Column('boolean', { default: false })
  isFreelyGiven: boolean;

  @Column('jsonb')
  capacityAssessment: CapacityAssessment;

  @Column('jsonb')
  consentEvidence: ConsentEvidence;

  @Column('jsonb')
  auditTrail: ConsentAuditTrail;

  @Column('jsonb')
  dataProcessingDetails: DataProcessingDetails;

  @Column('simple-array', { nullable: true })
  relatedConsents?: string[];

  @Column('simple-array', { nullable: true })
  dependentConsents?: string[];

  @Column({ nullable: true })
  parentConsentId?: string;

  @Column('text', { encrypted: true, nullable: true })
  additionalNotes?: string;

  @Column('uuid')
  recordedBy: string;

  @Column()
  recordedByName: string;

  @Column()
  recordedByRole: string;

  @Column('uuid')
  tenantId: string;

  @Column('uuid')
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Check if consent is valid and current
   */
  isValidConsent(): boolean {
    if (this.status !== ConsentStatus.GIVEN) {
      return false;
    }

    if (this.expiryDate && new Date() > this.expiryDate) {
      return false;
    }

    if (this.consentWithdrawnDate) {
      return false;
    }

    return this.isInformed && this.isSpecific && this.isUnambiguous && this.isFreelyGiven;
  }

  /**
   * Check if consent needs renewal
   */
  needsRenewal(): boolean {
    if (this.requiresRenewal && this.nextReviewDate && new Date() > this.nextReviewDate) {
      return true;
    }

    if (this.expiryDate) {
      const renewalDate = new Date(this.expiryDate);
      renewalDate.setDate(renewalDate.getDate() - 30); // 30 days before expiry
      return new Date() > renewalDate;
    }

    return false;
  }

  /**
   * Check if consent is GDPR compliant
   */
  isGDPRCompliant(): {
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: any[] = [];

    // Check GDPR validity criteria
    if (!this.isInformed) {
      issues.push('Consent is not sufficiently informed');
      recommendations.push('Provide clear information about data processing');
    }

    if (!this.isSpecific) {
      issues.push('Consent is not specific enough');
      recommendations.push('Specify exact purposes for data processing');
    }

    if (!this.isUnambiguous) {
      issues.push('Consent is ambiguous');
      recommendations.push('Use clear, plain language for consent');
    }

    if (!this.isFreelyGiven) {
      issues.push('Consent may not be freely given');
      recommendations.push('Ensure no coercion or bundling of consent');
    }

    // Check capacity assessment for vulnerable adults
    if (!this.capacityAssessment || !this.capacityAssessment.hasCapacity) {
      if (this.consentGivenBy === ConsentGivenBy.RESIDENT) {
        issues.push('Capacity assessment required for vulnerable adult');
        recommendations.push('Conduct formal capacity assessment');
      }
    }

    // Check evidence quality
    if (!this.consentEvidence || !this.consentEvidence.evidenceType) {
      issues.push('Insufficient evidence of consent');
      recommendations.push('Collect proper evidence of consent');
    }

    return {
      compliant: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Generate consent withdrawal form
   */
  generateWithdrawalForm(): {
    formId: string;
    formContent: string;
    requiredFields: string[];
    instructions: string[];
  } {
    return {
      formId: `withdrawal-${this.id}`,
      formContent: `
        CONSENT WITHDRAWAL FORM
        
        Consent Reference: ${this.consentReference}
        Consent Type: ${this.consentType}
        Original Consent Date: ${this.consentGivenDate.toLocaleDateString()}
        
        I wish to withdraw my consent for: ${this.consentDescription}
        
        Withdrawal Date: ___________
        Signature: ___________
        Print Name: ___________
        Witness: ___________
        
        Note: Withdrawal will not affect processing that has already taken place based on your previous consent.
      `,
      requiredFields: ['withdrawalDate', 'signature', 'printName', 'reason'],
      instructions: [
        'Complete all required fields',
        'Sign in the presence of a witness',
        'Return to the Data Protection Officer',
        'Keep a copy for your records'
      ]
    };
  }

  /**
   * Calculate consent strength score
   */
  calculateConsentStrength(): {
    score: number;
    factors: {
      evidenceQuality: number;
      capacityClarity: number;
      informationProvided: number;
      voluntariness: number;
      specificity: number;
    };
    overallGrade: 'excellent' | 'good' | 'adequate' | 'weak' | 'invalid';
  } {
    const factors = {
      evidenceQuality: this.assessEvidenceQuality(),
      capacityClarity: this.assessCapacityClarity(),
      informationProvided: this.assessInformationQuality(),
      voluntariness: this.assessVoluntariness(),
      specificity: this.assessSpecificity()
    };

    const score = (factors.evidenceQuality + factors.capacityClarity + 
                   factors.informationProvided + factors.voluntariness + 
                   factors.specificity) / 5;

    let overallGrade: 'excellent' | 'good' | 'adequate' | 'weak' | 'invalid';
    if (score >= 90) overallGrade = 'excellent';
    else if (score >= 80) overallGrade = 'good';
    else if (score >= 70) overallGrade = 'adequate';
    else if (score >= 60) overallGrade = 'weak';
    else overallGrade = 'invalid';

    return { score, factors, overallGrade };
  }

  /**
   * Generate consent renewal reminder
   */
  generateRenewalReminder(): {
    daysUntilExpiry: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    renewalInstructions: string[];
    requiredDocuments: string[];
  } {
    const daysUntilExpiry = this.expiryDate ? 
      Math.ceil((this.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 
      Infinity;

    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    if (daysUntilExpiry <= 7) urgencyLevel = 'critical';
    else if (daysUntilExpiry <= 30) urgencyLevel = 'high';
    else if (daysUntilExpiry <= 60) urgencyLevel = 'medium';
    else urgencyLevel = 'low';

    return {
      daysUntilExpiry,
      urgencyLevel,
      renewalInstructions: [
        'Schedule capacity assessment if required',
        'Prepare updated information sheets',
        'Arrange meeting with resident/representative',
        'Complete new consent form',
        'Update care records'
      ],
      requiredDocuments: [
        'Current consent form',
        'Information sheet',
        'Capacity assessment (if applicable)',
        'Best interests decision record (if applicable)'
      ]
    };
  }

  // Private helper methods for consent strength assessment
  private assessEvidenceQuality(): number {
    if (!this.consentEvidence) return 0;

    let score = 0;
    
    switch (this.consentEvidence.evidenceType) {
      case 'digital_signature':
        score = 100;
        break;
      case 'written_signature':
        score = 90;
        break;
      case 'video_recorded':
        score = 85;
        break;
      case 'witnessed_verbal':
        score = 75;
        break;
      case 'verbal_recorded':
        score = 70;
        break;
      case 'behavioral_indication':
        score = 50;
        break;
      default:
        score = 30;
    }

    // Bonus for witnesses
    if (this.consentEvidence.witnessDetails?.length > 0) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private assessCapacityClarity(): number {
    if (!this.capacityAssessment) return 30;

    let score = 60; // Base score for having assessment

    if (this.capacityAssessment.hasCapacity) score += 20;
    if (this.capacityAssessment.specificDecisionCapacity) score += 10;
    if (this.capacityAssessment.assessorQualifications?.length > 0) score += 10;

    return Math.min(100, score);
  }

  private assessInformationQuality(): number {
    let score = 50; // Base score

    if (this.isInformed) score += 30;
    if (this.dataProcessingDetails?.processingPurposes?.length > 0) score += 20;

    return Math.min(100, score);
  }

  private assessVoluntariness(): number {
    let score = 50; // Base score

    if (this.isFreelyGiven) score += 30;
    if (this.consentConditions?.conditions?.length === 0) score += 20; // No conditions = more voluntary

    return Math.min(100, score);
  }

  private assessSpecificity(): number {
    let score = 50; // Base score

    if (this.isSpecific) score += 30;
    if (this.dataProcessingDetails?.processingPurposes?.length === 1) score += 20; // Single purpose = more specific

    return Math.min(100, score);
  }
}