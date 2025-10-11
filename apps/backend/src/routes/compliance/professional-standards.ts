import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Professional Standards API Routes
 * @module ProfessionalStandardsRoutes
 * @version 1.0.0
 */

import { Router } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { authMiddleware } from '../../middleware/auth-middleware';
import { rbacMiddleware } from '../../middleware/rbac-middleware';
import { auditMiddleware } from '../../middleware/audit-middleware';
import { ProfessionalStandardsService } from '../../services/compliance/ProfessionalStandardsService';

const router = Router();
const professionalService = new ProfessionalStandardsService();

// Apply middleware
router.use(authMiddleware);
router.use(auditMiddleware);

/**
 * @route POST /api/v1/compliance/professional/assessment
 * @desc Conduct comprehensive professional standards assessment
 * @access Private (HR Managers, Compliance Officers)
 */
router.post('/assessment',
  rbacMiddleware(['hr_manager', 'compliance_officer', 'admin']),
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

      const assessment = await professionalService.conductProfessionalStandardsAssessment(
        organizationId,
        assessedBy
      );

      res.status(201).json({
        success: true,
        data: assessment,
        message: 'Professional standards assessment completed successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Professional standards assessmentfailed: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

/**
 * @route GET /api/v1/compliance/professional/registrations/:organizationId
 * @desc Get professional registrations for organization
 * @access Private (HR Managers)
 */
router.get('/registrations/:organizationId',
  rbacMiddleware(['hr_manager', 'compliance_officer', 'admin']),
  param('organizationId').isUUID(),
  query('professionalBody').optional().isIn(['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc']),
  query('status').optional().isIn(['active', 'lapsed', 'suspended', 'removed', 'pending']),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { professionalBody, status } = req.query;

      const monitoring = await professionalService.monitorProfessionalRegistrations(organizationId);

      // Filter results if specific criteria provided
      let filteredRegistrations = monitoring.registrations || [];
      
      if (professionalBody) {
        filteredRegistrations = filteredRegistrations.filter(reg => reg.professionalBody === professionalBody);
      }
      
      if (status) {
        filteredRegistrations = filteredRegistrations.filter(reg => reg.status === status);
      }

      res.json({
        success: true,
        data: {
          organizationId,
          totalRegistrations: monitoring.totalRegistrations,
          filteredRegistrations,
          registrationsByBody: monitoring.registrationsByBody,
          expiringRegistrations: monitoring.expiringRegistrations,
          expiredRegistrations: monitoring.expiredRegistrations,
          complianceScore: monitoring.overallComplianceScore
        },
        message: 'Professional registrations retrieved successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Failed to retrieve professionalregistrations: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/professional/development-plan
 * @desc Generate professional development plan
 * @access Private (HR Managers, Staff)
 */
router.post('/development-plan',
  rbacMiddleware(['hr_manager', 'staff', 'compliance_officer', 'admin']),
  body('staffId').isUUID(),
  body('professionalBody').isIn(['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc']),
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

      const { staffId, professionalBody } = req.body;

      const developmentPlan = await professionalService.generateProfessionalDevelopmentPlan(
        staffId,
        professionalBody
      );

      res.status(201).json({
        success: true,
        data: developmentPlan,
        message: 'Professional development plan generated successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Development plan generationfailed: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

/**
 * @route POST /api/v1/compliance/professional/validate-registration
 * @desc Validate professional registration with professional body
 * @access Private (HR Managers)
 */
router.post('/validate-registration',
  rbacMiddleware(['hr_manager', 'compliance_officer', 'admin']),
  body('registrationNumber').isString().trim().isLength({ min: 1 }),
  body('professionalBody').isIn(['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc']),
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

      const { registrationNumber, professionalBody } = req.body;

      const validation = await professionalService.validateProfessionalRegistration(
        registrationNumber,
        professionalBody
      );

      res.json({
        success: true,
        data: validation,
        message: 'Professional registration validated successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Registration validationfailed: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

/**
 * @route GET /api/v1/compliance/professional/monitor/:organizationId
 * @desc Monitor professional standards compliance
 * @access Private (HR Managers, Compliance Officers)
 */
router.get('/monitor/:organizationId',
  rbacMiddleware(['hr_manager', 'compliance_officer', 'admin']),
  param('organizationId').isUUID(),
  async (req, res) => {
    try {
      const { organizationId } = req.params;

      const monitoring = await professionalService.monitorProfessionalRegistrations(organizationId);

      res.json({
        success: true,
        data: monitoring,
        message: 'Professional standards monitoring data retrieved successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Professional standards monitoringfailed: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

/**
 * @route GET /api/v1/compliance/professional/expiring/:organizationId
 * @desc Get expiring professional registrations
 * @access Private (HR Managers)
 */
router.get('/expiring/:organizationId',
  rbacMiddleware(['hr_manager', 'compliance_officer', 'admin']),
  param('organizationId').isUUID(),
  query('days').optional().isInt({ min: 1, max: 365 }),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const days = parseInt(req.query['days'] as string) || 60;

      const monitoring = await professionalService.monitorProfessionalRegistrations(organizationId);
      
      const expiringRegistrations = monitoring.expiringRegistrations || [];
      const revalidationsDue = monitoring.revalidationsDue || [];

      res.json({
        success: true,
        data: {
          organizationId,
          checkDate: new Date(),
          daysAhead: days,
          expiringRegistrations,
          revalidationsDue,
          totalExpiring: expiringRegistrations.length + revalidationsDue.length
        },
        message: 'Expiring professional registrations retrieved successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Failed to retrieve expiringregistrations: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

/**
 * @route GET /api/v1/compliance/professional/cpd-status/:organizationId
 * @desc Get CPD compliance status for organization
 * @access Private (HR Managers)
 */
router.get('/cpd-status/:organizationId',
  rbacMiddleware(['hr_manager', 'compliance_officer', 'admin']),
  param('organizationId').isUUID(),
  query('professionalBody').optional().isIn(['nmc', 'gmc', 'hcpc', 'gphc', 'goc', 'gdc']),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { professionalBody } = req.query;

      const monitoring = await professionalService.monitorProfessionalRegistrations(organizationId);
      
      const cpdStatus = {
        organizationId,
        statusDate: new Date(),
        professionalBody: professionalBody || 'all',
        cpdDeficiencies: monitoring.cpdDeficiencies || [],
        overallCPDCompliance: monitoring.overallComplianceScore || 0,
        staffRequiringCPD: monitoring.cpdDeficiencies?.length || 0,
        totalStaff: monitoring.totalRegistrations || 0,
        compliancePercentage: monitoring.totalRegistrations > 0 ? 
          ((monitoring.totalRegistrations - (monitoring.cpdDeficiencies?.length || 0)) / monitoring.totalRegistrations) * 100 : 100
      };

      res.json({
        success: true,
        data: cpdStatus,
        message: 'CPD compliance status retrieved successfully'
      });

    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: `Failed to retrieve CPDstatus: ${error instanceof Error ? error.message : "Unknown error"}`
      });
    }
  }
);

export default router;
