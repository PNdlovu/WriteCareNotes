import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Cybersecurity Compliance Entity Models
 * @module CybersecurityComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Cyber Essentials Assessment Entity
 */
@Entity('cyber_essentials_assessments')
export class CyberEssentialsAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'enum', enum: ['cyber_essentials', 'cyber_essentials_plus'] })
  @IsEnum(['cyber_essentials', 'cyber_essentials_plus'])
  assessmentType: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'enum', enum: ['basic', 'plus'] })
  @IsEnum(['basic', 'plus'])
  certificationLevel: string;

  @Column({ type: 'enum', enum: ['pass', 'fail', 'conditional_pass'] })
  @IsEnum(['pass', 'fail', 'conditional_pass'])
  overallResult: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  overallScore: number;

  @Column({ type: 'json' })
  controlAssessments: any[];

  @Column({ type: 'json', nullable: true })
  plusAssessments?: any[];

  @Column({ type: 'json' })
  vulnerabilityFindings: any[];

  @Column({ type: 'json', nullable: true })
  penetrationTestResults?: any[];

  @Column({ type: 'json' })
  certificationStatus: any;

  @Column({ type: 'json' })
  actionPlan: any;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  assessedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  certificationBody?: string;

  @Column({ type: 'timestamp', nullable: true })
  certificationDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Vulnerability Finding Entity
 */
@Entity('vulnerability_findings')
export class VulnerabilityFinding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['critical', 'high', 'medium', 'low', 'informational'] })
  @IsEnum(['critical', 'high', 'medium', 'low', 'informational'])
  severity: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  @IsNumber()
  cvssScore: number;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  title: string;

  @Column({ type: 'text' })
  @IsString()
  description: string;

  @Column({ type: 'json' })
  @IsArray()
  affectedSystems: string[];

  @Column({ type: 'text' })
  @IsString()
  impact: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  likelihood: string;

  @Column({ type: 'json' })
  @IsArray()
  remediation: string[];

  @Column({ type: 'enum', enum: ['open', 'in_progress', 'resolved', 'accepted'] })
  @IsEnum(['open', 'in_progress', 'resolved', 'accepted'])
  status: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  discoveredDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  targetResolutionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  actualResolutionDate?: Date;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Penetration Test Result Entity
 */
@Entity('penetration_test_results')
export class PenetrationTestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ['external', 'internal', 'wireless', 'application'] })
  @IsEnum(['external', 'internal', 'wireless', 'application'])
  testType: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  testDate: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  tester: string;

  @Column({ type: 'json' })
  @IsArray()
  scope: string[];

  @Column({ type: 'text' })
  @IsString()
  methodology: string;

  @Column({ type: 'enum', enum: ['low', 'medium', 'high', 'critical'] })
  @IsEnum(['low', 'medium', 'high', 'critical'])
  overallRisk: string;

  @Column({ type: 'json' })
  @IsArray()
  recommendations: string[];

  @Column({ type: 'boolean' })
  @IsBoolean()
  retestRequired: boolean;

  @Column({ type: 'timestamp', nullable: true })
  retestDate?: Date;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @OneToMany(() => VulnerabilityFinding, finding => finding.organizationId)
  findings: VulnerabilityFinding[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}