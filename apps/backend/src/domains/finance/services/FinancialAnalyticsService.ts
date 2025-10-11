import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PayrollRun } from '../entities/PayrollRun';
import { Payslip } from '../entities/Payslip';
import { Invoice } from '../entities/Invoice';
import { Payment } from '../entities/Payment';
import { Expense } from '../entities/Expense';
import { Budget } from '../entities/Budget';

export interface FinancialMetrics {
  revenue: {
    total: number;
    monthly: number;
    quarterly: number;
    yearly: number;
    growth: number;
  };
  expenses: {
    total: number;
    payroll: number;
    operational: number;
    overhead: number;
    growth: number;
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
    ebitda: number;
  };
  cashFlow: {
    operating: number;
    investing: number;
    financing: number;
    net: number;
  };
  payroll: {
    totalCost: number;
    averageSalary: number;
    employeeCount: number;
    costPerEmployee: number;
    overtimeCost: number;
    benefitsCost: number;
  };
}

export interface BudgetAnalysis {
  category: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePercentage: number;
  status: 'over' | 'under' | 'on_track';
}

export interface PayrollTrends {
  period: string;
  totalCost: number;
  employeeCount: number;
  averageSalary: number;
  overtimePercentage: number;
  taxRate: number;
  niRate: number;
}

@Injectable()
export class FinancialAnalyticsService {
  constructor(
    @InjectRepository(PayrollRun)
    privatepayrollRunRepository: Repository<PayrollRun>,
    @InjectRepository(Payslip)
    privatepayslipRepository: Repository<Payslip>,
    @InjectRepository(Invoice)
    privateinvoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    privatepaymentRepository: Repository<Payment>,
    @InjectRepository(Expense)
    privateexpenseRepository: Repository<Expense>,
    @InjectRepository(Budget)
    privatebudgetRepository: Repository<Budget>,
  ) {}

  /**
   * Get comprehensive financial metrics
   */
  async getFinancialMetrics(startDate: Date, endDate: Date): Promise<FinancialMetrics> {
    const [revenue, expenses, payroll] = await Promise.all([
      this.calculateRevenue(startDate, endDate),
      this.calculateExpenses(startDate, endDate),
      this.calculatePayrollMetrics(startDate, endDate),
    ]);

    const profitability = this.calculateProfitability(revenue, expenses);
    const cashFlow = await this.calculateCashFlow(startDate, endDate);

    return {
      revenue,
      expenses,
      profitability,
      cashFlow,
      payroll,
    };
  }

