import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Interaction Controller for WriteCareNotes
 * @module MedicationInteractionController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for medication interaction checking, allergy alerts,
 * contraindication warnings, and clinical decision support operations.
 * 
 * @compliance
 * - MHRA Drug Safety Guidelines
 * - BNF (British National Formulary) Standards
 * - NICE Clinical Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - Professional Standards (GMC, NMC, GPhC)
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - Role-based access control
 * - Audit trail logging
 * - Input validation and sanitization
 * - Rate limiting for clinical operations
 */

import { Request, Response } from 'express';
import { MedicationInteractionService, InteractionCheckRequest } from '../../services/medication/MedicationInteractionService';
import { AuditTrailService } from '../../services/audit/AuditTrailService';
import { logger } from '../../utils/logger';
import Joi from 'joi';

export class MedicationInteractionController {
  private interactionService: MedicationInteractionService;
  private auditService: AuditTrailService;

  constructor() {
    this.interactionService = new MedicationInteractionService();
    this.auditService = new AuditTrailService();
  }

  /**
   * Check medication interactions for a resident
   */
  async checkInteractions(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const { organizationId, userId } = req.user;

      // Validate request body
      const validationResult = this.validateInteractionCheckRequest(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: validationResult.errors
          }
        });
        return;
      }

      const request: InteractionCheckRequest = {
        residentId,
        medications: req.body['medications'] || [],
        newMedication: req.body['newMedication'],
        checkAllergies: req.body['checkAllergies'] !== false,
        checkContraindications: req.body['checkContraindications'] !== false,
        organizationId,
        userId
      };

      const result = await this.interactionService.checkMedicationInteractions(request);

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      });

      console.info('Medication interaction check completed via API', {
        checkId: result.checkId,
        residentId,
        overallRisk: result.overallRisk,
        organizationId
      });
    } catch (error: unknown) {
      console.error('Error in medication interaction check API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId: req.params['residentId'],
        organizationId: req.user?.organizationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check medication interactions',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Add allergy alert for a resident
   */
  async addAllergyAlert(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const { organizationId, userId } = req.user;

      // Validate request body
      const validationResult = this.validateAllergyAlertRequest(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid allergy alert data',
            details: validationResult.errors
          }
        });
        return;
      }

      const allergyData = {
        allergen: req.body['allergen'],
        allergenType: req.body['allergenType'],
        reactionType: req.body['reactionType'],
        severity: req.body['severity'],
        symptoms: req.body['symptoms'] || [],
        onsetDate: req.body['onsetDate'] ? new Date(req.body['onsetDate']) : undefined,
        verifiedBy: req.body['verifiedBy'] || userId,
        notes: req.body['notes'],
        isActive: req.body['isActive'] !== false
      };

      const allergy = await this.interactionService.addAllergyAlert(
        residentId,
        allergyData,
        organizationId,
        userId
      );

      res.status(201).json({
        success: true,
        data: allergy,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      });

      console.info('Allergy alert added via API', {
        allergyId: allergy.id,
        residentId,
        allergen: allergy.allergen,
        severity: allergy.severity,
        organizationId
      });
    } catch (error: unknown) {
      console.error('Error adding allergy alert via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId: req.params['residentId'],
        organizationId: req.user?.organizationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to add allergy alert',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Update interaction database from external sources
   */
  async updateInteractionDatabase(req: Request, res: Response): Promise<void> {
    try {
      const { source } = req.params;
      const { organizationId, userId } = req.user;

      // Validate source parameter
      const validSources = ['bnf', 'mhra', 'nice', 'lexicomp', 'micromedex'];
      if (!validSources.includes(source)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SOURCE',
            message: `Invalid source. Must be one of: ${validSources.join(', ')}`
          }
        });
        return;
      }

      const result = await this.interactionService.updateInteractionDatabase(
        source as any,
        organizationId,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      });

      console.info('Interaction database updated via API', {
        source,
        newInteractions: result.newInteractions,
        updatedInteractions: result.updatedInteractions,
        organizationId
      });
    } catch (error: unknown) {
      console.error('Error updating interaction database via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        source: req.params['source'],
        organizationId: req.user?.organizationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to update interaction database',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Get interaction history for a resident
   */
  async getInteractionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const { organizationId } = req.user;
      const { startDate, endDate } = req.query;

      const history = await this.interactionService.getInteractionHistory(
        residentId,
        organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.status(200).json({
        success: true,
        data: history,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1',
          pagination: {
            total: history.length,
            limit: 50
          }
        }
      });

      console.info('Interaction history retrieved via API', {
        residentId,
        historyCount: history.length,
        organizationId
      });
    } catch (error: unknown) {
      console.error('Error getting interaction history via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        residentId: req.params['residentId'],
        organizationId: req.user?.organizationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get interaction history',
          correlationId: req.correlationId
        }
      });
    }
  }

  /**
   * Generate interaction report
   */
  async generateInteractionReport(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, userId } = req.user;
      const { reportType, startDate, endDate } = req.body;

      // Validate request
      const validationResult = this.validateReportRequest(req.body);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid report request',
            details: validationResult.errors
          }
        });
        return;
      }

      const dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };

      const report = await this.interactionService.generateInteractionReport(
        organizationId,
        reportType,
        dateRange,
        userId
      );

      res.status(200).json({
        success: true,
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      });

      console.info('Interaction report generated via API', {
        reportId: report.reportId,
        reportType,
        organizationId
      });
    } catch (error: unknown) {
      console.error('Error generating interaction report via API', {
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        organizationId: req.user?.organizationId
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to generate interaction report',
          correlationId: req.correlationId
        }
      });
    }
  }

  // Private validation methods

  private validateInteractionCheckRequest(data: any): { isValid: boolean; errors?: string[] } {
    const schema = Joi.object({
      medications: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          activeIngredient: Joi.string().required(),
          dosage: Joi.string().required(),
          route: Joi.string().required()
        })
      ).default([]),
      newMedication: Joi.object({
        name: Joi.string().required(),
        activeIngredient: Joi.string().required(),
        dosage: Joi.string().required(),
        route: Joi.string().required()
      }).optional(),
      checkAllergies: Joi.boolean().default(true),
      checkContraindications: Joi.boolean().default(true)
    });

    const { error } = schema.validate(data);
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message)
      };
    }

    return { isValid: true };
  }

  private validateAllergyAlertRequest(data: any): { isValid: boolean; errors?: string[] } {
    const schema = Joi.object({
      allergen: Joi.string().min(1).max(200).required(),
      allergenType: Joi.string().valid('drug', 'food', 'environmental', 'other').required(),
      reactionType: Joi.string().valid('allergy', 'intolerance', 'adverse_reaction').required(),
      severity: Joi.string().valid('mild', 'moderate', 'severe', 'anaphylaxis').required(),
      symptoms: Joi.array().items(Joi.string()).default([]),
      onsetDate: Joi.date().optional(),
      verifiedBy: Joi.string().optional(),
      notes: Joi.string().max(1000).optional(),
      isActive: Joi.boolean().default(true)
    });

    const { error } = schema.validate(data);
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message)
      };
    }

    return { isValid: true };
  }

  private validateReportRequest(data: any): { isValid: boolean; errors?: string[] } {
    const schema = Joi.object({
      reportType: Joi.string().valid('summary', 'detailed', 'trends').required(),
      startDate: Joi.date().required(),
      endDate: Joi.date().min(Joi.ref('startDate')).required()
    });

    const { error } = schema.validate(data);
    if (error) {
      return {
        isValid: false,
        errors: error.details.map(detail => detail.message)
      };
    }

    return { isValid: true };
  }
}