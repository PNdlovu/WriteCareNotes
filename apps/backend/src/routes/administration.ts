import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MedicationAdministrationController } from '../controllers/medication/MedicationAdministrationController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const administrationController = new MedicationAdministrationController();

/**
 * @route POST /api/administration
 * @desc Record a new medication administration
 * @access Private (Nurse, Doctor, Admin)
 */
router.post(
  '/',
  rbacMiddleware(['nurse', 'doctor', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => administrationController.recordAdministration(req, res)
);

/**
 * @route GET /api/administration
 * @desc Get administration history with filtering and pagination
 * @access Private (Nurse, Doctor, Admin, Viewer)
 * @query residentId - Filter by resident ID
 * @query prescriptionId - Filter by prescription ID
 * @query administeredBy - Filter by administrator
 * @query dateFrom - Filter from date (ISO string)
 * @query dateTo - Filter to date (ISO string)
 * @query route - Filter by administration route
 * @query effectiveness - Filter by effectiveness rating
 * @query hasSideEffects - Filter by presence of side effects (boolean)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 */
router.get(
  '/',
  rbacMiddleware(['nurse', 'doctor', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => administrationController.getAdministrationHistory(req, res)
);

/**
 * @route GET /api/administration/:id
 * @desc Get a specific administration record
 * @access Private (Nurse, Doctor, Admin, Viewer)
 */
router.get(
  '/:id',
  rbacMiddleware(['nurse', 'doctor', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => administrationController.getAdministrationById(req, res)
);

/**
 * @route PUT /api/administration/:id
 * @desc Update an administration record
 * @access Private (Nurse, Doctor, Admin)
 */
router.put(
  '/:id',
  rbacMiddleware(['nurse', 'doctor', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => administrationController.updateAdministration(req, res)
);

/**
 * @route GET /api/administration/stats/:residentId
 * @desc Get administration statistics for a resident
 * @access Private (Nurse, Doctor, Admin, Viewer)
 * @query dateFrom - Statistics from date (ISO string)
 * @query dateTo - Statistics to date (ISO string)
 */
router.get(
  '/stats/:residentId',
  rbacMiddleware(['nurse', 'doctor', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => administrationController.getAdministrationStats(req, res)
);

export default router;
