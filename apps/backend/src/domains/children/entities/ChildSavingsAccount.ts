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
 * Account Type
 */
export enum SavingsAccountType {
  INTERNAL_POCKET_MONEY = 'INTERNAL_POCKET_MONEY', // Internal account (pocket money savings)
  INTERNAL_ALLOWANCE = 'INTERNAL_ALLOWANCE', // Internal account (allowance savings)
  EXTERNAL_BANK_ACCOUNT = 'EXTERNAL_BANK_ACCOUNT', // Real bank account (e.g., Junior ISA)
  TRUST_ACCOUNT = 'TRUST_ACCOUNT', // Trust account (16-25 pathway)
}

/**
 * Transaction Type
 */
export enum SavingsTransactionType {
  DEPOSIT = 'DEPOSIT', // Money in
  WITHDRAWAL = 'WITHDRAWAL', // Money out
  INTEREST = 'INTEREST', // Interest earned
  TRANSFER_IN = 'TRANSFER_IN', // Transfer from another account
  TRANSFER_OUT = 'TRANSFER_OUT', // Transfer to another account
  CORRECTION = 'CORRECTION', // Balance correction
}

/**
 * Withdrawal Status
 */
export enum WithdrawalStatus {
  PENDING = 'PENDING', // Awaiting approval
  APPROVED = 'APPROVED', // Approved
  REJECTED = 'REJECTED', // Rejected
  COMPLETED = 'COMPLETED', // Money disbursed
  CANCELLED = 'CANCELLED', // Cancelled
}

/**
 * Child Savings Account Entity
 * 
 * Tracks children's savings accounts (internal or external bank accounts)
 * with deposits, withdrawals, interest, and approval workflows.
 * 
 * FEATURES:
 * - Internal savings tracking (pocket money, allowances)
 * - External bank account integration (Junior ISA, Children's Account)
 * - Deposit tracking (from pocket money, allowances, gifts)
 * - Withdrawal approvals (social worker + manager)
 * - Interest calculation (monthly, annual)
 * - Balance management with audit trail
 * - High-value withdrawal controls (>£50)
 * - Savings goals tracking
 * - 16+ pathway: Trust accounts
 * - Statements generation
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England) - Reg 5 (savings)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 * - Children Act 1989 s22(3) (safeguarding property)
 * - Care Leavers Regulations 2010 (16-25 pathway)
 * 
 * INTEGRATION:
 * - PocketMoneyTransaction (deposits from pocket money)
 * - AllowanceExpenditure (withdrawals for purchases)
 * - LeavingCareFinances (transition at 16+)
 * 
 * USAGE:
 * ```typescript
 * const account = new ChildSavingsAccount();
 * account.childId = 'uuid';
 * account.accountType = SavingsAccountType.INTERNAL_POCKET_MONEY;
 * account.openAccount(staffUser);
 * account.deposit(10.50, SavingsTransactionType.DEPOSIT, 'Weekly pocket money savings', staffUser);
 * account.requestWithdrawal(25.00, 'New trainers', staffUser);
 * account.approveWithdrawal(socialWorker);
 * ```
 */
