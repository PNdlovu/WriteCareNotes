/**
 * ============================================================================
 * Care Plan Entity
 * ============================================================================
 * 
 * @fileoverview Statutory care plan entity for looked after children.
 * 
 * @module domains/careplanning/entities/CarePlan
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents a statutory care plan for a looked after child. Care plans are
 * required under the Care Planning Regulations 2010 and must be reviewed
 * regularly. This entity tracks the plan's current status, objectives, goals,
 * interventions, and review schedule.
 * 
 * @compliance
 * - OFSTED Regulation 5 (Care planning)
 * - Care Planning, Placement and Case Review Regulations 2010
 * - Children Act 1989, Section 22(3)
 * - Volume 2: Care Planning, Placement and Case Review
 * - IRO Handbook 2010
 * 
 * @features
 * - Comprehensive care planning with SMART goals
 * - Multiple plan types (INITIAL, INTERIM, LONG_TERM)
 * - Multi-agency involvement tracking
 * - Permanence planning integration
 * - Statutory review scheduling
 * - IRO oversight and recommendations
 * - Child participation recording
 * - Parent/carer involvement tracking
 * - Contingency planning
 * - Cultural and religious needs assessment
 * - Health, education, and identity plan integration
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
  OneToMany
} from 'typeorm';
import { Child } from '../../children/entities/Child';
import { Organization } from '../../organization/entities/Organization';

// ========================================
// ENUMERATIONS
// ========================================

export enum CarePlanType {
  INITIAL = 'INITIAL',
  INTERIM = 'INTERIM',
  LONG_TERM = 'LONG_TERM',
  PATHWAY_PLAN = 'PATHWAY_PLAN',
  PERMANENCE_PLAN = 'PERMANENCE_PLAN'
}

export enum CarePlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EXPIRED = 'EXPIRED',
  SUPERSEDED = 'SUPERSEDED',
  ARCHIVED = 'ARCHIVED'
}

export enum PermanenceGoal {
  RETURN_HOME = 'RETURN_HOME',
  ADOPTION = 'ADOPTION',
  SPECIAL_GUARDIANSHIP = 'SPECIAL_GUARDIANSHIP',
  LONG_TERM_FOSTERING = 'LONG_TERM_FOSTERING',
  RESIDENCE_ORDER = 'RESIDENCE_ORDER',
  INDEPENDENT_LIVING = 'INDEPENDENT_LIVING',
  RESIDENTIAL_CARE = 'RESIDENTIAL_CARE',
  UNDECIDED = 'UNDECIDED'
}

export enum ChildParticipationLevel {
  FULL = 'FULL',
  SUBSTANTIAL = 'SUBSTANTIAL',
  LIMITED = 'LIMITED',
  MINIMAL = 'MINIMAL',
  NONE = 'NONE'
}

// ========================================
// CARE PLAN ENTITY
// ========================================

@Entity('care_plans')
export class CarePlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'varchar', unique: true })
  carePlanNumber: string; // Format: CP-YYYY-NNNN

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'childId' })
  child: Child;

  @Column()
  childId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  organizationId: string;

  @Column({
    type: 'enum',
    enum: CarePlanType,
    default: CarePlanType.INITIAL
  })
  planType: CarePlanType;

  @Column({
    type: 'enum',
    enum: CarePlanStatus,
    default: CarePlanStatus.DRAFT
  })
  status: CarePlanStatus;

  @Column({ type: 'date' })
  planStartDate: Date;

  @Column({ type: 'date', nullable: true })
  planEndDate: Date;

  @Column({ type: 'text', nullable: true })
  planSummary: string;

  @Column({ type: 'int', default: 1 })
  version: number;

  // ========================================
  // PERMANENCE PLANNING
  // ========================================

  @Column({
    type: 'enum',
    enum: PermanenceGoal,
    default: PermanenceGoal.UNDECIDED
  })
  permanenceGoal: PermanenceGoal;

  @Column({ type: 'text', nullable: true })
  permanenceGoalRationale: string;

  @Column({ type: 'date', nullable: true })
  permanenceGoalReviewDate: Date;

  @Column({ type: 'text', nullable: true })
  alternativePermanenceOptions: string;

  @Column({ type: 'text', nullable: true })
  stepsTowardsPermanence: string;

  @Column({ type: 'date', nullable: true })
  targetDateForPermanence: Date;

  @Column({ type: 'text', nullable: true })
  barriersToAchievingPermanence: string;

  // ========================================
  // CHILD'S WISHES AND FEELINGS
  // ========================================

  @Column({ type: 'boolean', default: false })
  childViewsSought: boolean;

  @Column({ type: 'text', nullable: true })
  childViews: string;

  @Column({ type: 'date', nullable: true })
  childViewsRecordedDate: Date;

  @Column({ type: 'varchar', nullable: true })
  childViewsRecordedBy: string;

  @Column({
    type: 'enum',
    enum: ChildParticipationLevel,
    nullable: true
  })
  childParticipationLevel: ChildParticipationLevel;

  @Column({ type: 'text', nullable: true })
  childParticipationNotes: string;

  @Column({ type: 'text', nullable: true })
  childAspirations: string;

  @Column({ type: 'text', nullable: true })
  childConcerns: string;

  @Column({ type: 'boolean', nullable: true })
  childAgreesWithPlan: boolean;

  @Column({ type: 'text', nullable: true })
  childDisagreementDetails: string;

  // ========================================
  // PARENTS AND FAMILY
  // ========================================

  @Column({ type: 'boolean', default: false })
  parentsConsulted: boolean;

  @Column({ type: 'text', nullable: true })
  parentViews: string;

  @Column({ type: 'text', nullable: true })
  parentAgreements: string;

  @Column({ type: 'text', nullable: true })
  parentDisagreements: string;

  @Column({ type: 'text', nullable: true })
  familyContactArrangements: string;

  @Column({ type: 'text', nullable: true })
  workWithParents: string;

  @Column({ type: 'text', nullable: true })
  assessmentOfParentingCapacity: string;

  @Column({ type: 'text', nullable: true })
  supportForParents: string;

  // ========================================
  // PLACEMENT PLAN
  // ========================================

  @Column({ type: 'varchar', nullable: true })
  currentPlacementType: string;

  @Column({ type: 'text', nullable: true })
  placementObjectives: string;

  @Column({ type: 'text', nullable: true })
  reasonForPlacement: string;

  @Column({ type: 'text', nullable: true })
  placementExpectedDuration: string;

  @Column({ type: 'text', nullable: true })
  placementAlternatives: string;

  @Column({ type: 'boolean', default: false })
  siblingPlacementConsidered: boolean;

  @Column({ type: 'text', nullable: true })
  siblingPlacementDetails: string;

  // ========================================
  // HEALTH PLAN
  // ========================================

  @Column({ type: 'text', nullable: true })
  healthNeeds: string;

  @Column({ type: 'text', nullable: true })
  healthGoals: string;

  @Column({ type: 'text', nullable: true })
  healthInterventions: string;

  @Column({ type: 'date', nullable: true })
  lastHealthAssessment: Date;

  @Column({ type: 'date', nullable: true })
  nextHealthAssessment: Date;

  @Column({ type: 'text', nullable: true })
  ongoingHealthSupport: string;

  @Column({ type: 'text', nullable: true })
  mentalHealthSupport: string;

  @Column({ type: 'text', nullable: true })
  substanceMisuseSupport: string;

  // ========================================
  // EDUCATION PLAN
  // ========================================

  @Column({ type: 'text', nullable: true })
  educationNeeds: string;

  @Column({ type: 'text', nullable: true })
  educationGoals: string;

  @Column({ type: 'text', nullable: true })
  educationInterventions: string;

  @Column({ type: 'varchar', nullable: true })
  currentSchool: string;

  @Column({ type: 'varchar', nullable: true })
  designatedTeacher: string;

  @Column({ type: 'boolean', default: false })
  hasPEP: boolean;

  @Column({ type: 'date', nullable: true })
  lastPEPReview: Date;

  @Column({ type: 'date', nullable: true })
  nextPEPReview: Date;

  @Column({ type: 'text', nullable: true })
  educationSupport: string;

  // ========================================
  // EMOTIONAL AND BEHAVIOURAL DEVELOPMENT
  // ========================================

  @Column({ type: 'text', nullable: true })
  emotionalNeeds: string;

  @Column({ type: 'text', nullable: true })
  behaviouralNeeds: string;

  @Column({ type: 'text', nullable: true })
  therapeuticInterventions: string;

  @Column({ type: 'text', nullable: true })
  attachmentSupport: string;

  @Column({ type: 'text', nullable: true })
  traumaInformedSupport: string;

  // ========================================
  // IDENTITY, CULTURE AND RELIGION
  // ========================================

  @Column({ type: 'text', nullable: true })
  culturalNeeds: string;

  @Column({ type: 'text', nullable: true })
  religiousNeeds: string;

  @Column({ type: 'text', nullable: true })
  languageNeeds: string;

  @Column({ type: 'text', nullable: true })
  identitySupport: string;

  @Column({ type: 'text', nullable: true })
  heritageWork: string;

  @Column({ type: 'text', nullable: true })
  culturalActivities: string;

  // ========================================
  // SOCIAL AND FAMILY RELATIONSHIPS
  // ========================================

  @Column({ type: 'text', nullable: true })
  socialRelationshipNeeds: string;

  @Column({ type: 'text', nullable: true })
  friendshipSupport: string;

  @Column({ type: 'text', nullable: true })
  familyRelationshipWork: string;

  @Column({ type: 'text', nullable: true })
  peerSupport: string;

  @Column({ type: 'text', nullable: true })
  communityIntegration: string;

  // ========================================
  // SELF-CARE AND INDEPENDENCE
  // ========================================

  @Column({ type: 'text', nullable: true })
  independenceLivingSkills: string;

  @Column({ type: 'text', nullable: true })
  selfCareNeeds: string;

  @Column({ type: 'text', nullable: true })
  independenceGoals: string;

  @Column({ type: 'text', nullable: true })
  lifeSkillsTraining: string;

  // ========================================
  // MULTI-AGENCY WORKING
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  agenciesInvolved: Array<{
    agencyName: string;
    role: string;
    contactPerson: string;
    contactDetails: string;
    responsibilities: string;
  }>;

  @Column({ type: 'text', nullable: true })
  multiAgencyCoordination: string;

  @Column({ type: 'text', nullable: true })
  informationSharingArrangements: string;

  // ========================================
  // CONTINGENCY PLANNING
  // ========================================

  @Column({ type: 'text', nullable: true })
  contingencyArrangements: string;

  @Column({ type: 'text', nullable: true })
  placementBreakdownPlan: string;

  @Column({ type: 'text', nullable: true })
  emergencyContactArrangements: string;

  @Column({ type: 'text', nullable: true })
  crisisManagementPlan: string;

  // ========================================
  // REVIEW AND MONITORING
  // ========================================

  @Column({ type: 'date', nullable: true })
  lastReviewDate: Date;

  @Column({ type: 'date' })
  nextReviewDate: Date;

  @Column({ type: 'varchar', nullable: true })
  nextReviewType: string; // 'LAC_REVIEW', 'IRO_REVIEW', 'PLACEMENT_REVIEW'

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'text', nullable: true })
  reviewSchedule: string;

  @Column({ type: 'text', nullable: true })
  monitoringArrangements: string;

  @Column({ type: 'text', nullable: true })
  progressMeasures: string;

  // ========================================
  // IRO INVOLVEMENT
  // ========================================

  @Column({ type: 'varchar', nullable: true })
  independentReviewingOfficer: string;

  @Column({ type: 'varchar', nullable: true })
  iroContactDetails: string;

  @Column({ type: 'date', nullable: true })
  lastIROContact: Date;

  @Column({ type: 'text', nullable: true })
  iroConcerns: string;

  @Column({ type: 'text', nullable: true })
  iroRecommendations: string;

  @Column({ type: 'boolean', default: false })
  disputeResolutionRequired: boolean;

  @Column({ type: 'text', nullable: true })
  disputeResolutionDetails: string;

  // ========================================
  // PLAN APPROVAL
  // ========================================

  @Column({ type: 'boolean', default: false })
  planApproved: boolean;

  @Column({ type: 'varchar', nullable: true })
  approvedBy: string;

  @Column({ type: 'varchar', nullable: true })
  approverRole: string;

  @Column({ type: 'date', nullable: true })
  approvalDate: Date;

  @Column({ type: 'text', nullable: true })
  approvalComments: string;

  // ========================================
  // DISTRIBUTION
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  planDistributedTo: string[];

  @Column({ type: 'date', nullable: true })
  distributionDate: Date;

  @Column({ type: 'text', nullable: true })
  distributionNotes: string;

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
   * Check if care plan is currently active
   */
  isActive(): boolean {
    return this.status === CarePlanStatus.ACTIVE;
  }

  /**
   * Check if care plan review is overdue
   */
  isReviewOverdue(): boolean {
    if (!this.nextReviewDate) return false;
    return new Date(this.nextReviewDate) < new Date();
  }

  /**
   * Get days until next review
   */
  getDaysUntilNextReview(): number {
    if (!this.nextReviewDate) return 0;
    const today = new Date();
    const reviewDate = new Date(this.nextReviewDate);
    const diffTime = reviewDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if permanence goal is decided
   */
  hasPermanenceGoal(): boolean {
    return this.permanenceGoal !== PermanenceGoal.UNDECIDED;
  }

  /**
   * Check if child participated in plan
   */
  hasChildParticipation(): boolean {
    return (
      this.childViewsSought &&
      this.childParticipationLevel !== null &&
      this.childParticipationLevel !== ChildParticipationLevel.NONE
    );
  }

  /**
   * Get plan duration in days
   */
  getPlanDuration(): number {
    const start = new Date(this.planStartDate);
    const end = this.planEndDate ? new Date(this.planEndDate) : new Date();
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if plan requires urgent review
   */
  requiresUrgentReview(): boolean {
    return (
      this.disputeResolutionRequired ||
      this.isReviewOverdue() ||
      (this.iroConcerns !== null && this.iroConcerns.length > 0)
    );
  }

  /**
   * Get plan age in months
   */
  getPlanAgeMonths(): number {
    const start = new Date(this.planStartDate);
    const now = new Date();
    const months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());
    return months;
  }
}
