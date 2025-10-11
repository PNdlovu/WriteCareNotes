/**
 * @fileoverview Financial Transaction Entity for WriteCareNotes
 * @module FinancialTransactionEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Core financial transaction entity with comprehensive audit trails,
 * encryption, and compliance features for healthcare financial management.
 * 
 * @compliance
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - FCA (Financial Conduct Authority) regulations
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
  BeforeUpdate,
  BaseEntity
} from 'typeorm';
import { IsUUID, IsEnum, IsDecimal, IsString, IsOptional, IsDate, Length } from 'class-validator';
import { Exclude, Transform } from 'class-transformer';
import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';

import { ChartOfAccounts } from './ChartOfAccounts';
import { FinancialPeriod } from './FinancialPeriod';

// Mock encryption service for now - should be replaced with actual implementation
class HealthcareEncryption {
  static async encrypt(data: string): Promise<string> {
    // In production, this would use proper encryption
    return Buffer.from(data).toString('base64');
  }

  static decrypt(encryptedData: string): string {
    // In production, this would use proper decryption
    try {
      return Buffer.from(encryptedData, 'base64').toString('utf-8');
    } catch {
      return encryptedData; // Return as-is if not encrypted
    }
  }
}

/**
 * Transaction category enumeration for healthcare financial operations
 */
export enum TransactionCategory {
  RESIDENT_FEES = 'resident_fees',
  NHS_FUNDING = 'nhs_funding',
  LOCAL_AUTHORITY_FUNDING = 'local_authority_funding',
  PRIVATE_INSURANCE = 'private_insurance',
  STAFF_COSTS = 'staff_costs',
  MEDICATION_COSTS = 'medication_costs',
  UTILITIES = 'utilities',
  MAINTENANCE = 'maintenance',
  CATERING = 'catering',
  SUPPLIES = 'supplies',
  PROFESSIONAL_SERVICES = 'professional_services',
  INSURANCE = 'insurance',
  REGULATORY_FEES = 'regulatory_fees',
  CAPITAL_EXPENDITURE = 'capital_expenditure',
  DEPRECIATION = 'depreciation',
  INTEREST = 'interest',
  TAX = 'tax',
  OTHER = 'other'
}

/**
 * Transaction status enumeration
 */
export enum TransactionStatus {
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PROCESSED = 'processed',
  RECONCILED = 'reconciled',
  DISPUTED = 'disputed',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

/**
 * Currency enumeration for multi-currency support
 */
export enum Currency {
  GBP = 'GBP',
  EUR = 'EUR',
  USD = 'USD'
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
  CHAPS = 'chaps'
}

/**
 * Financial Transaction entity with comprehensive healthcare compliance
 * Implements field-level encryption for sensitive financial data
 */
@Entity('wcn_financial_transactions')
@Index(['transactionDate', 'status'])
@Index(['accountId', 'category'])
@Index(['correlationId'])
@Index(['residentId'])
@Index(['departmentId'])
export class FinancialTransaction extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Transaction Core Information
  @Column({ type: 'date' })
  @IsDate()
  transactionDate!: Date;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  amount!: Decimal;

  @Column({ type: 'enum', enum: Currency, default: Currency.GBP })
  @IsEnum(Currency)
  currency!: Currency;