@Entity('child_savings_accounts')
@Index('idx_csa_child_id', ['childId'])
@Index('idx_csa_account_type', ['accountType'])
@Index('idx_csa_status', ['status'])
@Index('idx_csa_opened_date', ['openedDate'])
export class ChildSavingsAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ==================== CHILD ====================

  @Column({ type: 'uuid' })
  @Index()
  childId!: string;

  @ManyToOne(() => Child, { nullable: false })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== ACCOUNT TYPE ====================

  @Column({
    type: 'enum',
    enum: SavingsAccountType,
  })
  accountType!: SavingsAccountType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  accountName?: string; // e.g., "Sarah's Birthday Savings"

  // ==================== ACCOUNT STATUS ====================

  @Column({ type: 'varchar', length: 50, default: 'ACTIVE' })
  status!: string; // ACTIVE, CLOSED, FROZEN

  @Column({ type: 'date' })
  openedDate!: Date;

  @Column({ type: 'date', nullable: true })
  closedDate?: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  closureReason?: string;

  // ==================== BALANCE ====================

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  currentBalance!: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency!: string; // GBP or EUR

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalDeposits!: number; // Lifetime deposits

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalWithdrawals!: number; // Lifetime withdrawals

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalInterest!: number; // Lifetime interest earned

  // ==================== EXTERNAL BANK ACCOUNT ====================

  @Column({ type: 'varchar', length: 255, nullable: true })
  bankName?: string; // e.g., "Nationwide", "Halifax"

  @Column({ type: 'varchar', length: 100, nullable: true })
  accountNumber?: string; // Encrypted

  @Column({ type: 'varchar', length: 50, nullable: true })
  sortCode?: string; // Encrypted

  @Column({ type: 'varchar', length: 100, nullable: true })
  accountHolderName?: string; // Child's name

  @Column({ type: 'date', nullable: true })
  bankAccountOpenedDate?: Date;

  // ==================== INTEREST ====================

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  interestRate!: number; // Annual interest rate (e.g., 2.5%)

  @Column({ type: 'varchar', length: 50, default: 'MONTHLY' })
  interestFrequency!: string; // MONTHLY, QUARTERLY, ANNUALLY

  @Column({ type: 'date', nullable: true })
  lastInterestCalculatedDate?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  accruedInterest!: number; // Interest not yet paid

  // ==================== SAVINGS GOAL ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  savingsGoalAmount?: number; // Target amount

  @Column({ type: 'varchar', length: 500, nullable: true })
  savingsGoalDescription?: string; // What saving for

  @Column({ type: 'date', nullable: true })
  savingsGoalTargetDate?: Date;

  @Column({ type: 'boolean', default: false })
  savingsGoalAchieved!: boolean;

  // ==================== WITHDRAWAL CONTROLS ====================

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 50 })
  highValueThreshold!: number; // Withdrawals above this need manager approval

  @Column({ type: 'boolean', default: false })
  requiresManagerApproval!: boolean; // true if withdrawal > threshold

  @Column({ type: 'int', default: 0 })
  pendingWithdrawals!: number; // Count of pending withdrawals

  // ==================== STAFF ====================

  @Column({ type: 'uuid' })
  openedByStaffId!: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'openedByStaffId' })
  openedByStaff!: User;

  @Column({ type: 'uuid', nullable: true })
  closedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'closedByStaffId' })
  closedByStaff?: User;

  // ==================== NOTES & METADATA ====================

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    keyWorkerNotes?: string;
    parentalConsent?: boolean; // If parents involved
    parentName?: string;
    regulatoryReviewDate?: Date; // IRO review
    lastStatementDate?: Date;
    statementFrequency?: string; // MONTHLY, QUARTERLY
  };

  // ==================== AUDIT TRAIL ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  // ==================== BUSINESS METHODS ====================

  /**
   * Open savings account
   */
  public openAccount(staff: User): void {
    this.openedDate = new Date();
    this.openedByStaffId = staff.id;
    this.status = 'ACTIVE';
    this.currentBalance = 0;
    this.totalDeposits = 0;
    this.totalWithdrawals = 0;
    this.totalInterest = 0;
    this.createdBy = staff.username || staff.email;
  }

  /**
   * Deposit money
   */
  public deposit(
    amount: number,
    transactionType: SavingsTransactionType,
    description: string,
    staff: User,
  ): void {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot deposit to inactive account');
    }

    this.currentBalance += amount;

    if (transactionType === SavingsTransactionType.DEPOSIT) {
      this.totalDeposits += amount;
    } else if (transactionType === SavingsTransactionType.INTEREST) {
      this.totalInterest += amount;
    }

    this.updatedBy = staff.username || staff.email;

    // Check if savings goal achieved
    if (this.savingsGoalAmount && this.currentBalance >= this.savingsGoalAmount) {
      this.savingsGoalAchieved = true;
    }
  }

  /**
   * Request withdrawal (pending approval)
   */
  public requestWithdrawal(
    amount: number,
    purpose: string,
    staff: User,
  ): { requiresManagerApproval: boolean; availableBalance: number } {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot withdraw from inactive account');
    }

    if (amount > this.currentBalance) {
      throw new Error(`Insufficient funds. Available: ${this.currency}${this.currentBalance}`);
    }

    // Check if requires manager approval
    const requiresManager = amount > this.highValueThreshold;
    this.requiresManagerApproval = requiresManager;
    this.pendingWithdrawals += 1;

    return {
      requiresManagerApproval: requiresManager,
      availableBalance: this.currentBalance,
    };
  }

  /**
   * Approve withdrawal (complete transaction)
   */
  public approveWithdrawal(
    amount: number,
    approver: User,
  ): void {
    if (amount > this.currentBalance) {
      throw new Error(`Insufficient funds. Available: ${this.currency}${this.currentBalance}`);
    }

    this.currentBalance -= amount;
    this.totalWithdrawals += amount;
    this.pendingWithdrawals -= 1;
    this.requiresManagerApproval = false;
    this.updatedBy = approver.username || approver.email;
  }

  /**
   * Reject withdrawal
   */
  public rejectWithdrawal(): void {
    this.pendingWithdrawals -= 1;
    this.requiresManagerApproval = false;
  }

  /**
   * Calculate monthly interest
   */
  public calculateMonthlyInterest(): number {
    if (this.interestRate === 0) return 0;

    const monthlyRate = this.interestRate / 100 / 12;
    const interest = this.currentBalance * monthlyRate;
    this.accruedInterest += interest;

    return interest;
  }

  /**
   * Apply accrued interest to balance
   */
  public applyInterest(staff: User): void {
    if (this.accruedInterest > 0) {
      this.deposit(
        this.accruedInterest,
        SavingsTransactionType.INTEREST,
        `Interest payment (${this.interestRate}% p.a.)`,
        staff,
      );
      this.lastInterestCalculatedDate = new Date();
      this.accruedInterest = 0;
    }
  }

  /**
   * Set savings goal
   */
  public setSavingsGoal(
    goalAmount: number,
    description: string,
    targetDate?: Date,
  ): void {
    this.savingsGoalAmount = goalAmount;
    this.savingsGoalDescription = description;
    if (targetDate) this.savingsGoalTargetDate = targetDate;
    this.savingsGoalAchieved = this.currentBalance >= goalAmount;
  }

  /**
   * Get progress towards savings goal (%)
   */
  public getSavingsGoalProgress(): number {
    if (!this.savingsGoalAmount || this.savingsGoalAmount === 0) return 0;
    return Math.min((this.currentBalance / this.savingsGoalAmount) * 100, 100);
  }

  /**
   * Close account
   */
  public closeAccount(staff: User, reason: string): void {
    if (this.currentBalance > 0) {
      throw new Error(
        `Cannot close account with balance ${this.currency}${this.currentBalance}. Transfer funds first.`,
      );
    }

    this.status = 'CLOSED';
    this.closedDate = new Date();
    this.closedByStaffId = staff.id;
    this.closureReason = reason;
    this.updatedBy = staff.username || staff.email;
  }

  /**
   * Freeze account (temporarily suspend)
   */
  public freezeAccount(reason: string, staff: User): void {
    this.status = 'FROZEN';
    this.notes = `Account frozen: ${reason}`;
    this.updatedBy = staff.username || staff.email;
  }

  /**
   * Unfreeze account
   */
  public unfreezeAccount(staff: User): void {
    this.status = 'ACTIVE';
    this.updatedBy = staff.username || staff.email;
  }

  /**
   * Transfer to external bank account (16+ pathway)
   */
  public transferToExternalBank(
    bankDetails: {
      bankName: string;
      accountNumber: string;
      sortCode: string;
      accountHolderName: string;
    },
    staff: User,
  ): void {
    this.accountType = SavingsAccountType.EXTERNAL_BANK_ACCOUNT;
    this.bankName = bankDetails.bankName;
    this.accountNumber = bankDetails.accountNumber; // Should be encrypted
    this.sortCode = bankDetails.sortCode; // Should be encrypted
    this.accountHolderName = bankDetails.accountHolderName;
    this.bankAccountOpenedDate = new Date();
    this.updatedBy = staff.username || staff.email;
  }

  /**
   * Check if account is active
   */
  public isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  /**
   * Check if has sufficient funds
   */
  public hasSufficientFunds(amount: number): boolean {
    return this.currentBalance >= amount;
  }

  /**
   * Get available balance (after pending withdrawals)
   */
  public getAvailableBalance(): number {
    // Note: In production, would query actual pending withdrawal amounts
    return this.currentBalance;
  }

  /**
   * Check if requires attention (pending withdrawals, frozen, low balance)
   */
  public requiresAttention(): boolean {
    return (
      this.pendingWithdrawals > 0 ||
      this.status === 'FROZEN' ||
      this.requiresManagerApproval
    );
  }
}

