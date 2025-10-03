import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum CallType {
  FAMILY_VISIT = 'family_visit',
  MEDICAL_CONSULTATION = 'medical_consultation',
  THERAPY_SESSION = 'therapy_session',
  SOCIAL_CALL = 'social_call',
  GROUP_ACTIVITY = 'group_activity',
  EMERGENCY_CALL = 'emergency_call',
  TELEMEDICINE = 'telemedicine'
}

export enum CallStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  ENDED = 'ended',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum CallQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export interface CallParticipant {
  participantId: string;
  participantType: 'resident' | 'family_member' | 'healthcare_provider' | 'staff' | 'external';
  displayName: string;
  joinedAt?: Date;
  leftAt?: Date;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharingEnabled: boolean;
  isModerator: boolean;
  connectionQuality: CallQuality;
  deviceInfo: {
    deviceType: 'desktop' | 'tablet' | 'mobile' | 'care_home_terminal';
    browser?: string;
    operatingSystem?: string;
    hasCamera: boolean;
    hasMicrophone: boolean;
    hasScreenShare: boolean;
  };
}

export interface CallRecording {
  recordingId: string;
  recordingUrl: string;
  recordingSize: number;
  recordingDuration: number;
  recordingQuality: CallQuality;
  startTime: Date;
  endTime: Date;
  consentGiven: boolean;
  consentGivenBy: string[];
  retentionPeriod: number; // days
  accessPermissions: string[];
  transcriptionAvailable: boolean;
  transcriptionUrl?: string;
}

export interface CallAnalytics {
  totalDuration: number; // seconds
  participantCount: number;
  averageConnectionQuality: CallQuality;
  disconnectionCount: number;
  reconnectionCount: number;
  audioIssues: number;
  videoIssues: number;
  participantSatisfactionRating?: number; // 1-5
  technicalIssuesReported: string[];
}

export interface AccessibilityFeatures {
  closedCaptionsEnabled: boolean;
  signLanguageInterpreter: boolean;
  hearingLoopCompatible: boolean;
  largeTextInterface: boolean;
  highContrastMode: boolean;
  voiceActivatedControls: boolean;
  assistiveTechnologySupport: string[];
}

export interface MedicalCallContext {
  medicalRecordAccess: boolean;
  prescriptionReviewRequired: boolean;
  vitalSignsSharing: boolean;
  diagnosticImageSharing: boolean;
  careTeamInvolved: string[];
  followUpRequired: boolean;
  clinicalNotesGenerated: boolean;
  regulatoryCompliance: {
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    recordingConsent: boolean;
    dataRetentionPolicy: string;
  };
}

