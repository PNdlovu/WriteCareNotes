import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Expense Service for WriteCareNotes
 * @module ExpenseService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive expense management service with healthcare expense features,
 * approval workflows, and compliance reporting for care home operations.
 * 
 * @compliance
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - HMRC (Her Majesty's Revenue and Customs) regulations
 * - NHS Digital standards for healthcare expense management
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like, IsNull, Not } from 'typeorm';
import { Decimal } from 'decimal.js';
import * as dayjs from 'dayjs';

import { Expense, ExpenseStatus, ExpenseCategory, ExpenseType, ReimbursementStatus } from '@/entities/financial/Expense';
import { ChartOfAccounts } from '@/entities/financial/ChartOfAccounts';
import { FinancialTransaction } from '@/entities/financial/FinancialTransaction';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger as appLogger } from '@/utils/logger';

export interface CreateExpenseRequest {
  category: ExpenseCategory;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: Date;
  description: string;
  detailedDescription?: string;
  supplier?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  departmentId?: string;
  location?: string;
  projectCode?: string;
  reimbursementStatus?: ReimbursementStatus;
  isVATApplicable?: boolean;
  vatNumber?: string;
  costCenter?: string;
  budgetId?: string;
  budgetedAmount?: number;
  receiptUrl?: string;
  invoiceUrl?: string;
  supportingDocuments?: string;
  createdBy: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  detailedDescription?: string;
  supplier?: string;
  invoiceNumber?: string;
  receiptNumber?: string;
  location?: string;
  projectCode?: string;
  isVATApplicable?: boolean;
  vatNumber?: string;
  costCenter?: string;
  budgetId?: string;
  budgetedAmount?: number;
  receiptUrl?: string;
  invoiceUrl?: string;
  supportingDocuments?: string;
  updatedBy: string;
}

export interface SubmitExpenseRequest {
  expenseId: string;
  submittedBy: string;
  notes?: string;
}

export interface ApproveExpenseRequest {
  expenseId: string;
  approvedBy: string;
  notes?: string;
}

export interface RejectExpenseRequest {
  expenseId: string;
  rejectedBy: string;
  reason: string;
}

export interface ProcessReimbursementRequest {
  expenseId: string;
  amount: number;
  reimbursedBy: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus[];
  category?: ExpenseCategory[];
  expenseType?: ExpenseType[];
  reimbursementStatus?: ReimbursementStatus[];
  departmentId?: string;
  projectCode?: string;
  costCenter?: string;
  budgetId?: string;
  submittedBy?: string;
  approvedBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  isVATApplicable?: boolean;
  isReimbursable?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ExpenseListResponse {
  expenses: Expense[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalAmount: string;
    reimbursedAmount: string;
    outstandingAmount: string;
    vatAmount: string;
    averageAmount: string;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  };
}

@Injectable()
export class ExpenseService {
  private readonly logger = new Logger(ExpenseService.name);

  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(ChartOfAccounts)
    private chartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(FinancialTransaction)
    private financialTransactionRepository: Repository<FinancialTransaction>,
  ) {}

