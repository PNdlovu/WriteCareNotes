/**
 * @fileoverview Policy Intelligence API Routes
 * @module PolicyIntelligenceRoutes
 * @category API Routes
 * @subcategory Policy Intelligence
 * @version 1.0.0
 * @since 2025-10-07
 * 
 * @description
 * REST API routes for Policy Intelligence featuresincluding:
 * - Gap Analysis
 * - Risk Scoring & Alerts
 * - Analytics & ROI Metrics
 * 
 * @compliance
 * - GDPR Article 32 - Security of processing
 * - ISO 27001 - Information Security Management
 */

import { Router, Request, Response } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth.middleware';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { Logger } from '../core/Logger';
import { PolicyIntelligenceService } from '../services/policy-intelligence/PolicyIntelligenceService';

const router = Router();
const logger = new Logger('PolicyIntelligenceAPI');

/**
 * Mock AuditTrailService for development
 * In production, replace with proper DI container injection
 */
class MockAuditTrailService {
  async logEvent(event: any): Promise<void> {
    logger.debug('Audit event logged', event);
  }
}

/**
 * Mock NotificationService for development
 * In production, replace with proper DI container injection
 */
class MockNotificationService {
  async sendNotification(notification: any): Promise<void> {
    logger.debug('Notification sent', notification);
  }
}

// Initialize services (in production, these would be injected via DI)
const auditService = new MockAuditTrailService();
const notificationService = new MockNotificationService();
const intelligenceService = new PolicyIntelligenceService(auditService as any, notificationService as any);

/**
 * Validation middleware for handling validation errors
 */
const handleValidationErrors = (req: Request, res: Response, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation errors',
      errors: errors.array()
    });
  }
  next();
};

// ============================================================================
// GAP ANALYSIS ROUTES
// ============================================================================

/**
 * @route GET /api/v1/organizations/:organizationId/policy-gaps
 * @description Get policy gap analysis for an organization
 * @access Private (authenticated users)
 * @param {string} organizationId - Organization identifier
 * @query {string} jurisdiction - British Isles jurisdiction
 * @query {string} serviceType - Type of care service
 */
