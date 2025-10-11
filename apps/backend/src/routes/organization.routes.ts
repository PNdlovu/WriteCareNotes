/**
 * @fileoverview Organization Routes
 * @module Routes/Organization
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 */

import { Router, Request, Response } from 'express';
import { DataSource } from 'typeorm';
import {
  OrganizationController,
  createOrganizationValidation,
  updateOrganizationValidation,
  organizationIdValidation,
} from '../controllers/organization/OrganizationController';
import { JWTAuthenticationService } from '../services/auth/JWTAuthenticationService';
import { tenantIsolationMiddleware } from '../middleware/tenant-isolation.middleware';

export function createOrganizationRoutes(dataSource: DataSource): Router {
  const router = Router();
  const authService = new JWTAuthenticationService();
  const controller = new OrganizationController(dataSource);

  // All routes require authentication and tenant isolation
  router.use(authService.authenticate);
  router.use(tenantIsolationMiddleware);

  /**
   * @route POST /organizations
   * @desc Create new organization
   * @access Private (Authenticated + Tenant)
   */
  router.post('/', createOrganizationValidation, controller.create);

  /**
   * @route GET /organizations
   * @desc Get all organizations (tenant-scoped)
   * @access Private (Authenticated + Tenant)
   */
  router.get('/', controller.getAll);

  /**
   * @route GET /organizations/:id
   * @desc Get organization by ID
   * @access Private (Authenticated + Tenant)
   */
  router.get('/:id', organizationIdValidation, controller.getById);

  /**
   * @route PUT /organizations/:id
   * @desc Update organization
   * @access Private (Authenticated + Tenant)
   */
  router.put('/:id', updateOrganizationValidation, controller.update);

  /**
   * @route DELETE /organizations/:id
   * @desc Soft delete organization
   * @access Private (Authenticated + Tenant)
   */
  router.delete('/:id', organizationIdValidation, controller.delete);

  /**
   * @route PUT /organizations/:id/settings
   * @desc Update organization settings
   * @access Private (Authenticated + Tenant)
   */
  router.put('/:id/settings', organizationIdValidation, controller.updateSettings);

  /**
   * @route PUT /organizations/:id/compliance
   * @desc Update compliance status
   * @access Private (Authenticated + Tenant)
   */
  router.put('/:id/compliance', organizationIdValidation, controller.updateComplianceStatus);

  return router;
}
