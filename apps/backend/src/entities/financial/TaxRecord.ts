import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Tax Record Entity for WriteCareNotes
 * @module TaxRecordEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Tax Record entity for healthcare tax compliance and reporting
 * with comprehensive audit trails and HMRC integration features.
 * 
 * @compliance
 * - HMRC (Her Majesty's Revenue and Customs) regulations
 * - PAYE (Pay As You Earn) compliance
 * - VAT (Value Added Tax) regulations
 * - Corporation Tax compliance
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
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
import { IsUUID, IsEnum, IsDecimal, IsString, IsOptional, IsDate, IsBoolean, Length, IsInt } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { ChartOfAccounts } from './ChartOfAccounts';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger } from '@/utils/logger';

/**
 * Tax type enumeration
 */
export enum TaxType {
  INCOME_TAX = 'income_tax',
  NATIONAL_INSURANCE = 'national_insurance',
  VAT = 'vat',
  CORPORATION_TAX = 'corporation_tax',
  CAPITAL_GAINS_TAX = 'capital_gains_tax',
  STAMP_DUTY = 'stamp_duty',
  COUNCIL_TAX = 'council_tax',
  BUSINESS_RATES = 'business_rates',
  PENSION_CONTRIBUTIONS = 'pension_contributions',
  STUDENT_LOAN = 'student_loan',
  OTHER = 'other'
}

/**
 * Tax status enumeration
 */
export enum TaxStatus {
  DRAFT = 'draft',
  CALCULATED = 'calculated',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  AMENDED = 'amended',
  FINAL = 'final'
}

/**
 * Tax period enumeration
 */
export enum TaxPeriod {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
  AD_HOC = 'ad_hoc'
}

/**
 * Tax record entity with comprehensive healthcare tax compliance features
 */