  /**
   * Create a new expense
   */
  async createExpense(request: CreateExpenseRequest): Promise<Expense> {
    this.logger.log(`Creating expense for ${request.category}`);
    
    try {
      // Validate request
      this.validateCreateExpenseRequest(request);

      // Get default account for expense category
      const account = await this.getAccountForExpenseCategory(request.category);
      if (!account) {
        throw new Error(`No account found for expense category: ${request.category}`);
      }

      // Create expense
      const expense = this.expenseRepository.create({
        category: request.category,
        expenseType: request.expenseType,
        amount: new Decimal(request.amount),
        expenseDate: request.expenseDate,
        description: request.description,
        detailedDescription: request.detailedDescription,
        supplier: request.supplier,
        invoiceNumber: request.invoiceNumber,
        receiptNumber: request.receiptNumber,
        departmentId: request.departmentId,
        location: request.location,
        projectCode: request.projectCode,
        reimbursementStatus: request.reimbursementStatus || ReimbursementStatus.NOT_APPLICABLE,
        isVATApplicable: request.isVATApplicable || false,
        vatNumber: request.vatNumber,
        costCenter: request.costCenter,
        budgetId: request.budgetId,
        budgetedAmount: request.budgetedAmount ? new Decimal(request.budgetedAmount) : null,
        receiptUrl: request.receiptUrl,
        invoiceUrl: request.invoiceUrl,
        supportingDocuments: request.supportingDocuments,
        accountId: account.id,
        createdBy: request.createdBy,
        status: ExpenseStatus.DRAFT,
        currency: 'GBP',
        isBudgeted: !!request.budgetId,
      });

      const savedExpense = await this.expenseRepository.save(expense);

      // Create financial transaction
      await this.createFinancialTransaction(savedExpense);

      this.logger.log(`Expense created successfully: ${savedExpense.id}`);
      return savedExpense;

    } catch (error) {
      this.logger.error(`Failed to create expense: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update an existing expense
   */
  async updateExpense(expenseId: string, request: UpdateExpenseRequest): Promise<Expense> {
    this.logger.log(`Updating expense: ${expenseId}`);
    
    try {
      const expense = await this.getExpenseById(expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      if (expense.status !== ExpenseStatus.DRAFT) {
        throw new Error('Only draft expenses can be updated');
      }

      // Update fields
      if (request.description !== undefined) expense.description = request.description;
      if (request.detailedDescription !== undefined) expense.detailedDescription = request.detailedDescription;
      if (request.supplier !== undefined) expense.supplier = request.supplier;
      if (request.invoiceNumber !== undefined) expense.invoiceNumber = request.invoiceNumber;
      if (request.receiptNumber !== undefined) expense.receiptNumber = request.receiptNumber;
      if (request.location !== undefined) expense.location = request.location;
      if (request.projectCode !== undefined) expense.projectCode = request.projectCode;
      if (request.isVATApplicable !== undefined) expense.isVATApplicable = request.isVATApplicable;
      if (request.vatNumber !== undefined) expense.vatNumber = request.vatNumber;
      if (request.costCenter !== undefined) expense.costCenter = request.costCenter;
      if (request.budgetId !== undefined) expense.budgetId = request.budgetId;
      if (request.budgetedAmount !== undefined) expense.budgetedAmount = new Decimal(request.budgetedAmount);
      if (request.receiptUrl !== undefined) expense.receiptUrl = request.receiptUrl;
      if (request.invoiceUrl !== undefined) expense.invoiceUrl = request.invoiceUrl;
      if (request.supportingDocuments !== undefined) expense.supportingDocuments = request.supportingDocuments;

      expense.updatedBy = request.updatedBy;

      const updatedExpense = await this.expenseRepository.save(expense);

      this.logger.log(`Expense updated successfully: ${expenseId}`);
      return updatedExpense;

    } catch (error) {
      this.logger.error(`Failed to update expense: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Submit expense for approval
   */
  async submitExpense(request: SubmitExpenseRequest): Promise<Expense> {
    this.logger.log(`Submitting expense for approval: ${request.expenseId}`);
    
    try {
      const expense = await this.getExpenseById(request.expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      if (expense.status !== ExpenseStatus.DRAFT) {
        throw new Error('Only draft expenses can be submitted');
      }

      expense.submit(request.submittedBy);
      if (request.notes) {
        expense.notes = expense.notes ? `${expense.notes}\nSubmission notes: ${request.notes}` : `Submission notes: ${request.notes}`;
      }

      const updatedExpense = await this.expenseRepository.save(expense);

      this.logger.log(`Expense submitted successfully: ${request.expenseId}`);
      return updatedExpense;

    } catch (error) {
      this.logger.error(`Failed to submit expense: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Approve expense
   */
  async approveExpense(request: ApproveExpenseRequest): Promise<Expense> {
    this.logger.log(`Approving expense: ${request.expenseId}`);
    
    try {
      const expense = await this.getExpenseById(request.expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      if (expense.status !== ExpenseStatus.SUBMITTED && expense.status !== ExpenseStatus.PENDING_APPROVAL) {
        throw new Error('Only submitted or pending expenses can be approved');
      }

      expense.approve(request.approvedBy, request.notes);

      const updatedExpense = await this.expenseRepository.save(expense);

      this.logger.log(`Expense approved successfully: ${request.expenseId}`);
      return updatedExpense;

    } catch (error) {
      this.logger.error(`Failed to approve expense: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reject expense
   */
  async rejectExpense(request: RejectExpenseRequest): Promise<Expense> {
    this.logger.log(`Rejecting expense: ${request.expenseId}`);
    
    try {
      const expense = await this.getExpenseById(request.expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      if (expense.status !== ExpenseStatus.SUBMITTED && expense.status !== ExpenseStatus.PENDING_APPROVAL) {
        throw new Error('Only submitted or pending expenses can be rejected');
      }

      expense.reject(request.rejectedBy, request.reason);

      const updatedExpense = await this.expenseRepository.save(expense);

      this.logger.log(`Expense rejected successfully: ${request.expenseId}`);
      return updatedExpense;

    } catch (error) {
      this.logger.error(`Failed to reject expense: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process reimbursement for expense
   */
  async processReimbursement(request: ProcessReimbursementRequest): Promise<Expense> {
    this.logger.log(`Processing reimbursement for expense: ${request.expenseId}`);
    
    try {
      const expense = await this.getExpenseById(request.expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      if (!expense.isReimbursable()) {
        throw new Error('Expense is not reimbursable');
      }

      if (expense.status !== ExpenseStatus.APPROVED) {
        throw new Error('Only approved expenses can be reimbursed');
      }

      const reimbursementAmount = new Decimal(request.amount);
      if (reimbursementAmount.lessThanOrEqualTo(0)) {
        throw new Error('Reimbursement amount must be positive');
      }

      if (reimbursementAmount.greaterThan(expense.getRemainingReimbursableAmount())) {
        throw new Error('Reimbursement amount cannot exceed remaining reimbursable amount');
      }

      expense.processReimbursement(reimbursementAmount, request.reimbursedBy);

      const updatedExpense = await this.expenseRepository.save(expense);

      // Create reimbursement transaction
      await this.createReimbursementTransaction(updatedExpense, reimbursementAmount);

      this.logger.log(`Reimbursement processed successfully: ${request.expenseId}`);
      return updatedExpense;

    } catch (error) {
      this.logger.error(`Failed to process reimbursement: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get expense by ID
   */
  async getExpenseById(expenseId: string): Promise<Expense | null> {
    return await this.expenseRepository.findOne({
      where: { id: expenseId },
      relations: ['account'],
    });
  }

  /**
   * List expenses with filters and pagination
   */
  async listExpenses(filters: ExpenseFilters = {}): Promise<ExpenseListResponse> {
    this.logger.log('Listing expenses with filters');
    
    try {
      const query = this.expenseRepository.createQueryBuilder('expense')
        .leftJoinAndSelect('expense.account', 'account');

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query.andWhere('expense.status IN (:...status)', { status: filters.status });
      }

      if (filters.category && filters.category.length > 0) {
        query.andWhere('expense.category IN (:...category)', { category: filters.category });
      }

      if (filters.expenseType && filters.expenseType.length > 0) {
        query.andWhere('expense.expenseType IN (:...expenseType)', { expenseType: filters.expenseType });
      }

      if (filters.reimbursementStatus && filters.reimbursementStatus.length > 0) {
        query.andWhere('expense.reimbursementStatus IN (:...reimbursementStatus)', { reimbursementStatus: filters.reimbursementStatus });
      }

      if (filters.departmentId) {
        query.andWhere('expense.departmentId = :departmentId', { departmentId: filters.departmentId });
      }

      if (filters.projectCode) {
        query.andWhere('expense.projectCode = :projectCode', { projectCode: filters.projectCode });
      }

      if (filters.costCenter) {
        query.andWhere('expense.costCenter = :costCenter', { costCenter: filters.costCenter });
      }

      if (filters.budgetId) {
        query.andWhere('expense.budgetId = :budgetId', { budgetId: filters.budgetId });
      }

      if (filters.submittedBy) {
        query.andWhere('expense.submittedBy = :submittedBy', { submittedBy: filters.submittedBy });
      }

      if (filters.approvedBy) {
        query.andWhere('expense.approvedBy = :approvedBy', { approvedBy: filters.approvedBy });
      }

      if (filters.dateFrom) {
        query.andWhere('expense.expenseDate >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters.dateTo) {
        query.andWhere('expense.expenseDate <= :dateTo', { dateTo: filters.dateTo });
      }

      if (filters.amountFrom) {
        query.andWhere('expense.amount >= :amountFrom', { amountFrom: filters.amountFrom });
      }

      if (filters.amountTo) {
        query.andWhere('expense.amount <= :amountTo', { amountTo: filters.amountTo });
      }

      if (filters.isVATApplicable !== undefined) {
        query.andWhere('expense.isVATApplicable = :isVATApplicable', { isVATApplicable: filters.isVATApplicable });
      }

      if (filters.isReimbursable !== undefined) {
        if (filters.isReimbursable) {
          query.andWhere('expense.reimbursementStatus != :notApplicable', { notApplicable: ReimbursementStatus.NOT_APPLICABLE });
        } else {
          query.andWhere('expense.reimbursementStatus = :notApplicable', { notApplicable: ReimbursementStatus.NOT_APPLICABLE });
        }
      }

      if (filters.search) {
        query.andWhere(
          '(expense.expenseNumber ILIKE :search OR expense.description ILIKE :search OR expense.supplier ILIKE :search OR expense.invoiceNumber ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'expenseDate';
      const sortOrder = filters.sortOrder || 'DESC';
      query.orderBy(`expense.${sortBy}`, sortOrder);

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      query.skip(offset).take(limit);

      const [expenses, total] = await query.getManyAndCount();

      // Calculate summary
      const summary = await this.calculateExpenseSummary(filters);

      return {
        expenses,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary,
      };

    } catch (error) {
      this.logger.error(`Failed to list expenses: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get expense statistics
   */
  async getExpenseStatistics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    totalExpenses: number;
    totalAmount: string;
    reimbursedAmount: string;
    outstandingAmount: string;
    vatAmount: string;
    averageAmount: string;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    categoryBreakdown: Record<string, string>;
  }> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const expenses = await this.expenseRepository.find({
      where: {
        expenseDate: Between(startDate, now),
      },
    });

    const stats = {
      totalExpenses: expenses.length,
      totalAmount: '0.00',
      reimbursedAmount: '0.00',
      outstandingAmount: '0.00',
      vatAmount: '0.00',
      averageAmount: '0.00',
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      categoryBreakdown: {} as Record<string, string>,
    };

    let totalAmount = new Decimal(0);
    let reimbursedAmount = new Decimal(0);
    let vatAmount = new Decimal(0);
    const categoryTotals: Record<string, Decimal> = {};

    expenses.forEach(expense => {
      totalAmount = totalAmount.plus(expense.totalAmount);
      reimbursedAmount = reimbursedAmount.plus(expense.reimbursedAmount);
      vatAmount = vatAmount.plus(expense.vatAmount);

      // Count by status
      switch (expense.status) {
        case ExpenseStatus.SUBMITTED:
        case ExpenseStatus.PENDING_APPROVAL:
          stats.pendingCount++;
          break;
        case ExpenseStatus.APPROVED:
        case ExpenseStatus.PAID:
          stats.approvedCount++;
          break;
        case ExpenseStatus.REJECTED:
          stats.rejectedCount++;
          break;
      }

      // Category breakdown
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = new Decimal(0);
      }
      categoryTotals[expense.category] = categoryTotals[expense.category].plus(expense.totalAmount);
    });

    const outstandingAmount = totalAmount.minus(reimbursedAmount);

    stats.totalAmount = totalAmount.toFixed(2);
    stats.reimbursedAmount = reimbursedAmount.toFixed(2);
    stats.outstandingAmount = outstandingAmount.toFixed(2);
    stats.vatAmount = vatAmount.toFixed(2);
    stats.averageAmount = expenses.length > 0 ? totalAmount.dividedBy(expenses.length).toFixed(2) : '0.00';

    // Convert category totals to strings
    Object.keys(categoryTotals).forEach(category => {
      stats.categoryBreakdown[category] = categoryTotals[category].toFixed(2);
    });

    return stats;
  }

  /**
   * Validate create expense request
   */
  private validateCreateExpenseRequest(request: CreateExpenseRequest): void {
    if (!request.category) {
      throw new Error('Expense category is required');
    }

    if (!request.expenseType) {
      throw new Error('Expense type is required');
    }

    if (!request.amount || request.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (!request.description || request.description.trim().length === 0) {
      throw new Error('Description is required');
    }

    if (!request.expenseDate) {
      throw new Error('Expense date is required');
    }

    if (request.expenseDate > new Date()) {
      throw new Error('Expense date cannot be in the future');
    }

    if (request.budgetedAmount && request.budgetedAmount <= 0) {
      throw new Error('Budgeted amount must be positive');
    }
  }

  /**
   * Get account for expense category
   */
  private async getAccountForExpenseCategory(category: ExpenseCategory): Promise<ChartOfAccounts | null> {
    const accountMapping = {
      [ExpenseCategory.STAFF_COSTS]: 'EXPENSE-STAFF-COSTS',
      [ExpenseCategory.MEDICATION]: 'EXPENSE-MEDICATION',
      [ExpenseCategory.MEDICAL_SUPPLIES]: 'EXPENSE-MEDICAL-SUPPLIES',
      [ExpenseCategory.UTILITIES]: 'EXPENSE-UTILITIES',
      [ExpenseCategory.MAINTENANCE]: 'EXPENSE-MAINTENANCE',
      [ExpenseCategory.CATERING]: 'EXPENSE-CATERING',
      [ExpenseCategory.CLEANING]: 'EXPENSE-CLEANING',
      [ExpenseCategory.LAUNDRY]: 'EXPENSE-LAUNDRY',
      [ExpenseCategory.TRANSPORT]: 'EXPENSE-TRANSPORT',
      [ExpenseCategory.TRAINING]: 'EXPENSE-TRAINING',
      [ExpenseCategory.PROFESSIONAL_SERVICES]: 'EXPENSE-PROFESSIONAL-SERVICES',
      [ExpenseCategory.INSURANCE]: 'EXPENSE-INSURANCE',
      [ExpenseCategory.REGULATORY_FEES]: 'EXPENSE-REGULATORY-FEES',
      [ExpenseCategory.OFFICE_SUPPLIES]: 'EXPENSE-OFFICE-SUPPLIES',
      [ExpenseCategory.IT_EQUIPMENT]: 'EXPENSE-IT-EQUIPMENT',
      [ExpenseCategory.FURNITURE]: 'EXPENSE-FURNITURE',
      [ExpenseCategory.SECURITY]: 'EXPENSE-SECURITY',
      [ExpenseCategory.GARDENING]: 'EXPENSE-GARDENING',
      [ExpenseCategory.ENTERTAINMENT]: 'EXPENSE-ENTERTAINMENT',
      [ExpenseCategory.OTHER]: 'EXPENSE-OTHER',
    };

    const accountCode = accountMapping[category];
    if (!accountCode) {
      return null;
    }

    return await this.chartOfAccountsRepository.findOne({
      where: { accountCode },
    });
  }

  /**
   * Create financial transaction for expense
   */
  private async createFinancialTransaction(expense: Expense): Promise<void> {
    const transaction = this.financialTransactionRepository.create({
      transactionDate: expense.expenseDate,
      amount: expense.totalAmount.negated(), // Negative amount for expense
      currency: expense.currency,
      description: `Expense ${expense.expenseNumber}: ${expense.description}`,
      category: 'EXPENSE',
      status: 'APPROVED',
      reference: expense.expenseNumber,
      accountId: expense.accountId,
      departmentId: expense.departmentId,
      correlationId: expense.correlationId,
      regulatoryCode: expense.regulatoryCode,
      isVATApplicable: expense.isVATApplicable,
      vatAmount: expense.vatAmount,
      vatRate: expense.vatRate,
      createdBy: expense.createdBy,
    });

    await this.financialTransactionRepository.save(transaction);
  }

  /**
   * Create reimbursement transaction
   */
  private async createReimbursementTransaction(expense: Expense, reimbursementAmount: Decimal): Promise<void> {
    const transaction = this.financialTransactionRepository.create({
      transactionDate: new Date(),
      amount: reimbursementAmount.negated(), // Negative amount for reimbursement
      currency: expense.currency,
      description: `Reimbursement for expense ${expense.expenseNumber}`,
      category: 'EXPENSE',
      status: 'PROCESSED',
      reference: expense.expenseNumber,
      accountId: expense.accountId,
      correlationId: expense.correlationId,
      createdBy: expense.reimbursedBy,
    });

    await this.financialTransactionRepository.save(transaction);
  }

  /**
   * Calculate expense summary
   */
  private async calculateExpenseSummary(filters: ExpenseFilters): Promise<{
    totalAmount: string;
    reimbursedAmount: string;
    outstandingAmount: string;
    vatAmount: string;
    averageAmount: string;
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
  }> {
    const query = this.expenseRepository.createQueryBuilder('expense');

    // Apply same filters as main query
    if (filters.status && filters.status.length > 0) {
      query.andWhere('expense.status IN (:...status)', { status: filters.status });
    }

    if (filters.category && filters.category.length > 0) {
      query.andWhere('expense.category IN (:...category)', { category: filters.category });
    }

    if (filters.expenseType && filters.expenseType.length > 0) {
      query.andWhere('expense.expenseType IN (:...expenseType)', { expenseType: filters.expenseType });
    }

    if (filters.reimbursementStatus && filters.reimbursementStatus.length > 0) {
      query.andWhere('expense.reimbursementStatus IN (:...reimbursementStatus)', { reimbursementStatus: filters.reimbursementStatus });
    }

    if (filters.departmentId) {
      query.andWhere('expense.departmentId = :departmentId', { departmentId: filters.departmentId });
    }

    if (filters.projectCode) {
      query.andWhere('expense.projectCode = :projectCode', { projectCode: filters.projectCode });
    }

    if (filters.costCenter) {
      query.andWhere('expense.costCenter = :costCenter', { costCenter: filters.costCenter });
    }

    if (filters.budgetId) {
      query.andWhere('expense.budgetId = :budgetId', { budgetId: filters.budgetId });
    }

    if (filters.submittedBy) {
      query.andWhere('expense.submittedBy = :submittedBy', { submittedBy: filters.submittedBy });
    }

    if (filters.approvedBy) {
      query.andWhere('expense.approvedBy = :approvedBy', { approvedBy: filters.approvedBy });
    }

    if (filters.dateFrom) {
      query.andWhere('expense.expenseDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('expense.expenseDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.amountFrom) {
      query.andWhere('expense.amount >= :amountFrom', { amountFrom: filters.amountFrom });
    }

    if (filters.amountTo) {
      query.andWhere('expense.amount <= :amountTo', { amountTo: filters.amountTo });
    }

    if (filters.isVATApplicable !== undefined) {
      query.andWhere('expense.isVATApplicable = :isVATApplicable', { isVATApplicable: filters.isVATApplicable });
    }

    if (filters.isReimbursable !== undefined) {
      if (filters.isReimbursable) {
        query.andWhere('expense.reimbursementStatus != :notApplicable', { notApplicable: ReimbursementStatus.NOT_APPLICABLE });
      } else {
        query.andWhere('expense.reimbursementStatus = :notApplicable', { notApplicable: ReimbursementStatus.NOT_APPLICABLE });
      }
    }

    if (filters.search) {
      query.andWhere(
        '(expense.expenseNumber ILIKE :search OR expense.description ILIKE :search OR expense.supplier ILIKE :search OR expense.invoiceNumber ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const expenses = await query.getMany();

    let totalAmount = new Decimal(0);
    let reimbursedAmount = new Decimal(0);
    let vatAmount = new Decimal(0);
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;

    expenses.forEach(expense => {
      totalAmount = totalAmount.plus(expense.totalAmount);
      reimbursedAmount = reimbursedAmount.plus(expense.reimbursedAmount);
      vatAmount = vatAmount.plus(expense.vatAmount);

      // Count by status
      switch (expense.status) {
        case ExpenseStatus.SUBMITTED:
        case ExpenseStatus.PENDING_APPROVAL:
          pendingCount++;
          break;
        case ExpenseStatus.APPROVED:
        case ExpenseStatus.PAID:
          approvedCount++;
          break;
        case ExpenseStatus.REJECTED:
          rejectedCount++;
          break;
      }
    });

    const outstandingAmount = totalAmount.minus(reimbursedAmount);

    return {
      totalAmount: totalAmount.toFixed(2),
      reimbursedAmount: reimbursedAmount.toFixed(2),
      outstandingAmount: outstandingAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      averageAmount: expenses.length > 0 ? totalAmount.dividedBy(expenses.length).toFixed(2) : '0.00',
      pendingCount,
      approvedCount,
      rejectedCount,
    };
  }
}

export default ExpenseService;