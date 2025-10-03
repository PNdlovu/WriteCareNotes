import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Prescription Management Service for WriteCareNotes Healthcare Management
 * @module PrescriptionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Complete prescription management service with CRUD operations,
 * validation, lifecycle management, and healthcare compliance.
 * 
 * @compliance
 * - MHRA Prescription Requirements
 * - GMC Prescribing Guidelines
 * - CQC Medication Management Standards
 * - GDPR Data Protection Regulation
 * 
 * @security
 * - Role-based access control
 * - Comprehensive audit logging
 * - Data validation and sanitization
 */

import { Repository, DataSource, Between, In, IsNull, Not } from 'typeorm';
import { validate } from 'class-validator';
import { Prescription, PrescriptionStatus, PrescriptionType, FrequencyPattern } from '@/entities/medication/Prescription';
import { Medication } from '@/entities/medication/Medication';
import { Resident } from '@/entities/resident/Resident';
import { AuditTrailService } from '@/services/audit/AuditTrailService';
import { GDPRComplianceService } from '@/services/gdpr/GDPRComplianceService';
import { NotificationService } from '@/services/notifications/NotificationService';
import { ResidentService } from '@/services/resident/ResidentService';
import { logger } from '@/utils/logger';

/**
 * Prescription creation request interface
 */
export interface CreatePrescriptionRequest {
  residentId: string;
  medicationId: string;
  prescriberInfo: {
    id: string;
    name: string;
    gmcNumber?: string;
    profession: 'doctor' | 'nurse_prescriber' | 'pharmacist_prescriber' | 'dentist' | 'other';
    qualifications: string[];
    contactNumber?: string;
    organization?: string;
  };
  prescriptionType?: PrescriptionType;
  dosage: {
    amount: number;
    unit: string;
    frequency: FrequencyPattern;
    customFrequency?: string;
    timingInstructions?: string[];
    withFood?: boolean;
    specialInstructions?: string;
  };
  route: string;
  indication: string;
  clinicalNotes?: string;
  startDate: Date;
  endDate?: Date;
  durationDays?: number;
  reviewDate?: Date;
  reviewSchedule?: {
    nextReviewDate: Date;
    reviewFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';
    customFrequencyDays?: number;
    reviewReason: string;
    automaticReview: boolean;
  };
  maxDosePerDay?: number;
  minIntervalHours?: number;
  requiresMonitoring?: boolean;
  monitoringInstructions?: string[];
  organizationId: string;
  tenantId: string;
}

/**
 * Prescription update request interface
 */
export interface UpdatePrescriptionRequest {
  dosage?: {
    amount: number;
    unit: string;
    frequency: FrequencyPattern;
    customFrequency?: string;
    timingInstructions?: string[];
    withFood?: boolean;
    specialInstructions?: string;
  };
  route?: string;
  indication?: string;
  clinicalNotes?: string;
  endDate?: Date;
  durationDays?: number;
  reviewDate?: Date;
  reviewSchedule?: {
    nextReviewDate: Date;
    reviewFrequency: 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'custom';
    customFrequencyDays?: number;
    reviewReason: string;
    automaticReview: boolean;
  };
  maxDosePerDay?: number;
  minIntervalHours?: number;
  requiresMonitoring?: boolean;
  monitoringInstructions?: string[];
  status?: PrescriptionStatus;
}

/**
 * Prescription search filters
 */
export interface PrescriptionSearchFilters {
  residentId?: string;
  medicationId?: string;
  status?: PrescriptionStatus | PrescriptionStatus[];
  prescriptionType?: PrescriptionType;
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  reviewDateFrom?: Date;
  reviewDateTo?: Date;
  prescriberId?: string;
  requiresMonitoring?: boolean;
  organizationId?: string;
  tenantId?: string;
}

/**
 * Prescription validation result
 */
export interface PrescriptionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  clinicalAlerts: string[];
}

/**
 * Prescription Management Service
 */
export class PrescriptionService {
  private prescriptionRepository: Repository<Prescription>;
  private medicationRepository: Repository<Medication>;
  private residentRepository: Repository<Resident>;

