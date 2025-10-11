import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { ReportingAnalyticsService } from '../../services/reporting/ReportingAnalyticsService';

/**
 * Controller #14: Reporting & Analytics
 * 
 * 10 endpoints for comprehensive reporting and analytics
 */
export class ReportingAnalyticsController {
  const ructor(private reportingService: ReportingAnalyticsService) {}

  /**
   * POST /reporting/custom-report
   * Generate custom report
   */
  async generateCustomReport(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const report = await this.reportingService.generateCustomReport({
        ...req.body,
        organizationId,
      });

      res.status(201).json({
        success: true,
        data: report,
        message: 'Custom report generated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate custom report',
      });
    }
  }

  /**
   * GET /reporting/cqc-compliance
   * Get CQC compliance report
   */
  async getCQCComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const report = await this.reportingService.getCQCComplianceReport(organizationId, startDate, endDate);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate CQC compliance report',
      });
    }
  }

  /**
   * GET /reporting/dashboard-kpis
   * Get dashboard KPIs
   */
  async getDashboardKPIs(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const kpis = await this.reportingService.getDashboardKPIs(organizationId);

      res.json({
        success: true,
        data: kpis,
        count: kpis.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve dashboard KPIs',
      });
    }
  }

  /**
   * GET /reporting/trends
   * Get trend analysis
   */
  async getTrendAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const metric = (req.query.metric as string) || 'incidents';
      const period = (req.query.period as 'daily' | 'weekly' | 'monthly') || 'daily';
      const days = parseInt(req.query.days as string) || 30;

      const trends = await this.reportingService.getTrendAnalysis(organizationId, metric, period, days);

      res.json({
        success: true,
        data: trends,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve trend analysis',
      });
    }
  }

  /**
   * POST /reporting/export
   * Export report
   */
  async exportReport(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const organizationId = req.user?.organizationId || req.body.organizationId;
      const exportResult = await this.reportingService.exportReport({
        ...req.body,
        organizationId,
      });

      res.json({
        success: true,
        data: exportResult,
        message: 'Report exported successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export report',
      });
    }
  }

  /**
   * GET /reporting/operational-statistics
   * Get operational statistics
   */
  async getOperationalStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const statistics = await this.reportingService.getOperationalStatistics(organizationId);

      res.json({
        success: true,
        data: statistics,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve operational statistics',
      });
    }
  }

  /**
   * GET /reporting/compliance-summary
   * Get compliance summary
   */
  async getComplianceSummary(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = req.user?.organizationId || (req.query.organizationId as string);
      const summary = await this.reportingService.getComplianceSummary(organizationId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to retrieve compliance summary',
      });
    }
  }
}

/**
 * Validation rules
 */

export const customReportValidation = [
  body('reportName').notEmpty().withMessage('Report name is required'),
  body('reportType')
    .isIn(['compliance', 'clinical', 'operational', 'financial', 'activity', 'custom'])
    .withMessage('Invalid report type'),
  body('dataSource').notEmpty().withMessage('Data source is required'),
  body('columns').isArray({ min: 1 }).withMessage('At least one column is required'),
];

export const exportReportValidation = [
  body('reportId').notEmpty().withMessage('Report ID is required'),
  body('format').isIn(['pdf', 'excel', 'csv', 'json']).withMessage('Invalid export format'),
];
