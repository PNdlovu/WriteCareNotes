import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MedicationReviewController } from '../controllers/medication/MedicationReviewController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const reviewController = new MedicationReviewController();

/**
 * @route POST /api/medication-review/:residentId
 * @desc Create comprehensive medication review for a resident
 * @access Private (Doctor, Clinical Pharmacist, Senior Nurse, Admin)
 */
router.post(
  '/:residentId',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'senior_nurse', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => reviewController.createMedicationReview(req, res)
);

/**
 * @route GET /api/medication-review/:residentId
 * @desc Get medication reviews for a resident
 * @access Private (Doctor, Clinical Pharmacist, Nurse, Admin, Viewer)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 50)
 */
router.get(
  '/:residentId',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'nurse', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => reviewController.getMedicationReviews(req, res)
);

/**
 * @route GET /api/medication-review/review/:reviewId
 * @desc Get a specific medication review by ID
 * @access Private (Doctor, Clinical Pharmacist, Nurse, Admin, Viewer)
 */
router.get(
  '/review/:reviewId',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'nurse', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => reviewController.getMedicationReviewById(req, res)
);

/**
 * @route PUT /api/medication-review/review/:reviewId/status
 * @desc Update medication review status
 * @access Private (Doctor, Clinical Pharmacist, Senior Nurse, Admin)
 */
router.put(
  '/review/:reviewId/status',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'senior_nurse', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => reviewController.updateReviewStatus(req, res)
);

/**
 * @route GET /api/medication-review/:residentId/:medicationId/effectiveness
 * @desc Assess therapy effectiveness for a specific medication
 * @access Private (Doctor, Clinical Pharmacist, Nurse, Admin, Viewer)
 * @query timeframeDays - Assessment timeframe in days (default: 30, max: 365)
 */
router.get(
  '/:residentId/:medicationId/effectiveness',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'nurse', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => reviewController.assessTherapyEffectiveness(req, res)
);

/**
 * @route GET /api/medication-review/:residentId/polypharmacy
 * @desc Perform polypharmacy assessment for a resident
 * @access Private (Doctor, Clinical Pharmacist, Senior Nurse, Admin, Viewer)
 */
router.get(
  '/:residentId/polypharmacy',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'senior_nurse', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => reviewController.performPolypharmacyAssessment(req, res)
);

/**
 * @route GET /api/medication-review/:residentId/optimization
 * @desc Identify optimization opportunities for a resident's medications
 * @access Private (Doctor, Clinical Pharmacist, Senior Nurse, Admin, Viewer)
 */
router.get(
  '/:residentId/optimization',
  rbacMiddleware(['doctor', 'clinical_pharmacist', 'senior_nurse', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => reviewController.identifyOptimizationOpportunities(req, res)
);

export default router;