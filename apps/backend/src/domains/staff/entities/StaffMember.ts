/**
 * @fileoverview Staff Member Entity - HR and Care Delivery
 * @module Domains/Staff/Entities/StaffMember
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * 
 * @description
 * Core StaffMember entity representing employees providing care and services.
 * Referenced by care notes, activities, shifts, and compliance records.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Organization } from '../../../entities/organization/Organization';

export enum StaffStatus {
  ACTIVE = 'active',
  ON_LEAVE = 'on_leave',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  RETIRED = 'retired',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  AGENCY = 'agency',
}

export enum StaffRole {
  CARE_WORKER = 'care_worker',
  SENIOR_CARE_WORKER = 'senior_care_worker',
  NURSE = 'nurse',
  SENIOR_NURSE = 'senior_nurse',
  CARE_MANAGER = 'care_manager',
  ACTIVITIES_COORDINATOR = 'activities_coordinator',
  KITCHEN_STAFF = 'kitchen_staff',
  MAINTENANCE = 'maintenance',
  ADMINISTRATOR = 'administrator',
  MANAGER = 'manager',
}

@Entity('staff_members')
@Index(['organizationId', 'status'])
@Index(['tenantId', 'role'])
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
export class StaffMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Personal Information
  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  preferredName?: string;

  @Column({ type: 'date' })
  dateOfBirth!: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender?: string;

  // Contact Information
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  mobilePhone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  // Employment Information
  @Column({ type: 'enum', enum: StaffStatus, default: StaffStatus.ACTIVE })
  status!: StaffStatus;

  @Column({ type: 'enum', enum: EmploymentType })
  employmentType!: EmploymentType;

  @Column({ type: 'enum', enum: StaffRole })
  role!: StaffRole;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  employeeNumber?: string;

  @Column({ type: 'date' })
  hireDate!: Date;

  @Column({ type: 'date', nullable: true })
  terminationDate?: Date;

  // Professional Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  professionalRegistration?: string;

  @Column({ type: 'date', nullable: true })
  registrationExpiry?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  dbsNumber?: string;

  @Column({ type: 'date', nullable: true })
  dbsExpiry?: Date;

  @Column({ type: 'jsonb', nullable: true })
  qualifications?: Array<{
    name: string;
    level: string;
    institution: string;
    dateObtained: Date;
    expiryDate?: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  certifications?: Array<{
    name: string;
    issuingBody: string;
    dateIssued: Date;
    expiryDate?: Date;
  }>;

  // Multi-tenancy
  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;

  // User Account Link
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  // Metadata
  @Column({ type: 'varchar', length: 100, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Soft delete
  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  deletedBy?: string;

  // Additional Information
  @Column({ type: 'text', nullable: true })
  emergencyContactName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emergencyContactRelationship?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  emergencyContactPhone?: string;

  @Column({ type: 'jsonb', nullable: true })
  availability?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };

  // Business Logic Methods

  /**
   * Get staff member's full name
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
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
   * Check if staff member is currently active
   */
  isActive(): boolean {
    return this.status === StaffStatus.ACTIVE;
  }

  /**
   * Calculate length of service in days
   */
  getLengthOfService(): number {
    const endDate = this.terminationDate || new Date();
    const startDate = new Date(this.hireDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if DBS is valid
   */
  isDBSValid(): boolean {
    if (!this.dbsExpiry) return false;
    return new Date(this.dbsExpiry) > new Date();
  }

  /**
   * Check if professional registration is valid
   */
  isRegistrationValid(): boolean {
    if (!this.registrationExpiry) return true; // Not all roles require registration
    return new Date(this.registrationExpiry) > new Date();
  }

  /**
   * Check if can provide care (active, valid DBS, etc.)
   */
  canProvideCare(): boolean {
    return this.isActive() && this.isDBSValid();
  }

  /**
   * Get expiring certifications (within 30 days)
   */
  getExpiringCertifications(): Array<{ name: string; expiryDate: Date }> {
    if (!this.certifications) return [];
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return this.certifications
      .filter((cert) => cert.expiryDate && new Date(cert.expiryDate) <= thirtyDaysFromNow)
      .map((cert) => ({
        name: cert.name,
        expiryDate: cert.expiryDate!,
      }));
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

    if (!this.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      errors.push('Valid email is required');
    }

    if (!this.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const age = this.getAge();
      if (age < 18) {
        errors.push('Staff member must be at least 18 years old');
      }
    }

    if (!this.hireDate) {
      errors.push('Hire date is required');
    }

    if (this.terminationDate && this.terminationDate < this.hireDate) {
      errors.push('Termination date cannot be before hire date');
    }

    if (!this.organizationId) {
      errors.push('Organization ID is required');
    }

    if (!this.tenantId) {
      errors.push('Tenant ID is required');
    }

    // Role-specific validations
    if ([StaffRole.NURSE, StaffRole.SENIOR_NURSE].includes(this.role)) {
      if (!this.professionalRegistration) {
        errors.push('Professional registration is required for nursing staff');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export default StaffMember;
