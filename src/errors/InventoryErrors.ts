/**
 * @fileoverview Inventory & Supply Chain Error Definitions for WriteCareNotes
 * @module InventoryErrors
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive error classes for inventory and supply chain management operations
 * providing detailed error information for stock management, purchase orders, suppliers,
 * asset tracking, and compliance violations with healthcare-specific error handling.
 * 
 * @compliance
 * - MHRA (Medicines and Healthcare products Regulatory Agency) error reporting
 * - CQC (Care Quality Commission) compliance violation tracking
 * - NHS Supply Chain error standards
 * - GDPR data protection error handling
 * - Healthcare audit trail error requirements
 */

/**
 * Base class for all inventory-related errors
 */
export class InventoryError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly correlationId?: string;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
    this.correlationId = correlationId;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      correlationId: this.correlationId,
      stack: this.stack
    };
  }
}

/**
 * Error thrown when inventory validation fails
 */
export class InventoryValidationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 400, details, correlationId);
  }
}

/**
 * Error thrown when inventory item is not found
 */
export class InventoryNotFoundError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 404, details, correlationId);
  }
}

/**
 * Error thrown when supplier is not found or inactive
 */
export class SupplierNotFoundError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 404, details, correlationId);
  }
}

/**
 * Error thrown when there is insufficient stock for an operation
 */
export class StockInsufficientError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 409, details, correlationId);
  }
}

/**
 * Error thrown when purchase order operations fail
 */
export class PurchaseOrderError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 422, details, correlationId);
  }
}

/**
 * Error thrown when asset tracking operations fail
 */
export class AssetTrackingError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 422, details, correlationId);
  }
}

/**
 * Error thrown when compliance violations are detected
 */
export class ComplianceViolationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 422, details, correlationId);
  }
}

/**
 * Error thrown when database operations fail
 */
export class DatabaseOperationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 500, details, correlationId);
  }
}

/**
 * Error thrown when external service integrations fail
 */
export class ExternalServiceError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 503, details, correlationId);
  }
}

/**
 * Error thrown when authorization fails for inventory operations
 */
export class InventoryAuthorizationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 403, details, correlationId);
  }
}

/**
 * Error thrown when rate limits are exceeded
 */
export class InventoryRateLimitError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 429, details, correlationId);
  }
}

/**
 * Error thrown when business rules are violated
 */
export class BusinessRuleViolationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 422, details, correlationId);
  }
}

/**
 * Error thrown when data encryption/decryption fails
 */
export class EncryptionError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 500, details, correlationId);
  }
}

/**
 * Error thrown when audit trail operations fail
 */
export class AuditTrailError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 500, details, correlationId);
  }
}

/**
 * Error thrown when notification operations fail
 */
export class NotificationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 500, details, correlationId);
  }
}

/**
 * Error thrown when report generation fails
 */
export class ReportGenerationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 500, details, correlationId);
  }
}

/**
 * Error thrown when cache operations fail
 */
export class CacheOperationError extends InventoryError {
  constructor(
    message: string,
    code: string,
    details?: Record<string, any>,
    correlationId?: string
  ) {
    super(message, code, 500, details, correlationId);
  }
}

