import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Handover Summarizer API Routes
 * @module HandoverSummarizerRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for AI-powered handover summarization
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { HandoverSummarizerService } from '../services/ai/handover.service';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/authorization-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';

const router = Router();
const handoverSummarizerService = new HandoverSummarizerService();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/handover/summarize
 * @desc Generate AI-powered handover summary
 * @access Private (Nursing Staff, Management)
 */
router.post('/summarize',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    body('handoverData').isObject(),
    body('handoverData.shiftNotes').isArray(),
    body('handoverData.incidents').isArray(),
    body('handoverData.carePlanUpdates').isArray(),
    body('handoverData.medicationChanges').isArray(),
    body('handoverData.residentUpdates').isArray(),
    body('handoverData.criticalAlerts').isArray(),
    body('departmentId').isUUID(),
    body('shiftType').isIn(['day', 'evening', 'night']),
    body('handoverDate').isISO8601(),
    body('organizationId').isUUID(),
    body('tenantId').isUUID(),
    body('options').isObject(),
    body('options.includePII').isBoolean(),
    body('options.detailLevel').isIn(['summary', 'detailed', 'comprehensive'])
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const summary = await handoverSummarizerService.generateHandoverSummary({
        handoverData: req.body.handoverData,
        departmentId: req.body.departmentId,
        shiftType: req.body.shiftType,
        handoverDate: new Date(req.body.handoverDate),
        requestedBy: req.user?.id || 'system',
        organizationId: req.body.organizationId,
        tenantId: req.body.tenantId,
        options: req.body.options
      });

      res.status(201).json({
        success: true,
        data: summary,
        message: 'Handover summary generated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/handover/history
 * @desc Get handover summary history
 * @access Private (Nursing Staff, Management)
 */
router.get('/history',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    query('departmentId').isUUID(),
    query('fromDate').isISO8601(),
    query('toDate').isISO8601(),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { departmentId, fromDate, toDate, limit = 50 } = req.query;

      const summaries = await handoverSummarizerService.getHandoverHistory(
        departmentId as string,
        new Date(fromDate as string),
        new Date(toDate as string),
        parseInt(limit as string)
      );

      res.json({
        success: true,
        data: summaries,
        message: 'Handover history retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/handover/summary/:summaryId
 * @desc Get specific handover summary
 * @access Private (Nursing Staff, Management)
 */
router.get('/summary/:summaryId',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('summaryId').isString()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { summaryId } = req.params;
      const summary = await handoverSummarizerService.getHandoverSummary(summaryId);

      if (!summary) {
        return res.status(404).json({
          success: false,
          message: 'Handover summary not found'
        });
      }

      res.json({
        success: true,
        data: summary,
        message: 'Handover summary retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/handover/summary/:summaryId
 * @desc Update handover summary (for manual edits)
 * @access Private (Nursing Staff, Management)
 */
router.put('/summary/:summaryId',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('summaryId').isString(),
    body('updates').isObject()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { summaryId } = req.params;
      const { updates } = req.body;

      const updatedSummary = await handoverSummarizerService.updateHandoverSummary(
        summaryId,
        updates,
        req.user?.id || 'system'
      );

      res.json({
        success: true,
        data: updatedSummary,
        message: 'Handover summary updated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/handover/analytics/:departmentId
 * @desc Get handover summary analytics
 * @access Private (Management)
 */
router.get('/analytics/:departmentId',
  authorize(['charge_nurse', 'deputy_manager', 'manager', 'admin']),
  [
    param('departmentId').isUUID(),
    query('fromDate').isISO8601(),
    query('toDate').isISO8601()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { departmentId } = req.params;
      const { fromDate, toDate } = req.query;

      const analytics = await handoverSummarizerService.getHandoverAnalytics(
        departmentId,
        new Date(fromDate as string),
        new Date(toDate as string)
      );

      res.json({
        success: true,
        data: analytics,
        message: 'Handover analytics retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route POST /api/handover/summarize/batch
 * @desc Generate multiple handover summaries in batch
 * @access Private (Management)
 */
router.post('/summarize/batch',
  authorize(['deputy_manager', 'manager', 'admin']),
  [
    body('requests').isArray(),
    body('requests.*.handoverData').isObject(),
    body('requests.*.departmentId').isUUID(),
    body('requests.*.shiftType').isIn(['day', 'evening', 'night']),
    body('requests.*.handoverDate').isISO8601(),
    body('requests.*.organizationId').isUUID(),
    body('requests.*.tenantId').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { requests } = req.body;
      const results = [];

      for (const request of requests) {
        try {
          const summary = await handoverSummarizerService.generateHandoverSummary({
            ...request,
            requestedBy: req.user?.id || 'system'
          });
          results.push({ success: true, data: summary });
        } catch (error) {
          results.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error',
            requestId: request.requestId || 'unknown'
          });
        }
      }

      res.status(201).json({
        success: true,
        data: results,
        message: 'Batch handover summarization completed'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route POST /api/handover/summarize/quick
 * @desc Generate quick handover summary from shift notes
 * @access Private (Nursing Staff)
 */
router.post('/summarize/quick',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    body('shiftNotes').isArray(),
    body('departmentId').isUUID(),
    body('shiftType').isIn(['day', 'evening', 'night']),
    body('handoverDate').isISO8601(),
    body('organizationId').isUUID(),
    body('tenantId').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false,
          errors: errors.array(),
          message: 'Validation failed'
        });
      }

      const { shiftNotes, departmentId, shiftType, handoverDate, organizationId, tenantId } = req.body;

      // Create a minimal handover data structure for quick summarization
      const handoverData = {
        shiftNotes,
        incidents: [],
        carePlanUpdates: [],
        medicationChanges: [],
        residentUpdates: [],
        criticalAlerts: [],
        environmentalConcerns: [],
        equipmentIssues: [],
        staffNotes: [],
        familyCommunications: []
      };

      const summary = await handoverSummarizerService.generateHandoverSummary({
        handoverData,
        departmentId,
        shiftType,
        handoverDate: new Date(handoverDate),
        requestedBy: req.user?.id || 'system',
        organizationId,
        tenantId,
        options: {
          includePII: false,
          detailLevel: 'summary',
          focusAreas: ['residents', 'incidents', 'alerts']
        }
      });

      res.status(201).json({
        success: true,
        data: summary,
        message: 'Quick handover summary generated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

export { router as handoverSummarizerRouter };