import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial Analytics Service Interfaces for WriteCareNotes
 * @module FinancialAnalyticsInterfaces
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive interface definitions for the Financial Analytics Service
 * with healthcare compliance and enterprise-grade features.
 */

import { Decimal } from 'decimal.js';
import { FinancialTransaction, TransactionCategory, TransactionStatus, Currency } from '@/entities/financial/FinancialTransaction';
import { Budget, BudgetStatus, BudgetType } from '@/entities/financial/Budget';
import { Forecast } from '@/entities/financial/Forecast';
import { FinancialKPI } from '@/entities/financial/FinancialKPI';

/**
 * Main Financial Analytics Service Interface
 */
export interface FinancialAnalyticsServiceInterface {
  // Transaction Management
  createTransaction(request: CreateTransactionRequest, userId: string, correlationId: string): Promise<FinancialTransactionResult>;
  updateTransaction(id: string, request: UpdateTransactionRequest, userId: string, correlationId: string): Promise<FinancialTransactionResult>;
  getTransaction(id: string, userId: string, correlationId: string): Promise<FinancialTransactionResult>;
  getTransactions(params: TransactionQueryParams, userId: string, correlationId: string): Promise<FinancialTransactionResult[]>;
  deleteTransaction(id: string, userId: string, correlationId: string): Promise<void>;
  
  // Budget Management
  createBudget(request: BudgetCreationRequest, userId: string, correlationId: string): Promise<BudgetResult>;
  updateBudget(id: string, request: BudgetUpdateRequest, userId: string, correlationId: string): Promise<BudgetResult>;
  getBudget(id: string, userId: string, correlationId: string): Promise<BudgetResult>;
  getBudgets(params: BudgetQueryParams, userId: string, correlationId: string): Promise<BudgetResult[]>;
  
  // Forecasting
  generateForecast(request: ForecastRequest, userId: string, correlationId: string): Promise<ForecastResult>;
  updateForecast(id: string, request: ForecastUpdateRequest, userId: string, correlationId: string): Promise<ForecastResult>;
  getForecast(id: string, userId: string, correlationId: string): Promise<ForecastResult>;
  
  // Analytics
  generateAnalytics(request: AnalyticsRequest, userId: string, correlationId: string): Promise<AnalyticsResult>;
  getKPIs(params: KPIQueryParams, userId: string, correlationId: string): Promise<FinancialKPI[]>;
  
  // Reporting
  generateReport(request: ReportGenerationRequest, userId: string, correlationId: string): Promise<ReportResult>;
  getReports(params: ReportQueryParams, userId: string, correlationId: string): Promise<ReportResult[]>;
}

/**
 * Transaction Request Interfaces
 */
export interface CreateTransactionRequest {
  accountId: string;
  amount: Decimal;
  currency: Currency;
  description: string;
  category: TransactionCategory;
  reference?: string;
  paymentMethod?: string;
  costCenter?: string;
  residentId?: string;
  departmentId?: string;
  transactionDate: Date;
  metadata?: Record<string, any>;
  vatAmount?: Decimal;
  vatRate?: Decimal;
  regulatoryCode?: string;
  taxCode?: string;
}

export interface UpdateTransactionRequest {
  amount?: Decimal;
  description?: string;
  category?: TransactionCategory;
  reference?: string;
  paymentMethod?: string;
  costCenter?: string;
  residentId?: string;
  departmentId?: string;
  metadata?: Record<string, any>;
  vatAmount?: Decimal;
  vatRate?: Decimal;
  status?: TransactionStatus;
}

