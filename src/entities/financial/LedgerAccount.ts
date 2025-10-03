import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Ledger Account Entity for WriteCareNotes
 * @module LedgerAccountEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Ledger account entity for comprehensive double-entry accounting
 * with balanced debits/credits, real-time posting, and financial reporting.
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
  BeforeUpdate,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { IsUUID, IsEnum, IsString, IsBoolean, IsDate, Length, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';

import { BaseEntity } from '../BaseEntity';
import { JournalEntry } from './JournalEntry';
import { CashTransaction } from './CashTransaction';
import { logger } from '../../utils/logger';

/**
 * Ledger account type enumeration
 */
export enum LedgerAccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense',
  COST_OF_SALES = 'cost_of_sales',
  OTHER_INCOME = 'other_income',
  OTHER_EXPENSE = 'other_expense'
}

/**
 * Ledger account category enumeration
 */
export enum LedgerAccountCategory {
  CURRENT_ASSET = 'current_asset',
  FIXED_ASSET = 'fixed_asset',
  CURRENT_LIABILITY = 'current_liability',
  LONG_TERM_LIABILITY = 'long_term_liability',
  OWNERS_EQUITY = 'owners_equity',
  OPERATING_REVENUE = 'operating_revenue',
  NON_OPERATING_REVENUE = 'non_operating_revenue',
  OPERATING_EXPENSE = 'operating_expense',
  NON_OPERATING_EXPENSE = 'non_operating_expense',
  DIRECT_COST = 'direct_cost',
  INDIRECT_COST = 'indirect_cost'
}

/**
 * Ledger account status enumeration
 */
export enum LedgerAccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  CLOSED = 'closed'
}

/**
 * Ledger account entity for comprehensive double-entry accounting
 */
@Entity('wcn_ledger_accounts')
@Index(['accountCode', 'status'])
@Index(['accountType', 'status'])
@Index(['parentAccountId', 'status'])
@Index(['isActive', 'status'])
export class LedgerAccount extends BaseEntity {

  // Account Identification
  @Column({ type: 'varchar', length: 20, unique: true })
  @IsString()
  @Length(1, 20)
  accountCode!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  accountName!: string;

