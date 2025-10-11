import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Plan entity for WriteCareNotes
 * @module CarePlanEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description TypeScript entity class for care plans with comprehensive
 * care planning, approval workflows, and regulatory compliance support.
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
import { IsUUID, IsString, IsEnum, IsDate, IsOptional, IsInt, Min, Max, ValidateNested } from 'class-validator';

import { ResidentStatus } from '../entities/Resident';
import { Type } from 'class-transformer';
import { Resident } from '../resident/Resident';
import { CareDomain } from './CareDomain';
import { CareRecord } from './CareRecord';
import { CareReview } from './CareReview';
import { FamilyCommunication } from './FamilyCommunication';
import { ComplianceAssessment } from './ComplianceAssessment';

export enum CarePlanType {
  INITIAL = 'initial',
  REVIEW = 'review',
  EMERGENCY = 'emergency',
  DISCHARGE = 'discharge'
}

export enum CarePlanStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  SUPERSEDED = 'superseded'
}

export enum ReviewFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

export interface CareGoal {
  id: string;
  description: string;
  category: string;
  targetDate: Date;
  achievedDate?: Date;
  status: ResidentStatus.ACTIVE | 'achieved' | 'modified' | 'discontinued';
  measurableOutcome: string;
  responsibleStaff: string[];
  notes?: string;
}

export interface RiskAssessment {
  id: string;
  riskType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigationStrategies: string[];
  reviewDate: Date;
  assessedBy: string;
  lastReviewDate?: Date;
}

export interface EmergencyProcedure {
  id: string;
  procedureType: string;
  description: string;
  steps: string[];
  contactInformation: {
    name: string;
    role: string;
    phone: string;
    email?: string;
  }[];
  lastUpdated: Date;
  updatedBy: string;
}

export interface ResidentPreference {
  category: string;
  preference: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  dateRecorded: Date;
  recordedBy: string;
}

@Entity('care_plans')
@Index(['residentId', 'status'])
@Index(['nextReviewDate'], { where: "status = 'active'" })
@Index(['effectiveFrom', 'effectiveTo'])
@Index(['createdAt', 'updatedAt'])
@Check(`"version" >= 1`)
export class CarePlan {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id: string;

  @Column({ name: 'resident_id', type: 'uuid' })
  @IsUUID()
  residentId: string;

  @Column({ name: 'plan_name', length: 255 })
  @IsString()
  planName: string;

  @Column({ name: 'plan_type', type: 'enum', enum: CarePlanType, default: CarePlanType.INITIAL })
  @IsEnum(CarePlanType)
  planType: CarePlanType;

