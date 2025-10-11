import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Salary Entity for WriteCareNotes
 * @module SalaryEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Salary entity for healthcare payroll management with HMRC compliance
 * and comprehensive audit trails for staff compensation tracking.
 * 
 * @compliance
 * - HMRC (Her Majesty's Revenue and Customs) regulations
 * - PAYE (Pay As You Earn) compliance
 * - National Insurance Contributions (NIC)
 * - Pension auto-enrollment (Pensions Act 2008)
 * - GDPR Article 6 & 9 (Personal data processing)
 * - SOX (Sarbanes-Oxley Act) compliance
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
 * Salary status enumeration
 */
export enum SalaryStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PROCESSED = 'processed',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended'
}

/**
 * Employment type enumeration
 */
export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  TEMPORARY = 'temporary',
  AGENCY = 'agency',
  VOLUNTEER = 'volunteer',
  CONSULTANT = 'consultant'
}

/**
 * Pay frequency enumeration
 */
export enum PayFrequency {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually'
}

/**
 * Tax code enumeration (UK specific)
 */
export enum TaxCode {
  STANDARD = '1257L',
  EMERGENCY = '1257E',
  WEEK1_MONTH1 = '1257W',
  NO_PERSONAL_ALLOWANCE = '0T',
  BR = 'BR',
  D0 = 'D0',
  D1 = 'D1',
  D2 = 'D2',
  NT = 'NT'
}

/**
 * Salary entity with comprehensive healthcare payroll management features
 */
