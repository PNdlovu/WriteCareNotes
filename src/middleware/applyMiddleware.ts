/**
 * @fileoverview apply Middleware
 * @module ApplyMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description apply Middleware
 */

import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { 
  CSRFMiddleware,
  InputSanitizationMiddleware,
  SecurityHeadersMiddleware,
  RateLimitingMiddleware,
  CorrelationIdMiddleware,
  AuditMiddleware,
  ValidationMiddleware
} from './index';

/**
 * Apply comprehensive middleware to Express router
 */
export class MiddlewareApplier {
  /**
   * Apply production middleware stack to router
   */
  static applyProductionStack(router: Router): void {
    // Correlation ID (must be first)
    router.use(CorrelationIdMiddleware.addCorrelationId);
    
    // Security Headers
    router.use(SecurityHeadersMiddleware.addSecurityHeaders);
    router.use(SecurityHeadersMiddleware.addCORSHeaders);
    router.use(SecurityHeadersMiddleware.addAPISecurityHeaders);
    
    // Rate Limiting
    router.use(RateLimitingMiddleware.generalAPILimit);
    
    // Input Sanitization
    router.use(InputSanitizationMiddleware.sanitizeAll);
    
    // CSRF Protection
    router.use(CSRFMiddleware.generateTokenMiddleware);
    
    // Audit Logging
    router.use(AuditMiddleware.logRequest);
  }

  /**
   * Apply healthcare-specific middleware
   */
  static applyHealthcareStack(router: Router): void {
    this.applyProductionStack(router);
    
    // Additional healthcare-specific middleware
    router.use(RateLimitingMiddleware.healthcareLimit);
    router.use(InputSanitizationMiddleware.sanitizeHealthcareData);
    router.use(AuditMiddleware.logHealthcareAction);
  }

  /**
   * Apply authentication middleware
   */
  static applyAuthStack(router: Router): void {
    router.use(CorrelationIdMiddleware.addCorrelationId);
    router.use(SecurityHeadersMiddleware.addSecurityHeaders);
    router.use(RateLimitingMiddleware.authLimit);
    router.use(InputSanitizationMiddleware.sanitizeAll);
    router.use(AuditMiddleware.logRequest);
  }

  /**
   * Apply file upload middleware
   */
  static applyUploadStack(router: Router): void {
    router.use(CorrelationIdMiddleware.addCorrelationId);
    router.use(SecurityHeadersMiddleware.addSecurityHeaders);
    router.use(RateLimitingMiddleware.uploadLimit);
    router.use(CSRFMiddleware.validateTokenMiddleware);
    router.use(AuditMiddleware.logRequest);
  }

  /**
   * Apply emergency/on-call middleware
   */
  static applyEmergencyStack(router: Router): void {
    this.applyProductionStack(router);
    router.use(RateLimitingMiddleware.emergencyLimit);
  }

  /**
   * Apply medication-specific middleware
   */
  static applyMedicationStack(router: Router): void {
    this.applyProductionStack(router);
    router.use(RateLimitingMiddleware.medicationLimit);
  }
}

export default MiddlewareApplier;