  /**
   * Calculate revenue metrics
   */
  private async calculateRevenue(startDate: Date, endDate: Date): Promise<any> {
    const invoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getMany();

    const total = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    // Calculate monthly revenue
    const monthlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate);
      const now = new Date();
      return invoiceDate.getMonth() === now.getMonth() && 
             invoiceDate.getFullYear() === now.getFullYear();
    });
    const monthly = monthlyInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    // Calculate quarterly revenue
    const quarterStart = new Date(startDate);
    quarterStart.setMonth(Math.floor(quarterStart.getMonth() / 3) * 3);
    const quarterlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate);
      return invoiceDate >= quarterStart && invoiceDate <= endDate;
    });
    const quarterly = quarterlyInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    // Calculate yearly revenue
    const yearlyInvoices = invoices.filter(invoice => {
      const invoiceDate = new Date(invoice.invoiceDate);
      return invoiceDate.getFullYear() === startDate.getFullYear();
    });
    const yearly = yearlyInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);

    // Calculate growth (compared to previous period)
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

    const previousInvoices = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceDate BETWEEN :startDate AND :endDate', { 
        startDate: previousPeriodStart, 
        endDate: previousPeriodEnd 
      })
      .andWhere('invoice.status = :status', { status: 'paid' })
      .getMany();

    const previousTotal = previousInvoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return {
      total,
      monthly,
      quarterly,
      yearly,
      growth,
    };
  }

  /**
   * Calculate expense metrics
   */
  private async calculateExpenses(startDate: Date, endDate: Date): Promise<any> {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.expenseDate BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Categorize expenses
    const payroll = expenses
      .filter(e => e.category === 'payroll')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const operational = expenses
      .filter(e => e.category === 'operational')
      .reduce((sum, expense) => sum + expense.amount, 0);

    const overhead = expenses
      .filter(e => e.category === 'overhead')
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate growth
    const previousPeriodStart = new Date(startDate);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 1);
    const previousPeriodEnd = new Date(startDate);
    previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);

    const previousExpenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.expenseDate BETWEEN :startDate AND :endDate', { 
        startDate: previousPeriodStart, 
        endDate: previousPeriodEnd 
      })
      .getMany();

    const previousTotal = previousExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const growth = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    return {
      total,
      payroll,
      operational,
      overhead,
      growth,
    };
  }

  /**
   * Calculate payroll metrics
   */
  private async calculatePayrollMetrics(startDate: Date, endDate: Date): Promise<any> {
    const payrollRuns = await this.payrollRunRepository
      .createQueryBuilder('payrollRun')
      .where('payrollRun.payPeriodStart BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('payrollRun.status = :status', { status: 'completed' })
      .getMany();

    const totalCost = payrollRuns.reduce((sum, run) => sum + run.totalGrossPay, 0);
    const employeeCount = payrollRuns.reduce((sum, run) => sum + run.employeeCount, 0);
    const averageSalary = employeeCount > 0 ? totalCost / employeeCount : 0;
    const costPerEmployee = employeeCount > 0 ? totalCost / employeeCount : 0;

    // Calculate overtime and benefits costs
    const payslips = await this.payslipRepository
      .createQueryBuilder('payslip')
      .leftJoin('payslip.payrollRun', 'payrollRun')
      .where('payrollRun.payPeriodStart BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getMany();

    const overtimeCost = payslips.reduce((sum, payslip) => sum + payslip.overtimePay, 0);
    const benefitsCost = payslips.reduce((sum, payslip) => sum + payslip.allowances, 0);

    return {
      totalCost,
      averageSalary,
      employeeCount,
      costPerEmployee,
      overtimeCost,
      benefitsCost,
    };
  }

  /**
   * Calculate profitability metrics
   */
  private calculateProfitability(revenue: any, expenses: any): any {
    const grossProfit = revenue.total - expenses.operational;
    const netProfit = revenue.total - expenses.total;
    const profitMargin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;
    const ebitda = netProfit + expenses.overhead; // Simplified EBITDA calculation

    return {
      grossProfit,
      netProfit,
      profitMargin,
      ebitda,
    };
  }

  /**
   * Calculate cash flow metrics
   */
  private async calculateCashFlow(startDate: Date, endDate: Date): Promise<any> {
    const [payments, expenses] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .where('payment.paymentDate BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany(),
      this.expenseRepository
        .createQueryBuilder('expense')
        .where('expense.expenseDate BETWEEN :startDate AND :endDate', { startDate, endDate })
        .getMany(),
    ]);

    const operating = payments.reduce((sum, payment) => sum + payment.amount, 0) - 
                     expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const investing = 0; // Placeholder for investment activities
    const financing = 0; // Placeholder for financing activities
    const net = operating + investing + financing;

    return {
      operating,
      investing,
      financing,
      net,
    };
  }

  /**
   * Get budget analysis
   */
  async getBudgetAnalysis(period: string): Promise<BudgetAnalysis[]> {
    const budgets = await this.budgetRepository
      .createQueryBuilder('budget')
      .where('budget.period = :period', { period })
      .getMany();

    constanalysis: BudgetAnalysis[] = [];

    for (const budget of budgets) {
      const actual = await this.getActualSpending(budget.category, budget.period);
      const variance = actual - budget.amount;
      const variancePercentage = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;
      
      letstatus: 'over' | 'under' | 'on_track' = 'on_track';
      if (variancePercentage > 10) status = 'over';
      else if (variancePercentage < -10) status = 'under';

      analysis.push({
        category: budget.category,
        budgeted: budget.amount,
        actual,
        variance,
        variancePercentage,
        status,
      });
    }

    return analysis;
  }

  /**
   * Get payroll trends
   */
  async getPayrollTrends(months: number = 12): Promise<PayrollTrends[]> {
    consttrends: PayrollTrends[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    for (let i = 0; i < months; i++) {
      const periodStart = new Date(startDate);
      periodStart.setMonth(periodStart.getMonth() + i);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);

      const payrollRuns = await this.payrollRunRepository
        .createQueryBuilder('payrollRun')
        .where('payrollRun.payPeriodStart BETWEEN :startDate AND :endDate', { 
          startDate: periodStart, 
          endDate: periodEnd 
        })
        .andWhere('payrollRun.status = :status', { status: 'completed' })
        .getMany();

      const totalCost = payrollRuns.reduce((sum, run) => sum + run.totalGrossPay, 0);
      const employeeCount = payrollRuns.reduce((sum, run) => sum + run.employeeCount, 0);
      const averageSalary = employeeCount > 0 ? totalCost / employeeCount : 0;
      const overtimePercentage = 0; // Calculate from payslips
      const taxRate = totalCost > 0 ? (payrollRuns.reduce((sum, run) => sum + run.totalTax, 0) / totalCost) * 100 : 0;
      const niRate = totalCost > 0 ? (payrollRuns.reduce((sum, run) => sum + run.totalNationalInsurance, 0) / totalCost) * 100 : 0;

      trends.push({
        period: periodStart.toISOString().slice(0, 7), // YYYY-MM format
        totalCost,
        employeeCount,
        averageSalary,
        overtimePercentage,
        taxRate,
        niRate,
      });
    }

    return trends;
  }

  /**
   * Get actual spending for a category and period
   */
  private async getActualSpending(category: string, period: string): Promise<number> {
    const expenses = await this.expenseRepository
      .createQueryBuilder('expense')
      .where('expense.category = :category', { category })
      .andWhere('expense.period = :period', { period })
      .getMany();

    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(startDate: Date, endDate: Date): Promise<any> {
    const [metrics, budgetAnalysis, payrollTrends] = await Promise.all([
      this.getFinancialMetrics(startDate, endDate),
      this.getBudgetAnalysis(endDate.toISOString().slice(0, 7)),
      this.getPayrollTrends(12),
    ]);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      metrics,
      budgetAnalysis,
      payrollTrends,
      generatedAt: new Date(),
    };
  }
}

export default FinancialAnalyticsService;
