import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Administration Record Entity for WriteCareNotes Healthcare Management
 * @module AdministrationRecordEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Complete medication administration tracking with electronic signatures,
 * witness verification, and comprehensive audit trails for regulatory compliance.
 * 
 * @compliance
 * - MHRA Administration Requirements
 * - CQC Medication Management Standards
 * - NMC Professional Standards
 * - GDPR Data Protection Regulation
 * 
 * @security
 * - Electronic signature verification
 * - Witness authentication for controlled substances
 * - Comprehensive audit logging
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsDateString, IsUUID, IsArray, Length } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';
import { Prescription } from './Prescription';
import { Medication, AdministrationRoute } from './Medication';
import { Resident } from '../resident/Resident';

/**
 * Administration status tracking
 */
export enum AdministrationStatus {
  GIVEN = 'given',
  REFUSED = 'refused',
  OMITTED = 'omitted',
  DELAYED = 'delayed',
  WITHHELD = 'withheld',
  NOT_AVAILABLE = 'not_available'
}

/**
 * Refusal reasons
 */
export enum RefusalReason {
  PATIENT_REFUSED = 'patient_refused',
  NAUSEA_VOMITING = 'nausea_vomiting',
  SWALLOWING_DIFFICULTY = 'swallowing_difficulty',
  ASLEEP = 'asleep',
  ABSENT_FROM_UNIT = 'absent_from_unit',
  CLINICAL_DECISION = 'clinical_decision',
  ALLERGIC_REACTION = 'allergic_reaction',
  OTHER = 'other'
}

/**
 * Side effect severity levels
 */
export enum SideEffectSeverity {
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  LIFE_THREATENING = 'life_threatening'
}

/**
 * Dosage information for administration
 */
export interface AdministrationDosage {
  amount: number;
  unit: string;
  concentration?: string;
  volume?: number;
  volumeUnit?: string;
}

/**
 * Electronic signature information
 */
export interface ElectronicSignature {
  userId: string;
  userName: string;
  timestamp: Date;
  ipAddress: string;
  deviceId?: string;
  signatureHash: string;
  biometricVerified?: boolean;
}

/**
 * Witness information for controlled substances
 */
export interface WitnessInfo {
  witnessId: string;
  witnessName: string;
  witnessRole: string;
  witnessSignature: ElectronicSignature;
  witnessType: 'primary' | 'secondary';
}

/**
 * Side effect observation
 */
export interface SideEffectObservation {
  effect: string;
  severity: SideEffectSeverity;
  onsetTime?: Date;
  duration?: number; // in minutes
  actionTaken: string;
  reportedToDoctor: boolean;
  additionalNotes?: string;
}

/**
 * Administration record entity with comprehensive medication administration tracking
 */
