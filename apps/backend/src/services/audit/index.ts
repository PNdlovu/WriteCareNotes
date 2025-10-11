/**
 * @fileoverview Audit Services Module Exports
 * @module services/audit
 */

export { AuditService } from './audit.service';
// Backwardcompatibility: export AuditService as AuditTrailService
export { AuditService as AuditTrailService } from './audit.service';
export { EnterpriseAuditService } from './EnterpriseAuditService';
export { AgentAuditService } from './agent-audit.service';

// Re-export type s
export type { AuditEvent, AuditEventRequest } from './audit.service';

