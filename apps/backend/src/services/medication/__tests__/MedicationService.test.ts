/**
 * @fileoverview Comprehensive tests for Medication Service
 * @module MedicationServiceTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Complete test suite for medication service with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - Controlled Drugs Regulations 2001
 * - NICE Guidelines for Medication Management
 */

import { DataSource, Repository } from 'typeorm';
import { MedicationService, CreateMedicationRequest, CreatePrescriptionRequest, MedicationAdministrationRequest } from '../MedicationService';
import { Medication, MedicationType, MedicationForm, MedicationRoute } from '../../../entities/medication/Medication';
import { Prescription, PrescriptionStatus } from '../../../entities/medication/Prescription';
import { MedicationAdministration, AdministrationStatus } from '../../../entities/medication/MedicationAdministration';
import { DrugInteraction, InteractionSeverity } from '../../../entities/medication/DrugInteraction';
import { ControlledSubstance, ControlledSubstanceSchedule } from '../../../entities/medication/ControlledSubstance';
import { Resident } from '../../../entities/resident/Resident';
import { MedicationRepository } from '../../../repositories/medication/MedicationRepository';
import { PrescriptionRepository } from '../../../repositories/medication/PrescriptionRepository';
import { MedicationAdministrationRepository } from '../../../repositories/medication/MedicationAdministrationRepository';
import { AuditTrailService } from '../../audit/AuditTrailService';
import { FieldLevelEncryptionService } from '../../encryption/FieldLevelEncryptionService';
import { NotificationService } from '../../notifications/NotificationService';
import { EventPublishingService } from '../../events/EventPublishingService';
import { HealthcareCacheManager } from '../../caching/HealthcareCacheManager';

// Mock dependencies
jest.mock('../../../repositories/medication/MedicationRepository');
jest.mock('../../../repositories/medication/PrescriptionRepository');
jest.mock('../../../repositories/medication/MedicationAdministrationRepository');
jest.mock('../../audit/AuditTrailService');
jest.mock('../../encryption/FieldLevelEncryptionService');
jest.mock('../../notifications/NotificationService');
jest.mock('../../events/EventPublishingService');
jest.mock('../../caching/HealthcareCacheManager');