router.get('/organizations/:organizationId/policy-gaps',
  authMiddleware,
  rbacMiddleware(['admin', 'manager', 'compliance_officer']),
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('jurisdiction').isIn([
      'england', 'wales', 'scotland', 'northern-ireland', 
      'ireland', 'jersey', 'isle-of-man'
    ]).withMessage('Invalid jurisdiction'),
    query('serviceType').isIn([
      'residential-care', 'nursing-home', 'domiciliary-care',
      'day-care', 'supported-living', 'specialist-care'
    ]).withMessage('Invalid service type')
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { jurisdiction, serviceType } = req.query;

      const gapAnalysis = await intelligenceService.getGapAnalysis(
        organizationId,
        jurisdiction as string,
        serviceType as string
      );

      res.json({
        success: true,
        data: gapAnalysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch gap analysis', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gap analysis',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/v1/organizations/:organizationId/policies/from-template
 * @description Create a policy from template
 * @access Private (authenticated users)
 */
router.post('/organizations/:organizationId/policies/from-template',
  authMiddleware,
  rbacMiddleware(['admin', 'manager']),
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    body('templateId').notEmpty().withMessage('Template ID is required'),
    body('jurisdiction').optional().isString(),
    body('serviceType').optional().isString()
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { templateId, jurisdiction, serviceType, customFields } = req.body;

      const policy = await intelligenceService.createPolicyFromTemplate(
        organizationId,
        templateId,
        { jurisdiction, serviceType, customFields }
      );

      res.status(201).json({
        success: true,
        data: policy,
        message: 'Policy created successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to create policy from template', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create policy from template',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/v1/organizations/:organizationId/policy-gaps/:gapId/addressed
 * @description Mark a gap as addressed
 * @access Private (authenticated users)
 */
router.post('/organizations/:organizationId/policy-gaps/:gapId/addressed',
  authMiddleware,
  rbacMiddleware(['admin', 'manager', 'compliance_officer']),
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    param('gapId').isUUID().withMessage('Invalid gap ID'),
    body('policyId').isUUID().withMessage('Policy ID is required')
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId, gapId } = req.params;
      const { policyId } = req.body;

      const result = await intelligenceService.markGapAddressed(
        organizationId,
        gapId,
        policyId
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to mark gap as addressed', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark gap as addressed',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/policy-gaps/history
 * @description Get gap remediation history
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/policy-gaps/history',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const history = await intelligenceService.getGapRemediationHistory(
        organizationId,
        limit
      );

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch gap remediation history', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch gap remediation history',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/policy-gaps/export/:format
 * @description Export gap analysis report
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/policy-gaps/export/:format',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    param('format').isIn(['pdf', 'csv', 'excel']).withMessage('Invalid format'),
    query('jurisdiction').isString().withMessage('Jurisdiction is required')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId, format } = req.params;
      const { jurisdiction } = req.query;

      const report = await intelligenceService.exportGapAnalysisReport(
        organizationId,
        jurisdiction as string,
        format as 'pdf' | 'csv' | 'excel'
      );

      // Set appropriate content type
      const contentType = {
        pdf: 'application/pdf',
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }[format];

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="gap-analysis-${Date.now()}.${format}"`);
      res.send(report);
    } catch (error) {
      logger.error('Failed to export gap analysis report', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export gap analysis report',
        error: error.message
      });
    }
  }
);

// ============================================================================
// RISK MANAGEMENT ROUTES
// ============================================================================

/**
 * @route GET /api/v1/organizations/:organizationId/policy-risks
 * @description Get policy risk assessments
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/policy-risks',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('riskLevel').optional().isIn(['critical', 'high', 'medium', 'low', 'minimal']),
    query('category').optional().isString(),
    query('minScore').optional().isInt({ min: 0, max: 100 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const filters = {
        riskLevel: req.query.riskLevel as any,
        category: req.query.category as string,
        minScore: req.query.minScore ? parseInt(req.query.minScore as string) : undefined
      };

      const risks = await intelligenceService.getPolicyRisks(organizationId, filters);

      res.json({
        success: true,
        data: risks,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policy risks', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy risks',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/risk-alerts
 * @description Get active risk alerts
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/risk-alerts',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('includeAcknowledged').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const includeAcknowledged = req.query.includeAcknowledged === 'true';

      const alerts = await intelligenceService.getRiskAlerts(
        organizationId,
        includeAcknowledged
      );

      res.json({
        success: true,
        data: alerts,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch risk alerts', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch risk alerts',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/v1/risk-alerts/:alertId/acknowledge
 * @description Acknowledge a risk alert
 * @access Private (authenticated users)
 */
router.post('/risk-alerts/:alertId/acknowledge',
  authMiddleware,
  [
    param('alertId').isUUID().withMessage('Invalid alert ID'),
    body('notes').optional().isString()
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const { notes } = req.body;
      const userId = (req.user as any).id;

      const result = await intelligenceService.acknowledgeAlert(
        alertId,
        userId,
        notes
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to acknowledge alert', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge alert',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/risk-trends
 * @description Get risk trend data
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/risk-trends',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('days').optional().isInt({ min: 7, max: 365 }).withMessage('Days must be between 7 and 365')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const trends = await intelligenceService.getRiskTrends(organizationId, days);

      res.json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch risk trends', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch risk trends',
        error: error.message
      });
    }
  }
);

/**
 * @route PUT /api/v1/organizations/:organizationId/risk-threshold
 * @description Update risk threshold configuration
 * @access Private (admin/manager only)
 */
router.put('/organizations/:organizationId/risk-threshold',
  authMiddleware,
  rbacMiddleware(['admin', 'manager']),
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    body('threshold').isInt({ min: 0, max: 100 }).withMessage('Threshold must be between 0 and 100')
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { threshold } = req.body;

      const result = await intelligenceService.updateRiskThreshold(
        organizationId,
        threshold
      );

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to update risk threshold', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update risk threshold',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/v1/policies/:policyId/recalculate-risk
 * @description Recalculate risk score for a specific policy
 * @access Private (authenticated users)
 */
router.post('/policies/:policyId/recalculate-risk',
  authMiddleware,
  [
    param('policyId').isUUID().withMessage('Invalid policy ID')
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { policyId } = req.params;

      const risk = await intelligenceService.recalculatePolicyRisk(policyId);

      res.json({
        success: true,
        data: risk,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to recalculate policy risk', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recalculate policy risk',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/risk-report/export/:format
 * @description Export risk report
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/risk-report/export/:format',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    param('format').isIn(['pdf', 'csv', 'excel']).withMessage('Invalid format'),
    query('riskLevel').optional().isIn(['critical', 'high', 'medium', 'low', 'minimal']),
    query('category').optional().isString()
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId, format } = req.params;
      const filters = {
        riskLevel: req.query.riskLevel as any,
        category: req.query.category as string
      };

      const report = await intelligenceService.exportRiskReport(
        organizationId,
        format as 'pdf' | 'csv' | 'excel',
        filters
      );

      const contentType = {
        pdf: 'application/pdf',
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }[format];

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="risk-report-${Date.now()}.${format}"`);
      res.send(report);
    } catch (error) {
      logger.error('Failed to export risk report', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export risk report',
        error: error.message
      });
    }
  }
);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/effectiveness
 * @description Get policy effectiveness metrics
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/effectiveness',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const period = (req.query.period as string) || '30days';

      const effectiveness = await intelligenceService.getPolicyEffectiveness(
        organizationId,
        period
      );

      res.json({
        success: true,
        data: effectiveness,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch policy effectiveness', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch policy effectiveness',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/roi
 * @description Get ROI metrics
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/roi',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const period = (req.query.period as string) || '30days';

      const roi = await intelligenceService.getROIMetrics(organizationId, period);

      res.json({
        success: true,
        data: roi,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch ROI metrics', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ROI metrics',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/violations
 * @description Get violation patterns
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/violations',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const period = (req.query.period as string) || '30days';

      const patterns = await intelligenceService.getViolationPatterns(
        organizationId,
        period
      );

      res.json({
        success: true,
        data: patterns,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch violation patterns', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch violation patterns',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/forecast
 * @description Get acknowledgment forecast
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/forecast',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('policyId').optional().isUUID(),
    query('days').optional().isInt({ min: 1, max: 30 })
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { policyId } = req.query;
      const days = parseInt(req.query.days as string) || 7;

      const forecast = await intelligenceService.getAcknowledgmentForecast(
        organizationId,
        policyId as string,
        days
      );

      res.json({
        success: true,
        data: forecast,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch acknowledgment forecast', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch acknowledgment forecast',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/summary
 * @description Generate executive summary
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/summary',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const period = (req.query.period as string) || '30days';

      const summary = await intelligenceService.getExecutiveSummary(
        organizationId,
        period
      );

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to generate executive summary', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate executive summary',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/export/:format
 * @description Export analytics report
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/export/:format',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    param('format').isIn(['pdf', 'csv', 'excel']).withMessage('Invalid format'),
    query('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId, format } = req.params;
      const period = (req.query.period as string) || '30days';

      const report = await intelligenceService.exportAnalyticsReport(
        organizationId,
        format as 'pdf' | 'csv' | 'excel',
        period
      );

      const contentType = {
        pdf: 'application/pdf',
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }[format];

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${Date.now()}.${format}"`);
      res.send(report);
    } catch (error) {
      logger.error('Failed to export analytics report', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export analytics report',
        error: error.message
      });
    }
  }
);

/**
 * @route POST /api/v1/organizations/:organizationId/analytics/schedule
 * @description Schedule analytics report
 * @access Private (admin/manager only)
 */
router.post('/organizations/:organizationId/analytics/schedule',
  authMiddleware,
  rbacMiddleware(['admin', 'manager']),
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Invalid frequency'),
    body('format').isIn(['pdf', 'excel', 'csv']).withMessage('Invalid format'),
    body('recipients').isArray().withMessage('Recipients must be an array'),
    body('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const { frequency, format, recipients, period } = req.body;

      const schedule = await intelligenceService.scheduleAnalyticsReport(
        organizationId,
        { frequency, format, recipients, period }
      );

      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Report scheduled successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to schedule analytics report', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule analytics report',
        error: error.message
      });
    }
  }
);

/**
 * @route DELETE /api/v1/analytics/schedules/:scheduleId
 * @description Cancel scheduled report
 * @access Private (admin/manager only)
 */
router.delete('/analytics/schedules/:scheduleId',
  authMiddleware,
  rbacMiddleware(['admin', 'manager']),
  [
    param('scheduleId').isUUID().withMessage('Invalid schedule ID')
  ],
  handleValidationErrors,
  auditMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { scheduleId } = req.params;

      const result = await intelligenceService.cancelScheduledReport(scheduleId);

      res.json({
        success: true,
        data: result,
        message: 'Schedule cancelled successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to cancel scheduled report', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel scheduled report',
        error: error.message
      });
    }
  }
);

/**
 * @route GET /api/v1/organizations/:organizationId/analytics/category-performance
 * @description Get category performance breakdown
 * @access Private (authenticated users)
 */
router.get('/organizations/:organizationId/analytics/category-performance',
  authMiddleware,
  [
    param('organizationId').isUUID().withMessage('Invalid organization ID'),
    query('period').optional().isIn(['7days', '30days', '90days', '1year', 'all-time'])
  ],
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { organizationId } = req.params;
      const period = (req.query.period as string) || '30days';

      const performance = await intelligenceService.getCategoryPerformance(
        organizationId,
        period
      );

      res.json({
        success: true,
        data: performance,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to fetch category performance', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category performance',
        error: error.message
      });
    }
  }
);

export default router;
