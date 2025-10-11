/**
 * @fileoverview policy status Service
 * @module Policy-authoring/PolicyStatusService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description policy status Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { PolicyDraft, PolicyStatus } from '../../entities/policy-draft.entity';
import { UserAcknowledgment } from '../../entities/user-acknowledgment.entity';
import { AuditEvent, AuditEventType } from '../../entities/audit-event.entity';

export enum PolicyTrackingColor {
  GREEN = 'green',    // ✅ Compliant
  AMBER = 'amber',    // ⏳ Review Due  
  RED = 'red',        // ❌ Non-Compliant
  BLUE = 'blue',      // 🆕 New Policy
  GREY = 'grey'       // 🛠️ In Draft
}

export interface PolicyTrackingStatus {
  color: PolicyTrackingColor;
  icon: string;
  label: string;
  description: string;
  actionRequired: boolean;
  daysUntilAction?: number;
  actionType?: 'review' | 'acknowledge' | 'renew' | 'approve' | 'enforce';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface PolicyDashboardItem {
  policy: PolicyDraft;
  status: PolicyTrackingStatus;
  acknowledgmentStats: {
    totalRequired: number;
    totalAcknowledged: number;
    percentageComplete: number;
    overdue: number;
  };
  complianceMetrics: {
    lastEnforced: Date | null;
    enforcementFailures: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  reviewMetrics: {
    daysUntilReview: number;
    isOverdue: boolean;
    lastReviewDate: Date | null;
  };
}

export interface PolicyFilterOptions {
  colors?: PolicyTrackingColor[];
  jurisdictions?: string[];
  linkedModules?: string[];
  categories?: string[];
  statuses?: PolicyStatus[];
  reviewDueDays?: number;
  acknowledgmentThreshold?: number;
  organizationId?: string;
}

@Injectable()
export class PolicyStatusService {
  private readonly logger = new Logger(PolicyStatusService.name);

  /**
   * Calculate the color-coded status for a policy
   */
  calculatePolicyStatus(
    policy: PolicyDraft,
    acknowledgments: UserAcknowledgment[],
    totalUsers: number,
    enforcementFailures: number = 0,
    lastEnforced: Date | null = null
  ): PolicyTrackingStatus {
    const now = new Date();
    
    // 🛠️ Grey (In Draft) - Not yet published
    if (policy.status === PolicyStatus.DRAFT || policy.status === PolicyStatus.UNDER_REVIEW || policy.status === PolicyStatus.APPROVED) {
      return {
        color: PolicyTrackingColor.GREY,
        icon: '🛠️',
        label: 'In Draft',
        description: 'Policy not yet published—visible only to admins',
        actionRequired: true,
        actionType: policy.status === PolicyStatus.APPROVED ? 'approve' : 'review',
        priority: 'medium'
      };
    }

    // Check if policy is expired
    const isExpired = policy.expiryDate && policy.expiryDate < now;
    
    // Check if policy review is due
    const reviewDate = policy.reviewDue;
    const daysUntilReview = reviewDate ? Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;
    const isReviewDue = daysUntilReview <= 30; // Review due within 30 days
    const isReviewOverdue = daysUntilReview < 0;

    // Check acknowledgment completion
    const acknowledgmentRate = totalUsers > 0 ? (acknowledgments.length / totalUsers) * 100 : 100;
    const isAcknowledgmentComplete = acknowledgmentRate >= 95; // 95% threshold for complete
    
    // Check if policy is new (published within last 30 days)
    const publishedDate = policy.publishedAt;
    const isNewPolicy = publishedDate && (now.getTime() - publishedDate.getTime()) <= (30 * 24 * 60 * 60 * 1000);

    // Check enforcement failures
    const hasEnforcementFailures = enforcementFailures > 0;
    const hasRecentEnforcement = lastEnforced && (now.getTime() - lastEnforced.getTime()) <= (7 * 24 * 60 * 60 * 1000);

    // ❌ Red (Non-Compliant) - Highest priority
    if (isExpired || !isAcknowledgmentComplete || hasEnforcementFailures || isReviewOverdue) {
      let description = 'Policy ';
      const issues = [];
      
      if (isExpired) issues.push('expired');
      if (!isAcknowledgmentComplete) issues.push(`unacknowledged (${acknowledgmentRate.toFixed(1)}%)`);
      if (hasEnforcementFailures) issues.push('enforcement failed');
      if (isReviewOverdue) issues.push('review overdue');
      
      description += issues.join(', ');

      return {
        color: PolicyTrackingColor.RED,
        icon: '❌',
        label: 'Non-Compliant',
        description,
        actionRequired: true,
        daysUntilAction: isExpired ? 0 : Math.min(...[
          isReviewOverdue ? 0 : daysUntilReview,
          !isAcknowledgmentComplete ? 7 : 999
        ].filter(d => d < 999)),
        actionType: isExpired ? 'renew' : (!isAcknowledgmentComplete ? 'acknowledge' : 'review'),
        priority: 'critical'
      };
    }

    // ⏳ Amber (Review Due) - Warning state
    if (isReviewDue) {
      return {
        color: PolicyTrackingColor.AMBER,
        icon: '⏳',
        label: 'Review Due',
        description: `Policy review due in ${daysUntilReview} days—reminders triggered`,
        actionRequired: true,
        daysUntilAction: daysUntilReview,
        actionType: 'review',
        priority: daysUntilReview <= 7 ? 'high' : 'medium'
      };
    }

    // 🆕 Blue (New Policy) - Recently published, pending full acknowledgment
    if (isNewPolicy && acknowledgmentRate < 100) {
      return {
        color: PolicyTrackingColor.BLUE,
        icon: '🆕',
        label: 'New Policy',
        description: `Recently published—${acknowledgmentRate.toFixed(1)}% acknowledged, pending training`,
        actionRequired: true,
        daysUntilAction: 14, // 14 days to complete acknowledgment
        actionType: 'acknowledge',
        priority: 'medium'
      };
    }

    // ✅ Green (Compliant) - All good!
    return {
      color: PolicyTrackingColor.GREEN,
      icon: '✅',
      label: 'Compliant',
      description: 'Policy is active, acknowledged, and enforced',
      actionRequired: false,
      priority: 'low'
    };
  }

  /**
   * Generate dashboard items with color-coded status
   */
  async generateDashboardItems(
    policies: PolicyDraft[],
    acknowledgmentMap: Map<string, UserAcknowledgment[]>,
    userCountMap: Map<string, number>,
    enforcementMap: Map<string, { failures: number; lastEnforced: Date | null }>,
    filters?: PolicyFilterOptions
  ): Promise<PolicyDashboardItem[]> {
    this.logger.log(`Generating dashboard items for ${policies.length} policies`);

    const dashboardItems = policies.map(policy => {
      const acknowledgments = acknowledgmentMap.get(policy.id) || [];
      const totalUsers = userCountMap.get(policy.organizationId) || 0;
      const enforcement = enforcementMap.get(policy.id) || { failures: 0, lastEnforced: null };
      
      const status = this.calculatePolicyStatus(
        policy,
        acknowledgments,
        totalUsers,
        enforcement.failures,
        enforcement.lastEnforced
      );

      const now = new Date();
      const reviewDate = policy.reviewDue;
      const daysUntilReview = reviewDate ? Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      constdashboardItem: PolicyDashboardItem = {
        policy,
        status,
        acknowledgmentStats: {
          totalRequired: totalUsers,
          totalAcknowledged: acknowledgments.length,
          percentageComplete: totalUsers > 0 ? (acknowledgments.length / totalUsers) * 100 : 100,
          overdue: acknowledgments.filter(ack => {
            // Check if acknowledgment is overdue (policy published > 30 days ago but not acknowledged)
            const publishedDate = policy.publishedAt;
            const acknowledgedDate = ack.acknowledgedAt;
            if (!publishedDate) return false;
            
            const daysSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysSincePublished > 30 && (!acknowledgedDate || acknowledgedDate < publishedDate);
          }).length
        },
        complianceMetrics: {
          lastEnforced: enforcement.lastEnforced,
          enforcementFailures: enforcement.failures,
          riskLevel: this.calculateRiskLevel(status, enforcement.failures, daysUntilReview)
        },
        reviewMetrics: {
          daysUntilReview,
          isOverdue: daysUntilReview < 0,
          lastReviewDate: policy.updatedAt // Approximate last review as last update
        }
      };

      return dashboardItem;
    });

    // Apply filters
    return this.applyFilters(dashboardItems, filters);
  }

  /**
   * Apply dashboard filters
   */
  private applyFilters(items: PolicyDashboardItem[], filters?: PolicyFilterOptions): PolicyDashboardItem[] {
    if (!filters) return items;

    return items.filter(item => {
      // Color filter
      if (filters.colors && filters.colors.length > 0) {
        if (!filters.colors.includes(item.status.color)) return false;
      }

      // Jurisdiction filter
      if (filters.jurisdictions && filters.jurisdictions.length > 0) {
        const hasMatchingJurisdiction = item.policy.jurisdiction.some(j => 
          filters.jurisdictions!.includes(j)
        );
        if (!hasMatchingJurisdiction) return false;
      }

      // Linked modules filter
      if (filters.linkedModules && filters.linkedModules.length > 0) {
        const hasMatchingModule = item.policy.linkedModules.some(m => 
          filters.linkedModules!.includes(m)
        );
        if (!hasMatchingModule) return false;
      }

      // Status filter
      if (filters.statuses && filters.statuses.length > 0) {
        if (!filters.statuses.includes(item.policy.status)) return false;
      }

      // Review due filter (policies due within X days)
      if (filters.reviewDueDays !== undefined) {
        if (item.reviewMetrics.daysUntilReview > filters.reviewDueDays) return false;
      }

      // Acknowledgment threshold filter
      if (filters.acknowledgmentThreshold !== undefined) {
        if (item.acknowledgmentStats.percentageComplete < filters.acknowledgmentThreshold) return false;
      }

      // Organization filter
      if (filters.organizationId) {
        if (item.policy.organizationId !== filters.organizationId) return false;
      }

      return true;
    });
  }

  /**
   * Calculate risk level based on status and metrics
   */
  private calculateRiskLevel(
    status: PolicyTrackingStatus,
    enforcementFailures: number,
    daysUntilReview: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Critical risk
    if (status.color === PolicyTrackingColor.RED || enforcementFailures > 3) {
      return 'critical';
    }

    // High risk
    if (status.color === PolicyTrackingColor.AMBER && daysUntilReview <= 7) {
      return 'high';
    }

    // Medium risk
    if (status.color === PolicyTrackingColor.AMBER || status.color === PolicyTrackingColor.BLUE) {
      return 'medium';
    }

    // Low risk (green)
    return 'low';
  }

  /**
   * Generate summary statistics for dashboard
   */
  generateDashboardSummary(items: PolicyDashboardItem[]): {
    total: number;
    byColor: Record<PolicyTrackingColor, number>;
    byPriority: Record<string, number>;
    actionRequired: number;
    averageAcknowledgmentRate: number;
    overdueReviews: number;
    enforcementFailures: number;
  } {
    const summary = {
      total: items.length,
      byColor: {
        [PolicyTrackingColor.GREEN]: 0,
        [PolicyTrackingColor.AMBER]: 0,
        [PolicyTrackingColor.RED]: 0,
        [PolicyTrackingColor.BLUE]: 0,
        [PolicyTrackingColor.GREY]: 0
      },
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      actionRequired: 0,
      averageAcknowledgmentRate: 0,
      overdueReviews: 0,
      enforcementFailures: 0
    };

    let totalAcknowledgmentRate = 0;

    items.forEach(item => {
      // Count by color
      summary.byColor[item.status.color]++;
      
      // Count by priority
      summary.byPriority[item.status.priority]++;
      
      // Count action required
      if (item.status.actionRequired) {
        summary.actionRequired++;
      }
      
      // Sum acknowledgment rates
      totalAcknowledgmentRate += item.acknowledgmentStats.percentageComplete;
      
      // Count overdue reviews
      if (item.reviewMetrics.isOverdue) {
        summary.overdueReviews++;
      }
      
      // Count enforcement failures
      summary.enforcementFailures += item.complianceMetrics.enforcementFailures;
    });

    // Calculate average acknowledgment rate
    summary.averageAcknowledgmentRate = items.length > 0 ? totalAcknowledgmentRate / items.length : 0;

    return summary;
  }

  /**
   * Get color-coded tooltip content for dashboard
   */
  getStatusTooltip(status: PolicyTrackingStatus): string {
    const actionText = status.actionRequired 
      ? `Action required: ${status.actionType}${status.daysUntilAction ? ` (${status.daysUntilAction} days)` : ''}`
      : 'No action required';

    return `${status.icon} ${status.label}\n${status.description}\n${actionText}\nPriority: ${status.priority.toUpperCase()}`;
  }

  /**
   * Get next action deadline for policy
   */
  getNextActionDeadline(item: PolicyDashboardItem): Date | null {
    if (!item.status.actionRequired || !item.status.daysUntilAction) {
      return null;
    }

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + item.status.daysUntilAction);
    return deadline;
  }

  /**
   * Check if policy status has changed and requires notification
   */
  shouldTriggerNotification(
    currentStatus: PolicyTrackingStatus,
    previousStatus: PolicyTrackingStatus | null
  ): boolean {
    if (!previousStatus) return false;

    // Trigger notification if:
    // 1. Status color changed to red (critical)
    // 2. Status changed from green to amber/red (degradation)
    // 3. Action became required when it wasn't before
    // 4. Priority increased
    
    const colorSeverity = {
      [PolicyTrackingColor.GREEN]: 0,
      [PolicyTrackingColor.BLUE]: 1,
      [PolicyTrackingColor.GREY]: 1,
      [PolicyTrackingColor.AMBER]: 2,
      [PolicyTrackingColor.RED]: 3
    };

    const prioritySeverity = { low: 0, medium: 1, high: 2, critical: 3 };

    const currentSeverity = colorSeverity[currentStatus.color];
    const previousSeverity = colorSeverity[previousStatus.color];
    
    const currentPrioritySeverity = prioritySeverity[currentStatus.priority];
    const previousPrioritySeverity = prioritySeverity[previousStatus.priority];

    return (
      currentStatus.color === PolicyTrackingColor.RED || // Always notify for red
      currentSeverity > previousSeverity || // Color severity increased
      (!previousStatus.actionRequired && currentStatus.actionRequired) || // Action became required
      currentPrioritySeverity > previousPrioritySeverity // Priority increased
    );
  }
}
