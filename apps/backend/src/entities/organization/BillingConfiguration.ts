import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Billing Configuration Entity for WriteCareNotes
 * @module BillingConfigurationEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Billing configuration entity for managing
 * hierarchical billing and cost allocation across organizations.
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
  IsDecimal
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Organization } from './Organization';
import { Currency } from '@/entities/financial/FinancialTransaction';

/**
 * Billing model enumeration
 */
export enum BillingModel {
  PER_USER = 'per_user',
  PER_RESIDENT = 'per_resident',
  PER_BED = 'per_bed',
  FLAT_RATE = 'flat_rate',
  USAGE_BASED = 'usage_based',
  TIERED = 'tiered',
  CUSTOM = 'custom'
}

/**
 * Billing frequency enumeration
 */
export enum BillingFrequency {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  ON_DEMAND = 'on_demand'
}

/**
 * Billing Configuration Entity
 */
@Entity('wcn_billing_configurations')
@Index(['organizationId', 'isActive'])
export class BillingConfiguration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  overrideid!: string;

  // Configuration Identity
  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  configurationName!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  // Billing Model
  @Column({ type: 'enum', enum: BillingModel })
  @IsEnum(BillingModel)
  billingModel!: BillingModel;

  @Column({ type: 'enum', enum: BillingFrequency })
  @IsEnum(BillingFrequency)
  billingFrequency!: BillingFrequency;

  @Column({ type: 'enum', enum: Currency, default: Currency.GBP })
  @IsEnum(Currency)
  currency!: Currency;

  // Pricing
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  baseRate?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  setupFee?: Decimal;

  @Column({ type: 'jsonb', nullable: true })
  tieredRates?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  discounts?: Record<string, any>;

  // Billing Settings
  @Column({ type: 'jsonb', nullable: true })
  billingSettings?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  paymentTerms?: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  invoiceSettings?: Record<string, any>;

  // Status
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isDefault!: boolean;

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
  @ManyToOne(() => Organization, organization => organization.billingConfigurations)
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

export default BillingConfiguration;
