/**
 * @fileoverview HR & Payroll Error Classes for WriteCareNotes
 * @module HRPayrollErrors
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive error handling classes for HR and payroll operations
 * providing specific error types for employee management, payroll processing,
 * training compliance, shift scheduling, and performance management with
 * detailed error information and compliance tracking.
 * 
 * @compliance
 * - Employment Rights Act 1996
 * - Working Time Regulations 1998
 * - PAYE (Pay As You Earn) regulations
 * - GDPR data protection requirements
 * - Error handling and audit requirements
 */

import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Base class for all HR & Payroll related errors
 */
export abstract class HRPayrollBaseError extends HttpException {
  public readonly errorCode: string;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    message: string,
    errorCode: string,
    httpStatus: HttpStatus,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(
      {
        success: false,
        error: {
          code: errorCode,
          message: message,
          details: details || {},
          timestamp: new Date().toISOString(),
          correlationId: correlationId || null
        }
      },
      httpStatus
    );

    this.errorCode = errorCode;
    this.details = details;
    this.timestamp = new Date();
    this.correlationId = correlationId;
    this.name = this.constructor.name;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Sanitizes error details for client response (removes sensitive information)
   */
  public sanitizeForClient(): Record<string, any> {
    const sanitizedDetails = { ...this.details };
    
    // Remove sensitive fields that should not be exposed to clients
    const sensitiveFields = [
      'nationalInsuranceNumber',
      'bankAccountNumber',
      'sortCode',
      'taxCode',
      'salary',
      'internalError',
      'stackTrace',
      'databaseError'
    ];

    sensitiveFields.forEach(field => {
      if (sanitizedDetails[field]) {
        delete sanitizedDetails[field];
      }
    });

    return {
      code: this.errorCode,
      message: this.message,
      details: sanitizedDetails,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId
    };
  }
}

/**
 * Employee management validation errors
 */
export class HRValidationError extends HRPayrollBaseError {
  constructor(
    message: string,
    errorCode: string = 'HR_VALIDATION_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, details, correlationId);
  }
}

/**
 * Employee not found errors
 */
export class EmployeeNotFoundError extends HRPayrollBaseError {
  constructor(
    message: string,
    errorCode: string = 'EMPLOYEE_NOT_FOUND',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.NOT_FOUND, details, correlationId);
  }
}

/**
 * Payroll processing errors
 */
export class PayrollProcessingError extends HRPayrollBaseError {
  public readonly payrollPeriod?: string;
  public readonly affectedEmployees?: string[];

  constructor(
    message: string,
    errorCode: string = 'PAYROLL_PROCESSING_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.INTERNAL_SERVER_ERROR, details, correlationId);
    
    this.payrollPeriod = details?.payrollPeriod;
    this.affectedEmployees = details?.affectedEmployees;
  }

  /**
   * Gets retry information for transient payroll errors
   */
  public getRetryInfo(): { canRetry: boolean; retryAfter?: number; maxRetries?: number } {
    const transientErrorCodes = [
      'PAYROLL_DATABASE_TIMEOUT',
      'PAYROLL_EXTERNAL_SERVICE_UNAVAILABLE',
      'PAYROLL_TEMPORARY_CALCULATION_ERROR'
    ];

    return {
      canRetry: transientErrorCodes.includes(this.errorCode),
      retryAfter: 30, // seconds
      maxRetries: 3
    };
  }
}

/**
 * Tax calculation specific errors
 */
export class TaxCalculationError extends HRPayrollBaseError {
  public readonly taxYear?: string;
  public readonly employeeId?: string;

  constructor(
    message: string,
    errorCode: string = 'TAX_CALCULATION_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details, correlationId);
    
    this.taxYear = details?.taxYear;
    this.employeeId = details?.employeeId;
  }
}

/**
 * Pension calculation specific errors
 */
export class PensionCalculationError extends HRPayrollBaseError {
  public readonly pensionSchemeId?: string;
  public readonly employeeId?: string;

  constructor(
    message: string,
    errorCode: string = 'PENSION_CALCULATION_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details, correlationId);
    
    this.pensionSchemeId = details?.pensionSchemeId;
    this.employeeId = details?.employeeId;
  }
}

/**
 * Training compliance errors
 */