// Error code constants for consistent error handling
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
export const INVENTORY_ERROR_CODES = {
  // Validation errors
  INVALID_ITEM_CODE: 'INVALID_ITEM_CODE',
  INVALID_ITEM_NAME: 'INVALID_ITEM_NAME',
  INVALID_CATEGORY: 'INVALID_CATEGORY',
  INVALID_UNIT_COST: 'INVALID_UNIT_COST',
  INVALID_INITIAL_STOCK: 'INVALID_INITIAL_STOCK',
  INVALID_QUANTITY: 'INVALID_QUANTITY',
  DUPLICATE_ITEM_CODE: 'DUPLICATE_ITEM_CODE',
  DUPLICATE_SUPPLIER: 'DUPLICATE_SUPPLIER',

  // Not found errors
  INVENTORY_ITEM_NOT_FOUND: 'INVENTORY_ITEM_NOT_FOUND',
  SUPPLIER_NOT_FOUND: 'SUPPLIER_NOT_FOUND',
  SUPPLIER_NOT_ACTIVE: 'SUPPLIER_NOT_ACTIVE',
  PURCHASE_ORDER_NOT_FOUND: 'PURCHASE_ORDER_NOT_FOUND',
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',

  // Stock errors
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  STOCK_MOVEMENT_FAILED: 'STOCK_MOVEMENT_FAILED',
  STOCK_LEVELS_FAILED: 'STOCK_LEVELS_FAILED',
  STOCK_VALUE_FAILED: 'STOCK_VALUE_FAILED',

  // Purchase order errors
  PURCHASE_ORDER_CREATION_FAILED: 'PURCHASE_ORDER_CREATION_FAILED',
  PURCHASE_ORDER_APPROVAL_FAILED: 'PURCHASE_ORDER_APPROVAL_FAILED',
  PURCHASE_ORDER_CANCELLATION_FAILED: 'PURCHASE_ORDER_CANCELLATION_FAILED',

  // Supplier errors
  SUPPLIER_CREATION_FAILED: 'SUPPLIER_CREATION_FAILED',
  SUPPLIER_UPDATE_FAILED: 'SUPPLIER_UPDATE_FAILED',
  SUPPLIER_VALIDATION_FAILED: 'SUPPLIER_VALIDATION_FAILED',

  // Compliance errors
  MHRA_LICENSE_REQUIRED: 'MHRA_LICENSE_REQUIRED',
  CONTROLLED_SUBSTANCE_LICENSE_REQUIRED: 'CONTROLLED_SUBSTANCE_LICENSE_REQUIRED',
  HAZARDOUS_HANDLING_REQUIRED: 'HAZARDOUS_HANDLING_REQUIRED',
  COMPLIANCE_VIOLATION_DETECTED: 'COMPLIANCE_VIOLATION_DETECTED',

  // Database errors
  INVENTORY_ITEM_CREATE_FAILED: 'INVENTORY_ITEM_CREATE_FAILED',
  INVENTORY_ITEM_UPDATE_FAILED: 'INVENTORY_ITEM_UPDATE_FAILED',
  INVENTORY_ITEM_GET_FAILED: 'INVENTORY_ITEM_GET_FAILED',
  INVENTORY_ITEM_FIND_FAILED: 'INVENTORY_ITEM_FIND_FAILED',
  STOCK_MOVEMENT_CREATE_FAILED: 'STOCK_MOVEMENT_CREATE_FAILED',
  SUPPLIER_CREATE_FAILED: 'SUPPLIER_CREATE_FAILED',
  SUPPLIER_GET_FAILED: 'SUPPLIER_GET_FAILED',
  STOCK_ALERT_CREATE_FAILED: 'STOCK_ALERT_CREATE_FAILED',

  // Business rule errors
  REORDER_POINT_INVALID: 'REORDER_POINT_INVALID',
  MAX_STOCK_INVALID: 'MAX_STOCK_INVALID',
  ECONOMIC_ORDER_QUANTITY_INVALID: 'ECONOMIC_ORDER_QUANTITY_INVALID',
  LEAD_TIME_INVALID: 'LEAD_TIME_INVALID',

  // External service errors
  NHS_DIGITAL_API_ERROR: 'NHS_DIGITAL_API_ERROR',
  SUPPLIER_API_ERROR: 'SUPPLIER_API_ERROR',
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  EMAIL_SERVICE_ERROR: 'EMAIL_SERVICE_ERROR',

  // Authorization errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CARE_HOME_ACCESS_DENIED: 'CARE_HOME_ACCESS_DENIED',
  SUPPLIER_ACCESS_DENIED: 'SUPPLIER_ACCESS_DENIED',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_QUOTA_EXCEEDED: 'API_QUOTA_EXCEEDED',

  // Encryption errors
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
  KEY_MANAGEMENT_ERROR: 'KEY_MANAGEMENT_ERROR',

  // Audit errors
  AUDIT_LOG_FAILED: 'AUDIT_LOG_FAILED',
  AUDIT_TRAIL_INCOMPLETE: 'AUDIT_TRAIL_INCOMPLETE',

  // Notification errors
  NOTIFICATION_SEND_FAILED: 'NOTIFICATION_SEND_FAILED',
  ALERT_CREATION_FAILED: 'ALERT_CREATION_FAILED',

  // Report errors
  REPORT_GENERATION_FAILED: 'REPORT_GENERATION_FAILED',
  METRICS_CALCULATION_FAILED: 'METRICS_CALCULATION_FAILED',
  INVENTORY_METRICS_GENERATION_FAILED: 'INVENTORY_METRICS_GENERATION_FAILED',

  // Cache errors
  CACHE_READ_FAILED: 'CACHE_READ_FAILED',
  CACHE_WRITE_FAILED: 'CACHE_WRITE_FAILED',
  CACHE_INVALIDATION_FAILED: 'CACHE_INVALIDATION_FAILED'
} as const;

