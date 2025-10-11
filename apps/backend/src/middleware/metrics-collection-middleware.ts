/**
 * @fileoverview metrics-collection-middleware
 * @module Metrics-collection-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description metrics-collection-middleware
 */

import { Request, Response, NextFunction } from 'express';
import PrometheusService from '../services/monitoring/PrometheusService';
import StructuredLoggingService from '../services/logging/StructuredLoggingService';

/**
 * Enterprise Metrics Collection Middleware
 * Collects comprehensive metrics for all HTTP requests
 */
export const metricsCollectionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const prometheusService = PrometheusService.getInstance();
  const logger = StructuredLoggingService.getInstance();
  
  // Extract organization ID from headers or JWT token
  const organizationId = req.headers['x-organization-id'] as string || 'default';
  
  // Log request start
  logger.logRequestStart(req);
  
  // Override res.end to capture response metrics
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    const responseSize = res.get('content-length') ? parseInt(res.get('content-length')!) : 0;
    
    // Record Prometheus metrics
    prometheusService.recordRequest(req.method, req.route?.path || req.path, res.statusCode, organizationId);
    prometheusService.recordRequestDuration(req.method, req.route?.path || req.path, res.statusCode, duration / 1000, organizationId);
    
    if (responseSize > 0) {
      prometheusService.recordResponseSize(req.method, req.route?.path || req.path, res.statusCode, responseSize, organizationId);
    }
    
    // Log request completion
    logger.logRequest(req, res, duration);
    
    // Record user activity if user is authenticated
    if (req.headers['x-user-id']) {
      const userId = req.headers['x-user-id'] as string;
      const userType = req.headers['x-user-type'] as string || 'user';
      const module = extractModuleFromPath(req.path);
      
      prometheusService.recordUserActivity(organizationId, userType, req.method, module);
      logger.logUserActivity(userId, req.method, module, organizationId, {
        url: req.url,
        statusCode: res.statusCode,
        duration
      });
    }
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Extract module name from request path for better categorization
 */
function extractModuleFromPath(path: string): string {
  const segments = path.split('/').filter(segment => segment && segment !== 'api');
  
  if (segments.length === 0) return 'root';
  
  // Map common paths to modules
  constmoduleMap: Record<string, string> = {
    'residents': 'resident_management',
    'medications': 'medication_management',
    'care-plans': 'care_planning',
    'incidents': 'incident_management',
    'users': 'user_management',
    'organizations': 'organization_management',
    'reports': 'reporting',
    'analytics': 'analytics',
    'compliance': 'compliance',
    'audit': 'audit',
    'health': 'health_check',
    'auth': 'authentication',
    'admin': 'administration'
  };
  
  const firstSegment = segments[0];
  return moduleMap[firstSegment] || firstSegment;
}

/**
 * Business Metrics Collection Middleware
 * Collects business-specific metrics for healthcare operations
 */
export const businessMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const prometheusService = PrometheusService.getInstance();
  const organizationId = req.headers['x-organization-id'] as string || 'default';
  
  // Track business events based on request path and method
  if (req.path.includes('/residents') && req.method === 'POST') {
    // New resident created
    prometheusService.recordResident(organizationId, 'created', 'unknown');
  } else if (req.path.includes('/medications') && req.method === 'POST') {
    // Medication administered
    prometheusService.recordMedicationAdministration(organizationId, 'unknown', 'administered');
  } else if (req.path.includes('/care-plans') && req.method === 'POST') {
    // Care plan created
    prometheusService.recordCarePlan(organizationId, 'created', 'unknown');
  } else if (req.path.includes('/incidents') && req.method === 'POST') {
    // Incident reported
    prometheusService.recordIncident(organizationId, 'unknown', 'unknown', 'reported');
  }
  
  next();
};

/**
 * System Metrics Collection Middleware
 * Collects system-level metrics
 */
export const systemMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const prometheusService = PrometheusService.getInstance();
  
  // Update system metrics periodically (every 30 seconds)
  const now = Date.now();
  if (!systemMetricsMiddleware.lastUpdate || now - systemMetricsMiddleware.lastUpdate > 30000) {
    prometheusService.collectMetrics();
    systemMetricsMiddleware.lastUpdate = now;
  }
  
  next();
};

// Add static property to track last update
(systemMetricsMiddleware as any).lastUpdate = 0;

/**
 * Error Metrics Collection Middleware
 * Collects error-specific metrics
 */
export const errorMetricsMiddleware = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  const prometheusService = PrometheusService.getInstance();
  const logger = StructuredLoggingService.getInstance();
  const organizationId = req.headers['x-organization-id'] as string || 'default';
  
  // Record error metrics
  prometheusService.recordRequest(req.method, req.route?.path || req.path, res.statusCode, organizationId);
  
  // Log error
  logger.logError(error, req, {
    errorType: error.constructor.name,
    stack: error.stack
  });
  
  // Record security incident if it's a security-related error
  if (error.name.includes('Security') || error.message.includes('unauthorized') || error.message.includes('forbidden')) {
    prometheusService.recordSecurityIncident(organizationId, 'medium', 'authentication_error');
  }
  
  next(error);
};

/**
 * Performance Metrics Collection Middleware
 * Collects performance-specific metrics
 */
export const performanceMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();
  const logger = StructuredLoggingService.getInstance();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // Convert to milliseconds
    
    // Log performance metrics
    logger.logPerformance(`${req.method} ${req.path}`, duration, req.headers['x-organization-id'] as string, {
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent']
    });
  });
  
  next();
};

/**
 * Compliance Metrics Collection Middleware
 * Collects compliance-related metrics
 */
export const complianceMetricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const prometheusService = PrometheusService.getInstance();
  const logger = StructuredLoggingService.getInstance();
  const organizationId = req.headers['x-organization-id'] as string || 'default';
  
  // Track compliance-related requests
  if (req.path.includes('/compliance') || req.path.includes('/audit') || req.path.includes('/gdpr')) {
    logger.logComplianceEvent('compliance_request', 'data_protection', organizationId, 'UK', {
      path: req.path,
      method: req.method,
      userId: req.headers['x-user-id'] as string
    });
  }
  
  // Track data access for audit purposes
  if (req.method === 'GET' && (req.path.includes('/residents') || req.path.includes('/medications'))) {
    logger.logAuditEvent('data_access', 'healthcare_data', req.path, req.headers['x-user-id'] as string || 'anonymous', organizationId, {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
  }
  
  next();
};

export default {
  metricsCollectionMiddleware,
  businessMetricsMiddleware,
  systemMetricsMiddleware,
  errorMetricsMiddleware,
  performanceMetricsMiddleware,
  complianceMetricsMiddleware
};
