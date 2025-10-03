import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { DVLAService } from '../../services/hr/DVLAService';
import { logger } from '../../utils/logger';

const router = Router();
const dvlaService = new DVLAService();

/**
 * @fileoverview DVLA Integration API Routes
 * @module DVLARoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for DVLA integration management including
 * license verification, expiry management, and compliance reports.
 */

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// DVLA Check Routes

/**
 * @route GET /api/hr/dvla
 * @desc Get all DVLA checks with optional filtering
 * @access Private
 */
router.get('/', [
  query('status').optional().isIn(['not_started', 'pending_verification', 'in_progress', 'verified', 'expired', 'invalid', 'rejected', 'cancelled']),
  query('licenseType').optional().isIn(['provisional', 'full', 'international', 'eu', 'other']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  query('employeeId').optional().isUUID(),
  query('careHomeId').optional().isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as string,
      licenseType: req.query.licenseType as string,
      priority: req.query.priority as string,
      employeeId: req.query.employeeId as string,
      careHomeId: req.query.careHomeId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await dvlaService.getAllDVLAChecks(filters);
    
    res.json({
      success: true,
      data: result.checks,
      pagination: result.pagination,
      message: 'DVLA checks retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving DVLA checks:', error);
    next(error);
  }
});

/**
 * @route GET /api/hr/dvla/:id
 * @desc Get DVLA check by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await dvlaService.getDVLACheckById(req.params.id);
    
    if (!check) {
      return res.status(404).json({
        success: false,
        message: 'DVLA check not found'
      });
    }

    res.json({
      success: true,
      data: check,
      message: 'DVLA check retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving DVLA check:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla
 * @desc Create new DVLA check
 * @access Private
 */
router.post('/', [
  body('employeeId').isUUID(),
  body('licenseType').isIn(['provisional', 'full', 'international', 'eu', 'other']),
  body('licenseNumber').isString().isLength({ min: 1, max: 20 }),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  body('licenseCategories').isArray(),
  body('licenseCategories.*').isIn(['A', 'B', 'C', 'D', 'BE', 'CE', 'DE', 'AM', 'A1', 'A2', 'B1', 'C1', 'D1', 'C1E', 'D1E']),
  body('careHomeId').optional().isUUID(),
  body('department').optional().isString().isLength({ min: 1, max: 100 }),
  body('position').optional().isString().isLength({ min: 1, max: 100 }),
  body('requiresDriving').optional().isBoolean(),
  body('isVulnerableAdultRole').optional().isBoolean(),
  body('isChildRole').optional().isBoolean(),
  body('riskLevel').optional().isIn(['low', 'medium', 'high']),
  body('riskAssessmentNotes').optional().isString(),
  body('isHighRisk').optional().isBoolean(),
  body('verificationCost').optional().isDecimal(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const checkData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const check = await dvlaService.createDVLACheck(checkData);
    
    res.status(201).json({
      success: true,
      data: check,
      message: 'DVLA check created successfully'
    });
  } catch (error) {
    logger.error('Error creating DVLA check:', error);
    next(error);
  }
});

/**
 * @route PUT /api/hr/dvla/:id
 * @desc Update DVLA check
 * @access Private
 */
router.put('/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['not_started', 'pending_verification', 'in_progress', 'verified', 'expired', 'invalid', 'rejected', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  body('licenseNumber').optional().isString().isLength({ min: 1, max: 20 }),
  body('referenceNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('dvlaReference').optional().isString().isLength({ min: 1, max: 100 }),
  body('issueDate').optional().isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('verificationDate').optional().isISO8601(),
  body('issuingAuthority').optional().isString().isLength({ min: 1, max: 100 }),
  body('issuingCountry').optional().isString().isLength({ min: 1, max: 100 }),
  body('verificationNotes').optional().isString(),
  body('rejectionReason').optional().isString(),
  body('additionalInformation').optional().isString(),
  body('riskLevel').optional().isIn(['low', 'medium', 'high']),
  body('riskAssessmentNotes').optional().isString(),
  body('isHighRisk').optional().isBoolean(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    const check = await dvlaService.updateDVLACheck(req.params.id, updateData);
    
    if (!check) {
      return res.status(404).json({
        success: false,
        message: 'DVLA check not found'
      });
    }

    res.json({
      success: true,
      data: check,
      message: 'DVLA check updated successfully'
    });
  } catch (error) {
    logger.error('Error updating DVLA check:', error);
    next(error);
  }
});

/**
 * @route DELETE /api/hr/dvla/:id
 * @desc Delete DVLA check
 * @access Private
 */
router.delete('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await dvlaService.deleteDVLACheck(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'DVLA check not found'
      });
    }

    res.json({
      success: true,
      message: 'DVLA check deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting DVLA check:', error);
    next(error);
  }
});

// DVLA Check Actions

/**
 * @route POST /api/hr/dvla/:id/start-verification
 * @desc Start DVLA verification
 * @access Private
 */
