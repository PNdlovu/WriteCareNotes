import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MedicationIncidentController } from '../controllers/medication/MedicationIncidentController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const incidentController = new MedicationIncidentController();

/**
 * @route POST /api/medication-incident
 * @desc Report a new medication incident with comprehensive details
 * @access Private (All clinical staff, Admin)
 */
router.post(
  '/',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'care_assistant', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => incidentController.reportIncident(req, res)
);

/**
 * @route GET /api/medication-incident
 * @desc Get medication incidents with filtering and pagination
 * @access Private (All staff, Admin, Viewer)
 * @query incidentType - Filter by incident type
 * @query severity - Filter by severity level
 * @query category - Filter by category
 * @query status - Filter by status
 * @query dateFrom - Filter from date (ISO string)
 * @query dateTo - Filter to date (ISO string)
 * @query location - Filter by location
 * @query medicationName - Filter by medication name
 * @query residentId - Filter by resident ID
 * @query reportedBy - Filter by reporter
 * @query jurisdiction - Filter by jurisdiction
 * @query requiresRegulatoryReporting - Filter by regulatory reporting requirement (boolean)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 */
router.get(
  '/',
  rbacMiddleware(['nurse', 'doctor', 'clinical_pharmacist', 'care_assistant', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => incidentController.getIncidents(req, res)
);

/**
 * @route POST /api/medication-incident/:incidentId/root-cause-analysis
 * @desc Perform root cause analysis for an incident
 * @access Private (Doctor, Clinical Pharmacist, Quality Manager, Admin)
 */
router.post(
  '/:incidentId/root-cause-analysis',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'quality_manager', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => incidentController.performRootCauseAnalysis(req, res)
);

/**
 * @route POST /api/medication-incident/:incidentId/regulatory-notification
 * @desc Submit regulatory notification for an incident
 * @access Private (Doctor, Clinical Pharmacist, Quality Manager, Admin)
 */
router.post(
  '/:incidentId/regulatory-notification',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'quality_manager', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => incidentController.submitRegulatoryNotification(req, res)
);

/**
 * @route GET /api/medication-incident/trends
 * @desc Get incident trends and analysis
 * @access Private (Doctor, Clinical Pharmacist, Quality Manager, Admin, Viewer)
 * @query jurisdiction - Filter by jurisdiction (optional)
 * @query timeframeDays - Analysis timeframe in days (default: 90, max: 365)
 */
router.get(
  '/trends',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'quality_manager', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => incidentController.getIncidentTrends(req, res)
);

/**
 * @route GET /api/medication-incident/stats
 * @desc Get incident statistics and metrics
 * @access Private (Doctor, Clinical Pharmacist, Quality Manager, Admin, Viewer)
 * @query jurisdiction - Filter by jurisdiction (optional)
 * @query timeframeDays - Statistics timeframe in days (default: 30, max: 365)
 */
router.get(
  '/stats',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'quality_manager', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => incidentController.getIncidentStats(req, res)
);

export default router;