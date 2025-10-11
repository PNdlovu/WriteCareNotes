/**
 * @fileoverview Financial Service Error Classes for WriteCareNotes
 * @module FinancialErrors
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Custom error classes for financial service operations with
 * comprehensive error handling and healthcare compliance requirements.
 */

/**
 * Base Financial Error Class
 */
export class FinancialError extends Error {
  public readonlycode: string;
  public readonly details?: any;
  public readonly correlationId?: string;
  public readonlytimestamp: Date;

  const ructor(
    message: string,
    code: string,
    details?: any,
    correlationId?: string
  ) {
    super(message);
    this.name = this.const ructor.name;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
    this.timestamp = new Date();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.const ructor);
    }
  }

  /**
   * Convert error to JSON for logging and API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * Financial Validation Error
 * Thrown when input validation fails for financial operations
 */
export class FinancialValidationError extends FinancialError {
  public readonly field?: string;
  public readonly value?: any;
  public readonly const raint?: string;

  const ructor(
    message: string,
    code: string,
    details?: {
      field?: string;
      value?: any;
      const raint?: string;
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(message, code, details, correlationId);
    this.field = details?.field;
    this.value = details?.value;
    this.const raint = details?.const raint;
  }
}

/**
 * Payment Processing Error
 * Thrown when payment processing fails
 */
export class PaymentProcessingError extends FinancialError {
  public readonly gatewayError?: string;
  public readonlyretryable: boolean;
  public readonly retryAfter?: number; // Seconds

  const ructor(
    message: string,
    code: string,
    details?: {
      gatewayError?: string;
      retryable?: boolean;
      retryAfter?: number;
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(message, code, details, correlationId);
    this.gatewayError = details?.gatewayError;
    this.retryable = details?.retryable ?? false;
    this.retryAfter = details?.retryAfter;
  }
}

/**
 * Insufficient Funds Error
 * Thrown when account has insufficient funds for a transaction
 */
export class InsufficientFundsError extends FinancialError {
  public readonlyavailableBalance: number;
  public readonlyrequestedAmount: number;
  public readonlyshortfall: number;

  const ructor(
    message: string,
    availableBalance: number,
    requestedAmount: number,
    correlationId?: string
  ) {
    const shortfall = requestedAmount - availableBalance;
    super(
      message,
      'INSUFFICIENT_FUNDS',
      {
        availableBalance,
        requestedAmount,
        shortfall
      },
      correlationId
    );
    this.availableBalance = availableBalance;
    this.requestedAmount = requestedAmount;
    this.shortfall = shortfall;
  }
}

/**
 * Tax Calculation Error
 * Thrown when tax calculations fail
 */
export class TaxCalculationError extends FinancialError {
  public readonlytaxType: string;
  public readonlytaxYear: number;

  const ructor(
    message: string,
    code: string,
    taxType: string,
    taxYear: number,
    details?: any,
    correlationId?: string
  ) {
    super(message, code, { taxType, taxYear, ...details }, correlationId);
    this.taxType = taxType;
    this.taxYear = taxYear;
  }
}

/**
 * Compliance Violation Error
 * Thrown when financial operations violate compliance rules
 */
export class ComplianceViolationError extends FinancialError {
  public readonlyviolationType: string;
  public readonlyregulation: string;
  public readonlyseverity: 'low' | 'medium' | 'high' | 'critical';

  const ructor(
    message: string,
    violationType: string,
    regulation: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    details?: any,
    correlationId?: string
  ) {
    super(
      message,
      'COMPLIANCE_VIOLATION',
      {
        violationType,
        regulation,
        severity,
        ...details
      },
      correlationId
    );
    this.violationType = violationType;
    this.regulation = regulation;
    this.severity = severity;
  }
}

/**
 * Insurance Claim Error
 * Thrown when insurance claim operations fail
 */
export class InsuranceClaimError extends FinancialError {
  public readonly claimId?: string;
  public readonlyprovider: string;
  public readonly policyNumber?: string;

  const ructor(
    message: string,
    code: string,
    provider: string,
    details?: {
      claimId?: string;
      policyNumber?: string;
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(message, code, { provider, ...details }, correlationId);
    this.claimId = details?.claimId;
    this.provider = provider;
    this.policyNumber = details?.policyNumber;
  }
}

/**
 * Billing Error
 * Thrown when billing operations fail
 */
export class BillingError extends FinancialError {
  public readonly billId?: string;
  public readonlyresidentId: string;
  public readonly billingPeriod?: {
    start: Date;
    end: Date;
  };

