import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsEmail, IsOptional, IsEnum, IsDateString, IsUUID, IsNumber, IsBoolean, IsUrl } from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '../BaseEntity';
import { Employee } from './Employee';

export enum CertificationStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  REVOKED = 'revoked',
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review'
}

export enum CertificationType {
  PROFESSIONAL = 'professional',
  MANDATORY = 'mandatory',
  COMPLIANCE = 'compliance',
  SKILL_BASED = 'skill_based',
  SAFETY = 'safety',
  MEDICAL = 'medical',
  TECHNICAL = 'technical',
  MANAGEMENT = 'management',
  OTHER = 'other'
}

export enum VerificationStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FAILED = 'failed',
  NOT_REQUIRED = 'not_required'
}

export interface CertificationDetails {
  name: string;
  description: string;
  type: CertificationType;
  category: string;
  level?: string;
  version?: string;
  issuingBody: string;
  issuingBodyContact?: {
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  certificationNumber: string;
  certificateUrl?: string;
  digitalBadgeUrl?: string;
  qrCode?: string;
}

export interface ValidityPeriod {
  issueDate: Date;
  expiryDate?: Date;
  renewalRequired: boolean;
  renewalPeriod?: number; // months
  gracePeriod?: number; // days
  autoRenewal: boolean;
  lastRenewalDate?: Date;
  nextRenewalDate?: Date;
}

export interface Requirements {
  prerequisites: string[];
  experienceRequired?: number; // years
  trainingRequired?: string[];
  examinationRequired: boolean;
  practicalAssessmentRequired: boolean;
  continuingEducationRequired: boolean;
  ceHoursRequired?: number;
  ceHoursCompleted?: number;
  renewalFee?: number;
  currency?: string;
}

export interface Verification {
  status: VerificationStatus;
  verifiedBy?: string;
  verifiedDate?: Date;
  verificationMethod?: 'manual' | 'automatic' | 'third_party';
  verificationNotes?: string;
  externalVerificationId?: string;
  lastChecked?: Date;
}

export interface Compliance {
  regulatoryBody?: string;
  regulationNumber?: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending' | 'exempt';
  complianceNotes?: string;
  auditRequired: boolean;
  lastAuditDate?: Date;
  nextAuditDate?: Date;
  auditResults?: string;
}

@Entity('certifications')
export class Certification extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  certificationId: string;

  @Column({ type: 'uuid' })
  @IsNotEmpty()
  @IsUUID()
  employeeId: string;

