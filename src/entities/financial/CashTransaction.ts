import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Cash Transaction Entity for WriteCareNotes
 * @module CashTransactionEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Cash transaction entity for comprehensive cash management
 * with real-time posting, transaction validation, and audit trails.
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
import Decimal from 'decimal.js';

import { BaseEntity } from '../BaseEntity';
import { LedgerAccount } from './LedgerAccount';
import { JournalEntry } from './JournalEntry';
import { logger } from '../../utils/logger';

/**
 * Cash transaction type enumeration
 */
export enum CashTransactionType {
  RECEIPT = 'receipt',
  PAYMENT = 'payment',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
  REVERSAL = 'reversal',
  REFUND = 'refund',
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  INTEREST = 'interest',
  FEE = 'fee'
}

/**
 * Cash transaction status enumeration
 */
export enum CashTransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  PROCESSED = 'processed',
  FAILED = 'failed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REVERSED = 'reversed'
}

/**
 * Cash transaction priority enumeration
 */
export enum CashTransactionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * Cash transaction entity for comprehensive cash management
 */
@Entity('wcn_cash_transactions')
@Index(['transactionNumber', 'status'])
@Index(['transactionType', 'status'])
@Index(['transactionDate', 'status'])
@Index(['accountId', 'status'])
export class CashTransaction extends BaseEntity {

  // Transaction Identification
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  @Length(1, 50)
  transactionNumber!: string;

  @Column({ type: 'enum', enum: CashTransactionType })
  @IsEnum(CashTransactionType)
  transactionType!: CashTransactionType;

  @Column({ type: 'enum', enum: CashTransactionStatus, default: CashTransactionStatus.PENDING })
  @IsEnum(CashTransactionStatus)
  status!: CashTransactionStatus;

  @Column({ type: 'enum', enum: CashTransactionPriority, default: CashTransactionPriority.MEDIUM })
  @IsEnum(CashTransactionPriority)
  priority!: CashTransactionPriority;

  // Transaction Details
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  description!: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Column({ type: 'date' })
  @IsDate()
  transactionDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  processedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  reversedAt?: Date;

  // Account Reference
  @Column({ type: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ManyToOne(() => LedgerAccount, account => account.cashTransactions, { eager: false })
  @JoinColumn({ name: 'accountId' })
  account?: LedgerAccount;

  // Financial Amounts
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  amount!: InstanceType<typeof Decimal>;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : null)
  exchangeRate?: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => value ? new Decimal(value) : null)
  baseAmount?: Decimal;

  // Reference Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  referenceNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  sourceDocument?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  sourceSystem?: string;

  // Payment Information
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  paymentMethod?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  paymentReference?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  bankAccount?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  bankReference?: string;

  // Reversal Information
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  reversedTransactionId?: string;

  @ManyToOne(() => CashTransaction, transaction => transaction.reversalTransactions, { nullable: true })
  @JoinColumn({ name: 'reversedTransactionId' })
  reversedTransaction?: CashTransaction;

  @OneToMany(() => CashTransaction, transaction => transaction.reversedTransaction)
  reversalTransactions!: CashTransaction[];

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  reversalReason?: string;

  // Journal Entry Reference
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  journalEntryId?: string;

