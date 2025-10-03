import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { CommunicationChannel } from './CommunicationChannel';

export enum MessageType {
  TEXT = 'text',
  VOICE = 'voice',
  VIDEO = 'video',
  IMAGE = 'image',
  DOCUMENT = 'document',
  CARE_UPDATE = 'care_update',
  MEDICAL_ALERT = 'medical_alert',
  SYSTEM_NOTIFICATION = 'system_notification',
  EMERGENCY_ALERT = 'emergency_alert'
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  PENDING_MODERATION = 'pending_moderation',
  MODERATED = 'moderated',
  ARCHIVED = 'archived'
}

export enum MessagePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  EMERGENCY = 'emergency'
}

export interface MessageContent {
  text?: string;
  mediaUrl?: string;
  mediaType?: string;
  mediaSize?: number;
  mediaDuration?: number; // for audio/video in seconds
  thumbnailUrl?: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileSize: number;
    fileType: string;
    scanStatus?: 'clean' | 'infected' | 'pending';
  }>;
}

export interface MessageRecipient {
  recipientId: string;
  recipientType: 'resident' | 'employee' | 'family_member' | 'healthcare_provider';
  deliveryStatus: MessageStatus;
  readTimestamp?: Date;
  deliveryTimestamp?: Date;
  responseRequired: boolean;
  responseReceived?: boolean;
  responseTimestamp?: Date;
}

export interface MessageReaction {
  reactionType: 'like' | 'love' | 'care' | 'support' | 'concern' | 'thanks';
  userId: string;
  userType: string;
  timestamp: Date;
}

export interface MessageTranslation {
  language: string;
  translatedText: string;
  translationConfidence: number;
  translatedBy: 'ai' | 'human' | 'professional';
  translationTimestamp: Date;
}

export interface AccessibilitySupport {
  hasAudioVersion: boolean;
  audioUrl?: string;
  hasScreenReaderSupport: boolean;
  altText?: string;
  hasSignLanguageVideo: boolean;
  signLanguageUrl?: string;
  simplifiedVersion?: string;
  largeTextVersion?: string;
}

export interface ModerationInfo {
  requiresModeration: boolean;
  moderatedBy?: string;
  moderationTimestamp?: Date;
  moderationNotes?: string;
  moderationStatus: 'approved' | 'rejected' | 'pending' | 'flagged';
  flaggedReasons?: string[];
  autoModerationScore?: number;
}

export interface EngagementAnalytics {
  viewCount: number;
  uniqueViewers: string[];
  averageReadTime: number; // seconds
  responseRate: number; // percentage
  shareCount: number;
  reactionCount: number;
  engagementScore: number; // 1-100
}

