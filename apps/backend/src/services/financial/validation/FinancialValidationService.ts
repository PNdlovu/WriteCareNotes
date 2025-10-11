/**
 * @fileoverview Comprehensive validation service for financial operations
 * @module Financial/Validation/FinancialValidationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive validation service for financial operations
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial Validation Service for WriteCareNotes
 * @module FinancialValidationService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive validation service for financial operations
 * with healthcare compliance and regulatory requirements.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import Joi from 'joi';

import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  BudgetCreationRequest,
  ForecastRequest,
  AnalyticsRequest,
  ReportGenerationRequest,
  ForecastType,
  EntityType,
  ForecastMethodology,
  AnalysisType,
  ReportType,
  ReportFormat
} from '../interfaces/FinancialAnalyticsInterfaces';

import {
  TransactionCategory,
  TransactionStatus,
  Currency,
  PaymentMethod
} from '@/entities/financial/FinancialTransaction';

import { BudgetType, BudgetStatus } from '@/entities/financial/Budget';

import {
  ValidationError,
  TransactionValidationError,
  BudgetValidationError,
  FinancialErrorFactory
} from '../exceptions/FinancialAnalyticsExceptions';

/**
 * Financial Validation Service with healthcare-specific rules
 */

export class FinancialValidationService {
  // Logger removed

  // Validation schemas
  private readonlytransactionSchema: Joi.ObjectSchema;
  private readonlybudgetSchema: Joi.ObjectSchema;
  private readonlyforecastSchema: Joi.ObjectSchema;
  private readonlyanalyticsSchema: Joi.ObjectSchema;
  private readonlyreportSchema: Joi.ObjectSchema;

  const ructor() {
    this.transactionSchema = this.createTransactionSchema();
    this.budgetSchema = this.createBudgetSchema();
    this.forecastSchema = this.createForecastSchema();
    this.analyticsSchema = this.createAnalyticsSchema();
    this.reportSchema = this.createReportSchema();
  }

