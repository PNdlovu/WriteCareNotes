import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { IsNotEmpty, IsEnum, IsOptional, IsJSON, IsNumber, Min, Max } from 'class-validator';
import { ResidentEntity } from './resident.entity';

export enum PredictionType {
  HEALTH_DECLINE = 'health_decline',
  FALL_RISK = 'fall_risk',
  MEDICATION_ADHERENCE = 'medication_adherence',
  COGNITIVE_DECLINE = 'cognitive_decline',
  INFECTION_RISK = 'infection_risk',
  HOSPITAL_READMISSION = 'hospital_readmission',
  MORTALITY_RISK = 'mortality_risk',
  SOCIAL_ISOLATION = 'social_isolation',
  NUTRITION_RISK = 'nutrition_risk',
  SLEEP_DISORDER = 'sleep_disorder',
  DEPRESSION_RISK = 'depression_risk',
  MOBILITY_DECLINE = 'mobility_decline',
}

export enum RiskLevel {
  VERY_LOW = 'very_low',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
  CRITICAL = 'critical',
}

export enum PredictionStatus {
  ACTIVE = 'active',
  MONITORING = 'monitoring',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  FALSE_POSITIVE = 'false_positive',
}

@Entity('health_predictions')
@Index(['residentId', 'predictionType'])
@Index(['riskLevel', 'status'])
@Index(['predictionDate', 'expiryDate'])
export class HealthPredictionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  residentId: string;

  @Column({ type: 'enum', enum: PredictionType })
  @IsEnum(PredictionType)
  predictionType: PredictionType;

  @Column({ type: 'enum', enum: RiskLevel })
  @IsEnum(RiskLevel)
  riskLevel: RiskLevel;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  confidence: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  probability: number;

  @Column({ type: 'text' })
  @IsNotEmpty()
  description: string;

  @Column({ type: 'jsonb' })
  @IsJSON()
  factors: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  recommendations: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  interventions: Record<string, any>;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  modelVersion: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  algorithm: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  modelMetrics: Record<string, any>;

  @Column({ type: 'timestamp' })
  predictionDate: Date;

  @Column({ type: 'timestamp' })
  expiryDate: Date;

  @Column({ type: 'enum', enum: PredictionStatus, default: PredictionStatus.ACTIVE })
  @IsEnum(PredictionStatus)
  status: PredictionStatus;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  monitoringData: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  outcomeData: Record<string, any>;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  reviewedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  reviewedAt: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  notes: string;

  @Column({ type: 'boolean', default: false })
  isActionTaken: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  actionTakenAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  actionTakenBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => ResidentEntity)
  resident: ResidentEntity;

  // Helper methods
  isExpired(): boolean {
    return new Date() > this.expiryDate;
  }

  isHighRisk(): boolean {
    return [RiskLevel.HIGH, RiskLevel.VERY_HIGH, RiskLevel.CRITICAL].includes(this.riskLevel);
  }

  requiresImmediateAction(): boolean {
    return this.riskLevel === RiskLevel.CRITICAL && 
           this.status === PredictionStatus.ACTIVE && 
           !this.isActionTaken;
  }

  getRiskScore(): number {
    const riskScores = {
      [RiskLevel.VERY_LOW]: 0.1,
      [RiskLevel.LOW]: 0.3,
      [RiskLevel.MODERATE]: 0.5,
      [RiskLevel.HIGH]: 0.7,
      [RiskLevel.VERY_HIGH]: 0.9,
      [RiskLevel.CRITICAL]: 1.0,
    };
    return riskScores[this.riskLevel] || 0.5;
  }

  getTimeToExpiry(): number {
    return Math.max(0, this.expiryDate.getTime() - new Date().getTime());
  }

  getTimeSincePrediction(): number {
    return new Date().getTime() - this.predictionDate.getTime();
  }

  updateStatus(newStatus: PredictionStatus, reviewedBy?: string): void {
    this.status = newStatus;
    if (reviewedBy) {
      this.reviewedBy = reviewedBy;
      this.reviewedAt = new Date();
    }
    this.updatedAt = new Date();
  }

  recordAction(actionTakenBy: string, notes?: string): void {
    this.isActionTaken = true;
    this.actionTakenBy = actionTakenBy;
    this.actionTakenAt = new Date();
    if (notes) {
      this.notes = notes;
    }
    this.updatedAt = new Date();
  }

  addMonitoringData(data: Record<string, any>): void {
    this.monitoringData = {
      ...this.monitoringData,
      ...data,
      lastUpdated: new Date(),
    };
    this.updatedAt = new Date();
  }

  recordOutcome(outcome: Record<string, any>): void {
    this.outcomeData = {
      ...this.outcomeData,
      ...outcome,
      recordedAt: new Date(),
    };
    this.updatedAt = new Date();
  }
}