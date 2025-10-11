import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Resident Entity for WriteCareNotes
 * @module ResidentEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Core resident entity with healthcare compliance, GDPR protection,
 * and comprehensive care management features for British Isles care homes.
 * 
 * @compliance
 * - GDPR Article 6 (Lawfulness of processing)
 * - GDPR Article 9 (Processing of special categories of personal data)
 * - NHS Digital Data Security Standards
 * - CQC Fundamental Standards
 * - Care Certificate Standards
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsEmail, IsPhoneNumber, IsPostalCode, IsDateString, IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator';

// ResidentStatus enum is defined in this file
import { Exclude, Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from './BaseEntity';
import { MedicationRecord } from './MedicationRecord';
import { CareRecord } from './CareRecord';
import { RiskAssessment } from './RiskAssessment';
import { CarePlan } from './CarePlan';
import { Room } from './Room';
import { EmergencyContact } from './EmergencyContact';
import { HealthcareEncryption } from '@/utils/encryption';
import { validateNHSNumber } from '@/utils/nhs-validation';
import { logger } from '@/utils/logger';

/**
 * Resident care level enumeration
 */
export enum CareLevel {
  RESIDENTIAL = 'residential',
  NURSING = 'nursing',
  DEMENTIA = 'dementia',
  MENTAL_HEALTH = 'mental_health',
  LEARNING_DISABILITY = 'learning_disability',
  PHYSICAL_DISABILITY = 'physical_disability',
  PALLIATIVE = 'palliative',
  RESPITE = 'respite'
}

/**
 * Resident status enumeration
 */
export enum ResidentStatus {
  ACTIVE = 'active',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred',
  TEMPORARY_ABSENCE = 'temporary_absence'
}

/**
 * Gender enumeration
 */
export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

/**
 * Marital status enumeration
 */
export enum MaritalStatus {
  SINGLE = 'single',
  MARRIED = 'married',
  DIVORCED = 'divorced',
  WIDOWED = 'widowed',
  SEPARATED = 'separated',
  CIVIL_PARTNERSHIP = 'civil_partnership'
}

/**
 * Resident entity with comprehensive healthcare management
 * Implements GDPR compliance with field-level encryption for PII
 */
@Entity('wcn_residents')
@Index(['nhsNumber'], { unique: true })
@Index(['status', 'careLevel'])
@Index(['admissionDate'])
@Index(['room'])
export class Resident extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Personal Information (Encrypted for GDPR compliance)
  @Column({ type: 'text' })
  @Exclude({ toPlainOnly: true }) // Exclude from API responses
  @Transform(({ value }) => HealthcareEncryption.decrypt(value), { toClassOnly: true })
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @Column({ type: 'text' })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => HealthcareEncryption.decrypt(value), { toClassOnly: true })
  @IsString()
  @Length(1, 100)
  lastName!: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  middleName?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  preferredName?: string;

  // NHS Number (Encrypted and validated)
  @Column({ type: 'text', unique: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => HealthcareEncryption.decrypt(value), { toClassOnly: true })
  @Matches(/^\d{10}$/, { message: 'NHS number must be 10 digits' })
  nhsNumber!: string;

  // Date of Birth (Encrypted)
  @Column({ type: 'text' })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => new Date(HealthcareEncryption.decrypt(value)), { toClassOnly: true })
  @IsDateString()
  dateOfBirth!: Date;

  // Gender
  @Column({ type: 'enum', enum: Gender })
  @IsEnum(Gender)
  gender!: Gender;

  // Marital Status
  @Column({ type: 'enum', enum: MaritalStatus, nullable: true })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  // Contact Information (Encrypted)
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsPhoneNumber('GB')
  phoneNumber?: string;

  // Address Information (Encrypted)
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  city?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  county?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsPostalCode('GB')
  postcode?: string;

  // Care Information
  @Column({ type: 'enum', enum: CareLevel })
  @IsEnum(CareLevel)
  careLevel!: CareLevel;

  @Column({ type: 'enum', enum: ResidentStatus, default: ResidentStatus.ACTIVE })
  @IsEnum(ResidentStatus)
  status!: ResidentStatus;

  @Column({ type: 'date' })
  @IsDateString()
  admissionDate!: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDateString()
  dischargeDate?: Date;

  // Medical Information (Encrypted)
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? JSON.parse(HealthcareEncryption.decrypt(value)) : null, { toClassOnly: true })
  @IsOptional()
  allergies?: string[];

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? JSON.parse(HealthcareEncryption.decrypt(value)) : null, { toClassOnly: true })
  @IsOptional()
  medicalConditions?: string[];

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  gpName?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  gpPractice?: string;

  // Financial Information
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  weeklyFee?: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  fundingSource?: string;

  // GDPR and Consent
  @Column({ type: 'boolean', default: false })
  gdprConsentGiven!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  gdprConsentDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  gdprLawfulBasis?: string;

  // Relationships
  @ManyToOne(() => Room, room => room.residents, { nullable: true })
  @JoinColumn({ name: 'room_id' })
  room?: Room;

  @OneToMany(() => MedicationRecord, medication => medication.resident)
  medications!: MedicationRecord[];

  @OneToMany(() => CareRecord, careRecord => careRecord.resident)
  careRecords!: CareRecord[];

  @OneToMany(() => RiskAssessment, riskAssessment => riskAssessment.resident)
  riskAssessments!: RiskAssessment[];

  @OneToMany(() => CarePlan, carePlan => carePlan.resident)
  carePlans!: CarePlan[];

  @OneToMany(() => EmergencyContact, contact => contact.resident)
  emergencyContacts!: EmergencyContact[];

  // Audit fields
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  /**
   * Encrypt PII data before inserting
   */
  @BeforeInsert()
  async encryptPIIBeforeInsert(): Promise<void> {
    await this.encryptPersonalData();
    this.validateHealthcareData();
    
    // Generate ID if not provided
    if (!this.id) {
      this.id = uuidv4();
    }
    
    // Log resident admission for audit
    console.info('New resident admission', {
      residentId: this.id,
      careLevel: this.careLevel,
      admissionDate: this.admissionDate,
      gdprConsent: this.gdprConsentGiven,
      auditTrail: true
    });
  }

  /**
   * Encrypt PII data before updating
   */
  @BeforeUpdate()
  async encryptPIIBeforeUpdate(): Promise<void> {
    await this.encryptPersonalData();
    this.validateHealthcareData();
    
    // Log resident update for audit
    console.info('Resident information updated', {
      residentId: this.id,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Encrypt all personal data fields
   */
  private async encryptPersonalData(): Promise<void> {
    // Encrypt name fields
    this.firstName = await HealthcareEncryption.encrypt(this.firstName);
    this.lastName = await HealthcareEncryption.encrypt(this.lastName);
    
    if (this.middleName) {
      this.middleName = await HealthcareEncryption.encrypt(this.middleName);
    }
    
    if (this.preferredName) {
      this.preferredName = await HealthcareEncryption.encrypt(this.preferredName);
    }

    // Encrypt NHS number
    this.nhsNumber = await HealthcareEncryption.encrypt(this.nhsNumber);

    // Encrypt date of birth
    this.dateOfBirth = await HealthcareEncryption.encrypt(this.dateOfBirth.toISOString()) as any;

    // Encrypt contact information
    if (this.email) {
      this.email = await HealthcareEncryption.encrypt(this.email);
    }
    
    if (this.phoneNumber) {
      this.phoneNumber = await HealthcareEncryption.encrypt(this.phoneNumber);
    }

    // Encrypt address
    if (this.addressLine1) {
      this.addressLine1 = await HealthcareEncryption.encrypt(this.addressLine1);
    }
    
    if (this.addressLine2) {
      this.addressLine2 = await HealthcareEncryption.encrypt(this.addressLine2);
    }
    
    if (this.city) {
      this.city = await HealthcareEncryption.encrypt(this.city);
    }
    
    if (this.county) {
      this.county = await HealthcareEncryption.encrypt(this.county);
    }
    
    if (this.postcode) {
      this.postcode = await HealthcareEncryption.encrypt(this.postcode);
    }

    // Encrypt medical information
    if (this.allergies) {
      this.allergies = await HealthcareEncryption.encrypt(JSON.stringify(this.allergies)) as any;
    }
    
    if (this.medicalConditions) {
      this.medicalConditions = await HealthcareEncryption.encrypt(JSON.stringify(this.medicalConditions)) as any;
    }
    
    if (this.gpName) {
      this.gpName = await HealthcareEncryption.encrypt(this.gpName);
    }
    
    if (this.gpPractice) {
      this.gpPractice = await HealthcareEncryption.encrypt(this.gpPractice);
    }
  }

  /**
   * Validate healthcare-specific data
   */
  private validateHealthcareData(): void {
    // Validate NHS number
    if (!validateNHSNumber(this.nhsNumber)) {
      throw new Error('Invalid NHS number format');
    }

    // Validate admission date
    if (this.admissionDate > new Date()) {
      throw new Error('Admission date cannot be in the future');
    }

    // Validate discharge date
    if (this.dischargeDate && this.dischargeDate < this.admissionDate) {
      throw new Error('Discharge date cannot be before admission date');
    }

    // Validate GDPR consent for data processing
    if (!this.gdprConsentGiven) {
      throw new Error('GDPR consent is required for resident data processing');
    }
  }

  /**
   * Get resident's full name (decrypted)
   */
  getFullName(): string {
    const middle = this.middleName ? ` ${this.middleName}` : '';
    return `${this.firstName}${middle} ${this.lastName}`;
  }

  /**
   * Get resident's display name (preferred or full name)
   */
  getDisplayName(): string {
    return this.preferredName || this.getFullName();
  }

  /**
   * Calculate resident's age
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
   * Check if resident is currently admitted
   */
  isCurrentlyAdmitted(): boolean {
    return this.status === ResidentStatus.ACTIVE && !this.dischargeDate;
  }

  /**
   * Get length of stay in days
   */
  getLengthOfStay(): number {
    const endDate = this.dischargeDate || new Date();
    const startDate = new Date(this.admissionDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Get full address as string
   */
  getFullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.county,
      this.postcode
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Check if resident has specific allergy
   */
  hasAllergy(allergen: string): boolean {
    if (!this.allergies || this.allergies.length === 0) {
      return false;
    }
    
    return this.allergies.some(allergy => 
      allergy.toLowerCase().includes(allergen.toLowerCase())
    );
  }

  /**
   * Check if resident has specific medical condition
   */
  hasMedicalCondition(condition: string): boolean {
    if (!this.medicalConditions || this.medicalConditions.length === 0) {
      return false;
    }
    
    return this.medicalConditions.some(medCondition => 
      medCondition.toLowerCase().includes(condition.toLowerCase())
    );
  }

  /**
   * Get resident summary for display
   */
  getSummary(): {
    id: string;
    name: string;
    age: number;
    careLevel: CareLevel;
    status: ResidentStatus;
    admissionDate: Date;
    lengthOfStay: number;
  } {
    return {
      id: this.id,
      name: this.getDisplayName(),
      age: this.getAge(),
      careLevel: this.careLevel,
      status: this.status,
      admissionDate: this.admissionDate,
      lengthOfStay: this.getLengthOfStay()
    };
  }

  /**
   * Validate GDPR consent requirements
   */
  validateGDPRConsent(): boolean {
    return this.gdprConsentGiven && this.gdprConsentDate !== null;
  }

  /**
   * Update GDPR consent
   */
  updateGDPRConsent(consentGiven: boolean, lawfulBasis?: string): void {
    this.gdprConsentGiven = consentGiven;
    this.gdprConsentDate = consentGiven ? new Date() : null;
    
    if (lawfulBasis) {
      this.gdprLawfulBasis = lawfulBasis;
    }
  }

  /**
   * Discharge resident
   */
  discharge(dischargeDate: Date = new Date(), updatedBy?: string): void {
    this.status = ResidentStatus.DISCHARGED;
    this.dischargeDate = dischargeDate;
    this.updatedBy = updatedBy;
    
    // Log discharge for audit
    console.info('Resident discharged', {
      residentId: this.id,
      dischargeDate,
      lengthOfStay: this.getLengthOfStay(),
      updatedBy,
      auditTrail: true
    });
  }

  /**
   * Transfer resident to another facility
   */
  transfer(transferDate: Date = new Date(), updatedBy?: string): void {
    this.status = ResidentStatus.TRANSFERRED;
    this.dischargeDate = transferDate;
    this.updatedBy = updatedBy;
    
    // Log transfer for audit
    console.info('Resident transferred', {
      residentId: this.id,
      transferDate,
      lengthOfStay: this.getLengthOfStay(),
      updatedBy,
      auditTrail: true
    });
  }

  /**
   * Mark resident as deceased
   */
  markDeceased(deceasedDate: Date = new Date(), updatedBy?: string): void {
    this.status = ResidentStatus.DECEASED;
    this.dischargeDate = deceasedDate;
    this.updatedBy = updatedBy;
    
    // Log for audit with appropriate sensitivity
    console.info('Resident status updated to deceased', {
      residentId: this.id,
      deceasedDate,
      lengthOfStay: this.getLengthOfStay(),
      updatedBy,
      auditTrail: true,
      sensitiveEvent: true
    });
  }

  /**
   * Set temporary absence
   */
  setTemporaryAbsence(updatedBy?: string): void {
    this.status = ResidentStatus.TEMPORARY_ABSENCE;
    this.updatedBy = updatedBy;
    
    // Log temporary absence
    console.info('Resident temporary absence recorded', {
      residentId: this.id,
      updatedBy,
      auditTrail: true
    });
  }

  /**
   * Return from temporary absence
   */
  returnFromAbsence(updatedBy?: string): void {
    this.status = ResidentStatus.ACTIVE;
    this.updatedBy = updatedBy;
    
    // Log return from absence
    console.info('Resident returned from temporary absence', {
      residentId: this.id,
      updatedBy,
      auditTrail: true
    });
  }
}

export default Resident;
