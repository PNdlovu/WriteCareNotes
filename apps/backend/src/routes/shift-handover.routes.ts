import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Shift Handover Routes for WriteCareNotes
 * @module ShiftHandoverRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for shift handover and care round management
 * in care home operations.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ShiftHandoverService } from '../services/workforce/ShiftHandoverService';
import { DailyCareOrganizationService } from '../services/workforce/DailyCareOrganizationService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/authorization-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';

const router = Router();
const shiftHandoverService = new ShiftHandoverService();
const dailyCareService = new DailyCareOrganizationService();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/v1/shift-handover
 * @desc Create a new shift handover
 * @access Private (Nursing Staff, Charge Nurses)
 */
router.post('/',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    body('fromShift').isIn(['day', 'evening', 'night', 'weekend', 'bank_holiday']),
    body('toShift').isIn(['day', 'evening', 'night', 'weekend', 'bank_holiday']),
    body('handoverDate').isISO8601(),
    body('outgoingStaffId').isUUID(),
    body('incomingStaffId').isUUID(),
    body('departmentId').isUUID(),
    body('residentUpdates').isArray(),
    body('organizationId').isUUID(),
    body('tenantId').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const handover = await shiftHandoverService.createShiftHandover(req.body);
      res.status(201).json({
        success: true,
        data: handover,
        message: 'Shift handover created successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/shift-handover/dashboard/:departmentId
 * @desc Get shift handover dashboard
 * @access Private (Nursing Staff, Management)
 */
router.get('/dashboard/:departmentId',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('departmentId').isUUID(),
    query('date').optional().isISO8601()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId } = req.params;
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();

      const dashboard = await shiftHandoverService.getShiftHandoverDashboard(departmentId, date);
      res.json({
        success: true,
        data: dashboard,
        message: 'Dashboard retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/v1/shift-handover/:handoverId/complete
 * @desc Complete a shift handover
 * @access Private (Incoming Staff)
 */
router.put('/:handoverId/complete',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('handoverId').isUUID(),
    body('incomingStaffConfirmation').isBoolean(),
    body('questionsAsked').isArray(),
    body('clarificationsProvided').isArray(),
    body('handoverQuality').isNumeric().isFloat({ min: 1, max: 10 }),
    body('completedBy').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { handoverId } = req.params;
      const handover = await shiftHandoverService.completeShiftHandover(handoverId, req.body);
      
      res.json({
        success: true,
        data: handover,
        message: 'Shift handover completed successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/shift-handover/care-round
 * @desc Start a care round
 * @access Private (Nursing Staff)
 */
router.post('/care-round',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    body('roundType').isIn(['morning_medication', 'morning_care', 'lunch_medication', 'afternoon_care', 'evening_medication', 'evening_care', 'bedtime_care', 'night_medication', 'night_check', 'early_morning_care']),
    body('scheduledStartTime').isISO8601(),
    body('assignedNurseId').isUUID(),
    body('departmentId').isUUID(),
    body('residentList').isArray(),
    body('organizationId').isUUID(),
    body('tenantId').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const careRound = await shiftHandoverService.startCareRound(req.body);
      res.status(201).json({
        success: true,
        data: careRound,
        message: 'Care round started successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/v1/shift-handover/care-round/:roundId/update/:residentId
 * @desc Update care round progress for a resident
 * @access Private (Nursing Staff)
 */
router.put('/care-round/:roundId/update/:residentId',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('roundId').isUUID(),
    param('residentId').isUUID(),
    body('checklistCompleted').isObject(),
    body('observations').isArray(),
    body('interventionsPerformed').isArray(),
    body('concernsRaised').isArray(),
    body('timeSpent').isNumeric()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { roundId, residentId } = req.params;
      const careRound = await shiftHandoverService.updateCareRound(roundId, residentId, req.body);
      
      res.json({
        success: true,
        data: careRound,
        message: 'Care round updated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/shift-handover/daily-schedule
 * @desc Generate daily care schedule
 * @access Private (Charge Nurses, Management)
 */
router.post('/daily-schedule',
  authorize(['charge_nurse', 'deputy_manager', 'manager']),
  [
    body('date').isISO8601(),
    body('departmentId').isUUID(),
    body('residentCareSchedules').isArray(),
    body('staffAllocations').isArray(),
    body('organizationId').isUUID(),
    body('tenantId').isUUID(),
    body('createdBy').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const schedule = await dailyCareService.generateDailyCareSchedule(req.body);
      res.status(201).json({
        success: true,
        data: schedule,
        message: 'Daily care schedule generated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/shift-handover/daily-care/dashboard/:departmentId
 * @desc Get daily care dashboard
 * @access Private (All Care Staff)
 */
router.get('/daily-care/dashboard/:departmentId',
  authorize(['nurse', 'care_assistant', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('departmentId').isUUID(),
    query('date').optional().isISO8601()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { departmentId } = req.params;
      const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();

      const dashboard = await dailyCareService.getDailyCaresDashboard(departmentId, date);
      res.json({
        success: true,
        data: dashboard,
        message: 'Daily care dashboard retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/v1/shift-handover/care-task/:taskId
 * @desc Update care task completion
 * @access Private (Care Staff)
 */
router.put('/care-task/:taskId',
  authorize(['nurse', 'care_assistant', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('taskId').isUUID(),
    body('status').isIn(['scheduled', 'in_progress', 'completed', 'overdue', 'cancelled', 'deferred']),
    body('completedBy').isUUID(),
    body('outcome').isIn(['successful', 'partially_completed', 'unable_to_complete', 'resident_refused']),
    body('followUpRequired').isBoolean(),
    body('qualityRating').isNumeric().isFloat({ min: 1, max: 10 })
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { taskId } = req.params;
      const task = await dailyCareService.updateCareTask(taskId, req.body);
      
      res.json({
        success: true,
        data: task,
        message: 'Care task updated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route POST /api/v1/shift-handover/observation
 * @desc Record resident observation
 * @access Private (Nursing Staff)
 */
router.post('/observation',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    body('observationType').isIn(['vital_signs', 'behavioral', 'mobility', 'nutrition', 'hydration', 'pain_assessment', 'mental_state', 'skin_integrity', 'medication_effects', 'sleep_pattern', 'social_interaction', 'cognitive_function', 'safety_check', 'wellness_check']),
    body('observationTime').isISO8601(),
    body('observedBy').isUUID(),
    body('findings').isArray(),
    body('concernsRaised').isArray(),
    body('followUpRequired').isBoolean()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      await dailyCareService.recordObservation(req.body);
      res.status(201).json({
        success: true,
        message: 'Observation recorded successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/shift-handover/analytics/:departmentId
 * @desc Get handover analytics
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
        return res.status(400).json({ errors: errors.array() });
      }

      const { departmentId } = req.params;
      const { fromDate, toDate } = req.query;

      const analytics = await shiftHandoverService.getHandoverAnalytics(
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
 * @route POST /api/v1/shift-handover/generate-rounds/:departmentId
 * @desc Generate daily care round schedule
 * @access Private (Charge Nurses, Management)
 */
router.post('/generate-rounds/:departmentId',
  authorize(['charge_nurse', 'deputy_manager', 'manager']),
  [
    param('departmentId').isUUID(),
    body('date').isISO8601()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { departmentId } = req.params;
      const { date } = req.body;

      const careRounds = await shiftHandoverService.generateDailyCareRoundSchedule(
        departmentId,
        new Date(date)
      );
      
      res.status(201).json({
        success: true,
        data: careRounds,
        message: 'Daily care round schedule generated successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route PUT /api/v1/shift-handover/schedule/:scheduleId/optimize
 * @desc Optimize daily care schedule
 * @access Private (Management)
 */
router.put('/schedule/:scheduleId/optimize',
  authorize(['deputy_manager', 'manager', 'admin']),
  [
    param('scheduleId').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { scheduleId } = req.params;
      const optimization = await dailyCareService.optimizeDailyCareSchedule(scheduleId);
      
      res.json({
        success: true,
        data: optimization,
        message: 'Schedule optimized successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

/**
 * @route GET /api/v1/shift-handover/:handoverId
 * @desc Get specific shift handover details
 * @access Private (Nursing Staff, Management)
 */
router.get('/:handoverId',
  authorize(['nurse', 'charge_nurse', 'deputy_manager', 'manager']),
  [
    param('handoverId').isUUID()
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { handoverId } = req.params;
      // Implementation would fetch specific handover details
      
      res.json({
        success: true,
        data: { handoverId },
        message: 'Handover details retrieved successfully'
      });
    } catch (error: unknown) {
      next(error);
    }
  }
);

export { router as shiftHandoverRouter };
