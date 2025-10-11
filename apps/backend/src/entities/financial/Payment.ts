import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Payment Entity for WriteCareNotes
 * @module PaymentEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Payment entity for healthcare payment processing and reconciliation
 * with comprehensive audit trails, encryption, and compliance features.
 * 
 * @compliance
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - FCA (Financial Conduct Authority) regulations
 * - PSD2 (Payment Services Directive 2) compliance
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
import { IsUUID, IsEnum, IsDecimal, IsString, IsOptional, IsDate, IsBoolean, Length } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { Invoice } from './Invoice';
import { ChartOfAccounts } from './ChartOfAccounts';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger } from '@/utils/logger';

/**
 * Payment status enumeration
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  DISPUTED = 'disputed',
  REVERSED = 'reversed'
}

/**
 * Payment method enumeration
 */
export enum PaymentMethod {
  BANK_TRANSFER = 'bank_transfer',
  DIRECT_DEBIT = 'direct_debit',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  CHEQUE = 'cheque',
  BACS = 'bacs',
  FASTER_PAYMENTS = 'faster_payments',
  CHAPS = 'chaps',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
  WORLD_PAY = 'world_pay',
  SAGE_PAY = 'sage_pay'
}

/**
 * Payment type enumeration
 */
export enum PaymentType {
  INVOICE_PAYMENT = 'invoice_payment',
  ADVANCE_PAYMENT = 'advance_payment',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
  REIMBURSEMENT = 'reimbursement',
  DEPOSIT = 'deposit',
  INSTALMENT = 'instalment'
}

/**
 * Payment entity with comprehensive healthcare payment processing features
 */
