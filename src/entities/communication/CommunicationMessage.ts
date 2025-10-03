import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Communication Message Entity for Separate Communication Service
 * @module CommunicationMessage
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../BaseEntity';
import { CommunicationChannel } from './CommunicationChannel';

export interface MessageRecipients {
  userIds: string[];
  emailAddresses: string[];
  phoneNumbers: string[];
  groups: string[];
  roles: string[];
  customRecipients: {
    type: string;
    identifier: string;
    metadata?: any;
  }[];
}

export interface MessageAttachments {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  checksum: string;
  isEncrypted: boolean;
  encryptionKey?: string;
}

export interface DeliveryResults {
  successful: number;
  failed: number;
  pending: number;
  errors: {
    recipient: string;
    error: string;
    timestamp: Date;
    retryCount: number;
  }[];
  deliveryDetails: {
    recipient: string;
    status: 'delivered' | 'failed' | 'pending' | 'bounced' | 'opened' | 'clicked';
    deliveredAt?: Date;
    openedAt?: Date;
    clickedAt?: Date;
    errorMessage?: string;
    retryCount: number;
  }[];
}

export interface MessageTemplate {
  templateId: string;
  templateName: string;
  variables: {
    name: string;
    value: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'object';
  }[];
}

@Entity('communication_messages')
export class CommunicationMessage extends BaseEntity {
  @Column({ type: 'uuid' })
  channelId!: string;

