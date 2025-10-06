import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { body, param, query, validationResult } from 'express-validator';
import { DatabaseService } from '../core/DatabaseService';
import { Logger } from '../core/Logger';
import { AuditService } from '../core/AuditService';
import { RealtimeMessagingService } from '../communication/RealtimeMessagingService';
import { TransparencyDashboardService } from './TransparencyDashboardService';
import { CommunicationAnalyticsService } from './CommunicationAnalyticsService';

export interface FamilyMember {
  id: string;
  tenantId: string;
  residentId: string;
  familyMemberType: FamilyMemberType;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  relationship: string;
  isPrimaryContact: boolean;
  communicationPreferences: CommunicationPreferences;
  trustMetrics: TrustMetrics;
  lastEngagement?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrustMetrics {
  overallTrustScore: number; // 1-10 scale
  communicationSatisfaction: number; // 1-10 scale
  transparencyRating: number; // 1-10 scale
  responsivenessRating: number; // 1-10 scale
  careQualityPerception: number; // 1-10 scale
  lastUpdated: string;
  feedbackCount: number;
  trendsLastMonth: TrustTrend[];
}

export interface TrustTrend {
  metric: string;
  previousValue: number;
  currentValue: number;
  changePercentage: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface CommunicationPreferences {
  preferredMethod: 'email' | 'sms' | 'phone' | 'app_notification';
  frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  updateTypes: string[];
  quietHours?: {
    start: string;
    end: string;
  };
  language: string;
}

export type FamilyMemberType = 
  | 'spouse' 
  | 'child' 
  | 'parent' 
  | 'sibling' 
  | 'grandchild' 
  | 'other_relative' 
  | 'friend' 
  | 'guardian' 
  | 'power_of_attorney';

export class FamilyTrustEngineService {
  private db: DatabaseService;
  private logger: Logger;
  private audit: AuditService;
  private notifications: NotificationService;
  private dashboardService: TransparencyDashboardService;
  private analyticsService: CommunicationAnalyticsService;

  constructor() {
    this.db = new DatabaseService();
    this.logger = new Logger('FamilyTrustEngineService');
    this.audit = new AuditService();
    this.notifications = new NotificationService();
    this.dashboardService = new TransparencyDashboardService();
    this.analyticsService = new CommunicationAnalyticsService();
  }

  /**
   * Register a new family member
   */
  async registerFamilyMember(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const familyData = req.body;

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Create family member record
        const familyMemberId = uuidv4();
        const insertQuery = `
          INSERT INTO family_members (
            id, tenant_id, resident_id, family_member_type, first_name,
            last_name, email, phone, relationship, is_primary_contact,
            communication_preferences, is_active, created_by, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, $12, NOW(), NOW()
          ) RETURNING *
        `;

        const defaultPreferences: CommunicationPreferences = {
          preferredMethod: 'email',
          frequency: 'weekly',
          updateTypes: ['care_updates', 'incidents', 'activities'],
          language: 'en',
          ...familyData.communicationPreferences
        };

        const result = await client.query(insertQuery, [
          familyMemberId,
          tenantId,
          familyData.residentId,
          familyData.familyMemberType,
          familyData.firstName,
          familyData.lastName,
          familyData.email || null,
          familyData.phone || null,
          familyData.relationship,
          familyData.isPrimaryContact || false,
          JSON.stringify(defaultPreferences),
          userId
        ]);

        const familyMember = result.rows[0];

        // Initialize trust metrics
        await this.initializeTrustMetrics(familyMemberId, tenantId);

        await client.query('COMMIT');

        // Send welcome notification
        if (familyMember.email) {
          await this.sendWelcomeNotification(familyMember);
        }

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'family_member_registered',
          resourceType: 'family_member',
          resourceId: familyMemberId,
          details: {
            residentId: familyData.residentId,
            relationship: familyData.relationship,
            isPrimaryContact: familyData.isPrimaryContact
          }
        });

        this.logger.info('Family member registered', {
          familyMemberId,
          tenantId,
          residentId: familyData.residentId,
          registeredBy: userId
        });

