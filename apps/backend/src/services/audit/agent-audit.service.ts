/**
 * @fileoverview agent-audit.service
 * @module Audit/Agent-audit.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agent-audit.service
 */

import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { AgentAuditRecord, AgentComplianceReport } from '../../types/pilot-feedback-agent.types';
import { DatabaseService } from '../database/database.service';

export class AgentAuditService {
  privatedb: DatabaseService;
  privateauditQueue: AgentAuditRecord[] = [];
  privateisProcessing: boolean = false;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Log agent event with full audit trail
   */
  async logAgentEvent(event: Omit<AgentAuditRecord, 'auditId' | 'timestamp'>): Promise<void> {
    constauditRecord: AgentAuditRecord = {
      ...event,
      auditId: uuidv4(),
      timestamp: new Date()
    };

    // Add to queue for batch processing
    this.auditQueue.push(auditRecord);

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processAuditQueue();
    }

    logger.info('Agent audit event logged', {
      auditId: auditRecord.auditId,
      action: auditRecord.action,
      tenantId: auditRecord.tenantId
    });
  }

  /**
   * Process audit queue in batches
   */
  private async processAuditQueue(): Promise<void> {
    if (this.isProcessing || this.auditQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const batchSize = 100;
    const batch = this.auditQueue.splice(0, batchSize);

    try {
      await this.storeAuditBatch(batch);
    } catch (error) {
      logger.error('Failed to process audit queue', { error: (error as Error).message });
      // Re-add failed records to queue
      this.auditQueue.unshift(...batch);
    } finally {
      this.isProcessing = false;
      
      // Continue processing if more items in queue
      if (this.auditQueue.length > 0) {
        setTimeout(() => this.processAuditQueue(), 1000);
      }
    }
  }

  /**
   * Store batch of audit records
   */
  private async storeAuditBatch(records: AgentAuditRecord[]): Promise<void> {
    const query = `
      INSERT INTO agent_audit_log (
        audit_id, correlation_id, tenant_id, action, event_id, 
        recommendation_id, metadata, error, timestamp, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = records.map(record => [
      record.auditId,
      record.correlationId,
      record.tenantId,
      record.action,
      record.eventId || null,
      record.recommendationId || null,
      JSON.stringify(record.metadata || {}),
      record.error || null,
      record.timestamp,
      new Date()
    ]);

    await this.db.query(query, values.flat());
  }

  /**
   * Get audit logs for tenant with filtering
   */
  async getAuditLogs(
    tenantId: string,
    filters: {
      from?: Date;
      to?: Date;
      action?: string;
      correlationId?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AgentAuditRecord[]> {
    let query = `
      SELECT 
        audit_id as auditId,
        correlation_id as correlationId,
        tenant_id as tenantId,
        action,
        event_id as eventId,
        recommendation_id as recommendationId,
        metadata,
        error,
        timestamp,
        created_at as createdAt
      FROM agent_audit_log 
      WHERE tenant_id = ?
    `;

    constparams: any[] = [tenantId];

    if (filters.from) {
      query += ' AND timestamp >= ?';
      params.push(filters.from);
    }

    if (filters.to) {
      query += ' AND timestamp <= ?';
      params.push(filters.to);
    }

    if (filters.action) {
      query += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.correlationId) {
      query += ' AND correlation_id = ?';
      params.push(filters.correlationId);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const rows = await this.db.query(query, params);

    return rows.map(row => ({
      auditId: row.auditId,
      correlationId: row.correlationId,
      tenantId: row.tenantId,
      action: row.action,
      eventId: row.eventId,
      recommendationId: row.recommendationId,
      metadata: JSON.parse(row.metadata || '{}'),
      error: row.error,
      timestamp: row.timestamp
    }));
  }

  /**
   * Get audit trail for specific event
   */
  async getEventAuditTrail(eventId: string): Promise<AgentAuditRecord[]> {
    const query = `
      SELECT 
        audit_id as auditId,
        correlation_id as correlationId,
        tenant_id as tenantId,
        action,
        event_id as eventId,
        recommendation_id as recommendationId,
        metadata,
        error,
        timestamp,
        created_at as createdAt
      FROM agent_audit_log 
      WHERE event_id = ?
      ORDER BY timestamp ASC
    `;

    const rows = await this.db.query(query, [eventId]);

    return rows.map(row => ({
      auditId: row.auditId,
      correlationId: row.correlationId,
      tenantId: row.tenantId,
      action: row.action,
      eventId: row.eventId,
      recommendationId: row.recommendationId,
      metadata: JSON.parse(row.metadata || '{}'),
      error: row.error,
      timestamp: row.timestamp
    }));
  }

  /**
   * Get compliance report for tenant
   */
  async getComplianceReport(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentComplianceReport> {
    // Get data processing metrics
    const dataProcessing = await this.getDataProcessingMetrics(tenantId, from, to);
    
    // Get data retention metrics
    const dataRetention = await this.getDataRetentionMetrics(tenantId, from, to);
    
    // Get data subject rights metrics
    const dataSubjectRights = await this.getDataSubjectRightsMetrics(tenantId, from, to);
    
    // Get security metrics
    const security = await this.getSecurityMetrics(tenantId, from, to);

    return {
      tenantId,
      period: { from, to },
      dataProcessing,
      dataRetention,
      dataSubjectRights,
      security,
      generatedAt: new Date()
    };
  }

  /**
   * Get data processing metrics
   */
  private async getDataProcessingMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentComplianceReport['dataProcessing']> {
    const query = `
      SELECT 
        COUNT(*) as eventsProcessed,
        SUM(CASE WHEN metadata LIKE '%pii_masked%' THEN 1 ELSE 0 END) as piiMasked,
        SUM(CASE WHEN metadata LIKE '%phi_leakage%' THEN 1 ELSE 0 END) as phileakageDetected,
        SUM(CASE WHEN action = 'EVENT_RECEIVED' AND metadata LIKE '%hasConsent:true%' THEN 1 ELSE 0 END) as consentVerified
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND timestamp BETWEEN ? AND ?
      AND action IN ('EVENT_RECEIVED', 'BATCH_PROCESSED', 'PII_MASKED')
    `;

    const rows = await this.db.query(query, [tenantId, from, to]);
    const row = rows[0];

    return {
      eventsProcessed: row.eventsProcessed || 0,
      piiMasked: row.piiMasked || 0,
      phileakageDetected: row.phileakageDetected || 0,
      consentVerified: row.consentVerified || 0
    };
  }

  /**
   * Get data retention metrics
   */
  private async getDataRetentionMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentComplianceReport['dataRetention']> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM agent_summaries WHERE tenant_id = ?) as summariesRetained,
        (SELECT COUNT(*) FROM agent_clusters WHERE tenant_id = ?) as clustersRetained,
        (SELECT COUNT(*) FROM agent_recommendations WHERE tenant_id = ?) as recommendationsRetained,
        (SELECT COUNT(*) FROM agent_audit_log WHERE tenant_id = ?) as auditRecordsRetained
    `;

    const rows = await this.db.query(query, [tenantId, tenantId, tenantId, tenantId]);
    const row = rows[0];

    return {
      summariesRetained: row.summariesRetained || 0,
      clustersRetained: row.clustersRetained || 0,
      recommendationsRetained: row.recommendationsRetained || 0,
      auditRecordsRetained: row.auditRecordsRetained || 0
    };
  }

  /**
   * Get data subject rights metrics
   */
  private async getDataSubjectRightsMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentComplianceReport['dataSubjectRights']> {
    const query = `
      SELECT 
        SUM(CASE WHEN action = 'SAR_REQUEST' THEN 1 ELSE 0 END) as sarRequests,
        SUM(CASE WHEN action = 'ERASURE_REQUEST' THEN 1 ELSE 0 END) as erasureRequests,
        SUM(CASE WHEN action = 'RECTIFICATION_REQUEST' THEN 1 ELSE 0 END) as rectificationRequests,
        SUM(CASE WHEN action = 'PORTABILITY_REQUEST' THEN 1 ELSE 0 END) as portabilityRequests
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND timestamp BETWEEN ? AND ?
    `;

    const rows = await this.db.query(query, [tenantId, from, to]);
    const row = rows[0];

    return {
      sarRequests: row.sarRequests || 0,
      erasureRequests: row.erasureRequests || 0,
      rectificationRequests: row.rectificationRequests || 0,
      portabilityRequests: row.portabilityRequests || 0
    };
  }

  /**
   * Get security metrics
   */
  private async getSecurityMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentComplianceReport['security']> {
    const query = `
      SELECT 
        COUNT(*) as accessAttempts,
        SUM(CASE WHEN action = 'UNAUTHORIZED_ACCESS' THEN 1 ELSE 0 END) as unauthorizedAccess,
        SUM(CASE WHEN action = 'DATA_BREACH' THEN 1 ELSE 0 END) as dataBreaches,
        SUM(CASE WHEN action = 'POLICY_VIOLATION' THEN 1 ELSE 0 END) as policyViolations
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND timestamp BETWEEN ? AND ?
      AND action IN ('ACCESS_ATTEMPT', 'UNAUTHORIZED_ACCESS', 'DATA_BREACH', 'POLICY_VIOLATION')
    `;

    const rows = await this.db.query(query, [tenantId, from, to]);
    const row = rows[0];

    return {
      accessAttempts: row.accessAttempts || 0,
      unauthorizedAccess: row.unauthorizedAccess || 0,
      dataBreaches: row.dataBreaches || 0,
      policyViolations: row.policyViolations || 0
    };
  }

  /**
   * Log data subject rights request
   */
  async logDataSubjectRightsRequest(
    tenantId: string,
    requestType: 'SAR' | 'ERASURE' | 'RECTIFICATION' | 'PORTABILITY',
    subjectId: string,
    requestedBy: string
  ): Promise<void> {
    await this.logAgentEvent({
      correlationId: uuidv4(),
      tenantId,
      action: `${requestType}_REQUEST`,
      metadata: {
        subjectId,
        requestedBy,
        requestType
      }
    });
  }

  /**
   * Log PII masking event
   */
  async logPIIMasking(
    tenantId: string,
    eventId: string,
    maskingStats: {
      patternsMatched: number;
      maskingRate: number;
      patternsFound: string[];
    }
  ): Promise<void> {
    await this.logAgentEvent({
      correlationId: uuidv4(),
      tenantId,
      action: 'PII_MASKED',
      eventId,
      metadata: {
        maskingStats,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log PHI leakage detection
   */
  async logPHILeakage(
    tenantId: string,
    eventId: string,
    details: {
      detectedPatterns: string[];
      severity: 'low' | 'medium' | 'high' | 'critical';
      actionTaken: string;
    }
  ): Promise<void> {
    await this.logAgentEvent({
      correlationId: uuidv4(),
      tenantId,
      action: 'PHI_LEAKAGE_DETECTED',
      eventId,
      metadata: {
        details,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log policy violation
   */
  async logPolicyViolation(
    tenantId: string,
    violationType: string,
    details: {
      userId?: string;
      resource?: string;
      action?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }
  ): Promise<void> {
    await this.logAgentEvent({
      correlationId: uuidv4(),
      tenantId,
      action: 'POLICY_VIOLATION',
      metadata: {
        violationType,
        details,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log unauthorized access attempt
   */
  async logUnauthorizedAccess(
    tenantId: string,
    details: {
      userId?: string;
      resource: string;
      action: string;
      ipAddress: string;
      userAgent: string;
      reason: string;
    }
  ): Promise<void> {
    await this.logAgentEvent({
      correlationId: uuidv4(),
      tenantId,
      action: 'UNAUTHORIZED_ACCESS',
      metadata: {
        details,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get audit statistics for monitoring
   */
  async getAuditStatistics(tenantId: string, hours: number = 24): Promise<{
    totalEvents: number;
    errorRate: number;
    topActions: Array<{ action: string; count: number }>;
    recentErrors: AgentAuditRecord[];
  }> {
    const from = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get total events
    const totalQuery = `
      SELECT COUNT(*) as total
      FROM agent_audit_log 
      WHERE tenant_id = ? AND timestamp >= ?
    `;
    const totalRows = await this.db.query(totalQuery, [tenantId, from]);
    const totalEvents = totalRows[0].total;

    // Get error rate
    const errorQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors
      FROM agent_audit_log 
      WHERE tenant_id = ? AND timestamp >= ?
    `;
    const errorRows = await this.db.query(errorQuery, [tenantId, from]);
    const errorRate = errorRows[0].total > 0 ? (errorRows[0].errors / errorRows[0].total) * 100 : 0;

    // Get top actions
    const actionsQuery = `
      SELECT action, COUNT(*) as count
      FROM agent_audit_log 
      WHERE tenant_id = ? AND timestamp >= ?
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `;
    const actionRows = await this.db.query(actionsQuery, [tenantId, from]);

    // Get recent errors
    const errorsQuery = `
      SELECT 
        audit_id as auditId,
        correlation_id as correlationId,
        tenant_id as tenantId,
        action,
        event_id as eventId,
        recommendation_id as recommendationId,
        metadata,
        error,
        timestamp
      FROM agent_audit_log 
      WHERE tenant_id = ? AND timestamp >= ? AND error IS NOT NULL
      ORDER BY timestamp DESC
      LIMIT 20
    `;
    const errorRecords = await this.db.query(errorsQuery, [tenantId, from]);

    return {
      totalEvents,
      errorRate: Math.round(errorRate * 100) / 100,
      topActions: actionRows.map(row => ({
        action: row.action,
        count: row.count
      })),
      recentErrors: errorRecords.map(row => ({
        auditId: row.auditId,
        correlationId: row.correlationId,
        tenantId: row.tenantId,
        action: row.action,
        eventId: row.eventId,
        recommendationId: row.recommendationId,
        metadata: JSON.parse(row.metadata || '{}'),
        error: row.error,
        timestamp: row.timestamp
      }))
    };
  }
}

// Export alias for backward compatibility
export const AuditService = AgentAuditService;