  @ManyToOne(() => Employee, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: CertificationStatus,
    default: CertificationStatus.ACTIVE
  })
  @IsEnum(CertificationStatus)
  status: CertificationStatus;

  @Column('jsonb')
  @IsNotEmpty()
  details: CertificationDetails;

  @Column('jsonb')
  @IsNotEmpty()
  validityPeriod: ValidityPeriod;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  requirements?: Requirements;

  @Column('jsonb')
  @IsNotEmpty()
  verification: Verification;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  compliance?: Compliance;

  @Column('text', { nullable: true })
  @IsOptional()
  notes?: string;

  @Column('jsonb', { default: '{}' })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  @BeforeInsert()
  generateCertificationId() {
    if (!this.certificationId) {
      this.certificationId = `CERT-${uuidv4().substring(0, 8).toUpperCase()}`;
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  validateCertification() {
    if (!this.details || !this.validityPeriod || !this.verification) {
      throw new Error('Required certification sections must be provided');
    }

    // Validate dates
    if (this.validityPeriod.expiryDate && this.validityPeriod.issueDate) {
      if (new Date(this.validityPeriod.expiryDate) <= new Date(this.validityPeriod.issueDate)) {
        throw new Error('Expiry date must be after issue date');
      }
    }
  }

  isActive(): boolean {
    return this.status === CertificationStatus.ACTIVE;
  }

  isExpired(): boolean {
    if (!this.validityPeriod.expiryDate) return false;
    return new Date() > new Date(this.validityPeriod.expiryDate);
  }

  isExpiringSoon(days: number = 30): boolean {
    if (!this.validityPeriod.expiryDate) return false;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return new Date(this.validityPeriod.expiryDate) <= futureDate;
  }

  getDaysUntilExpiry(): number | null {
    if (!this.validityPeriod.expiryDate) return null;
    const today = new Date();
    const expiryDate = new Date(this.validityPeriod.expiryDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysSinceIssue(): number {
    const today = new Date();
    const issueDate = new Date(this.validityPeriod.issueDate);
    const diffTime = today.getTime() - issueDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isRenewalDue(): boolean {
    if (!this.validityPeriod.renewalRequired) return false;
    if (!this.validityPeriod.nextRenewalDate) return false;
    return new Date() >= new Date(this.validityPeriod.nextRenewalDate);
  }

  getRenewalStatus(): string {
    if (!this.validityPeriod.renewalRequired) return 'not_required';
    if (this.isExpired()) return 'expired';
    if (this.isRenewalDue()) return 'due';
    if (this.isExpiringSoon(30)) return 'due_soon';
    return 'current';
  }

  isVerified(): boolean {
    return this.verification.status === VerificationStatus.VERIFIED;
  }

  needsVerification(): boolean {
    return this.verification.status === VerificationStatus.PENDING;
  }

  isCompliant(): boolean {
    if (!this.compliance) return true;
    return this.compliance.complianceStatus === 'compliant';
  }

  getComplianceStatus(): string {
    if (!this.compliance) return 'not_applicable';
    return this.compliance.complianceStatus;
  }

  isAuditDue(): boolean {
    if (!this.compliance || !this.compliance.auditRequired) return false;
    if (!this.compliance.nextAuditDate) return false;
    return new Date() >= new Date(this.compliance.nextAuditDate);
  }

  getAuditStatus(): string {
    if (!this.compliance || !this.compliance.auditRequired) return 'not_required';
    if (this.isAuditDue()) return 'due';
    if (this.compliance.lastAuditDate) {
      const lastAudit = new Date(this.compliance.lastAuditDate);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      return lastAudit > oneYearAgo ? 'current' : 'overdue';
    }
    return 'never_audited';
  }

  getContinuingEducationProgress(): number {
    if (!this.requirements || !this.requirements.continuingEducationRequired) return 100;
    if (!this.requirements.ceHoursRequired || !this.requirements.ceHoursCompleted) return 0;
    return Math.round((this.requirements.ceHoursCompleted / this.requirements.ceHoursRequired) * 100);
  }

  isContinuingEducationComplete(): boolean {
    if (!this.requirements || !this.requirements.continuingEducationRequired) return true;
    if (!this.requirements.ceHoursRequired || !this.requirements.ceHoursCompleted) return false;
    return this.requirements.ceHoursCompleted >= this.requirements.ceHoursRequired;
  }

  getValidityStatus(): string {
    if (this.isExpired()) return 'expired';
    if (this.isExpiringSoon(7)) return 'expiring_soon';
    if (this.isExpiringSoon(30)) return 'expiring_soon';
    if (this.isRenewalDue()) return 'renewal_due';
    return 'valid';
  }

  getOverallStatus(): string {
    if (!this.isActive()) return this.status;
    if (this.isExpired()) return 'expired';
    if (!this.isVerified()) return 'unverified';
    if (!this.isCompliant()) return 'non_compliant';
    if (this.isRenewalDue()) return 'renewal_due';
    if (this.isExpiringSoon(30)) return 'expiring_soon';
    return 'active';
  }

  getPriorityLevel(): 'low' | 'medium' | 'high' | 'critical' {
    if (this.isExpired()) return 'critical';
    if (this.isExpiringSoon(7)) return 'critical';
    if (this.isExpiringSoon(30)) return 'high';
    if (this.isRenewalDue()) return 'high';
    if (!this.isVerified()) return 'medium';
    if (!this.isCompliant()) return 'medium';
    return 'low';
  }

  getRequiredActions(): string[] {
    const actions: string[] = [];
    
    if (this.isExpired()) {
      actions.push('Renew certification immediately');
    } else if (this.isExpiringSoon(7)) {
      actions.push('Renew certification urgently');
    } else if (this.isExpiringSoon(30)) {
      actions.push('Plan for certification renewal');
    }
    
    if (this.isRenewalDue()) {
      actions.push('Complete renewal process');
    }
    
    if (!this.isVerified()) {
      actions.push('Verify certification with issuing body');
    }
    
    if (!this.isCompliant()) {
      actions.push('Address compliance issues');
    }
    
    if (this.isAuditDue()) {
      actions.push('Schedule compliance audit');
    }
    
    if (this.requirements?.continuingEducationRequired && !this.isContinuingEducationComplete()) {
      actions.push('Complete continuing education requirements');
    }
    
    return actions;
  }

  canBeRenewed(): boolean {
    if (!this.validityPeriod.renewalRequired) return false;
    if (this.isExpired()) return true;
    if (this.isRenewalDue()) return true;
    if (this.isExpiringSoon(30)) return true;
    return false;
  }

  getRenewalDeadline(): Date | null {
    if (!this.validityPeriod.renewalRequired) return null;
    if (this.validityPeriod.nextRenewalDate) {
      return new Date(this.validityPeriod.nextRenewalDate);
    }
    if (this.validityPeriod.expiryDate) {
      return new Date(this.validityPeriod.expiryDate);
    }
    return null;
  }

  getGracePeriodEnd(): Date | null {
    if (!this.validityPeriod.gracePeriod || !this.validityPeriod.expiryDate) return null;
    const expiryDate = new Date(this.validityPeriod.expiryDate);
    expiryDate.setDate(expiryDate.getDate() + this.validityPeriod.gracePeriod);
    return expiryDate;
  }

  isInGracePeriod(): boolean {
    if (!this.validityPeriod.gracePeriod) return false;
    const gracePeriodEnd = this.getGracePeriodEnd();
    if (!gracePeriodEnd) return false;
    return new Date() <= gracePeriodEnd;
  }

  getDisplayName(): string {
    return this.details.name;
  }

  getIssuingBody(): string {
    return this.details.issuingBody;
  }

  getCertificationNumber(): string {
    return this.details.certificationNumber;
  }

  getIssueDate(): Date {
    return new Date(this.validityPeriod.issueDate);
  }

  getExpiryDate(): Date | null {
    return this.validityPeriod.expiryDate ? new Date(this.validityPeriod.expiryDate) : null;
  }

  getType(): CertificationType {
    return this.details.type;
  }

  getCategory(): string {
    return this.details.category;
  }

  getLevel(): string | null {
    return this.details.level || null;
  }

  getVersion(): string | null {
    return this.details.version || null;
  }

  toJSON() {
    return {
      ...this,
      daysUntilExpiry: this.getDaysUntilExpiry(),
      daysSinceIssue: this.getDaysSinceIssue(),
      validityStatus: this.getValidityStatus(),
      overallStatus: this.getOverallStatus(),
      priorityLevel: this.getPriorityLevel(),
      requiredActions: this.getRequiredActions(),
      canBeRenewed: this.canBeRenewed(),
      renewalDeadline: this.getRenewalDeadline(),
      isInGracePeriod: this.isInGracePeriod(),
      continuingEducationProgress: this.getContinuingEducationProgress(),
      isContinuingEducationComplete: this.isContinuingEducationComplete(),
      auditStatus: this.getAuditStatus(),
      complianceStatus: this.getComplianceStatus()
    };
  }
}