  @ManyToOne(() => JournalEntry, entry => entry.cashTransactions, { nullable: true })
  @JoinColumn({ name: 'journalEntryId' })
  journalEntry?: JournalEntry;

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

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 100)
  costCenter?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  residentId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  supplierId?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  // Compliance & Audit
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresApproval!: boolean;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  approvedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  approvedAt?: Date;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  approvalNotes?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isSystemGenerated!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isReconciled!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isVoid!: boolean;

  // Additional Audit Fields
  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  // Additional properties for service compatibility
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  reference?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  @IsOptional()
  checkNumber?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  processedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  rejectedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  rejectedBy?: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  reversedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  reversedAt?: Date;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  reversalReason?: string;

  /**
   * Validate cash transaction before insert
   */
  @BeforeInsert()
  async validateCashTransactionBeforeInsert(): Promise<void> {
    this.validateCashTransactionData();
    this.generateTransactionNumber();
    this.calculateBaseAmount();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('Cash transaction created', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      transactionType: this.transactionType,
      amount: this.amount.toString(),
      auditTrail: true
    });
  }

  /**
   * Validate cash transaction before update
   */
  @BeforeUpdate()
  async validateCashTransactionBeforeUpdate(): Promise<void> {
    this.validateCashTransactionData();
    
    console.info('Cash transaction updated', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate cash transaction data
   */
  private validateCashTransactionData(): void {
    if (this.amount.lessThanOrEqualTo(0)) {
      throw new Error('Transaction amount must be greater than zero');
    }

    if (this.transactionDate > new Date()) {
      throw new Error('Transaction date cannot be in the future');
    }

    if (this.isVoid && this.status !== CashTransactionStatus.COMPLETED) {
      throw new Error('Only completed transactions can be voided');
    }

    if (this.requiresApproval && !this.approvedBy && this.status === CashTransactionStatus.COMPLETED) {
      throw new Error('Transaction requires approval before completion');
    }
  }

  /**
   * Generate transaction number
   */
  private generateTransactionNumber(): void {
    if (!this.transactionNumber) {
      const timestamp = Date.now().toString().slice(-8);
      const typeCode = this.transactionType.substring(0, 3).toUpperCase();
      this.transactionNumber = `CT-${typeCode}-${timestamp}`;
    }
  }

  /**
   * Calculate base amount
   */
  private calculateBaseAmount(): void {
    if (this.exchangeRate && this.exchangeRate.greaterThan(0)) {
      this.baseAmount = this.amount.dividedBy(this.exchangeRate);
    } else {
      this.baseAmount = this.amount;
    }
  }

  /**
   * Process transaction
   */
  processTransaction(processedBy: string): void {
    if (this.status !== CashTransactionStatus.PENDING) {
      throw new Error('Only pending transactions can be processed');
    }

    if (this.requiresApproval && !this.approvedBy) {
      throw new Error('Transaction requires approval before processing');
    }

    this.status = CashTransactionStatus.PROCESSING;
    this.updatedBy = processedBy;

    console.info('Cash transaction processing started', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      processedBy,
      auditTrail: true
    });
  }

  /**
   * Complete transaction
   */
  completeTransaction(completedBy: string): void {
    if (this.status !== CashTransactionStatus.PROCESSING) {
      throw new Error('Only processing transactions can be completed');
    }

    this.status = CashTransactionStatus.COMPLETED;
    this.processedAt = new Date();
    this.updatedBy = completedBy;

    // Post to ledger account
    if (this.account) {
      if (this.transactionType === CashTransactionType.RECEIPT || 
          this.transactionType === CashTransactionType.DEPOSIT ||
          this.transactionType === CashTransactionType.INTEREST) {
        this.account.postDebit(this.amount, this.description, completedBy);
      } else {
        this.account.postCredit(this.amount, this.description, completedBy);
      }
    }

    console.info('Cash transaction completed', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      completedBy,
      auditTrail: true
    });
  }

  /**
   * Fail transaction
   */
  failTransaction(reason: string, failedBy: string): void {
    if (this.status !== CashTransactionStatus.PROCESSING) {
      throw new Error('Only processing transactions can be failed');
    }

    this.status = CashTransactionStatus.FAILED;
    this.updatedBy = failedBy;

    console.info('Cash transaction failed', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      reason,
      failedBy,
      auditTrail: true
    });
  }

  /**
   * Reverse transaction
   */
  reverseTransaction(reason: string, reversedBy: string): void {
    if (this.status !== CashTransactionStatus.COMPLETED) {
      throw new Error('Only completed transactions can be reversed');
    }

    if (this.isReconciled) {
      throw new Error('Cannot reverse reconciled transactions');
    }

    this.status = CashTransactionStatus.REVERSED;
    this.reversedAt = new Date();
    this.reversalReason = reason;
    this.updatedBy = reversedBy;

    // Reverse in ledger account
    if (this.account) {
      this.account.reverseEntry(this.amount, this.description, reversedBy);
    }

    console.info('Cash transaction reversed', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      reason,
      reversedBy,
      auditTrail: true
    });
  }

  /**
   * Cancel transaction
   */
  cancelTransaction(reason: string, cancelledBy: string): void {
    if (this.status === CashTransactionStatus.COMPLETED) {
      throw new Error('Completed transactions cannot be cancelled, use reverse instead');
    }

    this.status = CashTransactionStatus.CANCELLED;
    this.updatedBy = cancelledBy;

    console.info('Cash transaction cancelled', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      reason,
      cancelledBy,
      auditTrail: true
    });
  }

  /**
   * Approve transaction
   */
  approveTransaction(approvedBy: string, notes?: string): void {
    if (this.status !== CashTransactionStatus.PENDING) {
      throw new Error('Only pending transactions can be approved');
    }

    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
    this.updatedBy = approvedBy;

    console.info('Cash transaction approved', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      approvedBy,
      auditTrail: true
    });
  }

  /**
   * Void transaction
   */
  voidTransaction(reason: string, voidedBy: string): void {
    if (this.status !== CashTransactionStatus.COMPLETED) {
      throw new Error('Only completed transactions can be voided');
    }

    this.isVoid = true;
    this.updatedBy = voidedBy;

    console.info('Cash transaction voided', {
      transactionId: this.id,
      transactionNumber: this.transactionNumber,
      reason,
      voidedBy,
      auditTrail: true
    });
  }

  /**
   * Get transaction summary
   */
  getTransactionSummary(): {
    id: string;
    transactionNumber: string;
    transactionType: CashTransactionType;
    status: CashTransactionStatus;
    description: string;
    transactionDate: Date;
    amount: string;
    currency: string;
    processedAt: Date | null;
    isVoid: boolean;
  } {
    return {
      id: this.id,
      transactionNumber: this.transactionNumber,
      transactionType: this.transactionType,
      status: this.status,
      description: this.description,
      transactionDate: this.transactionDate,
      amount: this.amount.toString(),
      currency: this.currency,
      processedAt: this.processedAt || null,
      isVoid: this.isVoid
    };
  }

  /**
   * Get transaction details for reporting
   */
  getTransactionDetails(): {
    id: string;
    transactionNumber: string;
    transactionType: CashTransactionType;
    status: CashTransactionStatus;
    description: string;
    transactionDate: Date;
    accountId: string;
    amount: string;
    currency: string;
    baseAmount: string | null;
    exchangeRate: string | null;
    referenceNumber: string | null;
    paymentMethod: string | null;
    requiresApproval: boolean;
    isSystemGenerated: boolean;
    isReconciled: boolean;
    isVoid: boolean;
  } {
    return {
      id: this.id,
      transactionNumber: this.transactionNumber,
      transactionType: this.transactionType,
      status: this.status,
      description: this.description,
      transactionDate: this.transactionDate,
      accountId: this.accountId,
      amount: this.amount.toString(),
      currency: this.currency,
      baseAmount: this.baseAmount?.toString() || null,
      exchangeRate: this.exchangeRate?.toString() || null,
      referenceNumber: this.referenceNumber || null,
      paymentMethod: this.paymentMethod || null,
      requiresApproval: this.requiresApproval,
      isSystemGenerated: this.isSystemGenerated,
      isReconciled: this.isReconciled,
      isVoid: this.isVoid
    };
  }
}

export default CashTransaction;