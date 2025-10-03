import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview NHS Digital Compliance API Routes
 * @module NHSDigitalComplianceRoutes
 * @version 1.0.0
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../../middleware/auth-middleware';
import { rbacMiddleware } from '../../middleware/rbac-middleware';
import { auditMiddleware } from '../../middleware/audit-middleware';
import { NHSDigitalComplianceService } from '../../services/compliance/NHSDigitalComplianceService';
import { DSPTComplianceService } from '../../services/compliance/DSPTComplianceService';

const router = Router();
const nhsDigitalService = new NHSDigitalComplianceService();
const dsptService = new DSPTComplianceService();

// Apply middleware
router.use(authMiddleware);
router.use(auditMiddleware);

/**
 * @route POST /api/v1/compliance/nhs-digital/clinical-risk-assessment
 * @desc Conduct DCB0129 clinical risk assessment
 * @access Private (Clinical Safety Officers)
 */
router.post('/clinical-risk-assessment',
  rbacMiddleware(['clinical_safety_officer', 'compliance_officer', 'admin']),
  body('systemComponent').isString().trim().isLength({ min: 1 }),
  body('organizationId').isUUID(),
  body('assessmentData').isObject(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { systemComponent, organizationId, assessmentData } = req.body;

      const riskAssessment = await nhsDigitalService.conductClinicalRiskAssessment(
        systemComponent,
        organizationId,
        assessmentData
      );

      res.status(201).json({
        success: true,
        data: riskAssessment,
        message: 'Clinical risk assessment completed successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Clinical risk assessment failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/nhs-digital/clinical-safety-case
 * @desc Generate DCB0160 clinical safety case report
 * @access Private (Clinical Safety Officers)
 */
router.post('/clinical-safety-case',
  rbacMiddleware(['clinical_safety_officer', 'compliance_officer', 'admin']),
  body('systemName').isString().trim().isLength({ min: 1 }),
  body('systemVersion').isString().trim().isLength({ min: 1 }),
  body('organizationId').isUUID(),
  body('clinicalSafetyOfficerId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { systemName, systemVersion, organizationId, clinicalSafetyOfficerId } = req.body;

      const safetyCaseReport = await nhsDigitalService.generateClinicalSafetyCaseReport(
        systemName,
        systemVersion,
        organizationId,
        clinicalSafetyOfficerId
      );

      res.status(201).json({
        success: true,
        data: safetyCaseReport,
        message: 'Clinical safety case report generated successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Clinical safety case report generation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/nhs-digital/dspt-assessment
 * @desc Conduct DSPT assessment
 * @access Private (Data Protection Officers)
 */
router.post('/dspt-assessment',
  rbacMiddleware(['data_protection_officer', 'compliance_officer', 'admin']),
  body('organizationId').isUUID(),
  body('assessedBy').isString().trim().isLength({ min: 1 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { organizationId, assessedBy } = req.body;

      const dsptAssessment = await dsptService.conductDSPTAssessment(
        organizationId,
        assessedBy
      );

      res.status(201).json({
        success: true,
        data: dsptAssessment,
        message: 'DSPT assessment completed successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `DSPT assessment failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/nhs-digital/dspt-submission
 * @desc Submit DSPT assessment
 * @access Private (Data Protection Officers)
 */
router.post('/dspt-submission',
  rbacMiddleware(['data_protection_officer', 'compliance_officer', 'admin']),
  body('assessmentId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { assessmentId } = req.body;

      const submissionPackage = await dsptService.generateDSPTSubmission(assessmentId);

      res.status(201).json({
        success: true,
        data: submissionPackage,
        message: 'DSPT submission package generated successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `DSPT submission failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route GET /api/v1/compliance/nhs-digital/status/:organizationId
 * @desc Get NHS Digital compliance status
 * @access Private (All authenticated users)
 */
router.get('/status/:organizationId',
  param('organizationId').isUUID(),
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      const complianceStatus = await nhsDigitalService.monitorNHSDigitalCompliance(organizationId);

      res.json({
        success: true,
        data: complianceStatus,
        message: 'NHS Digital compliance status retrieved successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Failed to retrieve NHS Digital compliance status: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/nhs-digital/validate-cso
 * @desc Validate Clinical Safety Officer certification
 * @access Private (Clinical Safety Officers)
 */
router.post('/validate-cso',
  rbacMiddleware(['clinical_safety_officer', 'compliance_officer', 'admin']),
  body('csoId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { csoId } = req.body;

      const validation = await nhsDigitalService.validateClinicalSafetyOfficer(csoId);

      res.json({
        success: true,
        data: { isValid: validation, validationDate: new Date() },
        message: 'Clinical Safety Officer validation completed'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `CSO validation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/nhs-digital/risk-management-file
 * @desc Generate DCB0155 clinical risk management file
 * @access Private (Clinical Safety Officers)
 */
router.post('/risk-management-file',
  rbacMiddleware(['clinical_safety_officer', 'compliance_officer', 'admin']),
  body('systemName').isString().trim().isLength({ min: 1 }),
  body('organizationId').isUUID(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { systemName, organizationId } = req.body;

      const riskManagementFile = await nhsDigitalService.generateClinicalRiskManagementFile(
        systemName,
        organizationId
      );

      res.status(201).json({
        success: true,
        data: riskManagementFile,
        message: 'Clinical risk management file generated successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Risk management file generation failed: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

/**
 * @route GET /api/v1/compliance/nhs-digital/dspt-status/:organizationId
 * @desc Get DSPT compliance status
 * @access Private (Data Protection Officers)
 */
router.get('/dspt-status/:organizationId',
  rbacMiddleware(['data_protection_officer', 'compliance_officer', 'admin']),
  param('organizationId').isUUID(),
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      // Get latest DSPT assessment
      const latestAssessment = await dsptService.getLatestAssessment(organizationId);

      const dsptStatus = {
        organizationId,
        statusDate: new Date(),
        hasAssessment: !!latestAssessment,
        latestAssessment: latestAssessment || null,
        complianceStatus: latestAssessment?.overallAssertion || 'not_assessed',
        nextAssessmentDue: latestAssessment?.nextAssessmentDue || new Date(),
        actionItemsOutstanding: latestAssessment?.actionPlan?.actions?.filter(a => a.status !== 'completed').length || 0
      };

      res.json({
        success: true,
        data: dsptStatus,
        message: 'DSPT status retrieved successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Failed to retrieve DSPT status: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"}`
      });
    }
  }
);

export default router;