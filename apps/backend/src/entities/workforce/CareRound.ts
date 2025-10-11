import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Round Entity for WriteCareNotes
 * @module CareRoundEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for managing care rounds and nursing observations
 * in care home operations with full audit compliance.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional, IsNumber, IsArray, Min, Max } from 'class-validator';

export enum RoundType {
  MORNING_MEDICATION = 'morning_medication',
  MORNING_CARE = 'morning_care',
  LUNCH_MEDICATION = 'lunch_medication',
  AFTERNOON_CARE = 'afternoon_care',
  EVENING_MEDICATION = 'evening_medication',
  EVENING_CARE = 'evening_care',
  BEDTIME_CARE = 'bedtime_care',
  NIGHT_MEDICATION = 'night_medication',
  NIGHT_CHECK = 'night_check',
  EARLY_MORNING_CARE = 'early_morning_care',
  PRN_ROUND = 'prn_round',
  EMERGENCY_ROUND = 'emergency_round',
  OBSERVATION_ROUND = 'observation_round',
  WELLNESS_CHECK = 'wellness_check'
}

export enum RoundStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  INTERRUPTED = 'interrupted'
}

@Entity('wcn_care_rounds')
@Index(['departmentId', 'scheduledStartTime'])
@Index(['assignedNurseId', 'status'])
@Index(['roundType', 'status'])
export class CareRound {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: RoundType })
  @IsEnum(RoundType)
  roundType: RoundType;

  @Column({ type: 'timestamp' })
  @IsDate()
  scheduledStartTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  actualStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  actualEndTime?: Date;

  @Column({ type: 'uuid' })
  @IsString()
  assignedNurseId: string;

  @Column({ type: 'uuid' })
  @IsString()
  departmentId: string;

  @Column({ type: 'json' })
  @IsArray()
  residentList: string[];

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  checklistItems?: string; // Encrypted JSON

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  @IsArray()
  specialFocus?: string[];

  @Column({ type: 'enum', enum: RoundStatus, default: RoundStatus.SCHEDULED })
  @IsEnum(RoundStatus)
  status: RoundStatus;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  residentUpdates?: string; // Encrypted JSON

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  completionRate?: number;

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(600) // Max 10 hours
  actualDuration?: number; // minutes

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  observationsMade?: number;

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  interventionsPerformed?: number;

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  concernsRaised?: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  qualityScore?: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  roundNotes?: string; // Encrypted

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  followUpActions?: string; // Encrypted JSON

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'uuid' })
  @IsString()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isOverdue(): boolean {
    if (this.status === RoundStatus.COMPLETED) return false;
    const now = new Date();
    const scheduledEnd = new Date(this.scheduledStartTime);
    scheduledEnd.setHours(scheduledEnd.getHours() + 2); // 2 hour window
    return now > scheduledEnd;
  }

  get estimatedDuration(): number {
    // Estimate based on round type and resident count
    const baseTimePerResident: { [key in RoundType]: number } = {
      [RoundType.MORNING_MEDICATION]: 10,
      [RoundType.MORNING_CARE]: 15,
      [RoundType.LUNCH_MEDICATION]: 8,
      [RoundType.AFTERNOON_CARE]: 12,
      [RoundType.EVENING_MEDICATION]: 10,
      [RoundType.EVENING_CARE]: 15,
      [RoundType.BEDTIME_CARE]: 20,
      [RoundType.NIGHT_MEDICATION]: 8,
      [RoundType.NIGHT_CHECK]: 5,
      [RoundType.EARLY_MORNING_CARE]: 10,
      [RoundType.PRN_ROUND]: 15,
      [RoundType.EMERGENCY_ROUND]: 20,
      [RoundType.OBSERVATION_ROUND]: 8,
      [RoundType.WELLNESS_CHECK]: 12
    };

    return (baseTimePerResident[this.roundType] || 10) * this.residentList.length;
  }

  get averageTimePerResident(): number | null {
    if (this.actualDuration && this.residentList.length > 0) {
      return Math.round(this.actualDuration / this.residentList.length);
    }
    return null;
  }

  get efficiency(): number | null {
    if (this.actualDuration) {
      const efficiency = (this.estimatedDuration / this.actualDuration) * 100;
      return Math.round(efficiency * 10) / 10;
    }
    return null;
  }
}