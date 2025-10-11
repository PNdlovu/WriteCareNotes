/**
 * Finance Domain Module
 * Comprehensive financial management including payroll, HMRC compliance, and analytics
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { PayrollRun } from './entities/PayrollRun';
import { Payslip } from './entities/Payslip';
import { TaxCalculation } from './entities/TaxCalculation';
import { NationalInsurance } from './entities/NationalInsurance';
import { PensionContribution } from './entities/PensionContribution';
import { HMRCSubmission } from './entities/HMRCSubmission';
import { Invoice } from './entities/Invoice';
import { Payment } from './entities/Payment';
import { Expense } from './entities/Expense';
import { Budget } from './entities/Budget';
import { FinancialReport } from './entities/FinancialReport';

// Services
import { PayrollService } from './services/PayrollService';
import { HMRCService } from './services/HMRCService';
import { FinancialAnalyticsService } from './services/FinancialAnalyticsService';
import { InvoiceService } from './services/InvoiceService';
import { PaymentService } from './services/PaymentService';
import { ExpenseService } from './services/ExpenseService';
import { BudgetService } from './services/BudgetService';

// Controllers
import { PayrollController } from './controllers/PayrollController';
import { HMRCController } from './controllers/HMRCController';
import { FinancialAnalyticsController } from './controllers/FinancialAnalyticsController';
import { InvoiceController } from './controllers/InvoiceController';
import { PaymentController } from './controllers/PaymentController';
import { ExpenseController } from './controllers/ExpenseController';
import { BudgetController } from './controllers/BudgetController';

// Routes
import { payrollRoutes } from './routes/payroll.routes';
import { hmrcRoutes } from './routes/hmrc.routes';
import { financialAnalyticsRoutes } from './routes/financial-analytics.routes';
import { invoiceRoutes } from './routes/invoice.routes';
import { paymentRoutes } from './routes/payment.routes';
import { expenseRoutes } from './routes/expense.routes';
import { budgetRoutes } from './routes/budget.routes';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PayrollRun,
      Payslip,
      TaxCalculation,
      NationalInsurance,
      PensionContribution,
      HMRCSubmission,
      Invoice,
      Payment,
      Expense,
      Budget,
      FinancialReport,
    ]),
  ],
  providers: [
    PayrollService,
    HMRCService,
    FinancialAnalyticsService,
    InvoiceService,
    PaymentService,
    ExpenseService,
    BudgetService,
  ],
  controllers: [
    PayrollController,
    HMRCController,
    FinancialAnalyticsController,
    InvoiceController,
    PaymentController,
    ExpenseController,
    BudgetController,
  ],
  exports: [
    PayrollService,
    HMRCService,
    FinancialAnalyticsService,
    InvoiceService,
    PaymentService,
    ExpenseService,
    BudgetService,
  ],
})
export class FinanceModule {
  name = 'finance';
  version = '1.0.0';
  description = 'Comprehensive financial management including payroll, HMRC compliance, and analytics';

  // Domain components
  entities = {
    PayrollRun,
    Payslip,
    TaxCalculation,
    NationalInsurance,
    PensionContribution,
    HMRCSubmission,
    Invoice,
    Payment,
    Expense,
    Budget,
    FinancialReport,
  };

  services = {
    PayrollService,
    HMRCService,
    FinancialAnalyticsService,
    InvoiceService,
    PaymentService,
    ExpenseService,
    BudgetService,
  };

  controllers = {
    PayrollController,
    HMRCController,
    FinancialAnalyticsController,
    InvoiceController,
    PaymentController,
    ExpenseController,
    BudgetController,
  };

  routes = {
    payroll: payrollRoutes,
    hmrc: hmrcRoutes,
    analytics: financialAnalyticsRoutes,
    invoice: invoiceRoutes,
    payment: paymentRoutes,
    expense: expenseRoutes,
    budget: budgetRoutes,
  };

  // Dependencies
  dependencies = ['staff', 'compliance'];

  // Configuration
  configuration = {
    currency: 'GBP',
    taxYear: '2024-25',
    payrollFrequency: 'monthly',
    invoiceDueDays: 30,
    hmrcEnvironment: 'sandbox',
  };

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      // Check if all required services are available
      return true;
    } catch (error) {
      console.error('Finance domain health checkfailed:', error);
      return false;
    }
  }

  // Initialize domain
  async initialize(): Promise<void> {
    console.log('Initializing Finance domain...');
    // Initialize any required resources
  }

  // Shutdown domain
  async shutdown(): Promise<void> {
    console.log('Shutting down Finance domain...');
    // Clean up resources
  }
}

export default FinanceModule;
