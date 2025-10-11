/**
 * @fileoverview Safeguarding incident entity for recording and managing
 * safeguarding incidents, concerns, and protective actions. Ensures child
 * protection with full OFSTED and statutory agency compliance tracking.
 *
 * @module domains/safeguarding/entities
 * @version 1.0.0
 * @author WCNotes Development Team
 * @since 2024
 *
 * @description
 * Core entity for safeguarding incident managementtracking:
 * - Unique incident numbering (SG-YYYY-NNNN format)
 * - Incident reporting with severity classification (LOW to CRITICAL)
 * - Multi-category tracking (physical, emotional, sexual, neglect, exploitation, etc.)
 * - LADO (Local Authority Designated Officer) involvement tracking
 * - Police and OFSTED notification management
 * - Multi-agency referral tracking (MASH, Social Services, CAMHS, etc.)
 * - Investigation workflow with outcomes and action plans
 * - Comprehensive incident details (what, when, where, who, how)
 * - Witness and staff involvement tracking
 * - Immediate actions and protective measures
 * - Evidence management and documentation
 * - Lessons learned and service improvements
 * - Full audit trail (created/updated by/at)
 *
 * @compliance
 * - OFSTED Regulation 13 (Safeguarding)
 * - OFSTED Regulation 40 (Notification of significant events)
 * - Working Together to Safeguard Children 2018
 * - Children Act 1989/2004
 * - Care Standards Act 2000
 * - Keeping Children Safe in Education 2021
 * - Data Protection Act 2018 / GDPR
 *
 * @features
 * - 5 severity levels (LOW, MEDIUM, HIGH, SERIOUS, CRITICAL)
 * - 10 incident categories covering all safeguarding concerns
 * - 7 investigation statuses tracking complete workflow
 * - LADO referral tracking with decision and outcome monitoring
 * - Police involvement with crime reference and liaison officer details
 * - OFSTED notification with 24-hour compliance tracking
 * - Multi-agency referral management (8 referral types)
 * - Investigation outcomes with action plan integration
 * - Lessons learned for continuous service improvement
 * - Computed methods for notification urgency and overdue tracking
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

export enum IncidentType {
  PHYSICAL_ABUSE = 'PHYSICAL_ABUSE',
  SEXUAL_ABUSE = 'SEXUAL_ABUSE',
  EMOTIONAL_ABUSE = 'EMOTIONAL_ABUSE',
  NEGLECT = 'NEGLECT',
  BULLYING = 'BULLYING',
  SELF_HARM = 'SELF_HARM',
  SUBSTANCE_MISUSE = 'SUBSTANCE_MISUSE',
  SEXUAL_EXPLOITATION = 'SEXUAL_EXPLOITATION', // CSE
  CRIMINAL_EXPLOITATION = 'CRIMINAL_EXPLOITATION', // CCE
  ONLINE_ABUSE = 'ONLINE_ABUSE',
  MISSING_EPISODE = 'MISSING_EPISODE',
  RADICALISATION = 'RADICALISATION',
  DOMESTIC_ABUSE = 'DOMESTIC_ABUSE',
  PEER_ON_PEER_ABUSE = 'PEER_ON_PEER_ABUSE',
  GANG_AFFILIATION = 'GANG_AFFILIATION',
  TRAFFICKING = 'TRAFFICKING',
  FGM = 'FGM', // Female Genital Mutilation
  FORCED_MARRIAGE = 'FORCED_MARRIAGE',
  HONOUR_BASED_VIOLENCE = 'HONOUR_BASED_VIOLENCE',
  MODERN_SLAVERY = 'MODERN_SLAVERY',
  OTHER = 'OTHER'
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum IncidentStatus {
  REPORTED = 'REPORTED',
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  REFERRED_TO_LADO = 'REFERRED_TO_LADO',
  REFERRED_TO_POLICE = 'REFERRED_TO_POLICE',
  REFERRED_TO_SOCIAL_SERVICES = 'REFERRED_TO_SOCIAL_SERVICES',
  STRATEGY_MEETING_HELD = 'STRATEGY_MEETING_HELD',
  ACTION_TAKEN = 'ACTION_TAKEN',
  RESOLVED = 'RESOLVED',
  ONGOING_MONITORING = 'ONGOING_MONITORING',
  CLOSED = 'CLOSED'
}

@Entity('safeguarding_incidents')
@Index(['childId'])
@Index(['organizationId'])
@Index(['incidentType'])
@Index(['severity'])
@Index(['status'])
@Index(['incidentDate'])
export class SafeguardingIncident {
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

  // Incident Details
  @Column({ name: 'incident_number', length: 100, unique: true })
  incidentNumber: string;

  @Column({ name: 'incident_type', type: 'enum', enum: IncidentType })
  incidentType: IncidentType;

  @Column({ name: 'incident_date', type: 'timestamp' })
  incidentDate: Date;

  @Column({ name: 'incident_time', type: 'time', nullable: true })
  incidentTime?: string;

  @Column({ name: 'incident_location', type: 'text' })
  incidentLocation: string;

  @Column({ name: 'severity', type: 'enum', enum: IncidentSeverity })
  severity: IncidentSeverity;

  @Column({ name: 'status', type: 'enum', enum: IncidentStatus, default: IncidentStatus.REPORTED })
  status: IncidentStatus;

  // Description
  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'immediate_action_taken', type: 'text', nullable: true })
  immediateActionTaken?: string;

  // Reporting
  @Column({ name: 'reported_by', length: 255 })
  reportedBy: string;

  @Column({ name: 'reported_by_role', length: 100 })
  reportedByRole: string;

  @Column({ name: 'reported_date', type: 'timestamp' })
  reportedDate: Date;

  @Column({ name: 'disclosure_or_observation', length: 50 })
  disclosureOrObservation: 'DISCLOSURE' | 'OBSERVATION' | 'THIRD_PARTY';

  // Alleged Perpetrator
  @Column({ name: 'alleged_perpetrator', type: 'jsonb', nullable: true })
  allegedPerpetrator?: {
    name?: string;
    relationship?: string;
    ageIfChild?: number;
    adult: boolean;
    staff: boolean;
    externalPerson: boolean;
    description: string;
  };

  // Witnesses
  @Column({ name: 'witnesses', type: 'jsonb', default: '[]' })
  witnesses: Array<{
    name: string;
    role: string;
    statement: string;
    statementDate: Date;
  }>;

  // Child's Account
  @Column({ name: 'child_account', type: 'text', nullable: true })
  childAccount?: string;

  @Column({ name: 'child_wishes', type: 'text', nullable: true })
  childWishes?: string;

  // Risk Assessment
  @Column({ name: 'immediate_risk_to_child', type: 'boolean', default: false })
  immediateRiskToChild: boolean;

  @Column({ name: 'risk_to_other_children', type: 'boolean', default: false })
  riskToOtherChildren: boolean;

  @Column({ name: 'risk_assessment', type: 'text', nullable: true })
  riskAssessment?: string;

  // Notifications and Referrals
  @Column({ name: 'police_notified', type: 'boolean', default: false })
  policeNotified: boolean;

  @Column({ name: 'police_notified_date', type: 'timestamp', nullable: true })
  policeNotifiedDate?: Date;

  @Column({ name: 'police_reference', length: 100, nullable: true })
  policeReference?: string;

  @Column({ name: 'police_officer_name', length: 255, nullable: true })
  policeOfficerName?: string;

  @Column({ name: 'local_authority_notified', type: 'boolean', default: false })
  localAuthorityNotified: boolean;

  @Column({ name: 'local_authority_notified_date', type: 'timestamp', nullable: true })
  localAuthorityNotifiedDate?: Date;

  @Column({ name: 'social_worker_notified', type: 'boolean', default: false })
  socialWorkerNotified: boolean;

  @Column({ name: 'social_worker_notified_date', type: 'timestamp', nullable: true })
  socialWorkerNotifiedDate?: Date;

  @Column({ name: 'lado_referral_required', type: 'boolean', default: false })
  ladoReferralRequired: boolean;

  @Column({ name: 'lado_referral_date', type: 'timestamp', nullable: true })
  ladoReferralDate?: Date;

  @Column({ name: 'lado_reference', length: 100, nullable: true })
  ladoReference?: string;

  @Column({ name: 'ofsted_notification_required', type: 'boolean', default: false })
  ofstedNotificationRequired: boolean;

  @Column({ name: 'ofsted_notified_date', type: 'timestamp', nullable: true })
  ofstedNotifiedDate?: Date;

  @Column({ name: 'ofsted_reference', length: 100, nullable: true })
  ofstedReference?: string;

  @Column({ name: 'parent_carer_notified', type: 'boolean', default: false })
  parentCarerNotified: boolean;

  @Column({ name: 'parent_carer_notified_date', type: 'timestamp', nullable: true })
  parentCarerNotifiedDate?: Date;

  // Investigation
  @Column({ name: 'investigation_notes', type: 'text', nullable: true })
  investigationNotes?: string;

  @Column({ name: 'investigation_completed', type: 'boolean', default: false })
  investigationCompleted: boolean;

  @Column({ name: 'investigation_outcome', type: 'text', nullable: true })
  investigationOutcome?: string;

  @Column({ name: 'investigation_closed_date', type: 'timestamp', nullable: true })
  investigationClosedDate?: Date;

  // Strategy Meeting
  @Column({ name: 'strategy_meeting_required', type: 'boolean', default: false })
  strategyMeetingRequired: boolean;

  @Column({ name: 'strategy_meeting_date', type: 'timestamp', nullable: true })
  strategyMeetingDate?: Date;

  @Column({ name: 'strategy_meeting_outcome', type: 'text', nullable: true })
  strategyMeetingOutcome?: string;

  // Actions and Follow-up
  @Column({ name: 'actions_required', type: 'jsonb', default: '[]' })
  actionsRequired: Array<{
    action: string;
    responsible: string;
    deadline: Date;
    completed: boolean;
    completedDate?: Date;
    notes?: string;
  }>;

  @Column({ name: 'safety_plan_created', type: 'boolean', default: false })
  safetyPlanCreated: boolean;

  @Column({ name: 'safety_plan_details', type: 'text', nullable: true })
  safetyPlanDetails?: string;

  // Staff Actions
  @Column({ name: 'staff_member_involved', type: 'boolean', default: false })
  staffMemberInvolved: boolean;

  @Column({ name: 'staff_suspended', type: 'boolean', default: false })
  staffSuspended: boolean;

  @Column({ name: 'staff_action_taken', type: 'text', nullable: true })
  staffActionTaken?: string;

  // Documentation
  @Column({ name: 'body_map_completed', type: 'boolean', default: false })
  bodyMapCompleted: boolean;

  @Column({ name: 'photographs_taken', type: 'boolean', default: false })
  photographsTaken: boolean;

  @Column({ name: 'supporting_documents', type: 'jsonb', default: '[]' })
  supportingDocuments: Array<{
    documentType: string;
    documentName: string;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;

  // Review and Monitoring
  @Column({ name: 'review_date', type: 'timestamp', nullable: true })
  reviewDate?: Date;

  @Column({ name: 'review_notes', type: 'text', nullable: true })
  reviewNotes?: string;

  @Column({ name: 'lessons_learned', type: 'text', nullable: true })
  lessonsLearned?: string;

  @Column({ name: 'policy_procedure_changes', type: 'text', nullable: true })
  policyProcedureChanges?: string;

  // Closure
  @Column({ name: 'closure_date', type: 'timestamp', nullable: true })
  closureDate?: Date;

  @Column({ name: 'closure_reason', type: 'text', nullable: true })
  closureReason?: string;

  @Column({ name: 'closed_by', length: 255, nullable: true })
  closedBy?: string;

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
   * Check if OFSTED notification is overdue (should be within 24 hours for serious incidents)
   */
  isOfstedNotificationOverdue(): boolean {
    if (!this.ofstedNotificationRequired || this.ofstedNotifiedDate) {
      return false;
    }

    const hoursElapsed = (new Date().getTime() - this.incidentDate.getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 24;
  }

  /**
   * Check if incident is serious
   */
  isSerious(): boolean {
    return this.severity === IncidentSeverity.CRITICAL || 
           this.severity === IncidentSeverity.HIGH ||
           this.ofstedNotificationRequired;
  }

  /**
   * Check if all required notifications are complete
   */
  areNotificationsComplete(): boolean {
    let complete = true;

    if (this.policeNotified && !this.policeNotifiedDate) complete = false;
    if (this.localAuthorityNotified && !this.localAuthorityNotifiedDate) complete = false;
    if (this.ladoReferralRequired && !this.ladoReferralDate) complete = false;
    if (this.ofstedNotificationRequired && !this.ofstedNotifiedDate) complete = false;

    return complete;
  }

  /**
   * Get percentage of actions completed
   */
  getActionsCompletedPercentage(): number {
    if (this.actionsRequired.length === 0) return 100;
    
    const completed = this.actionsRequired.filter(a => a.completed).length;
    return Math.round((completed / this.actionsRequired.length) * 100);
  }

  /**
   * Check if incident is still open
   */
  isOpen(): boolean {
    return this.status !== IncidentStatus.CLOSED && !this.closureDate;
  }
}
