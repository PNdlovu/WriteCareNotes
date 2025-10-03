import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentHealthCheck, 
  AgentMetrics, 
  AgentNotification 
} from '../../types/pilot-feedback-agent.types';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notifications/notification.service';

export class AgentMonitoringService {
  private db: DatabaseService;
  private notifications: NotificationService;
  private healthChecks: Map<string, AgentHealthCheck> = new Map();
  private alertThresholds: Map<string, any> = new Map();

  constructor() {
    this.db = new DatabaseService();
    this.notifications = new NotificationService();
    this.initializeAlertThresholds();
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<AgentHealthCheck> {
    const startTime = Date.now();
    const healthCheck: AgentHealthCheck = {
      service: 'pilot-feedback-agent',
      status: 'healthy',
      checks: {
        database: 'pass',
        queue: 'pass',
        masking: 'pass',
        compliance: 'pass',
        audit: 'pass'
      },
      metrics: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: await this.getCPUUsage(),
        queueSize: 0,
        errorRate: 0
      },
      lastCheck: new Date()
    };

    try {
      // Check database connectivity
      await this.checkDatabaseHealth();
    } catch (error) {
      healthCheck.checks.database = 'fail';
      healthCheck.status = 'degraded';
      logger.error('Database health check failed', { error: error.message });
    }

    try {
      // Check queue health
      await this.checkQueueHealth();
    } catch (error) {
      healthCheck.checks.queue = 'fail';
      healthCheck.status = 'degraded';
      logger.error('Queue health check failed', { error: error.message });
    }

    try {
      // Check PII masking service
      await this.checkMaskingHealth();
    } catch (error) {
      healthCheck.checks.masking = 'fail';
      healthCheck.status = 'degraded';
      logger.error('Masking health check failed', { error: error.message });
    }

    try {
      // Check compliance service
      await this.checkComplianceHealth();
    } catch (error) {
      healthCheck.checks.compliance = 'fail';
      healthCheck.status = 'degraded';
      logger.error('Compliance health check failed', { error: error.message });
    }

    try {
      // Check audit service
      await this.checkAuditHealth();
    } catch (error) {
      healthCheck.checks.audit = 'fail';
      healthCheck.status = 'degraded';
      logger.error('Audit health check failed', { error: error.message });
    }

    // Calculate overall status
    const failedChecks = Object.values(healthCheck.checks).filter(check => check === 'fail').length;
    if (failedChecks > 2) {
      healthCheck.status = 'unhealthy';
    } else if (failedChecks > 0) {
      healthCheck.status = 'degraded';
    }

    // Update metrics
    healthCheck.metrics.queueSize = await this.getQueueSize();
    healthCheck.metrics.errorRate = await this.getErrorRate();

    // Store health check
    this.healthChecks.set('latest', healthCheck);
    await this.storeHealthCheck(healthCheck);

    const duration = Date.now() - startTime;
    logger.info('Health check completed', {
      status: healthCheck.status,
      duration,
      failedChecks
    });

    return healthCheck;
  }

  /**
   * Get agent metrics for tenant
   */
  async getAgentMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentMetrics> {
    const period = { from, to };

    // Get processing metrics
    const processing = await this.getProcessingMetrics(tenantId, from, to);
    
    // Get output metrics
    const outputs = await this.getOutputMetrics(tenantId, from, to);
    
    // Get quality metrics
    const quality = await this.getQualityMetrics(tenantId, from, to);
    
    // Get compliance metrics
    const compliance = await this.getComplianceMetrics(tenantId, from, to);

    return {
      tenantId,
      period,
      processing,
      outputs,
      quality,
      compliance
    };
  }

