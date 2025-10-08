/**
 * @fileoverview index
 * @module Index
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description index
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * Middleware Integration
 * Comprehensive security and operational middleware stack
 */

// Security Middleware
export { default as CSRFMiddleware } from './csrf';
export { default as InputSanitizationMiddleware } from './inputSanitization';
export { default as SecurityHeadersMiddleware } from './securityHeaders';
export { RateLimitingMiddleware } from './rateLimiting';

// Operational Middleware
export { default as CorrelationIdMiddleware } from './correlationId';
export { default as AuditMiddleware, AuditLogger } from './auditLogger';
export { ValidationMiddleware } from './validationMiddleware';

// Error Handling
export { ErrorHandler, CustomError } from '../utils/errorHandler';
export { ErrorCode, ErrorCodeHelper, HTTPStatusCode } from '../utils/errorCodes';

/**
 * Complete middleware stack for production use
 */
export const productionMiddlewareStack = [
  // 1. Correlation ID (must be first)
  'CorrelationIdMiddleware.addCorrelationId',
  
  // 2. Security Headers
  'SecurityHeadersMiddleware.addSecurityHeaders',
  'SecurityHeadersMiddleware.addCORSHeaders',
  'SecurityHeadersMiddleware.addAPISecurityHeaders',
  
  // 3. Rate Limiting
  'RateLimitingMiddleware.generalAPILimit',
  
  // 4. Input Sanitization
  'InputSanitizationMiddleware.sanitizeAll',
  
  // 5. CSRF Protection (for state-changing operations)
  'CSRFMiddleware.generateTokenMiddleware',
  
  // 6. Audit Logging
  'AuditMiddleware.logRequest'
];

/**
 * Healthcare-specific middleware stack
 */
export const healthcareMiddlewareStack = [
  ...productionMiddlewareStack,
  'RateLimitingMiddleware.healthcareLimit',
  'InputSanitizationMiddleware.sanitizeHealthcareData',
  'AuditMiddleware.logHealthcareAction'
];

/**
 * Authentication middleware stack
 */
export const authMiddlewareStack = [
  'CorrelationIdMiddleware.addCorrelationId',
  'SecurityHeadersMiddleware.addSecurityHeaders',
  'RateLimitingMiddleware.authLimit',
  'InputSanitizationMiddleware.sanitizeAll',
  'AuditMiddleware.logRequest'
];

/**
 * File upload middleware stack
 */
export const uploadMiddlewareStack = [
  'CorrelationIdMiddleware.addCorrelationId',
  'SecurityHeadersMiddleware.addSecurityHeaders',
  'RateLimitingMiddleware.uploadLimit',
  'CSRFMiddleware.validateTokenMiddleware',
  'AuditMiddleware.logRequest'
];