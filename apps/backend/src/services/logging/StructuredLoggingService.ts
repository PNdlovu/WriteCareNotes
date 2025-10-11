/**
 * @fileoverview structured logging Service
 * @module Logging/StructuredLoggingService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description structured logging Service
 */

import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

/**
 * Enterprise Structured Logging Service
 * Provides comprehensive structured logging with correlation IDs and context
 */
export class StructuredLoggingService {
  private staticinstance: StructuredLoggingService;
  privatelogger: winston.Logger;
  privatecorrelationId: string | null = null;

  private const ructor() {
    this.initializeLogger();
  }

  public static getInstance(): StructuredLoggingService {
    if (!StructuredLoggingService.instance) {
      StructuredLoggingService.instance = new StructuredLoggingService();
    }
    return StructuredLoggingService.instance;
  }

  private initializeLogger(): void {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
        return JSON.stringify({
          timestamp,
          level,
          message,
          correlationId: correlationId || this.correlationId,
          ...meta
        });
      })
    );

    this.logger = winston.createLogger({
      level: process.env['LOG_LEVEL'] || 'info',
      format: logFormat,
      defaultMeta: {
        service: 'writecarenotes',
        version: process.env['APP_VERSION'] || '1.0.0',
        environment: process.env['NODE_ENV'] || 'development'
      },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // Add request/response logging transport for production
    if (process.env['NODE_ENV'] === 'production') {
      this.logger.add(new winston.transports.File({
        filename: 'logs/requests.log',
        level: 'info',
        maxsize: 10485760, // 10MB
        maxFiles: 10
      }));
    }
  }

  public setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
  }

  public generateCorrelationId(): string {
    const correlationId = uuidv4();
    this.setCorrelationId(correlationId);
    return correlationId;
  }

  public getCorrelationId(): string | null {
    return this.correlationId;
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, {
      correlationId: this.correlationId,
      ...meta
    });
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, {
      correlationId: this.correlationId,
      ...meta
    });
  }

  public error(message: string, error?: Error, meta?: any): void {
    this.logger.error(message, {
      correlationId: this.correlationId,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      ...meta
    });
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, {
      correlationId: this.correlationId,
      ...meta
    });
  }

  public trace(message: string, meta?: any): void {
    this.logger.silly(message, {
      correlationId: this.correlationId,
      ...meta
    });
  }

  // Business-specific logging methods
  public logUserActivity(userId: string, action: string, module: string, organizationId: string, meta?: any): void {
    this.info('User activity', {
      type: 'user_activity',
      userId,
      action,
      module,
      organizationId,
      ...meta
    });
  }

  public logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high' | 'critical', userId?: string, organizationId?: string, meta?: any): void {
    this.warn('Security event', {
      type: 'security_event',
      event,
      severity,
      userId,
      organizationId,
      ...meta
    });
  }

  public logComplianceEvent(event: string, type: 'gdpr' | 'nhs' | 'cqc' | 'data_protection', organizationId: string, jurisdiction?: string, meta?: any): void {
    this.info('Compliance event', {
      type: 'compliance_event',
      event,
      complianceType: type,
      organizationId,
      jurisdiction,
      ...meta
    });
  }

  public logBusinessEvent(event: string, type: 'resident' | 'medication' | 'care_plan' | 'incident', organizationId: string, meta?: any): void {
    this.info('Business event', {
      type: 'business_event',
      event,
      businessType: type,
      organizationId,
      ...meta
    });
  }

  public logSystemEvent(event: string, component: string, severity: 'info' | 'warning' | 'error' | 'critical', meta?: any): void {
    const logLevel = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    
    this[logLevel](`System event: ${event}`, {
      type: 'system_event',
      event,
      component,
      severity,
      ...meta
    });
  }

  public logDatabaseQuery(query: string, duration: number, organizationId?: string, meta?: any): void {
    this.debug('Database query executed', {
      type: 'database_query',
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      duration,
      organizationId,
      ...meta
    });
  }

  public logExternalAPICall(service: string, endpoint: string, method: string, statusCode: number, duration: number, organizationId?: string, meta?: any): void {
    this.info('External API call', {
      type: 'external_api_call',
      service,
      endpoint,
      method,
      statusCode,
      duration,
      organizationId,
      ...meta
    });
  }

  public logCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, organizationId?: string, meta?: any): void {
    this.debug('Cache operation', {
      type: 'cache_operation',
      operation,
      key: key.substring(0, 100) + (key.length > 100 ? '...' : ''),
      organizationId,
      ...meta
    });
  }

  public logAIOperation(operation: string, model: string, duration: number, accuracy?: number, organizationId?: string, meta?: any): void {
    this.info('AI operation', {
      type: 'ai_operation',
      operation,
      model,
      duration,
      accuracy,
      organizationId,
      ...meta
    });
  }

  public logAuditEvent(event: string, entityType: string, entityId: string, userId: string, organizationId: string, changes?: any, meta?: any): void {
    this.info('Audit event', {
      type: 'audit_event',
      event,
      entityType,
      entityId,
      userId,
      organizationId,
      changes,
      ...meta
    });
  }

  // Request/Response logging
  public logRequest(req: Request, res: Response, duration: number): void {
    const correlationId = req.headers['x-correlation-id'] as string || this.correlationId;
    
    this.info('HTTP request completed', {
      type: 'http_request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      correlationId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      organizationId: req.headers['x-organization-id'] as string,
      userId: req.headers['x-user-id'] as string
    });
  }

  public logRequestStart(req: Request): void {
    const correlationId = req.headers['x-correlation-id'] as string || this.generateCorrelationId();
    
    this.info('HTTP request started', {
      type: 'http_request_start',
      method: req.method,
      url: req.url,
      correlationId,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      organizationId: req.headers['x-organization-id'] as string,
      userId: req.headers['x-user-id'] as string
    });
  }

  public logError(error: Error, req?: Request, meta?: any): void {
    const correlationId = req?.headers['x-correlation-id'] as string || this.correlationId;
    
    this.error('Application error', error, {
      type: 'application_error',
      correlationId,
      url: req?.url,
      method: req?.method,
      organizationId: req?.headers['x-organization-id'] as string,
      userId: req?.headers['x-user-id'] as string,
      ...meta
    });
  }

  // Performance logging
  public logPerformance(operation: string, duration: number, organizationId?: string, meta?: any): void {
    this.info('Performance metric', {
      type: 'performance',
      operation,
      duration,
      organizationId,
      ...meta
    });
  }

  // Health check logging
  public logHealthCheck(component: string, status: 'healthy' | 'unhealthy', details?: any): void {
    const level = status === 'healthy' ? 'info' : 'warn';
    
    this[level](`Health check: ${component}`, {
      type: 'health_check',
      component,
      status,
      details
    });
  }

  // Metrics logging
  public logMetrics(metrics: Record<string, any>, organizationId?: string): void {
    this.info('Application metrics', {
      type: 'metrics',
      metrics,
      organizationId
    });
  }

  // Get the underlying Winston logger for advanced usage
  public getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  // Create a child logger with additional context
  public child(defaultMeta: any): winston.Logger {
    return this.logger.child(defaultMeta);
  }

  // Flush logs (useful for testing)
  public flush(): void {
    this.logger.end();
  }
}

export default StructuredLoggingService;