/**
 * Type for inventory error codes
 */
export type InventoryErrorCode = typeof INVENTORY_ERROR_CODES[keyof typeof INVENTORY_ERROR_CODES];

/**
 * Helper function to create standardized error responses
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
/**
 * TODO: Add proper documentation
 */
export function createInventoryErrorResponse(
  error: InventoryError,
  includeStack: boolean = false
): Record<string, any> {
  return {
    success: false,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      timestamp: error.timestamp,
      correlationId: error.correlationId,
      ...(includeStack && { stack: error.stack })
    }
  };
}

/**
 * Helper function to determine if an error is retryable
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
/**
 * TODO: Add proper documentation
 */
export function isRetryableError(error: InventoryError): boolean {
  const retryableCodes = [
    INVENTORY_ERROR_CODES.NHS_DIGITAL_API_ERROR,
    INVENTORY_ERROR_CODES.SUPPLIER_API_ERROR,
    INVENTORY_ERROR_CODES.PAYMENT_GATEWAY_ERROR,
    INVENTORY_ERROR_CODES.EMAIL_SERVICE_ERROR,
    INVENTORY_ERROR_CODES.CACHE_READ_FAILED,
    INVENTORY_ERROR_CODES.CACHE_WRITE_FAILED
  ];

  return retryableCodes.includes(error.code as InventoryErrorCode) || 
         error.statusCode >= 500;
}

/**
 * Helper function to determine error severity for monitoring
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
/**
 * TODO: Add proper documentation
 */
export function getErrorSeverity(error: InventoryError): 'low' | 'medium' | 'high' | 'critical' {
  // Critical errors that require immediate attention
  const criticalCodes = [
    INVENTORY_ERROR_CODES.COMPLIANCE_VIOLATION_DETECTED,
    INVENTORY_ERROR_CODES.MHRA_LICENSE_REQUIRED,
    INVENTORY_ERROR_CODES.CONTROLLED_SUBSTANCE_LICENSE_REQUIRED,
    INVENTORY_ERROR_CODES.AUDIT_TRAIL_INCOMPLETE
  ];

  // High severity errors
  const highSeverityCodes = [
    INVENTORY_ERROR_CODES.INSUFFICIENT_STOCK,
    INVENTORY_ERROR_CODES.PURCHASE_ORDER_CREATION_FAILED,
    INVENTORY_ERROR_CODES.SUPPLIER_CREATION_FAILED
  ];

  // Medium severity errors
  const mediumSeverityCodes = [
    INVENTORY_ERROR_CODES.INVENTORY_ITEM_NOT_FOUND,
    INVENTORY_ERROR_CODES.SUPPLIER_NOT_FOUND,
    INVENTORY_ERROR_CODES.STOCK_MOVEMENT_FAILED
  ];

  if (criticalCodes.includes(error.code as InventoryErrorCode)) {
    return 'critical';
  }

  if (highSeverityCodes.includes(error.code as InventoryErrorCode)) {
    return 'high';
  }

  if (mediumSeverityCodes.includes(error.code as InventoryErrorCode)) {
    return 'medium';
  }

  return 'low';
}