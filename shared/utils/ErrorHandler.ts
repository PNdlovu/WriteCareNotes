export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMIT_EXCEEDED';
      case 500: return 'INTERNAL_SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return 'UNKNOWN_ERROR';
    }
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        message: this.message,
        statusCode: this.statusCode,
        code: this.code,
        details: this.details,
        timestamp: this.timestamp,
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
      }
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'INSUFFICIENT_PERMISSIONS');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 409, 'RESOURCE_CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApiError {
  public readonly service: string;

  constructor(service: string, message: string, statusCode: number = 502) {
    super(`${service} service error: ${message}`, statusCode, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

export class CareHomeError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'CARE_HOME_ERROR', details);
    this.name = 'CareHomeError';
  }
}

export class ResidentError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'RESIDENT_ERROR', details);
    this.name = 'ResidentError';
  }
}

export class MedicationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'MEDICATION_ERROR', details);
    this.name = 'MedicationError';
  }
}

// UK-specific errors
export class NHSNumberError extends ValidationError {
  constructor(nhsNumber?: string) {
    super(
      'Invalid NHS number format',
      { nhsNumber, format: 'Must be 10 digits with valid checksum' }
    );
    this.name = 'NHSNumberError';
  }
}

export class PostcodeError extends ValidationError {
  constructor(postcode?: string) {
    super(
      'Invalid UK postcode format',
      { postcode, format: 'Must be valid UK postcode format (e.g., SW1A 1AA)' }
    );
    this.name = 'PostcodeError';
  }
}

export class CQCRegistrationError extends ValidationError {
  constructor(registrationNumber?: string) {
    super(
      'Invalid CQC registration number',
      { registrationNumber, format: 'Must be valid CQC provider or location ID' }
    );
    this.name = 'CQCRegistrationError';
  }
}

// Utility functions for error handling
export function isApiError(error: any): error is ApiError {
  return error instanceof ApiError;
}

export function createErrorResponse(error: Error | ApiError): any {
  if (isApiError(error)) {
    return error.toJSON();
  }

  // Handle standard errors
  return {
    error: {
      name: 'InternalServerError',
      message: process.env.NODE_ENV === 'production' 
        ? 'An internal server error occurred' 
        : error.message,
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  };
}

export function getErrorStatusCode(error: Error | ApiError): number {
  if (isApiError(error)) {
    return error.statusCode;
  }
  return 500;
}

// Error codes enum for consistency
export enum ErrorCodes {
  // Generic errors
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',

  // Authentication & Authorization
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DUPLICATE_RECORD = 'DUPLICATE_RECORD',

  // Business logic errors
  CARE_HOME_ERROR = 'CARE_HOME_ERROR',
  RESIDENT_ERROR = 'RESIDENT_ERROR',
  MEDICATION_ERROR = 'MEDICATION_ERROR',
  STAFF_ERROR = 'STAFF_ERROR',

  // External service errors
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NHS_SERVICE_ERROR = 'NHS_SERVICE_ERROR',
  CQC_SERVICE_ERROR = 'CQC_SERVICE_ERROR',

  // UK-specific validation errors
  INVALID_NHS_NUMBER = 'INVALID_NHS_NUMBER',
  INVALID_POSTCODE = 'INVALID_POSTCODE',
  INVALID_CQC_REGISTRATION = 'INVALID_CQC_REGISTRATION'
}

// Helper function to create common errors
export const createError = {
  badRequest: (message: string, details?: any) => new ApiError(message, 400, ErrorCodes.BAD_REQUEST, details),
  unauthorized: (message?: string) => new AuthenticationError(message),
  forbidden: (message?: string) => new AuthorizationError(message),
  notFound: (resource?: string) => new NotFoundError(resource),
  conflict: (message: string, details?: any) => new ConflictError(message, details),
  validation: (message: string, details?: any) => new ValidationError(message, details),
  rateLimit: (message?: string) => new RateLimitError(message),
  internal: (message: string, details?: any) => new ApiError(message, 500, ErrorCodes.INTERNAL_SERVER_ERROR, details),
  database: (message: string, details?: any) => new DatabaseError(message, details),
  external: (service: string, message: string, statusCode?: number) => new ExternalServiceError(service, message, statusCode),
  careHome: (message: string, details?: any) => new CareHomeError(message, details),
  resident: (message: string, details?: any) => new ResidentError(message, details),
  medication: (message: string, details?: any) => new MedicationError(message, details),
  nhsNumber: (nhsNumber?: string) => new NHSNumberError(nhsNumber),
  postcode: (postcode?: string) => new PostcodeError(postcode),
  cqcRegistration: (registrationNumber?: string) => new CQCRegistrationError(registrationNumber)
};