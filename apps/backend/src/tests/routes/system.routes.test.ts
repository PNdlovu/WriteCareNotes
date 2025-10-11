import request from 'supertest';
import express from 'express';
import systemRoutes from '../../routes/system/system.routes';

/**
 * @fileoverview System Routes Tests
 * @module SystemRoutesTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Test suite for system routes
 * including unit tests, integration tests, and E2E tests.
 */

describe('System Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/system', systemRoutes);
  });

  describe('POST /api/system/system-tests', () => {
    it('should run system tests successfully', async () => {
      const response = await request(app)
        .post('/api/system/system-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System tests initiated');
      expect(response.body.data.testSuite).toBe('WriteCareNotes System Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.status).toBe('running');
    });
  });

  describe('POST /api/system/e2e-tests', () => {
    it('should run E2E tests successfully', async () => {
      const response = await request(app)
        .post('/api/system/e2e-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('E2E tests initiated');
      expect(response.body.data.testSuite).toBe('WriteCareNotes E2E Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.status).toBe('running');
    });
  });

  describe('POST /api/system/smoke-tests', () => {
    it('should run smoke tests successfully', async () => {
      const response = await request(app)
        .post('/api/system/smoke-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Smoke tests initiated');
      expect(response.body.data.testSuite).toBe('WriteCareNotes Smoke Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.status).toBe('running');
    });
  });

  describe('POST /api/system/regression-tests', () => {
    it('should run regression tests successfully', async () => {
      const response = await request(app)
        .post('/api/system/regression-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Regression tests initiated');
      expect(response.body.data.testSuite).toBe('WriteCareNotes Regression Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.status).toBe('running');
    });
  });

  describe('GET /api/system/status', () => {
    it('should get system status successfully', async () => {
      const response = await request(app)
        .get('/api/system/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System status retrieved');
      expect(response.body.data.overallStatus).toBe('healthy');
      expect(response.body.data.services).toHaveLength(4);
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.lastUpdated).toBeDefined();
    });

    it('should have correct service status structure', async () => {
      const response = await request(app)
        .get('/api/system/status')
        .expect(200);

      const services = response.body.data.services;
      services.forEach((service: any) => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('responseTime');
        expect(service).toHaveProperty('uptime');
        expect(service).toHaveProperty('lastCheck');
      });
    });

    it('should have correct performance metrics structure', async () => {
      const response = await request(app)
        .get('/api/system/status')
        .expect(200);

      const performance = response.body.data.performance;
      expect(performance).toHaveProperty('averageResponseTime');
      expect(performance).toHaveProperty('maxResponseTime');
      expect(performance).toHaveProperty('minResponseTime');
      expect(performance).toHaveProperty('totalRequests');
      expect(performance).toHaveProperty('successRate');
    });
  });

  describe('GET /api/system/metrics', () => {
    it('should get system metrics successfully with valid query parameters', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System metrics retrieved');
      expect(response.body.data.timeRange).toBeDefined();
      expect(response.body.data.hrMetrics).toBeDefined();
      expect(response.body.data.financeMetrics).toBeDefined();
      expect(response.body.data.systemMetrics).toBeDefined();
      expect(response.body.data.performanceMetrics).toBeDefined();
      expect(response.body.data.securityMetrics).toBeDefined();
      expect(response.body.data.lastUpdated).toBeDefined();
    });

    it('should return 400 for missing from parameter', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({ to: '2025-12-31T23:59:59.999Z' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('from');
    });

    it('should return 400 for missing to parameter', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({ from: '2025-01-01T00:00:00.000Z' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('to');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: 'invalid-date',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should have correct HR metrics structure', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const hrMetrics = response.body.data.hrMetrics;
      expect(hrMetrics).toHaveProperty('totalEmployees');
      expect(hrMetrics).toHaveProperty('dbsVerifications');
      expect(hrMetrics).toHaveProperty('rightToWorkChecks');
      expect(hrMetrics).toHaveProperty('dvlaChecks');
      expect(hrMetrics).toHaveProperty('complianceRate');
    });

    it('should have correct finance metrics structure', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const financeMetrics = response.body.data.financeMetrics;
      expect(financeMetrics).toHaveProperty('totalTransactions');
      expect(financeMetrics).toHaveProperty('totalRevenue');
      expect(financeMetrics).toHaveProperty('totalExpenses');
      expect(financeMetrics).toHaveProperty('netProfit');
      expect(financeMetrics).toHaveProperty('budgetVariance');
    });

    it('should have correct system metrics structure', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const systemMetrics = response.body.data.systemMetrics;
      expect(systemMetrics).toHaveProperty('totalUsers');
      expect(systemMetrics).toHaveProperty('activeUsers');
      expect(systemMetrics).toHaveProperty('totalCareHomes');
      expect(systemMetrics).toHaveProperty('totalResidents');
      expect(systemMetrics).toHaveProperty('systemUptime');
    });

    it('should have correct performance metrics structure', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const performanceMetrics = response.body.data.performanceMetrics;
      expect(performanceMetrics).toHaveProperty('averageResponseTime');
      expect(performanceMetrics).toHaveProperty('maxResponseTime');
      expect(performanceMetrics).toHaveProperty('minResponseTime');
      expect(performanceMetrics).toHaveProperty('totalRequests');
      expect(performanceMetrics).toHaveProperty('successRate');
    });

    it('should have correct security metrics structure', async () => {
      const response = await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const securityMetrics = response.body.data.securityMetrics;
      expect(securityMetrics).toHaveProperty('rbacSuccessRate');
      expect(securityMetrics).toHaveProperty('gdprComplianceRate');
      expect(securityMetrics).toHaveProperty('dataIsolationRate');
      expect(securityMetrics).toHaveProperty('auditLoggingRate');
      expect(securityMetrics).toHaveProperty('dataEncryptionRate');
      expect(securityMetrics).toHaveProperty('overallSecurityScore');
    });
  });

  describe('GET /api/system/health', () => {
    it('should get system health successfully', async () => {
      const response = await request(app)
        .get('/api/system/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System is healthy');
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('Route Error Handling', () => {
    it('should handle invalid HTTP methods', async () => {
      await request(app)
        .put('/api/system/status')
        .expect(404);

      await request(app)
        .delete('/api/system/metrics')
        .expect(404);

      await request(app)
        .patch('/api/system/health')
        .expect(404);
    });

    it('should handle malformed JSON in POST requests', async () => {
      await request(app)
        .post('/api/system/system-tests')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });
  });

  describe('Route Performance', () => {
    it('should respond to system tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .post('/api/system/system-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to E2E tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .post('/api/system/e2e-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to smoke tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .post('/api/system/smoke-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to regression tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .post('/api/system/regression-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to system status within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/system/status')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500); // 500ms
    });

    it('should respond to system metrics within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to system health within acceptable time', async () => {
      const startTime = Date.now();
      await request(app)
        .get('/api/system/health')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200); // 200ms
    });
  });
});