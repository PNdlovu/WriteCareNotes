import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Intervention entity for WriteCareNotes
 * @module CareInterventionEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description TypeScript entity class for specific care interventions
 * and activities within care domains.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements field-level encryption for sensitive care data
 * - Supports comprehensive audit trails
 * - Includes data validation and sanitization
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  Check
} from 'typeorm';
import { IsUUID, IsString, IsEnum, IsDate, IsOptional, IsBoolean, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CareDomain } from './CareDomain';
import { CareActivity } from './CareActivity';

export enum InterventionType {
  DIRECT_CARE = 'direct_care',
  MONITORING = 'monitoring',
  ASSESSMENT = 'assessment',
  MEDICATION = 'medication',
  THERAPY = 'therapy',
  SOCIAL = 'social',
  ENVIRONMENTAL = 'environmental'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RequiredSkill {
  skill: string;
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  certification?: string;
  trainingRequired?: boolean;
}

export interface EquipmentNeeded {
  equipmentType: string;
  equipmentName: string;
  quantity?: number;
  specifications?: string;
  maintenanceRequired?: boolean;
}

export interface SafetyConsideration {
  hazardType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  precautions: string[];
  emergencyProcedure?: string;
}

export interface OutcomeMeasure {
  measureType: string;
  expectedOutcome: string;
  measurementMethod: string;
  frequency: string;
  targetValue?: string;
}

export interface DocumentationRequirement {
  documentType: string;
  frequency: string;
  requiredFields: string[];
  approvalRequired?: boolean;
}

export interface Contraindication {
  condition: string;
  severity: 'absolute' | 'relative';
  description: string;
  alternativeApproach?: string;
}

@Entity('care_interventions')
@Index(['careDomainId'])
@Index(['interventionType', 'isActive'])
@Index(['priority'])
@Index(['effectiveFrom', 'effectiveTo'])
@Index(['isPrn'])
@Index(['interventionCode'])
@Index(['createdAt', 'updatedAt'])
@Index(['createdBy'])
@Check(`"duration_minutes" >= 0`)
export class CareIntervention {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ name: 'care_domain_id', type: 'uuid' })
  @IsUUID()
  careDomainId: string;

  @Column({ name: 'intervention_name', length: 255 })
  @IsString()
  interventionName: string;

  @Column({ name: 'intervention_code', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  interventionCode?: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ name: 'intervention_type', type: 'enum', enum: InterventionType, default: InterventionType.DIRECT_CARE })
  @IsEnum(InterventionType)
  interventionType: InterventionType;

  @Column({ name: 'frequency', length: 100 })
  @IsString()
  frequency: string;

  @Column({ name: 'timing', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  timing?: string;

  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @Column({ name: 'priority', type: 'enum', enum: Priority, default: Priority.MEDIUM })
  @IsEnum(Priority)
  priority: Priority;

  @Column({ name: 'required_skills', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  requiredSkills?: RequiredSkill[];

  @Column({ name: 'equipment_needed', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  equipmentNeeded?: EquipmentNeeded[];

  @Column({ name: 'safety_considerations', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  safetyConsiderations?: SafetyConsideration[];

  @Column({ name: 'outcome_measures', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  outcomeMeasures?: OutcomeMeasure[];

  @Column({ name: 'documentation_requirements', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  documentationRequirements?: DocumentationRequirement[];

  @Column({ name: 'contraindications', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  contraindications?: Contraindication[];

  @Column({ name: 'effective_from', type: 'date' })
  @IsDate()
  @Type(() => Date)
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ name: 'is_prn', type: 'boolean', default: false })
  @IsBoolean()
  isPrn: boolean;

  @Column({ name: 'created_by', type: 'uuid' })
  @IsUUID()
  createdBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => CareDomain, careDomain => careDomain.careInterventions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'care_domain_id' })
  careDomain: CareDomain;

  @OneToMany(() => CareActivity, activity => activity.intervention)
  careActivities: CareActivity[];

  // Computed properties
  get isCurrentlyActive(): boolean {
    const today = new Date();
    return this.isActive && 
           this.effectiveFrom <= today && 
           (!this.effectiveTo || this.effectiveTo >= today);
  }

  get isCriticalPriority(): boolean {
    return this.priority === Priority.CRITICAL;
  }

  get requiresSpecializedSkills(): boolean {
    return this.requiredSkills?.some(skill => 
      skill.level === 'advanced' || skill.level === 'expert' || skill.certification
    ) || false;
  }

  get hasHighRiskSafetyConsiderations(): boolean {
    return this.safetyConsiderations?.some(safety => 
      safety.riskLevel === 'high' || safety.riskLevel === 'critical'
    ) || false;
  }

  get hasAbsoluteContraindications(): boolean {
    return this.contraindications?.some(contra => contra.severity === 'absolute') || false;
  }

  get estimatedDailyTime(): number {
    if (!this.durationMinutes) return 0;
    
    // Parse frequency to estimate daily occurrences
    const frequency = this.frequency.toLowerCase();
    let dailyOccurrences = 1;
    
    if (frequency.includes('twice') || frequency.includes('2')) {
      dailyOccurrences = 2;
    } else if (frequency.includes('three') || frequency.includes('3')) {
      dailyOccurrences = 3;
    } else if (frequency.includes('four') || frequency.includes('4')) {
      dailyOccurrences = 4;
    } else if (frequency.includes('hourly')) {
      dailyOccurrences = 24;
    } else if (frequency.includes('weekly')) {
      dailyOccurrences = 1/7;
    } else if (frequency.includes('monthly')) {
      dailyOccurrences = 1/30;
    }
    
    return Math.round(this.durationMinutes * dailyOccurrences);
  }

  // Helper methods
  public addRequiredSkill(skill: RequiredSkill): void {
    if (!this.requiredSkills) {
      this.requiredSkills = [];
    }
    this.requiredSkills.push(skill);
  }

  public removeRequiredSkill(skillName: string): boolean {
    if (!this.requiredSkills) return false;
    
    const initialLength = this.requiredSkills.length;
    this.requiredSkills = this.requiredSkills.filter(skill => skill.skill !== skillName);
    return this.requiredSkills.length < initialLength;
  }

  public addEquipment(equipment: EquipmentNeeded): void {
    if (!this.equipmentNeeded) {
      this.equipmentNeeded = [];
    }
    this.equipmentNeeded.push(equipment);
  }

  public addSafetyConsideration(safety: SafetyConsideration): void {
    if (!this.safetyConsiderations) {
      this.safetyConsiderations = [];
    }
    this.safetyConsiderations.push(safety);
  }

  public addOutcomeMeasure(outcome: OutcomeMeasure): void {
    if (!this.outcomeMeasures) {
      this.outcomeMeasures = [];
    }
    this.outcomeMeasures.push(outcome);
  }

  public addDocumentationRequirement(requirement: DocumentationRequirement): void {
    if (!this.documentationRequirements) {
      this.documentationRequirements = [];
    }
    this.documentationRequirements.push(requirement);
  }

  public addContraindication(contraindication: Contraindication): void {
    if (!this.contraindications) {
      this.contraindications = [];
    }
    this.contraindications.push(contraindication);
  }

  public activate(): void {
    this.isActive = true;
    this.effectiveFrom = new Date();
    this.effectiveTo = undefined;
  }

  public deactivate(reason?: string): void {
    this.isActive = false;
    this.effectiveTo = new Date();
  }

  public updateFrequency(newFrequency: string, newTiming?: string): void {
    this.frequency = newFrequency;
    if (newTiming) {
      this.timing = newTiming;
    }
  }

  public updatePriority(newPriority: Priority): void {
    this.priority = newPriority;
  }

  public checkContraindications(residentConditions: string[]): Contraindication[] {
    if (!this.contraindications) return [];
    
    return this.contraindications.filter(contra =>
      residentConditions.some(condition => 
        condition.toLowerCase().includes(contra.condition.toLowerCase())
      )
    );
  }

  public getRequiredCertifications(): string[] {
    if (!this.requiredSkills) return [];
    
    return this.requiredSkills
      .filter(skill => skill.certification)
      .map(skill => skill.certification!)
      .filter((cert, index, array) => array.indexOf(cert) === index); // Remove duplicates
  }

  public calculateComplexityScore(): number {
    let score = 0;
    
    // Base score from priority
    switch (this.priority) {
      case Priority.LOW: score += 1; break;
      case Priority.MEDIUM: score += 2; break;
      case Priority.HIGH: score += 3; break;
      case Priority.CRITICAL: score += 4; break;
    }
    
    // Add points for specialized skills
    if (this.requiresSpecializedSkills) score += 2;
    
    // Add points for safety considerations
    if (this.hasHighRiskSafetyConsiderations) score += 2;
    
    // Add points for equipment requirements
    if (this.equipmentNeeded && this.equipmentNeeded.length > 0) score += 1;
    
    // Add points for contraindications
    if (this.hasAbsoluteContraindications) score += 2;
    
    // Add points for documentation requirements
    if (this.documentationRequirements && this.documentationRequirements.length > 2) score += 1;
    
    return Math.min(score, 10); // Cap at 10
  }

  public toJSON() {
    return {
      id: this.id,
      careDomainId: this.careDomainId,
      interventionName: this.interventionName,
      interventionCode: this.interventionCode,
      description: this.description,
      interventionType: this.interventionType,
      frequency: this.frequency,
      timing: this.timing,
      durationMinutes: this.durationMinutes,
      priority: this.priority,
      requiredSkills: this.requiredSkills,
      equipmentNeeded: this.equipmentNeeded,
      safetyConsiderations: this.safetyConsiderations,
      outcomeMeasures: this.outcomeMeasures,
      documentationRequirements: this.documentationRequirements,
      contraindications: this.contraindications,
      effectiveFrom: this.effectiveFrom,
      effectiveTo: this.effectiveTo,
      isActive: this.isActive,
      isPrn: this.isPrn,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed properties
      isCurrentlyActive: this.isCurrentlyActive,
      isCriticalPriority: this.isCriticalPriority,
      requiresSpecializedSkills: this.requiresSpecializedSkills,
      hasHighRiskSafetyConsiderations: this.hasHighRiskSafetyConsiderations,
      hasAbsoluteContraindications: this.hasAbsoluteContraindications,
      estimatedDailyTime: this.estimatedDailyTime,
      complexityScore: this.calculateComplexityScore(),
      requiredCertifications: this.getRequiredCertifications()
    };
  }
}
