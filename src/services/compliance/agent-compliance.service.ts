/**
 * @fileoverview agent-compliance.service
 * @module Compliance/Agent-compliance.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agent-compliance.service
 */

import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { AgentComplianceReport, AgentConfiguration } from '../../types/pilot-feedback-agent.types';
import { DatabaseService } from '../database/database.service';

export class AgentComplianceService {
  private db: DatabaseService;

  constructor() {
    this.db = new DatabaseService();
  }

  /**
   * Validate agent configuration for compliance
   */
  async validateConfiguration(config: AgentConfiguration): Promise<{
    isValid: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check autonomy level compliance
    if (config.autonomy !== 'recommend-only') {
      violations.push('Agent autonomy must be set to "recommend-only" for compliance');
    }

    // Check feature flags compliance
    if (!config.features.clustering) {
      recommendations.push('Consider enabling clustering for better feedback analysis');
    }

    if (!config.features.summarization) {
      recommendations.push('Consider enabling summarization for compliance reporting');
    }

    // Check threshold compliance
    if (config.thresholds.minClusterSize < 2) {
      violations.push('Minimum cluster size must be at least 2 for privacy protection');
    }

    if (config.thresholds.minRecommendationEvents < 3) {
      violations.push('Minimum recommendation events must be at least 3 for statistical significance');
    }

    if (config.thresholds.maxProcessingTime > 300000) { // 5 minutes
      violations.push('Maximum processing time should not exceed 5 minutes for real-time compliance');
    }

    return {
      isValid: violations.length === 0,
      violations,
      recommendations
    };
  }

  /**
   * Check data processing compliance
   */
  async checkDataProcessingCompliance(tenantId: string): Promise<{
    compliant: boolean;
    issues: string[];
    score: number;
  }> {
    const issues: string[] = [];
    let score = 100;

    // Check consent rates
    const consentQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN consents LIKE '%"improvementProcessing":true%' THEN 1 ELSE 0 END) as consented
      FROM pilot_feedback_events 
      WHERE tenant_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const consentRows = await this.db.query(consentQuery, [tenantId]);
    const consentRate = consentRows[0].total > 0 ? 
      (consentRows[0].consented / consentRows[0].total) * 100 : 0;

    if (consentRate < 95) {
      issues.push(`Consent rate is ${consentRate.toFixed(1)}%, should be at least 95%`);
      score -= 20;
    }

