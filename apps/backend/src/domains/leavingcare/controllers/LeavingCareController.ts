/**
 * ============================================================================
 * Leaving Care Controller
 * ============================================================================
 * 
 * @fileoverview REST API controller for leaving care services.
 * 
 * @module domains/leavingcare/controllers/LeavingCareController
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides HTTP endpoints for pathway plan management and leaving care support.
 * 
 * @compliance
 * - Children (Leaving Care) Act 2000
 * - Care Leavers (England) Regulations 2010
 * - OFSTED Regulation 6
 * 
 * @endpoints
 * POST   /leaving-care/pathway-plans              - Create pathway plan
 * GET    /leaving-care/pathway-plans/:childId     - Get pathway plans
 * PUT    /leaving-care/pathway-plans/:id          - Update pathway plan
 * PUT    /leaving-care/pathway-plans/:id/activate - Activate plan
 * PUT    /leaving-care/pathway-plans/:id/review   - Complete review
 * GET    /leaving-care/statistics                 - Get statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Request, Response } from 'express';
import { LeavingCareService } from '../services/LeavingCareService';
import { LeavingCareStatus } from '../entities/PathwayPlan';

export class LeavingCareController {
  private leavingCareService: LeavingCareService;

  constructor() {
    this.leavingCareService = new LeavingCareService();
  }

  /**
   * Create pathway plan
   * POST /leaving-care/pathway-plans
   */
  createPathwayPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        childId,
        organizationId,
        leavingCareStatus,
        planStartDate,
        personalAdvisor,
        createdBy
      } = req.body;

      if (!childId || !organizationId || !leavingCareStatus || !planStartDate || !personalAdvisor || !createdBy) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
        return;
      }

      if (!Object.values(LeavingCareStatus).includes(leavingCareStatus)) {
        res.status(400).json({
          success: false,
          message: `Invalid leaving care status. Must be one of: ${Object.values(LeavingCareStatus).join(', ')}`
        });
        return;
      }

      const pathwayPlan = await this.leavingCareService.createPathwayPlan(req.body);

      res.status(201).json({
        success: true,
        message: 'Pathway plan created successfully',
        data: pathwayPlan
      });
    } catch (error) {
      console.error('Error creating pathway plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create pathway plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Get pathway plans
   * GET /leaving-care/pathway-plans/:childId
   */
  getPathwayPlans = async (req: Request, res: Response): Promise<void> => {
    try {
      const { childId } = req.params;
      const { activeOnly } = req.query;

      let plans;
      if (activeOnly === 'true') {
        const activePlan = await this.leavingCareService.getActivePathwayPlan(childId);
        plans = activePlan ? [activePlan] : [];
      } else {
        plans = await this.leavingCareService.getPathwayPlans(childId);
      }

      res.status(200).json({
        success: true,
        message: 'Pathway plans retrieved successfully',
        data: plans,
        count: plans.length
      });
    } catch (error) {
      console.error('Error retrieving pathway plans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve pathway plans',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Update pathway plan
   * PUT /leaving-care/pathway-plans/:id
   */
  updatePathwayPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const pathwayPlan = await this.leavingCareService.updatePathwayPlan(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Pathway plan updated successfully',
        data: pathwayPlan
      });
    } catch (error) {
      console.error('Error updating pathway plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update pathway plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Activate pathway plan
   * PUT /leaving-care/pathway-plans/:id/activate
   */
  activatePathwayPlan = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const pathwayPlan = await this.leavingCareService.activatePathwayPlan(id);

      res.status(200).json({
        success: true,
        message: 'Pathway plan activated successfully',
        data: pathwayPlan
      });
    } catch (error) {
      console.error('Error activating pathway plan:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to activate pathway plan',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  /**
   * Complete review
   * PUT /leaving-care/pathway-plans/:id/review
   */
  completeReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const {
        progressSummary,
        achievementsHighlighted,
        areasForDevelopment,
        updatedBy
      } = req.body;

      if (!progressSummary || !updatedBy) {
        res.status(400).json({
          success: false,
          message: 'Progress summary and updatedBy are required'
        });
        return;
      }

      const pathwayPlan = await this.leavingCareService.completeReview(
        id,
        progressSummary,
        achievementsHighlighted || '',
        areasForDevelopment || '',
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Review completed successfully',
        data: pathwayPlan
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
   * Get statistics
   * GET /leaving-care/statistics
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

      const statistics = await this.leavingCareService.getLeavingCareStatistics(
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
