import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Prescription Entity for WriteCareNotes Healthcare Management
 * @module PrescriptionEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Complete prescription data model with prescriber validation,
 * medication relationships, and comprehensive healthcare compliance.
 * 
 * @compliance
 * - MHRA Prescription Requirements
 * - GMC Prescribing Guidelines
 * - CQC Medication Management Standards
 * - GDPR Data Protection Regulation
 * 
 * @security
 * - Field-level encryption for sensitive data
 * - Audit trail for all changes
 * - Role-based access control
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, Length, Min, Max, IsUUID } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { Medication, AdministrationRoute } from './Medication';
import { Resident } from '../resident/Resident';

/**
 * Prescription status tracking
 */
export enum PrescriptionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

/**
 * Prescription types
 */
export enum PrescriptionType {
  REGULAR = 'regular',
  PRN = 'prn', // Pro re nata (as required)
  STAT = 'stat', // Single dose immediately
  variable = 'variable', // variable dosing
  TITRATION = 'titration' // Dose adjustment schedule
}

/**
 * Frequency patterns for medication administration
 */
export enum FrequencyPattern {
  ONCE_DAILY = 'once_daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  EVERY_4_HOURS = 'every_4_hours',
  EVERY_6_HOURS = 'every_6_hours',
  EVERY_8_HOURS = 'every_8_hours',
  EVERY_12_HOURS = 'every_12_hours',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  AS_REQUIRED = 'as_required',
  CUSTOM = 'custom'
}

/**
 * Dosage information
 */
export interface Dosage {
  amount: number;
  unit: string;
  frequency: FrequencyPattern;
  customFrequency?: string;
  timingInstructions?: string[];
  withFood?: boolean;
  specialInstructions?: string;
}

/**
 * Prescriber information
 */
export interface PrescriberInfo {
  id: string;
  name: string;
  gmcNumber?: string;
  profession: 'doctor' | 'nurse_prescriber' | 'pharmacist_prescriber' | 'dentist' | 'other';
  qualifications: string[];
  contactNumber?: string;
  organization?: string;
}

/**
 * Review schedule information
 */
export interface ReviewSchedule {
  nextReviewDate: Date;
  reviewFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';
  customFrequencyDays?: number;
  reviewReason: string;
  automaticReview: boolean;
}

/**
 * Prescription entity with comprehensive medication prescribing information
 */
