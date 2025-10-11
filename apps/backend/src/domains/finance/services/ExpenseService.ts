import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Expense, ExpenseStatus, ExpenseCategory, ExpenseType } from '../entities/Expense';
import { StaffMember } from '../../staff/entities/StaffMember';

export interface ExpenseData {
  staffMemberId: string;
  description: string;
  category: ExpenseCategory;
  type: ExpenseType;
  amount: number;
  currency: string;
  expenseDate: Date;
  vendor?: string;
  location?: string;
  isReimbursable: boolean;
  projectCode?: string;
  costCenter?: string;
  notes?: string;
  receiptUrl?: string;
  attachmentUrl?: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  category?: ExpenseCategory;
  type?: ExpenseType;
  staffMemberId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isOverdue?: boolean;
  isReimbursable?: boolean;
}

export interface ExpenseApprovalData {
  approvedBy: string;
  notes?: string;
}

export interface ExpenseRejectionData {
  rejectedBy: string;
  reason: string;
}

@Injectable()
export class ExpenseService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(StaffMember)
    private staffMemberRepository: Repository<StaffMember>,
  ) {}

  /**
   * Create a new expense
   */
  async createExpense(data: ExpenseData, createdBy: string): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...data,
      expenseNumber: this.generateExpenseNumber(),
      status: ExpenseStatus.DRAFT,
      submissionDate: new Date(),
      createdBy,
      updatedBy: createdBy,
    });

    return await this.expenseRepository.save(expense);
  }

  /**
   * Submit expense for approval
   */
  async submitExpense(expenseId: string, submittedBy: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (!expense.canBeSubmitted()) {
      throw new Error('Expense cannot be submitted in current status');
    }

    expense.submit();
    expense.updatedBy = submittedBy;

    return await this.expenseRepository.save(expense);
  }

  /**
   * Approve expense
   */
  async approveExpense(expenseId: string, approvalData: ExpenseApprovalData): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (!expense.canBeApproved()) {
      throw new Error('Expense cannot be approved in current status');
    }

    expense.approve(approvalData.approvedBy);
    if (approvalData.notes) {
      expense.notes = expense.notes ? `${expense.notes}\nApproval: ${approvalData.notes}` : `Approval: ${approvalData.notes}`;
    }
    expense.updatedBy = approvalData.approvedBy;

    return await this.expenseRepository.save(expense);
  }

  /**
   * Reject expense
   */
  async rejectExpense(expenseId: string, rejectionData: ExpenseRejectionData): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (!expense.canBeRejected()) {
      throw new Error('Expense cannot be rejected in current status');
    }

    expense.reject(rejectionData.reason, rejectionData.rejectedBy);
    expense.updatedBy = rejectionData.rejectedBy;

    return await this.expenseRepository.save(expense);
  }

  /**
   * Pay approved expense
   */
  async payExpense(expenseId: string, paidBy: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (!expense.canBePaid()) {
      throw new Error('Expense cannot be paid in current status');
    }

    expense.pay(paidBy);
    expense.updatedBy = paidBy;

    return await this.expenseRepository.save(expense);
  }

  /**
   * Get expense by ID
   */
  async getExpense(expenseId: string): Promise<Expense | null> {
    return await this.expenseRepository.findOne({
      where: { id: expenseId },
      relations: ['staffMember'],
    });
  }

  /**
   * Get expenses with filters
   */
  async getExpenses(filters: ExpenseFilters = {}, limit: number = 50, offset: number = 0): Promise<Expense[]> {
    const query = this.expenseRepository.createQueryBuilder('expense')
      .leftJoinAndSelect('expense.staffMember', 'staffMember');

    if (filters.status) {
      query.andWhere('expense.status = :status', { status: filters.status });
    }

    if (filters.category) {
      query.andWhere('expense.category = :category', { category: filters.category });
    }

    if (filters.type) {
      query.andWhere('expense.type = :type', { type: filters.type });
    }

    if (filters.staffMemberId) {
      query.andWhere('expense.staffMemberId = :staffMemberId', { staffMemberId: filters.staffMemberId });
    }

    if (filters.startDate) {
      query.andWhere('expense.expenseDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('expense.expenseDate <= :endDate', { endDate: filters.endDate });
    }

    if (filters.minAmount) {
      query.andWhere('expense.amount >= :minAmount', { minAmount: filters.minAmount });
    }

    if (filters.maxAmount) {
      query.andWhere('expense.amount <= :maxAmount', { maxAmount: filters.maxAmount });
    }

    if (filters.isOverdue) {
      query.andWhere('expense.submissionDate < :thirtyDaysAgo', { 
        thirtyDaysAgo: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
      });
      query.andWhere('expense.status = :submittedStatus', { submittedStatus: ExpenseStatus.SUBMITTED });
    }

    if (filters.isReimbursable !== undefined) {
      query.andWhere('expense.isReimbursable = :isReimbursable', { isReimbursable: filters.isReimbursable });
    }

    return await query
      .orderBy('expense.submissionDate', 'DESC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  /**
   * Get expenses by staff member
   */
  async getExpensesByStaffMember(staffMemberId: string, limit: number = 50, offset: number = 0): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: { staffMemberId },
      relations: ['staffMember'],
      order: { submissionDate: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get pending expenses for approval
   */
  async getPendingExpenses(limit: number = 50, offset: number = 0): Promise<Expense[]> {
    return await this.expenseRepository.find({
      where: { status: ExpenseStatus.SUBMITTED },
      relations: ['staffMember'],
      order: { submissionDate: 'ASC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get overdue expenses
   */
  async getOverdueExpenses(): Promise<Expense[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    return await this.expenseRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.staffMember', 'staffMember')
      .where('expense.status = :status', { status: ExpenseStatus.SUBMITTED })
      .andWhere('expense.submissionDate < :thirtyDaysAgo', { thirtyDaysAgo })
      .orderBy('expense.submissionDate', 'ASC')
      .getMany();
  }

  /**
   * Get expense statistics
   */
  async getExpenseStatistics(period: 'month' | 'quarter' | 'year'): Promise<any> {
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

    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.submissionDate BETWEEN :startDate AND :endDate', { 
        startDate, 
        endDate: now 
      })
      .getMany();

    const stats = {
      totalExpenses: expenses.length,
      totalAmount: expenses.reduce((sum, expense) => sum + expense.amount, 0),
      reimbursedAmount: expenses.reduce((sum, expense) => sum + expense.reimbursedAmount, 0),
      pendingAmount: expenses
        .filter(expense => expense.status === ExpenseStatus.SUBMITTED)
        .reduce((sum, expense) => sum + expense.amount, 0),
      approvedAmount: expenses
        .filter(expense => expense.status === ExpenseStatus.APPROVED)
        .reduce((sum, expense) => sum + expense.amount, 0),
      paidAmount: expenses
        .filter(expense => expense.status === ExpenseStatus.PAID)
        .reduce((sum, expense) => sum + expense.amount, 0),
      rejectedAmount: expenses
        .filter(expense => expense.status === ExpenseStatus.REJECTED)
        .reduce((sum, expense) => sum + expense.amount, 0),
      averageExpenseValue: expenses.length > 0 ? 
        expenses.reduce((sum, expense) => sum + expense.amount, 0) / expenses.length : 0,
      categoryBreakdown: {},
      statusBreakdown: {},
    };

    // Calculate category breakdown
    expenses.forEach(expense => {
      const category = expense.category;
      if (!stats.categoryBreakdown[category]) {
        stats.categoryBreakdown[category] = { count: 0, amount: 0 };
      }
      stats.categoryBreakdown[category].count++;
      stats.categoryBreakdown[category].amount += expense.amount;
    });

    // Calculate status breakdown
    expenses.forEach(expense => {
      const status = expense.status;
      if (!stats.statusBreakdown[status]) {
        stats.statusBreakdown[status] = { count: 0, amount: 0 };
      }
      stats.statusBreakdown[status].count++;
      stats.statusBreakdown[status].amount += expense.amount;
    });

    return stats;
  }

  /**
   * Get expense approval workflow statistics
   */
  async getApprovalWorkflowStatistics(): Promise<any> {
    const pendingExpenses = await this.getPendingExpenses(1000, 0);
    const overdueExpenses = await this.getOverdueExpenses();

    return {
      pendingCount: pendingExpenses.length,
      pendingAmount: pendingExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      overdueCount: overdueExpenses.length,
      overdueAmount: overdueExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      averageProcessingTime: this.calculateAverageProcessingTime(pendingExpenses),
    };
  }

  /**
   * Cancel expense
   */
  async cancelExpense(expenseId: string, cancelledBy: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (!expense.canBeCancelled()) {
      throw new Error('Expense cannot be cancelled in current status');
    }

    expense.cancel();
    expense.updatedBy = cancelledBy;

    return await this.expenseRepository.save(expense);
  }

  // Helper methods
  private generateExpenseNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `EXP${year}${month}${random}`;
  }

  private calculateAverageProcessingTime(expenses: Expense[]): number {
    if (expenses.length === 0) return 0;

    const totalTime = expenses.reduce((sum, expense) => {
      const processingTime = Date.now() - expense.submissionDate.getTime();
      return sum + processingTime;
    }, 0);

    return totalTime / expenses.length / (1000 * 60 * 60 * 24); // Convert to days
  }
}

export default ExpenseService;