import { Router } from 'express';
import { DataSource } from 'typeorm';
import {
  ReportingAnalyticsController,
  customReportValidation,
  exportReportValidation,
} from '../../controllers/reporting/ReportingAnalyticsController';
import { ReportingAnalyticsService } from '../../services/reporting/ReportingAnalyticsService';
import { authenticateToken } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';

/**
 * Factory function to create reporting & analytics routes with DataSource injection
 */
export function createReportingRoutes(dataSource: DataSource): Router {
  const router = Router();
  const reportingService = new ReportingAnalyticsService(dataSource);
  const reportingController = new ReportingAnalyticsController(reportingService);

  // Apply authentication and tenant isolation middleware to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * POST /reporting/custom-report
   * Generate custom report
   */
  router.post('/custom-report', customReportValidation, (req, res) =>
    reportingController.generateCustomReport(req, res)
  );

  /**
   * GET /reporting/cqc-compliance
   * Get CQC compliance report
   * Queryparams: startDate, endDate
   */
  router.get('/cqc-compliance', (req, res) => reportingController.getCQCComplianceReport(req, res));

  /**
   * GET /reporting/dashboard-kpis
   * Get dashboard KPIs
   */
  router.get('/dashboard-kpis', (req, res) => reportingController.getDashboardKPIs(req, res));

  /**
   * GET /reporting/trends
   * Get trend analysis
   * Queryparams: metric, period, days
   */
  router.get('/trends', (req, res) => reportingController.getTrendAnalysis(req, res));

  /**
   * POST /reporting/export
   * Export report
   */
  router.post('/export', exportReportValidation, (req, res) => reportingController.exportReport(req, res));

  /**
   * GET /reporting/operational-statistics
   * Get operational statistics
   */
  router.get('/operational-statistics', (req, res) => reportingController.getOperationalStatistics(req, res));

  /**
   * GET /reporting/compliance-summary
   * Get compliance summary
   */
  router.get('/compliance-summary', (req, res) => reportingController.getComplianceSummary(req, res));

  return router;
}