export interface TransactionQueryParams {
  accountId?: string;
  category?: TransactionCategory;
  status?: TransactionStatus;
  dateFrom?: Date;
  dateTo?: Date;
  amountMin?: Decimal;
  amountMax?: Decimal;
  residentId?: string;
  departmentId?: string;
  costCenter?: string;
  isReconciled?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Budget Request Interfaces
 */
export interface BudgetCreationRequest {
  budgetName: string;
  budgetType: BudgetType;
  description?: string;
  financialYear: string;
  startDate: Date;
  endDate: Date;
  currency: Currency;
  totalBudgetedRevenue: Decimal;
  totalBudgetedExpenses: Decimal;
  careHomeId?: string;
  departmentId?: string;
  budgetedOccupancy?: number;
  categories: BudgetCategoryRequest[];
}

export interface BudgetUpdateRequest {
  budgetName?: string;
  description?: string;
  totalBudgetedRevenue?: Decimal;
  totalBudgetedExpenses?: Decimal;
  budgetedOccupancy?: number;
  status?: BudgetStatus;
  categories?: BudgetCategoryRequest[];
}

export interface BudgetCategoryRequest {
  categoryName: string;
  budgetedAmount: Decimal;
  monthlyBreakdown?: MonthlyBudgetRequest[];
}

export interface MonthlyBudgetRequest {
  month: number;
  budgetedAmount: Decimal;
}

export interface BudgetQueryParams {
  budgetType?: BudgetType;
  status?: BudgetStatus;
  financialYear?: string;
  careHomeId?: string;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Forecasting Interfaces
 */
export interface ForecastRequest {
  forecastType: ForecastType;
  entityType: EntityType;
  entityId?: string;
  periodMonths: number;
  lookbackMonths?: number;
  confidence?: number;
  methodology?: ForecastMethodology;
  dataTypes: DataType[];
  externalFactors?: ExternalFactor[];
}

export interface ForecastUpdateRequest {
  confidence?: number;
  methodology?: ForecastMethodology;
  externalFactors?: ExternalFactor[];
  status?: ForecastStatus;
}

export enum ForecastType {
  REVENUE = 'revenue',
  EXPENSES = 'expenses',
  CASH_FLOW = 'cash_flow',
  OCCUPANCY = 'occupancy',
  PROFITABILITY = 'profitability'
}

export enum EntityType {
  CARE_HOME = 'care_home',
  DEPARTMENT = 'department',
  RESIDENT = 'resident',
  SERVICE = 'service'
}

export enum ForecastMethodology {
  LINEAR_REGRESSION = 'linear_regression',
  ARIMA = 'arima',
  NEURAL_NETWORK = 'neural_network',
  ENSEMBLE = 'ensemble',
  SEASONAL_DECOMPOSITION = 'seasonal_decomposition'
}

export enum DataType {
  FINANCIAL_TRANSACTIONS = 'financial_transactions',
  OCCUPANCY_DATA = 'occupancy_data',
  STAFF_COSTS = 'staff_costs',
  UTILITY_COSTS = 'utility_costs',
  MEDICATION_COSTS = 'medication_costs'
}

export enum ForecastStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export interface ExternalFactor {
  factorType: string;
  impact: number;
  confidence: number;
  description: string;
}

/**
 * Analytics Interfaces
 */
export interface AnalyticsRequest {
  analysisType: AnalysisType;
  entityType: EntityType;
  entityId?: string;
  dateFrom: Date;
  dateTo: Date;
  metrics: MetricType[];
  groupBy?: GroupByType[];
  filters?: AnalyticsFilter[];
}

export enum AnalysisType {
  PROFITABILITY = 'profitability',
  COST_CENTER = 'cost_center',
  VARIANCE = 'variance',
  TREND = 'trend',
  BENCHMARK = 'benchmark',
  CASH_FLOW = 'cash_flow'
}

export enum MetricType {
  REVENUE = 'revenue',
  EXPENSES = 'expenses',
  PROFIT = 'profit',
  MARGIN = 'margin',
  ROI = 'roi',
  OCCUPANCY = 'occupancy',
  COST_PER_RESIDENT = 'cost_per_resident'
}

export enum GroupByType {
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  DEPARTMENT = 'department',
  COST_CENTER = 'cost_center',
  CATEGORY = 'category'
}

export interface AnalyticsFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in'
}

export interface KPIQueryParams {
  kpiType?: KPIType;
  entityType?: EntityType;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  frequency?: KPIFrequency;
}

export enum KPIType {
  REVENUE_GROWTH = 'revenue_growth',
  PROFIT_MARGIN = 'profit_margin',
  OCCUPANCY_RATE = 'occupancy_rate',
  COST_PER_BED = 'cost_per_bed',
  CASH_FLOW_RATIO = 'cash_flow_ratio',
  BUDGET_VARIANCE = 'budget_variance'
}

export enum KPIFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

/**
 * Reporting Interfaces
 */
export interface ReportGenerationRequest {
  reportType: ReportType;
  format: ReportFormat;
  entityType: EntityType;
  entityId?: string;
  dateFrom: Date;
  dateTo: Date;
  includeCharts?: boolean;
  includeDetails?: boolean;
  customFields?: string[];
  filters?: ReportFilter[];
}

export enum ReportType {
  PROFIT_AND_LOSS = 'profit_and_loss',
  BALANCE_SHEET = 'balance_sheet',
  CASH_FLOW = 'cash_flow',
  BUDGET_VARIANCE = 'budget_variance',
  COST_CENTER = 'cost_center',
  REGULATORY_COMPLIANCE = 'regulatory_compliance',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

export interface ReportFilter {
  field: string;
  value: any;
  operator: FilterOperator;
}

export interface ReportQueryParams {
  reportType?: ReportType;
  format?: ReportFormat;
  entityType?: EntityType;
  entityId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

/**
 * Response Interfaces
 */
export interface FinancialTransactionResult {
  success: boolean;
  transaction?: FinancialTransaction;
  error?: string;
  correlationId: string;
  responseTime?: number;
}

export interface BudgetResult {
  success: boolean;
  budget?: Budget;
  error?: string;
  correlationId: string;
  responseTime?: number;
}

export interface ForecastResult {
  success: boolean;
  forecast?: Forecast;
  error?: string;
  correlationId: string;
  confidence?: number;
  methodology?: string;
  responseTime?: number;
}

export interface AnalyticsResult {
  success: boolean;
  data?: AnalyticsData;
  error?: string;
  correlationId: string;
  responseTime?: number;
}

export interface AnalyticsData {
  metrics: MetricResult[];
  trends: TrendResult[];
  comparisons: ComparisonResult[];
  insights: InsightResult[];
}

export interface MetricResult {
  metric: MetricType;
  value: number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  trend: TrendDirection;
}

export interface TrendResult {
  metric: MetricType;
  period: string;
  values: number[];
  trend: TrendDirection;
  correlation?: number;
}

export interface ComparisonResult {
  metric: MetricType;
  currentValue: number;
  benchmarkValue: number;
  variance: number;
  variancePercentage: number;
}

export interface InsightResult {
  type: InsightType;
  title: string;
  description: string;
  impact: ImpactLevel;
  recommendations: string[];
}

export enum TrendDirection {
  UP = 'up',
  DOWN = 'down',
  STABLE = 'stable'
}

export enum InsightType {
  COST_OPTIMIZATION = 'cost_optimization',
  REVENUE_OPPORTUNITY = 'revenue_opportunity',
  RISK_ALERT = 'risk_alert',
  PERFORMANCE_IMPROVEMENT = 'performance_improvement'
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ReportResult {
  success: boolean;
  report?: GeneratedReport;
  error?: string;
  correlationId: string;
  responseTime?: number;
}

export interface GeneratedReport {
  id: string;
  reportType: ReportType;
  format: ReportFormat;
  fileName: string;
  fileSize: number;
  downloadUrl: string;
  generatedAt: Date;
  expiresAt: Date;
  metadata: ReportMetadata;
}

export interface ReportMetadata {
  entityType: EntityType;
  entityId?: string;
  dateFrom: Date;
  dateTo: Date;
  recordCount: number;
  totalPages?: number;
  generatedBy: string;
}

/**
 * Additional Supporting Interfaces
 */
export interface FinancialMetrics {
  totalRevenue: Decimal;
  totalExpenses: Decimal;
  netIncome: Decimal;
  grossProfit: Decimal;
  profitMargin: number;
  occupancyRate?: number;
  revenuePerBed?: Decimal;
  costPerResident?: Decimal;
}

export interface CashFlowProjection {
  period: string;
  openingBalance: Decimal;
  inflows: CashInflow[];
  outflows: CashOutflow[];
  netCashFlow: Decimal;
  closingBalance: Decimal;
}

export interface CashInflow {
  source: string;
  amount: Decimal;
  probability: number;
  timing: Date;
}

export interface CashOutflow {
  category: string;
  amount: Decimal;
  priority: Priority;
  timing: Date;
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface BenchmarkData {
  metric: string;
  industryAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  currentValue: number;
  percentile: number;
}

export interface ComplianceMetrics {
  cqcCompliance: boolean;
  hmrcCompliance: boolean;
  gdprCompliance: boolean;
  auditReadiness: number;
  lastAuditDate?: Date;
  nextAuditDue?: Date;
}