@Entity('wcn_tax_records')
@Index(['taxYear', 'taxType'])
@Index(['status', 'dueDate'])
@Index(['employeeId', 'taxType'])
@Index(['hmrcReference'])
export class TaxRecord extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Tax Identification
  @Column({ type: 'var char', length: 10 })
  @IsString()
  @Length(4, 10)
  taxYear!: string;

  @Column({ type: 'enum', enum: TaxType })
  @IsEnum(TaxType)
  taxType!: TaxType;

  @Column({ type: 'enum', enum: TaxStatus, default: TaxStatus.DRAFT })
  @IsEnum(TaxStatus)
  status!: TaxStatus;

  @Column({ type: 'enum', enum: TaxPeriod })
  @IsEnum(TaxPeriod)
  taxPeriod!: TaxPeriod;

  // Tax Period Dates
  @Column({ type: 'date' })
  @IsDate()
  periodStart!: Date;

  @Column({ type: 'date' })
  @IsDate()
  periodEnd!: Date;

  @Column({ type: 'date' })
  @IsDate()
  dueDate!: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  submittedDate?: Date;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  taxableAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  taxAmount!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  taxRate!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  interestAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  penaltyAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  paidAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  balanceAmount!: Decimal;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  // Employee/Entity Information
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  nationalInsuranceNumber?: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  utr?: string; // Unique Taxpayer Reference

  // HMRC Integration
  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  hmrcReference?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  hmrcSubmissionId?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  hmrcResponse?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  hmrcStatus?: string;

  // Tax Calculation Details
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  personalAllowance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  basicRateAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  higherRateAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  additionalRateAmount!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  basicRate!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  higherRate!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  additionalRate!: Decimal;

  // VAT Specific Fields
  @Column({ type: 'var char', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  vatOutput!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  vatInput!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  vatNet!: Decimal;

  // Compliance and Audit
  @Column({ type: 'uuid' })
  @IsUUID()
  correlationId!: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  regulatoryCode?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isLate!: boolean;

  @Column({ type: 'integer', default: 0 })
  daysLate!: number;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isAmended!: boolean;

  @Column({ type: 'integer', default: 0 })
  amendmentCount!: number;

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  calculatedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  calculatedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;

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

  // Relationships
  @ManyToOne(() => ChartOfAccounts, account => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account!: ChartOfAccounts;

  @Column({ type: 'uuid' })
  @IsUUID()
  accountId!: string;

  // Audit Fields
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  /**
   * Calculate tax before inserting
   */
  @BeforeInsert()
  async calculateTaxBeforeInsert(): Promise<void> {
    this.validateTaxData();
    this.calculateTaxAmount();
    this.calculateBalance();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    
    console.info('Tax record created', {
      taxRecordId: this.id,
      taxType: this.taxType,
      taxAmount: this.taxAmount.toString(),
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Calculate tax before updating
   */
  @BeforeUpdate()
  async calculateTaxBeforeUpdate(): Promise<void> {
    this.validateTaxData();
    this.calculateTaxAmount();
    this.calculateBalance();
    this.calculateLateStatus();
    
    console.info('Tax record updated', {
      taxRecordId: this.id,
      taxType: this.taxType,
      updatedBy: this.updatedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Validate tax data
   */
  private validateTaxData(): void {
    if (this.taxableAmount.lessThan(0)) {
      throw new Error('Taxable amount cannot be negative');
    }

    if (this.periodStart >= this.periodEnd) {
      throw new Error('Period start must be before period end');
    }

    if (this.dueDate < this.periodEnd) {
      throw new Error('Due date cannot be before period end');
    }
  }

  /**
   * Calculate tax amount based on tax type
   */
  private calculateTaxAmount(): void {
    switch (this.taxType) {
      case TaxType.INCOME_TAX:
        this.calculateIncomeTax();
        break;
      case TaxType.NATIONAL_INSURANCE:
        this.calculateNationalInsurance();
        break;
      case TaxType.VAT:
        this.calculateVAT();
        break;
      case TaxType.CORPORATION_TAX:
        this.calculateCorporationTax();
        break;
      default:
        this.taxAmount = this.taxableAmount.times(this.taxRate);
    }
    
    this.totalAmount = this.taxAmount.plus(this.interestAmount).plus(this.penaltyAmount);
  }

  /**
   * Calculate income tax (simplified UK calculation)
   */
  private calculateIncomeTax(): void {
    const personalAllowance = new Decimal(12570); // 2023/24 tax year
    const basicRateThreshold = new Decimal(50270);
    const higherRateThreshold = new Decimal(125140);
    
    let tax = new Decimal(0);
    
    if (this.taxableAmount.greaterThan(personalAllowance)) {
      const taxableIncome = this.taxableAmount.minus(personalAllowance);
      
      if (taxableIncome.lessThanOrEqualTo(basicRateThreshold.minus(personalAllowance))) {
        // Basicrate: 20%
        tax = taxableIncome.times(0.20);
        this.basicRateAmount = taxableIncome;
        this.basicRate = new Decimal(0.20);
      } else if (taxableIncome.lessThanOrEqualTo(higherRateThreshold.minus(personalAllowance))) {
        // Basic rate + Higherrate: 20% + 40%
        const basicRateAmount = basicRateThreshold.minus(personalAllowance);
        const higherRateAmount = taxableIncome.minus(basicRateAmount);
        
        tax = basicRateAmount.times(0.20).plus(higherRateAmount.times(0.40));
        this.basicRateAmount = basicRateAmount;
        this.higherRateAmount = higherRateAmount;
        this.basicRate = new Decimal(0.20);
        this.higherRate = new Decimal(0.40);
      } else {
        // Allrates: 20% + 40% + 45%
        const basicRateAmount = basicRateThreshold.minus(personalAllowance);
        const higherRateAmount = higherRateThreshold.minus(basicRateThreshold);
        const additionalRateAmount = taxableIncome.minus(higherRateThreshold.minus(personalAllowance));
        
        tax = basicRateAmount.times(0.20)
          .plus(higherRateAmount.times(0.40))
          .plus(additionalRateAmount.times(0.45));
        
        this.basicRateAmount = basicRateAmount;
        this.higherRateAmount = higherRateAmount;
        this.additionalRateAmount = additionalRateAmount;
        this.basicRate = new Decimal(0.20);
        this.higherRate = new Decimal(0.40);
        this.additionalRate = new Decimal(0.45);
      }
    }
    
    this.taxAmount = tax;
  }

  /**
   * Calculate National Insurance (simplified UK calculation)
   */
  private calculateNationalInsurance(): void {
    // Class 1 NIC rates for 2023/24
    const primaryThreshold = new Decimal(242); // Weekly
    const upperEarningsLimit = new Decimal(967); // Weekly
    
    const weeklyTaxable = this.taxableAmount.dividedBy(52);
    
    let nic = new Decimal(0);
    
    if (weeklyTaxable.greaterThan(primaryThreshold)) {
      const earningsAboveThreshold = weeklyTaxable.minus(primaryThreshold);
      
      if (weeklyTaxable.lessThanOrEqualTo(upperEarningsLimit)) {
        // 12% on earnings between primary threshold and upper earnings limit
        nic = earningsAboveThreshold.times(0.12);
      } else {
        // 12% on earnings up to upper limit, 2% on earnings above
        const earningsUpToLimit = upperEarningsLimit.minus(primaryThreshold);
        const earningsAboveLimit = weeklyTaxable.minus(upperEarningsLimit);
        
        nic = earningsUpToLimit.times(0.12).plus(earningsAboveLimit.times(0.02));
      }
    }
    
    this.taxAmount = nic.times(52);
  }

  /**
   * Calculate VAT
   */
  private calculateVAT(): void {
    this.vatNet = this.vatOutput.minus(this.vatInput);
    this.taxAmount = this.vatNet;
  }

  /**
   * Calculate Corporation Tax (simplified UK calculation)
   */
  private calculateCorporationTax(): void {
    // Corporation taxrate: 25% for profits over £250,000 (2023/24)
    // Small profitsrate: 19% for profits up to £50,000
    // Marginal relief for profits between £50,000 and £250,000
    
    const smallProfitsThreshold = new Decimal(50000);
    const largeProfitsThreshold = new Decimal(250000);
    
    if (this.taxableAmount.lessThanOrEqualTo(smallProfitsThreshold)) {
      // Small profitsrate: 19%
      this.taxAmount = this.taxableAmount.times(0.19);
      this.taxRate = new Decimal(0.19);
    } else if (this.taxableAmount.lessThanOrEqualTo(largeProfitsThreshold)) {
      // Marginal relief calculation (simplified)
      this.taxAmount = this.taxableAmount.times(0.25);
      this.taxRate = new Decimal(0.25);
    } else {
      // Large profitsrate: 25%
      this.taxAmount = this.taxableAmount.times(0.25);
      this.taxRate = new Decimal(0.25);
    }
  }

  /**
   * Calculate balance amount
   */
  private calculateBalance(): void {
    this.balanceAmount = this.totalAmount.minus(this.paidAmount);
  }

  /**
   * Calculate late status
   */
  private calculateLateStatus(): void {
    if (this.status === TaxStatus.SUBMITTED || this.status === TaxStatus.ACCEPTED) {
      this.isLate = false;
      this.daysLate = 0;
      return;
    }

    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    this.daysLate = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    this.isLate = this.daysLate > 0;
  }

  /**
   * Get formatted tax amount with currency
   */
  getFormattedTaxAmount(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(this.taxAmount.toNumber());
  }

  /**
   * Check if tax record is overdue
   */
  isOverdue(): boolean {
    return this.isLate && this.daysLate > 0;
  }

  /**
   * Check if tax record is fully paid
   */
  isFullyPaid(): boolean {
    return this.paidAmount.greaterThanOrEqualTo(this.totalAmount);
  }

  /**
   * Check if tax record is submitted
   */
  isSubmitted(): boolean {
    return this.status === TaxStatus.SUBMITTED || this.status === TaxStatus.ACCEPTED;
  }

  /**
   * Submit tax record
   */
  submit(submittedBy: string): void {
    if (this.status !== TaxStatus.CALCULATED) {
      throw new Error('Only calculated tax records can be submitted');
    }
    
    this.status = TaxStatus.SUBMITTED;
    this.submittedBy = submittedBy;
    this.submittedDate = new Date();
    
    console.info('Tax record submitted', {
      taxRecordId: this.id,
      taxType: this.taxType,
      submittedBy,
      auditTrail: true
    });
  }

  /**
   * Record payment
   */
  recordPayment(amount: Decimal): void {
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Payment amount must be positive');
    }
    
    if (amount.greaterThan(this.balanceAmount)) {
      throw new Error('Payment amount cannot exceed balance');
    }
    
    this.paidAmount = this.paidAmount.plus(amount);
    this.balanceAmount = this.totalAmount.minus(this.paidAmount);
    
    console.info('Tax payment recorded', {
      taxRecordId: this.id,
      paymentAmount: amount.toString(),
      newBalance: this.balanceAmount.toString(),
      auditTrail: true
    });
  }

  /**
   * Get tax record summary
   */
  getSummary(): {
    id: string;
    taxType: TaxType;
    taxYear: string;
    taxAmount: string;
    totalAmount: string;
    balanceAmount: string;
    status: TaxStatus;
    isOverdue: boolean;
    daysLate: number;
  } {
    return {
      id: this.id,
      taxType: this.taxType,
      taxYear: this.taxYear,
      taxAmount: this.getFormattedTaxAmount(),
      totalAmount: this.totalAmount.toString(),
      balanceAmount: this.balanceAmount.toString(),
      status: this.status,
      isOverdue: this.isOverdue(),
      daysLate: this.daysLate
    };
  }
}

export default TaxRecord;
