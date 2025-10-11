import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial Analytics Service Exceptions for WriteCareNotes
 * @module FinancialAnalyticsExceptions
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Custom exception classes for Financial Analytics Service
 * with healthcare compliance and audit trail support.
 */

/**
 * Base Financial Analytics Error
 */
export class FinancialAnalyticsError extends Error {
  public readonly code: string;
  public readonly correlationId: string;
  public readonly timestamp: Date;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    correlationId: string,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'FinancialAnalyticsError';
    this.code = code;
    this.correlationId = correlationId;
    this.timestamp = new Date();
    this.context = context;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FinancialAnalyticsError);
    }
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      correlationId: this.correlationId,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Transaction Validation Error
 */
export class TransactionValidationError extends FinancialAnalyticsError {
  public readonly validationErrors: ValidationError[];

  constructor(
    message: string,
    correlationId: string,
    validationErrors: ValidationError[],
    context?: Record<string, any>
  ) {
    super(message, 'TRANSACTION_VALIDATION_ERROR', correlationId, context);
    this.name = 'TransactionValidationError';
    this.validationErrors = validationErrors;
  }

  /**
   * Get formatted validation errors
   */
  getFormattedErrors(): string {
    return this.validationErrors
      .map(error => `${error.field}: ${error instanceof Error ? error.message : "Unknown error"}`)
      .join(', ');
  }
}

/**
 * Budget Validation Error
 */
export class BudgetValidationError extends FinancialAnalyticsError {
  public readonly budgetId?: string;
  public readonly validationErrors: ValidationError[];

  constructor(
    message: string,
    correlationId: string,
    validationErrors: ValidationError[],
    budgetId?: string,
    context?: Record<string, any>
  ) {
    super(message, 'BUDGET_VALIDATION_ERROR', correlationId, context);
    this.name = 'BudgetValidationError';
    this.budgetId = budgetId;
    this.validationErrors = validationErrors;
  }
}

/**
 * Forecast Generation Error
 */
export class ForecastGenerationError extends FinancialAnalyticsError {
  public readonly forecastType: string;
  public readonly methodology?: string;

  constructor(
    message: string,
    correlationId: string,
    forecastType: string,
    methodology?: string,
    context?: Record<string, any>
  ) {
    super(message, 'FORECAST_GENERATION_ERROR', correlationId, context);
    this.name = 'ForecastGenerationError';
    this.forecastType = forecastType;
    this.methodology = methodology;
  }
}

/**
 * Analytics Processing Error
 */
export class AnalyticsProcessingError extends FinancialAnalyticsError {
  public readonly analysisType: string;
  public readonly dataPoints?: number;

  constructor(
    message: string,
    correlationId: string,
    analysisType: string,
    dataPoints?: number,
    context?: Record<string, any>
  ) {
    super(message, 'ANALYTICS_PROCESSING_ERROR', correlationId, context);
    this.name = 'AnalyticsProcessingError';
    this.analysisType = analysisType;
    this.dataPoints = dataPoints;
  }
}

/**
 * Report Generation Error
 */
export class ReportGenerationError extends FinancialAnalyticsError {
  public readonly reportType: string;
  public readonly format: string;

  constructor(
    message: string,
    correlationId: string,
    reportType: string,
    format: string,
    context?: Record<string, any>
  ) {
    super(message, 'REPORT_GENERATION_ERROR', correlationId, context);
    this.name = 'ReportGenerationError';
    this.reportType = reportType;
    this.format = format;
  }
}

/**
 * Compliance Violation Error
 */
export class ComplianceViolationError extends FinancialAnalyticsError {
  public readonly complianceType: ComplianceType;
  public readonly violationDetails: ComplianceViolation[];
  public readonly severity: ComplianceSeverity;

  constructor(
    message: string,
    correlationId: string,
    complianceType: ComplianceType,
    violationDetails: ComplianceViolation[],
    severity: ComplianceSeverity = ComplianceSeverity.HIGH,
    context?: Record<string, any>
  ) {
    super(message, 'COMPLIANCE_VIOLATION_ERROR', correlationId, context);
    this.name = 'ComplianceViolationError';
    this.complianceType = complianceType;
    this.violationDetails = violationDetails;
    this.severity = severity;
  }

  /**
   * Check if violation requires immediate action
   */
  requiresImmediateAction(): boolean {
    return this.severity === ComplianceSeverity.CRITICAL;
  }
}

/**
 * Security Violation Error
 */
export class SecurityViolationError extends FinancialAnalyticsError {
  public readonly securityType: SecurityViolationType;
  public readonly userId: string;
  public readonly ipAddress?: string;
  public readonly userAgent?: string;

  constructor(
    message: string,
    correlationId: string,
    securityType: SecurityViolationType,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    context?: Record<string, any>
  ) {
    super(message, 'SECURITY_VIOLATION_ERROR', correlationId, context);
    this.name = 'SecurityViolationError';
    this.securityType = securityType;
    this.userId = userId;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
  }

  /**
   * Get security incident details
   */
  getSecurityIncidentDetails(): SecurityIncident {
    return {
      incidentType: this.securityType,
      userId: this.userId,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      message: this.message,
      context: this.context
    };
  }
}

/**
 * Data Access Error
 */
export class DataAccessError extends FinancialAnalyticsError {
  public readonly entityType: string;
  public readonly entityId?: string;
  public readonly accessType: DataAccessType;
  public readonly userId: string;

