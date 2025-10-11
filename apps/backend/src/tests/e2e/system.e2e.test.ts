import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemModule } from '../../modules/system/SystemModule';
import { DBSVerification } from '../../entities/hr/DBSVerification';
import { RightToWorkCheck } from '../../entities/hr/RightToWorkCheck';
import { DVLACheck } from '../../entities/hr/DVLACheck';
import { CashTransaction } from '../../entities/financial/CashTransaction';
import { Budget } from '../../entities/financial/Budget';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { Employee } from '../../entities/hr/Employee';
import * as request from 'supertest';

/**
 * @fileoverview System E2E Tests
 * @module SystemE2ETests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description End-to-end test suite for system testing, monitoring, and health checks
 * including unit tests, integration tests, E2E tests, and performance tests.
 */

describe('System E2E Tests', () => {
  letapp: INestApplication;

  beforeAll(async () => {
    constmoduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            DBSVerification,
            RightToWorkCheck,
            DVLACheck,
            CashTransaction,
            Budget,
            LedgerAccount,
            Employee
          ],
          synchronize: true
        }),
        SystemModule
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('System Tests API', () => {
    it('should run system tests successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/system/system-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System tests completed successfully');
      expect(response.body.data.testSuite).toBe('WriteCareNotes System Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.overallStatus).toBe('passed');
    });

    it('should run E2E tests successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/system/e2e-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('E2E tests completed successfully');
      expect(response.body.data.testSuite).toBe('WriteCareNotes E2E Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.overallStatus).toBe('passed');
    });

    it('should run smoke tests successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/system/smoke-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Smoke tests completed successfully');
      expect(response.body.data.testSuite).toBe('WriteCareNotes Smoke Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.overallStatus).toBe('passed');
    });

    it('should run regression tests successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/system/regression-tests')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Regression tests completed successfully');
      expect(response.body.data.testSuite).toBe('WriteCareNotes Regression Tests');
      expect(response.body.data.version).toBe('1.0.0');
      expect(response.body.data.overallStatus).toBe('passed');
    });
  });

  describe('System Status API', () => {
    it('should get system status successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/status')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System status retrieved successfully');
      expect(response.body.data.overallStatus).toBe('healthy');
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.performance).toBeDefined();
      expect(response.body.data.lastUpdated).toBeDefined();
    });

    it('should have correct service status structure', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/status')
        .expect(200);

      const services = response.body.data.services;
      expect(services).toHaveLength(4);
      
      services.forEach((service: any) => {
        expect(service).toHaveProperty('name');
        expect(service).toHaveProperty('status');
        expect(service).toHaveProperty('responseTime');
        expect(service).toHaveProperty('uptime');
        expect(service).toHaveProperty('lastCheck');
      });
    });

    it('should have correct performance metrics structure', async () => {
      const response = await request(app.getHttpServer())
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

  describe('System Metrics API', () => {
    it('should get system metrics successfully with valid query parameters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System metrics retrieved successfully');
      expect(response.body.data.timeRange).toBeDefined();
      expect(response.body.data.hrMetrics).toBeDefined();
      expect(response.body.data.financeMetrics).toBeDefined();
      expect(response.body.data.systemMetrics).toBeDefined();
      expect(response.body.data.performanceMetrics).toBeDefined();
      expect(response.body.data.securityMetrics).toBeDefined();
    });

    it('should return 400 for missing from parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({ to: '2025-12-31T23:59:59.999Z' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('from');
    });

    it('should return 400 for missing to parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({ from: '2025-01-01T00:00:00.000Z' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('to');
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: 'invalid-date',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should have correct HR metrics structure', async () => {
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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
      const response = await request(app.getHttpServer())
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

  describe('System Health API', () => {
    it('should get system health successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('System is healthy');
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('System Performance E2E', () => {
    it('should respond to system tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .post('/api/system/system-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to E2E tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .post('/api/system/e2e-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to smoke tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .post('/api/system/smoke-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to regression tests within acceptable time', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .post('/api/system/regression-tests')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should respond to system status within acceptable time', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
        .get('/api/system/status')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500); // 500ms
    });

    it('should respond to system metrics within acceptable time', async () => {
      const startTime = Date.now();
      await request(app.getHttpServer())
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
      await request(app.getHttpServer())
        .get('/api/system/health')
        .expect(200);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(200); // 200ms
    });
  });

  describe('System Error Handling E2E', () => {
    it('should handle invalid HTTP methods', async () => {
      await request(app.getHttpServer())
        .put('/api/system/status')
        .expect(404);

      await request(app.getHttpServer())
        .delete('/api/system/metrics')
        .expect(404);

      await request(app.getHttpServer())
        .patch('/api/system/health')
        .expect(404);
    });

    it('should handle malformed JSON in POST requests', async () => {
      await request(app.getHttpServer())
        .post('/api/system/system-tests')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle missing query parameters gracefully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('from');
    });
  });

  describe('System Data Validation E2E', () => {
    it('should validate HR metrics data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const hrMetrics = response.body.data.hrMetrics;
      expect(hrMetrics.totalEmployees).toBe(100);
      expect(hrMetrics.dbsVerifications).toBe(100);
      expect(hrMetrics.rightToWorkChecks).toBe(100);
      expect(hrMetrics.dvlaChecks).toBe(50);
      expect(hrMetrics.complianceRate).toBe(95.0);
    });

    it('should validate finance metrics data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const financeMetrics = response.body.data.financeMetrics;
      expect(financeMetrics.totalTransactions).toBe(5000);
      expect(financeMetrics.totalRevenue).toBe(1000000.00);
      expect(financeMetrics.totalExpenses).toBe(800000.00);
      expect(financeMetrics.netProfit).toBe(200000.00);
      expect(financeMetrics.budgetVariance).toBe(5.0);
    });

    it('should validate system metrics data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const systemMetrics = response.body.data.systemMetrics;
      expect(systemMetrics.totalUsers).toBe(50);
      expect(systemMetrics.activeUsers).toBe(45);
      expect(systemMetrics.totalCareHomes).toBe(10);
      expect(systemMetrics.totalResidents).toBe(500);
      expect(systemMetrics.systemUptime).toBe(99.9);
    });

    it('should validate performance metrics data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const performanceMetrics = response.body.data.performanceMetrics;
      expect(performanceMetrics.averageResponseTime).toBe(120);
      expect(performanceMetrics.maxResponseTime).toBe(300);
      expect(performanceMetrics.minResponseTime).toBe(50);
      expect(performanceMetrics.totalRequests).toBe(100000);
      expect(performanceMetrics.successRate).toBe(99.5);
    });

    it('should validate security metrics data', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/system/metrics')
        .query({
          from: '2025-01-01T00:00:00.000Z',
          to: '2025-12-31T23:59:59.999Z'
        })
        .expect(200);

      const securityMetrics = response.body.data.securityMetrics;
      expect(securityMetrics.rbacSuccessRate).toBe(95.0);
      expect(securityMetrics.gdprComplianceRate).toBe(98.5);
      expect(securityMetrics.dataIsolationRate).toBe(97.5);
      expect(securityMetrics.auditLoggingRate).toBe(98.7);
      expect(securityMetrics.dataEncryptionRate).toBe(95.0);
      expect(securityMetrics.overallSecurityScore).toBe(97.0);
    });
  });
});
