/**
 * @fileoverview Medication Routes - REST API Routing
 * @module Routes/Medication
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * 
 * @description
 * Production-ready routing for medication management with eMAR functionality
 */

import { Router } from 'express';
import { DataSource } from 'typeorm';
import { MedicationManagementService } from '../services/medication/MedicationManagementService';
import { SimpleMedicationController, createMedicationValidation, updateMedicationValidation, administerMedicationValidation } from '../controllers/medication/SimpleMedicationController';
import { authenticateToken } from '../middleware/auth-middleware';
import { tenantIsolation } from '../middleware/tenant-isolation.middleware';
import { param } from 'express-validator';

/**
 * Medication Routes Factory
 */
export function createMedicationRoutes(dataSource: DataSource): Router {
  const router = Router();
  const medicationService = new MedicationManagementService(dataSource);
  const controller = new SimpleMedicationController(medicationService);

  // Apply authentication to all routes
  router.use(authenticateToken);
  router.use(tenantIsolation);

  /**
   * @route   POST /api/medications
   * @desc    Create new medication prescription
   * @access  Private
   */
  router.post(
    '/',
    createMedicationValidation,
    controller.create.bind(controller)
  );

  /**
   * @route   GET /api/medications/statistics
   * @desc    Get medication statistics
   * @access  Private
   * @note    Must be before /:id route
   */
  router.get(
    '/statistics',
    controller.getStatistics.bind(controller)
  );

  /**
   * @route   GET /api/medications/search
   * @desc    Search medications by name
   * @access  Private
   */
  router.get(
    '/search',
    controller.searchByName.bind(controller)
  );

  /**
   * @route   GET /api/medications/due
   * @desc    Get due medications
   * @access  Private
   */
  router.get(
    '/due',
    controller.getDueMedications.bind(controller)
  );

  /**
   * @route   GET /api/medications/overdue
   * @desc    Get overdue medications
   * @access  Private
   */
  router.get(
    '/overdue',
    controller.getOverdueMedications.bind(controller)
  );

  /**
   * @route   GET /api/medications/resident/:residentId/schedule
   * @desc    Get medication schedule for resident
   * @access  Private
   */
  router.get(
    '/resident/:residentId/schedule',
    [param('residentId').isUUID()],
    controller.getScheduleForResident.bind(controller)
  );

  /**
   * @route   GET /api/medications/resident/:residentId/history
   * @desc    Get medication history for resident
   * @access  Private
   */
  router.get(
    '/resident/:residentId/history',
    [param('residentId').isUUID()],
    controller.getHistoryForResident.bind(controller)
  );

  /**
   * @route   GET /api/medications/resident/:residentId/active
   * @desc    Get active medications for resident
   * @access  Private
   */
  router.get(
    '/resident/:residentId/active',
    [param('residentId').isUUID()],
    controller.getActiveForResident.bind(controller)
  );

  /**
   * @route   GET /api/medications/:id
   * @desc    Get medication by ID
   * @access  Private
   */
  router.get(
    '/:id',
    [param('id').isUUID()],
    controller.getById.bind(controller)
  );

  /**
   * @route   GET /api/medications
   * @desc    Get all medications with filters
   * @access  Private
   */
  router.get(
    '/',
    controller.getAll.bind(controller)
  );

  /**
   * @route   PUT /api/medications/:id
   * @desc    Update medication prescription
   * @access  Private
   */
  router.put(
    '/:id',
    updateMedicationValidation,
    controller.update.bind(controller)
  );

  /**
   * @route   DELETE /api/medications/:id
   * @desc    Delete medication record (soft delete)
   * @access  Private
   */
  router.delete(
    '/:id',
    [param('id').isUUID()],
    controller.delete.bind(controller)
  );

  /**
   * @route   POST /api/medications/:id/administer
   * @desc    Record medication administration (eMAR)
   * @access  Private
   */
  router.post(
    '/:id/administer',
    administerMedicationValidation,
    controller.administer.bind(controller)
  );

  /**
   * @route   POST /api/medications/:id/restore
   * @desc    Restore deleted medication
   * @access  Private
   */
  router.post(
    '/:id/restore',
    [param('id').isUUID()],
    controller.restore.bind(controller)
  );

  return router;
}

export default createMedicationRoutes;
