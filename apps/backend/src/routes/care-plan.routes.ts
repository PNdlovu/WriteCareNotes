/**
 * @fileoverview Care Planning Routes - REST API Routing
 * @module Routes/CarePlanning
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * 
 * @description
 * Production-ready routing for care plan management with comprehensive
 * middleware chains and validation
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { CarePlanningService } from '../services/care-planning/CarePlanningService';
import { SimpleCarePlanController, createCarePlanValidation, updateCarePlanValidation, careGoalValidation, riskAssessmentValidation, residentPreferenceValidation } from '../controllers/care-planning/SimpleCarePlanController';
import { authenticateToken } from '../middleware/auth-middleware';
import { tenantIsolation } from '../middleware/tenant-isolation.middleware';
import { param } from 'express-validator';

/**
 * Care Planning Routes Factory
 */
export function createCarePlanRoutes(dataSource: DataSource): Router {
  const router = Router();
  const carePlanningService = new CarePlanningService(dataSource);
  const controller = new SimpleCarePlanController(carePlanningService);

  // Apply authentication to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * @route   POST /api/care-plans
   * @desc    Create new care plan
   * @access  Private
   */
  router.post(
    '/',
    createCarePlanValidation,
    controller.create.bind(controller)
  );

  /**
   * @route   GET /api/care-plans/statistics
   * @desc    Get care plan statistics
   * @access  Private
   * @note    Must be before /:id route
   */
  router.get(
    '/statistics',
    controller.getStatistics.bind(controller)
  );

  /**
   * @route   GET /api/care-plans/due-for-review
   * @desc    Get care plans due for review
   * @access  Private
   */
  router.get(
    '/due-for-review',
    controller.getDueForReview.bind(controller)
  );

  /**
   * @route   GET /api/care-plans/overdue-reviews
   * @desc    Get overdue reviews
   * @access  Private
   */
  router.get(
    '/overdue-reviews',
    controller.getOverdueReviews.bind(controller)
  );

  /**
   * @route   GET /api/care-plans/resident/:residentId/active
   * @desc    Get active care plan for resident
   * @access  Private
   */
  router.get(
    '/resident/:residentId/active',
    [param('residentId').isUUID()],
    controller.getActiveForResident.bind(controller)
  );

  /**
   * @route   GET /api/care-plans/resident/:residentId/history
   * @desc    Get care plan history for resident
   * @access  Private
   */
  router.get(
    '/resident/:residentId/history',
    [param('residentId').isUUID()],
    controller.getHistoryForResident.bind(controller)
  );

  /**
   * @route   GET /api/care-plans/:id
   * @desc    Get care plan by ID
   * @access  Private
   */
  router.get(
    '/:id',
    [param('id').isUUID()],
    controller.getById.bind(controller)
  );

  /**
   * @route   GET /api/care-plans
   * @desc    Get all care plans with filters
   * @access  Private
   */
  router.get(
    '/',
    controller.getAll.bind(controller)
  );

  /**
   * @route   PUT /api/care-plans/:id
   * @desc    Update care plan
   * @access  Private
   */
  router.put(
    '/:id',
    updateCarePlanValidation,
    controller.update.bind(controller)
  );

  /**
   * @route   DELETE /api/care-plans/:id
   * @desc    Delete care plan (soft delete)
   * @access  Private
   */
  router.delete(
    '/:id',
    [param('id').isUUID()],
    controller.delete.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/approve
   * @desc    Approve care plan
   * @access  Private
   */
  router.post(
    '/:id/approve',
    [param('id').isUUID()],
    controller.approve.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/submit
   * @desc    Submit care plan for approval
   * @access  Private
   */
  router.post(
    '/:id/submit',
    [param('id').isUUID()],
    controller.submitForApproval.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/archive
   * @desc    Archive care plan
   * @access  Private
   */
  router.post(
    '/:id/archive',
    [param('id').isUUID()],
    controller.archive.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/new-version
   * @desc    Create new version of care plan
   * @access  Private
   */
  router.post(
    '/:id/new-version',
    [param('id').isUUID(), ...createCarePlanValidation],
    controller.createNewVersion.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/goals
   * @desc    Add care goal to plan
   * @access  Private
   */
  router.post(
    '/:id/goals',
    [param('id').isUUID(), ...careGoalValidation],
    controller.addCareGoal.bind(controller)
  );

  /**
   * @route   PUT /api/care-plans/:id/goals/:goalId
   * @desc    Update care goal
   * @access  Private
   */
  router.put(
    '/:id/goals/:goalId',
    [param('id').isUUID(), param('goalId').isUUID()],
    controller.updateCareGoal.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/risks
   * @desc    Add risk assessment to plan
   * @access  Private
   */
  router.post(
    '/:id/risks',
    [param('id').isUUID(), ...riskAssessmentValidation],
    controller.addRiskAssessment.bind(controller)
  );

  /**
   * @route   PUT /api/care-plans/:id/risks/:riskId
   * @desc    Update risk assessment
   * @access  Private
   */
  router.put(
    '/:id/risks/:riskId',
    [param('id').isUUID(), param('riskId').isUUID()],
    controller.updateRiskAssessment.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/preferences
   * @desc    Add resident preference to plan
   * @access  Private
   */
  router.post(
    '/:id/preferences',
    [param('id').isUUID(), ...residentPreferenceValidation],
    controller.addResidentPreference.bind(controller)
  );

  /**
   * @route   POST /api/care-plans/:id/complete-review
   * @desc    Complete review and reset next review date
   * @access  Private
   */
  router.post(
    '/:id/complete-review',
    [param('id').isUUID()],
    controller.completeReview.bind(controller)
  );

  return router;
}

export default createCarePlanRoutes;
