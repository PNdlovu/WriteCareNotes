import { EventEmitter2 } from "eventemitter2";

import request from 'supertest';
import { app } from '../app';

describe('Validation Tests', () => {
  describe('Medication Validation', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', 'test-token')
        .send({})
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_INVALID_FORMAT');
      expect(response.body.error.details).toBeDefined();
    });

    it('should validate medication schema', async () => {
      const validMedication = {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        route: 'oral',
        startDate: '2024-01-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', 'test-token')
        .send(validMedication)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Paracetamol');
    });

    it('should reject invalid medication route', async () => {
      const invalidMedication = {
        name: 'Paracetamol',
        dosage: '500mg',
        frequency: 'Twice daily',
        route: 'invalid-route',
        startDate: '2024-01-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/medication')
        .set('X-CSRF-Token', 'test-token')
        .send(invalidMedication)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_INVALID_FORMAT');
    });
  });

  describe('Healthcare Validation', () => {
    it('should validate NHS prescription schema', async () => {
      const validPrescription = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        medicationId: '123e4567-e89b-12d3-a456-426614174001',
        dosage: '500mg',
        frequency: 'Twice daily',
        startDate: '2024-01-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/healthcare/nhs/prescriptions/sync')
        .set('X-CSRF-Token', 'test-token')
        .send(validPrescription)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should validate GP reconciliation schema', async () => {
      const validReconciliation = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        currentMedications: [
          {
            name: 'Paracetamol',
            dosage: '500mg',
            frequency: 'Twice daily'
          }
        ],
        reconciliationDate: '2024-01-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/healthcare/gp/medications/reconcile')
        .set('X-CSRF-Token', 'test-token')
        .send(validReconciliation)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Consent Validation', () => {
    it('should validate consent schema', async () => {
      const validConsent = {
        residentId: '123e4567-e89b-12d3-a456-426614174000',
        consentType: 'medical_treatment',
        granted: true,
        grantedBy: '123e4567-e89b-12d3-a456-426614174001',
        grantedDate: '2024-01-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/consent')
        .set('X-CSRF-Token', 'test-token')
        .send(validConsent)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid consent type', async () => {
      const invalidConsent = {
        residentId: '123e4567-e89b-12d3-a456-426614174000',
        consentType: 'invalid_type',
        granted: true,
        grantedBy: '123e4567-e89b-12d3-a456-426614174001',
        grantedDate: '2024-01-01T00:00:00.000Z'
      };

      const response = await request(app)
        .post('/api/consent')
        .set('X-CSRF-Token', 'test-token')
        .send(invalidConsent)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_INVALID_FORMAT');
    });
  });

  describe('UUID Validation', () => {
    it('should validate UUID parameters', async () => {
      const response = await request(app)
        .get('/api/medication/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject invalid UUID parameters', async () => {
      const response = await request(app)
        .get('/api/medication/invalid-uuid')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_INVALID_FORMAT');
    });
  });

  describe('Pagination Validation', () => {
    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/medication?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should use default pagination values', async () => {
      const response = await request(app)
        .get('/api/medication')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });

    it('should reject invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/api/medication?page=-1&limit=1000')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_INVALID_FORMAT');
    });
  });
});