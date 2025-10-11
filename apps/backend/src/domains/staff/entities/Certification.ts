import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { EmployeeProfile } from './EmployeeProfile';

export enum CertificationStatus {
  VALID = 'valid',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended'
}

export enum CertificationType {
  FIRST_AID = 'first_aid',
  FOOD_HYGIENE = 'food_hygiene',
  HEALTH_SAFETY = 'health_safety',
  FIRE_SAFETY = 'fire_safety',
  MANUAL_HANDLING = 'manual_handling',
  DEMENTIA_CARE = 'dementia_care',
  MEDICATION_ADMINISTRATION = 'medication_administration',
  INFECTION_CONTROL = 'infection_control',
  MENTAL_HEALTH = 'mental_health',
  PALLIATIVE_CARE = 'palliative_care',
  NURSING = 'nursing',
  SOCIAL_WORK = 'social_work',
  PHYSIOTHERAPY = 'physiotherapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  OTHER = 'other'
}

export enum CertificationLevel {
  BASIC = 'basic',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
  SPECIALIST = 'specialist'
}

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => EmployeeProfile, employeeProfile => employeeProfile.certifications)
  @JoinColumn({ name: 'employeeProfileId' })
  employeeProfile: EmployeeProfile;

  @Column({ type: 'uuid' })
  employeeProfileId: string;

  @Column({ type: 'var char', length: 100 })
  name: string;

  @Column({ type: 'var char', length: 200 })
  displayName: string;

  @Column({ type: 'enum', enum: CertificationType })
  type: CertificationType;

  @Column({ type: 'enum', enum: CertificationLevel, default: CertificationLevel.BASIC })
  level: CertificationLevel;

  @Column({ type: 'enum', enum: CertificationStatus, default: CertificationStatus.PENDING })
  status: CertificationStatus;

  @Column({ type: 'var char', length: 100, nullable: true })
  issuingBody: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  certificateNumber: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  certificateUrl: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'int', nullable: true })
  validityPeriod: number; // Months

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  score: number; // If applicable

  @Column({ type: 'var char', length: 10, nullable: true })
  grade: string; // A, B, C, Pass, Fail, etc.

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  trainingProvider: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  courseUrl: string;

  @Column({ type: 'int', nullable: true })
  cpdPoints: number; // Continuing Professional Development points

  @Column({ type: 'boolean', default: false })
  isMandatory: boolean;

  @Column({ type: 'boolean', default: false })
  isRenewable: boolean;

  @Column({ type: 'int', default: 0 })
  renewalReminderDays: number; // Days before expiry to send reminder

  @Column({ type: 'var char', length: 100, nullable: true })
  verifiedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  public isValid(): boolean {
    return this.status === CertificationStatus.VALID && 
           this.expiryDate && 
           new Date(this.expiryDate) > new Date();
  }

  public isExpired(): boolean {
    return this.status === CertificationStatus.EXPIRED || 
           (this.expiryDate && new Date(this.expiryDate) <= new Date());
  }

  public isExpiringSoon(days: number = 30): boolean {
    if (!this.expiryDate || this.isExpired()) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return new Date(this.expiryDate) <= futureDate;
  }

  public getDaysUntilExpiry(): number {
    if (!this.expiryDate || this.isExpired()) return 0;
    
    const today = new Date();
    const diffTime = new Date(this.expiryDate).getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public getDaysSinceIssue(): number {
    const today = new Date();
    const diffTime = today.getTime() - new Date(this.issueDate).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public canBeRenewed(): boolean {
    return this.isRenewable && 
           (this.isExpired() || this.isExpiringSoon(90)); // Can renew 90 days before expiry
  }

  public needsRenewal(): boolean {
    return this.isRenewable && 
           (this.isExpired() || this.isExpiringSoon(this.renewalReminderDays));
  }

  public markAsValid(verifiedBy: string): void {
    this.status = CertificationStatus.VALID;
    this.verifiedBy = verifiedBy;
    this.verifiedAt = new Date();
  }

  public markAsExpired(): void {
    this.status = CertificationStatus.EXPIRED;
  }

  public markAsRevoked(reason: string): void {
    this.status = CertificationStatus.REVOKED;
    this.notes = this.notes ? `${this.notes}\nRevoked: ${reason}` : `Revoked: ${reason}`;
  }

  public markAsSuspended(reason: string): void {
    this.status = CertificationStatus.SUSPENDED;
    this.notes = this.notes ? `${this.notes}\nSuspended: ${reason}` : `Suspended: ${reason}`;
  }

  public renew(newExpiryDate: Date, verifiedBy: string): void {
    this.expiryDate = newExpiryDate;
    this.status = CertificationStatus.VALID;
    this.verifiedBy = verifiedBy;
    this.verifiedAt = new Date();
  }

  public getCertificationSummary(): {
    id: string;
    name: string;
    type: string;
    level: string;
    status: string;
    issuingBody: string;
    certificateNumber: string;
    issueDate: Date;
    expiryDate: Date | null;
    isValid: boolean;
    isExpired: boolean;
    isExpiringSoon: boolean;
    daysUntilExpiry: number;
    isMandatory: boolean;
    isRenewable: boolean;
    needsRenewal: boolean;
  } {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      level: this.level,
      status: this.status,
      issuingBody: this.issuingBody || '',
      certificateNumber: this.certificateNumber || '',
      issueDate: this.issueDate,
      expiryDate: this.expiryDate,
      isValid: this.isValid(),
      isExpired: this.isExpired(),
      isExpiringSoon: this.isExpiringSoon(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      isMandatory: this.isMandatory,
      isRenewable: this.isRenewable,
      needsRenewal: this.needsRenewal(),
    };
  }

  public getRenewalReminderDate(): Date | null {
    if (!this.expiryDate || !this.renewalReminderDays) return null;
    
    const reminderDate = new Date(this.expiryDate);
    reminderDate.setDate(reminderDate.getDate() - this.renewalReminderDays);
    
    return reminderDate;
  }

  public isRenewalReminderDue(): boolean {
    const reminderDate = this.getRenewalReminderDate();
    if (!reminderDate) return false;
    
    return new Date() >= reminderDate && this.isValid();
  }
}
