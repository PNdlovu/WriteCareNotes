/**
 * AuditTrailService - Simple wrapper around EnterpriseAuditService
 * Provides backward compatibility for services expecting AuditTrailService
 */

import { EnterpriseAuditService } from './EnterpriseAuditService';

// Define AuditEvent interface
export interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  entityType?: string;
  entityId?: string;
  details: Record<string, any>;
  timestamp: Date;
  metadata?: Record<string, any>;
  tenantId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditTrailService extends EnterpriseAuditService {
  // This class simply extends EnterpriseAuditService
  // to maintain backward compatibility with existing code
  
  constructor() {
    super();
  }

  // Add methods that services expect
  async log(event: Partial<AuditEvent>): Promise<void> {
    // Wrapper method for createAuditEvent to match expected interface
    await this.createAuditEvent(event as AuditEvent);
  }

  async createAuditEvent(event: AuditEvent): Promise<void> {
    // Delegate to parent class if it has this method, otherwise stub it
    // For now, just log it
    console.log('Audit event:', event);
  }

  async getUserAuditEvents(userId: string, limit: number): Promise<AuditEvent[]> {
    // Stub implementation
    return [];
  }

  async getResourceAuditEvents(resource: string, limit: number): Promise<AuditEvent[]> {
    // Stub implementation
    return [];
  }
}

// Export singleton instance for convenience
export const auditTrailService = new AuditTrailService();
