import { Request, Response } from 'express';
import { HealthCheckService } from '../../services/monitoring/HealthCheckService';

export class MonitoringController {
  private healthCheckService: HealthCheckService;

  constructor() {
    this.healthCheckService = new HealthCheckService();
  }

  /**
   * Get health check results
   */
  async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await this.healthCheckService.performHealthCheck();
      
      res.json({
        success: true,
        data: healthCheck
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.healthCheckService.getSystemMetrics();
      
      res.json({
        success: true,
        data: {
          metrics,
          count: metrics.length
        }
      });
    } catch (error) {
      console.error('Failed to get system metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get latest system metrics
   */
  async getLatestMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = this.healthCheckService.getLatestSystemMetrics();
      
      if (!metrics) {
        res.status(404).json({
          success: false,
          error: 'No metrics available'
        });
        return;
      }

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      console.error('Failed to get latest metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get Prometheus metrics
   */
  async getPrometheusMetrics(req: Request, res: Response): Promise<void> {
    try {
      const prometheusMetrics = this.healthCheckService.generatePrometheusMetrics();
      
      res.set('Content-Type', 'text/plain');
      res.send(prometheusMetrics.metrics);
    } catch (error) {
      console.error('Failed to get Prometheus metrics:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get service health
   */
  async getServiceHealth(req: Request, res: Response): Promise<void> {
    try {
      const { service } = req.params;
      
      if (!service) {
        res.status(400).json({
          success: false,
          error: 'Service name is required'
        });
        return;
      }

      const health = this.healthCheckService.getServiceHealth(service);
      
      if (!health) {
        res.status(404).json({
          success: false,
          error: 'Service not found'
        });
        return;
      }

      res.json({
        success: true,
        data: health
      });
    } catch (error) {
      console.error('Failed to get service health:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all health check results
   */
  async getAllHealthChecks(req: Request, res: Response): Promise<void> {
    try {
      const healthChecks = this.healthCheckService.getHealthCheckResults();
      
      res.json({
        success: true,
        data: {
          healthChecks,
          count: healthChecks.length
        }
      });
    } catch (error) {
      console.error('Failed to get health checks:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get system status
   */
  async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const healthCheck = await this.healthCheckService.performHealthCheck();
      const latestMetrics = this.healthCheckService.getLatestSystemMetrics();
      
      const status = {
        overall: healthCheck.overall,
        timestamp: healthCheck.timestamp,
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: healthCheck.checks.map(check => ({
          name: check.service,
          status: check.status,
          responseTime: check.responseTime,
          lastChecked: check.lastChecked
        })),
        metrics: latestMetrics ? {
          memory: latestMetrics.memory,
          cpu: latestMetrics.cpu,
          application: latestMetrics.application
        } : null
      };

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Failed to get system status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default MonitoringController;