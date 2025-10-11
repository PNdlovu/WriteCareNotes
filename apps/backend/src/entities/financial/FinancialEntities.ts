/**
 * @fileoverview Financial Entities for WriteCareNotes
 * @module FinancialEntities
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description TypeScript entity definitions for financial domain objects
 * with comprehensive healthcare compliance and audit requirements.
 */

import {
  Currency,
  PaymentMethod,
  BillingStatus,
  PaymentStatus,
  ClaimStatus,
  ReportType,
  BillLineItem
} from '@/services/financial/interfaces/FinancialInterfaces';

/**
 * Resident Bill Entity
 */
export interface ResidentBill {
  id: string;
  billNumber: string;
  residentId: string;
  careHomeId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: Currency;
  status: BillingStatus;
  description: string;
  lineItems: BillLineItem[];
  paymentTerms: number; // Days
  notes?: string;
  encryptedBankDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  correlationId: string;
}

/**
 * Payment Entity
 */
export interface Payment {
  id: string;
  paymentReference: string;
  billId?: string;
  residentId: string;
  careHomeId: string;
  amount: number;
  processingFee: number;
  netAmount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  paymentDate: Date;
  description: string;
  notes?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  encryptedPaymentDetails?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  correlationId: string;
}

/**
 * Insurance Claim Entity
 */
export interface InsuranceClaim {
  id: string;
  claimNumber: string;
  residentId: string;
  careHomeId: string;
  insuranceProvider: string;
  policyNumber: string;
  claimType: string;
  claimAmount: number;
  deductible: number;
  netClaimAmount: number;
  currency: Currency;
  status: ClaimStatus;
  incidentDate: Date;
  submissionDate: Date;
  approvalDate?: Date;
  paymentDate?: Date;
  description: string;
  supportingDocuments: string[];
  notes?: string;
  providerResponse?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
  updatedBy?: string;
  correlationId: string;
}

/**
 * Financial Account Entity
 */
export interface FinancialAccount {
  id: string;
  careHomeId: string;
  accountName: string;
  accountType: 'current' | 'savings' | 'credit' | 'loan' | 'investment';
  accountNumber?: string;
  sortCode?: string;
  bankName?: string;
  iban?: string;
  swiftCode?: string;
  currency: Currency;
  currentBalance: number;
  availableBalance: number;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
}

/**
 * Transaction Entity
 */
export interface Transaction {
  id: string;
  accountId: string;
  transactionReference: string;
  transactionType: 'debit' | 'credit';
  amount: number;
  currency: Currency;
  description: string;
  category: string;
  transactionDate: Date;
  valueDate: Date;
  balanceAfter: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  referenceNumber?: string;
  counterpartyName?: string;
  counterpartyAccount?: string;
  notes?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
  correlationId: string;
}

/**
 * Recurring Billing Entity
 */
export interface RecurringBilling {
  id: string;
  residentId: string;
  careHomeId: string;
  billingName: string;
  amount: number;
  currency: Currency;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  endDate?: Date;
  nextBillingDate: Date;
  lastBillingDate?: Date;
  description: string;
  lineItems: BillLineItem[];
  paymentTerms: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
}

/**
 * Financial Report Entity
 */
export interface FinancialReport {
  id: string;
  reportType: ReportType;
  careHomeId: string;
  startDate: Date;
  endDate: Date;
  generatedDate: Date;
  data: Record<string, any>;
  format: 'json' | 'pdf' | 'excel' | 'csv';
  parameters: Record<string, any>;
  filePath?: string;
  fileSize?: number;
  createdBy: string;
  correlationId: string;
}

/**
 * Insurance Coverage Entity
 */
export interface InsuranceCoverage {
  id: string;
  residentId: string;
  provider: string;
  policyNumber: string;
  policyType: string;
  coverageAmount: number;
  deductible: number;
  currency: Currency;
  startDate: Date;
  expiryDate: Date;
  isActive: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
}

/**
 * Expense Entity
 */
export interface Expense {
  id: string;
  careHomeId: string;
  expenseNumber: string;
  category: string;
  subcategory?: string;
  amount: number;
  currency: Currency;
  expenseDate: Date;
  description: string;
  supplierName?: string;
  supplierReference?: string;
  paymentMethod?: PaymentMethod;
  paymentDate?: Date;
  receiptNumber?: string;
  vatAmount: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected' | 'cancelled';
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  notes?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
  correlationId: string;
}

/**
 * Financial Summary Entity (for reporting)
 */
