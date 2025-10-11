/**
 * ============================================================================
 * Contact Session Entity
 * ============================================================================
 * 
 * @fileoverview Contact session entity for recording actual contact sessions
 *               between looked after children and family members.
 * 
 * @module domains/family/entities/ContactSession
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Records individual contact sessions including attendance, duration, observations,
 * child's presentation, interaction quality, and any incidents or concerns.
 * Provides detailed documentation for review and monitoring of family contact
 * arrangements.
 * 
 * @compliance
 * - OFSTED Regulation 8 (Children's views, wishes and feelings)
 * - Children Act 1989, Section 34 - Contact records
 * - Working Together to Safeguard Children 2018
 * - Statutory Guidance on Promoting the Health of Looked After Children
 * 
 * @features
 * - Session attendance tracking
 * - Duration and timing records
 * - Child presentation observation
 * - Interaction quality assessment
 * - Incident recording
 * - Supervision notes
 * - Follow-up actions
 * - Risk assessment during contact
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
import { ContactSchedule } from './ContactSchedule';
import { Organization } from '../../../entities/Organization';

/**
 * Contact session status
 */
export enum ContactSessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  TERMINATED_EARLY = 'TERMINATED_EARLY'
}

/**
 * Attendance status
 */
export enum AttendanceStatus {
  ATTENDED = 'ATTENDED',
  DID_NOT_ATTEND = 'DID_NOT_ATTEND',
  LATE = 'LATE',
  LEFT_EARLY = 'LEFT_EARLY'
}

/**
 * Child's emotional state
 */
export enum ChildEmotionalState {
  HAPPY = 'HAPPY',
  EXCITED = 'EXCITED',
  ANXIOUS = 'ANXIOUS',
  DISTRESSED = 'DISTRESSED',
  WITHDRAWN = 'WITHDRAWN',
  ANGRY = 'ANGRY',
  CONFUSED = 'CONFUSED',
  NEUTRAL = 'NEUTRAL'
}

/**
 * Interaction quality
 */
export enum InteractionQuality {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  SATISFACTORY = 'SATISFACTORY',
  POOR = 'POOR',
  CONCERNING = 'CONCERNING'
}

