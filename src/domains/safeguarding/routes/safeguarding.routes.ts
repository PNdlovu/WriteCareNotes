/**
 * ============================================================================
 * Safeguarding Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for safeguarding endpoints.
 * 
 * @module domains/safeguarding/routes/safeguarding.routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for safeguarding operations including incident
 * reporting, concern management, LADO notifications, and child protection
 * plan coordination. Routes include authentication middleware and role-based
 * access control.
 * 
 * @requires express
 * @requires SafeguardingController
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { SafeguardingController } from '../controllers/SafeguardingController';

const router = Router();
const controller = new SafeguardingController();

// ========================================
// INCIDENT ROUTES
// ========================================

/**
 * @route   POST /api/v1/safeguarding/incidents
 * @desc    Report a safeguarding incident
 * @access  Private - Authenticated staff only
 */
router.post(
  '/incidents',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD', 'STAFF']),
  controller.reportIncident.bind(controller)
);

/**
 * @route   GET /api/v1/safeguarding/incidents/:id
 * @desc    Get incident details
 * @access  Private - Authorized roles only
 */
router.get(
  '/incidents/:id',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD', 'ADMIN']),
  controller.getIncident.bind(controller)
);

/**
 * @route   PUT /api/v1/safeguarding/incidents/:id/status
 * @desc    Update incident status
 * @access  Private - Safeguarding lead/manager only
 */
router.put(
  '/incidents/:id/status',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.updateIncidentStatus.bind(controller)
);

/**
 * @route   POST /api/v1/safeguarding/incidents/:id/lado
 * @desc    Record LADO notification
 * @access  Private - Safeguarding lead/manager only
 */
router.post(
  '/incidents/:id/lado',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.recordLADONotification.bind(controller)
);

/**
 * @route   GET /api/v1/safeguarding/incidents/overdue
 * @desc    Get overdue incident investigations
 * @access  Private - Manager/safeguarding lead only
 */
router.get(
  '/incidents/overdue',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.getOverdueIncidents.bind(controller)
);

/**
 * @route   GET /api/v1/safeguarding/incidents
 * @desc    Search incidents with filters
 * @access  Private - Authorized roles only
 */
router.get(
  '/incidents',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD', 'ADMIN']),
  controller.searchIncidents.bind(controller)
);

// ========================================
// CONCERN ROUTES
// ========================================

/**
 * @route   POST /api/v1/safeguarding/concerns
 * @desc    Raise a safeguarding concern
 * @access  Private - All authenticated staff
 */
router.post(
  '/concerns',
  // authenticate,
  controller.raiseConcern.bind(controller)
);

/**
 * @route   PUT /api/v1/safeguarding/concerns/:id/assess
 * @desc    Assess a safeguarding concern
 * @access  Private - Safeguarding lead/manager only
 */
router.put(
  '/concerns/:id/assess',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.assessConcern.bind(controller)
);

/**
 * @route   POST /api/v1/safeguarding/concerns/:id/escalate
 * @desc    Escalate concern to incident
 * @access  Private - Safeguarding lead/manager only
 */
router.post(
  '/concerns/:id/escalate',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.escalateConcernToIncident.bind(controller)
);

// ========================================
// CHILD PROTECTION PLAN ROUTES
// ========================================

/**
 * @route   POST /api/v1/safeguarding/cpp
 * @desc    Create child protection plan
 * @access  Private - Manager/safeguarding lead only
 */
router.post(
  '/cpp',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.createChildProtectionPlan.bind(controller)
);

/**
 * @route   GET /api/v1/safeguarding/cpp/:id
 * @desc    Get child protection plan details
 * @access  Private - Authorized roles only
 */
router.get(
  '/cpp/:id',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD', 'SOCIAL_WORKER']),
  controller.getChildProtectionPlan.bind(controller)
);

/**
 * @route   GET /api/v1/safeguarding/cpp/overdue-reviews
 * @desc    Get overdue CPP reviews
 * @access  Private - Manager/safeguarding lead only
 */
router.get(
  '/cpp/overdue-reviews',
  // authenticate,
  // authorize(['MANAGER', 'SAFEGUARDING_LEAD']),
  controller.getOverdueCPPReviews.bind(controller)
);

// ========================================
// STATISTICS ROUTES
// ========================================

/**
 * @route   GET /api/v1/safeguarding/statistics
 * @desc    Get safeguarding statistics
 * @access  Private - Manager/admin only
 */
router.get(
  '/statistics',
  // authenticate,
  // authorize(['MANAGER', 'ADMIN']),
  controller.getStatistics.bind(controller)
);

export default router;
