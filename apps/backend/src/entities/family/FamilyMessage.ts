/**
 * @fileoverview Family Message Entity
 * @module FamilyMessage
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity representing messages between family members and care team
 * 
 * @compliance
 * - GDPR and Data Protection Act 2018
 * - CQC Regulation 10 - Dignity and respect
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { FamilyMember } from './FamilyMember';
import { Resident } from '../resident/Resident';

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum MessageStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
}

export enum MessageType {
  GENERAL = 'general',
  CARE_UPDATE = 'care_update',
  MEDICAL_ALERT = 'medical_alert',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  EMERGENCY = 'emergency',
  PHOTO_SHARE = 'photo_share',
  VIDEO_CALL_REQUEST = 'video_call_request',
  FEEDBACK = 'feedback',
  CONSENT_REQUEST = 'consent_request',
  SYSTEM_NOTIFICATION = 'system_notification',
}

@Entity('family_messages')
@Index(['familyId', 'residentId', 'createdAt'])
@Index(['familyId', 'read'])
@Index(['priority', 'createdAt'])
export class FamilyMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => FamilyMember, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  familyMember!: FamilyMember;

  @Column({ type: 'uuid' })
  residentId!: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  @Column({ type: 'var char', length: 200 })
  subject!: string;

  @Column({ type: 'text' })
  encryptedContent!: string;

  @Column({ type: 'enum', enum: MessageType, default: MessageType.GENERAL })
  type!: MessageType;

  @Column({ type: 'enum', enum: MessagePriority, default: MessagePriority.NORMAL })
  priority!: MessagePriority;

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status!: MessageStatus;

  @Column({ type: 'boolean', default: false })
  fromFamily!: boolean;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({ type: 'boolean', default: false })
  requiresAcknowledgment!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  acknowledgmentNotes?: string;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    thumbnailUrl?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    originalMessageId?: string;
    replyToMessageId?: string;
    forwardedFrom?: string;
    tags?: string[];
    category?: string;
    urgency?: string;
    followUpRequired?: boolean;
    followUpDate?: Date;
    assignedTo?: string;
    department?: string;
  };

  @Column({ type: 'var char', length: 255, nullable: true })
  senderName?: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  senderEmail?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  senderPhone?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  senderRole?: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  recipientName?: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  recipientEmail?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  recipientPhone?: string;

  @Column({ type: 'boolean', default: false })
  isEncrypted!: boolean;

  @Column({ type: 'var char', length: 255, nullable: true })
  encryptionKey?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  encryptionAlgorithm?: string;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  archivedBy?: string;

  @Column({ type: 'boolean', default: false })
  isDeleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  deletedBy?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  deletionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledFor?: Date;

  @Column({ type: 'boolean', default: false })
  isScheduled!: boolean;

  @Column({ type: 'var char', length: 255, nullable: true })
  templateId?: string;

  @Column({ type: 'jsonb', nullable: true })
  templateVariables?: Record<string, any>;

  @Column({ type: 'var char', length: 100, nullable: true })
  language?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  timezone?: string;

  @Column({ type: 'jsonb', nullable: true })
  deliveryStatus?: {
    email?: {
      sent: boolean;
      delivered: boolean;
      bounced: boolean;
      opened: boolean;
      clicked: boolean;
      timestamp?: Date;
    };
    sms?: {
      sent: boolean;
      delivered: boolean;
      failed: boolean;
      timestamp?: Date;
    };
    push?: {
      sent: boolean;
      delivered: boolean;
      clicked: boolean;
      timestamp?: Date;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  analytics?: {
    openCount: number;
    clickCount: number;
    replyCount: number;
    forwardCount: number;
    lastOpenedAt?: Date;
    lastClickedAt?: Date;
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Methods
  markAsRead(readBy?: string): void {
    this.read = true;
    this.readAt = new Date();
    this.status = MessageStatus.READ;
    if (readBy) {
      this.metadata = {
        ...this.metadata,
        readBy,
      };
    }
  }

  acknowledge(acknowledgedBy: string, notes?: string): void {
    this.acknowledgedAt = new Date();
    this.acknowledgmentNotes = notes;
    this.metadata = {
      ...this.metadata,
      acknowledgedBy,
    };
  }

  archive(archivedBy: string): void {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
  }

  softDelete(deletedBy: string, reason?: string): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
    this.deletionReason = reason;
  }

  isHighPriority(): boolean {
    return this.priority === MessagePriority.HIGH || this.priority === MessagePriority.URGENT;
  }

  isUrgent(): boolean {
    return this.priority === MessagePriority.URGENT;
  }

  requiresImmediateAttention(): boolean {
    return this.isUrgent() || (this.requiresAcknowledgment && !this.acknowledgedAt);
  }

  getDisplaySubject(): string {
    if (this.isUrgent()) {
      return `🚨 URGENT: ${this.subject}`;
    }
    if (this.priority === MessagePriority.HIGH) {
      return `⚠️ ${this.subject}`;
    }
    return this.subject;
  }

  getSenderDisplayName(): string {
    if (this.senderName) {
      return this.senderName;
    }
    if (this.fromFamily && this.familyMember) {
      return this.familyMember.getDisplayName();
    }
    return 'Care Team';
  }

  getRecipientDisplayName(): string {
    if (this.recipientName) {
      return this.recipientName;
    }
    if (!this.fromFamily && this.familyMember) {
      return this.familyMember.getDisplayName();
    }
    return 'Care Team';
  }

  canBeRepliedTo(): boolean {
    return this.status !== MessageStatus.DELETED && 
           this.status !== MessageStatus.ARCHIVED &&
           !this.isDeleted;
  }

  canBeForwarded(): boolean {
    return this.status !== MessageStatus.DELETED && 
           this.status !== MessageStatus.ARCHIVED &&
           !this.isDeleted &&
           this.type !== MessageType.SYSTEM_NOTIFICATION;
  }

  updateDeliveryStatus(channel: 'email' | 'sms' | 'push', status: Partial<any>): void {
    this.deliveryStatus = {
      ...this.deliveryStatus,
      [channel]: {
        ...this.deliveryStatus?.[channel],
        ...status,
        timestamp: new Date(),
      },
    };
  }

  trackOpen(): void {
    this.analytics = {
      ...this.analytics,
      openCount: (this.analytics?.openCount || 0) + 1,
      lastOpenedAt: new Date(),
    };
  }

  trackClick(): void {
    this.analytics = {
      ...this.analytics,
      clickCount: (this.analytics?.clickCount || 0) + 1,
      lastClickedAt: new Date(),
    };
  }

  toJSON(): any {
    const { 
      encryptedContent, 
      encryptionKey, 
      ...safeData 
    } = this;
    return safeData;
  }
}
