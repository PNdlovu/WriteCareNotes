import { Router } from 'express';
import { HealthCheckController } from '../controllers/health/HealthCheckController';

const router = Router();
const healthController = new HealthCheckController();

/**
 * @route GET /health
 * @desc Basic health check endpoint (Load Balancer)
 * @access Public
 */
router.get('/', (req, res) => healthController.basicHealth(req, res));

/**
 * @route GET /health/detailed
 * @desc Detailed health check with all system components
 * @access Public
 */
router.get('/detailed', (req, res) => healthController.detailedHealth(req, res));

/**
 * @route GET /health/ready
 * @desc Readiness probe (Kubernetes/Docker)
 * @access Public
 */
router.get('/ready', (req, res) => healthController.readinessCheck(req, res));

/**
 * @route GET /health/live
 * @desc Liveness probe (Kubernetes/Docker)
 * @access Public
 */
router.get('/live', (req, res) => healthController.livenessCheck(req, res));

/**
 * @route GET /health/comprehensive
 * @desc Comprehensive health check including AI features
 * @access Public
 */
router.get('/comprehensive', (req, res) => healthController.comprehensiveHealth(req, res));

/**
 * @route GET /health/ai-features
 * @desc AI features specific health check
 * @access Public
 */
router.get('/ai-features', (req, res) => healthController.aiFeaturesHealth(req, res));

/**
 * @route GET /metrics
 * @desc Prometheus metrics endpoint
 * @access Public
 */
router.get('/metrics', (req, res) => healthController.prometheusMetrics(req, res));

export default router;
