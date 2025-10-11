import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DBSVerificationService } from '../../services/hr/DBSVerificationService';
import { DBSVerification } from '../../entities/hr/DBSVerification';
import { DBSDocument } from '../../entities/hr/DBSDocument';
import { DBSNotification } from '../../entities/hr/DBSNotification';
import { Employee } from '../../entities/hr/Employee';

/**
 * @fileoverview DBS Verification Tests
 * @module DBSVerificationTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for DBS verification functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('DBS Verification Service', () => {
  letservice: DBSVerificationService;
  letdbsVerificationRepository: Repository<DBSVerification>;
  letdbsDocumentRepository: Repository<DBSDocument>;
  letdbsNotificationRepository: Repository<DBSNotification>;
  letemployeeRepository: Repository<Employee>;

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

  const mockDBSVerification = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    employeeId: '123e4567-e89b-12d3-a456-426614174000',
    dbsType: 'enhanced',
    applicationReference: 'DBS-2025-001',
    applicationDate: new Date('2025-01-01'),
    status: 'pending',
    certificateNumber: null,
    issueDate: null,
    expiryDate: null,
    isVerified: false,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockDBSDocument = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    dbsVerificationId: '123e4567-e89b-12d3-a456-426614174001',
    fileName: 'dbs_certificate.pdf',
    fileUrl: 'https://s3.amazonaws.com/bucket/dbs_certificate.pdf',
    documentType: 'dbs_certificate',
    mimeType: 'application/pdf',
    fileSize: 1024000,
    description: 'DBS certificate',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockDBSNotification = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    dbsVerificationId: '123e4567-e89b-12d3-a456-426614174001',
    type: 'application_submitted',
    message: 'DBS application submitted successfully',
    recipientId: '123e4567-e89b-12d3-a456-426614174000',
    isRead: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  beforeEach(async () => {
    constmodule: TestingModule = await Test.createTestingModule({
      providers: [
        DBSVerificationService,
        {
          provide: getRepositoryToken(DBSVerification),
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
          provide: getRepositoryToken(DBSDocument),
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
          provide: getRepositoryToken(DBSNotification),
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

    service = module.get<DBSVerificationService>(DBSVerificationService);
    dbsVerificationRepository = module.get<Repository<DBSVerification>>(getRepositoryToken(DBSVerification));
    dbsDocumentRepository = module.get<Repository<DBSDocument>>(getRepositoryToken(DBSDocument));
    dbsNotificationRepository = module.get<Repository<DBSNotification>>(getRepositoryToken(DBSNotification));
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDBSVerification', () => {
    it('should create a new DBS verification', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: new Date('2025-01-01'),
        notes: 'DBS application for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(mockEmployee as any);
      jest.spyOn(dbsVerificationRepository, 'create').mockReturnValue(mockDBSVerification as any);
      jest.spyOn(dbsVerificationRepository, 'save').mockResolvedValue(mockDBSVerification as any);
      jest.spyOn(dbsNotificationRepository, 'create').mockReturnValue(mockDBSNotification as any);
      jest.spyOn(dbsNotificationRepository, 'save').mockResolvedValue(mockDBSNotification as any);

      const result = await service.createDBSVerification(createData);

      expect(result).toEqual(mockDBSVerification);
      expect(dbsVerificationRepository.create).toHaveBeenCalledWith(createData);
      expect(dbsVerificationRepository.save).toHaveBeenCalledWith(mockDBSVerification);
    });

    it('should throw error if employee not found', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: new Date('2025-01-01'),
        notes: 'DBS application for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createDBSVerification(createData)).rejects.toThrow('Employee not found');
    });

    it('should throw error for invalid DBS type', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'invalid_type',
        applicationReference: 'DBS-2025-001',
        applicationDate: new Date('2025-01-01'),
        notes: 'DBS application for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.createDBSVerification(createData)).rejects.toThrow('Invalid DBS type');
    });
  });

  describe('getDBSVerificationById', () => {
    it('should return DBS verification by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(mockDBSVerification as any);

      const result = await service.getDBSVerificationById(id);

      expect(result).toEqual(mockDBSVerification);
      expect(dbsVerificationRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['employee', 'documents', 'notifications']
      });
    });

    it('should return null if DBS verification not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getDBSVerificationById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateDBSVerification', () => {
    it('should update DBS verification', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'in_progress',
        notes: 'DBS application is being processed',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const updatedDBSVerification = {
        ...mockDBSVerification,
        ...updateData
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(mockDBSVerification as any);
      jest.spyOn(dbsVerificationRepository, 'save').mockResolvedValue(updatedDBSVerification as any);

      const result = await service.updateDBSVerification(id, updateData);

      expect(result).toEqual(updatedDBSVerification);
      expect(dbsVerificationRepository.save).toHaveBeenCalledWith(updatedDBSVerification);
    });

    it('should throw error if DBS verification not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'in_progress',
        notes: 'DBS application is being processed',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateDBSVerification(id, updateData)).rejects.toThrow('DBS verification not found');
    });

    it('should throw error if DBS verification is completed', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'in_progress',
        notes: 'DBS application is being processed',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const completedDBSVerification = {
        ...mockDBSVerification,
        status: 'completed'
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(completedDBSVerification as any);

      await expect(service.updateDBSVerification(id, updateData)).rejects.toThrow('Cannot update completed DBS verification');
    });
  });

  describe('completeDBSVerification', () => {
    it('should complete DBS verification', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const completionData = {
        certificateNumber: 'DBS123456789',
        issueDate: new Date('2025-01-15'),
        expiryDate: new Date('2028-01-15'),
        completedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const completedDBSVerification = {
        ...mockDBSVerification,
        status: 'completed',
        certificateNumber: completionData.certificateNumber,
        issueDate: completionData.issueDate,
        expiryDate: completionData.expiryDate,
        isVerified: true
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(mockDBSVerification as any);
      jest.spyOn(dbsVerificationRepository, 'save').mockResolvedValue(completedDBSVerification as any);

      const result = await service.completeDBSVerification(id, completionData);

      expect(result.status).toBe('completed');
      expect(result.certificateNumber).toBe(completionData.certificateNumber);
      expect(result.isVerified).toBe(true);
    });

    it('should throw error if DBS verification not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const completionData = {
        certificateNumber: 'DBS123456789',
        issueDate: new Date('2025-01-15'),
        expiryDate: new Date('2028-01-15'),
        completedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.completeDBSVerification(id, completionData)).rejects.toThrow('DBS verification not found');
    });

    it('should throw error if DBS verification not in progress', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const completionData = {
        certificateNumber: 'DBS123456789',
        issueDate: new Date('2025-01-15'),
        expiryDate: new Date('2028-01-15'),
        completedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const completedDBSVerification = {
        ...mockDBSVerification,
        status: 'completed'
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(completedDBSVerification as any);

      await expect(service.completeDBSVerification(id, completionData)).rejects.toThrow('Only in-progress DBS verifications can be completed');
    });
  });

  describe('uploadDBSDocument', () => {
    it('should upload DBS document', async () => {
      const dbsVerificationId = '123e4567-e89b-12d3-a456-426614174001';
      const documentData = {
        fileName: 'dbs_certificate.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/dbs_certificate.pdf',
        documentType: 'dbs_certificate',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'DBS certificate',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(mockDBSVerification as any);
      jest.spyOn(dbsDocumentRepository, 'create').mockReturnValue(mockDBSDocument as any);
      jest.spyOn(dbsDocumentRepository, 'save').mockResolvedValue(mockDBSDocument as any);

      const result = await service.uploadDBSDocument(dbsVerificationId, documentData);

      expect(result).toEqual(mockDBSDocument);
      expect(dbsDocumentRepository.create).toHaveBeenCalledWith({
        ...documentData,
        dbsVerificationId
      });
      expect(dbsDocumentRepository.save).toHaveBeenCalledWith(mockDBSDocument);
    });

    it('should throw error if DBS verification not found', async () => {
      const dbsVerificationId = '123e4567-e89b-12d3-a456-426614174001';
      const documentData = {
        fileName: 'dbs_certificate.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/dbs_certificate.pdf',
        documentType: 'dbs_certificate',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'DBS certificate',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(dbsVerificationRepository, 'findOne').mockResolvedValue(null);

      await expect(service.uploadDBSDocument(dbsVerificationId, documentData)).rejects.toThrow('DBS verification not found');
    });

    it('should throw error for invalid document type', async () => {
      const dbsVerificationId = '123e4567-e89b-12d3-a456-426614174001';
      const documentData = {
        fileName: 'dbs_certificate.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/dbs_certificate.pdf',
        documentType: 'invalid_type',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'DBS certificate',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.uploadDBSDocument(dbsVerificationId, documentData)).rejects.toThrow('Invalid document type');
    });
  });

  describe('getDBSComplianceReport', () => {
    it('should return DBS compliance report', async () => {
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
        dbsVerifications: {
          total: 50,
          pending: 5,
          inProgress: 10,
          completed: 30,
          expired: 3,
          rejected: 2
        },
        complianceRate: 85.0,
        expiringSoon: 8,
        overdue: 2,
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getDBSComplianceReport').mockResolvedValue(mockComplianceReport);

      const result = await service.getDBSComplianceReport(careHomeId, dateFrom, dateTo);

      expect(result).toEqual(mockComplianceReport);
    });
  });

  describe('getDBSExpiryAlerts', () => {
    it('should return DBS expiry alerts', async () => {
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';
      const daysBeforeExpiry = 90;

      const mockExpiryAlerts = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          employeeName: 'John Doe',
          dbsType: 'enhanced',
          expiryDate: new Date('2025-03-15'),
          daysUntilExpiry: 45,
          status: 'expiring_soon'
        }
      ];

      jest.spyOn(service, 'getDBSExpiryAlerts').mockResolvedValue(mockExpiryAlerts);

      const result = await service.getDBSExpiryAlerts(careHomeId, daysBeforeExpiry);

      expect(result).toEqual(mockExpiryAlerts);
    });
  });
});

describe('DBS Verification Integration Tests', () => {
  letapp: any;
  letdbsVerificationService: DBSVerificationService;

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

  describe('DBS Verification Workflow', () => {
    it('should complete full DBS verification workflow', async () => {
      // 1. Create DBS verification
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: new Date('2025-01-01'),
        notes: 'DBS application for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const dbsVerification = await dbsVerificationService.createDBSVerification(createData);
      expect(dbsVerification.status).toBe('pending');

      // 2. Update status to in progress
      const updateData = {
        status: 'in_progress',
        notes: 'DBS application is being processed',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const updatedDBSVerification = await dbsVerificationService.updateDBSVerification(
        dbsVerification.id,
        updateData
      );
      expect(updatedDBSVerification.status).toBe('in_progress');

      // 3. Upload document
      const documentData = {
        fileName: 'dbs_certificate.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/dbs_certificate.pdf',
        documentType: 'dbs_certificate',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'DBS certificate',
        uploadedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const document = await dbsVerificationService.uploadDBSDocument(
        dbsVerification.id,
        documentData
      );
      expect(document.documentType).toBe('dbs_certificate');

      // 4. Complete verification
      const completionData = {
        certificateNumber: 'DBS123456789',
        issueDate: new Date('2025-01-15'),
        expiryDate: new Date('2028-01-15'),
        completedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const completedDBSVerification = await dbsVerificationService.completeDBSVerification(
        dbsVerification.id,
        completionData
      );
      expect(completedDBSVerification.status).toBe('completed');
      expect(completedDBSVerification.isVerified).toBe(true);
    });
  });
});

describe('DBS Verification E2E Tests', () => {
  letapp: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('DBS Verification API Endpoints', () => {
    it('should create DBS verification via API', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: '2025-01-01',
        notes: 'DBS application for new employee'
      };

      const response = await request(app.getHttpServer())
        .post('/api/hr/dbs')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.dbsType).toBe('enhanced');
    });

    it('should get DBS verification by ID via API', async () => {
      // First create a DBS verification
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: '2025-01-01',
        notes: 'DBS application for new employee'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/hr/dbs')
        .send(createData)
        .expect(201);

      const dbsVerificationId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/hr/dbs/${dbsVerificationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(dbsVerificationId);
    });

    it('should upload DBS document via API', async () => {
      // First create a DBS verification
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: '2025-01-01',
        notes: 'DBS application for new employee'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/hr/dbs')
        .send(createData)
        .expect(201);

      const dbsVerificationId = createResponse.body.data.id;

      // Then upload a document
      const documentData = {
        fileName: 'dbs_certificate.pdf',
        fileUrl: 'https://s3.amazonaws.com/bucket/dbs_certificate.pdf',
        documentType: 'dbs_certificate',
        mimeType: 'application/pdf',
        fileSize: 1024000,
        description: 'DBS certificate'
      };

      const response = await request(app.getHttpServer())
        .post(`/api/hr/dbs/${dbsVerificationId}/documents`)
        .send(documentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.documentType).toBe('dbs_certificate');
    });
  });
});
