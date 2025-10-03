import { Request, Response } from 'express';
import { AgentReviewService } from '../../services/pilot/agent-review.service';
import { logger } from '../../utils/logger';

export class AgentReviewController {
  private reviewService: AgentReviewService;

  constructor() {
    this.reviewService = new AgentReviewService();
  }

  /**
   * Get pending recommendations for review
   * GET /pilot/agent/review/pending
   */
  async getPendingRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { priority, module, limit, offset } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
        return;
      }

      const filters = {
        priority: priority as 'low' | 'medium' | 'high' | 'critical' | undefined,
        module: module as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      };

      const recommendations = await this.reviewService.getPendingRecommendations(
        tenantId,
        filters
      );

      res.json({
        success: true,
        data: recommendations,
        pagination: {
          limit: filters.limit || 20,
          offset: filters.offset || 0,
          total: recommendations.length
        }
      });

    } catch (error) {
      logger.error('Failed to get pending recommendations', {
        tenantId: req.params.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get pending recommendations',
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
      const { recommendationId } = req.params;
      const { action, notes } = req.body;
      const approvedBy = req.user?.id;

      if (!recommendationId) {
        res.status(400).json({
          success: false,
          message: 'Recommendation ID is required'
        });
        return;
      }

      if (!action || !['create_ticket', 'dismiss', 'escalate', 'request_more_info'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Valid action is required'
        });
        return;
      }

      if (!approvedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const approvalAction = await this.reviewService.approveRecommendation(
        recommendationId,
        approvedBy,
        action as 'create_ticket' | 'dismiss' | 'escalate' | 'request_more_info',
        notes
      );

      logger.info('Recommendation approved', {
        recommendationId,
        action,
        approvedBy
      });

      res.json({
        success: true,
        data: approvalAction,
        message: 'Recommendation processed successfully'
      });

    } catch (error) {
      logger.error('Failed to approve recommendation', {
        recommendationId: req.params.recommendationId,
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
   * Get approval history for recommendation
   * GET /pilot/agent/review/:recommendationId/history
   */
  async getApprovalHistory(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;

      if (!recommendationId) {
        res.status(400).json({
          success: false,
          message: 'Recommendation ID is required'
        });
        return;
      }

      const history = await this.reviewService.getApprovalHistory(recommendationId);

      res.json({
        success: true,
        data: history
      });

    } catch (error) {
      logger.error('Failed to get approval history', {
        recommendationId: req.params.recommendationId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get approval history',
        error: error.message
      });
    }
  }

  /**
   * Get review statistics
   * GET /pilot/agent/review/statistics
   */
  async getReviewStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;
      const { days } = req.query;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
        return;
      }

      const statistics = await this.reviewService.getReviewStatistics(
        tenantId,
        days ? parseInt(days as string) : 30
      );

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      logger.error('Failed to get review statistics', {
        tenantId: req.params.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get review statistics',
        error: error.message
      });
    }
  }

  /**
   * Get urgent recommendations
   * GET /pilot/agent/review/urgent
   */
  async getUrgentRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
        return;
      }

      const urgent = await this.reviewService.getUrgentRecommendations(tenantId);

      res.json({
        success: true,
        data: urgent,
        count: urgent.length
      });

    } catch (error) {
      logger.error('Failed to get urgent recommendations', {
        tenantId: req.params.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get urgent recommendations',
        error: error.message
      });
    }
  }

  /**
   * Bulk approve recommendations
   * POST /pilot/agent/review/bulk-approve
   */
  async bulkApproveRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationIds, action, notes } = req.body;
      const approvedBy = req.user?.id;

      if (!recommendationIds || !Array.isArray(recommendationIds) || recommendationIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Recommendation IDs array is required'
        });
        return;
      }

      if (!action || !['create_ticket', 'dismiss'].includes(action)) {
        res.status(400).json({
          success: false,
          message: 'Valid action is required'
        });
        return;
      }

      if (!approvedBy) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      const results = await this.reviewService.bulkApproveRecommendations(
        recommendationIds,
        approvedBy,
        action as 'create_ticket' | 'dismiss',
        notes
      );

      logger.info('Bulk approval completed', {
        total: recommendationIds.length,
        successful: results.length,
        approvedBy
      });

      res.json({
        success: true,
        data: {
          total: recommendationIds.length,
          successful: results.length,
          failed: recommendationIds.length - results.length,
          results
        },
        message: 'Bulk approval completed'
      });

    } catch (error) {
      logger.error('Failed to bulk approve recommendations', {
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to bulk approve recommendations',
        error: error.message
      });
    }
  }

  /**
   * Get review dashboard
   * GET /pilot/agent/review/dashboard
   */
  async getReviewDashboard(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        res.status(400).json({
          success: false,
          message: 'Tenant ID is required'
        });
        return;
      }

      const dashboard = await this.reviewService.getReviewDashboard(tenantId);

      res.json({
        success: true,
        data: dashboard
      });

    } catch (error) {
      logger.error('Failed to get review dashboard', {
        tenantId: req.params.tenantId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get review dashboard',
        error: error.message
      });
    }
  }

  /**
   * Get recommendation details
   * GET /pilot/agent/review/:recommendationId
   */
  async getRecommendationDetails(req: Request, res: Response): Promise<void> {
    try {
      const { recommendationId } = req.params;

      if (!recommendationId) {
        res.status(400).json({
          success: false,
          message: 'Recommendation ID is required'
        });
        return;
      }

      // This would get detailed recommendation information including linked feedback
      const details = {
        recommendationId,
        // Additional details would be fetched here
        status: 'pending',
        theme: 'ui_performance',
        priority: 'high',
        proposedActions: [
          'Profile API endpoint performance',
          'Add optimistic UI updates'
        ],
        linkedFeedback: [],
        createdAt: new Date(),
        requiresApproval: true
      };

      res.json({
        success: true,
        data: details
      });

    } catch (error) {
      logger.error('Failed to get recommendation details', {
        recommendationId: req.params.recommendationId,
        error: error.message
      });
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendation details',
        error: error.message
      });
    }
  }
}