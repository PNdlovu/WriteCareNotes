import { EventEmitter2 } from "eventemitter2";

import request from 'supertest';
import { app } from '../app';

describe('Health Check Tests', () => {
  describe('Health Endpoints', () => {
    it('should return comprehensive health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('overall');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('system');
    });

    it('should return simple health status', async () => {
      const response = await request(app)
        .get('/health/simple')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
    });

    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('pid');
    });

    it('should return compliance status', async () => {
      const response = await request(app)
        .get('/health/compliance')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('compliance');
      expect(response.body).toHaveProperty('features');
    });

    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('Service Health Checks', () => {
    it('should check database health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const dbService = response.body.services.find((s: any) => s.service === 'database');
      expect(dbService).toBeDefined();
      expect(dbService).toHaveProperty('status');
      expect(dbService).toHaveProperty('responseTime');
    });

    it('should check Redis health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const redisService = response.body.services.find((s: any) => s.service === 'redis');
      expect(redisService).toBeDefined();
      expect(redisService).toHaveProperty('status');
      expect(redisService).toHaveProperty('responseTime');
    });

    it('should check filesystem health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      const fsService = response.body.services.find((s: any) => s.service === 'filesystem');
      expect(fsService).toBeDefined();
      expect(fsService).toHaveProperty('status');
      expect(fsService).toHaveProperty('responseTime');
    });
  });

  describe('System Metrics', () => {
    it('should include memory metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.system.memory).toHaveProperty('used');
      expect(response.body.system.memory).toHaveProperty('free');
      expect(response.body.system.memory).toHaveProperty('total');
      expect(response.body.system.memory).toHaveProperty('percentage');
    });

    it('should include CPU metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.system.cpu).toHaveProperty('load');
      expect(response.body.system.cpu).toHaveProperty('usage');
    });

    it('should include disk metrics', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.system.disk).toHaveProperty('used');
      expect(response.body.system.disk).toHaveProperty('free');
      expect(response.body.system.disk).toHaveProperty('total');
      expect(response.body.system.disk).toHaveProperty('percentage');
    });
  });
});