@Entity('administration_records')
@Index(['prescriptionId', 'scheduledTime'])
@Index(['residentId', 'administrationTime'])
@Index(['medicationId', 'administrationTime'])
@Index(['administeredBy', 'administrationTime'])
@Index(['status', 'administrationTime'])
export class AdministrationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relationships
  @Column({ name: 'prescription_id', type: 'uuid' })
  @IsUUID()
  prescriptionId: string;

  @ManyToOne(() => Prescription, { eager: true })
  @JoinColumn({ name: 'prescription_id' })
  prescription?: Prescription;

  @Column({ name: 'resident_id', type: 'uuid' })
  @IsUUID()
  residentId: string;

  @ManyToOne(() => Resident, { eager: false })
  @JoinColumn({ name: 'resident_id' })
  resident?: Resident;

  @Column({ name: 'medication_id', type: 'uuid' })
  @IsUUID()
  medicationId: string;

  @ManyToOne(() => Medication, { eager: true })
  @JoinColumn({ name: 'medication_id' })
  medication?: Medication;

  // Administration Details
  @Column({ name: 'scheduled_time', type: 'timestamp' })
  @IsDateString()
  scheduledTime: Date;

  @Column({ name: 'administration_time', type: 'timestamp' })
  @IsDateString()
  administrationTime: Date;

  @Column({ name: 'status', type: 'enum', enum: AdministrationStatus })
  @IsEnum(AdministrationStatus)
  status: AdministrationStatus;

  // Dosage Information
  @Column({ name: 'dosage_given', type: 'jsonb' })
  dosageGiven: AdministrationDosage;

  @Column({ name: 'route_used', type: 'enum', enum: AdministrationRoute })
  @IsEnum(AdministrationRoute)
  routeUsed: AdministrationRoute;

  // Staff Information
  @Column({ name: 'administered_by', type: 'uuid' })
  @IsUUID()
  administeredBy: string;

  @Column({ name: 'administrator_name', length: 255 })
  @IsString()
  @Length(1, 255)
  administratorName: string;

  @Column({ name: 'administrator_role', length: 100 })
  @IsString()
  @Length(1, 100)
  administratorRole: string;

  @Column({ name: 'electronic_signature', type: 'jsonb' })
  electronicSignature: ElectronicSignature;

  // Witness Information (for controlled substances)
  @Column({ name: 'witness_required', type: 'boolean', default: false })
  @IsBoolean()
  witnessRequired: boolean;

  @Column({ name: 'witness_info', type: 'jsonb', nullable: true })
  @IsOptional()
  witnessInfo?: WitnessInfo;

  @Column({ name: 'second_witness_info', type: 'jsonb', nullable: true })
  @IsOptional()
  secondWitnessInfo?: WitnessInfo;

  // Clinical Information
  @Column({ name: 'clinical_notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  clinicalNotes?: string;

  @Column({ name: 'administration_notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  administrationNotes?: string;

  // Refusal Information
  @Column({ name: 'refusal_reason', type: 'enum', enum: RefusalReason, nullable: true })
  @IsOptional()
  @IsEnum(RefusalReason)
  refusalReason?: RefusalReason;

  @Column({ name: 'refusal_notes', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  refusalNotes?: string;

  @Column({ name: 'prescriber_notified', type: 'boolean', default: false })
  @IsBoolean()
  prescriberNotified: boolean;

  @Column({ name: 'prescriber_notification_time', type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  prescriberNotificationTime?: Date;

  // Side Effects and Observations
  @Column({ name: 'side_effects_observed', type: 'jsonb', nullable: true })
  @IsOptional()
  sideEffectsObserved?: SideEffectObservation[];

  @Column({ name: 'vital_signs_before', type: 'jsonb', nullable: true })
  @IsOptional()
  vitalSignsBefore?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    painScore?: number;
  };

  @Column({ name: 'vital_signs_after', type: 'jsonb', nullable: true })
  @IsOptional()
  vitalSignsAfter?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;
    painScore?: number;
  };

  // Timing Information
  @Column({ name: 'is_late_administration', type: 'boolean', default: false })
  @IsBoolean()
  isLateAdministration: boolean;

  @Column({ name: 'late_administration_reason', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  lateAdministrationReason?: string;

  @Column({ name: 'delay_minutes', type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  delayMinutes?: number;

  // Quality Assurance
  @Column({ name: 'double_checked', type: 'boolean', default: false })
  @IsBoolean()
  doubleChecked: boolean;

  @Column({ name: 'double_checked_by', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  doubleCheckedBy?: string;

  @Column({ name: 'barcode_scanned', type: 'boolean', default: false })
  @IsBoolean()
  barcodeScanned: boolean;

  @Column({ name: 'patient_identified', type: 'boolean', default: true })
  @IsBoolean()
  patientIdentified: boolean;

  @Column({ name: 'identification_method', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  identificationMethod?: string;

  // Organization and Tenant Information
  @Column({ name: 'organization_id', type: 'uuid' })
  @IsUUID()
  organizationId: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  @IsUUID()
  tenantId: string;

  // Audit Trail
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Computed Properties
  @Expose()
  get wasGiven(): boolean {
    return this.status === AdministrationStatus.GIVEN;
  }

  @Expose()
  get wasRefused(): boolean {
    return this.status === AdministrationStatus.REFUSED;
  }

  @Expose()
  get wasDelayed(): boolean {
    return this.isLateAdministration || this.status === AdministrationStatus.DELAYED;
  }

  @Expose()
  get administrationSummary(): string {
    const medication = this.medication?.fullName || 'Unknown Medication';
    const dosage = `${this.dosageGiven.amount}${this.dosageGiven.unit}`;
    const status = this.status.replace(/_/g, ' ');
    return `${medication} ${dosage} - ${status}`;
  }

  @Expose()
  get timingVariance(): number {
    const scheduled = new Date(this.scheduledTime).getTime();
    const actual = new Date(this.administrationTime).getTime();
    return Math.round((actual - scheduled) / (1000 * 60)); // Minutes difference
  }

  @Expose()
  get hasAdverseEffects(): boolean {
    return this.sideEffectsObserved && this.sideEffectsObserved.length > 0;
  }

  @Expose()
  get hasSevereAdverseEffects(): boolean {
    return this.sideEffectsObserved?.some(
      effect => effect.severity === SideEffectSeverity.SEVERE || 
                effect.severity === SideEffectSeverity.LIFE_THREATENING
    ) || false;
  }

  @Expose()
  get isControlledSubstanceAdministration(): boolean {
    return this.witnessRequired && this.witnessInfo !== undefined;
  }

  @Expose()
  get complianceScore(): number {
    let score = 0;
    const maxScore = 10;

    // Electronic signature present
    if (this.electronicSignature) score += 2;

    // Patient identification verified
    if (this.patientIdentified) score += 1;

    // Barcode scanning used
    if (this.barcodeScanned) score += 1;

    // Double checking performed
    if (this.doubleChecked) score += 1;

    // Witness present for controlled substances
    if (!this.witnessRequired || this.witnessInfo) score += 2;

    // Administration on time (within 30 minutes)
    if (Math.abs(this.timingVariance) <= 30) score += 1;

    // Clinical notes provided when required
    if (this.clinicalNotes || this.status === AdministrationStatus.GIVEN) score += 1;

    // Side effects documented if present
    if (!this.hasAdverseEffects || this.sideEffectsObserved) score += 1;

    return Math.round((score / maxScore) * 100);
  }

  /**
   * Check if administration meets regulatory compliance standards
   */
  isRegulatoryCompliant(): boolean {
    // Must have electronic signature
    if (!this.electronicSignature) return false;

    // Must have witness for controlled substances
    if (this.witnessRequired && !this.witnessInfo) return false;

    // Must have patient identification
    if (!this.patientIdentified) return false;

    // Must document refusal reason if refused
    if (this.status === AdministrationStatus.REFUSED && !this.refusalReason) return false;

    // Must document side effects if observed
    if (this.hasAdverseEffects && !this.sideEffectsObserved) return false;

    return true;
  }

  /**
   * Calculate administration accuracy score
   */
  getAdministrationAccuracy(): number {
    let accuracy = 100;

    // Deduct for timing variance (1 point per 15 minutes late)
    if (this.timingVariance > 0) {
      accuracy -= Math.floor(this.timingVariance / 15);
    }

    // Deduct for missing compliance elements
    if (!this.doubleChecked) accuracy -= 5;
    if (!this.barcodeScanned) accuracy -= 3;
    if (this.witnessRequired && !this.witnessInfo) accuracy -= 10;

    // Deduct for adverse effects not properly documented
    if (this.hasAdverseEffects && !this.sideEffectsObserved) accuracy -= 15;

    return Math.max(0, accuracy);
  }

  /**
   * Get next monitoring time based on side effects
   */
  getNextMonitoringTime(): Date | null {
    if (!this.hasAdverseEffects) return null;

    const severeSideEffect = this.sideEffectsObserved?.find(
      effect => effect.severity === SideEffectSeverity.SEVERE || 
                effect.severity === SideEffectSeverity.LIFE_THREATENING
    );

    const nextMonitoring = new Date(this.administrationTime);

    if (severeSideEffect) {
      // Monitor every 15 minutes for severe effects
      nextMonitoring.setMinutes(nextMonitoring.getMinutes() + 15);
    } else {
      // Monitor every hour for mild/moderate effects
      nextMonitoring.setHours(nextMonitoring.getHours() + 1);
    }

    return nextMonitoring;
  }

  /**
   * Check if administration requires immediate clinical review
   */
  requiresImmediateClinicalReview(): boolean {
    return this.hasSevereAdverseEffects ||
           this.status === AdministrationStatus.WITHHELD ||
           (this.status === AdministrationStatus.REFUSED && this.refusalReason === RefusalReason.ALLERGIC_REACTION) ||
           !this.isRegulatoryCompliant();
  }

  /**
   * Generate administration report summary
   */
  generateAdministrationReport(): string {
    constlines: string[] = [];
    
    lines.push(`Medication: ${this.medication?.fullName}`);
    lines.push(`Resident: ${this.resident?.fullName}`);
    lines.push(`Scheduled: ${this.scheduledTime.toLocaleString()}`);
    lines.push(`Administered: ${this.administrationTime.toLocaleString()}`);
    lines.push(`Status: ${this.status}`);
    lines.push(`Dosage: ${this.dosageGiven.amount}${this.dosageGiven.unit}`);
    lines.push(`Route: ${this.routeUsed}`);
    lines.push(`Administrator: ${this.administratorName} (${this.administratorRole})`);
    
    if (this.witnessInfo) {
      lines.push(`Witness: ${this.witnessInfo.witnessName} (${this.witnessInfo.witnessRole})`);
    }
    
    if (this.timingVariance !== 0) {
      lines.push(`Timing Variance: ${this.timingVariance} minutes`);
    }
    
    if (this.hasAdverseEffects) {
      lines.push(`Side Effects: ${this.sideEffectsObserved?.map(e => e.effect).join(', ')}`);
    }
    
    lines.push(`Compliance Score: ${this.complianceScore}%`);
    
    return lines.join('\n');
  }
}

export default AdministrationRecord;
