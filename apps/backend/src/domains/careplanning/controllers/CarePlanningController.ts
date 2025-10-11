/**
 * ============================================================================
 * Care Planning Controller
 * ============================================================================
 * 
 * @fileoverview REST API controller for care planning operations.
 * 
 * @module domains/careplanning/controllers/CarePlanningController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides HTTP endpoints for care plan management, LAC reviews, and goal
 * tracking. Implements statutory requirements for looked after children.
 * 
 * @compliance
 * - OFSTED Regulation 5 (Care planning)
 * - Care Planning, Placement and Case Review Regulations 2010
 * - IRO Handbook 2010
 * 
 * @endpoints
 * POST   /careplans                           - Create care plan
 * GET    /careplans/child/:childId            - Get care plans
 * GET    /careplans/:id                       - Get care plan by ID
 * PUT    /careplans/:id                       - Update care plan
 * PUT    /careplans/:id/approve               - Approve care plan
 * POST   /careplans/reviews                   - Schedule review
 * PUT    /careplans/reviews/:id/complete      - Complete review
 * GET    /careplans/reviews/child/:childId    - Get reviews
 * POST   /careplans/goals                     - Create goal
 * GET    /careplans/goals/careplan/:planId    - Get goals
 * PUT    /careplans/goals/:id/progress        - Update progress
 * PUT    /careplans/goals/:id/achieve         - Achieve goal
 * GET    /careplans/statistics                - Get statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { CarePlanningService } from '../services/CarePlanningService';
import { CarePlanType } from '../entities/CarePlan';
import { ReviewType } from '../entities/CarePlanReview';
import { GoalDomain, GoalPriority } from '../entities/CarePlanGoal';

export class CarePlanningController {
  privatecarePlanningService: CarePlanningService;

  constructor() {
    this.carePlanningService = new CarePlanningService();
  }

  // ========================================
  // CARE PLAN ENDPOINTS
  // ========================================

  /**
   * Create care plan
   * POST /careplans
   */
  createCarePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        organizationId,
        planType,
        planStartDate,
        permanenceGoal,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !organizationId || !planStartDate || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate plan type
      if (planType && !Object.values(CarePlanType).includes(planType)) {
        res.status(400).json({
          success: false,
          message: `Invalid plan type. Must be one of: ${Object.values(CarePlanType).join(', ')}`
        });
        return;
      }

      const carePlan = await this.carePlanningService.createCarePlan(req.body);

      res.status(201).json({
        success: true,
        message: 'Care plan created successfully',
        data: carePlan
      });
    } catch (error) {
      console.error('Error creating care plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create care plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get care plans for child
   * GET /careplans/child/:childId
   */
  getCarePlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;
      const { activeOnly } = req.query;

      let carePlans;
      if (activeOnly === 'true') {
        const activePlan = await this.carePlanningService.getActiveCarePlan(childId);
        carePlans = activePlan ? [activePlan] : [];
      } else {
        carePlans = await this.carePlanningService.getCarePlans(childId);
      }

      res.status(200).json({
        success: true,
        message: 'Care plans retrieved successfully',
        data: carePlans,
        count: carePlans.length
      });
    } catch (error) {
      console.error('Error retrieving care plans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve care plans',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update care plan
   * PUT /careplans/:id
   */
  updateCarePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const carePlan = await this.carePlanningService.updateCarePlan(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Care plan updated successfully',
        data: carePlan
      });
    } catch (error) {
      console.error('Error updating care plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update care plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Approve care plan
   * PUT /careplans/:id/approve
   */
  approveCarePlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { approvedBy, approverRole, approvalComments } = req.body;

      if (!approvedBy || !approverRole) {
        res.status(400).json({
          success: false,
          message: 'Approver name and role are required'
        });
        return;
      }

      const carePlan = await this.carePlanningService.approveCarePlan(
        id,
        approvedBy,
        approverRole,
        approvalComments
      );

      res.status(200).json({
        success: true,
        message: 'Care plan approved successfully',
        data: carePlan
      });
    } catch (error) {
      console.error('Error approving care plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve care plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // REVIEW ENDPOINTS
  // ========================================

  /**
   * Schedule review
   * POST /careplans/reviews
   */
  scheduleReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        carePlanId,
        organizationId,
        reviewType,
        scheduledDate,
        independentReviewingOfficer,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !carePlanId || !organizationId || !scheduledDate || !independentReviewingOfficer || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate review type
      if (reviewType && !Object.values(ReviewType).includes(reviewType)) {
        res.status(400).json({
          success: false,
          message: `Invalid review type. Must be one of: ${Object.values(ReviewType).join(', ')}`
        });
        return;
      }

      const review = await this.carePlanningService.scheduleReview(req.body);

      res.status(201).json({
        success: true,
        message: 'Review scheduled successfully',
        data: review
      });
    } catch (error) {
      console.error('Error scheduling review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to schedule review',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Complete review
   * PUT /careplans/reviews/:id/complete
   */
  completeReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const review = await this.carePlanningService.completeReview(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Review completed successfully',
        data: review
      });
    } catch (error) {
      console.error('Error completing review:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to complete review',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get reviews for child
   * GET /careplans/reviews/child/:childId
   */
  getReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;

      const reviews = await this.carePlanningService.getReviews(childId);

      res.status(200).json({
        success: true,
        message: 'Reviews retrieved successfully',
        data: reviews,
        count: reviews.length
      });
    } catch (error) {
      console.error('Error retrieving reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve reviews',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // GOAL ENDPOINTS
  // ========================================

  /**
   * Create goal
   * POST /careplans/goals
   */
  createGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        carePlanId,
        organizationId,
        goalDomain,
        goalStatement,
        measurableOutcomes,
        targetDate,
        startDate,
        leadProfessional,
        createdBy
      } = req.body;

      // Validation
      if (!childId || !carePlanId || !organizationId || !goalStatement || !measurableOutcomes || !targetDate || !startDate || !leadProfessional || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      // Validate goal domain
      if (goalDomain && !Object.values(GoalDomain).includes(goalDomain)) {
        res.status(400).json({
          success: false,
          message: `Invalid goal domain. Must be one of: ${Object.values(GoalDomain).join(', ')}`
        });
        return;
      }

      // Validate priority
      if (req.body.priority && !Object.values(GoalPriority).includes(req.body.priority)) {
        res.status(400).json({
          success: false,
          message: `Invalid priority. Must be one of: ${Object.values(GoalPriority).join(', ')}`
        });
        return;
      }

      const goal = await this.carePlanningService.createGoal(req.body);

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: goal
      });
    } catch (error) {
      console.error('Error creating goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get goals for care plan
   * GET /careplans/goals/careplan/:planId
   */
  getGoals = async (req: Request, res: Response): Promise<void> => {
    try {
      const { planId } = req.params;
      const { activeOnly } = req.query;

      let goals;
      if (activeOnly === 'true') {
        goals = await this.carePlanningService.getActiveGoals(planId);
      } else {
        goals = await this.carePlanningService.getGoals(planId);
      }

      res.status(200).json({
        success: true,
        message: 'Goals retrieved successfully',
        data: goals,
        count: goals.length
      });
    } catch (error) {
      console.error('Error retrieving goals:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update goal progress
   * PUT /careplans/goals/:id/progress
   */
  updateGoalProgress = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { progressPercentage, progressNotes, updatedBy } = req.body;

      if (progressPercentage === undefined || !progressNotes || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'Progress percentage, notes, and updatedBy are required'
        });
        return;
      }

      if (progressPercentage < 0 || progressPercentage > 100) {
        res.status(400).json({
          success: false,
          message: 'Progress percentage must be between 0 and 100'
        });
        return;
      }

      const goal = await this.carePlanningService.updateGoalProgress(
        id,
        progressPercentage,
        progressNotes,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Goal progress updated successfully',
        data: goal
      });
    } catch (error) {
      console.error('Error updating goal progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update goal progress',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Achieve goal
   * PUT /careplans/goals/:id/achieve
   */
  achieveGoal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { achievedDate, outcomeEvaluation, updatedBy } = req.body;

      if (!achievedDate || !outcomeEvaluation || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'Achieved date, outcome evaluation, and updatedBy are required'
        });
        return;
      }

      const goal = await this.carePlanningService.achieveGoal(
        id,
        new Date(achievedDate),
        outcomeEvaluation,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Goal achieved successfully',
        data: goal
      });
    } catch (error) {
      console.error('Error achieving goal:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to achieve goal',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  // ========================================
  // STATISTICS ENDPOINTS
  // ========================================

  /**
   * Get care planning statistics
   * GET /careplans/statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { organizationId } = req.query;

      if (!organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization ID is required'
        });
        return;
      }

      const statistics = await this.carePlanningService.getCarePlanningStatistics(
        organizationId as string
      );

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: statistics
      });
    } catch (error) {
      console.error('Error retrieving statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}