export class TrainingComplianceError extends HRPayrollBaseError {
  public readonly trainingType?: string;
  public readonly employeeId?: string;
  public readonly complianceViolations?: string[];

  constructor(
    message: string,
    errorCode: string = 'TRAINING_COMPLIANCE_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details, correlationId);
    
    this.trainingType = details?.trainingType;
    this.employeeId = details?.employeeId;
    this.complianceViolations = details?.complianceViolations;
  }

  /**
   * Gets compliance remediation steps
   */
  public getRemediationSteps(): string[] {
    const steps: string[] = [];
    
    if (this.complianceViolations) {
      this.complianceViolations.forEach(violation => {
        switch (violation) {
          case 'EXPIRED_TRAINING':
            steps.push('Schedule renewal training session');
            steps.push('Update training record upon completion');
            break;
          case 'MISSING_MANDATORY_TRAINING':
            steps.push('Enroll employee in mandatory training program');
            steps.push('Restrict duties until training completed');
            break;
          case 'INVALID_CERTIFICATION':
            steps.push('Verify certification with issuing body');
            steps.push('Obtain valid certification if required');
            break;
        }
      });
    }
    
    return steps;
  }
}

/**
 * Shift scheduling errors
 */
export class ShiftSchedulingError extends HRPayrollBaseError {
  public readonly shiftId?: string;
  public readonly employeeId?: string;
  public readonly conflictType?: string;

  constructor(
    message: string,
    errorCode: string = 'SHIFT_SCHEDULING_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.CONFLICT, details, correlationId);
    
    this.shiftId = details?.shiftId;
    this.employeeId = details?.employeeId;
    this.conflictType = details?.conflictType;
  }

  /**
   * Gets conflict resolution suggestions
   */
  public getConflictResolution(): string[] {
    const resolutions: string[] = [];
    
    switch (this.conflictType) {
      case 'DOUBLE_BOOKING':
        resolutions.push('Cancel one of the conflicting shifts');
        resolutions.push('Reassign shift to another employee');
        resolutions.push('Adjust shift timing to avoid overlap');
        break;
      case 'INSUFFICIENT_REST':
        resolutions.push('Extend rest period between shifts');
        resolutions.push('Reassign shift to well-rested employee');
        break;
      case 'OVERTIME_LIMIT_EXCEEDED':
        resolutions.push('Reduce shift duration');
        resolutions.push('Distribute hours across multiple employees');
        resolutions.push('Obtain overtime authorization');
        break;
      case 'WORKING_TIME_VIOLATION':
        resolutions.push('Ensure compliance with Working Time Regulations');
        resolutions.push('Implement mandatory rest breaks');
        resolutions.push('Limit weekly working hours');
        break;
    }
    
    return resolutions;
  }
}

/**
 * Performance review errors
 */
export class PerformanceReviewError extends HRPayrollBaseError {
  public readonly reviewId?: string;
  public readonly employeeId?: string;
  public readonly reviewType?: string;

  constructor(
    message: string,
    errorCode: string = 'PERFORMANCE_REVIEW_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details, correlationId);
    
    this.reviewId = details?.reviewId;
    this.employeeId = details?.employeeId;
    this.reviewType = details?.reviewType;
  }
}

/**
 * Employment law compliance errors
 */
export class EmploymentLawComplianceError extends HRPayrollBaseError {
  public readonly regulationType?: string;
  public readonly violationSeverity?: 'low' | 'medium' | 'high' | 'critical';
  public readonly legalRequirements?: string[];

  constructor(
    message: string,
    errorCode: string = 'EMPLOYMENT_LAW_COMPLIANCE_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details, correlationId);
    
    this.regulationType = details?.regulationType;
    this.violationSeverity = details?.violationSeverity;
    this.legalRequirements = details?.legalRequirements;
  }

