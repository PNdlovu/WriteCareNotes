/**
 * ============================================================================
 * Contact Schedule Entity
 * ============================================================================
 * 
 * @fileoverview Contact schedule entity for managing supervised and unsupervised
 *               contact arrangements between looked after children and family members.
 * 
 * @module domains/family/entities/ContactSchedule
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages contact arrangements including frequency, duration, location, supervision
 * requirements, and contact conditions. Ensures compliance with care plans and
 * court orders while promoting safe family connections.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Children's views, wishes and feelings)
 * - Children Act 1989, Section 34 - Contact with children in care
 * - Adoption and Children Act 2002 - Contact arrangements
 * - Human Rights Act 1998, Article 8 - Right to family life
 * - Children and Families Act 2014 - Contact orders
 * 
 * @features
 * - Contact frequency and duration management
 * - Supervised/unsupervised contact tracking
 * - Contact location and venue management
 * - Supervision requirements and supervisor assignment
 * - Contact conditions and restrictions
 * - Transport arrangements
 * - Court order compliance
 * - Contact review scheduling
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from 'typeorm';
import { Child } from '../../children/entities/Child';
import { FamilyMember } from './FamilyMember';
import { Organization } from '../../../entities/Organization';

/**
 * Contact types
 */
export enum ContactType {
  IN_PERSON = 'IN_PERSON',
  PHONE_CALL = 'PHONE_CALL',
  VIDEO_CALL = 'VIDEO_CALL',
  WRITTEN_LETTER = 'WRITTEN_LETTER',
  EMAIL = 'EMAIL',
  SUPERVISED_VISIT = 'SUPERVISED_VISIT',
  UNSUPERVISED_VISIT = 'UNSUPERVISED_VISIT',
  OVERNIGHT_STAY = 'OVERNIGHT_STAY',
  HOLIDAY_CONTACT = 'HOLIDAY_CONTACT',
  SPECIAL_OCCASION = 'SPECIAL_OCCASION'
}

/**
 * Contact frequency
 */
export enum ContactFrequency {
  DAILY = 'DAILY',
  TWICE_WEEKLY = 'TWICE_WEEKLY',
  WEEKLY = 'WEEKLY',
  FORTNIGHTLY = 'FORTNIGHTLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  ANNUALLY = 'ANNUALLY',
  AS_REQUIRED = 'AS_REQUIRED',
  NO_CONTACT = 'NO_CONTACT'
}

/**
 * Contact schedule status
 */
export enum ContactScheduleStatus {
  ACTIVE = 'ACTIVE',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
  UNDER_REVIEW = 'UNDER_REVIEW'
}

/**
 * Supervision level
 */
export enum SupervisionLevel {
  NONE = 'NONE',
  INDIRECT = 'INDIRECT',
  DIRECT = 'DIRECT',
  CONSTANT = 'CONSTANT'
}

