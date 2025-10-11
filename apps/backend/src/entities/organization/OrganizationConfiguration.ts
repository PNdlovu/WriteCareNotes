import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Organization Configuration Entity for WriteCareNotes
 * @module OrganizationConfigurationEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Configuration management entity supporting inheritance,
 * overrides, and policy deployment across organizational hierarchies.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { 
  IsUUID, 
  IsEnum, 
  IsString, 
  IsBoolean, 
  IsDate, 
  IsOptional, 
  Length,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Organization } from './Organization';

/**
 * Configuration category enumeration
 */
export enum ConfigurationCategory {
  SYSTEM = 'system',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  OPERATIONAL = 'operational',
  FINANCIAL = 'financial',
  CLINICAL = 'clinical',
  HR = 'hr',
  REPORTING = 'reporting',
  INTEGRATION = 'integration',
  BRANDING = 'branding',
  WORKFLOW = 'workflow',
  NOTIFICATION = 'notification'
}

/**
 * Configuration status enumeration
 */
export enum ConfigurationStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
  ARCHIVED = 'archived'
}

/**
 * Inheritance type enumeration
 */
export enum InheritanceType {
  INHERIT = 'inherit',
  OVERRIDE = 'override',
  MERGE = 'merge',
  BLOCK = 'block'
}

/**
 * Configuration scope enumeration
 */
export enum ConfigurationScope {
  GLOBAL = 'global',
  TENANT = 'tenant',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  TEAM = 'team',
  USER = 'user'
}

/**
 * Configuration inheritance rule
 */
export interface InheritanceRule {
  ruleId: string;
  ruleName: string;
  inheritanceType: InheritanceType;
  conditions: InheritanceCondition[];
  priority: number;
  isActive: boolean;
}

export interface InheritanceCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

/**
 * Configuration override
 */
export interface ConfigurationOverride {
  overrideId: string;
  overrideName: string;
  targetPath: string;
  overrideValue: any;
  reason: string;
  approvedBy?: string;
  approvedDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
}

/**
 * Configuration template
 */
export interface ConfigurationTemplate {
  templateId: string;
  templateName: string;
  templateType: string;
  templateData: Record<string, any>;
  applicableTypes: string[];
  isDefault: boolean;
  version: string;
}

/**
 * Configuration validation rule
 */
export interface ConfigurationValidation {
  validationId: string;
  validationName: string;
  validationType: 'schema' | 'business' | 'compliance' | 'security';
  validationRules: ValidationRule[];
  isRequired: boolean;
  errorMessage: string;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  required: boolean;
  const raints?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * Configuration deployment information
 */
export interface ConfigurationDeployment {
  deploymentId: string;
  deploymentType: 'immediate' | 'scheduled' | 'phased';
  deploymentDate: Date;
  targetOrganizations: string[];
  rollbackPlan: RollbackPlan;
  successCriteria: SuccessCriteria[];
  notifications: DeploymentNotification[];
}

export interface RollbackPlan {
  rollbackTriggers: string[];
  rollbackProcedure: string[];
  rollbackTimeout: number;
  automaticRollback: boolean;
}

export interface SuccessCriteria {
  metric: string;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  measurementPeriod: number;
}

export interface DeploymentNotification {
  notificationType: 'email' | 'sms' | 'webhook' | 'dashboard';
  recipients: string[];
  template: string;
  triggers: string[];
}

/**
 * Configuration versioning
 */
export interface ConfigurationVersioning {
  currentVersion: string;
  previousVersions: ConfigurationVersion[];
  changeLog: ConfigurationChange[];
  versioningStrategy: 'semantic' | 'timestamp' | 'sequential';
}

export interface ConfigurationVersion {
  version: string;
  createdDate: Date;
  createdBy: string;
  changes: string[];
  configurationData: Record<string, any>;
  isActive: boolean;
}

export interface ConfigurationChange {
  changeId: string;
  changeType: 'create' | 'update' | 'delete' | 'merge';
  changedFields: string[];
  oldValues: Record<string, any>;
  newValues: Record<string, any>;
  changeReason: string;
  changedBy: string;
  changeDate: Date;
}

/**
 * Configuration audit information
 */
export interface ConfigurationAudit {
  auditId: string;
  auditType: 'access' | 'modification' | 'deployment' | 'compliance';
  auditDate: Date;
  auditedBy: string;
  auditDetails: Record<string, any>;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending_review';
  findings: AuditFinding[];
}

export interface AuditFinding {
  findingId: string;
  findingType: 'violation' | 'recommendation' | 'observation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  remediation: string;
  dueDate?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
}

/**
 * Organization Configuration Entity
 */
@Entity('wcn_organization_configurations')
@Index(['organizationId', 'category'])
@Index(['configurationKey', 'scope'])
@Index(['status', 'isActive'])
@Index(['inheritanceType', 'priority'])
export class OrganizationConfiguration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  overrideid!: string;

  // Configuration Identity
  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  configurationName!: string;

