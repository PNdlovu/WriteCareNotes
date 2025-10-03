import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Journal Entry Entity for WriteCareNotes
 * @module JournalEntryEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Journal entry entity for comprehensive double-entry accounting
 * with balanced debits/credits, real-time posting, and audit trails.
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
  OneToMany,
  JoinColumn
} from 'typeorm';
import { IsUUID, IsEnum, IsString, IsBoolean, IsDate, Length, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

import { BaseEntity } from '../BaseEntity';
import { LedgerAccount } from './LedgerAccount';
import { CashTransaction } from './CashTransaction';
import { logger } from '../../utils/logger';

/**
 * Journal entry type enumeration
 */
export enum JournalEntryType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  ADJUSTMENT = 'adjustment',
  REVERSAL = 'reversal',
  CLOSING = 'closing',
  OPENING = 'opening',
  TRANSFER = 'transfer',
  PAYROLL = 'payroll',
  BILLING = 'billing',
  PAYMENT = 'payment',
  RECEIPT = 'receipt'
}

/**
 * Journal entry status enumeration
 */
export enum JournalEntryStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  POSTED = 'posted',
  REVERSED = 'reversed',
  CANCELLED = 'cancelled'
}

/**
 * Journal entry priority enumeration
 */
export enum JournalEntryPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

/**
 * Journal entry entity for comprehensive double-entry accounting
 */
@Entity('wcn_journal_entries')
@Index(['entryNumber', 'status'])
@Index(['entryType', 'status'])
@Index(['entryDate', 'status'])
@Index(['debitAccountId', 'creditAccountId'])
export class JournalEntry extends BaseEntity {

  // Entry Identification
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  @Length(1, 50)
  entryNumber!: string;

  @Column({ type: 'enum', enum: JournalEntryType })
  @IsEnum(JournalEntryType)
  entryType!: JournalEntryType;

  @Column({ type: 'enum', enum: JournalEntryStatus, default: JournalEntryStatus.DRAFT })
  @IsEnum(JournalEntryStatus)
  status!: JournalEntryStatus;

  @Column({ type: 'enum', enum: JournalEntryPriority, default: JournalEntryPriority.MEDIUM })
  @IsEnum(JournalEntryPriority)
  priority!: JournalEntryPriority;

  // Entry Details
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
  entryDate!: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  postedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  reversedAt?: Date;

  // Account References
  @Column({ type: 'uuid' })
  @IsUUID()
  debitAccountId!: string;

  @ManyToOne(() => LedgerAccount, account => account.debitEntries, { eager: false })
  @JoinColumn({ name: 'debitAccountId' })
  debitAccount?: LedgerAccount;

  @Column({ type: 'uuid' })
  @IsUUID()
  creditAccountId!: string;

  @ManyToOne(() => LedgerAccount, account => account.creditEntries, { eager: false })
  @JoinColumn({ name: 'creditAccountId' })
  creditAccount?: LedgerAccount;

  // Financial Amounts
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  debitAmount!: InstanceType<typeof Decimal>;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  creditAmount!: InstanceType<typeof Decimal>;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

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

  // Reversal Information
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  reversedEntryId?: string;

  @ManyToOne(() => JournalEntry, entry => entry.reversalEntries, { nullable: true })
  @JoinColumn({ name: 'reversedEntryId' })
  reversedEntry?: JournalEntry;

  @OneToMany(() => JournalEntry, entry => entry.reversedEntry)
  reversalEntries!: JournalEntry[];

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  reversalReason?: string;

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

  // Relationships
  @OneToMany(() => CashTransaction, transaction => transaction.journalEntry)
  cashTransactions!: CashTransaction[];

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

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  postedBy?: string;

  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  reversedBy?: string;

  // Virtual property for entries array
  entries?: any[];

  /**
   * Validate journal entry before insert
   */
  @BeforeInsert()
  async validateJournalEntryBeforeInsert(): Promise<void> {
    this.validateJournalEntryData();
    this.generateEntryNumber();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('Journal entry created', {
      entryId: this.id,
      entryNumber: this.entryNumber,
      entryType: this.entryType,
      debitAmount: this.debitAmount.toString(),
      creditAmount: this.creditAmount.toString(),
      auditTrail: true
    });
  }

