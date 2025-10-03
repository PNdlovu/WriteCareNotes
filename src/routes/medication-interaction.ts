import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Medication Interaction Routes for WriteCareNotes
 * @module MedicationInteractionRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express routes for medication interaction checking, allergy management,
 * contraindication warnings, and clinical decision support endpoints.
 * 
 * @compliance
 * - MHRA Drug Safety Guidelines
 * - BNF (British National Formulary) Standards
 * - NICE Clinical Guidelines
 * - CQC Regulation 12 - Safe care and treatment
 * - Professional Standards (GMC, NMC, GPhC)
 * - GDPR and Data Protection Act 2018
 * 
 * @security
 * - JWT authentication required
 * - Role-based access control
 * - Rate limiting for clinical operations
 * - Audit trail logging
 */

import { Router } from 'express';
import { MedicationInteractionController } from '../controllers/medication/MedicationInteractionController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { correlationMiddleware } from '../middleware/correlation-middleware';
import { performanceMiddleware } from '../middleware/performance-middleware';
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new MedicationInteractionController();

// Rate limiting for interaction checks
const interactionCheckLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many interaction check requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for database updates
const databaseUpdateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 database updates per hour
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many database update requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply middleware to all routes
router.use(correlationMiddleware);
router.use(performanceMiddleware);
router.use(auditMiddleware);

/**
 * @swagger
 * /api/v1/medication-interaction/residents/{residentId}/check:
 *   post:
 *     summary: Check medication interactions for a resident
 *     description: Perform comprehensive medication interaction checking including drug-drug interactions, allergy alerts, and contraindication warnings
 *     tags: [Medication Interaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the resident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               medications:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     activeIngredient:
 *                       type: string
 *                     dosage:
 *                       type: string
 *                     route:
 *                       type: string
 *               newMedication:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   activeIngredient:
 *                     type: string
 *                   dosage:
 *                     type: string
 *                   route:
 *                     type: string
 *               checkAllergies:
 *                 type: boolean
 *                 default: true
 *               checkContraindications:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Interaction check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     checkId:
 *                       type: string
 *                     residentId:
 *                       type: string
 *                     checkDate:
 *                       type: string
 *                       format: date-time
 *                     overallRisk:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                     safetyScore:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                     interactions:
 *                       type: array
 *                     allergyAlerts:
 *                       type: array
 *                     contraindicationAlerts:
 *                       type: array
 *                     clinicalDecisionSupport:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/residents/:residentId/check',
  interactionCheckLimit,
  rbacMiddleware(['clinical_staff', 'pharmacist', 'doctor', 'nurse']),
  controller.checkInteractions.bind(controller)
);

/**
 * @swagger
 * /api/v1/medication-interaction/residents/{residentId}/allergies:
 *   post:
 *     summary: Add allergy alert for a resident
 *     description: Add a new allergy alert and check for potential medication interactions
 *     tags: [Medication Interaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the resident
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allergen
 *               - allergenType
 *               - reactionType
 *               - severity
 *             properties:
 *               allergen:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               allergenType:
 *                 type: string
 *                 enum: [drug, food, environmental, other]
 *               reactionType:
 *                 type: string
 *                 enum: [allergy, intolerance, adverse_reaction]
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe, anaphylaxis]
 *               symptoms:
 *                 type: array
 *                 items:
 *                   type: string
 *               onsetDate:
 *                 type: string
 *                 format: date
 *               verifiedBy:
 *                 type: string
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *               isActive:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Allergy alert added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/residents/:residentId/allergies',
  rbacMiddleware(['clinical_staff', 'pharmacist', 'doctor', 'nurse']),
  controller.addAllergyAlert.bind(controller)
);

/**
 * @swagger
 * /api/v1/medication-interaction/residents/{residentId}/history:
 *   get:
 *     summary: Get interaction check history for a resident
 *     description: Retrieve historical medication interaction checks for a resident
 *     tags: [Medication Interaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: residentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier for the resident
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for history range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for history range
 *     responses:
 *       200:
 *         description: Interaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: number
 *                         limit:
 *                           type: number
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/residents/:residentId/history',
  rbacMiddleware(['clinical_staff', 'pharmacist', 'doctor', 'nurse', 'care_manager']),
  controller.getInteractionHistory.bind(controller)
);

/**
 * @swagger
 * /api/v1/medication-interaction/database/update/{source}:
 *   post:
 *     summary: Update interaction database from external source
 *     description: Update the medication interaction database with latest data from external sources
 *     tags: [Medication Interaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: source
 *         required: true
 *         schema:
 *           type: string
 *           enum: [bnf, mhra, nice, lexicomp, micromedex]
 *         description: External data source to update from
 *     responses:
 *       200:
 *         description: Database updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated:
 *                       type: boolean
 *                     newInteractions:
 *                       type: number
 *                     updatedInteractions:
 *                       type: number
 *                     lastUpdateDate:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/database/update/:source',
  databaseUpdateLimit,
  rbacMiddleware(['system_admin', 'pharmacist']),
  controller.updateInteractionDatabase.bind(controller)
);

/**
 * @swagger
 * /api/v1/medication-interaction/reports:
 *   post:
 *     summary: Generate interaction report
 *     description: Generate comprehensive medication interaction reports for analysis
 *     tags: [Medication Interaction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportType
 *               - startDate
 *               - endDate
 *             properties:
 *               reportType:
 *                 type: string
 *                 enum: [summary, detailed, trends]
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Report generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reportId:
 *                       type: string
 *                     reportType:
 *                       type: string
 *                     generatedDate:
 *                       type: string
 *                       format: date-time
 *                     summary:
 *                       type: object
 *                     details:
 *                       type: object
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/reports',
  rbacMiddleware(['clinical_manager', 'pharmacist', 'quality_manager', 'system_admin']),
  controller.generateInteractionReport.bind(controller)
);

export default router;