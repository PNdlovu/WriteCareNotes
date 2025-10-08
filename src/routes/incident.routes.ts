import { Router } from 'express';
import { DataSource } from 'typeorm';
import { IncidentManagementController, createIncidentValidation, updateIncidentValidation, rootCauseAnalysisValidation, correctiveActionValidation, qualityReviewValidation } from '../../controllers/incident/IncidentManagementController';
import { IncidentManagementService } from '../../services/incident/IncidentManagementService';
import { authenticateToken } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';

/**
 * Factory function to create incident routes with DataSource injection
 */
export function createIncidentRoutes(dataSource: DataSource): Router {
  const router = Router();
  const incidentService = new IncidentManagementService(dataSource);
  const incidentController = new IncidentManagementController(incidentService);

  // Apply authentication and tenant isolation middleware to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * POST /incidents
   * Create new incident report
   */
  router.post(
    '/',
    createIncidentValidation,
    (req, res) => incidentController.create(req, res)
  );

  /**
   * GET /incidents/:id
   * Get incident by ID
   */
  router.get(
    '/:id',
    (req, res) => incidentController.getById(req, res)
  );

  /**
   * GET /incidents
   * List all incidents with filtering
   * Query params: incidentType, severity, status, reportedBy, startDate, endDate, critical, page, limit
   */
  router.get(
    '/',
    (req, res) => incidentController.getAll(req, res)
  );

  /**
   * PUT /incidents/:id
   * Update incident
   */
  router.put(
    '/:id',
    updateIncidentValidation,
    (req, res) => incidentController.update(req, res)
  );

  /**
   * DELETE /incidents/:id
   * Delete incident (soft delete)
   */
  router.delete(
    '/:id',
    (req, res) => incidentController.delete(req, res)
  );

  /**
   * POST /incidents/:id/root-cause
   * Add root cause analysis
   */
  router.post(
    '/:id/root-cause',
    rootCauseAnalysisValidation,
    (req, res) => incidentController.addRootCauseAnalysis(req, res)
  );

  /**
   * POST /incidents/:id/corrective-actions
   * Add corrective action
   */
  router.post(
    '/:id/corrective-actions',
    correctiveActionValidation,
    (req, res) => incidentController.addCorrectiveAction(req, res)
  );

  /**
   * PUT /incidents/:id/corrective-actions/:actionId
   * Update corrective action status
   */
  router.put(
    '/:id/corrective-actions/:actionId',
    (req, res) => incidentController.updateCorrectiveAction(req, res)
  );

  /**
   * POST /incidents/:id/resolve
   * Mark incident as resolved
   */
  router.post(
    '/:id/resolve',
    (req, res) => incidentController.resolve(req, res)
  );

  /**
   * POST /incidents/:id/close
   * Close incident
   */
  router.post(
    '/:id/close',
    (req, res) => incidentController.close(req, res)
  );

  /**
   * POST /incidents/:id/quality-review
   * Complete quality assurance review
   */
  router.post(
    '/:id/quality-review',
    qualityReviewValidation,
    (req, res) => incidentController.completeQualityReview(req, res)
  );

  /**
   * POST /incidents/:id/cqc-notify
   * Send CQC notification
   */
  router.post(
    '/:id/cqc-notify',
    (req, res) => incidentController.sendCQCNotification(req, res)
  );

  /**
   * GET /incidents/critical
   * Get critical incidents
   */
  router.get(
    '/critical',
    (req, res) => incidentController.getCritical(req, res)
  );

  /**
   * GET /incidents/cqc-required
   * Get incidents requiring CQC notification
   */
  router.get(
    '/cqc-required',
    (req, res) => incidentController.getCQCRequired(req, res)
  );

  /**
   * GET /incidents/overdue-actions
   * Get overdue corrective actions
   */
  router.get(
    '/overdue-actions',
    (req, res) => incidentController.getOverdueActions(req, res)
  );

  /**
   * GET /incidents/trends
   * Get trend analysis
   * Query params: startDate, endDate
   */
  router.get(
    '/trends',
    (req, res) => incidentController.getTrends(req, res)
  );

  /**
   * GET /incidents/statistics
   * Get incident statistics
   */
  router.get(
    '/statistics',
    (req, res) => incidentController.getStatistics(req, res)
  );

  return router;
}
