import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Intervention DTOs for WriteCareNotes API
 * @module CareInterventionDto
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Data Transfer Objects for Care Intervention API endpoints with comprehensive validation
 * and healthcare compliance requirements.
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
  IsOptional,
  IsDateString,
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  Max,
  Length,
  ValidateNested,
  IsNotEmpty,
  Matches,
  ArrayMinSize,
  ArrayMaxSize,
  IsObject
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriorityLevel } from './CarePlanDto';

/**
 * Intervention Status enumeration
 */
export enum InterventionStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  UNDER_REVIEW = 'under_review'
}

/**
 * Intervention Type enumeration
 */
export enum InterventionType {
  MEDICATION = 'medication',
  THERAPY = 'therapy',
  MONITORING = 'monitoring',
  EDUCATION = 'education',
  SUPPORT = 'support',
  ASSESSMENT = 'assessment',
  PREVENTION = 'prevention',
  TREATMENT = 'treatment',
  REHABILITATION = 'rehabilitation',
  SOCIAL = 'social'
}

/**
 * Frequency Type enumeration
 */
export enum FrequencyType {
  ONCE = 'once',
  DAILY = 'daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  WEEKLY = 'weekly',
  TWICE_WEEKLY = 'twice_weekly',
  MONTHLY = 'monthly',
  AS_NEEDED = 'as_needed',
  CUSTOM = 'custom'
}

/**
 * Safety Check Status enumeration
 */
export enum SafetyCheckStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REQUIRES_REVIEW = 'requires_review',
  REJECTED = 'rejected'
}

/**
 * Create Care Intervention Request DTO
 */
export class CreateCareInterventionDto {
  @ApiProperty({
    description: 'Unique identifier of the care domain',
    example: 'domain-123',
    format: 'uuid'
  })
  @IsUUID(4, { message: 'Care domain ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Care domain ID is required' })
  careDomainId: string;

