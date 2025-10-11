import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Planning API Routes for WriteCareNotes
 * @module CarePlanningApiRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description Comprehensive REST API routes for care planning with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { CarePlanApiController } from '@/controllers/care-planning/CarePlanApiController';
import { authMiddleware, requirePermission, Permission } from '@/middleware/auth-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

const router = Router();
const controller = new CarePlanApiController();

// Rate limiting for care planning operations
const carePlanningRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many care planning requests, please try again later'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Sensitive operations rate limiting
const sensitiveRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 requests per hour for sensitive operations
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many sensitive requests, please try again later'
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

// ==================== CARE PLAN ROUTES ====================

/**
 * @swagger
 * /api/v1/care-plans:
 *   post:
 *     summary: Create a new care plan
 *     description: Creates a comprehensive care plan for a resident with healthcare compliance
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCarePlanDto'
 *     responses:
 *       201:
 *         description: Care plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlanResponseDto'
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
  carePlanningRateLimit,
  requirePermission(Permission.CARE_RECORD_CREATE),
  controller.createCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans:
 *   get:
 *     summary: Get care plans with filtering and pagination
 *     description: Retrieves care plans with comprehensive filtering options and pagination
 *     tags: [Care Plans]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, under_review, suspended, completed, archived]
 *         description: Filter by care plan status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [initial, updated, emergency, discharge, respite]
 *         description: Filter by care plan type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority level
 *       - in: query
 *         name: residentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by resident ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search term for filtering care plans
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [planName, createdAt, effectiveFrom, nextReviewDate, priority]
 *         description: Sort field for ordering results
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort direction
 *       - in: query
 *         name: careTeamMember
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by care team member ID
 *       - in: query
 *         name: tags
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by tags
 *     responses:
 *       200:
 *         description: Care plans retrieved successfully
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
 *                     $ref: '#/components/schemas/CarePlanResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
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
  requirePermission(Permission.CARE_RECORD_READ),
  controller.getCarePlans.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/{id}:
 *   get:
 *     summary: Get specific care plan by ID
 *     description: Retrieves detailed information about a specific care plan
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
 *     responses:
 *       200:
 *         description: Care plan retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlanResponseDto'
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
router.get('/:id',
  requirePermission(Permission.CARE_RECORD_READ),
  controller.getCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/{id}:
 *   put:
 *     summary: Update care plan
 *     description: Updates an existing care plan with new information
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCarePlanDto'
 *     responses:
 *       200:
 *         description: Care plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlanResponseDto'
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/:id',
  carePlanningRateLimit,
  requirePermission(Permission.CARE_RECORD_UPDATE),
  controller.updateCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/{id}:
 *   delete:
 *     summary: Delete care plan (soft delete)
 *     description: Soft deletes a care plan while maintaining audit trail
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
 *     responses:
 *       204:
 *         description: Care plan deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.delete('/:id',
  sensitiveRateLimit,
  requirePermission(Permission.CARE_RECORD_DELETE),
  controller.deleteCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/{id}/activate:
 *   post:
 *     summary: Activate care plan
 *     description: Activates a care plan making it effective for resident care
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActivateCarePlanDto'
 *     responses:
 *       200:
 *         description: Care plan activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlanResponseDto'
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/activate',
  carePlanningRateLimit,
  requirePermission(Permission.CARE_RECORD_UPDATE),
  controller.activateCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/{id}/review:
 *   post:
 *     summary: Schedule or conduct care plan review
 *     description: Schedules or conducts a comprehensive review of the care plan
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewCarePlanDto'
 *     responses:
 *       200:
 *         description: Care plan review scheduled successfully
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
 *                     reviewId:
 *                       type: string
 *                       format: uuid
 *                     reviewType:
 *                       type: string
 *                     reviewDate:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       example: scheduled
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/:id/review',
  carePlanningRateLimit,
  requirePermission(Permission.CARE_RECORD_UPDATE),
  controller.reviewCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/generate:
 *   post:
 *     summary: Generate care plan from template
 *     description: Generates a personalized care plan from a template using assessment data
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateCarePlanDto'
 *     responses:
 *       201:
 *         description: Care plan generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlanResponseDto'
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
router.post('/generate',
  carePlanningRateLimit,
  requirePermission(Permission.CARE_RECORD_CREATE),
  controller.generateCarePlan.bind(controller)
);

// ==================== CARE DOMAIN ROUTES ====================

/**
 * @swagger
 * /api/v1/care-plans/{planId}/domains:
 *   post:
 *     summary: Add care domain to care plan
 *     description: Adds a new care domain to an existing care plan
 *     tags: [Care Domains]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCareDomainDto'
 *     responses:
 *       201:
 *         description: Care domain created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CareDomainResponseDto'
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
router.post('/:planId/domains',
  carePlanningRateLimit,
  requirePermission(Permission.CARE_RECORD_CREATE),
  controller.addCareDomain.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-plans/{planId}/domains:
 *   get:
 *     summary: Get care domains for a care plan
 *     description: Retrieves all care domains associated with a specific care plan
 *     tags: [Care Domains]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: planId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, under_assessment, needs_attention, resolved]
 *         description: Filter by domain status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by domain category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority level
 *       - in: query
 *         name: riskLevel
 *         schema:
 *           type: string
 *           enum: [minimal, low, moderate, high, severe]
 *         description: Filter by risk level
 *       - in: query
 *         name: assignedTeamMember
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by assigned team member ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search term for filtering domains
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [domainName, priority, riskLevel, assessmentScore, nextAssessmentDate]
 *         description: Sort field for ordering results
 *       - in: query
 *         name: sortDirection
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort direction
 *     responses:
 *       200:
 *         description: Care domains retrieved successfully
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
 *                     $ref: '#/components/schemas/CareDomainResponseDto'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
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
router.get('/:planId/domains',
  requirePermission(Permission.CARE_RECORD_READ),
  controller.getCareDomains.bind(controller)
);

export default router;