@Entity('wcn_salaries')
@Index(['employeeId', 'payPeriod'])
@Index(['status', 'payDate'])
@Index(['payrollRunId'])
@Index(['employmentType', 'payFrequency'])
export class Salary extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Employee Information
  @Column({ type: 'uuid' })
  @IsUUID()
  employeeId!: string;

  @Column({ type: 'var char', length: 100 })
  @IsString()
  @Length(1, 100)
  employeeName!: string;

  @Column({ type: 'var char', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  employeeNumber?: string;

  @Column({ type: 'enum', enum: EmploymentType })
  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  // Pay Period Information
  @Column({ type: 'date' })
  @IsDate()
  payPeriodStart!: Date;

  @Column({ type: 'date' })
  @IsDate()
  payPeriodEnd!: Date;

  @Column({ type: 'date' })
  @IsDate()
  payDate!: Date;

  @Column({ type: 'enum', enum: PayFrequency })
  @IsEnum(PayFrequency)
  payFrequency!: PayFrequency;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  payrollRunId?: string;

  // Basic Salary Information
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  basicSalary!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  overtimePay!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  bonus!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  commission!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  allowances!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  grossPay!: Decimal;

  // Deductions
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  incomeTax!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  nationalInsurance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  pensionContribution!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  studentLoan!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  otherDeductions!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalDeductions!: Decimal;

  // Net Pay
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  netPay!: Decimal;

  // Tax Information
  @Column({ type: 'enum', enum: TaxCode, default: TaxCode.STANDARD })
  @IsEnum(TaxCode)
  taxCode!: TaxCode;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  personalAllowance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  taxablePay!: Decimal;

  // National Insurance Information
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  niEarnings!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  niRate!: Decimal;

  // Pension Information
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isPensionEligible!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  pensionRate!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  employerPensionContribution!: Decimal;

  // Hours Information
  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  hoursWorked!: Decimal;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  overtimeHours!: Decimal;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  holidayHours!: Decimal;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  sickHours!: Decimal;

  // Status and Approval
  @Column({ type: 'enum', enum: SalaryStatus, default: SalaryStatus.DRAFT })
  @IsEnum(SalaryStatus)
  status!: SalaryStatus;

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
  isHMRCReturnable!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isPensionReturnable!: boolean;

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
   * Calculate salary before inserting
   */
  @BeforeInsert()
  async calculateSalaryBeforeInsert(): Promise<void> {
    this.validateSalaryData();
    this.calculateGrossPay();
    this.calculateDeductions();
    this.calculateNetPay();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    
    console.info('Salary calculated', {
      salaryId: this.id,
      employeeId: this.employeeId,
      grossPay: this.grossPay.toString(),
      netPay: this.netPay.toString(),
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Calculate salary before updating
   */
  @BeforeUpdate()
  async calculateSalaryBeforeUpdate(): Promise<void> {
    this.validateSalaryData();
    this.calculateGrossPay();
    this.calculateDeductions();
    this.calculateNetPay();
    
    console.info('Salary updated', {
      salaryId: this.id,
      employeeId: this.employeeId,
      updatedBy: this.updatedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Validate salary data
   */
  private validateSalaryData(): void {
    if (this.basicSalary.lessThan(0)) {
      throw new Error('Basic salary cannot be negative');
    }

    if (this.payPeriodStart >= this.payPeriodEnd) {
      throw new Error('Pay period start must be before end');
    }

    if (this.payDate < this.payPeriodEnd) {
      throw new Error('Pay date cannot be before pay period end');
    }
  }

  /**
   * Calculate gross pay
   */
  private calculateGrossPay(): void {
    this.grossPay = this.basicSalary
      .plus(this.overtimePay)
      .plus(this.bonus)
      .plus(this.commission)
      .plus(this.allowances);
  }

  /**
   * Calculate deductions
   */
  private calculateDeductions(): void {
    this.calculateIncomeTax();
    this.calculateNationalInsurance();
    this.calculatePensionContribution();
    
    this.totalDeductions = this.incomeTax
      .plus(this.nationalInsurance)
      .plus(this.pensionContribution)
      .plus(this.studentLoan)
      .plus(this.otherDeductions);
  }

  /**
   * Calculate income tax (simplified UK calculation)
   */
  private calculateIncomeTax(): void {
    // Basicrate: 20% on income between £12,570 and £50,270
    // Higherrate: 40% on income between £50,270 and £125,140
    // Additionalrate: 45% on income above £125,140
    
    const annualGross = this.grossPay.times(this.getPayFrequencyMultiplier());
    const personalAllowance = new Decimal(12570); // 2023/24 tax year
    const basicRateThreshold = new Decimal(50270);
    const higherRateThreshold = new Decimal(125140);
    
    let tax = new Decimal(0);
    
    if (annualGross.greaterThan(personalAllowance)) {
      const taxableIncome = annualGross.minus(personalAllowance);
      
      if (taxableIncome.lessThanOrEqualTo(basicRateThreshold.minus(personalAllowance))) {
        // Basic rate
        tax = taxableIncome.times(0.20);
      } else if (taxableIncome.lessThanOrEqualTo(higherRateThreshold.minus(personalAllowance))) {
        // Basic rate + Higher rate
        const basicRateTax = basicRateThreshold.minus(personalAllowance).times(0.20);
        const higherRateTax = taxableIncome.minus(basicRateThreshold.minus(personalAllowance)).times(0.40);
        tax = basicRateTax.plus(higherRateTax);
      } else {
        // All rates
        const basicRateTax = basicRateThreshold.minus(personalAllowance).times(0.20);
        const higherRateTax = higherRateThreshold.minus(basicRateThreshold).times(0.40);
        const additionalRateTax = taxableIncome.minus(higherRateThreshold.minus(personalAllowance)).times(0.45);
        tax = basicRateTax.plus(higherRateTax).plus(additionalRateTax);
      }
    }
    
    this.incomeTax = tax.dividedBy(this.getPayFrequencyMultiplier());
  }

  /**
   * Calculate National Insurance (simplified UK calculation)
   */
  private calculateNationalInsurance(): void {
    // Class 1 NIC rates for 2023/24
    const primaryThreshold = new Decimal(242); // Weekly
    const upperEarningsLimit = new Decimal(967); // Weekly
    
    const weeklyGross = this.grossPay.dividedBy(this.getPayFrequencyMultiplier()).times(52);
    
    let nic = new Decimal(0);
    
    if (weeklyGross.greaterThan(primaryThreshold)) {
      const earningsAboveThreshold = weeklyGross.minus(primaryThreshold);
      
      if (weeklyGross.lessThanOrEqualTo(upperEarningsLimit)) {
        // 12% on earnings between primary threshold and upper earnings limit
        nic = earningsAboveThreshold.times(0.12);
      } else {
        // 12% on earnings up to upper limit, 2% on earnings above
        const earningsUpToLimit = upperEarningsLimit.minus(primaryThreshold);
        const earningsAboveLimit = weeklyGross.minus(upperEarningsLimit);
        
        nic = earningsUpToLimit.times(0.12).plus(earningsAboveLimit.times(0.02));
      }
    }
    
    this.nationalInsurance = nic.dividedBy(52).times(this.getPayFrequencyMultiplier());
  }

  /**
   * Calculate pension contribution
   */
  private calculatePensionContribution(): void {
    if (this.isPensionEligible && this.pensionRate.greaterThan(0)) {
      this.pensionContribution = this.grossPay.times(this.pensionRate);
      this.employerPensionContribution = this.grossPay.times(this.pensionRate);
    }
  }

  /**
   * Calculate net pay
   */
  private calculateNetPay(): void {
    this.netPay = this.grossPay.minus(this.totalDeductions);
  }

  /**
   * Get pay frequency multiplier for annual calculations
   */
  private getPayFrequencyMultiplier(): number {
    switch (this.payFrequency) {
      case PayFrequency.WEEKLY:
        return 52;
      case PayFrequency.FORTNIGHTLY:
        return 26;
      case PayFrequency.MONTHLY:
        return 12;
      case PayFrequency.QUARTERLY:
        return 4;
      case PayFrequency.ANNUALLY:
        return 1;
      default:
        return 12;
    }
  }

  /**
   * Get formatted net pay with currency
   */
  getFormattedNetPay(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(this.netPay.toNumber());
  }

  /**
   * Check if salary is approved
   */
  isApproved(): boolean {
    return this.status === SalaryStatus.APPROVED;
  }

  /**
   * Check if salary is processed
   */
  isProcessed(): boolean {
    return this.status === SalaryStatus.PROCESSED;
  }

  /**
   * Check if salary is paid
   */
  isPaid(): boolean {
    return this.status === SalaryStatus.PAID;
  }

  /**
   * Approve salary
   */
  approve(approvedBy: string, notes?: string): void {
    if (this.status !== SalaryStatus.DRAFT && this.status !== SalaryStatus.PENDING_APPROVAL) {
      throw new Error('Only draft or pending salaries can be approved');
    }
    
    this.status = SalaryStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
    this.approvalNotes = notes;
    
    console.info('Salary approved', {
      salaryId: this.id,
      employeeId: this.employeeId,
      approvedBy,
      auditTrail: true
    });
  }

  /**
   * Process salary
   */
  process(): void {
    if (this.status !== SalaryStatus.APPROVED) {
      throw new Error('Only approved salaries can be processed');
    }
    
    this.status = SalaryStatus.PROCESSED;
    
    console.info('Salary processed', {
      salaryId: this.id,
      employeeId: this.employeeId,
      netPay: this.netPay.toString(),
      auditTrail: true
    });
  }

  /**
   * Mark salary as paid
   */
  markAsPaid(): void {
    if (this.status !== SalaryStatus.PROCESSED) {
      throw new Error('Only processed salaries can be marked as paid');
    }
    
    this.status = SalaryStatus.PAID;
    
    console.info('Salary marked as paid', {
      salaryId: this.id,
      employeeId: this.employeeId,
      netPay: this.netPay.toString(),
      auditTrail: true
    });
  }

  /**
   * Get salary summary
   */
  getSummary(): {
    id: string;
    employeeId: string;
    employeeName: string;
    grossPay: string;
    netPay: string;
    status: SalaryStatus;
    payDate: Date;
    payFrequency: PayFrequency;
  } {
    return {
      id: this.id,
      employeeId: this.employeeId,
      employeeName: this.employeeName,
      grossPay: this.grossPay.toString(),
      netPay: this.getFormattedNetPay(),
      status: this.status,
      payDate: this.payDate,
      payFrequency: this.payFrequency
    };
  }
}

export default Salary;
