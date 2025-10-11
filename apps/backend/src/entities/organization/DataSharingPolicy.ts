import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Data Sharing Policy Entity for WriteCareNotes
 * @module DataSharingPolicyEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Data sharing policy entity for managing
 * cross-organizational data sharing with GDPR compliance.
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
  Length
} from 'class-validator';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Organization } from './Organization';

/**
 * Data sharing type enumeration
 */
export enum DataSharingType {
  READ_ONLY = 'read_only',
  READ_WRITE = 'read_write',
  AGGREGATED_ONLY = 'aggregated_only',
  ANONYMIZED_ONLY = 'anonymized_only',
  FULL_ACCESS = 'full_access'
}

/**
 * Data category enumeration
 */
export enum DataCategory {
  RESIDENT_DATA = 'resident_data',
  FINANCIAL_DATA = 'financial_data',
  OPERATIONAL_DATA = 'operational_data',
  COMPLIANCE_DATA = 'compliance_data',
  STAFF_DATA = 'staff_data',
  CLINICAL_DATA = 'clinical_data'
}

/**
 * Data Sharing Policy Entity
 */
@Entity('wcn_data_sharing_policies')
@Index(['organizationId', 'targetOrganizationId'])
@Index(['dataCategory', 'sharingType'])
export class DataSharingPolicy extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  overrideid!: string;

  // Policy Identity
  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  policyName!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  // Sharing Configuration
  @Column({ type: 'enum', enum: DataSharingType })
  @IsEnum(DataSharingType)
  sharingType!: DataSharingType;

  @Column({ type: 'enum', enum: DataCategory })
  @IsEnum(DataCategory)
  dataCategory!: DataCategory;

  @Column({ type: 'uuid' })
  @IsUUID()
  targetOrganizationId!: string;

  // Policy Rules
  @Column({ type: 'jsonb', nullable: true })
  sharingRules?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  dataFilters?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  accessRestrictions?: Record<string, any>;

  // Status
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresApproval!: boolean;

  // Effective Dates
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  effectiveDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  expiryDate?: Date;

  // GDPR Compliance
  @Column({ type: 'var char', length: 100 })
  @IsString()
  lawfulBasis!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  dataSubjectConsent?: string;

  // Relationships
  @ManyToOne(() => Organization, organization => organization.dataSharingPolicies)
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

  @BeforeInsert()
  async beforeInsert(): Promise<void> {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @BeforeUpdate()
  async beforeUpdate(): Promise<void> {
    // Update logic if needed
  }

  /**
   * Check if policy is currently effective
   */
  isEffective(): boolean {
    const now = new Date();
    
    if (this.effectiveDate && this.effectiveDate > now) {
      return false;
    }
    
    if (this.expiryDate && this.expiryDate <= now) {
      return false;
    }
    
    return this.isActive;
  }
}

export default DataSharingPolicy;
