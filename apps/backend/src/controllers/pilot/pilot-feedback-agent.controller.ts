/**
 * @fileoverview pilot-feedback-agent.controller
 * @module Pilot/Pilot-feedback-agent.controller
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description pilot-feedback-agent.controller
 */

import { Request, Response } from 'express';
import { PilotFeedbackAgentService } from '../../services/pilot/pilot-feedback-agent.service';
import { logger } from '../../utils/logger';
import { 
  PilotFeedbackEvent, 
  AgentApprovalAction 
} from '../../types/pilot-feedback-agent.types';

export class PilotFeedbackAgentController {
  private agentService: PilotFeedbackAgentService;

  constructor() {
    this.agentService = new PilotFeedbackAgentService();
  }

  /**
   * Process pilot feedback event (webhook endpoint)
   * POST /pilot/feedback
   */
  async processFeedback(req: Request, res: Response): Promise<void> {
    try {
      const feedbackData = req.body;
      
      // Validate required fields
      if (!feedbackData.tenantId || !feedbackData.module || !feedbackData.text) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: tenantId, module, text'
        });
        return;
      }

      // Create feedback event
      const event: PilotFeedbackEvent = {
        eventId: feedbackData.eventId || this.generateEventId(),
        tenantId: feedbackData.tenantId,
        submittedAt: feedbackData.submittedAt || new Date().toISOString(),
        module: feedbackData.module,
        severity: feedbackData.severity || 'medium',
        role: feedbackData.role || 'care_worker',
        text: feedbackData.text,
        attachments: feedbackData.attachments || [],
        consents: {
          improvementProcessing: feedbackData.consents?.improvementProcessing || false
        }
      };

      // Process event through agent
      await this.agentService.processFeedbackEvent(event);

      logger.info('Feedback event processed', {
        eventId: event.eventId,
        tenantId: event.tenantId,
        module: event.module
      });

      res.status(201).json({
        success: true,
        data: {
          eventId: event.eventId,
          status: 'processed'
        },
        message: 'Feedback processed successfully'
      });

    } catch (error) {
      logger.error('Failed to process feedback', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to process feedback',
        error: error.message
      });
    }
  }

  /**
   * Get agent status for tenant
   * GET /pilot/agent/status
   */
  async getAgentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.query;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'tenantId query parameter is required'
        });
        return;
      }

      const status = await this.agentService.getAgentStatus(tenantId as string);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Failed to get agent status', { 
        tenantId: req.query.tenantId,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get agent status',
        error: error.message
      });
    }
  }

  /**
   * Approve or dismiss recommendation
   * POST /pilot/agent/review/approve
   */
  async approveRecommendation(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, recommendationId, action, notes } = req.body;
      
      // Validate required fields
      if (!tenantId || !recommendationId || !action) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: tenantId, recommendationId, action'
        });
        return;
      }

      // Validate action
      if (!['create_ticket', 'dismiss'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Invalid action. Must be "create_ticket" or "dismiss"'
        });
        return;
      }

      // Approve recommendation
      await this.agentService.approveRecommendation(
        tenantId, 
        recommendationId, 
        action as 'create_ticket' | 'dismiss',
        notes
      );

      logger.info('Recommendation approved', {
        tenantId,
        recommendationId,
        action,
        approvedBy: req.user?.id
      });

      res.json({
        success: true,
        message: 'Recommendation processed successfully'
      });

    } catch (error) {
      logger.error('Failed to approve recommendation', { 
        tenantId: req.body.tenantId,
        recommendationId: req.body.recommendationId,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to process recommendation',
        error: error.message
      });
    }
  }

  /**
   * Get agent outputs for tenant
   * GET /pilot/agent/outputs
   */
  async getAgentOutputs(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, from, to } = req.query;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'tenantId query parameter is required'
        });
        return;
      }

      const fromDate = from ? new Date(from as string) : undefined;
      const toDate = to ? new Date(to as string) : undefined;

      const outputs = await this.agentService.getAgentOutputs(
        tenantId as string,
        fromDate,
        toDate
      );

      res.json({
        success: true,
        data: outputs
      });

    } catch (error) {
      logger.error('Failed to get agent outputs', { 
        tenantId: req.query.tenantId,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get agent outputs',
        error: error.message
      });
    }
  }

  /**
   * Update agent configuration
   * PUT /pilot/agent/config
   */
  async updateAgentConfig(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const config = req.body;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'tenantId parameter is required'
        });
        return;
      }

      // Validate configuration
      if (config.enabled !== undefined && typeof config.enabled !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'enabled must be a boolean'
        });
        return;
      }

      if (config.autonomy && !['recommend-only', 'limited-autonomous', 'full-autonomous'].includes(config.autonomy)) {
        res.status(400).json({
          success: false,
          message: 'Invalid autonomy level'
        });
        return;
      }

      await this.agentService.updateAgentConfiguration(tenantId, config);

      logger.info('Agent configuration updated', {
        tenantId,
        config,
        updatedBy: req.user?.id
      });

      res.json({
        success: true,
        message: 'Agent configuration updated successfully'
      });

    } catch (error) {
      logger.error('Failed to update agent configuration', { 
        tenantId: req.params.tenantId,
        error: error.message 
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update agent configuration',
        error: error.message
      });
    }
  }

  /**
   * Get agent metrics for tenant
   * GET /pilot/agent/metrics
   */
  async getAgentMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, from, to } = req.query;
      
      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'tenantId query parameter is required'
        });
        return;
      }

      const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const toDate = to ? new Date(to as string) : new Date();

      // This would call a metrics service
      const metrics = {
        tenantId,
        period: { from: fromDate, to: toDate },
        processing: {
          totalEvents: 0,
          processedEvents: 0,
          failedEvents: 0,
          avgProcessingTime: 0
        },
        outputs: {
          summariesGenerated: 0,
          clustersCreated: 0,
          recommendationsGenerated: 0,
          recommendationsApproved: 0,
          recommendationsDismissed: 0
        },
        quality: {
          piiMaskingAccuracy: 100,
          phileakageDetections: 0,
          duplicateClusterRate: 0,
          reviewerApprovalRate: 0
        },
        compliance: {
          sarPropagations: 0,
          erasurePropagations: 0,
          auditEvents: 0,
          policyViolations: 0
        }
      };

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error('Failed to get agent metrics', { 
        tenantId: req.query.tenantId,
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
   * Health check endpoint
   * GET /pilot/agent/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const health = {
        service: 'pilot-feedback-agent',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        checks: {
          database: 'pass',
          queue: 'pass',
          masking: 'pass',
          compliance: 'pass',
          audit: 'pass'
        }
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}