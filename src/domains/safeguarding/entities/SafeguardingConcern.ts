/**
 * ============================================================================
 * Safeguarding Concern Entity
 * ============================================================================
 * 
 * @fileoverview Entity representing safeguarding concerns raised by staff,
 *               children, parents, or external agencies.
 * 
 * @module domains/safeguarding/entities/SafeguardingConcern
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Manages the recording and tracking of safeguarding concerns that may not
 * meet the threshold for a full safeguarding incident but require monitoring,
 * assessment, and potential escalation. Includes low-level concerns about
 * child behavior, staff conduct, environmental hazards, and peer interactions.
 * 
 * @compliance
 * - OFSTED Regulation 13 (Safeguarding)
 * - Working Together to Safeguard Children 2018
 * - Keeping Children Safe in Education 2023
 * - Care Standards Act 2000
 * 
 * @features
 * - Multi-category concern tracking
 * - Concern escalation workflow
 * - Pattern recognition for repeat concerns
 * - Professional judgment recording
 * - Threshold decision tracking
 * - Low-level concern management
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

export enum ConcernType {
  CHILD_BEHAVIOUR = 'CHILD_BEHAVIOUR',
  STAFF_CONDUCT = 'STAFF_CONDUCT',
  ENVIRONMENTAL_HAZARD = 'ENVIRONMENTAL_HAZARD',
  PEER_ON_PEER = 'PEER_ON_PEER',
  EXTERNAL_CONTACT = 'EXTERNAL_CONTACT',
  ONLINE_ACTIVITY = 'ONLINE_ACTIVITY',
  HEALTH_CONCERN = 'HEALTH_CONCERN',
  EMOTIONAL_WELLBEING = 'EMOTIONAL_WELLBEING',
  FAMILY_CIRCUMSTANCES = 'FAMILY_CIRCUMSTANCES',
  PLACEMENT_SUITABILITY = 'PLACEMENT_SUITABILITY',
  EDUCATION_WELFARE = 'EDUCATION_WELFARE',
  SUBSTANCE_USE = 'SUBSTANCE_USE',
  RELATIONSHIPS = 'RELATIONSHIPS',
  GROOMING_INDICATORS = 'GROOMING_INDICATORS',
  OTHER = 'OTHER'
}

export enum ConcernSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum ConcernStatus {
  RAISED = 'RAISED',
  ASSESSED = 'ASSESSED',
  MONITORING = 'MONITORING',
  ESCALATED = 'ESCALATED',
  RESOLVED = 'RESOLVED',
  NO_FURTHER_ACTION = 'NO_FURTHER_ACTION'
}

@Entity('safeguarding_concerns')
@Index(['childId'])
@Index(['status'])
@Index(['concernType'])
@Index(['raisedDate'])
export class SafeguardingConcern {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Concern Reference
  @Column({ name: 'concern_number', length: 100, unique: true })
  concernNumber: string;

  // Organization
  @Column({ name: 'organization_id' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  // Child Reference (optional - some concerns may not be child-specific)
  @Column({ name: 'child_id', nullable: true })
  childId?: string;

  @ManyToOne(() => Child, { nullable: true })
  @JoinColumn({ name: 'child_id' })
  child?: Child;

  @Column({ name: 'children_involved', type: 'jsonb', default: '[]' })
  childrenInvolved: Array<{
    childId: string;
    childName: string;
    role: 'SUBJECT' | 'WITNESS' | 'ALLEGED_PERPETRATOR' | 'AFFECTED_PARTY';
  }>;

  // Concern Details
  @Column({ name: 'concern_type', type: 'enum', enum: ConcernType })
  concernType: ConcernType;

  @Column({ name: 'concern_summary', length: 500 })
  concernSummary: string;

  @Column({ name: 'concern_details', type: 'text' })
  concernDetails: string;

  @Column({ name: 'severity', type: 'enum', enum: ConcernSeverity })
  severity: ConcernSeverity;

  @Column({ name: 'status', type: 'enum', enum: ConcernStatus, default: ConcernStatus.RAISED })
  status: ConcernStatus;

  // Who, What, When, Where
  @Column({ name: 'raised_date', type: 'timestamp' })
  raisedDate: Date;

  @Column({ name: 'incident_date', type: 'timestamp', nullable: true })
  incidentDate?: Date;

  @Column({ name: 'location', length: 255, nullable: true })
  location?: string;

  @Column({ name: 'witnessed', type: 'boolean', default: false })
  witnessed: boolean;

  @Column({ name: 'witnesses', type: 'jsonb', default: '[]' })
  witnesses: Array<{
    name: string;
    role: string;
    contactDetails?: string;
  }>;

  // Raised By
  @Column({ name: 'raised_by_name', length: 255 })
  raisedByName: string;

  @Column({ name: 'raised_by_role', length: 100 })
  raisedByRole: string;

  @Column({ name: 'raised_by_contact', length: 255 })
  raisedByContact: string;

  @Column({ name: 'raised_by_organization', length: 255, nullable: true })
  raisedByOrganization?: string;

  // Immediate Actions
  @Column({ name: 'immediate_actions_taken', type: 'jsonb', default: '[]' })
  immediateActionsTaken: Array<{
    action: string;
    takenBy: string;
    takenAt: Date;
  }>;

  @Column({ name: 'child_informed', type: 'boolean', default: false })
  childInformed: boolean;

  @Column({ name: 'parents_informed', type: 'boolean', default: false })
  parentsInformed: boolean;

  // Assessment
  @Column({ name: 'assessed_by', length: 255, nullable: true })
  assessedBy?: string;

  @Column({ name: 'assessed_date', type: 'timestamp', nullable: true })
  assessedDate?: Date;

  @Column({ name: 'assessment_notes', type: 'text', nullable: true })
  assessmentNotes?: string;

  @Column({ name: 'threshold_met', type: 'boolean', nullable: true })
  thresholdMet?: boolean;

  @Column({ name: 'threshold_rationale', type: 'text', nullable: true })
  thresholdRationale?: string;

  // Referrals
  @Column({ name: 'referral_required', type: 'boolean', default: false })
  referralRequired: boolean;

  @Column({ name: 'referred_to', type: 'jsonb', default: '[]' })
  referredTo: Array<{
    service: 'MANAGER' | 'SAFEGUARDING_LEAD' | 'DSL' | 'SOCIAL_WORKER' | 'LADO' | 'POLICE' | 'HEALTH' | 'EXTERNAL_AGENCY';
    referredAt: Date;
    referredBy: string;
    reference?: string;
    outcome?: string;
  }>;

  // Escalation
  @Column({ name: 'escalated_to_incident', type: 'boolean', default: false })
  escalatedToIncident: boolean;

  @Column({ name: 'incident_id', nullable: true })
  incidentId?: string;

  @Column({ name: 'escalation_date', type: 'timestamp', nullable: true })
  escalationDate?: Date;

  @Column({ name: 'escalation_reason', type: 'text', nullable: true })
  escalationReason?: string;

  // Monitoring
  @Column({ name: 'monitoring_required', type: 'boolean', default: false })
  monitoringRequired: boolean;

  @Column({ name: 'monitoring_period_weeks', type: 'integer', nullable: true })
  monitoringPeriodWeeks?: number;

  @Column({ name: 'monitoring_actions', type: 'jsonb', default: '[]' })
  monitoringActions: Array<{
    action: string;
    responsible: string;
    dueDate: Date;
    completed: boolean;
    completedDate?: Date;
    notes?: string;
  }>;

  @Column({ name: 'monitoring_notes', type: 'text', nullable: true })
  monitoringNotes?: string;

  // Pattern Recognition
  @Column({ name: 'related_concerns', type: 'jsonb', default: '[]' })
  relatedConcerns: Array<{
    concernId: string;
    concernNumber: string;
    concernType: ConcernType;
    date: Date;
  }>;

  @Column({ name: 'pattern_identified', type: 'boolean', default: false })
  patternIdentified: boolean;

  @Column({ name: 'pattern_description', type: 'text', nullable: true })
  patternDescription?: string;

  // Resolution
  @Column({ name: 'resolved_date', type: 'timestamp', nullable: true })
  resolvedDate?: Date;

  @Column({ name: 'resolved_by', length: 255, nullable: true })
  resolvedBy?: string;

  @Column({ name: 'resolution_outcome', type: 'text', nullable: true })
  resolutionOutcome?: string;

  @Column({ name: 'lessons_learned', type: 'text', nullable: true })
  lessonsLearned?: string;

  @Column({ name: 'preventive_measures', type: 'jsonb', default: '[]' })
  preventiveMeasures: string[];

  // Follow-up
  @Column({ name: 'follow_up_required', type: 'boolean', default: false })
  followUpRequired: boolean;

  @Column({ name: 'follow_up_date', type: 'timestamp', nullable: true })
  followUpDate?: Date;

  @Column({ name: 'follow_up_completed', type: 'boolean', default: false })
  followUpCompleted: boolean;

  @Column({ name: 'follow_up_notes', type: 'text', nullable: true })
  followUpNotes?: string;

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
   * Check if concern is overdue for assessment
   */
  isAssessmentOverdue(): boolean {
    if (this.status !== ConcernStatus.RAISED) return false;
    
    const hoursSinceRaised = (new Date().getTime() - new Date(this.raisedDate).getTime()) / (1000 * 60 * 60);
    
    // High severity: 4 hours, Medium: 24 hours, Low: 48 hours
    const thresholds = {
      [ConcernSeverity.HIGH]: 4,
      [ConcernSeverity.MEDIUM]: 24,
      [ConcernSeverity.LOW]: 48
    };
    
    return hoursSinceRaised > thresholds[this.severity];
  }

  /**
   * Check if follow-up is overdue
   */
  isFollowUpOverdue(): boolean {
    if (!this.followUpRequired || this.followUpCompleted || !this.followUpDate) {
      return false;
    }
    return new Date() > this.followUpDate;
  }

  /**
   * Get concern age in days
   */
  getConcernAgeDays(): number {
    const now = new Date();
    const raised = new Date(this.raisedDate);
    return Math.floor((now.getTime() - raised.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if concern is recent (within 7 days)
   */
  isRecent(): boolean {
    return this.getConcernAgeDays() <= 7;
  }

  /**
   * Get monitoring progress percentage
   */
  getMonitoringProgress(): number {
    if (this.monitoringActions.length === 0) return 0;
    
    const completed = this.monitoringActions.filter(a => a.completed).length;
    return Math.round((completed / this.monitoringActions.length) * 100);
  }
}
