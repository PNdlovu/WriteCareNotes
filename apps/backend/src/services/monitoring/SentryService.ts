/**
 * @fileoverview sentry Service
 * @module Monitoring/SentryService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description sentry Service
 */

import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { logger } from '../../utils/logger';

/**
 * Enterprise Sentry Error Tracking Service
 * Provides comprehensive error tracking and performance monitoring
 */
export class SentryService {
  private static instance: SentryService;
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeSentry();
  }

  public static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  private initializeSentry(): void {
    try {
      Sentry.init({
        dsn: process.env['SENTRY_DSN'],
        environment: process.env['NODE_ENV'] || 'development',
        tracesSampleRate: parseFloat(process.env['SENTRY_TRACES_SAMPLE_RATE'] || '1.0'),
        profilesSampleRate: parseFloat(process.env['SENTRY_PROFILES_SAMPLE_RATE'] || '1.0'),
        integrations: [
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }),
          new Sentry.Integrations.Postgres(),
          new Sentry.Integrations.Redis(),
          new ProfilingIntegration(),
        ],
        beforeSend(event, hint) {
          // Filter out non-critical errors in production
          if (process.env['NODE_ENV'] === 'production') {
            const error = hint.originalException;
            if (error instanceof Error) {
              // Filter out common non-critical errors
              if (error.message.includes('ECONNRESET') ||
                  error.message.includes('EPIPE') ||
                  error.message.includes('ETIMEDOUT')) {
                return null;
              }
            }
          }
          return event;
        },
        beforeSendTransaction(event) {
          // Filter out health check transactions
          if (event.transaction === 'GET /health') {
            return null;
          }
          return event;
        }
      });

      this.isInitialized = true;
      logger.info('Sentry error tracking initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Sentry', { error });
    }
  }

  public captureException(error: Error, context?: any, level: Sentry.SeverityLevel = 'error'): void {
    if (!this.isInitialized) {
      logger.error('Sentry not initialized, logging error locally', { error, context });
      return;
    }

    try {
      Sentry.withScope(scope => {
        if (context) {
          scope.setContext('additional_info', context);
        }
        scope.setLevel(level);
        scope.setTag('service', 'writecarenotes');
        scope.setTag('version', process.env['APP_VERSION'] || '1.0.0');
        
        Sentry.captureException(error);
      });
    } catch (sentryError) {
      logger.error('Failed to capture exception in Sentry', { error: sentryError, originalError: error });
    }
  }

  public captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: any): void {
    if (!this.isInitialized) {
      logger.info('Sentry not initialized, logging message locally', { message, context });
      return;
    }

    try {
      Sentry.withScope(scope => {
        if (context) {
          scope.setContext('additional_info', context);
        }
        scope.setLevel(level);
        scope.setTag('service', 'writecarenotes');
        scope.setTag('version', process.env['APP_VERSION'] || '1.0.0');
        
        Sentry.captureMessage(message, level);
      });
    } catch (sentryError) {
      logger.error('Failed to capture message in Sentry', { error: sentryError, message });
    }
  }

  public captureEvent(event: Sentry.Event): void {
    if (!this.isInitialized) {
      logger.info('Sentry not initialized, logging event locally', { event });
      return;
    }

    try {
      Sentry.captureEvent(event);
    } catch (sentryError) {
      logger.error('Failed to capture event in Sentry', { error: sentryError, event });
    }
  }

  public addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.addBreadcrumb(breadcrumb);
    } catch (error) {
      logger.error('Failed to add breadcrumb to Sentry', { error, breadcrumb });
    }
  }

  public setUser(user: { id: string; email?: string; username?: string; organizationId?: string }): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
        extra: {
          organizationId: user.organizationId
        }
      });
    } catch (error) {
      logger.error('Failed to set user in Sentry', { error, user });
    }
  }

  public setTag(key: string, value: string): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      logger.error('Failed to set tag in Sentry', { error, key, value });
    }
  }

  public setContext(key: string, context: any): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.setContext(key, context);
    } catch (error) {
      logger.error('Failed to set context in Sentry', { error, key, context });
    }
  }

  public startTransaction(name: string, op: string = 'custom'): Sentry.Transaction | undefined {
    if (!this.isInitialized) {
      return undefined;
    }

    try {
      return Sentry.startTransaction({
        name,
        op,
        tags: {
          service: 'writecarenotes'
        }
      });
    } catch (error) {
      logger.error('Failed to start transaction in Sentry', { error, name, op });
      return undefined;
    }
  }

  public startSpan(transaction: Sentry.Transaction, name: string, op: string = 'custom'): Sentry.Span | undefined {
    if (!this.isInitialized || !transaction) {
      return undefined;
    }

    try {
      return transaction.startChild({
        name,
        op
      });
    } catch (error) {
      logger.error('Failed to start span in Sentry', { error, name, op });
      return undefined;
    }
  }

  public finishSpan(span: Sentry.Span): void {
    if (!this.isInitialized || !span) {
      return;
    }

    try {
      span.finish();
    } catch (error) {
      logger.error('Failed to finish span in Sentry', { error });
    }
  }

  public finishTransaction(transaction: Sentry.Transaction): void {
    if (!this.isInitialized || !transaction) {
      return;
    }

    try {
      transaction.finish();
    } catch (error) {
      logger.error('Failed to finish transaction in Sentry', { error });
    }
  }

  public setFingerprint(fingerprint: string[]): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.withScope(scope => {
        scope.setFingerprint(fingerprint);
      });
    } catch (error) {
      logger.error('Failed to set fingerprint in Sentry', { error, fingerprint });
    }
  }

  public captureSecurityEvent(event: {
    type: 'authentication' | 'authorization' | 'data_access' | 'data_modification';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    userId?: string;
    organizationId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: any;
  }): void {
    if (!this.isInitialized) {
      logger.warn('Sentry not initialized, logging security event locally', { event });
      return;
    }

    try {
      Sentry.withScope(scope => {
        scope.setTag('event_type', 'security');
        scope.setTag('security_type', event.type);
        scope.setTag('severity', event.severity);
        scope.setLevel(event.severity === 'critical' ? 'error' : 'warning');
        
        if (event.userId) {
          scope.setUser({ id: event.userId });
        }
        
        if (event.organizationId) {
          scope.setTag('organization_id', event.organizationId);
        }
        
        if (event.ipAddress) {
          scope.setTag('ip_address', event.ipAddress);
        }
        
        if (event.userAgent) {
          scope.setTag('user_agent', event.userAgent);
        }
        
        if (event.metadata) {
          scope.setContext('security_metadata', event.metadata);
        }
        
        Sentry.captureMessage(event.description, 'warning');
      });
    } catch (error) {
      logger.error('Failed to capture security event in Sentry', { error, event });
    }
  }

  public captureComplianceEvent(event: {
    type: 'gdpr' | 'nhs' | 'cqc' | 'data_protection' | 'audit';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    organizationId?: string;
    jurisdiction?: string;
    metadata?: any;
  }): void {
    if (!this.isInitialized) {
      logger.warn('Sentry not initialized, logging compliance event locally', { event });
      return;
    }

    try {
      Sentry.withScope(scope => {
        scope.setTag('event_type', 'compliance');
        scope.setTag('compliance_type', event.type);
        scope.setTag('severity', event.severity);
        scope.setLevel(event.severity === 'critical' ? 'error' : 'warning');
        
        if (event.organizationId) {
          scope.setTag('organization_id', event.organizationId);
        }
        
        if (event.jurisdiction) {
          scope.setTag('jurisdiction', event.jurisdiction);
        }
        
        if (event.metadata) {
          scope.setContext('compliance_metadata', event.metadata);
        }
        
        Sentry.captureMessage(event.description, 'warning');
      });
    } catch (error) {
      logger.error('Failed to capture compliance event in Sentry', { error, event });
    }
  }

  public captureBusinessEvent(event: {
    type: 'resident_created' | 'medication_administered' | 'care_plan_updated' | 'incident_reported';
    description: string;
    organizationId: string;
    userId?: string;
    metadata?: any;
  }): void {
    if (!this.isInitialized) {
      logger.info('Sentry not initialized, logging business event locally', { event });
      return;
    }

    try {
      Sentry.withScope(scope => {
        scope.setTag('event_type', 'business');
        scope.setTag('business_type', event.type);
        scope.setLevel('info');
        
        scope.setTag('organization_id', event.organizationId);
        
        if (event.userId) {
          scope.setUser({ id: event.userId });
        }
        
        if (event.metadata) {
          scope.setContext('business_metadata', event.metadata);
        }
        
        Sentry.captureMessage(event.description, 'info');
      });
    } catch (error) {
      logger.error('Failed to capture business event in Sentry', { error, event });
    }
  }

  public flush(): Promise<boolean> {
    if (!this.isInitialized) {
      return Promise.resolve(false);
    }

    try {
      return Sentry.flush(2000);
    } catch (error) {
      logger.error('Failed to flush Sentry', { error });
      return Promise.resolve(false);
    }
  }

  public close(): void {
    if (!this.isInitialized) {
      return;
    }

    try {
      Sentry.close();
      this.isInitialized = false;
      logger.info('Sentry closed successfully');
    } catch (error) {
      logger.error('Failed to close Sentry', { error });
    }
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export default SentryService;