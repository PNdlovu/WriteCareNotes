/**
 * @fileoverview Organization Entity - Healthcare organization management
 * @module OrganizationEntity
 * @version 1.0.0
 * @description Complete organization entity with multi-jurisdictional support
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsArray, IsEmail } from 'class-validator';

/**
 * Organization type enumeration
 */
export enum OrganizationType {
  RESIDENTIAL_CARE_HOME = 'residential_care_home',
  NURSING_HOME = 'nursing_home',
  DOMICILIARY_CARE = 'domiciliary_care',
  DAY_CARE_CENTER = 'day_care_center',
  SUPPORTED_LIVING = 'supported_living',
  HOSPICE = 'hospice',
  REHABILITATION_CENTER = 'rehabilitation_center',
  MENTAL_HEALTH_FACILITY = 'mental_health_facility'
}

/**
 * Care specialization enumeration
 */
export enum CareSpecialization {
  GENERAL_ELDERLY_CARE = 'general_elderly_care',
  DEMENTIA_CARE = 'dementia_care',
  LEARNING_DISABILITIES = 'learning_disabilities',
  PHYSICAL_DISABILITIES = 'physical_disabilities',
  MENTAL_HEALTH = 'mental_health',
  PALLIATIVE_CARE = 'palliative_care',
  RESPITE_CARE = 'respite_care',
  YOUNG_ADULTS = 'young_adults',
  AUTISM_SPECTRUM = 'autism_spectrum'
}

/**
 * Regulatory jurisdiction enumeration
 */
export enum RegulatoryJurisdiction {
  ENGLAND_CQC = 'england_cqc',
  SCOTLAND_CI = 'scotland_ci',
  WALES_CIW = 'wales_ciw',
  NORTHERN_IRELAND_RQIA = 'northern_ireland_rqia',
  JERSEY_JCC = 'jersey_jcc',
  GUERNSEY_GCC = 'guernsey_gcc',
  ISLE_OF_MAN_IMC = 'isle_of_man_imc'
}

/**
 * Organization status enumeration
 */
export enum OrganizationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_APPROVAL = 'pending_approval',
  UNDER_INVESTIGATION = 'under_investigation'
}

