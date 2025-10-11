import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Child } from './Child';
import { User } from '../../users/entities/User';

/**
 * British Isles Jurisdiction
 */
export enum BritishIslesJurisdiction {
  ENGLAND = 'ENGLAND',
  SCOTLAND = 'SCOTLAND',
  WALES = 'WALES',
  NORTHERN_IRELAND = 'NORTHERN_IRELAND',
  IRELAND = 'IRELAND',
  JERSEY = 'JERSEY',
  GUERNSEY = 'GUERNSEY',
  ISLE_OF_MAN = 'ISLE_OF_MAN',
}

/**
 * Disbursement Method
 */
export enum DisbursementMethod {
  CASH = 'CASH',
  PREPAID_CARD = 'PREPAID_CARD', // Osper, gohenry, etc.
  BANK_TRANSFER = 'BANK_TRANSFER', // To child's account
  VOUCHER = 'VOUCHER',
  OTHER = 'OTHER',
}

/**
 * Disbursement Status
 */
export enum DisbursementStatus {
  PENDING = 'PENDING', // Scheduled but not yet disbursed
  DISBURSED = 'DISBURSED', // Disbursed successfully
  REFUSED = 'REFUSED', // Child refused to take money
  WITHHELD = 'WITHHELD', // Withheld due to behavior (requires manager approval)
  CANCELLED = 'CANCELLED', // Cancelled (e.g., child absent)
  DEFERRED = 'DEFERRED', // Postponed to later date
}

/**
 * Age-Based Pocket Money Rates by Jurisdiction
 * 
 * Statutory guidance and local authorityrecommendations:
 * - England: Care Planning Regulations 2010 + LA guidance
 * - Scotland: Looked After Children Regulations 2009
 * - Wales: Care Planning Regulations 2015
 * - NorthernIreland: Children Order 1995
 * - Ireland: Tusla guidance
 */
export const POCKET_MONEY_RATES: Record<
  BritishIslesJurisdiction,
  Record<string, number>
> = {
  [BritishIslesJurisdiction.ENGLAND]: {
    '5-7': 5.0,
    '8-10': 7.5,
    '11-15': 10.0,
    '16-18': 12.5,
  },
  [BritishIslesJurisdiction.SCOTLAND]: {
    '5-7': 5.0,
    '8-10': 8.0,
    '11-15': 11.0,
    '16-18': 14.0,
  },
  [BritishIslesJurisdiction.WALES]: {
    '5-7': 5.0,
    '8-10': 7.5,
    '11-15': 10.0,
    '16-18': 12.5,
  },
  [BritishIslesJurisdiction.NORTHERN_IRELAND]: {
    '5-7': 5.0,
    '8-10': 7.0,
    '11-15': 9.0,
    '16-18': 11.0,
  },
  [BritishIslesJurisdiction.IRELAND]: {
    '5-7': 6.0, // EUR
    '8-10': 9.0,
    '11-15': 12.0,
    '16-18': 15.0,
  },
  [BritishIslesJurisdiction.JERSEY]: {
    '5-7': 5.0,
    '8-10': 7.5,
    '11-15': 10.0,
    '16-18': 12.5,
  },
  [BritishIslesJurisdiction.GUERNSEY]: {
    '5-7': 5.0,
    '8-10': 7.5,
    '11-15': 10.0,
    '16-18': 12.5,
  },
  [BritishIslesJurisdiction.ISLE_OF_MAN]: {
    '5-7': 5.0,
    '8-10': 7.5,
    '11-15': 10.0,
    '16-18': 12.5,
  },
};

/**
 * PocketMoneyTransaction Entity
 * 
 * Tracks weekly pocket money disbursements to children in residential care
 * across all 8 British Isles jurisdictions.
 * 
 * FEATURES:
 * - Weekly pocket money tracking
 * - Age-based rates (8 jurisdictions)
 * - Staff signature recording
 * - Child receipt confirmation
 * - variance alerts (disbursement ≠ expected rate)
 * - Withholding tracking (behavior management)
 * - Deferral tracking (child absent)
 * - Refusal tracking (child refuses money)
 * - Audit trail (who, when, why)
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 * - Local authority guidance (Channel Islands, Isle of Man)
 * 
 * INTEGRATION:
 * - ResidentialCarePlacement.weeklyPocketMoney (expected rate)
 * - ChildBilling.personalAllowances.weeklyPocketMoney (budget)
 * - ChildSavingsAccount (deposits from pocket money)
 * 
 * USAGE:
 * ```typescript
 * const transaction = new PocketMoneyTransaction();
 * transaction.childId = 'uuid';
 * transaction.jurisdiction = BritishIslesJurisdiction.ENGLAND;
 * transaction.weekNumber = 12;
 * transaction.weekStartDate = new Date('2025-03-17');
 * transaction.expectedAmount = transaction.calculateExpectedAmount(child.dateOfBirth);
 * transaction.disburseAmount(12.50, DisbursementMethod.CASH, staffUser);
 * ```
 */
