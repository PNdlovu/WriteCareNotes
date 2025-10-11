import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { Container } from 'typedi';
import { TimeTrackingController } from '../../controllers/workforce/TimeTrackingController';
import { JWTAuthenticationService } from '../../services/auth/JWTAuthenticationService';
import { RoleBasedAccessService, Permission } from '../../services/auth/RoleBasedAccessService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../middleware/ErrorHandler';
import rateLimit from 'express-rate-limit';

const router = Router();
const timeTrackingController = new TimeTrackingController();
const authService = Container.get(JWTAuthenticationService);
const accessService = Container.get(RoleBasedAccessService);

// Rate limiting for time tracking endpoints
const timeTrackingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many time tracking requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
const authenticateToken = authService.verifyToken;

// Permission middleware factory
const requirePermission = (permissions: Permission[]) => {
  return accessService.createPermissionMiddleware(permissions);
};

/**
 * @route POST /api/workforce/time-tracking/clock-in
 * @desc Clock in for work
 * @access Private - Requires CLOCK_IN_OUT permission
 */
router.post(
  '/clock-in',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.CLOCK_IN_OUT]),
  ErrorHandler.asyncHandler(timeTrackingController.clockIn)
);

/**
 * @route POST /api/workforce/time-tracking/clock-out
 * @desc Clock out from work
 * @access Private - Requires CLOCK_IN_OUT permission
 */
router.post(
  '/clock-out',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.CLOCK_IN_OUT]),
  ErrorHandler.asyncHandler(timeTrackingController.clockOut)
);

/**
 * @route GET /api/workforce/time-tracking/current
 * @desc Get current active time entry
 * @access Private - Requires VIEW_OWN_TIME_ENTRIES permission
 */
router.get(
  '/current',
  authenticateToken,
  requirePermission([Permission.VIEW_OWN_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.getCurrentTimeEntry)
);

/**
 * @route GET /api/workforce/time-tracking/entries
 * @desc Get time entries for date range
 * @access Private - Requires VIEW_OWN_TIME_ENTRIES or VIEW_TEAM_TIME_ENTRIES permission
 * @query startDate - Start date (YYYY-MM-DD)
 * @query endDate - End date (YYYY-MM-DD)
 * @query employeeId - Optional employee ID (for managers viewing team entries)
 */
router.get(
  '/entries',
  authenticateToken,
  requirePermission([Permission.VIEW_OWN_TIME_ENTRIES, Permission.VIEW_TEAM_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.getTimeEntries)
);

/**
 * @route POST /api/workforce/time-tracking/break/start
 * @desc Start a break
 * @access Private - Requires CLOCK_IN_OUT permission
 */
router.post(
  '/break/start',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.CLOCK_IN_OUT]),
  ErrorHandler.asyncHandler(timeTrackingController.startBreak)
);

/**
 * @route POST /api/workforce/time-tracking/break/end
 * @desc End a break
 * @access Private - Requires CLOCK_IN_OUT permission
 */
router.post(
  '/break/end',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.CLOCK_IN_OUT]),
  ErrorHandler.asyncHandler(timeTrackingController.endBreak)
);

/**
 * @route GET /api/workforce/time-tracking/currently-clocked-in
 * @desc Get currently clocked in employees (for managers)
 * @access Private - Requires VIEW_TEAM_TIME_ENTRIES permission
 */
router.get(
  '/currently-clocked-in',
  authenticateToken,
  requirePermission([Permission.VIEW_TEAM_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.getCurrentlyClockedIn)
);

/**
 * @route POST /api/workforce/time-tracking/manual-entry
 * @desc Create manual time entry (for corrections)
 * @access Private - Requires EDIT_TIME_ENTRIES permission
 */
router.post(
  '/manual-entry',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.EDIT_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.createManualEntry)
);

/**
 * @route GET /api/workforce/time-tracking/metrics
 * @desc Get time tracking metrics
 * @access Private - Requires VIEW_TEAM_REPORTS permission
 * @query startDate - Start date (YYYY-MM-DD)
 * @query endDate - End date (YYYY-MM-DD)
 */
router.get(
  '/metrics',
  authenticateToken,
  requirePermission([Permission.VIEW_TEAM_REPORTS]),
  ErrorHandler.asyncHandler(timeTrackingController.getMetrics)
);

/**
 * @route GET /api/workforce/time-tracking/attendance-report/:employeeId
 * @desc Generate attendance report for employee
 * @access Private - Requires VIEW_OWN_TIME_ENTRIES or VIEW_TEAM_TIME_ENTRIES permission
 * @param employeeId - Employee ID
 * @query startDate - Start date (YYYY-MM-DD)
 * @query endDate - End date (YYYY-MM-DD)
 */
router.get(
  '/attendance-report/:employeeId',
  authenticateToken,
  requirePermission([Permission.VIEW_OWN_TIME_ENTRIES, Permission.VIEW_TEAM_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.generateAttendanceReport)
);

/**
 * @route GET /api/workforce/time-tracking/pending-approvals
 * @desc Get pending time entry approvals (for managers)
 * @access Private - Requires APPROVE_TIME_ENTRIES permission
 */
router.get(
  '/pending-approvals',
  authenticateToken,
  requirePermission([Permission.APPROVE_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.getPendingApprovals)
);

/**
 * @route POST /api/workforce/time-tracking/:entryId/approve
 * @desc Approve time entry
 * @access Private - Requires APPROVE_TIME_ENTRIES permission
 * @param entryId - Time entry ID
 */
router.post(
  '/:entryId/approve',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.APPROVE_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.approveTimeEntry)
);

/**
 * @route POST /api/workforce/time-tracking/:entryId/reject
 * @desc Reject time entry
 * @access Private - Requires APPROVE_TIME_ENTRIES permission
 * @param entryId - Time entry ID
 */
router.post(
  '/:entryId/reject',
  timeTrackingRateLimit,
  authenticateToken,
  requirePermission([Permission.APPROVE_TIME_ENTRIES]),
  ErrorHandler.asyncHandler(timeTrackingController.rejectTimeEntry)
);

export default router;