/**
 * @fileoverview Simple Care Planning Controller - HTTP API
 * @module Controllers/CarePlanning/CarePlanController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * 
 * @description
 * Production-ready REST API controller for my CarePlanningService
 */

import { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CarePlanningService } from '../../services/care-planning/CarePlanningService';
import { CarePlanType, CarePlanStatus, ReviewFrequency } from '../../entities/care-planning/CarePlan';

export class SimpleCarePlanController {
  constructor(private carePlanningService: CarePlanningService) {}

  /**
   * Create new care plan
   * POST /api/care-plans
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = (req as any).user.id;
      const tenantId = (req as any).tenant.id;
      const organizationId = (req as any).tenant.organizationId;

      const carePlan = await this.carePlanningService.create(
        req.body,
        userId,
        tenantId,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: carePlan,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create care plan',
      });
    }
  }

  /**
   * Get care plan by ID
   * GET /api/care-plans/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const carePlan = await this.carePlanningService.findById(id);

      if (!carePlan) {
        res.status(404).json({
          success: false,
          error: 'Care plan not found',
        });
        return;
      }

      res.json({
        success: true,
        data: carePlan,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get care plan',
      });
    }
  }

  /**
   * Get all care plans with filters
   * GET /api/care-plans
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = (req as any).tenant.organizationId;

      const filters = {
        ...req.query,
        organizationId,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
        overdueForReview: req.query.overdueForReview === 'true',
      };

      const result = await this.carePlanningService.findAll(filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get care plans',
      });
    }
  }

  /**
   * Update care plan
   * PUT /api/care-plans/:id
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

      const carePlan = await this.carePlanningService.update(id, req.body, userId);

      res.json({
        success: true,
        data: carePlan,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update care plan',
      });
    }
  }

  /**
   * Delete care plan
   * DELETE /api/care-plans/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      await this.carePlanningService.delete(id, userId);

      res.json({
        success: true,
        message: 'Care plan deleted successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete care plan',
      });
    }
  }

  /**
   * Approve care plan
   * POST /api/care-plans/:id/approve
   */
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.approve(id, userId);

