import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial KPI Entity for WriteCareNotes
 * @module FinancialKPIEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Financial Key Performance Indicator entity for tracking
 * and monitoring healthcare financial metrics with compliance features.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { IsUUID, IsEnum, IsDecimal, IsString, IsBoolean, IsDate, IsNumber, Length } from 'class-validator';
import { Decimal } from 'decimal.js';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Currency } from './FinancialTransaction';
import { KPIType, KPIFrequency, TrendDirection } from '@/services/financial/interfaces/FinancialAnalyticsInterfaces';

/**
 * KPI metadata structure
 */
export interface KPIMetadata {
  calculationMethod: string;
  dataSource: string;
  lastCalculated: Date;
  nextCalculation: Date;
  benchmarkSource?: string;
  industryAverage?: number;
  topQuartile?: number;
  bottomQuartile?: number;
  alerts?: KPIAlert[];
}

export interface KPIAlert {
  alertType: AlertType;
  threshold: number;
  message: string;
  severity: AlertSeverity;
  isActive: boolean;
}

export enum AlertType {
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  THRESHOLD_BELOW = 'threshold_below',
  TREND_NEGATIVE = 'trend_negative',
  VARIANCE_HIGH = 'variance_high'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Financial KPI entity for performance monitoring
 */
@Entity('wcn_financial_kpis')
@Index(['kpiType', 'entityType'])
@Index(['calculationDate', 'frequency'])
@Index(['entityId', 'kpiType'])
export class FinancialKPI extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  override id!: string;

  // KPI Identification
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  kpiName!: string;

  @Column({ type: 'enum', enum: KPIType })
  @IsEnum(KPIType)
  kpiType!: KPIType;

  @Column({ type: 'text', nullable: true })
  @IsString()
  description?: string;

  // KPI Configuration
  @Column({ type: 'enum', enum: KPIFrequency })
  @IsEnum(KPIFrequency)
  frequency!: KPIFrequency;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  entityType!: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  entityId?: string;

  // KPI Values
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  currentValue!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  targetValue?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  previousValue?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  benchmarkValue?: Decimal;

  // Trend Analysis
  @Column({ type: 'enum', enum: TrendDirection, default: TrendDirection.STABLE })
  @IsEnum(TrendDirection)
  trend!: TrendDirection;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  changeAmount?: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  changePercentage?: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  varianceFromTarget?: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  varianceFromBenchmark?: Decimal;

  // Calculation Information
  @Column({ type: 'timestamp' })
  @IsDate()
  calculationDate!: Date;

  @Column({ type: 'date' })
  @IsDate()
  periodStart!: Date;

  @Column({ type: 'date' })
  @IsDate()
  periodEnd!: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  calculationFormula?: string;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  dataPointsUsed?: number;

  // Currency and Units
  @Column({ type: 'enum', enum: Currency, nullable: true })
  @IsEnum(Currency)
  currency?: Currency;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  unit?: string;

  @Column({ type: 'integer', default: 2 })
  @IsNumber()
  decimalPlaces!: number;

  // Performance Indicators
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  performanceScore?: Decimal;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  performanceRating?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isOnTarget!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresAttention!: boolean;

  // Metadata and Configuration
  @Column({ type: 'jsonb' })
  metadata!: KPIMetadata;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  careHomeId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  departmentId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  costCenter?: string;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  occupancyCount?: number;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  bedCount?: number;

