import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Handover Summary Entity
 * @module HandoverSummaryEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity for storing AI-generated handover summaries
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { IsEnum, IsString, IsDate, IsOptional, IsNumber, IsBoolean, IsObject, Min, Max } from 'class-validator';

export enum ShiftType {
  DAY = 'day',
  EVENING = 'evening',
  NIGHT = 'night'
}

export enum DetailLevel {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  COMPREHENSIVE = 'comprehensive'
}

@Entity('wcn_handover_summaries')
@Index(['departmentId', 'handoverDate'])
@Index(['shiftType', 'handoverDate'])
@Index(['generatedBy', 'createdAt'])
export class HandoverSummary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  summaryId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  handoverDate: Date;

  @Column({ type: 'enum', enum: ShiftType })
  @IsEnum(ShiftType)
  shiftType: ShiftType;

  @Column({ type: 'uuid' })
  @IsString()
  departmentId: string;

  @Column({ type: 'uuid' })
  @IsString()
  generatedBy: string;

  // Structured Summary Data (JSON)
  @Column({ type: 'jsonb' })
  @IsObject()
  residents: {
    totalResidents: number;
    newAdmissions: number;
    discharges: number;
    criticalUpdates: any[];
    medicationChanges: any[];
    carePlanUpdates: any[];
  };

  @Column({ type: 'jsonb' })
  @IsObject()
  medications: {
    totalMedications: number;
    newMedications: number;
    discontinuedMedications: number;
    doseChanges: number;
    prnGiven: number;
    medicationAlerts: any[];
  };

  @Column({ type: 'jsonb' })
  @IsObject()
  incidents: {
    totalIncidents: number;
    criticalIncidents: number;
    falls: number;
    medicationErrors: number;
    behavioralIncidents: number;
    incidentDetails: any[];
  };

  @Column({ type: 'jsonb' })
  @IsObject()
  alerts: {
    totalAlerts: number;
    criticalAlerts: number;
    medicalAlerts: number;
    safetyAlerts: number;
    familyAlerts: number;
    alertDetails: any[];
  };

  // AI Processing Metadata
  @Column({ type: 'jsonb' })
  @IsObject()
  aiProcessing: {
    processingTime: number;
    confidenceScore: number;
    dataSources: string[];
    modelVersion: string;
    qualityScore: number;
  };

  // Compliance
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  gdprCompliant: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  piiMasked: boolean;

  @Column({ type: 'jsonb' })
  @IsObject()
  auditTrail: any[];

  // Organization
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
  get totalUpdates(): number {
    return this.residents.totalResidents + 
           this.medications.totalMedications + 
           this.incidents.totalIncidents + 
           this.alerts.totalAlerts;
  }

  get criticalItemsCount(): number {
    return this.residents.criticalUpdates.length + 
           this.medications.medicationAlerts.filter((a: any) => a.severity === 'critical').length +
           this.incidents.criticalIncidents + 
           this.alerts.criticalAlerts;
  }

  get isHighQuality(): boolean {
    return this.aiProcessing.qualityScore >= 80 && this.aiProcessing.confidenceScore >= 0.8;
  }

  get processingEfficiency(): number {
    // Calculate processing efficiency based on time and quality
    const baseTime = 5000; // 5 seconds baseline
    const timeScore = Math.max(0, 100 - ((this.aiProcessing.processingTime - baseTime) / 100));
    const qualityScore = this.aiProcessing.qualityScore;
    return (timeScore + qualityScore) / 2;
  }
}