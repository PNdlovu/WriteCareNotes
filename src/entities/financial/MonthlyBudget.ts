import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Monthly Budget Entity for WriteCareNotes
 * @module MonthlyBudgetEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Monthly budget breakdown entity for detailed
 * month-by-month budget planning and tracking.
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
import { IsUUID, IsDecimal, IsNumber, IsBoolean } from 'class-validator';
import { Decimal } from 'decimal.js';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { BudgetCategory } from './BudgetCategory';

/**
 * Monthly Budget entity for month-by-month budget tracking
 */
@Entity('wcn_monthly_budgets')
@Index(['categoryId', 'month', 'year'])
@Index(['year', 'month'])
export class MonthlyBudget extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  override id!: string;

  // Time Period
  @Column({ type: 'integer' })
  @IsNumber()
  month!: number; // 1-12

  @Column({ type: 'integer' })
  @IsNumber()
  year!: number;

  @Column({ type: 'date' })
  monthStart!: Date;

  @Column({ type: 'date' })
  monthEnd!: Date;

  // Budget Amounts
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  budgetedAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  actualAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  variance!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  variancePercentage!: Decimal;

  // Cumulative Tracking
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  cumulativeBudgeted!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  cumulativeActual!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  cumulativeVariance!: Decimal;

  // Status and Flags
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isLocked!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isActualized!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresAdjustment!: boolean;

  // Healthcare-Specific Metrics
  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  plannedOccupancy?: number;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  actualOccupancy?: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetPerResident?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  actualPerResident?: Decimal;

  // Relationships
  @ManyToOne(() => BudgetCategory, category => category.monthlyBreakdown)
  @JoinColumn({ name: 'category_id' })
  category!: BudgetCategory;

  @Column({ type: 'uuid' })
  @IsUUID()
  categoryId!: string;

  // Audit Fields
  @CreateDateColumn()
  override createdAt!: Date;

  @UpdateDateColumn()
  override updatedAt!: Date;

  @DeleteDateColumn()
  override deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  override createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  override updatedBy?: string;

  /**
   * Validate monthly budget before insert
   */
  @BeforeInsert()
  async validateMonthlyBudgetBeforeInsert(): Promise<void> {
    this.validateMonthlyBudgetData();
    this.calculateVariance();
    this.setMonthDates();
    
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  /**
   * Validate monthly budget before update
   */
  @BeforeUpdate()
  async validateMonthlyBudgetBeforeUpdate(): Promise<void> {
    this.validateMonthlyBudgetData();
    this.calculateVariance();
  }

  /**
   * Validate monthly budget data
   */
  private validateMonthlyBudgetData(): void {
    if (this.month < 1 || this.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    if (this.year < 2000 || this.year > 2100) {
      throw new Error('Year must be between 2000 and 2100');
    }

    if (this.budgetedAmount.lessThan(0)) {
      throw new Error('Budgeted amount cannot be negative');
    }

    if (this.actualAmount.lessThan(0)) {
      throw new Error('Actual amount cannot be negative');
    }
  }

  /**
   * Set month start and end dates
   */
  private setMonthDates(): void {
    this.monthStart = new Date(this.year, this.month - 1, 1);
    this.monthEnd = new Date(this.year, this.month, 0); // Last day of month
  }

  /**
   * Calculate variance
   */
  private calculateVariance(): void {
    this.variance = this.actualAmount.minus(this.budgetedAmount);
    
    if (this.budgetedAmount.greaterThan(0)) {
      this.variancePercentage = this.variance
        .dividedBy(this.budgetedAmount)
        .times(100);
    } else {
      this.variancePercentage = new Decimal(0);
    }

    // Calculate cumulative variance
    this.cumulativeVariance = this.cumulativeActual.minus(this.cumulativeBudgeted);

    // Calculate per-resident metrics
    if (this.actualOccupancy && this.actualOccupancy > 0) {
      this.actualPerResident = this.actualAmount.dividedBy(this.actualOccupancy);
    }

    if (this.plannedOccupancy && this.plannedOccupancy > 0) {
      this.budgetPerResident = this.budgetedAmount.dividedBy(this.plannedOccupancy);
    }
  }

  /**
   * Update actual amount and recalculate
   */
  updateActualAmount(amount: Decimal): void {
    this.actualAmount = amount;
    this.calculateVariance();
    this.isActualized = true;
  }

  /**
   * Update cumulative amounts
   */
  updateCumulativeAmounts(budgeted: Decimal, actual: Decimal): void {
    this.cumulativeBudgeted = budgeted;
    this.cumulativeActual = actual;
    this.calculateVariance();
  }

  /**
   * Lock the monthly budget
   */
  lock(): void {
    if (!this.isActualized) {
      throw new Error('Cannot lock monthly budget without actual amounts');
    }
    this.isLocked = true;
  }

  /**
   * Unlock the monthly budget
   */
  unlock(): void {
    this.isLocked = false;
  }

  /**
   * Check if month is current
   */
  isCurrentMonth(): boolean {
    const now = new Date();
    return now.getFullYear() === this.year && now.getMonth() + 1 === this.month;
  }

  /**
   * Check if month is in the past
   */
  isPastMonth(): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    return this.year < currentYear || 
           (this.year === currentYear && this.month < currentMonth);
  }

  /**
   * Check if over budget
   */
  isOverBudget(): boolean {
    return this.variance.greaterThan(0);
  }

  /**
   * Get budget utilization percentage
   */
  getBudgetUtilization(): number {
    if (this.budgetedAmount.equals(0)) return 0;
    
    return this.actualAmount
      .dividedBy(this.budgetedAmount)
      .times(100)
      .toNumber();
  }

  /**
   * Get month name
   */
  getMonthName(): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[this.month - 1];
  }

  /**
   * Get formatted period
   */
  getFormattedPeriod(): string {
    return `${this.getMonthName()} ${this.year}`;
  }

  /**
   * Get formatted budgeted amount
   */
  getFormattedBudgetedAmount(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(this.budgetedAmount.toNumber());
  }

  /**
   * Get formatted actual amount
   */
  getFormattedActualAmount(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(this.actualAmount.toNumber());
  }

  /**
   * Get monthly budget summary
   */
  getSummary(): {
    id: string;
    period: string;
    budgetedAmount: string;
    actualAmount: string;
    variance: string;
    variancePercentage: string;
    utilization: string;
    isOverBudget: boolean;
    isLocked: boolean;
  } {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const variance = this.variance.toNumber();
    const sign = variance >= 0 ? '+' : '';

    return {
      id: this.id,
      period: this.getFormattedPeriod(),
      budgetedAmount: this.getFormattedBudgetedAmount(),
      actualAmount: this.getFormattedActualAmount(),
      variance: `${sign}${formatter.format(variance)}`,
      variancePercentage: `${this.variancePercentage.toFixed(1)}%`,
      utilization: `${this.getBudgetUtilization().toFixed(1)}%`,
      isOverBudget: this.isOverBudget(),
      isLocked: this.isLocked
    };
  }
}

export default MonthlyBudget;