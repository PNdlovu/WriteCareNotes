import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Clinical Safety Routes for medication safety and clinical decision support endpoints
 * @module ClinicalSafetyRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Defines Express.js routes for clinical safety functionality including drug interaction
 * checking, allergy screening, contraindication detection, and safety alert generation.
 * Integrates with authentication, authorization, and audit middleware.
 * 
 * @example
 * import { clinicalSafetyRoutes } from './routes/clinical-safety';
 * app.use('/api/v1/clinical-safety', clinicalSafetyRoutes);
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England: Clinical governance and medication safety standards
 * - Care Inspectorate - Scotland: Clinical safety and medication management requirements
 * - CIW (Care Inspectorate Wales) - Wales: Clinical oversight and medication safety protocols
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland: Clinical safety standards
 * - HIQA (Health Information and Quality Authority) - Republic of Ireland: Medication safety guidelines
 * - Isle of Man Department of Health and Social Care: Clinical governance standards
 * - States of Guernsey Health and Social Care: Clinical safety and medication management protocols
 * - Government of Jersey Health and Community Services: Clinical safety requirements
 * 
 * @security
 * - Implements JWT authentication for all clinical safety endpoints
 * - Role-based access control for clinical functions (nurse, doctor, pharmacist, clinical_pharmacist)
 * - Comprehensive audit logging for all clinical safety operations
 * - Rate limiting to prevent abuse of clinical decision support systems
 */

import { Router } from 'express';
import { ClinicalSafetyController } from '../controllers/medication/ClinicalSafetyController';
import { authMiddleware } from '../middleware/auth-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { performanceMiddleware } from '../middleware/performance-middleware';
import { correlationMiddleware } from '../middleware/correlation-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';
import { validationMiddleware } from '../middleware/validation-middleware';
import { tenantIsolationMiddleware } from '../middleware/tenant-isolation-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';
import { body, param, query } from 'express-validator';
import { logger } from '../utils/logger';

const router = Router();
const clinicalSafetyController = new ClinicalSafetyController();

// Apply common middleware to all routes
router.use(correlationMiddleware);
router.use(performanceMiddleware);
router.use(authMiddleware);
router.use(tenantIsolationMiddleware);
router.use(complianceMiddleware);

// Rate limiting for clinical safety endpoints
const clinicalSafetyRateLimit = rateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many clinical safety requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(clinicalSafetyRateLimit);

/**
 * POST /api/v1/clinical-safety/check
 * Performs comprehensive medication safety check
 */