@Entity('messages')
export class Message extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  messageNumber: string;

  @Column('uuid')
  channelId: string;

  @ManyToOne(() => CommunicationChannel)
  @JoinColumn({ name: 'channelId' })
  channel: CommunicationChannel;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT
  })
  messageType: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.SENT
  })
  status: MessageStatus;

  @Column({
    type: 'enum',
    enum: MessagePriority,
    default: MessagePriority.NORMAL
  })
  priority: MessagePriority;

  @Column()
  senderId: string;

  @Column()
  senderType: string;

  @Column('jsonb')
  recipients: MessageRecipient[];

  @Column('jsonb')
  content: MessageContent;

  @Column('jsonb')
  reactions: MessageReaction[];

  @Column('jsonb')
  translations: MessageTranslation[];

  @Column('jsonb')
  accessibilitySupport: AccessibilitySupport;

  @Column('jsonb')
  moderationInfo: ModerationInfo;

  @Column('jsonb')
  engagementAnalytics: EngagementAnalytics;

  @Column('uuid', { nullable: true })
  replyToMessageId?: string;

  @Column('uuid', { nullable: true })
  threadId?: string;

  @Column('timestamp', { nullable: true })
  scheduledSendTime?: Date;

  @Column('timestamp', { nullable: true })
  expiryTime?: Date;

  @Column('jsonb')
  tags: string[];

  @Column('text', { nullable: true })
  messageContext?: string; // Care context, medical context, etc.

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isEmergency(): boolean {
    return this.priority === MessagePriority.EMERGENCY || 
           this.messageType === MessageType.EMERGENCY_ALERT;
  }

  isMedical(): boolean {
    return this.messageType === MessageType.MEDICAL_ALERT ||
           this.messageType === MessageType.CARE_UPDATE ||
           this.messageContext === 'medical';
  }

  isDelivered(): boolean {
    return this.recipients.every(recipient => 
      recipient.deliveryStatus === MessageStatus.DELIVERED || 
      recipient.deliveryStatus === MessageStatus.READ
    );
  }

  isRead(): boolean {
    return this.recipients.every(recipient => 
      recipient.deliveryStatus === MessageStatus.READ
    );
  }

  getReadPercentage(): number {
    if (this.recipients.length === 0) return 0;
    const readCount = this.recipients.filter(r => r.deliveryStatus === MessageStatus.READ).length;
    return (readCount / this.recipients.length) * 100;
  }

  addReaction(reaction: MessageReaction): void {
    // Remove existing reaction from same user
    this.reactions = this.reactions.filter(r => r.userId !== reaction.userId);
    // Add new reaction
    this.reactions.push(reaction);
    this.updateEngagementAnalytics();
  }

  removeReaction(userId: string): void {
    this.reactions = this.reactions.filter(r => r.userId !== userId);
    this.updateEngagementAnalytics();
  }

  addTranslation(translation: MessageTranslation): void {
    // Remove existing translation for same language
    this.translations = this.translations.filter(t => t.language !== translation.language);
    // Add new translation
    this.translations.push(translation);
  }

  getTranslation(language: string): MessageTranslation | null {
    return this.translations.find(t => t.language === language) || null;
  }

  markAsRead(userId: string): void {
    const recipient = this.recipients.find(r => r.recipientId === userId);
    if (recipient) {
      recipient.deliveryStatus = MessageStatus.READ;
      recipient.readTimestamp = new Date();
      this.updateEngagementAnalytics();
    }
  }

  requiresModeration(): boolean {
    return this.moderationInfo.requiresModeration && 
           this.moderationInfo.moderationStatus === 'pending';
  }

  isExpired(): boolean {
    return this.expiryTime ? new Date() > this.expiryTime : false;
  }

  isScheduled(): boolean {
    return this.scheduledSendTime ? new Date() < this.scheduledSendTime : false;
  }

  hasAccessibilityFeature(feature: AccessibilityFeature): boolean {
    switch (feature) {
      case AccessibilityFeature.SCREEN_READER:
        return this.accessibilitySupport.hasScreenReaderSupport;
      case AccessibilityFeature.VOICE_CONTROL:
        return this.accessibilitySupport.hasAudioVersion;
      case AccessibilityFeature.SIGN_LANGUAGE:
        return this.accessibilitySupport.hasSignLanguageVideo;
      case AccessibilityFeature.LARGE_TEXT:
        return !!this.accessibilitySupport.largeTextVersion;
      case AccessibilityFeature.SIMPLIFIED_INTERFACE:
        return !!this.accessibilitySupport.simplifiedVersion;
      default:
        return false;
    }
  }

  getResponseRate(): number {
    const recipientsRequiringResponse = this.recipients.filter(r => r.responseRequired);
    if (recipientsRequiringResponse.length === 0) return 100;
    
    const responsesReceived = recipientsRequiringResponse.filter(r => r.responseReceived).length;
    return (responsesReceived / recipientsRequiringResponse.length) * 100;
  }

  getAverageResponseTime(): number {
    const responses = this.recipients.filter(r => r.responseReceived && r.responseTimestamp && r.deliveryTimestamp);
    
    if (responses.length === 0) return 0;
    
    const totalResponseTime = responses.reduce((sum, recipient) => {
      const responseTime = new Date(recipient.responseTimestamp!).getTime() - new Date(recipient.deliveryTimestamp!).getTime();
      return sum + responseTime;
    }, 0);
    
    return totalResponseTime / responses.length / (1000 * 60); // Convert to minutes
  }

  updateEngagementAnalytics(): void {
    this.engagementAnalytics = {
      ...this.engagementAnalytics,
      reactionCount: this.reactions.length,
      responseRate: this.getResponseRate(),
      uniqueViewers: [...new Set(this.recipients.filter(r => r.deliveryStatus !== MessageStatus.FAILED).map(r => r.recipientId))],
      engagementScore: this.calculateEngagementScore()
    };
  }

  private calculateEngagementScore(): number {
    const readRate = this.getReadPercentage();
    const responseRate = this.getResponseRate();
    const reactionRate = this.recipients.length > 0 ? (this.reactions.length / this.recipients.length) * 100 : 0;
    
    // Weighted engagement score
    const score = (readRate * 0.4) + (responseRate * 0.4) + (reactionRate * 0.2);
    return Math.min(100, Math.round(score));
  }

  generateAccessibilityVersion(feature: AccessibilityFeature): void {
    switch (feature) {
      case AccessibilityFeature.LARGE_TEXT:
        if (this.content.text) {
          this.accessibilitySupport.largeTextVersion = `<large>${this.content.text}</large>`;
        }
        break;
      case AccessibilityFeature.SIMPLIFIED_INTERFACE:
        if (this.content.text) {
          // Simplify complex sentences and technical terms
          this.accessibilitySupport.simplifiedVersion = this.simplifyText(this.content.text);
        }
        break;
      case AccessibilityFeature.SCREEN_READER:
        if (this.content.text) {
          this.accessibilitySupport.altText = this.generateAltText();
          this.accessibilitySupport.hasScreenReaderSupport = true;
        }
        break;
    }
  }

  private simplifyText(text: string): string {
    // Simplified text generation for cognitive accessibility
    return text
      .replace(/\b(medication|medicine)\b/gi, 'medicine')
      .replace(/\b(physiotherapy|physical therapy)\b/gi, 'exercise help')
      .replace(/\b(assessment|evaluation)\b/gi, 'check-up')
      .replace(/\b(intervention|treatment)\b/gi, 'help')
      .replace(/\b(compliance|adherence)\b/gi, 'following rules');
  }

  private generateAltText(): string {
    let altText = `${this.messageType} message from ${this.senderType}`;
    
    if (this.content.mediaType) {
      altText += ` containing ${this.content.mediaType}`;
    }
    
    if (this.priority !== MessagePriority.NORMAL) {
      altText += ` with ${this.priority} priority`;
    }
    
    return altText;
  }
}