    // Check PII masking compliance
    const maskingQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN metadata LIKE '%pii_masked%' THEN 1 ELSE 0 END) as masked
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND action = 'PII_MASKED'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const maskingRows = await this.db.query(maskingQuery, [tenantId]);
    const maskingRate = maskingRows[0].total > 0 ? 
      (maskingRows[0].masked / maskingRows[0].total) * 100 : 100;

    if (maskingRate < 100) {
      issues.push(`PII masking rate is ${maskingRate.toFixed(1)}%, should be 100%`);
      score -= 30;
    }

    // Check PHI leakage
    const phileakageQuery = `
      SELECT COUNT(*) as count
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND action = 'PHI_LEAKAGE_DETECTED'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const phileakageRows = await this.db.query(phileakageQuery, [tenantId]);
    const phileakageCount = phileakageRows[0].count;

    if (phileakageCount > 0) {
      issues.push(`${phileakageCount} PHI leakage incidents detected in the last 30 days`);
      score -= phileakageCount * 10;
    }

    // Check audit trail completeness
    const auditQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN metadata IS NOT NULL AND metadata != '{}' THEN 1 ELSE 0 END) as complete
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;
    const auditRows = await this.db.query(auditQuery, [tenantId]);
    const auditCompleteness = auditRows[0].total > 0 ? 
      (auditRows[0].complete / auditRows[0].total) * 100 : 100;

    if (auditCompleteness < 95) {
      issues.push(`Audit trail completeness is ${auditCompleteness.toFixed(1)}%, should be at least 95%`);
      score -= 15;
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: Math.max(0, score)
    };
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetentionCompliance(tenantId: string): Promise<{
    compliant: boolean;
    issues: string[];
    retentionStats: {
      summaries: number;
      clusters: number;
      recommendations: number;
      auditLogs: number;
    };
  }> {
    const issues: string[] = [];

    // Get retention statistics
    const retentionQuery = `
      SELECT 
        (SELECT COUNT(*) FROM agent_summaries WHERE tenant_id = ?) as summaries,
        (SELECT COUNT(*) FROM agent_clusters WHERE tenant_id = ?) as clusters,
        (SELECT COUNT(*) FROM agent_recommendations WHERE tenant_id = ?) as recommendations,
        (SELECT COUNT(*) FROM agent_audit_log WHERE tenant_id = ?) as auditLogs
    `;
    const retentionRows = await this.db.query(retentionQuery, [tenantId, tenantId, tenantId, tenantId]);
    const retentionStats = {
      summaries: retentionRows[0].summaries,
      clusters: retentionRows[0].clusters,
      recommendations: retentionRows[0].recommendations,
      auditLogs: retentionRows[0].auditLogs
    };

    // Check for data older than retention period (assuming 7 years for audit logs)
    const oldDataQuery = `
      SELECT COUNT(*) as count
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND created_at < DATE_SUB(NOW(), INTERVAL 7 YEAR)
    `;
    const oldDataRows = await this.db.query(oldDataQuery, [tenantId]);
    const oldDataCount = oldDataRows[0].count;

    if (oldDataCount > 0) {
      issues.push(`${oldDataCount} audit records exceed 7-year retention period`);
    }

    // Check for orphaned data
    const orphanedQuery = `
      SELECT 
        (SELECT COUNT(*) FROM agent_clusters c 
         LEFT JOIN agent_summaries s ON c.tenant_id = s.tenant_id 
         WHERE c.tenant_id = ? AND s.tenant_id IS NULL) as orphanedClusters,
        (SELECT COUNT(*) FROM agent_recommendations r 
         LEFT JOIN agent_clusters c ON r.tenant_id = c.tenant_id 
         WHERE r.tenant_id = ? AND c.tenant_id IS NULL) as orphanedRecommendations
    `;
    const orphanedRows = await this.db.query(orphanedQuery, [tenantId, tenantId]);
    const orphanedClusters = orphanedRows[0].orphanedClusters;
    const orphanedRecommendations = orphanedRows[0].orphanedRecommendations;

    if (orphanedClusters > 0) {
      issues.push(`${orphanedClusters} orphaned clusters found`);
    }

    if (orphanedRecommendations > 0) {
      issues.push(`${orphanedRecommendations} orphaned recommendations found`);
    }

    return {
      compliant: issues.length === 0,
      issues,
      retentionStats
    };
  }

  /**
   * Check security compliance
   */
  async checkSecurityCompliance(tenantId: string): Promise<{
    compliant: boolean;
    issues: string[];
    securityScore: number;
  }> {
    const issues: string[] = [];
    let securityScore = 100;

    // Check for unauthorized access attempts
    const unauthorizedQuery = `
      SELECT COUNT(*) as count
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND action = 'UNAUTHORIZED_ACCESS'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const unauthorizedRows = await this.db.query(unauthorizedQuery, [tenantId]);
    const unauthorizedCount = unauthorizedRows[0].count;

    if (unauthorizedCount > 0) {
      issues.push(`${unauthorizedCount} unauthorized access attempts in the last 30 days`);
      securityScore -= unauthorizedCount * 5;
    }

    // Check for policy violations
    const violationsQuery = `
      SELECT COUNT(*) as count
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND action = 'POLICY_VIOLATION'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const violationsRows = await this.db.query(violationsQuery, [tenantId]);
    const violationsCount = violationsRows[0].count;

    if (violationsCount > 0) {
      issues.push(`${violationsCount} policy violations in the last 30 days`);
      securityScore -= violationsCount * 10;
    }

    // Check for data breaches
    const breachesQuery = `
      SELECT COUNT(*) as count
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND action = 'DATA_BREACH'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    const breachesRows = await this.db.query(breachesQuery, [tenantId]);
    const breachesCount = breachesRows[0].count;

    if (breachesCount > 0) {
      issues.push(`${breachesCount} data breaches in the last 30 days`);
      securityScore -= breachesCount * 50;
    }

    // Check access pattern anomalies
    const accessQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(DISTINCT SUBSTRING(metadata, LOCATE('"ipAddress":"', metadata) + 14, 15)) as uniqueIPs
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND action LIKE '%ACCESS%'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `;
    const accessRows = await this.db.query(accessQuery, [tenantId]);
    const totalAccess = accessRows[0].total;
    const uniqueIPs = accessRows[0].uniqueIPs;

    if (totalAccess > 100 && uniqueIPs < 3) {
      issues.push('Suspicious access pattern detected: high volume from few IPs');
      securityScore -= 20;
    }

    return {
      compliant: issues.length === 0,
      issues,
      securityScore: Math.max(0, securityScore)
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(tenantId: string): Promise<AgentComplianceReport> {
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const to = new Date();

    // Get data processing compliance
    const dataProcessing = await this.checkDataProcessingCompliance(tenantId);
    
    // Get data retention compliance
    const dataRetention = await this.checkDataRetentionCompliance(tenantId);
    
    // Get security compliance
    const security = await this.checkSecurityCompliance(tenantId);

    // Calculate overall compliance score
    const overallScore = Math.round(
      (dataProcessing.score + security.securityScore) / 2
    );

    const report: AgentComplianceReport = {
      tenantId,
      period: { from, to },
      dataProcessing: {
        eventsProcessed: 0, // Would be populated from actual data
        piiMasked: 0,
        phileakageDetected: 0,
        consentVerified: 0
      },
      dataRetention: {
        summariesRetained: dataRetention.retentionStats.summaries,
        clustersRetained: dataRetention.retentionStats.clusters,
        recommendationsRetained: dataRetention.retentionStats.recommendations,
        auditRecordsRetained: dataRetention.retentionStats.auditLogs
      },
      dataSubjectRights: {
        sarRequests: 0,
        erasureRequests: 0,
        rectificationRequests: 0,
        portabilityRequests: 0
      },
      security: {
        accessAttempts: 0,
        unauthorizedAccess: 0,
        dataBreaches: 0,
        policyViolations: 0
      },
      generatedAt: new Date()
    };

    // Log compliance report generation
    logger.info('Compliance report generated', {
      tenantId,
      overallScore,
      dataProcessingCompliant: dataProcessing.compliant,
      dataRetentionCompliant: dataRetention.compliant,
      securityCompliant: security.compliant
    });

    return report;
  }

  /**
   * Check if tenant is compliant with all requirements
   */
  async isTenantCompliant(tenantId: string): Promise<{
    compliant: boolean;
    overallScore: number;
    breakdown: {
      dataProcessing: boolean;
      dataRetention: boolean;
      security: boolean;
    };
    issues: string[];
  }> {
    const dataProcessing = await this.checkDataProcessingCompliance(tenantId);
    const dataRetention = await this.checkDataRetentionCompliance(tenantId);
    const security = await this.checkSecurityCompliance(tenantId);

    const allIssues = [
      ...dataProcessing.issues,
      ...dataRetention.issues,
      ...security.issues
    ];

    const overallScore = Math.round(
      (dataProcessing.score + security.securityScore) / 2
    );

    return {
      compliant: dataProcessing.compliant && dataRetention.compliant && security.compliant,
      overallScore,
      breakdown: {
        dataProcessing: dataProcessing.compliant,
        dataRetention: dataRetention.compliant,
        security: security.compliant
      },
      issues: allIssues
    };
  }

  /**
   * Log compliance violation
   */
  async logComplianceViolation(
    tenantId: string,
    violationType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const query = `
      INSERT INTO compliance_violations (
        id, tenant_id, violation_type, severity, description, 
        metadata, created_at, resolved_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      uuidv4(),
      tenantId,
      violationType,
      severity,
      description,
      JSON.stringify(metadata || {}),
      new Date(),
      null,
      'open'
    ];

    await this.db.query(query, values);

    logger.warn('Compliance violation logged', {
      tenantId,
      violationType,
      severity,
      description
    });
  }

  /**
   * Get compliance violations for tenant
   */
  async getComplianceViolations(
    tenantId: string,
    filters: {
      from?: Date;
      to?: Date;
      severity?: string;
      status?: string;
      limit?: number;
    } = {}
  ): Promise<any[]> {
    let query = `
      SELECT 
        id, tenant_id, violation_type, severity, description, 
        metadata, created_at, resolved_at, status
      FROM compliance_violations 
      WHERE tenant_id = ?
    `;

    const params: any[] = [tenantId];

    if (filters.from) {
      query += ' AND created_at >= ?';
      params.push(filters.from);
    }

    if (filters.to) {
      query += ' AND created_at <= ?';
      params.push(filters.to);
    }

    if (filters.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await this.db.query(query, params);

    return rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      violationType: row.violation_type,
      severity: row.severity,
      description: row.description,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      status: row.status
    }));
  }
}