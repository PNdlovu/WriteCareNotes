/**
 * ============================================================================
 * Care Plan Goal Entity
 * ============================================================================
 * 
 * @fileoverview SMART goals within care plans for looked after children.
 * 
 * @module domains/careplanning/entities/CarePlanGoal
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents individual SMART (Specific, Measurable, Achievable, Relevant,
 * Time-bound) goals within a care plan. Goals track progress towards specific
 * outcomes and link to interventions and reviews.
 * 
 * @compliance
 * - OFSTED Regulation 5 (Care planning)
 * - Care Planning, Placement and Case Review Regulations 2010
 * - Children Act 1989, Section 22(3)
 * - Volume 2: Care Planning, Placement and Case Review
 * 
 * @features
 * - SMART goal framework
 * - Goal categorization by domain
 * - Progress tracking with milestones
 * - Multi-agency responsibility assignment
 * - Review and revision history
 * - Success criteria definition
 * - Barrier identification and mitigation
 * - Child and family involvement tracking
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

export enum GoalDomain {
  HEALTH = 'HEALTH',
  EDUCATION = 'EDUCATION',
  EMOTIONAL_WELLBEING = 'EMOTIONAL_WELLBEING',
  IDENTITY = 'IDENTITY',
  FAMILY_RELATIONSHIPS = 'FAMILY_RELATIONSHIPS',
  SOCIAL_RELATIONSHIPS = 'SOCIAL_RELATIONSHIPS',
  SOCIAL_PRESENTATION = 'SOCIAL_PRESENTATION',
  SELF_CARE = 'SELF_CARE',
  INDEPENDENCE = 'INDEPENDENCE',
  PERMANENCE = 'PERMANENCE',
  PLACEMENT_STABILITY = 'PLACEMENT_STABILITY',
  OTHER = 'OTHER'
}

export enum GoalStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  DELAYED = 'DELAYED',
  ACHIEVED = 'ACHIEVED',
  PARTIALLY_ACHIEVED = 'PARTIALLY_ACHIEVED',
  NOT_ACHIEVED = 'NOT_ACHIEVED',
  CANCELLED = 'CANCELLED',
  SUPERSEDED = 'SUPERSEDED'
}

export enum GoalPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ========================================
// CARE PLAN GOAL ENTITY
// ========================================

@Entity('care_plan_goals')
export class CarePlanGoal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'varchar', unique: true })
  goalNumber: string; // Format: CPG-YYYY-NNNNN

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
    enum: GoalDomain,
    default: GoalDomain.OTHER
  })
  goalDomain: GoalDomain;

  @Column({
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.NOT_STARTED
  })
  status: GoalStatus;

  @Column({
    type: 'enum',
    enum: GoalPriority,
    default: GoalPriority.MEDIUM
  })
  priority: GoalPriority;

  // ========================================
  // SMART GOAL DEFINITION
  // ========================================

  @Column({ type: 'text' })
  goalStatement: string; // Specific

  @Column({ type: 'text' })
  measurableOutcomes: string; // Measurable

  @Column({ type: 'text', nullable: true })
  achievabilityRationale: string; // Achievable

  @Column({ type: 'text', nullable: true })
  relevanceRationale: string; // Relevant

  @Column({ type: 'date' })
  targetDate: Date; // Time-bound

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  achievedDate: Date;

  @Column({ type: 'text', nullable: true })
  successCriteria: string;

  // ========================================
  // GOAL DETAILS
  // ========================================

  @Column({ type: 'text', nullable: true })
  currentSituation: string;

  @Column({ type: 'text', nullable: true })
  desiredOutcome: string;

  @Column({ type: 'text', nullable: true })
  stepsToAchieve: string;

  @Column({ type: 'simple-json', nullable: true })
  milestones: Array<{
    milestone: string;
    targetDate: Date;
    achieved: boolean;
    achievedDate?: Date;
    notes?: string;
  }>;

  @Column({ type: 'int', default: 0 })
  progressPercentage: number;

  // ========================================
  // RESPONSIBILITY
  // ========================================

  @Column({ type: 'varchar' })
  leadProfessional: string;

  @Column({ type: 'varchar', nullable: true })
  leadProfessionalRole: string;

  @Column({ type: 'varchar', nullable: true })
  leadProfessionalContact: string;

  @Column({ type: 'simple-json', nullable: true })
  supportingProfessionals: Array<{
    name: string;
    role: string;
    organization: string;
    responsibility: string;
    contactDetails?: string;
  }>;

  @Column({ type: 'text', nullable: true })
  agencyInvolvement: string;

  // ========================================
  // INTERVENTIONS
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  plannedInterventions: Array<{
    intervention: string;
    provider: string;
    frequency: string;
    startDate: Date;
    endDate?: Date;
    cost?: number;
    status: 'PLANNED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  }>;

  @Column({ type: 'text', nullable: true })
  resourcesRequired: string;

  @Column({ type: 'number', nullable: true })
  budgetAllocated: number;

  @Column({ type: 'number', nullable: true })
  actualCost: number;

  // ========================================
  // CHILD AND FAMILY INVOLVEMENT
  // ========================================

  @Column({ type: 'boolean', default: false })
  childInvolved: boolean;

  @Column({ type: 'text', nullable: true })
  childViews: string;

  @Column({ type: 'boolean', nullable: true })
  childAgreesWithGoal: boolean;

  @Column({ type: 'text', nullable: true })
  childMotivation: string;

  @Column({ type: 'boolean', default: false })
  familyInvolved: boolean;

  @Column({ type: 'text', nullable: true })
  familySupport: string;

  @Column({ type: 'boolean', default: false })
  carerInvolved: boolean;

  @Column({ type: 'text', nullable: true })
  carerSupport: string;

  // ========================================
  // PROGRESS TRACKING
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  progressUpdates: Array<{
    updateDate: Date;
    updatedBy: string;
    progressNotes: string;
    progressPercentage: number;
    barriersIdentified?: string;
    actionsTaken?: string;
  }>;

  @Column({ type: 'date', nullable: true })
  lastProgressUpdate: Date;

  @Column({ type: 'date', nullable: true })
  nextProgressReview: Date;

  @Column({ type: 'int', default: 0 })
  progressReviewCount: number;

  // ========================================
  // BARRIERS AND MITIGATION
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  barriers: Array<{
    barrier: string;
    identifiedDate: Date;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    mitigation: string;
    mitigationStatus: 'PLANNED' | 'IN_PROGRESS' | 'RESOLVED';
    resolvedDate?: Date;
  }>;

  @Column({ type: 'text', nullable: true })
  risksToAchievement: string;

  @Column({ type: 'text', nullable: true })
  contingencyPlan: string;

  // ========================================
  // REVIEW AND REVISION
  // ========================================

  @Column({ type: 'date', nullable: true })
  lastReviewDate: Date;

  @Column({ type: 'varchar', nullable: true })
  lastReviewedBy: string;

  @Column({ type: 'text', nullable: true })
  lastReviewOutcome: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'simple-json', nullable: true })
  revisionHistory: Array<{
    revisionDate: Date;
    revisedBy: string;
    changes: string;
    reason: string;
  }>;

  // ========================================
  // OUTCOME AND EVALUATION
  // ========================================

  @Column({ type: 'text', nullable: true })
  outcomeEvaluation: string;

  @Column({ type: 'text', nullable: true })
  lessonsLearned: string;

  @Column({ type: 'text', nullable: true })
  impactOnChild: string;

  @Column({ type: 'boolean', nullable: true })
  goalFullyAchieved: boolean;

  @Column({ type: 'int', nullable: true })
  achievementPercentage: number;

  @Column({ type: 'text', nullable: true })
  reasonsForNonAchievement: string;

  @Column({ type: 'text', nullable: true })
  followUpGoals: string;

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
   * Check if goal is active
   */
  isActive(): boolean {
    return (
      this.status === GoalStatus.IN_PROGRESS ||
      this.status === GoalStatus.ON_TRACK ||
      this.status === GoalStatus.AT_RISK ||
      this.status === GoalStatus.DELAYED
    );
  }

  /**
   * Check if goal is overdue
   */
  isOverdue(): boolean {
    if (this.achievedDate) return false;
    return new Date(this.targetDate) < new Date();
  }

  /**
   * Get days until target date
   */
  getDaysUntilTarget(): number {
    const today = new Date();
    const target = new Date(this.targetDate);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get goal duration in days
   */
  getGoalDuration(): number {
    const start = new Date(this.startDate);
    const end = this.achievedDate ? new Date(this.achievedDate) : new Date();
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate milestone completion rate
   */
  getMilestoneCompletionRate(): number {
    if (!this.milestones || this.milestones.length === 0) return 0;
    const completed = this.milestones.filter((m) => m.achieved).length;
    return (completed / this.milestones.length) * 100;
  }

  /**
   * Check if progress update is overdue
   */
  isProgressUpdateOverdue(): boolean {
    if (!this.nextProgressReview) return false;
    return new Date(this.nextProgressReview) < new Date();
  }

  /**
   * Get unresolved barriers count
   */
  getUnresolvedBarriers(): number {
    if (!this.barriers) return 0;
    return this.barriers.filter(
      (b) => b.mitigationStatus !== 'RESOLVED'
    ).length;
  }

  /**
   * Check if goal requires urgent attention
   */
  requiresUrgentAttention(): boolean {
    return (
      this.priority === GoalPriority.CRITICAL ||
      this.status === GoalStatus.AT_RISK ||
      this.status === GoalStatus.DELAYED ||
      this.isOverdue() ||
      this.getUnresolvedBarriers() > 0
    );
  }
}
