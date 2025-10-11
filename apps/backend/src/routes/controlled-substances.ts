import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { ControlledSubstancesController } from '../controllers/medication/ControlledSubstancesController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const controlledSubstancesController = new ControlledSubstancesController();

/**
 * @route POST /api/controlled-substances/register
 * @desc Register new controlled drug stock with dual witness verification
 * @access Private (Controlled Drugs Officer, Senior Nurse, Doctor, Admin)
 */
router.post(
  '/register',
  rbacMiddleware(['controlled_drugs_officer', 'senior_nurse', 'doctor', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => controlledSubstancesController.registerControlledDrug(req, res)
);

/**
 * @route POST /api/controlled-substances/:registerId/administration
 * @desc Record controlled drug administration with dual witness verification
 * @access Private (Nurse, Doctor, Admin)
 */
router.post(
  '/:registerId/administration',
  rbacMiddleware(['nurse', 'doctor', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => controlledSubstancesController.recordAdministration(req, res)
);

/**
 * @route POST /api/controlled-substances/:registerId/reconciliation
 * @desc Perform stock reconciliation with discrepancy detection
 * @access Private (Controlled Drugs Officer, Senior Nurse, Admin)
 */
router.post(
  '/:registerId/reconciliation',
  rbacMiddleware(['controlled_drugs_officer', 'senior_nurse', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => controlledSubstancesController.performReconciliation(req, res)
);

/**
 * @route POST /api/controlled-substances/:registerId/destruction
 * @desc Record controlled drug destruction with regulatory compliance
 * @access Private (Controlled Drugs Officer, Senior Nurse, Admin)
 */
router.post(
  '/:registerId/destruction',
  rbacMiddleware(['controlled_drugs_officer', 'senior_nurse', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => controlledSubstancesController.recordDestruction(req, res)
);

/**
 * @route GET /api/controlled-substances/register
 * @desc Get controlled drug register with filtering and pagination
 * @access Private (Controlled Drugs Officer, Senior Nurse, Doctor, Admin, Viewer)
 * @query schedule - Filter by controlled substance schedule (I, II, III, IV, V)
 * @query medicationName - Filter by medication name
 * @query batchNumber - Filter by batch number
 * @query storageLocation - Filter by storage location
 * @query lowStock - Filter for low stock items (boolean)
 * @query expiringWithinDays - Filter for items expiring within specified days
 * @query hasDiscrepancies - Filter for items with reconciliation discrepancies (boolean)
 * @query lastReconciliationBefore - Filter for items not reconciled since date
 * @query isActive - Filter by active status (boolean)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 */
router.get(
  '/register',
  rbacMiddleware(['controlled_drugs_officer', 'senior_nurse', 'doctor', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => controlledSubstancesController.getRegister(req, res)
);

/**
 * @route GET /api/controlled-substances/stats
 * @desc Get controlled drug statistics and compliance metrics
 * @access Private (Controlled Drugs Officer, Senior Nurse, Admin, Viewer)
 */
router.get(
  '/stats',
  rbacMiddleware(['controlled_drugs_officer', 'senior_nurse', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => controlledSubstancesController.getStats(req, res)
);

export default router;