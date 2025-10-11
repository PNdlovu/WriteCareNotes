import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Safeguarding Routes
 * @module SafeguardingRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Enterprise safeguarding management routes with comprehensive
 * security, validation, and audit trail integration.
 */

import { Router } from 'express';
import { SafeguardingController } from '../controllers/safeguarding/SafeguardingController';
import { authMiddleware } from '../middleware/auth-middleware';
import { roleCheckMiddleware } from '../middleware/role-check-middleware';
import { tenantMiddleware } from '../middleware/tenant-middleware';
import { validationMiddleware } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';

const router = Router();
const safeguardingController = new SafeguardingController();

// Apply middleware stack
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(auditMiddleware);
router.use(rateLimitMiddleware);

/**
 * @route POST /api/v1/safeguarding/alerts
 * @description Create new safeguarding alert
 * @access SAFEGUARDING_LEAD, MANAGER, SENIOR_CARER, NURSE
 */
router.post('/alerts', 
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'SENIOR_CARER', 'NURSE']),
  validationMiddleware('createSafeguardingAlert'),
  safeguardingController.createSafeguardingAlert
);

/**
 * @route GET /api/v1/safeguarding/alerts
 * @description Get safeguarding alerts with filtering
 * @access SAFEGUARDING_LEAD, MANAGER, SENIOR_CARER, NURSE, ADMIN
 */
router.get('/alerts',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'SENIOR_CARER', 'NURSE', 'ADMIN']),
  safeguardingController.getSafeguardingAlerts
);

/**
 * @route GET /api/v1/safeguarding/alerts/:id
 * @description Get specific safeguarding alert
 * @access SAFEGUARDING_LEAD, MANAGER, SENIOR_CARER, NURSE, ADMIN
 */
router.get('/alerts/:id',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'SENIOR_CARER', 'NURSE', 'ADMIN']),
  safeguardingController.getSafeguardingAlert
);

/**
 * @route PUT /api/v1/safeguarding/alerts/:id
 * @description Update safeguarding alert
 * @access SAFEGUARDING_LEAD, MANAGER, INVESTIGATOR
 */
router.put('/alerts/:id',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'INVESTIGATOR']),
  validationMiddleware('updateSafeguardingAlert'),
  safeguardingController.updateSafeguardingAlert
);

/**
 * @route GET /api/v1/safeguarding/dashboard
 * @description Get safeguarding dashboard
 * @access SAFEGUARDING_LEAD, MANAGER, ADMIN
 */
router.get('/dashboard',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'ADMIN']),
  safeguardingController.getSafeguardingDashboard
);

/**
 * @route POST /api/v1/safeguarding/risk-detection/:residentId
 * @description Detect safeguarding risks for resident
 * @access SAFEGUARDING_LEAD, MANAGER, SENIOR_CARER, NURSE
 */
router.post('/risk-detection/:residentId',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'SENIOR_CARER', 'NURSE']),
  safeguardingController.detectSafeguardingRisks
);

/**
 * @route POST /api/v1/safeguarding/alerts/:id/reports
 * @description Generate safeguarding report
 * @access SAFEGUARDING_LEAD, MANAGER
 */
router.post('/alerts/:id/reports',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER']),
  validationMiddleware('generateSafeguardingReport'),
  safeguardingController.generateSafeguardingReport
);

/**
 * @route POST /api/v1/safeguarding/monitoring/automated
 * @description Perform automated safeguarding monitoring
 * @access SYSTEM, SAFEGUARDING_LEAD, MANAGER
 */
router.post('/monitoring/automated',
  roleCheckMiddleware(['SYSTEM', 'SAFEGUARDING_LEAD', 'MANAGER']),
  safeguardingController.performAutomatedMonitoring
);

/**
 * @route GET /api/v1/safeguarding/analytics
 * @description Get safeguarding analytics
 * @access SAFEGUARDING_LEAD, MANAGER, ADMIN
 */
router.get('/analytics',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER', 'ADMIN']),
  safeguardingController.getSafeguardingAnalytics
);

/**
 * @route POST /api/v1/safeguarding/alerts/:id/escalate
 * @description Escalate safeguarding alert
 * @access SAFEGUARDING_LEAD, MANAGER
 */
router.post('/alerts/:id/escalate',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'MANAGER']),
  validationMiddleware('escalateSafeguardingAlert'),
  safeguardingController.escalateSafeguardingAlert
);

/**
 * @route GET /api/v1/safeguarding/compliance/report
 * @description Generate safeguarding compliance report
 * @access SAFEGUARDING_LEAD, COMPLIANCE_OFFICER, MANAGER
 */
router.get('/compliance/report',
  roleCheckMiddleware(['SAFEGUARDING_LEAD', 'COMPLIANCE_OFFICER', 'MANAGER']),
  safeguardingController.generateComplianceReport
);

export default router;
