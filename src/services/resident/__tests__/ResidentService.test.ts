/**
 * @fileoverview Unit tests for ResidentService
 * @module ResidentService.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { ResidentService, Resident, AdmissionData, DischargeData, TransferData } from '../ResidentService';
import { Pool, PoolClient } from 'pg';
import { EncryptionService } from '../../../utils/encryption';
import { AuditService } from '../../audit/AuditService';
import { EventStoreService } from '../../event-store/EventStoreService';
import { HealthcareCacheManager } from '../../caching/HealthcareCacheManager';

// Mock dependencies
jest.mock('pg');
jest.mock('../../../utils/encryption');
jest.mock('../../audit/AuditService');
jest.mock('../../event-store/EventStoreService');
jest.mock('../../caching/HealthcareCacheManager');
jest.mock('../../../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('ResidentService', () => {
  let residentService: ResidentService;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: jest.Mocked<PoolClient>;
  let mockEncryptionService: jest.Mocked<EncryptionService>;
  let mockAuditService: jest.Mocked<AuditService>;
  let mockEventStoreService: jest.Mocked<EventStoreService>;
  let mockCacheManager: jest.Mocked<HealthcareCacheManager>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock PoolClient
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    } as any;

    // Mock Pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      end: jest.fn(),
      on: jest.fn()
    } as any;

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool);

    // Mock EncryptionService
    mockEncryptionService = {
      encrypt: jest.fn(),
      decrypt: jest.fn()
    } as any;

    (EncryptionService as jest.MockedClass<typeof EncryptionService>).mockImplementation(() => mockEncryptionService);

    // Mock AuditService
    mockAuditService = {
      log: jest.fn()
    } as any;

    (AuditService as jest.MockedClass<typeof AuditService>).mockImplementation(() => mockAuditService);

    // Mock EventStoreService
    mockEventStoreService = {
      appendEvent: jest.fn()
    } as any;

    (EventStoreService as jest.MockedClass<typeof EventStoreService>).mockImplementation(() => mockEventStoreService);

    // Mock HealthcareCacheManager
    mockCacheManager = {
      cacheResident: jest.fn(),
      getResident: jest.fn(),
      getResidentByNHSNumber: jest.fn(),
      invalidateResidentData: jest.fn(),
      shutdown: jest.fn()
    } as any;

    (HealthcareCacheManager as jest.MockedClass<typeof HealthcareCacheManager>).mockImplementation(() => mockCacheManager);

    residentService = new ResidentService();
  });

  describe('createResident', () => {
    it('should create resident with valid data', async () => {
      const residentData = {
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: new Date('1950-01-01'),
        gender: 'male' as const,
        careLevel: 'residential' as const,
        status: 'discharged' as const,
        medicalConditions: ['diabetes'],
        allergies: ['penicillin'],
        dietaryRequirements: [],
        mobilityAids: [],
        communicationNeeds: [],
        emergencyContacts: [],
        createdBy: 'user-123',
        updatedBy: 'user-123'
      };

      const mockDbRow = {
        id: 'resident-123',
        first_name: 'encrypted-john',
        last_name: 'encrypted-doe',
        nhs_number: 'encrypted-nhs',
        date_of_birth: '1950-01-01',
        gender: 'male',
        care_level: 'residential',
        status: 'discharged',
        medical_conditions: '["diabetes"]',
        allergies: '["penicillin"]',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'user-123',
        updated_by: 'user-123'
      };

      mockEncryptionService.encrypt
        .mockResolvedValueOnce('encrypted-john')
        .mockResolvedValueOnce('encrypted-doe')
        .mockResolvedValueOnce('encrypted-nhs');

      mockEncryptionService.decrypt
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('Doe')
        .mockResolvedValueOnce('9434765919');

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check for existing NHS number
        .mockResolvedValueOnce({ rows: [mockDbRow] }); // Insert resident

      mockCacheManager.cacheResident.mockResolvedValue(true);

      const result = await residentService.createResident(residentData, 'user-123');

      expect(result).toEqual(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          nhsNumber: '9434765919',
          careLevel: 'residential'
        })
      );

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockEventStoreService.appendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ResidentCreated'
        })
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESIDENT_CREATED'
        })
      );
    });

    it('should reject invalid NHS number', async () => {
      const residentData = {
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890', // Invalid NHS number
        dateOfBirth: new Date('1950-01-01'),
        gender: 'male' as const,
        careLevel: 'residential' as const,
        status: 'discharged' as const,
        medicalConditions: [],
        allergies: [],
        dietaryRequirements: [],
        mobilityAids: [],
        communicationNeeds: [],
        emergencyContacts: [],
        createdBy: 'user-123',
        updatedBy: 'user-123'
      };

      await expect(residentService.createResident(residentData, 'user-123'))
        .rejects.toThrow('Invalid NHS number format');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject duplicate NHS number', async () => {
      const residentData = {
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: new Date('1950-01-01'),
        gender: 'male' as const,
        careLevel: 'residential' as const,
        status: 'discharged' as const,
        medicalConditions: [],
        allergies: [],
        dietaryRequirements: [],
        mobilityAids: [],
        communicationNeeds: [],
        emergencyContacts: [],
        createdBy: 'user-123',
        updatedBy: 'user-123'
      };

      // Mock existing resident found
      mockCacheManager.getResidentByNHSNumber.mockResolvedValue({
        id: 'existing-resident',
        firstName: 'Jane',
        lastName: 'Smith',
        nhsNumber: '9434765919',
        dateOfBirth: '1960-01-01',
        careLevel: 'residential',
        admissionDate: '',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      await expect(residentService.createResident(residentData, 'user-123'))
        .rejects.toThrow('Resident with this NHS number already exists');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getResidentById', () => {
    it('should return resident from cache if available', async () => {
      const cachedResident = {
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '',
        emergencyContacts: [],
        medicalConditions: ['diabetes'],
        allergies: ['penicillin'],
        lastUpdated: new Date().toISOString()
      };

      mockCacheManager.getResident.mockResolvedValue(cachedResident);

      const result = await residentService.getResidentById('resident-123', 'user-123');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'resident-123',
          firstName: 'John',
          lastName: 'Doe'
        })
      );

      expect(mockCacheManager.getResident).toHaveBeenCalledWith('resident-123');
      expect(mockPool.query).not.toHaveBeenCalled();
    });

    it('should query database when not in cache', async () => {
      const mockDbRow = {
        id: 'resident-123',
        first_name: 'encrypted-john',
        last_name: 'encrypted-doe',
        nhs_number: 'encrypted-nhs',
        date_of_birth: '1950-01-01',
        gender: 'male',
        care_level: 'residential',
        status: 'admitted',
        medical_conditions: '["diabetes"]',
        allergies: '["penicillin"]',
        created_at: new Date(),
        updated_at: new Date(),
        emergency_contacts: []
      };

      mockCacheManager.getResident.mockResolvedValue(null);
      mockPool.query.mockResolvedValue({ rows: [mockDbRow] });
      
      mockEncryptionService.decrypt
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('Doe')
        .mockResolvedValueOnce('9434765919');

      mockCacheManager.cacheResident.mockResolvedValue(true);

      const result = await residentService.getResidentById('resident-123', 'user-123');

      expect(result).toEqual(
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          nhsNumber: '9434765919'
        })
      );

      expect(mockPool.query).toHaveBeenCalled();
      expect(mockCacheManager.cacheResident).toHaveBeenCalled();
    });

    it('should return null when resident not found', async () => {
      mockCacheManager.getResident.mockResolvedValue(null);
      mockPool.query.mockResolvedValue({ rows: [] });

      const result = await residentService.getResidentById('nonexistent', 'user-123');

      expect(result).toBeNull();
    });
  });

  describe('admitResident', () => {
    it('should admit resident successfully', async () => {
      const admissionData: AdmissionData = {
        admissionDate: new Date(),
        careLevel: 'residential',
        roomNumber: '101',
        admissionReason: 'Long-term care needed',
        referralSource: 'Hospital',
        fundingType: 'private',
        riskAssessments: [],
        admittedBy: 'user-123'
      };

      const existingResident = {
        id: 'resident-123',
        status: 'discharged'
      } as Resident;

      // Mock getting existing resident
      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      // Mock room availability check
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Room availability check
        .mockResolvedValueOnce({ rows: [] }) // Update resident
        .mockResolvedValueOnce({ rows: [] }); // Insert admission record

      await residentService.admitResident('resident-123', admissionData);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockEventStoreService.appendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ResidentAdmitted'
        })
      );
      expect(mockCacheManager.invalidateResidentData).toHaveBeenCalledWith('resident-123', 'resident admitted');
    });

    it('should reject admission if resident already admitted', async () => {
      const admissionData: AdmissionData = {
        admissionDate: new Date(),
        careLevel: 'residential',
        roomNumber: '101',
        admissionReason: 'Long-term care needed',
        referralSource: 'Hospital',
        fundingType: 'private',
        riskAssessments: [],
        admittedBy: 'user-123'
      };

      // Mock resident already admitted
      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      // Mock the service's internal method to return admitted status
      jest.spyOn(residentService as any, 'mapCacheDataToResident').mockReturnValue({
        status: 'admitted'
      });

      await expect(residentService.admitResident('resident-123', admissionData))
        .rejects.toThrow('Resident is already admitted');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject admission if room is occupied', async () => {
      const admissionData: AdmissionData = {
        admissionDate: new Date(),
        careLevel: 'residential',
        roomNumber: '101',
        admissionReason: 'Long-term care needed',
        referralSource: 'Hospital',
        fundingType: 'private',
        riskAssessments: [],
        admittedBy: 'user-123'
      };

      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      jest.spyOn(residentService as any, 'mapCacheDataToResident').mockReturnValue({
        status: 'discharged'
      });

      // Mock room occupied
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'other-resident' }] });

      await expect(residentService.admitResident('resident-123', admissionData))
        .rejects.toThrow('Room is already occupied');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('dischargeResident', () => {
    it('should discharge resident successfully', async () => {
      const dischargeData: DischargeData = {
        dischargeDate: new Date(),
        dischargeReason: 'Moved to family home',
        dischargeDestination: 'Family home',
        followUpRequired: true,
        followUpDetails: 'GP follow-up in 2 weeks',
        dischargedBy: 'user-123'
      };

      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      jest.spyOn(residentService as any, 'mapCacheDataToResident').mockReturnValue({
        status: 'admitted'
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Update resident
        .mockResolvedValueOnce({ rows: [] }); // Insert discharge record

      await residentService.dischargeResident('resident-123', dischargeData);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockEventStoreService.appendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ResidentDischarged'
        })
      );
      expect(mockCacheManager.invalidateResidentData).toHaveBeenCalledWith('resident-123', 'resident discharged');
    });

    it('should reject discharge if resident not admitted', async () => {
      const dischargeData: DischargeData = {
        dischargeDate: new Date(),
        dischargeReason: 'Moved to family home',
        dischargeDestination: 'Family home',
        followUpRequired: false,
        dischargedBy: 'user-123'
      };

      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      jest.spyOn(residentService as any, 'mapCacheDataToResident').mockReturnValue({
        status: 'discharged'
      });

      await expect(residentService.dischargeResident('resident-123', dischargeData))
        .rejects.toThrow('Resident is not currently admitted');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('transferResident', () => {
    it('should transfer resident successfully', async () => {
      const transferData: TransferData = {
        transferDate: new Date(),
        fromRoom: '101',
        toRoom: '102',
        transferReason: 'Better room available',
        newCareLevel: 'nursing',
        transferredBy: 'user-123'
      };

      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        roomNumber: '101',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      jest.spyOn(residentService as any, 'mapCacheDataToResident').mockReturnValue({
        status: 'admitted',
        roomNumber: '101'
      });

      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // Check destination room availability
        .mockResolvedValueOnce({ rows: [] }) // Update resident
        .mockResolvedValueOnce({ rows: [] }); // Insert transfer record

      await residentService.transferResident('resident-123', transferData);

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockEventStoreService.appendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'ResidentTransferred'
        })
      );
      expect(mockCacheManager.invalidateResidentData).toHaveBeenCalledWith('resident-123', 'resident transferred');
    });

    it('should reject transfer if destination room occupied', async () => {
      const transferData: TransferData = {
        transferDate: new Date(),
        fromRoom: '101',
        toRoom: '102',
        transferReason: 'Better room available',
        transferredBy: 'user-123'
      };

      mockCacheManager.getResident.mockResolvedValue({
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '9434765919',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        roomNumber: '101',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: new Date().toISOString()
      });

      jest.spyOn(residentService as any, 'mapCacheDataToResident').mockReturnValue({
        status: 'admitted',
        roomNumber: '101'
      });

      // Mock destination room occupied
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'other-resident' }] });

      await expect(residentService.transferResident('resident-123', transferData))
        .rejects.toThrow('Destination room is already occupied');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('validateNHSNumber', () => {
    it('should validate correct NHS numbers', () => {
      const validNHSNumbers = ['9434765919', '9434765870'];
      
      for (const nhsNumber of validNHSNumbers) {
        const result = (residentService as any).validateNHSNumber(nhsNumber);
        expect(result).toBe(true);
      }
    });

    it('should reject invalid NHS numbers', () => {
      const invalidNHSNumbers = ['123456789', '12345678901', 'abcdefghij', '9434765918'];
      
      for (const nhsNumber of invalidNHSNumbers) {
        const result = (residentService as any).validateNHSNumber(nhsNumber);
        expect(result).toBe(false);
      }
    });

    it('should handle NHS numbers with spaces and hyphens', () => {
      const nhsWithSpaces = '943 476 5919';
      const nhsWithHyphens = '943-476-5919';
      
      const result1 = (residentService as any).validateNHSNumber(nhsWithSpaces);
      const result2 = (residentService as any).validateNHSNumber(nhsWithHyphens);
      
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('searchResidents', () => {
    it('should search residents with pagination', async () => {
      const searchCriteria = {
        name: 'John',
        careLevel: 'residential',
        page: 1,
        limit: 10
      };

      const mockCountResult = { rows: [{ total: '25' }] };
      const mockSearchResult = {
        rows: [
          {
            id: 'resident-123',
            first_name: 'encrypted-john',
            last_name: 'encrypted-doe',
            nhs_number: 'encrypted-nhs',
            care_level: 'residential',
            status: 'admitted',
            created_at: new Date(),
            updated_at: new Date(),
            emergency_contacts: []
          }
        ]
      };

      mockPool.query
        .mockResolvedValueOnce(mockCountResult)
        .mockResolvedValueOnce(mockSearchResult);

      mockEncryptionService.decrypt
        .mockResolvedValueOnce('John')
        .mockResolvedValueOnce('Doe')
        .mockResolvedValueOnce('9434765919');

      const result = await residentService.searchResidents(searchCriteria, 'user-123');

      expect(result).toEqual(
        expect.objectContaining({
          totalCount: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
          residents: expect.arrayContaining([
            expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe'
            })
          ])
        })
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'RESIDENTS_SEARCHED'
        })
      );
    });
  });

  describe('shutdown', () => {
    it('should gracefully shutdown all connections', async () => {
      await residentService.shutdown();

      expect(mockPool.end).toHaveBeenCalled();
      expect(mockCacheManager.shutdown).toHaveBeenCalled();
    });
  });
});