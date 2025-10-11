import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial Period Entity for WriteCareNotes
 * @module FinancialPeriodEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Financial period entity for managing accounting periods
 * with healthcare compliance and audit requirements.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsUUID, IsEnum, IsDecimal, IsString, IsBoolean, IsDate, Length } from 'class-validator';
import { Decimal } from 'decimal.js';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { FinancialTransaction } from './FinancialTransaction';
import { Currency } from './FinancialTransaction';
import { logger } from '@/utils/logger';

/**
 * Financial period status enumeration
 */
export enum PeriodStatus {
  OPEN = 'open',
  CLOSED = 'closed',
  LOCKED = 'locked',
  ARCHIVED = 'archived'
}

/**
 * Period type enumeration
 */
export enum PeriodType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom'
}

/**
 * Financial Period entity for managing accounting periods
 */
@Entity('wcn_financial_periods')
@Index(['startDate', 'endDate'])
@Index(['status', 'periodType'])
@Index(['financialYear'])
export class FinancialPeriod extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Period Identification
  @Column({ type: 'var char', length: 100 })
  @IsString()
  @Length(1, 100)
  periodName!: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsString()
  periodCode?: string;

  @Column({ type: 'enum', enum: PeriodType })
  @IsEnum(PeriodType)
  periodType!: PeriodType;

  // Period Dates
  @Column({ type: 'date' })
  @IsDate()
  startDate!: Date;

  @Column({ type: 'date' })
  @IsDate()
  endDate!: Date;

  @Column({ type: 'var char', length: 10 })
  @IsString()
  @Length(4, 10)
  financialYear!: string;

  // Period Status
  @Column({ type: 'enum', enum: PeriodStatus, default: PeriodStatus.OPEN })
  @IsEnum(PeriodStatus)
  status!: PeriodStatus;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isCurrentPeriod!: boolean;

  // Financial Summary
  @Column({ type: 'enum', enum: Currency, default: Currency.GBP })
  @IsEnum(Currency)
  currency!: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalRevenue!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalExpenses!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  netIncome!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  grossProfit!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  operatingIncome!: Decimal;

  // Budget Comparison
  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetedRevenue?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetedExpenses?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetVariance?: Decimal;

  // Transaction Counts
  @Column({ type: 'integer', default: 0 })
  transactionCount!: number;

  @Column({ type: 'integer', default: 0 })
  reconciledTransactionCount!: number;

  @Column({ type: 'integer', default: 0 })
  pendingTransactionCount!: number;

  // Closing Information
  @Column({ type: 'uuid', nullable: true })
  closedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  closedDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsString()
  closingNotes?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isAdjustmentPeriod!: boolean;

  // Regulatory Compliance
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  cqcReported!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  cqcReportedDate?: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  hmrcReported!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  hmrcReportedDate?: Date;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  auditCompleted!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  auditCompletedDate?: Date;

  // Healthcare-Specific Metrics
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  averageOccupancyRate?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  revenuePerBed?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  costPerResident?: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  profitMargin?: Decimal;

  // Relationships
  @OneToMany(() => FinancialTransaction, transaction => transaction.financialPeriod)
  transactions!: FinancialTransaction[];

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

  /**
   * Validate period data before insert
   */
  @BeforeInsert()
  async validatePeriodBeforeInsert(): Promise<void> {
    this.validatePeriodData();
    this.calculateFinancialMetrics();
    
    // Generate ID if not provided
    if (!this.id) {
      this.id = uuidv4();
    }
    
    // Generate period code if not provided
    if (!this.periodCode) {
      this.periodCode = this.generatePeriodCode();
    }
    
    // Log period creation for audit
    console.info('Financial period created', {
      periodId: this.id,
      periodName: this.periodName,
      startDate: this.startDate,
      endDate: this.endDate,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Validate period data before update
   */
  @BeforeUpdate()
  async validatePeriodBeforeUpdate(): Promise<void> {
    this.validatePeriodData();
    this.calculateFinancialMetrics();
    
    // Log period update for audit
    console.info('Financial period updated', {
      periodId: this.id,
      updatedBy: this.updatedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Validate financial period data
   */
  private validatePeriodData(): void {
    // Validate date range
    if (this.startDate >= this.endDate) {
      throw new Error('Period start date must be before end date');
    }

    // Validate financial year format
    const yearPattern = /^\d{4}(-\d{4})?$/;
    if (!yearPattern.test(this.financialYear)) {
      throw new Error('Invalid financial year format');
    }

    // Validate period cannot be closed if there are pending transactions
    if (this.status === PeriodStatus.CLOSED && this.pendingTransactionCount > 0) {
      throw new Error('Cannot close period with pending transactions');
    }
  }

  /**
   * Calculate financial metrics
   */
  private calculateFinancialMetrics(): void {
    // Calculate net income
    this.netIncome = this.totalRevenue.minus(this.totalExpenses);
    
    // Calculate profit margin
    if (this.totalRevenue.greaterThan(0)) {
      this.profitMargin = this.netIncome.dividedBy(this.totalRevenue).times(100);
    }
    
    // Calculate budget variance
    if (this.budgetedRevenue && this.budgetedExpenses) {
      const budgetedNet = this.budgetedRevenue.minus(this.budgetedExpenses);
      this.budgetVariance = this.netIncome.minus(budgetedNet);
    }
  }

  /**
   * Generate period code
   */
  private generatePeriodCode(): string {
    const year = this.financialYear.split('-')[0];
    const startMonth = this.startDate.getMonth() + 1;
    
    switch (this.periodType) {
      case PeriodType.MONTHLY:
        return `${year}M${startMonth.toString().padStart(2, '0')}`;
      case PeriodType.QUARTERLY:
        const quarter = Math.ceil(startMonth / 3);
        return `${year}Q${quarter}`;
      case PeriodType.YEARLY:
        return `${year}Y`;
      default:
        return `${year}C${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Check if period is open for transactions
   */
  isOpenForTransactions(): boolean {
    return this.status === PeriodStatus.OPEN;
  }

  /**
   * Check if period is current
   */
  isCurrent(): boolean {
    const today = new Date();
    return today >= this.startDate && today <= this.endDate && this.isCurrentPeriod;
  }

  /**
   * Get period duration in days
   */
  getDurationInDays(): number {
    const diffTime = Math.abs(this.endDate.getTime() - this.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Close financial period
   */
  closePeriod(closedBy: string, notes?: string): void {
    if (this.status !== PeriodStatus.OPEN) {
      throw new Error('Only open periods can be closed');
    }
    
    if (this.pendingTransactionCount > 0) {
      throw new Error('Cannot close period with pending transactions');
    }
    
    this.status = PeriodStatus.CLOSED;
    this.closedBy = closedBy;
    this.closedDate = new Date();
    this.closingNotes = notes;
    
    console.info('Financial period closed', {
      periodId: this.id,
      periodName: this.periodName,
      closedBy,
      netIncome: this.netIncome.toString(),
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Reopen financial period
   */
  reopenPeriod(reopenedBy: string): void {
    if (this.status !== PeriodStatus.CLOSED) {
      throw new Error('Only closed periods can be reopened');
    }
    
    this.status = PeriodStatus.OPEN;
    this.closedBy = null;
    this.closedDate = null;
    this.closingNotes = null;
    this.updatedBy = reopenedBy;
    
    console.info('Financial period reopened', {
      periodId: this.id,
      periodName: this.periodName,
      reopenedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Update transaction counts
   */
  updateTransactionCounts(total: number, reconciled: number, pending: number): void {
    this.transactionCount = total;
    this.reconciledTransactionCount = reconciled;
    this.pendingTransactionCount = pending;
  }

  /**
   * Get formatted financial summary
   */
  getFinancialSummary(): {
    revenue: string;
    expenses: string;
    netIncome: string;
    profitMargin: string;
    budgetVariance?: string;
  } {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return {
      revenue: formatter.format(this.totalRevenue.toNumber()),
      expenses: formatter.format(this.totalExpenses.toNumber()),
      netIncome: formatter.format(this.netIncome.toNumber()),
      profitMargin: this.profitMargin ? `${this.profitMargin.toFixed(2)}%` : '0.00%',
      budgetVariance: this.budgetVariance ? formatter.format(this.budgetVariance.toNumber()) : undefined
    };
  }

  /**
   * Get period summary for reporting
   */
  getSummary(): {
    id: string;
    name: string;
    type: PeriodType;
    startDate: Date;
    endDate: Date;
    status: PeriodStatus;
    netIncome: string;
    profitMargin: string;
  } {
    return {
      id: this.id,
      name: this.periodName,
      type: this.periodType,
      startDate: this.startDate,
      endDate: this.endDate,
      status: this.status,
      netIncome: this.getFinancialSummary().netIncome,
      profitMargin: this.getFinancialSummary().profitMargin
    };
  }
}

export default FinancialPeriod;