@Entity('prescriptions')
@Index(['residentId', 'status'])
@Index(['medicationId', 'status'])
@Index(['prescriberId'])
@Index(['startDate', 'endDate'])
@Index(['reviewDate'])
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Relationships
  @Column({ name: 'resident_id', type: 'uuid' })
  @IsUUID()
  residentId!: string;

  @ManyToOne(() => Resident, { eager: false })
  @JoinColumn({ name: 'resident_id' })
  resident?: Resident;

  @Column({ name: 'medication_id', type: 'uuid' })
  @IsUUID()
  medicationId!: string;

  @ManyToOne(() => Medication, { eager: true })
  @JoinColumn({ name: 'medication_id' })
  medication?: Medication;

  // Prescriber Information
  @Column({ name: 'prescriber_info', type: 'jsonb' })
  prescriberInfo!: PrescriberInfo;

  // Prescription Details
  @Column({ name: 'prescription_type', type: 'enum', enum: PrescriptionType, default: PrescriptionType.REGULAR })
  @IsEnum(PrescriptionType)
  prescriptionType!: PrescriptionType;

  @Column({ name: 'status', type: 'enum', enum: PrescriptionStatus, default: PrescriptionStatus.ACTIVE })
  @IsEnum(PrescriptionStatus)
  status!: PrescriptionStatus;

  // Dosage and Administration
  @Column({ name: 'dosage', type: 'jsonb' })
  dosage!: Dosage;

  @Column({ name: 'route', type: 'enum', enum: AdministrationRoute })
  @IsEnum(AdministrationRoute)
  route!: AdministrationRoute;

  @Column({ name: 'indication', length: 500 })
  @IsString()
  @Length(1, 500)
  indication!: string;

  @Column({ name: 'clinical_notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  // Timing and Duration
  @Column({ name: 'start_date', type: 'date' })
  @IsDateString()
  startDate!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @Column({ name: 'duration_days', type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationDays?: number;

  // Review Information
  @Column({ name: 'review_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  reviewDate?: Date;

  @Column({ name: 'review_schedule', type: 'jsonb', nullable: true })
  @IsOptional()
  reviewSchedule?: ReviewSchedule;

  @Column({ name: 'last_reviewed_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  lastReviewedDate?: Date;

  @Column({ name: 'last_reviewed_by', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  lastReviewedBy?: string;

  // Safety and Monitoring
  @Column({ name: 'max_dose_per_day', type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  maxDosePerDay?: number;

  @Column({ name: 'min_interval_hours', type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minIntervalHours?: number;

  @Column({ name: 'requires_monitoring', type: 'boolean', default: false })
  @IsBoolean()
  requiresMonitoring!: boolean;

  @Column({ name: 'monitoring_instructions', type: 'text', array: true, nullable: true })
  @IsOptional()
  monitoringInstructions?: string[];

  // Discontinuation Information
  @Column({ name: 'discontinuation_reason', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  discontinuationReason?: string;

  @Column({ name: 'discontinued_by', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  discontinuedBy?: string;

  @Column({ name: 'discontinuation_date', type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  discontinuationDate?: Date;

  // Organization and Tenant Information
  @Column({ name: 'organization_id', type: 'uuid' })
  @IsUUID()
  organizationId!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @IsUUID()
  tenantId!: string;

  // Audit Trail
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  @Exclude()
  deletedAt?: Date;

  @Column({ name: 'created_by', type: 'uuid' })
  @IsUUID()
  createdBy!: string;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  // Computed Properties
  @Expose()
  get isActive(): boolean {
    return this.status === PrescriptionStatus.ACTIVE;
  }

  @Expose()
  get isExpired(): boolean {
    if (!this.endDate) return false;
    return new Date() > new Date(this.endDate);
  }

  @Expose()
  get daysRemaining(): number {
    if (!this.endDate) return -1;
    const today = new Date();
    const endDate = new Date(this.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  @Expose()
  get totalDuration(): number {
    if (this.durationDays) return this.durationDays;
    if (this.endDate) {
      const startDate = new Date(this.startDate);
      const endDate = new Date(this.endDate);
      const diffTime = endDate.getTime() - startDate.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return -1; // Ongoing prescription
  }

  @Expose()
  get isDueForReview(): boolean {
    if (!this.reviewDate) return false;
    return new Date() >= new Date(this.reviewDate);
  }

  @Expose()
  get prescriptionSummary(): string {
    const medication = this.medication?.fullName || 'Unknown Medication';
    const dosage = `${this.dosage.amount}${this.dosage.unit}`;
    const frequency = this.dosage.frequency.replace(/_/g, ' ');
    return `${medication} ${dosage} ${frequency}`;
  }

  /**
   * Check if prescription is valid for administration
   */
  isValidForAdministration(): boolean {
    if (!this.isActive) return false;
    if (this.isExpired) return false;
    if (!this.medication?.isActive) return false;
    return true;
  }

  /**
   * Calculate next administration time based on frequency
   */
  getNextAdministrationTime(lastAdministrationTime?: Date): Date {
    const baseTime = lastAdministrationTime || new Date();
    const nextTime = new Date(baseTime);

    switch (this.dosage.frequency) {
      case FrequencyPattern.ONCE_DAILY:
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case FrequencyPattern.TWICE_DAILY:
        nextTime.setHours(nextTime.getHours() + 12);
        break;
      case FrequencyPattern.THREE_TIMES_DAILY:
        nextTime.setHours(nextTime.getHours() + 8);
        break;
      case FrequencyPattern.FOUR_TIMES_DAILY:
        nextTime.setHours(nextTime.getHours() + 6);
        break;
      case FrequencyPattern.EVERY_4_HOURS:
        nextTime.setHours(nextTime.getHours() + 4);
        break;
      case FrequencyPattern.EVERY_6_HOURS:
        nextTime.setHours(nextTime.getHours() + 6);
        break;
      case FrequencyPattern.EVERY_8_HOURS:
        nextTime.setHours(nextTime.getHours() + 8);
        break;
      case FrequencyPattern.EVERY_12_HOURS:
        nextTime.setHours(nextTime.getHours() + 12);
        break;
      case FrequencyPattern.WEEKLY:
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case FrequencyPattern.MONTHLY:
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
      default:
        // For PRN or custom frequencies, return current time
        return new Date();
    }

    return nextTime;
  }

  /**
   * Check if administration is within safe interval
   */
  isSafeToAdminister(lastAdministrationTime?: Date): boolean {
    if (!lastAdministrationTime) return true;
    if (this.prescriptionType === PrescriptionType.PRN) {
      if (!this.minIntervalHours) return true;
      const hoursSinceLastDose = (Date.now() - lastAdministrationTime.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastDose >= this.minIntervalHours;
    }
    return true;
  }

  /**
   * Calculate total daily dose
   */
  getTotalDailyDose(): number {
    const singleDose = this.dosage.amount;
    
    switch (this.dosage.frequency) {
      case FrequencyPattern.ONCE_DAILY:
        return singleDose;
      case FrequencyPattern.TWICE_DAILY:
        return singleDose * 2;
      case FrequencyPattern.THREE_TIMES_DAILY:
        return singleDose * 3;
      case FrequencyPattern.FOUR_TIMES_DAILY:
        return singleDose * 4;
      case FrequencyPattern.EVERY_4_HOURS:
        return singleDose * 6; // 24/4 = 6 doses
      case FrequencyPattern.EVERY_6_HOURS:
        return singleDose * 4; // 24/6 = 4 doses
      case FrequencyPattern.EVERY_8_HOURS:
        return singleDose * 3; // 24/8 = 3 doses
      case FrequencyPattern.EVERY_12_HOURS:
        return singleDose * 2; // 24/12 = 2 doses
      default:
        return singleDose; // For PRN, weekly, monthly, etc.
    }
  }

  /**
   * Check if daily dose limit would be exceeded
   */
  wouldExceedDailyLimit(additionalDose: number, dosesToday: number): boolean {
    if (!this.maxDosePerDay) return false;
    const currentDailyTotal = dosesToday * this.dosage.amount;
    return (currentDailyTotal + additionalDose) > this.maxDosePerDay;
  }

  /**
   * Get next review date based on schedule
   */
  getNextReviewDate(): Date | null {
    if (!this.reviewSchedule) return null;

    const baseDate = this.lastReviewedDate || this.createdAt;
    const nextReview = new Date(baseDate);

    switch (this.reviewSchedule.reviewFrequency) {
      case 'weekly':
        nextReview.setDate(nextReview.getDate() + 7);
        break;
      case 'monthly':
        nextReview.setMonth(nextReview.getMonth() + 1);
        break;
      case 'quarterly':
        nextReview.setMonth(nextReview.getMonth() + 3);
        break;
      case 'annually':
        nextReview.setFullYear(nextReview.getFullYear() + 1);
        break;
      case 'custom':
        if (this.reviewSchedule.customFrequencyDays) {
          nextReview.setDate(nextReview.getDate() + this.reviewSchedule.customFrequencyDays);
        }
        break;
    }

    return nextReview;
  }

  /**
   * Check if prescription requires immediate attention
   */
  requiresImmediateAttention(): boolean {
    return this.isDueForReview || 
           this.isExpired || 
           (this.daysRemaining > 0 && this.daysRemaining <= 7) ||
           this.requiresMonitoring;
  }
}

export default Prescription;
