import { EventEmitter2 } from "eventemitter2";

/**
 * Standardized Error Codes and HTTP Status Mapping
 * Provides consistent error handling across the application
 */

export enum ErrorCode {
  // Authentication & Authorization (1000-1999)
  AUTH_TOKEN_MISSING = 'AUTH_TOKEN_MISSING',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_USER_NOT_FOUND = 'AUTH_USER_NOT_FOUND',
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_DISABLED = 'AUTH_ACCOUNT_DISABLED',

  // Validation Errors (2000-2999)
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_INVALID_RANGE = 'VALIDATION_INVALID_RANGE',
  VALIDATION_INVALID_TYPE = 'VALIDATION_INVALID_TYPE',
  VALIDATION_DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',
  VALIDATION_INVALID_EMAIL = 'VALIDATION_INVALID_EMAIL',
  VALIDATION_INVALID_PHONE = 'VALIDATION_INVALID_PHONE',
  VALIDATION_INVALID_DATE = 'VALIDATION_INVALID_DATE',

  // Business Logic Errors (3000-3999)
  BUSINESS_RESOURCE_NOT_FOUND = 'BUSINESS_RESOURCE_NOT_FOUND',
  BUSINESS_RESOURCE_ALREADY_EXISTS = 'BUSINESS_RESOURCE_ALREADY_EXISTS',
  BUSINESS_INVALID_OPERATION = 'BUSINESS_INVALID_OPERATION',
  BUSINESS_CONSTRAINT_VIOLATION = 'BUSINESS_CONSTRAINT_VIOLATION',
  BUSINESS_INSUFFICIENT_DATA = 'BUSINESS_INSUFFICIENT_DATA',
  BUSINESS_WORKFLOW_VIOLATION = 'BUSINESS_WORKFLOW_VIOLATION',

  // Healthcare Specific Errors (4000-4999)
  HEALTHCARE_PATIENT_NOT_FOUND = 'HEALTHCARE_PATIENT_NOT_FOUND',
  HEALTHCARE_MEDICATION_NOT_FOUND = 'HEALTHCARE_MEDICATION_NOT_FOUND',
  HEALTHCARE_PRESCRIPTION_INVALID = 'HEALTHCARE_PRESCRIPTION_INVALID',
  HEALTHCARE_DOSAGE_INVALID = 'HEALTHCARE_DOSAGE_INVALID',
  HEALTHCARE_INTERACTION_DETECTED = 'HEALTHCARE_INTERACTION_DETECTED',
  HEALTHCARE_ALLERGY_DETECTED = 'HEALTHCARE_ALLERGY_DETECTED',
  HEALTHCARE_CONSENT_REQUIRED = 'HEALTHCARE_CONSENT_REQUIRED',
  HEALTHCARE_AUDIT_REQUIRED = 'HEALTHCARE_AUDIT_REQUIRED',

  // External Service Errors (5000-5999)
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_INVALID_RESPONSE = 'EXTERNAL_SERVICE_INVALID_RESPONSE',
  EXTERNAL_SERVICE_AUTH_FAILED = 'EXTERNAL_SERVICE_AUTH_FAILED',
  EXTERNAL_SERVICE_RATE_LIMITED = 'EXTERNAL_SERVICE_RATE_LIMITED',

  // Security Errors (6000-6999)
  SECURITY_CSRF_TOKEN_MISSING = 'SECURITY_CSRF_TOKEN_MISSING',
  SECURITY_CSRF_TOKEN_INVALID = 'SECURITY_CSRF_TOKEN_INVALID',
  SECURITY_RATE_LIMIT_EXCEEDED = 'SECURITY_RATE_LIMIT_EXCEEDED',
  SECURITY_SUSPICIOUS_ACTIVITY = 'SECURITY_SUSPICIOUS_ACTIVITY',
  SECURITY_INVALID_INPUT = 'SECURITY_INVALID_INPUT',

  // System Errors (7000-7999)
  SYSTEM_DATABASE_ERROR = 'SYSTEM_DATABASE_ERROR',
  SYSTEM_CACHE_ERROR = 'SYSTEM_CACHE_ERROR',
  SYSTEM_FILE_SYSTEM_ERROR = 'SYSTEM_FILE_SYSTEM_ERROR',
  SYSTEM_NETWORK_ERROR = 'SYSTEM_NETWORK_ERROR',
  SYSTEM_MEMORY_ERROR = 'SYSTEM_MEMORY_ERROR',
  SYSTEM_CPU_ERROR = 'SYSTEM_CPU_ERROR',

  // Compliance Errors (8000-8999)
  COMPLIANCE_GDPR_VIOLATION = 'COMPLIANCE_GDPR_VIOLATION',
  COMPLIANCE_AUDIT_TRAIL_MISSING = 'COMPLIANCE_AUDIT_TRAIL_MISSING',
  COMPLIANCE_CONSENT_EXPIRED = 'COMPLIANCE_CONSENT_EXPIRED',
  COMPLIANCE_DATA_RETENTION_VIOLATION = 'COMPLIANCE_DATA_RETENTION_VIOLATION',

  // Generic Errors (9000-9999)
  GENERIC_INTERNAL_ERROR = 'GENERIC_INTERNAL_ERROR',
  GENERIC_NOT_IMPLEMENTED = 'GENERIC_NOT_IMPLEMENTED',
  GENERIC_BAD_REQUEST = 'GENERIC_BAD_REQUEST',
  GENERIC_NOT_FOUND = 'GENERIC_NOT_FOUND',
  GENERIC_CONFLICT = 'GENERIC_CONFLICT',
  GENERIC_UNPROCESSABLE_ENTITY = 'GENERIC_UNPROCESSABLE_ENTITY'
}

