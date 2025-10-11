/**
 * ============================================================================
 * Health Assessment Entity
 * ============================================================================
 * 
 * @fileoverview Entity representing statutory health assessments for looked
 *               after children.
 * 
 * @module domains/health/entities/HealthAssessment
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages Initial Health Assessments (IHA) and Review Health Assessments (RHA)
 * for all looked after children as required by statutory guidance. Includes
 * comprehensive health screening, developmental checks, immunization status,
 * and health action planning.
 * 
 * @compliance
 * - OFSTED Regulation 9 (Health and wellbeing)
 * - Statutory Guidance on Promoting the Health of Looked After Children 2015
 * - Children Act 1989, Section 22(3)(a)
 * - Care Planning Regulations 2010
 * - Working Together to Safeguard Children 2018
 * 
 * @features
 * - Initial Health Assessment (within 20 working days)
 * - Review Health Assessment (annually or 6-monthly for under 5s)
 * - Comprehensive health screening
 * - Developmental assessment
 * - Immunization tracking
 * - Health action plan generation
 * - GP registration monitoring
 * - Consent recording (Gillick competence)
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

export enum AssessmentType {
  INITIAL = 'INITIAL',
  REVIEW = 'REVIEW',
  EMERGENCY = 'EMERGENCY'
}

export enum AssessmentStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

@Entity('health_assessments')
@Index(['childId'])
@Index(['assessmentType'])
@Index(['status'])
@Index(['assessmentDate'])
export class HealthAssessment {
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

  // Assessment Details
  @Column({ name: 'assessment_number', length: 100, unique: true })
  assessmentNumber: string;

  @Column({ name: 'assessment_type', type: 'enum', enum: AssessmentType })
  assessmentType: AssessmentType;

  @Column({ name: 'status', type: 'enum', enum: AssessmentStatus, default: AssessmentStatus.REQUESTED })
  status: AssessmentStatus;

  @Column({ name: 'requested_date', type: 'timestamp' })
  requestedDate: Date;

  @Column({ name: 'due_date', type: 'timestamp' })
  dueDate: Date; // IHA: 20 working days, RHA: annually or 6-monthly for under 5s

  @Column({ name: 'scheduled_date', type: 'timestamp', nullable: true })
  scheduledDate?: Date;

  @Column({ name: 'assessment_date', type: 'timestamp', nullable: true })
  assessmentDate?: Date;

  @Column({ name: 'location', length: 255, nullable: true })
  location?: string;

  // Healthcare Professional
  @Column({ name: 'assessed_by_name', length: 255, nullable: true })
  assessedByName?: string;

  @Column({ name: 'assessed_by_role', length: 100, nullable: true })
  assessedByRole?: string; // e.g., 'Paediatrician', 'Nurse Practitioner'

  @Column({ name: 'assessed_by_contact', length: 255, nullable: true })
  assessedByContact?: string;

  // GP Registration
  @Column({ name: 'gp_registered', type: 'boolean', default: false })
  gpRegistered: boolean;

  @Column({ name: 'gp_name', length: 255, nullable: true })
  gpName?: string;

  @Column({ name: 'gp_practice', length: 255, nullable: true })
  gpPractice?: string;

  @Column({ name: 'gp_address', type: 'text', nullable: true })
  gpAddress?: string;

  @Column({ name: 'gp_phone', length: 50, nullable: true })
  gpPhone?: string;

  @Column({ name: 'nhs_number', length: 20, nullable: true })
  nhsNumber?: string;

  // Physical Health
  @Column({ name: 'height_cm', type: 'decimal', precision: 5, scale: 2, nullable: true })
  heightCm?: number;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg?: number;

  @Column({ name: 'bmi', type: 'decimal', precision: 4, scale: 2, nullable: true })
  bmi?: number;

  @Column({ name: 'blood_pressure', length: 20, nullable: true })
  bloodPressure?: string; // e.g., '120/80'

  @Column({ name: 'vision_test', length: 100, nullable: true })
  visionTest?: string;

  @Column({ name: 'hearing_test', length: 100, nullable: true })
  hearingTest?: string;

  @Column({ name: 'dental_health', length: 255, nullable: true })
  dentalHealth?: string;

  @Column({ name: 'dentist_registered', type: 'boolean', default: false })
  dentistRegistered: boolean;

  @Column({ name: 'last_dental_checkup', type: 'timestamp', nullable: true })
  lastDentalCheckup?: Date;

  // Medical Conditions
  @Column({ name: 'medical_conditions', type: 'jsonb', default: '[]' })
  medicalConditions: Array<{
    condition: string;
    diagnosedDate: Date;
    severity: 'MILD' | 'MODERATE' | 'SEVERE';
    medication: string[];
    managementPlan: string;
  }>;

  @Column({ name: 'allergies', type: 'jsonb', default: '[]' })
  allergies: Array<{
    allergen: string;
    reaction: string;
    severity: 'MILD' | 'MODERATE' | 'SEVERE' | 'ANAPHYLAXIS';
    treatmentRequired: string;
  }>;

  @Column({ name: 'current_medications', type: 'jsonb', default: '[]' })
  currentMedications: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    prescribedBy: string;
    purpose: string;
  }>;

  // Immunizations
  @Column({ name: 'immunizations_up_to_date', type: 'boolean', default: false })
  immunizationsUpToDate: boolean;

  @Column({ name: 'immunization_status', type: 'jsonb', default: '[]' })
  immunizationStatus: Array<{
    vaccine: string;
    doseNumber: number;
    dateGiven: Date;
    nextDueDate?: Date;
    batchNumber?: string;
  }>;

  @Column({ name: 'immunizations_required', type: 'jsonb', default: '[]' })
  immunizationsRequired: string[];

  // Mental Health
  @Column({ name: 'mental_health_concerns', type: 'boolean', default: false })
  mentalHealthConcerns: boolean;

  @Column({ name: 'mental_health_assessment', type: 'text', nullable: true })
  mentalHealthAssessment?: string;

  @Column({ name: 'camhs_referral', type: 'boolean', default: false })
  camhsReferral: boolean;

  @Column({ name: 'camhs_referral_date', type: 'timestamp', nullable: true })
  camhsReferralDate?: Date;

  @Column({ name: 'therapy_services', type: 'jsonb', default: '[]' })
  therapyServices: Array<{
    service: 'CAMHS' | 'COUNSELLING' | 'PSYCHOTHERAPY' | 'CBT' | 'DBT' | 'EMDR' | 'OTHER';
    provider: string;
    startDate: Date;
    frequency: string;
    effectiveness: string;
  }>;

  // Development (for children)
  @Column({ name: 'developmental_assessment', type: 'jsonb', nullable: true })
  developmentalAssessment?: {
    physicalDevelopment: string;
    cognitiveDevelopment: string;
    speechAndLanguage: string;
    socialAndEmotional: string;
    concernsIdentified: string[];
    referralsRequired: string[];
  };

  // Sexual Health (age-appropriate)
  @Column({ name: 'sexual_health_discussed', type: 'boolean', default: false })
  sexualHealthDiscussed: boolean;

  @Column({ name: 'sexual_health_concerns', type: 'text', nullable: true })
  sexualHealthConcerns?: string;

  @Column({ name: 'sexual_health_education_provided', type: 'boolean', default: false })
  sexualHealthEducationProvided: boolean;

  // Substance Use
  @Column({ name: 'substance_use_screening', type: 'boolean', default: false })
  substanceUseScreening: boolean;

  @Column({ name: 'substance_use_identified', type: 'boolean', default: false })
  substanceUseIdentified: boolean;

  @Column({ name: 'substance_use_details', type: 'text', nullable: true })
  substanceUseDetails?: string;

  @Column({ name: 'substance_misuse_support', type: 'jsonb', default: '[]' })
  substanceMisuseSupport: Array<{
    service: string;
    referralDate: Date;
    status: string;
  }>;

  // Lifestyle
  @Column({ name: 'diet_and_nutrition', type: 'text', nullable: true })
  dietAndNutrition?: string;

  @Column({ name: 'exercise_and_physical_activity', type: 'text', nullable: true })
  exerciseAndPhysicalActivity?: string;

  @Column({ name: 'sleep_patterns', type: 'text', nullable: true })
  sleepPatterns?: string;

  // Consent
  @Column({ name: 'consent_obtained', type: 'boolean', default: false })
  consentObtained: boolean;

  @Column({ name: 'consent_given_by', length: 255, nullable: true })
  consentGivenBy?: string; // Parent, LA, Child (if Gillick competent)

  @Column({ name: 'gillick_competent', type: 'boolean', nullable: true })
  gillickCompetent?: boolean;

  // Health Action Plan
  @Column({ name: 'health_action_plan', type: 'jsonb', nullable: true })
  healthActionPlan?: {
    healthGoals: Array<{
      goal: string;
      actions: string[];
      responsible: string;
      targetDate: Date;
    }>;
    interventionsRequired: string[];
    specialistReferrals: Array<{
      specialty: string;
      reason: string;
      urgency: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
      referralDate: Date;
    }>;
    followUpRequired: boolean;
    followUpDate?: Date;
  };

  // Recommendations
  @Column({ name: 'recommendations', type: 'text', nullable: true })
  recommendations?: string;

  @Column({ name: 'concerns_to_address', type: 'jsonb', default: '[]' })
  concernsToAddress: string[];

  @Column({ name: 'next_assessment_due', type: 'timestamp', nullable: true })
  nextAssessmentDue?: Date;

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
   * Check if assessment is overdue
   */
  isOverdue(): boolean {
    if (this.status === AssessmentStatus.COMPLETED || this.status === AssessmentStatus.CANCELLED) {
      return false;
    }
    return new Date() > this.dueDate;
  }

  /**
   * Calculate BMI from height and weight
   */
  calculateBMI(): number | null {
    if (!this.heightCm || !this.weightKg) return null;
    
    const heightM = this.heightCm / 100;
    return Number((this.weightKg / (heightM * heightM)).toFixed(2));
  }

  /**
   * Get days until assessment due
   */
  getDaysUntilDue(): number {
    const now = new Date();
    const due = new Date(this.dueDate);
    const diffTime = due.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if all immunizations are up to date
   */
  hasCompleteImmunizations(): boolean {
    return this.immunizationsUpToDate && this.immunizationsRequired.length === 0;
  }

  /**
   * Get assessment age in days
   */
  getAssessmentAgeInDays(): number | null {
    if (!this.assessmentDate) return null;
    
    const now = new Date();
    const assessment = new Date(this.assessmentDate);
    const diffTime = now.getTime() - assessment.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
