import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Professional Standards Entity Models
 * @module ProfessionalStandardsEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Professional Registration Entity
 */
@Entity('professional_registrations')
export class ProfessionalRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  staffId: string;

  @Column({ type: 'enum', enum: ['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc'] })
  @IsEnum(['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc'])
  professionalBody: string;

  @Column({ type: 'var char', length: 50 })
  @IsString()
  registrationNumber: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  registrationDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  expiryDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  renewalDate: Date;

  @Column({ type: 'enum', enum: ['active', 'lapsed', 'suspended', 'removed', 'pending'] })
  @IsEnum(['active', 'lapsed', 'suspended', 'removed', 'pending'])
  status: string;

  @Column({ type: 'enum', enum: ['clear', 'conditions', 'suspension', 'removal', 'interim_order'] })
  @IsEnum(['clear', 'conditions', 'suspension', 'removal', 'interim_order'])
  fitnessToPractise: string;

  @Column({ type: 'timestamp', nullable: true })
  revalidationDate?: Date;

  @Column({ type: 'json' })
  @IsArray()
  annotations: string[];

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @OneToMany(() => ProfessionalQualification, qualification => qualification.registration)
  qualifications: ProfessionalQualification[];

  @OneToMany(() => ContinuingEducationRecord, education => education.registration)
  continuingEducation: ContinuingEducationRecord[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Professional Qualification Entity
 */
@Entity('professional_qualifications')
export class ProfessionalQualification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  qualificationType: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  qualificationName: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  awardingBody: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  dateAwarded: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'enum', enum: ['verified', 'pending', 'unverified'] })
  @IsEnum(['verified', 'pending', 'unverified'])
  verificationStatus: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  certificateNumber?: string;

  @ManyToOne(() => ProfessionalRegistration, registration => registration.qualifications)
  @JoinColumn({ name: 'registration_id' })
  registration: ProfessionalRegistration;

  @Column({ type: 'uuid' })
  @IsString()
  registrationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Continuing Education Record Entity
 */
@Entity('continuing_education_records')
export class ContinuingEducationRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  activityType: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  activityName: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  provider: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  completionDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  hoursCompleted: number;

  @Column({ type: 'text' })
  @IsString()
  relevanceToRole: string;

  @Column({ type: 'text' })
  @IsString()
  reflectionNotes: string;

  @Column({ type: 'json' })
  @IsArray()
  evidenceDocuments: string[];

  @ManyToOne(() => ProfessionalRegistration, registration => registration.continuingEducation)
  @JoinColumn({ name: 'registration_id' })
  registration: ProfessionalRegistration;

  @Column({ type: 'uuid' })
  @IsString()
  registrationId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Professional Standards Assessment Entity
 */
@Entity('professional_standards_assessments')
export class ProfessionalStandardsAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'json' })
  staffAssessments: any[];

  @Column({ type: 'boolean' })
  @IsBoolean()
  overallCompliance: boolean;

  @Column({ type: 'json' })
  complianceByBody: Record<string, number>;

  @Column({ type: 'json' })
  @IsArray()
  criticalIssues: string[];

  @Column({ type: 'json' })
  @IsArray()
  recommendations: string[];

  @Column({ type: 'json' })
  actionPlan: any;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  assessedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
