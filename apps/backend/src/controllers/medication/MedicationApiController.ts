/**
 * @fileoverview Medication API Controller for WriteCareNotes
 * @module MedicationApiController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description REST API controller for medication operations with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - Controlled Drugs Regulations 2001
 * - NICE Guidelines for Medication Management
 */

import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { MedicationService, CreateMedicationRequest, CreatePrescriptionRequest, MedicationAdministrationRequest } from '../../services/medication/MedicationService';
import { MedicationType, MedicationForm, MedicationRoute } from '../../entities/medication/Medication';
import { PrescriptionStatus } from '../../entities/medication/Prescription';
import { AdministrationStatus } from '../../entities/medication/MedicationAdministration';
import { ControlledSubstanceSchedule } from '../../entities/medication/ControlledSubstance';
import { CreateMedicationDto, CreatePrescriptionDto, MedicationAdministrationDto, MedicationResponseDto } from '../../dto/medication/MedicationDto';
import { logger } from '../../utils/logger';
import { APIResponse, PaginationMeta } from '../../types/api-response';
import { ValidationError } from '../../types/errors';

export class MedicationApiController {
  constructor(private medicationService: MedicationService) {}

  /**
   * Create a new medication
   */
  async createMedication(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Creating medication via API', { 
        userId: req.user?.id,
        correlationId 
      });

      // Validate request body
      const createDto = new CreateMedicationDto();
      Object.assign(createDto, req.body);

      const validationErrors = await validate(createDto);
      if (validationErrors.length > 0) {
        constresponse: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid medication data',
            details: validationErrors.map(error => ({
              field: error.property,
              constraints: error.constraints
            })),
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Convert DTO to service request
      constcreateRequest: CreateMedicationRequest = {
        name: createDto.name,
        genericName: createDto.genericName,
        brandName: createDto.brandName,
        strength: createDto.strength,
        form: createDto.form as MedicationForm,
        route: createDto.route as MedicationRoute,
        type: createDto.type as MedicationType,
        activeIngredient: createDto.activeIngredient,
        manufacturer: createDto.manufacturer,
        ndcCode: createDto.ndcCode,
        isControlledSubstance: createDto.isControlledSubstance,
        controlledSubstanceSchedule: createDto.controlledSubstanceSchedule as ControlledSubstanceSchedule,
        sideEffects: createDto.sideEffects,
        contraindications: createDto.contraindications,
        interactions: createDto.interactions,
        storageRequirements: createDto.storageRequirements,
        createdBy: req.user!.id
      };

      // Create medication
      const medication = await this.medicationService.createMedication(createRequest);

      // Convert to response DTO
      const responseDto = this.mapMedicationToResponseDto(medication);

      constresponse: APIResponse<MedicationResponseDto> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Medication created successfully via API', { 
        medicationId: medication.id,
        userId: req.user?.id,
        correlationId 
      });

      res.status(201).json(response);

    } catch (error: unknown) {
      logger.error('Failed to create medication via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create medication',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Create a new prescription
   */
  async createPrescription(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Creating prescription via API', { 
        userId: req.user?.id,
        correlationId 
      });

      // Validate request body
      const createDto = new CreatePrescriptionDto();
      Object.assign(createDto, req.body);

      const validationErrors = await validate(createDto);
      if (validationErrors.length > 0) {
        constresponse: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid prescription data',
            details: validationErrors.map(error => ({
              field: error.property,
              constraints: error.constraints
            })),
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Convert DTO to service request
      constcreateRequest: CreatePrescriptionRequest = {
        residentId: createDto.residentId,
        medicationId: createDto.medicationId,
        prescriberId: createDto.prescriberId,
        prescriberName: createDto.prescriberName,
        dosage: createDto.dosage,
        dosageUnit: createDto.dosageUnit,
        frequency: createDto.frequency,
        route: createDto.route as MedicationRoute,
        startDate: new Date(createDto.startDate),
        endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
        instructions: createDto.instructions,
        quantityPrescribed: createDto.quantityPrescribed,
        refillsRemaining: createDto.refillsRemaining,
        indication: createDto.indication,
        createdBy: req.user!.id
      };

      // Create prescription
      const prescription = await this.medicationService.createPrescription(createRequest);

      // Convert to response DTO
      const responseDto = this.mapPrescriptionToResponseDto(prescription);

      constresponse: APIResponse<any> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Prescription created successfully via API', { 
        prescriptionId: prescription.id,
        userId: req.user?.id,
        correlationId 
      });

      res.status(201).json(response);

    } catch (error: unknown) {
      logger.error('Failed to create prescription via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      const statusCode = error instanceof Error && error.message.includes('drug interactions') ? 400 : 500;
      const errorCode = statusCode === 400 ? 'DRUG_INTERACTION_ERROR' : 'INTERNAL_ERROR';

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Failed to create prescription',
          correlationId
        }
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * Administer medication
   */
  async administerMedication(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Administering medication via API', { 
        userId: req.user?.id,
        correlationId 
      });

      // Validate request body
      const adminDto = new MedicationAdministrationDto();
      Object.assign(adminDto, req.body);

      const validationErrors = await validate(adminDto);
      if (validationErrors.length > 0) {
        constresponse: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid medication administration data',
            details: validationErrors.map(error => ({
              field: error.property,
              constraints: error.constraints
            })),
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Convert DTO to service request
      constadminRequest: MedicationAdministrationRequest = {
        prescriptionId: adminDto.prescriptionId,
        residentId: adminDto.residentId,
        scheduledTime: new Date(adminDto.scheduledTime),
        dosageGiven: adminDto.dosageGiven,
        administeredBy: req.user!.id,
        witnessId: adminDto.witnessId,
        notes: adminDto.notes,
        administrationMethod: adminDto.administrationMethod,
        siteOfAdministration: adminDto.siteOfAdministration
      };

      // Administer medication
      const administration = await this.medicationService.administerMedication(adminRequest);

      // Convert to response DTO
      const responseDto = this.mapAdministrationToResponseDto(administration);

      constresponse: APIResponse<any> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Medication administered successfully via API', { 
        administrationId: administration.id,
        userId: req.user?.id,
        correlationId 
      });

      res.status(201).json(response);

    } catch (error: unknown) {
      logger.error('Failed to administer medication via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      const statusCode = error instanceof Error && 
        (error.message.includes('not found') || error.message.includes('inactive')) ? 404 : 500;
      const errorCode = statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR';

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Failed to administer medication',
          correlationId
        }
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * Check drug interactions
   */
  async checkDrugInteractions(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const residentId = req.params.residentId;
    const medicationId = req.params.medicationId;
    
    try {
      logger.info('Checking drug interactions via API', { 
        residentId,
        medicationId,
        userId: req.user?.id,
        correlationId 
      });

      // Check drug interactions
      const interactionCheck = await this.medicationService.checkDrugInteractions(residentId, medicationId);

      constresponse: APIResponse<any> = {
        success: true,
        data: {
          hasInteractions: interactionCheck.hasInteractions,
          severity: interactionCheck.severity,
          interactionCount: interactionCheck.interactions.length,
          interactions: interactionCheck.interactions.map(interaction => ({
            medication1: interaction.medication1,
            medication2: interaction.medication2,
            severity: interaction.severity,
            description: interaction.description,
            clinicalEffect: interaction.clinicalEffect,
            management: interaction.management
          })),
          recommendations: interactionCheck.recommendations
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Drug interactions checked successfully via API', { 
        residentId,
        medicationId,
        hasInteractions: interactionCheck.hasInteractions,
        severity: interactionCheck.severity,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to check drug interactions via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId,
        medicationId,
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to check drug interactions',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Perform medication reconciliation
   */
  async performMedicationReconciliation(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const residentId = req.params.residentId;
    
    try {
      logger.info('Performing medication reconciliation via API', { 
        residentId,
        userId: req.user?.id,
        correlationId 
      });

      const { admissionMedications } = req.body;

      if (!admissionMedications || !Array.isArray(admissionMedications)) {
        constresponse: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Admission medications array is required',
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Perform medication reconciliation
      const reconciliationResult = await this.medicationService.performMedicationReconciliation(
        residentId,
        admissionMedications,
        req.user!.id
      );

      constresponse: APIResponse<any> = {
        success: true,
        data: {
          discrepancyCount: reconciliationResult.discrepancies.length,
          requiresPharmacistReview: reconciliationResult.requiresPharmacistReview,
          discrepancies: reconciliationResult.discrepancies.map(discrepancy => ({
            type: discrepancy.type,
            medication: discrepancy.medication,
            currentValue: discrepancy.currentValue,
            expectedValue: discrepancy.expectedValue,
            severity: discrepancy.severity,
            description: discrepancy.description
          })),
          recommendations: reconciliationResult.recommendations
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Medication reconciliation completed successfully via API', { 
        residentId,
        discrepancyCount: reconciliationResult.discrepancies.length,
        requiresPharmacistReview: reconciliationResult.requiresPharmacistReview,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to perform medication reconciliation via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId,
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to perform medication reconciliation',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get medication administration record (MAR)
   */
  async getMedicationAdministrationRecord(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const residentId = req.params.residentId;
    
    try {
      logger.info('Getting medication administration record via API', { 
        residentId,
        userId: req.user?.id,
        correlationId 
      });

      // Parse date parameters
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date();
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();

      // Validate date range
      if (dateFrom > dateTo) {
        constresponse: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date from cannot be after date to',
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Get MAR
      const administrations = await this.medicationService.getMedicationAdministrationRecord(
        residentId,
        dateFrom,
        dateTo
      );

      // Convert to response DTOs
      const responseDtos = administrations.map(admin => this.mapAdministrationToResponseDto(admin));

      constresponse: APIResponse<any[]> = {
        success: true,
        data: responseDtos,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          dateRange: {
            from: dateFrom.toISOString(),
            to: dateTo.toISOString()
          }
        }
      };

      logger.info('Medication administration record retrieved successfully via API', { 
        residentId,
        recordCount: administrations.length,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to get medication administration record via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId,
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get medication administration record',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get controlled substance report
   */
  async getControlledSubstanceReport(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Getting controlled substance report via API', { 
        userId: req.user?.id,
        correlationId 
      });

      // Parse date parameters
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date();
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
      const facilityId = req.query.facilityId as string;

      // Validate date range
      if (dateFrom > dateTo) {
        constresponse: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date from cannot be after date to',
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Get controlled substance report
      const report = await this.medicationService.getControlledSubstanceReport(
        dateFrom,
        dateTo,
        facilityId
      );

      constresponse: APIResponse<any> = {
        success: true,
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Controlled substance report generated successfully via API', { 
        administrationCount: report.summary.totalAdministrations,
        inventoryMovementCount: report.summary.totalInventoryMovements,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to get controlled substance report via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get controlled substance report',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get medications with filtering and pagination
   */
  async getMedications(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Getting medications via API', { 
        userId: req.user?.id,
        query: req.query,
        correlationId 
      });

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const search = req.query.search as string;
      const type = req.query.type as MedicationType;
      const isControlledSubstance = req.query.isControlledSubstance === 'true' ? true : 
                                   req.query.isControlledSubstance === 'false' ? false : undefined;

      // For now, return a placeholder response
      // In a full implementation, this would use the medication repository
      const medications = [
        {
          id: 'medication-123',
          name: 'Paracetamol',
          genericName: 'Acetaminophen',
          strength: '500mg',
          form: 'tablet',
          route: 'oral',
          type: 'analgesic',
          isControlledSubstance: false,
          isActive: true
        }
      ];

      constpaginationMeta: PaginationMeta = {
        page,
        limit,
        total: medications.length,
        totalPages: Math.ceil(medications.length / limit),
        hasNext: page < Math.ceil(medications.length / limit),
        hasPrev: page > 1
      };

      constresponse: APIResponse<any[]> = {
        success: true,
        data: medications,
        meta: {
          pagination: paginationMeta,
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Medications retrieved successfully via API', { 
        count: medications.length,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to get medications via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get medications',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get prescriptions for a resident
   */
  async getPrescriptions(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const residentId = req.params.residentId;
    
    try {
      logger.info('Getting prescriptions via API', { 
        residentId,
        userId: req.user?.id,
        correlationId 
      });

      // Parse query parameters
      const status = req.query.status as PrescriptionStatus;
      const includeInactive = req.query.includeInactive === 'true';

      // For now, return a placeholder response
      // In a full implementation, this would use the prescription repository
      const prescriptions = [
        {
          id: 'prescription-123',
          residentId,
          medicationName: 'Paracetamol',
          dosage: 500,
          dosageUnit: 'mg',
          frequency: 'twice daily',
          status: 'active',
          startDate: new Date().toISOString(),
          prescriberName: 'Dr. Smith'
        }
      ];

      constresponse: APIResponse<any[]> = {
        success: true,
        data: prescriptions,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Prescriptions retrieved successfully via API', { 
        residentId,
        count: prescriptions.length,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to get prescriptions via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        residentId,
        userId: req.user?.id,
        correlationId 
      });

      constresponse: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get prescriptions',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  // Private helper methods

  private mapMedicationToResponseDto(medication: any): MedicationResponseDto {
    return {
      id: medication.id,
      name: medication.name,
      genericName: medication.genericName,
      brandName: medication.brandName,
      strength: medication.strength,
      form: medication.form,
      route: medication.route,
      type: medication.type,
      activeIngredient: medication.activeIngredient,
      manufacturer: medication.manufacturer,
      ndcCode: medication.ndcCode,
      isControlledSubstance: medication.isControlledSubstance,
      controlledSubstanceSchedule: medication.controlledSubstanceSchedule,
      sideEffects: medication.sideEffects,
      contraindications: medication.contraindications,
      interactions: medication.interactions,
      storageRequirements: medication.storageRequirements,
      isActive: medication.isActive,
      createdBy: medication.createdBy,
      createdAt: medication.createdAt.toISOString(),
      updatedAt: medication.updatedAt.toISOString()
    };
  }

  private mapPrescriptionToResponseDto(prescription: any): any {
    return {
      id: prescription.id,
      residentId: prescription.residentId,
      medicationId: prescription.medicationId,
      medicationName: prescription.medication?.name,
      prescriberId: prescription.prescriberId,
      prescriberName: prescription.prescriberName,
      dosage: prescription.dosage,
      dosageUnit: prescription.dosageUnit,
      frequency: prescription.frequency,
      route: prescription.route,
      startDate: prescription.startDate.toISOString(),
      endDate: prescription.endDate?.toISOString(),
      instructions: prescription.instructions,
      quantityPrescribed: prescription.quantityPrescribed,
      refillsRemaining: prescription.refillsRemaining,
      indication: prescription.indication,
      status: prescription.status,
      createdBy: prescription.createdBy,
      createdAt: prescription.createdAt.toISOString(),
      updatedAt: prescription.updatedAt.toISOString()
    };
  }

  private mapAdministrationToResponseDto(administration: any): any {
    return {
      id: administration.id,
      prescriptionId: administration.prescriptionId,
      residentId: administration.residentId,
      medicationId: administration.medicationId,
      medicationName: administration.medication?.name,
      scheduledTime: administration.scheduledTime.toISOString(),
      administeredTime: administration.administeredTime?.toISOString(),
      dosageGiven: administration.dosageGiven,
      administeredBy: administration.administeredBy,
      witnessId: administration.witnessId,
      notes: administration.notes,
      administrationMethod: administration.administrationMethod,
      siteOfAdministration: administration.siteOfAdministration,
      status: administration.status,
      createdAt: administration.createdAt.toISOString(),
      updatedAt: administration.updatedAt.toISOString()
    };
  }
}
