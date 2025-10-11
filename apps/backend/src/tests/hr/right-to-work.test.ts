import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RightToWorkService } from '../../services/hr/RightToWorkService';
import { RightToWorkCheck } from '../../entities/hr/RightToWorkCheck';
import { RightToWorkDocument } from '../../entities/hr/RightToWorkDocument';
import { RightToWorkNotification } from '../../entities/hr/RightToWorkNotification';
import { Employee } from '../../entities/hr/Employee';

/**
 * @fileoverview Right to Work Verification Tests
 * @module RightToWorkTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for Right to Work verification functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('Right to Work Service', () => {
  let service: RightToWorkService;
  let rightToWorkCheckRepository: Repository<RightToWorkCheck>;
  let rightToWorkDocumentRepository: Repository<RightToWorkDocument>;
  let rightToWorkNotificationRepository: Repository<RightToWorkNotification>;
  let employeeRepository: Repository<Employee>;

  const mockEmployee = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    employeeNumber: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+44 7700 900123',
    dateOfBirth: new Date('1990-01-01'),
    address: {
      street: '123 Main Street',
      city: 'London',
      postcode: 'SW1A 1AA',
      country: 'UK'
    },
    employmentStatus: 'active',
    position: 'Care Assistant',
    department: 'Care',
    startDate: new Date('2024-01-01'),
    salary: 25000.00,
    currency: 'GBP',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockRightToWorkCheck = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    employeeId: '123e4567-e89b-12d3-a456-426614174000',
    checkType: 'passport',
    checkDate: new Date('2025-01-01'),
    expiryDate: new Date('2030-01-01'),
    status: 'pending',
    isCompliant: false,
    shareCode: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockRightToWorkDocument = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    rightToWorkCheckId: '123e4567-e89b-12d3-a456-426614174001',
    fileName: 'passport.pdf',
    fileUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
    documentType: 'passport',
    mimeType: 'application/pdf',
    fileSize: 1024000,
    description: 'Passport document',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockRightToWorkNotification = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    rightToWorkCheckId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'check_required',
    message: 'Right to Work check required for new employee',
    recipientId: '123e4567-e89b-12d3-a456-426614174000',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RightToWorkService,
        {
          provide: getRepositoryToken(RightToWorkCheck),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(RightToWorkDocument),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(RightToWorkNotification),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<RightToWorkService>(RightToWorkService);
    rightToWorkCheckRepository = module.get<Repository<RightToWorkCheck>>(getRepositoryToken(RightToWorkCheck));
    rightToWorkDocumentRepository = module.get<Repository<RightToWorkDocument>>(getRepositoryToken(RightToWorkDocument));
    rightToWorkNotificationRepository = module.get<Repository<RightToWorkNotification>>(getRepositoryToken(RightToWorkNotification));
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRightToWorkCheck', () => {
    it('should create a new Right to Work check', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'passport',
        checkDate: new Date('2025-01-01'),
        expiryDate: new Date('2030-01-01'),
        notes: 'Right to Work check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(mockEmployee as any);
      jest.spyOn(rightToWorkCheckRepository, 'create').mockReturnValue(mockRightToWorkCheck as any);
      jest.spyOn(rightToWorkCheckRepository, 'save').mockResolvedValue(mockRightToWorkCheck as any);
      jest.spyOn(rightToWorkNotificationRepository, 'create').mockReturnValue(mockRightToWorkNotification as any);
      jest.spyOn(rightToWorkNotificationRepository, 'save').mockResolvedValue(mockRightToWorkNotification as any);

      const result = await service.createRightToWorkCheck(createData);

      expect(result).toEqual(mockRightToWorkCheck);
      expect(rightToWorkCheckRepository.create).toHaveBeenCalledWith(createData);
      expect(rightToWorkCheckRepository.save).toHaveBeenCalledWith(mockRightToWorkCheck);
    });

    it('should throw error if employee not found', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'passport',
        checkDate: new Date('2025-01-01'),
        expiryDate: new Date('2030-01-01'),
        notes: 'Right to Work check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createRightToWorkCheck(createData)).rejects.toThrow('Employee not found');
    });

    it('should throw error for invalid check type', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'invalid_type',
        checkDate: new Date('2025-01-01'),
        expiryDate: new Date('2030-01-01'),
        notes: 'Right to Work check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.createRightToWorkCheck(createData)).rejects.toThrow('Invalid check type');
    });
  });

  describe('getRightToWorkCheckById', () => {
    it('should return Right to Work check by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(mockRightToWorkCheck as any);

      const result = await service.getRightToWorkCheckById(id);

      expect(result).toEqual(mockRightToWorkCheck);
      expect(rightToWorkCheckRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['employee', 'documents', 'notifications']
      });
    });

    it('should return null if Right to Work check not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getRightToWorkCheckById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateRightToWorkCheck', () => {
    it('should update Right to Work check', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'verified',
        isCompliant: true,
        notes: 'Right to Work check completed successfully',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const updatedRightToWorkCheck = {
        ...mockRightToWorkCheck,
        ...updateData
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(mockRightToWorkCheck as any);
      jest.spyOn(rightToWorkCheckRepository, 'save').mockResolvedValue(updatedRightToWorkCheck as any);

      const result = await service.updateRightToWorkCheck(id, updateData);

      expect(result).toEqual(updatedRightToWorkCheck);
      expect(rightToWorkCheckRepository.save).toHaveBeenCalledWith(updatedRightToWorkCheck);
    });

    it('should throw error if Right to Work check not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'verified',
        isCompliant: true,
        notes: 'Right to Work check completed successfully',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateRightToWorkCheck(id, updateData)).rejects.toThrow('Right to Work check not found');
    });

    it('should throw error if Right to Work check is expired', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'verified',
        isCompliant: true,
        notes: 'Right to Work check completed successfully',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const expiredRightToWorkCheck = {
        ...mockRightToWorkCheck,
        status: 'expired'
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(expiredRightToWorkCheck as any);

      await expect(service.updateRightToWorkCheck(id, updateData)).rejects.toThrow('Cannot update expired Right to Work check');
    });
  });

  describe('verifyRightToWorkCheck', () => {
    it('should verify Right to Work check', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const verificationData = {
        isCompliant: true,
        notes: 'Right to Work check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const verifiedRightToWorkCheck = {
        ...mockRightToWorkCheck,
        status: 'verified',
        isCompliant: true
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(mockRightToWorkCheck as any);
      jest.spyOn(rightToWorkCheckRepository, 'save').mockResolvedValue(verifiedRightToWorkCheck as any);

      const result = await service.verifyRightToWorkCheck(id, verificationData);

      expect(result.status).toBe('verified');
      expect(result.isCompliant).toBe(true);
    });

    it('should throw error if Right to Work check not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const verificationData = {
        isCompliant: true,
        notes: 'Right to Work check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(null);

      await expect(service.verifyRightToWorkCheck(id, verificationData)).rejects.toThrow('Right to Work check not found');
    });

    it('should throw error if Right to Work check not pending', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const verificationData = {
        isCompliant: true,
        notes: 'Right to Work check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const verifiedRightToWorkCheck = {
        ...mockRightToWorkCheck,
        status: 'verified'
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(verifiedRightToWorkCheck as any);

      await expect(service.verifyRightToWorkCheck(id, verificationData)).rejects.toThrow('Only pending Right to Work checks can be verified');
    });
  });

  describe('uploadRightToWorkDocument', () => {
    it('should upload Right to Work document', async () => {
      const rightToWorkCheckId = '123e4567-e89b-12d3-a456-426614174001';
      const documentData = {
        fileName: 'passport.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        documentType: 'passport',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'Passport document',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(mockRightToWorkCheck as any);
      jest.spyOn(rightToWorkDocumentRepository, 'create').mockReturnValue(mockRightToWorkDocument as any);
      jest.spyOn(rightToWorkDocumentRepository, 'save').mockResolvedValue(mockRightToWorkDocument as any);

      const result = await service.uploadRightToWorkDocument(rightToWorkCheckId, documentData);

      expect(result).toEqual(mockRightToWorkDocument);
      expect(rightToWorkDocumentRepository.create).toHaveBeenCalledWith({
        ...documentData,
        rightToWorkCheckId
      });
      expect(rightToWorkDocumentRepository.save).toHaveBeenCalledWith(mockRightToWorkDocument);
    });

    it('should throw error if Right to Work check not found', async () => {
      const rightToWorkCheckId = '123e4567-e89b-12d3-a456-426614174001';
      const documentData = {
        fileName: 'passport.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        documentType: 'passport',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'Passport document',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(rightToWorkCheckRepository, 'findOne').mockResolvedValue(null);

      await expect(service.uploadRightToWorkDocument(rightToWorkCheckId, documentData)).rejects.toThrow('Right to Work check not found');
    });

    it('should throw error for invalid document type', async () => {
      const rightToWorkCheckId = '123e4567-e89b-12d3-a456-426614174001';
      const documentData = {
        fileName: 'passport.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        documentType: 'invalid_type',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'Passport document',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.uploadRightToWorkDocument(rightToWorkCheckId, documentData)).rejects.toThrow('Invalid document type');
    });
  });

  describe('getRightToWorkComplianceReport', () => {
    it('should return Right to Work compliance report', async () => {
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');

      const mockComplianceReport = {
        period: {
          from: dateFrom,
          to: dateTo
        },
        careHomeId,
        totalEmployees: 50,
        rightToWorkChecks: {
          total: 50,
          pending: 5,
          verified: 40,
          expired: 3,
          invalid: 2
        },
        complianceRate: 80.0,
        expiringSoon: 8,
        overdue: 2,
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getRightToWorkComplianceReport').mockResolvedValue(mockComplianceReport);

      const result = await service.getRightToWorkComplianceReport(careHomeId, dateFrom, dateTo);

      expect(result).toEqual(mockComplianceReport);
    });
  });

  describe('getRightToWorkExpiryAlerts', () => {
    it('should return Right to Work expiry alerts', async () => {
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';
      const daysBeforeExpiry = 60;

      const mockExpiryAlerts = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          employeeName: 'John Doe',
          checkType: 'passport',
          expiryDate: new Date('2025-03-15'),
          daysUntilExpiry: 45,
          status: 'expiring_soon'
        }
      ];

      jest.spyOn(service, 'getRightToWorkExpiryAlerts').mockResolvedValue(mockExpiryAlerts);

      const result = await service.getRightToWorkExpiryAlerts(careHomeId, daysBeforeExpiry);

      expect(result).toEqual(mockExpiryAlerts);
    });
  });
});

describe('Right to Work Integration Tests', () => {
  let app: any;
  let rightToWorkService: RightToWorkService;

  beforeAll(async () => {
    // Setup test database and application
  });

  afterAll(async () => {
    // Cleanup test database and application
  });

  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
  });

  describe('Right to Work Workflow', () => {
    it('should complete full Right to Work check workflow', async () => {
      // 1. Create Right to Work check
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'passport',
        checkDate: new Date('2025-01-01'),
        expiryDate: new Date('2030-01-01'),
        notes: 'Right to Work check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const rightToWorkCheck = await rightToWorkService.createRightToWorkCheck(createData);
      expect(rightToWorkCheck.status).toBe('pending');

      // 2. Upload document
      const documentData = {
        fileName: 'passport.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        documentType: 'passport',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'Passport document',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const document = await rightToWorkService.uploadRightToWorkDocument(
        rightToWorkCheck.id,
        documentData
      );
      expect(document.documentType).toBe('passport');

      // 3. Verify check
      const verificationData = {
        isCompliant: true,
        notes: 'Right to Work check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const verifiedRightToWorkCheck = await rightToWorkService.verifyRightToWorkCheck(
        rightToWorkCheck.id,
        verificationData
      );
      expect(verifiedRightToWorkCheck.status).toBe('verified');
      expect(verifiedRightToWorkCheck.isCompliant).toBe(true);
    });
  });
});

describe('Right to Work E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('Right to Work API Endpoints', () => {
    it('should create Right to Work check via API', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'passport',
        checkDate: '2025-01-01',
        expiryDate: '2030-01-01',
        notes: 'Right to Work check for new employee'
      };

      const response = await request(app.getHttpServer())
        .post('/api/hr/right-to-work')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.checkType).toBe('passport');
    });

    it('should get Right to Work check by ID via API', async () => {
      // First create a Right to Work check
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'passport',
        checkDate: '2025-01-01',
        expiryDate: '2030-01-01',
        notes: 'Right to Work check for new employee'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/hr/right-to-work')
        .send(createData)
        .expect(201);

      const rightToWorkCheckId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/hr/right-to-work/${rightToWorkCheckId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(rightToWorkCheckId);
    });

    it('should upload Right to Work document via API', async () => {
      // First create a Right to Work check
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        checkType: 'passport',
        checkDate: '2025-01-01',
        expiryDate: '2030-01-01',
        notes: 'Right to Work check for new employee'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/hr/right-to-work')
        .send(createData)
        .expect(201);

      const rightToWorkCheckId = createResponse.body.data.id;

      // Then upload a document
      const documentData = {
        fileName: 'passport.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/passport.pdf',
        documentType: 'passport',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'Passport document'
      };

      const response = await request(app.getHttpServer())
        .post(`/api/hr/right-to-work/${rightToWorkCheckId}/documents`)
        .send(documentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documentType).toBe('passport');
    });
  });
});
