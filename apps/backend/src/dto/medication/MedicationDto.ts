/**
 * @fileoverview Medication Data Transfer Objects for WriteCareNotes
 * @module MedicationDto
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description DTOs for medication API operations with validation
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - Controlled Drugs Regulations 2001
 * - NICE Guidelines for Medication Management
 */

import { 
  IsString, 
  IsUUID, 
  IsEnum, 
  IsDateString, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsBoolean,
  IsNumber,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  Min,
  Max,
  IsPositive
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums for medication management
export enum MedicationTypeDto {
  ANALGESIC = 'analgesic',
  ANTIBIOTIC = 'antibiotic',
  CARDIAC = 'cardiac',
  DIABETES = 'diabetes',
  PSYCHIATRIC = 'psychiatric',
  OPIOID = 'opioid',
  ANTICOAGULANT = 'anticoagulant',
  ANTIHYPERTENSIVE = 'antihypertensive',
  ANTICONVULSANT = 'anticonvulsant',
  BRONCHODILATOR = 'bronchodilator',
  DIURETIC = 'diuretic',
  HORMONE = 'hormone',
  IMMUNOSUPPRESSANT = 'immunosuppressant',
  VITAMIN = 'vitamin',
  OTHER = 'other'
}

export enum MedicationFormDto {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  LIQUID = 'liquid',
  INJECTION = 'injection',
  TOPICAL = 'topical',
  INHALER = 'inhaler',
  PATCH = 'patch',
  SUPPOSITORY = 'suppository',
  DROPS = 'drops',
  SPRAY = 'spray'
}

export enum MedicationRouteDto {
  ORAL = 'oral',
  TOPICAL = 'topical',
  INJECTION = 'injection',
  INHALATION = 'inhalation',
  RECTAL = 'rectal',
  SUBLINGUAL = 'sublingual',
  TRANSDERMAL = 'transdermal',
  OPHTHALMIC = 'ophthalmic',
  OTIC = 'otic',
  NASAL = 'nasal'
}

export enum ControlledSubstanceScheduleDto {
  SCHEDULE_I = 'schedule_i',
  SCHEDULE_II = 'schedule_ii',
  SCHEDULE_III = 'schedule_iii',
  SCHEDULE_IV = 'schedule_iv',
  SCHEDULE_V = 'schedule_v'
}

export enum PrescriptionStatusDto {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended'
}

export enum AdministrationStatusDto {
  SCHEDULED = 'scheduled',
  ADMINISTERED = 'administered',
  MISSED = 'missed',
  REFUSED = 'refused',
  HELD = 'held',
  CANCELLED = 'cancelled'
}

// Create Medication DTO
export class CreateMedicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  genericName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  brandName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  strength: string;

  @IsEnum(MedicationFormDto)
  form: MedicationFormDto;

  @IsEnum(MedicationRouteDto)
  route: MedicationRouteDto;

  @IsEnum(MedicationTypeDto)
  type: MedicationTypeDto;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  activeIngredient: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ndcCode?: string;

  @IsBoolean()
  isControlledSubstance: boolean;

  @IsOptional()
  @IsEnum(ControlledSubstanceScheduleDto)
  controlledSubstanceSchedule?: ControlledSubstanceScheduleDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  sideEffects?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  contraindications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  interactions?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  storageRequirements?: string;
}

// Create Prescription DTO
export class CreatePrescriptionDto {
  @IsUUID()
  residentId: string;

  @IsUUID()
  medicationId: string;

  @IsUUID()
  prescriberId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  prescriberName: string;

  @IsNumber()
  @IsPositive()
  @Max(10000)
  dosage: number;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  dosageUnit: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  frequency: string;

  @IsEnum(MedicationRouteDto)
  route: MedicationRouteDto;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  quantityPrescribed?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(12)
  refillsRemaining?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  indication?: string;
}

// Update Prescription DTO
export class UpdatePrescriptionDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(10000)
  dosage?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  dosageUnit?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  frequency?: string;

  @IsOptional()
  @IsEnum(MedicationRouteDto)
  route?: MedicationRouteDto;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(12)
  refillsRemaining?: number;

  @IsOptional()
  @IsEnum(PrescriptionStatusDto)
  status?: PrescriptionStatusDto;
}

// Medication Administration DTO
export class MedicationAdministrationDto {
  @IsUUID()
  prescriptionId: string;

  @IsUUID()
  residentId: string;

  @IsDateString()
  scheduledTime: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Max(10000)
  dosageGiven?: number;

  @IsOptional()
  @IsUUID()
  witnessId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  administrationMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  siteOfAdministration?: string;
}

