import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MedicationSchedulingController } from '../controllers/medication/MedicationSchedulingController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const schedulingController = new MedicationSchedulingController();

/**
 * @route POST /api/medication-scheduling/schedule
 * @desc Create optimized medication schedule for a prescription
 * @access Private (Nurse, Doctor, Clinical Pharmacist, Admin)
 */
router.post(
  '/schedule',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => schedulingController.createSchedule(req, res)
);

/**
 * @route GET /api/medication-scheduling/schedules
 * @desc Get medication schedules with filtering and pagination
 * @access Private (All clinical staff, Admin, Viewer)
 * @query residentId - Filter by resident ID
 * @query medicationName - Filter by medication name
 * @query scheduleType - Filter by schedule type (regular, prn, stat, variable)
 * @query status - Filter by status (active, paused, completed, discontinued)
 * @query priority - Filter by priority (low, normal, high, critical)
 * @query location - Filter by location
 * @query dueWithinHours - Filter for schedules due within specified hours
 * @query overdueOnly - Filter for overdue schedules only (boolean)
 * @query alertsOnly - Filter for schedules with active alerts (boolean)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 */
router.get(
  '/schedules',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'care_assistant', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => schedulingController.getSchedules(req, res)
);

/**
 * @route PUT /api/medication-scheduling/schedule/:scheduleId
 * @desc Update medication schedule
 * @access Private (Nurse, Doctor, Clinical Pharmacist, Admin)
 */
router.put(
  '/schedule/:scheduleId',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => schedulingController.updateSchedule(req, res)
);

/**
 * @route POST /api/medication-scheduling/alerts/generate
 * @desc Generate real-time medication alerts
 * @access Private (All clinical staff, Admin)
 * @query alertTypes - Comma-separated list of alert types to generate (optional)
 *   - due: Medications that are currently due
 *   - overdue: Medications that are overdue
 *   - pre_alert: Pre-alerts for upcoming medications
 *   - missed: Missed medication alerts
 *   - prn_available: PRN medications available for administration
 *   - prn_limit_reached: PRN medications that have reached daily limits
 *   - interaction_warning: Drug interaction warnings
 *   - schedule_conflict: Schedule conflict alerts
 */
router.post(
  '/alerts/generate',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'care_assistant', 'admin']),
  complianceMiddleware,
  (req, res) => schedulingController.generateAlerts(req, res)
);

/**
 * @route POST /api/medication-scheduling/optimize/:residentId
 * @desc Optimize medication schedules for a resident
 * @access Private (Doctor, Clinical Pharmacist, Admin)
 */
router.post(
  '/optimize/:residentId',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => schedulingController.optimizeSchedules(req, res)
);

/**
 * @route POST /api/medication-scheduling/prn/:scheduleId/request
 * @desc Handle PRN medication request with clinical validation
 * @access Private (Nurse, Doctor, Clinical Pharmacist, Admin)
 */
router.post(
  '/prn/:scheduleId/request',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => schedulingController.handlePrnRequest(req, res)
);

/**
 * @route GET /api/medication-scheduling/stats
 * @desc Get comprehensive scheduling statistics and metrics
 * @access Private (Doctor, Clinical Pharmacist, Admin, Viewer)
 */
router.get(
  '/stats',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => schedulingController.getStats(req, res)
);

export default router;
