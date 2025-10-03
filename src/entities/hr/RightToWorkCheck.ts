import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Right to Work Check Entity for WriteCareNotes
 * @module RightToWorkCheckEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Right to Work check entity for comprehensive immigration status
 * verification with document management, expiry alerts, and compliance dashboards.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
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
import { RightToWorkDocument } from './RightToWorkDocument';
import { RightToWorkNotification } from './RightToWorkNotification';
import { Employee } from './Employee';
import { logger } from '@/utils/logger';

/**
 * Right to Work status enumeration
 */
export enum RightToWorkStatus {
  NOT_STARTED = 'not_started',
  DOCUMENT_UPLOADED = 'document_uploaded',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
  INVALID = 'invalid',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

/**
 * Right to Work document type enumeration
 */
export enum RightToWorkDocumentType {
  PASSPORT = 'passport',
  NATIONAL_ID = 'national_id',
  VISA = 'visa',
  WORK_PERMIT = 'work_permit',
  SETTLEMENT_STATUS = 'settlement_status',
  EU_SETTLEMENT = 'eu_settlement',
  BRITISH_CITIZENSHIP = 'british_citizenship',
  OTHER = 'other'
}

/**
 * Right to Work verification type enumeration
 */
export enum RightToWorkVerificationType {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  THIRD_PARTY = 'third_party',
  GOVERNMENT_API = 'government_api'
}

/**
 * Right to Work priority enumeration
 */
export enum RightToWorkPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * Right to Work check entity for comprehensive immigration status verification
 */
@Entity('wcn_right_to_work_checks')
@Index(['employeeId', 'status'])
@Index(['documentType', 'status'])
@Index(['expiryDate', 'status'])
@Index(['createdAt', 'status'])
export class RightToWorkCheck extends BaseEntity {

  // Employee Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  employeeId!: string;

