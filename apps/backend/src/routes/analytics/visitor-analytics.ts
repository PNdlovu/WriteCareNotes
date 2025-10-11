import { Router, Request, Response } from 'express';
import { EventEmitter2 } from 'eventemitter2';
import VisitorAnalyticsEngine from '../../services/analytics/VisitorAnalyticsEngine';
import { AuditTrailService } from '../../services/audit/AuditTrailService';
import { NotificationService } from '../../services/notifications/NotificationService';
import { authenticationMiddleware } from '../../middleware/authentication';
import { authorizationMiddleware } from '../../middleware/authorization';
import { validateRequest } from '../../middleware/validation';
import { body, query, param } from 'express-validator';

const router = Router();

// Initialize analytics engine
const eventEmitter = new EventEmitter2();
const auditTrailService = new AuditTrailService(eventEmitter);
const notificationService = new NotificationService(eventEmitter);
const analyticsEngine = new VisitorAnalyticsEngine(
  eventEmitter,
  auditTrailService,
  notificationService
);

/**
 * @swagger
 * /api/visitor-analytics/metrics:
 *   get:
 *     summary: Get comprehensive visitor analytics metrics
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics range
 *     responses:
 *       200:
 *         description: Visitor analytics metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VisitorAnalyticsMetrics'
 *       400:
 *         description: Invalid request parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/metrics',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics']),
  validateRequest([
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;

      const metrics = await analyticsEngine.getVisitorMetrics(dateRange);

      res.json({
        success: true,
        data: metrics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving visitor analyticsmetrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve visitor analytics metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/trends:
 *   get:
 *     summary: Get visitor trend analysis
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for trend analysis
 *       - in: query
 *         name: endDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for trend analysis
 *     responses:
 *       200:
 *         description: Visitor trend analysis retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VisitorTrendAnalysis'
 */