  @ApiProperty({
    description: 'Name of the care intervention',
    example: 'Daily Physiotherapy Session',
    minLength: 5,
    maxLength: 150
  })
  @IsString({ message: 'Intervention name must be a string' })
  @Length(5, 150, { message: 'Intervention name must be between 5 and 150 characters' })
  @IsNotEmpty({ message: 'Intervention name is required' })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&]+$/, { message: 'Intervention name contains invalid characters' })
  interventionName: string;

  @ApiProperty({
    description: 'Type of intervention',
    enum: InterventionType,
    example: InterventionType.THERAPY
  })
  @IsEnum(InterventionType, { message: 'Invalid intervention type' })
  interventionType: InterventionType;

  @ApiPropertyOptional({
    description: 'Detailed description of the intervention',
    example: 'Structured physiotherapy session focusing on balance and mobility improvement',
    maxLength: 1500
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 1500, { message: 'Description must not exceed 1500 characters' })
  description?: string;

  @ApiProperty({
    description: 'Priority level of the intervention',
    enum: PriorityLevel,
    example: PriorityLevel.HIGH
  })
  @IsEnum(PriorityLevel, { message: 'Invalid priority level' })
  priority: PriorityLevel;

  @ApiProperty({
    description: 'Frequency of the intervention',
    enum: FrequencyType,
    example: FrequencyType.DAILY
  })
  @IsEnum(FrequencyType, { message: 'Invalid frequency type' })
  frequency: FrequencyType;

  @ApiPropertyOptional({
    description: 'Custom frequency description (required if frequency is custom)',
    example: 'Every other day at 2 PM',
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'Custom frequency must be a string' })
  @Length(0, 200, { message: 'Custom frequency must not exceed 200 characters' })
  customFrequency?: string;

  @ApiProperty({
    description: 'Start date for the intervention',
    example: '2025-01-10T09:00:00.000Z',
    format: 'date-time'
  })
  @IsDateString({}, { message: 'Start date must be a valid date' })
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date for the intervention',
    example: '2025-03-10T17:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes (for timed interventions)',
    example: 30,
    minimum: 1,
    maximum: 480
  })
  @IsOptional()
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(480, { message: 'Duration cannot exceed 480 minutes (8 hours)' })
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Array of assigned care team member IDs',
    type: [String],
    example: ['user-123', 'user-456']
  })
  @IsOptional()
  @IsArray({ message: 'Assigned team must be an array' })
  @ArrayMaxSize(10, { message: 'Assigned team cannot exceed 10 members' })
  @IsUUID(4, { each: true, message: 'Each team member ID must be a valid UUID' })
  assignedTeam?: string[];

  @ApiPropertyOptional({
    description: 'Expected outcomes and goals',
    type: [String],
    example: [
      'Improve balance by 20%',
      'Reduce fall risk',
      'Increase mobility confidence'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Expected outcomes must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 expected outcomes' })
  @IsString({ each: true, message: 'Each outcome must be a string' })
  @Length(5, 200, { each: true, message: 'Each outcome must be between 5 and 200 characters' })
  expectedOutcomes?: string[];

  @ApiPropertyOptional({
    description: 'Special instructions or precautions',
    example: 'Ensure resident has walking aid available, monitor for dizziness',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Instructions must be a string' })
  @Length(0, 1000, { message: 'Instructions must not exceed 1000 characters' })
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Equipment or resources required',
    type: [String],
    example: ['Walking frame', 'Exercise mat', 'Balance board']
  })
  @IsOptional()
  @IsArray({ message: 'Required resources must be an array' })
  @ArrayMaxSize(15, { message: 'Cannot exceed 15 required resources' })
  @IsString({ each: true, message: 'Each resource must be a string' })
  @Length(2, 100, { each: true, message: 'Each resource must be between 2 and 100 characters' })
  requiredResources?: string[];

  @ApiPropertyOptional({
    description: 'Contraindications or conditions that prevent intervention',
    type: [String],
    example: ['Acute illness', 'Recent surgery', 'Severe pain']
  })
  @IsOptional()
  @IsArray({ message: 'Contraindications must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 contraindications' })
  @IsString({ each: true, message: 'Each contraindication must be a string' })
  @Length(3, 150, { each: true, message: 'Each contraindication must be between 3 and 150 characters' })
  contraindications?: string[];

  @ApiPropertyOptional({
    description: 'Requires safety check before implementation',
    example: true
  })
  @IsOptional()
  @IsBoolean({ message: 'Requires safety check must be a boolean' })
  requiresSafetyCheck?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Resident expressed enthusiasm for this intervention',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and filtering',
    type: [String],
    example: ['physiotherapy', 'balance', 'fall-prevention']
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Length(2, 50, { each: true, message: 'Each tag must be between 2 and 50 characters' })
  tags?: string[];
}

/**
 * Update Care Intervention Request DTO
 */
export class UpdateCareInterventionDto {
  @ApiPropertyOptional({
    description: 'Name of the care intervention',
    example: 'Enhanced Daily Physiotherapy Session',
    minLength: 5,
    maxLength: 150
  })
  @IsOptional()
  @IsString({ message: 'Intervention name must be a string' })
  @Length(5, 150, { message: 'Intervention name must be between 5 and 150 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&]+$/, { message: 'Intervention name contains invalid characters' })
  interventionName?: string;

  @ApiPropertyOptional({
    description: 'Type of intervention',
    enum: InterventionType,
    example: InterventionType.REHABILITATION
  })
  @IsOptional()
  @IsEnum(InterventionType, { message: 'Invalid intervention type' })
  interventionType?: InterventionType;

  @ApiPropertyOptional({
    description: 'Detailed description of the intervention',
    example: 'Enhanced physiotherapy session with additional balance exercises',
    maxLength: 1500
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 1500, { message: 'Description must not exceed 1500 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the intervention',
    enum: PriorityLevel,
    example: PriorityLevel.MEDIUM
  })
  @IsOptional()
  @IsEnum(PriorityLevel, { message: 'Invalid priority level' })
  priority?: PriorityLevel;

  @ApiPropertyOptional({
    description: 'Frequency of the intervention',
    enum: FrequencyType,
    example: FrequencyType.TWICE_DAILY
  })
  @IsOptional()
  @IsEnum(FrequencyType, { message: 'Invalid frequency type' })
  frequency?: FrequencyType;

  @ApiPropertyOptional({
    description: 'Custom frequency description',
    example: 'Morning and evening sessions',
    maxLength: 200
  })
  @IsOptional()
  @IsString({ message: 'Custom frequency must be a string' })
  @Length(0, 200, { message: 'Custom frequency must not exceed 200 characters' })
  customFrequency?: string;

  @ApiPropertyOptional({
    description: 'End date for the intervention',
    example: '2025-04-10T17:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid date' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 45,
    minimum: 1,
    maximum: 480
  })
  @IsOptional()
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(480, { message: 'Duration cannot exceed 480 minutes (8 hours)' })
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Array of assigned care team member IDs',
    type: [String],
    example: ['user-123', 'user-456', 'user-789']
  })
  @IsOptional()
  @IsArray({ message: 'Assigned team must be an array' })
  @ArrayMaxSize(10, { message: 'Assigned team cannot exceed 10 members' })
  @IsUUID(4, { each: true, message: 'Each team member ID must be a valid UUID' })
  assignedTeam?: string[];

  @ApiPropertyOptional({
    description: 'Expected outcomes and goals',
    type: [String],
    example: [
      'Achieve 30% improvement in balance',
      'Complete elimination of fall incidents',
      'Independent mobility within facility'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Expected outcomes must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 expected outcomes' })
  @IsString({ each: true, message: 'Each outcome must be a string' })
  @Length(5, 200, { each: true, message: 'Each outcome must be between 5 and 200 characters' })
  expectedOutcomes?: string[];

  @ApiPropertyOptional({
    description: 'Special instructions or precautions',
    example: 'Updated protocol includes new balance exercises, continue monitoring for dizziness',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Instructions must be a string' })
  @Length(0, 1000, { message: 'Instructions must not exceed 1000 characters' })
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Equipment or resources required',
    type: [String],
    example: ['Walking frame', 'Exercise mat', 'Balance board', 'Resistance bands']
  })
  @IsOptional()
  @IsArray({ message: 'Required resources must be an array' })
  @ArrayMaxSize(15, { message: 'Cannot exceed 15 required resources' })
  @IsString({ each: true, message: 'Each resource must be a string' })
  @Length(2, 100, { each: true, message: 'Each resource must be between 2 and 100 characters' })
  requiredResources?: string[];

  @ApiPropertyOptional({
    description: 'Contraindications or conditions that prevent intervention',
    type: [String],
    example: ['Acute illness', 'Recent surgery']
  })
  @IsOptional()
  @IsArray({ message: 'Contraindications must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 contraindications' })
  @IsString({ each: true, message: 'Each contraindication must be a string' })
  @Length(3, 150, { each: true, message: 'Each contraindication must be between 3 and 150 characters' })
  contraindications?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Resident showing excellent progress and increased confidence',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and filtering',
    type: [String],
    example: ['physiotherapy', 'balance', 'fall-prevention', 'enhanced']
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Length(2, 50, { each: true, message: 'Each tag must be between 2 and 50 characters' })
  tags?: string[];
}

/**
 * Safety Check Request DTO
 */
export class SafetyCheckDto {
  @ApiProperty({
    description: 'Safety assessment outcome',
    enum: SafetyCheckStatus,
    example: SafetyCheckStatus.APPROVED
  })
  @IsEnum(SafetyCheckStatus, { message: 'Invalid safety check status' })
  safetyStatus: SafetyCheckStatus;

  @ApiPropertyOptional({
    description: 'Safety assessment findings',
    example: 'Intervention is safe for resident with current health status',
    maxLength: 1500
  })
  @IsOptional()
  @IsString({ message: 'Safety findings must be a string' })
  @Length(0, 1500, { message: 'Safety findings must not exceed 1500 characters' })
  safetyFindings?: string;

  @ApiPropertyOptional({
    description: 'Safety recommendations or modifications',
    type: [String],
    example: [
      'Ensure physiotherapist supervision',
      'Monitor blood pressure before sessions',
      'Have emergency equipment available'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Safety recommendations must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 safety recommendations' })
  @IsString({ each: true, message: 'Each recommendation must be a string' })
  @Length(5, 200, { each: true, message: 'Each recommendation must be between 5 and 200 characters' })
  safetyRecommendations?: string[];

  @ApiPropertyOptional({
    description: 'Identified risks or concerns',
    type: [String],
    example: [
      'Potential for overexertion',
      'Risk of falls during exercises'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Identified risks must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 identified risks' })
  @IsString({ each: true, message: 'Each risk must be a string' })
  @Length(5, 200, { each: true, message: 'Each risk must be between 5 and 200 characters' })
  identifiedRisks?: string[];

  @ApiPropertyOptional({
    description: 'Required modifications to the intervention',
    type: [String],
    example: [
      'Reduce session duration to 20 minutes',
      'Include 5-minute rest periods'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Required modifications must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 modifications' })
  @IsString({ each: true, message: 'Each modification must be a string' })
  @Length(5, 200, { each: true, message: 'Each modification must be between 5 and 200 characters' })
  requiredModifications?: string[];

  @ApiPropertyOptional({
    description: 'Date when safety check should be reviewed again',
    example: '2025-02-10T10:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Review date must be a valid date' })
  nextReviewDate?: string;

  @ApiPropertyOptional({
    description: 'Additional safety notes',
    example: 'Safety assessment conducted with input from medical team',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Safety notes must be a string' })
  @Length(0, 1000, { message: 'Safety notes must not exceed 1000 characters' })
  safetyNotes?: string;
}

/**
 * Care Intervention Query Parameters DTO
 */
export class CareInterventionQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by care domain ID',
    example: 'domain-123',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Care domain ID must be a valid UUID' })
  careDomainId?: string;

  @ApiPropertyOptional({
    description: 'Filter by intervention status',
    enum: InterventionStatus,
    example: InterventionStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(InterventionStatus, { message: 'Invalid status filter' })
  status?: InterventionStatus;

  @ApiPropertyOptional({
    description: 'Filter by intervention type',
    enum: InterventionType,
    example: InterventionType.THERAPY
  })
  @IsOptional()
  @IsEnum(InterventionType, { message: 'Invalid type filter' })
  type?: InterventionType;

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    enum: PriorityLevel,
    example: PriorityLevel.HIGH
  })
  @IsOptional()
  @IsEnum(PriorityLevel, { message: 'Invalid priority filter' })
  priority?: PriorityLevel;

  @ApiPropertyOptional({
    description: 'Filter by assigned team member ID',
    example: 'user-123',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Team member ID must be a valid UUID' })
  assignedTeamMember?: string;

  @ApiPropertyOptional({
    description: 'Filter by frequency type',
    enum: FrequencyType,
    example: FrequencyType.DAILY
  })
  @IsOptional()
  @IsEnum(FrequencyType, { message: 'Invalid frequency filter' })
  frequency?: FrequencyType;

  @ApiPropertyOptional({
    description: 'Search term for filtering interventions',
    example: 'physiotherapy'
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Length(2, 100, { message: 'Search term must be between 2 and 100 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field for ordering results',
    enum: ['interventionName', 'priority', 'startDate', 'frequency', 'status'],
    example: 'priority'
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @IsOptional()
  @IsString({ message: 'Sort direction must be a string' })
  sortDirection?: 'asc' | 'desc';
}

/**
 * Care Intervention Response DTO
 */
export class CareInterventionResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the care intervention',
    example: 'intervention-123',
    format: 'uuid'
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier of the care domain',
    example: 'domain-123',
    format: 'uuid'
  })
  careDomainId: string;

  @ApiProperty({
    description: 'Name of the care intervention',
    example: 'Daily Physiotherapy Session'
  })
  interventionName: string;

  @ApiProperty({
    description: 'Type of intervention',
    enum: InterventionType,
    example: InterventionType.THERAPY
  })
  interventionType: InterventionType;

  @ApiProperty({
    description: 'Current status of the intervention',
    enum: InterventionStatus,
    example: InterventionStatus.ACTIVE
  })
  status: InterventionStatus;

  @ApiPropertyOptional({
    description: 'Detailed description of the intervention',
    example: 'Structured physiotherapy session focusing on balance and mobility improvement'
  })
  description?: string;

  @ApiProperty({
    description: 'Priority level of the intervention',
    enum: PriorityLevel,
    example: PriorityLevel.HIGH
  })
  priority: PriorityLevel;

  @ApiProperty({
    description: 'Frequency of the intervention',
    enum: FrequencyType,
    example: FrequencyType.DAILY
  })
  frequency: FrequencyType;

  @ApiPropertyOptional({
    description: 'Custom frequency description',
    example: 'Every other day at 2 PM'
  })
  customFrequency?: string;

  @ApiProperty({
    description: 'Start date for the intervention',
    example: '2025-01-10T09:00:00.000Z',
    format: 'date-time'
  })
  startDate: string;

  @ApiPropertyOptional({
    description: 'End date for the intervention',
    example: '2025-03-10T17:00:00.000Z',
    format: 'date-time'
  })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Duration in minutes',
    example: 30
  })
  durationMinutes?: number;

  @ApiPropertyOptional({
    description: 'Array of assigned care team member IDs',
    type: [String],
    example: ['user-123', 'user-456']
  })
  assignedTeam?: string[];

  @ApiPropertyOptional({
    description: 'Expected outcomes and goals',
    type: [String],
    example: [
      'Improve balance by 20%',
      'Reduce fall risk',
      'Increase mobility confidence'
    ]
  })
  expectedOutcomes?: string[];

  @ApiPropertyOptional({
    description: 'Special instructions or precautions',
    example: 'Ensure resident has walking aid available, monitor for dizziness'
  })
  instructions?: string;

  @ApiPropertyOptional({
    description: 'Equipment or resources required',
    type: [String],
    example: ['Walking frame', 'Exercise mat', 'Balance board']
  })
  requiredResources?: string[];

  @ApiPropertyOptional({
    description: 'Contraindications or conditions that prevent intervention',
    type: [String],
    example: ['Acute illness', 'Recent surgery', 'Severe pain']
  })
  contraindications?: string[];

  @ApiPropertyOptional({
    description: 'Safety check status',
    enum: SafetyCheckStatus,
    example: SafetyCheckStatus.APPROVED
  })
  safetyCheckStatus?: SafetyCheckStatus;

  @ApiPropertyOptional({
    description: 'Date of last safety check',
    example: '2025-01-09T14:00:00.000Z',
    format: 'date-time'
  })
  lastSafetyCheckDate?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Resident expressed enthusiasm for this intervention'
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and filtering',
    type: [String],
    example: ['physiotherapy', 'balance', 'fall-prevention']
  })
  tags?: string[];

  @ApiProperty({
    description: 'Intervention creation timestamp',
    example: '2025-01-09T10:00:00.000Z',
    format: 'date-time'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Intervention last update timestamp',
    example: '2025-01-09T15:30:00.000Z',
    format: 'date-time'
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'User ID who created the intervention',
    example: 'user-789',
    format: 'uuid'
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'User ID who last updated the intervention',
    example: 'user-456',
    format: 'uuid'
  })
  updatedBy?: string;
}