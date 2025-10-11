import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Resident Management Routes for WriteCareNotes
 * @module ResidentRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description RESTful API routes for resident management with healthcare
 * compliance, GDPR protection, and comprehensive care management.
 * 
 * @compliance
 * - GDPR Article 6 (Lawfulness of processing)
 * - NHS Digital Data Security Standards
 * - CQC Fundamental Standards
 * - Care Certificate Standards
 */

import { Router } from 'express';
import { ResidentController } from '@/controllers/resident/ResidentController';
import { requirePermission, Permission } from '@/middleware/auth-middleware';
import { residentDataRateLimit } from '@/middleware/rate-limit-middleware';

const router = Router();
const residentController = new ResidentController();

// Apply rate limiting to all resident routes
router.use(residentDataRateLimit);

/**
 * GET /residents
 * List all residents with pagination and filtering
 */
router.get('/', 
  requirePermission(Permission.RESIDENT_READ),
  residentController.searchResidents.bind(residentController)
);

/**
 * POST /residents
 * Create a new resident
 */
router.post('/',
  requirePermission(Permission.RESIDENT_CREATE),
  residentController.createResident.bind(residentController)
);

/**
 * GET /residents/statistics/:organizationId
 * Get resident statistics for an organization
 */
router.get('/statistics/:organizationId',
  requirePermission(Permission.RESIDENT_READ),
  residentController.getResidentStatistics.bind(residentController)
);

/**
 * GET /residents/:id
 * Get a specific resident by ID
 */
router.get('/:id',
  requirePermission(Permission.RESIDENT_READ),
  residentController.getResidentById.bind(residentController)
);

/**
 * PUT /residents/:id
 * Update a resident
 */
router.put('/:id',
  requirePermission(Permission.RESIDENT_UPDATE),
  residentController.updateResident.bind(residentController)
);

/**
 * PUT /residents/:id/discharge
 * Discharge a resident
 */
router.put('/:id/discharge',
  requirePermission(Permission.RESIDENT_DISCHARGE),
  residentController.dischargeResident.bind(residentController)
);

export { router as residentRouter };
export default router;