@Entity('contact_schedules')
@Index(['childId', 'status'])
@Index(['familyMemberId', 'status'])
@Index(['nextContactDate'])
export class ContactSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ========================================
  // CORE IDENTIFICATION
  // ========================================

  @Column({ name: 'contact_schedule_number', length: 50, unique: true })
  contactScheduleNumber!: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId!: string;

  @Column({ name: 'family_member_id', type: 'uuid' })
  familyMemberId!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  // ========================================
  // CONTACT DETAILS
  // ========================================

  @Column({ name: 'contact_type', type: 'enum', enum: ContactType })
  contactType!: ContactType;

  @Column({ name: 'contact_frequency', type: 'enum', enum: ContactFrequency })
  contactFrequency!: ContactFrequency;

  @Column({ name: 'status', type: 'enum', enum: ContactScheduleStatus, default: ContactScheduleStatus.ACTIVE })
  status!: ContactScheduleStatus;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: Date;

  @Column({ name: 'ongoing_arrangement', type: 'boolean', default: true })
  ongoingArrangement!: boolean;

  // ========================================
  // SUPERVISION REQUIREMENTS
  // ========================================

  @Column({ name: 'supervision_required', type: 'boolean', default: false })
  supervisionRequired!: boolean;

  @Column({ name: 'supervision_level', type: 'enum', enum: SupervisionLevel, default: SupervisionLevel.NONE })
  supervisionLevel!: SupervisionLevel;

  @Column({ name: 'supervisor_name', type: 'varchar', length: 200, nullable: true })
  supervisorName?: string;

  @Column({ name: 'supervisor_role', type: 'varchar', length: 100, nullable: true })
  supervisorRole?: string;

  @Column({ name: 'supervisor_organization', type: 'varchar', length: 200, nullable: true })
  supervisorOrganization?: string;

  @Column({ name: 'supervisor_contact', type: 'varchar', length: 200, nullable: true })
  supervisorContact?: string;

  @Column({ name: 'supervision_requirements', type: 'text', nullable: true })
  supervisionRequirements?: string;

  // ========================================
  // DURATION & TIMING
  // ========================================

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @Column({ name: 'preferred_day_of_week', type: 'varchar', length: 20, nullable: true })
  preferredDayOfWeek?: string;

  @Column({ name: 'preferred_time', type: 'time', nullable: true })
  preferredTime?: string;

  @Column({ name: 'flexible_timing', type: 'boolean', default: false })
  flexibleTiming!: boolean;

  @Column({ name: 'advance_notice_days', type: 'int', default: 7 })
  advanceNoticeDays!: number;

  // ========================================
  // LOCATION & VENUE
  // ========================================

  @Column({ name: 'location_type', type: 'varchar', length: 100, nullable: true })
  locationType?: string;

  @Column({ name: 'venue_name', type: 'varchar', length: 200, nullable: true })
  venueName?: string;

  @Column({ name: 'venue_address_line_1', type: 'varchar', length: 200, nullable: true })
  venueAddressLine1?: string;

  @Column({ name: 'venue_address_line_2', type: 'varchar', length: 200, nullable: true })
  venueAddressLine2?: string;

  @Column({ name: 'venue_city', type: 'varchar', length: 100, nullable: true })
  venueCity?: string;

  @Column({ name: 'venue_postcode', type: 'varchar', length: 20, nullable: true })
  venuePostcode?: string;

  @Column({ name: 'venue_contact_number', type: 'varchar', length: 20, nullable: true })
  venueContactNumber?: string;

  @Column({ name: 'venue_notes', type: 'text', nullable: true })
  venueNotes?: string;

  // ========================================
  // TRANSPORT ARRANGEMENTS
  // ========================================

  @Column({ name: 'transport_required', type: 'boolean', default: false })
  transportRequired!: boolean;

  @Column({ name: 'transport_provider', type: 'varchar', length: 200, nullable: true })
  transportProvider?: string;

  @Column({ name: 'transport_from', type: 'varchar', length: 200, nullable: true })
  transportFrom?: string;

  @Column({ name: 'transport_to', type: 'varchar', length: 200, nullable: true })
  transportTo?: string;

  @Column({ name: 'transport_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  transportCost?: number;

  @Column({ name: 'transport_notes', type: 'text', nullable: true })
  transportNotes?: string;

  // ========================================
  // CONDITIONS & RESTRICTIONS
  // ========================================

  @Column({ name: 'contact_conditions', type: 'jsonb', nullable: true })
  contactConditions?: {
    conditionType: string;
    description: string;
    mandatoryCompliance: boolean;
  }[];

  @Column({ name: 'prohibited_activities', type: 'text', nullable: true })
  prohibitedActivities?: string;

  @Column({ name: 'required_activities', type: 'text', nullable: true })
  requiredActivities?: string;

  @Column({ name: 'permitted_persons', type: 'jsonb', nullable: true })
  permittedPersons?: {
    name: string;
    relationship: string;
    approvedBy: string;
    approvedDate: Date;
  }[];

  @Column({ name: 'prohibited_persons', type: 'jsonb', nullable: true })
  prohibitedPersons?: {
    name: string;
    relationship: string;
    reason: string;
    prohibitedBy: string;
    prohibitedDate: Date;
  }[];

  // ========================================
  // COURT ORDER & LEGAL
  // ========================================

  @Column({ name: 'court_ordered', type: 'boolean', default: false })
  courtOrdered!: boolean;

  @Column({ name: 'court_order_reference', type: 'varchar', length: 100, nullable: true })
  courtOrderReference?: string;

  @Column({ name: 'court_order_type', type: 'varchar', length: 100, nullable: true })
  courtOrderType?: string;

  @Column({ name: 'court_order_date', type: 'date', nullable: true })
  courtOrderDate?: Date;

  @Column({ name: 'court_order_expires', type: 'date', nullable: true })
  courtOrderExpires?: Date;

  @Column({ name: 'court_order_conditions', type: 'text', nullable: true })
  courtOrderConditions?: string;

  // ========================================
  // CHILD'S WISHES & VIEWS
  // ========================================

  @Column({ name: 'child_wishes_recorded', type: 'boolean', default: false })
  childWishesRecorded!: boolean;

  @Column({ name: 'child_wishes_summary', type: 'text', nullable: true })
  childWishesSummary?: string;

  @Column({ name: 'child_wishes_recorded_date', type: 'date', nullable: true })
  childWishesRecordedDate?: Date;

  @Column({ name: 'child_wishes_recorded_by', type: 'varchar', length: 200, nullable: true })
  childWishesRecordedBy?: string;

  @Column({ name: 'child_consent_given', type: 'boolean', default: false })
  childConsentGiven!: boolean;

  // ========================================
  // APPROVAL & AUTHORIZATION
  // ========================================

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ name: 'approved_date', type: 'date', nullable: true })
  approvedDate?: Date;

  @Column({ name: 'approval_notes', type: 'text', nullable: true })
  approvalNotes?: string;

  @Column({ name: 'care_plan_aligned', type: 'boolean', default: false })
  carePlanAligned!: boolean;

  @Column({ name: 'social_worker_approval', type: 'boolean', default: false })
  socialWorkerApproval!: boolean;

  @Column({ name: 'manager_approval', type: 'boolean', default: false })
  managerApproval!: boolean;

  // ========================================
  // REVIEW & MONITORING
  // ========================================

  @Column({ name: 'last_review_date', type: 'date', nullable: true })
  lastReviewDate?: Date;

  @Column({ name: 'next_review_date', type: 'date', nullable: true })
  nextReviewDate?: Date;

  @Column({ name: 'review_frequency_months', type: 'int', default: 6 })
  reviewFrequencyMonths!: number;

  @Column({ name: 'last_contact_date', type: 'date', nullable: true })
  lastContactDate?: Date;

  @Column({ name: 'next_contact_date', type: 'date', nullable: true })
  nextContactDate?: Date;

  @Column({ name: 'total_contacts_scheduled', type: 'int', default: 0 })
  totalContactsScheduled!: number;

  @Column({ name: 'total_contacts_completed', type: 'int', default: 0 })
  totalContactsCompleted!: number;

  @Column({ name: 'total_contacts_cancelled', type: 'int', default: 0 })
  totalContactsCancelled!: number;

  @Column({ name: 'total_contacts_missed', type: 'int', default: 0 })
  totalContactsMissed!: number;

  // ========================================
  // ADDITIONAL INFORMATION
  // ========================================

  @Column({ name: 'contact_purpose', type: 'text', nullable: true })
  contactPurpose?: string;

  @Column({ name: 'contact_goals', type: 'text', nullable: true })
  contactGoals?: string;

  @Column({ name: 'success_indicators', type: 'text', nullable: true })
  successIndicators?: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string;

  // ========================================
  // AUDIT TRAIL
  // ========================================

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ name: 'version', type: 'int', default: 1 })
  version!: number;

  // ========================================
  // RELATIONSHIPS
  // ========================================

  @ManyToOne(() => Child, child => child.id)
  @JoinColumn({ name: 'child_id' })
  child!: Child;

  @ManyToOne(() => FamilyMember, familyMember => familyMember.id)
  @JoinColumn({ name: 'family_member_id' })
  familyMember!: FamilyMember;

  @ManyToOne(() => Organization, organization => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Check if contact schedule is currently active
   */
  isActive(): boolean {
    const now = new Date();
    const isStarted = new Date(this.startDate) <= now;
    const notEnded = !this.endDate || new Date(this.endDate) >= now;
    return this.status === ContactScheduleStatus.ACTIVE && isStarted && notEnded;
  }

  /**
   * Check if review is due
   */
  isReviewDue(): boolean {
    if (!this.nextReviewDate) {
      return true;
    }
    const daysDiff = Math.floor(
      (new Date(this.nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff <= 30;
  }

  /**
   * Get contact success rate
   */
  getContactSuccessRate(): number {
    if (this.totalContactsScheduled === 0) {
      return 0;
    }
    return (this.totalContactsCompleted / this.totalContactsScheduled) * 100;
  }

  /**
   * Check if court order is active
   */
  hasActiveCourtOrder(): boolean {
    if (!this.courtOrdered || !this.courtOrderReference) {
      return false;
    }
    if (!this.courtOrderExpires) {
      return true;
    }
    return new Date(this.courtOrderExpires) > new Date();
  }

  /**
   * Calculate days until next contact
   */
  getDaysUntilNextContact(): number | null {
    if (!this.nextContactDate) {
      return null;
    }
    return Math.floor(
      (new Date(this.nextContactDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  /**
   * Get duration in hours and minutes
   */
  getDurationDisplay(): string {
    const hours = Math.floor(this.durationMinutes / 60);
    const minutes = this.durationMinutes % 60;
    if (hours === 0) {
      return `${minutes} minutes`;
    }
    if (minutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  }

  /**
   * Check if all approvals obtained
   */
  hasAllApprovals(): boolean {
    return this.socialWorkerApproval && this.managerApproval && !!this.approvedBy;
  }
}
