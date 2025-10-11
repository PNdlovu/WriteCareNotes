import { Router } from 'express';
import { param } from 'express-validator';
import { MonitoringController } from '../../controllers/monitoring/MonitoringController';
import { rbacMiddleware } from '../../middleware/rbacMiddleware';
import { validateRequest } from '../../middleware/validateRequest';

const router = Router();
const monitoringController = new MonitoringController();

// Health check endpoint (public)
router.get(
  '/health',
  monitoringController.getHealthCheck.bind(monitoringController)
);

// System status endpoint (public)
router.get(
  '/status',
  monitoringController.getSystemStatus.bind(monitoringController)
);

// Prometheus metrics endpoint (public)
router.get(
  '/metrics',
  monitoringController.getPrometheusMetrics.bind(monitoringController)
);

// Get all health checks (admin only)
router.get(
  '/health/checks',
  rbacMiddleware(['admin', 'monitoring:read']),
  monitoringController.getAllHealthChecks.bind(monitoringController)
);

// Get specific service health (admin only)
router.get(
  '/health/services/:service',
  [
    param('service').isString().withMessage('Service name must be a string')
  ],
  validateRequest,
  rbacMiddleware(['admin', 'monitoring:read']),
  monitoringController.getServiceHealth.bind(monitoringController)
);

// Get system metrics (admin only)
router.get(
  '/metrics/system',
  rbacMiddleware(['admin', 'monitoring:read']),
  monitoringController.getSystemMetrics.bind(monitoringController)
);

// Get latest system metrics (admin only)
router.get(
  '/metrics/latest',
  rbacMiddleware(['admin', 'monitoring:read']),
  monitoringController.getLatestMetrics.bind(monitoringController)
);

export default router;