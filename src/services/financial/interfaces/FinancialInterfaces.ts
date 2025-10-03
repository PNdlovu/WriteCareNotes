/**
 * @fileoverview Financial Service Interfaces for WriteCareNotes
 * @module FinancialInterfaces
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description TypeScript interfaces and types for financial service operations
 * with comprehensive healthcare compliance and audit requirements.
 */

/**
 * Enums for Financial Operations
 */

export enum Currency {
  GBP = 'GBP',
  EUR = 'EUR',
  USD = 'USD'
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIRECT_DEBIT = 'direct_debit',
  CHEQUE = 'cheque',
  BACS = 'bacs',
  FASTER_PAYMENTS = 'faster_payments'
}

export enum BillingStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  SENT = 'sent',
  PARTIALLY_PAID = 'partially_paid',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum ClaimStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export enum TaxType {
  VAT = 'vat',
  INCOME_TAX = 'income_tax',
  NATIONAL_INSURANCE = 'national_insurance',
  CORPORATION_TAX = 'corporation_tax'
}

export enum ReportType {
  PROFIT_AND_LOSS = 'profit_and_loss',
  BALANCE_SHEET = 'balance_sheet',
  CASH_FLOW = 'cash_flow',
  AGED_DEBTORS = 'aged_debtors',
  BUDGET_VARIANCE = 'budget_variance',
  TAX_SUMMARY = 'tax_summary'
}

/**
 * Request Interfaces
 */

export interface CreateResidentBillRequest {
  residentId: string;
  careHomeId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  amount: number;
  currency?: Currency;
  description: string;
  lineItems: BillLineItem[];
  includeVat?: boolean;
  paymentTerms?: number; // Days
  notes?: string;
  bankDetails?: BankDetails;
}

export interface BillLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  sortCode: string;
  bankName: string;
  iban?: string;
  swiftCode?: string;
}

export interface ProcessPaymentRequest {
  billId?: string;
  residentId: string;
  careHomeId: string;
  amount: number;
  currency?: Currency;
  paymentMethod: PaymentMethod;
  description: string;
  notes?: string;
  paymentDetails?: PaymentDetails;
}

export interface PaymentDetails {
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
  bankAccount?: BankDetails;
  reference?: string;
}

export interface CreateInsuranceClaimRequest {
  residentId: string;
  careHomeId: string;
  insuranceProvider: string;
  policyNumber: string;
  claimType: string;
  claimAmount: number;
  deductible?: number;
  currency?: Currency;
  incidentDate: Date;
  description: string;
  supportingDocuments?: string[];
  notes?: string;
}

export interface RecurringBillingSetupRequest {
  residentId: string;
  careHomeId: string;
  amount: number;
  currency?: Currency;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: Date;
  endDate?: Date;
  description: string;
  lineItems: BillLineItem[];
  paymentTerms?: number;
}

export interface TaxCalculationRequest {
  careHomeId: string;
  taxYear: number;
  taxType: TaxType;
  income?: number;
  expenses?: number;
  allowances?: number;
}

export interface FinancialReportRequest {
  reportType: ReportType;
  careHomeId: string;
  startDate: Date;
  endDate: Date;
  format?: 'json' | 'pdf' | 'excel' | 'csv';
  parameters?: Record<string, any>;
}

/**
 * Response Interfaces
 */

export interface FinancialMetrics {
  period: 'month' | 'quarter' | 'year';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  outstandingBills: {
    count: number;
    totalAmount: number;
  };
  paidBills: {
    count: number;
    totalAmount: number;
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
  };
  generatedAt: Date;
  correlationId: string;
}

export interface PaymentGatewayResult {
  success: boolean;
  transactionId?: string;
  response?: any;
  error?: string;
}

export interface InsuranceEligibility {
  eligible: boolean;
  reason?: string;
  coverageDetails?: {
    provider: string;
    policyNumber: string;
    expiryDate: Date;
    coverageAmount: number;
    deductible: number;
  };
}

export interface TaxCalculationResult {
  taxType: TaxType;
  taxableAmount: number;
  taxRate: number;
  taxOwed: number;
  allowances: number;
  netTaxOwed: number;
  dueDate: Date;
  calculatedAt: Date;
}

/**
 * Filter and Query Interfaces
 */

export interface BillQueryFilters {
  residentId?: string;
  careHomeId?: string;
  status?: BillingStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  isOverdue?: boolean;
  page?: number;
  limit?: number;
}

export interface PaymentQueryFilters {
  residentId?: string;
  careHomeId?: string;
  billId?: string;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface ClaimQueryFilters {
  residentId?: string;
  careHomeId?: string;
  insuranceProvider?: string;
  status?: ClaimStatus;
  claimType?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

/**
 * Audit and Compliance Interfaces
 */

export interface FinancialAuditEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  changes?: {
    before?: any;
    after?: any;
  };
  complianceFlags: string[];
  correlationId: string;
}

export interface ComplianceReport {
  reportType: string;
  period: {
    start: Date;
    end: Date;
  };
  violations: ComplianceViolation[];
  summary: {
    totalTransactions: number;
    flaggedTransactions: number;
    complianceScore: number;
  };
  generatedAt: Date;
}

export interface ComplianceViolation {
  violationType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  entityType: string;
  entityId: string;
  detectedAt: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

/**
 * Integration Interfaces
 */

export interface BankingIntegration {
  bankName: string;
  accountNumber: string;
  balance: number;
  lastSyncAt: Date;
  transactions: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  balance: number;
  reference?: string;
  matched: boolean;
  matchedPaymentId?: string;
}

export interface InsuranceProviderIntegration {
  provider: string;
  apiEndpoint: string;
  credentials: {
    apiKey: string;
    secretKey: string;
  };
  lastSyncAt: Date;
  status: 'active' | 'inactive' | 'error';
}

/**
 * Notification Interfaces
 */

export interface PaymentNotification {
  type: 'payment_confirmation' | 'payment_failed' | 'payment_reminder';
  recipientId: string;
  paymentId?: string;
  billId?: string;
  amount: number;
  currency: Currency;
  message: string;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
}

export interface BillingNotification {
  type: 'bill_generated' | 'bill_overdue' | 'bill_paid';
  recipientId: string;
  billId: string;
  amount: number;
  currency: Currency;
  dueDate?: Date;
  message: string;
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
}

/**
 * Configuration Interfaces
 */

export interface FinancialConfiguration {
  defaultCurrency: Currency;
  vatRate: number;
  paymentTerms: number; // Default payment terms in days
  overdueThreshold: number; // Days after due date to mark as overdue
  processingFees: {
    [key in PaymentMethod]: {
      type: 'percentage' | 'fixed';
      amount: number;
    };
  };
  bankingIntegration: {
    enabled: boolean;
    providers: string[];
    syncFrequency: number; // Minutes
  };
  complianceSettings: {
    auditRetentionPeriod: number; // Days
    requireApprovalThreshold: number; // Amount requiring approval
    fraudDetectionEnabled: boolean;
  };
}

/**
 * Error Interfaces
 */

export interface FinancialError {
  code: string;
  message: string;
  details?: any;
  correlationId?: string;
  timestamp: Date;
}

export interface ValidationError extends FinancialError {
  field?: string;
  value?: any;
  constraint?: string;
}

export interface ProcessingError extends FinancialError {
  gatewayError?: string;
  retryable: boolean;
  retryAfter?: number;
}