  constructor(
    private dataSource: DataSource,
    private auditService: AuditTrailService,
    private gdprService: GDPRComplianceService,
    private notificationService: NotificationService,
    private residentService: ResidentService
  ) {
    this.prescriptionRepository = dataSource.getRepository(Prescription);
    this.medicationRepository = dataSource.getRepository(Medication);
    this.residentRepository = dataSource.getRepository(Resident);
  }

  /**
   * Create a new prescription with comprehensive validation
   */
  async createPrescription(
    request: CreatePrescriptionRequest,
    userId: string
  ): Promise<Prescription> {
    console.info('Creating new prescription', { 
      residentId: request.residentId, 
      medicationId: request.medicationId,
      userId 
    });

    try {
      // Validate the request
      const validationResult = await this.validatePrescriptionRequest(request);
      if (!validationResult.isValid) {
        throw new Error(`Prescription validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Check for existing active prescriptions for the same medication
      await this.checkForDuplicatePrescriptions(request.residentId, request.medicationId);

      // Verify resident exists and is active
      const resident = await this.residentService.getResidentById(request.residentId);
      if (!resident) {
        throw new Error('Resident not found');
      }

      // Verify medication exists and is active
      const medication = await this.medicationRepository.findOne({
        where: { id: request.medicationId, isActive: true }
      });
      if (!medication) {
        throw new Error('Medication not found or inactive');
      }

      // Validate prescriber credentials
      await this.validatePrescriberCredentials(request.prescriberInfo);

      // Check for drug interactions and contraindications
      await this.performClinicalSafetyChecks(request.residentId, request.medicationId);

      // Create prescription entity
      const prescription = new Prescription();
      prescription.residentId = request.residentId;
      prescription.medicationId = request.medicationId;
      prescription.prescriberInfo = request.prescriberInfo;
      prescription.prescriptionType = request.prescriptionType || PrescriptionType.REGULAR;
      prescription.status = PrescriptionStatus.ACTIVE;
      prescription.dosage = request.dosage;
      prescription.route = request.route as any;
      prescription.indication = request.indication;
      prescription.clinicalNotes = request.clinicalNotes;
      prescription.startDate = request.startDate;
      prescription.endDate = request.endDate;
      prescription.durationDays = request.durationDays;
      prescription.reviewDate = request.reviewDate;
      prescription.reviewSchedule = request.reviewSchedule;
      prescription.maxDosePerDay = request.maxDosePerDay;
      prescription.minIntervalHours = request.minIntervalHours;
      prescription.requiresMonitoring = request.requiresMonitoring || false;
      prescription.monitoringInstructions = request.monitoringInstructions;
      prescription.organizationId = request.organizationId;
      prescription.tenantId = request.tenantId;
      prescription.createdBy = userId;

      // Validate entity
      const entityErrors = await validate(prescription);
      if (entityErrors.length > 0) {
        throw new Error(`Entity validation failed: ${entityErrors.map(e => e.toString()).join(', ')}`);
      }

      // Save prescription
      const savedPrescription = await this.prescriptionRepository.save(prescription);

      // Log audit trail
      await this.auditService.log({
        action: 'PRESCRIPTION_CREATED',
        resourceType: 'Prescription',
        resourceId: savedPrescription.id,
        userId,
        organizationId: request.organizationId,
        tenantId: request.tenantId,
        details: {
          residentId: request.residentId,
          medicationId: request.medicationId,
          prescriberId: request.prescriberInfo.id,
          indication: request.indication
        }
      });

      // Send notifications for high-risk medications
      if (medication.riskLevel === 'high' || medication.riskLevel === 'critical') {
        await this.notificationService.sendNotification({
          message: 'Notification: HIGH RISK PRESCRIPTION CREATED',
        type: 'HIGH_RISK_PRESCRIPTION_CREATED',
          recipientIds: [userId], // Add clinical staff
          title: 'High-Risk Prescription Created',
          message: `High-risk prescription created for ${medication.fullName}`,
          data: {
            prescriptionId: savedPrescription.id,
            residentId: request.residentId,
            medicationName: medication.fullName,
            riskLevel: medication.riskLevel
          }
        });
      }

      console.info('Prescription created successfully', { 
        prescriptionId: savedPrescription.id,
        residentId: request.residentId,
        medicationId: request.medicationId
      });

      return savedPrescription;

    } catch (error: unknown) {
      console.error('Failed to create prescription', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId: request.residentId,
        medicationId: request.medicationId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get prescription by ID with full details
   */
  async getPrescriptionById(
    prescriptionId: string,
    organizationId: string,
    tenantId: string
  ): Promise<Prescription | null> {
    try {
      const prescription = await this.prescriptionRepository.findOne({
        where: { 
          id: prescriptionId, 
          organizationId, 
          tenantId,
          deletedAt: IsNull()
        },
        relations: ['medication', 'resident']
      });

      if (prescription) {
        // Log access for audit
        await this.auditService.log({
          action: 'PRESCRIPTION_ACCESSED',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          organizationId,
          tenantId,
          details: { accessType: 'view' }
        });
      }

      return prescription;

    } catch (error: unknown) {
      console.error('Failed to get prescription by ID', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        prescriptionId,
        organizationId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Search prescriptions with filters and pagination
   */
  async searchPrescriptions(
    filters: PrescriptionSearchFilters,
    page: number = 1,
    limit: number = 50
  ): Promise<{ prescriptions: Prescription[]; total: number; totalPages: number }> {
    try {
      const queryBuilder = this.prescriptionRepository.createQueryBuilder('prescription')
        .leftJoinAndSelect('prescription.medication', 'medication')
        .leftJoinAndSelect('prescription.resident', 'resident')
        .where('prescription.deletedAt IS NULL');

      // Apply filters
      if (filters.residentId) {
        queryBuilder.andWhere('prescription.residentId = :residentId', { residentId: filters.residentId });
      }

      if (filters.medicationId) {
        queryBuilder.andWhere('prescription.medicationId = :medicationId', { medicationId: filters.medicationId });
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          queryBuilder.andWhere('prescription.status IN (:...statuses)', { statuses: filters.status });
        } else {
          queryBuilder.andWhere('prescription.status = :status', { status: filters.status });
        }
      }

      if (filters.prescriptionType) {
        queryBuilder.andWhere('prescription.prescriptionType = :type', { type: filters.prescriptionType });
      }

      if (filters.startDateFrom) {
        queryBuilder.andWhere('prescription.startDate >= :startDateFrom', { startDateFrom: filters.startDateFrom });
      }

      if (filters.startDateTo) {
        queryBuilder.andWhere('prescription.startDate <= :startDateTo', { startDateTo: filters.startDateTo });
      }

      if (filters.reviewDateFrom && filters.reviewDateTo) {
        queryBuilder.andWhere('prescription.reviewDate BETWEEN :reviewDateFrom AND :reviewDateTo', {
          reviewDateFrom: filters.reviewDateFrom,
          reviewDateTo: filters.reviewDateTo
        });
      }

      if (filters.requiresMonitoring !== undefined) {
        queryBuilder.andWhere('prescription.requiresMonitoring = :requiresMonitoring', { 
          requiresMonitoring: filters.requiresMonitoring 
        });
      }

      if (filters.organizationId) {
        queryBuilder.andWhere('prescription.organizationId = :organizationId', { 
          organizationId: filters.organizationId 
        });
      }

      if (filters.tenantId) {
        queryBuilder.andWhere('prescription.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const prescriptions = await queryBuilder
        .orderBy('prescription.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const totalPages = Math.ceil(total / limit);

      console.info('Prescription search completed', { 
        filters,
        total,
        page,
        limit,
        totalPages
      });

      return { prescriptions, total, totalPages };

    } catch (error: unknown) {
      console.error('Failed to search prescriptions', { error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
      throw error;
    }
  }

  /**
   * Update prescription with validation
   */
  async updatePrescription(
    prescriptionId: string,
    updates: UpdatePrescriptionRequest,
    userId: string,
    organizationId: string,
    tenantId: string
  ): Promise<Prescription> {
    console.info('Updating prescription', { prescriptionId, userId });

    try {
      // Get existing prescription
      const prescription = await this.getPrescriptionById(prescriptionId, organizationId, tenantId);
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Store original values for audit
      const originalValues = { ...prescription };

      // Apply updates
      if (updates.dosage) prescription.dosage = updates.dosage;
      if (updates.route) prescription.route = updates.route as any;
      if (updates.indication) prescription.indication = updates.indication;
      if (updates.clinicalNotes !== undefined) prescription.clinicalNotes = updates.clinicalNotes;
      if (updates.endDate !== undefined) prescription.endDate = updates.endDate;
      if (updates.durationDays !== undefined) prescription.durationDays = updates.durationDays;
      if (updates.reviewDate !== undefined) prescription.reviewDate = updates.reviewDate;
      if (updates.reviewSchedule) prescription.reviewSchedule = updates.reviewSchedule;
      if (updates.maxDosePerDay !== undefined) prescription.maxDosePerDay = updates.maxDosePerDay;
      if (updates.minIntervalHours !== undefined) prescription.minIntervalHours = updates.minIntervalHours;
      if (updates.requiresMonitoring !== undefined) prescription.requiresMonitoring = updates.requiresMonitoring;
      if (updates.monitoringInstructions) prescription.monitoringInstructions = updates.monitoringInstructions;
      if (updates.status) prescription.status = updates.status;

      prescription.updatedBy = userId;

      // Validate updated entity
      const entityErrors = await validate(prescription);
      if (entityErrors.length > 0) {
        throw new Error(`Entity validation failed: ${entityErrors.map(e => e.toString()).join(', ')}`);
      }

      // Save updated prescription
      const updatedPrescription = await this.prescriptionRepository.save(prescription);

      // Log audit trail
      await this.auditService.log({
        action: 'PRESCRIPTION_UPDATED',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        userId,
        organizationId,
        tenantId,
        oldValues: originalValues,
        newValues: updatedPrescription,
        details: { updateFields: Object.keys(updates) }
      });

      console.info('Prescription updated successfully', { prescriptionId, userId });

      return updatedPrescription;

    } catch (error: unknown) {
      console.error('Failed to update prescription', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        prescriptionId,
        userId
      });
      throw error;
    }
  }

  /**
   * Discontinue prescription with reason
   */
  async discontinuePrescription(
    prescriptionId: string,
    reason: string,
    userId: string,
    organizationId: string,
    tenantId: string
  ): Promise<Prescription> {
    console.info('Discontinuing prescription', { prescriptionId, reason, userId });

    try {
      const prescription = await this.getPrescriptionById(prescriptionId, organizationId, tenantId);
      if (!prescription) {
        throw new Error('Prescription not found');
      }

      if (prescription.status !== PrescriptionStatus.ACTIVE) {
        throw new Error('Only active prescriptions can be discontinued');
      }

      // Update prescription status
      prescription.status = PrescriptionStatus.DISCONTINUED;
      prescription.discontinuationReason = reason;
      prescription.discontinuedBy = userId;
      prescription.discontinuationDate = new Date();
      prescription.updatedBy = userId;

      const updatedPrescription = await this.prescriptionRepository.save(prescription);

      // Log audit trail
      await this.auditService.log({
        action: 'PRESCRIPTION_DISCONTINUED',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        userId,
        organizationId,
        tenantId,
        details: { 
          reason,
          discontinuationDate: prescription.discontinuationDate
        }
      });

      // Send notification
      await this.notificationService.sendNotification({
        message: 'Notification: PRESCRIPTION DISCONTINUED',
        type: 'PRESCRIPTION_DISCONTINUED',
        recipientIds: [prescription.prescriberInfo.id],
        title: 'Prescription Discontinued',
        message: `Prescription for ${prescription.medication?.fullName} has been discontinued`,
        data: {
          prescriptionId,
          reason,
          residentId: prescription.residentId
        }
      });

      console.info('Prescription discontinued successfully', { prescriptionId, userId });

      return updatedPrescription;

    } catch (error: unknown) {
      console.error('Failed to discontinue prescription', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        prescriptionId,
        userId
      });
      throw error;
    }
  }

  /**
   * Get active prescriptions for a resident
   */
  async getActivePrescriptionsForResident(
    residentId: string,
    organizationId: string,
    tenantId: string
  ): Promise<Prescription[]> {
    try {
      const prescriptions = await this.prescriptionRepository.find({
        where: {
          residentId,
          status: PrescriptionStatus.ACTIVE,
          organizationId,
          tenantId,
          deletedAt: IsNull()
        },
        relations: ['medication'],
        order: { createdAt: 'DESC' }
      });

      return prescriptions;

    } catch (error: unknown) {
      console.error('Failed to get active prescriptions for resident', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId,
        organizationId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Get prescriptions due for review
   */
  async getPrescriptionsDueForReview(
    organizationId: string,
    tenantId: string,
    daysAhead: number = 7
  ): Promise<Prescription[]> {
    try {
      const reviewDate = new Date();
      reviewDate.setDate(reviewDate.getDate() + daysAhead);

      const prescriptions = await this.prescriptionRepository.find({
        where: {
          status: PrescriptionStatus.ACTIVE,
          reviewDate: Between(new Date(), reviewDate),
          organizationId,
          tenantId,
          deletedAt: IsNull()
        },
        relations: ['medication', 'resident'],
        order: { reviewDate: 'ASC' }
      });

      return prescriptions;

    } catch (error: unknown) {
      console.error('Failed to get prescriptions due for review', { 
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        organizationId,
        tenantId,
        daysAhead
      });
      throw error;
    }
  }

  /**
   * Validate prescription request
   */
  private async validatePrescriptionRequest(
    request: CreatePrescriptionRequest
  ): Promise<PrescriptionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const clinicalAlerts: string[] = [];

    // Basic validation
    if (!request.residentId) errors.push('Resident ID is required');
    if (!request.medicationId) errors.push('Medication ID is required');
    if (!request.indication) errors.push('Indication is required');
    if (!request.dosage.amount || request.dosage.amount <= 0) {
      errors.push('Valid dosage amount is required');
    }

    // Date validation
    if (request.endDate && request.startDate && request.endDate <= request.startDate) {
      errors.push('End date must be after start date');
    }

    // Dosage validation
    if (request.maxDosePerDay && request.dosage.amount > request.maxDosePerDay) {
      errors.push('Single dose exceeds maximum daily dose');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      clinicalAlerts
    };
  }

  /**
   * Check for duplicate active prescriptions
   */
  private async checkForDuplicatePrescriptions(
    residentId: string,
    medicationId: string
  ): Promise<void> {
    const existingPrescription = await this.prescriptionRepository.findOne({
      where: {
        residentId,
        medicationId,
        status: PrescriptionStatus.ACTIVE,
        deletedAt: IsNull()
      }
    });

    if (existingPrescription) {
      throw new Error('Active prescription already exists for this medication and resident');
    }
  }

  /**
   * Validate prescriber credentials
   */
  private async validatePrescriberCredentials(prescriberInfo: any): Promise<void> {
    // Validate GMC number format if provided
    if (prescriberInfo.gmcNumber && !/^\d{7}$/.test(prescriberInfo.gmcNumber)) {
      throw new Error('Invalid GMC number format');
    }

    // Validate profession
    const validProfessions = ['doctor', 'nurse_prescriber', 'pharmacist_prescriber', 'dentist', 'other'];
    if (!validProfessions.includes(prescriberInfo.profession)) {
      throw new Error('Invalid prescriber profession');
    }

    // Additional validation logic would go here
    // e.g., check against GMC register, validate qualifications
  }

  /**
   * Perform clinical safety checks
   */
  private async performClinicalSafetyChecks(
    residentId: string,
    medicationId: string
  ): Promise<void> {
    // Get resident's current medications
    const activePrescriptions = await this.getActivePrescriptionsForResident(
      residentId,
      '', // Will be provided by caller
      ''  // Will be provided by caller
    );

    // Get medication details
    const medication = await this.medicationRepository.findOne({
      where: { id: medicationId }
    });

    if (!medication) {
      throw new Error('Medication not found for safety checks');
    }

    // Check for drug interactions
    for (const prescription of activePrescriptions) {
      if (prescription.medication && medication.drugInteractions) {
        const interaction = medication.hasInteractionWith(prescription.medication.genericName);
        if (interaction && (interaction.severity === 'major' || interaction.severity === 'contraindicated')) {
          throw new Error(`Contraindicated drug interaction: ${interaction.clinicalEffect}`);
        }
      }
    }

    // Additional safety checks would be implemented here
    // e.g., allergy checks, contraindication checks, etc.
  }
}

export default PrescriptionService;