@Entity('pocket_money_transactions')
@Index('idx_pmt_child_id', ['childId'])
@Index('idx_pmt_week', ['weekNumber', 'year'])
@Index('idx_pmt_status', ['status'])
@Index('idx_pmt_disbursed_date', ['disbursedAt'])
@Index('idx_pmt_jurisdiction', ['jurisdiction'])
export class PocketMoneyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ==================== CHILD & PLACEMENT ====================

  @Column({ type: 'uuid' })
  @Index()
  childId!: string;

  @ManyToOne(() => Child, { nullable: false })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  @Column({
    type: 'enum',
    enum: BritishIslesJurisdiction,
  })
  jurisdiction!: BritishIslesJurisdiction;

  // ==================== WEEKTRACKING ====================

  @Column({ type: 'int' })
  weekNumber!: number; // 1-52 (ISO week number)

  @Column({ type: 'int' })
  year!: number; // e.g., 2025

  @Column({ type: 'date' })
  weekStartDate!: Date; // Monday of the week

  @Column({ type: 'date' })
  weekEndDate!: Date; // Sunday of the week

  // ==================== EXPECTEDAMOUNT ====================

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  expectedAmount!: number; // Age-based rate from POCKET_MONEY_RATES

  @Column({ type: 'var char', length: 10 })
  ageRange!: string; // '5-7', '8-10', '11-15', '16-18'

  @Column({ type: 'var char', length: 500, nullable: true })
  expectedAmountSource?: string; // e.g., "England statutory guidance for ages 11-15"

  // ==================== DISBURSEMENT ====================

  @Column({
    type: 'enum',
    enum: DisbursementStatus,
    default: DisbursementStatus.PENDING,
  })
  status!: DisbursementStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  disbursedAmount?: number;

  @Column({
    type: 'enum',
    enum: DisbursementMethod,
    nullable: true,
  })
  disbursementMethod?: DisbursementMethod;

  @Column({ type: 'timestamp', nullable: true })
  disbursedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  disbursedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'disbursedByStaffId' })
  disbursedByStaff?: User;

  // ==================== varianceTRACKING ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  variance!: number; // disbursedAmount - expectedAmount

  @Column({ type: 'boolean', default: false })
  hasVariance!: boolean; // true ifvariance !== 0

  @Column({ type: 'var char', length: 500, nullable: true })
  varianceReason?: string; // Explanation if disbursedAmount ≠ expectedAmount

  // ==================== CHILDRECEIPT ====================

  @Column({ type: 'boolean', default: false })
  childReceiptConfirmed!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  childReceiptConfirmedAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  childReceiptSignature?: string; // Child's signature (image URL or digital signature)

  @Column({ type: 'var char', length: 500, nullable: true })
  childComment?: string; // Child's comment/feedback

  // ==================== REFUSALTRACKING ====================

  @Column({ type: 'boolean', default: false })
  wasRefused!: boolean;

  @Column({ type: 'var char', length: 1000, nullable: true })
  refusalReason?: string; // Why child refused money

  @Column({ type: 'timestamp', nullable: true })
  refusedAt?: Date;

  // ==================== WITHHOLDINGTRACKING ====================

  @Column({ type: 'boolean', default: false })
  wasWithheld!: boolean;

  @Column({ type: 'var char', length: 1000, nullable: true })
  withholdingReason?: string; // Behavior management (requires manager approval)

  @Column({ type: 'uuid', nullable: true })
  withheldByManagerId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'withheldByManagerId' })
  withheldByManager?: User;

  @Column({ type: 'timestamp', nullable: true })
  withheldAt?: Date;

  @Column({ type: 'boolean', default: false })
  withholdingApproved!: boolean; // Manager must approve withholding

  // ==================== DEFERRALTRACKING ====================

  @Column({ type: 'boolean', default: false })
  wasDeferred!: boolean;

  @Column({ type: 'var char', length: 1000, nullable: true })
  deferralReason?: string; // e.g., "Child on home visit", "Child in hospital"

  @Column({ type: 'date', nullable: true })
  deferredToDate?: Date; // Date when money will be disbursed

  // ==================== SAVINGSTRANSFER ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  transferredToSavings!: number; // Amount child chose to save

  @Column({ type: 'uuid', nullable: true })
  savingsAccountId?: string; // Link to ChildSavingsAccount

  @Column({ type: 'boolean', default: false })
  hasPartialSavingsTransfer!: boolean; // true if child saved portion

  // ==================== NOTES & METADATA ====================

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    location?: string; // Where disbursed (e.g., "Main office", "Child's room")
    witnesses?: string[]; // Other staff present
    childMood?: string; // Child's mood/behavior during disbursement
    linkedTransactionIds?: string[]; // Related transactions (e.g., replacement disbursement)
  };

  // ==================== AUDITTRAIL ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'var char', length: 255 })
  createdBy!: string;

  @Column({ type: 'var char', length: 255, nullable: true })
  updatedBy?: string;

  // ==================== BUSINESSMETHODS ====================

  /**
   * Calculate expected pocket money amount based on child's age and jurisdiction
   */
  public calculateExpectedAmount(childDateOfBirth: Date): number {
    const age = this.calculateAge(childDateOfBirth);
    const ageRange = this.getAgeRange(age);
    this.ageRange = ageRange;

    const rate = POCKET_MONEY_RATES[this.jurisdiction][ageRange];
    if (!rate) {
      throw new Error(
        `No pocket money rate found for jurisdiction ${this.jurisdiction} and age range ${ageRange}`,
      );
    }

    this.expectedAmountSource = `${this.jurisdiction} statutory guidance for ages ${ageRange}`;
    return rate;
  }

  /**
   * Calculate child's age in years
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Get age range for pocket money rates
   */
  private getAgeRange(age: number): string {
    if (age >= 5 && age <= 7) return '5-7';
    if (age >= 8 && age <= 10) return '8-10';
    if (age >= 11 && age <= 15) return '11-15';
    if (age >= 16 && age <= 18) return '16-18';
    throw new Error(`Age ${age} is outside pocket money age range (5-18)`);
  }

  /**
   * Disburse pocket money to child
   */
  public disburseAmount(
    amount: number,
    method: DisbursementMethod,
    staffUser: User,
  ): void {
    this.disbursedAmount = amount;
    this.disbursementMethod = method;
    this.disbursedAt = new Date();
    this.disbursedByStaffId = staffUser.id;
    this.status = DisbursementStatus.DISBURSED;

    // Calculate variance
    this.calculateVariance();
  }

  /**
   * Calculate variance between disbursed and expected amount
   */
  public calculateVariance(): void {
    if (this.disbursedAmount !== undefined && this.expectedAmount !== undefined) {
      this.variance = this.disbursedAmount - this.expectedAmount;
      this.hasVariance = Math.abs(this.variance) > 0.01; // Allow for rounding errors
    }
  }

  /**
   * Record child receipt confirmation
   */
  public confirmReceipt(signature?: string, comment?: string): void {
    this.childReceiptConfirmed = true;
    this.childReceiptConfirmedAt = new Date();
    if (signature) this.childReceiptSignature = signature;
    if (comment) this.childComment = comment;
  }

  /**
   * Record refusal by child
   */
  public recordRefusal(reason: string): void {
    this.wasRefused = true;
    this.refusalReason = reason;
    this.refusedAt = new Date();
    this.status = DisbursementStatus.REFUSED;
  }

  /**
   * Withhold pocket money (requires manager approval)
   */
  public withholdMoney(reason: string, manager: User): void {
    this.wasWithheld = true;
    this.withholdingReason = reason;
    this.withheldByManagerId = manager.id;
    this.withheldAt = new Date();
    this.status = DisbursementStatus.WITHHELD;
    this.withholdingApproved = true; // Approved by manager
  }

  /**
   * Defer disbursement to later date
   */
  public deferDisbursement(reason: string, deferToDate: Date): void {
    this.wasDeferred = true;
    this.deferralReason = reason;
    this.deferredToDate = deferToDate;
    this.status = DisbursementStatus.DEFERRED;
  }

  /**
   * Transfer portion to savings
   */
  public transferToSavings(
    amount: number,
    savingsAccountId: string,
  ): void {
    if (amount > (this.disbursedAmount || 0)) {
      throw new Error('Cannot transfer more than disbursed amount to savings');
    }

    this.transferredToSavings = amount;
    this.savingsAccountId = savingsAccountId;
    this.hasPartialSavingsTransfer = amount > 0;
  }

  /**
   * Cancel transaction
   */
  public cancel(reason: string): void {
    this.status = DisbursementStatus.CANCELLED;
    this.notes = (this.notes || '') + `\nCancellation reason: ${reason}`;
  }

  /**
   * Check if transaction requires variance explanation
   */
  public requiresVarianceExplanation(): boolean {
    return this.hasVariance && !this.varianceReason;
  }

  /**
   * Check if transaction is complete
   */
  public isComplete(): boolean {
    return (
      this.status === DisbursementStatus.DISBURSED &&
      this.childReceiptConfirmed
    );
  }

  /**
   * Check if transaction needs manager attention
   */
  public needsManagerAttention(): boolean {
    return (
      this.wasWithheld ||
      (this.hasVariance && Math.abs(this.variance) > 2.0) || // variance > £2
      this.wasRefused
    );
  }
}
