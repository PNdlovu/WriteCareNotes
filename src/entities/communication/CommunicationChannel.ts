import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';
import { Employee } from '../hr/Employee';

export enum ChannelType {
  VIDEO_CALL = 'video_call',
  VOICE_CALL = 'voice_call',
  MESSAGING = 'messaging',
  SOCIAL_GROUP = 'social_group',
  FAMILY_PORTAL = 'family_portal',
  HEALTHCARE_COMM = 'healthcare_comm',
  EMERGENCY_BROADCAST = 'emergency_broadcast',
  BULLETIN_BOARD = 'bulletin_board'
}

export enum PrivacyLevel {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
  CONFIDENTIAL = 'confidential',
  MEDICAL_CONFIDENTIAL = 'medical_confidential'
}

export enum ParticipantRole {
  OWNER = 'owner',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  GUEST = 'guest',
  OBSERVER = 'observer'
}

export enum AccessibilityFeature {
  SCREEN_READER = 'screen_reader',
  VOICE_CONTROL = 'voice_control',
  LARGE_TEXT = 'large_text',
  HIGH_CONTRAST = 'high_contrast',
  SIMPLIFIED_INTERFACE = 'simplified_interface',
  HEARING_LOOP = 'hearing_loop',
  SUBTITLES = 'subtitles',
  SIGN_LANGUAGE = 'sign_language'
}

export interface Participant {
  id: string;
  participantType: 'resident' | 'employee' | 'family_member' | 'healthcare_provider' | 'external';
  participantId: string;
  role: ParticipantRole;
  joinedDate: Date;
  lastActiveDate: Date;
  permissions: string[];
  accessibilityNeeds: AccessibilityFeature[];
  communicationPreferences: {
    preferredLanguage: string;
    textSize: 'small' | 'medium' | 'large' | 'extra_large';
    audioEnabled: boolean;
    videoEnabled: boolean;
    notificationsEnabled: boolean;
  };
}

export interface Moderator {
  id: string;
  moderatorId: string;
  permissions: string[];
  assignedDate: Date;
  responsibilities: string[];
}

export interface ChannelSettings {
  allowFileSharing: boolean;
  allowVideoSharing: boolean;
  allowVoiceMessages: boolean;
  moderationRequired: boolean;
  archiveMessages: boolean;
  retentionPeriod: number; // days
  maxParticipants: number;
  allowGuestAccess: boolean;
  encryptionEnabled: boolean;
  accessibilityFeaturesEnabled: AccessibilityFeature[];
}

export interface EngagementMetrics {
  totalMessages: number;
  activeParticipants: number;
  averageResponseTime: number; // minutes
  engagementScore: number; // 1-100
  satisfactionRating: number; // 1-5
  lastActivityDate: Date;
  peakUsageHours: string[];
  popularTopics: string[];
}

export interface DigitalInclusionSupport {
  assistiveTechnologyEnabled: boolean;
  trainingSessionsCompleted: number;
  supportRequestsSubmitted: number;
  digitalLiteracyLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredCommunicationMethod: string;
  adaptiveInterfaceSettings: {
    fontSize: number;
    colorScheme: string;
    navigationStyle: string;
    inputMethod: string;
  };
}

