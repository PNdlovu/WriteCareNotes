import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Shift Handover Entity for WriteCareNotes
 * @module ShiftHandoverEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for managing shift handovers in care home operations
 * with comprehensive data tracking and audit compliance.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional, IsNumber, IsBoolean, Min, Max } from 'class-validator';

export enum ShiftType {
  DAY = 'day',
  EVENING = 'evening', 
  NIGHT = 'night',
  WEEKEND = 'weekend',
  BANK_HOLIDAY = 'bank_holiday'
}

export enum HandoverStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled'
}

export enum HandoverPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  URGENT = 'urgent'
}

@Entity('wcn_shift_handovers')
@Index(['departmentId', 'handoverDate'])
@Index(['outgoingStaffId', 'incomingStaffId'])
@Index(['status', 'priority'])
export class ShiftHandover {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ShiftType })
  @IsEnum(ShiftType)
  fromShift: ShiftType;

  @Column({ type: 'enum', enum: ShiftType })
  @IsEnum(ShiftType)
  toShift: ShiftType;

  @Column({ type: 'timestamp' })
  @IsDate()
  handoverDate: Date;

  @Column({ type: 'uuid' })
  @IsString()
  outgoingStaffId: string;

  @Column({ type: 'uuid' })
  @IsString()
  incomingStaffId: string;

  @Column({ type: 'uuid' })
  @IsString()
  departmentId: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  residentUpdates?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  generalUpdates?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  criticalAlerts?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  medicationChanges?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  incidentReports?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  specialInstructions?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  environmentalConcerns?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  equipmentIssues?: string; // Encrypted JSON

  @Column({ type: 'enum', enum: HandoverStatus, default: HandoverStatus.PENDING })
  @IsEnum(HandoverStatus)
  status: HandoverStatus;

  @Column({ type: 'enum', enum: HandoverPriority, default: HandoverPriority.MEDIUM })
  @IsEnum(HandoverPriority)
  priority: HandoverPriority;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  scheduledTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  actualStartTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  completedAt?: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  incomingStaffConfirmation: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  questionsAsked?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  clarificationsProvided?: string; // Encrypted JSON

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  additionalNotes?: string; // Encrypted

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  handoverQuality?: number;

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
  get handoverDuration(): number | null {
    if (this.completedAt && this.actualStartTime) {
      return (this.completedAt.getTime() - this.actualStartTime.getTime()) / (1000 * 60);
    }
    return null;
  }

  get isOverdue(): boolean {
    if (this.status === HandoverStatus.COMPLETED) return false;
    if (!this.scheduledTime) return false;
    return new Date() > this.scheduledTime;
  }

  get criticalAlertsCount(): number {
    try {
      if (!this.criticalAlerts) return 0;
      const alerts = JSON.parse(this.criticalAlerts);
      return alerts.filter((alert: any) => alert.severity === 'critical').length;
    } catch {
      return 0;
    }
  }
}