export interface FinancialSummary {
  careHomeId: string;
  period: {
    start: Date;
    end: Date;
  };
  revenue: {
    total: number;
    byCategory: Record<string, number>;
    growth: number; // Percentage
  };
  expenses: {
    total: number;
    byCategory: Record<string, number>;
    growth: number; // Percentage
  };
  profit: {
    gross: number;
    net: number;
    margin: number; // Percentage
  };
  cashFlow: {
    inflow: number;
    outflow: number;
    net: number;
  };
  outstandingBills: {
    count: number;
    totalAmount: number;
    overdue: {
      count: number;
      totalAmount: number;
    };
  };
  insuranceClaims: {
    pending: {
      count: number;
      totalAmount: number;
    };
    approved: {
      count: number;
      totalAmount: number;
    };
    rejected: {
      count: number;
      totalAmount: number;
    };
  };
  generatedAt: Date;
  correlationId: string;
}

/**
 * Budget Entity
 */
export interface Budget {
  id: string;
  careHomeId: string;
  budgetName: string;
  budgetType: 'annual' | 'quarterly' | 'monthly' | 'project';
  financialYear: string;
  startDate: Date;
  endDate: Date;
  totalBudgetedRevenue: number;
  totalBudgetedExpenses: number;
  totalActualRevenue: number;
  totalActualExpenses: number;
  currency: Currency;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  categories: BudgetCategory[];
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy: string;
}

/**
 * Budget Category Entity
 */
export interface BudgetCategory {
  id: string;
  budgetId: string;
  categoryName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  subcategories: BudgetSubcategory[];
}

/**
 * Budget Subcategory Entity
 */
export interface BudgetSubcategory {
  id: string;
  categoryId: string;
  subcategoryName: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
}

/**
 * Tax Calculation Entity
 */
export interface TaxCalculation {
  id: string;
  careHomeId: string;
  taxYear: number;
  taxType: 'vat' | 'income_tax' | 'national_insurance' | 'corporation_tax';
  taxableAmount: number;
  taxRate: number;
  taxOwed: number;
  allowances: number;
  netTaxOwed: number;
  dueDate: Date;
  status: 'calculated' | 'filed' | 'paid' | 'overdue';
  calculatedAt: Date;
  filedAt?: Date;
  paidAt?: Date;
  createdBy: string;
  correlationId: string;
}

/**
 * Financial Forecast Entity
 */
export interface FinancialForecast {
  id: string;
  careHomeId: string;
  forecastType: 'revenue' | 'expenses' | 'cash_flow' | 'occupancy' | 'profitability';
  forecastPeriod: number; // Months
  baselineData: Record<string, number>;
  forecastData: ForecastDataPoint[];
  confidence: number; // 0-1 scale
  methodology: string;
  assumptions: string[];
  generatedAt: Date;
  validUntil: Date;
  createdBy: string;
  correlationId: string;
}

/**
 * Forecast Data Point Entity
 */
export interface ForecastDataPoint {
  period: Date;
  value: number;
  confidence: number;
  factors: Record<string, number>;
}

/**
 * Financial Alert Entity
 */
export interface FinancialAlert {
  id: string;
  careHomeId: string;
  alertType: 'budget_variance' | 'cash_flow' | 'overdue_bills' | 'expense_threshold' | 'revenue_decline';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  threshold: number;
  currentValue: number;
  variance: number;
  isActive: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  correlationId: string;
}

/**
 * Bank Reconciliation Entity
 */
export interface BankReconciliation {
  id: string;
  accountId: string;
  reconciliationDate: Date;
  statementBalance: number;
  bookBalance: number;
  difference: number;
  status: 'pending' | 'reconciled' | 'discrepancy';
  unmatchedTransactions: string[]; // Transaction IDs
  adjustments: ReconciliationAdjustment[];
  reconciledBy?: string;
  reconciledAt?: Date;
  notes?: string;
  createdAt: Date;
  correlationId: string;
}

/**
 * Reconciliation Adjustment Entity
 */
export interface ReconciliationAdjustment {
  id: string;
  reconciliationId: string;
  adjustmentType: 'bank_charge' | 'interest' | 'error_correction' | 'outstanding_check' | 'deposit_in_transit';
  amount: number;
  description: string;
  reference?: string;
}

/**
 * Financial KPI Entity
 */
export interface FinancialKPI {
  id: string;
  careHomeId: string;
  kpiName: string;
  kpiType: 'revenue_per_resident' | 'occupancy_rate' | 'cost_per_resident' | 'profit_margin' | 'cash_ratio';
  currentValue: number;
  targetValue: number;
  previousValue: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  period: Date;
  unit: string;
  calculatedAt: Date;
  correlationId: string;
}