router.post('/:id/start-verification', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await dvlaService.startVerification(
      req.params.id,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: check,
      message: 'DVLA verification started successfully'
    });
  } catch (error) {
    logger.error('Error starting DVLA verification:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/:id/submit-verification
 * @desc Submit DVLA verification
 * @access Private
 */
router.post('/:id/submit-verification', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await dvlaService.submitForVerification(
      req.params.id,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: check,
      message: 'DVLA verification submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting DVLA verification:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/:id/complete-verification
 * @desc Complete DVLA verification
 * @access Private
 */
router.post('/:id/complete-verification', [
  param('id').isUUID(),
  body('isValid').isBoolean(),
  body('notes').optional().isString(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await dvlaService.completeVerification(
      req.params.id,
      req.body.isValid,
      req.user?.id,
      req.body.notes
    );
    
    res.json({
      success: true,
      data: check,
      message: 'DVLA verification completed successfully'
    });
  } catch (error) {
    logger.error('Error completing DVLA verification:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/:id/reject-verification
 * @desc Reject DVLA verification
 * @access Private
 */
router.post('/:id/reject-verification', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await dvlaService.rejectVerification(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: check,
      message: 'DVLA verification rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting DVLA verification:', error);
    next(error);
  }
});

// DVLA Service Routes

/**
 * @route GET /api/hr/dvla/:id/services
 * @desc Get DVLA check services
 * @access Private
 */
router.get('/:id/services', [
  param('id').isUUID(),
  query('status').optional().isIn(['pending', 'in_progress', 'completed', 'failed', 'cancelled', 'retrying']),
  query('serviceType').optional().isIn(['license_verification', 'expiry_check', 'category_verification', 'bulk_verification', 'renewal_reminder', 'compliance_check']),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as string,
      serviceType: req.query.serviceType as string
    };

    const services = await dvlaService.getDVLAServicesByCheckId(req.params.id, filters);
    
    res.json({
      success: true,
      data: services,
      message: 'DVLA services retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving DVLA services:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/:id/services
 * @desc Create DVLA service
 * @access Private
 */
router.post('/:id/services', [
  param('id').isUUID(),
  body('serviceType').isIn(['license_verification', 'expiry_check', 'category_verification', 'bulk_verification', 'renewal_reminder', 'compliance_check']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  body('serviceName').isString().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('endpointUrl').isString().isLength({ min: 1, max: 500 }),
  body('httpMethod').optional().isIn(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  body('requestHeaders').optional().isObject(),
  body('requestPayload').optional().isObject(),
  body('scheduledAt').optional().isISO8601(),
  body('timeoutSeconds').optional().isInt({ min: 1, max: 300 }),
  body('maxRetries').optional().isInt({ min: 1, max: 10 }),
  body('isComplianceCritical').optional().isBoolean(),
  body('requiresAudit').optional().isBoolean(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const serviceData = {
      ...req.body,
      dvlaCheckId: req.params.id,
      createdBy: req.user?.id
    };

    const service = await dvlaService.createDVLAService(serviceData);
    
    res.status(201).json({
      success: true,
      data: service,
      message: 'DVLA service created successfully'
    });
  } catch (error) {
    logger.error('Error creating DVLA service:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/services/:serviceId/execute
 * @desc Execute DVLA service
 * @access Private
 */
router.post('/services/:serviceId/execute', [
  param('serviceId').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await dvlaService.executeDVLAService(
      req.params.serviceId,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: service,
      message: 'DVLA service executed successfully'
    });
  } catch (error) {
    logger.error('Error executing DVLA service:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/services/:serviceId/retry
 * @desc Retry DVLA service
 * @access Private
 */
router.post('/services/:serviceId/retry', [
  param('serviceId').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const service = await dvlaService.retryDVLAService(
      req.params.serviceId,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: service,
      message: 'DVLA service retried successfully'
    });
  } catch (error) {
    logger.error('Error retrying DVLA service:', error);
    next(error);
  }
});

// DVLA Compliance and Reporting Routes

/**
 * @route GET /api/hr/dvla/compliance/summary
 * @desc Get DVLA compliance summary
 * @access Private
 */
router.get('/compliance/summary', [
  query('careHomeId').optional().isUUID(),
  query('department').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      careHomeId: req.query.careHomeId as string,
      department: req.query.department as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string
    };

    const summary = await dvlaService.getComplianceSummary(filters);
    
    res.json({
      success: true,
      data: summary,
      message: 'DVLA compliance summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving DVLA compliance summary:', error);
    next(error);
  }
});

/**
 * @route GET /api/hr/dvla/expiry-alerts
 * @desc Get DVLA expiry alerts
 * @access Private
 */
router.get('/expiry-alerts', [
  query('withinDays').optional().isInt({ min: 1, max: 365 }),
  query('careHomeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const withinDays = parseInt(req.query.withinDays as string) || 30;
    const careHomeId = req.query.careHomeId as string;

    const alerts = await dvlaService.getExpiryAlerts(withinDays, careHomeId);
    
    res.json({
      success: true,
      data: alerts,
      message: 'DVLA expiry alerts retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving DVLA expiry alerts:', error);
    next(error);
  }
});

/**
 * @route GET /api/hr/dvla/license-categories
 * @desc Get available license categories
 * @access Private
 */
router.get('/license-categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await dvlaService.getLicenseCategories();
    
    res.json({
      success: true,
      data: categories,
      message: 'License categories retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving license categories:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/dvla/verify-license
 * @desc Verify driving license with DVLA API
 * @access Private
 */
router.post('/verify-license', [
  body('licenseNumber').isString().isLength({ min: 1, max: 20 }),
  body('surname').isString().isLength({ min: 1, max: 100 }),
  body('dateOfBirth').isISO8601(),
  body('issueDate').optional().isISO8601(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const verificationData = {
      licenseNumber: req.body.licenseNumber,
      surname: req.body.surname,
      dateOfBirth: req.body.dateOfBirth,
      issueDate: req.body.issueDate
    };

    const result = await dvlaService.verifyLicenseWithDVLA(verificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'License verification completed successfully'
    });
  } catch (error) {
    logger.error('Error verifying license with DVLA:', error);
    next(error);
  }
});

export default router;