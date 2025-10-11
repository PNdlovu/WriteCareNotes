/**
 * @fileoverview Policy Template Entity
 * @description Entity model for policy templates in the care home management system
 * @version 2.0.0
 * @author WriteCareNotes Development Team
 * @created 2025-01-06
 * @lastModified 2025-01-06
 * 
 * @compliance
 * - GDPR Article 5 (Data minimization)
 * - ISO 27001 (Information Security)
 * - Care Quality Commission standards
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany
} from 'typeorm';
import { PolicyInstance } from './policy-instance.entity';

/**
 * Policy categories for care home operations
 */
export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  MEDICATION = 'medication',
  INFECTION_CONTROL = 'infection_control',
  HEALTH_SAFETY = 'health_safety',
  DATA_PROTECTION = 'data_protection',
  DIGNITY_RESPECT = 'dignity_respect',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  NUTRITION_HYDRATION = 'nutrition_hydration',
  END_OF_LIFE = 'end_of_life',
  MENTAL_CAPACITY = 'mental_capacity',
  COMPLAINTS = 'complaints',
  VISITORS = 'visitors',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation'
}

/**
 * Regulatory jurisdictions for compliance
 */
export enum RegulatoryJurisdiction {
  ENGLAND_CQC = 'england_cqc',
  SCOTLAND_CI = 'scotland_ci',
  WALES_CIW = 'wales_ciw',
  NORTHERN_IRELAND_RQIA = 'northern_ireland_rqia',
  JERSEY_JCC = 'jersey_jcc',
  GUERNSEY_GCC = 'guernsey_gcc',
  ISLE_OF_MAN_IMC = 'isle_of_man_imc',
  EU_GDPR = 'eu_gdpr',
  UK_DATA_PROTECTION = 'uk_data_protection'
}

/**
 * Template variable definition interface
 */
export interface PolicyTemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: string;
  };
}

/**
 * PolicyTemplate Entity
 * 
 * Stores policy templates that can be used to generate organization-specific policies.
 * Templates support variable substitution and regulatory compliance requirements.
 */
@Entity('policy_templates')
@Index(['category', 'isActive'])
@Index(['jurisdiction'])
@Index(['title', 'category'])
export class PolicyTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Template title
   * @example "Medication Administration Policy"
   */
  @Column({ type: 'varchar', length: 255 })
  @Index()
  title: string;

  /**
   * Policy category for organization
   */
  @Column({
    type: 'enum',
    enum: PolicyCategory
  })
  category: PolicyCategory;

  /**
   * Applicable regulatory jurisdictions
   */
  @Column({
    type: 'enum',
    enum: RegulatoryJurisdiction,
    array: true
  })
  jurisdiction: RegulatoryJurisdiction[];

  /**
   * Template description
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * Template content with variable placeholders
   * Uses {{variableName}} syntax for substitution
   */
  @Column({ type: 'text' })
  content: string;

  /**
   * Variable definitions for template
   */
  @Column({ type: 'jsonb' })
  variables: PolicyTemplateVariable[];

  /**
   * Template version
   * @example "1.0.0"
   */
  @Column({ type: 'varchar', length: 20 })
  version: string;

  /**
   * Whether template is active and available for use
   */
  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  /**
   * Date when template becomes effective
   */
  @Column({ type: 'timestamp' })
  effectiveDate: Date;

  /**
   * Review frequency in months
   */
  @Column({ type: 'integer' })
  reviewFrequency: number;

  /**
   * Who approved this template
   */
  @Column({ type: 'varchar', length: 255 })
  approvedBy: string;

  /**
   * Template tags for searching and categorization
   */
  @Column({ type: 'varchar', array: true, default: [] })
  tags: string[];

  /**
   * Who created this template
   */
  @Column({ type: 'uuid' })
  createdBy: string;

  /**
   * Who last updated this template
   */
  @Column({ type: 'uuid' })
  updatedBy: string;

  /**
   * When template was created
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * When template was last updated
   */
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * Policy instances generated from this template
   */
  @OneToMany(() => PolicyInstance, (instance) => instance.template)
  instances: PolicyInstance[];

  /**
   * Get template variables by type
   */
  getVariablesByType(type: string): PolicyTemplateVariable[] {
    return this.variables.filter(variable => variable.type === type);
  }

  /**
   * Get required variables
   */
  getRequiredVariables(): PolicyTemplateVariable[] {
    return this.variables.filter(variable => variable.required);
  }

  /**
   * Validate if template is ready for use
   */
  isReadyForUse(): boolean {
    return this.isActive && 
           this.effectiveDate <= new Date() && 
           this.content.length > 0 && 
           this.variables.length >= 0;
  }

  /**
   * Check if template applies to jurisdiction
   */
  appliesToJurisdiction(jurisdiction: RegulatoryJurisdiction): boolean {
    return this.jurisdiction.includes(jurisdiction);
  }

  /**
   * Get template metadata for API responses
   */
  getMetadata() {
    return {
      id: this.id,
      title: this.title,
      category: this.category,
      jurisdiction: this.jurisdiction,
      description: this.description,
      version: this.version,
      isActive: this.isActive,
      effectiveDate: this.effectiveDate,
      reviewFrequency: this.reviewFrequency,
      variableCount: this.variables.length,
      requiredVariableCount: this.getRequiredVariables().length,
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}