@Entity('video_calls')
export class VideoCall extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  callNumber: string;

  @Column({
    type: 'enum',
    enum: CallType
  })
  callType: CallType;

  @Column({
    type: 'enum',
    enum: CallStatus,
    default: CallStatus.SCHEDULED
  })
  status: CallStatus;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('jsonb')
  participants: CallParticipant[];

  @Column('timestamp')
  scheduledStartTime: Date;

  @Column('timestamp', { nullable: true })
  actualStartTime?: Date;

  @Column('timestamp', { nullable: true })
  actualEndTime?: Date;

  @Column('int')
  estimatedDuration: number; // minutes

  @Column('int', { nullable: true })
  actualDuration?: number; // seconds

  @Column()
  hostId: string;

  @Column()
  hostType: string;

  @Column('jsonb', { nullable: true })
  recording?: CallRecording;

  @Column('jsonb')
  analytics: CallAnalytics;

  @Column('jsonb')
  accessibilityFeatures: AccessibilityFeatures;

  @Column('jsonb', { nullable: true })
  medicalContext?: MedicalCallContext;

  @Column('text', { nullable: true })
  meetingRoomUrl?: string;

  @Column('text', { nullable: true })
  dialInNumber?: string;

  @Column('text', { nullable: true })
  meetingPassword?: string;

  @Column('jsonb')
  technicalSettings: {
    maxParticipants: number;
    recordingEnabled: boolean;
    screenSharingEnabled: boolean;
    chatEnabled: boolean;
    waitingRoomEnabled: boolean;
    encryptionEnabled: boolean;
    qualitySettings: 'low' | 'medium' | 'high' | 'hd';
  };

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.status === CallStatus.ACTIVE;
  }

  isScheduled(): boolean {
    return this.status === CallStatus.SCHEDULED;
  }

  canStart(): boolean {
    return this.status === CallStatus.SCHEDULED && 
           new Date() >= new Date(this.scheduledStartTime.getTime() - 15 * 60 * 1000); // 15 min early
  }

  isOverdue(): boolean {
    return this.status === CallStatus.SCHEDULED && 
           new Date() > new Date(this.scheduledStartTime.getTime() + 30 * 60 * 1000); // 30 min late
  }

  addParticipant(participant: CallParticipant): void {
    const existingIndex = this.participants.findIndex(p => p.participantId === participant.participantId);
    if (existingIndex >= 0) {
      this.participants[existingIndex] = participant;
    } else {
      this.participants.push(participant);
    }
    this.updateAnalytics();
  }

  removeParticipant(participantId: string): void {
    const participant = this.participants.find(p => p.participantId === participantId);
    if (participant) {
      participant.leftAt = new Date();
    }
    this.updateAnalytics();
  }

  startCall(): void {
    this.status = CallStatus.ACTIVE;
    this.actualStartTime = new Date();
    
    // Mark participants as joined
    this.participants.forEach(participant => {
      if (!participant.joinedAt) {
        participant.joinedAt = new Date();
      }
    });
  }

  endCall(): void {
    this.status = CallStatus.ENDED;
    this.actualEndTime = new Date();
    
    if (this.actualStartTime) {
      this.actualDuration = Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 1000);
    }
    
    // Mark all participants as left
    this.participants.forEach(participant => {
      if (!participant.leftAt) {
        participant.leftAt = new Date();
      }
    });
    
    this.updateAnalytics();
  }

  getActiveParticipants(): CallParticipant[] {
    return this.participants.filter(p => p.joinedAt && !p.leftAt);
  }

  getParticipantCount(): number {
    return this.getActiveParticipants().length;
  }

  canRecord(): boolean {
    return this.technicalSettings.recordingEnabled && 
           this.participants.every(p => this.hasRecordingConsent(p.participantId));
  }

  hasRecordingConsent(participantId: string): boolean {
    // Check if participant has given consent for recording
    if (this.recording) {
      return this.recording.consentGivenBy.includes(participantId);
    }
    return false;
  }

  startRecording(): void {
    if (!this.canRecord()) {
      throw new Error('Cannot start recording without proper consent');
    }
    
    this.recording = {
      recordingId: crypto.randomUUID(),
      recordingUrl: `recordings/${this.callNumber}_${Date.now()}.mp4`,
      recordingSize: 0,
      recordingDuration: 0,
      recordingQuality: CallQuality.GOOD,
      startTime: new Date(),
      endTime: new Date(),
      consentGiven: true,
      consentGivenBy: this.participants.map(p => p.participantId),
      retentionPeriod: this.calculateRetentionPeriod(),
      accessPermissions: this.generateAccessPermissions(),
      transcriptionAvailable: false
    };
  }

  isMedicalCall(): boolean {
    return this.callType === CallType.MEDICAL_CONSULTATION || 
           this.callType === CallType.TELEMEDICINE ||
           !!this.medicalContext;
  }

  requiresFollowUp(): boolean {
    return this.medicalContext?.followUpRequired || 
           this.callType === CallType.MEDICAL_CONSULTATION ||
           this.callType === CallType.THERAPY_SESSION;
  }

  getCallDuration(): number {
    if (this.actualDuration) return this.actualDuration;
    if (this.actualStartTime && this.actualEndTime) {
      return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / 1000);
    }
    return 0;
  }

  private calculateRetentionPeriod(): number {
    // Different retention periods based on call type
    const retentionPeriods = {
      medical_consultation: 2555, // 7 years (medical records)
      telemedicine: 2555,
      therapy_session: 1825, // 5 years
      family_visit: 365, // 1 year
      social_call: 90, // 3 months
      emergency_call: 2555, // 7 years
      group_activity: 180 // 6 months
    };
    
    return retentionPeriods[this.callType] || 365;
  }

  private generateAccessPermissions(): string[] {
    const permissions = [this.hostId];
    
    // Add participants
    permissions.push(...this.participants.map(p => p.participantId));
    
    // Add role-based access
    if (this.isMedicalCall()) {
      permissions.push('medical_team', 'care_managers');
    }
    
    return [...new Set(permissions)];
  }

  private updateAnalytics(): void {
    this.analytics = {
      ...this.analytics,
      participantCount: this.participants.length,
      totalDuration: this.getCallDuration()
    };
  }
}