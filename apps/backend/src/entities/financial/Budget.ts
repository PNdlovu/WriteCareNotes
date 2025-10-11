import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Budget Entity for WriteCareNotes
 * @module BudgetEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Budget entity for financial planning and variance analysis
 * with healthcare-specific budgeting features.
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
import { BudgetCategory } from './BudgetCategory';
import { logger } from '@/utils/logger';

/**
 * Currency enumeration
 */
export enum Currency {
  GBP = 'GBP',
  USD = 'USD',
  EUR = 'EUR',
  CAD = 'CAD',
  AUD = 'AUD'
}

/**
 * Budget status enumeration
 */
export enum BudgetStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  ACTIVE = 'active',
  LOCKED = 'locked',
  ARCHIVED = 'archived'
}

/**
 * Budget type enumeration
 */
export enum BudgetType {
  ANNUAL = 'annual',
  QUARTERLY = 'quarterly',
  MONTHLY = 'monthly',
  PROJECT = 'project',
  DEPARTMENT = 'department',
  CAPITAL = 'capital',
  OPERATIONAL = 'operational'
}

/**
 * Budget entity for comprehensive financial planning
 */
@Entity('wcn_budgets')
@Index(['financialYear', 'budgetType'])
@Index(['status', 'isActive'])
@Index(['startDate', 'endDate'])
export class Budget extends BaseEntity {

  // Budget Identification
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  budgetName!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  budgetCode?: string;

  @Column({ type: 'enum', enum: BudgetType })
  @IsEnum(BudgetType)
  budgetType!: BudgetType;

  @Column({ type: 'text', nullable: true })
  @IsString()
  description?: string;

  // Budget Period
  @Column({ type: 'varchar', length: 10 })
  @IsString()
  @Length(4, 10)
  financialYear!: string;

  @Column({ type: 'date' })
  @IsDate()
  startDate!: Date;

  @Column({ type: 'date' })
  @IsDate()
  endDate!: Date;

