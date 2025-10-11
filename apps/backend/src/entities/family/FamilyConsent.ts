/**
 * @fileoverview Family Consent Entity
 * @module FamilyConsent
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity representing digital consent management for family members
 * 
 * @compliance
 * - GDPR and Data Protection Act 2018
 * - Mental Capacity Act 2005
 * - CQC Regulation 11 - Need for consent
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FamilyMember } from './FamilyMember';
import { Resident } from '../resident/Resident';

export enum ConsentType {
  PHOTO_SHARING = 'photo_sharing',
  MEDICAL_INFORMATION_SHARING = 'medical_information_sharing',
  EMERGENCY_CONTACT_AUTHORIZATION = 'emergency_contact_authorization',
  CARE_PLAN_ACCESS = 'care_plan_access',
  VIDEO_CALL_PARTICIPATION = 'video_call_participation',
  DATA_PROCESSING = 'data_processing',
  MARKETING_COMMUNICATIONS = 'marketing_communications',
  RESEARCH_PARTICIPATION = 'research_participation',
  THIRD_PARTY_SHARING = 'third_party_sharing',
  LOCATION_TRACKING = 'location_tracking',
  BIOMETRIC_DATA = 'biometric_data',
  FINANCIAL_INFORMATION = 'financial_information',
}

export enum ConsentStatus {
  PENDING = 'pending',
  GRANTED = 'granted',
  DENIED = 'denied',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export enum ConsentMethod {
  DIGITAL_SIGNATURE = 'digital_signature',
  ELECTRONIC_SIGNATURE = 'electronic_signature',
  BIOMETRIC_SIGNATURE = 'biometric_signature',
  VERBAL_CONSENT = 'verbal_consent',
  WRITTEN_CONSENT = 'written_consent',
  WITNESSED_CONSENT = 'witnessed_consent',
}

export interface DigitalSignature {
  signature: string;
  timestamp: Date;
  certificate?: string;
  algorithm?: string;
  hash?: string;
  publicKey?: string;
}

export interface ConsentWitness {
  witnessId: string;
  witnessName: string;
  witnessRole: string;
  witnessSignature: string;
  witnessTimestamp: Date;
  witnessCertificate?: string;
}

@Entity('family_consents')
@Index(['familyId', 'residentId', 'consentType'])
@Index(['status', 'createdAt'])
@Index(['expiresAt'])
export class FamilyConsent {
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

  @Column({ type: 'enum', enum: ConsentType })
  consentType!: ConsentType;

  @Column({ type: 'enum', enum: ConsentStatus, default: ConsentStatus.PENDING })
  status!: ConsentStatus;

  @Column({ type: 'boolean' })
  granted!: boolean;

  @Column({ type: 'enum', enum: ConsentMethod })
  consentMethod!: ConsentMethod;

  @Column({ type: 'jsonb' })
  digitalSignature!: DigitalSignature;

  @Column({ type: 'jsonb', nullable: true })
  witness?: ConsentWitness;

  @Column({ type: 'text' })
  consentText!: string;

  @Column({ type: 'text', nullable: true })
  additionalTerms?: string;

  @Column({ type: 'text', nullable: true })
  withdrawalTerms?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  purpose!: string;

  @Column({ type: 'var char', length: 1000, nullable: true })
  description!: string;

  @Column({ type: 'jsonb', nullable: true })
  dataCategories?: string[];

  @Column({ type: 'jsonb', nullable: true })
  processingPurposes?: string[];

  @Column({ type: 'jsonb', nullable: true })
  thirdParties?: Array<{
    name: string;
    purpose: string;
    dataTypes: string[];
    retentionPeriod?: string;
  }>;

  @Column({ type: 'timestamp' })
  submittedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  grantedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deniedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  withdrawnAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  grantedBy?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  deniedBy?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  withdrawnBy?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  revokedBy?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  reason?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  withdrawalReason?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  revocationReason?: string;

  @Column({ type: 'var char', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  userAgent?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  deviceId?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  location?: string;

  @Column({ type: 'var char', length: 10, nullable: true })
  language?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  timezone?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    version?: string;
    templateId?: string;
    legalBasis?: string;
    retentionPeriod?: string;
    dataController?: string;
    dataProtectionOfficer?: string;
    supervisoryAuthority?: string;
    complaintRights?: string[];
    automatedDecisionMaking?: boolean;
    profiling?: boolean;
    internationalTransfers?: boolean;
    specialCategories?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  auditTrail?: Array<{
    action: string;
    timestamp: Date;
    performedBy: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
  }>;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  archivedBy?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  archiveReason?: string;

  @Column({ type: 'boolean', default: false })
  requiresRenewal!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  renewalDueAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  renewalReminderSentTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastReminderSentAt?: Date;

  @Column({ type: 'integer', default: 0 })
  reminderCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Methods
  isExpired(): boolean {
    return !!this.expiresAt && this.expiresAt < new Date();
  }

  getIsActive(): boolean {
    return this.isActive && 
           this.status === ConsentStatus.GRANTED && 
           !this.isExpired() &&
           !this.isArchived;
  }

  canBeWithdrawn(): boolean {
    return this.status === ConsentStatus.GRANTED && 
           !this.isExpired() && 
           !this.isArchived;
  }

  canBeRevoked(): boolean {
    return this.status === ConsentStatus.GRANTED && 
           !this.isArchived;
  }

  grant(grantedBy: string, reason?: string): void {
    this.status = ConsentStatus.GRANTED;
    this.granted = true;
    this.grantedAt = new Date();
    this.grantedBy = grantedBy;
    this.reason = reason;
    this.isActive = true;
    
    this.addAuditTrail('GRANTED', grantedBy, reason);
  }

  deny(deniedBy: string, reason?: string): void {
    this.status = ConsentStatus.DENIED;
    this.granted = false;
    this.deniedAt = new Date();
    this.deniedBy = deniedBy;
    this.reason = reason;
    this.isActive = false;
    
    this.addAuditTrail('DENIED', deniedBy, reason);
  }

  withdraw(withdrawnBy: string, reason?: string): void {
    this.status = ConsentStatus.WITHDRAWN;
    this.withdrawnAt = new Date();
    this.withdrawnBy = withdrawnBy;
    this.withdrawalReason = reason;
    this.isActive = false;
    
    this.addAuditTrail('WITHDRAWN', withdrawnBy, reason);
  }

  revoke(revokedBy: string, reason?: string): void {
    this.status = ConsentStatus.REVOKED;
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.revocationReason = reason;
    this.isActive = false;
    
    this.addAuditTrail('REVOKED', revokedBy, reason);
  }

  archive(archivedBy: string, reason?: string): void {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
    this.archiveReason = reason;
    this.isActive = false;
    
    this.addAuditTrail('ARCHIVED', archivedBy, reason);
  }

  setExpiration(expiresAt: Date): void {
    this.expiresAt = expiresAt;
    this.requiresRenewal = true;
    this.renewalDueAt = new Date(expiresAt.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before expiry
  }

  isRenewalDue(): boolean {
    return this.requiresRenewal && 
           !!this.renewalDueAt && 
           this.renewalDueAt <= new Date() &&
           this.status === ConsentStatus.GRANTED;
  }

  sendRenewalReminder(sentTo: string): void {
    this.renewalReminderSentTo = sentTo;
    this.lastReminderSentAt = new Date();
    this.reminderCount += 1;
    
    this.addAuditTrail('RENEWAL_REMINDER_SENT', 'system', `Reminder sent to ${sentTo}`);
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
    if (this.isExpired()) return 'Expired';
    return this.status.charAt(0).toUpperCase() + this.status.slice(1);
  }

  getDaysUntilExpiry(): number | null {
    if (!this.expiresAt) return null;
    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilRenewal(): number | null {
    if (!this.renewalDueAt) return null;
    const now = new Date();
    const diffTime = this.renewalDueAt.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  requiresWitness(): boolean {
    return this.consentMethod === ConsentMethod.WITNESSED_CONSENT;
  }

  hasValidSignature(): boolean {
    return !!this.digitalSignature?.signature && 
           !!this.digitalSignature?.timestamp &&
           this.digitalSignature.timestamp <= new Date();
  }

  getConsentSummary(): any {
    return {
      id: this.id,
      type: this.consentType,
      status: this.status,
      granted: this.granted,
      submittedAt: this.submittedAt,
      expiresAt: this.expiresAt,
      isActive: this.getIsActive(),
      isExpired: this.isExpired(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      requiresRenewal: this.requiresRenewal,
      renewalDue: this.isRenewalDue(),
    };
  }

  toJSON(): any {
    const { 
      digitalSignature, 
      witness, 
      auditTrail, 
      ...safeData 
    } = this;
    return safeData;
  }
}
