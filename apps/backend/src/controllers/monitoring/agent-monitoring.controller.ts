/**
 * @fileoverview agent-monitoring.controller
 * @module Monitoring/Agent-monitoring.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agent-monitoring.controller
 */

import { Request, Response } from 'express';
import { AgentMonitoringService } from '../../services/monitoring/agent-monitoring.service';
import { logger } from '../../utils/logger';

export class AgentMonitoringController {
  privatemonitoringService: AgentMonitoringService;

  constructor() {
    this.monitoringService = new AgentMonitoringService();
  }

  /**
   * Get health check status
   * GET /monitoring/agent/health
   */
  async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.monitoringService.performHealthCheck();

      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 503;

      res.status(statusCode).json({
        success: health.status === 'healthy' || health.status === 'degraded',
        data: health
      });

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }

  /**
   * Get agent metrics
   * GET /monitoring/agent/metrics
   */
  async getAgentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { from, to } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
        return;
      }

      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const toDate = to ? new Date(to as string) : new Date();

      const metrics = await this.monitoringService.getAgentMetrics(
        tenantId,
        fromDate,
        toDate
      );

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error('Failed to get agent metrics', {
        tenantId: req.params.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get agent metrics',
        error: error.message
      });
    }
  }

  /**
   * Get monitoring dashboard
   * GET /monitoring/agent/dashboard
   */
  async getMonitoringDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.query;

      const dashboard = await this.monitoringService.getMonitoringDashboard(
        tenantId as string
      );

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Failed to get monitoring dashboard', {
        tenantId: req.query.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get monitoring dashboard',
        error: error.message
      });
    }
  }

  /**
   * Get active alerts
   * GET /monitoring/agent/alerts
   */
  async getActiveAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, status, severity, limit } = req.query;

      // This would call a method to get alerts with filtering
      const alerts = [];

      res.json({
        success: true,
        data: alerts
      });

    } catch (error) {
      logger.error('Failed to get active alerts', {
        tenantId: req.query.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get active alerts',
        error: error.message
      });
    }
  }

  /**
   * Acknowledge alert
   * POST /monitoring/agent/alerts/:alertId/acknowledge
   */
  async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { notes } = req.body;
      const acknowledgedBy = req.user?.id;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'Alert ID is required'
        });
        return;
      }

      if (!acknowledgedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.monitoringService.acknowledgeAlert(alertId, acknowledgedBy);

      logger.info('Alert acknowledged', {
        alertId,
        acknowledgedBy
      });

      res.json({
        success: true,
        message: 'Alert acknowledged successfully'
      });

    } catch (error) {
      logger.error('Failed to acknowledge alert', {
        alertId: req.params.alertId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge alert',
        error: error.message
      });
    }
  }

  /**
   * Resolve alert
   * POST /monitoring/agent/alerts/:alertId/resolve
   */
  async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const { alertId } = req.params;
      const { resolution } = req.body;
      const resolvedBy = req.user?.id;

      if (!alertId) {
        res.status(400).json({
          success: false,
          message: 'Alert ID is required'
        });
        return;
      }

      if (!resolution) {
        res.status(400).json({
          success: false,
          message: 'Resolution is required'
        });
        return;
      }

      if (!resolvedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      await this.monitoringService.resolveAlert(alertId, resolvedBy, resolution);

      logger.info('Alert resolved', {
        alertId,
        resolvedBy,
        resolution
      });

      res.json({
        success: true,
        message: 'Alert resolved successfully'
      });

    } catch (error) {
      logger.error('Failed to resolve alert', {
        alertId: req.params.alertId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to resolve alert',
        error: error.message
      });
    }
  }

  /**
   * Set alert threshold
   * POST /monitoring/agent/thresholds
   */
  async setAlertThreshold(req: Request, res: Response): Promise<void> {
    try {
      const { metric, threshold } = req.body;

      if (!metric || !threshold) {
        res.status(400).json({
          success: false,
          message: 'Metric and threshold are required'
        });
        return;
      }

      if (!threshold.warning || !threshold.critical || !threshold.operator) {
        res.status(400).json({
          success: false,
          message: 'Threshold must include warning, critical, and operator'
        });
        return;
      }

      await this.monitoringService.setAlertThreshold(metric, threshold);

      logger.info('Alert threshold set', {
        metric,
        threshold,
        setBy: req.user?.id
      });

      res.json({
        success: true,
        message: 'Alert threshold set successfully'
      });

    } catch (error) {
      logger.error('Failed to set alert threshold', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to set alert threshold',
        error: error.message
      });
    }
  }

  /**
   * Get alert thresholds
   * GET /monitoring/agent/thresholds
   */
  async getAlertThresholds(req: Request, res: Response): Promise<void> {
    try {
      const thresholds = this.monitoringService.getAlertThresholds();
      const thresholdsArray = Array.from(thresholds.entries()).map(([metric, threshold]) => ({
        metric,
        ...threshold
      }));

      res.json({
        success: true,
        data: thresholdsArray
      });

    } catch (error) {
      logger.error('Failed to get alert thresholds', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get alert thresholds',
        error: error.message
      });
    }
  }

  /**
   * Trigger manual health check
   * POST /monitoring/agent/health-check
   */
  async triggerHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.monitoringService.performHealthCheck();

      res.json({
        success: true,
        data: health,
        message: 'Health check completed'
      });

    } catch (error) {
      logger.error('Manual health check failed', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }

  /**
   * Get system status
   * GET /monitoring/agent/status
   */
  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const health = await this.monitoringService.performHealthCheck();
      const alerts = await this.monitoringService.getActiveAlerts();

      const status = {
        overall: health.status,
        services: health.checks,
        metrics: health.metrics,
        activeAlerts: alerts.length,
        lastCheck: health.lastCheck
      };

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Failed to get system status', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: error.message
      });
    }
  }
}
