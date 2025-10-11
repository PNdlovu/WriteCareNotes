import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Task Entity for WriteCareNotes
 * @module CareTaskEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for managing individual care tasks
 * in daily care operations.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Resident } from '../resident/Resident';
import { DailyCareSchedule, CareTaskType, TaskPriority, TaskStatus } from './DailyCareSchedule';

export enum TaskCategory {
  ESSENTIAL_CARE = 'essential_care',
  MEDICATION = 'medication',
  THERAPY = 'therapy',
  SOCIAL_CARE = 'social_care',
  HEALTH_MONITORING = 'health_monitoring',
  DOCUMENTATION = 'documentation',
  FAMILY_LIAISON = 'family_liaison',
  MAINTENANCE = 'maintenance'
}

@Entity('wcn_care_tasks')
@Index(['residentId', 'scheduledTime'])
@Index(['assignedStaffId', 'status'])
@Index(['priority', 'status'])
@Index(['taskType', 'scheduledTime'])
export class CareTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  scheduleId: string;

  @ManyToOne(() => DailyCareSchedule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'scheduleId' })
  schedule: DailyCareSchedule;

  @Column({ type: 'uuid' })
  @IsString()
  residentId: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({ type: 'enum', enum: CareTaskType })
  @IsEnum(CareTaskType)
  taskType: CareTaskType;

  @Column({ type: 'enum', enum: TaskCategory })
  @IsEnum(TaskCategory)
  category: TaskCategory;

  @Column({ type: 'var char', length: 500 })
  @IsString()
  description: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  scheduledTime: Date;

  @Column({ type: 'integer' })
  @IsNumber()
  @Min(1)
  @Max(480) // Max 8 hours
  estimatedDuration: number; // minutes

  @Column({ type: 'integer', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(480)
  actualDuration?: number; // minutes

  @Column({ type: 'var char', length: 50 })
  @IsString()
  skillLevelRequired: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @Column({ type: 'enum', enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority: TaskPriority;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  @IsArray()
  equipmentRequired?: string[];

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  specialInstructions?: string; // Encrypted

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.SCHEDULED })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  actualStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  actualEndTime?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  completedBy?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string; // Encrypted

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  outcome?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  followUpRequired: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  followUpNotes?: string; // Encrypted

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  qualityRating?: number;

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
    if (this.status === TaskStatus.COMPLETED) return false;
    return new Date() > this.scheduledTime;
  }

  get efficiency(): number | null {
    if (this.actualDuration && this.estimatedDuration) {
      return Math.round((this.estimatedDuration / this.actualDuration) * 100);
    }
    return null;
  }

  get timeVariance(): number | null {
    if (this.actualDuration && this.estimatedDuration) {
      return this.actualDuration - this.estimatedDuration;
    }
    return null;
  }

  get completionDelay(): number | null {
    if (this.actualEndTime && this.scheduledTime) {
      const scheduledEnd = new Date(this.scheduledTime);
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + this.estimatedDuration);
      return Math.round((this.actualEndTime.getTime() - scheduledEnd.getTime()) / (1000 * 60));
    }
    return null;
  }
}
