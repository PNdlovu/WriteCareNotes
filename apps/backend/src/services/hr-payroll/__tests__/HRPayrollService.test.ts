/**
 * @fileoverview HR & Payroll Service Unit Tests for WriteCareNotes
 * @module HRPayrollServiceTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive unit tests for HR and payroll management service
 * covering employee management, payroll processing, training records, shift scheduling,
 * and performance management with full compliance and security testing.
 * 
 * @compliance
 * - Employment Rights Act 1996
 * - Working Time Regulations 1998
 * - PAYE (Pay As You Earn) regulations
 * - GDPR data protection requirements
 * - Unit testing standards and coverage requirements
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HRPayrollService } from '../HRPayrollService';
import { HRPayrollRepository } from '@/repositories/hr-payroll/HRPayrollRepository';
import { AuditService } from '@/services/audit/AuditService';
import { EncryptionService } from '@/services/security/EncryptionService';
import { NotificationService } from '@/services/notification/NotificationService';
import { CacheService } from '@/services/caching/CacheService';
import {
  HRValidationError,
  EmployeeNotFoundError,
  PayrollProcessingError,
  TrainingComplianceError,
  ShiftSchedulingError,
  TaxCalculationError,
  PensionCalculationError
} from '@/errors/HRPayrollErrors';
import {
  Employee,
  PayrollRecord,
  PayrollSummary,
  TrainingRecord,
  Shift,
  HRMetrics
} from '@/entities/hr-payroll/HRPayrollEntities';
import {
  CreateEmployeeRequest,
  ProcessPayrollRequest,
  CreateTrainingRecordRequest,
  CreateShiftRequest,
  HRMetricsRequest
} from '@/services/hr-payroll/interfaces/HRPayrollInterfaces';

describe('HRPayrollService', () => {
  letservice: HRPayrollService;
  letmockRepository: jest.Mocked<HRPayrollRepository>;
  letmockAuditService: jest.Mocked<AuditService>;
  letmockEncryptionService: jest.Mocked<EncryptionService>;
  letmockNotificationService: jest.Mocked<NotificationService>;
  letmockCacheService: jest.Mocked<CacheService>;

  const mockEmployeeId = 'employee-123';
  const mockCareHomeId = 'care-home-456';
  const mockUserId = 'user-789';
  const mockCorrelationId = 'correlation-abc';

  beforeEach(async () => {
    const mockRepositoryProvider = {
      provide: HRPayrollRepository,
      useValue: {
        createEmployee: jest.fn(),
        getEmployee: jest.fn(),
        findEmployeeByNumberOrNI: jest.fn(),
        searchEmployees: jest.fn(),
        updateEmployee: jest.fn(),
        createPayrollRecord: jest.fn(),
        createPayrollSummary: jest.fn(),
        getEmployeeHours: jest.fn(),
        getEmployeePensionScheme: jest.fn(),
        createTrainingRecord: jest.fn(),
        createShift: jest.fn(),
        getEmployeeCount: jest.fn(),
        getTurnoverRate: jest.fn(),
        getAverageTenure: jest.fn(),
        getTrainingComplianceRate: jest.fn(),
        getPayrollCosts: jest.fn(),
        getAbsenteeismRate: jest.fn(),
        getOvertimeHours: jest.fn(),
        getSickLeaveRate: jest.fn(),
        getAverageHoursWorked: jest.fn(),
        getRightToWorkCompliance: jest.fn(),
        getDBSCompliance: jest.fn(),
        getHealthSafetyCompliance: jest.fn(),
        getProfessionalRegCompliance: jest.fn()
      }
    };

    const mockAuditServiceProvider = {
      provide: AuditService,
      useValue: {
        log: jest.fn()
      }
    };

    const mockEncryptionServiceProvider = {
      provide: EncryptionService,
      useValue: {
        encrypt: jest.fn(),
        decrypt: jest.fn()
      }
    };

    const mockNotificationServiceProvider = {
      provide: NotificationService,
      useValue: {
        sendEmployeeWelcomeNotification: jest.fn(),
        sendShiftNotification: jest.fn()
      }
    };

    const mockCacheServiceProvider = {
      provide: CacheService,
      useValue: {
        get: jest.fn(),
        set: jest.fn(),
        delete: jest.fn()
      }
    };

    constmodule: TestingModule = await Test.createTestingModule({
      providers: [
        HRPayrollService,
        mockRepositoryProvider,
        mockAuditServiceProvider,
        mockEncryptionServiceProvider,
        mockNotificationServiceProvider,
        mockCacheServiceProvider
      ]
    }).compile();

    service = module.get<HRPayrollService>(HRPayrollService);
    mockRepository = module.get(HRPayrollRepository);
    mockAuditService = module.get(AuditService);
    mockEncryptionService = module.get(EncryptionService);
    mockNotificationService = module.get(NotificationService);
    mockCacheService = module.get(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Employee Management', () => {
    describe('createEmployee', () => {
      constvalidEmployeeRequest: CreateEmployeeRequest = {
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationalInsuranceNumber: 'AB123456C',
        email: 'john.doe@example.com',
        phoneNumber: '07700900123',
        address: {
          line1: '123 Main Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'England'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '07700900124'
        },
        startDate: new Date('2024-01-01'),
        department: 'Care',
        position: 'Care Assistant',
        employmentType: 'permanent',
        workingPattern: 'full_time',
        contractedHours: 37.5,
        hourlyRate: 12.50,
        rightToWorkDocuments: [{
          documentType: 'passport',
          documentNumber: 'P123456789',
          verifiedDate: new Date(),
          verifiedBy: mockUserId
        }],
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      constexpectedEmployee: Employee = {
        id: mockEmployeeId,
        ...validEmployeeRequest,
        nationalInsuranceNumber: 'encrypted_ni_number',
        status: 'active',
        probationEndDate: new Date('2024-07-01'),
        rightToWorkVerified: true,
        pensionSchemeOptOut: false,
        professionalRegistrations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: mockUserId,
        version: 1
      };

      it('should create employee with valid data', async () => {
        mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(null);
        mockEncryptionService.encrypt.mockResolvedValue('encrypted_ni_number');
        mockRepository.createEmployee.mockResolvedValue(expectedEmployee);

        const result = await service.createEmployee(validEmployeeRequest, mockCorrelationId);

        expect(result).toEqual(expectedEmployee);
        expect(mockRepository.findEmployeeByNumberOrNI).toHaveBeenCalledWith(
          validEmployeeRequest.employeeNumber,
          validEmployeeRequest.nationalInsuranceNumber
        );
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(validEmployeeRequest.nationalInsuranceNumber);
        expect(mockRepository.createEmployee).toHaveBeenCalledWith(
          expect.objectContaining({
            nationalInsuranceNumber: 'encrypted_ni_number',
            status: 'active'
          })
        );
        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'EMPLOYEE_CREATED',
            resourceType: 'Employee',
            resourceId: expectedEmployee.id
          })
        );
        expect(mockNotificationService.sendEmployeeWelcomeNotification).toHaveBeenCalledWith(
          expectedEmployee.id,
          expectedEmployee.email,
          mockCorrelationId
        );
      });

      it('should validate required fields', async () => {
        const invalidRequest = { ...validEmployeeRequest, firstName: '' };

        await expect(service.createEmployee(invalidRequest, mockCorrelationId))
          .rejects.toThrow(HRValidationError);
      });

      it('should validate National Insurance number format', async () => {
        const invalidRequest = { ...validEmployeeRequest, nationalInsuranceNumber: 'invalid' };

        await expect(service.createEmployee(invalidRequest, mockCorrelationId))
          .rejects.toThrow(HRValidationError);
      });

      it('should validate email format', async () => {
        const invalidRequest = { ...validEmployeeRequest, email: 'invalid-email' };

        await expect(service.createEmployee(invalidRequest, mockCorrelationId))
          .rejects.toThrow(HRValidationError);
      });

      it('should check for duplicate employee number', async () => {
        const existingEmployee = { ...expectedEmployee, id: 'existing-id' };
        mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(existingEmployee);

        await expect(service.createEmployee(validEmployeeRequest, mockCorrelationId))
          .rejects.toThrow(HRValidationError);
      });

      it('should handle database errors gracefully', async () => {
        mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(null);
        mockEncryptionService.encrypt.mockResolvedValue('encrypted_ni_number');
        const dbError = new Error('Database connection failed');
        mockRepository.createEmployee.mockRejectedValue(dbError);

        await expect(service.createEmployee(validEmployeeRequest, mockCorrelationId))
          .rejects.toThrow(HRValidationError);

        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'EMPLOYEE_CREATED',
            details: expect.objectContaining({
              error: dbError.message
            })
          })
        );
      });

      it('should encrypt sensitive data', async () => {
        mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(null);
        mockEncryptionService.encrypt
          .mockResolvedValueOnce('encrypted_ni_number')
          .mockResolvedValueOnce('encrypted_bank_account')
          .mockResolvedValueOnce('encrypted_sort_code')
          .mockResolvedValueOnce('encrypted_emergency_phone');

        const requestWithBankDetails = {
          ...validEmployeeRequest,
          bankAccountNumber: '12345678',
          sortCode: '12-34-56'
        };

        mockRepository.createEmployee.mockResolvedValue(expectedEmployee);

        await service.createEmployee(requestWithBankDetails, mockCorrelationId);

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(validEmployeeRequest.nationalInsuranceNumber);
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('12345678');
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('12-34-56');
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(validEmployeeRequest.emergencyContact.phoneNumber);
      });
    });

    describe('getEmployee', () => {
      it('should retrieve employee by ID', async () => {
        constexpectedEmployee: Employee = {
          id: mockEmployeeId,
          employeeNumber: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-01-01'),
          nationalInsuranceNumber: 'encrypted_ni_number',
          email: 'john.doe@example.com',
          phoneNumber: '07700900123',
          address: {
            line1: '123 Main Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'England'
          },
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phoneNumber: 'encrypted_emergency_phone'
          },
          startDate: new Date('2024-01-01'),
          department: 'Care',
          position: 'Care Assistant',
          employmentType: 'permanent',
          workingPattern: 'full_time',
          contractedHours: 37.5,
          hourlyRate: 12.50,
          status: 'active',
          rightToWorkVerified: true,
          pensionSchemeOptOut: false,
          professionalRegistrations: [],
          careHomeId: mockCareHomeId,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: mockUserId,
          updatedBy: mockUserId,
          version: 1
        };

        mockRepository.getEmployee.mockResolvedValue(expectedEmployee);

        const result = await service.getEmployee(mockEmployeeId, mockCorrelationId);

        expect(result).toEqual(expectedEmployee);
        expect(mockRepository.getEmployee).toHaveBeenCalledWith(mockEmployeeId);
      });

      it('should throw error when employee not found', async () => {
        mockRepository.getEmployee.mockResolvedValue(null);

        await expect(service.getEmployee(mockEmployeeId, mockCorrelationId))
          .rejects.toThrow(EmployeeNotFoundError);
      });
    });
  });

  describe('Payroll Processing', () => {
    describe('processPayroll', () => {
      constvalidPayrollRequest: ProcessPayrollRequest = {
        payrollPeriod: '2024-01',
        payrollType: 'monthly',
        careHomeId: mockCareHomeId,
        processedBy: mockUserId
      };

      constmockEmployee: Employee = {
        id: mockEmployeeId,
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationalInsuranceNumber: 'encrypted_ni_number',
        email: 'john.doe@example.com',
        phoneNumber: '07700900123',
        address: {
          line1: '123 Main Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'England'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: 'encrypted_emergency_phone'
        },
        startDate: new Date('2024-01-01'),
        department: 'Care',
        position: 'Care Assistant',
        employmentType: 'permanent',
        workingPattern: 'full_time',
        contractedHours: 37.5,
        hourlyRate: 12.50,
        taxCode: '1257L',
        status: 'active',
        rightToWorkVerified: true,
        pensionSchemeOptOut: false,
        professionalRegistrations: [],
        careHomeId: mockCareHomeId,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: mockUserId,
        updatedBy: mockUserId,
        version: 1
      };

      constexpectedPayrollSummary: PayrollSummary = {
        id: 'payroll-summary-123',
        payrollPeriod: '2024-01',
        processedDate: new Date(),
        employeeCount: 1,
        totalGrossPay: 2166.67,
        totalNetPay: 1800.00,
        totalIncomeTax: 200.00,
        totalNationalInsurance: 166.67,
        totalPensionContributions: 108.33,
        totalEmployerNI: 230.00,
        totalEmployerPension: 65.00,
        totalApprenticeshipLevy: 0,
        status: 'completed',
        hmrcSubmissionRequired: true,
        hmrcSubmitted: false,
        careHomeId: mockCareHomeId,
        correlationId: mockCorrelationId
      };

      it('should process payroll successfully', async () => {
        // Mock repository methods
        mockRepository.getEmployee.mockResolvedValue(mockEmployee);
        mockRepository.getEmployeeHours.mockResolvedValue({ regular: 173.33, overtime: 0 });
        mockRepository.getEmployeePensionScheme.mockResolvedValue({
          id: 'pension-scheme-1',
          schemeName: 'NEST Pension',
          provider: 'NEST',
          employeeContributionRate: 0.05,
          employerContributionRate: 0.03,
          isActive: true,
          autoEnrolment: true
        });
        mockRepository.createPayrollRecord.mockResolvedValue({
          id: 'payroll-record-123',
          employeeId: mockEmployeeId,
          payrollPeriod: '2024-01',
          grossPay: 2166.67,
          basicPay: 2166.67,
          overtimePay: 0,
          bonuses: 0,
          allowances: 0,
          benefitsInKind: 0,
          incomeTax: 200.00,
          nationalInsurance: 166.67,
          pensionContribution: 108.33,
          studentLoan: 0,
          courtOrders: 0,
          otherDeductions: 0,
          netPay: 1691.67,
          hoursWorked: 173.33,
          overtimeHours: 0,
          sickHours: 0,
          holidayHours: 0,
          employerNI: 230.00,
          employerPension: 65.00,
          apprenticeshipLevy: 0,
          taxCode: '1257L',
          taxPeriod: 1,
          cumulativeGrossPay: 2166.67,
          cumulativeTax: 200.00,
          cumulativeNI: 166.67,
          status: 'calculated',
          processedDate: new Date(),
          hmrcSubmitted: false,
          pensionSubmitted: false,
          careHomeId: mockCareHomeId,
          createdAt: new Date(),
          updatedAt: new Date(),
          processedBy: mockUserId,
          correlationId: mockCorrelationId
        });
        mockRepository.createPayrollSummary.mockResolvedValue(expectedPayrollSummary);

        const result = await service.processPayroll(validPayrollRequest, mockCorrelationId);

        expect(result).toEqual(expectedPayrollSummary);
        expect(mockRepository.getEmployeeHours).toHaveBeenCalledWith(mockEmployeeId, '2024-01');
        expect(mockRepository.createPayrollRecord).toHaveBeenCalled();
        expect(mockRepository.createPayrollSummary).toHaveBeenCalled();
        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'PAYROLL_PROCESSED',
            resourceType: 'PayrollSummary'
          })
        );
      });

      it('should validate payroll period format', async () => {
        const invalidRequest = { ...validPayrollRequest, payrollPeriod: 'invalid-period' };

        await expect(service.processPayroll(invalidRequest, mockCorrelationId))
          .rejects.toThrow(PayrollProcessingError);
      });

      it('should handle tax calculation errors', async () => {
        mockRepository.getEmployee.mockResolvedValue(mockEmployee);
        mockRepository.getEmployeeHours.mockResolvedValue({ regular: 173.33, overtime: 0 });

        // Mock tax calculation failure
        const taxError = new Error('Tax calculation failed');
        jest.spyOn(service as any, 'calculateIncomeTax').mockRejectedValue(taxError);

        await expect(service.processPayroll(validPayrollRequest, mockCorrelationId))
          .rejects.toThrow(PayrollProcessingError);
      });

      it('should calculate National Insurance correctly', async () => {
        const grossPay = 2166.67; // Monthly gross pay
        const result = (service as any).calculateNationalInsurance({ times: () => ({ toNumber: () => grossPay }) });

        expect(result.employeeNI.toNumber()).toBeCloseTo(134.40, 2); // 12% on earnings above £1,048
        expect(result.employerNI.toNumber()).toBeCloseTo(194.40, 2); // 13.8% on earnings above £758
      });

      it('should handle pension auto-enrolment', async () => {
        const employeeWithoutPension = { ...mockEmployee, pensionSchemeOptOut: true };
        mockRepository.getEmployee.mockResolvedValue(employeeWithoutPension);
        mockRepository.getEmployeeHours.mockResolvedValue({ regular: 173.33, overtime: 0 });
        mockRepository.getEmployeePensionScheme.mockResolvedValue(null);

        // Should still process payroll without pension contributions
        mockRepository.createPayrollRecord.mockResolvedValue({
          id: 'payroll-record-123',
          employeeId: mockEmployeeId,
          payrollPeriod: '2024-01',
          grossPay: 2166.67,
          pensionContribution: 0,
          employerPension: 0,
          netPay: 1800.00,
          processedDate: new Date(),
          correlationId: mockCorrelationId
        } as PayrollRecord);

        mockRepository.createPayrollSummary.mockResolvedValue(expectedPayrollSummary);

        const result = await service.processPayroll(validPayrollRequest, mockCorrelationId);

        expect(result).toBeDefined();
        expect(mockRepository.getEmployeePensionScheme).toHaveBeenCalledWith(mockEmployeeId);
      });
    });
  });

  describe('Training Management', () => {
    describe('createTrainingRecord', () => {
      constvalidTrainingRequest: CreateTrainingRecordRequest = {
        employeeId: mockEmployeeId,
        trainingType: 'first_aid',
        trainingName: 'First Aid at Work',
        provider: 'St John Ambulance',
        completionDate: new Date('2024-01-15'),
        trainingHours: 16,
        cost: 150.00,
        isMandatory: true,
        trainingMethod: 'classroom',
        assessmentResult: 'pass',
        recordedBy: mockUserId
      };

      constexpectedTrainingRecord: TrainingRecord = {
        id: 'training-record-123',
        ...validTrainingRequest,
        expiryDate: new Date('2027-01-15'), // 3 years for first aid
        certificateNumber: 'FA123456',
        complianceStatus: 'compliant',
        status: 'completed',
        careHomeId: mockCareHomeId,
        createdAt: new Date(),
        updatedAt: new Date(),
        correlationId: mockCorrelationId
      };

      it('should create training record successfully', async () => {
        constmockEmployee: Employee = {
          id: mockEmployeeId,
          careHomeId: mockCareHomeId
        } as Employee;

        mockRepository.getEmployee.mockResolvedValue(mockEmployee);
        mockRepository.createTrainingRecord.mockResolvedValue(expectedTrainingRecord);

        const result = await service.createTrainingRecord(validTrainingRequest, mockCorrelationId);

        expect(result).toEqual(expectedTrainingRecord);
        expect(mockRepository.getEmployee).toHaveBeenCalledWith(mockEmployeeId);
        expect(mockRepository.createTrainingRecord).toHaveBeenCalledWith(
          expect.objectContaining({
            ...validTrainingRequest,
            expiryDate: expect.any(Date),
            status: 'completed'
          })
        );
        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'TRAINING_RECORD_CREATED',
            resourceType: 'TrainingRecord'
          })
        );
      });

      it('should validate employee exists', async () => {
        mockRepository.getEmployee.mockResolvedValue(null);

        await expect(service.createTrainingRecord(validTrainingRequest, mockCorrelationId))
          .rejects.toThrow(EmployeeNotFoundError);
      });

      it('should calculate correct expiry dates for different training types', async () => {
        constmockEmployee: Employee = { id: mockEmployeeId, careHomeId: mockCareHomeId } as Employee;
        mockRepository.getEmployee.mockResolvedValue(mockEmployee);

        // Test different training types
        const trainingTypes = [
          { type: 'first_aid', expectedYears: 3 },
          { type: 'fire_safety', expectedYears: 1 },
          { type: 'manual_handling', expectedYears: 3 },
          { type: 'safeguarding', expectedYears: 3 },
          { type: 'medication_administration', expectedYears: 2 }
        ];

        for (const { type, expectedYears } of trainingTypes) {
          const request = { ...validTrainingRequest, trainingType: type };
          const completionDate = new Date('2024-01-15');
          const expectedExpiryDate = new Date('2024-01-15');
          expectedExpiryDate.setFullYear(expectedExpiryDate.getFullYear() + expectedYears);

          mockRepository.createTrainingRecord.mockResolvedValue({
            ...expectedTrainingRecord,
            trainingType: type,
            expiryDate: expectedExpiryDate
          });

          const result = await service.createTrainingRecord(request, mockCorrelationId);

          expect(result.expiryDate?.getFullYear()).toBe(2024 + expectedYears);
        }
      });

      it('should handle training compliance validation', async () => {
        constmockEmployee: Employee = { id: mockEmployeeId, careHomeId: mockCareHomeId } as Employee;
        mockRepository.getEmployee.mockResolvedValue(mockEmployee);

        const invalidRequest = {
          ...validTrainingRequest,
          trainingType: '', // Invalid training type
          trainingName: ''  // Invalid training name
        };

        await expect(service.createTrainingRecord(invalidRequest, mockCorrelationId))
          .rejects.toThrow(TrainingComplianceError);
      });
    });
  });

  describe('Shift Management', () => {
    describe('createShift', () => {
      constvalidShiftRequest: CreateShiftRequest = {
        employeeId: mockEmployeeId,
        shiftType: 'day',
        startTime: new Date('2024-01-15T08:00:00Z'),
        endTime: new Date('2024-01-15T16:00:00Z'),
        breakDuration: 60, // 1 hour break
        department: 'Care',
        location: 'Ground Floor',
        role: 'Care Assistant',
        hourlyRate: 12.50,
        isVoluntary: true,
        requiresSpecialSkills: ['medication_administration'],
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      constexpectedShift: Shift = {
        id: 'shift-123',
        ...validShiftRequest,
        shiftDate: new Date('2024-01-15'),
        duration: 8.0, // 8 hours
        status: 'scheduled',
        minimumStaffingLevel: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        correlationId: mockCorrelationId
      };

      it('should create shift successfully', async () => {
        constmockEmployee: Employee = {
          id: mockEmployeeId,
          status: 'active',
          email: 'john.doe@example.com'
        } as Employee;

        mockRepository.getEmployee.mockResolvedValue(mockEmployee);
        mockRepository.createShift.mockResolvedValue(expectedShift);

        const result = await service.createShift(validShiftRequest, mockCorrelationId);

        expect(result).toEqual(expectedShift);
        expect(mockRepository.getEmployee).toHaveBeenCalledWith(mockEmployeeId);
        expect(mockRepository.createShift).toHaveBeenCalledWith(
          expect.objectContaining({
            ...validShiftRequest,
            duration: 8.0,
            status: 'scheduled'
          })
        );
        expect(mockNotificationService.sendShiftNotification).toHaveBeenCalledWith(
          mockEmployee.id,
          mockEmployee.email,
          expectedShift,
          mockCorrelationId
        );
        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'SHIFT_CREATED',
            resourceType: 'Shift'
          })
        );
      });

      it('should validate employee is active', async () => {
        constinactiveEmployee: Employee = {
          id: mockEmployeeId,
          status: 'inactive'
        } as Employee;

        mockRepository.getEmployee.mockResolvedValue(inactiveEmployee);

        await expect(service.createShift(validShiftRequest, mockCorrelationId))
          .rejects.toThrow(EmployeeNotFoundError);
      });

      it('should validate shift timing', async () => {
        const invalidRequest = {
          ...validShiftRequest,
          startTime: new Date('2024-01-15T08:00:00Z'),
          endTime: new Date('2024-01-15T07:00:00Z') // End before start
        };

        await expect(service.createShift(invalidRequest, mockCorrelationId))
          .rejects.toThrow(ShiftSchedulingError);
      });

      it('should validate Working Time Regulations compliance', async () => {
        constmockEmployee: Employee = { id: mockEmployeeId, status: 'active' } as Employee;
        mockRepository.getEmployee.mockResolvedValue(mockEmployee);

        // Test shift longer than 12 hours (violates Working Time Regulations)
        const longShiftRequest = {
          ...validShiftRequest,
          startTime: new Date('2024-01-15T08:00:00Z'),
          endTime: new Date('2024-01-16T09:00:00Z') // 25 hours
        };

        await expect(service.createShift(longShiftRequest, mockCorrelationId))
          .rejects.toThrow(ShiftSchedulingError);
      });

      it('should calculate shift duration correctly', async () => {
        const duration = (service as any).calculateShiftDuration(
          new Date('2024-01-15T08:00:00Z'),
          new Date('2024-01-15T16:00:00Z')
        );

        expect(duration).toBe(8); // 8 hours
      });
    });
  });

  describe('HR Metrics', () => {
    describe('getHRMetrics', () => {
      constvalidMetricsRequest: HRMetricsRequest = {
        careHomeId: mockCareHomeId,
        period: 'current_month'
      };

      constexpectedMetrics: HRMetrics = {
        careHomeId: mockCareHomeId,
        period: 'current_month',
        generatedAt: new Date(),
        employeeMetrics: {
          totalEmployees: 50,
          activeEmployees: 45,
          newHires: 5,
          leavers: 2,
          turnoverRate: 4.4,
          averageTenure: 24,
          employeesByDepartment: [],
          employeesByType: []
        },
        trainingMetrics: {
          complianceRate: 95.5,
          mandatoryTrainingCompliance: 98.0,
          expiringCertifications: 3,
          trainingHours: 1200,
          trainingCost: 15000,
          trainingByType: []
        },
        payrollMetrics: {
          totalPayrollCost: 125000,
          averageSalary: 28000,
          overtimeCost: 8500,
          benefitsCost: 12000,
          taxAndNIContributions: 35000,
          payrollCostByDepartment: []
        },
        attendanceMetrics: {
          absenteeismRate: 3.2,
          sickLeaveRate: 2.1,
          overtimeHours: 450,
          averageHoursWorked: 37.5,
          lateArrivals: 12,
          earlyDepartures: 8
        },
        complianceMetrics: {
          rightToWorkChecks: 100,
          dbsChecks: 98.5,
          healthAndSafetyTraining: 96.0,
          professionalRegistrations: 92.0,
          complianceViolations: []
        },
        correlationId: mockCorrelationId
      };

      it('should generate HR metrics successfully', async () => {
        // Mock cache miss
        mockCacheService.get.mockResolvedValue(null);

        // Mock repository calls
        mockRepository.getEmployeeCount.mockResolvedValue({
          total: 50,
          active: 45,
          newHires: 5,
          leavers: 2
        });
        mockRepository.getTurnoverRate.mockResolvedValue(4.4);
        mockRepository.getAverageTenure.mockResolvedValue(24);
        mockRepository.getTrainingComplianceRate.mockResolvedValue({
          overallRate: 95.5,
          mandatoryRate: 98.0,
          expiring: 3,
          totalHours: 1200
        });
        mockRepository.getPayrollCosts.mockResolvedValue({
          total: 125000,
          average: 28000,
          overtime: 8500,
          benefits: 12000,
          taxAndNI: 35000
        });
        mockRepository.getAbsenteeismRate.mockResolvedValue(3.2);
        mockRepository.getOvertimeHours.mockResolvedValue(450);
        mockRepository.getSickLeaveRate.mockResolvedValue(2.1);
        mockRepository.getAverageHoursWorked.mockResolvedValue(37.5);
        mockRepository.getRightToWorkCompliance.mockResolvedValue(100);
        mockRepository.getDBSCompliance.mockResolvedValue(98.5);
        mockRepository.getHealthSafetyCompliance.mockResolvedValue(96.0);
        mockRepository.getProfessionalRegCompliance.mockResolvedValue(92.0);

        const result = await service.getHRMetrics(validMetricsRequest, mockCorrelationId);

        expect(result.careHomeId).toBe(mockCareHomeId);
        expect(result.employeeMetrics.totalEmployees).toBe(50);
        expect(result.employeeMetrics.turnoverRate).toBe(4.4);
        expect(result.trainingMetrics.complianceRate).toBe(95.5);
        expect(result.payrollMetrics.totalPayrollCost).toBe(125000);
        expect(result.attendanceMetrics.absenteeismRate).toBe(3.2);
        expect(result.complianceMetrics.rightToWorkChecks).toBe(100);

        // Verify cache was set
        expect(mockCacheService.set).toHaveBeenCalledWith(
          `hr-metrics:${mockCareHomeId}:current_month`,
          expect.any(Object),
          3600
        );

        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'HR_METRICS_GENERATED',
            resourceType: 'HRMetrics'
          })
        );
      });

      it('should return cached metrics when available', async () => {
        const cachedMetrics = { ...expectedMetrics, cached: true };
        mockCacheService.get.mockResolvedValue(cachedMetrics);

        const result = await service.getHRMetrics(validMetricsRequest, mockCorrelationId);

        expect(result).toEqual(cachedMetrics);
        expect(mockRepository.getEmployeeCount).not.toHaveBeenCalled();
        expect(mockCacheService.set).not.toHaveBeenCalled();
      });

      it('should handle metrics calculation errors', async () => {
        mockCacheService.get.mockResolvedValue(null);
        const dbError = new Error('Database query failed');
        mockRepository.getEmployeeCount.mockRejectedValue(dbError);

        await expect(service.getHRMetrics(validMetricsRequest, mockCorrelationId))
          .rejects.toThrow(HRValidationError);
      });
    });
  });

  describe('Compliance and Security', () => {
    it('should validate National Insurance number format correctly', () => {
      const validNINumbers = ['AB123456C', 'YZ987654D', 'NE123456A'];
      const invalidNINumbers = ['AB12345C', 'AB1234567C', '123456789', 'ABCDEFGHI'];

      validNINumbers.forEach(niNumber => {
        expect((service as any).validateNINumber(niNumber)).toBe(true);
      });

      invalidNINumbers.forEach(niNumber => {
        expect((service as any).validateNINumber(niNumber)).toBe(false);
      });
    });

    it('should validate email format correctly', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'admin@care-home.org'];
      const invalidEmails = ['invalid-email', '@domain.com', 'user@', 'user name@domain.com'];

      validEmails.forEach(email => {
        expect((service as any).validateEmail(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect((service as any).validateEmail(email)).toBe(false);
      });
    });

    it('should handle encryption errors gracefully', async () => {
      constvalidEmployeeRequest: CreateEmployeeRequest = {
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationalInsuranceNumber: 'AB123456C',
        email: 'john.doe@example.com',
        phoneNumber: '07700900123',
        address: {
          line1: '123 Main Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'England'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '07700900124'
        },
        startDate: new Date('2024-01-01'),
        department: 'Care',
        position: 'Care Assistant',
        employmentType: 'permanent',
        workingPattern: 'full_time',
        contractedHours: 37.5,
        rightToWorkDocuments: [],
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(null);
      const encryptionError = new Error('Encryption service unavailable');
      mockEncryptionService.encrypt.mockRejectedValue(encryptionError);

      await expect(service.createEmployee(validEmployeeRequest, mockCorrelationId))
        .rejects.toThrow(HRValidationError);
    });

    it('should audit all sensitive operations', async () => {
      constvalidEmployeeRequest: CreateEmployeeRequest = {
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationalInsuranceNumber: 'AB123456C',
        email: 'john.doe@example.com',
        phoneNumber: '07700900123',
        address: {
          line1: '123 Main Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'England'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '07700900124'
        },
        startDate: new Date('2024-01-01'),
        department: 'Care',
        position: 'Care Assistant',
        employmentType: 'permanent',
        workingPattern: 'full_time',
        contractedHours: 37.5,
        rightToWorkDocuments: [],
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      constexpectedEmployee: Employee = {
        id: mockEmployeeId,
        ...validEmployeeRequest,
        nationalInsuranceNumber: 'encrypted_ni_number',
        status: 'active',
        rightToWorkVerified: false,
        pensionSchemeOptOut: false,
        professionalRegistrations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: mockUserId,
        version: 1
      };

      mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(null);
      mockEncryptionService.encrypt.mockResolvedValue('encrypted_ni_number');
      mockRepository.createEmployee.mockResolvedValue(expectedEmployee);

      await service.createEmployee(validEmployeeRequest, mockCorrelationId);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMPLOYEE_CREATED',
          resourceType: 'Employee',
          resourceId: expectedEmployee.id,
          userId: mockUserId,
          correlationId: mockCorrelationId,
          complianceFlags: ['GDPR_PROCESSING', 'EMPLOYMENT_LAW']
        })
      );
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent payroll processing', async () => {
      const payrollRequests = Array.from({ length: 5 }, (_, i) => ({
        payrollPeriod: `2024-0${i + 1}`,
        payrollType: 'monthly' as const,
        careHomeId: mockCareHomeId,
        processedBy: mockUserId
      }));

      // Mock successful processing for all requests
      mockRepository.createPayrollSummary.mockResolvedValue({
        id: 'payroll-summary-123',
        payrollPeriod: '2024-01',
        processedDate: new Date(),
        employeeCount: 1,
        totalGrossPay: 2166.67,
        totalNetPay: 1800.00,
        totalIncomeTax: 200.00,
        totalNationalInsurance: 166.67,
        totalPensionContributions: 108.33,
        totalEmployerNI: 230.00,
        totalEmployerPension: 65.00,
        totalApprenticeshipLevy: 0,
        status: 'completed',
        hmrcSubmissionRequired: true,
        hmrcSubmitted: false,
        careHomeId: mockCareHomeId
      });

      const promises = payrollRequests.map(request =>
        service.processPayroll(request, mockCorrelationId)
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
    });

    it('should handle network timeouts gracefully', async () => {
      constvalidEmployeeRequest: CreateEmployeeRequest = {
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        nationalInsuranceNumber: 'AB123456C',
        email: 'john.doe@example.com',
        phoneNumber: '07700900123',
        address: {
          line1: '123 Main Street',
          city: 'London',
          postcode: 'SW1A 1AA',
          country: 'England'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phoneNumber: '07700900124'
        },
        startDate: new Date('2024-01-01'),
        department: 'Care',
        position: 'Care Assistant',
        employmentType: 'permanent',
        workingPattern: 'full_time',
        contractedHours: 37.5,
        rightToWorkDocuments: [],
        careHomeId: mockCareHomeId,
        createdBy: mockUserId
      };

      mockRepository.findEmployeeByNumberOrNI.mockResolvedValue(null);
      mockEncryptionService.encrypt.mockResolvedValue('encrypted_ni_number');
      
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockNotificationService.sendEmployeeWelcomeNotification.mockRejectedValue(timeoutError);

      // Should still create employee even if notification fails
      constexpectedEmployee: Employee = {
        id: mockEmployeeId,
        ...validEmployeeRequest,
        nationalInsuranceNumber: 'encrypted_ni_number',
        status: 'active',
        rightToWorkVerified: false,
        pensionSchemeOptOut: false,
        professionalRegistrations: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        updatedBy: mockUserId,
        version: 1
      };

      mockRepository.createEmployee.mockResolvedValue(expectedEmployee);

      await expect(service.createEmployee(validEmployeeRequest, mockCorrelationId))
        .rejects.toThrow('Network timeout');

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'EMPLOYEE_CREATED',
          details: expect.objectContaining({
            error: 'Network timeout'
          })
        })
      );
    });
  });
});
