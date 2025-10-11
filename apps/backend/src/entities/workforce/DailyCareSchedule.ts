import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Daily Care Schedule Entity for WriteCareNotes
 * @module DailyCareScheduleEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for managing daily care schedules and task organization
 * in care home operations.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export enum CareTaskType {
  PERSONAL_CARE = 'personal_care',
  MEDICATION_ADMINISTRATION = 'medication_administration',
  MOBILITY_ASSISTANCE = 'mobility_assistance',
  NUTRITION_SUPPORT = 'nutrition_support',
  SOCIAL_INTERACTION = 'social_interaction',
  HEALTH_MONITORING = 'health_monitoring',
  THERAPY_SESSION = 'therapy_session',
  APPOINTMENT_TRANSPORT = 'appointment_transport',
  FAMILY_COMMUNICATION = 'family_communication',
  DOCUMENTATION = 'documentation'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  URGENT = 'urgent'
}

export enum TaskStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  DEFERRED = 'deferred'
}

@Entity('wcn_daily_care_schedules')
@Index(['departmentId', 'scheduleDate'])
@Index(['status', 'scheduleDate'])
export class DailyCareSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  @IsDate()
  scheduleDate: Date;

  @Column({ type: 'uuid' })
  @IsString()
  departmentId: string;

  @Column({ type: 'text' })
  @IsString()
  residentCareSchedules: string; // Encrypted JSON

  @Column({ type: 'text' })
  @IsString()
  staffAllocations: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  specialEvents?: string; // Encrypted JSON

  @Column({ type: 'integer' })
  @IsNumber()
  @Min(0)
  totalTasks: number;

  @Column({ type: 'integer' })
  @IsNumber()
  @Min(0)
  totalObservations: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  @Min(0)
  @Max(100)
  estimatedWorkload: number; // percentage

  @Column({ type: 'varchar', length: 50, default: 'active' })
  @IsString()
  status: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  optimizationApplied: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  optimizationTimestamp?: Date;

  @Column({ type: 'uuid' })
  @IsString()
  createdBy: string;

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
}