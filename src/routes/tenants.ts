/**
 * @fileoverview Tenant Routes
 * @module Routes/Tenants
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Tenant management routes with authentication and validation
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import {
  TenantController,
  createTenantValidation,
  updateTenantValidation,
  tenantIdValidation,
} from '../controllers/tenant/TenantController';
import { authenticateJWT } from '../middleware/auth.middleware';
import { checkPermissions } from '../middleware/permissions.middleware';

export function createTenantRoutes(dataSource: DataSource): Router {
  const router = Router();
  const controller = new TenantController(dataSource);

  /**
   * @route   POST /tenants
   * @desc    Create new tenant
   * @access  Admin only
   */
  router.post(
    '/',
    authenticateJWT,
    checkPermissions(['admin:tenants:create']),
    createTenantValidation,
    controller.create
  );

  /**
   * @route   GET /tenants
   * @desc    Get all tenants
   * @access  Admin only
   * @query   includeInactive - Include inactive tenants (default: false)
   */
  router.get(
    '/',
    authenticateJWT,
    checkPermissions(['admin:tenants:read']),
    controller.getAll
  );

  /**
   * @route   GET /tenants/:id
   * @desc    Get tenant by ID
   * @access  Admin only
   */
  router.get(
    '/:id',
    authenticateJWT,
    checkPermissions(['admin:tenants:read']),
    tenantIdValidation,
    controller.getById
  );

  /**
   * @route   GET /tenants/subdomain/:subdomain
   * @desc    Get tenant by subdomain
   * @access  Public (for tenant resolution)
   */
  router.get(
    '/subdomain/:subdomain',
    controller.getBySubdomain
  );

  /**
   * @route   PUT /tenants/:id
   * @desc    Update tenant
   * @access  Admin only
   */
  router.put(
    '/:id',
    authenticateJWT,
    checkPermissions(['admin:tenants:update']),
    tenantIdValidation,
    updateTenantValidation,
    controller.update
  );

  /**
   * @route   DELETE /tenants/:id
   * @desc    Soft delete tenant
   * @access  Admin only
   */
  router.delete(
    '/:id',
    authenticateJWT,
    checkPermissions(['admin:tenants:delete']),
    tenantIdValidation,
    controller.delete
  );

  /**
   * @route   GET /tenants/:id/statistics
   * @desc    Get tenant statistics
   * @access  Admin only
   */
  router.get(
    '/:id/statistics',
    authenticateJWT,
    checkPermissions(['admin:tenants:read']),
    tenantIdValidation,
    controller.getStatistics
  );

  return router;
}
