/**
 * @fileoverview Medication Controller - HTTP API for eMAR
 * @module Controllers/Medication/MedicationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * 
 * @description
 * Production-ready REST API controller for medication management
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { MedicationManagementService } from '../../services/medication/MedicationManagementService';

export class SimpleMedicationController {
  const ructor(private medicationService: MedicationManagementService) {}

  /**
   * Create new medication prescription
   * POST /api/medications
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = (req as any).user.id;

      const medication = await this.medicationService.create(req.body, userId);

      res.status(201).json({
        success: true,
        data: medication,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create medication',
      });
    }
  }

  /**
   * Get medication by ID
   * GET /api/medications/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const medication = await this.medicationService.findById(id);

      if (!medication) {
        res.status(404).json({
          success: false,
          error: 'Medication not found',
        });
        return;
      }

      res.json({
        success: true,
        data: medication,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get medication',
      });
    }
  }

  /**
   * Get all medications with filters
   * GET /api/medications
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        ...req.query,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        isAdministered: req.query.isAdministered === 'true' ? true :
                        req.query.isAdministered === 'false' ? false : undefined,
      };

      const result = await this.medicationService.findAll(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get medications',
      });
    }
  }

  /**
   * Update medication prescription
   * PUT /api/medications/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = (req as any).user.id;

      const medication = await this.medicationService.update(id, req.body, userId);

      res.json({
        success: true,
        data: medication,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update medication',
      });
    }
  }

  /**
   * Delete medication record
   * DELETE /api/medications/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await this.medicationService.delete(id, userId);

      res.json({
        success: true,
        message: 'Medication deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete medication',
      });
    }
  }

  /**
   * Administer medication (eMAR)
   * POST /api/medications/:id/administer
   */
  async administer(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = (req as any).user.id;

      const dto = {
        ...req.body,
        administeredBy: userId,
        administeredDate: req.body.administeredDate ? new Date(req.body.administeredDate) : new Date(),
      };

      const medication = await this.medicationService.administer(id, dto);

      res.json({
        success: true,
        data: medication,
        message: 'Medication administered successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to administer medication',
      });
    }
  }

  /**
   * Get medication schedule for resident
   * GET /api/medications/resident/:residentId/schedule
   */
  async getScheduleForResident(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const date = req.query.date ? new Date(req.query.date as string) : new Date();

      const schedule = await this.medicationService.getScheduleForResident(residentId, date);

      res.json({
        success: true,
        data: schedule,
        count: schedule.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get medication schedule',
      });
    }
  }

  /**
   * Get due medications
   * GET /api/medications/due
   */
  async getDueMedications(req: Request, res: Response): Promise<void> {
    try {
      const beforeDate = req.query.beforeDate
        ? new Date(req.query.beforeDate as string)
        : new Date();

      const medications = await this.medicationService.getDueMedications(beforeDate);

      res.json({
        success: true,
        data: medications,
        count: medications.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get due medications',
      });
    }
  }

  /**
   * Get overdue medications
   * GET /api/medications/overdue
   */
  async getOverdueMedications(req: Request, res: Response): Promise<void> {
    try {
      const medications = await this.medicationService.getOverdueMedications();

      res.json({
        success: true,
        data: medications,
        count: medications.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overdue medications',
      });
    }
  }

  /**
   * Get medication history for resident
   * GET /api/medications/resident/:residentId/history
   */
  async getHistoryForResident(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;

      const history = await this.medicationService.getHistoryForResident(residentId, days);

      res.json({
        success: true,
        data: history,
        count: history.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get medication history',
      });
    }
  }

  /**
   * Get active medications for resident
   * GET /api/medications/resident/:residentId/active
   */
  async getActiveForResident(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;

      const medications = await this.medicationService.getActiveForResident(residentId);

      res.json({
        success: true,
        data: medications,
        count: medications.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get active medications',
      });
    }
  }

  /**
   * Get medication statistics
   * GET /api/medications/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.medicationService.getStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get statistics',
      });
    }
  }

  /**
   * Search medications by name
   * GET /api/medications/search
   */
  async searchByName(req: Request, res: Response): Promise<void> {
    try {
      const { name, limit } = req.query;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Search name is required',
        });
        return;
      }

      const limitNum = limit ? parseInt(limit as string, 10) : 10;

      const medications = await this.medicationService.searchByName(name as string, limitNum);

      res.json({
        success: true,
        data: medications,
        count: medications.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search medications',
      });
    }
  }

  /**
   * Restore deleted medication
   * POST /api/medications/:id/restore
   */
  async restore(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const medication = await this.medicationService.restore(id);

      res.json({
        success: true,
        data: medication,
        message: 'Medication restored successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to restore medication',
      });
    }
  }
}

/**
 * Validation rules for medication creation
 */
export const createMedicationValidation = [
  body('residentId').isUUID().withMessage('Valid resident ID is required'),
  body('medicationName').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('prescribedDate').isISO8601().withMessage('Valid prescribed date is required'),
  body('prescribedBy').optional().isString(),
  body('instructions').optional().isString(),
  body('route').optional().isString(),
  body('duration').optional().isInt({ min: 1 }),
];

/**
 * Validation rules for medication update
 */
export const updateMedicationValidation = [
  param('id').isUUID().withMessage('Valid medication ID is required'),
  body('medicationName').optional().notEmpty(),
  body('dosage').optional().notEmpty(),
  body('frequency').optional().notEmpty(),
  body('prescribedDate').optional().isISO8601(),
];

/**
 * Validation rules for administration
 */
export const administerMedicationValidation = [
  param('id').isUUID().withMessage('Valid medication ID is required'),
  body('administeredDate').optional().isISO8601(),
  body('witnessedBy').optional().isUUID(),
  body('notes').optional().isString(),
];

export default SimpleMedicationController;
