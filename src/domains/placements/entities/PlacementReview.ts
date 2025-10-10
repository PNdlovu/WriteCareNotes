/**
 * Placement Review Entity
 * Represents statutory placement reviews
 * Compliant with: OFSTED Regulation 12, Care Planning Regulations 2010
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
import { Placement } from './Placement';
import { Child } from '../../children/entities/Child';

export enum PlacementReviewType {
  INITIAL_72_HOUR = 'INITIAL_72_HOUR',
  FIRST_28_DAY = 'FIRST_28_DAY',
  THREE_MONTH = 'THREE_MONTH',
  SIX_MONTH = 'SIX_MONTH',
  ANNUAL = 'ANNUAL',
  UNSCHEDULED = 'UNSCHEDULED'
}

export enum ReviewOutcome {
  PLACEMENT_CONTINUES = 'PLACEMENT_CONTINUES',
  PLACEMENT_CONTINUES_WITH_CHANGES = 'PLACEMENT_CONTINUES_WITH_CHANGES',
  PLACEMENT_TO_END = 'PLACEMENT_TO_END',
  IMMEDIATE_SAFEGUARDING_ACTION = 'IMMEDIATE_SAFEGUARDING_ACTION'
}

@Entity('placement_reviews')
@Index(['placementId'])
@Index(['childId'])
@Index(['reviewDate'])
@Index(['reviewType'])
export class PlacementReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Placement and Child Reference
  @Column({ name: 'placement_id' })
  placementId: string;

  @ManyToOne(() => Placement)
  @JoinColumn({ name: 'placement_id' })
  placement: Placement;

  @Column({ name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  // Review Details
  @Column({ name: 'review_type', type: 'enum', enum: PlacementReviewType })
  reviewType: PlacementReviewType;

  @Column({ name: 'review_date', type: 'timestamp' })
  reviewDate: Date;

  @Column({ name: 'review_number', type: 'integer' })
  reviewNumber: number; // Sequential number for this placement

  @Column({ name: 'scheduled_date', type: 'timestamp' })
  scheduledDate: Date;

  @Column({ name: 'completed', type: 'boolean', default: false })
  completed: boolean;

  @Column({ name: 'completed_date', type: 'timestamp', nullable: true })
  completedDate?: Date;

  // Attendees
  @Column({ name: 'attendees', type: 'jsonb' })
  attendees: Array<{
    name: string;
    role: string;
    organization?: string;
    attended: boolean;
    apologies?: string;
  }>;

  @Column({ name: 'child_attended', type: 'boolean' })
  childAttended: boolean;

  @Column({ name: 'child_views_represented', type: 'boolean' })
  childViewsRepresented: boolean;

  @Column({ name: 'advocate_present', type: 'boolean', default: false })
  advocatePresent: boolean;

  // Child's Views
  @Column({ name: 'child_views', type: 'text', nullable: true })
  childViews?: string;

  @Column({ name: 'child_wishes', type: 'text', nullable: true })
  childWishes?: string;

  @Column({ name: 'child_concerns', type: 'text', nullable: true })
  childConcerns?: string;

  // Placement Progress Assessment
  @Column({ name: 'placement_going_well', type: 'jsonb' })
  placementGoingWell: {
    relationships: string;
    dailyRoutine: string;
    education: string;
    health: string;
    contact: string;
    overall: string;
  };

  @Column({ name: 'areas_of_concern', type: 'jsonb', nullable: true })
  areasOfConcern?: {
    behaviors?: string;
    relationships?: string;
    education?: string;
    health?: string;
    safety?: string;
    other?: string;
  };

  @Column({ name: 'incidents_since_last_review', type: 'integer', default: 0 })
  incidentsSinceLastReview: number;

  @Column({ name: 'missing_episodes_since_last_review', type: 'integer', default: 0 })
  missingEpisodesSinceLastReview: number;

  // Care Plan Progress
  @Column({ name: 'care_plan_goals_progress', type: 'jsonb' })
  carePlanGoalsProgress: Array<{
    goal: string;
    progress: 'NOT_STARTED' | 'IN_PROGRESS' | 'ACHIEVED' | 'NO_LONGER_RELEVANT';
    notes: string;
  }>;

  // Education Progress
  @Column({ name: 'education_progress', type: 'jsonb', nullable: true })
  educationProgress?: {
    attendance: string;
    attainment: string;
    behavior: string;
    pepUpToDate: boolean;
    senSupport: string;
    transitions?: string;
  };

  // Health and Wellbeing
  @Column({ name: 'health_wellbeing', type: 'jsonb', nullable: true })
  healthWellbeing?: {
    physicalHealth: string;
    mentalHealth: string;
    substanceMisuse?: string;
    healthAssessmentUpToDate: boolean;
    camhsSupport?: string;
    therapyProgress?: string;
  };

  // Relationships and Contact
  @Column({ name: 'relationships_contact', type: 'jsonb', nullable: true })
  relationshipsContact?: {
    familyContact: string;
    peerRelationships: string;
    staffRelationships: string;
    significantRelationships?: string;
    contactArrangementsWorking: boolean;
  };

  // Identity and Culture
  @Column({ name: 'identity_culture', type: 'jsonb', nullable: true })
  identityCulture?: {
    culturalNeedsMet: boolean;
    religiousNeedsMet: boolean;
    languageSupport?: string;
    identityDevelopment: string;
  };

  // Key Worker Assessment
  @Column({ name: 'key_worker_assessment', type: 'text' })
  keyWorkerAssessment: string;

  @Column({ name: 'key_worker_recommendations', type: 'text', nullable: true })
  keyWorkerRecommendations?: string;

  // Social Worker Assessment
  @Column({ name: 'social_worker_assessment', type: 'text', nullable: true })
  socialWorkerAssessment?: string;

  @Column({ name: 'social_worker_recommendations', type: 'text', nullable: true })
  socialWorkerRecommendations?: string;

  // Safeguarding
  @Column({ name: 'safeguarding_concerns', type: 'boolean', default: false })
  safeguardingConcerns: boolean;

  @Column({ name: 'safeguarding_details', type: 'text', nullable: true })
  safeguardingDetails?: string;

  @Column({ name: 'safeguarding_actions', type: 'jsonb', nullable: true })
  safeguardingActions?: Array<{
    action: string;
    responsible: string;
    deadline: Date;
  }>;

  // Review Outcome
  @Column({ name: 'outcome', type: 'enum', enum: ReviewOutcome, nullable: true })
  outcome?: ReviewOutcome;

  @Column({ name: 'outcome_reasons', type: 'text', nullable: true })
  outcomeReasons?: string;

  @Column({ name: 'placement_stability_rating', type: 'integer', nullable: true })
  placementStabilityRating?: number; // 1-10 scale

  // Actions and Recommendations
  @Column({ name: 'actions_agreed', type: 'jsonb', default: '[]' })
  actionsAgreed: Array<{
    action: string;
    responsible: string;
    deadline: Date;
    completed: boolean;
    completedDate?: Date;
  }>;

  @Column({ name: 'care_plan_updates_required', type: 'boolean', default: false })
  carePlanUpdatesRequired: boolean;

  @Column({ name: 'risk_assessment_updates_required', type: 'boolean', default: false })
  riskAssessmentUpdatesRequired: boolean;

  // Next Review
  @Column({ name: 'next_review_date', type: 'timestamp', nullable: true })
  nextReviewDate?: Date;

  @Column({ name: 'next_review_type', type: 'enum', enum: PlacementReviewType, nullable: true })
  nextReviewType?: PlacementReviewType;

  // Documents
  @Column({ name: 'review_documents', type: 'jsonb', default: '[]' })
  reviewDocuments: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: Date;
  }>;

  @Column({ name: 'review_notes_url', type: 'text', nullable: true })
  reviewNotesUrl?: string;

  // Distribution
  @Column({ name: 'review_distributed_to', type: 'jsonb', default: '[]' })
  reviewDistributedTo: Array<{
    name: string;
    role: string;
    email: string;
    sentDate: Date;
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

  @Column({ name: 'reviewed_by', length: 255, nullable: true })
  reviewedBy?: string;

  // Methods
  
  /**
   * Check if review is overdue
   */
  isOverdue(): boolean {
    if (this.completed) return false;
    return new Date() > this.scheduledDate;
  }

  /**
   * Calculate days overdue
   */
  getDaysOverdue(): number {
    if (!this.isOverdue()) return 0;
    
    const diffTime = new Date().getTime() - this.scheduledDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if safeguarding action required
   */
  requiresSafeguardingAction(): boolean {
    return this.outcome === ReviewOutcome.IMMEDIATE_SAFEGUARDING_ACTION ||
           (this.safeguardingConcerns && !!this.safeguardingActions);
  }

  /**
   * Get percentage of actions completed
   */
  getActionsCompletedPercentage(): number {
    if (this.actionsAgreed.length === 0) return 100;
    
    const completed = this.actionsAgreed.filter(a => a.completed).length;
    return Math.round((completed / this.actionsAgreed.length) * 100);
  }

  /**
   * Check if child's voice was heard
   */
  childVoiceHeard(): boolean {
    return this.childAttended || this.childViewsRepresented || this.advocatePresent;
  }
}