@Entity('communication_channels')
export class CommunicationChannel extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  channelCode: string;

  @Column({
    type: 'enum',
    enum: ChannelType
  })
  channelType: ChannelType;

  @Column()
  channelName: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: PrivacyLevel,
    default: PrivacyLevel.PRIVATE
  })
  privacy: PrivacyLevel;

  @Column('jsonb')
  participants: Participant[];

  @Column('jsonb')
  moderators: Moderator[];

  @Column('jsonb')
  settings: ChannelSettings;

  @Column('jsonb')
  engagementMetrics: EngagementMetrics;

  @Column('jsonb')
  digitalInclusionSupport: DigitalInclusionSupport;

  @Column('uuid')
  createdBy: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('timestamp', { nullable: true })
  lastActivityDate?: Date;

  @Column('jsonb')
  tags: string[];

  @Column('text', { nullable: true })
  welcomeMessage?: string;

  @Column('jsonb')
  scheduledEvents: Array<{
    eventId: string;
    eventType: string;
    scheduledTime: Date;
    duration: number;
    participants: string[];
    description: string;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isPublic(): boolean {
    return this.privacy === PrivacyLevel.PUBLIC;
  }

  canUserJoin(userId: string, userRole: string): boolean {
    // Check if user can join based on privacy level and permissions
    if (this.isPublic()) return true;
    
    const participant = this.participants.find(p => p.participantId === userId);
    if (participant) return true;
    
    // Check role-based access
    const roleBasedAccess = {
      'admin': true,
      'care_manager': this.privacy !== PrivacyLevel.MEDICAL_CONFIDENTIAL,
      'care_staff': this.channelType !== ChannelType.FAMILY_PORTAL,
      'family_member': this.channelType === ChannelType.FAMILY_PORTAL || this.privacy === PrivacyLevel.PUBLIC,
      'resident': this.privacy !== PrivacyLevel.CONFIDENTIAL && this.privacy !== PrivacyLevel.MEDICAL_CONFIDENTIAL
    };
    
    return roleBasedAccess[userRole] || false;
  }

  addParticipant(participant: Participant): void {
    const existingIndex = this.participants.findIndex(p => p.participantId === participant.participantId);
    if (existingIndex >= 0) {
      this.participants[existingIndex] = participant;
    } else {
      this.participants.push(participant);
    }
    this.updateEngagementMetrics();
  }

  removeParticipant(participantId: string): void {
    this.participants = this.participants.filter(p => p.participantId !== participantId);
    this.updateEngagementMetrics();
  }

  getActiveParticipants(): Participant[] {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.participants.filter(p => new Date(p.lastActiveDate) >= thirtyDaysAgo);
  }

  isModerator(userId: string): boolean {
    return this.moderators.some(m => m.moderatorId === userId);
  }

  canUserModerate(userId: string): boolean {
    return this.isModerator(userId) || this.createdBy === userId;
  }

  hasAccessibilitySupport(feature: AccessibilityFeature): boolean {
    return this.settings.accessibilityFeaturesEnabled.includes(feature);
  }

  getEngagementLevel(): 'low' | 'medium' | 'high' | 'very_high' {
    const score = this.engagementMetrics.engagementScore;
    if (score >= 80) return 'very_high';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  requiresModeration(): boolean {
    return this.settings.moderationRequired;
  }

  isHealthcareCommunication(): boolean {
    return this.channelType === ChannelType.HEALTHCARE_COMM || 
           this.privacy === PrivacyLevel.MEDICAL_CONFIDENTIAL;
  }

  supportsVideoCall(): boolean {
    return this.channelType === ChannelType.VIDEO_CALL || 
           this.channelType === ChannelType.FAMILY_PORTAL ||
           this.channelType === ChannelType.HEALTHCARE_COMM;
  }

  getMaxParticipants(): number {
    return this.settings.maxParticipants;
  }

  canAcceptMoreParticipants(): boolean {
    return this.participants.length < this.getMaxParticipants();
  }

  updateLastActivity(): void {
    this.lastActivityDate = new Date();
    this.updateEngagementMetrics();
  }

  private updateEngagementMetrics(): void {
    const activeParticipants = this.getActiveParticipants();
    
    this.engagementMetrics = {
      ...this.engagementMetrics,
      activeParticipants: activeParticipants.length,
      lastActivityDate: new Date(),
      engagementScore: this.calculateEngagementScore(activeParticipants)
    };
  }

  private calculateEngagementScore(activeParticipants: Participant[]): number {
    const totalParticipants = this.participants.length;
    if (totalParticipants === 0) return 0;
    
    const activityRate = (activeParticipants.length / totalParticipants) * 100;
    const messageFrequency = this.engagementMetrics.totalMessages / Math.max(1, totalParticipants);
    const responseTime = Math.max(0, 100 - (this.engagementMetrics.averageResponseTime / 60)); // Convert to score
    
    // Weighted engagement score
    const score = (activityRate * 0.4) + (Math.min(messageFrequency * 10, 40)) + (responseTime * 0.2);
    return Math.min(100, Math.round(score));
  }

  scheduleEvent(event: {
    eventType: string;
    scheduledTime: Date;
    duration: number;
    participants: string[];
    description: string;
  }): void {
    const eventWithId = {
      ...event,
      eventId: crypto.randomUUID()
    };
    
    this.scheduledEvents.push(eventWithId);
  }

  getUpcomingEvents(): any[] {
    const now = new Date();
    return this.scheduledEvents
      .filter(event => new Date(event.scheduledTime) > now)
      .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());
  }
}