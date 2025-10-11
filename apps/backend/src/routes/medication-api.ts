/**
 * @fileoverview Medication API Routes for WriteCareNotes
 * @module MedicationApiRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Comprehensive REST API routes for medication management with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - Controlled Drugs Regulations 2001
 * - NICE Guidelines for Medication Management
 * - MHRA (Medicines and Healthcare products Regulatory Agency)
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { MedicationApiController } from '../controllers/medication/MedicationApiController';
import { authMiddleware, requirePermission, Permission } from '../middleware/auth-middleware';
import { correlationMiddleware } from '../middleware/correlation-middleware';
import { performanceMiddleware } from '../middleware/performance-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const controller = new MedicationApiController();

// Rate limiting for medication operations
const medicationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many medication requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Controlled substance operations rate limiting
const controlledSubstanceRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 requests per hour for controlled substances
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many controlled substance requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply middleware to all routes
router.use(correlationMiddleware);
router.use(performanceMiddleware);
router.use(authMiddleware);
router.use(complianceMiddleware);
router.use(auditMiddleware);

// ==================== MEDICATIONROUTES ====================

/**
 * @swagger
 * /api/v1/medications:
 *   post:
 *     summary: Create a new medication
 *     description: Creates a new medication with comprehensive validation and controlled substance tracking
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMedicationDto'
 *     responses:
 *       201:
 *         description: Medication created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MedicationResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *                       example: v1
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/',
  medicationRateLimit,
  requirePermission(Permission.MEDICATION_CREATE),
  controller.createMedication.bind(controller)
);

/**
 * @swagger
 * /api/v1/medications:
 *   get:
 *     summary: Get medications with filtering and pagination
 *     description: Retrieves medications with comprehensive filtering options and pagination
 *     tags: [Medications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search term for medication name or generic name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [analgesic, antibiotic, cardiac, diabetes, psychiatric, opioid, anticoagulant]
 *         description: Filter by medication type
 *       - in: query
 *         name: form
 *         schema:
 *           type: string
 *           enum: [tablet, capsule, liquid, injection, topical, inhaler, patch]
 *         description: Filter by medication form
 *       - in: query
 *         name: route
 *         schema:
 *           type: string
 *           enum: [oral, topical, injection, inhalation, rectal, sublingual]
 *         description: Filter by administration route
 *       - in: query
 *         name: isControlledSubstance
 *         schema:
 *           type: boolean
 *         description: Filter by controlled substance status
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Medications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MedicationResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/',
  requirePermission(Permission.MEDICATION_READ),
  controller.getMedications.bind(controller)
);

// ==================== PRESCRIPTIONROUTES ====================

/**
 * @swagger
 * /api/v1/prescriptions:
 *   post:
 *     summary: Create a new prescription
 *     description: Creates a new prescription with drug interaction checking and compliance validation
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePrescriptionDto'
 *     responses:
 *       201:
 *         description: Prescription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PrescriptionResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         description: Bad request - validation error or drug interaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: DRUG_INTERACTION_ERROR
 *                     message:
 *                       type: string
 *                       example: Severe drug interactions detected
 *                     correlationId:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/prescriptions',
  medicationRateLimit,
  requirePermission(Permission.PRESCRIPTION_CREATE),
  controller.createPrescription.bind(controller)
);

/**
 * @swagger
 * /api/v1/prescriptions/residents/{residentId}:
 *   get:
 *     summary: Get prescriptions for a resident
 *     description: Retrieves all prescriptions for a specific resident with filtering options
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, completed, discontinued, expired]
 *         description: Filter by prescription status
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include inactive prescriptions
 *     responses:
 *       200:
 *         description: Prescriptions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PrescriptionResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/prescriptions/residents/:residentId',
  requirePermission(Permission.PRESCRIPTION_READ),
  controller.getPrescriptions.bind(controller)
);

// ==================== MEDICATION ADMINISTRATIONROUTES ====================

/**
 * @swagger
 * /api/v1/medication-administration:
 *   post:
 *     summary: Administer medication
 *     description: Records medication administration with real-time tracking and controlled substance validation
 *     tags: [Medication Administration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MedicationAdministrationDto'
 *     responses:
 *       201:
 *         description: Medication administered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MedicationAdministrationResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         description: Prescription not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: object
 *                   properties:
 *                     code:
 *                       type: string
 *                       example: NOT_FOUND
 *                     message:
 *                       type: string
 *                       example: Prescription not found or inactive
 *                     correlationId:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/medication-administration',
  medicationRateLimit,
  requirePermission(Permission.MEDICATION_ADMINISTER),
  controller.administerMedication.bind(controller)
);

/**
 * @swagger
 * /api/v1/medication-administration/residents/{residentId}/mar:
 *   get:
 *     summary: Get Medication Administration Record (MAR)
 *     description: Retrieves the medication administration record for a resident within a date range
 *     tags: [Medication Administration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident ID
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for MAR (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for MAR (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: MAR retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MedicationAdministrationResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     dateRange:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                           format: date-time
 *                         to:
 *                           type: string
 *                           format: date-time
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/medication-administration/residents/:residentId/mar',
  requirePermission(Permission.MEDICATION_READ),
  controller.getMedicationAdministrationRecord.bind(controller)
);

// ==================== DRUG INTERACTIONROUTES ====================

/**
 * @swagger
 * /api/v1/drug-interactions/residents/{residentId}/medications/{medicationId}/check:
 *   get:
 *     summary: Check drug interactions
 *     description: Checks for drug interactions between a new medication and resident's current medications
 *     tags: [Drug Interactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident ID
 *       - in: path
 *         name: medicationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: New medication ID to check interactions for
 *     responses:
 *       200:
 *         description: Drug interaction check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     hasInteractions:
 *                       type: boolean
 *                       example: true
 *                     severity:
 *                       type: string
 *                       enum: [minor, moderate, severe]
 *                       example: moderate
 *                     interactionCount:
 *                       type: integer
 *                       example: 2
 *                     interactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           medication1:
 *                             type: string
 *                           medication2:
 *                             type: string
 *                           severity:
 *                             type: string
 *                           description:
 *                             type: string
 *                           clinicalEffect:
 *                             type: string
 *                           management:
 *                             type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/drug-interactions/residents/:residentId/medications/:medicationId/check',
  requirePermission(Permission.MEDICATION_READ),
  controller.checkDrugInteractions.bind(controller)
);

// ==================== MEDICATION RECONCILIATIONROUTES ====================

/**
 * @swagger
 * /api/v1/medication-reconciliation/residents/{residentId}:
 *   post:
 *     summary: Perform medication reconciliation
 *     description: Performs medication reconciliation comparing admission medications with current prescriptions
 *     tags: [Medication Reconciliation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resident ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               admissionMedications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     dosage:
 *                       type: number
 *                     dosageUnit:
 *                       type: string
 *                     frequency:
 *                       type: string
 *                     route:
 *                       type: string
 *     responses:
 *       200:
 *         description: Medication reconciliation completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     discrepancyCount:
 *                       type: integer
 *                       example: 3
 *                     requiresPharmacistReview:
 *                       type: boolean
 *                       example: true
 *                     discrepancies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             enum: [missing, extra, dosage_change, frequency_change, route_change]
 *                           medication:
 *                             type: string
 *                           currentValue:
 *                             type: string
 *                           expectedValue:
 *                             type: string
 *                           severity:
 *                             type: string
 *                             enum: [low, medium, high, critical]
 *                           description:
 *                             type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/medication-reconciliation/residents/:residentId',
  medicationRateLimit,
  requirePermission(Permission.MEDICATION_RECONCILE),
  controller.performMedicationReconciliation.bind(controller)
);

// ==================== CONTROLLED SUBSTANCEROUTES ====================

/**
 * @swagger
 * /api/v1/controlled-substances/report:
 *   get:
 *     summary: Get controlled substance report
 *     description: Generates a comprehensive controlled substance report for regulatory compliance
 *     tags: [Controlled Substances]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateFrom
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for report (YYYY-MM-DD)
 *       - in: query
 *         name: dateTo
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for report (YYYY-MM-DD)
 *       - in: query
 *         name: facilityId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by facility ID (optional)
 *     responses:
 *       200:
 *         description: Controlled substance report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportPeriod:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                           format: date-time
 *                         to:
 *                           type: string
 *                           format: date-time
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalAdministrations:
 *                           type: integer
 *                         totalInventoryMovements:
 *                           type: integer
 *                         medicationsInvolved:
 *                           type: integer
 *                     administrations:
 *                       type: array
 *                       items:
 *                         type: object
 *                     inventoryMovements:
 *                       type: array
 *                       items:
 *                         type: object
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                     generatedBy:
 *                       type: string
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/controlled-substances/report',
  controlledSubstanceRateLimit,
  requirePermission(Permission.CONTROLLED_SUBSTANCE_REPORT),
  controller.getControlledSubstanceReport.bind(controller)
);

export default router;
