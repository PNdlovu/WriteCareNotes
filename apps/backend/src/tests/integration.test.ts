import { EventEmitter2 } from "eventemitter2";

import request from 'supertest';
import { app } from '../app';

describe('Integration Tests', () => {
  describe('API Endpoints Integration', () => {
    it('should handle complete medication workflow', async () => {
      // 1. Get CSRF token
      const tokenResponse = await request(app)
        .get('/api/medication')
        .expect(200);

      const csrfToken = tokenResponse.headers['x-csrf-token'];

      // 2. Create medication
      const createResponse = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Test Medication',
          dosage: '100mg',
          frequency: 'Once daily',
          route: 'oral',
          startDate: '2024-01-01T00:00:00.000Z'
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const medicationId = createResponse.body.data.id;

      // 3. Get medication
      const getResponse = await request(app)
        .get(`/api/medication/${medicationId}`)
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.name).toBe('Test Medication');

      // 4. Update medication
      const updateResponse = await request(app)
        .put(`/api/medication/${medicationId}`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          name: 'Updated Medication',
          dosage: '200mg',
          frequency: 'Twice daily',
          route: 'oral',
          startDate: '2024-01-01T00:00:00.000Z'
        })
        .expect(200);

      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.name).toBe('Updated Medication');

      // 5. Delete medication
      const deleteResponse = await request(app)
        .delete(`/api/medication/${medicationId}`)
        .set('X-CSRF-Token', csrfToken)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
    });

    it('should handle healthcare integration workflow', async () => {
      // Get CSRF token
      const tokenResponse = await request(app)
        .get('/api/healthcare/monitoring')
        .expect(200);

      const csrfToken = tokenResponse.headers['x-csrf-token'];

      // Sync NHS prescription
      const syncResponse = await request(app)
        .post('/api/healthcare/nhs/prescriptions/sync')
        .set('X-CSRF-Token', csrfToken)
        .send({
          patientId: '123e4567-e89b-12d3-a456-426614174000',
          medicationId: '123e4567-e89b-12d3-a456-426614174001',
          dosage: '500mg',
          frequency: 'Twice daily',
          startDate: '2024-01-01T00:00:00.000Z'
        })
        .expect(201);

      expect(syncResponse.body.success).toBe(true);
      expect(syncResponse.body.data.status).toBe('synced');

      // GP reconciliation
      const reconResponse = await request(app)
        .post('/api/healthcare/gp/medications/reconcile')
        .set('X-CSRF-Token', csrfToken)
        .send({
          patientId: '123e4567-e89b-12d3-a456-426614174000',
          currentMedications: [
            {
              name: 'Paracetamol',
              dosage: '500mg',
              frequency: 'Twice daily'
            }
          ],
          reconciliationDate: '2024-01-01T00:00:00.000Z'
        })
        .expect(201);

      expect(reconResponse.body.success).toBe(true);
      expect(reconResponse.body.data.status).toBe('reconciled');
    });

    it('should handle consent management workflow', async () => {
      // Get CSRF token
      const tokenResponse = await request(app)
        .get('/api/consent/dashboard')
        .expect(200);

      const csrfToken = tokenResponse.headers['x-csrf-token'];

      // Create consent
      const createResponse = await request(app)
        .post('/api/consent')
        .set('X-CSRF-Token', csrfToken)
        .send({
          residentId: '123e4567-e89b-12d3-a456-426614174000',
          consentType: 'medical_treatment',
          granted: true,
          grantedBy: '123e4567-e89b-12d3-a456-426614174001',
          grantedDate: '2024-01-01T00:00:00.000Z'
        })
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const consentId = createResponse.body.data.id;

      // Get consent for resident
      const getResponse = await request(app)
        .get('/api/consent/resident/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.consents).toBeDefined();

      // Withdraw consent
      const withdrawResponse = await request(app)
        .put(`/api/consent/${consentId}/withdraw`)
        .set('X-CSRF-Token', csrfToken)
        .send({
          reason: 'Patient request',
          withdrawnBy: '123e4567-e89b-12d3-a456-426614174001'
        })
        .expect(200);

      expect(withdrawResponse.body.success).toBe(true);
      expect(withdrawResponse.body.data.status).toBe('withdrawn');
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle validation errors consistently', async () => {
      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', 'test-token')
        .send({ invalid: 'data' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('timestamp');
      expect(response.body.error).toHaveProperty('correlationId');
    });

    it('should handle authentication errors consistently', async () => {
      const response = await request(app)
        .get('/api/medication')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('should handle not found errors consistently', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('GENERIC_NOT_FOUND');
    });
  });

  describe('Security Integration', () => {
    it('should maintain security across all endpoints', async () => {
      const endpoints = [
        '/health',
        '/api/medication',
        '/api/healthcare/monitoring',
        '/api/consent/dashboard'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint)
          .expect(200);

        // Check security headers
        expect(response.headers['x-frame-options']).toBe('DENY');
        expect(response.headers['x-content-type-options']).toBe('nosniff');
        expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      }
    });

    it('should include correlation IDs in all responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-correlation-id']).toBeDefined();
    });
  });
});