router.get('/trends',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics']),
  validateRequest([
    query('startDate').isISO8601().toDate(),
    query('endDate').isISO8601().toDate()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      };

      const trends = await analyticsEngine.getVisitorTrendAnalysis(dateRange);

      res.json({
        success: true,
        data: trends,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving visitor trendanalysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve visitor trend analysis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/security:
 *   get:
 *     summary: Get security analytics and risk assessment
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for security analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for security analytics
 *     responses:
 *       200:
 *         description: Security analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VisitorSecurityAnalytics'
 */
router.get('/security',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'security', 'analytics']),
  validateRequest([
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;

      const securityAnalytics = await analyticsEngine.getSecurityAnalytics(dateRange);

      res.json({
        success: true,
        data: securityAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving securityanalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve security analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/satisfaction:
 *   get:
 *     summary: Get visitor satisfaction analytics
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for satisfaction analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for satisfaction analytics
 *     responses:
 *       200:
 *         description: Satisfaction analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VisitorSatisfactionAnalytics'
 */
router.get('/satisfaction',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics']),
  validateRequest([
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;

      const satisfactionAnalytics = await analyticsEngine.getSatisfactionAnalytics(dateRange);

      res.json({
        success: true,
        data: satisfactionAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving satisfactionanalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve satisfaction analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/demographics:
 *   get:
 *     summary: Get visitor demographics analytics
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for demographics analytics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for demographics analytics
 *     responses:
 *       200:
 *         description: Demographics analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/VisitorDemographicsAnalytics'
 */
router.get('/demographics',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics']),
  validateRequest([
    query('startDate').optional().isISO8601().toDate(),
    query('endDate').optional().isISO8601().toDate()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      const dateRange = startDate && endDate ? {
        start: new Date(startDate as string),
        end: new Date(endDate as string)
      } : undefined;

      const demographicsAnalytics = await analyticsEngine.getDemographicsAnalytics(dateRange);

      res.json({
        success: true,
        data: demographicsAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving demographicsanalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve demographics analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/dashboard:
 *   get:
 *     summary: Get real-time dashboard data
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Real-time dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RealTimeDashboardData'
 */
router.get('/dashboard',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'dashboard']),
  async (req: Request, res: Response) => {
    try {
      const dashboardData = await analyticsEngine.getRealTimeDashboardData();

      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving real-time dashboarddata:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve real-time dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/reports/comprehensive:
 *   post:
 *     summary: Generate comprehensive analytics report
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date for report
 *               endDate:
 *                 type: string
 *                 format: date
 *                 description: End date for report
 *               includeExecutiveSummary:
 *                 type: boolean
 *                 default: true
 *                 description: Include executive summary
 *               includeRecommendations:
 *                 type: boolean
 *                 default: true
 *                 description: Include actionable recommendations
 *     responses:
 *       200:
 *         description: Comprehensive report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     summary:
 *                       $ref: '#/components/schemas/VisitorAnalyticsMetrics'
 *                     trends:
 *                       $ref: '#/components/schemas/VisitorTrendAnalysis'
 *                     security:
 *                       $ref: '#/components/schemas/VisitorSecurityAnalytics'
 *                     satisfaction:
 *                       $ref: '#/components/schemas/VisitorSatisfactionAnalytics'
 *                     demographics:
 *                       $ref: '#/components/schemas/VisitorDemographicsAnalytics'
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                     reportMetadata:
 *                       type: object
 */
router.post('/reports/comprehensive',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics', 'reports']),
  validateRequest([
    body('startDate').isISO8601().toDate(),
    body('endDate').isISO8601().toDate(),
    body('includeExecutiveSummary').optional().isBoolean(),
    body('includeRecommendations').optional().isBoolean()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.body;
      
      const dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };

      const report = await analyticsEngine.generateComprehensiveReport(dateRange);

      res.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error generating comprehensivereport:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate comprehensive report',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/predictive:
 *   get:
 *     summary: Get predictive analytics for visitor patterns
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forecastDays
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *         description: Number of days to forecast
 *     responses:
 *       200:
 *         description: Predictive analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     visitVolumePrediction:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           predictedVisits:
 *                             type: integer
 *                           confidence:
 *                             type: number
 *                             format: float
 *                     resourceRequirements:
 *                       type: array
 *                       items:
 *                         type: object
 *                     riskPredictions:
 *                       type: array
 *                       items:
 *                         type: object
 *                     satisfactionForecast:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/predictive',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics', 'predictive']),
  validateRequest([
    query('forecastDays').optional().isInt({ min: 1, max: 365 }).toInt()
  ]),
  async (req: Request, res: Response) => {
    try {
      const forecastDays = parseInt(req.query.forecastDays as string) || 30;

      const predictiveAnalytics = await analyticsEngine.getPredictiveAnalytics(forecastDays);

      res.json({
        success: true,
        data: predictiveAnalytics,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving predictiveanalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve predictive analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/realtime/subscribe:
 *   post:
 *     summary: Subscribe to real-time analytics updates (WebSocket)
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscriptionId:
 *                       type: string
 *                     websocketUrl:
 *                       type: string
 *                     instructions:
 *                       type: string
 */
router.post('/realtime/subscribe',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'realtime']),
  async (req: Request, res: Response) => {
    try {
      const subscriptionId = `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

      res.json({
        success: true,
        data: {
          subscriptionId,
          websocketUrl: `ws://localhost:3000/ws/visitor-analytics/${subscriptionId}`,
          instructions: 'Connect to the provided WebSocket URL to receive real-time updates'
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set up real-time subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * @swagger
 * /api/visitor-analytics/export:
 *   post:
 *     summary: Export analytics data in various formats
 *     tags: [Visitor Analytics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - format
 *               - dataType
 *               - startDate
 *               - endDate
 *             properties:
 *               format:
 *                 type: string
 *                 enum: [csv, excel, pdf, json]
 *                 description: Export format
 *               dataType:
 *                 type: string
 *                 enum: [metrics, trends, security, satisfaction, demographics, comprehensive]
 *                 description: Type of data to export
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               includeCharts:
 *                 type: boolean
 *                 default: false
 *                 description: Include charts in export (PDF/Excel only)
 *     responses:
 *       200:
 *         description: Export completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                     filename:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 */
router.post('/export',
  authenticationMiddleware,
  authorizationMiddleware(['visitor_management', 'analytics', 'export']),
  validateRequest([
    body('format').isIn(['csv', 'excel', 'pdf', 'json']),
    body('dataType').isIn(['metrics', 'trends', 'security', 'satisfaction', 'demographics', 'comprehensive']),
    body('startDate').isISO8601().toDate(),
    body('endDate').isISO8601().toDate(),
    body('includeCharts').optional().isBoolean()
  ]),
  async (req: Request, res: Response) => {
    try {
      const { format, dataType, startDate, endDate, includeCharts } = req.body;
      
      // For now, return a mock response - full implementation would generate actual files
      const filename = `visitor-analytics-${dataType}-${Date.now()}.${format}`;
      const downloadUrl = `/api/visitor-analytics/downloads/${filename}`;
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      res.json({
        success: true,
        data: {
          downloadUrl,
          filename,
          expiresAt: expiresAt.toISOString()
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error exporting analyticsdata:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
);

/**
 * Error handling middleware
 */
router.use((error: Error, req: Request, res: Response, next: any) => {
  console.error('Visitor Analytics APIError:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error in visitor analytics API',
    timestamp: new Date().toISOString()
  });
});

export default router;