// Medication Search DTO
export class MedicationSearchDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsEnum(MedicationTypeDto)
  type?: MedicationTypeDto;

  @IsOptional()
  @IsEnum(MedicationFormDto)
  form?: MedicationFormDto;

  @IsOptional()
  @IsEnum(MedicationRouteDto)
  route?: MedicationRouteDto;

  @IsOptional()
  @IsBoolean()
  isControlledSubstance?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  manufacturer?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc';
}

// Prescription Search DTO
export class PrescriptionSearchDto {
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @IsOptional()
  @IsUUID()
  medicationId?: string;

  @IsOptional()
  @IsEnum(PrescriptionStatusDto)
  status?: PrescriptionStatusDto;

  @IsOptional()
  @IsUUID()
  prescriberId?: string;

  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @IsOptional()
  @IsBoolean()
  includeInactive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Medication Administration Search DTO
export class MedicationAdministrationSearchDto {
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @IsOptional()
  @IsUUID()
  prescriptionId?: string;

  @IsOptional()
  @IsEnum(AdministrationStatusDto)
  status?: AdministrationStatusDto;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsUUID()
  administeredBy?: string;

  @IsOptional()
  @IsBoolean()
  isControlledSubstance?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Medication Reconciliation DTO
export class MedicationReconciliationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdmissionMedicationDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  admissionMedications: AdmissionMedicationDto[];
}

export class AdmissionMedicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsNumber()
  @IsPositive()
  @Max(10000)
  dosage: number;

  @IsString()
  @MinLength(1)
  @MaxLength(20)
  dosageUnit: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  frequency: string;

  @IsOptional()
  @IsEnum(MedicationRouteDto)
  route?: MedicationRouteDto;

  @IsOptional()
  @IsBoolean()
  isControlledSubstance?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  indication?: string;
}

// Response DTOs
export class MedicationResponseDto {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength: string;
  form: MedicationFormDto;
  route: MedicationRouteDto;
  type: MedicationTypeDto;
  activeIngredient: string;
  manufacturer?: string;
  ndcCode?: string;
  isControlledSubstance: boolean;
  controlledSubstanceSchedule?: ControlledSubstanceScheduleDto;
  sideEffects?: string[];
  contraindications?: string[];
  interactions?: string[];
  storageRequirements?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class PrescriptionResponseDto {
  id: string;
  residentId: string;
  medicationId: string;
  medicationName?: string;
  prescriberId: string;
  prescriberName: string;
  dosage: number;
  dosageUnit: string;
  frequency: string;
  route: MedicationRouteDto;
  startDate: string;
  endDate?: string;
  instructions?: string;
  quantityPrescribed?: number;
  refillsRemaining?: number;
  indication?: string;
  status: PrescriptionStatusDto;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export class MedicationAdministrationResponseDto {
  id: string;
  prescriptionId: string;
  residentId: string;
  medicationId: string;
  medicationName?: string;
  scheduledTime: string;
  administeredTime?: string;
  dosageGiven?: number;
  administeredBy: string;
  witnessId?: string;
  notes?: string;
  administrationMethod?: string;
  siteOfAdministration?: string;
  status: AdministrationStatusDto;
  createdAt: string;
  updatedAt: string;
}

export class DrugInteractionResponseDto {
  hasInteractions: boolean;
  severity: 'minor' | 'moderate' | 'severe';
  interactionCount: number;
  interactions: DrugInteractionDetailDto[];
  recommendations: string[];
}

export class DrugInteractionDetailDto {
  medication1: string;
  medication2: string;
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  clinicalEffect: string;
  management: string;
}

export class MedicationReconciliationResponseDto {
  discrepancyCount: number;
  requiresPharmacistReview: boolean;
  discrepancies: MedicationDiscrepancyDto[];
  recommendations: string[];
}

export class MedicationDiscrepancyDto {
  type: 'missing' | 'extra' | 'dosage_change' | 'frequency_change' | 'route_change';
  medication: string;
  currentValue?: string;
  expectedValue?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export class ControlledSubstanceReportResponseDto {
  reportPeriod: {
    from: string;
    to: string;
  };
  summary: {
    totalAdministrations: number;
    totalInventoryMovements: number;
    medicationsInvolved: number;
  };
  administrations: ControlledSubstanceAdministrationDto[];
  inventoryMovements: ControlledSubstanceInventoryMovementDto[];
  generatedAt: string;
  generatedBy: string;
}

export class ControlledSubstanceAdministrationDto {
  id: string;
  residentId: string;
  medicationName: string;
  dosageGiven: number;
  administeredTime: string;
  administeredBy: string;
  witnessId?: string;
  schedule: ControlledSubstanceScheduleDto;
}

export class ControlledSubstanceInventoryMovementDto {
  id: string;
  medicationId: string;
  movementType: string;
  quantity: number;
  balanceAfter: number;
  performedBy: string;
  witnessId?: string;
  timestamp: string;
}
