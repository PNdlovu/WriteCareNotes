/**
 * @fileoverview Comprehensive policy tracking system with color-coded stages and workflow management
 * @module Policy-tracking/PolicyTrackerService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive policy tracking system with color-coded stages and workflow management
 */

/**
 * @fileoverview Policy Tracker Service - Enhanced policy management with workflow tracking
 * @module PolicyTrackerService
 * @version 1.0.0
 * @description Comprehensive policy tracking system with color-coded stages and workflow management
 */

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryBuilder } from 'typeorm';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/notification.service';
import { PolicyTracking, PolicyStatusTransition } from '../../entities/policy-tracking/PolicyTracking';

/**
 * Policy Status Enumeration with color coding
 */
export enum PolicyStatus {
  DRAFT = 'draft',                    // 🔵 Blue - Initial creation
  UNDER_REVIEW = 'under_review',      // 🟡 Yellow - In review process
  APPROVED = 'approved',              // 🟢 Green - Approved but not published
  PUBLISHED = 'published',            // ✅ Dark Green - Active policy
  REQUIRES_UPDATE = 'requires_update', // 🟠 Orange - Needs revision
  SUSPENDED = 'suspended',            // 🔴 Red - Temporarily inactive
  ARCHIVED = 'archived',              // ⚫ Gray - No longer active
  REJECTED = 'rejected'               // ❌ Dark Red - Rejected in review
}

/**
 * Policy Priority Levels
 */
export enum PolicyPriority {
  CRITICAL = 'critical',     // 🔴 Red
  HIGH = 'high',            // 🟠 Orange  
  MEDIUM = 'medium',        // 🟡 Yellow
  LOW = 'low'              // 🟢 Green
}

/**
 * Policy Categories for organization
 */
export enum PolicyCategory {
  SAFEGUARDING = 'safeguarding',
  DATA_PROTECTION = 'data_protection',
  MEDICATION = 'medication',
  HEALTH_SAFETY = 'health_safety',
  STAFF_TRAINING = 'staff_training',
  EMERGENCY = 'emergency',
  INFECTION_CONTROL = 'infection_control',
  DIGNITY_RESPECT = 'dignity_respect',
  COMPLAINTS = 'complaints',
  NUTRITION = 'nutrition'
}

/**
 * Status transition tracking interface
 */
export interface StatusTransition {
  id: string;
  policyId: string;
  fromStatus: PolicyStatus;
  toStatus: PolicyStatus;
  reason: string;
  userId: string;
  userName: string;
  timestamp: Date;
  notes?: string;
}

/**
 * Policy tracking data interface
 */
export interface PolicyTrackingData {
  id: string;
  title: string;
  category: PolicyCategory;
  status: PolicyStatus;
  priority: PolicyPriority;
  version: string;
  author: string;
  assignee?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  reviewDate?: Date;
  publishedAt?: Date;
  compliance: {
    jurisdiction: string[];
    requiresCQCApproval: boolean;
    requiresStaffTraining: boolean;
  };
  progress: {
    percentage: number;
    currentStage: string;
    nextMilestone: string;
    estimatedCompletion?: Date;
  };
  statusHistory: StatusTransition[];
  tags: string[];
  attachments: number;
}

/**
 * Filter options for policy tracking
 */
export interface PolicyTrackingFilters {
  status?: PolicyStatus[];
  category?: PolicyCategory[];
  priority?: PolicyPriority[];
  assignee?: string[];
  jurisdiction?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchTerm?: string;
  tags?: string[];
}

/**
 * Dashboard metrics interface
 */
export interface PolicyDashboardMetrics {
  totalPolicies: number;
  statusBreakdown: Record<PolicyStatus, number>;
  priorityBreakdown: Record<PolicyPriority, number>;
  categoryBreakdown: Record<PolicyCategory, number>;
  overduePolicies: number;
  pendingReviews: number;
  upcomingDeadlines: number;
  complianceRate: number;
  averageCompletionTime: number;
  recentActivity: StatusTransition[];
}

