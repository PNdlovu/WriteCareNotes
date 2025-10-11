import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Reconciliation Routes for WriteCareNotes
 * @module MedicationReconciliationRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express routes for medication reconciliation operations including
 * admission, discharge, and transfer reconciliation processes with comprehensive
 * discrepancy management and pharmacist workflow integration.
 * 
 * @compliance
 * - NICE Clinical Guidelines CG76 - Medicines reconciliation
 * - Royal Pharmaceutical Society Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - JWT authentication required
 * - Role-based access control
 * - Rate limiting applied
 * - Input validation and sanitization
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { MedicationReconciliationController } from '../controllers/medication/MedicationReconciliationController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const reconciliationController = new MedicationReconciliationController();

// Rate limiting for reconciliation operations
const reconciliationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs for reconciliation operations
  message: {
    error: 'Too many reconciliation requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for metrics (more restrictive)
const metricsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs for metrics
  message: {
    error: 'Too many metrics requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @swagger
 * components:
 *   schemas:
 *     MedicationSource:
 *       type: object
 *       required:
 *         - sourceType
 *         - sourceDate
 *         - medications
 *         - reliability
 *       properties:
 *         sourceType:
 *           type: string
 *           enum: [home_medications, hospital_medications, gp_list, pharmacy_records, care_home_mar]
 *           description: Type of medication source
 *         sourceDate:
 *           type: string
 *           format: date-time
 *           description: Date when the medication list was obtained
 *         medications:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ReconciliationMedication'
 *           description: List of medications from this source
 *         verifiedBy:
 *           type: string
 *           description: ID of person who verified the medication list
 *         verificationDate:
 *           type: string
 *           format: date-time
 *           description: Date when the medication list was verified
 *         reliability:
 *           type: string
 *           enum: [high, medium, low, unverified]
 *           description: Reliability assessment of the medication source
 *         notes:
 *           type: string
 *           description: Additional notes about the medication source
 * 
 *     ReconciliationMedication:
 *       type: object
 *       required:
 *         - name
 *         - activeIngredient
 *         - strength
 *         - dosage
 *         - frequency
 *         - route
 *         - source
 *         - isActive
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the medication record
 *         name:
 *           type: string
 *           description: Brand or trade name of the medication
 *         genericName:
 *           type: string
 *           description: Generic name of the medication
 *         activeIngredient:
 *           type: string
 *           description: Primary active ingredient
 *         strength:
 *           type: string
 *           description: Strength of the medication (e.g., "10mg")
 *         dosage:
 *           type: string
 *           description: Dosage information (e.g., "10mg twice daily")
 *         frequency:
 *           type: string
 *           description: Frequency of administration
 *         route:
 *           type: string
 *           description: Route of administration (e.g., "oral", "topical")
 *         indication:
 *           type: string
 *           description: Medical indication for the medication
 *         prescriber:
 *           type: string
 *           description: Name of the prescribing healthcare professional
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Date when medication was started
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Date when medication was discontinued
 *         lastTaken:
 *           type: string
 *           format: date-time
 *           description: Date when medication was last taken
 *         adherence:
 *           type: string
 *           enum: [good, poor, unknown]
 *           description: Patient adherence to medication regimen
 *         source:
 *           type: string
 *           description: Source of the medication information
 *         isActive:
 *           type: boolean
 *           description: Whether the medication is currently active
 * 
 *     MedicationReconciliationRecord:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the reconciliation record
 *         residentId:
 *           type: string
 *           description: ID of the resident
 *         reconciliationType:
 *           type: string
 *           enum: [admission, discharge, transfer, periodic_review]
 *           description: Type of reconciliation
 *         reconciliationDate:
 *           type: string
 *           format: date-time
 *           description: Date when reconciliation was performed
 *         performedBy:
 *           type: string
 *           description: ID of healthcare professional who performed reconciliation
 *         reviewedBy:
 *           type: string
 *           description: ID of healthcare professional who reviewed reconciliation
 *         status:
 *           type: string
 *           enum: [in_progress, completed, requires_review, approved]
 *           description: Current status of the reconciliation
 *         sourceList:
 *           $ref: '#/components/schemas/MedicationSource'
 *         targetList:
 *           $ref: '#/components/schemas/MedicationSource'
 *         discrepancies:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MedicationDiscrepancy'
 *         resolutions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DiscrepancyResolution'
 *         clinicalNotes:
 *           type: string
 *           description: Clinical notes related to the reconciliation
 *         pharmacistReview:
 *           $ref: '#/components/schemas/PharmacistReview'
 *         organizationId:
 *           type: string
 *           description: Organization ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     MedicationDiscrepancy:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         discrepancyType:
 *           type: string
 *           enum: [omission, addition, dose_change, frequency_change, route_change, formulation_change, timing_change, indication_change]
 *         severity:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         medicationName:
 *           type: string
 *         sourceValue:
 *           type: string
 *         targetValue:
 *           type: string
 *         description:
 *           type: string
 *         clinicalSignificance:
 *           type: string
 *         requiresAction:
 *           type: boolean
 *         identifiedBy:
 *           type: string
 *         identifiedDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *           enum: [identified, under_review, resolved, accepted_risk]
 * 
 *     DiscrepancyResolution:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         discrepancyId:
 *           type: string
 *         resolutionType:
 *           type: string
 *           enum: [medication_added, medication_removed, dose_adjusted, frequency_changed, route_changed, no_action_required, clinical_review_requested]
 *         resolutionAction:
 *           type: string
 *         rationale:
 *           type: string
 *         resolvedBy:
 *           type: string
 *         resolvedDate:
 *           type: string
 *           format: date-time
 *         approvedBy:
 *           type: string
 *         approvalDate:
 *           type: string
 *           format: date-time
 *         followUpRequired:
 *           type: boolean
 *         followUpDate:
 *           type: string
 *           format: date-time
 * 
 *     PharmacistReview:
 *       type: object
 *       properties:
 *         pharmacistId:
 *           type: string
 *         pharmacistName:
 *           type: string
 *         reviewDate:
 *           type: string
 *           format: date-time
 *         reviewType:
 *           type: string
 *           enum: [initial, follow_up, final_approval]
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *         clinicalAssessment:
 *           type: string
 *         riskAssessment:
 *           type: object
 *           properties:
 *             overallRisk:
 *               type: string
 *               enum: [low, medium, high, critical]
 *             specificRisks:
 *               type: array
 *               items:
 *                 type: string
 *             mitigationStrategies:
 *               type: array
 *               items:
 *                 type: string
 *         approvalStatus:
 *           type: string
 *           enum: [approved, requires_changes, rejected]
 *         notes:
 *           type: string
 * 
 *     PharmacistReviewRequest:
 *       type: object
 *       required:
 *         - pharmacistName
 *         - reviewType
 *         - recommendations
 *         - clinicalAssessment
 *         - riskAssessment
 *         - approvalStatus
 *         - notes
 *       properties:
 *         pharmacistName:
 *           type: string
 *           description: Name of the reviewing pharmacist
 *         reviewType:
 *           type: string
 *           enum: [initial, follow_up, final_approval]
 *           description: Type of pharmacist review
 *         recommendations:
 *           type: array
 *           items:
 *             type: string
 *           description: Clinical recommendations from the pharmacist
 *         clinicalAssessment:
 *           type: string
 *           minLength: 20
 *           maxLength: 5000
 *           description: Detailed clinical assessment
 *         riskAssessment:
 *           type: object
 *           required:
 *             - overallRisk
 *             - specificRisks
 *             - mitigationStrategies
 *           properties:
 *             overallRisk:
 *               type: string
 *               enum: [low, medium, high, critical]
 *               description: Overall risk assessment
 *             specificRisks:
 *               type: array
 *               items:
 *                 type: string
 *               description: Specific risks identified
 *             mitigationStrategies:
 *               type: array
 *               items:
 *                 type: string
 *               description: Strategies to mitigate identified risks
 *         approvalStatus:
 *           type: string
 *           enum: [approved, requires_changes, rejected]
 *           description: Pharmacist approval decision
 *         notes:
 *           type: string
 *           maxLength: 5000
 *           description: Additional notes from the pharmacist
 * 
 *     ReconciliationSummary:
 *       type: object
 *       properties:
 *         reconciliationId:
 *           type: string
 *         residentId:
 *           type: string
 *         reconciliationType:
 *           type: string
 *         reconciliationDate:
 *           type: string
 *           format: date-time
 *         status:
 *           type: string
 *         totalMedications:
 *           type: object
 *           properties:
 *             source:
 *               type: integer
 *             target:
 *               type: integer
 *             final:
 *               type: integer
 *         discrepanciesFound:
 *           type: integer
 *         discrepanciesResolved:
 *           type: integer
 *         criticalIssues:
 *           type: integer
 *         pharmacistReviewRequired:
 *           type: boolean
 *         completionTime:
 *           type: integer
 *           description: Completion time in minutes
 *         performedBy:
 *           type: string
 *         reviewedBy:
 *           type: string
 * 
 *     ReconciliationMetrics:
 *       type: object
 *       properties:
 *         totalReconciliations:
 *           type: integer
 *         averageDiscrepancies:
 *           type: number
 *         averageCompletionTime:
 *           type: number
 *         discrepancyTypes:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         resolutionTypes:
 *           type: object
 *           additionalProperties:
 *             type: integer
 *         pharmacistReviewRate:
 *           type: number
 *         criticalIssueRate:
 *           type: number
 *         timeToCompletion:
 *           type: object
 *           properties:
 *             median:
 *               type: number
 *             p95:
 *               type: number
 *             p99:
 *               type: number
 */

// Apply rate limiting and audit middleware to all routes
router.use(reconciliationRateLimit);
router.use(auditMiddleware);

// Initiate medication reconciliation
router.post(
  '/initiate',
  rbacMiddleware(['nurse', 'pharmacist', 'doctor', 'clinical_manager']),
  reconciliationController.initiateReconciliation.bind(reconciliationController)
);

// Resolve medication discrepancy
router.post(
  '/:reconciliationId/discrepancies/:discrepancyId/resolve',
  rbacMiddleware(['nurse', 'pharmacist', 'doctor', 'clinical_manager']),
  reconciliationController.resolveDiscrepancy.bind(reconciliationController)
);

// Perform pharmacist review
router.post(
  '/:reconciliationId/pharmacist-review',
  rbacMiddleware(['pharmacist', 'clinical_pharmacist']),
  reconciliationController.performPharmacistReview.bind(reconciliationController)
);

// Get reconciliation history for a resident
router.get(
  '/residents/:residentId/history',
  rbacMiddleware(['nurse', 'pharmacist', 'doctor', 'clinical_manager', 'care_coordinator']),
  reconciliationController.getReconciliationHistory.bind(reconciliationController)
);

// Get reconciliation metrics and analytics
router.get(
  '/metrics',
  metricsRateLimit,
  rbacMiddleware(['administrator', 'clinical_manager', 'pharmacist']),
  reconciliationController.getReconciliationMetrics.bind(reconciliationController)
);

export default router;