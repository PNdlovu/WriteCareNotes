import { Router } from 'express';
import { HealthCheckController } from '../controllers/health/HealthCheckController';

const router = Router();
const healthController = new HealthCheckController();

/**
 * @route GET /health
 * @desc Basic health check endpoint
 * @access Public
 */
router.get('/', (req, res) => healthController.basicHealth(req, res));

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

export default router;