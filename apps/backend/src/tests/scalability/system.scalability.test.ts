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
import { SystemService } from '../../services/system/SystemService';
import { SystemController } from '../../controllers/system/SystemController';
import request from 'supertest';

/**
 * @fileoverview System Scalability Tests
 * @module SystemScalabilityTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Scalability test suite for system testing, monitoring, and health checks
 * including unit tests, integration tests, E2E tests, and performance tests.
 */

describe('System Scalability Tests', () => {
  let app: INestApplication;
  let systemService: SystemService;
  let systemController: SystemController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

    systemService = moduleFixture.get<SystemService>(SystemService);
    systemController = moduleFixture.get<SystemController>(SystemController);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('System Load Scalability', () => {
    it('should scale with increasing system test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runSystemTests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale with increasing E2E test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runE2ETests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale with increasing smoke test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runSmokeTests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale with increasing regression test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runRegressionTests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Performance should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });
  });

  describe('System Memory Scalability', () => {
    it('should scale memory usage with increasing system test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runSystemTests()
        );
        await Promise.all(promises);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        results.push({ size, memoryIncrease });
      }

      // Memory increase should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Memory scale factor should be less than or equal to load factor
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale memory usage with increasing E2E test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runE2ETests()
        );
        await Promise.all(promises);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        results.push({ size, memoryIncrease });
      }

      // Memory increase should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Memory scale factor should be less than or equal to load factor
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale memory usage with increasing smoke test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runSmokeTests()
        );
        await Promise.all(promises);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        results.push({ size, memoryIncrease });
      }

      // Memory increase should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Memory scale factor should be less than or equal to load factor
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale memory usage with increasing regression test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runRegressionTests()
        );
        await Promise.all(promises);
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        results.push({ size, memoryIncrease });
      }

      // Memory increase should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Memory scale factor should be less than or equal to load factor
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });
  });

  describe('System CPU Scalability', () => {
    it('should scale CPU usage with increasing system test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runSystemTests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, cpuPercentage });
      }

      // CPU usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        const loadFactor = currentResult.size / previousResult.size;
        
        // CPU scale factor should be less than or equal to load factor
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale CPU usage with increasing E2E test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runE2ETests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, cpuPercentage });
      }

      // CPU usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        const loadFactor = currentResult.size / previousResult.size;
        
        // CPU scale factor should be less than or equal to load factor
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale CPU usage with increasing smoke test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runSmokeTests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, cpuPercentage });
      }

      // CPU usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        const loadFactor = currentResult.size / previousResult.size;
        
        // CPU scale factor should be less than or equal to load factor
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale CPU usage with increasing regression test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runRegressionTests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, cpuPercentage });
      }

      // CPU usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        const loadFactor = currentResult.size / previousResult.size;
        
        // CPU scale factor should be less than or equal to load factor
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });
  });

  describe('System Database Scalability', () => {
    it('should scale database operations with increasing system test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runSystemTests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Database operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale database operations with increasing E2E test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runE2ETests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Database operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale database operations with increasing smoke test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runSmokeTests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Database operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale database operations with increasing regression test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          systemService.runRegressionTests()
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Database operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });
  });

  describe('System Network Scalability', () => {
    it('should scale network operations with increasing system test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          request(app.getHttpServer())
            .post('/api/system/system-tests')
            .expect(200)
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Network operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale network operations with increasing E2E test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          request(app.getHttpServer())
            .post('/api/system/e2e-tests')
            .expect(200)
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Network operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale network operations with increasing smoke test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          request(app.getHttpServer())
            .post('/api/system/smoke-tests')
            .expect(200)
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Network operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale network operations with increasing regression test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const promises = Array(size).fill(null).map(() => 
          request(app.getHttpServer())
            .post('/api/system/regression-tests')
            .expect(200)
        );
        await Promise.all(promises);
        const duration = Date.now() - startTime;
        results.push({ size, duration });
      }

      // Network operations should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const scaleFactor = currentResult.duration / previousResult.duration;
        const loadFactor = currentResult.size / previousResult.size;
        
        // Scale factor should be less than or equal to load factor
        expect(scaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });
  });

  describe('System Resource Scalability', () => {
    it('should scale resource usage with increasing system test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runSystemTests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const memoryIncrease = endMemory - startMemory;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, duration, memoryIncrease, cpuPercentage });
      }

      // Resource usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const loadFactor = currentResult.size / previousResult.size;
        
        // Duration scale factor should be less than or equal to load factor
        const durationScaleFactor = currentResult.duration / previousResult.duration;
        expect(durationScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // Memory scale factor should be less than or equal to load factor
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // CPU scale factor should be less than or equal to load factor
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale resource usage with increasing E2E test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runE2ETests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const memoryIncrease = endMemory - startMemory;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, duration, memoryIncrease, cpuPercentage });
      }

      // Resource usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const loadFactor = currentResult.size / previousResult.size;
        
        // Duration scale factor should be less than or equal to load factor
        const durationScaleFactor = currentResult.duration / previousResult.duration;
        expect(durationScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // Memory scale factor should be less than or equal to load factor
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // CPU scale factor should be less than or equal to load factor
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale resource usage with increasing smoke test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runSmokeTests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const memoryIncrease = endMemory - startMemory;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, duration, memoryIncrease, cpuPercentage });
      }

      // Resource usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const loadFactor = currentResult.size / previousResult.size;
        
        // Duration scale factor should be less than or equal to load factor
        const durationScaleFactor = currentResult.duration / previousResult.duration;
        expect(durationScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // Memory scale factor should be less than or equal to load factor
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // CPU scale factor should be less than or equal to load factor
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });

    it('should scale resource usage with increasing regression test load', async () => {
      const testSizes = [1, 5, 10, 20];
      const results = [];

      for (const size of testSizes) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage().heapUsed;
        const startCpu = process.cpuUsage();
        
        const promises = Array(size).fill(null).map(() => 
          systemService.runRegressionTests()
        );
        await Promise.all(promises);
        
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed;
        const endCpu = process.cpuUsage(startCpu);
        const duration = endTime - startTime;
        const memoryIncrease = endMemory - startMemory;
        const cpuTime = endCpu.user + endCpu.system;
        const cpuPercentage = (cpuTime / (duration * 1000)) * 100;
        
        results.push({ size, duration, memoryIncrease, cpuPercentage });
      }

      // Resource usage should scale reasonably (not exponentially)
      for (let i = 1; i < results.length; i++) {
        const previousResult = results[i - 1];
        const currentResult = results[i];
        const loadFactor = currentResult.size / previousResult.size;
        
        // Duration scale factor should be less than or equal to load factor
        const durationScaleFactor = currentResult.duration / previousResult.duration;
        expect(durationScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // Memory scale factor should be less than or equal to load factor
        const memoryScaleFactor = currentResult.memoryIncrease / previousResult.memoryIncrease;
        expect(memoryScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
        
        // CPU scale factor should be less than or equal to load factor
        const cpuScaleFactor = currentResult.cpuPercentage / previousResult.cpuPercentage;
        expect(cpuScaleFactor).toBeLessThanOrEqual(loadFactor * 1.5);
      }
    });
  });
});