        const response: FamilyMember = {
          id: familyMember.id,
          tenantId: familyMember.tenant_id,
          residentId: familyMember.resident_id,
          familyMemberType: familyMember.family_member_type,
          firstName: familyMember.first_name,
          lastName: familyMember.last_name,
          email: familyMember.email,
          phone: familyMember.phone,
          relationship: familyMember.relationship,
          isPrimaryContact: familyMember.is_primary_contact,
          communicationPreferences: JSON.parse(familyMember.communication_preferences),
          trustMetrics: await this.getTrustMetrics(familyMemberId),
          isActive: familyMember.is_active,
          createdAt: familyMember.created_at,
          updatedAt: familyMember.updated_at
        };

        res.status(201).json({
          success: true,
          data: response
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to register family member', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register family member'
      });
    }
  }

  /**
   * Update trust metrics based on feedback
   */
  async updateTrustMetrics(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const familyMemberId = req.params.familyMemberId;
      const metricsData = req.body;

      // Validate family member access
      const hasAccess = await this.validateFamilyMemberAccess(tenantId, userId, familyMemberId);
      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: 'Access denied to family member record'
        });
        return;
      }

      const client = await this.db.getClient();
      await client.query('BEGIN');

      try {
        // Get current trust metrics for trend calculation
        const currentMetrics = await this.getTrustMetrics(familyMemberId);
        
        // Calculate trends
        const trends = this.calculateTrustTrends(currentMetrics, metricsData);

        // Calculate overall trust score
        const overallTrustScore = this.calculateOverallTrustScore(metricsData);

        // Update trust metrics
        const updateQuery = `
          UPDATE family_trust_metrics 
          SET 
            overall_trust_score = $3,
            communication_satisfaction = $4,
            transparency_rating = $5,
            responsiveness_rating = $6,
            care_quality_perception = $7,
            feedback_count = feedback_count + 1,
            trends_last_month = $8,
            last_updated = NOW(),
            updated_at = NOW()
          WHERE family_member_id = $1 AND tenant_id = $2
        `;

        await client.query(updateQuery, [
          familyMemberId,
          tenantId,
          overallTrustScore,
          metricsData.communicationSatisfaction,
          metricsData.transparencyRating,
          metricsData.responsivenessRating,
          metricsData.careQualityPerception,
          JSON.stringify(trends)
        ]);

        // Create feedback record
        const feedbackId = uuidv4();
        await client.query(`
          INSERT INTO family_feedback (
            id, family_member_id, tenant_id, feedback_type, ratings,
            comments, created_by, created_at
          ) VALUES ($1, $2, $3, 'trust_metrics', $4, $5, $6, NOW())
        `, [
          feedbackId,
          familyMemberId,
          tenantId,
          JSON.stringify(metricsData),
          metricsData.comments || null,
          userId
        ]);

        await client.query('COMMIT');

        // Check for significant trust changes
        await this.checkTrustAlerts(tenantId, familyMemberId, currentMetrics, {
          ...metricsData,
          overallTrustScore
        });

        // Log audit event
        await this.audit.log({
          tenantId,
          userId,
          action: 'trust_metrics_updated',
          resourceType: 'family_trust_metrics',
          resourceId: familyMemberId,
          details: {
            overallTrustScore,
            previousScore: currentMetrics.overallTrustScore
          }
        });

        this.logger.info('Trust metrics updated', {
          familyMemberId,
          tenantId,
          overallTrustScore,
          updatedBy: userId
        });

        const updatedMetrics: TrustMetrics = {
          overallTrustScore,
          communicationSatisfaction: metricsData.communicationSatisfaction,
          transparencyRating: metricsData.transparencyRating,
          responsivenessRating: metricsData.responsivenessRating,
          careQualityPerception: metricsData.careQualityPerception,
          lastUpdated: new Date().toISOString(),
          feedbackCount: currentMetrics.feedbackCount + 1,
          trendsLastMonth: trends
        };

        res.json({
          success: true,
          data: { trustMetrics: updatedMetrics }
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      this.logger.error('Failed to update trust metrics', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update trust metrics'
      });
    }
  }

  // Private helper methods

  private async initializeTrustMetrics(familyMemberId: string, tenantId: string): Promise<void> {
    const metricsId = uuidv4();
    await this.db.query(`
      INSERT INTO family_trust_metrics (
        id, family_member_id, tenant_id, overall_trust_score,
        communication_satisfaction, transparency_rating, responsiveness_rating,
        care_quality_perception, feedback_count, trends_last_month,
        last_updated, created_at, updated_at
      ) VALUES (
        $1, $2, $3, 7, 7, 7, 7, 7, 0, '[]', NOW(), NOW(), NOW()
      )
    `, [metricsId, familyMemberId, tenantId]);
  }

  private async getTrustMetrics(familyMemberId: string): Promise<TrustMetrics> {
    const result = await this.db.query(`
      SELECT * FROM family_trust_metrics 
      WHERE family_member_id = $1
    `, [familyMemberId]);

    const metrics = result.rows[0];
    if (!metrics) {
      return {
        overallTrustScore: 7,
        communicationSatisfaction: 7,
        transparencyRating: 7,
        responsivenessRating: 7,
        careQualityPerception: 7,
        lastUpdated: new Date().toISOString(),
        feedbackCount: 0,
        trendsLastMonth: []
      };
    }

    return {
      overallTrustScore: metrics.overall_trust_score,
      communicationSatisfaction: metrics.communication_satisfaction,
      transparencyRating: metrics.transparency_rating,
      responsivenessRating: metrics.responsiveness_rating,
      careQualityPerception: metrics.care_quality_perception,
      lastUpdated: metrics.last_updated,
      feedbackCount: metrics.feedback_count,
      trendsLastMonth: JSON.parse(metrics.trends_last_month || '[]')
    };
  }

  private calculateTrustTrends(current: TrustMetrics, updated: any): TrustTrend[] {
    const trends: TrustTrend[] = [];
    const metrics = [
      { key: 'communicationSatisfaction', name: 'Communication Satisfaction' },
      { key: 'transparencyRating', name: 'Transparency Rating' },
      { key: 'responsivenessRating', name: 'Responsiveness Rating' },
      { key: 'careQualityPerception', name: 'Care Quality Perception' }
    ];

    for (const metric of metrics) {
      const previousValue = current[metric.key as keyof TrustMetrics] as number;
      const currentValue = updated[metric.key];
      const changePercentage = ((currentValue - previousValue) / previousValue) * 100;
      
      let trend: 'improving' | 'declining' | 'stable' = 'stable';
      if (Math.abs(changePercentage) > 10) {
        trend = changePercentage > 0 ? 'improving' : 'declining';
      }

      trends.push({
        metric: metric.name,
        previousValue,
        currentValue,
        changePercentage,
        trend
      });
    }

    return trends;
  }

  private calculateOverallTrustScore(metrics: any): number {
    const weights = {
      communicationSatisfaction: 0.3,
      transparencyRating: 0.25,
      responsivenessRating: 0.25,
      careQualityPerception: 0.2
    };

    return Math.round(
      (metrics.communicationSatisfaction * weights.communicationSatisfaction) +
      (metrics.transparencyRating * weights.transparencyRating) +
      (metrics.responsivenessRating * weights.responsivenessRating) +
      (metrics.careQualityPerception * weights.careQualityPerception)
    );
  }

  private async validateFamilyMemberAccess(
    tenantId: string,
    userId: string,
    familyMemberId: string
  ): Promise<boolean> {
    const accessQuery = `
      SELECT 1 FROM family_members fm
      WHERE fm.id = $1 AND fm.tenant_id = $2 AND (
        fm.created_by = $3 OR
        EXISTS (
          SELECT 1 FROM users u 
          WHERE u.id = $3 AND u.tenant_id = $2 
            AND (u.role IN ('admin', 'manager') OR u.permissions ? 'family_management')
        )
      )
    `;

    const result = await this.db.query(accessQuery, [familyMemberId, tenantId, userId]);
    return result.rows.length > 0;
  }

  private async sendWelcomeNotification(familyMember: any): Promise<void> {
    // Implementation would send welcome email/notification
    this.logger.info('Welcome notification sent', {
      familyMemberId: familyMember.id,
      email: familyMember.email
    });
  }

  private async checkTrustAlerts(
    tenantId: string,
    familyMemberId: string,
    previousMetrics: TrustMetrics,
    currentMetrics: any
  ): Promise<void> {
    // Check for significant trust score decrease
    const trustDecrease = previousMetrics.overallTrustScore - currentMetrics.overallTrustScore;
    
    if (trustDecrease >= 2) {
      // Create alert for management
      await this.notifications.create({
        tenantId,
        type: 'trust_score_decline',
        title: 'Family Trust Score Declined',
        message: `Family member trust score decreased by ${trustDecrease} points`,
        data: { familyMemberId, previousScore: previousMetrics.overallTrustScore, currentScore: currentMetrics.overallTrustScore },
        actionRequired: true,
        priority: 'high'
      });
    }
  }

  /**
   * Get transparency dashboard for family member
   */
  async getTransparencyDashboard(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const familyMemberId = req.params.familyMemberId;
      const timeframe = req.query.timeframe as string || '30d';

      const hasAccess = await this.validateFamilyMemberAccess(tenantId, userId, familyMemberId);
      if (!hasAccess) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const familyMemberResult = await this.db.query(`
        SELECT resident_id FROM family_members WHERE id = $1 AND tenant_id = $2
      `, [familyMemberId, tenantId]);

      if (familyMemberResult.rows.length === 0) {
        res.status(404).json({ success: false, message: 'Family member not found' });
        return;
      }

      const residentId = familyMemberResult.rows[0].resident_id;
      const dashboardData = await this.dashboardService.getDashboardData(
        tenantId, familyMemberId, residentId, timeframe
      );

      res.json({ success: true, data: dashboardData });

    } catch (error) {
      this.logger.error('Failed to get transparency dashboard', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve dashboard data' });
    }
  }

  /**
   * Get communication analytics for family member
   */
  async getCommunicationAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const familyMemberId = req.params.familyMemberId;
      const timeframe = req.query.timeframe as string || '90d';

      const hasAccess = await this.validateFamilyMemberAccess(tenantId, userId, familyMemberId);
      if (!hasAccess) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const analytics = await this.analyticsService.generateAnalytics(tenantId, familyMemberId, timeframe);
      res.json({ success: true, data: analytics });

    } catch (error) {
      this.logger.error('Failed to get communication analytics', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve analytics' });
    }
  }

  /**
   * Submit family satisfaction feedback
   */
  async submitSatisfactionFeedback(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
        return;
      }

      const tenantId = req.headers['x-tenant-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      const familyMemberId = req.params.familyMemberId;
      const feedbackData = req.body;

      const hasAccess = await this.validateFamilyMemberAccess(tenantId, userId, familyMemberId);
      if (!hasAccess) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const feedbackId = uuidv4();
      const result = await this.db.query(`
        INSERT INTO family_satisfaction_feedback (
          id, family_member_id, tenant_id, overall_satisfaction,
          communication_quality, care_transparency, staff_responsiveness,
          comments, submitted_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *
      `, [
        feedbackId, familyMemberId, tenantId,
        feedbackData.overallSatisfaction, feedbackData.communicationQuality,
        feedbackData.careTransparency, feedbackData.staffResponsiveness,
        feedbackData.comments || null, userId
      ]);

      const feedback = result.rows[0];
      await this.updateTrustMetricsFromFeedback(familyMemberId, tenantId, feedbackData);

      if (feedbackData.overallSatisfaction <= 5) {
        await this.createLowSatisfactionAlert(tenantId, familyMemberId, feedbackData);
      }

      res.status(201).json({
        success: true,
        data: { id: feedback.id, submittedAt: feedback.created_at }
      });

    } catch (error) {
      this.logger.error('Failed to submit satisfaction feedback', error);
      res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
  }

  /**
   * Get family trust report
   */
  async getFamilyTrustReport(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      const period = req.query.period as string || '90d';

      const trustOverview = await this.getFacilityTrustOverview(tenantId, period);
      const reportData = {
        trustOverview,
        period,
        generatedAt: new Date().toISOString()
      };

      res.json({ success: true, data: reportData });

    } catch (error) {
      this.logger.error('Failed to generate family trust report', error);
      res.status(500).json({ success: false, message: 'Failed to generate trust report' });
    }
  }

  // Additional helper methods
  private async updateTrustMetricsFromFeedback(
    familyMemberId: string,
    tenantId: string,
    feedbackData: any
  ): Promise<void> {
    const trustScore = Math.round(
      (feedbackData.overallSatisfaction * 0.3) +
      (feedbackData.communicationQuality * 0.25) +
      (feedbackData.careTransparency * 0.25) +
      (feedbackData.staffResponsiveness * 0.2)
    );

    await this.db.query(`
      UPDATE family_trust_metrics 
      SET overall_trust_score = $3, communication_satisfaction = $4,
          transparency_rating = $5, responsiveness_rating = $6,
          feedback_count = feedback_count + 1, last_updated = NOW()
      WHERE family_member_id = $1 AND tenant_id = $2
    `, [familyMemberId, tenantId, trustScore, feedbackData.communicationQuality,
        feedbackData.careTransparency, feedbackData.staffResponsiveness]);
  }

  private async createLowSatisfactionAlert(
    tenantId: string,
    familyMemberId: string,
    feedbackData: any
  ): Promise<void> {
    const managersQuery = `
      SELECT DISTINCT u.id FROM users u
      WHERE u.tenant_id = $1 AND (u.role IN ('admin', 'manager') OR u.permissions ? 'family_management')
    `;
    const managers = await this.db.query(managersQuery, [tenantId]);

    for (const manager of managers.rows) {
      await this.notifications.create({
        tenantId,
        userId: manager.id,
        type: 'low_family_satisfaction',
        title: 'Low Family Satisfaction Alert',
        message: `Family member reported satisfaction score of ${feedbackData.overallSatisfaction}/10`,
        data: { familyMemberId, satisfactionScore: feedbackData.overallSatisfaction },
        actionRequired: true,
        priority: 'high'
      });
    }
  }

  private async getFacilityTrustOverview(tenantId: string, period: string): Promise<any> {
    const days = this.parseTimeframe(period);
    
    const query = `
      SELECT 
        AVG(overall_trust_score) as average_trust_score,
        AVG(communication_satisfaction) as avg_communication,
        AVG(transparency_rating) as avg_transparency,
        COUNT(*) as total_families
      FROM family_trust_metrics ftm
      JOIN family_members fm ON ftm.family_member_id = fm.id
      WHERE fm.tenant_id = $1 AND ftm.last_updated >= NOW() - INTERVAL '${days} days'
    `;

    const result = await this.db.query(query, [tenantId]);
    return result.rows[0] || {};
  }

  private parseTimeframe(timeframe: string): number {
    const timeframeMap: Record<string, number> = {
      '7d': 7, '30d': 30, '90d': 90, '6m': 180, '1y': 365
    };
    return timeframeMap[timeframe] || 90;
  }

  // Route definitions
  getRoutes(): express.Router {
    const router = express.Router();

    // Validation middleware
    const familyMemberValidation = [
      body('residentId').isUUID(),
      body('familyMemberType').isIn(['spouse', 'child', 'parent', 'sibling', 'grandchild', 'other_relative', 'friend', 'guardian', 'power_of_attorney']),
      body('firstName').isLength({ min: 1, max: 50 }).trim(),
      body('lastName').isLength({ min: 1, max: 50 }).trim(),
      body('relationship').isLength({ min: 1, max: 100 }).trim(),
      body('email').optional().isEmail(),
      body('phone').optional().isMobilePhone('any')
    ];

    const trustMetricsValidation = [
      param('familyMemberId').isUUID(),
      body('communicationSatisfaction').isInt({ min: 1, max: 10 }),
      body('transparencyRating').isInt({ min: 1, max: 10 }),
      body('responsivenessRating').isInt({ min: 1, max: 10 }),
      body('careQualityPerception').isInt({ min: 1, max: 10 })
    ];

    // Satisfaction feedback validation
    const satisfactionValidation = [
      param('familyMemberId').isUUID(),
      body('overallSatisfaction').isInt({ min: 1, max: 10 }),
      body('communicationQuality').isInt({ min: 1, max: 10 }),
      body('careTransparency').isInt({ min: 1, max: 10 }),
      body('staffResponsiveness').isInt({ min: 1, max: 10 })
    ];

    // Routes
    router.post('/family-members', familyMemberValidation, this.registerFamilyMember.bind(this));
    router.put('/family-members/:familyMemberId/trust-metrics', trustMetricsValidation, this.updateTrustMetrics.bind(this));
    router.get('/family-members/:familyMemberId/dashboard', this.getTransparencyDashboard.bind(this));
    router.get('/family-members/:familyMemberId/analytics', this.getCommunicationAnalytics.bind(this));
    router.post('/family-members/:familyMemberId/feedback', satisfactionValidation, this.submitSatisfactionFeedback.bind(this));
    router.get('/trust-report', this.getFamilyTrustReport.bind(this));

    return router;
  }
}