  // Alerts and Notifications
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  hasActiveAlerts!: boolean;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  alertCount!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  highestAlertSeverity?: string;

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
   * Validate KPI before insert
   */
  @BeforeInsert()
  async validateKPIBeforeInsert(): Promise<void> {
    this.validateKPIData();
    this.calculateDerivedMetrics();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.kpiName) {
      this.kpiName = this.generateKPIName();
    }
  }

  /**
   * Validate KPI before update
   */
  @BeforeUpdate()
  async validateKPIBeforeUpdate(): Promise<void> {
    this.validateKPIData();
    this.calculateDerivedMetrics();
  }

  /**
   * Validate KPI data
   */
  private validateKPIData(): void {
    if (this.periodStart >= this.periodEnd) {
      throw new Error('KPI period start must be before end date');
    }

    if (this.calculationDate < this.periodStart || this.calculationDate > this.periodEnd) {
      throw new Error('Calculation date must be within the KPI period');
    }

    if (this.decimalPlaces < 0 || this.decimalPlaces > 10) {
      throw new Error('Decimal places must be between 0 and 10');
    }
  }

  /**
   * Calculate derived metrics
   */
  private calculateDerivedMetrics(): void {
    // Calculate change from previous value
    if (this.previousValue) {
      this.changeAmount = this.currentValue.minus(this.previousValue);
      
      if (this.previousValue.greaterThan(0)) {
        this.changePercentage = this.changeAmount
          .dividedBy(this.previousValue)
          .times(100);
      }
    }

    // Calculate variance from target
    if (this.targetValue) {
      const variance = this.currentValue.minus(this.targetValue);
      this.varianceFromTarget = this.targetValue.greaterThan(0)
        ? variance.dividedBy(this.targetValue).times(100)
        : new Decimal(0);
      
      this.isOnTarget = Math.abs(this.varianceFromTarget.toNumber()) <= 5; // 5% tolerance
    }

    // Calculate variance from benchmark
    if (this.benchmarkValue) {
      const variance = this.currentValue.minus(this.benchmarkValue);
      this.varianceFromBenchmark = this.benchmarkValue.greaterThan(0)
        ? variance.dividedBy(this.benchmarkValue).times(100)
        : new Decimal(0);
    }

    // Determine trend
    if (this.changePercentage) {
      const changePercent = this.changePercentage.toNumber();
      if (changePercent > 2) {
        this.trend = TrendDirection.UP;
      } else if (changePercent < -2) {
        this.trend = TrendDirection.DOWN;
      } else {
        this.trend = TrendDirection.STABLE;
      }
    }

    // Calculate performance score
    this.calculatePerformanceScore();

    // Check for alerts
    this.checkAlerts();
  }

  /**
   * Generate KPI name
   */
  private generateKPIName(): string {
    const typeLabel = this.kpiType.replace('_', ' ').toUpperCase();
    const entityLabel = this.entityType.replace('_', ' ').toUpperCase();
    const period = this.periodStart.toISOString().slice(0, 7);
    
    return `${typeLabel} - ${entityLabel} - ${period}`;
  }

  /**
   * Calculate performance score
   */
  private calculatePerformanceScore(): void {
    let score = 50; // Base score

    // Adjust based on target achievement
    if (this.targetValue && this.varianceFromTarget) {
      const variance = Math.abs(this.varianceFromTarget.toNumber());
      if (variance <= 5) {
        score += 30; // On target
      } else if (variance <= 10) {
        score += 20; // Close to target
      } else if (variance <= 20) {
        score += 10; // Moderately off target
      }
      // No points for being far from target
    }

    // Adjust based on benchmark comparison
    if (this.benchmarkValue && this.varianceFromBenchmark) {
      const variance = this.varianceFromBenchmark.toNumber();
      if (variance > 10) {
        score += 20; // Above benchmark
      } else if (variance > 0) {
        score += 10; // Slightly above benchmark
      } else if (variance > -10) {
        score += 5; // Slightly below benchmark
      }
      // No points for being significantly below benchmark
    }

    this.performanceScore = new Decimal(Math.min(100, Math.max(0, score)));

    // Set performance rating
    const scoreValue = this.performanceScore.toNumber();
    if (scoreValue >= 90) {
      this.performanceRating = 'EXCELLENT';
    } else if (scoreValue >= 75) {
      this.performanceRating = 'GOOD';
    } else if (scoreValue >= 60) {
      this.performanceRating = 'FAIR';
    } else if (scoreValue >= 40) {
      this.performanceRating = 'POOR';
    } else {
      this.performanceRating = 'CRITICAL';
    }
  }

  /**
   * Check for alerts
   */
  private checkAlerts(): void {
    if (!this.metadata.alerts) {
      this.hasActiveAlerts = false;
      this.alertCount = 0;
      return;
    }

    const activeAlerts = this.metadata.alerts.filter(alert => {
      if (!alert.isActive) return false;

      const currentVal = this.currentValue.toNumber();
      
      switch (alert.alertType) {
        case AlertType.THRESHOLD_EXCEEDED:
          return currentVal > alert.threshold;
        case AlertType.THRESHOLD_BELOW:
          return currentVal < alert.threshold;
        case AlertType.TREND_NEGATIVE:
          return this.trend === TrendDirection.DOWN;
        case AlertType.VARIANCE_HIGH:
          return this.varianceFromTarget && 
                 Math.abs(this.varianceFromTarget.toNumber()) > alert.threshold;
        default:
          return false;
      }
    });

    this.hasActiveAlerts = activeAlerts.length > 0;
    this.alertCount = activeAlerts.length;

    if (activeAlerts.length > 0) {
      const severities = activeAlerts.map(a => a.severity);
      if (severities.includes(AlertSeverity.CRITICAL)) {
        this.highestAlertSeverity = AlertSeverity.CRITICAL;
        this.requiresAttention = true;
      } else if (severities.includes(AlertSeverity.HIGH)) {
        this.highestAlertSeverity = AlertSeverity.HIGH;
        this.requiresAttention = true;
      } else if (severities.includes(AlertSeverity.MEDIUM)) {
        this.highestAlertSeverity = AlertSeverity.MEDIUM;
      } else {
        this.highestAlertSeverity = AlertSeverity.LOW;
      }
    }
  }

  /**
   * Get formatted current value
   */
  getFormattedCurrentValue(): string {
    if (this.currency) {
      const formatter = new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: this.currency,
        minimumFractionDigits: this.decimalPlaces,
        maximumFractionDigits: this.decimalPlaces
      });
      return formatter.format(this.currentValue.toNumber());
    }

    const value = this.currentValue.toFixed(this.decimalPlaces);
    return this.unit ? `${value} ${this.unit}` : value;
  }

  /**
   * Get change indicator
   */
  getChangeIndicator(): string {
    if (!this.changePercentage) return '';
    
    const change = this.changePercentage.toNumber();
    const symbol = change > 0 ? '↗' : change < 0 ? '↘' : '→';
    return `${symbol} ${Math.abs(change).toFixed(1)}%`;
  }

  /**
   * Check if KPI is performing well
   */
  isPerformingWell(): boolean {
    return this.performanceScore ? this.performanceScore.greaterThanOrEqualTo(75) : false;
  }

  /**
   * Get KPI summary
   */
  getSummary(): {
    id: string;
    name: string;
    type: KPIType;
    currentValue: string;
    trend: TrendDirection;
    performanceRating: string;
    changeIndicator: string;
    hasAlerts: boolean;
  } {
    return {
      id: this.id,
      name: this.kpiName,
      type: this.kpiType,
      currentValue: this.getFormattedCurrentValue(),
      trend: this.trend,
      performanceRating: this.performanceRating || 'UNKNOWN',
      changeIndicator: this.getChangeIndicator(),
      hasAlerts: this.hasActiveAlerts
    };
  }

  /**
   * Get period duration in days
   */
  getPeriodDurationInDays(): number {
    const diffTime = Math.abs(this.periodEnd.getTime() - this.periodStart.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

export default FinancialKPI;