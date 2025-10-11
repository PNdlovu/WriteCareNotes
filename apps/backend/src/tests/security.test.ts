import { EventEmitter2 } from "eventemitter2";

import request from 'supertest';
import { app } from '../app';

describe('Security Tests', () => {
  describe('CSRF Protection', () => {
    it('should require CSRF token for POST requests', async () => {
      const response = await request(app)
        .post('/api/medication')
        .send({ name: 'Test Medication' })
        .expect(403);

      expect(response.body.error.code).toBe('SECURITY_CSRF_TOKEN_MISSING');
    });

    it('should accept valid CSRF token', async () => {
      // First, get CSRF token
      const tokenResponse = await request(app)
        .get('/api/medication')
        .expect(200);

      const csrfToken = tokenResponse.headers['x-csrf-token'];
      expect(csrfToken).toBeDefined();

      // Then use it in POST request
      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', csrfToken)
        .send({ name: 'Test Medication' })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit authentication endpoints', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password' })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should allow normal request rates', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.overall).toBeDefined();
    });
  });

  describe('Input Sanitization', () => {
    it('should sanitize XSS attempts in request body', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', 'test-token')
        .send({ 
          name: maliciousInput,
          description: 'Test medication'
        })
        .expect(201);

      expect(response.body.data.name).not.toContain('<script>');
      expect(response.body.data.name).not.toContain('alert');
    });

    it('should sanitize SQL injection attempts', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', 'test-token')
        .send({ 
          name: sqlInjection,
          description: 'Test medication'
        })
        .expect(201);

      expect(response.body.data.name).not.toContain('DROP TABLE');
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
    });

    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/api/medication')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/medication')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should validate JWT tokens', async () => {
      const response = await request(app)
        .get('/api/medication')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error.code).toBe('AUTH_TOKEN_INVALID');
    });
  });
});