  /**
   * Gets legal compliance actions required
   */
  public getComplianceActions(): string[] {
    const actions: string[] = [];
    
    if (this.legalRequirements) {
      this.legalRequirements.forEach(requirement => {
        switch (requirement) {
          case 'RIGHT_TO_WORK_CHECK':
            actions.push('Verify employee right to work documentation');
            actions.push('Update HR records with verification details');
            break;
          case 'DBS_CHECK_REQUIRED':
            actions.push('Initiate DBS check application');
            actions.push('Restrict duties until clearance received');
            break;
          case 'MINIMUM_WAGE_COMPLIANCE':
            actions.push('Review and adjust hourly rates');
            actions.push('Calculate and pay any underpayment');
            break;
          case 'WORKING_TIME_REGULATIONS':
            actions.push('Implement working time monitoring');
            actions.push('Ensure mandatory rest periods');
            break;
        }
      });
    }
    
    return actions;
  }
}

/**
 * HMRC submission errors
 */
export class HMRCSubmissionError extends HRPayrollBaseError {
  public readonly submissionType?: string;
  public readonly hmrcErrorCode?: string;
  public readonly payrollPeriod?: string;

  constructor(
    message: string,
    errorCode: string = 'HMRC_SUBMISSION_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.BAD_GATEWAY, details, correlationId);
    
    this.submissionType = details?.submissionType;
    this.hmrcErrorCode = details?.hmrcErrorCode;
    this.payrollPeriod = details?.payrollPeriod;
  }

  /**
   * Gets HMRC error resolution steps
   */
  public getHMRCResolutionSteps(): string[] {
    const steps: string[] = [];
    
    switch (this.hmrcErrorCode) {
      case 'INVALID_PAYE_REFERENCE':
        steps.push('Verify PAYE reference number');
        steps.push('Contact HMRC to confirm registration details');
        break;
      case 'SUBMISSION_DEADLINE_MISSED':
        steps.push('Submit return immediately');
        steps.push('Prepare penalty payment if applicable');
        break;
      case 'INVALID_TAX_CALCULATION':
        steps.push('Review tax calculations for accuracy');
        steps.push('Correct any calculation errors');
        steps.push('Resubmit corrected return');
        break;
      case 'DUPLICATE_SUBMISSION':
        steps.push('Check submission history');
        steps.push('Contact HMRC if duplicate was unintentional');
        break;
    }
    
    return steps;
  }
}

/**
 * Data protection and GDPR compliance errors
 */
export class DataProtectionError extends HRPayrollBaseError {
  public readonly dataType?: string;
  public readonly gdprViolationType?: string;
  public readonly affectedEmployees?: string[];

  constructor(
    message: string,
    errorCode: string = 'DATA_PROTECTION_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.FORBIDDEN, details, correlationId);
    
    this.dataType = details?.dataType;
    this.gdprViolationType = details?.gdprViolationType;
    this.affectedEmployees = details?.affectedEmployees;
  }

  /**
   * Gets GDPR compliance remediation steps
   */
  public getGDPRRemediationSteps(): string[] {
    const steps: string[] = [];
    
    switch (this.gdprViolationType) {
      case 'UNAUTHORIZED_ACCESS':
        steps.push('Revoke unauthorized access immediately');
        steps.push('Audit access logs for breach extent');
        steps.push('Notify affected individuals if required');
        break;
      case 'DATA_RETENTION_VIOLATION':
        steps.push('Review data retention policies');
        steps.push('Delete data beyond retention period');
        steps.push('Update retention schedules');
        break;
      case 'CONSENT_WITHDRAWAL':
        steps.push('Stop processing personal data immediately');
        steps.push('Delete data if no other lawful basis exists');
        steps.push('Confirm deletion to data subject');
        break;
      case 'CROSS_BORDER_TRANSFER_VIOLATION':
        steps.push('Suspend international data transfers');
        steps.push('Implement appropriate safeguards');
        steps.push('Obtain necessary transfer approvals');
        break;
    }
    
    return steps;
  }
}

/**
 * Audit and compliance reporting errors
 */
export class AuditComplianceError extends HRPayrollBaseError {
  public readonly auditType?: string;
  public readonly complianceFramework?: string;
  public readonly missingDocuments?: string[];

  constructor(
    message: string,
    errorCode: string = 'AUDIT_COMPLIANCE_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, details, correlationId);
    
    this.auditType = details?.auditType;
    this.complianceFramework = details?.complianceFramework;
    this.missingDocuments = details?.missingDocuments;
  }

