/**
 * @fileoverview audit logger
 * @module AuditLogger
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description audit logger
 */

import { EventEmitter2 } from "eventemitter2";

import { Request, Response, NextFunction } from 'express';
import { CorrelationIdMiddleware } from './correlationId';

export interface AuditLogEntry {
  correlationId: string;
  timestamp: string;
  userId?: string;
  userRole?: string;
  action: string;
  resource: string;
  method: string;
  path: string;
  statusCode: number;
  ipAddress: string;
  userAgent: string;
  requestBody?: any;
  responseBody?: any;
  duration: number;
  tenantId?: string;
  metadata?: any;
}

export class AuditLogger {
  private staticauditLogs: AuditLogEntry[] = [];
  private staticmaxLogs = 10000; // Keep last 10k audit logs in memory

  /**
   * Log audit entry
   */
  static log(entry: AuditLogEntry): void {
    // Add to in-memory store
    this.auditLogs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.auditLogs.length > this.maxLogs) {
      this.auditLogs = this.auditLogs.slice(-this.maxLogs);
    }
    
    // Log to console (in production, this would go to a proper audit log service)
    console.log('AUDIT_LOG:', JSON.stringify(entry, null, 2));
    
    // In a real implementation, this wouldalso:
    // - Write to a secure audit log file
    // - Send to an audit service
    // - Store in a tamper-evident database
  }

  /**
   * Create audit log entry from request/response
   */
  static createAuditEntry(
    req: Request,
    res: Response,
    startTime: number,
    additionalData?: any
  ): AuditLogEntry {
    const correlationId = CorrelationIdMiddleware.getCorrelationId(req);
    const user = (req as any).user;
    
    return {
      correlationId,
      timestamp: new Date().toISOString(),
      userId: user?.id,
      userRole: user?.role,
      action: this.determineAction(req),
      resource: this.determineResource(req),
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      requestBody: this.sanitizeRequestBody(req.body),
      responseBody: this.sanitizeResponseBody(res.locals['responseBody']),
      duration: Date.now() - startTime,
      tenantId: (req as any).tenantId,
      metadata: additionalData
    };
  }

  /**
   * Determine action from request
   */
  private static determineAction(req: Request): string {
    const method = req.method;
    const path = req.path;
    
    if (method === 'GET') {
      if (path.includes('/analytics')) return 'VIEW_ANALYTICS';
      if (path.includes('/health')) return 'HEALTH_CHECK';
      return 'VIEW';
    }
    
    if (method === 'POST') {
      if (path.includes('/auth')) return 'AUTHENTICATE';
      if (path.includes('/medication')) return 'ADMINISTER_MEDICATION';
      if (path.includes('/care')) return 'PROVIDE_CARE';
      if (path.includes('/consent')) return 'MANAGE_CONSENT';
      return 'CREATE';
    }
    
    if (method === 'PUT') {
      if (path.includes('/medication')) return 'UPDATE_MEDICATION';
      if (path.includes('/care')) return 'UPDATE_CARE';
      return 'UPDATE';
    }
    
    if (method === 'DELETE') {
      return 'DELETE';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Determine resource from request
   */
  private static determineResource(req: Request): string {
    const path = req.path;
    
    if (path.includes('/medication')) return 'MEDICATION';
    if (path.includes('/care')) return 'CARE_RECORD';
    if (path.includes('/resident')) return 'RESIDENT';
    if (path.includes('/staff')) return 'STAFF';
    if (path.includes('/consent')) return 'CONSENT';
    if (path.includes('/audit')) return 'AUDIT_LOG';
    if (path.includes('/health')) return 'SYSTEM_HEALTH';
    
    return 'UNKNOWN';
  }

  /**
   * Sanitize request body for audit logging
   */
  private static sanitizeRequestBody(body: any): any {
    if (!body) return undefined;
    
    const sanitized = { ...body };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'nhsNumber'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    // Limit size
    const bodyStr = JSON.stringify(sanitized);
    if (bodyStr.length > 1000) {
      return { ...sanitized, _truncated: true, _originalSize: bodyStr.length };
    }
    
    return sanitized;
  }

  /**
   * Sanitize response body for audit logging
   */
  private static sanitizeResponseBody(body: any): any {
    if (!body) return undefined;
    
    // Only log response for errors or specific operations
    if (typeof body === 'object' && body.error) {
      return {
        error: body.error,
        success: body.success
      };
    }
    
    return undefined;
  }

  /**
   * Get audit logs for a specific correlation ID
   */
  static getLogsByCorrelationId(correlationId: string): AuditLogEntry[] {
    return this.auditLogs.filter(log => log.correlationId === correlationId);
  }

  /**
   * Get audit logs for a specific user
   */
  static getLogsByUserId(userId: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Get audit logs for a specific action
   */
  static getLogsByAction(action: string, limit: number = 100): AuditLogEntry[] {
    return this.auditLogs
      .filter(log => log.action === action)
      .slice(-limit);
  }

  /**
   * Get all audit logs (for admin purposes)
   */
  static getAllLogs(limit: number = 1000): AuditLogEntry[] {
    return this.auditLogs.slice(-limit);
  }
}

/**
 * Audit logging middleware
 */
export class AuditMiddleware {
  /**
   * Middleware to log all requests
   */
  static logRequest(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override response methods to capture response body
    res.send = function(body: any) {
      res.locals['responseBody'] = body;
      return originalSend.call(this, body);
    };
    
    res.json = function(body: any) {
      res.locals['responseBody'] = body;
      return originalJson.call(this, body);
    };
    
    // Log when response finishes
    res.on('finish', () => {
      const auditEntry = AuditLogger.createAuditEntry(req, res, startTime);
      AuditLogger.log(auditEntry);
    });
    
    next();
  }

  /**
   * Middleware to log specific actions
   */
  static logAction(action: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();
      
      // Store action in request for later use
      (req as any).auditAction = action;
      
      res.on('finish', () => {
        const auditEntry = AuditLogger.createAuditEntry(req, res, startTime, {
          customAction: action
        });
        AuditLogger.log(auditEntry);
      });
      
      next();
    };
  }

  /**
   * Middleware to log healthcare-specific actions
   */
  static logHealthcareAction(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const auditEntry = AuditLogger.createAuditEntry(req, res, startTime, {
        healthcareAction: true,
        patientId: req.body?.patientId || req.params?.['patientId'],
        medicationId: req.body?.medicationId || req.params?.['medicationId']
      });
      AuditLogger.log(auditEntry);
    });
    
    next();
  }
}

export default AuditMiddleware;
