/**
 * ============================================================================
 * Family Contact Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for family contact endpoints.
 * 
 * @module domains/family/routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for family contact functionality. Includes routes
 * for family member registration, contact scheduling, session recording,
 * and risk assessment management.
 * 
 * @routes
 * POST   /family/members                      - Register family member
 * GET    /family/members/child/:childId       - Get family members
 * PUT    /family/members/:id                  - Update family member
 * POST   /family/schedules                    - Create contact schedule
 * GET    /family/schedules/child/:childId     - Get schedules
 * PUT    /family/schedules/:id/suspend        - Suspend schedule
 * POST   /family/sessions                     - Schedule session
 * PUT    /family/sessions/:id/record          - Record session
 * PUT    /family/sessions/:id/cancel          - Cancel session
 * GET    /family/sessions/child/:childId      - Get sessions
 * POST   /family/risk-assessments             - Create assessment
 * PUT    /family/risk-assessments/:id/approve - Approve assessment
 * GET    /family/statistics                   - Get statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { FamilyContactController } from '../controllers/FamilyContactController';

const router = Router();
const familyContactController = new FamilyContactController();

// ========================================
// FAMILY MEMBER ROUTES
// ========================================

router.post('/members', familyContactController.registerFamilyMember);
router.get('/members/child/:childId', familyContactController.getFamilyMembers);
router.put('/members/:id', familyContactController.updateFamilyMember);

// ========================================
// CONTACT SCHEDULE ROUTES
// ========================================

router.post('/schedules', familyContactController.createContactSchedule);
router.get('/schedules/child/:childId', familyContactController.getContactSchedules);
router.put('/schedules/:id/suspend', familyContactController.suspendContactSchedule);

// ========================================
// CONTACT SESSION ROUTES
// ========================================

router.post('/sessions', familyContactController.scheduleContactSession);
router.put('/sessions/:id/record', familyContactController.recordContactSession);
router.put('/sessions/:id/cancel', familyContactController.cancelContactSession);
router.get('/sessions/child/:childId', familyContactController.getContactSessions);

// ========================================
// RISK ASSESSMENT ROUTES
// ========================================

router.post('/risk-assessments', familyContactController.createRiskAssessment);
router.put('/risk-assessments/:id/approve', familyContactController.approveRiskAssessment);

// ========================================
// STATISTICS ROUTES
// ========================================

router.get('/statistics', familyContactController.getFamilyContactStatistics);

export default router;
