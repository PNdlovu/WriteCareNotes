import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Shift Report Entity for WriteCareNotes
 * @module ShiftReportEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for managing shift reports and daily summaries
 * in care home operations.
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional } from 'class-validator';

export enum ReportType {
  SHIFT_HANDOVER = 'shift_handover',
  DAILY_SUMMARY = 'daily_summary',
  WEEKLY_SUMMARY = 'weekly_summary',
  INCIDENT_SUMMARY = 'incident_summary',
  CARE_QUALITY = 'care_quality'
}

@Entity('wcn_shift_reports')
@Index(['departmentId', 'reportDate'])
@Index(['reportType', 'reportDate'])
export class ShiftReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsString()
  handoverId?: string;

  @Column({ type: 'enum', enum: ReportType })
  @IsEnum(ReportType)
  reportType: ReportType;

  @Column({ type: 'date' })
  @IsDate()
  reportDate: Date;

  @Column({ type: 'uuid' })
  @IsString()
  departmentId: string;

  @Column({ type: 'uuid' })
  @IsString()
  generatedBy: string;

  @Column({ type: 'text' })
  @IsString()
  reportData: string; // Encrypted JSON

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