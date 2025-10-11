/**
 * ============================================================================
 * Home Office Correspondence Entity
 * ============================================================================
 * 
 * @fileoverview Home Office correspondence tracking for UASC.
 * 
 * @module domains/uasc/entities/HomeOfficeCorrespondence
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents correspondence with the UK Home Office regarding an unaccompanied
 * asylum-seeking child's immigration case. Tracks submissions, responses,
 * deadlines, and follow-up actions.
 * 
 * @compliance
 * - Immigration Act 2016
 * - Data Protection Act 2018
 * - GDPR
 * - OFSTED Regulation 17 (Records)
 * 
 * @features
 * - Correspondence tracking (sent/received)
 * - Deadline monitoring
 * - Response tracking
 * - Document management
 * - Follow-up actions
 * - Submission evidence
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
import { UASCProfile } from './UASCProfile';

// ========================================
// ENUMERATIONS
// ========================================

export enum CorrespondenceType {
  ASYLUM_APPLICATION = 'ASYLUM_APPLICATION',
  FURTHER_SUBMISSIONS = 'FURTHER_SUBMISSIONS',
  FRESH_CLAIM = 'FRESH_CLAIM',
  APPEAL_NOTICE = 'APPEAL_NOTICE',
  APPEAL_GROUNDS = 'APPEAL_GROUNDS',
  WITNESS_STATEMENT = 'WITNESS_STATEMENT',
  EXPERT_REPORT = 'EXPERT_REPORT',
  SUPPORTING_EVIDENCE = 'SUPPORTING_EVIDENCE',
  RESPONSE_TO_HOME_OFFICE = 'RESPONSE_TO_HOME_OFFICE',
  JUDICIAL_REVIEW = 'JUDICIAL_REVIEW',
  AGE_ASSESSMENT_CHALLENGE = 'AGE_ASSESSMENT_CHALLENGE',
  INQUIRY = 'INQUIRY',
  COMPLAINT = 'COMPLAINT',
  OTHER = 'OTHER'
}

export enum CorrespondenceDirection {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING'
}

export enum CorrespondenceMethod {
  EMAIL = 'EMAIL',
  POST = 'POST',
  HAND_DELIVERY = 'HAND_DELIVERY',
  ONLINE_PORTAL = 'ONLINE_PORTAL',
  FAX = 'FAX',
  COURIER = 'COURIER'
}

export enum CorrespondenceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESPONDED = 'RESPONDED',
  PENDING_RESPONSE = 'PENDING_RESPONSE',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
  ARCHIVED = 'ARCHIVED'
}

// ========================================
// HOME OFFICE CORRESPONDENCE ENTITY
// ========================================

@Entity('home_office_correspondence')
export class HomeOfficeCorrespondence {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'var char', unique: true })
  correspondenceNumber: string; // Format: HOC-YYYY-NNNN

  @ManyToOne(() => UASCProfile)
  @JoinColumn({ name: 'uascProfileId' })
  uascProfile: UASCProfile;

  @Column()
  uascProfileId: string;

  @Column({
    type: 'enum',
    enum: CorrespondenceType
  })
  correspondenceType: CorrespondenceType;

  @Column({
    type: 'enum',
    enum: CorrespondenceDirection
  })
  direction: CorrespondenceDirection;

  @Column({
    type: 'enum',
    enum: CorrespondenceStatus,
    default: CorrespondenceStatus.DRAFT
  })
  status: CorrespondenceStatus;

  // ========================================
  // CORRESPONDENCE DETAILS
  // ========================================

  @Column({ type: 'var char' })
  subject: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'text', nullable: true })
  fullContent: string;

  @Column({ type: 'date' })
  correspondenceDate: Date;

  @Column({
    type: 'enum',
    enum: CorrespondenceMethod
  })
  method: CorrespondenceMethod;

  // ========================================
  // SENDER/RECIPIENT
  // ========================================

  @Column({ type: 'var char', nullable: true })
  fromOrganization: string;

  @Column({ type: 'var char', nullable: true })
  fromPerson: string;

  @Column({ type: 'var char', nullable: true })
  fromEmail: string;

  @Column({ type: 'var char', nullable: true })
  toOrganization: string;

  @Column({ type: 'var char', nullable: true })
  toPerson: string;

  @Column({ type: 'var char', nullable: true })
  toEmail: string;

  @Column({ type: 'var char', nullable: true })
  toAddress: string;

  // ========================================
  // HOME OFFICE DETAILS
  // ========================================

  @Column({ type: 'var char', nullable: true })
  homeOfficeReference: string;

  @Column({ type: 'var char', nullable: true })
  homeOfficeDepartment: string;

  @Column({ type: 'var char', nullable: true })
  homeOfficeCaseWorker: string;

  @Column({ type: 'var char', nullable: true })
  homeOfficeContact: string;

  // ========================================
  // OUTGOING CORRESPONDENCE
  // ========================================

  @Column({ type: 'date', nullable: true })
  sentDate: Date;

  @Column({ type: 'var char', nullable: true })
  sentBy: string;

  @Column({ type: 'var char', nullable: true })
  trackingNumber: string;

  @Column({ type: 'boolean', default: false })
  proofOfPostingObtained: boolean;

  @Column({ type: 'boolean', default: false })
  signedFor: boolean;

  @Column({ type: 'date', nullable: true })
  deliveryConfirmationDate: Date;

  // ========================================
  // INCOMING CORRESPONDENCE
  // ========================================

  @Column({ type: 'date', nullable: true })
  receivedDate: Date;

  @Column({ type: 'var char', nullable: true })
  receivedBy: string;

  @Column({ type: 'var char', nullable: true })
  receivedVia: string;

  // ========================================
  // DEADLINES
  // ========================================

  @Column({ type: 'date', nullable: true })
  responseDeadline: Date;

  @Column({ type: 'int', nullable: true })
  deadlineDays: number;

  @Column({ type: 'boolean', default: false })
  urgentResponse: boolean;

  @Column({ type: 'text', nullable: true })
  urgentResponseReason: string;

  // ========================================
  // RESPONSE
  // ========================================

  @Column({ type: 'boolean', default: false })
  responseReceived: boolean;

  @Column({ type: 'date', nullable: true })
  responseReceivedDate: Date;

  @Column({ type: 'var char', nullable: true })
  responseReference: string;

  @Column({ type: 'text', nullable: true })
  responseSummary: string;

  @Column({ type: 'var char', nullable: true })
  responseOutcome: string;

  // ========================================
  // DOCUMENTS
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  attachedDocuments: Array<{
    documentType: string;
    fileName: string;
    fileSize: number;
    uploadDate: Date;
    uploadedBy: string;
    description: string;
  }>;

  @Column({ type: 'int', nullable: true })
  totalDocuments: number;

  @Column({ type: 'int', nullable: true })
  totalPages: number;

  // ========================================
  // SUPPORTING EVIDENCE
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  evidenceSubmitted: Array<{
    evidenceType: string;
    description: string;
    dateObtained: Date;
    provider: string;
  }>;

  // ========================================
  // LEGAL REPRESENTATION
  // ========================================

  @Column({ type: 'var char', nullable: true })
  preparedBy: string;

  @Column({ type: 'var char', nullable: true })
  solicitorName: string;

  @Column({ type: 'var char', nullable: true })
  solicitorFirm: string;

  @Column({ type: 'var char', nullable: true })
  solicitorReference: string;

  // ========================================
  // FOLLOW-UP
  // ========================================

  @Column({ type: 'boolean', default: false })
  followUpRequired: boolean;

  @Column({ type: 'date', nullable: true })
  followUpDate: Date;

  @Column({ type: 'text', nullable: true })
  followUpAction: string;

  @Column({ type: 'var char', nullable: true })
  followUpResponsible: string;

  @Column({ type: 'boolean', default: false })
  followUpCompleted: boolean;

  @Column({ type: 'date', nullable: true })
  followUpCompletedDate: Date;

  // ========================================
  // RELATED CORRESPONDENCE
  // ========================================

  @Column({ type: 'var char', nullable: true })
  relatedToCorrespondenceId: string;

  @Column({ type: 'var char', nullable: true })
  previousCorrespondenceReference: string;

  @Column({ type: 'text', nullable: true })
  relatedCorrespondenceNotes: string;

  // ========================================
  // ACKNOWLEDGMENT
  // ========================================

  @Column({ type: 'boolean', default: false })
  acknowledgmentReceived: boolean;

  @Column({ type: 'date', nullable: true })
  acknowledgmentDate: Date;

  @Column({ type: 'var char', nullable: true })
  acknowledgmentReference: string;

  // ========================================
  // IMPACT ON CASE
  // ========================================

  @Column({ type: 'text', nullable: true })
  impactOnCase: string;

  @Column({ type: 'text', nullable: true })
  nextSteps: string;

  @Column({ type: 'simple-json', nullable: true })
  actionsRequired: Array<{
    action: string;
    dueDate: Date;
    assignedTo: string;
    priority: string;
    status: string;
  }>;

  // ========================================
  // QUALITY ASSURANCE
  // ========================================

  @Column({ type: 'boolean', default: false })
  reviewedByManager: boolean;

  @Column({ type: 'var char', nullable: true })
  reviewedBy: string;

  @Column({ type: 'date', nullable: true })
  reviewedDate: Date;

  @Column({ type: 'text', nullable: true })
  reviewComments: string;

  // ========================================
  // COMMUNICATION WITH CHILD
  // ========================================

  @Column({ type: 'boolean', default: false })
  childInformed: boolean;

  @Column({ type: 'date', nullable: true })
  childInformedDate: Date;

  @Column({ type: 'var char', nullable: true })
  childInformedBy: string;

  @Column({ type: 'text', nullable: true })
  childInformedMethod: string;

  @Column({ type: 'text', nullable: true })
  childReaction: string;

  // ========================================
  // AUDIT TRAIL
  // ========================================

  @Column({ type: 'var char' })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'var char', nullable: true })
  updatedBy: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // ========================================
  // COMPUTED METHODS
  // ========================================

  /**
   * Check if response is overdue
   */
  isResponseOverdue(): boolean {
    if (!this.responseDeadline) return false;
    if (this.responseReceived) return false;
    const today = new Date();
    const deadline = new Date(this.responseDeadline);
    return deadline < today;
  }

  /**
   * Get days until response deadline
   */
  getDaysUntilDeadline(): number | null {
    if (!this.responseDeadline) return null;
    const today = new Date();
    const deadline = new Date(this.responseDeadline);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if deadline is approaching (within 7 days)
   */
  isDeadlineApproaching(): boolean {
    const daysUntil = this.getDaysUntilDeadline();
    returndaysUntil !== null && daysUntil <= 7 && daysUntil >= 0;
  }

  /**
   * Get days since sent
   */
  getDaysSinceSent(): number | null {
    if (!this.sentDate) return null;
    const today = new Date();
    const sent = new Date(this.sentDate);
    const diffTime = today.getTime() - sent.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if awaiting acknowledgment (sent over 5 working days ago)
   */
  isAwaitingAcknowledgment(): boolean {
    if (this.acknowledgmentReceived) return false;
    if (!this.sentDate) return false;
    const daysSinceSent = this.getDaysSinceSent();
    returndaysSinceSent !== null && daysSinceSent > 7;
  }

  /**
   * Get outstanding actions
   */
  getOutstandingActions(): Array<any> {
    if (!this.actionsRequired) return [];
    return this.actionsRequired.filter(a => a.status !== 'COMPLETED');
  }

  /**
   * Check if requires urgent attention
   */
  requiresUrgentAttention(): boolean {
    return (
      this.urgentResponse ||
      this.isResponseOverdue() ||
      this.isDeadlineApproaching() ||
      this.getOutstandingActions().length > 0
    );
  }
}
