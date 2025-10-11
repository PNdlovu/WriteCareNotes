import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Planning routes for WriteCareNotes
 * @module CarePlanningRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description REST API routes for care planning system with comprehensive
 * validation, security, and healthcare compliance.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Rate limiting for all endpoints
 * - Role-based access control
 * - Comprehensive audit logging
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { CarePlanController } from '../controllers/care-planning/CarePlanController';
import { CarePlanService } from '../services/care-planning/CarePlanService';
import { AuditTrailService } from '../services/audit/AuditTrailService';
import { FieldLevelEncryptionService } from '../services/encryption/FieldLevelEncryptionService';
import { NotificationService } from '../services/notifications/NotificationService';
import { EventPublishingService } from '../services/events/EventPublishingService';
import { authMiddleware } from '../middleware/auth-middleware';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { correlationMiddleware } from '../middleware/correlation-middleware';
import { performanceMiddleware } from '../middleware/performance-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';
import AppDataSource from '../config/database';

const router = Router();

// Initialize services
const auditService = new AuditTrailService(AppDataSource, {} as any);
const encryptionService = new FieldLevelEncryptionService();
const notificationService = new NotificationService({} as any, {} as any);
const eventPublisher = new EventPublishingService({} as any);

const carePlanService = new CarePlanService(
  AppDataSource,
  auditService,
  encryptionService,
  notificationService,
  eventPublisher
);

const controller = new CarePlanController(carePlanService);

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