  const ructor(
    message: string,
    code: string,
    residentId: string,
    details?: {
      billId?: string;
      billingPeriod?: { start: Date; end: Date };
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(message, code, { residentId, ...details }, correlationId);
    this.billId = details?.billId;
    this.residentId = residentId;
    this.billingPeriod = details?.billingPeriod;
  }
}

/**
 * Financial Report Error
 * Thrown when financial report generation fails
 */
export class FinancialReportError extends FinancialError {
  public readonlyreportType: string;
  public readonlyperiod: {
    start: Date;
    end: Date;
  };

  const ructor(
    message: string,
    code: string,
    reportType: string,
    period: { start: Date; end: Date },
    details?: any,
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        reportType,
        period,
        ...details
      },
      correlationId
    );
    this.reportType = reportType;
    this.period = period;
  }
}

/**
 * Bank Integration Error
 * Thrown when bank integration operations fail
 */
export class BankIntegrationError extends FinancialError {
  public readonlybankName: string;
  public readonly accountNumber?: string;
  public readonlyoperationType: string;

  const ructor(
    message: string,
    code: string,
    bankName: string,
    operationType: string,
    details?: {
      accountNumber?: string;
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        bankName,
        operationType,
        ...details
      },
      correlationId
    );
    this.bankName = bankName;
    this.accountNumber = details?.accountNumber;
    this.operationType = operationType;
  }
}

/**
 * Currency Conversion Error
 * Thrown when currency conversion fails
 */
export class CurrencyConversionError extends FinancialError {
  public readonlyfromCurrency: string;
  public readonlytoCurrency: string;
  public readonlyamount: number;

  const ructor(
    message: string,
    code: string,
    fromCurrency: string,
    toCurrency: string,
    amount: number,
    details?: any,
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        fromCurrency,
        toCurrency,
        amount,
        ...details
      },
      correlationId
    );
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
    this.amount = amount;
  }
}

/**
 * Recurring Billing Error
 * Thrown when recurring billing operations fail
 */
export class RecurringBillingError extends FinancialError {
  public readonlyrecurringBillingId: string;
  public readonlyfrequency: string;
  public readonly nextBillingDate?: Date;

  const ructor(
    message: string,
    code: string,
    recurringBillingId: string,
    frequency: string,
    details?: {
      nextBillingDate?: Date;
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        recurringBillingId,
        frequency,
        ...details
      },
      correlationId
    );
    this.recurringBillingId = recurringBillingId;
    this.frequency = frequency;
    this.nextBillingDate = details?.nextBillingDate;
  }
}

/**
 * Budget Error
 * Thrown when budget operations fail
 */
export class BudgetError extends FinancialError {
  public readonly budgetId?: string;
  public readonlybudgetType: string;
  public readonlyfinancialYear: string;

  const ructor(
    message: string,
    code: string,
    budgetType: string,
    financialYear: string,
    details?: {
      budgetId?: string;
      [key: string]: any;
    },
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        budgetType,
        financialYear,
        ...details
      },
      correlationId
    );
    this.budgetId = details?.budgetId;
    this.budgetType = budgetType;
    this.financialYear = financialYear;
  }
}

/**
 * Audit Trail Error
 * Thrown when audit trail operations fail
 */
export class AuditTrailError extends FinancialError {
  public readonlyentityType: string;
  public readonlyentityId: string;
  public readonlyoperation: string;

  const ructor(
    message: string,
    code: string,
    entityType: string,
    entityId: string,
    operation: string,
    details?: any,
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        entityType,
        entityId,
        operation,
        ...details
      },
      correlationId
    );
    this.entityType = entityType;
    this.entityId = entityId;
    this.operation = operation;
  }
}

/**
 * Financial Data Encryption Error
 * Thrown when financial data encryption/decryption fails
 */
export class FinancialDataEncryptionError extends FinancialError {
  public readonlydataType: string;
  public readonlyoperation: 'encrypt' | 'decrypt';