@Injectable()
export class PolicyTrackerService {
  private readonly logger = new Logger(PolicyTrackerService.name);

  constructor(
    @InjectRepository(PolicyTracking)
    private readonly policyRepository: Repository<PolicyTracking>,
    @InjectRepository(PolicyStatusTransition)
    private readonly transitionRepository: Repository<PolicyStatusTransition>,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Get comprehensive policy tracking dashboard
   */
  async getPolicyDashboard(organizationId: string, filters?: PolicyTrackingFilters): Promise<PolicyDashboardMetrics> {
    try {
      const query = this.buildPolicyQuery(organizationId, filters);
      const policies = await query.getMany();

      const totalPolicies = policies.length;
      const statusBreakdown = this.calculateStatusBreakdown(policies);
      const priorityBreakdown = this.calculatePriorityBreakdown(policies);
      const categoryBreakdown = this.calculateCategoryBreakdown(policies);

      const now = new Date();
      const overduePolicies = policies.filter(p => p.dueDate && p.dueDate < now && p.status !== PolicyStatus.PUBLISHED).length;
      const pendingReviews = policies.filter(p => p.status === PolicyStatus.UNDER_REVIEW).length;
      const upcomingDeadlines = policies.filter(p => {
        if (!p.dueDate) return false;
        const daysFromNow = (p.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysFromNow <= 7 && daysFromNow > 0;
      }).length;

      const publishedPolicies = policies.filter(p => p.status === PolicyStatus.PUBLISHED).length;
      const complianceRate = totalPolicies > 0 ? (publishedPolicies / totalPolicies) * 100 : 100;

      const recentActivity = await this.getRecentStatusTransitions(organizationId, 10);
      const averageCompletionTime = await this.calculateAverageCompletionTime(organizationId);

      return {
        totalPolicies,
        statusBreakdown,
        priorityBreakdown,
        categoryBreakdown,
        overduePolicies,
        pendingReviews,
        upcomingDeadlines,
        complianceRate,
        averageCompletionTime,
        recentActivity
      };
    } catch (error) {
      this.logger.error('Failed to generate policy dashboard', error);
      throw error;
    }
  }

  /**
   * Get all policies with tracking information
   */
  async getAllPolicies(organizationId: string, filters?: PolicyTrackingFilters): Promise<PolicyTrackingData[]> {
    try {
      const query = this.buildPolicyQuery(organizationId, filters);
      const policies = await query.getMany();

      return Promise.all(policies.map(policy => this.enrichPolicyData(policy)));
    } catch (error) {
      this.logger.error('Failed to fetch policies', error);
      throw error;
    }
  }

  /**
   * Update policy status with transition tracking
   */
  async updatePolicyStatus(
    policyId: string, 
    newStatus: PolicyStatus, 
    userId: string, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    try {
      const policy = await this.policyRepository.findOne({ where: { id: policyId } });
      if (!policy) {
        throw new NotFoundException(`Policy with ID ${policyId} not found`);
      }

      const oldStatus = policy.status;
      
      // Validate status transition
      this.validateStatusTransition(oldStatus, newStatus);

      // Record the transition
      const transition: StatusTransition = {
        id: this.generateId(),
        policyId,
        fromStatus: oldStatus,
        toStatus: newStatus,
        reason,
        userId,
        userName: await this.getUserName(userId),
        timestamp: new Date(),
        notes
      };

      await this.transitionRepository.save(transition);

      // Update policy status
      policy.status = newStatus;
      policy.updatedAt = new Date();

      if (newStatus === PolicyStatus.PUBLISHED) {
        policy.publishedAt = new Date();
      }

      await this.policyRepository.save(policy);

      // Send notifications for status changes
      await this.sendStatusChangeNotifications(policy, transition);

      // Audit the change
      await this.auditService.logAction(
        userId,
        'POLICY_STATUS_CHANGE',
        `policy:${policyId}`,
        {
          policyId,
          oldStatus,
          newStatus,
          reason,
          notes
        }
      );

      this.logger.log(`Policy ${policyId} status changed from ${oldStatus} to ${newStatus}`);
    } catch (error) {
      this.logger.error('Failed to update policy status', error);
      throw error;
    }
  }

  /**
   * Get policy status color mapping for UI
   */
  getStatusColorMapping(): Record<PolicyStatus, { color: string; bgColor: string; textColor: string; icon: string }> {
    return {
      [PolicyStatus.DRAFT]: {
        color: '#3B82F6',        // Blue
        bgColor: '#EBF4FF',      // Light blue background
        textColor: '#1E40AF',    // Dark blue text
        icon: '📝'
      },
      [PolicyStatus.UNDER_REVIEW]: {
        color: '#F59E0B',        // Yellow/Orange
        bgColor: '#FEF3C7',      // Light yellow background
        textColor: '#D97706',    // Dark yellow text
        icon: '👀'
      },
      [PolicyStatus.APPROVED]: {
        color: '#10B981',        // Green
        bgColor: '#D1FAE5',      // Light green background
        textColor: '#059669',    // Dark green text
        icon: '✅'
      },
      [PolicyStatus.PUBLISHED]: {
        color: '#059669',        // Dark green
        bgColor: '#A7F3D0',      // Slightly darker green background
        textColor: '#047857',    // Even darker green text
        icon: '🚀'
      },
      [PolicyStatus.REQUIRES_UPDATE]: {
        color: '#F97316',        // Orange
        bgColor: '#FED7AA',      // Light orange background
        textColor: '#C2410C',    // Dark orange text
        icon: '🔄'
      },
      [PolicyStatus.SUSPENDED]: {
        color: '#EF4444',        // Red
        bgColor: '#FEE2E2',      // Light red background
        textColor: '#DC2626',    // Dark red text
        icon: '⏸️'
      },
      [PolicyStatus.ARCHIVED]: {
        color: '#6B7280',        // Gray
        bgColor: '#F3F4F6',      // Light gray background
        textColor: '#374151',    // Dark gray text
        icon: '📁'
      },
      [PolicyStatus.REJECTED]: {
        color: '#B91C1C',        // Dark red
        bgColor: '#FEE2E2',      // Light red background
        textColor: '#991B1B',    // Very dark red text
        icon: '❌'
      }
    };
  }

  /**
   * Get priority color mapping for UI
   */
  getPriorityColorMapping(): Record<PolicyPriority, { color: string; bgColor: string; textColor: string; icon: string }> {
    return {
      [PolicyPriority.CRITICAL]: {
        color: '#DC2626',        // Red
        bgColor: '#FEE2E2',      // Light red background
        textColor: '#991B1B',    // Dark red text
        icon: '🔴'
      },
      [PolicyPriority.HIGH]: {
        color: '#F97316',        // Orange
        bgColor: '#FED7AA',      // Light orange background
        textColor: '#C2410C',    // Dark orange text
        icon: '🟠'
      },
      [PolicyPriority.MEDIUM]: {
        color: '#F59E0B',        // Yellow
        bgColor: '#FEF3C7',      // Light yellow background
        textColor: '#D97706',    // Dark yellow text
        icon: '🟡'
      },
      [PolicyPriority.LOW]: {
        color: '#10B981',        // Green
        bgColor: '#D1FAE5',      // Light green background
        textColor: '#059669',    // Dark green text
        icon: '🟢'
      }
    };
  }

  /**
   * Private helper methods
   */
  private buildPolicyQuery(organizationId: string, filters?: PolicyTrackingFilters) {
    let query = this.policyRepository
      .createQueryBuilder('policy')
      .where('policy.organizationId = :organizationId', { organizationId });

    if (filters) {
      if (filters.status?.length) {
        query = query.andWhere('policy.status IN (:...statuses)', { statuses: filters.status });
      }
      if (filters.category?.length) {
        query = query.andWhere('policy.category IN (:...categories)', { categories: filters.category });
      }
      if (filters.priority?.length) {
        query = query.andWhere('policy.priority IN (:...priorities)', { priorities: filters.priority });
      }
      if (filters.assignee?.length) {
        query = query.andWhere('policy.assignee IN (:...assignees)', { assignees: filters.assignee });
      }
      if (filters.searchTerm) {
        query = query.andWhere(
          '(policy.title ILIKE :searchTerm OR policy.description ILIKE :searchTerm)',
          { searchTerm: `%${filters.searchTerm}%` }
        );
      }
      if (filters.dateRange) {
        query = query.andWhere(
          'policy.createdAt BETWEEN :startDate AND :endDate',
          { startDate: filters.dateRange.start, endDate: filters.dateRange.end }
        );
      }
    }

    return query.orderBy('policy.priority', 'DESC')
                .addOrderBy('policy.updatedAt', 'DESC');
  }

  private calculateStatusBreakdown(policies: any[]): Record<PolicyStatus, number> {
    const breakdown = Object.values(PolicyStatus).reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<PolicyStatus, number>);

    policies.forEach(policy => {
      breakdown[policy.status]++;
    });

    return breakdown;
  }

  private calculatePriorityBreakdown(policies: any[]): Record<PolicyPriority, number> {
    const breakdown = Object.values(PolicyPriority).reduce((acc, priority) => {
      acc[priority] = 0;
      return acc;
    }, {} as Record<PolicyPriority, number>);

    policies.forEach(policy => {
      breakdown[policy.priority]++;
    });

    return breakdown;
  }

  private calculateCategoryBreakdown(policies: any[]): Record<PolicyCategory, number> {
    const breakdown = Object.values(PolicyCategory).reduce((acc, category) => {
      acc[category] = 0;
      return acc;
    }, {} as Record<PolicyCategory, number>);

    policies.forEach(policy => {
      breakdown[policy.category]++;
    });

    return breakdown;
  }

  private async enrichPolicyData(policy: any): Promise<PolicyTrackingData> {
    const statusHistory = await this.transitionRepository.find({
      where: { policyId: policy.id },
      order: { timestamp: 'DESC' }
    });

    const progress = this.calculateProgress(policy, statusHistory);

    return {
      ...policy,
      progress,
      statusHistory
    };
  }

  private calculateProgress(policy: any, statusHistory: StatusTransition[]) {
    const statusOrder = [
      PolicyStatus.DRAFT,
      PolicyStatus.UNDER_REVIEW,
      PolicyStatus.APPROVED,
      PolicyStatus.PUBLISHED
    ];

    const currentIndex = statusOrder.indexOf(policy.status);
    const percentage = currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0;

    return {
      percentage,
      currentStage: this.getStageDescription(policy.status),
      nextMilestone: this.getNextMilestone(policy.status),
      estimatedCompletion: this.estimateCompletion(policy, statusHistory)
    };
  }

  private getStageDescription(status: PolicyStatus): string {
    const descriptions = {
      [PolicyStatus.DRAFT]: 'Initial Draft Creation',
      [PolicyStatus.UNDER_REVIEW]: 'Stakeholder Review Process',
      [PolicyStatus.APPROVED]: 'Approval Obtained',
      [PolicyStatus.PUBLISHED]: 'Live Policy Implementation',
      [PolicyStatus.REQUIRES_UPDATE]: 'Revision Required',
      [PolicyStatus.SUSPENDED]: 'Temporarily Inactive',
      [PolicyStatus.ARCHIVED]: 'Policy Archived',
      [PolicyStatus.REJECTED]: 'Review Rejected'
    };
    return descriptions[status] || 'Unknown Stage';
  }

  private getNextMilestone(status: PolicyStatus): string {
    const milestones = {
      [PolicyStatus.DRAFT]: 'Submit for Review',
      [PolicyStatus.UNDER_REVIEW]: 'Approval Decision',
      [PolicyStatus.APPROVED]: 'Publish Policy',
      [PolicyStatus.PUBLISHED]: 'Scheduled Review',
      [PolicyStatus.REQUIRES_UPDATE]: 'Update and Resubmit',
      [PolicyStatus.SUSPENDED]: 'Reactivation Review',
      [PolicyStatus.ARCHIVED]: 'No Further Action',
      [PolicyStatus.REJECTED]: 'Address Feedback'
    };
    return milestones[status] || 'Unknown';
  }

  private validateStatusTransition(from: PolicyStatus, to: PolicyStatus): void {
    const validTransitions: Record<PolicyStatus, PolicyStatus[]> = {
      [PolicyStatus.DRAFT]: [PolicyStatus.UNDER_REVIEW, PolicyStatus.ARCHIVED],
      [PolicyStatus.UNDER_REVIEW]: [PolicyStatus.APPROVED, PolicyStatus.REJECTED, PolicyStatus.DRAFT],
      [PolicyStatus.APPROVED]: [PolicyStatus.PUBLISHED, PolicyStatus.REQUIRES_UPDATE],
      [PolicyStatus.PUBLISHED]: [PolicyStatus.REQUIRES_UPDATE, PolicyStatus.SUSPENDED, PolicyStatus.ARCHIVED],
      [PolicyStatus.REQUIRES_UPDATE]: [PolicyStatus.DRAFT, PolicyStatus.UNDER_REVIEW],
      [PolicyStatus.SUSPENDED]: [PolicyStatus.PUBLISHED, PolicyStatus.ARCHIVED],
      [PolicyStatus.ARCHIVED]: [], // No transitions from archived
      [PolicyStatus.REJECTED]: [PolicyStatus.DRAFT]
    };

    if (!validTransitions[from]?.includes(to)) {
      throw new BadRequestException(`Invalid status transition from ${from} to ${to}`);
    }
  }

  private async sendStatusChangeNotifications(policy: any, transition: StatusTransition): Promise<void> {
    // Implementation for sending notifications based on status changes
    // This would integrate with your NotificationService
  }

  private async getRecentStatusTransitions(organizationId: string, limit: number): Promise<StatusTransition[]> {
    return this.transitionRepository
      .createQueryBuilder('transition')
      .innerJoin('policy', 'p', 'p.id = transition.policyId')
      .where('p.organizationId = :organizationId', { organizationId })
      .orderBy('transition.timestamp', 'DESC')
      .limit(limit)
      .getMany();
  }

  private async calculateAverageCompletionTime(organizationId: string): Promise<number> {
    try {
      // Calculate average time from draft to published
      const completedPolicies = await this.transitionRepository
        .createQueryBuilder('transition')
        .innerJoin('policy', 'p', 'p.id = transition.policyId')
        .where('p.organizationId = :organizationId', { organizationId })
        .andWhere('transition.toStatus = :publishedStatus', { publishedStatus: PolicyStatus.PUBLISHED })
        .select([
          'transition.policyId',
          'MIN(draft.timestamp) as draftTime',
          'MAX(transition.timestamp) as publishedTime'
        ])
        .leftJoin('policy_status_transitions', 'draft', 
          'draft.policyId = transition.policyId AND draft.toStatus = :draftStatus',
          { draftStatus: PolicyStatus.DRAFT }
        )
        .groupBy('transition.policyId')
        .getRawMany();

      if (completedPolicies.length === 0) return 0;

      const totalTime = completedPolicies.reduce((sum, policy) => {
        const draftTime = new Date(policy.draftTime);
        const publishedTime = new Date(policy.publishedTime);
        const completionDays = (publishedTime.getTime() - draftTime.getTime()) / (1000 * 60 * 60 * 24);
        return sum + completionDays;
      }, 0);

      return Math.round(totalTime / completedPolicies.length);
    } catch (error) {
      this.logger.error('Failed to calculate average completion time', error);
      return 0;
    }
  }

  private estimateCompletion(policy: any, statusHistory: StatusTransition[]): Date | undefined {
    try {
      // Calculate estimation based on historical data and current progress
      if (statusHistory.length === 0) return undefined;

      const statusTimes: Record<PolicyStatus, number[]> = {
        [PolicyStatus.DRAFT]: [],
        [PolicyStatus.UNDER_REVIEW]: [],
        [PolicyStatus.APPROVED]: [],
        [PolicyStatus.PUBLISHED]: [],
        [PolicyStatus.REQUIRES_UPDATE]: [],
        [PolicyStatus.SUSPENDED]: [],
        [PolicyStatus.ARCHIVED]: [],
        [PolicyStatus.REJECTED]: []
      };

      // Analyze historical transitions to estimate time per stage
      for (let i = 1; i < statusHistory.length; i++) {
        const prevTransition = statusHistory[i];
        const currentTransition = statusHistory[i - 1];
        const timeInStatus = currentTransition.timestamp.getTime() - prevTransition.timestamp.getTime();
        const statusDays = timeInStatus / (1000 * 60 * 60 * 24);
        
        if (statusTimes[prevTransition.toStatus]) {
          statusTimes[prevTransition.toStatus].push(statusDays);
        }
      }

      // Calculate remaining time based on current status and historical averages
      const currentStatus = policy.status as PolicyStatus;
      const now = new Date();
      
      // Default time estimates (in days) if no historical data
      const defaultEstimates: Record<PolicyStatus, number> = {
        [PolicyStatus.DRAFT]: 7,
        [PolicyStatus.UNDER_REVIEW]: 14,
        [PolicyStatus.APPROVED]: 3,
        [PolicyStatus.PUBLISHED]: 0,
        [PolicyStatus.REQUIRES_UPDATE]: 10,
        [PolicyStatus.SUSPENDED]: 0,
        [PolicyStatus.ARCHIVED]: 0,
        [PolicyStatus.REJECTED]: 0
      };

      let remainingDays = 0;
      const statusOrder = [
        PolicyStatus.DRAFT,
        PolicyStatus.UNDER_REVIEW,
        PolicyStatus.APPROVED,
        PolicyStatus.PUBLISHED
      ];

      const currentIndex = statusOrder.indexOf(currentStatus);
      if (currentIndex >= 0) {
        for (let i = currentIndex + 1; i < statusOrder.length; i++) {
          const status = statusOrder[i];
          const historicalTimes = statusTimes[status];
          const avgTime = historicalTimes.length > 0 
            ? historicalTimes.reduce((sum, time) => sum + time, 0) / historicalTimes.length
            : defaultEstimates[status];
          remainingDays += avgTime;
        }
      }

      return new Date(now.getTime() + remainingDays * 24 * 60 * 60 * 1000);
    } catch (error) {
      this.logger.error('Failed to estimate completion time', error);
      return undefined;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      // In a real implementation, this would fetch from the user service
      // For now, return a formatted user identifier
      return `User_${userId.substring(0, 8)}`;
    } catch (error) {
      this.logger.error('Failed to get user name', error);
      return 'Unknown User';
    }
  }

  async getPolicyById(id: string, organizationId: string): Promise<PolicyTrackingData> {
    const policy = await this.policyRepository.findOne({ where: { id, organizationId } as any });
    if (!policy) throw new NotFoundException(`Policy ${id} not found`);
    return this.enrichPolicyData(policy);
  }

  async createPolicy(policyData: Partial<PolicyTrackingData>): Promise<PolicyTrackingData> {
    const policy = this.policyRepository.create(policyData as any);
    const saved = await this.policyRepository.save(policy);
    return this.enrichPolicyData(saved);
  }

  async getPolicyWorkflow(id: string, organizationId: string): Promise<any> {
    const policy = await this.getPolicyById(id, organizationId);
    return { currentStatus: policy.status, statusHistory: policy.statusHistory };
  }

  async getPolicyAnalytics(organizationId: string, options: any): Promise<any> {
    return await this.getPolicyDashboard(organizationId, options);
  }

  async addPolicyComment(id: string, comment: any): Promise<any> {
    return { id, comment, timestamp: new Date() };
  }

  async exportPolicies(organizationId: string, format: string, filters?: PolicyTrackingFilters): Promise<any> {
    const policies = await this.getAllPolicies(organizationId, filters);
    return { format, data: policies, exportedAt: new Date() };
  }
}
