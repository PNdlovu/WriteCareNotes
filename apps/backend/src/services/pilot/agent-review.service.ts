/**
 * @fileoverview agent-review.service
 * @module Pilot/Agent-review.service
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description agent-review.service
 */

import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { 
  AgentRecommendation, 
  AgentReviewRequest, 
  AgentApprovalAction,
  AgentNotification 
} from '../../types/pilot-feedback-agent.types';
import { PilotFeedbackAgentRepository } from '../../repositories/pilot-feedback-agent.repository';
import { NotificationService } from '../notifications/notification.service';
import { AuditService } from '../audit/agent-audit.service';

export class AgentReviewService {
  private repository: PilotFeedbackAgentRepository;
  private notifications: NotificationService;
  private audit: AuditService;

  constructor() {
    this.repository = new PilotFeedbackAgentRepository();
    this.notifications = new NotificationService();
    this.audit = new AuditService();
  }

  /**
   * Get pending recommendations for review
   */
  async getPendingRecommendations(
    tenantId: string,
    filters: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      module?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<AgentReviewRequest[]> {
    let query = `
      SELECT 
        r.recommendation_id as recommendationId,
        r.tenant_id as tenantId,
        r.theme,
        r.proposed_actions as proposedActions,
        r.priority,
        r.linked_feedback_ids as linkedFeedbackIds,
        r.created_at as createdAt,
        COUNT(f.id) as linkedFeedbackCount
      FROM agent_recommendations r
      LEFT JOIN pilot_feedback_events f ON JSON_CONTAINS(r.linked_feedback_ids, JSON_QUOTE(f.event_id))
      WHERE r.tenant_id = ? 
      AND r.status = 'pending'
      AND r.requires_approval = true
    `;

    const params: any[] = [tenantId];

    if (filters.priority) {
      query += ' AND r.priority = ?';
      params.push(filters.priority);
    }

    if (filters.module) {
      query += ` AND EXISTS (
        SELECT 1 FROM pilot_feedback_events f2 
        WHERE JSON_CONTAINS(r.linked_feedback_ids, JSON_QUOTE(f2.event_id))
        AND f2.module = ?
      )`;
      params.push(filters.module);
    }

    query += ' GROUP BY r.recommendation_id, r.tenant_id, r.theme, r.proposed_actions, r.priority, r.created_at';
    query += ' ORDER BY r.priority DESC, r.created_at ASC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }

    const rows = await this.repository.query(query, params);

    return rows.map(row => ({
      recommendationId: row.recommendationId,
      tenantId: row.tenantId,
      theme: row.theme,
      proposedActions: JSON.parse(row.proposedActions || '[]'),
      priority: row.priority,
      linkedFeedbackCount: row.linkedFeedbackCount,
      createdAt: row.createdAt,
      requiresUrgentReview: this.requiresUrgentReview(row.priority, row.createdAt)
    }));
  }

  /**
   * Approve recommendation
   */
  async approveRecommendation(
    recommendationId: string,
    approvedBy: string,
    action: 'create_ticket' | 'dismiss' | 'escalate' | 'request_more_info',
    notes?: string
  ): Promise<AgentApprovalAction> {
    const correlationId = uuidv4();

    try {
      // Get recommendation details
      const recommendation = await this.repository.getRecommendation(recommendationId);
      if (!recommendation) {
        throw new Error('Recommendation not found');
      }

      // Update recommendation status
      await this.repository.updateRecommendationStatus(
        recommendationId,
        action === 'create_ticket' ? 'create_ticket' : 'dismiss',
        notes
      );

      // Create approval action record
      const approvalAction: AgentApprovalAction = {
        recommendationId,
        tenantId: recommendation.tenantId,
        action,
        notes,
        approvedBy,
        approvedAt: new Date()
      };

      // Store approval action
      await this.storeApprovalAction(approvalAction);

      // Log audit event
      await this.audit.logAgentEvent({
        correlationId,
        tenantId: recommendation.tenantId,
        action: 'RECOMMENDATION_APPROVED',
        recommendationId,
        metadata: {
          action,
          approvedBy,
          notes,
          theme: recommendation.theme
        }
      });

      // Send notifications
      await this.notifyApprovalAction(approvalAction, recommendation);

      logger.info('Recommendation approved', {
        recommendationId,
        tenantId: recommendation.tenantId,
        action,
        approvedBy
      });

      return approvalAction;

    } catch (error) {
      logger.error('Failed to approve recommendation', {
        recommendationId,
        approvedBy,
        action,
        error: error.message
      });

      await this.audit.logAgentEvent({
        correlationId,
        tenantId: '',
        action: 'RECOMMENDATION_APPROVAL_FAILED',
        recommendationId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get approval history for recommendation
   */
  async getApprovalHistory(recommendationId: string): Promise<AgentApprovalAction[]> {
    const query = `
      SELECT 
        recommendation_id as recommendationId,
        tenant_id as tenantId,
        action,
        notes,
        approved_by as approvedBy,
        approved_at as approvedAt
      FROM agent_approval_actions 
      WHERE recommendation_id = ?
      ORDER BY approved_at ASC
    `;

    const rows = await this.repository.query(query, [recommendationId]);

    return rows.map(row => ({
      recommendationId: row.recommendationId,
      tenantId: row.tenantId,
      action: row.action,
      notes: row.notes,
      approvedBy: row.approvedBy,
      approvedAt: row.approvedAt
    }));
  }

  /**
   * Get review statistics for tenant
   */
  async getReviewStatistics(tenantId: string, days: number = 30): Promise<{
    totalRecommendations: number;
    pendingRecommendations: number;
    approvedRecommendations: number;
    dismissedRecommendations: number;
    averageReviewTime: number; // hours
    priorityBreakdown: Record<string, number>;
    moduleBreakdown: Record<string, number>;
  }> {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get basic counts
    const countsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'dismissed' THEN 1 ELSE 0 END) as dismissed
      FROM agent_recommendations 
      WHERE tenant_id = ? AND created_at >= ?
    `;
    const countsRows = await this.repository.query(countsQuery, [tenantId, from]);
    const counts = countsRows[0];

    // Get average review time
    const reviewTimeQuery = `
      SELECT 
        AVG(TIMESTAMPDIFF(HOUR, r.created_at, a.approved_at)) as avgReviewTime
      FROM agent_recommendations r
      JOIN agent_approval_actions a ON r.recommendation_id = a.recommendation_id
      WHERE r.tenant_id = ? 
      AND r.created_at >= ?
      AND r.status != 'pending'
    `;
    const reviewTimeRows = await this.repository.query(reviewTimeQuery, [tenantId, from]);
    const avgReviewTime = reviewTimeRows[0].avgReviewTime || 0;

    // Get priority breakdown
    const priorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM agent_recommendations 
      WHERE tenant_id = ? AND created_at >= ?
      GROUP BY priority
    `;
    const priorityRows = await this.repository.query(priorityQuery, [tenantId, from]);
    const priorityBreakdown = priorityRows.reduce((acc, row) => {
      acc[row.priority] = row.count;
      return acc;
    }, {} as Record<string, number>);

    // Get module breakdown
    const moduleQuery = `
      SELECT 
        f.module,
        COUNT(DISTINCT r.recommendation_id) as count
      FROM agent_recommendations r
      JOIN pilot_feedback_events f ON JSON_CONTAINS(r.linked_feedback_ids, JSON_QUOTE(f.event_id))
      WHERE r.tenant_id = ? AND r.created_at >= ?
      GROUP BY f.module
    `;
    const moduleRows = await this.repository.query(moduleQuery, [tenantId, from]);
    const moduleBreakdown = moduleRows.reduce((acc, row) => {
      acc[row.module] = row.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRecommendations: counts.total,
      pendingRecommendations: counts.pending,
      approvedRecommendations: counts.approved,
      dismissedRecommendations: counts.dismissed,
      averageReviewTime: Math.round(avgReviewTime * 100) / 100,
      priorityBreakdown,
      moduleBreakdown
    };
  }

  /**
   * Get recommendations requiring urgent review
   */
  async getUrgentRecommendations(tenantId: string): Promise<AgentReviewRequest[]> {
    return await this.getPendingRecommendations(tenantId, {
      priority: 'critical',
      limit: 10
    });
  }

  /**
   * Bulk approve recommendations
   */
  async bulkApproveRecommendations(
    recommendationIds: string[],
    approvedBy: string,
    action: 'create_ticket' | 'dismiss',
    notes?: string
  ): Promise<AgentApprovalAction[]> {
    const results: AgentApprovalAction[] = [];

    for (const recommendationId of recommendationIds) {
      try {
        const approvalAction = await this.approveRecommendation(
          recommendationId,
          approvedBy,
          action,
          notes
        );
        results.push(approvalAction);
      } catch (error) {
        logger.error('Failed to approve recommendation in bulk', {
          recommendationId,
          error: error.message
        });
      }
    }

    logger.info('Bulk approval completed', {
      total: recommendationIds.length,
      successful: results.length,
      failed: recommendationIds.length - results.length
    });

    return results;
  }

  /**
   * Get review dashboard data
   */
  async getReviewDashboard(tenantId: string): Promise<{
    overview: {
      totalPending: number;
      urgentCount: number;
      avgReviewTime: number;
      complianceScore: number;
    };
    recentActivity: Array<{
      recommendationId: string;
      theme: string;
      priority: string;
      action: string;
      approvedBy: string;
      approvedAt: Date;
    }>;
    topThemes: Array<{
      theme: string;
      count: number;
      avgPriority: string;
    }>;
  }> {
    const stats = await this.getReviewStatistics(tenantId, 7); // Last 7 days
    const urgent = await this.getUrgentRecommendations(tenantId);

    // Get recent activity
    const activityQuery = `
      SELECT 
        a.recommendation_id as recommendationId,
        r.theme,
        r.priority,
        a.action,
        a.approved_by as approvedBy,
        a.approved_at as approvedAt
      FROM agent_approval_actions a
      JOIN agent_recommendations r ON a.recommendation_id = r.recommendation_id
      WHERE a.tenant_id = ?
      ORDER BY a.approved_at DESC
      LIMIT 10
    `;
    const activityRows = await this.repository.query(activityQuery, [tenantId]);

    // Get top themes
    const themesQuery = `
      SELECT 
        theme,
        COUNT(*) as count,
        AVG(CASE 
          WHEN priority = 'critical' THEN 4
          WHEN priority = 'high' THEN 3
          WHEN priority = 'medium' THEN 2
          ELSE 1
        END) as avgPriorityScore
      FROM agent_recommendations 
      WHERE tenant_id = ? 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY theme
      ORDER BY count DESC
      LIMIT 5
    `;
    const themesRows = await this.repository.query(themesQuery, [tenantId]);

    const priorityMap = { 1: 'low', 2: 'medium', 3: 'high', 4: 'critical' };

    return {
      overview: {
        totalPending: stats.pendingRecommendations,
        urgentCount: urgent.length,
        avgReviewTime: stats.averageReviewTime,
        complianceScore: 95 // Would be calculated from compliance service
      },
      recentActivity: activityRows.map(row => ({
        recommendationId: row.recommendationId,
        theme: row.theme,
        priority: row.priority,
        action: row.action,
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt
      })),
      topThemes: themesRows.map(row => ({
        theme: row.theme,
        count: row.count,
        avgPriority: priorityMap[Math.round(row.avgPriorityScore)] || 'low'
      }))
    };
  }

  // Helper methods
  private requiresUrgentReview(priority: string, createdAt: Date): boolean {
    if (priority === 'critical') return true;
    
    const hoursSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
    if (priority === 'high' && hoursSinceCreated > 24) return true;
    if (priority === 'medium' && hoursSinceCreated > 72) return true;
    
    return false;
  }

  private async storeApprovalAction(action: AgentApprovalAction): Promise<void> {
    const query = `
      INSERT INTO agent_approval_actions (
        recommendation_id, tenant_id, action, notes, 
        approved_by, approved_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      action.recommendationId,
      action.tenantId,
      action.action,
      action.notes || null,
      action.approvedBy,
      action.approvedAt,
      new Date()
    ];

    await this.repository.query(query, values);
  }

  private async notifyApprovalAction(
    action: AgentApprovalAction, 
    recommendation: AgentRecommendation
  ): Promise<void> {
    const notification: AgentNotification = {
      notificationId: uuidv4(),
      tenantId: action.tenantId,
      type: 'recommendation_approved',
      title: 'Recommendation Approved',
      message: `Recommendation for "${recommendation.theme}" has been ${action.action}`,
      priority: recommendation.priority,
      metadata: {
        recommendationId: action.recommendationId,
        action: action.action,
        approvedBy: action.approvedBy
      },
      createdAt: new Date(),
      recipients: ['pilot-admin', 'developer'] // Would be determined by role
    };

    await this.notifications.sendNotification(notification);
  }
}