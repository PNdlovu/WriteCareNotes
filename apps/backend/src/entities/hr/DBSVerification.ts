import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview DBS Verification Entity for WriteCareNotes
 * @module DBSVerificationEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description DBS (Disclosure & Barring Service) verification entity for comprehensive
 * background check management with lifecycle tracking, document upload, compliance reporting,
 * and expiry management for healthcare staff.
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
import { DBSDocument } from './DBSDocument';
import { DBSNotification } from './DBSNotification';
import { Employee } from './Employee';
import { logger } from '@/utils/logger';

/**
 * DBS verification status enumeration
 */
export enum DBSStatus {
  NOT_STARTED = 'not_started',
  APPLICATION_SUBMITTED = 'application_submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CLEARED = 'cleared',
  BARRED = 'barred',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * DBS check type enumeration
 */
export enum DBSCheckType {
  BASIC = 'basic',
  STANDARD = 'standard',
  ENHANCED = 'enhanced',
  ENHANCED_WITH_BARRED_LISTS = 'enhanced_with_barred_lists'
}

/**
 * DBS verification priority enumeration
 */
export enum DBSPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * DBS verification entity for comprehensive background check management
 */
@Entity('wcn_dbs_verifications')
@Index(['employeeId', 'status'])
@Index(['checkType', 'status'])
@Index(['expiryDate', 'status'])
@Index(['createdAt', 'status'])
export class DBSVerification extends BaseEntity {

  // Employee Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  employeeId!: string;

  @ManyToOne(() => Employee, { eager: false })
  @JoinColumn({ name: 'employeeId' })
  employee?: Employee;

  // DBS Check Details
  @Column({ type: 'enum', enum: DBSCheckType })
  @IsEnum(DBSCheckType)
  checkType!: DBSCheckType;

  @Column({ type: 'enum', enum: DBSStatus, default: DBSStatus.NOT_STARTED })
  @IsEnum(DBSStatus)
  status!: DBSStatus;

  @Column({ type: 'enum', enum: DBSPriority, default: DBSPriority.MEDIUM })
  @IsEnum(DBSPriority)
  priority!: DBSPriority;

