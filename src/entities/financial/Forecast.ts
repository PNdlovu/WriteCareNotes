import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Forecast Entity for WriteCareNotes
 * @module ForecastEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Financial forecast entity for predictive analytics
 * with healthcare-specific forecasting capabilities.
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
import { ForecastType, ForecastMethodology, ForecastStatus } from '@/services/financial/interfaces/FinancialAnalyticsInterfaces';

/**
 * Forecast projection data structure
 */
export interface ForecastProjection {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  projectedValue: Decimal;
  confidence: number;
  upperBound: Decimal;
  lowerBound: Decimal;
  factors: ProjectionFactor[];
}

export interface ProjectionFactor {
  factorName: string;
  impact: number;
  confidence: number;
}

/**
 * Forecast entity for financial predictions and planning
 */
@Entity('wcn_forecasts')
@Index(['forecastType', 'status'])
@Index(['entityType', 'entityId'])
@Index(['periodStart', 'periodEnd'])
export class Forecast extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  override id!: string;

  // Forecast Identification
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  forecastName!: string;

  @Column({ type: 'enum', enum: ForecastType })
  @IsEnum(ForecastType)
  forecastType!: ForecastType;

  @Column({ type: 'text', nullable: true })
  @IsString()
  description?: string;

  // Forecast Period
  @Column({ type: 'date' })
  @IsDate()
  periodStart!: Date;

  @Column({ type: 'date' })
  @IsDate()
  periodEnd!: Date;

  @Column({ type: 'integer' })
  @IsNumber()
  periodMonths!: number;

  // Forecast Configuration
  @Column({ type: 'enum', enum: ForecastMethodology })
  @IsEnum(ForecastMethodology)
  methodology!: ForecastMethodology;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  confidence!: Decimal;

  @Column({ type: 'enum', enum: ForecastStatus, default: ForecastStatus.ACTIVE })
  @IsEnum(ForecastStatus)
  status!: ForecastStatus;

  // Entity Context
  @Column({ type: 'varchar', length: 50 })
  @IsString()
  entityType!: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  entityId?: string;

  // Financial Information
  @Column({ type: 'enum', enum: Currency, default: Currency.GBP })
  @IsEnum(Currency)
  currency!: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  baselineValue?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  projectedTotal?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  upperBoundTotal?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  lowerBoundTotal?: Decimal;

  // Model Performance
  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  accuracy?: Decimal;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  meanAbsoluteError?: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  rSquared?: Decimal;

  // Historical Data Context
  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  lookbackMonths?: number;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  dataPointsUsed?: number;

  @Column({ type: 'date', nullable: true })
  @IsDate()
  lastDataPoint?: Date;

  // Forecast Projections (JSON)
  @Column({ type: 'jsonb' })
  projections!: ForecastProjection[];

  // Model Assumptions (JSON)
  @Column({ type: 'jsonb', nullable: true })
  assumptions?: Record<string, any>;

  // External Factors (JSON)
  @Column({ type: 'jsonb', nullable: true })
  externalFactors?: Record<string, any>;

  // Validation and Review
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isValidated!: boolean;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  validatedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  validatedDate?: Date;

  @Column({ type: 'text', nullable: true })
  @IsString()
  validationNotes?: string;

  // Review and Approval
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isApproved!: boolean;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  approvedDate?: Date;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  careHomeId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  departmentId?: string;

  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  projectedOccupancy?: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  projectedRevenuePerBed?: Decimal;

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
   * Validate forecast before insert
   */
  @BeforeInsert()
  async validateForecastBeforeInsert(): Promise<void> {
    this.validateForecastData();
    this.calculateForecastMetrics();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.forecastName) {
      this.forecastName = this.generateForecastName();
    }
  }

  /**
   * Validate forecast before update
   */
  @BeforeUpdate()
  async validateForecastBeforeUpdate(): Promise<void> {
    this.validateForecastData();
    this.calculateForecastMetrics();
  }

  /**
   * Validate forecast data
   */
  private validateForecastData(): void {
    if (this.periodStart >= this.periodEnd) {
      throw new Error('Forecast period start must be before end date');
    }

    if (this.confidence.lessThan(0) || this.confidence.greaterThan(1)) {
      throw new Error('Confidence must be between 0 and 1');
    }

    if (this.periodMonths <= 0) {
      throw new Error('Period months must be positive');
    }

    if (!this.projections || this.projections.length === 0) {
      throw new Error('Forecast must have at least one projection');
    }
  }

  /**
   * Calculate forecast metrics
   */
  private calculateForecastMetrics(): void {
    if (this.projections && this.projections.length > 0) {
      // Calculate total projected value
      this.projectedTotal = this.projections.reduce(
        (sum, projection) => sum.plus(projection.projectedValue),
        new Decimal(0)
      );

      // Calculate upper and lower bounds
      this.upperBoundTotal = this.projections.reduce(
        (sum, projection) => sum.plus(projection.upperBound),
        new Decimal(0)
      );

      this.lowerBoundTotal = this.projections.reduce(
        (sum, projection) => sum.plus(projection.lowerBound),
        new Decimal(0)
      );
    }
  }

  /**
   * Generate forecast name
   */
  private generateForecastName(): string {
    const typeLabel = this.forecastType.replace('_', ' ').toUpperCase();
    const startMonth = this.periodStart.toISOString().slice(0, 7);
    const endMonth = this.periodEnd.toISOString().slice(0, 7);
    
    return `${typeLabel} Forecast ${startMonth} to ${endMonth}`;
  }

  /**
   * Get forecast accuracy percentage
   */
  getAccuracyPercentage(): number {
    return this.accuracy ? this.accuracy.times(100).toNumber() : 0;
  }

  /**
   * Get confidence percentage
   */
  getConfidencePercentage(): number {
    return this.confidence.times(100).toNumber();
  }

  /**
   * Check if forecast is current
   */
  isCurrent(): boolean {
    const today = new Date();
    return today >= this.periodStart && today <= this.periodEnd && this.status === ForecastStatus.ACTIVE;
  }

  /**
   * Get forecast duration in days
   */
  getDurationInDays(): number {
    const diffTime = Math.abs(this.periodEnd.getTime() - this.periodStart.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate forecast
   */
  validate(validatedBy: string, notes?: string): void {
    this.isValidated = true;
    this.validatedBy = validatedBy;
    this.validatedDate = new Date();
    this.validationNotes = notes;
  }

  /**
   * Approve forecast
   */
  approve(approvedBy: string): void {
    if (!this.isValidated) {
      throw new Error('Forecast must be validated before approval');
    }
    
    this.isApproved = true;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
  }

  /**
   * Get projection for specific period
   */
  getProjectionForPeriod(period: string): ForecastProjection | undefined {
    return this.projections.find(p => p.period === period);
  }

  /**
   * Get formatted projected total
   */
  getFormattedProjectedTotal(): string {
    if (!this.projectedTotal) return '£0.00';
    
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(this.projectedTotal.toNumber());
  }

  /**
   * Get forecast summary
   */
  getSummary(): {
    id: string;
    name: string;
    type: ForecastType;
    methodology: ForecastMethodology;
    confidence: string;
    projectedTotal: string;
    status: ForecastStatus;
    accuracy?: string;
  } {
    return {
      id: this.id,
      name: this.forecastName,
      type: this.forecastType,
      methodology: this.methodology,
      confidence: `${this.getConfidencePercentage().toFixed(1)}%`,
      projectedTotal: this.getFormattedProjectedTotal(),
      status: this.status,
      accuracy: this.accuracy ? `${this.getAccuracyPercentage().toFixed(1)}%` : undefined
    };
  }
}

export default Forecast;