  const ructor(
    message: string,
    code: string,
    dataType: string,
    operation: 'encrypt' | 'decrypt',
    details?: any,
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        dataType,
        operation,
        ...details
      },
      correlationId
    );
    this.dataType = dataType;
    this.operation = operation;
  }
}

/**
 * Financial Forecast Error
 * Thrown when financial forecasting fails
 */
export class FinancialForecastError extends FinancialError {
  public readonlyforecastType: string;
  public readonlyforecastPeriod: number;
  public readonlymethodology: string;

  const ructor(
    message: string,
    code: string,
    forecastType: string,
    forecastPeriod: number,
    methodology: string,
    details?: any,
    correlationId?: string
  ) {
    super(
      message,
      code,
      {
        forecastType,
        forecastPeriod,
        methodology,
        ...details
      },
      correlationId
    );
    this.forecastType = forecastType;
    this.forecastPeriod = forecastPeriod;
    this.methodology = methodology;
  }
}

/**
 * Error Factory for creating standardized financial errors
 */
export class FinancialErrorFactory {
  /**
   * Create a validation error
   */
  static createValidationError(
    message: string,
    field?: string,
    value?: any,
    const raint?: string,
    correlationId?: string
  ): FinancialValidationError {
    return new FinancialValidationError(
      message,
      'VALIDATION_ERROR',
      { field, value, const raint },
      correlationId
    );
  }

  /**
   * Create a payment processing error
   */
  static createPaymentError(
    message: string,
    gatewayError?: string,
    retryable: boolean = false,
    correlationId?: string
  ): PaymentProcessingError {
    return new PaymentProcessingError(
      message,
      'PAYMENT_PROCESSING_ERROR',
      { gatewayError, retryable },
      correlationId
    );
  }

  /**
   * Create an insufficient funds error
   */
  static createInsufficientFundsError(
    availableBalance: number,
    requestedAmount: number,
    correlationId?: string
  ): InsufficientFundsError {
    return new InsufficientFundsError(
      `Insufficient funds. Available: ${availableBalance}, Requested: ${requestedAmount}`,
      availableBalance,
      requestedAmount,
      correlationId
    );
  }

  /**
   * Create a compliance violation error
   */
  static createComplianceError(
    message: string,
    violationType: string,
    regulation: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    correlationId?: string
  ): ComplianceViolationError {
    return new ComplianceViolationError(
      message,
      violationType,
      regulation,
      severity,
      undefined,
      correlationId
    );
  }

  /**
   * Create a generic financial error
   */
  static createGenericError(
    message: string,
    code: string,
    details?: any,
    correlationId?: string
  ): FinancialError {
    return new FinancialError(message, code, details, correlationId);
  }
}

/**
 * Error Handler Utility
 */
export class FinancialErrorHandler {
  /**
   * Check if error is retryable
   */
  static isRetryable(error: FinancialError): boolean {
    if (error instanceof PaymentProcessingError) {
      return error.retryable;
    }

    // Network errors are generally retryable
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT_ERROR') {
      return true;
    }

    // Validation errors are not retryable
    if (error instanceof FinancialValidationError) {
      return false;
    }

    // Default to not retryable for safety
    return false;
  }

  /**
   * Get retry delay in seconds
   */
  static getRetryDelay(error: FinancialError, attempt: number): number {
    if (error instanceof PaymentProcessingError && error.retryAfter) {
      return error.retryAfter;
    }

    // Exponentialbackoff: 2^attempt seconds, max 300 seconds (5 minutes)
    return Math.min(Math.pow(2, attempt), 300);
  }

  /**
   * Sanitize error for client response (remove sensitive information)
   */
  static sanitizeForClient(error: FinancialError): Record<string, any> {
    const sanitized = {
      name: error.name,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp.toISOString(),
      correlationId: error.correlationId
    };

    // Add specific fields for certain error types
    if (error instanceof FinancialValidationError) {
      return {
        ...sanitized,
        field: error.field,
        const raint: error.const raint
        // Don't include the actual value for security
      };
    }

    if (error instanceof PaymentProcessingError) {
      return {
        ...sanitized,
        retryable: error.retryable,
        retryAfter: error.retryAfter
        // Don't include gateway error details for security
      };
    }

    if (error instanceof ComplianceViolationError) {
      return {
        ...sanitized,
        violationType: error.violationType,
        regulation: error.regulation,
        severity: error.severity
      };
    }

    return sanitized;
  }
}
