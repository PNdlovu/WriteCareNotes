import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { Container } from 'typedi';
import { DomiciliaryService } from '../../services/domiciliary/DomiciliaryService';
import { JWTAuthenticationService } from '../../services/auth/JWTAuthenticationService';
import { RoleBasedAccessService, Permission } from '../../services/auth/RoleBasedAccessService';
import { ValidationService } from '../../services/validation/ValidationService';
import { ErrorHandler } from '../../middleware/ErrorHandler';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';

const router = Router();
const domiciliaryService = Container.get(DomiciliaryService);
const authService = Container.get(JWTAuthenticationService);
const accessService = Container.get(RoleBasedAccessService);

// Rate limiting
const visitRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Higher limit for visit operations
  message: 'Too many visit requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication middleware
const authenticateToken = authService.verifyToken;

// Permission middleware factory
const requirePermission = (permissions: Permission[]) => {
  return accessService.createPermissionMiddleware(permissions);
};

// Validation schemas
const scheduleVisitSchema = Joi.object({
  serviceUserId: Joi.string().uuid().required(),
  careWorkerId: Joi.string().uuid().required(),
  type: Joi.string().valid(
    'personal_care', 'medication', 'domestic', 'social', 
    'healthcare', 'assessment', 'emergency', 'welfare_check'
  ).required(),
  scheduledStartTime: Joi.date().iso().required(),
  plannedDuration: Joi.number().min(15).max(480).required(),
  scheduledTasks: Joi.array().items(
    Joi.object({
      category: Joi.string().required(),
      task: Joi.string().required(),
      estimatedDuration: Joi.number().min(5).required(),
      priority: Joi.string().valid('critical', 'important', 'routine').required(),
    })
  ).min(1).required(),
  specialInstructions: Joi.string().max(1000).optional(),
});

const startVisitSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }).required(),
  verificationData: Joi.object({
    method: Joi.string().valid('qr_code', 'gps', 'photo', 'manual').optional(),
    data: Joi.any().optional(),
  }).optional(),
});

const completeVisitSchema = Joi.object({
  completedTasks: Joi.array().items(
    Joi.object({
      id: Joi.string().required(),
      completed: Joi.boolean().required(),
      notes: Joi.string().max(1000).optional(),
      issues: Joi.string().max(1000).optional(),
      photoUrls: Joi.array().items(Joi.string().uri()).optional(),
    })
  ).required(),
  medications: Joi.array().items(
    Joi.object({
      medicationId: Joi.string().required(),
      administered: Joi.boolean().required(),
      actualTime: Joi.date().iso().optional(),
      reason: Joi.string().max(500).optional(),
      sideEffectsNoted: Joi.string().max(500).optional(),
    })
  ).optional(),
  observations: Joi.array().items(
    Joi.object({
      category: Joi.string().valid('physical', 'mental', 'environmental', 'social', 'safety').required(),
      observation: Joi.string().max(1000).required(),
      severity: Joi.string().valid('normal', 'concern', 'urgent').required(),
      actionRequired: Joi.boolean().default(false),
      actionTaken: Joi.string().max(1000).optional(),
    })
  ).optional(),
  visitNotes: Joi.string().max(2000).optional(),
  serviceUserFeedback: Joi.object({
    satisfactionRating: Joi.number().min(1).max(5).required(),
    comments: Joi.string().max(1000).optional(),
  }).optional(),
  photos: Joi.array().items(Joi.string().uri()).optional(),
});

/**
 * @route POST /api/domiciliary/visits/schedule
 * @desc Schedule a new care visit
 * @access Private - Requires CREATE_SHIFTS permission
 */
router.post(
  '/schedule',
  visitRateLimit,
  authenticateToken,
  requirePermission([Permission.CREATE_SHIFTS]),
  ErrorHandler.validateRequest(scheduleVisitSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const visit = await domiciliaryService.scheduleVisit(req.body);
    
    res.status(201).json({
      success: true,
      data: { visit },
      message: 'Visit scheduled successfully',
    });
  })
);

/**
 * @route POST /api/domiciliary/visits/:visitId/start
 * @desc Start a care visit
 * @access Private - Requires VIEW_OWN_SHIFTS permission
 * @param visitId - Visit ID
 */
router.post(
  '/:visitId/start',
  visitRateLimit,
  authenticateToken,
  requirePermission([Permission.VIEW_OWN_SHIFTS]),
  ErrorHandler.validateRequest(startVisitSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const { visitId } = req.params;
    const { location, verificationData } = req.body;
    
    const visit = await domiciliaryService.startVisit(
      visitId,
      req.user.id,
      location,
      verificationData
    );
    
    res.status(200).json({
      success: true,
      data: { visit },
      message: 'Visit started successfully',
    });
  })
);

/**
 * @route POST /api/domiciliary/visits/:visitId/complete
 * @desc Complete a care visit
 * @access Private - Requires VIEW_OWN_SHIFTS permission
 * @param visitId - Visit ID
 */
router.post(
  '/:visitId/complete',
  visitRateLimit,
  authenticateToken,
  requirePermission([Permission.VIEW_OWN_SHIFTS]),
  ErrorHandler.validateRequest(completeVisitSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    const { visitId } = req.params;
    
    const visit = await domiciliaryService.completeVisit(
      visitId,
      req.user.id,
      req.body
    );
    
    res.status(200).json({
      success: true,
      data: { visit },
      message: 'Visit completed successfully',
    });
  })
);

