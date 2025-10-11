/**
 * ============================================================================
 * Age Assessment Entity
 * ============================================================================
 * 
 * @fileoverview Age assessment entity for determining the age of UASC.
 * 
 * @module domains/uasc/entities/AgeAssessment
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents an age assessment conducted for an unaccompanied asylum-seeking
 * child where there is doubt about their claimed age. Follows the Merton
 * Compliant approach established through case law.
 * 
 * @compliance
 * - R (B) v London Borough of Merton [2003] (Merton Compliant)
 * - Age Assessment Joint Working Guidance 2015
 * - ADCS Age Assessment Guidance
 * - Children Act 1989
 * - OFSTED Regulation 17 (Records)
 * 
 * @features
 * - Merton compliant assessment process
 * - Two-assessor requirement
 * - Multiple assessment methods
 * - Disputed age handling
 * - Appeal and challenge tracking
 * - Interim age recording
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
  UpdateDateColumn
} from 'typeorm';
import { UASCProfile } from './UASCProfile';

// ========================================
// ENUMERATIONS
// ========================================

export enum AssessmentStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPEALED = 'APPEALED',
  APPEAL_UPHELD = 'APPEAL_UPHELD',
  APPEAL_REJECTED = 'APPEAL_REJECTED',
  CANCELLED = 'CANCELLED'
}

export enum AssessmentOutcome {
  AGE_ACCEPTED = 'AGE_ACCEPTED',
  AGE_DISPUTED = 'AGE_DISPUTED',
  ADULT = 'ADULT',
  CHILD = 'CHILD',
  BENEFIT_OF_DOUBT = 'BENEFIT_OF_DOUBT',
  INCONCLUSIVE = 'INCONCLUSIVE'
}

export enum AssessmentMethod {
  MERTON_COMPLIANT = 'MERTON_COMPLIANT',
  HOLISTIC_ASSESSMENT = 'HOLISTIC_ASSESSMENT',
  PHYSICAL_OBSERVATION = 'PHYSICAL_OBSERVATION',
  DOCUMENTARY_EVIDENCE = 'DOCUMENTARY_EVIDENCE',
  EDUCATIONAL_ASSESSMENT = 'EDUCATIONAL_ASSESSMENT',
  MEDICAL_EVIDENCE = 'MEDICAL_EVIDENCE',
  INTERVIEW = 'INTERVIEW'
}

// ========================================
// AGE ASSESSMENT ENTITY
// ========================================

@Entity('age_assessments')
export class AgeAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'var char', unique: true })
  assessmentNumber: string; // Format: AA-YYYY-NNNN

  @ManyToOne(() => UASCProfile)
  @JoinColumn({ name: 'uascProfileId' })
  uascProfile: UASCProfile;

  @Column()
  uascProfileId: string;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.SCHEDULED
  })
  status: AssessmentStatus;

  // ========================================
  // ASSESSMENT DETAILS
  // ========================================

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'date', nullable: true })
  completedDate: Date;

  @Column({ type: 'var char', nullable: true })
  assessmentLocation: string;

  @Column({ type: 'simple-json' })
  assessmentMethods: AssessmentMethod[];

  // ========================================
  // CLAIMED AGE
  // ========================================

  @Column({ type: 'date' })
  claimedDateOfBirth: Date;

  @Column({ type: 'int' })
  claimedAge: number;

  @Column({ type: 'text', nullable: true })
  claimedAgeEvidence: string;

  // ========================================
  // ASSESSMENT TEAM
  // ========================================

  @Column({ type: 'var char' })
  leadAssessorName: string;

  @Column({ type: 'var char' })
  leadAssessorRole: string;

  @Column({ type: 'var char' })
  secondAssessorName: string;

  @Column({ type: 'var char' })
  secondAssessorRole: string;

  @Column({ type: 'var char', nullable: true })
  interpreterPresent: string;

  @Column({ type: 'var char', nullable: true })
  interpreterLanguage: string;

  @Column({ type: 'var char', nullable: true })
  appropriateAdultPresent: string;

  // ========================================
  // PHYSICAL APPEARANCE
  // ========================================

  @Column({ type: 'text', nullable: true })
  physicalAppearanceDescription: string;

  @Column({ type: 'text', nullable: true })
  heightAndBuild: string;

  @Column({ type: 'text', nullable: true })
  facialAppearance: string;

  @Column({ type: 'text', nullable: true })
  demeanourAndBehaviour: string;

  @Column({ type: 'text', nullable: true })
  physicalMaturity: string;

  // ========================================
  // DEVELOPMENTAL ASSESSMENT
  // ========================================

  @Column({ type: 'text', nullable: true })
  cognitiveDevelopment: string;

  @Column({ type: 'text', nullable: true })
  emotionalMaturity: string;

  @Column({ type: 'text', nullable: true })
  socialDevelopment: string;

  @Column({ type: 'text', nullable: true })
  lifeExperiences: string;

  @Column({ type: 'text', nullable: true })
  independenceLevel: string;

  // ========================================
  // EDUCATIONAL BACKGROUND
  // ========================================

  @Column({ type: 'text', nullable: true })
  educationalHistory: string;

  @Column({ type: 'text', nullable: true })
  literacyLevel: string;

  @Column({ type: 'text', nullable: true })
  numeracyLevel: string;

  @Column({ type: 'text', nullable: true })
  knowledgeAndUnderstanding: string;

  // ========================================
  // DOCUMENTARY EVIDENCE
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  documentsReviewed: Array<{
    documentType: string;
    documentDetails: string;
    reliability: string;
    notes: string;
  }>;

  @Column({ type: 'text', nullable: true })
  documentaryEvidenceAnalysis: string;

  // ========================================
  // MEDICAL INFORMATION
  // ========================================

  @Column({ type: 'boolean', default: false })
  medicalEvidenceConsidered: boolean;

  @Column({ type: 'text', nullable: true })
  medicalEvidenceDetails: string;

  @Column({ type: 'text', nullable: true })
  dentalEvidenceDetails: string;

  @Column({ type: 'text', nullable: true })
  boneScanDetails: string;

  @Column({ type: 'text', nullable: true })
  medicalEvidenceReliability: string;

  // ========================================
  // INTERVIEW PROCESS
  // ========================================

  @Column({ type: 'date', nullable: true })
  interviewDate: Date;

  @Column({ type: 'int', nullable: true })
  interviewDurationMinutes: number;

  @Column({ type: 'text', nullable: true })
  interviewLocation: string;

  @Column({ type: 'text', nullable: true })
  youngPersonAccount: string;

  @Column({ type: 'text', nullable: true })
  consistencyOfAccount: string;

  @Column({ type: 'text', nullable: true })
  familyBackground: string;

  @Column({ type: 'text', nullable: true })
  journeyDetails: string;

  // ========================================
  // ASSESSMENT FINDINGS
  // ========================================

  @Column({ type: 'text', nullable: true })
  factorsIndicatingYoungerAge: string;

  @Column({ type: 'text', nullable: true })
  factorsIndicatingOlderAge: string;

  @Column({ type: 'text', nullable: true })
  culturalConsiderations: string;

  @Column({ type: 'text', nullable: true })
  traumaConsiderations: string;

  @Column({ type: 'text', nullable: true })
  credibilityAssessment: string;

  // ========================================
  // DECISION
  // ========================================

  @Column({
    type: 'enum',
    enum: AssessmentOutcome,
    nullable: true
  })
  outcome: AssessmentOutcome;

  @Column({ type: 'date', nullable: true })
  assessedDateOfBirth: Date;

  @Column({ type: 'int', nullable: true })
  assessedAge: number;

  @Column({ type: 'text', nullable: true })
  reasoningForDecision: string;

  @Column({ type: 'text', nullable: true })
  evidenceConsidered: string;

  @Column({ type: 'boolean', default: false })
  benefitOfDoubtGiven: boolean;

  @Column({ type: 'text', nullable: true })
  benefitOfDoubtReason: string;

  // ========================================
  // INTERIM ARRANGEMENTS
  // ========================================

  @Column({ type: 'date', nullable: true })
  interimDateOfBirth: Date;

  @Column({ type: 'text', nullable: true })
  interimArrangements: string;

  // ========================================
  // QUALITY ASSURANCE
  // ========================================

  @Column({ type: 'boolean', default: false })
  mertonCompliant: boolean;

  @Column({ type: 'text', nullable: true })
  mertonComplianceNotes: string;

  @Column({ type: 'boolean', default: false })
  twoAssessorsUsed: boolean;

  @Column({ type: 'boolean', default: false })
  interpreterUsedIfRequired: boolean;

  @Column({ type: 'boolean', default: false })
  appropriateAdultPresent: boolean;

  @Column({ type: 'boolean', default: false })
  culturalBackgroundConsidered: boolean;

  // ========================================
  // NOTIFICATION
  // ========================================

  @Column({ type: 'date', nullable: true })
  decisionNotifiedDate: Date;

  @Column({ type: 'var char', nullable: true })
  decisionNotifiedTo: string;

  @Column({ type: 'var char', nullable: true })
  decisionNotificationMethod: string;

  @Column({ type: 'text', nullable: true })
  decisionExplanationProvided: string;

  // ========================================
  // APPEAL AND CHALLENGE
  // ========================================

  @Column({ type: 'boolean', default: false })
  youngPersonDisagreesWithOutcome: boolean;

  @Column({ type: 'text', nullable: true })
  youngPersonDisagreementReason: string;

  @Column({ type: 'boolean', default: false })
  appealLodged: boolean;

  @Column({ type: 'date', nullable: true })
  appealLodgedDate: Date;

  @Column({ type: 'var char', nullable: true })
  appealReferenceNumber: string;

  @Column({ type: 'text', nullable: true })
  appealGrounds: string;

  @Column({ type: 'date', nullable: true })
  appealHearingDate: Date;

  @Column({ type: 'var char', nullable: true })
  appealOutcome: string;

  @Column({ type: 'date', nullable: true })
  appealDecisionDate: Date;

  @Column({ type: 'text', nullable: true })
  appealDecisionRationale: string;

  // ========================================
  // JUDICIAL REVIEW
  // ========================================

  @Column({ type: 'boolean', default: false })
  judicialReviewSought: boolean;

  @Column({ type: 'date', nullable: true })
  judicialReviewDate: Date;

  @Column({ type: 'var char', nullable: true })
  judicialReviewOutcome: string;

  // ========================================
  // DOCUMENTATION
  // ========================================

  @Column({ type: 'text' })
  assessmentReport: string;

  @Column({ type: 'simple-json', nullable: true })
  supportingDocuments: Array<{
    documentType: string;
    fileName: string;
    uploadDate: Date;
    uploadedBy: string;
  }>;

  // ========================================
  // AUDIT TRAIL
  // ========================================

  @Column({ type: 'var char' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'var char', nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Check if assessment is completed
   */
  isCompleted(): boolean {
    return this.status === AssessmentStatus.COMPLETED;
  }

  /**
   * Check if assessment is overdue
   */
  isOverdue(): boolean {
    if (this.isCompleted()) return false;
    const today = new Date();
    const scheduled = new Date(this.scheduledDate);
    return scheduled < today;
  }

  /**
   * Calculate age difference between claimed and assessed
   */
  getAgeDifference(): number | null {
    if (!this.assessedAge) return null;
    return this.assessedAge - this.claimedAge;
  }

  /**
   * Check if Merton compliant requirements met
   */
  isMertonCompliantRequirementsMet(): boolean {
    return (
      this.twoAssessorsUsed &&
      this.culturalBackgroundConsidered &&
      (!this.interpreterLanguage || this.interpreterUsedIfRequired)
    );
  }

  /**
   * Get days since scheduled
   */
  getDaysSinceScheduled(): number {
    const today = new Date();
    const scheduled = new Date(this.scheduledDate);
    const diffTime = today.getTime() - scheduled.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if under appeal
   */
  isUnderAppeal(): boolean {
    return (
      this.status === AssessmentStatus.APPEALED &&
      this.appealLodged &&
      !this.appealDecisionDate
    );
  }
}
