import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Right to Work Notification Entity for WriteCareNotes
 * @module RightToWorkNotificationEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Right to Work notification entity for managing notifications, alerts,
 * and compliance tracking for Right to Work verification processes.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IsUUID, IsEnum, IsString, IsBoolean, IsDate, Length, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { RightToWorkCheck } from './RightToWorkCheck';
import { logger } from '@/utils/logger';

/**
 * Right to Work notification type enumeration
 */
export enum RightToWorkNotificationType {
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
  VERIFICATION_STARTED = 'verification_started',
  VERIFICATION_COMPLETED = 'verification_completed',
  VERIFICATION_APPROVED = 'verification_approved',
  VERIFICATION_REJECTED = 'verification_rejected',
  EXPIRY_WARNING = 'expiry_warning',
  EXPIRED = 'expired',
  RENEWAL_REQUIRED = 'renewal_required',
  COMPLIANCE_ALERT = 'compliance_alert',
  RISK_ASSESSMENT = 'risk_assessment',
  SYSTEM_ALERT = 'system_alert'
}

/**
 * Right to Work notification priority enumeration
 */
export enum RightToWorkNotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * Right to Work notification status enumeration
 */
export enum RightToWorkNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Right to Work notification channel enumeration
 */
export enum RightToWorkNotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  SYSTEM_LOG = 'system_log',
  DASHBOARD = 'dashboard'
}

/**
 * Right to Work notification entity for comprehensive notification management
 */