  /**
   * Validate transaction creation request
   */
  async validateTransactionRequest(
    request: CreateTransactionRequest,
    correlationId?: string
  ): Promise<void> {
    const errors: ValidationError[] = [];

    try {
      // Schema validation
      const { error } = this.transactionSchema.validate(request, { abortEarly: false });
      if (error) {
        errors.push(...this.convertJoiErrors(error));
      }

      // Business rule validation
      await this.validateTransactionBusinessRules(request, errors);

      // Healthcare-specific validation
      await this.validateHealthcareTransactionRules(request, errors);

      // Compliance validation
      await this.validateTransactionCompliance(request, errors);

      if (errors.length > 0) {
        throw FinancialErrorFactory.createTransactionValidationError(
          correlationId || 'unknown',
          errors,
          { requestData: this.sanitizeForLogging(request) }
        );
      }

    } catch (error: unknown) {
      if (error instanceof TransactionValidationError) {
        throw error;
      }
      
      console.error('Transaction validation failed', {
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId
      });
      
      throw new Error(`Transaction validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Validate transaction update request
   */
  async validateTransactionUpdateRequest(
    request: UpdateTransactionRequest,
    correlationId?: string
  ): Promise<void> {
    const errors: ValidationError[] = [];

    // Validate only provided fields
    if (request.amount !== undefined) {
      if (!this.isValidAmount(request.amount)) {
        errors.push({
          field: 'amount',
          message: 'Amount must be a positive decimal value',
          code: 'INVALID_AMOUNT'
        });
      }
    }

    if (request.category !== undefined) {
      if (!Object.values(TransactionCategory).includes(request.category)) {
        errors.push({
          field: 'category',
          message: 'Invalid transaction category',
          code: 'INVALID_CATEGORY'
        });
      }
    }

    if (request.status !== undefined) {
      if (!Object.values(TransactionStatus).includes(request.status)) {
        errors.push({
          field: 'status',
          message: 'Invalid transaction status',
          code: 'INVALID_STATUS'
        });
      }
    }

    if (errors.length > 0) {
      throw FinancialErrorFactory.createTransactionValidationError(
        correlationId || 'unknown',
        errors,
        { requestData: this.sanitizeForLogging(request) }
      );
    }
  }

  /**
   * Validate budget creation request
   */
  async validateBudgetRequest(
    request: BudgetCreationRequest,
    correlationId?: string
  ): Promise<void> {
    const errors: ValidationError[] = [];

    try {
      // Schema validation
      const { error } = this.budgetSchema.validate(request, { abortEarly: false });
      if (error) {
        errors.push(...this.convertJoiErrors(error));
      }

      // Business rule validation
      await this.validateBudgetBusinessRules(request, errors);

      // Healthcare-specific validation
      await this.validateHealthcareBudgetRules(request, errors);

      if (errors.length > 0) {
        throw FinancialErrorFactory.createBudgetValidationError(
          correlationId || 'unknown',
          errors,
          undefined,
          { requestData: this.sanitizeForLogging(request) }
        );
      }

    } catch (error: unknown) {
      if (error instanceof BudgetValidationError) {
        throw error;
      }
      
      console.error('Budget validation failed', {
        error: error instanceof Error ? error.message : "Unknown error",
        correlationId
      });
      
      throw new Error(`Budget validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Validate forecast request
   */
  async validateForecastRequest(
    request: ForecastRequest,
    correlationId?: string
  ): Promise<void> {
    const errors: ValidationError[] = [];

    // Schema validation
    const { error } = this.forecastSchema.validate(request, { abortEarly: false });
    if (error) {
      errors.push(...this.convertJoiErrors(error));
    }

    // Business rule validation
    if (request.periodMonths <= 0 || request.periodMonths > 60) {
      errors.push({
        field: 'periodMonths',
        message: 'Period months must be between 1 and 60',
        code: 'INVALID_PERIOD_MONTHS'
      });
    }

    if (request.confidence && (request.confidence < 0.5 || request.confidence > 0.99)) {
      errors.push({
        field: 'confidence',
        message: 'Confidence must be between 0.5 and 0.99',
        code: 'INVALID_CONFIDENCE'
      });
    }

    if (request.lookbackMonths && request.lookbackMonths < 3) {
      errors.push({
        field: 'lookbackMonths',
        message: 'Lookback months must be at least 3 for reliable forecasting',
        code: 'INSUFFICIENT_LOOKBACK'
      });
    }

    if (errors.length > 0) {
      throw new Error(`Forecast validationfailed: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Validate forecast results
   */
  async validateForecastResults(forecastResult: any): Promise<void> {
    const errors: ValidationError[] = [];

    if (!forecastResult.projections || forecastResult.projections.length === 0) {
      errors.push({
        field: 'projections',
        message: 'Forecast must contain at least one projection',
        code: 'NO_PROJECTIONS'
      });
    }

    if (forecastResult.confidence < 0.1) {
      errors.push({
        field: 'confidence',
        message: 'Forecast confidence is too low to be reliable',
        code: 'LOW_CONFIDENCE'
      });
    }

    if (errors.length > 0) {
      throw new Error(`Forecast results validationfailed: ${errors.map(e => e.message).join(', ')}`);
    }
  }

  /**
   * Create transaction validation schema
   */
  private createTransactionSchema(): Joi.ObjectSchema {
    return Joi.object({
      accountId: Joi.string().uuid().required(),
      amount: Joi.custom((value, helpers) => {
        try {
          const decimal = new Decimal(value);
          if (decimal.lessThanOrEqualTo(0)) {
            return helpers.error('any.invalid');
          }
          return decimal;
        } catch {
          return helpers.error('any.invalid');
        }
      }).required().messages({
        'any.invalid': 'Amount must be a positive decimal value'
      }),
      currency: Joi.string().valid(...Object.values(Currency)).required(),
      description: Joi.string().min(1).max(500).required(),
      category: Joi.string().valid(...Object.values(TransactionCategory)).required(),
      reference: Joi.string().max(100).optional(),
      paymentMethod: Joi.string().valid(...Object.values(PaymentMethod)).optional(),
      costCenter: Joi.string().uuid().optional(),
      residentId: Joi.string().uuid().optional(),
      departmentId: Joi.string().uuid().optional(),
      transactionDate: Joi.date().max('now').required(),
      metadata: Joi.object().optional(),
      vatAmount: Joi.custom((value, helpers) => {
        if (value === null || value === undefined) return value;
        try {
          return new Decimal(value);
        } catch {
          return helpers.error('any.invalid');
        }
      }).optional(),
      vatRate: Joi.custom((value, helpers) => {
        if (value === null || value === undefined) return value;
        try {
          const decimal = new Decimal(value);
          if (decimal.lessThan(0) || decimal.greaterThan(1)) {
            return helpers.error('any.invalid');
          }
          return decimal;
        } catch {
          return helpers.error('any.invalid');
        }
      }).optional(),
      regulatoryCode: Joi.string().max(50).optional(),
      taxCode: Joi.string().max(50).optional()
    });
  }

  /**
   * Create budget validation schema
   */
  private createBudgetSchema(): Joi.ObjectSchema {
    return Joi.object({
      budgetName: Joi.string().min(1).max(255).required(),
      budgetType: Joi.string().valid(...Object.values(BudgetType)).required(),
      description: Joi.string().max(1000).optional(),
      financialYear: Joi.string().pattern(/^\d{4}(-\d{4})?$/).required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().greater(Joi.ref('startDate')).required(),
      currency: Joi.string().valid(...Object.values(Currency)).required(),
      totalBudgetedRevenue: Joi.custom((value, helpers) => {
        try {
          const decimal = new Decimal(value);
          if (decimal.lessThan(0)) {
            return helpers.error('any.invalid');
          }
          return decimal;
        } catch {
          return helpers.error('any.invalid');
        }
      }).required(),
      totalBudgetedExpenses: Joi.custom((value, helpers) => {
        try {
          const decimal = new Decimal(value);
          if (decimal.lessThan(0)) {
            return helpers.error('any.invalid');
          }
          return decimal;
        } catch {
          return helpers.error('any.invalid');
        }
      }).required(),
      careHomeId: Joi.string().uuid().optional(),
      departmentId: Joi.string().uuid().optional(),
      budgetedOccupancy: Joi.number().integer().min(0).optional(),
      categories: Joi.array().items(
        Joi.object({
          categoryName: Joi.string().min(1).max(255).required(),
          budgetedAmount: Joi.custom((value, helpers) => {
            try {
              return new Decimal(value);
            } catch {
              return helpers.error('any.invalid');
            }
          }).required(),
          monthlyBreakdown: Joi.array().items(
            Joi.object({
              month: Joi.number().integer().min(1).max(12).required(),
              budgetedAmount: Joi.custom((value, helpers) => {
                try {
                  return new Decimal(value);
                } catch {
                  return helpers.error('any.invalid');
                }
              }).required()
            })
          ).optional()
        })
      ).min(1).required()
    });
  }

  /**
   * Create forecast validation schema
   */
  private createForecastSchema(): Joi.ObjectSchema {
    return Joi.object({
      forecastType: Joi.string().valid(...Object.values(ForecastType)).required(),
      entityType: Joi.string().valid(...Object.values(EntityType)).required(),
      entityId: Joi.string().uuid().optional(),
      periodMonths: Joi.number().integer().min(1).max(60).required(),
      lookbackMonths: Joi.number().integer().min(3).max(120).optional(),
      confidence: Joi.number().min(0.5).max(0.99).optional(),
      methodology: Joi.string().valid(...Object.values(ForecastMethodology)).optional(),
      dataTypes: Joi.array().items(Joi.string()).min(1).required(),
      externalFactors: Joi.array().items(
        Joi.object({
          factorType: Joi.string().required(),
          impact: Joi.number().required(),
          confidence: Joi.number().min(0).max(1).required(),
          description: Joi.string().required()
        })
      ).optional()
    });
  }

  /**
   * Create analytics validation schema
   */
  private createAnalyticsSchema(): Joi.ObjectSchema {
    return Joi.object({
      analysisType: Joi.string().valid(...Object.values(AnalysisType)).required(),
      entityType: Joi.string().valid(...Object.values(EntityType)).required(),
      entityId: Joi.string().uuid().optional(),
      dateFrom: Joi.date().required(),
      dateTo: Joi.date().greater(Joi.ref('dateFrom')).required(),
      metrics: Joi.array().items(Joi.string()).min(1).required(),
      groupBy: Joi.array().items(Joi.string()).optional(),
      filters: Joi.array().items(
        Joi.object({
          field: Joi.string().required(),
          operator: Joi.string().required(),
          value: Joi.any().required()
        })
      ).optional()
    });
  }

  /**
   * Create report validation schema
   */
  private createReportSchema(): Joi.ObjectSchema {
    return Joi.object({
      reportType: Joi.string().valid(...Object.values(ReportType)).required(),
      format: Joi.string().valid(...Object.values(ReportFormat)).required(),
      entityType: Joi.string().valid(...Object.values(EntityType)).required(),
      entityId: Joi.string().uuid().optional(),
      dateFrom: Joi.date().required(),
      dateTo: Joi.date().greater(Joi.ref('dateFrom')).required(),
      includeCharts: Joi.boolean().optional(),
      includeDetails: Joi.boolean().optional(),
      customFields: Joi.array().items(Joi.string()).optional(),
      filters: Joi.array().items(
        Joi.object({
          field: Joi.string().required(),
          value: Joi.any().required(),
          operator: Joi.string().required()
        })
      ).optional()
    });
  }

  /**
   * Validate transaction business rules
   */
  private async validateTransactionBusinessRules(
    request: CreateTransactionRequest,
    errors: ValidationError[]
  ): Promise<void> {
    // VAT validation
    if (request.vatAmount && request.vatRate) {
      const calculatedVat = request.amount.minus(request.vatAmount).times(request.vatRate);
      if (!calculatedVat.equals(request.vatAmount)) {
        errors.push({
          field: 'vatAmount',
          message: 'VAT amount does not match calculated VAT based on rate',
          code: 'VAT_CALCULATION_MISMATCH'
        });
      }
    }

    // Date validation
    const transactionDate = new Date(request.transactionDate);
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setDate(today.getDate() + 7); // Allow up to 7 days in future

    if (transactionDate > maxFutureDate) {
      errors.push({
        field: 'transactionDate',
        message: 'Transaction date cannot be more than 7 days in the future',
        code: 'FUTURE_DATE_LIMIT'
      });
    }

    // Amount validation for specific categories
    if (request.category === TransactionCategory.CASH && request.amount.greaterThan(new Decimal(1000))) {
      errors.push({
        field: 'amount',
        message: 'Cash transactions over £1000 require additional approval',
        code: 'CASH_LIMIT_EXCEEDED'
      });
    }
  }

  /**
   * Validate healthcare-specific transaction rules
   */
  private async validateHealthcareTransactionRules(
    request: CreateTransactionRequest,
    errors: ValidationError[]
  ): Promise<void> {
    // Resident-specific validation
    if (request.residentId && !request.category.includes('RESIDENT')) {
      // Check if category is appropriate for resident transactions
      const residentCategories = [
        TransactionCategory.RESIDENT_FEES,
        TransactionCategory.MEDICATION_COSTS,
        TransactionCategory.PROFESSIONAL_SERVICES
      ];
      
      if (!residentCategories.includes(request.category)) {
        errors.push({
          field: 'category',
          message: 'Transaction category not appropriate for resident-specific transactions',
          code: 'INVALID_RESIDENT_CATEGORY'
        });
      }
    }

    // NHS funding validation
    if (request.category === TransactionCategory.NHS_FUNDING) {
      if (!request.regulatoryCode) {
        errors.push({
          field: 'regulatoryCode',
          message: 'NHS funding transactions require a regulatory code',
          code: 'MISSING_NHS_CODE'
        });
      }
    }

    // Medication cost validation
    if (request.category === TransactionCategory.MEDICATION_COSTS) {
      if (!request.residentId) {
        errors.push({
          field: 'residentId',
          message: 'Medication cost transactions must be linked to a resident',
          code: 'MISSING_RESIDENT_ID'
        });
      }
    }
  }

  /**
   * Validate transaction compliance
   */
  private async validateTransactionCompliance(
    request: CreateTransactionRequest,
    errors: ValidationError[]
  ): Promise<void> {
    // PCI DSS compliance for payment transactions
    if (request.paymentMethod && request.reference) {
      // Ensure no sensitive payment data in reference
      const sensitivePatterns = [
        /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card pattern
        /\d{3,4}/, // CVV pattern
        /exp|expiry|expire/i // Expiry date indicators
      ];

      for (const pattern of sensitivePatterns) {
        if (pattern.test(request.reference)) {
          errors.push({
            field: 'reference',
            message: 'Reference field cannot contain sensitive payment information',
            code: 'PCI_DSS_VIOLATION'
          });
          break;
        }
      }
    }

    // GDPR compliance for personal data
    if (request.description) {
      // Check for potential personal data in description
      const personalDataPatterns = [
        /\b\d{2}\/\d{2}\/\d{4}\b/, // Date of birth pattern
        /\b[A-Z]{2}\d{6}[A-Z]\b/, // NHS number pattern
        /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/ // Card number pattern
      ];

      for (const pattern of personalDataPatterns) {
        if (pattern.test(request.description)) {
          errors.push({
            field: 'description',
            message: 'Description field may contain personal data that should be encrypted',
            code: 'GDPR_PERSONAL_DATA_RISK'
          });
          break;
        }
      }
    }
  }

  /**
   * Validate budget business rules
   */
  private async validateBudgetBusinessRules(
    request: BudgetCreationRequest,
    errors: ValidationError[]
  ): Promise<void> {
    // Validate budget balance
    const netBudget = request.totalBudgetedRevenue.minus(request.totalBudgetedExpenses);
    if (netBudget.lessThan(0)) {
      // Allow negative budgets but warn
      console.warn('Budget has negative net income', {
        budgetName: request.budgetName,
        netBudget: netBudget.toString()
      });
    }

    // Validate category totals
    if (request.categories && request.categories.length > 0) {
      const categoryTotal = request.categories.reduce(
        (sum, category) => sum.plus(category.budgetedAmount),
        new Decimal(0)
      );

      // Category total should not exceed total budgeted expenses significantly
      if (categoryTotal.greaterThan(request.totalBudgetedExpenses.times(1.1))) {
        errors.push({
          field: 'categories',
          message: 'Category totals exceed total budgeted expenses by more than 10%',
          code: 'CATEGORY_TOTAL_MISMATCH'
        });
      }
    }

    // Validate financial year format and logic
    const yearParts = request.financialYear.split('-');
    if (yearParts.length === 2) {
      const startYear = parseInt(yearParts[0]);
      const endYear = parseInt(yearParts[1]);
      
      if (endYear !== startYear + 1) {
        errors.push({
          field: 'financialYear',
          message: 'Financial year end must be one year after start year',
          code: 'INVALID_FINANCIAL_YEAR'
        });
      }
    }
  }

  /**
   * Validate healthcare-specific budget rules
   */
  private async validateHealthcareBudgetRules(
    request: BudgetCreationRequest,
    errors: ValidationError[]
  ): Promise<void> {
    // Occupancy validation
    if (request.budgetedOccupancy) {
      if (request.budgetedOccupancy <= 0 || request.budgetedOccupancy > 100) {
        errors.push({
          field: 'budgetedOccupancy',
          message: 'Budgeted occupancy must be between 1 and 100',
          code: 'INVALID_OCCUPANCY'
        });
      }

      // Calculate revenue per resident if possible
      if (request.budgetedOccupancy > 0) {
        const revenuePerResident = request.totalBudgetedRevenue.dividedBy(request.budgetedOccupancy);
        
        // Warn if revenue per resident seems unusually low or high
        const minRevenuePerResident = new Decimal(20000); // £20k per year minimum
        const maxRevenuePerResident = new Decimal(100000); // £100k per year maximum
        
        if (revenuePerResident.lessThan(minRevenuePerResident)) {
          console.warn('Revenue per resident seems low', {
            budgetName: request.budgetName,
            revenuePerResident: revenuePerResident.toString()
          });
        }
        
        if (revenuePerResident.greaterThan(maxRevenuePerResident)) {
          console.warn('Revenue per resident seems high', {
            budgetName: request.budgetName,
            revenuePerResident: revenuePerResident.toString()
          });
        }
      }
    }

    // Validate healthcare-specific categories
    const requiredHealthcareCategories = [
      'Staff Costs',
      'Clinical Supplies',
      'Utilities',
      'Food & Catering',
      'Maintenance'
    ];

    const categoryNames = request.categories.map(c => c.categoryName);
    const missingCategories = requiredHealthcareCategories.filter(
      required => !categoryNames.some(name => 
        name.toLowerCase().includes(required.toLowerCase())
      )
    );

    if (missingCategories.length > 0) {
      console.warn('Budget missing recommended healthcare categories', {
        budgetName: request.budgetName,
        missingCategories
      });
    }
  }

  /**
   * Helper methods
   */
  private isValidAmount(amount: any): boolean {
    try {
      const decimal = new Decimal(amount);
      return decimal.greaterThan(0);
    } catch {
      return false;
    }
  }

  private convertJoiErrors(joiError: Joi.ValidationError): ValidationError[] {
    return joiError.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type.toUpperCase().replace(/\./g, '_'),
      value: detail.context?.value
    }));
  }

  private sanitizeForLogging(data: any): any {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    if (sanitized.reference) sanitized.reference = '[REDACTED]';
    if (sanitized.metadata) sanitized.metadata = '[REDACTED]';
    if (sanitized.description) sanitized.description = '[REDACTED]';
    
    return sanitized;
  }
}

export default FinancialValidationService;
