/**
 * @fileoverview Family Member Entity
 * @module FamilyMember
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity representing family members with access to resident information
 * 
 * @compliance
 * - GDPR and Data Protection Act 2018
 * - Mental Capacity Act 2005
 * - CQC Regulation 11 - Need for consent
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Resident } from '../resident/Resident';
import { FamilyMessage } from './FamilyMessage';
import { FamilyConsent } from './FamilyConsent';
import { FamilyFeedback } from './FamilyFeedback';
import { VisitRequest } from './VisitRequest';

export enum FamilyMemberStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum AccessLevel {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  EMERGENCY = 'emergency',
  LIMITED = 'limited',
}

export enum RelationshipType {
  SPOUSE = 'spouse',
  CHILD = 'child',
  PARENT = 'parent',
  SIBLING = 'sibling',
  GRANDPARENT = 'grandparent',
  GRANDCHILD = 'grandchild',
  NIECE_NEPHEW = 'niece_nephew',
  AUNT_UNCLE = 'aunt_uncle',
  COUSIN = 'cousin',
  FRIEND = 'friend',
  GUARDIAN = 'guardian',
  POWER_OF_ATTORNEY = 'power_of_attorney',
  OTHER = 'other',
}

export interface FamilyPreferences {
  communicationPreferences: {
    preferredMethod: 'email' | 'sms' | 'phone' | 'portal';
    frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
    emergencyOnly: boolean;
    language: string;
    timezone: string;
  };
  notificationSettings: {
    carePlanUpdates: boolean;
    healthStatusChanges: boolean;
    medicationChanges: boolean;
    appointmentReminders: boolean;
    emergencyAlerts: boolean;
    photoUpdates: boolean;
    activityUpdates: boolean;
    videoCallRequests: boolean;
  };
  privacySettings: {
    sharePhotos: boolean;
    shareHealthData: boolean;
    shareActivityData: boolean;
    shareLocationData: boolean;
    allowStaffContact: boolean;
    allowVideoCalls: boolean;
  };
  meetingPreferences: {
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'any';
    preferredDay: 'weekday' | 'weekend' | 'any';
    preferredLocation: 'in_person' | 'video_call' | 'phone_call' | 'any';
    advanceNotice: number; // hours
  };
}

@Entity('family_members')
@Index(['residentId', 'email'])
@Index(['residentId', 'phone'])
export class FamilyMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residentId!: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  @Column({ type: 'var char', length: 100 })
  firstName!: string;

  @Column({ type: 'var char', length: 100 })
  lastName!: string;

  @Column({ type: 'var char', length: 255, unique: true })
  email!: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  mobile?: string;

  @Column({ type: 'enum', enum: RelationshipType })
  relationship!: RelationshipType;

  @Column({ type: 'enum', enum: AccessLevel, default: AccessLevel.SECONDARY })
  accessLevel!: AccessLevel;

  @Column({ type: 'enum', enum: FamilyMemberStatus, default: FamilyMemberStatus.PENDING_VERIFICATION })
  status!: FamilyMemberStatus;

  @Column({ type: 'boolean', default: false })
  isPrimaryContact!: boolean;

  @Column({ type: 'boolean', default: false })
  isEmergencyContact!: boolean;

  @Column({ type: 'boolean', default: false })
  hasDecisionMakingAuthority!: boolean;

  @Column({ type: 'boolean', default: false })
  canViewMedicalInfo!: boolean;

  @Column({ type: 'boolean', default: false })
  canViewFinancialInfo!: boolean;

  @Column({ type: 'boolean', default: false })
  canSignConsents!: boolean;

  @Column({ type: 'boolean', default: false })
  canRequestVisits!: boolean;

  @Column({ type: 'boolean', default: false })
  canReceiveUpdates!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: FamilyPreferences;

  @Column({ type: 'var char', length: 500, nullable: true })
  address?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  postcode?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  country?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ type: 'var char', length: 20, nullable: true })
  gender?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  occupation?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  notes?: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  profilePicture?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActivityAt?: Date;

  @Column({ type: 'var char', length: 255, nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  lastLoginUserAgent?: string;

  @Column({ type: 'boolean', default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'var char', length: 255, nullable: true })
  twoFactorSecret?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  preferredLanguage?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  timezone?: string;

  @Column({ type: 'jsonb', nullable: true })
  emergencyContacts?: Array<{
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    isPrimary: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  accessibilityNeeds?: {
    visual: boolean;
    hearing: boolean;
    mobility: boolean;
    cognitive: boolean;
    other?: string;
  };

  @Column({ type: 'var char', length: 255, nullable: true })
  verificationToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  verificationTokenExpires?: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'var char', length: 255, nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpires?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @OneToMany(() => FamilyMessage, message => message.familyMember)
  messages!: FamilyMessage[];

  @OneToMany(() => FamilyConsent, consent => consent.familyMember)
  consents!: FamilyConsent[];

  @OneToMany(() => FamilyFeedback, feedback => feedback.familyMember)
  feedback!: FamilyFeedback[];

  @OneToMany(() => VisitRequest, visit => visit.familyMember)
  visitRequests!: VisitRequest[];

  // Methods
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getDisplayName(): string {
    return `${this.firstName} ${this.lastName.charAt(0)}.`;
  }

  isActive(): boolean {
    return this.status === FamilyMemberStatus.ACTIVE;
  }

  canAccessResident(): boolean {
    return this.isActive() && this.canReceiveUpdates;
  }

  hasHighLevelAccess(): boolean {
    return this.accessLevel === AccessLevel.PRIMARY || this.hasDecisionMakingAuthority;
  }

  canViewSensitiveInfo(): boolean {
    return this.canViewMedicalInfo && this.hasHighLevelAccess();
  }

  getPreferredContactMethod(): string {
    return this.preferences?.communicationPreferences?.preferredMethod || 'email';
  }

  shouldReceiveNotification(type: string): boolean {
    if (!this.preferences?.notificationSettings) return false;
    
    const settings = this.preferences.notificationSettings;
    switch (type) {
      case 'care_plan':
        return settings.carePlanUpdates;
      case 'health_status':
        return settings.healthStatusChanges;
      case 'medication':
        return settings.medicationChanges;
      case 'appointment':
        return settings.appointmentReminders;
      case 'emergency':
        return settings.emergencyAlerts;
      case 'photo':
        return settings.photoUpdates;
      case 'activity':
        return settings.activityUpdates;
      case 'video_call':
        return settings.videoCallRequests;
      default:
        return false;
    }
  }

  updateLastActivity(ip?: string, userAgent?: string): void {
    this.lastActivityAt = new Date();
    if (ip) this.lastLoginIp = ip;
    if (userAgent) this.lastLoginUserAgent = userAgent;
  }

  generateVerificationToken(): string {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    this.verificationToken = token;
    this.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return token;
  }

  isVerificationTokenValid(): boolean {
    return !!this.verificationToken && 
           !!this.verificationTokenExpires && 
           this.verificationTokenExpires > new Date();
  }

  verify(): void {
    this.status = FamilyMemberStatus.ACTIVE;
    this.verifiedAt = new Date();
    this.verificationToken = undefined;
    this.verificationTokenExpires = undefined;
  }

  suspend(reason?: string): void {
    this.status = FamilyMemberStatus.SUSPENDED;
    if (reason) this.notes = `${this.notes || ''}\nSuspended: ${reason}`.trim();
  }

  activate(): void {
    this.status = FamilyMemberStatus.ACTIVE;
  }

  toJSON(): any {
    const { 
      verificationToken, 
      verificationTokenExpires, 
      passwordResetToken, 
      passwordResetTokenExpires,
      twoFactorSecret,
      ...safeData 
    } = this;
    return safeData;
  }
}
