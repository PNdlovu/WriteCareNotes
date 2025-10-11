import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, MoreThan, LessThan } from 'typeorm';
import {
  PocketMoneyTransaction,
  BritishIslesJurisdiction,
  DisbursementMethod,
  DisbursementStatus,
  POCKET_MONEY_RATES,
} from '../entities/PocketMoneyTransaction';
import {
  AllowanceExpenditure,
  AllowanceType,
  ApprovalStatus,
  ReceiptStatus,
} from '../entities/AllowanceExpenditure';
import {
  ChildSavingsAccount,
  ChildSavingsTransaction,
  SavingsAccountType,
  SavingsTransactionType,
  WithdrawalStatus,
} from '../entities/ChildSavingsAccount';
import { Child } from '../entities/Child';
import { User } from '../../users/entities/User';

/**
 * Child Allowance Service
 * 
 * Comprehensive service for managing pocket money, allowances, and savings
 * for looked-after children across British Isles jurisdictions.
 * 
 * FEATURES:
 * - Pocket money disbursement (weekly, age-based rates)
 * - Allowance expenditure tracking (clothing, birthday, festival, education)
 * - Savings account management (deposits, withdrawals, interest)
 * - Receipt management (upload, verify)
 * - Approval workflows (social worker → manager)
 * - Budget vs actual analysis
 * - Quarterly summaries
 * - IRO dashboard reports
 * - British Isles rate lookups
 * 
 * COMPLIANCE:
 * - Care Planning Regulations 2010 (England)
 * - Looked After Children Regulations 2009 (Scotland)
 * - Care Planning Regulations 2015 (Wales)
 * - Children Order 1995 (Northern Ireland)
 * - Tusla guidance (Ireland)
 * - Equality Act 2010 (cultural/religious needs)
 * 
 * @class ChildAllowanceService
 */
@Injectable()
export class ChildAllowanceService {
  const ructor(
    @InjectRepository(PocketMoneyTransaction)
    privatepocketMoneyRepo: Repository<PocketMoneyTransaction>,

    @InjectRepository(AllowanceExpenditure)
    privateallowanceRepo: Repository<AllowanceExpenditure>,

    @InjectRepository(ChildSavingsAccount)
    privatesavingsAccountRepo: Repository<ChildSavingsAccount>,

    @InjectRepository(ChildSavingsTransaction)
    privatesavingsTransactionRepo: Repository<ChildSavingsTransaction>,

    @InjectRepository(Child)
    privatechildRepo: Repository<Child>,
  ) {}

  // ==================== POCKET MONEYDISBURSEMENT ====================

