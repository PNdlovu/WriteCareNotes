import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview CQC Compliance Entity Models
 * @module CQCComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * CQC Compliance Assessment Entity
 */
@Entity('cqc_compliance_assessments')
export class CQCComplianceAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'enum', enum: ['self_assessment', 'internal_audit', 'mock_inspection', 'preparation'] })
  @IsEnum(['self_assessment', 'internal_audit', 'mock_inspection', 'preparation'])
  assessmentType: string;

  @Column({ type: 'enum', enum: ['outstanding', 'good', 'requires_improvement', 'inadequate'] })
  @IsEnum(['outstanding', 'good', 'requires_improvement', 'inadequate'])
  overallRating: string;

  @Column({ type: 'json' })
  kloeRatings: Record<string, string>;

  @Column({ type: 'json' })
  fundamentalStandardsCompliance: any[];

  @Column({ type: 'json' })
  digitalRecordsCompliance: any;

  @Column({ type: 'json' })
  actionPlan: any;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  assessedBy: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  nextReviewDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * CQC Action Plan Entity
 */
@Entity('cqc_action_plans')
export class CQCActionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  assessmentId: string;

  @Column({ type: 'json' })
  actions: any[];

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  overallProgress: number;

  @Column({ type: 'timestamp' })
  @IsDate()
  targetCompletionDate: Date;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  responsibleManager: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * CQC Inspection Readiness Entity
 */
@Entity('cqc_inspection_readiness')
export class CQCInspectionReadiness {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  readinessScore: number;

  @Column({ type: 'enum', enum: ['not_ready', 'partially_ready', 'ready', 'well_prepared'] })
  @IsEnum(['not_ready', 'partially_ready', 'ready', 'well_prepared'])
  readinessLevel: string;

  @Column({ type: 'json' })
  kloeReadiness: Record<string, number>;

  @Column({ type: 'json' })
  @IsArray()
  criticalIssues: string[];

  @Column({ type: 'json' })
  @IsArray()
  recommendedActions: string[];

  @Column({ type: 'json' })
  documentationStatus: any;

  @Column({ type: 'json' })
  staffPreparedness: any;

  @Column({ type: 'json' })
  systemReadiness: any;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
