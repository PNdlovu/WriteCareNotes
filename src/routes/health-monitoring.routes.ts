import { Router } from 'express';
import { DataSource } from 'typeorm';
import {
  HealthMonitoringController,
  recordVitalSignsValidation,
  recordWeightValidation,
  createAssessmentValidation,
  earlyWarningScoreValidation,
} from '../../controllers/health/HealthMonitoringController';
import { HealthMonitoringService } from '../../services/health/HealthMonitoringService';
import { authenticateToken } from '../../middleware/auth';
import { tenantIsolation } from '../../middleware/tenantIsolation';

/**
 * Factory function to create health monitoring routes with DataSource injection
 */
export function createHealthMonitoringRoutes(dataSource: DataSource): Router {
  const router = Router();
  const healthService = new HealthMonitoringService(dataSource);
  const healthController = new HealthMonitoringController(healthService);

  // Apply authentication and tenant isolation middleware to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * POST /health/vital-signs
   * Record vital signs
   */
  router.post('/vital-signs', recordVitalSignsValidation, (req, res) => healthController.recordVitalSigns(req, res));

  /**
   * POST /health/weight
   * Record weight
   */
  router.post('/weight', recordWeightValidation, (req, res) => healthController.recordWeight(req, res));

  /**
   * POST /health/assessments
   * Create health assessment
   */
  router.post('/assessments', createAssessmentValidation, (req, res) => healthController.createAssessment(req, res));

  /**
   * GET /health/assessments/:id
   * Get assessment by ID
   */
  router.get('/assessments/:id', (req, res) => healthController.getAssessmentById(req, res));

  /**
   * GET /health/assessments
   * List all assessments with filtering
   * Query params: residentId, assessmentType, startDate, endDate, page, limit
   */
  router.get('/assessments', (req, res) => healthController.getAssessments(req, res));

  /**
   * PUT /health/assessments/:id
   * Update assessment
   */
  router.put('/assessments/:id', (req, res) => healthController.updateAssessment(req, res));

  /**
   * POST /health/assessments/:id/complete
   * Complete assessment
   */
  router.post('/assessments/:id/complete', (req, res) => healthController.completeAssessment(req, res));

  /**
   * GET /health/assessments/overdue
   * Get overdue assessments
   */
  router.get('/assessments/overdue', (req, res) => healthController.getOverdueAssessments(req, res));

  /**
   * GET /health/vital-signs/trends/:residentId
   * Get vital signs trend
   * Query params: vitalType, days
   */
  router.get('/vital-signs/trends/:residentId', (req, res) => healthController.getVitalSignsTrend(req, res));

  /**
   * GET /health/weight/trends/:residentId
   * Get weight trend
   * Query params: months
   */
  router.get('/weight/trends/:residentId', (req, res) => healthController.getWeightTrend(req, res));

  /**
   * POST /health/early-warning-score
   * Calculate early warning score (NEWS2)
   */
  router.post('/early-warning-score', earlyWarningScoreValidation, (req, res) =>
    healthController.calculateEarlyWarningScore(req, res)
  );

  /**
   * GET /health/statistics
   * Get health monitoring statistics
   */
  router.get('/statistics', (req, res) => healthController.getStatistics(req, res));

  return router;
}
