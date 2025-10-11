/**
 * @fileoverview Unit tests for HealthcareCacheManager
 * @module HealthcareCacheManager.test
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 */

import { HealthcareCacheManager, ResidentCacheData, MedicationCacheData, CarePlanCacheData, StaffCacheData } from '../HealthcareCacheManager';
import { CacheService } from '../CacheService';
import { AuditService } from '../../audit/AuditService';

// Mock dependencies
jest.mock('../CacheService');
jest.mock('../../audit/AuditService');
jest.mock('../../../utils/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }))
}));

describe('HealthcareCacheManager', () => {
  lethealthcareCacheManager: HealthcareCacheManager;
  letmockCacheService: jest.Mocked<CacheService>;
  letmockAuditService: jest.Mocked<AuditService>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock CacheService
    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      invalidateByPattern: jest.fn(),
      invalidateByTags: jest.fn(),
      warmCache: jest.fn(),
      getStats: jest.fn(),
      checkHealth: jest.fn(),
      shutdown: jest.fn()
    } as any;

    (CacheService as jest.MockedClass<typeof CacheService>).mockImplementation(() => mockCacheService);

    // Mock AuditService
    mockAuditService = {
      log: jest.fn()
    } as any;

    (AuditService as jest.MockedClass<typeof AuditService>).mockImplementation(() => mockAuditService);

    healthcareCacheManager = new HealthcareCacheManager();
  });

  describe('cacheResident', () => {
    it('should cache resident data with PII encryption', async () => {
      constresidentData: ResidentCacheData = {
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        roomNumber: '101',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: ['diabetes'],
        allergies: ['penicillin'],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.set.mockResolvedValue(true);

      const result = await healthcareCacheManager.cacheResident(residentData);

      expect(result).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'resident:resident-123',
        residentData,
        3600,
        expect.objectContaining({
          tags: ['resident', 'personal-data'],
          containsPII: true,
          healthcareContext: 'resident-management',
          encrypt: true
        })
      );

      // Should also cache NHS number lookup
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'resident:nhs:1234567890',
        { residentId: 'resident-123' },
        3600,
        expect.objectContaining({
          containsPII: false
        })
      );
    });

    it('should handle caching failures gracefully', async () => {
      constresidentData: ResidentCacheData = {
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.set.mockResolvedValue(false);

      const result = await healthcareCacheManager.cacheResident(residentData);

      expect(result).toBe(false);
    });
  });

  describe('getResident', () => {
    it('should retrieve resident data from cache', async () => {
      constresidentData: ResidentCacheData = {
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.get.mockResolvedValue(residentData);

      const result = await healthcareCacheManager.getResident('resident-123');

      expect(result).toEqual(residentData);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'resident:resident-123',
        expect.objectContaining({
          healthcareContext: 'resident-management',
          containsPII: true
        })
      );
    });

    it('should return null when resident not found', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await healthcareCacheManager.getResident('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getResidentByNHSNumber', () => {
    it('should retrieve resident by NHS number', async () => {
      constresidentData: ResidentCacheData = {
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.get
        .mockResolvedValueOnce({ residentId: 'resident-123' })
        .mockResolvedValueOnce(residentData);

      const result = await healthcareCacheManager.getResidentByNHSNumber('1234567890');

      expect(result).toEqual(residentData);
      expect(mockCacheService.get).toHaveBeenCalledWith('resident:nhs:1234567890');
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'resident:resident-123',
        expect.objectContaining({
          healthcareContext: 'resident-management'
        })
      );
    });

    it('should return null when NHS number lookup fails', async () => {
      mockCacheService.get.mockResolvedValue(null);

      const result = await healthcareCacheManager.getResidentByNHSNumber('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('cacheMedicationSchedule', () => {
    it('should cache medication schedule with encryption', async () => {
      constmedicationData: MedicationCacheData = {
        residentId: 'resident-123',
        prescriptions: [],
        administrationRecords: [],
        nextDue: [],
        alerts: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.set.mockResolvedValue(true);

      const result = await healthcareCacheManager.cacheMedicationSchedule('resident-123', medicationData);

      expect(result).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'medication:schedule:resident-123',
        medicationData,
        1800,
        expect.objectContaining({
          tags: ['medication', 'prescription', 'mar'],
          containsPII: true,
          healthcareContext: 'medication-management',
          encrypt: true
        })
      );
    });
  });

  describe('getMedicationSchedule', () => {
    it('should retrieve medication schedule from cache', async () => {
      constmedicationData: MedicationCacheData = {
        residentId: 'resident-123',
        prescriptions: [],
        administrationRecords: [],
        nextDue: [],
        alerts: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.get.mockResolvedValue(medicationData);

      const result = await healthcareCacheManager.getMedicationSchedule('resident-123');

      expect(result).toEqual(medicationData);
      expect(mockCacheService.get).toHaveBeenCalledWith(
        'medication:schedule:resident-123',
        expect.objectContaining({
          healthcareContext: 'medication-management',
          containsPII: true
        })
      );
    });
  });

  describe('cacheCarePlan', () => {
    it('should cache care plan with encryption', async () => {
      constcarePlanData: CarePlanCacheData = {
        residentId: 'resident-123',
        carePlan: {},
        goals: [],
        assessments: [],
        reviews: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.set.mockResolvedValue(true);

      const result = await healthcareCacheManager.cacheCarePlan('resident-123', carePlanData);

      expect(result).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'care-plan:resident-123',
        carePlanData,
        7200,
        expect.objectContaining({
          tags: ['care-plan', 'assessment', 'goals'],
          containsPII: true,
          healthcareContext: 'care-planning',
          encrypt: true
        })
      );
    });
  });

  describe('cacheStaff', () => {
    it('should cache staff data with encryption', async () => {
      conststaffData: StaffCacheData = {
        id: 'staff-123',
        name: 'Jane Smith',
        role: 'nurse',
        qualifications: ['RN'],
        schedule: [],
        trainingRecords: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      };

      mockCacheService.set.mockResolvedValue(true);

      const result = await healthcareCacheManager.cacheStaff(staffData);

      expect(result).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'staff:staff-123',
        staffData,
        3600,
        expect.objectContaining({
          tags: ['staff', 'schedule', 'training'],
          containsPII: true,
          healthcareContext: 'hr-management',
          encrypt: true
        })
      );
    });
  });

  describe('cacheReport', () => {
    it('should cache report data without encryption', async () => {
      const reportData = {
        reportId: 'report-123',
        data: { summary: 'test' },
        generatedAt: '2025-01-01T10:00:00Z'
      };

      mockCacheService.set.mockResolvedValue(true);

      const result = await healthcareCacheManager.cacheReport('report-123', reportData);

      expect(result).toBe(true);
      expect(mockCacheService.set).toHaveBeenCalledWith(
        'report:report-123',
        reportData,
        1800,
        expect.objectContaining({
          tags: ['report', 'analytics', 'dashboard'],
          containsPII: false,
          healthcareContext: 'reporting',
          encrypt: false
        })
      );
    });
  });

  describe('invalidateByHealthcareContext', () => {
    it('should invalidate cache by healthcare context', async () => {
      mockCacheService.invalidateByPattern.mockResolvedValue(5);

      const result = await healthcareCacheManager.invalidateByHealthcareContext('resident-management', 'data update');

      expect(result).toBe(5);
      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledWith(
        'resident:*',
        'resident-management'
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_INVALIDATE_CONTEXT',
          resourceId: 'resident-management'
        })
      );
    });
  });

  describe('invalidateResidentData', () => {
    it('should invalidate all resident-related cache data', async () => {
      mockCacheService.invalidateByPattern
        .mockResolvedValueOnce(2) // resident pattern
        .mockResolvedValueOnce(1) // medication pattern
        .mockResolvedValueOnce(1) // care-plan pattern
        .mockResolvedValueOnce(1); // assessment pattern

      const result = await healthcareCacheManager.invalidateResidentData('resident-123', 'resident update');

      expect(result).toBe(5);
      expect(mockCacheService.invalidateByPattern).toHaveBeenCalledTimes(4);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CACHE_INVALIDATE_RESIDENT',
          resourceId: 'resident-123'
        })
      );
    });
  });

  describe('warmHealthcareCache', () => {
    it('should warm cache with healthcare data', async () => {
      constresidents: ResidentCacheData[] = [{
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      }];

      conststaff: StaffCacheData[] = [{
        id: 'staff-123',
        name: 'Jane Smith',
        role: 'nurse',
        qualifications: ['RN'],
        schedule: [],
        trainingRecords: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      }];

      mockCacheService.set.mockResolvedValue(true);

      const result = await healthcareCacheManager.warmHealthcareCache({
        residents,
        staff
      });

      expect(result).toEqual({ total: 2, successful: 2 });
      expect(mockCacheService.set).toHaveBeenCalledTimes(4); // 2 for resident (main + NHS lookup), 1 for staff, 1 for NHS lookup
    });

    it('should handle partial failures during cache warming', async () => {
      constresidents: ResidentCacheData[] = [{
        id: 'resident-123',
        firstName: 'John',
        lastName: 'Doe',
        nhsNumber: '1234567890',
        dateOfBirth: '1950-01-01',
        careLevel: 'residential',
        admissionDate: '2024-01-01',
        emergencyContacts: [],
        medicalConditions: [],
        allergies: [],
        lastUpdated: '2025-01-01T10:00:00Z'
      }];

      mockCacheService.set
        .mockResolvedValueOnce(true)  // resident main cache
        .mockResolvedValueOnce(false); // NHS lookup cache fails

      const result = await healthcareCacheManager.warmHealthcareCache({
        residents
      });

      expect(result).toEqual({ total: 1, successful: 1 });
    });
  });

  describe('getHealthcareStats', () => {
    it('should return healthcare-specific cache statistics', async () => {
      const baseStats = {
        hits: 100,
        misses: 20,
        hitRate: 83.33,
        totalOperations: 120,
        memoryUsage: 1048576,
        connectedClients: 5,
        keyspaceHits: 100,
        keyspaceMisses: 20
      };

      mockCacheService.getStats.mockResolvedValue(baseStats);
      
      // Mock Redis keys method through the cache service
      const mockRedis = { keys: jest.fn() };
      (healthcareCacheManager as any).cacheService.redis = mockRedis;
      
      mockRedis.keys
        .mockResolvedValueOnce(['resident:123', 'resident:456'])
        .mockResolvedValueOnce(['medication:schedule:123'])
        .mockResolvedValueOnce(['care-plan:123'])
        .mockResolvedValueOnce(['staff:123', 'staff:456'])
        .mockResolvedValueOnce(['assessment:123'])
        .mockResolvedValueOnce(['compliance:report:123'])
        .mockResolvedValueOnce(['financial:billing:123'])
        .mockResolvedValueOnce(['report:dashboard:123']);

      const result = await healthcareCacheManager.getHealthcareStats();

      expect(result).toEqual(
        expect.objectContaining({
          ...baseStats,
          healthcarePatterns: expect.objectContaining({
            resident: expect.objectContaining({
              keyCount: 2,
              pattern: 'resident',
              healthcareContext: 'resident-management'
            }),
            medication: expect.objectContaining({
              keyCount: 1,
              healthcareContext: 'medication-management'
            })
          }),
          totalPatterns: 8
        })
      );
    });
  });

  describe('shutdown', () => {
    it('should gracefully shutdown cache service', async () => {
      mockCacheService.shutdown.mockResolvedValue();

      await healthcareCacheManager.shutdown();

      expect(mockCacheService.shutdown).toHaveBeenCalled();
    });
  });
});
