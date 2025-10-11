import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MiddlewareApplier } from '../middleware/applyMiddleware';
import { ValidationMiddleware } from '../middleware/validationMiddleware';
import { ErrorHandler } from '../utils/errorHandler';
import { MedicationController } from '../controllers/medication/MedicationController';

const router = Router();

// Apply medication-specific middleware stack
MiddlewareApplier.applyMedicationStack(router);

// Initialize controller
const medicationController = new MedicationController();

// Validation schemas
const medicationSchema = ValidationMiddleware.healthcareSchemas.medication;
const paginationSchema = ValidationMiddleware.schemas.pagination;

/**
 * Get all medications with pagination and filtering
 */
router.get('/', 
  ValidationMiddleware.validateQuery(paginationSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.getMedications(req, res);
  })
);

/**
 * Get medication by ID
 */
router.get('/:id',
  ValidationMiddleware.validateParams(ValidationMiddleware.schemas.uuid),
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.getMedicationById(req, res);
  })
);

/**
 * Create new medication
 */
router.post('/',
  ValidationMiddleware.validateBody(medicationSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.createMedication(req, res);
  })
);

/**
 * Update medication
 */
router.put('/:id',
  ValidationMiddleware.validateParams(ValidationMiddleware.schemas.uuid),
  ValidationMiddleware.validateBody(medicationSchema),
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.updateMedication(req, res);
  })
);

/**
 * Deactivate medication
 */
router.delete('/:id',
  ValidationMiddleware.validateParams(ValidationMiddleware.schemas.uuid),
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.deactivateMedication(req, res);
  })
);

/**
 * Check medication interactions
 */
router.post('/interactions/check',
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.checkMedicationInteractions(req, res);
  })
);

/**
 * Get expiring medications
 */
router.get('/expiring/soon',
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.getExpiringMedications(req, res);
  })
);

/**
 * Search medications
 */
router.get('/search/:term',
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.searchMedications(req, res);
  })
);

/**
 * Get medication statistics
 */
router.get('/statistics/overview',
  ErrorHandler.asyncHandler(async (req, res) => {
    await medicationController.getMedicationStatistics(req, res);
  })
);

export default router;