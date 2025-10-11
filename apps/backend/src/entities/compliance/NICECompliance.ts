import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview NICE Compliance Entity Models
 * @module NICEComplianceEntities
 * @version 1.0.0
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsEnum, IsString, IsNumber, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * NICE Guideline Entity
 */
@Entity('nice_guidelines')
export class NICEGuideline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  guidelineId: string; // e.g., NG97, CG181

  @Column({ type: 'enum', enum: ['clinical_guideline', 'nice_guideline', 'technology_appraisal', 'interventional_procedure', 'medical_technology', 'diagnostic_guidance', 'quality_standard'] })
  @IsEnum(['clinical_guideline', 'nice_guideline', 'technology_appraisal', 'interventional_procedure', 'medical_technology', 'diagnostic_guidance', 'quality_standard'])
  type: string;

  @Column({ type: 'varchar', length: 500 })
  @IsString()
  title: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  publishedDate: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  lastUpdated: Date;

  @Column({ type: 'timestamp' })
  @IsDate()
  nextReviewDate: Date;

  @Column({ type: 'enum', enum: ['current', 'updated', 'withdrawn'] })
  @IsEnum(['current', 'updated', 'withdrawn'])
  status: string;

  @Column({ type: 'text' })
  @IsString()
  scope: string;

  @Column({ type: 'json' })
  @IsArray()
  clinicalAreas: string[];

  @Column({ type: 'json' })
  @IsArray()
  implementationSupport: string[];

  @Column({ type: 'text' })
  @IsString()
  costImpact: string;

  @Column({ type: 'text' })
  @IsString()
  resourceImpact: string;

  @OneToMany(() => NICERecommendation, recommendation => recommendation.guideline)
  recommendations: NICERecommendation[];

  @OneToMany(() => NICEQualityStatement, qualityStatement => qualityStatement.guideline)
  qualityStatements: NICEQualityStatement[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * NICE Recommendation Entity
 */
@Entity('nice_recommendations')
export class NICERecommendation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  guidelineId: string;

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  recommendationNumber: string;

  @Column({ type: 'enum', enum: ['offer', 'consider', 'do_not_offer', 'only_in_research'] })
  @IsEnum(['offer', 'consider', 'do_not_offer', 'only_in_research'])
  strength: string;

  @Column({ type: 'text' })
  @IsString()
  statement: string;

  @Column({ type: 'text' })
  @IsString()
  rationale: string;

  @Column({ type: 'enum', enum: ['high', 'moderate', 'low', 'very_low'] })
  @IsEnum(['high', 'moderate', 'low', 'very_low'])
  evidenceQuality: string;

  @Column({ type: 'json' })
  @IsArray()
  clinicalContext: string[];

  @Column({ type: 'json' })
  @IsArray()
  populationApplicability: string[];

  @Column({ type: 'json' })
  @IsArray()
  implementationConsiderations: string[];

  @Column({ type: 'text' })
  @IsString()
  costEffectiveness: string;

  @Column({ type: 'json' })
  @IsArray()
  monitoringRequirements: string[];

  @ManyToOne(() => NICEGuideline, guideline => guideline.recommendations)
  @JoinColumn({ name: 'guideline_id' })
  guideline: NICEGuideline;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * NICE Quality Statement Entity
 */
@Entity('nice_quality_statements')
export class NICEQualityStatement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  @IsNumber()
  statementNumber: number;

  @Column({ type: 'text' })
  @IsString()
  statement: string;

  @Column({ type: 'text' })
  @IsString()
  rationale: string;

  @Column({ type: 'json' })
  qualityMeasures: any[];

  @Column({ type: 'json' })
  @IsArray()
  audience: string[];

  @Column({ type: 'json' })
  @IsArray()
  implementationGuidance: string[];

  @ManyToOne(() => NICEGuideline, guideline => guideline.qualityStatements)
  @JoinColumn({ name: 'guideline_id' })
  guideline: NICEGuideline;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * NICE Compliance Assessment Entity
 */
@Entity('nice_compliance_assessments')
export class NICEComplianceAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'json' })
  @IsArray()
  guidelinesAssessed: string[];

  @Column({ type: 'boolean' })
  @IsBoolean()
  overallCompliance: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  complianceScore: number;

  @Column({ type: 'json' })
  guidelineCompliance: any[];

  @Column({ type: 'json' })
  @IsArray()
  implementationGaps: string[];

  @Column({ type: 'json' })
  clinicalImpact: any;

  @Column({ type: 'json' })
  @IsArray()
  recommendations: string[];

  @Column({ type: 'json' })
  actionPlan: any;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  assessedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * MHRA Device Registration Entity
 */
@Entity('mhra_device_registrations')
export class MHRADeviceRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  deviceName: string;

  @Column({ type: 'enum', enum: ['class_i', 'class_iia', 'class_iib', 'class_iii', 'software_medical_device'] })
  @IsEnum(['class_i', 'class_iia', 'class_iib', 'class_iii', 'software_medical_device'])
  deviceClass: string;

  @Column({ type: 'enum', enum: ['class_a', 'class_b', 'class_c', 'class_d'] })
  @IsEnum(['class_a', 'class_b', 'class_c', 'class_d'])
  softwareSafetyClass: string;

  @Column({ type: 'text' })
  @IsString()
  intendedPurpose: string;

  @Column({ type: 'json' })
  @IsArray()
  clinicalEvidence: string[];

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  riskClassification: string;

  @Column({ type: 'enum', enum: ['self_declaration', 'notified_body', 'ukca_marking', 'ce_marking'] })
  @IsEnum(['self_declaration', 'notified_body', 'ukca_marking', 'ce_marking'])
  conformityRoute: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registrationNumber?: string;

  @Column({ type: 'boolean' })
  @IsBoolean()
  ukca_marking: boolean;

  @Column({ type: 'boolean' })
  @IsBoolean()
  ce_marking: boolean;

  @Column({ type: 'timestamp', nullable: true })
  registrationDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiryDate?: Date;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'json' })
  manufacturerDetails: any;

  @Column({ type: 'json' })
  technicalDocumentation: any;

  @Column({ type: 'json' })
  clinicalEvaluation: any;

  @Column({ type: 'json' })
  postMarketSurveillance: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * MHRA Compliance Assessment Entity
 */
@Entity('mhra_compliance_assessments')
export class MHRAComplianceAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @IsString()
  organizationId: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  assessmentDate: Date;

  @Column({ type: 'boolean' })
  @IsBoolean()
  overallCompliance: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  complianceScore: number;

  @Column({ type: 'json' })
  @IsArray()
  criticalNonCompliances: string[];

  @Column({ type: 'json' })
  @IsArray()
  recommendations: string[];

  @Column({ type: 'timestamp' })
  @IsDate()
  nextAssessmentDue: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  assessedBy: string;

  @OneToMany(() => MHRADeviceRegistration, device => device.organizationId)
  deviceRegistrations: MHRADeviceRegistration[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}