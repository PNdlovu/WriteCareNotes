import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { NHSIntegrationController } from '../controllers/nhs-integration.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleMiddleware } from '../middleware/role.middleware';
import { validationMiddleware } from '../middleware/validation.middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';
import { auditMiddleware } from '../middleware/audit.middleware';
import { 
  nhsCredentialsSchema,
  careRecordSchema,
  medicationTransferSchema,
  dscrDataSchema
} from '../schemas/nhs-integration.schema';

/**
 * NHS Integration Routes
 * 
 * Secure routes for NHS Digital and GP Connect integration
 * Includes comprehensive middleware for security, validation, and audit trails
 */

const router = Router();
const nhsController = new NHSIntegrationController();

// Apply common middleware
router.use(authMiddleware);
router.use(auditMiddleware);
router.use(rateLimitMiddleware({ windowMs: 15 * 60 * 1000, max: 100 })); // 100 requests per 15 minutes

/**
 * NHS Connection Management
 */

// POST /api/v1/nhs/connect - Establish NHS Digital connection
router.post('/connect',
  roleMiddleware(['admin', 'clinical-manager']),
  validationMiddleware(nhsCredentialsSchema),
  async (req, res, next) => {
    try {
      const authToken = await nhsController.connectToNHS(req.body);
      res.status(200).json({
        success: true,
        data: authToken,
        message: 'NHS connection established successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// GET /api/v1/nhs/status - Get NHS integration status
router.get('/status',
  roleMiddleware(['admin', 'clinical-manager']),
  async (req, res, next) => {
    try {
      const status = await nhsController.getIntegrationStatus();
      res.status(200).json({
        success: true,
        data: status,
        message: 'NHS integration status retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// GET /api/v1/nhs/test-connection - Test NHS connectivity
router.get('/test-connection',
  roleMiddleware(['admin', 'clinical-manager']),
  async (req, res, next) => {
    try {
      const testResults = await nhsController.testConnection();
      res.status(200).json({
        success: true,
        data: testResults,
        message: 'NHS connectivity test completed'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * GP Connect Patient Data
 */

// GET /api/v1/nhs/patient/:nhsNumber - Fetch patient record from GP Connect
router.get('/patient/:nhsNumber',
  roleMiddleware(['admin', 'clinical-manager', 'nurse', 'care-assistant']),
  async (req, res, next) => {
    try {
      const { nhsNumber } = req.params;
      
      // Validate NHS number format
      if (!/^\d{10}$/.test(nhsNumber)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid NHS number format',
          message: 'NHS number must be 10 digits'
        });
      }

      const patient = await nhsController.getPatientRecord(nhsNumber);
      res.status(200).json({
        success: true,
        data: patient,
        message: 'Patient record retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// PUT /api/v1/nhs/care-record/:patientId - Update patient care record
router.put('/care-record/:patientId',
  roleMiddleware(['admin', 'clinical-manager', 'nurse']),
  validationMiddleware(careRecordSchema),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const result = await nhsController.updateCareRecord(patientId, req.body);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Care record updated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// POST /api/v1/nhs/sync/:nhsNumber - Sync patient data from GP Connect
router.post('/sync/:nhsNumber',
  roleMiddleware(['admin', 'clinical-manager', 'nurse']),
  async (req, res, next) => {
    try {
      const { nhsNumber } = req.params;
      const result = await nhsController.syncPatientData(nhsNumber);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Patient data synchronized successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * eRedBag Medication Management
 */

// POST /api/v1/nhs/medication-transfer - Transfer medications via eRedBag
router.post('/medication-transfer',
  roleMiddleware(['admin', 'clinical-manager', 'nurse']),
  validationMiddleware(medicationTransferSchema),
  async (req, res, next) => {
    try {
      const result = await nhsController.transferMedications(req.body);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Medications transferred successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// GET /api/v1/nhs/medications/:patientId - Receive medications from eRedBag
router.get('/medications/:patientId',
  roleMiddleware(['admin', 'clinical-manager', 'nurse', 'care-assistant']),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const medications = await nhsController.receiveMedications(patientId);
      res.status(200).json({
        success: true,
        data: medications,
        message: 'Medications retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * DSCR (Digital Social Care Records)
 */

// POST /api/v1/nhs/dscr/submit - Submit DSCR data to NHS Digital
router.post('/dscr/submit',
  roleMiddleware(['admin', 'clinical-manager']),
  validationMiddleware(dscrDataSchema),
  async (req, res, next) => {
    try {
      const result = await nhsController.submitDSCRData(req.body);
      res.status(200).json({
        success: true,
        data: result,
        message: 'DSCR data submitted successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

// GET /api/v1/nhs/dscr/submissions - Get DSCR submission history
router.get('/dscr/submissions',
  roleMiddleware(['admin', 'clinical-manager', 'compliance-officer']),
  async (req, res, next) => {
    try {
      const { limit, offset } = req.query;
      const submissions = await nhsController.getDSCRSubmissions(
        parseInt(limit as string) || 50,
        parseInt(offset as string) || 0
      );
      res.status(200).json({
        success: true,
        data: submissions,
        message: 'DSCR submission history retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Compliance Reporting
 */

// GET /api/v1/nhs/compliance/report - Generate NHS Digital compliance report
router.get('/compliance/report',
  roleMiddleware(['admin', 'clinical-manager', 'compliance-officer']),
  async (req, res, next) => {
    try {
      const report = await nhsController.generateComplianceReport();
      res.status(200).json({
        success: true,
        data: report,
        message: 'NHS Digital compliance report generated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * Error handling middleware
 */
router.use((error: any, req: any, res: any, next: any) => {
  console.error('NHS Integration Route Error:', error);

  // NHS-specific error handling
  if (error.response?.status === 401) {
    return res.status(401).json({
      success: false,
      error: 'NHS authentication failed',
      message: 'Please check NHS credentials and try again'
    });
  }

  if (error.response?.status === 403) {
    return res.status(403).json({
      success: false,
      error: 'NHS access forbidden',
      message: 'Insufficient permissions for NHS operation'
    });
  }

  if (error.response?.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'NHS rate limit exceeded',
      message: 'Too many requests to NHS services. Please try again later.'
    });
  }

  // Generic error response
  res.status(error.status || 500).json({
    success: false,
    error: error.name || 'NHS Integration Error',
    message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" || 'An error occurred during NHS integration operation'
  });
});

export default router;