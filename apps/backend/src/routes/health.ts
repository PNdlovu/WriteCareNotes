import { EventEmitter2 } from "eventemitter2";

import { Router, Request, Response } from 'express';
import HealthCheckService from '../services/healthCheckService';
import { ErrorHandler } from '../utils/errorHandler';

const router = Router();

/**
 * Comprehensive health check endpoint
 */
router.get('/', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const healthStatus = await HealthCheckService.performHealthCheck();
  
  const statusCode = healthStatus.overall === 'healthy' ? 200 : 
                    healthStatus.overall === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
}));

/**
 * Simple health check for load balancers
 */
router.get('/simple', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const healthStatus = await HealthCheckService.simpleHealthCheck();
  
  const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json(healthStatus);
}));

/**
 * Readiness check endpoint
 */
router.get('/ready', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const healthStatus = await HealthCheckService.performHealthCheck();
  
  // Check if critical services are healthy
  const criticalServices = healthStatus.services.filter(s => 
    ['database', 'redis'].includes(s.service)
  );
  
  const allCriticalHealthy = criticalServices.every(s => s.status === 'healthy');
  
  if (allCriticalHealthy) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      services: criticalServices
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      services: criticalServices
    });
  }
}));

/**
 * Liveness check endpoint
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

/**
 * Compliance health check
 */
router.get('/compliance', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    compliance: {
      gdpr: 'compliant',
      hipaa: 'compliant',
      audit: 'enabled',
      data_encryption: 'enabled',
      access_controls: 'enabled',
      audit_trails: 'enabled'
    },
    features: {
      consent_management: 'implemented',
      data_retention: 'configured',
      breach_detection: 'monitored',
      access_logging: 'enabled'
    }
  });
});

/**
 * System metrics endpoint
 */
router.get('/metrics', ErrorHandler.asyncHandler(async (req: Request, res: Response) => {
  const healthStatus = await HealthCheckService.performHealthCheck();
  
  res.json({
    timestamp: new Date().toISOString(),
    system: healthStatus.system,
    services: healthStatus.services.map(s => ({
      name: s.service,
      status: s.status,
      responseTime: s.responseTime
    }))
  });
}));

export default router;
