import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview British Isles Multi-Jurisdictional Compliance Routes
 * @module BritishIslesMultiJurisdictionalRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for British Isles multi-jurisdictional compliance
 */

import { Router } from 'express';
import { BritishIslesComplianceController } from '../../controllers/compliance/BritishIslesComplianceController';
import { authMiddleware } from '../../middleware/auth-middleware';
import { complianceValidationMiddleware } from '../../middleware/compliance-validation-middleware';
import { auditMiddleware } from '../../middleware/audit-middleware';

const router = Router();
const controller = new BritishIslesComplianceController();

// Apply middleware to all routes
router.use(authMiddleware);
router.use(auditMiddleware);

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/overview:
 *   get:
 *     summary: Get British Isles compliance overview
 *     description: Comprehensive overview of compliance across all British Isles jurisdictions
 *     tags: [British Isles Compliance]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: British Isles compliance overview
 *       404:
 *         description: Organization not found
 *       500:
 *         description: Server error
 */
router.get('/:organizationId/overview', controller.getBritishIslesOverview.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/jurisdictions:
 *   get:
 *     summary: Get jurisdiction-specific compliance data
 *     description: Detailed compliance data for each applicable jurisdiction
 *     tags: [British Isles Compliance]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [week, month, quarter, year]
 *     responses:
 *       200:
 *         description: Jurisdiction compliance data
 */
router.get('/:organizationId/jurisdictions', controller.getJurisdictionCompliance.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/trends:
 *   get:
 *     summary: Get compliance trends across jurisdictions
 *     description: Historical compliance trends for all jurisdictions
 *     tags: [British Isles Compliance]
 */
router.get('/:organizationId/trends', controller.getComplianceTrends.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/cross-analysis:
 *   get:
 *     summary: Get cross-jurisdictional analysis
 *     description: Analysis of compliance patterns across jurisdictions
 *     tags: [British Isles Compliance]
 */
router.get('/:organizationId/cross-analysis', controller.getCrossJurisdictionalAnalysis.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/harmonized-report:
 *   post:
 *     summary: Generate harmonized compliance report
 *     description: Generate comprehensive report across all jurisdictions
 *     tags: [British Isles Compliance]
 */
router.post('/:organizationId/harmonized-report', controller.generateHarmonizedReport.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/schedule-review:
 *   post:
 *     summary: Schedule multi-jurisdictional review
 *     description: Schedule compliance review across multiple jurisdictions
 *     tags: [British Isles Compliance]
 */
router.post('/:organizationId/schedule-review', 
  complianceValidationMiddleware,
  controller.scheduleMultiJurisdictionalReview.bind(controller)
);

/**
 * @swagger
 * /api/v1/compliance/british-isles/regulatory-updates:
 *   get:
 *     summary: Get all regulatory updates
 *     description: Latest regulatory updates across all British Isles jurisdictions
 *     tags: [British Isles Compliance]
 */
router.get('/regulatory-updates', controller.getAllRegulatoryUpdates.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/jurisdiction/{jurisdiction}:
 *   get:
 *     summary: Get specific jurisdiction compliance
 *     description: Detailed compliance data for a specific jurisdiction
 *     tags: [British Isles Compliance]
 *     parameters:
 *       - in: path
 *         name: jurisdiction
 *         required: true
 *         schema:
 *           type: string
 *           enum: [england, scotland, wales, northern_ireland, jersey, guernsey, isle_of_man]
 */
router.get('/:organizationId/jurisdiction/:jurisdiction', controller.getSpecificJurisdictionCompliance.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/cultural-compliance:
 *   get:
 *     summary: Get cultural compliance requirements
 *     description: Cultural and heritage compliance requirements for relevant jurisdictions
 *     tags: [British Isles Compliance]
 */
router.get('/:organizationId/cultural-compliance', controller.getCulturalComplianceRequirements.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/unified-action-plan:
 *   post:
 *     summary: Generate unified action plan
 *     description: Create action plan addressing all jurisdictional requirements
 *     tags: [British Isles Compliance]
 */
router.post('/:organizationId/unified-action-plan', controller.generateUnifiedActionPlan.bind(controller));

/**
 * @swagger
 * /api/v1/compliance/british-isles/{organizationId}/assessment:
 *   post:
 *     summary: Perform comprehensive assessment
 *     description: Comprehensive assessment across all applicable jurisdictions
 *     tags: [British Isles Compliance]
 */
router.post('/:organizationId/assessment', 
  complianceValidationMiddleware,
  controller.performComprehensiveAssessment.bind(controller)
);

export { router as britishIslesMultiJurisdictionalRoutes };