@Entity('contact_sessions')
@Index(['childId', 'sessionDate'])
@Index(['familyMemberId', 'sessionDate'])
@Index(['contactScheduleId', 'status'])
@Index(['sessionDate'])
export class ContactSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ========================================
  // CORE IDENTIFICATION
  // ========================================

  @Column({ name: 'session_number', length: 50, unique: true })
  sessionNumber!: string;

  @Column({ name: 'child_id', type: 'uuid' })
  childId!: string;

  @Column({ name: 'family_member_id', type: 'uuid' })
  familyMemberId!: string;

  @Column({ name: 'contact_schedule_id', type: 'uuid', nullable: true })
  contactScheduleId?: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  // ========================================
  // SESSION DETAILS
  // ========================================

  @Column({ name: 'session_date', type: 'date' })
  sessionDate!: Date;

  @Column({ name: 'scheduled_start_time', type: 'time' })
  scheduledStartTime!: string;

  @Column({ name: 'scheduled_end_time', type: 'time' })
  scheduledEndTime!: string;

  @Column({ name: 'actual_start_time', type: 'time', nullable: true })
  actualStartTime?: string;

  @Column({ name: 'actual_end_time', type: 'time', nullable: true })
  actualEndTime?: string;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ name: 'status', type: 'enum', enum: ContactSessionStatus, default: ContactSessionStatus.SCHEDULED })
  status!: ContactSessionStatus;

  // ========================================
  // ATTENDANCE
  // ========================================

  @Column({ name: 'child_attendance', type: 'enum', enum: AttendanceStatus, nullable: true })
  childAttendance?: AttendanceStatus;

  @Column({ name: 'family_member_attendance', type: 'enum', enum: AttendanceStatus, nullable: true })
  familyMemberAttendance?: AttendanceStatus;

  @Column({ name: 'child_late_minutes', type: 'int', nullable: true })
  childLateMinutes?: number;

  @Column({ name: 'family_member_late_minutes', type: 'int', nullable: true })
  familyMemberLateMinutes?: number;

  @Column({ name: 'non_attendance_reason', type: 'text', nullable: true })
  nonAttendanceReason?: string;

  // ========================================
  // ADDITIONAL ATTENDEES
  // ========================================

  @Column({ name: 'additional_attendees', type: 'jsonb', nullable: true })
  additionalAttendees?: {
    name: string;
    relationship: string;
    role: string;
    arrivalTime?: string;
    departureTime?: string;
  }[];

  // ========================================
  // LOCATION & VENUE
  // ========================================

  @Column({ name: 'location_type', type: 'varchar', length: 100, nullable: true })
  locationType?: string;

  @Column({ name: 'venue_name', type: 'varchar', length: 200, nullable: true })
  venueName?: string;

  @Column({ name: 'venue_address', type: 'text', nullable: true })
  venueAddress?: string;

  @Column({ name: 'venue_suitable', type: 'boolean', default: true })
  venueSuitable!: boolean;

  @Column({ name: 'venue_comments', type: 'text', nullable: true })
  venueComments?: string;

  // ========================================
  // SUPERVISION
  // ========================================

  @Column({ name: 'supervised', type: 'boolean', default: false })
  supervised!: boolean;

  @Column({ name: 'supervisor_name', type: 'varchar', length: 200, nullable: true })
  supervisorName?: string;

  @Column({ name: 'supervisor_role', type: 'varchar', length: 100, nullable: true })
  supervisorRole?: string;

  @Column({ name: 'supervision_level', type: 'varchar', length: 50, nullable: true })
  supervisionLevel?: string;

  @Column({ name: 'supervision_notes', type: 'text', nullable: true })
  supervisionNotes?: string;

  @Column({ name: 'supervision_conditions_met', type: 'boolean', default: true })
  supervisionConditionsMet!: boolean;

  // ========================================
  // CHILD'S PRESENTATION
  // ========================================

  @Column({ name: 'child_emotional_state_before', type: 'enum', enum: ChildEmotionalState, nullable: true })
  childEmotionalStateBefore?: ChildEmotionalState;

  @Column({ name: 'child_emotional_state_during', type: 'enum', enum: ChildEmotionalState, nullable: true })
  childEmotionalStateDuring?: ChildEmotionalState;

  @Column({ name: 'child_emotional_state_after', type: 'enum', enum: ChildEmotionalState, nullable: true })
  childEmotionalStateAfter?: ChildEmotionalState;

  @Column({ name: 'child_presentation_notes', type: 'text', nullable: true })
  childPresentationNotes?: string;

  @Column({ name: 'child_engagement_level', type: 'varchar', length: 50, nullable: true })
  childEngagementLevel?: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';

  @Column({ name: 'child_verbal_communication', type: 'text', nullable: true })
  childVerbalCommunication?: string;

  @Column({ name: 'child_non_verbal_communication', type: 'text', nullable: true })
  childNonVerbalCommunication?: string;

  // ========================================
  // INTERACTION QUALITY
  // ========================================

  @Column({ name: 'interaction_quality', type: 'enum', enum: InteractionQuality, nullable: true })
  interactionQuality?: InteractionQuality;

  @Column({ name: 'interaction_description', type: 'text', nullable: true })
  interactionDescription?: string;

  @Column({ name: 'positive_interactions', type: 'text', nullable: true })
  positiveInteractions?: string;

  @Column({ name: 'concerning_interactions', type: 'text', nullable: true })
  concerningInteractions?: string;

  @Column({ name: 'family_member_behavior', type: 'text', nullable: true })
  familyMemberBehavior?: string;

  @Column({ name: 'attachment_observed', type: 'boolean', nullable: true })
  attachmentObserved?: boolean;

  @Column({ name: 'attachment_notes', type: 'text', nullable: true })
  attachmentNotes?: string;

  // ========================================
  // ACTIVITIES
  // ========================================

  @Column({ name: 'activities_undertaken', type: 'jsonb', nullable: true })
  activitiesUndertaken?: {
    activity: string;
    duration: number;
    childEngagement: string;
    notes?: string;
  }[];

  @Column({ name: 'gifts_exchanged', type: 'boolean', default: false })
  giftsExchanged!: boolean;

  @Column({ name: 'gifts_description', type: 'text', nullable: true })
  giftsDescription?: string;

  // ========================================
  // INCIDENTS & CONCERNS
  // ========================================

  @Column({ name: 'incidents_occurred', type: 'boolean', default: false })
  incidentsOccurred!: boolean;

  @Column({ name: 'incident_details', type: 'jsonb', nullable: true })
  incidentDetails?: {
    time: string;
    type: string;
    description: string;
    actionTaken: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reportedTo?: string;
  }[];

  @Column({ name: 'safeguarding_concerns_raised', type: 'boolean', default: false })
  safeguardingConcernsRaised!: boolean;

  @Column({ name: 'safeguarding_concerns_details', type: 'text', nullable: true })
  safeguardingConcernsDetails?: string;

  @Column({ name: 'contact_terminated_early', type: 'boolean', default: false })
  contactTerminatedEarly!: boolean;

  @Column({ name: 'termination_reason', type: 'text', nullable: true })
  terminationReason?: string;

  @Column({ name: 'termination_time', type: 'time', nullable: true })
  terminationTime?: string;

  // ========================================
  // CHILD'S WISHES & VIEWS
  // ========================================

  @Column({ name: 'child_views_sought', type: 'boolean', default: false })
  childViewsSought!: boolean;

  @Column({ name: 'child_views_summary', type: 'text', nullable: true })
  childViewsSummary?: string;

  @Column({ name: 'child_wishes_next_contact', type: 'text', nullable: true })
  childWishesNextContact?: string;

  @Column({ name: 'child_enjoyed_contact', type: 'boolean', nullable: true })
  childEnjoyedContact?: boolean;

  // ========================================
  // OUTCOMES & OBSERVATIONS
  // ========================================

  @Column({ name: 'session_objectives_met', type: 'boolean', nullable: true })
  sessionObjectivesMet?: boolean;

  @Column({ name: 'objectives_summary', type: 'text', nullable: true })
  objectivesSummary?: string;

  @Column({ name: 'overall_assessment', type: 'text', nullable: true })
  overallAssessment?: string;

  @Column({ name: 'positive_outcomes', type: 'text', nullable: true })
  positiveOutcomes?: string;

  @Column({ name: 'areas_of_concern', type: 'text', nullable: true })
  areasOfConcern?: string;

  // ========================================
  // FOLLOW-UP ACTIONS
  // ========================================

  @Column({ name: 'follow_up_required', type: 'boolean', default: false })
  followUpRequired!: boolean;

  @Column({ name: 'follow_up_actions', type: 'jsonb', nullable: true })
  followUpActions?: {
    action: string;
    assignedTo: string;
    dueDate: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }[];

  @Column({ name: 'recommendations', type: 'text', nullable: true })
  recommendations?: string;

  @Column({ name: 'schedule_changes_recommended', type: 'boolean', default: false })
  scheduleChangesRecommended!: boolean;

  @Column({ name: 'schedule_change_details', type: 'text', nullable: true })
  scheduleChangeDetails?: string;

  // ========================================
  // REPORTING & NOTIFICATIONS
  // ========================================

  @Column({ name: 'social_worker_notified', type: 'boolean', default: false })
  socialWorkerNotified!: boolean;

  @Column({ name: 'social_worker_notification_date', type: 'timestamp', nullable: true })
  socialWorkerNotificationDate?: Date;

  @Column({ name: 'report_sent_to', type: 'jsonb', nullable: true })
  reportSentTo?: {
    recipient: string;
    role: string;
    sentDate: Date;
    method: string;
  }[];

  // ========================================
  // CANCELLATION DETAILS
  // ========================================

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ name: 'cancelled_by', type: 'varchar', length: 200, nullable: true })
  cancelledBy?: string;

  @Column({ name: 'cancellation_date', type: 'timestamp', nullable: true })
  cancellationDate?: Date;

  @Column({ name: 'notice_period_met', type: 'boolean', nullable: true })
  noticePeriodMet?: boolean;

  @Column({ name: 'rescheduled', type: 'boolean', default: false })
  rescheduled!: boolean;

  @Column({ name: 'rescheduled_date', type: 'date', nullable: true })
  rescheduledDate?: Date;

  // ========================================
  // ADDITIONAL NOTES
  // ========================================

  @Column({ name: 'transport_issues', type: 'text', nullable: true })
  transportIssues?: string;

  @Column({ name: 'weather_impact', type: 'text', nullable: true })
  weatherImpact?: string;

  @Column({ name: 'general_notes', type: 'text', nullable: true })
  generalNotes?: string;

  @Column({ name: 'confidential_notes', type: 'text', nullable: true })
  confidentialNotes?: string;

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

  @Column({ name: 'completed_by', type: 'uuid', nullable: true })
  completedBy?: string;

  @Column({ name: 'completed_date', type: 'timestamp', nullable: true })
  completedDate?: Date;

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

  @ManyToOne(() => ContactSchedule, contactSchedule => contactSchedule.id)
  @JoinColumn({ name: 'contact_schedule_id' })
  contactSchedule?: ContactSchedule;

  @ManyToOne(() => Organization, organization => organization.id)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Calculate actual duration
   */
  calculateDuration(): number | null {
    if (!this.actualStartTime || !this.actualEndTime) {
      return null;
    }
    const [startHour, startMin] = this.actualStartTime.split(':').map(Number);
    const [endHour, endMin] = this.actualEndTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  }

  /**
   * Check if session went well
   */
  wasSuccessful(): boolean {
    return this.status === ContactSessionStatus.COMPLETED &&
           this.interactionQuality !== InteractionQuality.POOR &&
           this.interactionQuality !== InteractionQuality.CONCERNING &&
           !this.safeguardingConcernsRaised &&
           !this.contactTerminatedEarly;
  }

  /**
   * Check if concerns were raised
   */
  hasConcerns(): boolean {
    return this.safeguardingConcernsRaised ||
           this.incidentsOccurred ||
           this.interactionQuality === InteractionQuality.CONCERNING ||
           this.contactTerminatedEarly;
  }

  /**
   * Get emotional state change
   */
  getEmotionalStateChange(): string {
    if (!this.childEmotionalStateBefore || !this.childEmotionalStateAfter) {
      return 'Unknown';
    }
    if (this.childEmotionalStateBefore === this.childEmotionalStateAfter) {
      return 'No change';
    }
    const positive = ['HAPPY', 'EXCITED', 'NEUTRAL'];
    const negative = ['ANXIOUS', 'DISTRESSED', 'WITHDRAWN', 'ANGRY', 'CONFUSED'];
    
    const beforePositive = positive.includes(this.childEmotionalStateBefore);
    const afterPositive = positive.includes(this.childEmotionalStateAfter);
    
    if (!beforePositive && afterPositive) {
      return 'Improved';
    }
    if (beforePositive && !afterPositive) {
      return 'Deteriorated';
    }
    return 'Changed';
  }

  /**
   * Check if on time
   */
  wasOnTime(): boolean {
    return this.childAttendance === AttendanceStatus.ATTENDED &&
           this.familyMemberAttendance === AttendanceStatus.ATTENDED &&
           (!this.childLateMinutes || this.childLateMinutes === 0) &&
           (!this.familyMemberLateMinutes || this.familyMemberLateMinutes === 0);
  }

  /**
   * Check if requires urgent review
   */
  requiresUrgentReview(): boolean {
    return this.safeguardingConcernsRaised ||
           this.contactTerminatedEarly ||
           this.interactionQuality === InteractionQuality.CONCERNING ||
           (this.incidentDetails && this.incidentDetails.some(i => i.severity === 'CRITICAL' || i.severity === 'HIGH'));
  }
}