  // Budget Status
  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.DRAFT })
  @IsEnum(BudgetStatus)
  status!: BudgetStatus;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  // Financial Totals
  @Column({ type: 'enum', enum: Currency, default: Currency.GBP })
  @IsEnum(Currency)
  currency!: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalBudgetedRevenue!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalBudgetedExpenses!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalBudgetedProfit!: Decimal;

  // Actual vs Budget Tracking
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  actualRevenue!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  actualExpenses!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  actualProfit!: Decimal;

  // Variance Analysis
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  revenueVariance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  expenseVariance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  profitVariance!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  revenueVariancePercentage!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  expenseVariancePercentage!: Decimal;

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  approvedDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsString()
  approvalNotes?: string;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  careHomeId?: string;

  @Column({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Column({ type: 'integer', nullable: true })
  budgetedOccupancy?: number;

  @Column({ type: 'integer', nullable: true })
  actualOccupancy?: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetedRevenuePerBed?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetedCostPerResident?: Decimal;

  // Relationships
  @OneToMany(() => BudgetCategory, category => category.budget, { cascade: true })
  categories!: BudgetCategory[];

  // Additional Audit Fields
  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  /**
   * Validate budget before insert
   */
  @BeforeInsert()
  async validateBudgetBeforeInsert(): Promise<void> {
    this.validateBudgetData();
    this.calculateBudgetTotals();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.budgetCode) {
      this.budgetCode = this.generateBudgetCode();
    }
    
    console.info('Budget created', {
      budgetId: this.id,
      budgetName: this.budgetName,
      totalBudget: this.totalBudgetedProfit.toString(),
      auditTrail: true
    });
  }

  /**
   * Validate budget before update
   */
  @BeforeUpdate()
  async validateBudgetBeforeUpdate(): Promise<void> {
    this.validateBudgetData();
    this.calculateBudgetTotals();
    this.calculateVariances();
    
    console.info('Budget updated', {
      budgetId: this.id,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate budget data
   */
  private validateBudgetData(): void {
    if (this.startDate >= this.endDate) {
      throw new Error('Budget start date must be before end date');
    }

    if (this.totalBudgetedRevenue.lessThan(0)) {
      throw new Error('Budgeted revenue cannot be negative');
    }

    if (this.totalBudgetedExpenses.lessThan(0)) {
      throw new Error('Budgeted expenses cannot be negative');
    }
  }

  /**
   * Calculate budget totals from categories
   */
  private calculateBudgetTotals(): void {
    this.totalBudgetedProfit = this.totalBudgetedRevenue.minus(this.totalBudgetedExpenses);
  }

  /**
   * Calculate variance analysis
   */
  private calculateVariances(): void {
    // Revenue variance
    this.revenueVariance = this.actualRevenue.minus(this.totalBudgetedRevenue);
    this.revenueVariancePercentage = this.totalBudgetedRevenue.greaterThan(0) 
      ? this.revenueVariance.dividedBy(this.totalBudgetedRevenue).times(100)
      : new Decimal(0);

    // Expense variance
    this.expenseVariance = this.actualExpenses.minus(this.totalBudgetedExpenses);
    this.expenseVariancePercentage = this.totalBudgetedExpenses.greaterThan(0)
      ? this.expenseVariance.dividedBy(this.totalBudgetedExpenses).times(100)
      : new Decimal(0);

    // Profit variance
    this.profitVariance = this.actualProfit.minus(this.totalBudgetedProfit);
  }

  /**
   * Generate budget code
   */
  private generateBudgetCode(): string {
    const year = this.financialYear.split('-')[0];
    const typeCode = this.budgetType.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    
    return `${year}-${typeCode}-${timestamp}`;
  }

  /**
   * Approve budget
   */
  approve(approvedBy: string, notes?: string): void {
    if (this.status !== BudgetStatus.PENDING_APPROVAL) {
      throw new Error('Budget is not pending approval');
    }
    
    this.status = BudgetStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
    this.approvalNotes = notes;
    
    console.info('Budget approved', {
      budgetId: this.id,
      budgetName: this.budgetName,
      approvedBy,
      auditTrail: true
    });
  }

  /**
   * Activate budget
   */
  activate(): void {
    if (this.status !== BudgetStatus.APPROVED) {
      throw new Error('Budget must be approved before activation');
    }
    
    this.status = BudgetStatus.ACTIVE;
    this.isActive = true;
    
    console.info('Budget activated', {
      budgetId: this.id,
      budgetName: this.budgetName,
      auditTrail: true
    });
  }

  /**
   * Get budget performance summary
   */
  getPerformanceSummary(): {
    budgetUtilization: string;
    revenuePerformance: string;
    expensePerformance: string;
    overallPerformance: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  } {
    const revenuePerf = this.revenueVariancePercentage.toNumber();
    const expensePerf = this.expenseVariancePercentage.toNumber();
    
    letoverallPerformance: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    
    if (revenuePerf >= 5 && expensePerf <= -5) {
      overallPerformance = 'EXCELLENT';
    } else if (revenuePerf >= 0 && expensePerf <= 0) {
      overallPerformance = 'GOOD';
    } else if (Math.abs(revenuePerf) <= 10 && Math.abs(expensePerf) <= 10) {
      overallPerformance = 'FAIR';
    } else {
      overallPerformance = 'POOR';
    }
    
    return {
      budgetUtilization: `${((this.actualExpenses.dividedBy(this.totalBudgetedExpenses)).times(100)).toFixed(1)}%`,
      revenuePerformance: `${revenuePerf.toFixed(1)}%`,
      expensePerformance: `${expensePerf.toFixed(1)}%`,
      overallPerformance
    };
  }

  /**
   * Get budget variance analysis
   */
  getVarianceAnalysis(): {
    revenueVariance: string;
    revenueVariancePercentage: string;
    expenseVariance: string;
    expenseVariancePercentage: string;
    profitVariance: string;
    isRevenueFavorable: boolean;
    isExpenseFavorable: boolean;
    isProfitFavorable: boolean;
  } {
    return {
      revenueVariance: this.revenueVariance.toString(),
      revenueVariancePercentage: this.revenueVariancePercentage.toString(),
      expenseVariance: this.expenseVariance.toString(),
      expenseVariancePercentage: this.expenseVariancePercentage.toString(),
      profitVariance: this.profitVariance.toString(),
      isRevenueFavorable: this.revenueVariance.greaterThan(0),
      isExpenseFavorable: this.expenseVariance.lessThan(0),
      isProfitFavorable: this.profitVariance.greaterThan(0)
    };
  }

  /**
   * Get budget utilization metrics
   */
  getUtilizationMetrics(): {
    revenueUtilization: string;
    expenseUtilization: string;
    profitUtilization: string;
    daysRemaining: number;
    projectedRevenue: string;
    projectedExpenses: string;
    projectedProfit: string;
  } {
    const now = new Date();
    const totalDays = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    
    const revenueUtilization = this.totalBudgetedRevenue.greaterThan(0) 
      ? this.actualRevenue.dividedBy(this.totalBudgetedRevenue).times(100)
      : new Decimal(0);
    
    const expenseUtilization = this.totalBudgetedExpenses.greaterThan(0)
      ? this.actualExpenses.dividedBy(this.totalBudgetedExpenses).times(100)
      : new Decimal(0);
    
    const profitUtilization = this.totalBudgetedProfit.greaterThan(0)
      ? this.actualProfit.dividedBy(this.totalBudgetedProfit).times(100)
      : new Decimal(0);
    
    // Projected values based on current performance
    const projectedRevenue = daysRemaining > 0 
      ? this.actualRevenue.plus(this.actualRevenue.dividedBy(daysElapsed).times(daysRemaining))
      : this.actualRevenue;
    
    const projectedExpenses = daysRemaining > 0
      ? this.actualExpenses.plus(this.actualExpenses.dividedBy(daysElapsed).times(daysRemaining))
      : this.actualExpenses;
    
    const projectedProfit = projectedRevenue.minus(projectedExpenses);
    
    return {
      revenueUtilization: revenueUtilization.toFixed(1),
      expenseUtilization: expenseUtilization.toFixed(1),
      profitUtilization: profitUtilization.toFixed(1),
      daysRemaining,
      projectedRevenue: projectedRevenue.toString(),
      projectedExpenses: projectedExpenses.toString(),
      projectedProfit: projectedProfit.toString()
    };
  }

  /**
   * Get budget forecasting data
   */
  getForecastingData(): {
    currentPeriod: string;
    totalPeriod: string;
    completionPercentage: string;
    trendAnalysis: {
      revenueTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
      expenseTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
      profitTrend: 'INCREASING' | 'DECREASING' | 'STABLE';
    };
    riskAssessment: {
      revenueRisk: 'LOW' | 'MEDIUM' | 'HIGH';
      expenseRisk: 'LOW' | 'MEDIUM' | 'HIGH';
      overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    };
    recommendations: string[];
  } {
    const now = new Date();
    const totalDays = Math.ceil((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysElapsed = Math.ceil((now.getTime() - this.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const completionPercentage = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
    
    // Trend analysis based on variance percentages
    const revenueTrend = this.revenueVariancePercentage.greaterThan(5) ? 'INCREASING' : 
                        this.revenueVariancePercentage.lessThan(-5) ? 'DECREASING' : 'STABLE';
    
    const expenseTrend = this.expenseVariancePercentage.greaterThan(5) ? 'INCREASING' : 
                        this.expenseVariancePercentage.lessThan(-5) ? 'DECREASING' : 'STABLE';
    
    const profitTrend = this.profitVariance.greaterThan(0) ? 'INCREASING' : 
                       this.profitVariance.lessThan(0) ? 'DECREASING' : 'STABLE';
    
    // Risk assessment
    const revenueRisk = Math.abs(this.revenueVariancePercentage.toNumber()) > 20 ? 'HIGH' :
                       Math.abs(this.revenueVariancePercentage.toNumber()) > 10 ? 'MEDIUM' : 'LOW';
    
    const expenseRisk = Math.abs(this.expenseVariancePercentage.toNumber()) > 20 ? 'HIGH' :
                       Math.abs(this.expenseVariancePercentage.toNumber()) > 10 ? 'MEDIUM' : 'LOW';
    
    const overallRisk = revenueRisk === 'HIGH' || expenseRisk === 'HIGH' ? 'HIGH' :
                       revenueRisk === 'MEDIUM' || expenseRisk === 'MEDIUM' ? 'MEDIUM' : 'LOW';
    
    // Generate recommendations
    constrecommendations: string[] = [];
    
    if (this.revenueVariancePercentage.lessThan(-10)) {
      recommendations.push('Revenue is significantly below budget. Consider reviewing pricing or increasing marketing efforts.');
    }
    
    if (this.expenseVariancePercentage.greaterThan(10)) {
      recommendations.push('Expenses are significantly above budget. Review cost controls and identify areas for reduction.');
    }
    
    if (this.profitVariance.lessThan(0)) {
      recommendations.push('Profit is below budget. Focus on revenue growth and cost management.');
    }
    
    if (completionPercentage > 50 && this.actualRevenue.lessThan(this.totalBudgetedRevenue.dividedBy(2))) {
      recommendations.push('Halfway through budget period with low revenue. Consider urgent action to meet targets.');
    }
    
    return {
      currentPeriod: `${daysElapsed} days`,
      totalPeriod: `${totalDays} days`,
      completionPercentage: completionPercentage.toFixed(1),
      trendAnalysis: {
        revenueTrend,
        expenseTrend,
        profitTrend
      },
      riskAssessment: {
        revenueRisk,
        expenseRisk,
        overallRisk
      },
      recommendations
    };
  }

  /**
   * Get budget summary for reporting
   */
  getBudgetSummary(): {
    id: string;
    budgetName: string;
    budgetType: BudgetType;
    status: BudgetStatus;
    financialYear: string;
    startDate: Date;
    endDate: Date;
    totalBudgetedRevenue: string;
    totalBudgetedExpenses: string;
    totalBudgetedProfit: string;
    actualRevenue: string;
    actualExpenses: string;
    actualProfit: string;
    revenueVariance: string;
    expenseVariance: string;
    profitVariance: string;
    isActive: boolean;
  } {
    return {
      id: this.id,
      budgetName: this.budgetName,
      budgetType: this.budgetType,
      status: this.status,
      financialYear: this.financialYear,
      startDate: this.startDate,
      endDate: this.endDate,
      totalBudgetedRevenue: this.totalBudgetedRevenue.toString(),
      totalBudgetedExpenses: this.totalBudgetedExpenses.toString(),
      totalBudgetedProfit: this.totalBudgetedProfit.toString(),
      actualRevenue: this.actualRevenue.toString(),
      actualExpenses: this.actualExpenses.toString(),
      actualProfit: this.actualProfit.toString(),
      revenueVariance: this.revenueVariance.toString(),
      expenseVariance: this.expenseVariance.toString(),
      profitVariance: this.profitVariance.toString(),
      isActive: this.isActive
    };
  }
}

export default Budget;