router.post('/check',
  [
    // Input validation
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('medicationId')
      .isUUID()
      .withMessage('Medication ID must be a valid UUID'),
    body('dosage.amount')
      .isNumeric()
      .isFloat({ min: 0 })
      .withMessage('Dosage amount must be a positive number'),
    body('dosage.unit')
      .isString()
      .isLength({ min: 1, max: 50 })
      .withMessage('Dosage unit must be a non-empty string (max 50 characters)'),
    body('frequency')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Frequency must be a non-empty string (max 100 characters)'),
    body('route')
      .isString()
      .isLength({ min: 1, max: 100 })
      .withMessage('Route must be a non-empty string (max 100 characters)'),
    body('duration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Duration must be a positive integer'),
    body('indication')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Indication must be a string (max 500 characters)'),
    body('organizationId')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('tenantId')
      .isUUID()
      .withMessage('Tenant ID must be a valid UUID'),
    
    validationMiddleware,
    rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'clinical_pharmacist', 'prescriber']),
    auditMiddleware('CLINICAL_SAFETY_CHECK')
  ],
  async (req, res, next) => {
    try {
      console.info('Processing comprehensive safety check request', {
        correlationId: req.correlationId,
        residentId: req.body['residentId'],
        medicationId: req.body['medicationId'],
        userId: req.user?.id
      });

      const result = await clinicalSafetyController.performSafetyCheck(req.body, req);
      
      console.info('Safety check completed successfully', {
        correlationId: req.correlationId,
        safe: result.data.safe,
        riskLevel: result.data.riskLevel
      });

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Safety check failed', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        stack: error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/clinical-safety/interactions
 * Checks for drug interactions between medications
 */
router.post('/interactions',
  [
    // Input validation
    body('medications')
      .isArray({ min: 2 })
      .withMessage('Medications must be an array with at least 2 items'),
    body('medications.*')
      .isUUID()
      .withMessage('Each medication ID must be a valid UUID'),
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('organizationId')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('tenantId')
      .isUUID()
      .withMessage('Tenant ID must be a valid UUID'),
    
    validationMiddleware,
    rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'clinical_pharmacist']),
    auditMiddleware('DRUG_INTERACTION_CHECK')
  ],
  async (req, res, next) => {
    try {
      console.info('Processing drug interaction check request', {
        correlationId: req.correlationId,
        residentId: req.body['residentId'],
        medicationCount: req.body['medications'].length,
        userId: req.user?.id
      });

      const result = await clinicalSafetyController.checkDrugInteractions(req.body, req);
      
      console.info('Drug interaction check completed', {
        correlationId: req.correlationId,
        interactionCount: result.data.interactions.length
      });

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Drug interaction check failed', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/clinical-safety/allergies
 * Checks for medication allergies and cross-reactivity
 */
router.post('/allergies',
  [
    // Input validation
    body('medicationId')
      .isUUID()
      .withMessage('Medication ID must be a valid UUID'),
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('organizationId')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('tenantId')
      .isUUID()
      .withMessage('Tenant ID must be a valid UUID'),
    
    validationMiddleware,
    rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'clinical_pharmacist']),
    auditMiddleware('ALLERGY_CHECK')
  ],
  async (req, res, next) => {
    try {
      console.info('Processing allergy check request', {
        correlationId: req.correlationId,
        residentId: req.body['residentId'],
        medicationId: req.body['medicationId'],
        userId: req.user?.id
      });

      const result = await clinicalSafetyController.checkAllergies(req.body, req);
      
      console.info('Allergy check completed', {
        correlationId: req.correlationId,
        allergyCount: result.data.allergies.length
      });

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Allergy check failed', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      next(error);
    }
  }
);

/**
 * POST /api/v1/clinical-safety/contraindications
 * Checks for medication contraindications
 */
router.post('/contraindications',
  [
    // Input validation
    body('medicationId')
      .isUUID()
      .withMessage('Medication ID must be a valid UUID'),
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('organizationId')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('tenantId')
      .isUUID()
      .withMessage('Tenant ID must be a valid UUID'),
    
    validationMiddleware,
    rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'clinical_pharmacist']),
    auditMiddleware('CONTRAINDICATION_CHECK')
  ],
  async (req, res, next) => {
    try {
      console.info('Processing contraindication check request', {
        correlationId: req.correlationId,
        residentId: req.body['residentId'],
        medicationId: req.body['medicationId'],
        userId: req.user?.id
      });

      const result = await clinicalSafetyController.checkContraindications(req.body, req);
      
      console.info('Contraindication check completed', {
        correlationId: req.correlationId,
        contraindicationCount: result.data.contraindications.length
      });

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Contraindication check failed', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/clinical-safety/alerts/:residentId
 * Generates safety alerts for a resident
 */
router.get('/alerts/:residentId',
  [
    // Parameter validation
    param('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    query('organizationId')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    query('tenantId')
      .isUUID()
      .withMessage('Tenant ID must be a valid UUID'),
    
    validationMiddleware,
    rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'clinical_pharmacist']),
    auditMiddleware('SAFETY_ALERT_GENERATION')
  ],
  async (req, res, next) => {
    try {
      console.info('Processing safety alert generation request', {
        correlationId: req.correlationId,
        residentId: req.params['residentId'],
        userId: req.user?.id
      });

      const result = await clinicalSafetyController.generateSafetyAlerts(
        req.params['residentId'],
        req.query['organizationId'] as string,
        req.query['tenantId'] as string,
        req
      );
      
      console.info('Safety alert generation completed', {
        correlationId: req.correlationId,
        alertCount: result.data.length
      });

      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Safety alert generation failed', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      next(error);
    }
  }
);

/**
 * GET /api/v1/clinical-safety/health
 * Health check endpoint for clinical safety service
 */
router.get('/health',
  async (req, res, next) => {
    try {
      logger.debug('Processing clinical safety health check', {
        correlationId: req.correlationId
      });

      const result = await clinicalSafetyController.healthCheck();
      
      res.status(200).json(result);
    } catch (error: unknown) {
      console.error('Clinical safety health check failed', {
        correlationId: req.correlationId,
        error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      });
      next(error);
    }
  }
);

// Error handling middleware specific to clinical safety routes
router.use((error: any, req: any, res: any, next: any) => {
  console.error('Clinical safety route error', {
    correlationId: req.correlationId,
    error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
    stack: error instanceof Error ? error instanceof Error ? error.stack : undefined : undefined,
    path: req.path,
    method: req.method
  });

  // Handle specific clinical safety errors
  if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('drug interaction')) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'DRUG_INTERACTION_ERROR',
        message: 'Drug interaction check failed',
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('allergy')) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'ALLERGY_CHECK_ERROR',
        message: 'Allergy screening failed',
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('contraindication')) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'CONTRAINDICATION_ERROR',
        message: 'Contraindication check failed',
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }

  if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('safety check')) {
    return res.status(422).json({
      success: false,
      error: {
        code: 'SAFETY_CHECK_ERROR',
        message: 'Clinical safety check failed',
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    error: {
      code: 'CLINICAL_SAFETY_ERROR',
      message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" || 'Internal server error in clinical safety service',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    }
  });
});

export { router as clinicalSafetyRoutes };