/**
 * @route GET /api/domiciliary/visits/my-visits
 * @desc Get care worker's assigned visits
 * @access Private - Requires VIEW_OWN_SHIFTS permission
 * @query date - Date to get visits for (YYYY-MM-DD), defaults to today
 */
router.get(
  '/my-visits',
  authenticateToken,
  requirePermission([Permission.VIEW_OWN_SHIFTS]),
  ErrorHandler.asyncHandler(async (req, res) => {
    const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
    const visits = await domiciliaryService.getCareWorkerVisits(req.user.id, date);
    
    res.status(200).json({
      success: true,
      data: { 
        visits: visits.map(visit => ({
          id: visit.id,
          visitNumber: visit.visitNumber,
          serviceUser: visit.serviceUser?.getFullName(),
          type: visit.type,
          status: visit.status,
          scheduledStartTime: visit.scheduledStartTime,
          scheduledEndTime: visit.scheduledEndTime,
          plannedDuration: visit.plannedDuration,
          location: visit.serviceUser?.getFullAddress(),
          scheduledTasks: visit.scheduledTasks.length,
        })),
        date: date.toISOString().split('T')[0],
      },
    });
  })
);

/**
 * @route GET /api/domiciliary/visits/service-user/:serviceUserId
 * @desc Get visits for a specific service user
 * @access Private - Requires VIEW_TEAM_SHIFTS permission or family access
 * @param serviceUserId - Service User ID
 * @query startDate - Start date (YYYY-MM-DD)
 * @query endDate - End date (YYYY-MM-DD)
 */
router.get(
  '/service-user/:serviceUserId',
  authenticateToken,
  ErrorHandler.asyncHandler(async (req, res) => {
    const { serviceUserId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Check permissions - either team access or family member access to this service user
    const hasTeamAccess = await accessService.hasPermission(
      req.user.id,
      Permission.VIEW_TEAM_SHIFTS,
      req.accessContext
    );
    
    const hasFamilyAccess = req.user.canViewServiceUser(serviceUserId);
    
    if (!hasTeamAccess && !hasFamilyAccess) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to view visits for this service user',
      });
    }
    
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();
    
    const visits = await domiciliaryService.getServiceUserVisits(serviceUserId, start, end);
    
    res.status(200).json({
      success: true,
      data: { visits },
    });
  })
);

/**
 * @route GET /api/domiciliary/visits/:visitId
 * @desc Get visit details
 * @access Private - Requires appropriate permissions
 * @param visitId - Visit ID
 */
router.get(
  '/:visitId',
  authenticateToken,
  ErrorHandler.asyncHandler(async (req, res) => {
    const { visitId } = req.params;
    const visit = await domiciliaryService.getVisitById(visitId);
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found',
        message: 'The requested visit could not be found',
      });
    }
    
    // Check permissions
    const canViewVisit = await domiciliaryService.canUserViewVisit(req.user.id, visit);
    if (!canViewVisit) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'You do not have permission to view this visit',
      });
    }
    
    res.status(200).json({
      success: true,
      data: { visit },
    });
  })
);

/**
 * @route POST /api/domiciliary/visits/:visitId/emergency
 * @desc Raise emergency alert during visit
 * @access Private - Requires emergency alert permissions
 * @param visitId - Visit ID
 */
router.post(
  '/:visitId/emergency',
  authService.verifyToken,
  requirePermission([Permission.CLOCK_IN_OUT]), // Care workers can raise emergencies
  ErrorHandler.asyncHandler(async (req, res) => {
    const { visitId } = req.params;
    const { type, priority, description, location } = req.body;
    
    const visit = await domiciliaryService.getVisitById(visitId);
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found',
      });
    }
    
    const alert = await domiciliaryService.raiseEmergencyAlert({
      type,
      priority,
      serviceUserId: visit.serviceUserId,
      careWorkerId: req.user.id,
      location,
      description,
      responders: [],
    });
    
    res.status(201).json({
      success: true,
      data: { alert },
      message: 'Emergency alert raised successfully',
    });
  })
);

/**
 * @route GET /api/domiciliary/visits/route-optimization/:careWorkerId
 * @desc Get optimized route for care worker's daily visits
 * @access Private - Requires VIEW_TEAM_SHIFTS permission
 * @param careWorkerId - Care Worker ID
 * @query date - Date for route optimization (YYYY-MM-DD)
 */
router.get(
  '/route-optimization/:careWorkerId',
  authenticateToken,
  requirePermission([Permission.VIEW_TEAM_SHIFTS]),
  ErrorHandler.asyncHandler(async (req, res) => {
    const { careWorkerId } = req.params;
    const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
    
    const routeOptimization = await domiciliaryService.optimizeRouteForCareWorker(careWorkerId, date);
    
    res.status(200).json({
      success: true,
      data: { routeOptimization },
    });
  })
);

/**
 * @route GET /api/domiciliary/metrics
 * @desc Get domiciliary care metrics
 * @access Private - Requires VIEW_TEAM_REPORTS permission
 * @query date - Date for metrics (YYYY-MM-DD), defaults to today
 */
router.get(
  '/metrics',
  authenticateToken,
  requirePermission([Permission.VIEW_TEAM_REPORTS]),
  ErrorHandler.asyncHandler(async (req, res) => {
    const date = req.query['date'] ? new Date(req.query['date'] as string) : new Date();
    const metrics = await domiciliaryService.getDomiciliaryMetrics(date);
    
    res.status(200).json({
      success: true,
      data: { metrics },
    });
  })
);

export default router;