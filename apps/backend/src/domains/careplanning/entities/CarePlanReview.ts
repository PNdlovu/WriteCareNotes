/**
 * ============================================================================
 * Care Plan Review Entity
 * ============================================================================
 * 
 * @fileoverview Statutory review entity for looked after children care plans.
 * 
 * @module domains/careplanning/entities/CarePlanReview
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents a statutory review of a looked after child's care plan (LAC Review).
 * Reviews must be conducted within statutory timescales and involve the
 * Independent Reviewing Officer (IRO), child, parents, carers, and professionals.
 * 
 * @compliance
 * - OFSTED Regulation 5 (Care planning)
 * - Care Planning, Placement and Case Review Regulations 2010
 * - IRO Handbook 2010
 * - Children Act 1989, Section 26
 * - Volume 2: Care Planning, Placement and Case Review
 * 
 * @features
 * - Statutory review scheduling (20 days, 3 months, 6 monthly)
 * - IRO oversight and recommendations
 * - Multi-participant attendance tracking
 * - Child participation recording
 * - Progress assessment against goals
 * - Action points with responsibility assignment
 * - Dispute resolution tracking
 * - Review outcomes and decisions
 * - Minutes and documentation management
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
import { Child } from '../../children/entities/Child';
import { CarePlan } from './CarePlan';
import { Organization } from '../../organization/entities/Organization';

// ========================================
// ENUMERATIONS
// ========================================

export enum ReviewType {
  INITIAL = 'INITIAL', // Within 20 working days
  FIRST = 'FIRST', // Within 3 months
  SUBSEQUENT = 'SUBSEQUENT', // Every 6 months
  INTERIM = 'INTERIM',
  EMERGENCY = 'EMERGENCY',
  PLACEMENT_BREAKDOWN = 'PLACEMENT_BREAKDOWN',
  PATHWAY_PLAN = 'PATHWAY_PLAN'
}

export enum ReviewStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
  OVERDUE = 'OVERDUE'
}

export enum ReviewOutcome {
  PLAN_APPROVED = 'PLAN_APPROVED',
  PLAN_AMENDED = 'PLAN_AMENDED',
  PLAN_REJECTED = 'PLAN_REJECTED',
  FURTHER_REVIEW_REQUIRED = 'FURTHER_REVIEW_REQUIRED',
  ESCALATED = 'ESCALATED'
}

export enum ParticipantAttendance {
  ATTENDED = 'ATTENDED',
  PARTIALLY_ATTENDED = 'PARTIALLY_ATTENDED',
  DID_NOT_ATTEND = 'DID_NOT_ATTEND',
  NOT_INVITED = 'NOT_INVITED',
  DECLINED = 'DECLINED',
  VIEWS_SUBMITTED = 'VIEWS_SUBMITTED'
}

// ========================================
// CARE PLAN REVIEW ENTITY
// ========================================

@Entity('care_plan_reviews')
export class CarePlanReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'varchar', unique: true })
  reviewNumber: string; // Format: CPR-YYYY-NNNNN

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column()
  childId: string;

  @ManyToOne(() => CarePlan)
  @JoinColumn({ name: 'carePlanId' })
  carePlan: CarePlan;

  @Column()
  carePlanId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: ReviewType,
    default: ReviewType.SUBSEQUENT
  })
  reviewType: ReviewType;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    default: ReviewStatus.SCHEDULED
  })
  status: ReviewStatus;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'time', nullable: true })
  scheduledTime: string;

  @Column({ type: 'date', nullable: true })
  actualDate: Date;

  @Column({ type: 'varchar', nullable: true })
  venue: string;

  @Column({ type: 'text', nullable: true })
  venueAddress: string;

  @Column({ type: 'boolean', default: false })
  virtualMeeting: boolean;

  @Column({ type: 'varchar', nullable: true })
  meetingLink: string;

  // ========================================
  // IRO INFORMATION
  // ========================================

  @Column({ type: 'varchar' })
  independentReviewingOfficer: string;

  @Column({ type: 'varchar', nullable: true })
  iroContactDetails: string;

  @Column({ type: 'boolean', default: false })
  iroChaired: boolean;

  @Column({ type: 'text', nullable: true })
  iroPreReviewNotes: string;

  @Column({ type: 'text', nullable: true })
  iroRecommendations: string;

  @Column({ type: 'text', nullable: true })
  iroConcerns: string;

  @Column({ type: 'boolean', default: false })
  iroDisputeRaised: boolean;

  @Column({ type: 'text', nullable: true })
  iroDisputeDetails: string;

  @Column({ type: 'date', nullable: true })
  iroFollowUpDate: Date;

  // ========================================
  // CHILD PARTICIPATION
  // ========================================

  @Column({
    type: 'enum',
    enum: ParticipantAttendance,
    default: ParticipantAttendance.NOT_INVITED
  })
  childAttendance: ParticipantAttendance;

  @Column({ type: 'text', nullable: true })
  childViewsMethod: string; // How views were obtained

  @Column({ type: 'text', nullable: true })
  childViews: string;

  @Column({ type: 'boolean', nullable: true })
  childAgreesWithPlan: boolean;

  @Column({ type: 'text', nullable: true })
  childDisagreements: string;

  @Column({ type: 'text', nullable: true })
  childAspirations: string;

  @Column({ type: 'text', nullable: true })
  childConcerns: string;

  @Column({ type: 'text', nullable: true })
  advocacySupport: string;

  @Column({ type: 'boolean', default: false })
  advocateAttended: boolean;

  @Column({ type: 'varchar', nullable: true })
  advocateName: string;

  // ========================================
  // PARENT/FAMILY PARTICIPATION
  // ========================================

  @Column({
    type: 'enum',
    enum: ParticipantAttendance,
    nullable: true
  })
  motherAttendance: ParticipantAttendance;

  @Column({ type: 'text', nullable: true })
  motherViews: string;

  @Column({
    type: 'enum',
    enum: ParticipantAttendance,
    nullable: true
  })
  fatherAttendance: ParticipantAttendance;

  @Column({ type: 'text', nullable: true })
  fatherViews: string;

  @Column({ type: 'simple-json', nullable: true })
  otherFamilyAttendance: Array<{
    name: string;
    relationship: string;
    attendance: ParticipantAttendance;
    views?: string;
  }>;

  // ========================================
  // CARER PARTICIPATION
  // ========================================

  @Column({
    type: 'enum',
    enum: ParticipantAttendance,
    nullable: true
  })
  currentCarerAttendance: ParticipantAttendance;

  @Column({ type: 'varchar', nullable: true })
  currentCarerName: string;

  @Column({ type: 'text', nullable: true })
  carerViews: string;

  @Column({ type: 'text', nullable: true })
  carerConcerns: string;

  @Column({ type: 'text', nullable: true })
  placementStability: string;

  // ========================================
  // PROFESSIONAL ATTENDANCE
  // ========================================

  @Column({ type: 'varchar' })
  socialWorkerName: string;

  @Column({
    type: 'enum',
    enum: ParticipantAttendance,
    default: ParticipantAttendance.ATTENDED
  })
  socialWorkerAttendance: ParticipantAttendance;

  @Column({ type: 'simple-json', nullable: true })
  otherProfessionalsAttending: Array<{
    name: string;
    role: string;
    organization: string;
    attendance: ParticipantAttendance;
    contribution?: string;
  }>;

  // ========================================
  // REVIEW OF PROGRESS
  // ========================================

  @Column({ type: 'text', nullable: true })
  progressSinceLastReview: string;

  @Column({ type: 'text', nullable: true })
  achievementsHighlighted: string;

  @Column({ type: 'text', nullable: true })
  concernsRaised: string;

  @Column({ type: 'text', nullable: true })
  healthProgress: string;

  @Column({ type: 'text', nullable: true })
  educationProgress: string;

  @Column({ type: 'text', nullable: true })
  emotionalWellbeingProgress: string;

  @Column({ type: 'text', nullable: true })
  relationshipsProgress: string;

  @Column({ type: 'text', nullable: true })
  identityCultureProgress: string;

  @Column({ type: 'text', nullable: true })
  independenceSkillsProgress: string;

  // ========================================
  // CARE PLAN REVIEW
  // ========================================

  @Column({ type: 'boolean', default: false })
  carePlanReviewed: boolean;

  @Column({ type: 'text', nullable: true })
  carePlanChangesRequired: string;

  @Column({ type: 'boolean', default: false })
  permanenceGoalReviewed: boolean;

  @Column({ type: 'text', nullable: true })
  permanenceGoalChanges: string;

  @Column({ type: 'boolean', default: false })
  placementMeetingNeeds: boolean;

  @Column({ type: 'text', nullable: true })
  placementReview: string;

  @Column({ type: 'text', nullable: true })
  contactArrangementsReview: string;

  // ========================================
  // DECISIONS AND RECOMMENDATIONS
  // ========================================

  @Column({
    type: 'enum',
    enum: ReviewOutcome,
    nullable: true
  })
  reviewOutcome: ReviewOutcome;

  @Column({ type: 'simple-json', nullable: true })
  decisionsReached: Array<{
    decision: string;
    rationale: string;
    agreedBy: string[];
    implementationDate?: Date;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  recommendations: Array<{
    recommendation: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    responsiblePerson: string;
    targetDate: Date;
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  }>;

  // ========================================
  // ACTION POINTS
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  actionPoints: Array<{
    action: string;
    assignedTo: string;
    role: string;
    dueDate: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
    completionDate?: Date;
    completionNotes?: string;
  }>;

  @Column({ type: 'int', default: 0 })
  actionPointsCompleted: number;

  @Column({ type: 'int', default: 0 })
  actionPointsOutstanding: number;

  // ========================================
  // NEXT REVIEW
  // ========================================

  @Column({ type: 'date', nullable: true })
  nextReviewDate: Date;

  @Column({
    type: 'enum',
    enum: ReviewType,
    nullable: true
  })
  nextReviewType: ReviewType;

  @Column({ type: 'text', nullable: true })
  nextReviewNotes: string;

  // ========================================
  // DOCUMENTATION
  // ========================================

  @Column({ type: 'boolean', default: false })
  minutesCompleted: boolean;

  @Column({ type: 'date', nullable: true })
  minutesCompletedDate: Date;

  @Column({ type: 'varchar', nullable: true })
  minutesCompletedBy: string;

  @Column({ type: 'boolean', default: false })
  minutesDistributed: boolean;

  @Column({ type: 'date', nullable: true })
  minutesDistributionDate: Date;

  @Column({ type: 'simple-json', nullable: true })
  minutesDistributedTo: string[];

  @Column({ type: 'text', nullable: true })
  reviewSummary: string;

  @Column({ type: 'text', nullable: true })
  keyPoints: string;

  // ========================================
  // QUALITY ASSURANCE
  // ========================================

  @Column({ type: 'boolean', default: false })
  reviewOnTime: boolean;

  @Column({ type: 'int', nullable: true })
  daysOverdue: number;

  @Column({ type: 'text', nullable: true })
  delayReason: string;

  @Column({ type: 'boolean', default: false })
  allRequiredParticipantsAttended: boolean;

  @Column({ type: 'text', nullable: true })
  nonAttendanceImpact: string;

  @Column({ type: 'boolean', default: false })
  statutoryRequirementsMet: boolean;

  @Column({ type: 'text', nullable: true })
  complianceIssues: string;

  // ========================================
  // AUDIT TRAIL
  // ========================================

  @Column({ type: 'varchar' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Check if review is completed
   */
  isCompleted(): boolean {
    return this.status === ReviewStatus.COMPLETED;
  }

  /**
   * Check if review is overdue
   */
  isOverdue(): boolean {
    if (this.status === ReviewStatus.COMPLETED) return false;
    return new Date(this.scheduledDate) < new Date();
  }

  /**
   * Get days until review
   */
  getDaysUntilReview(): number {
    const today = new Date();
    const reviewDate = new Date(this.scheduledDate);
    const diffTime = reviewDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate action point completion rate
   */
  getActionPointCompletionRate(): number {
    const total = this.actionPointsCompleted + this.actionPointsOutstanding;
    if (total === 0) return 0;
    return (this.actionPointsCompleted / total) * 100;
  }

  /**
   * Check if child participated
   */
  hasChildParticipation(): boolean {
    return (
      this.childAttendance === ParticipantAttendance.ATTENDED ||
      this.childAttendance === ParticipantAttendance.VIEWS_SUBMITTED ||
      this.childAttendance === ParticipantAttendance.PARTIALLY_ATTENDED
    );
  }

  /**
   * Check if review requires urgent follow-up
   */
  requiresUrgentFollowUp(): boolean {
    return (
      this.iroDisputeRaised ||
      this.reviewOutcome === ReviewOutcome.ESCALATED ||
      this.reviewOutcome === ReviewOutcome.FURTHER_REVIEW_REQUIRED ||
      !this.statutoryRequirementsMet
    );
  }

  /**
   * Get overdue action points
   */
  getOverdueActionPoints(): number {
    if (!this.actionPoints) return 0;
    const today = new Date();
    return this.actionPoints.filter(
      (ap) =>
        ap.status !== 'COMPLETED' && new Date(ap.dueDate) < today
    ).length;
  }

  /**
   * Check if minutes are overdue
   */
  areMinutesOverdue(): boolean {
    if (this.minutesCompleted) return false;
    if (!this.actualDate) return false;
    const minutesDeadline = new Date(this.actualDate);
    minutesDeadline.setDate(minutesDeadline.getDate() + 20); // Minutes due within 20 days
    return new Date() > minutesDeadline;
  }
}