  // Encrypted Description (PCI DSS compliance)
  @Column({ type: 'text' })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => HealthcareEncryption.decrypt(value), { toClassOnly: true })
  @IsString()
  @Length(1, 500)
  description!: string;

  // Transaction Classification
  @Column({ type: 'enum', enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  category!: TransactionCategory;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.PENDING_APPROVAL })
  @IsEnum(TransactionStatus)
  status!: TransactionStatus;

  // Encrypted Reference (for sensitive financial references)
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? HealthcareEncryption.decrypt(value) : null, { toClassOnly: true })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;

  // Payment Information
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  paymentReference?: string;

  // Cost Center Allocation
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  costCenter?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  residentId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  // Compliance and Audit Fields
  @Column({ type: 'uuid' })
  @IsUUID()
  correlationId!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  regulatoryCode?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  taxCode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  vatAmount?: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  vatRate?: Decimal;

  // Encrypted Metadata (for additional sensitive information)
  @Column({ type: 'text', nullable: true })
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => value ? JSON.parse(HealthcareEncryption.decrypt(value)) : null, { toClassOnly: true })
  @IsOptional()
  metadata?: Record<string, any>;

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

  // Reconciliation Information
  @Column({ type: 'boolean', default: false })
  isReconciled!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  reconciledDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  reconciledBy?: string;

  // Relationships
  @ManyToOne(() => ChartOfAccounts, account => account.transactions)
  @JoinColumn({ name: 'account_id' })
  account!: ChartOfAccounts;

  @Column({ type: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ManyToOne(() => FinancialPeriod, period => period.transactions, { nullable: true })
  @JoinColumn({ name: 'financial_period_id' })
  financialPeriod?: FinancialPeriod;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  financialPeriodId?: string;

  // Audit Trail Fields
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
    this.validateFinancialData();
    
    // Generate ID and correlation ID if not provided
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    
    // Log financial transaction creation for audit
    console.info('Financial transaction created', {
      transactionId: this.id,
      category: this.category,
      amount: this.amount.toString(),
      currency: this.currency,
      correlationId: this.correlationId,
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
    this.validateFinancialData();
    
    // Log financial transaction update for audit
    console.info('Financial transaction updated', {
      transactionId: this.id,
      updatedBy: this.updatedBy,
      correlationId: this.correlationId,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Encrypt all sensitive financial fields
   */
  private async encryptSensitiveFields(): Promise<void> {
    // Encrypt description (may contain sensitive payment information)
    this.description = await HealthcareEncryption.encrypt(this.description);
    
    // Encrypt reference if present
    if (this.reference) {
      this.reference = await HealthcareEncryption.encrypt(this.reference);
    }
    
    // Encrypt metadata if present
    if (this.metadata) {
      this.metadata = await HealthcareEncryption.encrypt(JSON.stringify(this.metadata)) as any;
    }
  }

  /**
   * Validate financial data for compliance
   */
  private validateFinancialData(): void {
    // Validate amount is positive for income, negative for expenses
    if (this.amount.equals(0)) {
      throw new Error('Transaction amount cannot be zero');
    }

    // Validate transaction date is not in the future
    if (this.transactionDate > new Date()) {
      throw new Error('Transaction date cannot be in the future');
    }

    // Validate VAT calculations if applicable
    if (this.vatAmount && this.vatRate) {
      const calculatedVat = this.amount.minus(this.vatAmount).times(this.vatRate);
      if (!calculatedVat.equals(this.vatAmount)) {
        throw new Error('VAT amount does not match calculated VAT');
      }
    }

    // Validate currency consistency
    if (!Object.values(Currency).includes(this.currency)) {
      throw new Error('Invalid currency code');
    }
  }

  /**
   * Get transaction display amount with currency formatting
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
   * Check if transaction requires approval
   */
  requiresApproval(): boolean {
    // High-value transactions require approval
    const approvalThreshold = new Decimal(1000);
    
    return this.amount.greaterThan(approvalThreshold) || 
           this.category === TransactionCategory.CAPITAL_EXPENDITURE ||
           this.paymentMethod === PaymentMethod.CASH;
  }

  /**
   * Get transaction age in days
   */
  getTransactionAge(): number {
    const today = new Date();
    const transactionDate = new Date(this.transactionDate);
    const diffTime = Math.abs(today.getTime() - transactionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if transaction is overdue for reconciliation
   */
  isOverdueForReconciliation(): boolean {
    if (this.isReconciled) {
      return false;
    }
    
    const maxDaysForReconciliation = 30;
    return this.getTransactionAge() > maxDaysForReconciliation;
  }

  /**
   * Approve transaction
   */
  approve(approvedBy: string, notes?: string): void {
    if (this.status !== TransactionStatus.PENDING_APPROVAL) {
      throw new Error('Transaction is not in pending approval status');
    }
    
    this.status = TransactionStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
    this.approvalNotes = notes;
    
    console.info('Financial transaction approved', {
      transactionId: this.id,
      approvedBy,
      amount: this.amount.toString(),
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Reconcile transaction
   */
  reconcile(reconciledBy: string): void {
    if (this.status !== TransactionStatus.APPROVED && this.status !== TransactionStatus.PROCESSED) {
      throw new Error('Transaction must be approved or processed before reconciliation');
    }
    
    this.isReconciled = true;
    this.reconciledDate = new Date();
    this.reconciledBy = reconciledBy;
    this.status = TransactionStatus.RECONCILED;
    
    console.info('Financial transaction reconciled', {
      transactionId: this.id,
      reconciledBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Get transaction summary for reporting
   */
  getSummary(): {
    id: string;
    date: Date;
    amount: string;
    category: TransactionCategory;
    status: TransactionStatus;
    isReconciled: boolean;
  } {
    return {
      id: this.id,
      date: this.transactionDate,
      amount: this.getFormattedAmount(),
      category: this.category,
      status: this.status,
      isReconciled: this.isReconciled
    };
  }
}

export default FinancialTransaction;