  constructor(
    message: string,
    correlationId: string,
    entityType: string,
    accessType: DataAccessType,
    userId: string,
    entityId?: string,
    context?: Record<string, any>
  ) {
    super(message, 'DATA_ACCESS_ERROR', correlationId, context);
    this.name = 'DataAccessError';
    this.entityType = entityType;
    this.entityId = entityId;
    this.accessType = accessType;
    this.userId = userId;
  }
}

/**
 * Integration Error
 */
export class IntegrationError extends FinancialAnalyticsError {
  public readonly integrationName: string;
  public readonly operationType: string;
  public readonly externalErrorCode?: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    correlationId: string,
    integrationName: string,
    operationType: string,
    retryable: boolean = true,
    externalErrorCode?: string,
    context?: Record<string, any>
  ) {
    super(message, 'INTEGRATION_ERROR', correlationId, context);
    this.name = 'IntegrationError';
    this.integrationName = integrationName;
    this.operationType = operationType;
    this.externalErrorCode = externalErrorCode;
    this.retryable = retryable;
  }
}

/**
 * Performance Error
 */
export class PerformanceError extends FinancialAnalyticsError {
  public readonly operationType: string;
  public readonly executionTime: number;
  public readonly threshold: number;

  constructor(
    message: string,
    correlationId: string,
    operationType: string,
    executionTime: number,
    threshold: number,
    context?: Record<string, any>
  ) {
    super(message, 'PERFORMANCE_ERROR', correlationId, context);
    this.name = 'PerformanceError';
    this.operationType = operationType;
    this.executionTime = executionTime;
    this.threshold = threshold;
  }

  /**
   * Get performance impact level
   */
  getPerformanceImpact(): PerformanceImpact {
    const ratio = this.executionTime / this.threshold;
    
    if (ratio > 5) return PerformanceImpact.CRITICAL;
    if (ratio > 3) return PerformanceImpact.HIGH;
    if (ratio > 2) return PerformanceImpact.MEDIUM;
    return PerformanceImpact.LOW;
  }
}

/**
 * Supporting Types and Interfaces
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ComplianceViolation {
  rule: string;
  description: string;
  severity: ComplianceSeverity;
  remediation: string;
  regulatoryReference?: string;
}

export interface SecurityIncident {
  incidentType: SecurityViolationType;
  userId: string;
  timestamp: Date;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
  message: string;
  context?: Record<string, any>;
}

export enum ComplianceType {
  GDPR = 'gdpr',
  PCI_DSS = 'pci_dss',
  SOX = 'sox',
  CQC = 'cqc',
  CARE_INSPECTORATE = 'care_inspectorate',
  CIW = 'ciw',
  RQIA = 'rqia',
  HMRC = 'hmrc',
  FCA = 'fca'
}

export enum ComplianceSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SecurityViolationType {
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  AUTHENTICATION_FAILURE = 'authentication_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_TOKEN = 'invalid_token',
  ENCRYPTION_FAILURE = 'encryption_failure'
}

export enum DataAccessType {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  EXPORT = 'export',
  BULK_OPERATION = 'bulk_operation'
}

export enum PerformanceImpact {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error Factory for creating standardized errors
 */
export class FinancialErrorFactory {
  /**
   * Create transaction validation error
   */
  static createTransactionValidationError(
    correlationId: string,
    validationErrors: ValidationError[],
    context?: Record<string, any>
  ): TransactionValidationError {
    const message = `Transaction validation failed: ${validationErrors.length} errors found`;
    return new TransactionValidationError(message, correlationId, validationErrors, context);
  }

  /**
   * Create budget validation error
   */
  static createBudgetValidationError(
    correlationId: string,
    validationErrors: ValidationError[],
    budgetId?: string,
    context?: Record<string, any>
  ): BudgetValidationError {
    const message = `Budget validation failed: ${validationErrors.length} errors found`;
    return new BudgetValidationError(message, correlationId, validationErrors, budgetId, context);
  }

  /**
   * Create compliance violation error
   */
  static createComplianceViolationError(
    correlationId: string,
    complianceType: ComplianceType,
    violations: ComplianceViolation[],
    context?: Record<string, any>
  ): ComplianceViolationError {
    const message = `${complianceType.toUpperCase()} compliance violation detected`;
    const severity = violations.some(v => v.severity === ComplianceSeverity.CRITICAL)
      ? ComplianceSeverity.CRITICAL
      : ComplianceSeverity.HIGH;
    
    return new ComplianceViolationError(
      message,
      correlationId,
      complianceType,
      violations,
      severity,
      context
    );
  }

  /**
   * Create security violation error
   */
  static createSecurityViolationError(
    correlationId: string,
    securityType: SecurityViolationType,
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    context?: Record<string, any>
  ): SecurityViolationError {
    const message = `Security violation detected: ${securityType}`;
    return new SecurityViolationError(
      message,
      correlationId,
      securityType,
      userId,
      ipAddress,
      userAgent,
      context
    );
  }

  /**
   * Create performance error
   */
  static createPerformanceError(
    correlationId: string,
    operationType: string,
    executionTime: number,
    threshold: number,
    context?: Record<string, any>
  ): PerformanceError {
    const message = `Performance threshold exceeded for ${operationType}: ${executionTime}ms > ${threshold}ms`;
    return new PerformanceError(
      message,
      correlationId,
      operationType,
      executionTime,
      threshold,
      context
    );
  }
}

export default {
  FinancialAnalyticsError,
  TransactionValidationError,
  BudgetValidationError,
  ForecastGenerationError,
  AnalyticsProcessingError,
  ReportGenerationError,
  ComplianceViolationError,
  SecurityViolationError,
  DataAccessError,
  IntegrationError,
  PerformanceError,
  FinancialErrorFactory
};