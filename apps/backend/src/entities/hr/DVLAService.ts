import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview DVLA Service Entity for WriteCareNotes
 * @module DVLAServiceEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description DVLA service entity for managing DVLA API integrations,
 * service calls, and audit logging for driving license verification.
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
  BeforeUpdate,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IsUUID, IsEnum, IsString, IsBoolean, IsDate, Length, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { DVLACheck } from './DVLACheck';
import { logger } from '@/utils/logger';

/**
 * DVLA service status enumeration
 */
export enum DVLAServiceStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETRYING = 'retrying'
}

/**
 * DVLA service type enumeration
 */
export enum DVLAServiceType {
  LICENSE_VERIFICATION = 'license_verification',
  EXPIRY_CHECK = 'expiry_check',
  CATEGORY_VERIFICATION = 'category_verification',
  BULK_VERIFICATION = 'bulk_verification',
  RENEWAL_REMINDER = 'renewal_reminder',
  COMPLIANCE_CHECK = 'compliance_check'
}

/**
 * DVLA service priority enumeration
 */
export enum DVLAServicePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * DVLA service entity for comprehensive DVLA API integration management
 */
@Entity('wcn_dvla_services')
@Index(['dvlaCheckId', 'serviceType'])
@Index(['status', 'priority'])
@Index(['createdAt', 'status'])
@Index(['serviceType', 'status'])
export class DVLAService extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // DVLA Check Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  dvlaCheckId!: string;

  @ManyToOne(() => DVLACheck, check => check.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dvlaCheckId' })
  dvlaCheck?: DVLACheck;

  // Service Details
  @Column({ type: 'enum', enum: DVLAServiceType })
  @IsEnum(DVLAServiceType)
  serviceType!: DVLAServiceType;

  @Column({ type: 'enum', enum: DVLAServiceStatus, default: DVLAServiceStatus.PENDING })
  @IsEnum(DVLAServiceStatus)
  status!: DVLAServiceStatus;

  @Column({ type: 'enum', enum: DVLAServicePriority, default: DVLAServicePriority.MEDIUM })
  @IsEnum(DVLAServicePriority)
  priority!: DVLAServicePriority;

  // Service Configuration
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  serviceName!: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Column({ type: 'varchar', length: 500 })
  @IsString()
  @Length(1, 500)
  endpointUrl!: string;

  @Column({ type: 'varchar', length: 50, default: 'POST' })
  @IsString()
  @Length(1, 50)
  httpMethod!: string;

  @Column({ type: 'jsonb' })
  @IsOptional()
  requestHeaders!: Record<string, string>;

  @Column({ type: 'jsonb' })
  @IsOptional()
  requestPayload!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  responseData?: Record<string, any>;

  // Service Execution
  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  completedAt?: Date;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  retryCount!: number;

  @Column({ type: 'integer', default: 3 })
  @IsNumber()
  maxRetries!: number;

  @Column({ type: 'integer', default: 30 })
  @IsNumber()
  timeoutSeconds!: number;

  // Response Details
  @Column({ type: 'integer', nullable: true })
  @IsNumber()
  @IsOptional()
  httpStatusCode?: number;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  errorDetails?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  errorCode?: string;

  // Service Metadata
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  serviceVersion?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  apiVersion?: string;

  // Healthcare-Specific Fields
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  careHomeId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  department?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isComplianceCritical!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresAudit!: boolean;

  // Cost Tracking
  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : null)
  serviceCost?: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

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

  @Column({ type: 'integer', default: 1 })
  version!: number;

  /**
   * Validate DVLA service before insert
   */
  @BeforeInsert()
  async validateDVLAServiceBeforeInsert(): Promise<void> {
    this.validateDVLAServiceData();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('DVLA service created', {
      serviceId: this.id,
      dvlaCheckId: this.dvlaCheckId,
      serviceType: this.serviceType,
      auditTrail: true
    });
  }

  /**
   * Validate DVLA service before update
   */
  @BeforeUpdate()
  async validateDVLAServiceBeforeUpdate(): Promise<void> {
    this.validateDVLAServiceData();
    
    console.info('DVLA service updated', {
      serviceId: this.id,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate DVLA service data
   */
  private validateDVLAServiceData(): void {
    if (this.scheduledAt && this.scheduledAt < new Date()) {
      throw new Error('Scheduled time cannot be in the past');
    }

    if (this.retryCount > this.maxRetries) {
      throw new Error('Retry count cannot exceed max retries');
    }

    if (this.timeoutSeconds <= 0) {
      throw new Error('Timeout must be greater than 0');
    }

    if (this.isComplianceCritical && this.priority === DVLAServicePriority.LOW) {
      throw new Error('Compliance critical services must have higher priority');
    }
  }

  /**
   * Start service execution
   */
  startExecution(startedBy: string): void {
    if (this.status !== DVLAServiceStatus.PENDING) {
      throw new Error('Service must be pending to start execution');
    }

    this.status = DVLAServiceStatus.IN_PROGRESS;
    this.startedAt = new Date();
    this.updatedBy = startedBy;

    console.info('DVLA service started', {
      serviceId: this.id,
      serviceType: this.serviceType,
      startedBy,
      auditTrail: true
    });
  }

  /**
   * Complete service execution
   */
  completeExecution(responseData: Record<string, any>, httpStatusCode: number, completedBy: string): void {
    if (this.status !== DVLAServiceStatus.IN_PROGRESS) {
      throw new Error('Service must be in progress to complete');
    }

    this.status = DVLAServiceStatus.COMPLETED;
    this.responseData = responseData;
    this.httpStatusCode = httpStatusCode;
    this.completedAt = new Date();
    this.updatedBy = completedBy;

    console.info('DVLA service completed', {
      serviceId: this.id,
      serviceType: this.serviceType,
      httpStatusCode,
      completedBy,
      auditTrail: true
    });
  }

  /**
   * Fail service execution
   */
  failExecution(errorMessage: string, errorCode?: string, errorDetails?: string): void {
    if (this.status !== DVLAServiceStatus.IN_PROGRESS) {
      throw new Error('Service must be in progress to fail');
    }

    this.status = DVLAServiceStatus.FAILED;
    this.errorMessage = errorMessage;
    this.errorCode = errorCode;
    this.errorDetails = errorDetails;
    this.completedAt = new Date();

    console.info('DVLA service failed', {
      serviceId: this.id,
      serviceType: this.serviceType,
      errorMessage,
      errorCode,
      auditTrail: true
    });
  }

  /**
   * Retry service execution
   */
  retryExecution(retriedBy: string): void {
    if (this.status !== DVLAServiceStatus.FAILED) {
      throw new Error('Only failed services can be retried');
    }

    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retry attempts exceeded');
    }

    this.status = DVLAServiceStatus.RETRYING;
    this.retryCount += 1;
    this.updatedBy = retriedBy;

    console.info('DVLA service retried', {
      serviceId: this.id,
      serviceType: this.serviceType,
      retryCount: this.retryCount,
      retriedBy,
      auditTrail: true
    });
  }

  /**
   * Cancel service execution
   */
  cancelExecution(cancelledBy: string): void {
    if (this.status === DVLAServiceStatus.COMPLETED) {
      throw new Error('Cannot cancel completed services');
    }

    this.status = DVLAServiceStatus.CANCELLED;
    this.updatedBy = cancelledBy;

    console.info('DVLA service cancelled', {
      serviceId: this.id,
      serviceType: this.serviceType,
      cancelledBy,
      auditTrail: true
    });
  }

  /**
   * Check if service can be retried
   */
  canRetry(): boolean {
    return this.status === DVLAServiceStatus.FAILED && this.retryCount < this.maxRetries;
  }

  /**
   * Check if service is overdue
   */
  isOverdue(): boolean {
    if (!this.scheduledAt) return false;
    return new Date() > this.scheduledAt && this.status === DVLAServiceStatus.PENDING;
  }

  /**
   * Get service execution time
   */
  getExecutionTime(): number | null {
    if (!this.startedAt || !this.completedAt) return null;
    
    return this.completedAt.getTime() - this.startedAt.getTime();
  }

  /**
   * Get service summary
   */
  getServiceSummary(): {
    id: string;
    serviceType: DVLAServiceType;
    status: DVLAServiceStatus;
    priority: DVLAServicePriority;
    serviceName: string;
    httpStatusCode: number | null;
    retryCount: number;
    maxRetries: number;
    isOverdue: boolean;
    canRetry: boolean;
    executionTime: number | null;
  } {
    return {
      id: this.id,
      serviceType: this.serviceType,
      status: this.status,
      priority: this.priority,
      serviceName: this.serviceName,
      httpStatusCode: this.httpStatusCode || null,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      isOverdue: this.isOverdue(),
      canRetry: this.canRetry(),
      executionTime: this.getExecutionTime()
    };
  }

  /**
   * Get service execution details
   */
  getExecutionDetails(): {
    status: DVLAServiceStatus;
    scheduledAt: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    executionTime: number | null;
    httpStatusCode: number | null;
    errorMessage: string | null;
    errorCode: string | null;
    retryCount: number;
    maxRetries: number;
  } {
    return {
      status: this.status,
      scheduledAt: this.scheduledAt || null,
      startedAt: this.startedAt || null,
      completedAt: this.completedAt || null,
      executionTime: this.getExecutionTime(),
      httpStatusCode: this.httpStatusCode || null,
      errorMessage: this.errorMessage || null,
      errorCode: this.errorCode || null,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries
    };
  }
}

export default DVLAService;