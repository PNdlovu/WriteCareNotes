/**
 * ============================================================================
 * Child Protection Plan Entity
 * ============================================================================
 * 
 * @fileoverview Entity representing statutory Child Protection Plans for children
 *               subject to Section 47 investigations and child protection conferences.
 * 
 * @module domains/safeguarding/entities/ChildProtectionPlan
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages Child Protection Plans (CPP) for children identified as suffering,
 * or likely to suffer, significant harm. Includes categories of abuse, core
 * groups, review conferences, and safety plans.
 * 
 * @compliance
 * - OFSTED Regulation 13 (Safeguarding)
 * - Children Act 1989, Section 47
 * - Working Together to Safeguard Children 2018
 * - Care Planning Regulations 2010
 * 
 * @features
 * - Multi-category abuse tracking (Physical, Sexual, Emotional, Neglect)
 * - Core group meeting scheduling and tracking
 * - Review conference management
 * - Safety plan implementation
 * - Risk assessment and monitoring
 * - SMART objectives tracking
 * - Professional involvement logging
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

export enum CPPCategory {
  PHYSICAL_ABUSE = 'PHYSICAL_ABUSE',
  SEXUAL_ABUSE = 'SEXUAL_ABUSE',
  EMOTIONAL_ABUSE = 'EMOTIONAL_ABUSE',
  NEGLECT = 'NEGLECT',
  MULTIPLE = 'MULTIPLE'
}

export enum CPPStatus {
  ACTIVE = 'ACTIVE',
  ENDED = 'ENDED',
  TRANSFERRED = 'TRANSFERRED',
  ESCALATED_TO_CARE = 'ESCALATED_TO_CARE'
}

@Entity('child_protection_plans')
@Index(['childId'])
@Index(['status'])
@Index(['category'])
@Index(['startDate'])
export class ChildProtectionPlan {
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

  // Plan Details
  @Column({ name: 'cpp_number', length: 100, unique: true })
  cppNumber: string;

  @Column({ name: 'category', type: 'enum', enum: CPPCategory })
  category: CPPCategory;

  @Column({ name: 'additional_categories', type: 'jsonb', default: '[]' })
  additionalCategories: CPPCategory[];

  @Column({ name: 'status', type: 'enum', enum: CPPStatus, default: CPPStatus.ACTIVE })
  status: CPPStatus;

  // Dates
  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ name: 'expected_duration_months', type: 'integer', default: 12 })
  expectedDurationMonths: number;

  // Initial Conference
  @Column({ name: 'initial_conference_date', type: 'timestamp' })
  initialConferenceDate: Date;

  @Column({ name: 'initial_conference_chair', length: 255 })
  initialConferenceChair: string;

  @Column({ name: 'initial_conference_decision', type: 'text' })
  initialConferenceDecision: string;

  // Lead Social Worker
  @Column({ name: 'lead_social_worker_name', length: 255 })
  leadSocialWorkerName: string;

  @Column({ name: 'lead_social_worker_email', length: 255 })
  leadSocialWorkerEmail: string;

  @Column({ name: 'lead_social_worker_phone', length: 50 })
  leadSocialWorkerPhone: string;

  @Column({ name: 'supervising_manager', length: 255 })
  supervisingManager: string;

  // Risks and Concerns
  @Column({ name: 'identified_risks', type: 'jsonb' })
  identifiedRisks: Array<{
    risk: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    likelihood: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';
    dateIdentified: Date;
  }>;

  @Column({ name: 'current_concerns', type: 'text' })
  currentConcerns: string;

  @Column({ name: 'harm_analysis', type: 'text' })
  harmAnalysis: string;

  // Safety Plan
  @Column({ name: 'safety_plan', type: 'jsonb' })
  safetyPlan: {
    safePeople: Array<{ name: string; role: string; contact: string }>;
    unsafePeople: Array<{ name: string; reason: string }>;
    safePlaces: string[];
    unsafePlaces: string[];
    earlyWarningSigns: string[];
    copingStrategies: string[];
    emergencyContacts: Array<{ name: string; phone: string; available: string }>;
  };

  // Objectives (SMART)
  @Column({ name: 'objectives', type: 'jsonb' })
  objectives: Array<{
    objectiveNumber: number;
    objective: string;
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: Date;
    responsible: string;
    progress: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'NOT_ACHIEVED';
    progressNotes: string;
  }>;

  // Core Group
  @Column({ name: 'core_group_members', type: 'jsonb' })
  coreGroupMembers: Array<{
    name: string;
    role: string;
    organization: string;
    email: string;
    phone: string;
    responsibilities: string[];
  }>;

  @Column({ name: 'core_group_frequency_weeks', type: 'integer', default: 4 })
  coreGroupFrequencyWeeks: number;

  @Column({ name: 'next_core_group_date', type: 'timestamp', nullable: true })
  nextCoreGroupDate?: Date;

  @Column({ name: 'core_group_meetings', type: 'jsonb', default: '[]' })
  coreGroupMeetings: Array<{
    meetingNumber: number;
    date: Date;
    attendees: string[];
    apologies: string[];
    progressReviewed: string;
    actionsAgreed: Array<{ action: string; responsible: string; deadline: Date }>;
    minutes: string;
    minutesUrl?: string;
  }>;

  // Review Conferences
  @Column({ name: 'review_frequency_months', type: 'integer', default: 3 })
  reviewFrequencyMonths: number;

  @Column({ name: 'next_review_conference_date', type: 'timestamp', nullable: true })
  nextReviewConferenceDate?: Date;

  @Column({ name: 'review_conferences', type: 'jsonb', default: '[]' })
  reviewConferences: Array<{
    reviewNumber: number;
    date: Date;
    chair: string;
    attendees: string[];
    decision: 'CONTINUE' | 'END' | 'ESCALATE' | 'TRANSFER';
    decisionReason: string;
    recommendations: string[];
    minutesUrl?: string;
  }>;

  // Parent/Carer Involvement
  @Column({ name: 'parent_carer_involvement', type: 'jsonb' })
  parentCarerInvolvement: {
    parentsAttendedConference: boolean;
    parentsViewsObtained: boolean;
    parentsAgreementLevel: 'FULLY_AGREE' | 'PARTIALLY_AGREE' | 'DISAGREE';
    parentsCommitments: string[];
    supportProvided: string[];
  };

  // Child Involvement
  @Column({ name: 'child_involvement', type: 'jsonb' })
  childInvolvement: {
    childViewsObtained: boolean;
    ageAppropriateExplanation: boolean;
    childUnderstandsPlan: boolean;
    childAgreesWithPlan: boolean;
    childWishes: string;
    advocateInvolved: boolean;
    advocateName?: string;
  };

  // Services Provided
  @Column({ name: 'services_provided', type: 'jsonb', default: '[]' })
  servicesProvided: Array<{
    service: string;
    provider: string;
    startDate: Date;
    endDate?: Date;
    frequency: string;
    effectiveness: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE';
  }>;

  // Monitoring
  @Column({ name: 'statutory_visits_frequency', length: 100 })
  statutoryVisitsFrequency: string; // e.g., "Weekly", "Fortnightly"

  @Column({ name: 'last_statutory_visit_date', type: 'timestamp', nullable: true })
  lastStatutoryVisitDate?: Date;

  @Column({ name: 'next_statutory_visit_date', type: 'timestamp', nullable: true })
  nextStatutoryVisitDate?: Date;

  // Progress Assessment
  @Column({ name: 'progress_assessment', type: 'text', nullable: true })
  progressAssessment?: string;

  @Column({ name: 'risk_reduction_achieved', type: 'boolean', default: false })
  riskReductionAchieved: boolean;

  @Column({ name: 'significant_harm_prevented', type: 'boolean', default: false })
  significantHarmPrevented: boolean;

  // Escalation
  @Column({ name: 'escalation_considered', type: 'boolean', default: false })
  escalationConsidered: boolean;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason?: string;

  // Plan Ending
  @Column({ name: 'end_reason', type: 'text', nullable: true })
  endReason?: string;

  @Column({ name: 'outcomes_achieved', type: 'jsonb', nullable: true })
  outcomesAchieved?: string[];

  @Column({ name: 'ongoing_support_required', type: 'boolean', default: false })
  ongoingSupportRequired: boolean;

  @Column({ name: 'step_down_plan', type: 'text', nullable: true })
  stepDownPlan?: string;

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
   * Calculate plan duration in months
   */
  getPlanDurationMonths(): number {
    const endDate = this.endDate || new Date();
    const diffTime = endDate.getTime() - new Date(this.startDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  /**
   * Check if core group meeting is overdue
   */
  isCoreGroupOverdue(): boolean {
    if (!this.nextCoreGroupDate) return false;
    return new Date() > this.nextCoreGroupDate;
  }

  /**
   * Check if review conference is overdue
   */
  isReviewConferenceOverdue(): boolean {
    if (!this.nextReviewConferenceDate) return false;
    return new Date() > this.nextReviewConferenceDate;
  }

  /**
   * Check if statutory visit is overdue
   */
  isStatutoryVisitOverdue(): boolean {
    if (!this.nextStatutoryVisitDate) return false;
    return new Date() > this.nextStatutoryVisitDate;
  }

  /**
   * Get objectives completion percentage
   */
  getObjectivesCompletionPercentage(): number {
    if (this.objectives.length === 0) return 0;
    
    const achieved = this.objectives.filter(o => o.progress === 'ACHIEVED').length;
    return Math.round((achieved / this.objectives.length) * 100);
  }

  /**
   * Check if plan is active
   */
  isActive(): boolean {
    return this.status === CPPStatus.ACTIVE && !this.endDate;
  }

  /**
   * Check if plan has exceeded expected duration
   */
  hasExceededExpectedDuration(): boolean {
    const currentDuration = this.getPlanDurationMonths();
    return currentDuration > this.expectedDurationMonths;
  }
}
