import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Wales Compliance Entity Models
 * @module WalesComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Wales Compliance Assessment Entity
 */
@Entity('wales_compliance_assessments')
export class WalesComplianceAssessment {
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
  qualityAreaJudgements: Record<string, string>;

  @Column({ type: 'json' })
  welshLanguageCompliance: any;

  @Column({ type: 'json' })
  scwRequirementsCompliance: any[];

  @Column({ type: 'json' })
  riscawRequirementsCompliance: any[];

  @Column({ type: 'json' })
  digitalRecordsCompliance: any;

  @Column({ type: 'enum', enum: ['excellent', 'good', 'adequate', 'poor'] })
  @IsEnum(['excellent', 'good', 'adequate', 'poor'])
  overallJudgement: string;

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
 * CIW Service Registration Entity
 */
@Entity('ciw_service_registrations')
export class CIWServiceRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'enum', enum: ['care_home_adults', 'domiciliary_care', 'adult_placement', 'advocacy'] })
  @IsEnum(['care_home_adults', 'domiciliary_care', 'adult_placement', 'advocacy'])
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

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  welshLanguageProvision: boolean;

  @Column({ type: 'enum', enum: ['active', 'suspended', 'cancelled', 'pending'] })
  @IsEnum(['active', 'suspended', 'cancelled', 'pending'])
  registrationStatus: string;

  @Column({ type: 'timestamp', nullable: true })
  nextInspectionDue?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastInspectionDate?: Date;

  @Column({ type: 'enum', enum: ['excellent', 'good', 'adequate', 'poor'], nullable: true })
  lastInspectionJudgement?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Welsh Language Active Offer Entity
 */
@Entity('welsh_language_active_offers')
export class WelshLanguageActiveOffer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  serviceId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  implementationDate: Date;

  @Column({ type: 'json' })
  activeOfferPolicy: any;

  @Column({ type: 'json' })
  staffTraining: any;

  @Column({ type: 'json' })
  serviceDelivery: any;

  @Column({ type: 'json' })
  qualityMonitoring: any;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  complianceScore: number;

  @Column({ type: 'timestamp' })
  @IsDate()
  lastReviewDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  nextReviewDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * SCW Professional Registration Entity
 */
@Entity('scw_professional_registrations')
export class SCWProfessionalRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  staffId: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  scwRegistrationNumber: string;

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

  @Column({ type: 'enum', enum: ['fluent', 'conversational', 'basic', 'none'] })
  @IsEnum(['fluent', 'conversational', 'basic', 'none'])
  welshLanguageSkills: string;

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