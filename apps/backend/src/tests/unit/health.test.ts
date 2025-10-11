import request from 'supertest';
import { app } from '../../app';

describe('Health Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
      expect(response.body.timestamp).toBeValidDate();
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ready');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.timestamp).toBeValidDate();
    });
  });

  describe('GET /metrics', () => {
    it('should return metrics endpoint', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'metrics endpoint');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.timestamp).toBeValidDate();
    });
  });
});
