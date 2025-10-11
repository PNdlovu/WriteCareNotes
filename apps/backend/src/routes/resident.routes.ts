/**
 * @fileoverview Resident Routes - API Route Configuration
 * @module Routes/Resident
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Production-ready route configuration for resident management
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { ResidentService } from '../services/resident/ResidentService';
import {
  ResidentController,
  createResidentValidation,
  updateResidentValidation,
  updateStatusValidation,
  getByIdValidation,
  deleteValidation,
  searchValidation,
} from '../controllers/resident/ResidentController';
import { JWTAuthenticationService } from '../services/auth/JWTAuthenticationService';
import { tenantIsolationMiddleware } from '../middleware/tenant-isolation.middleware';

/**
 * Create resident routes with dependency injection
 * @param dataSource - TypeORM DataSource
 * @returns Express Router
 */
export function createResidentRoutes(dataSource: DataSource): Router {
  const router = Router();

  // Initialize services
  const residentService = new ResidentService(dataSource);
  const authService = new JWTAuthenticationService(dataSource);
  const residentController = new ResidentController(residentService);

  // Apply authentication and tenant isolation to all routes
  router.use(authService.authenticate.bind(authService));
  router.use(tenantIsolationMiddleware());

  /**
   * GET /residents/count/active
   * Get active resident count
   * @auth Required
   * @returns { count: number }
   */
  router.get(
    '/count/active',
    residentController.getActiveCount.bind(residentController)
  );

  /**
   * GET /residents/count
   * Get total resident count
   * @auth Required
   * @returns { count: number }
   */
  router.get(
    '/count',
    residentController.getCount.bind(residentController)
  );

  /**
   * GET /residents
   * Search residents with filters and pagination
   * @auth Required
   * @query {string} status - Filter by status (ACTIVE, ON_LEAVE, DISCHARGED, DECEASED, TRANSFERRED)
   * @query {string} admissionType - Filter by admission type (PERMANENT, RESPITE, DAY_CARE, TEMPORARY)
   * @query {string} searchTerm - Search by name
   * @query {string} roomNumber - Filter by room number
   * @query {number} page - Page number (default: 1)
   * @query {number} limit - Items per page (default: 20, max: 100)
   * @query {string} sortBy - Sort field (default: createdAt)
   * @query {string} sortOrder - Sort order (ASC/DESC, default: DESC)
   * @returns {ResidentSearchResult} Paginated search results
   */
  router.get(
    '/',
    searchValidation,
    residentController.search.bind(residentController)
  );

  /**
   * GET /residents/:id
   * Get resident by ID
   * @auth Required
   * @param {string} id - Resident UUID
   * @returns {Resident} Resident details
   */
  router.get(
    '/:id',
    getByIdValidation,
    residentController.getById.bind(residentController)
  );

  /**
   * POST /residents
   * Create a new resident
   * @auth Required
   * @body {CreateResidentDto} Resident creation data
   * @returns {Resident} Created resident
   */
  router.post(
    '/',
    createResidentValidation,
    residentController.create.bind(residentController)
  );

  /**
   * PUT /residents/:id
   * Update resident details
   * @auth Required
   * @param {string} id - Resident UUID
   * @body {UpdateResidentDto} Update data
   * @returns {Resident} Updated resident
   */
  router.put(
    '/:id',
    updateResidentValidation,
    residentController.update.bind(residentController)
  );

  /**
   * PUT /residents/:id/status
   * Update resident status
   * @auth Required
   * @param {string} id - Resident UUID
   * @body {status: ResidentStatus} New status
   * @returns {Resident} Updated resident
   */
  router.put(
    '/:id/status',
    updateStatusValidation,
    residentController.updateStatus.bind(residentController)
  );

  /**
   * POST /residents/:id/restore
   * Restore soft-deleted resident
   * @auth Required
   * @param {string} id - Resident UUID
   * @returns {Resident} Restored resident
   */
  router.post(
    '/:id/restore',
    getByIdValidation,
    residentController.restore.bind(residentController)
  );

  /**
   * DELETE /residents/:id
   * Soft delete a resident
   * @auth Required
   * @param {string} id - Resident UUID
   * @returns {message: string} Success message
   */
  router.delete(
    '/:id',
    deleteValidation,
    residentController.delete.bind(residentController)
  );

  return router;
}

export default createResidentRoutes;
