import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { RightToWorkService } from '../../services/hr/RightToWorkService';
import { RightToWorkDocumentService } from '../../services/hr/RightToWorkDocumentService';
import { RightToWorkNotificationService } from '../../services/hr/RightToWorkNotificationService';
import { logger } from '../../utils/logger';

const router = Router();
const rightToWorkService = new RightToWorkService();
const rightToWorkDocumentService = new RightToWorkDocumentService();
const rightToWorkNotificationService = new RightToWorkNotificationService();

/**
 * @fileoverview Right to Work Verification API Routes
 * @module RightToWorkRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for Right to Work verification management including
 * document verification, expiry alerts, and compliance dashboards.
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

// Right to Work Check Routes

/**
 * @route GET /api/hr/right-to-work
 * @desc Get all Right to Work checks with optional filtering
 * @access Private
 */
router.get('/', [
  query('status').optional().isIn(['not_started', 'document_uploaded', 'pending_verification', 'verified', 'expired', 'invalid', 'rejected', 'cancelled']),
  query('documentType').optional().isIn(['passport', 'national_id', 'visa', 'work_permit', 'settlement_status', 'eu_settlement', 'british_citizenship', 'other']),
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
      documentType: req.query.documentType as string,
      priority: req.query.priority as string,
      employeeId: req.query.employeeId as string,
      careHomeId: req.query.careHomeId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await rightToWorkService.getAllRightToWorkChecks(filters);
    
    res.json({
      success: true,
      data: result.checks,
      pagination: result.pagination,
      message: 'Right to Work checks retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving Right to Work checks:', error);
    next(error);
  }
});

/**
 * @route GET /api/hr/right-to-work/:id
 * @desc Get Right to Work check by ID
 * @access Private
 */
router.get('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await rightToWorkService.getRightToWorkCheckById(req.params.id);
    
    if (!check) {
      return res.status(404).json({
        success: false,
        message: 'Right to Work check not found'
      });
    }

    res.json({
      success: true,
      data: check,
      message: 'Right to Work check retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving Right to Work check:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work
 * @desc Create new Right to Work check
 * @access Private
 */
router.post('/', [
  body('employeeId').isUUID(),
  body('documentType').isIn(['passport', 'national_id', 'visa', 'work_permit', 'settlement_status', 'eu_settlement', 'british_citizenship', 'other']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  body('verificationType').optional().isIn(['manual', 'automated', 'third_party', 'government_api']),
  body('careHomeId').optional().isUUID(),
  body('department').optional().isString().isLength({ min: 1, max: 100 }),
  body('position').optional().isString().isLength({ min: 1, max: 100 }),
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

    const check = await rightToWorkService.createRightToWorkCheck(checkData);
    
    res.status(201).json({
      success: true,
      data: check,
      message: 'Right to Work check created successfully'
    });
  } catch (error) {
    logger.error('Error creating Right to Work check:', error);
    next(error);
  }
});

/**
 * @route PUT /api/hr/right-to-work/:id
 * @desc Update Right to Work check
 * @access Private
 */
router.put('/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['not_started', 'document_uploaded', 'pending_verification', 'verified', 'expired', 'invalid', 'rejected', 'cancelled']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  body('documentNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('passportNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('visaNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('workPermitNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('referenceNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('issueDate').optional().isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('verificationDate').optional().isISO8601(),
  body('issuingCountry').optional().isString().isLength({ min: 1, max: 100 }),
  body('issuingAuthority').optional().isString().isLength({ min: 1, max: 100 }),
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

    const check = await rightToWorkService.updateRightToWorkCheck(req.params.id, updateData);
    
    if (!check) {
      return res.status(404).json({
        success: false,
        message: 'Right to Work check not found'
      });
    }

    res.json({
      success: true,
      data: check,
      message: 'Right to Work check updated successfully'
    });
  } catch (error) {
    logger.error('Error updating Right to Work check:', error);
    next(error);
  }
});

/**
 * @route DELETE /api/hr/right-to-work/:id
 * @desc Delete Right to Work check
 * @access Private
 */
router.delete('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await rightToWorkService.deleteRightToWorkCheck(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Right to Work check not found'
      });
    }

    res.json({
      success: true,
      message: 'Right to Work check deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting Right to Work check:', error);
    next(error);
  }
});

// Right to Work Check Actions

/**
 * @route POST /api/hr/right-to-work/:id/start-verification
 * @desc Start Right to Work verification
 * @access Private
 */
