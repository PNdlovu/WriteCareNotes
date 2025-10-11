import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Chart of Accounts Entity for WriteCareNotes
 * @module ChartOfAccountsEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Chart of accounts entity for healthcare financial management
 * with hierarchical account structure and compliance features.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
  Tree,
  TreeParent,
  TreeChildren
} from 'typeorm';
import { IsUUID, IsEnum, IsDecimal, IsString, IsBoolean, Length } from 'class-validator';
import { Decimal } from 'decimal.js';
import { Transform } from 'class-transformer';

import { BaseEntity } from '@/entities/BaseEntity';
import { FinancialTransaction } from './FinancialTransaction';
import { Currency } from './FinancialTransaction';

/**
 * Account type enumeration for healthcare financial management
 */
export enum AccountType {
  ASSET = 'asset',
  LIABILITY = 'liability',
  EQUITY = 'equity',
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

/**
 * Account sub-type enumeration for detailed classification
 */
export enum AccountSubType {
  // Assets
  CURRENT_ASSET = 'current_asset',
  FIXED_ASSET = 'fixed_asset',
  INTANGIBLE_ASSET = 'intangible_asset',
  
  // Liabilities
  CURRENT_LIABILITY = 'current_liability',
  LONG_TERM_LIABILITY = 'long_term_liability',
  
  // Equity
  RETAINED_EARNINGS = 'retained_earnings',
  CAPITAL = 'capital',
  
  // Revenue
  OPERATING_REVENUE = 'operating_revenue',
  NON_OPERATING_REVENUE = 'non_operating_revenue',
  
  // Expenses
  OPERATING_EXPENSE = 'operating_expense',
  NON_OPERATING_EXPENSE = 'non_operating_expense',
  COST_OF_GOODS_SOLD = 'cost_of_goods_sold'
}

/**
 * Chart of Accounts entity with hierarchical structure
 */
@Entity('wcn_chart_of_accounts')
@Tree('materialized-path')
@Index(['accountCode'], { unique: true })
@Index(['accountType', 'isActive'])
@Index(['parentAccountId'])
export class ChartOfAccounts extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

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
  description?: string;

  // Account Classification
  @Column({ type: 'enum', enum: AccountType })
  @IsEnum(AccountType)
  accountType!: AccountType;

  @Column({ type: 'enum', enum: AccountSubType, nullable: true })
  @IsEnum(AccountSubType)
  accountSubType?: AccountSubType;

  // Hierarchical Structure
  @TreeParent()
  parent?: ChartOfAccounts;

  @Column({ type: 'uuid', nullable: true })
  parentAccountId?: string;

  @TreeChildren()
  children!: ChartOfAccounts[];

  @Column({ type: 'integer', default: 0 })
  level!: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  path?: string;

  // Financial Information
  @Column({ type: 'enum', enum: Currency, default: Currency.GBP })
  @IsEnum(Currency)
  currency!: Currency;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  balance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  debitBalance!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  creditBalance!: Decimal;

  // Account Configuration
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive!: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowTransactions!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresApproval!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isSystemAccount!: boolean;

  // Healthcare-Specific Fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  costCenter?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  department?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsString()
  regulatoryCategory?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isResidentSpecific!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isVATApplicable!: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  defaultVATRate?: Decimal;

  // Reporting Configuration
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsString()
  reportingCategory?: string;

  @Column({ type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  includeInReports!: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isConsolidationAccount!: boolean;

  // Relationships
  @OneToMany(() => FinancialTransaction, transaction => transaction.account)
  transactions!: FinancialTransaction[];

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

  /**
   * Get formatted account code with name
   */
  getDisplayName(): string {
    return `${this.accountCode} - ${this.accountName}`;
  }

  /**
   * Get full account path for hierarchical display
   */
  getFullPath(): string {
    if (!this.path) {
      return this.accountName;
    }
    
    return this.path.split('.').join(' > ');
  }

  /**
   * Check if account is a parent account
   */
  isParentAccount(): boolean {
    return this.children && this.children.length > 0;
  }

  /**
   * Check if account can accept transactions
   */
  canAcceptTransactions(): boolean {
    return this.isActive && this.allowTransactions && !this.isParentAccount();
  }

  /**
   * Get account balance formatted with currency
   */
  getFormattedBalance(): string {
    const formatter = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
    
    return formatter.format(this.balance.toNumber());
  }

  /**
   * Update account balance
   */
  updateBalance(amount: Decimal, isDebit: boolean): void {
    if (isDebit) {
      this.debitBalance = this.debitBalance.plus(amount);
    } else {
      this.creditBalance = this.creditBalance.plus(amount);
    }
    
    // Calculate net balance based on account type
    switch (this.accountType) {
      case AccountType.ASSET:
      case AccountType.EXPENSE:
        this.balance = this.debitBalance.minus(this.creditBalance);
        break;
      case AccountType.LIABILITY:
      case AccountType.EQUITY:
      case AccountType.REVENUE:
        this.balance = this.creditBalance.minus(this.debitBalance);
        break;
    }
  }

  /**
   * Get account type display name
   */
  getAccountTypeDisplay(): string {
    const typeNames = {
      [AccountType.ASSET]: 'Asset',
      [AccountType.LIABILITY]: 'Liability',
      [AccountType.EQUITY]: 'Equity',
      [AccountType.REVENUE]: 'Revenue',
      [AccountType.EXPENSE]: 'Expense'
    };
    
    return typeNames[this.accountType];
  }

  /**
   * Check if account is a balance sheet account
   */
  isBalanceSheetAccount(): boolean {
    return [AccountType.ASSET, AccountType.LIABILITY, AccountType.EQUITY].includes(this.accountType);
  }

  /**
   * Check if account is a profit and loss account
   */
  isProfitAndLossAccount(): boolean {
    return [AccountType.REVENUE, AccountType.EXPENSE].includes(this.accountType);
  }

  /**
   * Get account summary for reporting
   */
  getSummary(): {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    balance: string;
    isActive: boolean;
    level: number;
  } {
    return {
      id: this.id,
      code: this.accountCode,
      name: this.accountName,
      type: this.accountType,
      balance: this.getFormattedBalance(),
      isActive: this.isActive,
      level: this.level
    };
  }

  /**
   * Validate account code format
   */
  validateAccountCode(): boolean {
    // Healthcare-specific account code format: XXXX-XX-XX
    const codePattern = /^\d{4}-\d{2}-\d{2}$/;
    return codePattern.test(this.accountCode);
  }

  /**
   * Generate next child account code
   */
  generateChildAccountCode(): string {
    if (!this.children || this.children.length === 0) {
      return `${this.accountCode}-01`;
    }
    
    const childCodes = this.children.map(child => {
      const parts = child.accountCode.split('-');
      return parseInt(parts[parts.length - 1]);
    });
    
    const nextNumber = Math.max(...childCodes) + 1;
    return `${this.accountCode}-${nextNumber.toString().padStart(2, '0')}`;
  }
}

export default ChartOfAccounts;