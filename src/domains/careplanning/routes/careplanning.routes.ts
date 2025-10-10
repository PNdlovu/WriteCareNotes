/**
 * ============================================================================
 * Care Planning Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for care planning endpoints.
 * 
 * @module domains/careplanning/routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for care planning functionality including care plans,
 * LAC reviews, and SMART goals.
 * 
 * @routes
 * POST   /careplans                           - Create care plan
 * GET    /careplans/child/:childId            - Get care plans
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

import { Router } from 'express';
import { CarePlanningController } from '../controllers/CarePlanningController';

const router = Router();
const carePlanningController = new CarePlanningController();

// ========================================
// CARE PLAN ROUTES
// ========================================

router.post('/', carePlanningController.createCarePlan);
router.get('/child/:childId', carePlanningController.getCarePlans);
router.put('/:id', carePlanningController.updateCarePlan);
router.put('/:id/approve', carePlanningController.approveCarePlan);

// ========================================
// REVIEW ROUTES
// ========================================

router.post('/reviews', carePlanningController.scheduleReview);
router.put('/reviews/:id/complete', carePlanningController.completeReview);
router.get('/reviews/child/:childId', carePlanningController.getReviews);

// ========================================
// GOAL ROUTES
// ========================================

router.post('/goals', carePlanningController.createGoal);
router.get('/goals/careplan/:planId', carePlanningController.getGoals);
router.put('/goals/:id/progress', carePlanningController.updateGoalProgress);
router.put('/goals/:id/achieve', carePlanningController.achieveGoal);

// ========================================
// STATISTICS ROUTES
// ========================================

router.get('/statistics', carePlanningController.getStatistics);

export default router;
