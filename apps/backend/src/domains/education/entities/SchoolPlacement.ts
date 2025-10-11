/**
 * ============================================================================
 * School Placement Entity
 * ============================================================================
 * 
 * @fileoverview Entity representing school and educational placements for
 *               looked after children.
 * 
 * @module domains/education/entities/SchoolPlacement
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Tracks educational placements including mainstream schools, special schools,
 * alternative provision, colleges, and training. Monitors stability, transitions,
 * and ensures continuity of education as required by statutory guidance.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Education)
 * - Children Act 1989, Section 22(3A)
 * - Promoting the Education of Looked After Children 2018
 * - Education Act 1996
 * - Special Educational Needs Code of Practice 2015
 * 
 * @features
 * - Multi-type placement tracking (mainstream, special, PRU, college)
 * - Start/end date management
 * - Transition planning
 * - Exclusion monitoring
 * - Ofsted rating tracking
 * - Travel arrangements
 * - Emergency contact management
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

export enum PlacementType {
  MAINSTREAM_PRIMARY = 'MAINSTREAM_PRIMARY',
  MAINSTREAM_SECONDARY = 'MAINSTREAM_SECONDARY',
  SPECIAL_SCHOOL = 'SPECIAL_SCHOOL',
  PUPIL_REFERRAL_UNIT = 'PUPIL_REFERRAL_UNIT',
  ALTERNATIVE_PROVISION = 'ALTERNATIVE_PROVISION',
  SIXTH_FORM_COLLEGE = 'SIXTH_FORM_COLLEGE',
  FURTHER_EDUCATION_COLLEGE = 'FURTHER_EDUCATION_COLLEGE',
  APPRENTICESHIP = 'APPRENTICESHIP',
  TRAINING_PROVIDER = 'TRAINING_PROVIDER',
  HOME_EDUCATION = 'HOME_EDUCATION',
  NOT_IN_EDUCATION = 'NOT_IN_EDUCATION'
}

export enum PlacementStatus {
  ACTIVE = 'ACTIVE',
  PENDING_START = 'PENDING_START',
  ENDED = 'ENDED',
  SUSPENDED = 'SUSPENDED',
  AT_RISK = 'AT_RISK'
}

export enum OfstedRating {
  OUTSTANDING = 'OUTSTANDING',
  GOOD = 'GOOD',
  REQUIRES_IMPROVEMENT = 'REQUIRES_IMPROVEMENT',
  INADEQUATE = 'INADEQUATE',
  NOT_RATED = 'NOT_RATED'
}

@Entity('school_placements')
@Index(['childId'])
@Index(['status'])
@Index(['placementType'])
@Index(['startDate'])
export class SchoolPlacement {
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

  // Placement Details
  @Column({ name: 'placement_type', type: 'enum', enum: PlacementType })
  placementType: PlacementType;

  @Column({ name: 'status', type: 'enum', enum: PlacementStatus, default: PlacementStatus.ACTIVE })
  status: PlacementStatus;

  @Column({ name: 'start_date', type: 'timestamp' })
  startDate: Date;

  @Column({ name: 'expected_end_date', type: 'timestamp', nullable: true })
  expectedEndDate?: Date;

  @Column({ name: 'actual_end_date', type: 'timestamp', nullable: true })
  actualEndDate?: Date;

  @Column({ name: 'end_reason', type: 'text', nullable: true })
  endReason?: string;

  // School/Institution Details
  @Column({ name: 'institution_name', length: 255 })
  institutionName: string;

  @Column({ name: 'institution_address', type: 'text' })
  institutionAddress: string;

  @Column({ name: 'institution_postcode', length: 20 })
  institutionPostcode: string;

  @Column({ name: 'institution_phone', length: 50 })
  institutionPhone: string;

  @Column({ name: 'institution_email', length: 255 })
  institutionEmail: string;

  @Column({ name: 'institution_website', length: 255, nullable: true })
  institutionWebsite?: string;

  @Column({ name: 'institution_urn', length: 50, nullable: true })
  institutionURN?: string; // Unique Reference Number

  @Column({ name: 'ofsted_rating', type: 'enum', enum: OfstedRating, default: OfstedRating.NOT_RATED })
  ofstedRating: OfstedRating;

  @Column({ name: 'ofsted_report_date', type: 'timestamp', nullable: true })
  ofstedReportDate?: Date;

  @Column({ name: 'ofsted_report_url', length: 500, nullable: true })
  ofstedReportUrl?: string;

  // Key Contacts
  @Column({ name: 'headteacher_name', length: 255 })
  headteacherName: string;

  @Column({ name: 'designated_teacher_name', length: 255, nullable: true })
  designatedTeacherName?: string;

  @Column({ name: 'designated_teacher_email', length: 255, nullable: true })
  designatedTeacherEmail?: string;

  @Column({ name: 'designated_teacher_phone', length: 50, nullable: true })
  designatedTeacherPhone?: string;

  @Column({ name: 'senco_name', length: 255, nullable: true })
  sencoName?: string; // Special Educational Needs Coordinator

  @Column({ name: 'senco_email', length: 255, nullable: true })
  sencoEmail?: string;

  @Column({ name: 'senco_phone', length: 50, nullable: true })
  sencoPhone?: string;

  @Column({ name: 'pastoral_lead_name', length: 255, nullable: true })
  pastoralLeadName?: string;

  @Column({ name: 'pastoral_lead_email', length: 255, nullable: true })
  pastoralLeadEmail?: string;

  @Column({ name: 'pastoral_lead_phone', length: 50, nullable: true })
  pastoralLeadPhone?: string;

  // Year Group
  @Column({ name: 'year_group', length: 50 })
  yearGroup: string; // e.g., "Year 7", "Year 11", "Year 12"

  @Column({ name: 'form_tutor', length: 255, nullable: true })
  formTutor?: string;

  // Travel Arrangements
  @Column({ name: 'travel_arrangements', type: 'jsonb' })
  travelArrangements: {
    method: 'WALKING' | 'PUBLIC_TRANSPORT' | 'SCHOOL_BUS' | 'TAXI' | 'CARER_TRANSPORT' | 'INDEPENDENT_TRAVEL_TRAINING';
    travelTimeMinutes: number;
    travelCostPerDay?: number;
    pickupTime?: string;
    dropoffTime?: string;
    specialArrangements?: string;
  };

  @Column({ name: 'distance_from_home_miles', type: 'decimal', precision: 5, scale: 2, nullable: true })
  distanceFromHomeMiles?: number;

  // Attendance
  @Column({ name: 'current_attendance_percentage', type: 'decimal', precision: 5, scale: 2, nullable: true })
  currentAttendancePercentage?: number;

  @Column({ name: 'attendance_target_percentage', type: 'decimal', precision: 5, scale: 2, default: 95 })
  attendanceTargetPercentage: number;

  @Column({ name: 'persistent_absence', type: 'boolean', default: false })
  persistentAbsence: boolean; // Below 90%

  // Exclusions
  @Column({ name: 'fixed_term_exclusions_count', type: 'integer', default: 0 })
  fixedTermExclusionsCount: number;

  @Column({ name: 'permanent_exclusion', type: 'boolean', default: false })
  permanentExclusion: boolean;

  @Column({ name: 'exclusion_history', type: 'jsonb', default: '[]' })
  exclusionHistory: Array<{
    date: Date;
    duration: number; // days
    reason: string;
    circumstances: string;
    appealMade: boolean;
    appealOutcome?: string;
  }>;

  // Transition Information
  @Column({ name: 'transition_plan', type: 'jsonb', nullable: true })
  transitionPlan?: {
    transitionFrom: string;
    transitionDate: Date;
    visitsMade: number;
    meetAndGreetCompleted: boolean;
    buddySystemInPlace: boolean;
    settledInReviewDate: Date;
    concerns: string[];
    supportProvided: string[];
  };

  // School Support
  @Column({ name: 'additional_support', type: 'jsonb', default: '[]' })
  additionalSupport: Array<{
    supportType: string;
    provider: string;
    frequency: string;
    effectiveness: string;
  }>;

  @Column({ name: 'pastoral_support_plan', type: 'boolean', default: false })
  pastoralSupportPlan: boolean;

  @Column({ name: 'mentoring_in_place', type: 'boolean', default: false })
  mentoringInPlace: boolean;

  // Special Provisions
  @Column({ name: 'exam_access_arrangements', type: 'jsonb', default: '[]' })
  examAccessArrangements: string[]; // e.g., extra time, reader, scribe

  @Column({ name: 'medical_needs_plan', type: 'boolean', default: false })
  medicalNeedsPlan: boolean;

  @Column({ name: 'care_plan_shared_with_school', type: 'boolean', default: false })
  carePlanSharedWithSchool: boolean;

  // Funding
  @Column({ name: 'pupil_premium_eligible', type: 'boolean', default: true })
  pupilPremiumEligible: boolean;

  @Column({ name: 'pupil_premium_plus_allocated', type: 'decimal', precision: 10, scale: 2, nullable: true })
  pupilPremiumPlusAllocated?: number;

  @Column({ name: 'other_funding', type: 'jsonb', default: '[]' })
  otherFunding: Array<{
    fundingType: string;
    amount: number;
    purpose: string;
  }>;

  // Communication
  @Column({ name: 'preferred_contact_method', length: 50, default: 'EMAIL' })
  preferredContactMethod: string;

  @Column({ name: 'communication_protocol', type: 'text', nullable: true })
  communicationProtocol?: string;

  @Column({ name: 'regular_meetings_scheduled', type: 'boolean', default: false })
  regularMeetingsScheduled: boolean;

  @Column({ name: 'meeting_frequency', length: 100, nullable: true })
  meetingFrequency?: string; // e.g., "Half-termly", "Termly"

  // Emergency Contacts
  @Column({ name: 'emergency_contacts', type: 'jsonb', default: '[]' })
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    isPrimaryContact: boolean;
  }>;

  // Notes and Concerns
  @Column({ name: 'placement_stability_concern', type: 'boolean', default: false })
  placementStabilityConcern: boolean;

  @Column({ name: 'concerns', type: 'text', nullable: true })
  concerns?: string;

  @Column({ name: 'positive_aspects', type: 'text', nullable: true })
  positiveAspects?: string;

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
   * Calculate placement duration in weeks
   */
  getPlacementDurationWeeks(): number {
    const endDate = this.actualEndDate || new Date();
    const startDate = new Date(this.startDate);
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  }

  /**
   * Check if placement is stable (> 1 year)
   */
  isStable(): boolean {
    const weeks = this.getPlacementDurationWeeks();
    return weeks >= 52; // 1 year
  }

  /**
   * Check if attendance is below target
   */
  isBelowAttendanceTarget(): boolean {
    if (!this.currentAttendancePercentage) return false;
    return this.currentAttendancePercentage < this.attendanceTargetPercentage;
  }

  /**
   * Check if at risk of exclusion (3+ fixed term exclusions)
   */
  isAtRiskOfExclusion(): boolean {
    return this.fixedTermExclusionsCount >= 3;
  }

  /**
   * Get total exclusion days
   */
  getTotalExclusionDays(): number {
    return this.exclusionHistory.reduce((total, exclusion) => total + exclusion.duration, 0);
  }

  /**
   * Check if placement is current
   */
  isCurrent(): boolean {
    return this.status === PlacementStatus.ACTIVE && !this.actualEndDate;
  }

  /**
   * Calculate days since placement started
   */
  getDaysSinceStart(): number {
    const now = new Date();
    const start = new Date(this.startDate);
    const diffTime = now.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }
}