      res.json({
        success: true,
        data: carePlan,
        message: 'Care plan approved successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to approve care plan',
      });
    }
  }

  /**
   * Submit for approval
   * POST /api/care-plans/:id/submit
   */
  async submitForApproval(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.submitForApproval(id, userId);

      res.json({
        success: true,
        data: carePlan,
        message: 'Care plan submitted for approval',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to submit care plan',
      });
    }
  }

  /**
   * Archive care plan
   * POST /api/care-plans/:id/archive
   */
  async archive(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.archive(id, userId);

      res.json({
        success: true,
        data: carePlan,
        message: 'Care plan archived successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to archive care plan',
      });
    }
  }

  /**
   * Create new version
   * POST /api/care-plans/:id/new-version
   */
  async createNewVersion(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = (req as any).user.id;
      const tenantId = (req as any).tenant.id;
      const organizationId = (req as any).tenant.organizationId;

      const newPlan = await this.carePlanningService.createNewVersion(
        id,
        req.body,
        userId,
        tenantId,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: newPlan,
        message: 'New care plan version created',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create new version',
      });
    }
  }

  /**
   * Add care goal
   * POST /api/care-plans/:id/goals
   */
  async addCareGoal(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.addCareGoal(id, req.body, userId);

      res.status(201).json({
        success: true,
        data: carePlan,
        message: 'Care goal added successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add care goal',
      });
    }
  }

  /**
   * Update care goal
   * PUT /api/care-plans/:id/goals/:goalId
   */
  async updateCareGoal(req: Request, res: Response): Promise<void> {
    try {
      const { id, goalId } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.updateCareGoal(
        id,
        goalId,
        req.body,
        userId
      );

      res.json({
        success: true,
        data: carePlan,
        message: 'Care goal updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update care goal',
      });
    }
  }

  /**
   * Add risk assessment
   * POST /api/care-plans/:id/risks
   */
  async addRiskAssessment(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.addRiskAssessment(id, req.body, userId);

      res.status(201).json({
        success: true,
        data: carePlan,
        message: 'Risk assessment added successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add risk assessment',
      });
    }
  }

  /**
   * Update risk assessment
   * PUT /api/care-plans/:id/risks/:riskId
   */
  async updateRiskAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { id, riskId } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.updateRiskAssessment(
        id,
        riskId,
        req.body,
        userId
      );

      res.json({
        success: true,
        data: carePlan,
        message: 'Risk assessment updated successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update risk assessment',
      });
    }
  }

  /**
   * Add resident preference
   * POST /api/care-plans/:id/preferences
   */
  async addResidentPreference(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.addResidentPreference(
        id,
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        data: carePlan,
        message: 'Resident preference added successfully',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add resident preference',
      });
    }
  }

  /**
   * Get plans due for review
   * GET /api/care-plans/due-for-review
   */
  async getDueForReview(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = (req as any).tenant.organizationId;
      const daysAhead = req.query.daysAhead
        ? parseInt(req.query.daysAhead as string, 10)
        : 7;

      const plans = await this.carePlanningService.getDueForReview(daysAhead, organizationId);

      res.json({
        success: true,
        data: plans,
        count: plans.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get plans due for review',
      });
    }
  }

  /**
   * Get overdue reviews
   * GET /api/care-plans/overdue-reviews
   */
  async getOverdueReviews(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = (req as any).tenant.organizationId;

      const plans = await this.carePlanningService.getOverdueReviews(organizationId);

      res.json({
        success: true,
        data: plans,
        count: plans.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get overdue reviews',
      });
    }
  }

  /**
   * Get active plan for resident
   * GET /api/care-plans/resident/:residentId/active
   */
  async getActiveForResident(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;

      const carePlan = await this.carePlanningService.getActiveForResident(residentId);

      if (!carePlan) {
        res.status(404).json({
          success: false,
          error: 'No active care plan found for this resident',
        });
        return;
      }

      res.json({
        success: true,
        data: carePlan,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get active care plan',
      });
    }
  }

  /**
   * Get history for resident
   * GET /api/care-plans/resident/:residentId/history
   */
  async getHistoryForResident(req: Request, res: Response): Promise<void> {
    try {
      const { residentId } = req.params;

      const plans = await this.carePlanningService.getHistoryForResident(residentId);

      res.json({
        success: true,
        data: plans,
        count: plans.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get care plan history',
      });
    }
  }

  /**
   * Get statistics
   * GET /api/care-plans/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = (req as any).tenant.organizationId;

      const stats = await this.carePlanningService.getStatistics(organizationId);

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
   * Complete review
   * POST /api/care-plans/:id/complete-review
   */
  async completeReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const carePlan = await this.carePlanningService.completeReview(id, userId);

      res.json({
        success: true,
        data: carePlan,
        message: 'Review completed and next review date scheduled',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to complete review',
      });
    }
  }
}

/**
 * Validation rules for care plan creation
 */
export const createCarePlanValidation = [
  body('residentId').isUUID().withMessage('Valid resident ID is required'),
  body('planName').notEmpty().withMessage('Plan name is required'),
  body('planType').isIn(Object.values(CarePlanType)).withMessage('Valid plan type is required'),
  body('effectiveFrom').isISO8601().withMessage('Valid effective from date is required'),
  body('reviewFrequency').isIn(Object.values(ReviewFrequency)).withMessage('Valid review frequency is required'),
  body('careGoals').optional().isArray(),
  body('riskAssessments').optional().isArray(),
];

/**
 * Validation rules for care plan update
 */
export const updateCarePlanValidation = [
  param('id').isUUID().withMessage('Valid care plan ID is required'),
  body('planName').optional().notEmpty().withMessage('Plan name cannot be empty'),
  body('reviewFrequency').optional().isIn(Object.values(ReviewFrequency)),
  body('nextReviewDate').optional().isISO8601(),
];

/**
 * Validation rules for care goal
 */
export const careGoalValidation = [
  body('description').notEmpty().withMessage('Goal description is required'),
  body('category').notEmpty().withMessage('Goal category is required'),
  body('targetDate').optional().isISO8601(),
  body('status').optional().isIn(['active', 'achieved', 'modified', 'discontinued']),
];

/**
 * Validation rules for risk assessment
 */
export const riskAssessmentValidation = [
  body('riskType').notEmpty().withMessage('Risk type is required'),
  body('riskLevel').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid risk level is required'),
  body('description').notEmpty().withMessage('Risk description is required'),
  body('mitigationStrategies').isArray().withMessage('Mitigation strategies must be an array'),
];

/**
 * Validation rules for resident preference
 */
export const residentPreferenceValidation = [
  body('category').notEmpty().withMessage('Preference category is required'),
  body('preference').notEmpty().withMessage('Preference is required'),
  body('importance').isIn(['low', 'medium', 'high', 'critical']).withMessage('Valid importance level is required'),
];

export default SimpleCarePlanController;
