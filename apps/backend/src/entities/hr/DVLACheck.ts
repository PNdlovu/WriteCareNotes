import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview DVLA Check Entity for WriteCareNotes
 * @module DVLACheckEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description DVLA check entity for comprehensive driving license verification
 * with expiry management, compliance reports, and audit logging.
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
import { DVLAService } from './DVLAService';
import { Employee } from './Employee';
import { logger } from '@/utils/logger';

/**
 * DVLA check status enumeration
 */
export enum DVLACheckStatus {
  NOT_STARTED = 'not_started',
  PENDING_VERIFICATION = 'pending_verification',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  INVALID = 'invalid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

/**
 * DVLA license type enumeration
 */
export enum DVLALicenseType {
  PROVISIONAL = 'provisional',
  FULL = 'full',
  INTERNATIONAL = 'international',
  EU = 'eu',
  OTHER = 'other'
}

/**
 * DVLA license category enumeration
 */
export enum DVLALicenseCategory {
  A = 'A', // Motorcycles
  B = 'B', // Cars
  C = 'C', // Large vehicles
  D = 'D', // Buses
  BE = 'BE', // Car + trailer
  CE = 'CE', // Large vehicle + trailer
  DE = 'DE', // Bus + trailer
  AM = 'AM', // Mopeds
  A1 = 'A1', // Light motorcycles
  A2 = 'A2', // Medium motorcycles
  B1 = 'B1', // Quadricycles
  C1 = 'C1', // Medium vehicles
  D1 = 'D1', // Minibuses
  C1E = 'C1E', // Medium vehicle + trailer
  D1E = 'D1E' // Minibus + trailer
}

/**
 * DVLA check priority enumeration
 */
export enum DVLACheckPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * DVLA check entity for comprehensive driving license verification
 */
@Entity('wcn_dvla_checks')
@Index(['employeeId', 'status'])
@Index(['licenseType', 'status'])
@Index(['expiryDate', 'status'])
@Index(['createdAt', 'status'])
export class DVLACheck extends BaseEntity {

  // Employee Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  employeeId!: string;