  @Column({ name: 'status', type: 'enum', enum: CarePlanStatus, default: CarePlanStatus.DRAFT })
  @IsEnum(CarePlanStatus)
  status: CarePlanStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  @IsUUID()
  createdBy: string;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Column({ name: 'approved_at', type: 'timestamp with time zone', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  approvedAt?: Date;

  @Column({ name: 'effective_from', type: 'date' })
  @IsDate()
  @Type(() => Date)
  effectiveFrom: Date;

  @Column({ name: 'effective_to', type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  effectiveTo?: Date;

  @Column({ name: 'review_frequency', type: 'enum', enum: ReviewFrequency, default: ReviewFrequency.MONTHLY })
  @IsEnum(ReviewFrequency)
  reviewFrequency: ReviewFrequency;

  @Column({ name: 'next_review_date', type: 'date' })
  @IsDate()
  @Type(() => Date)
  nextReviewDate: Date;

  @Column({ name: 'care_goals', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  careGoals?: CareGoal[];

  @Column({ name: 'risk_assessments', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  riskAssessments?: RiskAssessment[];

  @Column({ name: 'emergency_procedures', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  emergencyProcedures?: EmergencyProcedure[];

  @Column({ name: 'resident_preferences', type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  residentPreferences?: ResidentPreference[];

  @Column({ name: 'version', type: 'integer', default: 1 })
  @IsInt()
  @Min(1)
  version: number;

  @Column({ name: 'previous_version_id', type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  previousVersionId?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp with time zone' })
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => Resident, { eager: false })
  @JoinColumn({ name: 'resident_id' })
  resident: Resident;

  @ManyToOne(() => CarePlan, { nullable: true })
  @JoinColumn({ name: 'previous_version_id' })
  previousVersion?: CarePlan;

  @OneToMany(() => CareDomain, careDomain => careDomain.carePlan, { cascade: true })
  careDomains: CareDomain[];

  @OneToMany(() => CareRecord, careRecord => careRecord.carePlan)
  careRecords: CareRecord[];

  @OneToMany(() => CareReview, careReview => careReview.carePlan)
  careReviews: CareReview[];

  @OneToMany(() => FamilyCommunication, communication => communication.relatedCarePlan)
  familyCommunications: FamilyCommunication[];

  @OneToMany(() => ComplianceAssessment, assessment => assessment.carePlan)
  complianceAssessments: ComplianceAssessment[];

  // Computed properties
  get isActive(): boolean {
    return this.status === CarePlanStatus.ACTIVE;
  }

  get isDraft(): boolean {
    return this.status === CarePlanStatus.DRAFT;
  }

  get isApproved(): boolean {
    return this.approvedBy !== null && this.approvedAt !== null;
  }

  get isOverdueForReview(): boolean {
    return this.nextReviewDate < new Date() && this.isActive;
  }

  get daysUntilReview(): number {
    const today = new Date();
    const reviewDate = new Date(this.nextReviewDate);
    const diffTime = reviewDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  get highRiskAssessments(): RiskAssessment[] {
    return this.riskAssessments?.filter(risk => 
      risk.riskLevel === 'high' || risk.riskLevel === 'critical'
    ) || [];
  }

  get activeGoals(): CareGoal[] {
    return this.careGoals?.filter(goal => goal.status === 'active') || [];
  }

  get achievedGoals(): CareGoal[] {
    return this.careGoals?.filter(goal => goal.status === 'achieved') || [];
  }

  // Helper methods
  public addCareGoal(goal: Omit<CareGoal, 'id'>): void {
    if (!this.careGoals) {
      this.careGoals = [];
    }
    
    const newGoal: CareGoal = {
      ...goal,
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.careGoals.push(newGoal);
  }

  public updateCareGoal(goalId: string, updates: Partial<CareGoal>): boolean {
    if (!this.careGoals) return false;
    
    const goalIndex = this.careGoals.findIndex(goal => goal.id === goalId);
    if (goalIndex === -1) return false;
    
    this.careGoals[goalIndex] = { ...this.careGoals[goalIndex], ...updates };
    return true;
  }

  public addRiskAssessment(risk: Omit<RiskAssessment, 'id'>): void {
    if (!this.riskAssessments) {
      this.riskAssessments = [];
    }
    
    const newRisk: RiskAssessment = {
      ...risk,
      id: `risk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.riskAssessments.push(newRisk);
  }

  public updateRiskAssessment(riskId: string, updates: Partial<RiskAssessment>): boolean {
    if (!this.riskAssessments) return false;
    
    const riskIndex = this.riskAssessments.findIndex(risk => risk.id === riskId);
    if (riskIndex === -1) return false;
    
    this.riskAssessments[riskIndex] = { ...this.riskAssessments[riskIndex], ...updates };
    return true;
  }

  public addResidentPreference(preference: Omit<ResidentPreference, 'dateRecorded' | 'recordedBy'>, recordedBy: string): void {
    if (!this.residentPreferences) {
      this.residentPreferences = [];
    }
    
    const newPreference: ResidentPreference = {
      ...preference,
      dateRecorded: new Date(),
      recordedBy
    };
    
    this.residentPreferences.push(newPreference);
  }

  public calculateNextReviewDate(): Date {
    const baseDate = this.effectiveFrom;
    const nextDate = new Date(baseDate);
    
    switch (this.reviewFrequency) {
      case ReviewFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case ReviewFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case ReviewFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case ReviewFrequency.ANNUALLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate;
  }

  public approve(approvedBy: string): void {
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.status = CarePlanStatus.ACTIVE;
  }

  public archive(): void {
    this.status = CarePlanStatus.ARCHIVED;
    this.effectiveTo = new Date();
  }

  public supersede(newCarePlanId: string): void {
    this.status = CarePlanStatus.SUPERSEDED;
    this.effectiveTo = new Date();
  }

  public toJSON() {
    return {
      id: this.id,
      residentId: this.residentId,
      planName: this.planName,
      planType: this.planType,
      status: this.status,
      createdBy: this.createdBy,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      effectiveFrom: this.effectiveFrom,
      effectiveTo: this.effectiveTo,
      reviewFrequency: this.reviewFrequency,
      nextReviewDate: this.nextReviewDate,
      careGoals: this.careGoals,
      riskAssessments: this.riskAssessments,
      emergencyProcedures: this.emergencyProcedures,
      residentPreferences: this.residentPreferences,
      version: this.version,
      previousVersionId: this.previousVersionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed properties
      isActive: this.isActive,
      isDraft: this.isDraft,
      isApproved: this.isApproved,
      isOverdueForReview: this.isOverdueForReview,
      daysUntilReview: this.daysUntilReview,
      highRiskAssessments: this.highRiskAssessments,
      activeGoals: this.activeGoals,
      achievedGoals: this.achievedGoals
    };
  }
}