  // DBS Reference Numbers
  @Column({ type: 'var char', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  dbsReferenceNumber?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  applicationReference?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 50)
  certificateNumber?: string;

  // Dates
  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  applicationDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  submissionDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  completionDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  lastCheckedDate?: Date;

  // Verification Details
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
  @Column({ type: 'var char', length: 20, default: 'low' })
  @IsString()
  @Length(1, 20)
  riskLevel!: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  riskAssessmentNotes?: string;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  careHomeId?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  department?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
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
  applicationCost?: number;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  // Relationships
  @OneToMany(() => DBSDocument, document => document.dbsVerification, { cascade: true })
  documents!: DBSDocument[];

  @OneToMany(() => DBSNotification, notification => notification.dbsVerification, { cascade: true })
  notifications!: DBSNotification[];

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
   * Validate DBS verification before insert
   */
  @BeforeInsert()
  async validateDBSBeforeInsert(): Promise<void> {
    this.validateDBSData();
    this.calculateExpiryDate();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('DBS verification created', {
      dbsId: this.id,
      employeeId: this.employeeId,
      checkType: this.checkType,
      auditTrail: true
    });
  }

  /**
   * Validate DBS verification before update
   */
  @BeforeUpdate()
  async validateDBSBeforeUpdate(): Promise<void> {
    this.validateDBSData();
    this.updateComplianceStatus();
    
    console.info('DBS verification updated', {
      dbsId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate DBS data
   */
  private validateDBSData(): void {
    if (this.applicationDate && this.completionDate && this.applicationDate > this.completionDate) {
      throw new Error('Application date cannot be after completion date');
    }

    if (this.expiryDate && this.completionDate && this.completionDate > this.expiryDate) {
      throw new Error('Completion date cannot be after expiry date');
    }

    if (this.isVulnerableAdultRole && this.checkType === DBSCheckType.BASIC) {
      throw new Error('Vulnerable adult roles require enhanced DBS checks');
    }

    if (this.isChildRole && this.checkType !== DBSCheckType.ENHANCED_WITH_BARRED_LISTS) {
      throw new Error('Child roles require enhanced DBS checks with barred lists');
    }
  }

  /**
   * Calculate expiry date based on check type
   */
  private calculateExpiryDate(): void {
    if (!this.completionDate) return;

    const expiryMonths = this.getExpiryMonthsForCheckType();
    const expiryDate = new Date(this.completionDate);
    expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);
    
    this.expiryDate = expiryDate;
  }

  /**
   * Get expiry months for check type
   */
  private getExpiryMonthsForCheckType(): number {
    switch (this.checkType) {
      case DBSCheckType.BASIC:
        return 6; // 6 months
      case DBSCheckType.STANDARD:
        return 12; // 12 months
      case DBSCheckType.ENHANCED:
        return 18; // 18 months
      case DBSCheckType.ENHANCED_WITH_BARRED_LISTS:
        return 24; // 24 months
      default:
        return 12;
    }
  }

  /**
   * Update compliance status
   */
  private updateComplianceStatus(): void {
    if (this.status === DBSStatus.CLEARED && this.expiryDate) {
      this.isCompliant = new Date() < this.expiryDate;
      this.requiresRenewal = !this.isCompliant;
    } else if (this.status === DBSStatus.BARRED || this.status === DBSStatus.REJECTED) {
      this.isCompliant = false;
      this.requiresRenewal = false;
    } else {
      this.isCompliant = false;
      this.requiresRenewal = false;
    }
  }

  /**
   * Start DBS application process
   */
  startApplication(applicationReference: string, createdBy: string): void {
    if (this.status !== DBSStatus.NOT_STARTED) {
      throw new Error('DBS verification has already been started');
    }

    this.status = DBSStatus.APPLICATION_SUBMITTED;
    this.applicationReference = applicationReference;
    this.applicationDate = new Date();
    this.createdBy = createdBy;

    console.info('DBS application started', {
      dbsId: this.id,
      employeeId: this.employeeId,
      applicationReference,
      auditTrail: true
    });
  }

  /**
   * Submit DBS application
   */
  submitApplication(dbsReferenceNumber: string, submittedBy: string): void {
    if (this.status !== DBSStatus.APPLICATION_SUBMITTED) {
      throw new Error('DBS application must be started before submission');
    }

    this.status = DBSStatus.UNDER_REVIEW;
    this.dbsReferenceNumber = dbsReferenceNumber;
    this.submissionDate = new Date();
    this.updatedBy = submittedBy;

    console.info('DBS application submitted', {
      dbsId: this.id,
      dbsReferenceNumber,
      submittedBy,
      auditTrail: true
    });
  }

  /**
   * Complete DBS verification
   */
  completeVerification(certificateNumber: string, isCleared: boolean, completedBy: string): void {
    if (this.status !== DBSStatus.UNDER_REVIEW && this.status !== DBSStatus.IN_PROGRESS) {
      throw new Error('DBS verification must be under review or in progress to complete');
    }

    this.status = isCleared ? DBSStatus.CLEARED : DBSStatus.BARRED;
    this.certificateNumber = certificateNumber;
    this.completionDate = new Date();
    this.updatedBy = completedBy;
    this.updateComplianceStatus();

    console.info('DBS verification completed', {
      dbsId: this.id,
      certificateNumber,
      isCleared,
      completedBy,
      auditTrail: true
    });
  }

  /**
   * Reject DBS verification
   */
  rejectVerification(reason: string, rejectedBy: string): void {
    if (this.status !== DBSStatus.UNDER_REVIEW && this.status !== DBSStatus.IN_PROGRESS) {
      throw new Error('DBS verification must be under review or in progress to reject');
    }

    this.status = DBSStatus.REJECTED;
    this.rejectionReason = reason;
    this.completionDate = new Date();
    this.updatedBy = rejectedBy;
    this.updateComplianceStatus();

    console.info('DBS verification rejected', {
      dbsId: this.id,
      reason,
      rejectedBy,
      auditTrail: true
    });
  }

  /**
   * Check if DBS verification is expired
   */
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  /**
   * Check if DBS verification is due for renewal
   */
  isDueForRenewal(withinDays: number = 30): boolean {
    if (!this.expiryDate) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    
    return this.expiryDate <= futureDate && this.status === DBSStatus.CLEARED;
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
    status: DBSStatus;
    isCompliant: boolean;
    isExpired: boolean;
    daysUntilExpiry: number | null;
    riskLevel: string;
    requiresRenewal: boolean;
  } {
    return {
      status: this.status,
      isCompliant: this.isCompliant,
      isExpired: this.isExpired(),
      daysUntilExpiry: this.getDaysUntilExpiry(),
      riskLevel: this.riskLevel,
      requiresRenewal: this.requiresRenewal
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
  } {
    return {
      isCompliant: this.isCompliant,
      status: this.status,
      expiryDate: this.expiryDate || null,
      lastChecked: this.lastCheckedDate || null,
      riskLevel: this.riskLevel
    };
  }
}

export default DBSVerification;
