/**
 * @fileoverview RESTful API controller for medication reconciliation operations
 * @module Medication/MedicationReconciliationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description RESTful API controller for medication reconciliation operations
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Reconciliation Controller for WriteCareNotes
 * @module MedicationReconciliationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description RESTful API controller for medication reconciliation operations
 * including admission, discharge, and transfer reconciliation processes with
 * comprehensive discrepancy management and pharmacist workflow integration.
 * 
 * @compliance
 * - NICE Clinical Guidelines CG76 - Medicines reconciliation
 * - Royal Pharmaceutical Society Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - Role-based access control
 * - Input validation and sanitization
 * - Comprehensive audit logging
 * - Rate limiting protection
 */

import { Request, Response } from 'express';
import Joi from 'joi';
import { 
  MedicationReconciliationService,
  ReconciliationRequest,
  MedicationSource,
  ReconciliationMedication,
  DiscrepancyResolution,
  PharmacistReview
} from '../../services/medication/MedicationReconciliationService';
import { logger } from '../../utils/logger';

export class MedicationReconciliationController {
  private reconciliationService: MedicationReconciliationService;

  constructor() {
    this.reconciliationService = new MedicationReconciliationService();
  }

  /**
   * @swagger
   * /api/v1/medication-reconciliation/initiate:
   *   post:
   *     summary: Initiate medication reconciliation process
   *     description: Start a new medication reconciliation for admission, discharge, or transfer
   *     tags: [Medication Reconciliation]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - residentId
   *               - reconciliationType
   *               - sourceList
   *               - performedBy
   *             properties:
   *               residentId:
   *                 type: string
   *                 description: Unique identifier for the resident
   *               reconciliationType:
   *                 type: string
   *                 enum: [admission, discharge, transfer, periodic_review]
   *                 description: Type of reconciliation being performed
   *               sourceList:
   *                 $ref: '#/components/schemas/MedicationSource'
   *               targetList:
   *                 $ref: '#/components/schemas/MedicationSource'
   *               performedBy:
   *                 type: string
   *                 description: ID of the healthcare professional performing reconciliation
   *               clinicalNotes:
   *                 type: string
   *                 description: Additional clinical notes
   *               transferDetails:
   *                 type: object
   *                 properties:
   *                   fromLocation:
   *                     type: string
   *                   toLocation:
   *                     type: string
   *                   transferDate:
   *                     type: string
   *                     format: date-time
   *                   transferReason:
   *                     type: string
   *     responses:
   *       201:
   *         description: Reconciliation initiated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/MedicationReconciliationRecord'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       422:
   *         $ref: '#/components/responses/ValidationError'
   */
  async initiateReconciliation(req: Request, res: Response): Promise<void> {
    try {
      const validationSchema = Joi.object({
        residentId: Joi.string().required(),
        reconciliationType: Joi.string().valid('admission', 'discharge', 'transfer', 'periodic_review').required(),
        sourceList: Joi.object({
          sourceType: Joi.string().valid('home_medications', 'hospital_medications', 'gp_list', 'pharmacy_records', 'care_home_mar').required(),
          sourceDate: Joi.date().required(),
          medications: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            genericName: Joi.string().optional(),
            activeIngredient: Joi.string().required(),
            strength: Joi.string().required(),
            dosage: Joi.string().required(),
            frequency: Joi.string().required(),
            route: Joi.string().required(),
            indication: Joi.string().optional(),
            prescriber: Joi.string().optional(),
            startDate: Joi.date().optional(),
            endDate: Joi.date().optional(),
            lastTaken: Joi.date().optional(),
            adherence: Joi.string().valid('good', 'poor', 'unknown').optional(),
            source: Joi.string().required(),
            isActive: Joi.boolean().required()
          })).min(1).required(),
          verifiedBy: Joi.string().optional(),
          verificationDate: Joi.date().optional(),
          reliability: Joi.string().valid('high', 'medium', 'low', 'unverified').required(),
          notes: Joi.string().optional()
        }).required(),
        targetList: Joi.object({
          sourceType: Joi.string().valid('home_medications', 'hospital_medications', 'gp_list', 'pharmacy_records', 'care_home_mar').required(),
          sourceDate: Joi.date().required(),
          medications: Joi.array().items(Joi.object({
            name: Joi.string().required(),
            genericName: Joi.string().optional(),
            activeIngredient: Joi.string().required(),
            strength: Joi.string().required(),
            dosage: Joi.string().required(),
            frequency: Joi.string().required(),
            route: Joi.string().required(),
            indication: Joi.string().optional(),
            prescriber: Joi.string().optional(),
            startDate: Joi.date().optional(),
            endDate: Joi.date().optional(),
            lastTaken: Joi.date().optional(),
            adherence: Joi.string().valid('good', 'poor', 'unknown').optional(),
            source: Joi.string().required(),
            isActive: Joi.boolean().required()
          })).required(),
          verifiedBy: Joi.string().optional(),
          verificationDate: Joi.date().optional(),
          reliability: Joi.string().valid('high', 'medium', 'low', 'unverified').required(),
          notes: Joi.string().optional()
        }).optional(),
        performedBy: Joi.string().required(),
        clinicalNotes: Joi.string().optional(),
        transferDetails: Joi.object({
          fromLocation: Joi.string().required(),
          toLocation: Joi.string().required(),
          transferDate: Joi.date().required(),
          transferReason: Joi.string().required()
        }).optional()
      });

      const { error, value } = validationSchema.validate(req.body);
      if (error) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }

      const reconciliationRequest: ReconciliationRequest = {
        ...value,
        organizationId: req.user.organizationId
      };

      const reconciliationRecord = await this.reconciliationService.initiateReconciliation(
        reconciliationRequest,
        req.user.id
      );

      res.status(201).json({
        success: true,
        data: reconciliationRecord,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      console.info('Medication reconciliation initiated via API', {
        reconciliationId: reconciliationRecord.id,
        residentId: reconciliationRequest.residentId,
        reconciliationType: reconciliationRequest.reconciliationType,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

    } catch (error: unknown) {
      console.error('Error initiating medication reconciliation via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        requestBody: req.body
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to initiate medication reconciliation',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * @swagger
   * /api/v1/medication-reconciliation/{reconciliationId}/discrepancies/{discrepancyId}/resolve:
   *   post:
   *     summary: Resolve medication discrepancy
   *     description: Resolve a specific discrepancy found during reconciliation
   *     tags: [Medication Reconciliation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reconciliationId
   *         required: true
   *         schema:
   *           type: string
   *         description: Reconciliation record ID
   *       - in: path
   *         name: discrepancyId
   *         required: true
   *         schema:
   *           type: string
   *         description: Discrepancy ID to resolve
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - resolutionType
   *               - resolutionAction
   *               - rationale
   *             properties:
   *               resolutionType:
   *                 type: string
   *                 enum: [medication_added, medication_removed, dose_adjusted, frequency_changed, route_changed, no_action_required, clinical_review_requested]
   *               resolutionAction:
   *                 type: string
   *                 description: Detailed description of the resolution action taken
   *               rationale:
   *                 type: string
   *                 description: Clinical rationale for the resolution
   *               followUpRequired:
   *                 type: boolean
   *                 description: Whether follow-up is required
   *               followUpDate:
   *                 type: string
   *                 format: date-time
   *                 description: Date for follow-up if required
   *     responses:
   *       200:
   *         description: Discrepancy resolved successfully
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  async resolveDiscrepancy(req: Request, res: Response): Promise<void> {
    try {
      const { reconciliationId, discrepancyId } = req.params;

      const validationSchema = Joi.object({
        resolutionType: Joi.string().valid(
          'medication_added', 'medication_removed', 'dose_adjusted', 
          'frequency_changed', 'route_changed', 'no_action_required', 
          'clinical_review_requested'
        ).required(),
        resolutionAction: Joi.string().min(10).max(1000).required(),
        rationale: Joi.string().min(10).max(2000).required(),
        followUpRequired: Joi.boolean().required(),
        followUpDate: Joi.date().when('followUpRequired', {
          is: true,
          then: Joi.required(),
          otherwise: Joi.optional()
        })
      });

      const { error, value } = validationSchema.validate(req.body);
      if (error) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid resolution data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }

      const resolution = await this.reconciliationService.resolveDiscrepancy(
        reconciliationId,
        discrepancyId,
        value,
        req.user.organizationId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: resolution,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      console.info('Medication discrepancy resolved via API', {
        reconciliationId,
        discrepancyId,
        resolutionId: resolution.id,
        resolutionType: resolution.resolutionType,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

    } catch (error: unknown) {
      console.error('Error resolving medication discrepancy via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        reconciliationId: req.params['reconciliationId'],
        discrepancyId: req.params['discrepancyId'],
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Reconciliation record or discrepancy not found',
            correlationId: req.correlationId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to resolve discrepancy',
            correlationId: req.correlationId
          }
        });
      }
    }
  }

  /**
   * @swagger
   * /api/v1/medication-reconciliation/{reconciliationId}/pharmacist-review:
   *   post:
   *     summary: Perform pharmacist review
   *     description: Complete pharmacist review of medication reconciliation
   *     tags: [Medication Reconciliation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: reconciliationId
   *         required: true
   *         schema:
   *           type: string
   *         description: Reconciliation record ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PharmacistReviewRequest'
   *     responses:
   *       200:
   *         description: Pharmacist review completed successfully
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  async performPharmacistReview(req: Request, res: Response): Promise<void> {
    try {
      const { reconciliationId } = req.params;

      // Verify user has pharmacist role
      if (!req.user.roles.includes('pharmacist') && !req.user.roles.includes('clinical_pharmacist')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only pharmacists can perform medication reconciliation reviews'
          }
        });
        return;
      }

      const validationSchema = Joi.object({
        pharmacistName: Joi.string().required(),
        reviewType: Joi.string().valid('initial', 'follow_up', 'final_approval').required(),
        recommendations: Joi.array().items(Joi.string()).min(0).required(),
        clinicalAssessment: Joi.string().min(20).max(5000).required(),
        riskAssessment: Joi.object({
          overallRisk: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
          specificRisks: Joi.array().items(Joi.string()).required(),
          mitigationStrategies: Joi.array().items(Joi.string()).required()
        }).required(),
        approvalStatus: Joi.string().valid('approved', 'requires_changes', 'rejected').required(),
        notes: Joi.string().max(5000).required()
      });

      const { error, value } = validationSchema.validate(req.body);
      if (error) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }

      const review = await this.reconciliationService.performPharmacistReview(
        reconciliationId,
        value,
        req.user.organizationId,
        req.user.id
      );

      res.status(200).json({
        success: true,
        data: review,
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      console.info('Pharmacist review completed via API', {
        reconciliationId,
        pharmacistId: req.user.id,
        reviewType: review.reviewType,
        approvalStatus: review.approvalStatus,
        organizationId: req.user.organizationId
      });

    } catch (error: unknown) {
      console.error('Error performing pharmacist review via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        reconciliationId: req.params['reconciliationId'],
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Reconciliation record not found',
            correlationId: req.correlationId
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to complete pharmacist review',
            correlationId: req.correlationId
          }
        });
      }
    }
  }

  /**
   * @swagger
   * /api/v1/medication-reconciliation/residents/{residentId}/history:
   *   get:
   *     summary: Get reconciliation history for resident
   *     description: Retrieve medication reconciliation history for a specific resident
   *     tags: [Medication Reconciliation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: residentId
   *         required: true
   *         schema:
   *           type: string
   *         description: Resident ID
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 50
   *           default: 10
   *         description: Maximum number of records to return
   *     responses:
   *       200:
   *         description: Reconciliation history retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/ReconciliationSummary'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   */
  async getReconciliationHistory(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const limit = parseInt(req.query['limit'] as string) || 10;

      if (limit < 1 || limit > 50) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Limit must be between 1 and 50'
          }
        });
        return;
      }

      const history = await this.reconciliationService.getReconciliationHistory(
        residentId,
        req.user.organizationId,
        limit
      );

      res.status(200).json({
        success: true,
        data: history,
        meta: {
          count: history.length,
          limit,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      console.info('Reconciliation history retrieved via API', {
        residentId,
        recordCount: history.length,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

    } catch (error: unknown) {
      console.error('Error retrieving reconciliation history via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId: req.params['residentId'],
        userId: req.user?.id,
        organizationId: req.user?.organizationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve reconciliation history',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * @swagger
   * /api/v1/medication-reconciliation/metrics:
   *   get:
   *     summary: Get reconciliation metrics and analytics
   *     description: Retrieve medication reconciliation metrics for the organization
   *     tags: [Medication Reconciliation]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: Start date for metrics period
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *         description: End date for metrics period
   *     responses:
   *       200:
   *         description: Reconciliation metrics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/ReconciliationMetrics'
   *       400:
   *         $ref: '#/components/responses/BadRequest'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   */
  async getReconciliationMetrics(req: Request, res: Response): Promise<void> {
    try {
      // Verify user has appropriate permissions for metrics
      if (!req.user.roles.includes('administrator') && 
          !req.user.roles.includes('clinical_manager') &&
          !req.user.roles.includes('pharmacist')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to access reconciliation metrics'
          }
        });
        return;
      }

      const validationSchema = Joi.object({
        startDate: Joi.date().required(),
        endDate: Joi.date().min(Joi.ref('startDate')).required()
      });

      const { error, value } = validationSchema.validate({
        startDate: req.query['startDate'],
        endDate: req.query['endDate']
      });

      if (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid date parameters',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message
            }))
          }
        });
        return;
      }

      const metrics = await this.reconciliationService.generateReconciliationMetrics(
        req.user.organizationId,
        {
          startDate: new Date(value.startDate),
          endDate: new Date(value.endDate)
        }
      );

      res.status(200).json({
        success: true,
        data: metrics,
        meta: {
          dateRange: {
            startDate: value.startDate,
            endDate: value.endDate
          },
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      });

      console.info('Reconciliation metrics retrieved via API', {
        dateRange: { startDate: value.startDate, endDate: value.endDate },
        totalReconciliations: metrics.totalReconciliations,
        userId: req.user.id,
        organizationId: req.user.organizationId
      });

    } catch (error: unknown) {
      console.error('Error retrieving reconciliation metrics via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        userId: req.user?.id,
        organizationId: req.user?.organizationId,
        query: req.query
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to retrieve reconciliation metrics',
          correlationId: req.correlationId
        }
      });
    }
  }
}