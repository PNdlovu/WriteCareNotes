import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Invoice Entity for WriteCareNotes
 * @module InvoiceEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Invoice entity for healthcare billing and payment tracking
 * with comprehensive audit trails, encryption, and compliance features.
 * 
 * @compliance
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - FCA (Financial Conduct Authority) regulations
 * - NHS Digital standards for healthcare billing
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
import { IsUUID, IsEnum, IsDecimal, IsString, IsOptional, IsDate, IsBoolean, Length, IsEmail } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

import { BaseEntity } from '@/entities/BaseEntity';
import { ChartOfAccounts } from './ChartOfAccounts';
import { Payment } from './Payment';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger } from '@/utils/logger';

/**
 * Invoice status enumeration
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  VIEWED = 'viewed',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  WRITTEN_OFF = 'written_off'
}

/**
 * Invoice type enumeration
 */
export enum InvoiceType {
  RESIDENT_FEES = 'resident_fees',
  NHS_FUNDING = 'nhs_funding',
  LOCAL_AUTHORITY_FUNDING = 'local_authority_funding',
  PRIVATE_INSURANCE = 'private_insurance',
  ADDITIONAL_SERVICES = 'additional_services',
  MEDICATION = 'medication',
  THERAPY = 'therapy',
  TRANSPORT = 'transport',
  OTHER = 'other'
}

/**
 * Payment terms enumeration
 */
export enum PaymentTerms {
  NET_15 = 'net_15',
  NET_30 = 'net_30',
  NET_45 = 'net_45',
  NET_60 = 'net_60',
  DUE_ON_RECEIPT = 'due_on_receipt',
  CASH_ON_DELIVERY = 'cash_on_delivery'
}

/**
 * Invoice entity with comprehensive healthcare billing features
 */
