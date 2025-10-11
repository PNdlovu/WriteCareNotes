/**
 * @fileoverview REST API controller for prescription management with comprehensive
 * @module Medication/PrescriptionController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for prescription management with comprehensive
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Prescription Controller for WriteCareNotes Healthcare Management
 * @module PrescriptionController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for prescription management with comprehensive
 * validation, error handling, and healthcare compliance.
 * 
 * @compliance
 * - MHRA Prescription Requirements
 * - GMC Prescribing Guidelines
 * - CQC Medication Management Standards
 * - GDPR Data Protection Regulation
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { PrescriptionService, CreatePrescriptionRequest, UpdatePrescriptionRequest, PrescriptionSearchFilters } from '@/services/medication/PrescriptionService';
import { PrescriptionStatus, PrescriptionType, FrequencyPattern } from '@/entities/medication/Prescription';
import { logger } from '@/utils/logger';

/**
 * Prescription Controller with comprehensive API endpoints
 */
export class PrescriptionController {
  const ructor(private prescriptionService: PrescriptionService) {}

  /**
   * Create new prescription
   * POST /api/v1/prescriptions
   */
  async createPrescription(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid prescription data',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!userId || !organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const prescriptionData: CreatePrescriptionRequest = {
        ...req.body,
        organizationId,
        tenantId
      };

      const prescription = await this.prescriptionService.createPrescription(
        prescriptionData,
        userId
      );

      console.info('Prescription created via API', {
        prescriptionId: prescription.id,
        residentId: prescription.residentId,
        userId,
        correlationId: req.correlationId
      });

