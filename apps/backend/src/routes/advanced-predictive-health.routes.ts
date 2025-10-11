import { Router } from 'express';
import { AdvancedPredictiveHealthController } from '../controllers/analytics/AdvancedPredictiveHealthController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const predictiveHealthController = new AdvancedPredictiveHealthController();

// Rate limiting for predictive health endpoints
const predictiveHealthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all routes
router.use(predictiveHealthLimiter);
router.use(authenticateToken);

/**
 * @route POST /api/predictive-health/generate-prediction
 * @desc Generate health prediction for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/generate-prediction',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.generateHealthPrediction(req, res)
);

/**
 * @route GET /api/predictive-health/:residentId/trends
 * @desc Analyze health trends for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/trends',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.analyzeHealthTrends(req, res)
);

/**
 * @route GET /api/predictive-health/:residentId/insights
 * @desc Generate health insights for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/insights',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.generateHealthInsights(req, res)
);

/**
 * @route POST /api/predictive-health/create-alert
 * @desc Create health alert
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/create-alert',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.createHealthAlert(req, res)
);

/**
 * @route GET /api/predictive-health/:residentId/dashboard
 * @desc Get health dashboard for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/dashboard',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.getHealthDashboard(req, res)
);

/**
 * @route POST /api/predictive-health/train-model
 * @desc Train health model
 * @access Private (Admin)
 */
router.post('/train-model',
  requireRole(['admin']),
  (req, res) => predictiveHealthController.trainHealthModel(req, res)
);

/**
 * @route GET /api/predictive-health/:residentId/predictions
 * @desc Get health predictions for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/predictions',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.getHealthPredictions(req, res)
);

/**
 * @route GET /api/predictive-health/:residentId/alerts
 * @desc Get health alerts for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/alerts',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.getHealthAlerts(req, res)
);

/**
 * @route PUT /api/predictive-health/alerts/:alertId/status
 * @desc Update health alert status
 * @access Private (Nurse, Manager, Admin)
 */
router.put('/alerts/:alertId/status',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => predictiveHealthController.updateHealthAlertStatus(req, res)
);

/**
 * @route GET /api/predictive-health/analytics/summary
 * @desc Get health analytics summary
 * @access Private (Manager, Admin)
 */
router.get('/analytics/summary',
  requireRole(['manager', 'admin']),
  (req, res) => predictiveHealthController.getHealthAnalyticsSummary(req, res)
);

/**
 * @route GET /api/predictive-health/:residentId/export
 * @desc Export health data
 * @access Private (Manager, Admin)
 */
router.get('/:residentId/export',
  requireRole(['manager', 'admin']),
  (req, res) => predictiveHealthController.exportHealthData(req, res)
);

export default router;