@Entity('organizations')
@Index(['registrationNumber'])
@Index(['status'])
@Index(['jurisdiction'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  name: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  tradingName?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  legalName?: string;

  @Column({
    type: 'enum',
    enum: OrganizationType
  })
  @IsEnum(OrganizationType)
  type: OrganizationType;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE
  })
  @IsEnum(OrganizationStatus)
  status: OrganizationStatus;

  // Regulatory Information
  @Column({
    type: 'enum',
    enum: RegulatoryJurisdiction
  })
  @IsEnum(RegulatoryJurisdiction)
  jurisdiction: RegulatoryJurisdiction;

  @Column()
  @IsString()
  registrationNumber: string; // CQC ID, Care Inspectorate ID, etc.

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  providerReference?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  locationReference?: string;

  @Column('simple-array', { nullable: true })
  @IsArray()
  @IsOptional()
  specializations?: CareSpecialization[];

  // Contact Information
  @Column()
  @IsString()
  addressLine1: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @Column()
  @IsString()
  city: string;

  @Column()
  @IsString()
  county: string;

  @Column()
  @IsString()
  postcode: string;

  @Column()
  @IsString()
  country: string;

  @Column()
  @IsString()
  phoneNumber: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  faxNumber?: string;

  @Column()
  @IsEmail()
  email: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  website?: string;

  // Capacity Information
  @Column()
  @IsNumber()
  registeredBeds: number;

  @Column({ default: 0 })
  @IsNumber()
  currentOccupancy: number;

  @Column({ nullable: true })
  @IsNumber()
  @IsOptional()
  staffCount?: number;

  // Financial Information
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  companyRegistrationNumber?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  charityNumber?: string;

  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  vatNumber?: string;

  // Key Personnel
  @Column('jsonb', { nullable: true })
  registeredManager?: {
    name: string;
    email: string;
    phoneNumber: string;
    qualifications: string[];
    registrationNumber?: string;
    startDate: Date;
  };

  @Column('jsonb', { nullable: true })
  responsibleIndividual?: {
    name: string;
    email: string;
    phoneNumber: string;
    qualifications: string[];
    registrationNumber?: string;
  };

  @Column('jsonb', { nullable: true })
  nominatedIndividual?: {
    name: string;
    email: string;
    phoneNumber: string;
    startDate: Date;
  };

  // Insurance and Legal
  @Column('jsonb', { nullable: true })
  insurance?: {
    publicLiability: {
      provider: string;
      policyNumber: string;
      expiryDate: Date;
      coverAmount: number;
    };
    employersLiability: {
      provider: string;
      policyNumber: string;
      expiryDate: Date;
      coverAmount: number;
    };
    professionalIndemnity?: {
      provider: string;
      policyNumber: string;
      expiryDate: Date;
      coverAmount: number;
    };
  };

  // Compliance and Quality
  @Column('jsonb', { nullable: true })
  lastInspection?: {
    date: Date;
    inspector: string;
    rating: string;
    reportUrl?: string;
    nextInspectionDue?: Date;
    keyFindings: string[];
    actionPoints: string[];
  };

  @Column('jsonb', { nullable: true })
  qualityMetrics?: {
    overallRating: string;
    safeRating: string;
    effectiveRating: string;
    caringRating: string;
    responsiveRating: string;
    wellLedRating: string;
    lastUpdated: Date;
  };

  @Column({ default: false })
  @IsBoolean()
  hasActiveNotices: boolean;

  @Column('jsonb', { nullable: true })
  activeNotices?: Array<{
    type: string;
    issuedDate: Date;
    description: string;
    status: string;
    responseRequired: boolean;
    responseDate?: Date;
  }>;

  // Facilities and Services
  @Column('jsonb', { nullable: true })
  facilities?: {
    hasLift: boolean;
    hasGarden: boolean;
    hasActivityRoom: boolean;
    hasDiningRoom: boolean;
    hasQuietLounge: boolean;
    hasClinicRoom: boolean;
    hasSuiteBathrooms: boolean;
    hasSharedBathrooms: boolean;
    wheelchairAccessible: boolean;
    parkingSpaces: number;
    additionalFacilities: string[];
  };

  @Column('jsonb', { nullable: true })
  services?: {
    nursingCare: boolean;
    personalCare: boolean;
    dementiareCare: boolean;
    palliativeCare: boolean;
    respiteCare: boolean;
    daycare: boolean;
    meals: boolean;
    laundry: boolean;
    housekeeping: boolean;
    medicationManagement: boolean;
    physiotherapy: boolean;
    occupationalTherapy: boolean;
    socialActivities: boolean;
    transportServices: boolean;
    additionalServices: string[];
  };

  // Technology and Systems
  @Column('jsonb', { nullable: true })
  technologyConfiguration?: {
    hasWifi: boolean;
    hasCallSystem: boolean;
    hasElectronicRecords: boolean;
    hasTelecareSystem: boolean;
    hasSecuritySystem: boolean;
    softwareSystems: string[];
    integratedSystems: string[];
  };

  // Emergency Procedures
  @Column('jsonb', { nullable: true })
  emergencyProcedures?: {
    fireEvacuationPlan: boolean;
    emergencyContactList: Array<{
      name: string;
      role: string;
      phoneNumber: string;
      availability: string;
    }>;
    localEmergencyServices: {
      police: string;
      fire: string;
      ambulance: string;
      gp: string;
      hospital: string;
    };
    businessContinuityPlan: boolean;
  };

  // Subscription and Billing
  @Column('jsonb', { nullable: true })
  subscription?: {
    plan: string;
    status: string;
    startDate: Date;
    renewalDate: Date;
    billingContact: string;
    billingEmail: string;
    features: string[];
  };

  // System Configuration
  @Column('jsonb', { nullable: true })
  systemConfiguration?: {
    timezone: string;
    dateFormat: string;
    currency: string;
    language: string;
    features: string[];
    integrations: string[];
  };

  // Metadata and Custom Fields
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
  deletedAt?: Date;

  // Computed Properties
  get occupancyRate(): number {
    return this.registeredBeds > 0 ? (this.currentOccupancy / this.registeredBeds) * 100 : 0;
  }

  get availableBeds(): number {
    return Math.max(0, this.registeredBeds - this.currentOccupancy);
  }

  get fullAddress(): string {
    const addressParts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.county,
      this.postcode
    ].filter(Boolean);
    return addressParts.join(', ');
  }

  get regulatoryBody(): string {
    const bodies = {
      [RegulatoryJurisdiction.ENGLAND_CQC]: 'Care Quality Commission (CQC)',
      [RegulatoryJurisdiction.SCOTLAND_CI]: 'Care Inspectorate',
      [RegulatoryJurisdiction.WALES_CIW]: 'Care Inspectorate Wales (CIW)',
      [RegulatoryJurisdiction.NORTHERN_IRELAND_RQIA]: 'Regulation and Quality Improvement Authority (RQIA)',
      [RegulatoryJurisdiction.JERSEY_JCC]: 'Jersey Care Commission',
      [RegulatoryJurisdiction.GUERNSEY_GCC]: 'Guernsey Care Commission',
      [RegulatoryJurisdiction.ISLE_OF_MAN_IMC]: 'Isle of Man Care Commission'
    };
    return bodies[this.jurisdiction];
  }

  get isInspectionOverdue(): boolean {
    if (!this.lastInspection?.nextInspectionDue) return false;
    return new Date() > this.lastInspection.nextInspectionDue;
  }

  get hasValidInsurance(): boolean {
    if (!this.insurance) return false;
    const now = new Date();
    return this.insurance.publicLiability.expiryDate > now &&
           this.insurance.employersLiability.expiryDate > now;
  }

  // Utility Methods
  canAccommodateMoreResidents(count: number = 1): boolean {
    return this.availableBeds >= count;
  }

  hasSpecialization(specialization: CareSpecialization): boolean {
    return this.specializations?.includes(specialization) || false;
  }

  hasService(service: string): boolean {
    return this.services?.[service] === true;
  }

  hasFacility(facility: string): boolean {
    return this.facilities?.[facility] === true;
  }

  getNextInspectionDate(): Date | null {
    return this.lastInspection?.nextInspectionDue || null;
  }

  getCurrentRating(): string {
    return this.qualityMetrics?.overallRating || 'Not Rated';
  }
}

export default Organization;