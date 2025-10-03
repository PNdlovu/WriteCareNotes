/**
 * @fileoverview Care Plan Data Transfer Objects for WriteCareNotes
 * @module CarePlanDto
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description DTOs for care planning API operations with validation
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
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
  ArrayMaxSize
} from 'class-validator';
import { Type } from 'class-transformer';

// Enums for care planning
export enum CarePlanTypeDto {
  INITIAL = 'initial',
  UPDATED = 'updated',
  EMERGENCY = 'emergency',
  DISCHARGE = 'discharge',
  RESPITE = 'respite'
}

export enum CarePlanStatusDto {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  UNDER_REVIEW = 'under_review',
  SUSPENDED = 'suspended',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
  SUPERSEDED = 'superseded'
}

export enum ReviewFrequencyDto {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export enum PriorityLevelDto {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RiskLevelDto {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe'
}

export enum GoalStatusDto {
  ACTIVE = 'active',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  SUSPENDED = 'suspended',
  DISCONTINUED = 'discontinued'
}

// Care Goal DTO
export class CareGoalDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  goalType: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsDateString()
  targetDate: string;

  @IsEnum(PriorityLevelDto)
  priority: PriorityLevelDto;

  @IsEnum(GoalStatusDto)
  status: GoalStatusDto;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  interventions?: string[];
}

// Risk Assessment DTO
export class RiskAssessmentDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  riskType: string;

  @IsEnum(RiskLevelDto)
  riskLevel: RiskLevelDto;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  mitigationStrategies: string[];

  @IsDateString()
  assessmentDate: string;

  @IsDateString()
  nextAssessmentDate: string;

  @IsUUID()
  assessedBy: string;
}

// Emergency Procedure DTO
export class EmergencyProcedureDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  procedureType: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  steps: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  contactNumbers?: string[];

  @IsEnum(PriorityLevelDto)
  priority: PriorityLevelDto;
}

// Resident Preference DTO
export class ResidentPreferenceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  preference: string;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsEnum(PriorityLevelDto)
  importance: PriorityLevelDto;
}

// Create Care Plan DTO
export class CreateCarePlanDto {
  @IsUUID()
  residentId: string;

  @IsString()
  @MinLength(5)
  @MaxLength(200)
  planName: string;

  @IsEnum(CarePlanTypeDto)
  planType: CarePlanTypeDto;

  @IsEnum(ReviewFrequencyDto)
  reviewFrequency: ReviewFrequencyDto;

  @IsDateString()
  effectiveFrom: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareGoalDto)
  @ArrayMaxSize(50)
  careGoals?: CareGoalDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskAssessmentDto)
  @ArrayMaxSize(20)
  riskAssessments?: RiskAssessmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyProcedureDto)
  @ArrayMaxSize(10)
  emergencyProcedures?: EmergencyProcedureDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResidentPreferenceDto)
  @ArrayMaxSize(30)
  residentPreferences?: ResidentPreferenceDto[];
}

// Update Care Plan DTO
export class UpdateCarePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  planName?: string;

  @IsOptional()
  @IsEnum(ReviewFrequencyDto)
  reviewFrequency?: ReviewFrequencyDto;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CareGoalDto)
  @ArrayMaxSize(50)
  careGoals?: CareGoalDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiskAssessmentDto)
  @ArrayMaxSize(20)
  riskAssessments?: RiskAssessmentDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyProcedureDto)
  @ArrayMaxSize(10)
  emergencyProcedures?: EmergencyProcedureDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ResidentPreferenceDto)
  @ArrayMaxSize(30)
  residentPreferences?: ResidentPreferenceDto[];
}

// Activate Care Plan DTO
export class ActivateCarePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  approvalNotes?: string;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}

// Review Care Plan DTO
export class ReviewCarePlanDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  reviewType: string;

  @IsOptional()
  @IsDateString()
  reviewDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMaxSize(10)
  reviewers?: string[];
}

// Generate Care Plan DTO
export class GenerateCarePlanDto {
  @IsUUID()
  residentId: string;

  @IsUUID()
  templateId: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  planName?: string;

  @IsOptional()
  @IsEnum(ReviewFrequencyDto)
  reviewFrequency?: ReviewFrequencyDto;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  customizations?: string[];
}

// Care Plan Search DTO
export class CarePlanSearchDto {
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @IsOptional()
  @IsEnum(CarePlanStatusDto)
  status?: CarePlanStatusDto;

  @IsOptional()
  @IsEnum(CarePlanTypeDto)
  type?: CarePlanTypeDto;

  @IsOptional()
  @IsEnum(PriorityLevelDto)
  priority?: PriorityLevelDto;

  @IsOptional()
  @IsDateString()
  reviewDueBefore?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @IsOptional()
  @IsBoolean()
  isOverdueForReview?: boolean;

  @IsOptional()
  @IsEnum(RiskLevelDto)
  riskLevel?: RiskLevelDto;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc';

  @IsOptional()
  @IsUUID()
  careTeamMember?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

// Create Care Domain DTO
export class CreateCareDomainDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  domainName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsEnum(PriorityLevelDto)
  priority: PriorityLevelDto;

  @IsOptional()
  @IsEnum(RiskLevelDto)
  riskLevel?: RiskLevelDto;

  @IsOptional()
  @IsUUID()
  assignedTeamMember?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  tags?: string[];
}

// Care Plan Response DTO
export class CarePlanResponseDto {
  id: string;
  residentId: string;
  planName: string;
  planType: CarePlanTypeDto;
  status: CarePlanStatusDto;
  reviewFrequency: ReviewFrequencyDto;
  effectiveFrom: string;
  effectiveTo?: string;
  nextReviewDate?: string;
  version: number;
  isApproved: boolean;
  isOverdueForReview: boolean;
  careGoals?: CareGoalDto[];
  riskAssessments?: RiskAssessmentDto[];
  emergencyProcedures?: EmergencyProcedureDto[];
  residentPreferences?: ResidentPreferenceDto[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

// Care Domain Response DTO
export class CareDomainResponseDto {
  id: string;
  carePlanId: string;
  domainName: string;
  category: string;
  description?: string;
  priority: PriorityLevelDto;
  riskLevel?: RiskLevelDto;
  status: string;
  assignedTeamMember?: string;
  assessmentScore?: number;
  nextAssessmentDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}