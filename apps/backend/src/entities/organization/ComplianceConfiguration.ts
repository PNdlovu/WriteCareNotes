import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Compliance Configuration Entity for WriteCareNotes
 * @module ComplianceConfigurationEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Compliance configuration entity for managing
 * regulatory compliance across different jurisdictions.
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
 * Compliance framework enumeration
 */
export enum ComplianceFramework {
  CQC = 'cqc',
  CARE_INSPECTORATE = 'care_inspectorate',
  CIW = 'ciw',
  RQIA = 'rqia',
  GDPR = 'gdpr',
  ISO_27001 = 'iso_27001',
  SOC_2 = 'soc_2',
  HIPAA = 'hipaa',
  PCI_DSS = 'pci_dss'
}

/**
 * Compliance Configuration Entity
 */
@Entity('wcn_compliance_configurations')
@Index(['organizationId', 'framework'])
export class ComplianceConfiguration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  overrideid!: string;

  // Configuration Identity
  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  configurationName!: string;

  @Column({ type: 'enum', enum: ComplianceFramework })
  @IsEnum(ComplianceFramework)
  framework!: ComplianceFramework;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  // Compliance Settings
  @Column({ type: 'jsonb' })
  complianceSettings!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  auditSettings?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  reportingSettings?: Record<string, any>;

  // Status
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isRequired!: boolean;

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
  @ManyToOne(() => Organization, organization => organization.complianceConfigurations)
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
}

export default ComplianceConfiguration;
