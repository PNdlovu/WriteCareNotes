/**
 * ============================================================================
 * Pathway Plan Entity
 * ============================================================================
 * 
 * @fileoverview Pathway plan entity for care leavers and young people 16+.
 * 
 * @module domains/leavingcare/entities/PathwayPlan
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents a pathway plan for young people aged 16+ who are leaving care or
 * have left care. Pathway plans are statutory requirements under the Children
 * (Leaving Care) Act 2000 and must cover accommodation, education, employment,
 * health, relationships, practical skills, and financial support.
 * 
 * @compliance
 * - Children (Leaving Care) Act 2000
 * - Care Leavers (England) Regulations 2010
 * - Children and Social Work Act 2017
 * - OFSTED Regulation 6 (Pathway plans)
 * - Volume 3: Planning Transition to Adulthood
 * 
 * @features
 * - Comprehensive needs assessment
 * - Multi-domain planning (accommodation, education, health, etc.)
 * - Personal advisor assignment
 * - Independent living skills tracking
 * - Financial support planning
 * - Progress monitoring and reviews
 * - Young person participation
 * - Transition planning to adulthood
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
import { Organization } from '../../../entities/Organization';

// ========================================
// ENUMERATIONS
// ========================================

export enum PathwayPlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  UNDER_REVIEW = 'UNDER_REVIEW',
  EXPIRED = 'EXPIRED',
  SUPERSEDED = 'SUPERSEDED',
  COMPLETED = 'COMPLETED'
}

export enum LeavingCareStatus {
  ELIGIBLE = 'ELIGIBLE', // 16-17 in care for 13+ weeks from age 14
  RELEVANT = 'RELEVANT', // 16-17 who have left care
  FORMER_RELEVANT = 'FORMER_RELEVANT', // 18-25 (or 21) who were eligible/relevant
  QUALIFYING = 'QUALIFYING', // Under 21 (or 25) in care but under 13 weeks
  STAYING_PUT = 'STAYING_PUT' // 18+ remaining with foster carers
}

export enum AccommodationType {
  STAYING_PUT = 'STAYING_PUT',
  SUPPORTED_LODGINGS = 'SUPPORTED_LODGINGS',
  INDEPENDENT_FLAT = 'INDEPENDENT_FLAT',
  SHARED_ACCOMMODATION = 'SHARED_ACCOMMODATION',
  FOYER = 'FOYER',
  SEMI_INDEPENDENT = 'SEMI_INDEPENDENT',
  RESIDENTIAL_CARE = 'RESIDENTIAL_CARE',
  WITH_FAMILY = 'WITH_FAMILY',
  HOMELESS = 'HOMELESS',
  CUSTODY = 'CUSTODY',
  OTHER = 'OTHER'
}

export enum EducationEmploymentStatus {
  IN_EDUCATION = 'IN_EDUCATION',
  IN_TRAINING = 'IN_TRAINING',
  EMPLOYED = 'EMPLOYED',
  APPRENTICESHIP = 'APPRENTICESHIP',
  NEET = 'NEET', // Not in Education, Employment or Training
  SEEKING_WORK = 'SEEKING_WORK',
  NOT_AVAILABLE = 'NOT_AVAILABLE'
}

// ========================================
// PATHWAY PLAN ENTITY
// ========================================

@Entity('pathway_plans')
export class PathwayPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'varchar', unique: true })
  pathwayPlanNumber: string; // Format: PP-YYYY-NNNN

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
    enum: PathwayPlanStatus,
    default: PathwayPlanStatus.DRAFT
  })
  status: PathwayPlanStatus;

  @Column({
    type: 'enum',
    enum: LeavingCareStatus
  })
  leavingCareStatus: LeavingCareStatus;

  @Column({ type: 'date' })
  planStartDate: Date;

  @Column({ type: 'date', nullable: true })
  planEndDate: Date;

  @Column({ type: 'int', default: 1 })
  version: number;

  // ========================================
  // PERSONAL ADVISOR
  // ========================================

  @Column({ type: 'varchar' })
  personalAdvisor: string;

  @Column({ type: 'varchar', nullable: true })
  personalAdvisorEmail: string;

  @Column({ type: 'varchar', nullable: true })
  personalAdvisorPhone: string;

  @Column({ type: 'date', nullable: true })
  personalAdvisorAssignedDate: Date;

  @Column({ type: 'varchar', nullable: true })
  previousPersonalAdvisor: string;

  @Column({ type: 'date', nullable: true })
  lastContactWithPA: Date;

  @Column({ type: 'varchar', nullable: true })
  contactFrequency: string;

  // ========================================
  // YOUNG PERSON'S VIEWS
  // ========================================

  @Column({ type: 'boolean', default: false })
  youngPersonParticipated: boolean;

  @Column({ type: 'text', nullable: true })
  youngPersonViews: string;

  @Column({ type: 'text', nullable: true })
  youngPersonAspirations: string;

  @Column({ type: 'text', nullable: true })
  youngPersonConcerns: string;

  @Column({ type: 'boolean', nullable: true })
  youngPersonAgreesWithPlan: boolean;

  @Column({ type: 'text', nullable: true })
  youngPersonDisagreements: string;

  @Column({ type: 'text', nullable: true })
  advocacySupport: string;

  // ========================================
  // ACCOMMODATION
  // ========================================

  @Column({
    type: 'enum',
    enum: AccommodationType,
    nullable: true
  })
  currentAccommodation: AccommodationType;

  @Column({ type: 'text', nullable: true })
  currentAccommodationAddress: string;

  @Column({ type: 'boolean', nullable: true })
  accommodationSuitable: boolean;

  @Column({ type: 'text', nullable: true })
  accommodationSuitabilityNotes: string;

  @Column({
    type: 'enum',
    enum: AccommodationType,
    nullable: true
  })
  plannedAccommodation: AccommodationType;

  @Column({ type: 'date', nullable: true })
  plannedMoveDate: Date;

  @Column({ type: 'text', nullable: true })
  accommodationGoals: string;

  @Column({ type: 'text', nullable: true })
  accommodationSupport: string;

  @Column({ type: 'number', nullable: true })
  housingBenefitAmount: number;

  @Column({ type: 'number', nullable: true })
  rentAmount: number;

  @Column({ type: 'boolean', default: false })
  settingUpHomeGrantReceived: boolean;

  @Column({ type: 'number', nullable: true })
  settingUpHomeGrantAmount: number;

  // ========================================
  // EDUCATION AND EMPLOYMENT
  // ========================================

  @Column({
    type: 'enum',
    enum: EducationEmploymentStatus,
    nullable: true
  })
  currentEETStatus: EducationEmploymentStatus;

  @Column({ type: 'varchar', nullable: true })
  currentEducationProvider: string;

  @Column({ type: 'varchar', nullable: true })
  currentCourse: string;

  @Column({ type: 'varchar', nullable: true })
  currentEmployer: string;

  @Column({ type: 'varchar', nullable: true })
  currentJobTitle: string;

  @Column({ type: 'text', nullable: true })
  educationGoals: string;

  @Column({ type: 'text', nullable: true })
  employmentGoals: string;

  @Column({ type: 'text', nullable: true })
  careerAspirations: string;

  @Column({ type: 'text', nullable: true })
  educationSupport: string;

  @Column({ type: 'text', nullable: true })
  employmentSupport: string;

  @Column({ type: 'boolean', default: false })
  inHigherEducation: boolean;

  @Column({ type: 'number', nullable: true })
  bursaryAmount: number;

  @Column({ type: 'boolean', default: false })
  hasPersonalEducationAllowance: boolean;

  // ========================================
  // HEALTH AND WELLBEING
  // ========================================

  @Column({ type: 'text', nullable: true })
  healthNeeds: string;

  @Column({ type: 'text', nullable: true })
  mentalHealthNeeds: string;

  @Column({ type: 'text', nullable: true })
  substanceMisuseSupport: string;

  @Column({ type: 'text', nullable: true })
  healthGoals: string;

  @Column({ type: 'text', nullable: true })
  healthSupport: string;

  @Column({ type: 'boolean', default: false })
  registeredWithGP: boolean;

  @Column({ type: 'varchar', nullable: true })
  gpName: string;

  @Column({ type: 'varchar', nullable: true })
  gpAddress: string;

  @Column({ type: 'boolean', default: false })
  registeredWithDentist: boolean;

  @Column({ type: 'boolean', default: false })
  hasHealthPassport: boolean;

  @Column({ type: 'date', nullable: true })
  lastHealthAssessment: Date;

  // ========================================
  // RELATIONSHIPS AND SOCIAL NETWORKS
  // ========================================

  @Column({ type: 'text', nullable: true })
  familyRelationships: string;

  @Column({ type: 'text', nullable: true })
  peerRelationships: string;

  @Column({ type: 'text', nullable: true })
  significantRelationships: string;

  @Column({ type: 'text', nullable: true })
  socialNetworkSupport: string;

  @Column({ type: 'text', nullable: true })
  relationshipGoals: string;

  @Column({ type: 'boolean', default: false })
  hasChildren: boolean;

  @Column({ type: 'int', nullable: true })
  numberOfChildren: number;

  @Column({ type: 'text', nullable: true })
  parentingSupport: string;

  // ========================================
  // PRACTICAL AND LIFE SKILLS
  // ========================================

  @Column({ type: 'text', nullable: true })
  cookingSkills: string;

  @Column({ type: 'text', nullable: true })
  budgetingSkills: string;

  @Column({ type: 'text', nullable: true })
  cleaningSkills: string;

  @Column({ type: 'text', nullable: true })
  personalCareSkills: string;

  @Column({ type: 'text', nullable: true })
  safetySkills: string;

  @Column({ type: 'text', nullable: true })
  travelSkills: string;

  @Column({ type: 'text', nullable: true })
  lifeSkillsGoals: string;

  @Column({ type: 'text', nullable: true })
  lifeSkillsTraining: string;

  @Column({ type: 'boolean', default: false })
  independentLivingAssessmentCompleted: boolean;

  @Column({ type: 'date', nullable: true })
  independentLivingAssessmentDate: Date;

  // ========================================
  // IDENTITY AND CULTURE
  // ========================================

  @Column({ type: 'text', nullable: true })
  culturalIdentity: string;

  @Column({ type: 'text', nullable: true })
  religiousBeliefs: string;

  @Column({ type: 'text', nullable: true })
  heritageWork: string;

  @Column({ type: 'text', nullable: true })
  identitySupport: string;

  @Column({ type: 'boolean', default: false })
  hasLifeStoryWork: boolean;

  @Column({ type: 'boolean', default: false })
  hasImportantDocuments: boolean;

  @Column({ type: 'text', nullable: true })
  documentsHeld: string;

  // ========================================
  // FINANCIAL SUPPORT
  // ========================================

  @Column({ type: 'number', nullable: true })
  weeklyAllowance: number;

  @Column({ type: 'boolean', default: false })
  receivingBenefits: boolean;

  @Column({ type: 'simple-json', nullable: true })
  benefitsReceived: Array<{
    benefitType: string;
    amount: number;
    frequency: string;
  }>;

  @Column({ type: 'number', nullable: true })
  totalMonthlyIncome: number;

  @Column({ type: 'text', nullable: true })
  financialGoals: string;

  @Column({ type: 'text', nullable: true })
  financialSupport: string;

  @Column({ type: 'boolean', default: false })
  hasBankAccount: boolean;

  @Column({ type: 'boolean', default: false })
  hasBudgetPlan: boolean;

  @Column({ type: 'number', nullable: true })
  debtsAmount: number;

  @Column({ type: 'text', nullable: true })
  debtSupport: string;

  // ========================================
  // CONTINGENCY PLANNING
  // ========================================

  @Column({ type: 'text', nullable: true })
  contingencyArrangements: string;

  @Column({ type: 'text', nullable: true })
  crisisPlan: string;

  @Column({ type: 'text', nullable: true })
  emergencyContacts: string;

  @Column({ type: 'text', nullable: true })
  accommodationBreakdownPlan: string;

  // ========================================
  // REVIEW AND MONITORING
  // ========================================

  @Column({ type: 'date', nullable: true })
  lastReviewDate: Date;

  @Column({ type: 'date' })
  nextReviewDate: Date;

  @Column({ type: 'int', default: 6 })
  reviewFrequencyMonths: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'text', nullable: true })
  progressSummary: string;

  @Column({ type: 'text', nullable: true })
  achievementsHighlighted: string;

  @Column({ type: 'text', nullable: true })
  areasForDevelopment: string;

  // ========================================
  // TRANSITION TO ADULTHOOD
  // ========================================

  @Column({ type: 'date', nullable: true })
  expectedLeavingCareDate: Date;

  @Column({ type: 'text', nullable: true })
  transitionPlan: string;

  @Column({ type: 'text', nullable: true })
  supportBeyond21: string;

  @Column({ type: 'boolean', default: false })
  eligibleForSupportTo25: boolean;

  @Column({ type: 'text', nullable: true })
  supportTo25Details: string;

  @Column({ type: 'text', nullable: true })
  localOfferDetails: string;

  // ========================================
  // MULTI-AGENCY INVOLVEMENT
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  agenciesInvolved: Array<{
    agencyName: string;
    role: string;
    contactPerson: string;
    contactDetails: string;
  }>;

  @Column({ type: 'text', nullable: true })
  multiAgencyCoordination: string;

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
   * Check if pathway plan is active
   */
  isActive(): boolean {
    return this.status === PathwayPlanStatus.ACTIVE;
  }

  /**
   * Check if review is overdue
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
   * Check if young person is in suitable accommodation
   */
  hasSuitableAccommodation(): boolean {
    return this.accommodationSuitable === true;
  }

  /**
   * Check if young person is in education, employment or training
   */
  isInEET(): boolean {
    return (
      this.currentEETStatus === EducationEmploymentStatus.IN_EDUCATION ||
      this.currentEETStatus === EducationEmploymentStatus.IN_TRAINING ||
      this.currentEETStatus === EducationEmploymentStatus.EMPLOYED ||
      this.currentEETStatus === EducationEmploymentStatus.APPRENTICESHIP
    );
  }

  /**
   * Check if young person has essential services
   */
  hasEssentialServices(): boolean {
    return this.registeredWithGP && this.hasBankAccount;
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

  /**
   * Check if plan requires urgent attention
   */
  requiresUrgentAttention(): boolean {
    return (
      this.isReviewOverdue() ||
      this.currentAccommodation === AccommodationType.HOMELESS ||
      this.currentEETStatus === EducationEmploymentStatus.NEET ||
      !this.hasSuitableAccommodation()
    );
  }
}
