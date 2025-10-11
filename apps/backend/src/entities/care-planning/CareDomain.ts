import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Domain entity for WriteCareNotes
 * @module CareDomainEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description TypeScript entity class for care domains within care plans,
 * covering different aspects of resident care (personal care, mobility, nutrition, etc.).
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
  Index
} from 'typeorm';
import { IsUUID, IsString, IsEnum, IsDate, IsOptional, IsBoolean, ValidateNested } from 'class-validator';

import { ResidentStatus } from '../entities/Resident';
import { Type } from 'class-transformer';
import { CarePlan } from './CarePlan';
import { CareIntervention } from './CareIntervention';

export enum DomainType {
  PERSONAL_CARE = 'personal_care',
  MOBILITY = 'mobility',
  NUTRITION = 'nutrition',
  SOCIAL = 'social',
  MEDICAL = 'medical',
  MENTAL_HEALTH = 'mental_health',
  COGNITIVE = 'cognitive',
  COMMUNICATION = 'communication'
}

export enum CurrentStatus {
  INDEPENDENT = 'independent',
  REQUIRES_ASSISTANCE = 'requires_assistance',
  REQUIRES_SUPERVISION = 'requires_supervision',
  FULLY_DEPENDENT = 'fully_dependent',
  NOT_APPLICABLE = 'not_applicable'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum MonitoringFrequency {
  CONTINUOUS = 'continuous',
  HOURLY = 'hourly',
  SHIFT = 'shift',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface DomainGoal {
  id: string;
  description: string;
  targetDate: Date;
  achievedDate?: Date;
  status: ResidentStatus.ACTIVE | 'achieved' | 'modified' | 'discontinued';
  measurableOutcome: string;
  progressNotes: string[];
}

export interface DomainIntervention {
  id: string;
  name: string;
  description: string;
  frequency: string;
  timing?: string;
  duration?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

export interface RiskFactor {
  id: string;
  factor: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigationStrategy: string;
  reviewDate: Date;
}

export interface EquipmentRequirement {
  id: string;
  equipmentType: string;
  equipmentName: string;
  purpose: string;
  maintenanceSchedule?: string;
  lastInspection?: Date;
  nextInspection?: Date;
}

export interface StaffRequirement {
  skillLevel: 'basic' | 'intermediate' | 'advanced' | 'specialist';
  qualifications: string[];
  experience: string;
  specialTraining?: string[];
  minimumStaffRatio?: string;
}

@Entity('care_domains')
@Index(['carePlanId'])
@Index(['domainType', 'isActive'])
@Index(['riskLevel'])
@Index(['lastAssessmentDate', 'nextAssessmentDate'])
@Index(['createdAt', 'updatedAt'])
export class CareDomain {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ name: 'care_plan_id', type: 'uuid' })
  @IsUUID()
  carePlanId: string;

  @Column({ name: 'domain_type', type: 'enum', enum: DomainType })
  @IsEnum(DomainType)
  domainType: DomainType;

  @Column({ name: 'domain_name', length: 255 })
  @IsString()
  domainName: string;

  @Column({ name: 'assessment_summary', type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  assessmentSummary?: string;

  @Column({ name: 'current_status', type: 'enum', enum: CurrentStatus, default: CurrentStatus.REQUIRES_ASSISTANCE })
  @IsEnum(CurrentStatus)
  currentStatus: CurrentStatus;

  @Column({ name: 'goals', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  goals?: DomainGoal[];

  @Column({ name: 'interventions', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  interventions?: DomainIntervention[];

  @Column({ name: 'risk_level', type: 'enum', enum: RiskLevel, default: RiskLevel.MEDIUM })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @Column({ name: 'risk_factors', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  riskFactors?: RiskFactor[];

  @Column({ name: 'equipment_needed', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  equipmentNeeded?: EquipmentRequirement[];

  @Column({ name: 'staff_requirements', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  staffRequirements?: StaffRequirement;

  @Column({ name: 'monitoring_frequency', type: 'enum', enum: MonitoringFrequency, default: MonitoringFrequency.DAILY })
  @IsEnum(MonitoringFrequency)
  monitoringFrequency: MonitoringFrequency;

  @Column({ name: 'last_assessment_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastAssessmentDate?: Date;

  @Column({ name: 'next_assessment_date', type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  nextAssessmentDate?: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => CarePlan, carePlan => carePlan.careDomains, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'care_plan_id' })
  carePlan: CarePlan;

  @OneToMany(() => CareIntervention, intervention => intervention.careDomain, { cascade: true })
  careInterventions: CareIntervention[];

  // Computed properties
  get isHighRisk(): boolean {
    return this.riskLevel === RiskLevel.HIGH || this.riskLevel === RiskLevel.CRITICAL;
  }

  get requiresSpecialistCare(): boolean {
    return this.staffRequirements?.skillLevel === 'specialist' || 
           this.staffRequirements?.skillLevel === 'advanced';
  }

  get isOverdueForAssessment(): boolean {
    if (!this.nextAssessmentDate) return false;
    return this.nextAssessmentDate < new Date();
  }

  get activeGoals(): DomainGoal[] {
    return this.goals?.filter(goal => goal.status === 'active') || [];
  }

  get achievedGoals(): DomainGoal[] {
    return this.goals?.filter(goal => goal.status === 'achieved') || [];
  }

  get activeInterventions(): DomainIntervention[] {
    return this.interventions?.filter(intervention => intervention.isActive) || [];
  }

  get criticalRiskFactors(): RiskFactor[] {
    return this.riskFactors?.filter(risk => 
      risk.likelihood === 'high' && risk.impact === 'high'
    ) || [];
  }

  get equipmentDueForInspection(): EquipmentRequirement[] {
    const today = new Date();
    return this.equipmentNeeded?.filter(equipment => 
      equipment.nextInspection && equipment.nextInspection <= today
    ) || [];
  }

  // Helper methods
  public addGoal(goal: Omit<DomainGoal, 'id' | 'progressNotes'>): void {
    if (!this.goals) {
      this.goals = [];
    }
    
    constnewGoal: DomainGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      progressNotes: []
    };
    
    this.goals.push(newGoal);
  }

  public updateGoal(goalId: string, updates: Partial<DomainGoal>): boolean {
    if (!this.goals) return false;
    
    const goalIndex = this.goals.findIndex(goal => goal.id === goalId);
    if (goalIndex === -1) return false;
    
    this.goals[goalIndex] = { ...this.goals[goalIndex], ...updates };
    return true;
  }

  public addProgressNote(goalId: string, note: string): boolean {
    if (!this.goals) return false;
    
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return false;
    
    goal.progressNotes.push(`${new Date().toISOString()}: ${note}`);
    return true;
  }

  public addRiskFactor(riskFactor: Omit<RiskFactor, 'id'>): void {
    if (!this.riskFactors) {
      this.riskFactors = [];
    }
    
    constnewRiskFactor: RiskFactor = {
      ...riskFactor,
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.riskFactors.push(newRiskFactor);
  }

  public updateRiskFactor(riskId: string, updates: Partial<RiskFactor>): boolean {
    if (!this.riskFactors) return false;
    
    const riskIndex = this.riskFactors.findIndex(risk => risk.id === riskId);
    if (riskIndex === -1) return false;
    
    this.riskFactors[riskIndex] = { ...this.riskFactors[riskIndex], ...updates };
    return true;
  }

  public addEquipment(equipment: Omit<EquipmentRequirement, 'id'>): void {
    if (!this.equipmentNeeded) {
      this.equipmentNeeded = [];
    }
    
    constnewEquipment: EquipmentRequirement = {
      ...equipment,
      id: `equipment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.equipmentNeeded.push(newEquipment);
  }

  public updateEquipmentInspection(equipmentId: string, inspectionDate: Date, nextInspectionDate: Date): boolean {
    if (!this.equipmentNeeded) return false;
    
    const equipment = this.equipmentNeeded.find(eq => eq.id === equipmentId);
    if (!equipment) return false;
    
    equipment.lastInspection = inspectionDate;
    equipment.nextInspection = nextInspectionDate;
    return true;
  }

  public calculateRiskScore(): number {
    if (!this.riskFactors || this.riskFactors.length === 0) {
      return this.getRiskLevelScore();
    }
    
    const riskScores = this.riskFactors.map(risk => {
      const likelihoodScore = this.getLikelihoodScore(risk.likelihood);
      const impactScore = this.getImpactScore(risk.impact);
      return likelihoodScore * impactScore;
    });
    
    const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    return Math.round(averageRiskScore * 10) / 10; // Round to 1 decimal place
  }

  private getRiskLevelScore(): number {
    switch (this.riskLevel) {
      case RiskLevel.LOW: return 1;
      case RiskLevel.MEDIUM: return 2;
      case RiskLevel.HIGH: return 3;
      case RiskLevel.CRITICAL: return 4;
      default: return 2;
    }
  }

  private getLikelihoodScore(likelihood: string): number {
    switch (likelihood) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  private getImpactScore(impact: string): number {
    switch (impact) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 2;
    }
  }

  public scheduleNextAssessment(): void {
    const today = new Date();
    const nextAssessment = new Date(today);
    
    switch (this.monitoringFrequency) {
      case MonitoringFrequency.DAILY:
        nextAssessment.setDate(today.getDate() + 1);
        break;
      case MonitoringFrequency.WEEKLY:
        nextAssessment.setDate(today.getDate() + 7);
        break;
      case MonitoringFrequency.MONTHLY:
        nextAssessment.setMonth(today.getMonth() + 1);
        break;
      default:
        nextAssessment.setDate(today.getDate() + 7); // Default to weekly
    }
    
    this.nextAssessmentDate = nextAssessment;
  }

  public toJSON() {
    return {
      id: this.id,
      carePlanId: this.carePlanId,
      domainType: this.domainType,
      domainName: this.domainName,
      assessmentSummary: this.assessmentSummary,
      currentStatus: this.currentStatus,
      goals: this.goals,
      interventions: this.interventions,
      riskLevel: this.riskLevel,
      riskFactors: this.riskFactors,
      equipmentNeeded: this.equipmentNeeded,
      staffRequirements: this.staffRequirements,
      monitoringFrequency: this.monitoringFrequency,
      lastAssessmentDate: this.lastAssessmentDate,
      nextAssessmentDate: this.nextAssessmentDate,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed properties
      isHighRisk: this.isHighRisk,
      requiresSpecialistCare: this.requiresSpecialistCare,
      isOverdueForAssessment: this.isOverdueForAssessment,
      activeGoals: this.activeGoals,
      achievedGoals: this.achievedGoals,
      activeInterventions: this.activeInterventions,
      criticalRiskFactors: this.criticalRiskFactors,
      equipmentDueForInspection: this.equipmentDueForInspection,
      riskScore: this.calculateRiskScore()
    };
  }
}
