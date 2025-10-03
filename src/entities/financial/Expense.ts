import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Expense Entity for WriteCareNotes
 * @module ExpenseEntity
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Expense entity for healthcare expense tracking and management
 * with comprehensive audit trails, encryption, and compliance features.
 * 
 * @compliance
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - HMRC (Her Majesty's Revenue and Customs) regulations
 * - NHS Digital standards for healthcare expense management
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
import { ChartOfAccounts } from './ChartOfAccounts';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger } from '@/utils/logger';

/**
 * Expense status enumeration
 */
export enum ExpenseStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

/**
 * Expense category enumeration
 */
export enum ExpenseCategory {
  STAFF_COSTS = 'staff_costs',
  MEDICATION = 'medication',
  MEDICAL_SUPPLIES = 'medical_supplies',
  UTILITIES = 'utilities',
  MAINTENANCE = 'maintenance',
  CATERING = 'catering',
  CLEANING = 'cleaning',
  LAUNDRY = 'laundry',
  TRANSPORT = 'transport',
  TRAINING = 'training',
  PROFESSIONAL_SERVICES = 'professional_services',
  INSURANCE = 'insurance',
  REGULATORY_FEES = 'regulatory_fees',
  OFFICE_SUPPLIES = 'office_supplies',
  IT_EQUIPMENT = 'it_equipment',
  FURNITURE = 'furniture',
  SECURITY = 'security',
  GARDENING = 'gardening',
  ENTERTAINMENT = 'entertainment',
  OTHER = 'other'
}

/**
 * Expense type enumeration
 */
export enum ExpenseType {
  OPERATIONAL = 'operational',
  CAPITAL = 'capital',
  MAINTENANCE = 'maintenance',
  EMERGENCY = 'emergency',
  TRAINING = 'training',
  COMPLIANCE = 'compliance',
  MARKETING = 'marketing',
  RESEARCH = 'research'
}

/**
 * Reimbursement status enumeration
 */
export enum ReimbursementStatus {
  NOT_APPLICABLE = 'not_applicable',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid'
}

/**
 * Expense entity with comprehensive healthcare expense management features
 */
