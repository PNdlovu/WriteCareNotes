/**
 * @fileoverview Audit Routes Configuration
 * @module Routes/Audit
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { AuditController, auditSearchValidation, complianceReportValidation, archiveValidation } from '../controllers/audit/AuditController';
import { AuditService } from '../services/audit/AuditService';
import { AuthService } from '../services/auth/AuthService';

export function createAuditRoutes(dataSource: DataSource): Router {
  const router = Router();
  const auditService = new AuditService(dataSource);
  const auditController = new AuditController(auditService);
  const authService = new AuthService(dataSource);

  // Authentication middleware (all routes require authentication)
  const authenticate = authService.authenticate.bind(authService);

  // Search and query routes
  router.get(
    '/search',
    authenticate,
    auditSearchValidation,
    auditController.search.bind(auditController)
  );

  router.get(
    '/:id',
    authenticate,
    auditController.getById.bind(auditController)
  );

  router.get(
    '/entity/:entityType/:entityId',
    authenticate,
    auditController.getEntityHistory.bind(auditController)
  );

  router.get(
    '/user/:userId',
    authenticate,
    auditController.getUserActivity.bind(auditController)
  );

  // Compliance and reporting routes
  router.get(
    '/high-risk/events',
    authenticate,
    auditController.getHighRiskEvents.bind(auditController)
  );

  router.get(
    '/failed/operations',
    authenticate,
    auditController.getFailedOperations.bind(auditController)
  );

  router.get(
    '/investigation/required',
    authenticate,
    auditController.getEventsRequiringInvestigation.bind(auditController)
  );

  router.get(
    '/compliance/report',
    authenticate,
    complianceReportValidation,
    auditController.getComplianceReport.bind(auditController)
  );

  router.get(
    '/statistics/overview',
    authenticate,
    auditController.getStatistics.bind(auditController)
  );

  // Maintenance routes
  router.delete(
    '/cleanup/expired',
    authenticate,
    auditController.deleteExpiredEvents.bind(auditController)
  );

  router.post(
    '/archive',
    authenticate,
    archiveValidation,
    auditController.archiveOldEvents.bind(auditController)
  );

  return router;
}

export default createAuditRoutes;