  /**
   * Gets audit preparation checklist
   */
  public getAuditPreparationChecklist(): string[] {
    const checklist: string[] = [];
    
    if (this.missingDocuments) {
      this.missingDocuments.forEach(document => {
        switch (document) {
          case 'EMPLOYMENT_CONTRACTS':
            checklist.push('Gather all signed employment contracts');
            checklist.push('Verify contract terms are up to date');
            break;
          case 'PAYROLL_RECORDS':
            checklist.push('Compile payroll records for audit period');
            checklist.push('Ensure all calculations are documented');
            break;
          case 'TRAINING_CERTIFICATES':
            checklist.push('Collect all training certificates');
            checklist.push('Verify training compliance status');
            break;
          case 'PERFORMANCE_REVIEWS':
            checklist.push('Organize performance review documentation');
            checklist.push('Ensure all reviews are signed and dated');
            break;
        }
      });
    }
    
    return checklist;
  }
}

/**
 * System integration errors for HR & Payroll
 */
export class HRSystemIntegrationError extends HRPayrollBaseError {
  public readonly systemName?: string;
  public readonly integrationPoint?: string;
  public readonly retryable?: boolean;

  constructor(
    message: string,
    errorCode: string = 'HR_SYSTEM_INTEGRATION_ERROR',
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, errorCode, HttpStatus.BAD_GATEWAY, details, correlationId);
    
    this.systemName = details?.systemName;
    this.integrationPoint = details?.integrationPoint;
    this.retryable = details?.retryable || false;
  }

  /**
   * Gets integration recovery steps
   */
  public getIntegrationRecoverySteps(): string[] {
    const steps: string[] = [];
    
    switch (this.systemName) {
      case 'HMRC_GATEWAY':
        steps.push('Check HMRC service status');
        steps.push('Verify authentication credentials');
        steps.push('Retry submission after service recovery');
        break;
      case 'PENSION_PROVIDER':
        steps.push('Contact pension provider support');
        steps.push('Verify contribution calculations');
        steps.push('Submit manual backup if required');
        break;
      case 'BANKING_SYSTEM':
        steps.push('Verify bank account details');
        steps.push('Check payment processing status');
        steps.push('Use alternative payment method if needed');
        break;
    }
    
    return steps;
  }
}

/**
 * Utility function to create standardized error responses
 */
export function createHRErrorResponse(
  error: HRPayrollBaseError,
  includeStackTrace: boolean = false
): Record<string, any> {
  const response = error.sanitizeForClient();
  
  if (includeStackTrace && process.env.NODE_ENV === 'development') {
    response.stackTrace = error.stack;
  }
  
  return response;
}

/**
 * Utility function to determine if an error is retryable
 */
export function isRetryableHRError(error: HRPayrollBaseError): boolean {
  const retryableErrorCodes = [
    'PAYROLL_DATABASE_TIMEOUT',
    'PAYROLL_EXTERNAL_SERVICE_UNAVAILABLE',
    'HMRC_SERVICE_TEMPORARILY_UNAVAILABLE',
    'PENSION_PROVIDER_TIMEOUT',
    'BANKING_SYSTEM_TIMEOUT'
  ];
  
  return retryableErrorCodes.includes(error.errorCode);
}

/**
 * Utility function to get error severity level
 */
export function getHRErrorSeverity(error: HRPayrollBaseError): 'low' | 'medium' | 'high' | 'critical' {
  const criticalErrors = [
    'PAYROLL_CALCULATION_CRITICAL_ERROR',
    'TAX_CALCULATION_CRITICAL_ERROR',
    'DATA_PROTECTION_BREACH',
    'EMPLOYMENT_LAW_CRITICAL_VIOLATION'
  ];
  
  const highErrors = [
    'PAYROLL_PROCESSING_ERROR',
    'HMRC_SUBMISSION_ERROR',
    'PENSION_CALCULATION_ERROR'
  ];
  
  const mediumErrors = [
    'TRAINING_COMPLIANCE_ERROR',
    'SHIFT_SCHEDULING_ERROR',
    'PERFORMANCE_REVIEW_ERROR'
  ];
  
  if (criticalErrors.includes(error.errorCode)) return 'critical';
  if (highErrors.includes(error.errorCode)) return 'high';
  if (mediumErrors.includes(error.errorCode)) return 'medium';
  
  return 'low';
}