export enum HTTPStatusCode {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

export interface ErrorMapping {
  code: ErrorCode;
  statusCode: HTTPStatusCode;
  message: string;
  description: string;
  category: string;
}

/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const ERROR_MAPPINGS: Partial<Record<ErrorCode, ErrorMapping>> = {
  // Authentication & Authorization
  [ErrorCode.AUTH_TOKEN_MISSING]: {
    code: ErrorCode.AUTH_TOKEN_MISSING,
    statusCode: HTTPStatusCode.UNAUTHORIZED,
    message: 'Authentication token is required',
    description: 'The request is missing a valid authentication token',
    category: 'Authentication'
  },
  [ErrorCode.AUTH_TOKEN_INVALID]: {
    code: ErrorCode.AUTH_TOKEN_INVALID,
    statusCode: HTTPStatusCode.UNAUTHORIZED,
    message: 'Invalid authentication token',
    description: 'The provided authentication token is invalid or malformed',
    category: 'Authentication'
  },
  [ErrorCode.AUTH_TOKEN_EXPIRED]: {
    code: ErrorCode.AUTH_TOKEN_EXPIRED,
    statusCode: HTTPStatusCode.UNAUTHORIZED,
    message: 'Authentication token has expired',
    description: 'The authentication token has expired and needs to be refreshed',
    category: 'Authentication'
  },
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: {
    code: ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS,
    statusCode: HTTPStatusCode.FORBIDDEN,
    message: 'Insufficient permissions',
    description: 'The user does not have sufficient permissions to perform this action',
    category: 'Authorization'
  },

  // Validation Errors
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: {
    code: ErrorCode.VALIDATION_REQUIRED_FIELD,
    statusCode: HTTPStatusCode.BAD_REQUEST,
    message: 'Required field is missing',
    description: 'A required field is missing from the request',
    category: 'Validation'
  },
  [ErrorCode.VALIDATION_INVALID_FORMAT]: {
    code: ErrorCode.VALIDATION_INVALID_FORMAT,
    statusCode: HTTPStatusCode.BAD_REQUEST,
    message: 'Invalid field format',
    description: 'The field format is invalid or does not match the expected pattern',
    category: 'Validation'
  },

  // Healthcare Specific
  [ErrorCode.HEALTHCARE_PATIENT_NOT_FOUND]: {
    code: ErrorCode.HEALTHCARE_PATIENT_NOT_FOUND,
    statusCode: HTTPStatusCode.NOT_FOUND,
    message: 'Patient not found',
    description: 'The requested patient record could not be found',
    category: 'Healthcare'
  },
  [ErrorCode.HEALTHCARE_MEDICATION_NOT_FOUND]: {
    code: ErrorCode.HEALTHCARE_MEDICATION_NOT_FOUND,
    statusCode: HTTPStatusCode.NOT_FOUND,
    message: 'Medication not found',
    description: 'The requested medication could not be found',
    category: 'Healthcare'
  },

  // Security Errors
  [ErrorCode.SECURITY_CSRF_TOKEN_MISSING]: {
    code: ErrorCode.SECURITY_CSRF_TOKEN_MISSING,
    statusCode: HTTPStatusCode.FORBIDDEN,
    message: 'CSRF token is required',
    description: 'CSRF token is required for this operation',
    category: 'Security'
  },
  [ErrorCode.SECURITY_RATE_LIMIT_EXCEEDED]: {
    code: ErrorCode.SECURITY_RATE_LIMIT_EXCEEDED,
    statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
    message: 'Rate limit exceeded',
    description: 'Too many requests, please try again later',
    category: 'Security'
  },

  // System Errors
  [ErrorCode.SYSTEM_DATABASE_ERROR]: {
    code: ErrorCode.SYSTEM_DATABASE_ERROR,
    statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    message: 'Database error',
    description: 'An error occurred while accessing the database',
    category: 'System'
  },

  // Generic Errors
  [ErrorCode.GENERIC_INTERNAL_ERROR]: {
    code: ErrorCode.GENERIC_INTERNAL_ERROR,
    statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    description: 'An unexpected error occurred on the server',
    category: 'Generic'
  },
  [ErrorCode.GENERIC_BAD_REQUEST]: {
    code: ErrorCode.GENERIC_BAD_REQUEST,
    statusCode: HTTPStatusCode.BAD_REQUEST,
    message: 'Bad request',
    description: 'The request is malformed or contains invalid data',
    category: 'Generic'
  },
  [ErrorCode.GENERIC_NOT_FOUND]: {
    code: ErrorCode.GENERIC_NOT_FOUND,
    statusCode: HTTPStatusCode.NOT_FOUND,
    message: 'Resource not found',
    description: 'The requested resource could not be found',
    category: 'Generic'
  }
};

export class ErrorCodeHelper {
  /**
   * Get error mapping by code
   */
  static getErrorMapping(code: ErrorCode): ErrorMapping | undefined {
    return ERROR_MAPPINGS[code];
  }

  /**
   * Get HTTP status code by error code
   */
  static getStatusCode(code: ErrorCode): HTTPStatusCode {
    return ERROR_MAPPINGS[code]?.statusCode || HTTPStatusCode.INTERNAL_SERVER_ERROR;
  }

  /**
   * Get error message by code
   */
  static getMessage(code: ErrorCode): string {
    return ERROR_MAPPINGS[code]?.message || 'Unknown error';
  }

  /**
   * Check if error code exists
   */
  static isValidErrorCode(code: string): code is ErrorCode {
    return Object.values(ErrorCode).includes(code as ErrorCode);
  }
}
