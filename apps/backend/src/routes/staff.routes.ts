/**
 * @fileoverview Staff Routes Configuration
 * @module Routes/Staff
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * 
 * @description
 * Express routes for staff management endpoints with authentication and tenant isolation.
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { StaffController, createStaffValidation, updateStaffValidation, updateStatusValidation, updateDBSValidation, updateRegistrationValidation, updateCertificationsValidation } from '../controllers/staff/StaffController';
import { StaffService } from '../services/staff/StaffService';
import { AuthService } from '../services/auth/AuthService';
import { tenantIsolationMiddleware } from '../middleware/tenant-isolation.middleware';

export function createStaffRoutes(dataSource: DataSource): Router {
  const router = Router();
  const staffService = new StaffService(dataSource);
  const staffController = new StaffController(staffService);
  const authService = new AuthService(dataSource);

  // Authentication middleware (all routes require authentication)
  const authenticate = authService.authenticate.bind(authService);

  // Base CRUD routes
  router.post(
    '/',
    authenticate,
    tenantIsolationMiddleware,
    createStaffValidation,
    staffController.create.bind(staffController)
  );

  router.get(
    '/',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getAll.bind(staffController)
  );

  router.get(
    '/:id',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getById.bind(staffController)
  );

  router.put(
    '/:id',
    authenticate,
    tenantIsolationMiddleware,
    updateStaffValidation,
    staffController.update.bind(staffController)
  );

  router.delete(
    '/:id',
    authenticate,
    tenantIsolationMiddleware,
    staffController.delete.bind(staffController)
  );

  router.post(
    '/:id/restore',
    authenticate,
    tenantIsolationMiddleware,
    staffController.restore.bind(staffController)
  );

  // Status management
  router.put(
    '/:id/status',
    authenticate,
    tenantIsolationMiddleware,
    updateStatusValidation,
    staffController.updateStatus.bind(staffController)
  );

  // Compliance routes
  router.put(
    '/:id/certifications',
    authenticate,
    tenantIsolationMiddleware,
    updateCertificationsValidation,
    staffController.updateCertifications.bind(staffController)
  );

  router.put(
    '/:id/dbs',
    authenticate,
    tenantIsolationMiddleware,
    updateDBSValidation,
    staffController.updateDBS.bind(staffController)
  );

  router.put(
    '/:id/registration',
    authenticate,
    tenantIsolationMiddleware,
    updateRegistrationValidation,
    staffController.updateRegistration.bind(staffController)
  );

  router.put(
    '/:id/availability',
    authenticate,
    tenantIsolationMiddleware,
    staffController.updateAvailability.bind(staffController)
  );

  // Compliance reporting routes
  router.get(
    '/compliance/expiring-certifications',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getExpiringCertifications.bind(staffController)
  );

  router.get(
    '/compliance/expiring-dbs',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getExpiringDBS.bind(staffController)
  );

  router.get(
    '/compliance/invalid-dbs',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getInvalidDBS.bind(staffController)
  );

  // Statistics routes
  router.get(
    '/statistics/overview',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getStatistics.bind(staffController)
  );

  router.get(
    '/count/active',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getActiveCount.bind(staffController)
  );

  // Role-based filtering
  router.get(
    '/by-role/:role',
    authenticate,
    tenantIsolationMiddleware,
    staffController.getByRole.bind(staffController)
  );

  return router;
}

export default createStaffRoutes;
