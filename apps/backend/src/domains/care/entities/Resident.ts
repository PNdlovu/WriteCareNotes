/**
 * @fileoverview Resident Entity - Core Care Management
 * @module Domains/Care/Entities/Resident
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * 
 * @description
 * Core Resident entity representing individuals receiving care.
 * Central to the care management system - referenced by all care-related features.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../../entities/organization/Organization';

export enum ResidentStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred',
}

export enum AdmissionType {
  PERMANENT = 'permanent',
  RESPITE = 'respite',
  DAY_CARE = 'day_care',
  TEMPORARY = 'temporary',
}

@Entity('residents')
@Index(['organizationId', 'status'])
@Index(['tenantId', 'admissionDate'])
export class Resident {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Personal Information
  @Column({ type: 'var char', length: 100 })
  firstName!: string;

  @Column({ type: 'var char', length: 100 })
  lastName!: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  preferredName?: string;

  @Column({ type: 'var char', length: 10, nullable: true })
  title?: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({ type: 'var char', length: 20, nullable: true })
  gender?: string;

  // Contact Information
  @Column({ type: 'var char', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  mobilePhone?: string;

  // Care Information
  @Column({ type: 'enum', enum: ResidentStatus, default: ResidentStatus.ACTIVE })
  status!: ResidentStatus;

  @Column({ type: 'enum', enum: AdmissionType })
  admissionType!: AdmissionType;

  @Column({ type: 'date' })
  admissionDate!: Date;

  @Column({ type: 'date', nullable: true })
  dischargeDate?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  roomNumber?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  bedNumber?: string;

  // Medical Information (Basic - detailed in CareRecord)
  @Column({ type: 'var char', length: 50, nullable: true })
  nhsNumber?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  gpName?: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  gpPractice?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  gpPhone?: string;

  // Emergency Contact
  @Column({ type: 'var char', length: 200, nullable: true })
  emergencyContactName?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  emergencyContactRelationship?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  emergencyContactPhone?: string;

  // Multi-tenancy
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  // Metadata
  @Column({ type: 'var char', length: 100, nullable: true })
  createdBy?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Soft delete
  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  deletedBy?: string;

  // Additional Information
  @Column({ type: 'text', nullable: true })
  medicalHistory?: string;

  @Column({ type: 'text', nullable: true })
  allergies?: string;

  @Column({ type: 'text', nullable: true })
  dietaryRequirements?: string;

  @Column({ type: 'text', nullable: true })
  specialNeeds?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    language?: string;
    religion?: string;
    culturalNeeds?: string[];
    activityPreferences?: string[];
  };

  // Business Logic Methods

  /**
   * Get resident's full name
   */
  getFullName(): string {
    return `${this.title || ''} ${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Get display name (preferred or full)
   */
  getDisplayName(): string {
    return this.preferredName || this.getFullName();
  }

  /**
   * Calculate age
   */
  getAge(): number {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if resident is currently active
   */
  isActive(): boolean {
    return this.status === ResidentStatus.ACTIVE;
  }

  /**
   * Calculate length of stay in days
   */
  getLengthOfStay(): number {
    const endDate = this.dischargeDate || new Date();
    const startDate = new Date(this.admissionDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if admission is temporary (respite or day care)
   */
  isTemporaryAdmission(): boolean {
    return [AdmissionType.RESPITE, AdmissionType.DAY_CARE, AdmissionType.TEMPORARY].includes(
      this.admissionType
    );
  }

  /**
   * Validate before save
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.firstName || this.firstName.trim() === '') {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim() === '') {
      errors.push('Last name is required');
    }

    if (!this.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const age = this.getAge();
      if (age < 18) {
        errors.push('Resident must be at least 18 years old');
      }
      if (age > 120) {
        errors.push('Invalid date of birth');
      }
    }

    if (!this.admissionDate) {
      errors.push('Admission date is required');
    }

    if (this.dischargeDate && this.dischargeDate < this.admissionDate) {
      errors.push('Discharge date cannot be before admission date');
    }

    if (!this.organizationId) {
      errors.push('Organization ID is required');
    }

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default Resident;
