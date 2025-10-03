import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Emergency Management Routes
 * @module EmergencyOnCallRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Enterprise emergency management and nurse call system routes
 * with comprehensive security, validation, and audit trail.
 */

import { Router } from 'express';
import { EmergencyOnCallController } from '../controllers/emergency/EmergencyOnCallController';
import { authMiddleware } from '../middleware/auth-middleware';
import { roleCheckMiddleware } from '../middleware/role-check-middleware';
import { tenantMiddleware } from '../middleware/tenant-middleware';
import { validationMiddleware } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';

const router = Router();
const emergencyController = new EmergencyOnCallController();

// Apply middleware stack
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(auditMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/v1/emergency/incidents
 * @description Report emergency incident with automatic response
 * @access MANAGER, SENIOR_NURSE, NURSE, SENIOR_CARER, SECURITY
 */
router.post('/incidents',
  roleCheckMiddleware(['MANAGER', 'SENIOR_NURSE', 'NURSE', 'SENIOR_CARER', 'SECURITY']),
  validationMiddleware('createEmergencyIncident'),
  emergencyController.reportEmergencyIncident
);

/**
 * @route POST /api/v1/emergency/nurse-calls
 * @description Create nurse call with AI prioritization
 * @access NURSE, SENIOR_CARER, MANAGER, RESIDENT_FAMILY
 */
router.post('/nurse-calls',
  roleCheckMiddleware(['NURSE', 'SENIOR_CARER', 'MANAGER', 'RESIDENT_FAMILY']),
  validationMiddleware('createNurseCall'),
  emergencyController.createNurseCall
);

/**
 * @route GET /api/v1/emergency/dashboard
 * @description Get real-time emergency dashboard
 * @access MANAGER, SENIOR_NURSE, NURSE, ADMIN
 */
router.get('/dashboard',
  roleCheckMiddleware(['MANAGER', 'SENIOR_NURSE', 'NURSE', 'ADMIN']),
  emergencyController.getEmergencyDashboard
);

/**
 * @route GET /api/v1/emergency/on-call
 * @description Get on-call management status
 * @access MANAGER, SENIOR_NURSE, ADMIN
 */
router.get('/on-call',
  roleCheckMiddleware(['MANAGER', 'SENIOR_NURSE', 'ADMIN']),
  emergencyController.getOnCallManagement
);

/**
 * @route GET /api/v1/emergency/nurse-calls/analytics
 * @description Get nurse call system analytics
 * @access MANAGER, SENIOR_NURSE, ADMIN
 */
router.get('/nurse-calls/analytics',
  roleCheckMiddleware(['MANAGER', 'SENIOR_NURSE', 'ADMIN']),
  emergencyController.getNurseCallAnalytics
);

/**
 * @route GET /api/v1/emergency/staff-allocation
 * @description Get current staff allocation
 * @access MANAGER, SENIOR_NURSE, ADMIN
 */
router.get('/staff-allocation',
  roleCheckMiddleware(['MANAGER', 'SENIOR_NURSE', 'ADMIN']),
  emergencyController.getStaffAllocation
);

/**
 * @route PUT /api/v1/emergency/nurse-calls/:id/acknowledge
 * @description Acknowledge nurse call
 * @access NURSE, SENIOR_CARER, MANAGER, SENIOR_NURSE
 */
router.put('/nurse-calls/:id/acknowledge',
  roleCheckMiddleware(['NURSE', 'SENIOR_CARER', 'MANAGER', 'SENIOR_NURSE']),
  emergencyController.acknowledgeNurseCall
);

/**
 * @route PUT /api/v1/emergency/nurse-calls/:id/resolve
 * @description Resolve nurse call
 * @access NURSE, SENIOR_CARER, MANAGER, SENIOR_NURSE
 */
router.put('/nurse-calls/:id/resolve',
  roleCheckMiddleware(['NURSE', 'SENIOR_CARER', 'MANAGER', 'SENIOR_NURSE']),
  validationMiddleware('resolveNurseCall'),
  emergencyController.resolveNurseCall
);

/**
 * @route POST /api/v1/emergency/on-call/rota
 * @description Update on-call rota
 * @access MANAGER, ADMIN
 */
router.post('/on-call/rota',
  roleCheckMiddleware(['MANAGER', 'ADMIN']),
  validationMiddleware('updateOnCallRota'),
  emergencyController.updateOnCallRota
);

/**
 * @route GET /api/v1/emergency/nurse-calls/active
 * @description Get active nurse calls
 * @access NURSE, SENIOR_CARER, MANAGER, SENIOR_NURSE, ADMIN
 */
router.get('/nurse-calls/active',
  roleCheckMiddleware(['NURSE', 'SENIOR_CARER', 'MANAGER', 'SENIOR_NURSE', 'ADMIN']),
  emergencyController.getActiveNurseCalls
);

/**
 * @route GET /api/v1/emergency/incidents/recent
 * @description Get recent emergency incidents
 * @access MANAGER, SENIOR_NURSE, ADMIN, SENIOR_CARER
 */
router.get('/incidents/recent',
  roleCheckMiddleware(['MANAGER', 'SENIOR_NURSE', 'ADMIN', 'SENIOR_CARER']),
  emergencyController.getRecentIncidents
);

export default router;