  @Column({ type: 'varchar', length: 100 })
  messageType!: 'notification' | 'alert' | 'reminder' | 'update' | 'emergency' | 'marketing' | 'system' | 'user';

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'jsonb' })
  recipients!: MessageRecipients;

  @Column({ type: 'varchar', length: 20 })
  status!: 'draft' | 'scheduled' | 'sending' | 'sent' | 'delivered' | 'failed' | 'cancelled';

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  deliveryResults?: DeliveryResults;

  @Column({ type: 'jsonb', nullable: true })
  attachments?: MessageAttachments[];

  @Column({ type: 'jsonb', nullable: true })
  template?: MessageTemplate;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @Column({ type: 'boolean', default: false })
  isRichText!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresDeliveryConfirmation!: boolean;

  @Column({ type: 'boolean', default: false })
  requiresReadReceipt!: boolean;

  @Column({ type: 'integer', default: 0 })
  retryCount!: number;

  @Column({ type: 'integer', default: 3 })
  maxRetries!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    campaignId?: string;
    userId?: string;
    source?: string;
    tags?: string[];
    customFields?: any;
  };

  @Column({ type: 'jsonb', nullable: true })
  trackingData?: {
    openTracking: boolean;
    clickTracking: boolean;
    linkTracking: boolean;
    trackingPixel?: string;
    trackingLinks?: {
      originalUrl: string;
      trackingUrl: string;
      clicks: number;
    }[];
  };

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  isBulkMessage!: boolean;

  @Column({ type: 'integer', default: 0 })
  totalRecipients!: number;

  @Column({ type: 'jsonb', nullable: true })
  complianceData?: {
    gdprConsent: boolean;
    consentTimestamp?: Date;
    dataRetentionPeriod?: number;
    encryptionRequired: boolean;
    auditRequired: boolean;
  };

  // Relationships
  @ManyToOne(() => CommunicationChannel, channel => channel.messages)
  @JoinColumn({ name: 'channelId' })
  channel!: CommunicationChannel;

  // Business Logic Methods
  isDraft(): boolean {
    return this.status === 'draft';
  }

  isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  isSending(): boolean {
    return this.status === 'sending';
  }

  isSent(): boolean {
    return this.status === 'sent';
  }

  isDelivered(): boolean {
    return this.status === 'delivered';
  }

  isFailed(): boolean {
    return this.status === 'failed';
  }

  isCancelled(): boolean {
    return this.status === 'cancelled';
  }

  canSend(): boolean {
    return this.status === 'draft' || this.status === 'scheduled';
  }

  canCancel(): boolean {
    return this.status === 'draft' || this.status === 'scheduled' || this.status === 'sending';
  }

  canRetry(): boolean {
    return this.status === 'failed' && this.retryCount < this.maxRetries;
  }

  getDeliveryRate(): number {
    if (!this.deliveryResults || this.totalRecipients === 0) return 0;
    return (this.deliveryResults.successful / this.totalRecipients) * 100;
  }

  getFailureRate(): number {
    if (!this.deliveryResults || this.totalRecipients === 0) return 0;
    return (this.deliveryResults.failed / this.totalRecipients) * 100;
  }

  getOpenRate(): number {
    if (!this.deliveryResults || this.deliveryResults.successful === 0) return 0;
    const openedCount = this.deliveryResults.deliveryDetails.filter(d => d.status === 'opened').length;
    return (openedCount / this.deliveryResults.successful) * 100;
  }

  getClickRate(): number {
    if (!this.deliveryResults || this.deliveryResults.successful === 0) return 0;
    const clickedCount = this.deliveryResults.deliveryDetails.filter(d => d.status === 'clicked').length;
    return (clickedCount / this.deliveryResults.successful) * 100;
  }

  updateDeliveryStatus(recipient: string, status: string, errorMessage?: string): void {
    if (!this.deliveryResults) {
      this.deliveryResults = {
        successful: 0,
        failed: 0,
        pending: this.totalRecipients,
        errors: [],
        deliveryDetails: []
      };
    }

    // Find existing delivery detail
    let deliveryDetail = this.deliveryResults.deliveryDetails.find(d => d.recipient === recipient);
    
    if (!deliveryDetail) {
      deliveryDetail = {
        recipient: recipient,
        status: 'pending',
        retryCount: 0
      };
      this.deliveryResults.deliveryDetails.push(deliveryDetail);
    }

    // Update status
    const oldStatus = deliveryDetail.status;
    deliveryDetail.status = status as any;

    // Update counters
    if (oldStatus === 'pending') {
      this.deliveryResults.pending--;
    } else if (oldStatus === 'delivered') {
      this.deliveryResults.successful--;
    } else if (oldStatus === 'failed') {
      this.deliveryResults.failed--;
    }

    if (status === 'delivered') {
      this.deliveryResults.successful++;
      deliveryDetail.deliveredAt = new Date();
    } else if (status === 'failed') {
      this.deliveryResults.failed++;
      deliveryDetail.errorMessage = errorMessage;
      deliveryDetail.retryCount++;
      
      // Add to errors
      this.deliveryResults.errors.push({
        recipient: recipient,
        error: errorMessage || 'Unknown error',
        timestamp: new Date(),
        retryCount: deliveryDetail.retryCount
      });
    }

    // Update message status
    if (this.deliveryResults.pending === 0) {
      if (this.deliveryResults.failed === 0) {
        this.status = 'delivered';
        this.deliveredAt = new Date();
      } else if (this.deliveryResults.successful === 0) {
        this.status = 'failed';
      } else {
        this.status = 'sent'; // Partially delivered
      }
    }
  }

  addAttachment(attachment: MessageAttachments): void {
    if (!this.attachments) {
      this.attachments = [];
    }

    this.attachments.push(attachment);
  }

  removeAttachment(filename: string): void {
    if (!this.attachments) return;

    const index = this.attachments.findIndex(a => a.filename === filename);
    if (index > -1) {
      this.attachments.splice(index, 1);
    }
  }

  applyTemplate(template: MessageTemplate, variables: any): void {
    this.template = template;
    
    let processedContent = template.templateName;
    let processedSubject = this.subject;

    // Replace variables in content
    for (const variable of template.variables) {
      const value = variables[variable.name] || '';
      const placeholder = `{{${variable.name}}}`;
      
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), String(value));
      processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), String(value));
    }

    this.content = processedContent;
    this.subject = processedSubject;
  }

  scheduleMessage(scheduledAt: Date): void {
    if (this.status !== 'draft') {
      throw new Error('Only draft messages can be scheduled');
    }

    this.scheduledAt = scheduledAt;
    this.status = 'scheduled';
  }

  sendMessage(): void {
    if (!this.canSend()) {
      throw new Error('Message cannot be sent in current status');
    }

    this.status = 'sending';
    this.sentAt = new Date();
    this.retryCount = 0;
  }

  cancelMessage(): void {
    if (!this.canCancel()) {
      throw new Error('Message cannot be cancelled in current status');
    }

    this.status = 'cancelled';
  }

  retryMessage(): void {
    if (!this.canRetry()) {
      throw new Error('Message cannot be retried');
    }

    this.retryCount++;
    this.status = 'sending';
  }

  markAsDelivered(): void {
    this.status = 'delivered';
    this.deliveredAt = new Date();
  }

  markAsFailed(errorMessage: string): void {
    this.status = 'failed';
    
    if (!this.deliveryResults) {
      this.deliveryResults = {
        successful: 0,
        failed: this.totalRecipients,
        pending: 0,
        errors: [],
        deliveryDetails: []
      };
    }

    this.deliveryResults.errors.push({
      recipient: 'system',
      error: errorMessage,
      timestamp: new Date(),
      retryCount: this.retryCount
    });
  }

  getMessageSummary(): any {
    return {
      id: this.id,
      messageType: this.messageType,
      subject: this.subject,
      status: this.status,
      totalRecipients: this.totalRecipients,
      deliveryRate: this.getDeliveryRate(),
      failureRate: this.getFailureRate(),
      openRate: this.getOpenRate(),
      clickRate: this.getClickRate(),
      sentAt: this.sentAt,
      deliveredAt: this.deliveredAt,
      retryCount: this.retryCount,
      hasAttachments: this.attachments && this.attachments.length > 0,
      isBulkMessage: this.isBulkMessage,
      priority: this.priority
    };
  }

  validateMessage(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!this.subject || this.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      errors.push('Content is required');
    }

    if (!this.recipients || this.totalRecipients === 0) {
      errors.push('At least one recipient is required');
    }

    if (!this.channelId) {
      errors.push('Channel is required');
    }

    // Validate recipients
    if (this.recipients) {
      const totalRecipients = 
        (this.recipients.userIds?.length || 0) +
        (this.recipients.emailAddresses?.length || 0) +
        (this.recipients.phoneNumbers?.length || 0) +
        (this.recipients.groups?.length || 0) +
        (this.recipients.roles?.length || 0) +
        (this.recipients.customRecipients?.length || 0);

      if (totalRecipients === 0) {
        errors.push('At least one recipient is required');
      }
    }

    // Validate attachments
    if (this.attachments && this.attachments.length > 0) {
      for (const attachment of this.attachments) {
        if (!attachment.filename) {
          errors.push('Attachment filename is required');
        }
        if (!attachment.mimeType) {
          errors.push('Attachment MIME type is required');
        }
        if (attachment.size <= 0) {
          errors.push('Attachment size must be greater than 0');
        }
      }
    }

    // Validate scheduling
    if (this.scheduledAt && this.scheduledAt <= new Date()) {
      errors.push('Scheduled time must be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}