/**
 * @swagger
 * /api/v1/care-planning/care-plans:
 *   post:
 *     summary: Create a new care plan
 *     description: Creates a comprehensive care plan for a resident with goals, risk assessments, and interventions
 *     tags: [Care Planning]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - residentId
 *               - planName
 *               - planType
 *               - reviewFrequency
 *               - effectiveFrom
 *             properties:
 *               residentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the resident this care plan is for
 *               planName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Name of the care plan
 *               planType:
 *                 type: string
 *                 enum: [initial, review, emergency, discharge]
 *                 description: Type of care plan
 *               reviewFrequency:
 *                 type: string
 *                 enum: [weekly, monthly, quarterly, annually]
 *                 description: How often the care plan should be reviewed
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *                 description: Date when the care plan becomes effective
 *               careGoals:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                       description: Goal description
 *                     category:
 *                       type: string
 *                       description: Goal category
 *                     targetDate:
 *                       type: string
 *                       format: date
 *                       description: Target achievement date
 *                     measurableOutcome:
 *                       type: string
 *                       description: Measurable outcome criteria
 *                     responsibleStaff:
 *                       type: array
 *                       items:
 *                         type: string
 *                         format: uuid
 *                       description: Staff responsible for this goal
 *               riskAssessments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     riskType:
 *                       type: string
 *                       description: Type of risk
 *                     riskLevel:
 *                       type: string
 *                       enum: [low, medium, high, critical]
 *                       description: Risk level
 *                     description:
 *                       type: string
 *                       description: Risk description
 *                     mitigationStrategies:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Risk mitigation strategies
 *                     reviewDate:
 *                       type: string
 *                       format: date
 *                       description: Next risk review date
 *                     assessedBy:
 *                       type: string
 *                       format: uuid
 *                       description: Staff member who assessed the risk
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
 *                   $ref: '#/components/schemas/CarePlan'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/care-plans',
  carePlanningRateLimit,
  rbacMiddleware(['care_manager', 'senior_nurse', 'admin']),
  controller.createCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans:
 *   get:
 *     summary: Search care plans
 *     description: Retrieves paginated list of care plans with filtering options
 *     tags: [Care Planning]
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
 *         name: residentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by resident ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending_approval, active, archived, superseded]
 *         description: Filter by care plan status
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [initial, review, emergency, discharge]
 *         description: Filter by plan type
 *       - in: query
 *         name: reviewDueBefore
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter plans due for review before this date
 *       - in: query
 *         name: isOverdueForReview
 *         schema:
 *           type: boolean
 *         description: Filter plans that are overdue for review
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
 *                     $ref: '#/components/schemas/CarePlan'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/care-plans',
  rbacMiddleware(['care_manager', 'senior_nurse', 'nurse', 'admin', 'care_worker']),
  controller.searchCarePlans.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans/{id}:
 *   get:
 *     summary: Get specific care plan
 *     description: Retrieves detailed care plan by ID with optional related data
 *     tags: [Care Planning]
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
 *       - in: query
 *         name: include
 *         schema:
 *           type: string
 *           enum: [relations]
 *         description: Include related data (domains, reviews, etc.)
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
 *                   $ref: '#/components/schemas/CarePlan'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/care-plans/:id',
  rbacMiddleware(['care_manager', 'senior_nurse', 'nurse', 'admin', 'care_worker']),
  controller.getCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans/{id}:
 *   put:
 *     summary: Update care plan
 *     description: Updates an existing care plan with new information
 *     tags: [Care Planning]
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
 *             type: object
 *             properties:
 *               planName:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               reviewFrequency:
 *                 type: string
 *                 enum: [weekly, monthly, quarterly, annually]
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *               effectiveTo:
 *                 type: string
 *                 format: date
 *               careGoals:
 *                 type: array
 *                 items:
 *                   type: object
 *               riskAssessments:
 *                 type: array
 *                 items:
 *                   type: object
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
 *                   $ref: '#/components/schemas/CarePlan'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.put('/care-plans/:id',
  carePlanningRateLimit,
  rbacMiddleware(['care_manager', 'senior_nurse', 'admin']),
  controller.updateCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans/{id}/approve:
 *   post:
 *     summary: Approve care plan
 *     description: Approves a care plan and activates it for use
 *     tags: [Care Planning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID to approve
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approvalNotes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional notes about the approval
 *               effectiveFrom:
 *                 type: string
 *                 format: date
 *                 description: Optional override for effective date
 *     responses:
 *       200:
 *         description: Care plan approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlan'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.post('/care-plans/:id/approve',
  sensitiveRateLimit,
  rbacMiddleware(['care_manager', 'senior_nurse', 'admin']),
  controller.approveCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans/{id}/archive:
 *   post:
 *     summary: Archive care plan
 *     description: Archives a care plan, making it inactive
 *     tags: [Care Planning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Care plan ID to archive
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Reason for archiving the care plan
 *     responses:
 *       200:
 *         description: Care plan archived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CarePlan'
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
router.post('/care-plans/:id/archive',
  sensitiveRateLimit,
  rbacMiddleware(['care_manager', 'admin']),
  controller.archiveCarePlan.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans/due-for-review:
 *   get:
 *     summary: Get care plans due for review
 *     description: Retrieves care plans that are due for review within specified timeframe
 *     tags: [Care Planning]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: daysAhead
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 365
 *           default: 7
 *         description: Number of days ahead to check for due reviews
 *     responses:
 *       200:
 *         description: Care plans due for review retrieved successfully
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
 *                     $ref: '#/components/schemas/CarePlan'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/care-plans/due-for-review',
  rbacMiddleware(['care_manager', 'senior_nurse', 'admin']),
  controller.getCarePlansDueForReview.bind(controller)
);

/**
 * @swagger
 * /api/v1/care-planning/care-plans/{id}/history:
 *   get:
 *     summary: Get care plan version history
 *     description: Retrieves the version history of a care plan showing all changes over time
 *     tags: [Care Planning]
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
 *         description: Care plan version history retrieved successfully
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
 *                     currentVersion:
 *                       $ref: '#/components/schemas/CarePlan'
 *                     previousVersions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/CarePlan'
 *                     versionHistory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           version:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           createdBy:
 *                             type: string
 *                             format: uuid
 *                           changes:
 *                             type: array
 *                             items:
 *                               type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/care-plans/:id/history',
  rbacMiddleware(['care_manager', 'senior_nurse', 'admin']),
  controller.getCarePlanVersionHistory.bind(controller)
);

export default router;