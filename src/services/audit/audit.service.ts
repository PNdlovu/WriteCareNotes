/**
 * @fileoverview Audit Service
 * @description Centralized audit logging service for compliance and security
 * @author WriteCareNotes Team
 * @version 1.0.0
 * @license MIT
 * @stability stable
 * @audit-hook audit-service-created
 */

import { Injectable, Logger } from '@nestjs/common';
import { AuditTrailService } from './AuditTrailService';

export interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  tenantId?: string;
  correlationId?: string;
}

export interface AuditEventRequest {
  userId: string;
  action: string;
  resource: string;
  metadata?: Record<string, any>;
  tenantId?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly auditTrailService: AuditTrailService
  ) {}

  /**
   * Log an audit event
   */
  async logEvent(event: AuditEventRequest): Promise<void> {
    try {
      const auditEvent: AuditEvent = {
        id: this.generateId(),
        userId: event.userId,
        action: event.action,
        resource: event.resource,
        timestamp: new Date(),
        metadata: event.metadata,
        tenantId: event.tenantId,
        correlationId: event.correlationId
      };

      await this.auditTrailService.createAuditEvent(auditEvent);
      
      this.logger.log(`Audit event logged: ${event.action} on ${event.resource} by ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to log audit event: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get audit events for a user
   */
  async getUserAuditEvents(userId: string, limit = 100): Promise<AuditEvent[]> {
    try {
      return await this.auditTrailService.getUserAuditEvents(userId, limit);
    } catch (error) {
      this.logger.error(`Failed to get user audit events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get audit events for a resource
   */
  async getResourceAuditEvents(resource: string, limit = 100): Promise<AuditEvent[]> {
    try {
      return await this.auditTrailService.getResourceAuditEvents(resource, limit);
    } catch (error) {
      this.logger.error(`Failed to get resource audit events: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Log a message (for compatibility with existing code)
   */
  log(message: string): void {
    this.logger.log(message);
  }

  /**
   * Generate unique ID for audit events
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}