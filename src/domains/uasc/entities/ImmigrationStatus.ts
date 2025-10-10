/**
 * ============================================================================
 * Immigration Status Entity
 * ============================================================================
 * 
 * @fileoverview Immigration status tracking for UASC including visa types,
 * leave to remain, and asylum claim progress.
 * 
 * @module domains/uasc/entities/ImmigrationStatus
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Represents the immigration status of an unaccompanied asylum-seeking child
 * including asylum claims, appeals, leave to remain, and immigration decisions.
 * Tracks Home Office interactions and deadlines.
 * 
 * @compliance
 * - Immigration Act 2016
 * - Immigration Rules
 * - Asylum Support Regulations 2000
 * - OFSTED Regulation 17 (Records)
 * 
 * @features
 * - Asylum claim tracking
 * - Leave to remain monitoring
 * - Appeal process management
 * - Home Office deadline tracking
 * - Immigration decision recording
 * - Visa and permit tracking
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

export enum ImmigrationStatusType {
  ASYLUM_SEEKER = 'ASYLUM_SEEKER',
  REFUGEE = 'REFUGEE',
  HUMANITARIAN_PROTECTION = 'HUMANITARIAN_PROTECTION',
  DISCRETIONARY_LEAVE = 'DISCRETIONARY_LEAVE',
  LIMITED_LEAVE_TO_REMAIN = 'LIMITED_LEAVE_TO_REMAIN',
  INDEFINITE_LEAVE_TO_REMAIN = 'INDEFINITE_LEAVE_TO_REMAIN',
  EU_SETTLED_STATUS = 'EU_SETTLED_STATUS',
  EU_PRE_SETTLED_STATUS = 'EU_PRE_SETTLED_STATUS',
  REFUSED = 'REFUSED',
  APPEAL_PENDING = 'APPEAL_PENDING',
  UNDOCUMENTED = 'UNDOCUMENTED'
}

export enum AsylumClaimStatus {
  NOT_YET_SUBMITTED = 'NOT_YET_SUBMITTED',
  SUBMITTED = 'SUBMITTED',
  SCREENING_INTERVIEW_SCHEDULED = 'SCREENING_INTERVIEW_SCHEDULED',
  SCREENING_INTERVIEW_COMPLETED = 'SCREENING_INTERVIEW_COMPLETED',
  SUBSTANTIVE_INTERVIEW_SCHEDULED = 'SUBSTANTIVE_INTERVIEW_SCHEDULED',
  SUBSTANTIVE_INTERVIEW_COMPLETED = 'SUBSTANTIVE_INTERVIEW_COMPLETED',
  UNDER_CONSIDERATION = 'UNDER_CONSIDERATION',
  DECISION_PENDING = 'DECISION_PENDING',
  GRANTED = 'GRANTED',
  REFUSED = 'REFUSED',
  WITHDRAWN = 'WITHDRAWN',
  ABANDONED = 'ABANDONED'
}

export enum AppealStage {
  FIRST_TIER_TRIBUNAL = 'FIRST_TIER_TRIBUNAL',
  UPPER_TRIBUNAL = 'UPPER_TRIBUNAL',
  COURT_OF_APPEAL = 'COURT_OF_APPEAL',
  SUPREME_COURT = 'SUPREME_COURT',
  JUDICIAL_REVIEW = 'JUDICIAL_REVIEW'
}

export enum AppealStatus {
  NOT_APPEALED = 'NOT_APPEALED',
  APPEAL_LODGED = 'APPEAL_LODGED',
  APPEAL_PENDING = 'APPEAL_PENDING',
  HEARING_SCHEDULED = 'HEARING_SCHEDULED',
  APPEAL_ALLOWED = 'APPEAL_ALLOWED',
  APPEAL_DISMISSED = 'APPEAL_DISMISSED',
  APPEAL_WITHDRAWN = 'APPEAL_WITHDRAWN'
}

// ========================================
// IMMIGRATION STATUS ENTITY
// ========================================

@Entity('immigration_statuses')
export class ImmigrationStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @Column({ type: 'varchar', unique: true })
  statusNumber: string; // Format: IS-YYYY-NNNN

  @ManyToOne(() => UASCProfile)
  @JoinColumn({ name: 'uascProfileId' })
  uascProfile: UASCProfile;

  @Column()
  uascProfileId: string;

  @Column({ type: 'date' })
  statusDate: Date;

  @Column({
    type: 'enum',
    enum: ImmigrationStatusType
  })
  statusType: ImmigrationStatusType;

  @Column({ type: 'boolean', default: true })
  isCurrent: boolean;

  // ========================================
  // HOME OFFICE DETAILS
  // ========================================

  @Column({ type: 'varchar', nullable: true })
  homeOfficeReference: string;

  @Column({ type: 'varchar', nullable: true })
  portReferenceNumber: string;

  @Column({ type: 'varchar', nullable: true })
  applicationReferenceNumber: string;

  @Column({ type: 'varchar', nullable: true })
  uniqueApplicationNumber: string; // UAN

  // ========================================
  // ASYLUM CLAIM
  // ========================================

  @Column({
    type: 'enum',
    enum: AsylumClaimStatus,
    default: AsylumClaimStatus.NOT_YET_SUBMITTED
  })
  asylumClaimStatus: AsylumClaimStatus;

  @Column({ type: 'date', nullable: true })
  asylumClaimSubmittedDate: Date;

  @Column({ type: 'text', nullable: true })
  asylumClaimBasis: string;

  @Column({ type: 'text', nullable: true })
  protectionClaimed: string;

  // ========================================
  // SCREENING INTERVIEW
  // ========================================

  @Column({ type: 'date', nullable: true })
  screeningInterviewDate: Date;

  @Column({ type: 'varchar', nullable: true })
  screeningInterviewLocation: string;

  @Column({ type: 'boolean', default: false })
  screeningInterviewCompleted: boolean;

  @Column({ type: 'text', nullable: true })
  screeningInterviewNotes: string;

  // ========================================
  // SUBSTANTIVE INTERVIEW
  // ========================================

  @Column({ type: 'date', nullable: true })
  substantiveInterviewDate: Date;

  @Column({ type: 'varchar', nullable: true })
  substantiveInterviewLocation: string;

  @Column({ type: 'boolean', default: false })
  substantiveInterviewCompleted: boolean;

  @Column({ type: 'text', nullable: true })
  substantiveInterviewNotes: string;

  @Column({ type: 'varchar', nullable: true })
  interpreterLanguage: string;

  @Column({ type: 'boolean', default: false })
  appropriateAdultPresent: boolean;

  @Column({ type: 'varchar', nullable: true })
  appropriateAdultName: string;

  // ========================================
  // DECISION
  // ========================================

  @Column({ type: 'date', nullable: true })
  decisionDate: Date;

  @Column({ type: 'varchar', nullable: true })
  decisionType: string;

  @Column({ type: 'text', nullable: true })
  decisionDetails: string;

  @Column({ type: 'text', nullable: true })
  decisionReasoning: string;

  @Column({ type: 'date', nullable: true })
  decisionReceivedDate: Date;

  // ========================================
  // LEAVE TO REMAIN
  // ========================================

  @Column({ type: 'varchar', nullable: true })
  leaveToRemainType: string;

  @Column({ type: 'date', nullable: true })
  leaveGrantedDate: Date;

  @Column({ type: 'date', nullable: true })
  leaveExpiryDate: Date;

  @Column({ type: 'int', nullable: true })
  leaveDurationMonths: number;

  @Column({ type: 'boolean', default: false })
  noRecourseToPublicFunds: boolean;

  @Column({ type: 'text', nullable: true })
  leaveConditions: string;

  // ========================================
  // BIOMETRIC RESIDENCE PERMIT
  // ========================================

  @Column({ type: 'boolean', default: false })
  biometricResidencePermit: boolean;

  @Column({ type: 'varchar', nullable: true })
  brpNumber: string;

  @Column({ type: 'date', nullable: true })
  brpIssueDate: Date;

  @Column({ type: 'date', nullable: true })
  brpExpiryDate: Date;

  @Column({ type: 'date', nullable: true })
  brpCollectionDate: Date;

  @Column({ type: 'varchar', nullable: true })
  brpCollectionLocation: string;

  // ========================================
  // APPEAL
  // ========================================

  @Column({
    type: 'enum',
    enum: AppealStatus,
    default: AppealStatus.NOT_APPEALED
  })
  appealStatus: AppealStatus;

  @Column({ type: 'date', nullable: true })
  appealLodgedDate: Date;

  @Column({ type: 'date', nullable: true })
  appealDeadline: Date;

  @Column({
    type: 'enum',
    enum: AppealStage,
    nullable: true
  })
  appealStage: AppealStage;

  @Column({ type: 'varchar', nullable: true })
  appealReferenceNumber: string;

  @Column({ type: 'text', nullable: true })
  appealGrounds: string;

  @Column({ type: 'date', nullable: true })
  appealHearingDate: Date;

  @Column({ type: 'varchar', nullable: true })
  appealHearingLocation: string;

  @Column({ type: 'date', nullable: true })
  appealDecisionDate: Date;

  @Column({ type: 'varchar', nullable: true })
  appealOutcome: string;

  @Column({ type: 'text', nullable: true })
  appealDecisionRationale: string;

  // ========================================
  // FURTHER SUBMISSIONS
  // ========================================

  @Column({ type: 'boolean', default: false })
  furtherSubmissionsMade: boolean;

  @Column({ type: 'date', nullable: true })
  furtherSubmissionsDate: Date;

  @Column({ type: 'text', nullable: true })
  furtherSubmissionsDetails: string;

  @Column({ type: 'varchar', nullable: true })
  furtherSubmissionsOutcome: string;

  // ========================================
  // FRESH CLAIM
  // ========================================

  @Column({ type: 'boolean', default: false })
  freshClaimMade: boolean;

  @Column({ type: 'date', nullable: true })
  freshClaimDate: Date;

  @Column({ type: 'text', nullable: true })
  freshClaimBasis: string;

  @Column({ type: 'varchar', nullable: true })
  freshClaimStatus: string;

  // ========================================
  // LEGAL REPRESENTATION
  // ========================================

  @Column({ type: 'varchar', nullable: true })
  solicitorName: string;

  @Column({ type: 'varchar', nullable: true })
  solicitorFirm: string;

  @Column({ type: 'varchar', nullable: true })
  solicitorEmail: string;

  @Column({ type: 'varchar', nullable: true })
  solicitorPhone: string;

  @Column({ type: 'varchar', nullable: true })
  legalAidReference: string;

  @Column({ type: 'boolean', default: false })
  legalAidGranted: boolean;

  // ========================================
  // DEADLINES AND ACTIONS
  // ========================================

  @Column({ type: 'simple-json', nullable: true })
  upcomingDeadlines: Array<{
    deadline: Date;
    description: string;
    actionRequired: string;
    responsible: string;
    status: string;
  }>;

  @Column({ type: 'simple-json', nullable: true })
  outstandingActions: Array<{
    action: string;
    dueDate: Date;
    assignedTo: string;
    priority: string;
    status: string;
  }>;

  // ========================================
  // REMOVAL AND DEPORTATION
  // ========================================

  @Column({ type: 'boolean', default: false })
  removalDirectionIssued: boolean;

  @Column({ type: 'date', nullable: true })
  removalDirectionDate: Date;

  @Column({ type: 'text', nullable: true })
  removalDirectionDetails: string;

  @Column({ type: 'boolean', default: false })
  deportationOrderIssued: boolean;

  @Column({ type: 'date', nullable: true })
  deportationOrderDate: Date;

  @Column({ type: 'text', nullable: true })
  deportationOrderDetails: string;

  // ========================================
  // DETENTION
  // ========================================

  @Column({ type: 'boolean', default: false })
  currentlyDetained: boolean;

  @Column({ type: 'date', nullable: true })
  detentionStartDate: Date;

  @Column({ type: 'varchar', nullable: true })
  detentionLocation: string;

  @Column({ type: 'text', nullable: true })
  detentionReason: string;

  @Column({ type: 'date', nullable: true })
  expectedReleaseDate: Date;

  // ========================================
  // NATIONALITY AND TRAVEL DOCUMENTS
  // ========================================

  @Column({ type: 'varchar', nullable: true })
  nationality: string;

  @Column({ type: 'boolean', default: false })
  hasPassport: boolean;

  @Column({ type: 'varchar', nullable: true })
  passportNumber: string;

  @Column({ type: 'date', nullable: true })
  passportExpiryDate: Date;

  @Column({ type: 'boolean', default: false })
  travelDocumentIssued: boolean;

  @Column({ type: 'varchar', nullable: true })
  travelDocumentType: string;

  @Column({ type: 'varchar', nullable: true })
  travelDocumentNumber: string;

  @Column({ type: 'date', nullable: true })
  travelDocumentExpiryDate: Date;

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
   * Check if leave to remain is expiring soon (within 3 months)
   */
  isLeaveExpiringSoon(): boolean {
    if (!this.leaveExpiryDate) return false;
    const today = new Date();
    const expiry = new Date(this.leaveExpiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= today;
  }

  /**
   * Check if BRP is expiring soon (within 3 months)
   */
  isBRPExpiringSoon(): boolean {
    if (!this.brpExpiryDate) return false;
    const today = new Date();
    const expiry = new Date(this.brpExpiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= today;
  }

  /**
   * Check if appeal deadline is approaching (within 7 days)
   */
  isAppealDeadlineApproaching(): boolean {
    if (!this.appealDeadline) return false;
    const today = new Date();
    const deadline = new Date(this.appealDeadline);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return deadline <= sevenDaysFromNow && deadline >= today;
  }

  /**
   * Get days until leave expiry
   */
  getDaysUntilLeaveExpiry(): number | null {
    if (!this.leaveExpiryDate) return null;
    const today = new Date();
    const expiry = new Date(this.leaveExpiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get overdue deadlines
   */
  getOverdueDeadlines(): Array<any> {
    if (!this.upcomingDeadlines) return [];
    const today = new Date();
    return this.upcomingDeadlines.filter(
      d => new Date(d.deadline) < today && d.status !== 'COMPLETED'
    );
  }

  /**
   * Check if has indefinite leave
   */
  hasIndefiniteLeave(): boolean {
    return this.statusType === ImmigrationStatusType.INDEFINITE_LEAVE_TO_REMAIN;
  }

  /**
   * Check if requires urgent attention
   */
  requiresUrgentAttention(): boolean {
    return (
      this.isLeaveExpiringSoon() ||
      this.isBRPExpiringSoon() ||
      this.isAppealDeadlineApproaching() ||
      this.getOverdueDeadlines().length > 0 ||
      this.currentlyDetained
    );
  }
}
