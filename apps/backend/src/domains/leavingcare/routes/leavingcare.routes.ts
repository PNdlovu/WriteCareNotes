/**
 * ============================================================================
 * Leaving Care Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for leaving care endpoints.
 * 
 * @module domains/leavingcare/routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for leaving care services and pathway planning.
 * 
 * @routes
 * POST   /pathway-plans              - Create pathway plan
 * GET    /pathway-plans/:childId     - Get pathway plans
 * PUT    /pathway-plans/:id          - Update pathway plan
 * PUT    /pathway-plans/:id/activate - Activate plan
 * PUT    /pathway-plans/:id/review   - Complete review
 * GET    /statistics                 - Get statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { LeavingCareController } from '../controllers/LeavingCareController';

const router = Router();
const leavingCareController = new LeavingCareController();

// ========================================
// PATHWAY PLAN ROUTES
// ========================================

router.post('/pathway-plans', leavingCareController.createPathwayPlan);
router.get('/pathway-plans/:childId', leavingCareController.getPathwayPlans);
router.put('/pathway-plans/:id', leavingCareController.updatePathwayPlan);
router.put('/pathway-plans/:id/activate', leavingCareController.activatePathwayPlan);
router.put('/pathway-plans/:id/review', leavingCareController.completeReview);

// ========================================
// STATISTICS ROUTES
// ========================================

router.get('/statistics', leavingCareController.getStatistics);

export default router;
