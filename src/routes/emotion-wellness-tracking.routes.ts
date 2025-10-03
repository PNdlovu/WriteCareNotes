import { Router } from 'express';
import { EmotionWellnessTrackingController } from '../controllers/wellness/EmotionWellnessTrackingController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const wellnessController = new EmotionWellnessTrackingController();

// Rate limiting for wellness tracking endpoints
const wellnessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all routes
router.use(wellnessLimiter);
router.use(authenticateToken);

/**
 * @route POST /api/wellness/emotion-reading
 * @desc Record emotion reading for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/emotion-reading',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.recordEmotionReading(req, res)
);

/**
 * @route POST /api/wellness/sentiment-analysis
 * @desc Analyze sentiment from text
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/sentiment-analysis',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.analyzeSentiment(req, res)
);

/**
 * @route POST /api/wellness/wellness-metric
 * @desc Track wellness metric for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/wellness-metric',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.trackWellnessMetric(req, res)
);

/**
 * @route GET /api/wellness/:residentId/insights
 * @desc Generate wellness insights for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/insights',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.generateWellnessInsights(req, res)
);

/**
 * @route GET /api/wellness/:residentId/dashboard
 * @desc Get wellness dashboard for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/dashboard',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.getWellnessDashboard(req, res)
);

/**
 * @route POST /api/wellness/activity-recommendations
 * @desc Generate activity recommendations based on mood
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/activity-recommendations',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.generateActivityRecommendations(req, res)
);

/**
 * @route GET /api/wellness/:residentId/emotion-history
 * @desc Get emotion history for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/emotion-history',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.getEmotionHistory(req, res)
);

/**
 * @route GET /api/wellness/:residentId/metrics-history
 * @desc Get wellness metrics history for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/metrics-history',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.getWellnessMetricsHistory(req, res)
);

/**
 * @route GET /api/wellness/:residentId/behavioral-patterns
 * @desc Get behavioral patterns for a resident
 * @access Private (Nurse, Manager, Admin)
 */
router.get('/:residentId/behavioral-patterns',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.getBehavioralPatterns(req, res)
);

/**
 * @route PUT /api/wellness/alerts/:alertId/status
 * @desc Update wellness alert status
 * @access Private (Nurse, Manager, Admin)
 */
router.put('/alerts/:alertId/status',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => wellnessController.updateWellnessAlertStatus(req, res)
);

/**
 * @route GET /api/wellness/analytics
 * @desc Get wellness analytics
 * @access Private (Manager, Admin)
 */
router.get('/analytics',
  requireRole(['manager', 'admin']),
  (req, res) => wellnessController.getWellnessAnalytics(req, res)
);

/**
 * @route GET /api/wellness/:residentId/export
 * @desc Export wellness data
 * @access Private (Manager, Admin)
 */
router.get('/:residentId/export',
  requireRole(['manager', 'admin']),
  (req, res) => wellnessController.exportWellnessData(req, res)
);

export default router;