import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Domain DTOs for WriteCareNotes API
 * @module CareDomainDto
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Data Transfer Objects for Care Domain API endpoints with comprehensive validation
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
 * Care Domain Status enumeration
 */
export enum CareDomainStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNDER_ASSESSMENT = 'under_assessment',
  NEEDS_ATTENTION = 'needs_attention',
  RESOLVED = 'resolved'
}

/**
 * Assessment Level enumeration
 */
export enum AssessmentLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Risk Level enumeration
 */
export enum RiskLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe'
}

/**
 * Create Care Domain Request DTO
 */
export class CreateCareDomainDto {
  @ApiProperty({
    description: 'Unique identifier of the care plan',
    example: 'plan-123',
    format: 'uuid'
  })
  @IsUUID(4, { message: 'Care plan ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Care plan ID is required' })
  carePlanId: string;

  @ApiProperty({
    description: 'Name of the care domain',
    example: 'Mobility and Physical Function',
    minLength: 3,
    maxLength: 100
  })
  @IsString({ message: 'Domain name must be a string' })
  @Length(3, 100, { message: 'Domain name must be between 3 and 100 characters' })
  @IsNotEmpty({ message: 'Domain name is required' })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&]+$/, { message: 'Domain name contains invalid characters' })
  domainName: string;

  @ApiProperty({
    description: 'Category of the care domain',
    example: 'physical_health',
    enum: [
      'physical_health',
      'mental_health',
      'cognitive_function',
      'social_wellbeing',
      'nutrition_hydration',
      'medication_management',
      'safety_security',
      'personal_care',
      'communication',
      'spiritual_cultural',
      'environmental',
      'family_relationships'
    ]
  })
  @IsEnum([
    'physical_health',
    'mental_health',
    'cognitive_function',
    'social_wellbeing',
    'nutrition_hydration',
    'medication_management',
    'safety_security',
    'personal_care',
    'communication',
    'spiritual_cultural',
    'environmental',
    'family_relationships'
  ], { message: 'Invalid domain category' })
  category: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the care domain',
    example: 'Assessment and management of resident mobility, balance, and physical function',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    description: 'Priority level of the care domain',
    enum: PriorityLevel,
    example: PriorityLevel.HIGH
  })
  @IsEnum(PriorityLevel, { message: 'Invalid priority level' })
  priority: PriorityLevel;

  @ApiProperty({
    description: 'Current assessment level',
    enum: AssessmentLevel,
    example: AssessmentLevel.MODERATE
  })
  @IsEnum(AssessmentLevel, { message: 'Invalid assessment level' })
  assessmentLevel: AssessmentLevel;

  @ApiProperty({
    description: 'Current risk level',
    enum: RiskLevel,
    example: RiskLevel.MODERATE
  })
  @IsEnum(RiskLevel, { message: 'Invalid risk level' })
  riskLevel: RiskLevel;

  @ApiPropertyOptional({
    description: 'Assessment score (0-100)',
    example: 75,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({}, { message: 'Assessment score must be a number' })
  @Min(0, { message: 'Assessment score must be at least 0' })
  @Max(100, { message: 'Assessment score cannot exceed 100' })
  assessmentScore?: number;

  @ApiPropertyOptional({
    description: 'Date of last assessment',
    example: '2025-01-08T10:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Last assessment date must be a valid date' })
  lastAssessmentDate?: string;

  @ApiProperty({
    description: 'Date of next scheduled assessment',
    example: '2025-02-08T10:00:00.000Z',
    format: 'date-time'
  })
  @IsDateString({}, { message: 'Next assessment date must be a valid date' })
  nextAssessmentDate: string;

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
    description: 'Goals and objectives for this domain',
    type: [String],
    example: [
      'Maintain current mobility level',
      'Reduce fall risk',
      'Improve balance and coordination'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Goals must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 goals' })
  @IsString({ each: true, message: 'Each goal must be a string' })
  @Length(5, 200, { each: true, message: 'Each goal must be between 5 and 200 characters' })
  goals?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Resident shows good motivation for mobility exercises',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and filtering',
    type: [String],
    example: ['mobility', 'fall-prevention', 'physiotherapy']
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Length(2, 50, { each: true, message: 'Each tag must be between 2 and 50 characters' })
  tags?: string[];
}

/**
 * Update Care Domain Request DTO
 */
export class UpdateCareDomainDto {
  @ApiPropertyOptional({
    description: 'Name of the care domain',
    example: 'Enhanced Mobility and Physical Function',
    minLength: 3,
    maxLength: 100
  })
  @IsOptional()
  @IsString({ message: 'Domain name must be a string' })
  @Length(3, 100, { message: 'Domain name must be between 3 and 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-_.,()&]+$/, { message: 'Domain name contains invalid characters' })
  domainName?: string;

  @ApiPropertyOptional({
    description: 'Category of the care domain',
    example: 'physical_health',
    enum: [
      'physical_health',
      'mental_health',
      'cognitive_function',
      'social_wellbeing',
      'nutrition_hydration',
      'medication_management',
      'safety_security',
      'personal_care',
      'communication',
      'spiritual_cultural',
      'environmental',
      'family_relationships'
    ]
  })
  @IsOptional()
  @IsEnum([
    'physical_health',
    'mental_health',
    'cognitive_function',
    'social_wellbeing',
    'nutrition_hydration',
    'medication_management',
    'safety_security',
    'personal_care',
    'communication',
    'spiritual_cultural',
    'environmental',
    'family_relationships'
  ], { message: 'Invalid domain category' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the care domain',
    example: 'Updated assessment and management of resident mobility with new interventions',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @Length(0, 1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Priority level of the care domain',
    enum: PriorityLevel,
    example: PriorityLevel.MEDIUM
  })
  @IsOptional()
  @IsEnum(PriorityLevel, { message: 'Invalid priority level' })
  priority?: PriorityLevel;

  @ApiPropertyOptional({
    description: 'Current assessment level',
    enum: AssessmentLevel,
    example: AssessmentLevel.HIGH
  })
  @IsOptional()
  @IsEnum(AssessmentLevel, { message: 'Invalid assessment level' })
  assessmentLevel?: AssessmentLevel;

  @ApiPropertyOptional({
    description: 'Current risk level',
    enum: RiskLevel,
    example: RiskLevel.LOW
  })
  @IsOptional()
  @IsEnum(RiskLevel, { message: 'Invalid risk level' })
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({
    description: 'Assessment score (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100
  })
  @IsOptional()
  @IsNumber({}, { message: 'Assessment score must be a number' })
  @Min(0, { message: 'Assessment score must be at least 0' })
  @Max(100, { message: 'Assessment score cannot exceed 100' })
  assessmentScore?: number;

  @ApiPropertyOptional({
    description: 'Date of next scheduled assessment',
    example: '2025-03-08T10:00:00.000Z',
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString({}, { message: 'Next assessment date must be a valid date' })
  nextAssessmentDate?: string;

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
    description: 'Goals and objectives for this domain',
    type: [String],
    example: [
      'Improve mobility independence',
      'Eliminate fall incidents',
      'Enhance physical strength'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Goals must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 goals' })
  @IsString({ each: true, message: 'Each goal must be a string' })
  @Length(5, 200, { each: true, message: 'Each goal must be between 5 and 200 characters' })
  goals?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Significant improvement noted in balance and confidence',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @Length(0, 1000, { message: 'Notes must not exceed 1000 characters' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and filtering',
    type: [String],
    example: ['mobility', 'fall-prevention', 'physiotherapy', 'improved']
  })
  @IsOptional()
  @IsArray({ message: 'Tags must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 tags' })
  @IsString({ each: true, message: 'Each tag must be a string' })
  @Length(2, 50, { each: true, message: 'Each tag must be between 2 and 50 characters' })
  tags?: string[];
}

/**
 * Care Domain Assessment Request DTO
 */
export class AssessCareDomainDto {
  @ApiProperty({
    description: 'Assessment type',
    enum: ['initial', 'routine', 'emergency', 'incident_triggered', 'discharge'],
    example: 'routine'
  })
  @IsEnum(['initial', 'routine', 'emergency', 'incident_triggered', 'discharge'], {
    message: 'Invalid assessment type'
  })
  assessmentType: string;

  @ApiProperty({
    description: 'Assessment score (0-100)',
    example: 78,
    minimum: 0,
    maximum: 100
  })
  @IsNumber({}, { message: 'Assessment score must be a number' })
  @Min(0, { message: 'Assessment score must be at least 0' })
  @Max(100, { message: 'Assessment score cannot exceed 100' })
  assessmentScore: number;

  @ApiProperty({
    description: 'Assessment level based on score',
    enum: AssessmentLevel,
    example: AssessmentLevel.MODERATE
  })
  @IsEnum(AssessmentLevel, { message: 'Invalid assessment level' })
  assessmentLevel: AssessmentLevel;

  @ApiProperty({
    description: 'Risk level identified',
    enum: RiskLevel,
    example: RiskLevel.LOW
  })
  @IsEnum(RiskLevel, { message: 'Invalid risk level' })
  riskLevel: RiskLevel;

  @ApiPropertyOptional({
    description: 'Detailed assessment findings',
    example: 'Resident demonstrates improved balance and reduced fall risk',
    maxLength: 2000
  })
  @IsOptional()
  @IsString({ message: 'Assessment findings must be a string' })
  @Length(0, 2000, { message: 'Assessment findings must not exceed 2000 characters' })
  assessmentFindings?: string;

  @ApiPropertyOptional({
    description: 'Recommendations based on assessment',
    type: [String],
    example: [
      'Continue current physiotherapy program',
      'Increase walking exercises',
      'Monitor for any changes in mobility'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Recommendations must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 recommendations' })
  @IsString({ each: true, message: 'Each recommendation must be a string' })
  @Length(5, 200, { each: true, message: 'Each recommendation must be between 5 and 200 characters' })
  recommendations?: string[];

  @ApiPropertyOptional({
    description: 'Identified risks and concerns',
    type: [String],
    example: [
      'Slight decrease in grip strength',
      'Occasional dizziness reported'
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Risks must be an array' })
  @ArrayMaxSize(10, { message: 'Cannot exceed 10 risks' })
  @IsString({ each: true, message: 'Each risk must be a string' })
  @Length(5, 200, { each: true, message: 'Each risk must be between 5 and 200 characters' })
  identifiedRisks?: string[];

  @ApiProperty({
    description: 'Date of next recommended assessment',
    example: '2025-03-08T10:00:00.000Z',
    format: 'date-time'
  })
  @IsDateString({}, { message: 'Next assessment date must be a valid date' })
  nextAssessmentDate: string;

  @ApiPropertyOptional({
    description: 'Assessment tools used',
    type: [String],
    example: ['Barthel Index', 'Timed Up and Go Test', 'Berg Balance Scale']
  })
  @IsOptional()
  @IsArray({ message: 'Assessment tools must be an array' })
  @IsString({ each: true, message: 'Each assessment tool must be a string' })
  assessmentTools?: string[];

  @ApiPropertyOptional({
    description: 'Additional assessment notes',
    example: 'Assessment conducted with family member present',
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'Assessment notes must be a string' })
  @Length(0, 1000, { message: 'Assessment notes must not exceed 1000 characters' })
  assessmentNotes?: string;
}

/**
 * Care Domain Query Parameters DTO
 */
export class CareDomainQueryDto {
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
    description: 'Filter by care plan ID',
    example: 'plan-123',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Care plan ID must be a valid UUID' })
  carePlanId?: string;

  @ApiPropertyOptional({
    description: 'Filter by domain status',
    enum: CareDomainStatus,
    example: CareDomainStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(CareDomainStatus, { message: 'Invalid status filter' })
  status?: CareDomainStatus;

  @ApiPropertyOptional({
    description: 'Filter by domain category',
    example: 'physical_health'
  })
  @IsOptional()
  @IsString({ message: 'Category filter must be a string' })
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by priority level',
    enum: PriorityLevel,
    example: PriorityLevel.HIGH
  })
  @IsOptional()
  @IsEnum(PriorityLevel, { message: 'Invalid priority filter' })
  priority?: PriorityLevel;

  @ApiPropertyOptional({
    description: 'Filter by risk level',
    enum: RiskLevel,
    example: RiskLevel.MODERATE
  })
  @IsOptional()
  @IsEnum(RiskLevel, { message: 'Invalid risk level filter' })
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({
    description: 'Filter by assigned team member ID',
    example: 'user-123',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID(4, { message: 'Team member ID must be a valid UUID' })
  assignedTeamMember?: string;

  @ApiPropertyOptional({
    description: 'Search term for filtering domains',
    example: 'mobility'
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Length(2, 100, { message: 'Search term must be between 2 and 100 characters' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort field for ordering results',
    enum: ['domainName', 'priority', 'riskLevel', 'assessmentScore', 'nextAssessmentDate'],
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
 * Care Domain Response DTO
 */
export class CareDomainResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the care domain',
    example: 'domain-123',
    format: 'uuid'
  })
  id: string;

  @ApiProperty({
    description: 'Unique identifier of the care plan',
    example: 'plan-123',
    format: 'uuid'
  })
  carePlanId: string;

  @ApiProperty({
    description: 'Name of the care domain',
    example: 'Mobility and Physical Function'
  })
  domainName: string;

  @ApiProperty({
    description: 'Category of the care domain',
    example: 'physical_health'
  })
  category: string;

  @ApiProperty({
    description: 'Current status of the care domain',
    enum: CareDomainStatus,
    example: CareDomainStatus.ACTIVE
  })
  status: CareDomainStatus;

  @ApiPropertyOptional({
    description: 'Detailed description of the care domain',
    example: 'Assessment and management of resident mobility, balance, and physical function'
  })
  description?: string;

  @ApiProperty({
    description: 'Priority level of the care domain',
    enum: PriorityLevel,
    example: PriorityLevel.HIGH
  })
  priority: PriorityLevel;

  @ApiProperty({
    description: 'Current assessment level',
    enum: AssessmentLevel,
    example: AssessmentLevel.MODERATE
  })
  assessmentLevel: AssessmentLevel;

  @ApiProperty({
    description: 'Current risk level',
    enum: RiskLevel,
    example: RiskLevel.MODERATE
  })
  riskLevel: RiskLevel;

  @ApiPropertyOptional({
    description: 'Assessment score (0-100)',
    example: 75
  })
  assessmentScore?: number;

  @ApiPropertyOptional({
    description: 'Date of last assessment',
    example: '2025-01-08T10:00:00.000Z',
    format: 'date-time'
  })
  lastAssessmentDate?: string;

  @ApiProperty({
    description: 'Date of next scheduled assessment',
    example: '2025-02-08T10:00:00.000Z',
    format: 'date-time'
  })
  nextAssessmentDate: string;

  @ApiPropertyOptional({
    description: 'Array of assigned care team member IDs',
    type: [String],
    example: ['user-123', 'user-456']
  })
  assignedTeam?: string[];

  @ApiPropertyOptional({
    description: 'Goals and objectives for this domain',
    type: [String],
    example: [
      'Maintain current mobility level',
      'Reduce fall risk',
      'Improve balance and coordination'
    ]
  })
  goals?: string[];

  @ApiPropertyOptional({
    description: 'Additional notes or observations',
    example: 'Resident shows good motivation for mobility exercises'
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags for categorization and filtering',
    type: [String],
    example: ['mobility', 'fall-prevention', 'physiotherapy']
  })
  tags?: string[];

  @ApiProperty({
    description: 'Domain creation timestamp',
    example: '2025-01-09T10:00:00.000Z',
    format: 'date-time'
  })
  createdAt: string;

  @ApiProperty({
    description: 'Domain last update timestamp',
    example: '2025-01-09T15:30:00.000Z',
    format: 'date-time'
  })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'User ID who created the domain',
    example: 'user-789',
    format: 'uuid'
  })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'User ID who last updated the domain',
    example: 'user-456',
    format: 'uuid'
  })
  updatedBy?: string;

  @ApiPropertyOptional({
    description: 'Number of active interventions in this domain',
    example: 3
  })
  interventionCount?: number;
}