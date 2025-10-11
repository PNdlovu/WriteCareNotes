import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Brexit Trade Compliance Entity Models
 * @module BrexitTradeComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Brexit Trade Documentation Entity
 */
@Entity('brexit_trade_documentation')
export class BrexitTradeDocumentation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'enum', enum: ['eori_number', 'customs_declaration', 'certificate_of_origin', 'commercial_invoice', 'packing_list', 'export_licence', 'import_licence', 'health_certificate', 'ukca_marking', 'ce_marking'] })
  @IsEnum(['eori_number', 'customs_declaration', 'certificate_of_origin', 'commercial_invoice', 'packing_list', 'export_licence', 'import_licence', 'health_certificate', 'ukca_marking', 'ce_marking'])
  documentationType: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  documentNumber: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  issuedDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  issuingAuthority: string;

  @Column({ type: 'enum', enum: ['valid', 'expired', 'pending', 'rejected', 'not_required'] })
  @IsEnum(['valid', 'expired', 'pending', 'rejected', 'not_required'])
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  validationDate?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  documentPath?: string;

  @Column({ type: 'json' })
  @IsArray()
  relatedDocuments: string[];

  @Column({ type: 'json' })
  @IsArray()
  complianceNotes: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * EORI Registration Entity
 */
@Entity('eori_registrations')
export class EORIRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'var char', length: 20 })
  @IsString()
  eoriNumber: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  registrationDate: Date;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  organizationName: string;

  @Column({ type: 'text' })
  @IsString()
  businessAddress: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  businessType: string;

  @Column({ type: 'json' })
  @IsArray()
  tradeActivities: string[];

  @Column({ type: 'enum', enum: ['active', 'suspended', 'cancelled'] })
  @IsEnum(['active', 'suspended', 'cancelled'])
  status: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  validationDate: Date;

  @Column({ type: 'var char', length: 50 })
  @IsString()
  hmrcReference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * UK Conformity Assessment Entity
 */
@Entity('uk_conformity_assessments')
export class UKConformityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'var char', length: 255 })
  @IsString()
  productName: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  productCategory: string;

  @Column({ type: 'enum', enum: ['ukca_marking', 'ce_marking_valid', 'dual_marking', 'transition_period'] })
  @IsEnum(['ukca_marking', 'ce_marking_valid', 'dual_marking', 'transition_period'])
  conformityType: string;

  @Column({ type: 'boolean' })
  @IsBoolean()
  ukca_marking: boolean;

  @Column({ type: 'boolean' })
  @IsBoolean()
  ce_marking: boolean;

  @Column({ type: 'timestamp' })
  @IsDate()
  transitionPeriodEnd: Date;

  @Column({ type: 'enum', enum: ['compliant', 'non_compliant', 'transitioning'] })
  @IsEnum(['compliant', 'non_compliant', 'transitioning'])
  complianceStatus: string;

  @Column({ type: 'json' })
  @IsArray()
  requiredActions: string[];

  @Column({ type: 'json' })
  deadlines: Date[];

  @Column({ type: 'var char', length: 255, nullable: true })
  certificationBody?: string;

  @Column({ type: 'boolean' })
  @IsBoolean()
  declarationOfConformity: boolean;

  @Column({ type: 'boolean' })
  @IsBoolean()
  technicalDocumentation: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Customs Declaration Entity
 */
@Entity('customs_declarations')
export class CustomsDeclaration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'enum', enum: ['import', 'export'] })
  @IsEnum(['import', 'export'])
  declarationType: string;

  @Column({ type: 'var char', length: 20 })
  @IsString()
  commodityCode: string;

  @Column({ type: 'text' })
  @IsString()
  commodityDescription: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  @IsNumber()
  value: number;

  @Column({ type: 'var char', length: 3 })
  @IsString()
  currency: string;

  @Column({ type: 'var char', length: 2 })
  @IsString()
  originCountry: string;

  @Column({ type: 'var char', length: 2 })
  @IsString()
  destinationCountry: string;

  @Column({ type: 'enum', enum: ['green', 'amber', 'red'] })
  @IsEnum(['green', 'amber', 'red'])
  btomClassification: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  dutyRate: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  vatRate: number;

  @Column({ type: 'timestamp' })
  @IsDate()
  declarationDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  clearanceDate?: Date;

  @Column({ type: 'enum', enum: ['submitted', 'cleared', 'held', 'rejected'] })
  @IsEnum(['submitted', 'cleared', 'held', 'rejected'])
  status: string;

  @Column({ type: 'var char', length: 50 })
  @IsString()
  referenceNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * Brexit Compliance Assessment Entity
 */
@Entity('brexit_compliance_assessments')
export class BrexitComplianceAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'json' })
  tradeDocumentationCompliance: any;

  @Column({ type: 'json' })
  ukca_markingCompliance: any;

  @Column({ type: 'json' })
  customsComplianceStatus: any;

  @Column({ type: 'json' })
  dataFlowCompliance: any;

  @Column({ type: 'boolean' })
  @IsBoolean()
  overallCompliance: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  complianceScore: number;

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