@Entity('wcn_payments')
@Index(['paymentReference'], { unique: true })
@Index(['status', 'paymentDate'])
@Index(['invoiceId', 'paymentType'])
@Index(['paymentMethod', 'status'])
export class Payment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Payment Identification
  @Column({ type: 'var char', length: 100, unique: true })
  @IsString()
  @Length(1, 100)
  paymentReference!: string;

  @Column({ type: 'enum', enum: PaymentType })
  @IsEnum(PaymentType)
  paymentType!: PaymentType;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @Column({ type: 'enum', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  amount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  refundedAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  processingFee!: Decimal;

  @Column({ type: 'var char', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  // Payment Dates
  @Column({ type: 'date' })
  @IsDate()
  paymentDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  processedDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  completedDate?: Date;

  // Payment Details
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  // Encrypted payment details (PCI DSS compliance)
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  cardLastFour?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  cardExpiry?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  bankAccountLastFour?: string;

  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  sortCode?: string;

  // External Payment Provider Information
  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  providerTransactionId?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  providerReference?: string;

  @Column({ type: 'var char', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  providerName?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  providerResponse?: string;

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
  isReconciled!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  reconciledDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  reconciledBy?: string;

  // Risk and Fraud Detection
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  @IsDecimal({ decimal_digits: '0,2' })
  @Transform(({ value }) => new Decimal(value))
  riskScore!: Decimal;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isHighRisk!: boolean;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  riskNotes?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresManualReview!: boolean;

  // Refund Information
  @Column({ type: 'var char', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  refundReference?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  refundReason?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  refundedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  refundedDate?: Date;

  // Approval Workflow
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
  @ManyToOne(() => Invoice, invoice => invoice.payments)
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

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
   * Encrypt sensitive data before inserting
   */
  @BeforeInsert()
  async encryptSensitiveDataBeforeInsert(): Promise<void> {
    await this.encryptSensitiveFields();
    this.validatePaymentData();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    
    if (!this.paymentReference) {
      this.paymentReference = this.generatePaymentReference();
    }
    
    console.info('Payment created', {
      paymentId: this.id,
      paymentReference: this.paymentReference,
      amount: this.amount.toString(),
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Encrypt sensitive data before updating
   */
  @BeforeUpdate()
  async encryptSensitiveDataBeforeUpdate(): Promise<void> {
    await this.encryptSensitiveFields();
    this.validatePaymentData();
    
    console.info('Payment updated', {
      paymentId: this.id,
      paymentReference: this.paymentReference,
      updatedBy: this.updatedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Encrypt all sensitive fields
   */
  private async encryptSensitiveFields(): Promise<void> {
    if (this.cardLastFour) {
      this.cardLastFour = await HealthcareEncryption.encrypt(this.cardLastFour);
    }
    
    if (this.cardExpiry) {
      this.cardExpiry = await HealthcareEncryption.encrypt(this.cardExpiry);
    }
    
    if (this.bankAccountLastFour) {
      this.bankAccountLastFour = await HealthcareEncryption.encrypt(this.bankAccountLastFour);
    }
    
    if (this.sortCode) {
      this.sortCode = await HealthcareEncryption.encrypt(this.sortCode);
    }
  }

  /**
   * Validate payment data
   */
  private validatePaymentData(): void {
    if (this.amount.lessThanOrEqualTo(0)) {
      throw new Error('Payment amount must be positive');
    }

    if (this.refundedAmount.greaterThan(this.amount)) {
      throw new Error('Refunded amount cannot exceed payment amount');
    }

    if (this.paymentDate > new Date()) {
      throw new Error('Payment date cannot be in the future');
    }
  }

  /**
   * Generate payment reference
   */
  private generatePaymentReference(): string {
    const year = this.paymentDate.getFullYear();
    const month = (this.paymentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = this.paymentDate.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `PAY-${year}${month}${day}-${timestamp}`;
  }

  /**
   * Get formatted amount with currency
   */
  getFormattedAmount(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
    
    return formatter.format(this.amount.toNumber());
  }

  /**
   * Check if payment is completed
   */
  isCompleted(): boolean {
    return this.status === PaymentStatus.COMPLETED;
  }

  /**
   * Check if payment is failed
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  /**
   * Check if payment is refunded
   */
  isRefunded(): boolean {
    return this.status === PaymentStatus.REFUNDED || this.status === PaymentStatus.PARTIALLY_REFUNDED;
  }

  /**
   * Get net amount after processing fees
   */
  getNetAmount(): Decimal {
    return this.amount.minus(this.processingFee);
  }

  /**
   * Get remaining refundable amount
   */
  getRefundableAmount(): Decimal {
    return this.amount.minus(this.refundedAmount);
  }

  /**
   * Process payment
   */
  process(): void {
    if (this.status !== PaymentStatus.PENDING) {
      throw new Error('Only pending payments can be processed');
    }
    
    this.status = PaymentStatus.PROCESSING;
    this.processedDate = new Date();
    
    console.info('Payment processing started', {
      paymentId: this.id,
      paymentReference: this.paymentReference,
      auditTrail: true
    });
  }

  /**
   * Complete payment
   */
  complete(): void {
    if (this.status !== PaymentStatus.PROCESSING) {
      throw new Error('Only processing payments can be completed');
    }
    
    this.status = PaymentStatus.COMPLETED;
    this.completedDate = new Date();
    
    console.info('Payment completed', {
      paymentId: this.id,
      paymentReference: this.paymentReference,
      amount: this.amount.toString(),
      auditTrail: true
    });
  }

  /**
   * Fail payment
   */
  fail(reason?: string): void {
    if (this.status === PaymentStatus.COMPLETED) {
      throw new Error('Completed payments cannot be failed');
    }
    
    this.status = PaymentStatus.FAILED;
    if (reason) {
      this.notes = this.notes ? `${this.notes}\nFailure reason: ${reason}` : `Failure reason: ${reason}`;
    }
    
    console.info('Payment failed', {
      paymentId: this.id,
      paymentReference: this.paymentReference,
      reason,
      auditTrail: true
    });
  }

  /**
   * Process refund
   */
  processRefund(amount: Decimal, reason: string, refundedBy: string): void {
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Refund amount must be positive');
    }
    
    if (amount.greaterThan(this.getRefundableAmount())) {
      throw new Error('Refund amount cannot exceed refundable amount');
    }
    
    this.refundedAmount = this.refundedAmount.plus(amount);
    this.refundReason = reason;
    this.refundedBy = refundedBy;
    this.refundedDate = new Date();
    
    if (this.refundedAmount.equals(this.amount)) {
      this.status = PaymentStatus.REFUNDED;
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED;
    }
    
    console.info('Payment refund processed', {
      paymentId: this.id,
      refundAmount: amount.toString(),
      totalRefunded: this.refundedAmount.toString(),
      reason,
      refundedBy,
      auditTrail: true
    });
  }

  /**
   * Reconcile payment
   */
  reconcile(reconciledBy: string): void {
    if (this.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be reconciled');
    }
    
    this.isReconciled = true;
    this.reconciledDate = new Date();
    this.reconciledBy = reconciledBy;
    
    console.info('Payment reconciled', {
      paymentId: this.id,
      paymentReference: this.paymentReference,
      reconciledBy,
      auditTrail: true
    });
  }

  /**
   * Get payment summary
   */
  getSummary(): {
    id: string;
    paymentReference: string;
    amount: string;
    status: PaymentStatus;
    paymentMethod: PaymentMethod;
    isReconciled: boolean;
    refundedAmount: string;
  } {
    return {
      id: this.id,
      paymentReference: this.paymentReference,
      amount: this.getFormattedAmount(),
      status: this.status,
      paymentMethod: this.paymentMethod,
      isReconciled: this.isReconciled,
      refundedAmount: this.refundedAmount.toString()
    };
  }
}

export default Payment;
