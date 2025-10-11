import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Budget Category Entity for WriteCareNotes
 * @module BudgetCategoryEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Budget category entity for detailed budget breakdown
 * with healthcare-specific categorization.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsUUID, IsDecimal, IsString, IsBoolean, Length } from 'class-validator';
import { Decimal } from 'decimal.js';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Budget } from './Budget';
import { MonthlyBudget } from './MonthlyBudget';

/**
 * Budget Category entity for detailed budget planning
 */
@Entity('wcn_budget_categories')
@Index(['budgetId', 'categoryName'])
@Index(['isActive'])
export class BudgetCategory extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  overrideid!: string;

  // Category Identification
  @Column({ type: 'var char', length: 255 })
  @IsString()
  @Length(1, 255)
  categoryName!: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  categoryCode?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  description?: string;

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

  // Category Configuration
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  sortOrder!: number;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  parentCategoryId?: string;

  // Healthcare-Specific Fields
  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  costCenter?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsString()
  departmentCode?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isResidentSpecific!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isStaffRelated!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isClinicalExpense!: boolean;

  // Allocation Rules
  @Column({ type: 'var char', length: 50, nullable: true })
  @IsString()
  allocationMethod?: string; // FIXED, PER_RESIDENT, PER_BED, PERCENTAGE

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  allocationRate?: Decimal;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  baseUnits?: number; // beds, residents, etc.

  // Relationships
  @ManyToOne(() => Budget, budget => budget.categories)
  @JoinColumn({ name: 'budget_id' })
  budget!: Budget;

  @Column({ type: 'uuid' })
  @IsUUID()
  budgetId!: string;

  @OneToMany(() => MonthlyBudget, monthlyBudget => monthlyBudget.category, { cascade: true })
  monthlyBreakdown!: MonthlyBudget[];

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
   * Validate category before insert
   */
  @BeforeInsert()
  async validateCategoryBeforeInsert(): Promise<void> {
    this.validateCategoryData();
    this.calculateVariance();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.categoryCode) {
      this.categoryCode = this.generateCategoryCode();
    }
  }

  /**
   * Validate category before update
   */
  @BeforeUpdate()
  async validateCategoryBeforeUpdate(): Promise<void> {
    this.validateCategoryData();
    this.calculateVariance();
  }

  /**
   * Validate category data
   */
  private validateCategoryData(): void {
    if (this.budgetedAmount.lessThan(0)) {
      throw new Error('Budgeted amount cannot be negative');
    }

    if (this.actualAmount.lessThan(0)) {
      throw new Error('Actual amount cannot be negative');
    }

    if (this.allocationRate && (this.allocationRate.lessThan(0) || this.allocationRate.greaterThan(100))) {
      throw new Error('Allocation rate must be between 0 and 100');
    }
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
  }

  /**
   * Generate category code
   */
  private generateCategoryCode(): string {
    const nameCode = this.categoryName
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 6)
      .toUpperCase();
    
    const timestamp = Date.now().toString().slice(-4);
    return `${nameCode}${timestamp}`;
  }

  /**
   * Update actual amount
   */
  updateActualAmount(amount: Decimal): void {
    this.actualAmount = amount;
    this.calculateVariance();
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
   * Get formatted variance
   */
  getFormattedVariance(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    const variance = this.variance.toNumber();
    const sign = variance >= 0 ? '+' : '';
    return `${sign}${formatter.format(variance)}`;
  }

  /**
   * Check if over budget
   */
  isOverBudget(): boolean {
    return this.variance.greaterThan(0);
  }

  /**
   * Check if significantly over budget (>10%)
   */
  isSignificantlyOverBudget(): boolean {
    return this.variancePercentage.greaterThan(10);
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
   * Get category summary
   */
  getSummary(): {
    id: string;
    name: string;
    budgetedAmount: string;
    actualAmount: string;
    variance: string;
    variancePercentage: string;
    utilization: string;
    isOverBudget: boolean;
  } {
    return {
      id: this.id,
      name: this.categoryName,
      budgetedAmount: this.getFormattedBudgetedAmount(),
      actualAmount: this.getFormattedActualAmount(),
      variance: this.getFormattedVariance(),
      variancePercentage: `${this.variancePercentage.toFixed(1)}%`,
      utilization: `${this.getBudgetUtilization().toFixed(1)}%`,
      isOverBudget: this.isOverBudget()
    };
  }
}

export default BudgetCategory;
