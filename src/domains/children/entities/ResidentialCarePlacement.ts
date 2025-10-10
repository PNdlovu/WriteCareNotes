/**
 * Residential Care Placement Entity
 * 
 * MANAGES CHILDREN'S HOME PLACEMENTS (NOT FOSTER CARE)
 * 
 * RESIDENTIAL CARE TYPES:
 * - Children's Home (small group home)
 * - Secure Children's Home (locked facility)
 * - Residential School (education + residential care)
 * - Mother and Baby Unit
 * - Respite Care Home (short breaks)
 * 
 * COMPLIANCE:
 * - Children's Homes (England) Regulations 2015
 * - Children's Homes (Wales) Regulations 2002
 * - Residential Care and Supported Accommodation (Scotland) Regulations 2013
 * - Children's Homes Regulations (Northern Ireland) 1996
 * - OFSTED/Care Inspectorate inspection standards
 * 
 * KEY DIFFERENCES FROM FOSTER CARE:
 * - Professional care staff (not family-based)
 * - 24/7 shift-based staffing
 * - Group living environment
 * - Specific room assignments
 * - Peer group dynamics
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
import { Child } from './Child';

export enum ResidentialCareType {
  CHILDRENS_HOME = 'childrens_home',
  SECURE_HOME = 'secure_home',
  RESIDENTIAL_SCHOOL = 'residential_school',
  MOTHER_BABY_UNIT = 'mother_baby_unit',
  RESPITE_CARE = 'respite_care'
}

export enum PlacementStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  ENDED = 'ended',
  EMERGENCY = 'emergency'
}

export enum EndReason {
  TURNED_18 = 'turned_18',
  MOVED_TO_INDEPENDENT_LIVING = 'moved_to_independent_living',
  RETURNED_TO_FAMILY = 'returned_to_family',
  MOVED_TO_FOSTER_CARE = 'moved_to_foster_care',
  MOVED_TO_ANOTHER_HOME = 'moved_to_another_home',
  SECURE_ACCOMMODATION = 'moved_to_secure',
  PLACEMENT_BREAKDOWN = 'placement_breakdown',
  OTHER = 'other'
}

@Entity('residential_care_placements')
export class ResidentialCarePlacement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  childId!: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== CARE HOME DETAILS ====================

  @Column({ type: 'uuid' })
  careHomeId!: string; // Links to CareHome entity

  @Column({ type: 'varchar', length: 200 })
  careHomeName!: string;

  @Column({ type: 'varchar', length: 50 })
  careHomeType!: ResidentialCareType;

  @Column({ type: 'text' })
  careHomeAddress!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  careHomePostcode?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  careHomeLocalAuthority?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ofstedRegistrationNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ofstedRating?: string; // Outstanding, Good, Requires Improvement, Inadequate

  // ==================== ROOM ASSIGNMENT ====================

  @Column({ type: 'varchar', length: 50, nullable: true })
  roomNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roomType?: string; // single, shared, ensuite

  @Column({ type: 'int', nullable: true })
  floor?: number;

  @Column({ type: 'boolean', default: false })
  ensuiteRoom!: boolean;

  @Column({ type: 'boolean', default: false })
  accessibleRoom!: boolean; // Wheelchair accessible

  // ==================== PLACEMENT DATES ====================

  @Column({ type: 'timestamptz' })
  startDate!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate?: Date;

  @Column({ type: 'varchar', length: 50, default: PlacementStatus.PLANNED })
  status!: PlacementStatus;

  @Column({ type: 'boolean', default: false })
  isEmergencyPlacement!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  plannedEndDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  endReason?: EndReason;

  @Column({ type: 'text', nullable: true })
  endReasonDetails?: string;

  // ==================== CAPACITY & STAFFING ====================

  @Column({ type: 'int', default: 6 })
  homeCapacity!: number; // Total beds in home

  @Column({ type: 'int', default: 0 })
  currentOccupancy!: number; // Current number of children

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 3.0 })
  staffChildRatio!: number; // e.g., 3.0 means 3 staff per child

  @Column({ type: 'boolean', default: true })
  has24HourCare!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registeredManager?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  registeredManagerContact?: string;

  // ==================== KEY WORKER ====================

  @Column({ type: 'uuid', nullable: true })
  keyWorkerId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  keyWorkerName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  keyWorkerEmail?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  keyWorkerPhone?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deputyKeyWorkerName?: string;

  // ==================== PEER GROUP ====================

  @Column({ type: 'jsonb', nullable: true })
  peerGroup?: Array<{
    childId: string;
    firstName: string;
    age: number;
    gender: string;
    relationshipQuality: string; // positive, neutral, conflict
  }>;

  @Column({ type: 'int', default: 0 })
  numberOfPeers!: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  peerGroupAgeRange?: string; // e.g., "12-15"

  @Column({ type: 'boolean', default: false })
  mixedGenderHome!: boolean;

  // ==================== PLACEMENT STABILITY ====================

  @Column({ type: 'int', default: 0 })
  numberOfPreviousPlacementBreakdowns!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  placementStabilityRating?: string; // stable, at_risk, breaking_down

  @Column({ type: 'jsonb', nullable: true })
  stabilityIndicators?: {
    schoolAttendance: string;
    behaviorIncidents: number;
    relationships: string;
    participation: string;
  };

  // ==================== REGULATIONS & COMPLIANCE ====================

  @Column({ type: 'boolean', default: false })
  regulation25Restriction!: boolean; // Deprivation of liberty

  @Column({ type: 'text', nullable: true })
  regulation25Details?: string;

  @Column({ type: 'timestamptz', nullable: true })
  regulation25ReviewDate?: Date;

  @Column({ type: 'boolean', default: false })
  secureAccommodationOrder!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  secureOrderExpiryDate?: Date;

  // ==================== PLACEMENT PLAN ====================

  @Column({ type: 'text', nullable: true })
  placementPurpose?: string; // Why this placement

  @Column({ type: 'jsonb', nullable: true })
  placementObjectives?: string[]; // What child should achieve

  @Column({ type: 'varchar', length: 50, nullable: true })
  expectedDuration?: string; // short_term, medium_term, long_term

  @Column({ type: 'text', nullable: true })
  exitStrategy?: string; // Plan for when placement ends

  // ==================== CONTACT & VISITS ====================

  @Column({ type: 'jsonb', nullable: true })
  visitingArrangements?: {
    familyVisits: string;
    friendVisits: string;
    overnightStays: boolean;
    restrictions: string[];
  };

  @Column({ type: 'boolean', default: true })
  canHaveOvernightVisitors!: boolean;

  @Column({ type: 'boolean', default: true })
  canLeaveHomeUnaccompanied!: boolean;

  // ==================== FINANCIAL ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  weeklyPlacementCost!: number; // Cost per week

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  weeklyPocketMoney!: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fundingLocalAuthority?: string; // Who pays

  // ==================== SAFEGUARDING ====================

  @Column({ type: 'jsonb', nullable: true })
  riskAssessment?: {
    riskToSelf: string;
    riskToOthers: string;
    riskFromOthers: string;
    mitigationMeasures: string[];
  };

  @Column({ type: 'boolean', default: false })
  requiresSingleOccupancyHome!: boolean; // Cannot share with other children

  @Column({ type: 'text', nullable: true })
  specialSupervisionNeeds?: string;

  // ==================== REVIEWS ====================

  @Column({ type: 'timestamptz', nullable: true })
  lastReviewDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextReviewDate?: Date;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reviewOutcome?: string; // placement_continues, placement_ends, changes_needed

  @Column({ type: 'text', nullable: true })
  reviewNotes?: string;

  // ==================== AUDIT ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // ==================== METHODS ====================

  /**
   * Calculate placement duration in days
   */
  get placementDurationDays(): number {
    const end = this.endDate || new Date();
    const diff = end.getTime() - this.startDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if placement is long-term (>2 years)
   */
  get isLongTermPlacement(): boolean {
    return this.placementDurationDays > 730; // 2 years
  }

  /**
   * Check if review is overdue
   */
  get isReviewOverdue(): boolean {
    if (!this.nextReviewDate) return false;
    return new Date() > this.nextReviewDate;
  }

  /**
   * Check if placement is at risk
   */
  get isAtRisk(): boolean {
    return (
      this.placementStabilityRating === 'at_risk' ||
      this.placementStabilityRating === 'breaking_down' ||
      this.numberOfPreviousPlacementBreakdowns > 2
    );
  }

  /**
   * Calculate child's age when placement started
   */
  get ageAtPlacementStart(): number {
    // This would calculate based on child's DOB
    // Implementation depends on Child entity relationship
    return 0; // Placeholder
  }
}
