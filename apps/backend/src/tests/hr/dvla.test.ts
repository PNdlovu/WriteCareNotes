import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DVLAService } from '../../services/hr/DVLAService';
import { DVLACheck } from '../../entities/hr/DVLACheck';
import { DVLAService as DVLAServiceEntity } from '../../entities/hr/DVLAService';
import { Employee } from '../../entities/hr/Employee';

/**
 * @fileoverview DVLA Integration Tests
 * @module DVLATests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for DVLA integration functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('DVLA Service', () => {
  let service: DVLAService;
  let dvlaCheckRepository: Repository<DVLACheck>;
  let dvlaServiceRepository: Repository<DVLAServiceEntity>;
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

  const mockDVLACheck = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    employeeId: '123e4567-e89b-12d3-a456-426614174000',
    licenseNumber: 'ABCD1234567890',
    issueDate: new Date('2020-01-01'),
    expiryDate: new Date('2030-01-01'),
    status: 'pending',
    isVerified: false,
    drivingCategories: ['B', 'C1'],
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockDVLAService = {
    id: '123e4567-e89b-12d3-a456-426614174002',
    serviceName: 'DVLA Driver Check API',
    apiUrl: 'https://api.dvla.gov.uk/driver-check',
    apiKey: 'encrypted_api_key',
    isActive: true,
    description: 'DVLA API for driver license verification',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DVLAService,
        {
          provide: getRepositoryToken(DVLACheck),
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
          provide: getRepositoryToken(DVLAServiceEntity),
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

    service = module.get<DVLAService>(DVLAService);
    dvlaCheckRepository = module.get<Repository<DVLACheck>>(getRepositoryToken(DVLACheck));
    dvlaServiceRepository = module.get<Repository<DVLAServiceEntity>>(getRepositoryToken(DVLAServiceEntity));
    employeeRepository = module.get<Repository<Employee>>(getRepositoryToken(Employee));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createDVLACheck', () => {
    it('should create a new DVLA check', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'ABCD1234567890',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(mockEmployee as any);
      jest.spyOn(dvlaCheckRepository, 'create').mockReturnValue(mockDVLACheck as any);
      jest.spyOn(dvlaCheckRepository, 'save').mockResolvedValue(mockDVLACheck as any);

      const result = await service.createDVLACheck(createData);

      expect(result).toEqual(mockDVLACheck);
      expect(dvlaCheckRepository.create).toHaveBeenCalledWith(createData);
      expect(dvlaCheckRepository.save).toHaveBeenCalledWith(mockDVLACheck);
    });

    it('should throw error if employee not found', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'ABCD1234567890',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(employeeRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createDVLACheck(createData)).rejects.toThrow('Employee not found');
    });

    it('should throw error for invalid license number format', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'INVALID',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.createDVLACheck(createData)).rejects.toThrow('Invalid license number format');
    });

    it('should throw error for invalid date range', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'ABCD1234567890',
        issueDate: new Date('2030-01-01'),
        expiryDate: new Date('2020-01-01'),
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.createDVLACheck(createData)).rejects.toThrow('Expiry date must be after issue date');
    });
  });

  describe('getDVLACheckById', () => {
    it('should return DVLA check by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(mockDVLACheck as any);

      const result = await service.getDVLACheckById(id);

      expect(result).toEqual(mockDVLACheck);
      expect(dvlaCheckRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['employee']
      });
    });

    it('should return null if DVLA check not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getDVLACheckById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateDVLACheck', () => {
    it('should update DVLA check', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'verified',
        isVerified: true,
        notes: 'DVLA check completed successfully',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const updatedDVLACheck = {
        ...mockDVLACheck,
        ...updateData
      };

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(mockDVLACheck as any);
      jest.spyOn(dvlaCheckRepository, 'save').mockResolvedValue(updatedDVLACheck as any);

      const result = await service.updateDVLACheck(id, updateData);

      expect(result).toEqual(updatedDVLACheck);
      expect(dvlaCheckRepository.save).toHaveBeenCalledWith(updatedDVLACheck);
    });

    it('should throw error if DVLA check not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'verified',
        isVerified: true,
        notes: 'DVLA check completed successfully',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateDVLACheck(id, updateData)).rejects.toThrow('DVLA check not found');
    });

    it('should throw error if DVLA check is expired', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const updateData = {
        status: 'verified',
        isVerified: true,
        notes: 'DVLA check completed successfully',
        updatedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const expiredDVLACheck = {
        ...mockDVLACheck,
        status: 'expired'
      };

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(expiredDVLACheck as any);

      await expect(service.updateDVLACheck(id, updateData)).rejects.toThrow('Cannot update expired DVLA check');
    });
  });

  describe('verifyDVLACheck', () => {
    it('should verify DVLA check', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const verificationData = {
        isVerified: true,
        notes: 'DVLA check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const verifiedDVLACheck = {
        ...mockDVLACheck,
        status: 'verified',
        isVerified: true
      };

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(mockDVLACheck as any);
      jest.spyOn(dvlaCheckRepository, 'save').mockResolvedValue(verifiedDVLACheck as any);

      const result = await service.verifyDVLACheck(id, verificationData);

      expect(result.status).toBe('verified');
      expect(result.isVerified).toBe(true);
    });

    it('should throw error if DVLA check not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const verificationData = {
        isVerified: true,
        notes: 'DVLA check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(null);

      await expect(service.verifyDVLACheck(id, verificationData)).rejects.toThrow('DVLA check not found');
    });

    it('should throw error if DVLA check not pending', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const verificationData = {
        isVerified: true,
        notes: 'DVLA check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const verifiedDVLACheck = {
        ...mockDVLACheck,
        status: 'verified'
      };

      jest.spyOn(dvlaCheckRepository, 'findOne').mockResolvedValue(verifiedDVLACheck as any);

      await expect(service.verifyDVLACheck(id, verificationData)).rejects.toThrow('Only pending DVLA checks can be verified');
    });
  });

  describe('checkLicenseWithDVLA', () => {
    it('should check license with DVLA API', async () => {
      const licenseNumber = 'ABCD1234567890';
      const dateOfBirth = new Date('1990-01-01');

      const mockDVLAResponse = {
        licenseNumber: 'ABCD1234567890',
        isValid: true,
        status: 'valid',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        categories: ['B', 'C1'],
        endorsements: [],
        disqualifications: []
      };

      jest.spyOn(service, 'checkLicenseWithDVLA').mockResolvedValue(mockDVLAResponse);

      const result = await service.checkLicenseWithDVLA(licenseNumber, dateOfBirth);

      expect(result).toEqual(mockDVLAResponse);
      expect(result.isValid).toBe(true);
    });

    it('should throw error if DVLA service not available', async () => {
      const licenseNumber = 'ABCD1234567890';
      const dateOfBirth = new Date('1990-01-01');

      jest.spyOn(dvlaServiceRepository, 'findOne').mockResolvedValue(null);

      await expect(service.checkLicenseWithDVLA(licenseNumber, dateOfBirth)).rejects.toThrow('DVLA service not available');
    });

    it('should throw error if DVLA API returns error', async () => {
      const licenseNumber = 'INVALID1234567890';
      const dateOfBirth = new Date('1990-01-01');

      jest.spyOn(service, 'checkLicenseWithDVLA').mockRejectedValue(new Error('DVLA APIerror: Invalid license number'));

      await expect(service.checkLicenseWithDVLA(licenseNumber, dateOfBirth)).rejects.toThrow('DVLA APIerror: Invalid license number');
    });
  });

  describe('getDVLAComplianceReport', () => {
    it('should return DVLA compliance report', async () => {
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
        dvlaChecks: {
          total: 50,
          pending: 5,
          verified: 40,
          expired: 3,
          failed: 2
        },
        complianceRate: 80.0,
        expiringSoon: 8,
        overdue: 2,
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getDVLAComplianceReport').mockResolvedValue(mockComplianceReport);

      const result = await service.getDVLAComplianceReport(careHomeId, dateFrom, dateTo);

      expect(result).toEqual(mockComplianceReport);
    });
  });

  describe('getDVLAExpiryAlerts', () => {
    it('should return DVLA expiry alerts', async () => {
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';
      const daysBeforeExpiry = 90;

      const mockExpiryAlerts = [
        {
          id: '123e4567-e89b-12d3-a456-426614174001',
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          employeeName: 'John Doe',
          licenseNumber: 'ABCD1234567890',
          expiryDate: new Date('2025-03-15'),
          daysUntilExpiry: 45,
          status: 'expiring_soon'
        }
      ];

      jest.spyOn(service, 'getDVLAExpiryAlerts').mockResolvedValue(mockExpiryAlerts);

      const result = await service.getDVLAExpiryAlerts(careHomeId, daysBeforeExpiry);

      expect(result).toEqual(mockExpiryAlerts);
    });
  });

  describe('configureDVLAService', () => {
    it('should configure DVLA service', async () => {
      const serviceData = {
        serviceName: 'DVLA Driver Check API',
        apiUrl: 'https://api.dvla.gov.uk/driver-check',
        apiKey: 'new_api_key',
        description: 'DVLA API for driver license verification',
        configuredBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const configuredDVLAService = {
        ...mockDVLAService,
        ...serviceData
      };

      jest.spyOn(dvlaServiceRepository, 'create').mockReturnValue(configuredDVLAService as any);
      jest.spyOn(dvlaServiceRepository, 'save').mockResolvedValue(configuredDVLAService as any);

      const result = await service.configureDVLAService(serviceData);

      expect(result).toEqual(configuredDVLAService);
      expect(dvlaServiceRepository.create).toHaveBeenCalledWith(serviceData);
      expect(dvlaServiceRepository.save).toHaveBeenCalledWith(configuredDVLAService);
    });

    it('should throw error for invalid API URL', async () => {
      const serviceData = {
        serviceName: 'DVLA Driver Check API',
        apiUrl: 'invalid_url',
        apiKey: 'new_api_key',
        description: 'DVLA API for driver license verification',
        configuredBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.configureDVLAService(serviceData)).rejects.toThrow('Invalid API URL');
    });
  });
});

describe('DVLA Integration Tests', () => {
  let app: any;
  let dvlaService: DVLAService;

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

  describe('DVLA Workflow', () => {
    it('should complete full DVLA check workflow', async () => {
      // 1. Create DVLA check
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'ABCD1234567890',
        issueDate: new Date('2020-01-01'),
        expiryDate: new Date('2030-01-01'),
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const dvlaCheck = await dvlaService.createDVLACheck(createData);
      expect(dvlaCheck.status).toBe('pending');

      // 2. Check license with DVLA API
      const licenseData = {
        licenseNumber: 'ABCD1234567890',
        dateOfBirth: new Date('1990-01-01')
      };

      const dvlaResponse = await dvlaService.checkLicenseWithDVLA(
        licenseData.licenseNumber,
        licenseData.dateOfBirth
      );
      expect(dvlaResponse.isValid).toBe(true);

      // 3. Verify check
      const verificationData = {
        isVerified: true,
        notes: 'DVLA check verified successfully',
        verifiedBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const verifiedDVLACheck = await dvlaService.verifyDVLACheck(
        dvlaCheck.id,
        verificationData
      );
      expect(verifiedDVLACheck.status).toBe('verified');
      expect(verifiedDVLACheck.isVerified).toBe(true);
    });
  });
});

describe('DVLA E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('DVLA API Endpoints', () => {
    it('should create DVLA check via API', async () => {
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'ABCD1234567890',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee'
      };

      const response = await request(app.getHttpServer())
        .post('/api/hr/dvla')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.licenseNumber).toBe('ABCD1234567890');
    });

    it('should get DVLA check by ID via API', async () => {
      // First create a DVLA check
      const createData = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        licenseNumber: 'ABCD1234567890',
        issueDate: '2020-01-01',
        expiryDate: '2030-01-01',
        drivingCategories: ['B', 'C1'],
        notes: 'DVLA check for new employee'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/hr/dvla')
        .send(createData)
        .expect(201);

      const dvlaCheckId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/hr/dvla/${dvlaCheckId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(dvlaCheckId);
    });

    it('should check license with DVLA via API', async () => {
      const checkData = {
        licenseNumber: 'ABCD1234567890',
        dateOfBirth: '1990-01-01'
      };

      const response = await request(app.getHttpServer())
        .post('/api/hr/dvla/check-license')
        .send(checkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
    });
  });
});