  /**
   * Validate journal entry before update
   */
  @BeforeUpdate()
  async validateJournalEntryBeforeUpdate(): Promise<void> {
    this.validateJournalEntryData();
    
    console.info('Journal entry updated', {
      entryId: this.id,
      entryNumber: this.entryNumber,
      status: this.status,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate journal entry data
   */
  private validateJournalEntryData(): void {
    if (this.debitAmount.lessThanOrEqualTo(0)) {
      throw new Error('Debit amount must be greater than zero');
    }

    if (this.creditAmount.lessThanOrEqualTo(0)) {
      throw new Error('Credit amount must be greater than zero');
    }

    if (!this.debitAmount.equals(this.creditAmount)) {
      throw new Error('Debit and credit amounts must be equal for double-entry accounting');
    }

    if (this.debitAccountId === this.creditAccountId) {
      throw new Error('Debit and credit accounts cannot be the same');
    }

    if (this.entryDate > new Date()) {
      throw new Error('Entry date cannot be in the future');
    }
  }

  /**
   * Generate entry number
   */
  private generateEntryNumber(): void {
    if (!this.entryNumber) {
      const timestamp = Date.now().toString().slice(-8);
      const typeCode = this.entryType.substring(0, 3).toUpperCase();
      this.entryNumber = `JE-${typeCode}-${timestamp}`;
    }
  }

  /**
   * Post journal entry
   */
  postEntry(postedBy: string): void {
    if (this.status !== JournalEntryStatus.DRAFT && this.status !== JournalEntryStatus.PENDING) {
      throw new Error('Only draft or pending entries can be posted');
    }

    if (this.requiresApproval && !this.approvedBy) {
      throw new Error('Entry requires approval before posting');
    }

    this.status = JournalEntryStatus.POSTED;
    this.postedAt = new Date();
    this.updatedBy = postedBy;

    // Post to ledger accounts
    if (this.debitAccount) {
      this.debitAccount.postDebit(this.debitAmount, this.description, postedBy);
    }

    if (this.creditAccount) {
      this.creditAccount.postCredit(this.creditAmount, this.description, postedBy);
    }

    console.info('Journal entry posted', {
      entryId: this.id,
      entryNumber: this.entryNumber,
      postedBy,
      auditTrail: true
    });
  }

  /**
   * Reverse journal entry
   */
  reverseEntry(reason: string, reversedBy: string): void {
    if (this.status !== JournalEntryStatus.POSTED) {
      throw new Error('Only posted entries can be reversed');
    }

    if (this.isReconciled) {
      throw new Error('Cannot reverse reconciled entries');
    }

    this.status = JournalEntryStatus.REVERSED;
    this.reversedAt = new Date();
    this.reversalReason = reason;
    this.updatedBy = reversedBy;

    // Reverse in ledger accounts
    if (this.debitAccount) {
      this.debitAccount.reverseEntry(this.debitAmount, this.description, reversedBy);
    }

    if (this.creditAccount) {
      this.creditAccount.reverseEntry(this.creditAmount, this.description, reversedBy);
    }

    console.info('Journal entry reversed', {
      entryId: this.id,
      entryNumber: this.entryNumber,
      reason,
      reversedBy,
      auditTrail: true
    });
  }

  /**
   * Cancel journal entry
   */
  cancelEntry(reason: string, cancelledBy: string): void {
    if (this.status === JournalEntryStatus.POSTED) {
      throw new Error('Posted entries cannot be cancelled, use reverse instead');
    }

    this.status = JournalEntryStatus.CANCELLED;
    this.updatedBy = cancelledBy;

    console.info('Journal entry cancelled', {
      entryId: this.id,
      entryNumber: this.entryNumber,
      reason,
      cancelledBy,
      auditTrail: true
    });
  }

  /**
   * Approve journal entry
   */
  approveEntry(approvedBy: string, notes?: string): void {
    if (this.status !== JournalEntryStatus.PENDING) {
      throw new Error('Only pending entries can be approved');
    }

    this.status = JournalEntryStatus.DRAFT;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
    this.updatedBy = approvedBy;

    console.info('Journal entry approved', {
      entryId: this.id,
      entryNumber: this.entryNumber,
      approvedBy,
      auditTrail: true
    });
  }

  /**
   * Check if entry is balanced
   */
  isBalanced(): boolean {
    return this.debitAmount.equals(this.creditAmount);
  }

  /**
   * Get entry summary
   */
  getEntrySummary(): {
    id: string;
    entryNumber: string;
    entryType: JournalEntryType;
    status: JournalEntryStatus;
    description: string;
    entryDate: Date;
    debitAmount: string;
    creditAmount: string;
    currency: string;
    isBalanced: boolean;
    postedAt: Date | null;
  } {
    return {
      id: this.id,
      entryNumber: this.entryNumber,
      entryType: this.entryType,
      status: this.status,
      description: this.description,
      entryDate: this.entryDate,
      debitAmount: this.debitAmount.toString(),
      creditAmount: this.creditAmount.toString(),
      currency: this.currency,
      isBalanced: this.isBalanced(),
      postedAt: this.postedAt || null
    };
  }

  /**
   * Get entry details for reporting
   */
  getEntryDetails(): {
    id: string;
    entryNumber: string;
    entryType: JournalEntryType;
    status: JournalEntryStatus;
    description: string;
    entryDate: Date;
    debitAccountId: string;
    creditAccountId: string;
    debitAmount: string;
    creditAmount: string;
    currency: string;
    referenceNumber: string | null;
    sourceDocument: string | null;
    requiresApproval: boolean;
    isSystemGenerated: boolean;
    isReconciled: boolean;
  } {
    return {
      id: this.id,
      entryNumber: this.entryNumber,
      entryType: this.entryType,
      status: this.status,
      description: this.description,
      entryDate: this.entryDate,
      debitAccountId: this.debitAccountId,
      creditAccountId: this.creditAccountId,
      debitAmount: this.debitAmount.toString(),
      creditAmount: this.creditAmount.toString(),
      currency: this.currency,
      referenceNumber: this.referenceNumber || null,
      sourceDocument: this.sourceDocument || null,
      requiresApproval: this.requiresApproval,
      isSystemGenerated: this.isSystemGenerated,
      isReconciled: this.isReconciled
    };
  }
}

export default JournalEntry;