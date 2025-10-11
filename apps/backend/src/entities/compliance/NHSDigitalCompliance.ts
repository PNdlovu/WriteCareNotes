import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview NHS Digital Compliance Entity Models
 * @module NHSDigitalComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Clinical Risk Assessment Entity (DCB0129)
 */
@Entity('clinical_risk_assessments')
export class ClinicalRiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  title: string;

  @Column({ type: 'text' })
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: ['catastrophic', 'major', 'moderate', 'minor', 'negligible'] })
  @IsEnum(['catastrophic', 'major', 'moderate', 'minor', 'negligible'])
  category: string;

  @Column({ type: 'enum', enum: ['very_high', 'high', 'medium', 'low', 'very_low'] })
  @IsEnum(['very_high', 'high', 'medium', 'low', 'very_low'])
  likelihood: string;

  @Column({ type: 'integer' })
  @IsNumber()
  riskScore: number;

  @Column({ type: 'json' })
  @IsArray()
  mitigationMeasures: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  residualRisk: number;

  @Column({ type: 'text', nullable: true })
  acceptanceRationale?: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  reviewDate: Date;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  assessedBy: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  approvedBy: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  systemComponent: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Clinical Safety Case Report Entity (DCB0160)
 */
@Entity('clinical_safety_case_reports')
export class ClinicalSafetyCaseReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  systemName: string;

  @Column({ type: 'var char', length: 50 })
  @IsString()
  systemVersion: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  deploymentScope: string;

  @Column({ type: 'json' })
  clinicalSafetyOfficer: any;

  @Column({ type: 'json' })
  @IsArray()
  safetyRequirements: string[];

  @Column({ type: 'json' })
  hazardAnalysis: any[];

  @Column({ type: 'json' })
  clinicalEvaluation: any;

  @Column({ type: 'json' })
  postMarketSurveillance: any;

  @Column({ type: 'timestamp' })
  @IsDate()
  reportDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvalDate?: Date;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @OneToMany(() => ClinicalRiskAssessment, assessment => assessment.systemComponent)
  riskAssessments: ClinicalRiskAssessment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * DSPT Assessment Entity
 */
@Entity('dspt_assessments')
export class DSPTAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'var char', length: 20 })
  @IsString()
  assessmentVersion: string;

  @Column({ type: 'enum', enum: ['standards_met', 'approaching_standards', 'standards_not_met'] })
  @IsEnum(['standards_met', 'approaching_standards', 'standards_not_met'])
  overallAssertion: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  overallScore: number;

  @Column({ type: 'json' })
  standardResults: any[];

  @Column({ type: 'json' })
  evidenceItems: any[];

  @Column({ type: 'json' })
  actionPlan: any;

  @Column({ type: 'timestamp', nullable: true })
  submissionDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvalDate?: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  nextAssessmentDue: Date;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  assessedBy: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  approvedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Clinical Safety Officer Entity
 */
@Entity('clinical_safety_officers')
export class ClinicalSafetyOfficer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  name: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  email: string;

  @Column({ type: 'json' })
  @IsArray()
  qualifications: string[];

  @Column({ type: 'timestamp' })
  @IsDate()
  certificationDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  renewalDate: Date;

  @Column({ type: 'json' })
  @IsArray()
  responsibilities: string[];

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * DSPT Evidence Item Entity
 */
@Entity('dspt_evidence_items')
export class DSPTEvidenceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 20 })
  @IsString()
  standardId: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  evidenceType: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  title: string;

  @Column({ type: 'text' })
  @IsString()
  description: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  documentPath?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  url?: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  uploadDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  verifiedBy: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  verificationDate: Date;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isValid: boolean;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * NHS Digital Compliance Monitoring Entity
 */
@Entity('nhs_digital_compliance_monitoring')
export class NHSDigitalComplianceMonitoring {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  monitoringDate: Date;

  @Column({ type: 'json' })
  standardsCompliance: any;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  overallCompliance: number;

  @Column({ type: 'json' })
  @IsArray()
  criticalIssues: string[];

  @Column({ type: 'json' })
  @IsArray()
  recommendations: string[];

  @Column({ type: 'enum', enum: ['excellent', 'good', 'adequate', 'poor'] })
  @IsEnum(['excellent', 'good', 'adequate', 'poor'])
  complianceGrade: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  monitoredBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