  @Column({ type: 'text', nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  // Account Classification
  @Column({ type: 'enum', enum: LedgerAccountType })
  @IsEnum(LedgerAccountType)
  accountType!: LedgerAccountType;

  @Column({ type: 'enum', enum: LedgerAccountCategory })
  @IsEnum(LedgerAccountCategory)
  accountCategory!: LedgerAccountCategory;

  @Column({ type: 'enum', enum: LedgerAccountStatus, default: LedgerAccountStatus.ACTIVE })
  @IsEnum(LedgerAccountStatus)
  status!: LedgerAccountStatus;

  // Hierarchy
  @Column({ type: 'uuid', nullable: true })
  @IsUUID()
  @IsOptional()
  parentAccountId?: string;

  @ManyToOne(() => LedgerAccount, account => account.childAccounts, { nullable: true })
  @JoinColumn({ name: 'parentAccountId' })
  parentAccount?: LedgerAccount;

  @OneToMany(() => LedgerAccount, account => account.parentAccount)
  childAccounts!: LedgerAccount[];

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  level!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  fullPath?: string;

  // Account Properties
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isSystemAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isContraAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isControlAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresReconciliation!: boolean;

  // Financial Totals
  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  debitBalance!: InstanceType<typeof Decimal>;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  creditBalance!: InstanceType<typeof Decimal>;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  netBalance!: InstanceType<typeof Decimal>;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  openingBalance!: InstanceType<typeof Decimal>;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsNumber()
  @Transform(({ value }) => new Decimal(value))
  closingBalance!: InstanceType<typeof Decimal>;

  // Transaction Counts
  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  debitCount!: number;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  creditCount!: number;

  @Column({ type: 'integer', default: 0 })
  @IsNumber()
  totalTransactions!: number;

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

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isRevenueAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isExpenseAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isAssetAccount!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isLiabilityAccount!: boolean;

  // Relationships
  @OneToMany(() => JournalEntry, entry => entry.debitAccount)
  debitEntries!: JournalEntry[];

  @OneToMany(() => JournalEntry, entry => entry.creditAccount)
  creditEntries!: JournalEntry[];

  @OneToMany(() => CashTransaction, transaction => transaction.account)
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
  @Column({ type: 'timestamp', nullable: true })
  @IsDate()
  @IsOptional()
  lastTransactionDate?: Date;

  /**
   * Validate ledger account before insert
   */
  @BeforeInsert()
  async validateLedgerAccountBeforeInsert(): Promise<void> {
    this.validateLedgerAccountData();
    this.calculateNetBalance();
    this.setAccountProperties();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    console.info('Ledger account created', {
      accountId: this.id,
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      auditTrail: true
    });
  }

  /**
   * Validate ledger account before update
   */
  @BeforeUpdate()
  async validateLedgerAccountBeforeUpdate(): Promise<void> {
    this.validateLedgerAccountData();
    this.calculateNetBalance();
    
    console.info('Ledger account updated', {
      accountId: this.id,
      accountCode: this.accountCode,
      updatedBy: this.updatedBy,
      auditTrail: true
    });
  }

  /**
   * Validate ledger account data
   */
  private validateLedgerAccountData(): void {
    if (this.accountCode.length < 3) {
      throw new Error('Account code must be at least 3 characters');
    }

    if (this.accountName.length < 3) {
      throw new Error('Account name must be at least 3 characters');
    }

    if (this.isContraAccount && this.accountType === LedgerAccountType.REVENUE) {
      throw new Error('Revenue accounts cannot be contra accounts');
    }

    if (this.isContraAccount && this.accountType === LedgerAccountType.EXPENSE) {
      throw new Error('Expense accounts cannot be contra accounts');
    }
  }

  /**
   * Calculate net balance
   */
  private calculateNetBalance(): void {
    if (this.accountType === LedgerAccountType.ASSET || this.accountType === LedgerAccountType.EXPENSE) {
      this.netBalance = this.debitBalance.minus(this.creditBalance);
    } else {
      this.netBalance = this.creditBalance.minus(this.debitBalance);
    }
  }

  /**
   * Set account properties based on type
   */
  private setAccountProperties(): void {
    this.isRevenueAccount = this.accountType === LedgerAccountType.REVENUE;
    this.isExpenseAccount = this.accountType === LedgerAccountType.EXPENSE;
    this.isAssetAccount = this.accountType === LedgerAccountType.ASSET;
    this.isLiabilityAccount = this.accountType === LedgerAccountType.LIABILITY;
  }

  /**
   * Post debit entry
   */
  postDebit(amount: InstanceType<typeof Decimal>, description: string, createdBy: string): void {
    if (!this.isActive) {
      throw new Error('Cannot post to inactive account');
    }

    this.debitBalance = this.debitBalance.plus(amount);
    this.debitCount += 1;
    this.totalTransactions += 1;
    this.calculateNetBalance();
    this.updatedBy = createdBy;

    console.info('Debit posted to ledger account', {
      accountId: this.id,
      accountCode: this.accountCode,
      amount: amount.toString(),
      description,
      createdBy,
      auditTrail: true
    });
  }

  /**
   * Post credit entry
   */
  postCredit(amount: InstanceType<typeof Decimal>, description: string, createdBy: string): void {
    if (!this.isActive) {
      throw new Error('Cannot post to inactive account');
    }

    this.creditBalance = this.creditBalance.plus(amount);
    this.creditCount += 1;
    this.totalTransactions += 1;
    this.calculateNetBalance();
    this.updatedBy = createdBy;

    console.info('Credit posted to ledger account', {
      accountId: this.id,
      accountCode: this.accountCode,
      amount: amount.toString(),
      description,
      createdBy,
      auditTrail: true
    });
  }

  /**
   * Reverse entry
   */
  reverseEntry(amount: InstanceType<typeof Decimal>, description: string, reversedBy: string): void {
    if (!this.isActive) {
      throw new Error('Cannot reverse on inactive account');
    }

    // Reverse the entry by posting opposite amounts
    if (this.accountType === LedgerAccountType.ASSET || this.accountType === LedgerAccountType.EXPENSE) {
      this.postCredit(amount, `REVERSAL: ${description}`, reversedBy);
    } else {
      this.postDebit(amount, `REVERSAL: ${description}`, reversedBy);
    }

    console.info('Entry reversed on ledger account', {
      accountId: this.id,
      accountCode: this.accountCode,
      amount: amount.toString(),
      description,
      reversedBy,
      auditTrail: true
    });
  }

  /**
   * Close account
   */
  closeAccount(closedBy: string): void {
    if (this.status === LedgerAccountStatus.CLOSED) {
      throw new Error('Account is already closed');
    }

    if (this.netBalance.greaterThan(0.01) || this.netBalance.lessThan(-0.01)) {
      throw new Error('Account must have zero balance to be closed');
    }

    this.status = LedgerAccountStatus.CLOSED;
    this.isActive = false;
    this.updatedBy = closedBy;

    console.info('Ledger account closed', {
      accountId: this.id,
      accountCode: this.accountCode,
      closedBy,
      auditTrail: true
    });
  }

  /**
   * Get account balance
   */
  getAccountBalance(): InstanceType<typeof Decimal> {
    return this.netBalance;
  }

  /**
   * Get account summary
   */
  getAccountSummary(): {
    id: string;
    accountCode: string;
    accountName: string;
    accountType: LedgerAccountType;
    accountCategory: LedgerAccountCategory;
    status: LedgerAccountStatus;
    debitBalance: string;
    creditBalance: string;
    netBalance: string;
    totalTransactions: number;
    isActive: boolean;
  } {
    return {
      id: this.id,
      accountCode: this.accountCode,
      accountName: this.accountName,
      accountType: this.accountType,
      accountCategory: this.accountCategory,
      status: this.status,
      debitBalance: this.debitBalance.toString(),
      creditBalance: this.creditBalance.toString(),
      netBalance: this.netBalance.toString(),
      totalTransactions: this.totalTransactions,
      isActive: this.isActive
    };
  }

  /**
   * Get account hierarchy path
   */
  getAccountPath(): string {
    if (this.fullPath) return this.fullPath;
    
    const path = [this.accountCode];
    let current = this.parentAccount;
    
    while (current) {
      path.unshift(current.accountCode);
      current = current.parentAccount;
    }
    
    return path.join(' > ');
  }

  /**
   * Check if account is balanced
   */
  isBalanced(): boolean {
    return this.netBalance.equals(0);
  }

  /**
   * Get account level
   */
  getAccountLevel(): number {
    return this.level;
  }

  /**
   * Check if account has children
   */
  hasChildren(): boolean {
    return this.childAccounts && this.childAccounts.length > 0;
  }

  /**
   * Get all child accounts recursively
   */
  getAllChildAccounts(): LedgerAccount[] {
    const children: LedgerAccount[] = [];
    
    if (this.childAccounts) {
      for (const child of this.childAccounts) {
        children.push(child);
        children.push(...child.getAllChildAccounts());
      }
    }
    
    return children;
  }
}

export default LedgerAccount;