  @Column({ type: 'var char', length: 100, unique: true })
  @IsString()
  @Length(1, 100)
  configurationKey!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'enum', enum: ConfigurationCategory })
  @IsEnum(ConfigurationCategory)
  category!: ConfigurationCategory;

  @Column({ type: 'enum', enum: ConfigurationScope })
  @IsEnum(ConfigurationScope)
  scope!: ConfigurationScope;

  // Configuration Status
  @Column({ type: 'enum', enum: ConfigurationStatus, default: ConfigurationStatus.DRAFT })
  @IsEnum(ConfigurationStatus)
  status!: ConfigurationStatus;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'integer', default: 0 })
  priority!: number;

  // Configuration Data
  @Column({ type: 'jsonb' })
  configurationData!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  defaultValues?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  allowedValues?: Record<string, any[]>;

  // Inheritance Management
  @Column({ type: 'enum', enum: InheritanceType, default: InheritanceType.INHERIT })
  @IsEnum(InheritanceType)
  inheritanceType!: InheritanceType;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  inheritanceRules?: InheritanceRule[];

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  overrides?: ConfigurationOverride[];

  // Templates and Validation
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  templates?: ConfigurationTemplate[];

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  validationRules?: ConfigurationValidation[];

  // Deployment and Versioning
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  deployment?: ConfigurationDeployment;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  versioning?: ConfigurationVersioning;

  // Audit and Compliance
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => Object)
  auditTrail?: ConfigurationAudit[];

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  approvedDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  approvalNotes?: string;

  // Effective Dates
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  effectiveDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  expiryDate?: Date;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.configurations)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ type: 'uuid' })
  @IsUUID()
  organizationId!: string;

  // Audit Fields
  @CreateDateColumn()
  overridecreatedAt!: Date;

  @UpdateDateColumn()
  overrideupdatedAt!: Date;

  @DeleteDateColumn()
  overridedeletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  overridecreatedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  overrideupdatedBy?: string;

  /**
   * Lifecycle hooks
   */
  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    await this.validateConfiguration();
    this.setDefaults();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.configurationKey) {
      this.configurationKey = this.generateConfigurationKey();
    }
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    await this.validateConfiguration();
    this.updateVersioning();
  }

  /**
   * Validation methods
   */
  private async validateConfiguration(): Promise<void> {
    // Validate configuration data against schema
    if (this.validationRules) {
      for (const validation of this.validationRules) {
        await this.validateAgainstRules(validation);
      }
    }

    // Validate inheritance rules
    if (this.inheritanceRules) {
      this.validateInheritanceRules();
    }

    // Validate overrides
    if (this.overrides) {
      this.validateOverrides();
    }

    // Validate effective dates
    this.validateEffectiveDates();
  }

  private async validateAgainstRules(validation: ConfigurationValidation): Promise<void> {
    for (const rule of validation.validationRules) {
      const value = this.configurationData[rule.field];
      
      if (rule.required && (value === undefined || value === null)) {
        throw new Error(`Required field ${rule.field} is missing`);
      }
      
      if (value !== undefined && value !== null) {
        await this.validateFieldValue(rule, value);
      }
    }
  }

  private async validateFieldValue(rule: ValidationRule, value: any): Promise<void> {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Field ${rule.field} must be a string`);
        }
        if (rule.const raints?.minLength && value.length < rule.const raints.minLength) {
          throw new Error(`Field ${rule.field} must be at least ${rule.const raints.minLength} characters`);
        }
        if (rule.const raints?.maxLength && value.length > rule.const raints.maxLength) {
          throw new Error(`Field ${rule.field} must be at most ${rule.const raints.maxLength} characters`);
        }
        if (rule.const raints?.pattern && !new RegExp(rule.const raints.pattern).test(value)) {
          throw new Error(`Field ${rule.field} does not match required pattern`);
        }
        break;
        
      case 'number':
        if (typeof value !== 'number') {
          throw new Error(`Field ${rule.field} must be a number`);
        }
        if (rule.const raints?.min && value < rule.const raints.min) {
          throw new Error(`Field ${rule.field} must be at least ${rule.const raints.min}`);
        }
        if (rule.const raints?.max && value > rule.const raints.max) {
          throw new Error(`Field ${rule.field} must be at most ${rule.const raints.max}`);
        }
        break;
        
      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Field ${rule.field} must be a boolean`);
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Field ${rule.field} must be an array`);
        }
        break;
        
      case 'date':
        if (!(value instanceof Date) && !Date.parse(value)) {
          throw new Error(`Field ${rule.field} must be a valid date`);
        }
        break;
    }
    
    if (rule.const raints?.enum && !rule.const raints.enum.includes(value)) {
      throw new Error(`Field ${rule.field} must be oneof: ${rule.const raints.enum.join(', ')}`);
    }
  }

  private validateInheritanceRules(): void {
    if (!this.inheritanceRules) return;
    
    for (const rule of this.inheritanceRules) {
      if (!rule.conditions || rule.conditions.length === 0) {
        throw new Error(`Inheritance rule ${rule.ruleName} must have at least one condition`);
      }
      
      if (rule.priority < 0 || rule.priority > 100) {
        throw new Error(`Inheritance rule ${rule.ruleName} priority must be between 0 and 100`);
      }
    }
  }

  private validateOverrides(): void {
    if (!this.overrides) return;
    
    for (const override of this.overrides) {
      if (!override.targetPath) {
        throw new Error(`Override ${override.overrideName} must have a target path`);
      }
      
      if (override.expiryDate && override.expiryDate <= new Date()) {
        throw new Error(`Override ${override.overrideName} expiry date must be in the future`);
      }
    }
  }

  private validateEffectiveDates(): void {
    if (this.effectiveDate && this.expiryDate && this.effectiveDate >= this.expiryDate) {
      throw new Error('Effective date must be before expiry date');
    }
  }

  /**
   * Utility methods
   */
  private setDefaults(): void {
    if (!this.effectiveDate) {
      this.effectiveDate = new Date();
    }
    
    if (!this.versioning) {
      this.versioning = {
        currentVersion: '1.0.0',
        previousVersions: [],
        changeLog: [],
        versioningStrategy: 'semantic'
      };
    }
  }

  private generateConfigurationKey(): string {
    const categoryPrefix = this.category.substring(0, 3).toUpperCase();
    const nameKey = this.configurationName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    
    return `${categoryPrefix}_${nameKey}_${timestamp}`;
  }

  private updateVersioning(): void {
    if (this.versioning) {
      // Increment version based on strategy
      const currentVersion = this.versioning.currentVersion;
      const versionParts = currentVersion.split('.');
      
      if (this.versioning.versioningStrategy === 'semantic') {
        // Increment patch version for minor changes
        versionParts[2] = (parseInt(versionParts[2]) + 1).toString();
        this.versioning.currentVersion = versionParts.join('.');
      } else if (this.versioning.versioningStrategy === 'timestamp') {
        this.versioning.currentVersion = new Date().toISOString();
      } else {
        // Sequential
        this.versioning.currentVersion = (parseInt(currentVersion) + 1).toString();
      }
    }
  }

  /**
   * Business methods
   */
  
  /**
   * Check if configuration is currently effective
   */
  isEffective(): boolean {
    const now = new Date();
    
    if (this.effectiveDate && this.effectiveDate > now) {
      return false;
    }
    
    if (this.expiryDate && this.expiryDate <= now) {
      return false;
    }
    
    return this.isActive && this.status === ConfigurationStatus.ACTIVE;
  }

  /**
   * Apply inheritance rules to get effective configuration
   */
  getEffectiveConfiguration(parentConfiguration?: OrganizationConfiguration): Record<string, any> {
    let effectiveConfig = { ...this.configurationData };
    
    if (parentConfiguration && this.inheritanceType !== InheritanceType.BLOCK) {
      const parentConfig = parentConfiguration.configurationData;
      
      switch (this.inheritanceType) {
        case InheritanceType.INHERIT:
          effectiveConfig = { ...parentConfig, ...effectiveConfig };
          break;
          
        case InheritanceType.MERGE:
          effectiveConfig = this.mergeConfigurations(parentConfig, effectiveConfig);
          break;
          
        case InheritanceType.OVERRIDE:
          // Use only local configuration
          break;
      }
    }
    
    // Apply overrides
    if (this.overrides) {
      for (const override of this.overrides) {
        if (override.isActive && (!override.expiryDate || override.expiryDate > new Date())) {
          this.applyOverride(effectiveConfig, override);
        }
      }
    }
    
    return effectiveConfig;
  }

  private mergeConfigurations(parent: Record<string, any>, child: Record<string, any>): Record<string, any> {
    const merged = { ...parent };
    
    for (const [key, value] of Object.entries(child)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        merged[key] = this.mergeConfigurations(merged[key] || {}, value);
      } else {
        merged[key] = value;
      }
    }
    
    return merged;
  }

  private applyOverride(config: Record<string, any>, override: ConfigurationOverride): void {
    const pathParts = override.targetPath.split('.');
    let current = config;
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) {
        current[pathParts[i]] = {};
      }
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = override.overrideValue;
  }

  /**
   * Approve configuration
   */
  approve(approvedBy: string, notes?: string): void {
    if (this.status !== ConfigurationStatus.PENDING_APPROVAL) {
      throw new Error('Configuration is not pending approval');
    }
    
    this.status = ConfigurationStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
    this.approvalNotes = notes;
  }

  /**
   * Activate configuration
   */
  activate(): void {
    if (this.status !== ConfigurationStatus.APPROVED) {
      throw new Error('Configuration must be approved before activation');
    }
    
    this.status = ConfigurationStatus.ACTIVE;
    this.isActive = true;
  }

  /**
   * Get configuration summary
   */
  getSummary(): {
    id: string;
    name: string;
    key: string;
    category: ConfigurationCategory;
    scope: ConfigurationScope;
    status: ConfigurationStatus;
    isActive: boolean;
    isEffective: boolean;
  } {
    return {
      id: this.id,
      name: this.configurationName,
      key: this.configurationKey,
      category: this.category,
      scope: this.scope,
      status: this.status,
      isActive: this.isActive,
      isEffective: this.isEffective()
    };
  }
}

export default OrganizationConfiguration;