describe('MedicationService', () => {
  let service: MedicationService;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockMedicationRepository: jest.Mocked<MedicationRepository>;
  let mockPrescriptionRepository: jest.Mocked<PrescriptionRepository>;
  let mockAdministrationRepository: jest.Mocked<MedicationAdministrationRepository>;
  let mockResidentRepository: jest.Mocked<Repository<Resident>>;
  let mockDrugInteractionRepository: jest.Mocked<Repository<DrugInteraction>>;
  let mockControlledSubstanceRepository: jest.Mocked<Repository<ControlledSubstance>>;
  let mockAuditService: jest.Mocked<AuditTrailService>;
  let mockEncryptionService: jest.Mocked<FieldLevelEncryptionService>;
  let mockNotificationService: jest.Mocked<NotificationService>;
  let mockEventPublisher: jest.Mocked<EventPublishingService>;
  let mockCacheManager: jest.Mocked<HealthcareCacheManager>;

  const mockResident = {
    id: 'resident-123',
    firstName: 'John',
    lastName: 'Doe',
    nhsNumber: '1234567890',
    dateOfBirth: new Date('1950-01-01'),
    deletedAt: null
  } as Resident;

  const mockMedication = {
    id: 'medication-123',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    strength: '500mg',
    form: MedicationForm.TABLET,
    route: MedicationRoute.ORAL,
    type: MedicationType.ANALGESIC,
    activeIngredient: 'Paracetamol',
    isControlledSubstance: false,
    isActive: true,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Medication;

  const mockControlledMedication = {
    id: 'medication-456',
    name: 'Morphine',
    genericName: 'Morphine Sulfate',
    strength: '10mg',
    form: MedicationForm.TABLET,
    route: MedicationRoute.ORAL,
    type: MedicationType.OPIOID,
    activeIngredient: 'Morphine',
    isControlledSubstance: true,
    controlledSubstanceSchedule: ControlledSubstanceSchedule.SCHEDULE_II,
    isActive: true,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date()
  } as Medication;

  const mockPrescription = {
    id: 'prescription-123',
    residentId: 'resident-123',
    medicationId: 'medication-123',
    prescriberId: 'prescriber-123',
    prescriberName: 'Dr. Smith',
    dosage: 500,
    dosageUnit: 'mg',
    frequency: 'twice daily',
    route: MedicationRoute.ORAL,
    startDate: new Date('2025-01-01'),
    status: PrescriptionStatus.ACTIVE,
    createdBy: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    medication: mockMedication
  } as Prescription;

  const mockAdministration = {
    id: 'administration-123',
    prescriptionId: 'prescription-123',
    residentId: 'resident-123',
    medicationId: 'medication-123',
    scheduledTime: new Date('2025-01-01T08:00:00Z'),
    administeredTime: new Date('2025-01-01T08:05:00Z'),
    dosageGiven: 500,
    administeredBy: 'nurse-123',
    status: AdministrationStatus.ADMINISTERED,
    createdAt: new Date(),
    updatedAt: new Date(),
    medication: mockMedication
  } as MedicationAdministration;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock repositories
    mockMedicationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      findByName: jest.fn(),
      findControlledSubstances: jest.fn()
    } as unknown as jest.Mocked<MedicationRepository>;

    mockPrescriptionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      update: jest.fn(),
      findActiveByResidentId: jest.fn(),
      findByMedicationId: jest.fn(),
      findExpiring: jest.fn()
    } as unknown as jest.Mocked<PrescriptionRepository>;

    mockAdministrationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      findByResidentAndDateRange: jest.fn(),
      findControlledSubstanceAdministrations: jest.fn(),
      findMissedDoses: jest.fn()
    } as unknown as jest.Mocked<MedicationAdministrationRepository>;

    mockResidentRepository = {
      findOne: jest.fn()
    } as unknown as jest.Mocked<Repository<Resident>>;

    mockDrugInteractionRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<Repository<DrugInteraction>>;

    mockControlledSubstanceRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn()
    } as unknown as jest.Mocked<Repository<ControlledSubstance>>;

    // Create mock services
    mockAuditService = {
      log: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<AuditTrailService>;

    mockEncryptionService = {
      encrypt: jest.fn().mockImplementation((data: string) => Promise.resolve(`encrypted_${data}`)),
      decrypt: jest.fn().mockImplementation((data: string) => Promise.resolve(data.replace('encrypted_', '')))
    } as unknown as jest.Mocked<FieldLevelEncryptionService>;

    mockNotificationService = {
      sendNotification: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<NotificationService>;

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined)
    } as unknown as jest.Mocked<EventPublishingService>;

    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      invalidatePattern: jest.fn()
    } as unknown as jest.Mocked<HealthcareCacheManager>;

    // Create mock data source
    mockDataSource = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Resident) return mockResidentRepository;
        if (entity === DrugInteraction) return mockDrugInteractionRepository;
        if (entity === ControlledSubstance) return mockControlledSubstanceRepository;
        return mockMedicationRepository;
      })
    } as unknown as jest.Mocked<DataSource>;

    // Create service instance
    service = new MedicationService(
      mockDataSource,
      mockAuditService,
      mockEncryptionService,
      mockNotificationService,
      mockEventPublisher,
      mockCacheManager
    );

    // Override repository properties
    (service as any).medicationRepository = mockMedicationRepository;
    (service as any).prescriptionRepository = mockPrescriptionRepository;
    (service as any).administrationRepository = mockAdministrationRepository;
  });

  describe('createMedication', () => {
    const createRequest: CreateMedicationRequest = {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      strength: '500mg',
      form: MedicationForm.TABLET,
      route: MedicationRoute.ORAL,
      type: MedicationType.ANALGESIC,
      activeIngredient: 'Paracetamol',
      isControlledSubstance: false,
      createdBy: 'user-123'
    };

    it('should create medication successfully', async () => {
      // Arrange
      mockMedicationRepository.create.mockResolvedValue(mockMedication);

      // Act
      const result = await service.createMedication(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockMedicationRepository.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_CREATED',
          resourceType: 'Medication',
          userId: 'user-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'medication.created',
        expect.objectContaining({
          name: 'Paracetamol',
          type: MedicationType.ANALGESIC,
          isControlledSubstance: false,
          createdBy: 'user-123'
        })
      );
      expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('medications:*');
    });

    it('should create controlled substance medication with schedule', async () => {
      // Arrange
      const controlledRequest = {
        ...createRequest,
        name: 'Morphine',
        isControlledSubstance: true,
        controlledSubstanceSchedule: ControlledSubstanceSchedule.SCHEDULE_II
      };
      mockMedicationRepository.create.mockResolvedValue(mockControlledMedication);
      mockControlledSubstanceRepository.save.mockResolvedValue({} as any);

      // Act
      const result = await service.createMedication(controlledRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockControlledSubstanceRepository.save).toHaveBeenCalled();
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'medication.created',
        expect.objectContaining({
          isControlledSubstance: true
        })
      );
    });

    it('should throw error for controlled substance without schedule', async () => {
      // Arrange
      const invalidRequest = {
        ...createRequest,
        isControlledSubstance: true
        // Missing controlledSubstanceSchedule
      };

      // Act & Assert
      await expect(service.createMedication(invalidRequest)).rejects.toThrow(
        'Controlled substance schedule is required for controlled substances'
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_CREATE_FAILED'
        })
      );
    });

    it('should encrypt sensitive medication data', async () => {
      // Arrange
      const requestWithSensitiveData = {
        ...createRequest,
        sideEffects: ['nausea', 'dizziness'],
        contraindications: ['pregnancy', 'liver disease']
      };
      mockMedicationRepository.create.mockResolvedValue(mockMedication);

      // Act
      await service.createMedication(requestWithSensitiveData);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('nausea');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('dizziness');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('pregnancy');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('liver disease');
    });
  });

  describe('createPrescription', () => {
    const createRequest: CreatePrescriptionRequest = {
      residentId: 'resident-123',
      medicationId: 'medication-123',
      prescriberId: 'prescriber-123',
      prescriberName: 'Dr. Smith',
      dosage: 500,
      dosageUnit: 'mg',
      frequency: 'twice daily',
      route: MedicationRoute.ORAL,
      startDate: new Date('2025-01-01'),
      createdBy: 'user-123'
    };

    it('should create prescription successfully', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([]);
      mockPrescriptionRepository.create.mockResolvedValue(mockPrescription);

      // Act
      const result = await service.createPrescription(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockResidentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'resident-123', deletedAt: null }
      });
      expect(mockMedicationRepository.findById).toHaveBeenCalledWith('medication-123');
      expect(mockPrescriptionRepository.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PRESCRIPTION_CREATED',
          resourceType: 'Prescription',
          userId: 'user-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'prescription.created',
        expect.objectContaining({
          residentId: 'resident-123',
          medicationId: 'medication-123',
          createdBy: 'user-123'
        })
      );
    });

    it('should throw error when resident not found', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPrescription(createRequest)).rejects.toThrow(
        'Resident with ID resident-123 not found'
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'PRESCRIPTION_CREATE_FAILED'
        })
      );
    });

    it('should throw error when medication not found', async () => {
      // Arrange
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockMedicationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPrescription(createRequest)).rejects.toThrow(
        'Medication with ID medication-123 not found'
      );
    });

    it('should check for drug interactions', async () => {
      // Arrange
      const existingPrescription = { ...mockPrescription, medicationId: 'medication-456' };
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([existingPrescription]);
      mockDrugInteractionRepository.findOne.mockResolvedValue({
        medication1Id: 'medication-123',
        medication2Id: 'medication-456',
        severity: InteractionSeverity.MODERATE,
        description: 'Moderate interaction',
        clinicalEffect: 'Increased sedation',
        management: 'Monitor closely'
      } as DrugInteraction);
      mockMedicationRepository.findById
        .mockResolvedValueOnce(mockMedication)
        .mockResolvedValueOnce({ ...mockMedication, id: 'medication-456', name: 'Aspirin' });
      mockPrescriptionRepository.create.mockResolvedValue(mockPrescription);

      // Act
      const result = await service.createPrescription(createRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockDrugInteractionRepository.findOne).toHaveBeenCalled();
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'drug_interaction_detected'
        })
      );
    });

    it('should prevent prescription creation for severe drug interactions', async () => {
      // Arrange
      const existingPrescription = { ...mockPrescription, medicationId: 'medication-456' };
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([existingPrescription]);
      mockDrugInteractionRepository.findOne.mockResolvedValue({
        medication1Id: 'medication-123',
        medication2Id: 'medication-456',
        severity: InteractionSeverity.SEVERE,
        description: 'Severe interaction',
        clinicalEffect: 'Life-threatening',
        management: 'Contraindicated'
      } as DrugInteraction);
      mockMedicationRepository.findById
        .mockResolvedValueOnce(mockMedication)
        .mockResolvedValueOnce({ ...mockMedication, id: 'medication-456', name: 'Warfarin' });

      // Act & Assert
      await expect(service.createPrescription(createRequest)).rejects.toThrow(
        'Severe drug interactions detected. Prescription cannot be created without pharmacist review.'
      );
    });

    it('should encrypt sensitive prescription data', async () => {
      // Arrange
      const requestWithSensitiveData = {
        ...createRequest,
        instructions: 'Take with food',
        indication: 'Pain management'
      };
      mockResidentRepository.findOne.mockResolvedValue(mockResident);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([]);
      mockPrescriptionRepository.create.mockResolvedValue(mockPrescription);

      // Act
      await service.createPrescription(requestWithSensitiveData);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Take with food');
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Pain management');
    });
  });

  describe('administerMedication', () => {
    const adminRequest: MedicationAdministrationRequest = {
      prescriptionId: 'prescription-123',
      residentId: 'resident-123',
      scheduledTime: new Date('2025-01-01T08:00:00Z'),
      dosageGiven: 500,
      administeredBy: 'nurse-123',
      notes: 'Patient tolerated well'
    };

    it('should administer medication successfully', async () => {
      // Arrange
      mockPrescriptionRepository.findById.mockResolvedValue(mockPrescription);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockAdministrationRepository.create.mockResolvedValue(mockAdministration);

      // Act
      const result = await service.administerMedication(adminRequest);

      // Assert
      expect(result).toBeDefined();
      expect(mockPrescriptionRepository.findById).toHaveBeenCalledWith('prescription-123');
      expect(mockMedicationRepository.findById).toHaveBeenCalledWith('medication-123');
      expect(mockAdministrationRepository.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_ADMINISTERED',
          resourceType: 'MedicationAdministration',
          userId: 'nurse-123'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'medication.administered',
        expect.objectContaining({
          residentId: 'resident-123',
          administeredBy: 'nurse-123'
        })
      );
    });

    it('should throw error when prescription not found', async () => {
      // Arrange
      mockPrescriptionRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.administerMedication(adminRequest)).rejects.toThrow(
        'Prescription with ID prescription-123 not found'
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_ADMINISTRATION_FAILED'
        })
      );
    });

    it('should throw error for inactive prescription', async () => {
      // Arrange
      const inactivePrescription = { ...mockPrescription, status: PrescriptionStatus.DISCONTINUED };
      mockPrescriptionRepository.findById.mockResolvedValue(inactivePrescription);

      // Act & Assert
      await expect(service.administerMedication(adminRequest)).rejects.toThrow(
        'Cannot administer medication for inactive prescription'
      );
    });

    it('should require witness for controlled substances', async () => {
      // Arrange
      mockPrescriptionRepository.findById.mockResolvedValue({
        ...mockPrescription,
        medicationId: 'medication-456'
      });
      mockMedicationRepository.findById.mockResolvedValue(mockControlledMedication);

      // Act & Assert
      await expect(service.administerMedication(adminRequest)).rejects.toThrow(
        'Witness is required for controlled substance administration'
      );
    });

    it('should handle controlled substance administration with witness', async () => {
      // Arrange
      const controlledAdminRequest = {
        ...adminRequest,
        witnessId: 'witness-123'
      };
      const controlledPrescription = {
        ...mockPrescription,
        medicationId: 'medication-456'
      };
      mockPrescriptionRepository.findById.mockResolvedValue(controlledPrescription);
      mockMedicationRepository.findById.mockResolvedValue(mockControlledMedication);
      mockAdministrationRepository.create.mockResolvedValue({
        ...mockAdministration,
        witnessId: 'witness-123'
      });

      // Act
      const result = await service.administerMedication(controlledAdminRequest);

      // Assert
      expect(result).toBeDefined();
      expect(result.witnessId).toBe('witness-123');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            isControlledSubstance: true,
            witnessId: 'witness-123'
          })
        })
      );
    });

    it('should encrypt sensitive administration data', async () => {
      // Arrange
      mockPrescriptionRepository.findById.mockResolvedValue(mockPrescription);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockAdministrationRepository.create.mockResolvedValue(mockAdministration);

      // Act
      await service.administerMedication(adminRequest);

      // Assert
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith('Patient tolerated well');
    });

    it('should send notification for late administration', async () => {
      // Arrange
      const lateAdminRequest = {
        ...adminRequest,
        scheduledTime: new Date('2025-01-01T08:00:00Z')
      };
      const lateAdministration = {
        ...mockAdministration,
        scheduledTime: new Date('2025-01-01T08:00:00Z'),
        administeredTime: new Date('2025-01-01T09:00:00Z') // 1 hour late
      };
      mockPrescriptionRepository.findById.mockResolvedValue(mockPrescription);
      mockMedicationRepository.findById.mockResolvedValue(mockMedication);
      mockAdministrationRepository.create.mockResolvedValue(lateAdministration);

      // Act
      await service.administerMedication(lateAdminRequest);

      // Assert
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'late_medication_administration',
          recipientType: 'nurse_manager'
        })
      );
    });
  });

  describe('checkDrugInteractions', () => {
    it('should return no interactions when none exist', async () => {
      // Arrange
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([]);

      // Act
      const result = await service.checkDrugInteractions('resident-123', 'medication-123');

      // Assert
      expect(result.hasInteractions).toBe(false);
      expect(result.interactions).toHaveLength(0);
      expect(result.severity).toBe(InteractionSeverity.MINOR);
      expect(result.recommendations).toContain('No drug interactions detected');
    });

    it('should detect and return drug interactions', async () => {
      // Arrange
      const existingPrescription = { ...mockPrescription, medicationId: 'medication-456' };
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([existingPrescription]);
      mockDrugInteractionRepository.findOne.mockResolvedValue({
        medication1Id: 'medication-123',
        medication2Id: 'medication-456',
        severity: InteractionSeverity.MODERATE,
        description: 'Moderate interaction',
        clinicalEffect: 'Increased sedation',
        management: 'Monitor closely'
      } as DrugInteraction);
      mockMedicationRepository.findById
        .mockResolvedValueOnce(mockMedication)
        .mockResolvedValueOnce({ ...mockMedication, id: 'medication-456', name: 'Aspirin' });

      // Act
      const result = await service.checkDrugInteractions('resident-123', 'medication-123');

      // Assert
      expect(result.hasInteractions).toBe(true);
      expect(result.interactions).toHaveLength(1);
      expect(result.severity).toBe(InteractionSeverity.MODERATE);
      expect(result.interactions[0]).toEqual({
        medication1: 'Paracetamol',
        medication2: 'Aspirin',
        severity: InteractionSeverity.MODERATE,
        description: 'Moderate interaction',
        clinicalEffect: 'Increased sedation',
        management: 'Monitor closely'
      });
      expect(result.recommendations).toContain('Monitor patient closely for interaction effects');
    });

    it('should return highest severity when multiple interactions exist', async () => {
      // Arrange
      const existingPrescriptions = [
        { ...mockPrescription, medicationId: 'medication-456' },
        { ...mockPrescription, medicationId: 'medication-789' }
      ];
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue(existingPrescriptions);
      
      // Mock moderate interaction
      mockDrugInteractionRepository.findOne
        .mockResolvedValueOnce({
          medication1Id: 'medication-123',
          medication2Id: 'medication-456',
          severity: InteractionSeverity.MODERATE,
          description: 'Moderate interaction',
          clinicalEffect: 'Increased sedation',
          management: 'Monitor closely'
        } as DrugInteraction)
        // Mock severe interaction
        .mockResolvedValueOnce({
          medication1Id: 'medication-123',
          medication2Id: 'medication-789',
          severity: InteractionSeverity.SEVERE,
          description: 'Severe interaction',
          clinicalEffect: 'Life-threatening',
          management: 'Contraindicated'
        } as DrugInteraction);

      mockMedicationRepository.findById
        .mockResolvedValueOnce(mockMedication)
        .mockResolvedValueOnce({ ...mockMedication, id: 'medication-456', name: 'Aspirin' })
        .mockResolvedValueOnce(mockMedication)
        .mockResolvedValueOnce({ ...mockMedication, id: 'medication-789', name: 'Warfarin' });

      // Act
      const result = await service.checkDrugInteractions('resident-123', 'medication-123');

      // Assert
      expect(result.hasInteractions).toBe(true);
      expect(result.interactions).toHaveLength(2);
      expect(result.severity).toBe(InteractionSeverity.SEVERE);
      expect(result.recommendations).toContain('Severe interactions detected - pharmacist review required before administration');
    });
  });

  describe('performMedicationReconciliation', () => {
    const admissionMedications = [
      {
        name: 'Paracetamol',
        dosage: 500,
        dosageUnit: 'mg',
        frequency: 'twice daily'
      },
      {
        name: 'Aspirin',
        dosage: 75,
        dosageUnit: 'mg',
        frequency: 'once daily'
      }
    ];

    it('should identify missing medications', async () => {
      // Arrange
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue([]);

      // Act
      const result = await service.performMedicationReconciliation(
        'resident-123',
        admissionMedications,
        'pharmacist-123'
      );

      // Assert
      expect(result.discrepancies).toHaveLength(2);
      expect(result.discrepancies[0].type).toBe('missing');
      expect(result.discrepancies[0].medication).toBe('Paracetamol');
      expect(result.discrepancies[1].type).toBe('missing');
      expect(result.discrepancies[1].medication).toBe('Aspirin');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_RECONCILIATION_PERFORMED'
        })
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'medication.reconciliation.completed',
        expect.objectContaining({
          residentId: 'resident-123',
          discrepancyCount: 2
        })
      );
    });

    it('should identify dosage discrepancies', async () => {
      // Arrange
      const currentPrescriptions = [
        {
          ...mockPrescription,
          medication: { ...mockMedication, name: 'Paracetamol' },
          dosage: 1000, // Different from admission medication (500mg)
          dosageUnit: 'mg',
          frequency: 'twice daily'
        }
      ];
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue(currentPrescriptions);

      // Act
      const result = await service.performMedicationReconciliation(
        'resident-123',
        [admissionMedications[0]], // Only Paracetamol
        'pharmacist-123'
      );

      // Assert
      expect(result.discrepancies).toHaveLength(1);
      expect(result.discrepancies[0].type).toBe('dosage_change');
      expect(result.discrepancies[0].medication).toBe('Paracetamol');
      expect(result.discrepancies[0].currentValue).toBe('1000 mg');
      expect(result.discrepancies[0].expectedValue).toBe('500 mg');
    });

    it('should identify extra medications', async () => {
      // Arrange
      const currentPrescriptions = [
        {
          ...mockPrescription,
          medication: { ...mockMedication, name: 'Ibuprofen' }, // Not in admission list
          dosage: 400,
          frequency: 'three times daily'
        }
      ];
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue(currentPrescriptions);

      // Act
      const result = await service.performMedicationReconciliation(
        'resident-123',
        admissionMedications,
        'pharmacist-123'
      );

      // Assert
      expect(result.discrepancies.some(d => d.type === 'extra')).toBe(true);
      expect(result.discrepancies.some(d => d.medication === 'Ibuprofen')).toBe(true);
    });

    it('should require pharmacist review for high-severity discrepancies', async () => {
      // Arrange
      const currentPrescriptions = [
        {
          ...mockPrescription,
          medication: { ...mockControlledMedication, name: 'Morphine' },
          dosage: 20, // High dosage discrepancy for controlled substance
          dosageUnit: 'mg',
          frequency: 'twice daily'
        }
      ];
      mockPrescriptionRepository.findActiveByResidentId.mockResolvedValue(currentPrescriptions);

      const controlledAdmissionMed = {
        name: 'Morphine',
        dosage: 10,
        dosageUnit: 'mg',
        frequency: 'twice daily',
        isControlledSubstance: true
      };

      // Act
      const result = await service.performMedicationReconciliation(
        'resident-123',
        [controlledAdmissionMed],
        'pharmacist-123'
      );

      // Assert
      expect(result.requiresPharmacistReview).toBe(true);
      expect(mockNotificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'medication_reconciliation_review_required',
          recipientType: 'pharmacist'
        })
      );
    });
  });

  describe('getMedicationAdministrationRecord', () => {
    const dateFrom = new Date('2025-01-01');
    const dateTo = new Date('2025-01-31');

    it('should return MAR from cache if available', async () => {
      // Arrange
      const cachedMAR = [mockAdministration];
      mockCacheManager.get.mockResolvedValue(cachedMAR);

      // Act
      const result = await service.getMedicationAdministrationRecord('resident-123', dateFrom, dateTo);

      // Assert
      expect(result).toEqual(cachedMAR);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockAdministrationRepository.findByResidentAndDateRange).not.toHaveBeenCalled();
    });

    it('should retrieve MAR from database and cache result', async () => {
      // Arrange
      const administrations = [mockAdministration];
      mockCacheManager.get.mockResolvedValue(null);
      mockAdministrationRepository.findByResidentAndDateRange.mockResolvedValue(administrations);

      // Act
      const result = await service.getMedicationAdministrationRecord('resident-123', dateFrom, dateTo);

      // Assert
      expect(result).toEqual(administrations);
      expect(mockAdministrationRepository.findByResidentAndDateRange).toHaveBeenCalledWith(
        'resident-123',
        dateFrom,
        dateTo
      );
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(mockEncryptionService.decrypt).toHaveBeenCalled();
    });
  });

  describe('getControlledSubstanceReport', () => {
    const dateFrom = new Date('2025-01-01');
    const dateTo = new Date('2025-01-31');

    it('should generate controlled substance report', async () => {
      // Arrange
      const controlledAdministrations = [
        {
          ...mockAdministration,
          medication: mockControlledMedication
        }
      ];
      const inventoryMovements = [
        {
          id: 'movement-123',
          medicationId: 'medication-456',
          movementType: 'administered',
          quantity: 1,
          balanceAfter: 99,
          performedBy: 'nurse-123',
          witnessId: 'witness-123',
          createdAt: new Date()
        }
      ];

      mockAdministrationRepository.findControlledSubstanceAdministrations.mockResolvedValue(controlledAdministrations);
      mockControlledSubstanceRepository.find.mockResolvedValue(inventoryMovements);

      // Act
      const result = await service.getControlledSubstanceReport(dateFrom, dateTo);

      // Assert
      expect(result).toBeDefined();
      expect(result.summary.totalAdministrations).toBe(1);
      expect(result.summary.totalInventoryMovements).toBe(1);
      expect(result.administrations).toHaveLength(1);
      expect(result.inventoryMovements).toHaveLength(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CONTROLLED_SUBSTANCE_REPORT_GENERATED'
        })
      );
    });

    it('should include facility filter when provided', async () => {
      // Arrange
      mockAdministrationRepository.findControlledSubstanceAdministrations.mockResolvedValue([]);
      mockControlledSubstanceRepository.find.mockResolvedValue([]);

      // Act
      await service.getControlledSubstanceReport(dateFrom, dateTo, 'facility-123');

      // Assert
      expect(mockAdministrationRepository.findControlledSubstanceAdministrations).toHaveBeenCalledWith(
        dateFrom,
        dateTo,
        'facility-123'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockMedicationRepository.create.mockRejectedValue(dbError);

      const createRequest: CreateMedicationRequest = {
        name: 'Test Medication',
        strength: '100mg',
        form: MedicationForm.TABLET,
        route: MedicationRoute.ORAL,
        type: MedicationType.ANALGESIC,
        activeIngredient: 'Test',
        isControlledSubstance: false,
        createdBy: 'user-123'
      };

      // Act & Assert
      await expect(service.createMedication(createRequest)).rejects.toThrow('Database connection failed');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_CREATE_FAILED'
        })
      );
    });

    it('should handle encryption service errors', async () => {
      // Arrange
      const encryptionError = new Error('Encryption failed');
      mockEncryptionService.encrypt.mockRejectedValue(encryptionError);

      const createRequest: CreateMedicationRequest = {
        name: 'Test Medication',
        strength: '100mg',
        form: MedicationForm.TABLET,
        route: MedicationRoute.ORAL,
        type: MedicationType.ANALGESIC,
        activeIngredient: 'Test',
        isControlledSubstance: false,
        sideEffects: ['nausea'],
        createdBy: 'user-123'
      };

      // Act & Assert
      await expect(service.createMedication(createRequest)).rejects.toThrow('Encryption failed');
    });

    it('should handle cache service errors gracefully', async () => {
      // Arrange
      const cacheError = new Error('Cache service unavailable');
      mockCacheManager.get.mockRejectedValue(cacheError);
      mockAdministrationRepository.findByResidentAndDateRange.mockResolvedValue([mockAdministration]);

      // Act
      const result = await service.getMedicationAdministrationRecord(
        'resident-123',
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      // Assert
      // Should still work even if cache fails
      expect(result).toEqual([mockAdministration]);
      expect(mockAdministrationRepository.findByResidentAndDateRange).toHaveBeenCalled();
    });
  });

  describe('Healthcare Compliance', () => {
    it('should maintain audit trail for all medication operations', async () => {
      // Arrange
      mockMedicationRepository.create.mockResolvedValue(mockMedication);

      const createRequest: CreateMedicationRequest = {
        name: 'Compliance Test Medication',
        strength: '100mg',
        form: MedicationForm.TABLET,
        route: MedicationRoute.ORAL,
        type: MedicationType.ANALGESIC,
        activeIngredient: 'Test',
        isControlledSubstance: false,
        createdBy: 'user-123'
      };

      // Act
      await service.createMedication(createRequest);

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MEDICATION_CREATED',
          resourceType: 'Medication',
          userId: 'user-123',
          details: expect.objectContaining({
            name: 'Compliance Test Medication',
            type: MedicationType.ANALGESIC,
            isControlledSubstance: false
          })
        })
      );
    });

    it('should publish events for medication lifecycle', async () => {
      // Arrange
      mockMedicationRepository.create.mockResolvedValue(mockMedication);

      const createRequest: CreateMedicationRequest = {
        name: 'Event Test Medication',
        strength: '100mg',
        form: MedicationForm.TABLET,
        route: MedicationRoute.ORAL,
        type: MedicationType.ANALGESIC,
        activeIngredient: 'Test',
        isControlledSubstance: false,
        createdBy: 'user-123'
      };

      // Act
      await service.createMedication(createRequest);

      // Assert
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        'medication.created',
        expect.objectContaining({
          name: 'Event Test Medication',
          type: MedicationType.ANALGESIC,
          isControlledSubstance: false,
          createdBy: 'user-123'
        })
      );
    });

    it('should enforce controlled substance regulations', async () => {
      // Arrange
      const controlledRequest: CreateMedicationRequest = {
        name: 'Morphine',
        strength: '10mg',
        form: MedicationForm.TABLET,
        route: MedicationRoute.ORAL,
        type: MedicationType.OPIOID,
        activeIngredient: 'Morphine',
        isControlledSubstance: true,
        controlledSubstanceSchedule: ControlledSubstanceSchedule.SCHEDULE_II,
        createdBy: 'user-123'
      };
      mockMedicationRepository.create.mockResolvedValue(mockControlledMedication);
      mockControlledSubstanceRepository.save.mockResolvedValue({} as any);

      // Act
      await service.createMedication(controlledRequest);

      // Assert
      expect(mockControlledSubstanceRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          medicationId: mockControlledMedication.id,
          schedule: ControlledSubstanceSchedule.SCHEDULE_II
        })
      );
    });

    it('should validate witness requirements for controlled substances', async () => {
      // Arrange
      const adminRequest: MedicationAdministrationRequest = {
        prescriptionId: 'prescription-123',
        residentId: 'resident-123',
        scheduledTime: new Date(),
        administeredBy: 'nurse-123'
        // Missing witnessId for controlled substance
      };

      const controlledPrescription = {
        ...mockPrescription,
        medicationId: 'medication-456'
      };

      mockPrescriptionRepository.findById.mockResolvedValue(controlledPrescription);
      mockMedicationRepository.findById.mockResolvedValue(mockControlledMedication);

      // Act & Assert
      await expect(service.administerMedication(adminRequest)).rejects.toThrow(
        'Witness is required for controlled substance administration'
      );
    });
  });

  describe('Performance and Scalability', () => {
    it('should use caching for frequently accessed data', async () => {
      // Arrange
      const cachedMAR = [mockAdministration];
      mockCacheManager.get.mockResolvedValue(cachedMAR);

      // Act
      const result = await service.getMedicationAdministrationRecord(
        'resident-123',
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      // Assert
      expect(result).toEqual(cachedMAR);
      expect(mockCacheManager.get).toHaveBeenCalled();
      expect(mockAdministrationRepository.findByResidentAndDateRange).not.toHaveBeenCalled();
    });

    it('should invalidate cache when data changes', async () => {
      // Arrange
      mockMedicationRepository.create.mockResolvedValue(mockMedication);

      const createRequest: CreateMedicationRequest = {
        name: 'Cache Test Medication',
        strength: '100mg',
        form: MedicationForm.TABLET,
        route: MedicationRoute.ORAL,
        type: MedicationType.ANALGESIC,
        activeIngredient: 'Test',
        isControlledSubstance: false,
        createdBy: 'user-123'
      };

      // Act
      await service.createMedication(createRequest);

      // Assert
      expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('medications:*');
    });

    it('should handle large datasets efficiently', async () => {
      // Arrange
      const largeAdministrationSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockAdministration,
        id: `administration-${i}`,
        notes: `encrypted_notes_${i}`
      }));
      mockCacheManager.get.mockResolvedValue(null);
      mockAdministrationRepository.findByResidentAndDateRange.mockResolvedValue(largeAdministrationSet);

      // Act
      const result = await service.getMedicationAdministrationRecord(
        'resident-123',
        new Date('2025-01-01'),
        new Date('2025-01-31')
      );

      // Assert
      expect(result).toHaveLength(1000);
      expect(mockEncryptionService.decrypt).toHaveBeenCalledTimes(1000);
    });
  });
});
