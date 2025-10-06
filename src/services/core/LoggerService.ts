import winston from 'winston';
import path from 'path';
import { configService } from './ConfigurationService';

interface LogContext {
  userId?: string;
  sessionId?: string;
  patientId?: string;
  requestId?: string;
  method?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private auditLogger: winston.Logger;
  private securityLogger: winston.Logger;

  private constructor() {
    this.logger = this.createMainLogger();
    this.auditLogger = this.createAuditLogger();
    this.securityLogger = this.createSecurityLogger();
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  private createMainLogger(): winston.Logger {
    const logDir = path.join(process.cwd(), 'logs');
    
    const formats = [];
    
    // Add timestamp
    formats.push(winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }));

    // Add error handling
    formats.push(winston.format.errors({ stack: true }));

    // Production format (JSON) vs Development format (colorized)
    if (configService.isProduction()) {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      );
    }

    const transports: winston.transport[] = [];

    // Console transport
    transports.push(new winston.transports.Console({
      level: configService.get().logLevel,
      silent: configService.isTest()
    }));

    // File transports for production
    if (configService.isProduction()) {
      // Combined log file
      transports.push(new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        level: 'info',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 10,
        tailable: true
      }));

      // Error log file
      transports.push(new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        tailable: true
      }));
    }

    return winston.createLogger({
      level: configService.get().logLevel,
      format: winston.format.combine(...formats),
      transports,
      exitOnError: false
    });
  }

  private createAuditLogger(): winston.Logger {
    const logDir = path.join(process.cwd(), 'logs', 'audit');
    
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'audit.log'),
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 50,
          tailable: true
        })
      ],
      exitOnError: false
    });
  }

  private createSecurityLogger(): winston.Logger {
    const logDir = path.join(process.cwd(), 'logs', 'security');
    
    return winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({
          filename: path.join(logDir, 'security.log'),
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 25,
          tailable: true
        })
      ],
      exitOnError: false
    });
  }

  // Main logging methods
  public debug(message: string, context?: LogContext): void {
    this.logger.debug(message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.logger.info(message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.logger.warn(message, context);
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    const logData = {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    };
    this.logger.error(message, logData);
  }

  // Audit logging methods
  public auditPatientAccess(userId: string, patientId: string, action: string, context?: LogContext): void {
    this.auditLogger.info('Patient data access', {
      type: 'PATIENT_ACCESS',
      userId,
      patientId,
      action,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  public auditDataModification(userId: string, entityType: string, entityId: string, action: 'CREATE' | 'UPDATE' | 'DELETE', oldData?: any, newData?: any, context?: LogContext): void {
    this.auditLogger.info('Data modification', {
      type: 'DATA_MODIFICATION',
      userId,
      entityType,
      entityId,
      action,
      oldData: action === 'DELETE' ? oldData : undefined,
      newData: action !== 'DELETE' ? newData : undefined,
      changes: action === 'UPDATE' ? this.calculateChanges(oldData, newData) : undefined,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  public auditConsentChange(userId: string, patientId: string, consentType: string, granted: boolean, context?: LogContext): void {
    this.auditLogger.info('Consent change', {
      type: 'CONSENT_CHANGE',
      userId,
      patientId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  public auditSystemAccess(userId: string, action: 'LOGIN' | 'LOGOUT' | 'PASSWORD_CHANGE' | 'ACCOUNT_LOCKED', context?: LogContext): void {
    this.auditLogger.info('System access', {
      type: 'SYSTEM_ACCESS',
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Security logging methods
  public securityThreat(threatType: string, severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', details: any, context?: LogContext): void {
    this.securityLogger.warn('Security threat detected', {
      type: 'SECURITY_THREAT',
      threatType,
      severity,
      details,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  public securityViolation(violationType: string, userId?: string, details?: any, context?: LogContext): void {
    this.securityLogger.error('Security violation', {
      type: 'SECURITY_VIOLATION',
      violationType,
      userId,
      details,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  public authenticationFailure(attemptedUserId: string, reason: string, context?: LogContext): void {
    this.securityLogger.warn('Authentication failure', {
      type: 'AUTH_FAILURE',
      attemptedUserId,
      reason,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  public unauthorizedAccess(userId: string, resource: string, action: string, context?: LogContext): void {
    this.securityLogger.warn('Unauthorized access attempt', {
      type: 'UNAUTHORIZED_ACCESS',
      userId,
      resource,
      action,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Performance logging
  public performance(operation: string, duration: number, metadata?: any, context?: LogContext): void {
    this.logger.info('Performance metric', {
      type: 'PERFORMANCE',
      operation,
      duration,
      metadata,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Business event logging
  public businessEvent(eventType: string, details: any, context?: LogContext): void {
    this.logger.info('Business event', {
      type: 'BUSINESS_EVENT',
      eventType,
      details,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // API logging
  public apiRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.logger.info('API request', {
      type: 'API_REQUEST',
      method,
      url,
      statusCode,
      duration,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Database logging
  public databaseQuery(query: string, duration: number, rowCount?: number, context?: LogContext): void {
    this.logger.debug('Database query', {
      type: 'DATABASE_QUERY',
      query: configService.isProduction() ? 'REDACTED' : query,
      duration,
      rowCount,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  // Helper methods
  private calculateChanges(oldData: any, newData: any): any {
    const changes: any = {};
    
    if (!oldData || !newData) return changes;

    for (const key in newData) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          from: oldData[key],
          to: newData[key]
        };
      }
    }

    return changes;
  }

  // Create child logger with default context
  public createChildLogger(defaultContext: LogContext): ChildLogger {
    return new ChildLogger(this, defaultContext);
  }

  // Get raw winston logger for advanced usage
  public getWinstonLogger(): winston.Logger {
    return this.logger;
  }
}

class ChildLogger {
  constructor(
    private parent: LoggerService,
    private defaultContext: LogContext
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.defaultContext, ...context };
  }

  public debug(message: string, context?: LogContext): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  public info(message: string, context?: LogContext): void {
    this.parent.info(message, this.mergeContext(context));
  }

  public warn(message: string, context?: LogContext): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  public error(message: string, error?: Error, context?: LogContext): void {
    this.parent.error(message, error, this.mergeContext(context));
  }

  public auditPatientAccess(userId: string, patientId: string, action: string, context?: LogContext): void {
    this.parent.auditPatientAccess(userId, patientId, action, this.mergeContext(context));
  }

  public performance(operation: string, duration: number, metadata?: any, context?: LogContext): void {
    this.parent.performance(operation, duration, metadata, this.mergeContext(context));
  }
}

// Export singleton instance
export const loggerService = LoggerService.getInstance();
export { LoggerService, ChildLogger, LogContext };
export default loggerService;