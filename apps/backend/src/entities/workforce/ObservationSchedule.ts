import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Observation Schedule Entity for WriteCareNotes
 * @module ObservationScheduleEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for managing resident observation schedules
 * and monitoring requirements in care home operations.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Resident } from '../resident/Resident';

export enum ObservationType {
  VITAL_SIGNS = 'vital_signs',
  BEHAVIORAL = 'behavioral',
  MOBILITY = 'mobility',
  NUTRITION = 'nutrition',
  HYDRATION = 'hydration',
  PAIN_ASSESSMENT = 'pain_assessment',
  MENTAL_STATE = 'mental_state',
  SKIN_INTEGRITY = 'skin_integrity',
  MEDICATION_EFFECTS = 'medication_effects',
  SLEEP_PATTERN = 'sleep_pattern',
  SOCIAL_INTERACTION = 'social_interaction',
  COGNITIVE_FUNCTION = 'cognitive_function',
  SAFETY_CHECK = 'safety_check',
  WELLNESS_CHECK = 'wellness_check'
}

export enum ObservationFrequency {
  HOURLY = 'hourly',
  TWO_HOURLY = 'two_hourly',
  FOUR_HOURLY = 'four_hourly',
  TWICE_DAILY = 'twice_daily',
  DAILY = 'daily',
  TWICE_WEEKLY = 'twice_weekly',
  WEEKLY = 'weekly',
  AS_NEEDED = 'as_needed',
  CONTINUOUS = 'continuous'
}

export enum ObservationStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  IN_PROGRESS = 'in_progress'
}

@Entity('wcn_observation_schedules')
@Index(['residentId', 'observationType'])
@Index(['assignedStaffId', 'status'])
@Index(['scheduledTime', 'status'])
export class ObservationSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  residentId: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({ type: 'enum', enum: ObservationType })
  @IsEnum(ObservationType)
  observationType: ObservationType;

  @Column({ type: 'enum', enum: ObservationFrequency })
  @IsEnum(ObservationFrequency)
  frequency: ObservationFrequency;

  @Column({ type: 'timestamp' })
  @IsDate()
  scheduledTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  actualTime?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @Column({ type: 'text' })
  @IsString()
  specificInstructions: string; // Encrypted

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  alertThresholds?: string; // Encrypted JSON

  @Column({ type: 'enum', enum: ObservationStatus, default: ObservationStatus.SCHEDULED })
  @IsEnum(ObservationStatus)
  status: ObservationStatus;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  observationResults?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  concernsRaised?: string; // Encrypted JSON

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  followUpRequired: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  followUpNotes?: string; // Encrypted

  @Column({ type: 'uuid' })
  @IsString()
  departmentId: string;

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
    if (this.status === ObservationStatus.COMPLETED) return false;
    return new Date() > this.scheduledTime;
  }

  get nextScheduledTime(): Date | null {
    const frequencyHours: { [key in ObservationFrequency]: number } = {
      [ObservationFrequency.HOURLY]: 1,
      [ObservationFrequency.TWO_HOURLY]: 2,
      [ObservationFrequency.FOUR_HOURLY]: 4,
      [ObservationFrequency.TWICE_DAILY]: 12,
      [ObservationFrequency.DAILY]: 24,
      [ObservationFrequency.TWICE_WEEKLY]: 84, // 3.5 days
      [ObservationFrequency.WEEKLY]: 168,
      [ObservationFrequency.AS_NEEDED]: 0,
      [ObservationFrequency.CONTINUOUS]: 0
    };

    const hours = frequencyHours[this.frequency];
    if (hours === 0) return null;

    const nextTime = new Date(this.scheduledTime);
    nextTime.setHours(nextTime.getHours() + hours);
    return nextTime;
  }
}