  /**
   * Disburse weekly pocket money
   */
  async disburseWeeklyPocketMoney(
    childId: string,
    weekNumber: number,
    year: number,
    jurisdiction: BritishIslesJurisdiction,
    method: DisbursementMethod,
    staff: User,
    options?: {
      partialAmount?: number;
      savingsAmount?: number;
      notes?: string;
    },
  ): Promise<PocketMoneyTransaction> {
    // Get child
    const child = await this.childRepo.findOne({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException(`Child ${childId} not found`);
    }

    // Check for existing transaction
    const existing = await this.pocketMoneyRepo.findOne({
      where: { childId, weekNumber, year },
    });
    if (existing) {
      throw new BadRequestException(
        `Pocket money already disbursed for child ${childId} in week ${weekNumber}/${year}`,
      );
    }

    // Create transaction
    const transaction = new PocketMoneyTransaction();
    transaction.childId = childId;
    transaction.jurisdiction = jurisdiction;
    transaction.weekNumber = weekNumber;
    transaction.year = year;

    // Set week dates
    const weekStart = this.getWeekStartDate(weekNumber, year);
    transaction.weekStartDate = weekStart;
    transaction.weekEndDate = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Calculate expected amount
    transaction.expectedAmount = transaction.calculateExpectedAmount(child.dateOfBirth);
    transaction.ageRange = transaction.getAgeRange(child.dateOfBirth);

    // Disburse
    const disbursedAmount = options?.partialAmount || transaction.expectedAmount;
    transaction.disburseAmount(disbursedAmount, method, staff.id, options?.notes);

    // Handle savings transfer
    if (options?.savingsAmount && options.savingsAmount > 0) {
      if (options.savingsAmount > disbursedAmount) {
        throw new BadRequestException('Savings amount cannot exceed disbursed amount');
      }
      // Note: Savings transfer will be handled separately
      transaction.transferredToSavings = options.savingsAmount;
    }

    transaction.createdBy = staff.username || staff.email;
    return await this.pocketMoneyRepo.save(transaction);
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStartDate(weekNumber: number, year: number): Date {
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() || 7; // Sunday = 7
    const weekOneMonday = new Date(jan4.getTime() - (jan4DayOfWeek - 1) * 24 * 60 * 60 * 1000);
    return new Date(weekOneMonday.getTime() + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  }

  /**
   * Confirm child receipt of pocket money
   */
  async confirmPocketMoneyReceipt(
    transactionId: string,
    childSignature: string,
    childComment?: string,
  ): Promise<PocketMoneyTransaction> {
    const transaction = await this.pocketMoneyRepo.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    transaction.confirmReceipt(childSignature, childComment);
    return await this.pocketMoneyRepo.save(transaction);
  }

  /**
   * Record pocket money refusal
   */
  async recordPocketMoneyRefusal(
    transactionId: string,
    reason: string,
    staff: User,
  ): Promise<PocketMoneyTransaction> {
    const transaction = await this.pocketMoneyRepo.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    transaction.recordRefusal(reason);
    transaction.updatedBy = staff.username || staff.email;
    return await this.pocketMoneyRepo.save(transaction);
  }

  /**
   * Withhold pocket money (requires manager approval)
   */
  async withholdPocketMoney(
    transactionId: string,
    reason: string,
    manager: User,
  ): Promise<PocketMoneyTransaction> {
    const transaction = await this.pocketMoneyRepo.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    transaction.withholdMoney(reason, manager.id);
    transaction.updatedBy = manager.username || manager.email;
    return await this.pocketMoneyRepo.save(transaction);
  }

  /**
   * Defer pocket money disbursement
   */
  async deferPocketMoney(
    transactionId: string,
    reason: string,
    deferToDate: Date,
    staff: User,
  ): Promise<PocketMoneyTransaction> {
    const transaction = await this.pocketMoneyRepo.findOne({ where: { id: transactionId } });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    transaction.deferDisbursement(reason, deferToDate);
    transaction.updatedBy = staff.username || staff.email;
    return await this.pocketMoneyRepo.save(transaction);
  }

  /**
   * Get pocket money transactions for child
   */
  async getPocketMoneyTransactions(
    childId: string,
    options?: {
      year?: number;
      status?: DisbursementStatus;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<PocketMoneyTransaction[]> {
    const where: any = { childId };

    if (options?.year) where.year = options.year;
    if (options?.status) where.status = options.status;
    if (options?.startDate && options?.endDate) {
      where.disbursedDate = Between(options.startDate, options.endDate);
    }

    return await this.pocketMoneyRepo.find({
      where,
      order: { year: 'DESC', weekNumber: 'DESC' },
    });
  }

  // ==================== ALLOWANCEEXPENDITURE ====================

  /**
   * Request allowance expenditure
   */
  async requestAllowanceExpenditure(
    childId: string,
    allowanceType: AllowanceType,
    amount: number,
    itemDescription: string,
    vendor: string,
    purchaseDate: Date,
    staff: User,
    options?: {
      budgetAmount?: number;
      isCultural?: boolean;
      isReligious?: boolean;
      culturalContext?: string;
      childPresent?: boolean;
      childChose?: boolean;
    },
  ): Promise<AllowanceExpenditure> {
    // Get child
    const child = await this.childRepo.findOne({ where: { id: childId } });
    if (!child) {
      throw new NotFoundException(`Child ${childId} not found`);
    }

    // Create expenditure
    const expenditure = new AllowanceExpenditure();
    expenditure.childId = childId;
    expenditure.allowanceType = allowanceType;
    expenditure.amount = amount;
    expenditure.purchaseDate = purchaseDate;
    expenditure.createdBy = staff.username || staff.email;

    // Request purchase
    expenditure.requestPurchase(itemDescription, vendor, staff);

    // Budget tracking
    if (options?.budgetAmount) {
      const spentToDate = await this.getSpentToDate(childId, allowanceType);
      expenditure.updateBudgetTracking(options.budgetAmount, spentToDate);
    }

    // Cultural/religious needs
    if (options?.isCultural || options?.isReligious) {
      expenditure.markCulturalReligiousNeed(
        options.isCultural || false,
        options.isReligious || false,
        options.culturalContext || '',
      );
    }

    // Child involvement
    if (options?.childPresent !== undefined || options?.childChose !== undefined) {
      expenditure.recordChildInvolvement(
        options.childPresent || false,
        options.childChose || false,
      );
    }

    return await this.allowanceRepo.save(expenditure);
  }

  /**
   * Get spent to date for allowance type
   */
  private async getSpentToDate(childId: string, allowanceType: AllowanceType): Promise<number> {
    const year = new Date().getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    const expenditures = await this.allowanceRepo.find({
      where: {
        childId,
        allowanceType,
        approvalStatus: ApprovalStatus.APPROVED,
        purchaseDate: Between(startOfYear, endOfYear),
      },
    });

    return expenditures.reduce((sum, exp) => sum + Number(exp.amount), 0);
  }

  /**
   * Approve allowance expenditure
   */
  async approveAllowanceExpenditure(
    expenditureId: string,
    approver: User,
    notes?: string,
  ): Promise<AllowanceExpenditure> {
    const expenditure = await this.allowanceRepo.findOne({ where: { id: expenditureId } });
    if (!expenditure) {
      throw new NotFoundException(`Expenditure ${expenditureId} not found`);
    }

    expenditure.approve(approver, notes);
    expenditure.updatedBy = approver.username || approver.email;
    return await this.allowanceRepo.save(expenditure);
  }

  /**
   * Reject allowance expenditure
   */
  async rejectAllowanceExpenditure(
    expenditureId: string,
    approver: User,
    reason: string,
  ): Promise<AllowanceExpenditure> {
    const expenditure = await this.allowanceRepo.findOne({ where: { id: expenditureId } });
    if (!expenditure) {
      throw new NotFoundException(`Expenditure ${expenditureId} not found`);
    }

    expenditure.reject(approver, reason);
    expenditure.updatedBy = approver.username || approver.email;
    return await this.allowanceRepo.save(expenditure);
  }

  /**
   * Upload receipt for expenditure
   */
  async uploadReceipt(
    expenditureId: string,
    receiptImageUrl: string,
    staff: User,
  ): Promise<AllowanceExpenditure> {
    const expenditure = await this.allowanceRepo.findOne({ where: { id: expenditureId } });
    if (!expenditure) {
      throw new NotFoundException(`Expenditure ${expenditureId} not found`);
    }

    expenditure.uploadReceipt(receiptImageUrl, staff);
    expenditure.updatedBy = staff.username || staff.email;
    return await this.allowanceRepo.save(expenditure);
  }

  /**
   * Verify receipt
   */
  async verifyReceipt(
    expenditureId: string,
    staff: User,
  ): Promise<AllowanceExpenditure> {
    const expenditure = await this.allowanceRepo.findOne({ where: { id: expenditureId } });
    if (!expenditure) {
      throw new NotFoundException(`Expenditure ${expenditureId} not found`);
    }

    expenditure.verifyReceipt(staff);
    expenditure.updatedBy = staff.username || staff.email;
    return await this.allowanceRepo.save(expenditure);
  }

  /**
   * Get allowance expenditures for child
   */
  async getAllowanceExpenditures(
    childId: string,
    options?: {
      allowanceType?: AllowanceType;
      category?: string;
      approvalStatus?: ApprovalStatus;
      receiptStatus?: ReceiptStatus;
      year?: number;
      quarter?: number;
    },
  ): Promise<AllowanceExpenditure[]> {
    const where: any = { childId };

    if (options?.allowanceType) where.allowanceType = options.allowanceType;
    if (options?.category) where.category = options.category;
    if (options?.approvalStatus) where.approvalStatus = options.approvalStatus;
    if (options?.receiptStatus) where.receiptStatus = options.receiptStatus;
    if (options?.year) where.year = options.year;
    if (options?.quarter) where.quarter = options.quarter;

    return await this.allowanceRepo.find({
      where,
      order: { purchaseDate: 'DESC' },
    });
  }

  // ==================== SAVINGSACCOUNT ====================

  /**
   * Open savings account
   */
  async openSavingsAccount(
    childId: string,
    accountType: SavingsAccountType,
    accountName: string,
    staff: User,
    options?: {
      interestRate?: number;
      savingsGoal?: { amount: number; description: string; targetDate?: Date };
    },
  ): Promise<ChildSavingsAccount> {
    // Check for existing active account
    const existing = await this.savingsAccountRepo.findOne({
      where: { childId, status: 'ACTIVE', accountType },
    });
    if (existing) {
      throw new BadRequestException(
        `Child ${childId} already has an active ${accountType} account`,
      );
    }

    const account = new ChildSavingsAccount();
    account.childId = childId;
    account.accountType = accountType;
    account.accountName = accountName;
    account.openAccount(staff);

    if (options?.interestRate) {
      account.interestRate = options.interestRate;
    }

    if (options?.savingsGoal) {
      account.setSavingsGoal(
        options.savingsGoal.amount,
        options.savingsGoal.description,
        options.savingsGoal.targetDate,
      );
    }

    return await this.savingsAccountRepo.save(account);
  }

  /**
   * Deposit to savings account
   */
  async depositToSavings(
    accountId: string,
    amount: number,
    description: string,
    staff: User,
    linkedPocketMoneyTransactionId?: string,
  ): Promise<ChildSavingsTransaction> {
    const account = await this.savingsAccountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    // Create transaction
    const transaction = new ChildSavingsTransaction();
    transaction.accountId = accountId;
    transaction.childId = account.childId;
    transaction.transactionType = SavingsTransactionType.DEPOSIT;
    transaction.amount = amount;
    transaction.description = description;
    transaction.transactionDate = new Date();
    transaction.balanceBefore = account.currentBalance;
    transaction.balanceAfter = account.currentBalance + amount;
    if (linkedPocketMoneyTransactionId) {
      transaction.linkedPocketMoneyTransactionId = linkedPocketMoneyTransactionId;
    }
    transaction.createdBy = staff.username || staff.email;

    // Update account
    account.deposit(amount, SavingsTransactionType.DEPOSIT, description, staff);

    await this.savingsAccountRepo.save(account);
    return await this.savingsTransactionRepo.save(transaction);
  }

  /**
   * Request withdrawal from savings
   */
  async requestSavingsWithdrawal(
    accountId: string,
    amount: number,
    purpose: string,
    staff: User,
  ): Promise<ChildSavingsTransaction> {
    const account = await this.savingsAccountRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    // Request withdrawal (checks balance and high-value threshold)
    const { requiresManagerApproval } = account.requestWithdrawal(amount, purpose, staff);

    // Create transaction
    const transaction = new ChildSavingsTransaction();
    transaction.accountId = accountId;
    transaction.childId = account.childId;
    transaction.transactionType = SavingsTransactionType.WITHDRAWAL;
    transaction.amount = amount;
    transaction.description = purpose;
    transaction.transactionDate = new Date();
    transaction.balanceBefore = account.currentBalance;
    transaction.balanceAfter = account.currentBalance; // Not yet withdrawn
    transaction.withdrawalStatus = WithdrawalStatus.PENDING;
    transaction.requestedByStaffId = staff.id;
    transaction.requiresManagerApproval = requiresManagerApproval;
    transaction.createdBy = staff.username || staff.email;

    await this.savingsAccountRepo.save(account);
    return await this.savingsTransactionRepo.save(transaction);
  }

  /**
   * Approve savings withdrawal
   */
  async approveSavingsWithdrawal(
    transactionId: string,
    approver: User,
    notes?: string,
  ): Promise<ChildSavingsTransaction> {
    const transaction = await this.savingsTransactionRepo.findOne({
      where: { id: transactionId },
      relations: ['account'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }

    const account = await this.savingsAccountRepo.findOne({
      where: { id: transaction.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${transaction.accountId} not found`);
    }

    // Approve and withdraw
    account.approveWithdrawal(transaction.amount, approver);
    transaction.withdrawalStatus = WithdrawalStatus.COMPLETED;
    transaction.approvedByStaffId = approver.id;
    transaction.approvedAt = new Date();
    if (notes) transaction.approvalNotes = notes;
    transaction.balanceAfter = account.currentBalance;
    transaction.disbursedAt = new Date();
    transaction.disbursedByStaffId = approver.id;
    transaction.updatedBy = approver.username || approver.email;

    await this.savingsAccountRepo.save(account);
    return await this.savingsTransactionRepo.save(transaction);
  }

  /**
   * Apply monthly interest to all active accounts
   */
  async applyMonthlyInterest(staff: User): Promise<number> {
    const accounts = await this.savingsAccountRepo.find({
      where: { status: 'ACTIVE', interestRate: MoreThan(0) },
    });

    let totalInterest = 0;

    for (const account of accounts) {
      const interest = account.calculateMonthlyInterest();
      if (interest > 0) {
        account.applyInterest(staff);
        await this.savingsAccountRepo.save(account);

        // Create interest transaction
        const transaction = new ChildSavingsTransaction();
        transaction.accountId = account.id;
        transaction.childId = account.childId;
        transaction.transactionType = SavingsTransactionType.INTEREST;
        transaction.amount = interest;
        transaction.description = `Monthly interest (${account.interestRate}% p.a.)`;
        transaction.transactionDate = new Date();
        transaction.balanceBefore = account.currentBalance - interest;
        transaction.balanceAfter = account.currentBalance;
        transaction.createdBy = staff.username || staff.email;
        await this.savingsTransactionRepo.save(transaction);

        totalInterest += interest;
      }
    }

    return totalInterest;
  }

  /**
   * Get savings account for child
   */
  async getSavingsAccount(
    childId: string,
    accountType?: SavingsAccountType,
  ): Promise<ChildSavingsAccount | null> {
    const where: any = { childId, status: 'ACTIVE' };
    if (accountType) where.accountType = accountType;

    return await this.savingsAccountRepo.findOne({ where });
  }

  /**
   * Get savings transactions
   */
  async getSavingsTransactions(
    accountId: string,
    options?: {
      transactionType?: SavingsTransactionType;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<ChildSavingsTransaction[]> {
    const where: any = { accountId };

    if (options?.transactionType) where.transactionType = options.transactionType;
    if (options?.startDate && options?.endDate) {
      where.transactionDate = Between(options.startDate, options.endDate);
    }

    return await this.savingsTransactionRepo.find({
      where,
      order: { transactionDate: 'DESC' },
    });
  }

  // ==================== REPORTS & ANALYTICS ====================

  /**
   * Get quarterly allowance summary
   */
  async getQuarterlySummary(
    childId: string,
    year: number,
    quarter: number,
  ): Promise<{
    pocketMoney: { disbursed: number; refused: number; withheld: number; deferred: number };
    allowances: { total: number; byCategory: Record<string, number> };
    savings: { deposits: number; withdrawals: number; balance: number };
  }> {
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    const quarterEnd = new Date(year, quarter * 3, 0);

    // Pocket money
    const pocketMoneyTransactions = await this.pocketMoneyRepo.find({
      where: {
        childId,
        year,
        weekNumber: Between(
          Math.floor((quarterStart.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
          Math.floor((quarterEnd.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1,
        ),
      },
    });

    const pocketMoney = {
      disbursed: pocketMoneyTransactions
        .filter((t) => t.status === DisbursementStatus.DISBURSED)
        .reduce((sum, t) => sum + Number(t.disbursedAmount || 0), 0),
      refused: pocketMoneyTransactions.filter((t) => t.wasRefused).length,
      withheld: pocketMoneyTransactions.filter((t) => t.wasWithheld).length,
      deferred: pocketMoneyTransactions.filter((t) => t.wasDeferred).length,
    };

    // Allowances
    const allowanceExpenditures = await this.allowanceRepo.find({
      where: {
        childId,
        year,
        quarter,
        approvalStatus: ApprovalStatus.APPROVED,
      },
    });

    const allowances = {
      total: allowanceExpenditures.reduce((sum, exp) => sum + Number(exp.amount), 0),
      byCategory: allowanceExpenditures.reduce((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>),
    };

    // Savings
    const savingsAccount = await this.getSavingsAccount(childId);
    const savingsTransactions = await this.savingsTransactionRepo.find({
      where: {
        childId,
        transactionDate: Between(quarterStart, quarterEnd),
      },
    });

    const savings = {
      deposits: savingsTransactions
        .filter((t) => t.transactionType === SavingsTransactionType.DEPOSIT)
        .reduce((sum, t) => sum + Number(t.amount), 0),
      withdrawals: savingsTransactions
        .filter((t) => t.transactionType === SavingsTransactionType.WITHDRAWAL)
        .reduce((sum, t) => sum + Number(t.amount), 0),
      balance: savingsAccount ? Number(savingsAccount.currentBalance) : 0,
    };

    return { pocketMoney, allowances, savings };
  }

  /**
   * Get IRO dashboard (items requiring attention)
   */
  async getIRODashboard(): Promise<{
    pendingApprovals: AllowanceExpenditure[];
    missingReceipts: AllowanceExpenditure[];
    budgetOverruns: AllowanceExpenditure[];
    pendingWithdrawals: ChildSavingsTransaction[];
    varianceAlerts: PocketMoneyTransaction[];
  }> {
    const pendingApprovals = await this.allowanceRepo.find({
      where: { approvalStatus: In([ApprovalStatus.PENDING, ApprovalStatus.ESCALATED]) },
      take: 50,
    });

    const missingReceipts = await this.allowanceRepo.find({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        receiptStatus: In([ReceiptStatus.PENDING, ReceiptStatus.REJECTED]),
      },
      take: 50,
    });

    const budgetOverruns = await this.allowanceRepo.find({
      where: { exceedsBudget: true },
      take: 50,
    });

    const pendingWithdrawals = await this.savingsTransactionRepo.find({
      where: {
        transactionType: SavingsTransactionType.WITHDRAWAL,
        withdrawalStatus: WithdrawalStatus.PENDING,
      },
      take: 50,
    });

    const varianceAlerts = await this.pocketMoneyRepo.find({
      where: { hasVariance: true },
      take: 50,
    });

    return {
      pendingApprovals,
      missingReceipts,
      budgetOverruns,
      pendingWithdrawals,
      varianceAlerts,
    };
  }

  /**
   * Get British Isles pocket money rates
   */
  getPocketMoneyRates(jurisdiction: BritishIslesJurisdiction): typeof POCKET_MONEY_RATES[BritishIslesJurisdiction] {
    return POCKET_MONEY_RATES[jurisdiction];
  }

  /**
   * Get budget vs actual analysis
   */
  async getBudgetVsActual(
    childId: string,
    year: number,
  ): Promise<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }[]> {
    const categories = ['CLOTHING', 'EDUCATION', 'BIRTHDAY', 'FESTIVAL', 'HOBBIES', 'PERSONAL_CARE', 'OTHER'];
    const results = [];

    for (const category of categories) {
      const expenditures = await this.allowanceRepo.find({
        where: {
          childId,
          category,
          year,
          approvalStatus: ApprovalStatus.APPROVED,
        },
      });

      const spent = expenditures.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const budget = expenditures.length > 0 ? Number(expenditures[0].budgetAmount || 0) : 0;
      const remaining = budget - spent;
      const percentageUsed = budget > 0 ? (spent / budget) * 100 : 0;

      results.push({ category, budget, spent, remaining, percentageUsed });
    }

    return results;
  }
}
