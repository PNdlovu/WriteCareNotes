import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview DBS Notification Entity for WriteCareNotes
 * @module DBSNotificationEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description DBS notification entity for managing notifications, alerts,
 * and compliance tracking for DBS verification processes.
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
import { DBSVerification } from './DBSVerification';
import { logger } from '@/utils/logger';

/**
 * DBS notification type enumeration
 */
export enum DBSNotificationType {
  APPLICATION_SUBMITTED = 'application_submitted',
  APPLICATION_APPROVED = 'application_approved',
  APPLICATION_REJECTED = 'application_rejected',
  VERIFICATION_COMPLETED = 'verification_completed',
  VERIFICATION_CLEARED = 'verification_cleared',
  VERIFICATION_BARRED = 'verification_barred',
  EXPIRY_WARNING = 'expiry_warning',
  EXPIRED = 'expired',
  RENEWAL_REQUIRED = 'renewal_required',
  DOCUMENT_UPLOADED = 'document_uploaded',
  DOCUMENT_VERIFIED = 'document_verified',
  DOCUMENT_REJECTED = 'document_rejected',
  COMPLIANCE_ALERT = 'compliance_alert',
  RISK_ASSESSMENT = 'risk_assessment',
  SYSTEM_ALERT = 'system_alert'
}

/**
 * DBS notification priority enumeration
 */
export enum DBSNotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * DBS notification status enumeration
 */
export enum DBSNotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * DBS notification channel enumeration
 */
export enum DBSNotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
  SYSTEM_LOG = 'system_log',
  DASHBOARD = 'dashboard'
}

/**
 * DBS notification entity for comprehensive notification management
 */
@Entity('wcn_dbs_notifications')
@Index(['dbsVerificationId', 'notificationType'])
@Index(['status', 'priority'])
@Index(['createdAt', 'status'])
@Index(['recipientId', 'status'])
export class DBSNotification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // DBS Verification Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  dbsVerificationId!: string;

  @ManyToOne(() => DBSVerification, verification => verification.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dbsVerificationId' })
  dbsVerification?: DBSVerification;

  // Notification Details
  @Column({ type: 'enum', enum: DBSNotificationType })
  @IsEnum(DBSNotificationType)
  notificationType!: DBSNotificationType;

  @Column({ type: 'enum', enum: DBSNotificationPriority, default: DBSNotificationPriority.MEDIUM })
  @IsEnum(DBSNotificationPriority)
  priority!: DBSNotificationPriority;

  @Column({ type: 'enum', enum: DBSNotificationStatus, default: DBSNotificationStatus.PENDING })
  @IsEnum(DBSNotificationStatus)
  status!: DBSNotificationStatus;

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
  @Column({ type: 'enum', enum: DBSNotificationChannel })
  @IsEnum(DBSNotificationChannel)
  channel!: DBSNotificationChannel;

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
   * Validate DBS notification before insert
   */
  @BeforeInsert()
  async validateDBSNotificationBeforeInsert(): Promise<void> {
    this.validateDBSNotificationData();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('DBS notification created', {
      notificationId: this.id,
      dbsVerificationId: this.dbsVerificationId,
      notificationType: this.notificationType,
      priority: this.priority,
      auditTrail: true
    });
  }

  /**
   * Validate DBS notification before update
   */
  @BeforeUpdate()
  async validateDBSNotificationBeforeUpdate(): Promise<void> {
    this.validateDBSNotificationData();
    
    console.info('DBS notification updated', {
      notificationId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate DBS notification data
   */
  private validateDBSNotificationData(): void {
    if (this.scheduledAt && this.scheduledAt < new Date()) {
      throw new Error('Scheduled time cannot be in the past');
    }

    if (this.retryCount > this.maxRetries) {
      throw new Error('Retry count cannot exceed max retries');
    }

    if (this.isComplianceCritical && this.priority === DBSNotificationPriority.LOW) {
      throw new Error('Compliance critical notifications must have higher priority');
    }
  }

  /**
   * Send notification
   */
  sendNotification(sentBy: string): void {
    if (this.status !== DBSNotificationStatus.PENDING) {
      throw new Error('Notification must be pending to be sent');
    }

    this.status = DBSNotificationStatus.SENT;
    this.sentAt = new Date();
    this.updatedBy = sentBy;

    console.info('DBS notification sent', {
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
    if (this.status !== DBSNotificationStatus.SENT) {
      throw new Error('Notification must be sent to be marked as delivered');
    }

    this.status = DBSNotificationStatus.DELIVERED;
    this.deliveredAt = new Date();

    console.info('DBS notification delivered', {
      notificationId: this.id,
      recipientEmail: this.recipientEmail,
      auditTrail: true
    });
  }

  /**
   * Mark notification as read
   */
  markAsRead(readBy: string): void {
    if (this.status !== DBSNotificationStatus.DELIVERED && this.status !== DBSNotificationStatus.SENT) {
      throw new Error('Notification must be delivered or sent to be marked as read');
    }

    this.status = DBSNotificationStatus.READ;
    this.readAt = new Date();
    this.updatedBy = readBy;

    console.info('DBS notification read', {
      notificationId: this.id,
      readBy,
      auditTrail: true
    });
  }

  /**
   * Mark notification as failed
   */
  markAsFailed(reason: string): void {
    this.status = DBSNotificationStatus.FAILED;
    this.failureReason = reason;
    this.retryCount += 1;

    console.info('DBS notification failed', {
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
    if (this.status !== DBSNotificationStatus.FAILED) {
      throw new Error('Only failed notifications can be retried');
    }

    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.status = DBSNotificationStatus.PENDING;
    this.updatedBy = retriedBy;

    console.info('DBS notification retried', {
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

    console.info('DBS notification acknowledged', {
      notificationId: this.id,
      acknowledgedBy,
      auditTrail: true
    });
  }

  /**
   * Cancel notification
   */
  cancelNotification(cancelledBy: string): void {
    if (this.status === DBSNotificationStatus.READ) {
      throw new Error('Cannot cancel read notifications');
    }

    this.status = DBSNotificationStatus.CANCELLED;
    this.updatedBy = cancelledBy;

    console.info('DBS notification cancelled', {
      notificationId: this.id,
      cancelledBy,
      auditTrail: true
    });
  }

  /**
   * Check if notification can be retried
   */
  canRetry(): boolean {
    return this.status === DBSNotificationStatus.FAILED && this.retryCount < this.maxRetries;
  }

  /**
   * Check if notification is overdue
   */
  isOverdue(): boolean {
    if (!this.scheduledAt) return false;
    return new Date() > this.scheduledAt && this.status === DBSNotificationStatus.PENDING;
  }

  /**
   * Get notification summary
   */
  getNotificationSummary(): {
    id: string;
    type: DBSNotificationType;
    priority: DBSNotificationPriority;
    status: DBSNotificationStatus;
    title: string;
    recipientEmail: string;
    channel: DBSNotificationChannel;
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
    status: DBSNotificationStatus;
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

export default DBSNotification;
