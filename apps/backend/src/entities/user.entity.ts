/**
 * @fileoverview User Entity - Core user management for care home system
 * @module UserEntity
 * @version 1.0.0
 * @description Complete user entity with care home-specific fields and GDPR compliance
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, Index } from 'typeorm';
import { IsEmail, IsString, IsEnum, IsOptional, IsBoolean, IsDate, IsArray } from 'class-validator';

/**
 * User role enumeration for care home organizations
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  CARE_MANAGER = 'care_manager',
  NURSE = 'nurse',
  CARE_ASSISTANT = 'care_assistant',
  ACTIVITIES_COORDINATOR = 'activities_coordinator',
  MAINTENANCE = 'maintenance',
  KITCHEN_STAFF = 'kitchen_staff',
  FAMILY_MEMBER = 'family_member',
  VISITOR = 'visitor',
  EXTERNAL_PROFESSIONAL = 'external_professional'
}

/**
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
  PASSWORD_RESET_REQUIRED = 'password_reset_required'
}

/**
 * Professional registration body
 */
export enum ProfessionalBody {
  NMC = 'nmc', // Nursing and Midwifery Council
  HCPC = 'hcpc', // Health and Care Professions Council
  GMC = 'gmc', // General Medical Council
  GDC = 'gdc', // General Dental Council
  RCOT = 'rcot', // Royal College of Occupational Therapists
  CSP = 'csp', // Chartered Society of Physiotherapy
  SWE = 'swe', // Social Work England
  NONE = 'none'
}

@Entity('users')
@Index(['email'])
@Index(['organizationId', 'role'])
@Index(['status'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  firstName: string;

  @Column()
  @IsString()
  lastName: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  middleName?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  preferredName?: string;

  @Column({ select: false }) // Exclude from select by default for security
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CARE_ASSISTANT
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  nationalInsuranceNumber?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  employeeId?: string;

  // Professional Registration
  @Column({
    type: 'enum',
    enum: ProfessionalBody,
    default: ProfessionalBody.NONE
  })
  @IsEnum(ProfessionalBody)
  professionalBody: ProfessionalBody;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  professionalRegistrationNumber?: string;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  professionalRegistrationExpiry?: Date;

  // Employment Details
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  employmentStartDate?: Date;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  employmentEndDate?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  contractType?: string; // full-time, part-time, bank, agency

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  contractedHours?: number;

  // DBS and Background Checks
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  dbsCertificateNumber?: string;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  dbsIssueDate?: Date;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  dbsExpiryDate?: Date;

  @Column({ default: false })
  @IsBoolean()
  dbsIsEnhanced: boolean;

  @Column({ default: false })
  @IsBoolean()
  dbsIsBarred: boolean;

  // Training and Competencies
  @Column('jsonb', { nullable: true })
  mandatoryTraining?: {
    firesafety: { completed: boolean; expiryDate?: Date };
    manualHandling: { completed: boolean; expiryDate?: Date };
    safeguarding: { completed: boolean; expiryDate?: Date };
    infectionControl: { completed: boolean; expiryDate?: Date };
    dataProtection: { completed: boolean; expiryDate?: Date };
    medicationAdministration: { completed: boolean; expiryDate?: Date };
    firstAid: { completed: boolean; expiryDate?: Date };
    mentalCapacityAct: { completed: boolean; expiryDate?: Date };
  };

  @Column('jsonb', { nullable: true })
  competencies?: string[];

  @Column('jsonb', { nullable: true })
  qualifications?: Array<{
    title: string;
    institution: string;
    dateObtained: Date;
    expiryDate?: Date;
    certificateNumber?: string;
  }>;

  // Emergency Contact
  @Column('jsonb', { nullable: true })
  emergencyContact?: {
    name: string;
    relationship: string;
    phoneNumber: string;
    alternativePhoneNumber?: string;
    address?: string;
  };

  // Access Control
  @Column('jsonb', { default: [] })
  permissions: string[];

  @Column('jsonb', { default: [] })
  accessLevels: string[];

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  managerId?: string;

  // Security and Authentication
  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  lastLoginAt?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  lastLoginIp?: string;

  @Column({ default: 0 })
  failedLoginAttempts: number;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  lockedUntil?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  resetPasswordToken?: string;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  resetPasswordExpires?: Date;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  twoFactorSecret?: string;

  @Column({ default: false })
  @IsBoolean()
  twoFactorEnabled: boolean;

  // GDPR and Data Protection
  @Column({ default: false })
  @IsBoolean()
  gdprConsentGiven: boolean;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  gdprConsentDate?: Date;

  @Column({ default: false })
  @IsBoolean()
  marketingConsentGiven: boolean;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  dataRetentionDate?: Date;

  // System Metadata
  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;

  @Column({ default: true })
  @IsBoolean()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  @IsDate()
  @IsOptional()
  deletedAt?: Date;

  // Computed Properties
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  get displayName(): string {
    return this.preferredName || this.firstName;
  }

  get isManager(): boolean {
    return [
      UserRole.ORGANIZATION_ADMIN,
      UserRole.CARE_MANAGER
    ].includes(this.role);
  }

  get isClinicalStaff(): boolean {
    return [
      UserRole.NURSE,
      UserRole.CARE_ASSISTANT,
      UserRole.CARE_MANAGER
    ].includes(this.role);
  }

  get needsProfessionalRegistration(): boolean {
    return [
      UserRole.NURSE,
      UserRole.CARE_MANAGER,
      UserRole.EXTERNAL_PROFESSIONAL
    ].includes(this.role);
  }

  get isAccountLocked(): boolean {
    return this.lockedUntil && this.lockedUntil > new Date();
  }

  get dbsIsValid(): boolean {
    if (!this.dbsExpiryDate) return false;
    return this.dbsExpiryDate > new Date() && !this.dbsIsBarred;
  }

  get mandatoryTrainingComplete(): boolean {
    if (!this.mandatoryTraining) return false;
    
    const required = ['fireSpeed', 'manualHandling', 'safeguarding', 'infectionControl', 'dataProtection'];
    if (this.isClinicalStaff) {
      required.push('medicationAdministration', 'mentalCapacityAct');
    }

    return required.every(training => {
      const trainingRecord = this.mandatoryTraining[training];
      if (!trainingRecord?.completed) return false;
      if (trainingRecord.expiryDate && trainingRecord.expiryDate < new Date()) return false;
      return true;
    });
  }

  // Utility Methods
  hasPermission(permission: string): boolean {
    return this.permissions.includes(permission) || this.permissions.includes('*');
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  canAccessLevel(level: string): boolean {
    return this.accessLevels.includes(level) || this.accessLevels.includes('all');
  }
}

export default User;