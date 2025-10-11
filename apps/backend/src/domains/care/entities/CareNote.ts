/**
 * @fileoverview CareNote Entity - Care Documentation
 * @module Domains/Care/Entities/CareNote
 * @module 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description
 * Care note entity for documenting daily care activities, observations,
 * and incidents. Critical for compliance and quality care delivery.
 * 
 * Supports:
 * - Daily care notes
 * - Medication observations
 * - Incident reports
 * - Behavioral observations
 * - Handover notes
 * - Visitor logs
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Resident } from './Resident';
import { User } from '../../../entities/User';

export enum CareNoteType {
  DAILY_CARE = 'daily_care',
  MEDICATION = 'medication',
  INCIDENT = 'incident',
  BEHAVIORAL = 'behavioral',
  HANDOVER = 'handover',
  VISITOR = 'visitor',
  ASSESSMENT = 'assessment',
  DIETARY = 'dietary',
  PERSONAL_CARE = 'personal_care',
  SOCIAL_ACTIVITY = 'social_activity',
  MEDICAL_APPOINTMENT = 'medical_appointment',
  OTHER = 'other',
}

export enum CareNotePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum CareNoteStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  REVIEWED = 'reviewed',
  FLAGGED = 'flagged',
  ARCHIVED = 'archived',
}

@Entity('care_notes')
@Index(['residentId', 'createdAt'])
@Index(['tenantId', 'organizationId'])
@Index(['type', 'priority'])
@Index(['status'])
export class CareNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relationships
  @Column({ name: 'resident_id' })
  residentId!: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'resident_id' })
  resident!: Resident;

  @Column({ name: 'author_id' })
  authorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @Column({ name: 'reviewed_by_id', nullable: true })
  reviewedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewedBy?: User;

  // Multi-tenancy
  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  // Note Details
  @Column({
    type: 'enum',
    enum: CareNoteType,
    default: CareNoteType.DAILY_CARE,
  })
  type!: CareNoteType;

  @Column({
    type: 'enum',
    enum: CareNotePriority,
    default: CareNotePriority.MEDIUM,
  })
  priority!: CareNotePriority;

  @Column({
    type: 'enum',
    enum: CareNoteStatus,
    default: CareNoteStatus.SUBMITTED,
  })
  status!: CareNoteStatus;

  @Column({ type: 'var char', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  observations?: string;

  @Column({ type: 'text', nullable: true })
  actions?: string;

  @Column({ type: 'text', nullable: true })
  followUp?: string;

  // Metadata
  @Column({ type: 'timestamp', name: 'note_date', default: () => 'CURRENT_TIMESTAMP' })
  noteDate!: Date;

  @Column({ type: 'var char', length: 50, nullable: true })
  shift?: string; // e.g., "morning", "afternoon", "evening", "night"

  @Column({ type: 'simple-json', nullable: true })
  tags?: string[];

  @Column({ type: 'simple-json', nullable: true })
  attachments?: {
    filename: string;
    url: string;
    type: string;
    uploadedAt: Date;
  }[];

  // Review Information
  @Column({ type: 'timestamp', name: 'reviewed_at', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'text', name: 'review_notes', nullable: true })
  reviewNotes?: string;

  // Flags and Alerts
  @Column({ type: 'boolean', name: 'requires_follow_up', default: false })
  requiresFollowUp!: boolean;

  @Column({ type: 'timestamp', name: 'follow_up_date', nullable: true })
  followUpDate?: Date;

  @Column({ type: 'boolean', name: 'is_flagged', default: false })
  isFlagged!: boolean;

  @Column({ type: 'var char', length: 500, name: 'flag_reason', nullable: true })
  flagReason?: string;

  @Column({ type: 'boolean', name: 'is_confidential', default: false })
  isConfidential!: boolean;

  // Timestamps and Audit
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy?: string;

  @Column({ name: 'deleted_at', nullable: true, type: 'timestamp' })
  deletedAt?: Date;

  @Column({ name: 'deleted_by', nullable: true })
  deletedBy?: string;

  // Computed Properties
  get isOverdue(): boolean {
    if (!this.followUpDate) return false;
    return new Date() > this.followUpDate && this.status !== CareNoteStatus.REVIEWED;
  }

  get isDraft(): boolean {
    return this.status === CareNoteStatus.DRAFT;
  }

  get needsReview(): boolean {
    return (
      this.status === CareNoteStatus.SUBMITTED ||
      this.priority === CareNotePriority.URGENT ||
      this.isFlagged
    );
  }

  get authorName(): string {
    return this.author
      ? `${this.author.firstName} ${this.author.lastName}`
      : 'Unknown Author';
  }

  get residentName(): string {
    return this.resident
      ? `${this.resident.firstName} ${this.resident.lastName}`
      : 'Unknown Resident';
  }

  // Helper Methods
  markAsReviewed(reviewerId: string, reviewNotes?: string): void {
    this.status = CareNoteStatus.REVIEWED;
    this.reviewedById = reviewerId;
    this.reviewedAt = new Date();
    if (reviewNotes) {
      this.reviewNotes = reviewNotes;
    }
  }

  flagNote(reason: string): void {
    this.isFlagged = true;
    this.flagReason = reason;
    this.status = CareNoteStatus.FLAGGED;
  }

  unflagNote(): void {
    this.isFlagged = false;
    this.flagReason = undefined;
    if (this.status === CareNoteStatus.FLAGGED) {
      this.status = CareNoteStatus.SUBMITTED;
    }
  }

  setFollowUp(date: Date): void {
    this.requiresFollowUp = true;
    this.followUpDate = date;
  }

  clearFollowUp(): void {
    this.requiresFollowUp = false;
    this.followUpDate = undefined;
  }

  archive(): void {
    this.status = CareNoteStatus.ARCHIVED;
  }

  addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter((t) => t !== tag);
    }
  }

  addAttachment(filename: string, url: string, type: string): void {
    if (!this.attachments) {
      this.attachments = [];
    }
    this.attachments.push({
      filename,
      url,
      type,
      uploadedAt: new Date(),
    });
  }

  removeAttachment(filename: string): void {
    if (this.attachments) {
      this.attachments = this.attachments.filter((a) => a.filename !== filename);
    }
  }
}
