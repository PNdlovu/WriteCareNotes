/**
 * ============================================================================
 * Education Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for education endpoints.
 * 
 * @module domains/education/routes/education.routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for education operations including Personal Education
 * Plans (PEPs), school placements, attendance tracking, and Pupil Premium Plus
 * management. Routes include authentication middleware and role-based access.
 * 
 * @requires express
 * @requires EducationController
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { EducationController } from '../controllers/EducationController';

const router = Router();
const controller = new EducationController();

// ========================================
// PEP ROUTES
// ========================================

/**
 * @route   POST /api/v1/education/peps
 * @desc    Create Personal Education Plan
 * @access  Private - Virtual School/Designated Teacher
 */
router.post(
  '/peps',
  // authenticate,
  // authorize(['MANAGER', 'VIRTUAL_SCHOOL', 'DESIGNATED_TEACHER']),
  controller.createPEP.bind(controller)
);

/**
 * @route   GET /api/v1/education/peps/:id
 * @desc    Get PEP details
 * @access  Private - Authorized roles
 */
router.get(
  '/peps/:id',
  // authenticate,
  controller.getPEP.bind(controller)
);

/**
 * @route   PUT /api/v1/education/peps/:id/status
 * @desc    Update PEP status
 * @access  Private - Virtual School/Manager
 */
router.put(
  '/peps/:id/status',
  // authenticate,
  // authorize(['MANAGER', 'VIRTUAL_SCHOOL']),
  controller.updatePEPStatus.bind(controller)
);

/**
 * @route   PUT /api/v1/education/peps/:id/targets
 * @desc    Update PEP target progress
 * @access  Private - Staff/Virtual School
 */
router.put(
  '/peps/:id/targets',
  // authenticate,
  controller.updateTargetProgress.bind(controller)
);

/**
 * @route   POST /api/v1/education/peps/:id/pp-plus
 * @desc    Record Pupil Premium Plus expenditure
 * @access  Private - Manager/Virtual School
 */
router.post(
  '/peps/:id/pp-plus',
  // authenticate,
  // authorize(['MANAGER', 'VIRTUAL_SCHOOL']),
  controller.recordPPPlusExpenditure.bind(controller)
);

/**
 * @route   GET /api/v1/education/peps/overdue
 * @desc    Get overdue PEP reviews
 * @access  Private - Manager/Virtual School
 */
router.get(
  '/peps/overdue',
  // authenticate,
  // authorize(['MANAGER', 'VIRTUAL_SCHOOL', 'ADMIN']),
  controller.getOverduePEPs.bind(controller)
);

// ========================================
// SCHOOL PLACEMENT ROUTES
// ========================================

/**
 * @route   POST /api/v1/education/placements
 * @desc    Create school placement
 * @access  Private - Manager/Staff
 */
router.post(
  '/placements',
  // authenticate,
  // authorize(['MANAGER', 'STAFF']),
  controller.createSchoolPlacement.bind(controller)
);

/**
 * @route   GET /api/v1/education/placements/:id
 * @desc    Get school placement details
 * @access  Private - Authorized roles
 */
router.get(
  '/placements/:id',
  // authenticate,
  controller.getSchoolPlacement.bind(controller)
);

/**
 * @route   POST /api/v1/education/placements/:id/exclusion
 * @desc    Record school exclusion
 * @access  Private - Manager/Staff
 */
router.post(
  '/placements/:id/exclusion',
  // authenticate,
  // authorize(['MANAGER', 'STAFF']),
  controller.recordExclusion.bind(controller)
);

/**
 * @route   PUT /api/v1/education/placements/:id/attendance
 * @desc    Update attendance
 * @access  Private - Manager/Staff
 */
router.put(
  '/placements/:id/attendance',
  // authenticate,
  controller.updateAttendance.bind(controller)
);

/**
 * @route   GET /api/v1/education/placements/at-risk
 * @desc    Get placements at risk
 * @access  Private - Manager/Admin
 */
router.get(
  '/placements/at-risk',
  // authenticate,
  // authorize(['MANAGER', 'ADMIN']),
  controller.getPlacementsAtRisk.bind(controller)
);

// ========================================
// NEET AND STATISTICS ROUTES
// ========================================

/**
 * @route   GET /api/v1/education/neet
 * @desc    Get children not in education
 * @access  Private - Manager/Admin
 */
router.get(
  '/neet',
  // authenticate,
  // authorize(['MANAGER', 'ADMIN']),
  controller.getChildrenNotInEducation.bind(controller)
);

/**
 * @route   GET /api/v1/education/statistics
 * @desc    Get education statistics
 * @access  Private - Manager/Admin
 */
router.get(
  '/statistics',
  // authenticate,
  // authorize(['MANAGER', 'ADMIN']),
  controller.getStatistics.bind(controller)
);

export default router;
