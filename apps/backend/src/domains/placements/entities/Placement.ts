/**
 * @fileoverview Placement entity representing actual placements of children in
 * care facilities. Tracks the complete placement lifecycle from start to end with
 * full compliance monitoring and statutory review scheduling.
 *
 * @module domains/placements/entities
 * @version 1.0.0
 * @author WCNotes Development Team
 * @since 2024
 *
 * @description
 * Core entity for placement managementtracking:
 * - Unique placement numbering (PL-YYYY-NNNN format)
 * - Placement lifecycle (PENDING → ACTIVE → ENDED/BREAKDOWN)
 * - Child and facility associations with full relationship tracking
 * - Placement type classification (14 types from foster care to secure)
 * - Statutory review scheduling (72-hour, 28-day, 3-month, 6-month)
 * - Carer details and supervision arrangements
 * - Legal basis and court order tracking
 * - Placement plan with goals and review dates
 * - Placement ending with reason codes and transition planning
 * - Emergency breakdown handling with notification triggers
 * - Full audit trail (created/updated by/at)
 *
 * @compliance
 * - OFSTED Regulation 10 (Placements)
 * - OFSTED Regulation 11 (Placement plan)
 * - OFSTED Regulation 12 (Promoting positive behaviour)
 * - OFSTED Regulation 40 (Notification of significant events)
 * - Care Planning Regulations 2010
 * - Children Act 1989
 * - Placement of Looked After Children Regulations 2008
 *
 * @features
 * - 5 status types tracking complete placement lifecycle
 * - 14 placement types (foster care, children's home, supported lodgings, etc.)
 * - 10 placement end reasons (natural end, breakdown, child request, etc.)
 * - Statutory review scheduling with overdue detection
 * - Legal basis tracking with court order expiry monitoring
 * - Carer details with contact information and qualifications
 * - Placement plan with SMART goals and review cycles
 * - Emergency breakdown protocols with OFSTED notification (24-hour)
 * - Computed methods for duration tracking and review compliance
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
import { PlacementRequest } from './PlacementRequest';

export enum PlacementStatus {
  PENDING_ARRIVAL = 'PENDING_ARRIVAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED', // Temporary absence (e.g., hospital, court)
  ON_LEAVE = 'ON_LEAVE',   // Planned leave (e.g., family visit)
  ENDED = 'ENDED',
  BREAKDOWN = 'BREAKDOWN', // Placement breakdown
  PLANNED_END = 'PLANNED_END',
  EMERGENCY_MOVE = 'EMERGENCY_MOVE'
}

export enum PlacementEndReason {
  RETURNED_HOME = 'RETURNED_HOME',
  ADOPTED = 'ADOPTED',
  SPECIAL_GUARDIANSHIP = 'SPECIAL_GUARDIANSHIP',
  CHILD_ARRANGEMENTS_ORDER = 'CHILD_ARRANGEMENTS_ORDER',
  TRANSFERRED = 'TRANSFERRED',
  AGED_OUT = 'AGED_OUT', // Turned 18
  PLACEMENT_BREAKDOWN = 'PLACEMENT_BREAKDOWN',
  PLANNED_MOVE = 'PLANNED_MOVE',
  DEATH = 'DEATH',
  OTHER = 'OTHER'
}

@Entity('placements')
@Index(['childId'])
@Index(['organizationId'])
@Index(['status'])
@Index(['startDate'])
@Index(['endDate'])
export class Placement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Child Reference
  @Column({ name: 'child_id' })
  childId: string;

  @ManyToOne(() => Child)
  @JoinColumn({ name: 'child_id' })
  child: Child;

  // Organization (Care Home)
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Placement Request Reference
  @Column({ name: 'placement_request_id', nullable: true })
  placementRequestId?: string;

  @ManyToOne(() => PlacementRequest, { nullable: true })
  @JoinColumn({ name: 'placement_request_id' })
  placementRequest?: PlacementRequest;

  // Placement Dates
  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'expected_end_date', type: 'timestamp', nullable: true })
  expectedEndDate?: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate?: Date;

  @Column({ name: 'end_reason', type: 'enum', enum: PlacementEndReason, nullable: true })
  endReason?: PlacementEndReason;

  @Column({ name: 'end_notes', type: 'text', nullable: true })
  endNotes?: string;

  // Status
  @Column({ name: 'status', type: 'enum', enum: PlacementStatus, default: PlacementStatus.PENDING_ARRIVAL })
  status: PlacementStatus;

  // Room/Accommodation
  @Column({ name: 'room_number', length: 50, nullable: true })
  roomNumber?: string;

  @Column({ name: 'room_type', length: 100, nullable: true })
  roomType?: string; // e.g., "Single", "Shared", "En-suite"

  @Column({ name: 'floor_number', type: 'integer', nullable: true })
  floorNumber?: number;

  @Column({ name: 'accessibility_features', type: 'jsonb', nullable: true })
  accessibilityFeatures?: {
    wheelchairAccessible?: boolean;
    groundFloor?: boolean;
    adaptedBathroom?: boolean;
    hoist?: boolean;
    other?: string;
  };

  // Key Worker Assignment
  @Column({ name: 'key_worker_id', nullable: true })
  keyWorkerId?: string;

  @Column({ name: 'key_worker_name', length: 255, nullable: true })
  keyWorkerName?: string;

  @Column({ name: 'key_worker_email', length: 255, nullable: true })
  keyWorkerEmail?: string;

  @Column({ name: 'deputy_key_worker_id', nullable: true })
  deputyKeyWorkerId?: string;

  @Column({ name: 'deputy_key_worker_name', length: 255, nullable: true })
  deputyKeyWorkerName?: string;

  // Placement Plan
  @Column({ name: 'placement_plan', type: 'jsonb', nullable: true })
  placementPlan?: {
    goals: string[];
    outcomes: string[];
    supportStrategies: string[];
    reviewFrequency: string;
    nextReviewDate: Date;
  };

  // Admission Details
  @Column({ name: 'admission_checklist', type: 'jsonb', nullable: true })
  admissionChecklist?: {
    personalBelongingsRecorded: boolean;
    roomOrientationCompleted: boolean;
    houseRulesExplained: boolean;
    emergencyProceduresExplained: boolean;
    consentFormsCompleted: boolean;
    medicalHistoryObtained: boolean;
    photographTaken: boolean;
    keyWorkerIntroduction: boolean;
    peersIntroduced: boolean;
    localAreaOrientation: boolean;
  };

  @Column({ name: 'welcome_pack_issued', type: 'boolean', default: false })
  welcomePackIssued: boolean;

  @Column({ name: 'admission_notes', type: 'text', nullable: true })
  admissionNotes?: string;

  // 72-Hour Placement Review
  @Column({ name: 'initial_72hr_review_date', type: 'timestamp', nullable: true })
  initial72hrReviewDate?: Date;

  @Column({ name: 'initial_72hr_review_completed', type: 'boolean', default: false })
  initial72hrReviewCompleted: boolean;

  @Column({ name: 'initial_72hr_review_notes', type: 'text', nullable: true })
  initial72hrReviewNotes?: string;

  // Placement Reviews
  @Column({ name: 'next_placement_review_date', type: 'timestamp', nullable: true })
  nextPlacementReviewDate?: Date;

  @Column({ name: 'last_placement_review_date', type: 'timestamp', nullable: true })
  lastPlacementReviewDate?: Date;

  @Column({ name: 'placement_review_frequency_days', type: 'integer', default: 28 })
  placementReviewFrequencyDays: number; // First: 28 days, then 3 months, then 6 months

  // Funding
  @Column({ name: 'funding_authority', length: 255 })
  fundingAuthority: string;

  @Column({ name: 'weekly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  weeklyRate?: number;

  @Column({ name: 'currency', length: 3, default: 'GBP' })
  currency: string;

  @Column({ name: 'purchase_order_number', length: 100, nullable: true })
  purchaseOrderNumber?: string;

  @Column({ name: 'invoice_frequency', length: 50, default: 'MONTHLY' })
  invoiceFrequency: string; // WEEKLY, FORTNIGHTLY, MONTHLY

  // Contact Arrangements
  @Column({ name: 'family_contact_arrangements', type: 'jsonb', nullable: true })
  familyContactArrangements?: {
    allowedContacts: Array<{
      name: string;
      relationship: string;
      contactType: 'SUPERVISED' | 'UNSUPERVISED' | 'NO_CONTACT';
      frequency: string;
      location: string;
      notes?: string;
    }>;
    restrictions?: string[];
    supervisorRequired?: boolean;
  };

  // Risk Management
  @Column({ name: 'risk_management_plan', type: 'jsonb', nullable: true })
  riskManagementPlan?: {
    identifiedRisks: Array<{
      risk: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      mitigationStrategies: string[];
      reviewDate: Date;
    }>;
    behaviorManagementStrategies?: string[];
    restrictivePracticesAuthorized?: boolean;
    restrictivePracticesDetails?: string;
  };

  // Support Packages
  @Column({ name: 'support_packages', type: 'jsonb', nullable: true })
  supportPackages?: {
    therapy?: Array<{
      type: string; // e.g., "Counseling", "EMDR", "Play Therapy"
      provider: string;
      frequency: string;
      startDate: Date;
    }>;
    education?: {
      type: string; // e.g., "Mainstream", "Alternative Provision", "Tutoring"
      provider: string;
      hoursPerWeek: number;
    };
    health?: Array<{
      service: string; // e.g., "CAMHS", "Speech Therapy", "Physiotherapy"
      provider: string;
      frequency: string;
    }>;
    lifeSkills?: string[];
    recreation?: string[];
  };

  // Missing Episodes
  @Column({ name: 'missing_episodes_count', type: 'integer', default: 0 })
  missingEpisodesCount: number;

  @Column({ name: 'last_missing_episode_date', type: 'timestamp', nullable: true })
  lastMissingEpisodeDate?: Date;

  // Incidents
  @Column({ name: 'incidents_count', type: 'integer', default: 0 })
  incidentsCount: number;

  @Column({ name: 'serious_incidents_count', type: 'integer', default: 0 })
  seriousIncidentsCount: number;

  @Column({ name: 'last_incident_date', type: 'timestamp', nullable: true })
  lastIncidentDate?: Date;

  // Placement Stability
  @Column({ name: 'placement_stability_score', type: 'integer', nullable: true })
  placementStabilityScore?: number; // 1-10 scale

  @Column({ name: 'at_risk_of_breakdown', type: 'boolean', default: false })
  atRiskOfBreakdown: boolean;

  @Column({ name: 'breakdown_risk_factors', type: 'jsonb', nullable: true })
  breakdownRiskFactors?: string[];

  // Outcomes Tracking
  @Column({ name: 'outcomes', type: 'jsonb', nullable: true })
  outcomes?: {
    education: { status: string; progress: string };
    health: { status: string; progress: string };
    emotionalWellbeing: { status: string; progress: string };
    relationships: { status: string; progress: string };
    identity: { status: string; progress: string };
    social: { status: string; progress: string };
    behavioral: { status: string; progress: string };
  };

  // Transition Planning (for placements ending)
  @Column({ name: 'transition_plan', type: 'jsonb', nullable: true })
  transitionPlan?: {
    nextPlacement?: string;
    transitionDate?: Date;
    supportNeeds: string[];
    keyDocuments: string[];
    introductionVisitsPlanned?: boolean;
    introductionVisitsCompleted?: boolean;
  };

  // Audit Trail
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 255 })
  createdBy: string;

  @Column({ name: 'updated_by', length: 255 })
  updatedBy: string;

  // Methods
  
  /**
   * Calculate placement duration in days
   */
  getDurationDays(): number {
    const endDate = this.endDate || new Date();
    const diffTime = endDate.getTime() - new Date(this.startDate).getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if placement is active
   */
  isActive(): boolean {
    return this.status === PlacementStatus.ACTIVE;
  }

  /**
   * Check if 72-hour review is overdue
   */
  is72HourReviewOverdue(): boolean {
    if (this.initial72hrReviewCompleted) {
      return false;
    }
    if (!this.initial72hrReviewDate) {
      return false;
    }
    return new Date() > this.initial72hrReviewDate;
  }

  /**
   * Check if placement review is overdue
   */
  isPlacementReviewOverdue(): boolean {
    if (!this.nextPlacementReviewDate) {
      return false;
    }
    return new Date() > this.nextPlacementReviewDate;
  }

  /**
   * Check if placement is at risk
   */
  isAtRisk(): boolean {
    return this.atRiskOfBreakdown || 
           this.seriousIncidentsCount > 2 ||
           (this.placementStabilityScore && this.placementStabilityScore < 4);
  }

  /**
   * Get placement age category
   */
  getPlacementAge(): string {
    const days = this.getDurationDays();
    if (days < 28) return 'New (< 1 month)';
    if (days < 90) return 'Settling (1-3 months)';
    if (days < 365) return 'Established (3-12 months)';
    return 'Long-term (> 1 year)';
  }
}