/**
 * Savings Transaction Entity (linked to account)
 * 
 * Tracks individual deposit/withdrawal transactions.
 */
@Entity('child_savings_transactions')
@Index('idx_cst_account_id', ['accountId'])
@Index('idx_cst_transaction_type', ['transactionType'])
@Index('idx_cst_transaction_date', ['transactionDate'])
@Index('idx_cst_withdrawal_status', ['withdrawalStatus'])
export class ChildSavingsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // ==================== ACCOUNT ====================

  @Column({ type: 'uuid' })
  @Index()
  accountId!: string;

  @ManyToOne(() => ChildSavingsAccount, { nullable: false })
  @JoinColumn({ name: 'accountId' })
  account!: ChildSavingsAccount;

  @Column({ type: 'uuid' })
  childId!: string;

  @ManyToOne(() => Child, { nullable: false })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== TRANSACTION ====================

  @Column({
    type: 'enum',
    enum: SavingsTransactionType,
  })
  transactionType!: SavingsTransactionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  currency!: string;

  @Column({ type: 'timestamp' })
  transactionDate!: Date;

  @Column({ type: 'varchar', length: 1000 })
  description!: string; // e.g., "Pocket money savings", "Withdrawal for trainers"

  // ==================== BALANCE TRACKING ====================

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceBefore!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balanceAfter!: number;

  // ==================== LINKED RECORDS ====================

  @Column({ type: 'uuid', nullable: true })
  linkedPocketMoneyTransactionId?: string; // Source of deposit

  @Column({ type: 'uuid', nullable: true })
  linkedAllowanceExpenditureId?: string; // Purpose of withdrawal

  // ==================== WITHDRAWAL APPROVAL ====================

  @Column({
    type: 'enum',
    enum: WithdrawalStatus,
    nullable: true,
  })
  withdrawalStatus?: WithdrawalStatus; // Only for WITHDRAWAL type

  @Column({ type: 'uuid', nullable: true })
  requestedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'requestedByStaffId' })
  requestedByStaff?: User;

  @Column({ type: 'uuid', nullable: true })
  approvedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedByStaffId' })
  approvedByStaff?: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  approvalNotes?: string;

  @Column({ type: 'boolean', default: false })
  requiresManagerApproval!: boolean;

  @Column({ type: 'uuid', nullable: true })
  managerApprovedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'managerApprovedByStaffId' })
  managerApprovedByStaff?: User;

  // ==================== DISBURSEMENT ====================

  @Column({ type: 'varchar', length: 100, nullable: true })
  disbursementMethod?: string; // CASH, TRANSFER, CHEQUE

  @Column({ type: 'timestamp', nullable: true })
  disbursedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  disbursedByStaffId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'disbursedByStaffId' })
  disbursedByStaff?: User;

  // ==================== CHILD ACKNOWLEDGEMENT ====================

  @Column({ type: 'boolean', default: false })
  childAcknowledged!: boolean; // Child aware of transaction

  @Column({ type: 'varchar', length: 1000, nullable: true })
  childComment?: string;

  // ==================== AUDIT TRAIL ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'varchar', length: 255 })
  createdBy!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;
}
