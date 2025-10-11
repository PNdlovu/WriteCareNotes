/**
 * Policy Template Entity - Pre-built Editable Templates
 * 
 * Implements the PolicyGovernanceEngine template libraryfor:
 * - Safeguarding policies
 * - Data protection policies  
 * - Complaints handling policies
 * - Health & safety policies
 * - Medication management policies
 * - Staff training policies
 * - Emergency procedures
 * - Visitor management policies
 */

import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { IsNotEmpty, IsEnum, IsUUID, IsOptional, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  DATA_PROTECTION = 'data_protection',
  COMPLAINTS = 'complaints',
  HEALTH_SAFETY = 'health_safety',
  MEDICATION = 'medication',
  INFECTION_CONTROL = 'infection_control',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY_PROCEDURES = 'emergency_procedures',
  DIGNITY_RESPECT = 'dignity_respect',
  NUTRITION_HYDRATION = 'nutrition_hydration',
  END_OF_LIFE = 'end_of_life',
  MENTAL_CAPACITY = 'mental_capacity',
  VISITORS = 'visitors',
  TRANSPORT = 'transport',
  ACCOMMODATION = 'accommodation'
}

export enum Jurisdiction {
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

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

export interface RichTextContent {
  type: 'doc';
  content: Array<{
    type: string; // 'heading', 'paragraph', 'list', 'table'
    attrs?: Record<string, any>; // Heading level, list type, etc.
    content?: Array<{
      type: string; // 'text'
      text?: string;
      marks?: Array<{ // Bold, italic, underline, etc.
        type: string;
        attrs?: Record<string, any>;
      }>;
    }>;
  }>;
}

export interface TemplateField {
  id: string;
  name: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'number' | 'rich_text';
  label: string;
  description?: string;
  required: boolean;
  defaultValue?: any;
  options?: string[]; // For select fields
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  helpText?: string;
  jurisdiction?: Jurisdiction[];
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  fields: TemplateField[];
  conditionalDisplay?: {
    dependsOn: string; // Field ID
    condition: 'equals' | 'not_equals' | 'contains';
    value: any;
  };
}

export interface ComplianceMapping {
  standard: string; // e.g., 'CQC-KLOE-1', 'GDPR-Article-6'
  requirement: string;
  description: string;
  evidenceRequired: string[];
}

@Entity('policy_templates')
@Index(['category', 'jurisdiction'])
@Index(['status', 'organizationId'])
export class PolicyTemplate {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID()
  id!: string;

  @Column({ length: 255 })
  @IsNotEmpty()
  title!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description?: string;

  @Column({ type: 'enum', enum: PolicyCategory })
  @IsEnum(PolicyCategory)
  category!: PolicyCategory;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.ACTIVE })
  @IsEnum(TemplateStatus)
  status!: TemplateStatus;

  @Column({ type: 'simple-array' })
  @IsArray()
  jurisdiction!: Jurisdiction[];

  @Column({ type: 'jsonb' })
  @ValidateNested()
  @Type(() => Object)
  content!: RichTextContent;

  @Column({ type: 'jsonb', default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  sections!: TemplateSection[];

  @Column({ type: 'jsonb', default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  customizableFields!: TemplateField[];

  @Column({ type: 'jsonb', default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  complianceMapping!: ComplianceMapping[];

  @Column({ type: 'simple-array', default: [] })
  @IsArray()
  linkedModules!: string[];

  @Column({ type: 'simple-array', default: [] })
  @IsArray()
  tags!: string[];

  @Column({ length: 50, nullable: true })
  @IsOptional()
  version?: string;

  @Column({ type: 'int', default: 0 })
  usageCount!: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageRating!: number;

  @Column({ type: 'int', default: 0 })
  reviewCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  metadata?: {
    estimatedTimeToComplete?: number; // minutes
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    requiredRoles?: string[];
    supportingDocuments?: string[];
    relatedPolicies?: string[];
    implementationNotes?: string;
    reviewFrequency?: 'monthly' | 'quarterly' | 'annually' | 'biannually';
  };

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isSystemTemplate!: boolean; // Built-in templates vs custom org templates

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresApproval!: boolean;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  updatedBy?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // Relations would be added here if needed
  // @ManyToOne(() => Organization)
  // @JoinColumn({ name: 'organizationId' })
  // organization?: Organization;

  // @ManyToOne(() => User)
  // @JoinColumn({ name: 'createdBy' })
  // creator?: User;

  /**
   * Check if template is available for given jurisdiction
   */
  isAvailableForJurisdiction(jurisdiction: Jurisdiction): boolean {
    return this.jurisdiction.includes(jurisdiction);
  }

  /**
   * Check if template is compatible with given modules
   */
  isCompatibleWithModules(modules: string[]): boolean {
    return modules.some(module => this.linkedModules.includes(module));
  }

  /**
   * Get compliance requirements for specific standard
   */
  getComplianceRequirements(standard: string): ComplianceMapping[] {
    return this.complianceMapping.filter(mapping => 
      mapping.standard.toLowerCase().includes(standard.toLowerCase())
    );
  }

  /**
   * Increment usage count
   */
  incrementUsage(): void {
    this.usageCount += 1;
  }

  /**
   * Add rating and update average
   */
  addRating(rating: number): void {
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    const totalRating = this.averageRating * this.reviewCount + rating;
    this.reviewCount += 1;
    this.averageRating = Number((totalRating / this.reviewCount).toFixed(2));
  }

  /**
   * Check if template needs update based on age
   */
  needsUpdate(): boolean {
    const now = new Date();
    const monthsSinceUpdate = (now.getTime() - this.updatedAt.getTime()) / (1000 * 60 * 60 * 24 * 30);
    
    // Templates should bereviewed:
    // - Monthlytemplates: every month
    // - Quarterlytemplates: every 3 months  
    // - Annuallytemplates: every 12 months
    // - Default: every 6 months
    
    const reviewFrequency = this.metadata?.reviewFrequency || 'biannually';
    const thresholdMonths = {
      monthly: 1,
      quarterly: 3,
      biannually: 6,
      annually: 12
    };

    return monthsSinceUpdate >= thresholdMonths[reviewFrequency];
  }

  /**
   * Get template complexity score (1-10)
   */
  getComplexityScore(): number {
    let score = 1;
    
    // Base score from sections and fields
    score += this.sections.length * 0.5;
    score += this.customizableFields.length * 0.3;
    
    // Compliance complexity
    score += this.complianceMapping.length * 0.4;
    
    // Jurisdiction complexity (more jurisdictions = more complex)
    score += this.jurisdiction.length * 0.2;
    
    // Metadata difficulty
    if (this.metadata?.difficultyLevel) {
      const difficultyBonus = {
        beginner: 0,
        intermediate: 1,
        advanced: 2
      };
      score += difficultyBonus[this.metadata.difficultyLevel];
    }
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }

  /**
   * Generate template summary for display
   */
  getSummary(): {
    title: string;
    category: string;
    jurisdiction: string[];
    complexity: number;
    estimatedTime: number;
    usageCount: number;
    rating: number;
    lastUpdated: Date;
  } {
    return {
      title: this.title,
      category: this.category,
      jurisdiction: this.jurisdiction,
      complexity: this.getComplexityScore(),
      estimatedTime: this.metadata?.estimatedTimeToComplete || 60,
      usageCount: this.usageCount,
      rating: this.averageRating,
      lastUpdated: this.updatedAt
    };
  }
}
