import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Scotland Compliance Entity Models
 * @module ScotlandComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Scotland Compliance Assessment Entity
 */
@Entity('scotland_compliance_assessments')
export class ScotlandComplianceAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'uuid' })
  @IsString()
  serviceId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'enum', enum: ['self_assessment', 'internal_audit', 'mock_inspection', 'preparation'] })
  @IsEnum(['self_assessment', 'internal_audit', 'mock_inspection', 'preparation'])
  assessmentType: string;

  @Column({ type: 'json' })
  qualityIndicatorGrades: Record<string, string>;

  @Column({ type: 'json' })
  healthSocialCareStandardsCompliance: any[];

  @Column({ type: 'json' })
  ssscRequirementsCompliance: any[];

  @Column({ type: 'json' })
  digitalRecordsCompliance: any;

  @Column({ type: 'enum', enum: ['excellent', 'very_good', 'good', 'adequate', 'weak', 'unsatisfactory'] })
  @IsEnum(['excellent', 'very_good', 'good', 'adequate', 'weak', 'unsatisfactory'])
  overallGrade: string;

  @Column({ type: 'json' })
  actionPlan: any;

  @Column({ type: 'varchar', length: 255 })
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
 * Scotland Service Registration Entity
 */
@Entity('scotland_service_registrations')
export class ScotlandServiceRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'enum', enum: ['care_home_adults', 'nursing_home', 'housing_support', 'care_at_home'] })
  @IsEnum(['care_home_adults', 'nursing_home', 'housing_support', 'care_at_home'])
  serviceType: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  serviceName: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  registrationNumber: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  registrationDate: Date;

  @Column({ type: 'json' })
  @IsArray()
  conditions: string[];

  @Column({ type: 'integer' })
  @IsNumber()
  maxCapacity: number;

  @Column({ type: 'integer' })
  @IsNumber()
  currentCapacity: number;

  @Column({ type: 'json' })
  managerDetails: any;

  @Column({ type: 'enum', enum: ['active', 'suspended', 'cancelled', 'pending'] })
  @IsEnum(['active', 'suspended', 'cancelled', 'pending'])
  registrationStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  nextInspectionDue?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastInspectionDate?: Date;

  @Column({ type: 'enum', enum: ['excellent', 'very_good', 'good', 'adequate', 'weak', 'unsatisfactory'], nullable: true })
  lastInspectionGrade?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}