      res.status(201).json({
        success: true,
        data: prescription,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to create prescription via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      const statusCode = error instanceof Error ? error.message : "Unknown error".includes('not found') ? 404 :
                        error instanceof Error ? error.message : "Unknown error".includes('validation') ? 400 :
                        error instanceof Error ? error.message : "Unknown error".includes('duplicate') ? 409 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' :
                statusCode === 400 ? 'VALIDATION_ERROR' :
                statusCode === 409 ? 'CONFLICT' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : "Unknown error",
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Get prescription by ID
   * GET /api/v1/prescriptions/:id
   */
  async getPrescriptionById(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid prescription ID',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const { id } = req.params;
      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const prescription = await this.prescriptionService.getPrescriptionById(
        id,
        organizationId,
        tenantId
      );

      if (!prescription) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Prescription not found',
            correlationId: req.correlationId
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: prescription,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to get prescription by ID via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        prescriptionId: req.params['id'],
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve prescription',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Search prescriptions with filters
   * GET /api/v1/prescriptions
   */
  async searchPrescriptions(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid search parameters',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const {
        residentId,
        medicationId,
        status,
        prescriptionType,
        startDateFrom,
        startDateTo,
        reviewDateFrom,
        reviewDateTo,
        requiresMonitoring,
        page = 1,
        limit = 50
      } = req.query;

      const filters: PrescriptionSearchFilters = {
        organizationId,
        tenantId
      };

      if (residentId) filters.residentId = residentId as string;
      if (medicationId) filters.medicationId = medicationId as string;
      if (status) {
        if (Array.isArray(status)) {
          filters.status = status as PrescriptionStatus[];
        } else {
          filters.status = status as PrescriptionStatus;
        }
      }
      if (prescriptionType) filters.prescriptionType = prescriptionType as PrescriptionType;
      if (startDateFrom) filters.startDateFrom = new Date(startDateFrom as string);
      if (startDateTo) filters.startDateTo = new Date(startDateTo as string);
      if (reviewDateFrom) filters.reviewDateFrom = new Date(reviewDateFrom as string);
      if (reviewDateTo) filters.reviewDateTo = new Date(reviewDateTo as string);
      if (requiresMonitoring !== undefined) {
        filters.requiresMonitoring = requiresMonitoring === 'true';
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = Math.min(parseInt(limit as string, 10), 100); // Max 100 per page

      const result = await this.prescriptionService.searchPrescriptions(
        filters,
        pageNum,
        limitNum
      );

      res.status(200).json({
        success: true,
        data: result.prescriptions,
        meta: {
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: result.total,
            totalPages: result.totalPages,
            hasNext: pageNum < result.totalPages,
            hasPrev: pageNum > 1
          },
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to search prescriptions via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search prescriptions',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Update prescription
   * PUT /api/v1/prescriptions/:id
   */
  async updatePrescription(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid prescription update data',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const { id } = req.params;
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!userId || !organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const updates: UpdatePrescriptionRequest = req.body;

      const updatedPrescription = await this.prescriptionService.updatePrescription(
        id,
        updates,
        userId,
        organizationId,
        tenantId
      );

      console.info('Prescription updated via API', {
        prescriptionId: id,
        userId,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: updatedPrescription,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to update prescription via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        prescriptionId: req.params['id'],
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      const statusCode = error instanceof Error ? error.message : "Unknown error".includes('not found') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : "Unknown error",
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Discontinue prescription
   * POST /api/v1/prescriptions/:id/discontinue
   */
  async discontinuePrescription(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid discontinuation data',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!userId || !organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const discontinuedPrescription = await this.prescriptionService.discontinuePrescription(
        id,
        reason,
        userId,
        organizationId,
        tenantId
      );

      console.info('Prescription discontinued via API', {
        prescriptionId: id,
        reason,
        userId,
        correlationId: req.correlationId
      });

      res.status(200).json({
        success: true,
        data: discontinuedPrescription,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to discontinue prescription via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        prescriptionId: req.params['id'],
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      const statusCode = error instanceof Error ? error.message : "Unknown error".includes('not found') ? 404 :
                        error instanceof Error ? error.message : "Unknown error".includes('Only active') ? 400 : 500;

      res.status(statusCode).json({
        success: false,
        error: {
          code: statusCode === 404 ? 'NOT_FOUND' :
                statusCode === 400 ? 'INVALID_STATUS' : 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : "Unknown error",
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Get active prescriptions for resident
   * GET /api/v1/residents/:residentId/prescriptions/active
   */
  async getActivePrescriptionsForResident(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid resident ID',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const { residentId } = req.params;
      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const prescriptions = await this.prescriptionService.getActivePrescriptionsForResident(
        residentId,
        organizationId,
        tenantId
      );

      res.status(200).json({
        success: true,
        data: prescriptions,
        meta: {
          count: prescriptions.length,
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to get active prescriptions for resident via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        residentId: req.params['residentId'],
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve active prescriptions',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Get prescriptions due for review
   * GET /api/v1/prescriptions/due-for-review
   */
  async getPrescriptionsDueForReview(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: errors.array(),
            correlationId: req.correlationId
          }
        });
        return;
      }

      const organizationId = req.user?.organizationId;
      const tenantId = req.user?.tenantId;

      if (!organizationId || !tenantId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId: req.correlationId
          }
        });
        return;
      }

      const { daysAhead = 7 } = req.query;
      const daysAheadNum = parseInt(daysAhead as string, 10);

      const prescriptions = await this.prescriptionService.getPrescriptionsDueForReview(
        organizationId,
        tenantId,
        daysAheadNum
      );

      res.status(200).json({
        success: true,
        data: prescriptions,
        meta: {
          count: prescriptions.length,
          daysAhead: daysAheadNum,
          timestamp: new Date().toISOString(),
          version: 'v1',
          correlationId: req.correlationId
        }
      });

    } catch (error: unknown) {
      console.error('Failed to get prescriptions due for review via API', {
        error: error instanceof Error ? error.message : "Unknown error",
        userId: req.user?.id,
        correlationId: req.correlationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve prescriptions due for review',
          correlationId: req.correlationId
        }
      });
    }
  }
}

/**
 * Validation rules for prescription creation
 */
export const createPrescriptionValidation = [
  body('residentId')
    .isUUID()
    .withMessage('Valid resident ID is required'),
  
  body('medicationId')
    .isUUID()
    .withMessage('Valid medication ID is required'),
  
  body('prescriberInfo.id')
    .isString()
    .notEmpty()
    .withMessage('Prescriber ID is required'),
  
  body('prescriberInfo.name')
    .isString()
    .isLength({ min: 1, max: 255 })
    .withMessage('Prescriber name is required and must be 1-255 characters'),
  
  body('prescriberInfo.profession')
    .isIn(['doctor', 'nurse_prescriber', 'pharmacist_prescriber', 'dentist', 'other'])
    .withMessage('Valid prescriber profession is required'),
  
  body('prescriberInfo.gmcNumber')
    .optional()
    .matches(/^\d{7}$/)
    .withMessage('GMC number must be 7 digits'),
  
  body('dosage.amount')
    .isFloat({ min: 0.001 })
    .withMessage('Dosage amount must be greater than 0'),
  
  body('dosage.unit')
    .isString()
    .notEmpty()
    .withMessage('Dosage unit is required'),
  
  body('dosage.frequency')
    .isIn(Object.values(FrequencyPattern))
    .withMessage('Valid frequency is required'),
  
  body('route')
    .isString()
    .notEmpty()
    .withMessage('Administration route is required'),
  
  body('indication')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Indication is required and must be 1-500 characters'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO8601 date'),
  
  body('maxDosePerDay')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum dose per day must be non-negative'),
  
  body('minIntervalHours')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Minimum interval hours must be at least 1')
];

/**
 * Validation rules for prescription updates
 */
export const updatePrescriptionValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid prescription ID is required'),
  
  body('dosage.amount')
    .optional()
    .isFloat({ min: 0.001 })
    .withMessage('Dosage amount must be greater than 0'),
  
  body('dosage.frequency')
    .optional()
    .isIn(Object.values(FrequencyPattern))
    .withMessage('Valid frequency is required'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO8601 date'),
  
  body('status')
    .optional()
    .isIn(Object.values(PrescriptionStatus))
    .withMessage('Valid prescription status is required')
];

/**
 * Validation rules for prescription discontinuation
 */
export const discontinuePrescriptionValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid prescription ID is required'),
  
  body('reason')
    .isString()
    .isLength({ min: 1, max: 500 })
    .withMessage('Discontinuation reason is required and must be 1-500 characters')
];

/**
 * Validation rules for getting prescription by ID
 */
export const getPrescriptionValidation = [
  param('id')
    .isUUID()
    .withMessage('Valid prescription ID is required')
];

/**
 * Validation rules for resident prescriptions
 */
export const getResidentPrescriptionsValidation = [
  param('residentId')
    .isUUID()
    .withMessage('Valid resident ID is required')
];

/**
 * Validation rules for prescription search
 */
export const searchPrescriptionsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(status => Object.values(PrescriptionStatus).includes(status));
      }
      return Object.values(PrescriptionStatus).includes(value);
    })
    .withMessage('Valid prescription status is required'),
  
  query('startDateFrom')
    .optional()
    .isISO8601()
    .withMessage('Start date from must be valid ISO8601 date'),
  
  query('startDateTo')
    .optional()
    .isISO8601()
    .withMessage('Start date to must be valid ISO8601 date')
];

export default PrescriptionController;