  @ManyToOne(() => Employee, { eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  // Right to Work Details
  @Column({ type: 'enum', enum: RightToWorkDocumentType })
  @IsEnum(RightToWorkDocumentType)
  documentType!: RightToWorkDocumentType;

  @Column({ type: 'enum', enum: RightToWorkStatus, default: RightToWorkStatus.NOT_STARTED })
  @IsEnum(RightToWorkStatus)
  status!: RightToWorkStatus;

  @Column({ type: 'enum', enum: RightToWorkVerificationType, default: RightToWorkVerificationType.MANUAL })
  @IsEnum(RightToWorkVerificationType)
  verificationType!: RightToWorkVerificationType;

  @Column({ type: 'enum', enum: RightToWorkPriority, default: RightToWorkPriority.MEDIUM })
  @IsEnum(RightToWorkPriority)
  priority!: RightToWorkPriority;

  // Document Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  documentNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  passportNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  visaNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  workPermitNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  referenceNumber?: string;

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
  issuingCountry?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  issuingAuthority?: string;

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
  @OneToMany(() => RightToWorkDocument, document => document.rightToWorkCheck, { cascade: true })
  documents!: RightToWorkDocument[];

  @OneToMany(() => RightToWorkNotification, notification => notification.rightToWorkCheck, { cascade: true })
  notifications!: RightToWorkNotification[];

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
   * Validate Right to Work check before insert
   */
  @BeforeInsert()
  async validateRightToWorkBeforeInsert(): Promise<void> {
    this.validateRightToWorkData();
    this.calculateExpiryDate();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('Right to Work check created', {
      rightToWorkId: this.id,
      employeeId: this.employeeId,
      documentType: this.documentType,
      auditTrail: true
    });
  }

  /**
   * Validate Right to Work check before update
   */
  @BeforeUpdate()
  async validateRightToWorkBeforeUpdate(): Promise<void> {
    this.validateRightToWorkData();
    this.updateComplianceStatus();
    
    console.info('Right to Work check updated', {
      rightToWorkId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate Right to Work data
   */
  private validateRightToWorkData(): void {
    if (this.issueDate && this.expiryDate && this.issueDate > this.expiryDate) {
      throw new Error('Issue date cannot be after expiry date');
    }

    if (this.verificationDate && this.issueDate && this.verificationDate < this.issueDate) {
      throw new Error('Verification date cannot be before issue date');
    }

    if (this.isVulnerableAdultRole && this.documentType === RightToWorkDocumentType.OTHER) {
      throw new Error('Vulnerable adult roles require specific document types');
    }

    if (this.isChildRole && this.documentType === RightToWorkDocumentType.OTHER) {
      throw new Error('Child roles require specific document types');
    }
  }

  /**
   * Calculate expiry date based on document type
   */
  private calculateExpiryDate(): void {
    if (!this.issueDate) return;

    const expiryMonths = this.getExpiryMonthsForDocumentType();
    const expiryDate = new Date(this.issueDate);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    
    this.expiryDate = expiryDate;
  }

  /**
   * Get expiry months for document type
   */
  private getExpiryMonthsForDocumentType(): number {
    switch (this.documentType) {
      case RightToWorkDocumentType.PASSPORT:
        return 120; // 10 years
      case RightToWorkDocumentType.NATIONAL_ID:
        return 60; // 5 years
      case RightToWorkDocumentType.VISA:
        return 36; // 3 years
      case RightToWorkDocumentType.WORK_PERMIT:
        return 24; // 2 years
      case RightToWorkDocumentType.SETTLEMENT_STATUS:
        return 120; // 10 years
      case RightToWorkDocumentType.EU_SETTLEMENT:
        return 120; // 10 years
      case RightToWorkDocumentType.BRITISH_CITIZENSHIP:
        return 120; // 10 years
      case RightToWorkDocumentType.OTHER:
        return 12; // 1 year
      default:
        return 12;
    }
  }

  /**
   * Update compliance status
   */
  private updateComplianceStatus(): void {
    if (this.status === RightToWorkStatus.VERIFIED && this.expiryDate) {
      this.isCompliant = new Date() < this.expiryDate;
      this.requiresRenewal = !this.isCompliant;
    } else if (this.status === RightToWorkStatus.INVALID || this.status === RightToWorkStatus.REJECTED) {
      this.isCompliant = false;
      this.requiresRenewal = false;
    } else {
      this.isCompliant = false;
      this.requiresRenewal = false;
    }
  }

  /**
   * Start Right to Work verification
   */
  startVerification(createdBy: string): void {
    if (this.status !== RightToWorkStatus.NOT_STARTED) {
      throw new Error('Right to Work verification has already been started');
    }

    this.status = RightToWorkStatus.DOCUMENT_UPLOADED;
    this.createdBy = createdBy;

    console.info('Right to Work verification started', {
      rightToWorkId: this.id,
      employeeId: this.employeeId,
      createdBy,
      auditTrail: true
    });
  }

  /**
   * Submit for verification
   */
  submitForVerification(submittedBy: string): void {
    if (this.status !== RightToWorkStatus.DOCUMENT_UPLOADED) {
      throw new Error('Documents must be uploaded before submission');
    }

    this.status = RightToWorkStatus.PENDING_VERIFICATION;
    this.updatedBy = submittedBy;

    console.info('Right to Work verification submitted', {
      rightToWorkId: this.id,
      submittedBy,
      auditTrail: true
    });
  }

  /**
   * Complete verification
   */
  completeVerification(isValid: boolean, verifiedBy: string, notes?: string): void {
    if (this.status !== RightToWorkStatus.PENDING_VERIFICATION) {
      throw new Error('Right to Work verification must be pending to complete');
    }

    this.status = isValid ? RightToWorkStatus.VERIFIED : RightToWorkStatus.INVALID;
    this.verificationDate = new Date();
    this.updatedBy = verifiedBy;
    this.verificationNotes = notes;
    this.updateComplianceStatus();

    console.info('Right to Work verification completed', {
      rightToWorkId: this.id,
      isValid,
      verifiedBy,
      auditTrail: true
    });
  }

  /**
   * Reject verification
   */
  rejectVerification(reason: string, rejectedBy: string): void {
    if (this.status !== RightToWorkStatus.PENDING_VERIFICATION) {
      throw new Error('Right to Work verification must be pending to reject');
    }

    this.status = RightToWorkStatus.REJECTED;
    this.rejectionReason = reason;
    this.verificationDate = new Date();
    this.updatedBy = rejectedBy;
    this.updateComplianceStatus();

    console.info('Right to Work verification rejected', {
      rightToWorkId: this.id,
      reason,
      rejectedBy,
      auditTrail: true
    });
  }

  /**
   * Check if Right to Work is expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * Check if Right to Work is due for renewal
   */
  isDueForRenewal(withinDays: number = 30): boolean {
    if (!this.expiryDate) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.expiryDate <= futureDate && this.status === RightToWorkStatus.VERIFIED;
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
   * Get verification summary
   */
  getVerificationSummary(): {
    status: RightToWorkStatus;
    isCompliant: boolean;
    isExpired: boolean;
    daysUntilExpiry: number | null;
    riskLevel: string;
    requiresRenewal: boolean;
    documentType: RightToWorkDocumentType;
  } {
    return {
      status: this.status,
      isCompliant: this.isCompliant,
      isExpired: this.isExpired(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      riskLevel: this.riskLevel,
      requiresRenewal: this.requiresRenewal,
      documentType: this.documentType
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
  } {
    return {
      isCompliant: this.isCompliant,
      status: this.status,
      expiryDate: this.expiryDate || null,
      lastChecked: this.lastCheckedDate || null,
      riskLevel: this.riskLevel,
      isHighRisk: this.isHighRisk
    };
  }
}

export default RightToWorkCheck;