@Entity('wcn_right_to_work_notifications')
@Index(['rightToWorkCheckId', 'notificationType'])
@Index(['status', 'priority'])
@Index(['createdAt', 'status'])
@Index(['recipientId', 'status'])
export class RightToWorkNotification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Right to Work Check Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  rightToWorkCheckId!: string;

  @ManyToOne(() => RightToWorkCheck, check => check.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rightToWorkCheckId' })
  rightToWorkCheck?: RightToWorkCheck;

  // Notification Details
  @Column({ type: 'enum', enum: RightToWorkNotificationType })
  @IsEnum(RightToWorkNotificationType)
  notificationType!: RightToWorkNotificationType;

  @Column({ type: 'enum', enum: RightToWorkNotificationPriority, default: RightToWorkNotificationPriority.MEDIUM })
  @IsEnum(RightToWorkNotificationPriority)
  priority!: RightToWorkNotificationPriority;

  @Column({ type: 'enum', enum: RightToWorkNotificationStatus, default: RightToWorkNotificationStatus.PENDING })
  @IsEnum(RightToWorkNotificationStatus)
  status!: RightToWorkNotificationStatus;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  title!: string;

  @Column({ type: 'text' })
  @IsString()
  message!: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  detailedMessage?: string;

  // Recipient Information
  @Column({ type: 'uuid' })
  @IsUUID()
  recipientId!: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  recipientName!: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  recipientEmail!: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 20)
  recipientPhone?: string;

  // Delivery Information
  @Column({ type: 'enum', enum: RightToWorkNotificationChannel })
  @IsEnum(RightToWorkNotificationChannel)
  channel!: RightToWorkNotificationChannel;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  deliveredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  readAt?: Date;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  retryCount!: number;

  @Column({ type: 'integer', default: 3 })
  @IsNumber()
  maxRetries!: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  failureReason?: string;

  // Notification Content
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  actionData?: Record<string, any>;

  @Column({ type: 'var char', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  actionUrl?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  actionLabel?: string;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  careHomeId?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  department?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isComplianceCritical!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresAcknowledgment!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  acknowledgedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  acknowledgedBy?: string;

  // Audit Fields
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  /**
   * Validate Right to Work notification before insert
   */
  @BeforeInsert()
  async validateRightToWorkNotificationBeforeInsert(): Promise<void> {
    this.validateRightToWorkNotificationData();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('Right to Work notification created', {
      notificationId: this.id,
      rightToWorkCheckId: this.rightToWorkCheckId,
      notificationType: this.notificationType,
      priority: this.priority,
      auditTrail: true
    });
  }

  /**
   * Validate Right to Work notification before update
   */
  @BeforeUpdate()
  async validateRightToWorkNotificationBeforeUpdate(): Promise<void> {
    this.validateRightToWorkNotificationData();
    
    console.info('Right to Work notification updated', {
      notificationId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate Right to Work notification data
   */
  private validateRightToWorkNotificationData(): void {
    if (this.scheduledAt && this.scheduledAt < new Date()) {
      throw new Error('Scheduled time cannot be in the past');
    }

    if (this.retryCount > this.maxRetries) {
      throw new Error('Retry count cannot exceed max retries');
    }

    if (this.isComplianceCritical && this.priority === RightToWorkNotificationPriority.LOW) {
      throw new Error('Compliance critical notifications must have higher priority');
    }
  }

  /**
   * Send notification
   */
  sendNotification(sentBy: string): void {
    if (this.status !== RightToWorkNotificationStatus.PENDING) {
      throw new Error('Notification must be pending to be sent');
    }

    this.status = RightToWorkNotificationStatus.SENT;
    this.sentAt = new Date();
    this.updatedBy = sentBy;

    console.info('Right to Work notification sent', {
      notificationId: this.id,
      recipientEmail: this.recipientEmail,
      channel: this.channel,
      sentBy,
      auditTrail: true
    });
  }

  /**
   * Mark notification as delivered
   */
  markAsDelivered(): void {
    if (this.status !== RightToWorkNotificationStatus.SENT) {
      throw new Error('Notification must be sent to be marked as delivered');
    }

    this.status = RightToWorkNotificationStatus.DELIVERED;
    this.deliveredAt = new Date();

    console.info('Right to Work notification delivered', {
      notificationId: this.id,
      recipientEmail: this.recipientEmail,
      auditTrail: true
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead(readBy: string): void {
    if (this.status !== RightToWorkNotificationStatus.DELIVERED && this.status !== RightToWorkNotificationStatus.SENT) {
      throw new Error('Notification must be delivered or sent to be marked as read');
    }

    this.status = RightToWorkNotificationStatus.READ;
    this.readAt = new Date();
    this.updatedBy = readBy;

    console.info('Right to Work notification read', {
      notificationId: this.id,
      readBy,
      auditTrail: true
    });
  }

  /**
   * Mark notification as failed
   */
  markAsFailed(reason: string): void {
    this.status = RightToWorkNotificationStatus.FAILED;
    this.failureReason = reason;
    this.retryCount += 1;

    console.info('Right to Work notification failed', {
      notificationId: this.id,
      reason,
      retryCount: this.retryCount,
      auditTrail: true
    });
  }

  /**
   * Retry notification
   */
  retryNotification(retriedBy: string): void {
    if (this.status !== RightToWorkNotificationStatus.FAILED) {
      throw new Error('Only failed notifications can be retried');
    }

    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.status = RightToWorkNotificationStatus.PENDING;
    this.updatedBy = retriedBy;

    console.info('Right to Work notification retried', {
      notificationId: this.id,
      retryCount: this.retryCount,
      retriedBy,
      auditTrail: true
    });
  }

  /**
   * Acknowledge notification
   */
  acknowledgeNotification(acknowledgedBy: string): void {
    if (!this.requiresAcknowledgment) {
      throw new Error('Notification does not require acknowledgment');
    }

    this.acknowledgedAt = new Date();
    this.acknowledgedBy = acknowledgedBy;

    console.info('Right to Work notification acknowledged', {
      notificationId: this.id,
      acknowledgedBy,
      auditTrail: true
    });
  }

  /**
   * Cancel notification
   */
  cancelNotification(cancelledBy: string): void {
    if (this.status === RightToWorkNotificationStatus.READ) {
      throw new Error('Cannot cancel read notifications');
    }

    this.status = RightToWorkNotificationStatus.CANCELLED;
    this.updatedBy = cancelledBy;

    console.info('Right to Work notification cancelled', {
      notificationId: this.id,
      cancelledBy,
      auditTrail: true
    });
  }

  /**
   * Check if notification can be retried
   */
  canRetry(): boolean {
    return this.status === RightToWorkNotificationStatus.FAILED && this.retryCount < this.maxRetries;
  }

  /**
   * Check if notification is overdue
   */
  isOverdue(): boolean {
    if (!this.scheduledAt) return false;
    return new Date() > this.scheduledAt && this.status === RightToWorkNotificationStatus.PENDING;
  }

  /**
   * Get notification summary
   */
  getNotificationSummary(): {
    id: string;
    type: RightToWorkNotificationType;
    priority: RightToWorkNotificationPriority;
    status: RightToWorkNotificationStatus;
    title: string;
    recipientEmail: string;
    channel: RightToWorkNotificationChannel;
    createdAt: Date;
    sentAt: Date | null;
    readAt: Date | null;
    isOverdue: boolean;
    canRetry: boolean;
  } {
    return {
      id: this.id,
      type: this.notificationType,
      priority: this.priority,
      status: this.status,
      title: this.title,
      recipientEmail: this.recipientEmail,
      channel: this.channel,
      createdAt: this.createdAt,
      sentAt: this.sentAt || null,
      readAt: this.readAt || null,
      isOverdue: this.isOverdue(),
      canRetry: this.canRetry()
    };
  }

  /**
   * Get delivery status
   */
  getDeliveryStatus(): {
    status: RightToWorkNotificationStatus;
    sentAt: Date | null;
    deliveredAt: Date | null;
    readAt: Date | null;
    retryCount: number;
    maxRetries: number;
    failureReason: string | null;
    isOverdue: boolean;
  } {
    return {
      status: this.status,
      sentAt: this.sentAt || null,
      deliveredAt: this.deliveredAt || null,
      readAt: this.readAt || null,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      failureReason: this.failureReason || null,
      isOverdue: this.isOverdue()
    };
  }
}

export default RightToWorkNotification;