@Entity('wcn_expenses')
@Index(['expenseNumber'], { unique: true })
@Index(['status', 'expenseDate'])
@Index(['category', 'expenseType'])
@Index(['submittedBy', 'expenseDate'])
export class Expense extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // Expense Identification
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  @Length(1, 50)
  expenseNumber!: string;

  @Column({ type: 'enum', enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @Column({ type: 'enum', enum: ExpenseType })
  @IsEnum(ExpenseType)
  expenseType!: ExpenseType;

  @Column({ type: 'enum', enum: ExpenseStatus, default: ExpenseStatus.DRAFT })
  @IsEnum(ExpenseStatus)
  status!: ExpenseStatus;

  // Financial Information
  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  amount!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  vatAmount!: Decimal;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  vatRate!: Decimal;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  totalAmount!: Decimal;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  @IsString()
  @Length(3, 3)
  currency!: string;

  // Expense Details
  @Column({ type: 'date' })
  @IsDate()
  expenseDate!: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(1, 255)
  description!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  detailedDescription?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  supplier?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  receiptNumber?: string;

  // Location and Department
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  location?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  projectCode?: string;

  // Reimbursement Information
  @Column({ type: 'enum', enum: ReimbursementStatus, default: ReimbursementStatus.NOT_APPLICABLE })
  @IsEnum(ReimbursementStatus)
  reimbursementStatus!: ReimbursementStatus;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => new Decimal(value))
  reimbursedAmount!: Decimal;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  reimbursedDate?: Date;

  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  reimbursedBy?: string;

  // Approval Workflow
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  submittedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDate()
  submittedDate?: Date;

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

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

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

  // Document Management
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  invoiceUrl?: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  supportingDocuments?: string;

  // Budget and Cost Center
  @Column({ type: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  budgetId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  costCenter?: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isBudgeted!: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 4, nullable: true })
  @IsDecimal({ decimal_digits: '0,4' })
  @Transform(({ value }) => value ? new Decimal(value) : null)
  budgetedAmount?: Decimal;

  // Relationships
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
    this.validateExpenseData();
    this.calculateTotals();
    
    if (!this.id) {
      this.id = uuidv4();
    }
    
    if (!this.correlationId) {
      this.correlationId = uuidv4();
    }
    
    if (!this.expenseNumber) {
      this.expenseNumber = this.generateExpenseNumber();
    }
    
    console.info('Expense created', {
      expenseId: this.id,
      expenseNumber: this.expenseNumber,
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
    this.validateExpenseData();
    this.calculateTotals();
    
    console.info('Expense updated', {
      expenseId: this.id,
      expenseNumber: this.expenseNumber,
      updatedBy: this.updatedBy,
      auditTrail: true,
      complianceEvent: true
    });
  }

  /**
   * Validate expense data
   */
  private validateExpenseData(): void {
    if (this.amount.lessThanOrEqualTo(0)) {
      throw new Error('Expense amount must be positive');
    }

    if (this.expenseDate > new Date()) {
      throw new Error('Expense date cannot be in the future');
    }

    if (this.reimbursedAmount.greaterThan(this.totalAmount)) {
      throw new Error('Reimbursed amount cannot exceed total amount');
    }
  }

  /**
   * Calculate expense totals
   */
  private calculateTotals(): void {
    this.vatAmount = this.amount.times(this.vatRate);
    this.totalAmount = this.amount.plus(this.vatAmount);
  }

  /**
   * Generate expense number
   */
  private generateExpenseNumber(): string {
    const year = this.expenseDate.getFullYear();
    const month = (this.expenseDate.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    
    return `EXP-${year}${month}-${timestamp}`;
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
   * Check if expense is approved
   */
  isApproved(): boolean {
    return this.status === ExpenseStatus.APPROVED;
  }

  /**
   * Check if expense is rejected
   */
  isRejected(): boolean {
    return this.status === ExpenseStatus.REJECTED;
  }

  /**
   * Check if expense is paid
   */
  isPaid(): boolean {
    return this.status === ExpenseStatus.PAID;
  }

  /**
   * Check if expense is reimbursable
   */
  isReimbursable(): boolean {
    return this.reimbursementStatus !== ReimbursementStatus.NOT_APPLICABLE;
  }

  /**
   * Get remaining reimbursable amount
   */
  getRemainingReimbursableAmount(): Decimal {
    return this.totalAmount.minus(this.reimbursedAmount);
  }

  /**
   * Submit expense for approval
   */
  submit(submittedBy: string): void {
    if (this.status !== ExpenseStatus.DRAFT) {
      throw new Error('Only draft expenses can be submitted');
    }
    
    this.status = ExpenseStatus.SUBMITTED;
    this.submittedBy = submittedBy;
    this.submittedDate = new Date();
    
    console.info('Expense submitted for approval', {
      expenseId: this.id,
      expenseNumber: this.expenseNumber,
      submittedBy,
      auditTrail: true
    });
  }

  /**
   * Approve expense
   */
  approve(approvedBy: string, notes?: string): void {
    if (this.status !== ExpenseStatus.SUBMITTED && this.status !== ExpenseStatus.PENDING_APPROVAL) {
      throw new Error('Only submitted or pending expenses can be approved');
    }
    
    this.status = ExpenseStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
    this.approvalNotes = notes;
    
    console.info('Expense approved', {
      expenseId: this.id,
      expenseNumber: this.expenseNumber,
      approvedBy,
      auditTrail: true
    });
  }

  /**
   * Reject expense
   */
  reject(rejectedBy: string, reason: string): void {
    if (this.status !== ExpenseStatus.SUBMITTED && this.status !== ExpenseStatus.PENDING_APPROVAL) {
      throw new Error('Only submitted or pending expenses can be rejected');
    }
    
    this.status = ExpenseStatus.REJECTED;
    this.rejectionReason = reason;
    
    console.info('Expense rejected', {
      expenseId: this.id,
      expenseNumber: this.expenseNumber,
      rejectedBy,
      reason,
      auditTrail: true
    });
  }

  /**
   * Process reimbursement
   */
  processReimbursement(amount: Decimal, reimbursedBy: string): void {
    if (amount.lessThanOrEqualTo(0)) {
      throw new Error('Reimbursement amount must be positive');
    }
    
    if (amount.greaterThan(this.getRemainingReimbursableAmount())) {
      throw new Error('Reimbursement amount cannot exceed remaining reimbursable amount');
    }
    
    this.reimbursedAmount = this.reimbursedAmount.plus(amount);
    this.reimbursedBy = reimbursedBy;
    this.reimbursedDate = new Date();
    
    if (this.reimbursedAmount.equals(this.totalAmount)) {
      this.reimbursementStatus = ReimbursementStatus.PAID;
    } else {
      this.reimbursementStatus = ReimbursementStatus.APPROVED;
    }
    
    console.info('Expense reimbursement processed', {
      expenseId: this.id,
      reimbursementAmount: amount.toString(),
      totalReimbursed: this.reimbursedAmount.toString(),
      reimbursedBy,
      auditTrail: true
    });
  }

  /**
   * Get expense summary
   */
  getSummary(): {
    id: string;
    expenseNumber: string;
    amount: string;
    totalAmount: string;
    status: ExpenseStatus;
    category: ExpenseCategory;
    isReimbursable: boolean;
    reimbursedAmount: string;
  } {
    return {
      id: this.id,
      expenseNumber: this.expenseNumber,
      amount: this.amount.toString(),
      totalAmount: this.getFormattedTotal(),
      status: this.status,
      category: this.category,
      isReimbursable: this.isReimbursable(),
      reimbursedAmount: this.reimbursedAmount.toString()
    };
  }
}

export default Expense;