router.post('/:id/start-verification', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await rightToWorkService.startVerification(
      req.params.id,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: check,
      message: 'Right to Work verification started successfully'
    });
  } catch (error) {
    logger.error('Error starting Right to Work verification:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/:id/submit-verification
 * @desc Submit Right to Work verification
 * @access Private
 */
router.post('/:id/submit-verification', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await rightToWorkService.submitForVerification(
      req.params.id,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: check,
      message: 'Right to Work verification submitted successfully'
    });
  } catch (error) {
    logger.error('Error submitting Right to Work verification:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/:id/complete-verification
 * @desc Complete Right to Work verification
 * @access Private
 */
router.post('/:id/complete-verification', [
  param('id').isUUID(),
  body('isValid').isBoolean(),
  body('notes').optional().isString(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await rightToWorkService.completeVerification(
      req.params.id,
      req.body.isValid,
      req.user?.id,
      req.body.notes
    );
    
    res.json({
      success: true,
      data: check,
      message: 'Right to Work verification completed successfully'
    });
  } catch (error) {
    logger.error('Error completing Right to Work verification:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/:id/reject-verification
 * @desc Reject Right to Work verification
 * @access Private
 */
router.post('/:id/reject-verification', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const check = await rightToWorkService.rejectVerification(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: check,
      message: 'Right to Work verification rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting Right to Work verification:', error);
    next(error);
  }
});

// Right to Work Document Routes

/**
 * @route GET /api/hr/right-to-work/:id/documents
 * @desc Get Right to Work check documents
 * @access Private
 */
router.get('/:id/documents', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documents = await rightToWorkDocumentService.getRightToWorkDocumentsByCheckId(req.params.id);
    
    res.json({
      success: true,
      data: documents,
      message: 'Right to Work documents retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving Right to Work documents:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/:id/documents
 * @desc Upload Right to Work document
 * @access Private
 */
router.post('/:id/documents', [
  param('id').isUUID(),
  body('documentType').isString().isLength({ min: 1, max: 100 }),
  body('fileName').isString().isLength({ min: 1, max: 255 }),
  body('originalFileName').isString().isLength({ min: 1, max: 100 }),
  body('mimeType').isString().isLength({ min: 1, max: 50 }),
  body('filePath').isString().isLength({ min: 1, max: 500 }),
  body('fileHash').isString().isLength({ min: 64, max: 64 }),
  body('fileSize').isInt({ min: 1 }),
  body('isRequired').optional().isBoolean(),
  body('isConfidential').optional().isBoolean(),
  body('documentNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('issueDate').optional().isISO8601(),
  body('expiryDate').optional().isISO8601(),
  body('issuingAuthority').optional().isString().isLength({ min: 1, max: 100 }),
  body('issuingCountry').optional().isString().isLength({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const documentData = {
      ...req.body,
      rightToWorkCheckId: req.params.id,
      uploadedBy: req.user?.id
    };

    const document = await rightToWorkDocumentService.uploadRightToWorkDocument(documentData);
    
    res.status(201).json({
      success: true,
      data: document,
      message: 'Right to Work document uploaded successfully'
    });
  } catch (error) {
    logger.error('Error uploading Right to Work document:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/documents/:documentId/verify
 * @desc Verify Right to Work document
 * @access Private
 */
router.post('/documents/:documentId/verify', [
  param('documentId').isUUID(),
  body('notes').optional().isString(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await rightToWorkDocumentService.verifyDocument(
      req.params.documentId,
      req.user?.id,
      req.body.notes
    );
    
    res.json({
      success: true,
      data: document,
      message: 'Right to Work document verified successfully'
    });
  } catch (error) {
    logger.error('Error verifying Right to Work document:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/documents/:documentId/reject
 * @desc Reject Right to Work document
 * @access Private
 */
router.post('/documents/:documentId/reject', [
  param('documentId').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await rightToWorkDocumentService.rejectDocument(
      req.params.documentId,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: document,
      message: 'Right to Work document rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting Right to Work document:', error);
    next(error);
  }
});

// Right to Work Notification Routes

/**
 * @route GET /api/hr/right-to-work/:id/notifications
 * @desc Get Right to Work check notifications
 * @access Private
 */
router.get('/:id/notifications', [
  param('id').isUUID(),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      status: req.query.status as string,
      priority: req.query.priority as string
    };

    const notifications = await rightToWorkNotificationService.getRightToWorkNotificationsByCheckId(
      req.params.id,
      filters
    );
    
    res.json({
      success: true,
      data: notifications,
      message: 'Right to Work notifications retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving Right to Work notifications:', error);
    next(error);
  }
});

/**
 * @route POST /api/hr/right-to-work/:id/notifications
 * @desc Create Right to Work notification
 * @access Private
 */
router.post('/:id/notifications', [
  param('id').isUUID(),
  body('notificationType').isIn(['document_uploaded', 'document_verified', 'document_rejected', 'verification_started', 'verification_completed', 'verification_approved', 'verification_rejected', 'expiry_warning', 'expired', 'renewal_required', 'compliance_alert', 'risk_assessment', 'system_alert']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  body('title').isString().isLength({ min: 1, max: 255 }),
  body('message').isString().isLength({ min: 1, max: 1000 }),
  body('detailedMessage').optional().isString(),
  body('recipientId').isUUID(),
  body('recipientName').isString().isLength({ min: 1, max: 255 }),
  body('recipientEmail').isEmail(),
  body('recipientPhone').optional().isString().isLength({ min: 1, max: 20 }),
  body('channel').isIn(['email', 'sms', 'push', 'in_app', 'system_log', 'dashboard']),
  body('scheduledAt').optional().isISO8601(),
  body('isComplianceCritical').optional().isBoolean(),
  body('requiresAcknowledgment').optional().isBoolean(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notificationData = {
      ...req.body,
      rightToWorkCheckId: req.params.id,
      createdBy: req.user?.id
    };

    const notification = await rightToWorkNotificationService.createRightToWorkNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Right to Work notification created successfully'
    });
  } catch (error) {
    logger.error('Error creating Right to Work notification:', error);
    next(error);
  }
});

// Right to Work Compliance and Reporting Routes

/**
 * @route GET /api/hr/right-to-work/compliance/summary
 * @desc Get Right to Work compliance summary
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

    const summary = await rightToWorkService.getComplianceSummary(filters);
    
    res.json({
      success: true,
      data: summary,
      message: 'Right to Work compliance summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving Right to Work compliance summary:', error);
    next(error);
  }
});

/**
 * @route GET /api/hr/right-to-work/expiry-alerts
 * @desc Get Right to Work expiry alerts
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

    const alerts = await rightToWorkService.getExpiryAlerts(withinDays, careHomeId);
    
    res.json({
      success: true,
      data: alerts,
      message: 'Right to Work expiry alerts retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving Right to Work expiry alerts:', error);
    next(error);
  }
});

export default router;