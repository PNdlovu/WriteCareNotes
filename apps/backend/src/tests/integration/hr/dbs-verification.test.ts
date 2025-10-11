import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import app from '../../../app';
import { DBSVerificationService } from '../../../services/hr/DBSVerificationService';
import { DBSVerification, DBSStatus, DBSVerificationType, DBSVerificationPriority } from '../../../entities/hr/DBSVerification';

// Mock the DBSVerificationService
jest.mock('../../../services/hr/DBSVerificationService');
const MockedDBSVerificationService = DBSVerificationService as jest.MockedClass<typeof DBSVerificationService>;

// Mock authentication middleware
jest.mock('../../../middleware/auth-middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      id: 'user-001',
      email: 'test@example.com',
      role: 'hr_manager'
    };
    next();
  }
}));

// Mock RBAC middleware
jest.mock('../../../middleware/enhanced-rbac-audit', () => ({
  authorizeHR: () => (req: any, res: any, next: any) => {
    next();
  }
}));

describe('DBS Verification API Integration Tests', () => {
  let mockService: jest.Mocked<DBSVerificationService>;

  beforeEach(() => {
    mockService = new MockedDBSVerificationService() as jest.Mocked<DBSVerificationService>;
    MockedDBSVerificationService.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/hr/dbs', () => {
    it('should create a new DBS verification', async () => {
      const requestData = {
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        verificationType: DBSVerificationType.ENHANCED,
        priority: DBSVerificationPriority.HIGH,
        careHomeId: 'care-home-001',
        department: 'nursing',
        costCenter: 'nursing-001',
        notes: 'New employee verification'
      };

      const mockVerification = {
        id: 'dbs-001',
        ...requestData,
        status: DBSStatus.NOT_STARTED,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockService.createDBSVerification.mockResolvedValue(mockVerification as any);

      const response = await request(app)
        .post('/api/hr/dbs')
        .send(requestData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('DBS verification request created successfully');
      expect(response.body.data).toEqual(mockVerification);
      expect(mockService.createDBSVerification).toHaveBeenCalledWith(
        requestData,
        'user-001'
      );
    });

    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        employeeId: 'emp-001',
        // Missing required fields
      };

      mockService.createDBSVerification.mockRejectedValue(new Error('Invalid verification type'));

      const response = await request(app)
        .post('/api/hr/dbs')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid verification type');
    });
  });

  describe('GET /api/hr/dbs/:verificationId', () => {
    it('should get DBS verification by ID', async () => {
      const mockVerification = {
        id: 'dbs-001',
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        status: DBSStatus.COMPLETED,
        verificationType: DBSVerificationType.ENHANCED,
        priority: DBSVerificationPriority.HIGH
      };

      mockService.getDBSVerificationById.mockResolvedValue(mockVerification as any);

      const response = await request(app)
        .get('/api/hr/dbs/dbs-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockVerification);
      expect(mockService.getDBSVerificationById).toHaveBeenCalledWith('dbs-001');
    });

    it('should return 404 if verification not found', async () => {
      mockService.getDBSVerificationById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/hr/dbs/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('DBS verification not found');
    });
  });

  describe('GET /api/hr/dbs/search', () => {
    it('should search DBS verifications with query parameters', async () => {
      const mockVerifications = [
        {
          id: 'dbs-001',
          employeeId: 'emp-001',
          employeeName: 'John Smith',
          status: DBSStatus.COMPLETED
        },
        {
          id: 'dbs-002',
          employeeId: 'emp-002',
          employeeName: 'Jane Doe',
          status: DBSStatus.COMPLETED
        }
      ];

      mockService.searchDBSVerifications.mockResolvedValue(mockVerifications as any);

      const response = await request(app)
        .get('/api/hr/dbs/search')
        .query({
          status: DBSStatus.COMPLETED,
          careHomeId: 'care-home-001'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockVerifications);
      expect(response.body.count).toBe(2);
      expect(mockService.searchDBSVerifications).toHaveBeenCalledWith({
        status: DBSStatus.COMPLETED,
        careHomeId: 'care-home-001'
      });
    });
  });

  describe('PUT /api/hr/dbs/:verificationId', () => {
    it('should update DBS verification', async () => {
      const updateData = {
        notes: 'Updated verification notes',
        priority: DBSVerificationPriority.MEDIUM
      };

      const mockUpdatedVerification = {
        id: 'dbs-001',
        employeeId: 'emp-001',
        employeeName: 'John Smith',
        status: DBSStatus.IN_PROGRESS,
        notes: 'Updated verification notes',
        priority: DBSVerificationPriority.MEDIUM
      };

      mockService.updateDBSVerification.mockResolvedValue(mockUpdatedVerification as any);

      const response = await request(app)
        .put('/api/hr/dbs/dbs-001')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('DBS verification updated successfully');
      expect(response.body.data).toEqual(mockUpdatedVerification);
      expect(mockService.updateDBSVerification).toHaveBeenCalledWith(
        'dbs-001',
        updateData,
        'user-001'
      );
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdateData = {
        status: 'invalid-status'
      };

      mockService.updateDBSVerification.mockRejectedValue(new Error('Invalid status'));

      const response = await request(app)
        .put('/api/hr/dbs/dbs-001')
        .send(invalidUpdateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid status');
    });
  });

  describe('POST /api/hr/dbs/:verificationId/start-application', () => {
    it('should start DBS application', async () => {
      const requestData = {
        applicationReference: 'DBS-APP-001'
      };

      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.APPLICATION_SUBMITTED,
        applicationReference: 'DBS-APP-001'
      };

      mockService.startDBSApplication.mockResolvedValue(mockVerification as any);

      const response = await request(app)
        .post('/api/hr/dbs/dbs-001/start-application')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('DBS application started successfully');
      expect(response.body.data).toEqual(mockVerification);
      expect(mockService.startDBSApplication).toHaveBeenCalledWith(
        'dbs-001',
        'DBS-APP-001',
        'user-001'
      );
    });
  });

  describe('POST /api/hr/dbs/:verificationId/complete', () => {
    it('should complete DBS verification', async () => {
      const requestData = {
        certificateNumber: 'CERT-001',
        isCleared: true,
        notes: 'Verification completed successfully'
      };

      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.COMPLETED,
        certificateNumber: 'CERT-001',
        isCleared: true
      };

      mockService.completeDBSVerification.mockResolvedValue(mockVerification as any);

      const response = await request(app)
        .post('/api/hr/dbs/dbs-001/complete')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('DBS verification completed successfully');
      expect(response.body.data).toEqual(mockVerification);
      expect(mockService.completeDBSVerification).toHaveBeenCalledWith(
        'dbs-001',
        'CERT-001',
        true,
        'user-001',
        'Verification completed successfully'
      );
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        // Missing certificateNumber and isCleared
        notes: 'Some notes'
      };

      const response = await request(app)
        .post('/api/hr/dbs/dbs-001/complete')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Certificate number and clearance status are required');
    });
  });

  describe('POST /api/hr/dbs/:verificationId/reject', () => {
    it('should reject DBS verification', async () => {
      const requestData = {
        reason: 'Incomplete documentation'
      };

      const mockVerification = {
        id: 'dbs-001',
        status: DBSStatus.REJECTED,
        rejectionReason: 'Incomplete documentation'
      };

      mockService.rejectDBSVerification.mockResolvedValue(mockVerification as any);

      const response = await request(app)
        .post('/api/hr/dbs/dbs-001/reject')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('DBS verification rejected successfully');
      expect(response.body.data).toEqual(mockVerification);
      expect(mockService.rejectDBSVerification).toHaveBeenCalledWith(
        'dbs-001',
        'Incomplete documentation',
        'user-001'
      );
    });

    it('should return 400 for missing rejection reason', async () => {
      const response = await request(app)
        .post('/api/hr/dbs/dbs-001/reject')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Rejection reason is required');
    });
  });

  describe('GET /api/hr/dbs/reports/compliance', () => {
    it('should get DBS compliance report', async () => {
      const mockReport = {
        totalVerifications: 10,
        compliantVerifications: 8,
        nonCompliantVerifications: 2,
        complianceRate: 80.0,
        expiringVerifications: 1,
        expiredVerifications: 0
      };

      mockService.getDBSComplianceReport.mockResolvedValue(mockReport as any);

      const response = await request(app)
        .get('/api/hr/dbs/reports/compliance')
        .query({ careHomeId: 'care-home-001' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockReport);
      expect(mockService.getDBSComplianceReport).toHaveBeenCalledWith('care-home-001');
    });
  });

  describe('DELETE /api/hr/dbs/:verificationId', () => {
    it('should delete DBS verification', async () => {
      mockService.deleteDBSVerification.mockResolvedValue();

      const response = await request(app)
        .delete('/api/hr/dbs/dbs-001')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('DBS verification deleted successfully');
      expect(mockService.deleteDBSVerification).toHaveBeenCalledWith('dbs-001', 'user-001');
    });

    it('should return 400 if verification cannot be deleted', async () => {
      mockService.deleteDBSVerification.mockRejectedValue(new Error('Cannot delete a completed DBS verification'));

      const response = await request(app)
        .delete('/api/hr/dbs/dbs-001')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot delete a completed DBS verification');
    });
  });
});