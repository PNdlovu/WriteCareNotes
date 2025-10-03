/**
 * @fileoverview Family Feedback Entity
 * @module FamilyFeedback
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity representing feedback from family members
 * 
 * @compliance
 * - CQC Regulation 10 - Dignity and respect
 * - GDPR and Data Protection Act 2018
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FamilyMember } from './FamilyMember';
import { Resident } from '../resident/Resident';

export enum FeedbackType {
  CARE_QUALITY = 'care_quality',
  COMMUNICATION = 'communication',
  SERVICES = 'services',
  FACILITIES = 'facilities',
  STAFF = 'staff',
  GENERAL = 'general',
  COMPLAINT = 'complaint',
  COMPLIMENT = 'compliment',
  SUGGESTION = 'suggestion',
  QUESTION = 'question',
}

export enum FeedbackStatus {
  SUBMITTED = 'submitted',
  ACKNOWLEDGED = 'acknowledged',
  IN_REVIEW = 'in_review',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  ESCALATED = 'escalated',
}

export enum FeedbackPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum FeedbackCategory {
  COMPLIMENT = 'compliment',
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint',
  QUESTION = 'question',
  INCIDENT = 'incident',
  IMPROVEMENT = 'improvement',
}

@Entity('family_feedback')
@Index(['familyId', 'residentId', 'submittedAt'])
@Index(['status', 'priority'])
@Index(['type', 'submittedAt'])
export class FamilyFeedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  @ManyToOne(() => FamilyMember, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'familyId' })
  familyMember?: FamilyMember;

  @Column({ type: 'uuid' })
  residentId!: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  @Column({ type: 'enum', enum: FeedbackType })
  type!: FeedbackType;

  @Column({ type: 'enum', enum: FeedbackStatus, default: FeedbackStatus.SUBMITTED })
  status!: FeedbackStatus;

  @Column({ type: 'enum', enum: FeedbackPriority, default: FeedbackPriority.MEDIUM })
  priority!: FeedbackPriority;

  @Column({ type: 'enum', enum: FeedbackCategory })
  category!: FeedbackCategory;

  @Column({ type: 'varchar', length: 200 })
  subject!: string;

  @Column({ type: 'text' })
  encryptedComments!: string;

  @Column({ type: 'text', nullable: true })
  encryptedSuggestions?: string;

  @Column({ type: 'integer', nullable: true })
  rating?: number; // 1-5 scale

  @Column({ type: 'jsonb', nullable: true })
  ratings?: {
    overall?: number;
    careQuality?: number;
    communication?: number;
    staff?: number;
    facilities?: number;
    cleanliness?: number;
    food?: number;
    activities?: number;
    safety?: number;
    responsiveness?: number;
  };

  @Column({ type: 'boolean', default: false })
  anonymous!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  anonymousId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  submittedBy?: string;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  acknowledgedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  closedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  closedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  escalatedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  escalatedTo?: string;

  @Column({ type: 'text', nullable: true })
  encryptedResponse?: string;

  @Column({ type: 'text', nullable: true })
  encryptedActionTaken?: string;

  @Column({ type: 'text', nullable: true })
  encryptedFollowUp?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  internalNotes?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  resolutionNotes?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  escalationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    description?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    source?: string; // web, mobile, email, phone, in_person
    channel?: string;
    deviceType?: string;
    browser?: string;
    location?: string;
    referrer?: string;
    campaign?: string;
    tags?: string[];
    department?: string;
    staffMember?: string;
    incidentId?: string;
    relatedFeedbackId?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  auditTrail?: Array<{
    action: string;
    timestamp: Date;
    performedBy: string;
    details?: string;
    oldValue?: any;
    newValue?: any;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  followUp?: {
    required: boolean;
    scheduledDate?: Date;
    completedDate?: Date;
    completedBy?: string;
    notes?: string;
    nextFollowUp?: Date;
  };

  @Column({ type: 'boolean', default: false })
  requiresFollowUp!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  followUpDueAt?: Date;

  @Column({ type: 'boolean', default: false })
  isPublic!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  archivedBy?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  archiveReason?: string;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deletedBy?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  deletionReason?: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deviceId?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  language?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  timezone?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Methods
  isHighPriority(): boolean {
    return this.priority === FeedbackPriority.HIGH || this.priority === FeedbackPriority.URGENT;
  }

  isUrgent(): boolean {
    return this.priority === FeedbackPriority.URGENT;
  }

  isComplaint(): boolean {
    return this.category === FeedbackCategory.COMPLAINT || this.type === FeedbackType.COMPLAINT;
  }

  isCompliment(): boolean {
    return this.category === FeedbackCategory.COMPLIMENT || this.type === FeedbackType.COMPLIMENT;
  }

  isSuggestion(): boolean {
    return this.category === FeedbackCategory.SUGGESTION || this.type === FeedbackType.SUGGESTION;
  }

  isResolved(): boolean {
    return this.status === FeedbackStatus.RESOLVED || this.status === FeedbackStatus.CLOSED;
  }

  isOpen(): boolean {
    return !this.isResolved() && !this.isArchived && !this.isDeleted;
  }

  isOverdue(): boolean {
    if (!this.followUpDueAt) return false;
    return this.followUpDueAt < new Date() && !this.isResolved();
  }

  getDaysSinceSubmission(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.submittedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceLastUpdate(): number {
    const now = new Date();
    const diffTime = now.getTime() - this.updatedAt.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  getOverallRating(): number | null {
    if (this.rating) return this.rating;
    if (this.ratings?.overall) return this.ratings.overall;
    return null;
  }

  getAverageRating(): number | null {
    if (!this.ratings) return this.getOverallRating();
    
    const ratingValues = Object.values(this.ratings).filter(
      (value): value is number => typeof value === 'number'
    );
    
    if (ratingValues.length === 0) return this.getOverallRating();
    
    return ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
  }

  isPositiveFeedback(): boolean {
    const rating = this.getOverallRating();
    return rating !== null && rating >= 4;
  }

  isNegativeFeedback(): boolean {
    const rating = this.getOverallRating();
    return rating !== null && rating <= 2;
  }

  acknowledge(acknowledgedBy: string): void {
    this.status = FeedbackStatus.ACKNOWLEDGED;
    this.acknowledgedBy = acknowledgedBy;
    this.acknowledgedAt = new Date();
    
    this.addAuditTrail('ACKNOWLEDGED', acknowledgedBy);
  }

  assign(assignedTo: string, assignedBy: string): void {
    this.assignedTo = assignedTo;
    this.assignedAt = new Date();
    this.status = FeedbackStatus.IN_REVIEW;
    
    this.addAuditTrail('ASSIGNED', assignedBy, `Assigned to ${assignedTo}`);
  }

  escalate(escalatedBy: string, escalatedTo: string, reason: string): void {
    this.escalatedBy = escalatedBy;
    this.escalatedTo = escalatedTo;
    this.escalatedAt = new Date();
    this.escalationReason = reason;
    this.status = FeedbackStatus.ESCALATED;
    this.priority = FeedbackPriority.HIGH;
    
    this.addAuditTrail('ESCALATED', escalatedBy, `Escalated to ${escalatedTo}: ${reason}`);
  }

  resolve(resolvedBy: string, actionTaken: string, notes?: string): void {
    this.status = FeedbackStatus.RESOLVED;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.encryptedActionTaken = actionTaken; // Should be encrypted
    this.resolutionNotes = notes;
    
    this.addAuditTrail('RESOLVED', resolvedBy, notes);
  }

  close(closedBy: string, reason?: string): void {
    this.status = FeedbackStatus.CLOSED;
    this.closedBy = closedBy;
    this.closedAt = new Date();
    this.resolutionNotes = reason;
    
    this.addAuditTrail('CLOSED', closedBy, reason);
  }

  archive(archivedBy: string, reason?: string): void {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
    this.archiveReason = reason;
    
    this.addAuditTrail('ARCHIVED', archivedBy, reason);
  }

  softDelete(deletedBy: string, reason?: string): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.deletionReason = reason;
    
    this.addAuditTrail('DELETED', deletedBy, reason);
  }

  setFollowUp(required: boolean, dueDate?: Date, notes?: string): void {
    this.requiresFollowUp = required;
    this.followUpDueAt = dueDate;
    this.followUp = {
      required,
      scheduledDate: dueDate,
      notes,
    };
    
    this.addAuditTrail('FOLLOW_UP_SET', 'system', `Follow-up ${required ? 'required' : 'not required'}`);
  }

  completeFollowUp(completedBy: string, notes?: string): void {
    if (this.followUp) {
      this.followUp.completedDate = new Date();
      this.followUp.completedBy = completedBy;
      this.followUp.notes = notes;
    }
    this.requiresFollowUp = false;
    
    this.addAuditTrail('FOLLOW_UP_COMPLETED', completedBy, notes);
  }

  private addAuditTrail(action: string, performedBy: string, details?: string): void {
    this.auditTrail = this.auditTrail || [];
    this.auditTrail.push({
      action,
      timestamp: new Date(),
      performedBy,
      details,
    });
  }

  getDisplayStatus(): string {
    if (this.isArchived) return 'Archived';
    if (this.isDeleted) return 'Deleted';
    return this.status.charAt(0).toUpperCase() + this.status.slice(1).toLowerCase();
  }

  getDisplayPriority(): string {
    return this.priority.charAt(0).toUpperCase() + this.priority.slice(1).toLowerCase();
  }

  getDisplayType(): string {
    return this.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getDisplayCategory(): string {
    return this.category.charAt(0).toUpperCase() + this.category.slice(1).toLowerCase();
  }

  getSummary(): any {
    return {
      id: this.id,
      type: this.type,
      category: this.category,
      status: this.status,
      priority: this.priority,
      rating: this.getOverallRating(),
      averageRating: this.getAverageRating(),
      isPositive: this.isPositiveFeedback(),
      isNegative: this.isNegativeFeedback(),
      isComplaint: this.isComplaint(),
      isCompliment: this.isCompliment(),
      isSuggestion: this.isSuggestion(),
      isResolved: this.isResolved(),
      isOpen: this.isOpen(),
      isOverdue: this.isOverdue(),
      daysSinceSubmission: this.getDaysSinceSubmission(),
      daysSinceLastUpdate: this.getDaysSinceLastUpdate(),
      requiresFollowUp: this.requiresFollowUp,
      followUpDue: this.followUpDueAt,
      anonymous: this.anonymous,
      submittedAt: this.submittedAt,
    };
  }

  toJSON(): any {
    const { 
      encryptedComments, 
      encryptedSuggestions, 
      encryptedResponse, 
      encryptedActionTaken, 
      encryptedFollowUp,
      auditTrail,
      ...safeData 
    } = this;
    return safeData;
  }
}