  @ManyToOne(() => Employee, { eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  // DVLA Check Details
  @Column({ type: 'enum', enum: DVLACheckStatus, default: DVLACheckStatus.NOT_STARTED })
  @IsEnum(DVLACheckStatus)
  status!: DVLACheckStatus;

  @Column({ type: 'enum', enum: DVLALicenseType })
  @IsEnum(DVLALicenseType)
  licenseType!: DVLALicenseType;

  @Column({ type: 'enum', enum: DVLACheckPriority, default: DVLACheckPriority.MEDIUM })
  @IsEnum(DVLACheckPriority)
  priority!: DVLACheckPriority;

  // License Information
  @Column({ type: 'varchar', length: 20 })
  @IsString()
  @Length(1, 20)
  licenseNumber!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  referenceNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  dvlaReference?: string;

  // License Categories
  @Column({ type: 'jsonb' })
  @IsOptional()
  licenseCategories!: DVLALicenseCategory[];

  // Dates
  @Column({ type: 'date', nullable: true })
  @IsDate()
  @IsOptional()
  issueDate?: Date;

  @Column({ type: 'date', nullable: true })
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  verificationDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  lastCheckedDate?: Date;

  // Verification Details
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  issuingAuthority?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  issuingCountry?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  additionalInformation?: string;

  // Compliance Tracking
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isCompliant!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresRenewal!: boolean;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  renewalCount!: number;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  checkCount!: number;

  // Risk Assessment
  @Column({ type: 'varchar', length: 20, default: 'low' })
  @IsString()
  @Length(1, 20)
  riskLevel!: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  riskAssessmentNotes?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isHighRisk!: boolean;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  careHomeId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  department?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  position?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresDriving!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isVulnerableAdultRole!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isChildRole!: boolean;

  // Cost Tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  verificationCost?: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  // Relationships
  @OneToMany(() => DVLAService, service => service.dvlaCheck, { cascade: true })
  services!: DVLAService[];

  // Additional Audit Fields
  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  /**
   * Validate DVLA check before insert
   */
  @BeforeInsert()
  async validateDVLACheckBeforeInsert(): Promise<void> {
    this.validateDVLACheckData();
    this.calculateExpiryDate();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('DVLA check created', {
      dvlaCheckId: this.id,
      employeeId: this.employeeId,
      licenseType: this.licenseType,
      auditTrail: true
    });
  }

  /**
   * Validate DVLA check before update
   */
  @BeforeUpdate()
  async validateDVLACheckBeforeUpdate(): Promise<void> {
    this.validateDVLACheckData();
    this.updateComplianceStatus();
    
    console.info('DVLA check updated', {
      dvlaCheckId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate DVLA check data
   */
  private validateDVLACheckData(): void {
    if (this.issueDate && this.expiryDate && this.issueDate > this.expiryDate) {
      throw new Error('Issue date cannot be after expiry date');
    }

    if (this.verificationDate && this.issueDate && this.verificationDate < this.issueDate) {
      throw new Error('Verification date cannot be before issue date');
    }

    if (this.requiresDriving && this.licenseType === DVLALicenseType.PROVISIONAL) {
      throw new Error('Driving roles require full license, not provisional');
    }

    if (this.isVulnerableAdultRole && this.licenseType === DVLALicenseType.PROVISIONAL) {
      throw new Error('Vulnerable adult roles require full license');
    }

    if (this.isChildRole && this.licenseType === DVLALicenseType.PROVISIONAL) {
      throw new Error('Child roles require full license');
    }
  }

  /**
   * Calculate expiry date based on license type
   */
  private calculateExpiryDate(): void {
    if (!this.issueDate) return;

    const expiryMonths = this.getExpiryMonthsForLicenseType();
    const expiryDate = new Date(this.issueDate);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    
    this.expiryDate = expiryDate;
  }

  /**
   * Get expiry months for license type
   */
  private getExpiryMonthsForLicenseType(): number {
    switch (this.licenseType) {
      case DVLALicenseType.PROVISIONAL:
        return 24; // 2 years
      case DVLALicenseType.FULL:
        return 120; // 10 years
      case DVLALicenseType.INTERNATIONAL:
        return 12; // 1 year
      case DVLALicenseType.EU:
        return 120; // 10 years
      case DVLALicenseType.OTHER:
        return 12; // 1 year
      default:
        return 12;
    }
  }

  /**
   * Update compliance status
   */
  private updateComplianceStatus(): void {
    if (this.status === DVLACheckStatus.VERIFIED && this.expiryDate) {
      this.isCompliant = new Date() < this.expiryDate;
      this.requiresRenewal = !this.isCompliant;
    } else if (this.status === DVLACheckStatus.INVALID || this.status === DVLACheckStatus.REJECTED) {
      this.isCompliant = false;
      this.requiresRenewal = false;
    } else {
      this.isCompliant = false;
      this.requiresRenewal = false;
    }
  }

  /**
   * Start DVLA verification
   */
  startVerification(createdBy: string): void {
    if (this.status !== DVLACheckStatus.NOT_STARTED) {
      throw new Error('DVLA verification has already been started');
    }

    this.status = DVLACheckStatus.PENDING_VERIFICATION;
    this.createdBy = createdBy;

    console.info('DVLA verification started', {
      dvlaCheckId: this.id,
      employeeId: this.employeeId,
      createdBy,
      auditTrail: true
    });
  }

  /**
   * Submit for verification
   */
  submitForVerification(submittedBy: string): void {
    if (this.status !== DVLACheckStatus.PENDING_VERIFICATION) {
      throw new Error('DVLA verification must be pending to submit');
    }

    this.status = DVLACheckStatus.IN_PROGRESS;
    this.updatedBy = submittedBy;

    console.info('DVLA verification submitted', {
      dvlaCheckId: this.id,
      submittedBy,
      auditTrail: true
    });
  }

  /**
   * Complete verification
   */
  completeVerification(isValid: boolean, verifiedBy: string, notes?: string): void {
    if (this.status !== DVLACheckStatus.IN_PROGRESS) {
      throw new Error('DVLA verification must be in progress to complete');
    }

    this.status = isValid ? DVLACheckStatus.VERIFIED : DVLACheckStatus.INVALID;
    this.verificationDate = new Date();
    this.updatedBy = verifiedBy;
    this.verificationNotes = notes;
    this.updateComplianceStatus();

    console.info('DVLA verification completed', {
      dvlaCheckId: this.id,
      isValid,
      verifiedBy,
      auditTrail: true
    });
  }

  /**
   * Reject verification
   */
  rejectVerification(reason: string, rejectedBy: string): void {
    if (this.status !== DVLACheckStatus.IN_PROGRESS) {
      throw new Error('DVLA verification must be in progress to reject');
    }

    this.status = DVLACheckStatus.REJECTED;
    this.rejectionReason = reason;
    this.verificationDate = new Date();
    this.updatedBy = rejectedBy;
    this.updateComplianceStatus();

    console.info('DVLA verification rejected', {
      dvlaCheckId: this.id,
      reason,
      rejectedBy,
      auditTrail: true
    });
  }

  /**
   * Check if DVLA check is expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * Check if DVLA check is due for renewal
   */
  isDueForRenewal(withinDays: number = 30): boolean {
    if (!this.expiryDate) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.expiryDate <= futureDate && this.status === DVLACheckStatus.VERIFIED;
  }

  /**
   * Get days until expiry
   */
  getDaysUntilExpiry(): number | null {
    if (!this.expiryDate) return null;
    
    const now = new Date();
    const diffTime = this.expiryDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if license has required category
   */
  hasRequiredCategory(requiredCategory: DVLALicenseCategory): boolean {
    return this.licenseCategories.includes(requiredCategory);
  }

  /**
   * Check if license has any of the required categories
   */
  hasAnyRequiredCategory(requiredCategories: DVLALicenseCategory[]): boolean {
    return requiredCategories.some(category => this.licenseCategories.includes(category));
  }

  /**
   * Get verification summary
   */
  getVerificationSummary(): {
    status: DVLACheckStatus;
    isCompliant: boolean;
    isExpired: boolean;
    daysUntilExpiry: number | null;
    riskLevel: string;
    requiresRenewal: boolean;
    licenseType: DVLALicenseType;
    licenseCategories: DVLALicenseCategory[];
  } {
    return {
      status: this.status,
      isCompliant: this.isCompliant,
      isExpired: this.isExpired(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      riskLevel: this.riskLevel,
      requiresRenewal: this.requiresRenewal,
      licenseType: this.licenseType,
      licenseCategories: this.licenseCategories
    };
  }

  /**
   * Get compliance status for reporting
   */
  getComplianceStatus(): {
    isCompliant: boolean;
    status: string;
    expiryDate: Date | null;
    lastChecked: Date | null;
    riskLevel: string;
    isHighRisk: boolean;
    requiresDriving: boolean;
  } {
    return {
      isCompliant: this.isCompliant,
      status: this.status,
      expiryDate: this.expiryDate || null,
      lastChecked: this.lastCheckedDate || null,
      riskLevel: this.riskLevel,
      isHighRisk: this.isHighRisk,
      requiresDriving: this.requiresDriving
    };
  }
}

export default DVLACheck;