@Entity('wcn_invoices')
@Index(['invoiceNumber'], { unique: true })
@Index(['status', 'dueDate'])
@Index(['residentId', 'invoiceType'])
@Index(['billingEntityId'])
export class Invoice extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Invoice Identification
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  @Length(1, 50)
  invoiceNumber!: string;

  @Column({ type: 'enum', enum: InvoiceType })
  @IsEnum(InvoiceType)
  invoiceType!: InvoiceType;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  @IsEnum(InvoiceStatus)
  status!: InvoiceStatus;

  // Invoice Dates
  @Column({ type: 'date' })
  @IsDate()
  invoiceDate!: Date;

  @Column({ type: 'date' })
  @IsDate()
  dueDate!: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  sentDate?: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  paidDate?: Date;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  subtotal!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  taxAmount!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  taxRate!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  paidAmount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  balanceAmount!: Decimal;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  // Billing Information
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  billingEntityId?: string;

  // Encrypted billing details (GDPR compliance)
  @Column({ type: 'text' })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => HealthcareEncryption.decrypt(value), { toClassOnly: true })
  @IsString()
  @Length(1, 1000)
  billingAddress!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  billingEmail?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  billingPhone?: string;

  // Payment Terms
  @Column({ type: 'enum', enum: PaymentTerms, default: PaymentTerms.NET_30 })
  @IsEnum(PaymentTerms)
  paymentTerms!: PaymentTerms;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  paymentInstructions?: string;

  // Invoice Details
  @Column({ type: 'text' })
  @IsString()
  @Length(1, 2000)
  description!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  // Reference Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  purchaseOrderNumber?: string;

  // Compliance and Audit
  @Column({ type: 'uuid' })
  @IsUUID()
  correlationId!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  regulatoryCode?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isVATApplicable!: boolean;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  // Overdue Management
  @Column({ type: 'integer', default: 0 })
  daysOverdue!: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  lateFeeAmount!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  lateFeeRate!: Decimal;

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
  @ManyToOne(() => ChartOfAccounts, account => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account!: ChartOfAccounts;

  @Column({ type: 'uuid' })
  @IsUUID()
  accountId!: string;

  @OneToMany(() => Payment, payment => payment.invoice)
  payments!: Payment[];

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
    this.validateInvoiceData();
    this.calculateTotals();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    
    if (!this.invoiceNumber) {
      this.invoiceNumber = this.generateInvoiceNumber();
    }
    
    console.info('Invoice created', {
      invoiceId: this.id,
      invoiceNumber: this.invoiceNumber,
      totalAmount: this.totalAmount.toString(),
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
    this.validateInvoiceData();
    this.calculateTotals();
    this.calculateOverdueStatus();
    
    console.info('Invoice updated', {
      invoiceId: this.id,
      invoiceNumber: this.invoiceNumber,
      updatedBy: this.updatedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Encrypt all sensitive fields
   */
  private async encryptSensitiveFields(): Promise<void> {
    this.billingAddress = await HealthcareEncryption.encrypt(this.billingAddress);
  }

  /**
   * Validate invoice data
   */
  private validateInvoiceData(): void {
    if (this.invoiceDate > new Date()) {
      throw new Error('Invoice date cannot be in the future');
    }

    if (this.dueDate < this.invoiceDate) {
      throw new Error('Due date cannot be before invoice date');
    }

    if (this.subtotal.lessThan(0)) {
      throw new Error('Subtotal cannot be negative');
    }

    if (this.totalAmount.lessThan(0)) {
      throw new Error('Total amount cannot be negative');
    }
  }

  /**
   * Calculate invoice totals
   */
  private calculateTotals(): void {
    this.taxAmount = this.subtotal.times(this.taxRate);
    this.totalAmount = this.subtotal.plus(this.taxAmount);
    this.balanceAmount = this.totalAmount.minus(this.paidAmount);
  }

  /**
   * Calculate overdue status
   */
  private calculateOverdueStatus(): void {
    if (this.status === InvoiceStatus.PAID || this.status === InvoiceStatus.CANCELLED) {
      this.daysOverdue = 0;
      return;
    }

    const today = new Date();
    const dueDate = new Date(this.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    this.daysOverdue = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    if (this.daysOverdue > 0 && this.status !== InvoiceStatus.OVERDUE) {
      this.status = InvoiceStatus.OVERDUE;
    }
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const year = this.invoiceDate.getFullYear();
    const month = (this.invoiceDate.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `INV-${year}${month}-${timestamp}`;
  }

  /**
   * Get formatted total amount with currency
   */
  getFormattedTotal(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
    
    return formatter.format(this.totalAmount.toNumber());
  }

  /**
   * Check if invoice is overdue
   */
  isOverdue(): boolean {
    return this.daysOverdue > 0;
  }

  /**
   * Check if invoice is fully paid
   */
  isFullyPaid(): boolean {
    return this.paidAmount.greaterThanOrEqualTo(this.totalAmount);
  }

  /**
   * Check if invoice is partially paid
   */
  isPartiallyPaid(): boolean {
    return this.paidAmount.greaterThan(0) && this.paidAmount.lessThan(this.totalAmount);
  }

  /**
   * Get payment percentage
   */
  getPaymentPercentage(): number {
    if (this.totalAmount.equals(0)) {
      return 0;
    }
    
    return this.paidAmount.dividedBy(this.totalAmount).times(100).toNumber();
  }

  /**
   * Calculate late fees
   */
  calculateLateFees(): Decimal {
    if (this.daysOverdue <= 0) {
      return new Decimal(0);
    }
    
    return this.totalAmount.times(this.lateFeeRate).times(this.daysOverdue);
  }

  /**
   * Mark invoice as sent
   */
  markAsSent(): void {
    if (this.status !== InvoiceStatus.DRAFT) {
      throw new Error('Only draft invoices can be marked as sent');
    }
    
    this.status = InvoiceStatus.SENT;
    this.sentDate = new Date();
    
    console.info('Invoice marked as sent', {
      invoiceId: this.id,
      invoiceNumber: this.invoiceNumber,
      auditTrail: true
    });
  }

  /**
   * Record payment
   */
  recordPayment(amount: Decimal, paymentId: string): void {
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Payment amount must be positive');
    }
    
    if (amount.greaterThan(this.balanceAmount)) {
      throw new Error('Payment amount cannot exceed balance');
    }
    
    this.paidAmount = this.paidAmount.plus(amount);
    this.balanceAmount = this.totalAmount.minus(this.paidAmount);
    
    if (this.isFullyPaid()) {
      this.status = InvoiceStatus.PAID;
      this.paidDate = new Date();
    } else if (this.isPartiallyPaid()) {
      this.status = InvoiceStatus.PARTIALLY_PAID;
    }
    
    console.info('Payment recorded for invoice', {
      invoiceId: this.id,
      paymentId,
      amount: amount.toString(),
      newBalance: this.balanceAmount.toString(),
      auditTrail: true
    });
  }

  /**
   * Get invoice summary
   */
  getSummary(): {
    id: string;
    invoiceNumber: string;
    totalAmount: string;
    paidAmount: string;
    balanceAmount: string;
    status: InvoiceStatus;
    isOverdue: boolean;
    daysOverdue: number;
  } {
    return {
      id: this.id,
      invoiceNumber: this.invoiceNumber,
      totalAmount: this.getFormattedTotal(),
      paidAmount: this.paidAmount.toString(),
      balanceAmount: this.balanceAmount.toString(),
      status: this.status,
      isOverdue: this.isOverdue(),
      daysOverdue: this.daysOverdue
    };
  }
}

export default Invoice;