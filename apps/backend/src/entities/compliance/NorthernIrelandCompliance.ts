import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Northern Ireland Compliance Entity Models
 * @module NorthernIrelandComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Northern Ireland Compliance Assessment Entity
 */
@Entity('northern_ireland_compliance_assessments')
export class NorthernIrelandComplianceAssessment {
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
  qualityStandardOutcomes: Record<string, string>;

  @Column({ type: 'json' })
  standardsCriteriaCompliance: any[];

  @Column({ type: 'json' })
  nisccRequirementsCompliance: any[];

  @Column({ type: 'json' })
  hscaniRequirementsCompliance: any[];

  @Column({ type: 'json' })
  digitalRecordsCompliance: any;

  @Column({ type: 'enum', enum: ['compliant', 'substantially_compliant', 'moving_towards_compliance', 'not_compliant'] })
  @IsEnum(['compliant', 'substantially_compliant', 'moving_towards_compliance', 'not_compliant'])
  overallOutcome: string;

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
 * RQIA Service Registration Entity
 */
@Entity('rqia_service_registrations')
export class RQIAServiceRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'enum', enum: ['residential_care', 'nursing_home', 'domiciliary_care', 'supported_living'] })
  @IsEnum(['residential_care', 'nursing_home', 'domiciliary_care', 'supported_living'])
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

  @Column({ type: 'enum', enum: ['compliant', 'substantially_compliant', 'moving_towards_compliance', 'not_compliant'], nullable: true })
  lastInspectionOutcome?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Human Rights Assessment Entity
 */
@Entity('human_rights_assessments')
export class HumanRightsAssessment {
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

  @Column({ type: 'json' })
  rightsAssessment: Record<string, any>;

  @Column({ type: 'boolean' })
  @IsBoolean()
  overallCompliance: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  complianceScore: number;

  @Column({ type: 'json' })
  @IsArray()
  gaps: string[];

  @Column({ type: 'json' })
  @IsArray()
  recommendations: string[];

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
 * NISCC Professional Registration Entity
 */
@Entity('niscc_professional_registrations')
export class NISCCProfessionalRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  staffId: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  nisccRegistrationNumber: string;

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  profession: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  registrationDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  renewalDate: Date;

  @Column({ type: 'enum', enum: ['active', 'lapsed', 'suspended', 'removed'] })
  @IsEnum(['active', 'lapsed', 'suspended', 'removed'])
  status: string;

  @Column({ type: 'integer' })
  @IsNumber()
  cpdHours: number;

  @Column({ type: 'json' })
  @IsArray()
  qualifications: string[];

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  fitnessDeclaration: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  codeOfPracticeCompliance: boolean;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}