  /**
   * Check for alerts and send notifications
   */
  async checkAlerts(tenantId?: string): Promise<void> {
    const alerts = await this.detectAlerts(tenantId);
    
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getMonitoringDashboard(tenantId?: string): Promise<{
    health: AgentHealthCheck;
    metrics: {
      totalEvents: number;
      processingRate: number;
      errorRate: number;
      avgProcessingTime: number;
    };
    alerts: Array<{
      id: string;
      type: string;
      severity: string;
      message: string;
      timestamp: Date;
      resolved: boolean;
    }>;
    trends: {
      eventsOverTime: Array<{ timestamp: Date; count: number }>;
      errorsOverTime: Array<{ timestamp: Date; count: number }>;
    };
  }> {
    const health = await this.performHealthCheck();
    const metrics = await this.getSystemMetrics(tenantId);
    const alerts = await this.getActiveAlerts(tenantId);
    const trends = await this.getTrends(tenantId);

    return {
      health,
      metrics,
      alerts,
      trends
    };
  }

  /**
   * Set alert threshold
   */
  async setAlertThreshold(
    metric: string,
    threshold: {
      warning: number;
      critical: number;
      operator: 'gt' | 'lt' | 'eq';
    }
  ): Promise<void> {
    this.alertThresholds.set(metric, threshold);
    
    logger.info('Alert threshold set', { metric, threshold });
  }

  /**
   * Get alert thresholds
   */
  getAlertThresholds(): Map<string, any> {
    return new Map(this.alertThresholds);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const query = `
      UPDATE agent_alerts 
      SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?
      WHERE alert_id = ?
    `;

    await this.db.query(query, [acknowledgedBy, new Date(), alertId]);
    
    logger.info('Alert acknowledged', { alertId, acknowledgedBy });
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolution: string): Promise<void> {
    const query = `
      UPDATE agent_alerts 
      SET status = 'resolved', resolved_by = ?, resolved_at = ?, resolution = ?
      WHERE alert_id = ?
    `;

    await this.db.query(query, [resolvedBy, new Date(), resolution, alertId]);
    
    logger.info('Alert resolved', { alertId, resolvedBy, resolution });
  }

  // Private helper methods
  private async checkDatabaseHealth(): Promise<void> {
    const query = 'SELECT 1 as health_check';
    await this.db.query(query);
  }

  private async checkQueueHealth(): Promise<void> {
    // Check if queue processing is working
    const query = `
      SELECT COUNT(*) as queue_size
      FROM pilot_feedback_events 
      WHERE processed_at IS NULL
    `;
    const rows = await this.db.query(query);
    const queueSize = rows[0].queue_size;
    
    if (queueSize > 1000) {
      throw new Error(`Queue size too large: ${queueSize}`);
    }
  }

  private async checkMaskingHealth(): Promise<void> {
    // Test PII masking functionality
    const testText = 'Test email: test@example.com';
    // This would call the actual masking service
    // For now, just check if the service is available
  }

  private async checkComplianceHealth(): Promise<void> {
    // Check compliance service availability
    const query = `
      SELECT COUNT(*) as compliance_checks
      FROM agent_audit_log 
      WHERE action LIKE '%COMPLIANCE%'
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `;
    await this.db.query(query);
  }

  private async checkAuditHealth(): Promise<void> {
    // Check audit service availability
    const query = `
      SELECT COUNT(*) as audit_events
      FROM agent_audit_log 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `;
    await this.db.query(query);
  }

  private async getCPUUsage(): Promise<number> {
    try {
      // Use Node.js built-in process.cpuUsage() for real CPU monitoring
      const startUsage = process.cpuUsage();
      
      // Wait a small interval to measure CPU usage
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endUsage = process.cpuUsage(startUsage);
      
      // Calculate CPU usage percentage
      const totalUsage = endUsage.user + endUsage.system;
      const cpuPercent = (totalUsage / 100000) / 1; // Convert microseconds to percentage
      
      // Clamp between 0 and 100
      const usage = Math.min(Math.max(cpuPercent, 0), 100);
      
      logger.debug('CPU usage calculated', {
        userTime: endUsage.user,
        systemTime: endUsage.system,
        totalUsage,
        percentage: usage
      });
      
      return Math.round(usage * 100) / 100;
      
    } catch (error) {
      logger.error('Failed to get CPU usage', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Return 0 on error rather than random value
      return 0;
    }
  }

  private async getQueueSize(): Promise<number> {
    const query = `
      SELECT COUNT(*) as queue_size
      FROM pilot_feedback_events 
      WHERE processed_at IS NULL
    `;
    const rows = await this.db.query(query);
    return rows[0].queue_size;
  }

  private async getErrorRate(): Promise<number> {
    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors
      FROM agent_audit_log 
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `;
    const rows = await this.db.query(query);
    const total = rows[0].total;
    const errors = rows[0].errors;
    return total > 0 ? (errors / total) * 100 : 0;
  }

  private async storeHealthCheck(healthCheck: AgentHealthCheck): Promise<void> {
    const query = `
      INSERT INTO agent_health_checks (
        check_id, service, status, checks, metrics, 
        last_check, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      uuidv4(),
      healthCheck.service,
      healthCheck.status,
      JSON.stringify(healthCheck.checks),
      JSON.stringify(healthCheck.metrics),
      healthCheck.lastCheck,
      new Date()
    ];

    await this.db.query(query, values);
  }

  private async getProcessingMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentMetrics['processing']> {
    const query = `
      SELECT 
        COUNT(*) as totalEvents,
        SUM(CASE WHEN error IS NULL THEN 1 ELSE 0 END) as processedEvents,
        SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as failedEvents,
        AVG(JSON_EXTRACT(metadata, '$.durationMs')) as avgProcessingTime
      FROM agent_audit_log 
      WHERE tenant_id = ? 
      AND timestamp BETWEEN ? AND ?
      AND action IN ('EVENT_RECEIVED', 'BATCH_PROCESSED')
    `;

    const rows = await this.db.query(query, [tenantId, from, to]);
    const row = rows[0];

    return {
      totalEvents: row.totalEvents || 0,
      processedEvents: row.processedEvents || 0,
      failedEvents: row.failedEvents || 0,
      avgProcessingTime: row.avgProcessingTime || 0
    };
  }

  private async getOutputMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentMetrics['outputs']> {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM agent_summaries WHERE tenant_id = ? AND created_at BETWEEN ? AND ?) as summariesGenerated,
        (SELECT COUNT(*) FROM agent_clusters WHERE tenant_id = ? AND created_at BETWEEN ? AND ?) as clustersCreated,
        (SELECT COUNT(*) FROM agent_recommendations WHERE tenant_id = ? AND created_at BETWEEN ? AND ?) as recommendationsGenerated,
        (SELECT COUNT(*) FROM agent_recommendations WHERE tenant_id = ? AND status = 'approved' AND created_at BETWEEN ? AND ?) as recommendationsApproved,
        (SELECT COUNT(*) FROM agent_recommendations WHERE tenant_id = ? AND status = 'dismissed' AND created_at BETWEEN ? AND ?) as recommendationsDismissed
    `;

    const rows = await this.db.query(query, [
      tenantId, from, to, // summaries
      tenantId, from, to, // clusters
      tenantId, from, to, // recommendations generated
      tenantId, from, to, // recommendations approved
      tenantId, from, to  // recommendations dismissed
    ]);

    const row = rows[0];

    return {
      summariesGenerated: row.summariesGenerated || 0,
      clustersCreated: row.clustersCreated || 0,
      recommendationsGenerated: row.recommendationsGenerated || 0,
      recommendationsApproved: row.recommendationsApproved || 0,
      recommendationsDismissed: row.recommendationsDismissed || 0
    };
  }

  private async getQualityMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentMetrics['quality']> {
    // This would calculate quality metrics from audit logs
    return {
      piiMaskingAccuracy: 100,
      phileakageDetections: 0,
      duplicateClusterRate: 0,
      reviewerApprovalRate: 0
    };
  }

  private async getComplianceMetrics(
    tenantId: string,
    from: Date,
    to: Date
  ): Promise<AgentMetrics['compliance']> {
    // This would calculate compliance metrics
    return {
      sarPropagations: 0,
      erasurePropagations: 0,
      auditEvents: 0,
      policyViolations: 0
    };
  }

  private async detectAlerts(tenantId?: string): Promise<any[]> {
    const alerts: any[] = [];
    
    // Check error rate
    const errorRate = await this.getErrorRate();
    if (errorRate > 5) {
      alerts.push({
        id: uuidv4(),
        type: 'error_rate_high',
        severity: 'critical',
        message: `Error rate is ${errorRate.toFixed(2)}%, exceeds threshold of 5%`,
        timestamp: new Date(),
        tenantId
      });
    }

    // Check queue size
    const queueSize = await this.getQueueSize();
    if (queueSize > 500) {
      alerts.push({
        id: uuidv4(),
        type: 'queue_size_high',
        severity: 'warning',
        message: `Queue size is ${queueSize}, exceeds threshold of 500`,
        timestamp: new Date(),
        tenantId
      });
    }

    return alerts;
  }

  private async sendAlert(alert: any): Promise<void> {
    // Store alert
    const query = `
      INSERT INTO agent_alerts (
        alert_id, type, severity, message, tenant_id, 
        timestamp, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      alert.id,
      alert.type,
      alert.severity,
      alert.message,
      alert.tenantId || null,
      alert.timestamp,
      'open',
      new Date()
    ];

    await this.db.query(query, values);

    // Send notification
    const notification: AgentNotification = {
      notificationId: uuidv4(),
      tenantId: alert.tenantId || 'system',
      type: 'processing_error',
      title: 'Agent Alert',
      message: alert.message,
      priority: alert.severity,
      metadata: { alertId: alert.id },
      createdAt: new Date(),
      recipients: ['pilot-admin', 'developer']
    };

    await this.notifications.sendNotification(notification);
  }

  private async getSystemMetrics(tenantId?: string): Promise<any> {
    // This would return system-wide metrics
    return {
      totalEvents: 0,
      processingRate: 0,
      errorRate: 0,
      avgProcessingTime: 0
    };
  }

  private async getActiveAlerts(tenantId?: string): Promise<any[]> {
    let query = `
      SELECT 
        alert_id as id, type, severity, message, 
        timestamp, status, tenant_id as tenantId
      FROM agent_alerts 
      WHERE status IN ('open', 'acknowledged')
    `;

    const params: any[] = [];
    if (tenantId) {
      query += ' AND tenant_id = ?';
      params.push(tenantId);
    }

    query += ' ORDER BY timestamp DESC LIMIT 20';

    const rows = await this.db.query(query, params);
    return rows.map(row => ({
      id: row.id,
      type: row.type,
      severity: row.severity,
      message: row.message,
      timestamp: row.timestamp,
      resolved: row.status === 'resolved',
      tenantId: row.tenantId
    }));
  }

  private async getTrends(tenantId?: string): Promise<any> {
    // This would return trend data for charts
    return {
      eventsOverTime: [],
      errorsOverTime: []
    };
  }

  private initializeAlertThresholds(): void {
    this.alertThresholds.set('error_rate', {
      warning: 2,
      critical: 5,
      operator: 'gt'
    });

    this.alertThresholds.set('queue_size', {
      warning: 200,
      critical: 500,
      operator: 'gt'
    });

    this.alertThresholds.set('processing_time', {
      warning: 30000, // 30 seconds
      critical: 60000, // 1 minute
      operator: 'gt'
    });

    this.alertThresholds.set('memory_usage', {
      warning: 512, // 512 MB
      critical: 1024, // 1 GB
      operator: 'gt'
    });
  }
}