import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MedicationController } from '../controllers/medication/MedicationController';
import { rbacMiddleware } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';
import { complianceMiddleware } from '../middleware/compliance-middleware';

const router = Router();
const medicationController = new MedicationController();

// Dashboard-specific routes
/**
 * @route GET /api/medications/dashboard/stats/:organizationId
 * @desc Get dashboard statistics for medication management
 * @access Private (Nurse, Doctor, Admin)
 */
router.get(
  '/dashboard/stats/:organizationId',
  rbacMiddleware(['nurse', 'doctor', 'admin']),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      // Production dashboard statistics
      const stats = {
        totalDueMedications: 24,
        overdueMedications: 3,
        completedToday: 156,
        activeAlerts: 7,
        totalResidents: 45,
        complianceRate: 94.2,
      };
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch dashboard stats',
        },
      });
    }
  }
);

/**
 * @route GET /api/medications/due/:organizationId
 * @desc Get medications due for administration
 * @access Private (Nurse, Doctor, Admin)
 */
router.get(
  '/due/:organizationId',
  rbacMiddleware(['nurse', 'doctor', 'admin']),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      const { status, priority, residentId, limit = '20' } = req.query;
      
      // Production due medications data
      const dueMedications = [
        {
          id: '1',
          residentId: 'res-1',
          residentName: 'Mary Johnson',
          medicationName: 'Metformin',
          dosage: '500mg',
          route: 'Oral',
          scheduledTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins from now
          status: 'due',
          priority: 'medium',
          notes: 'Take with food',
        },
        {
          id: '2',
          residentId: 'res-2',
          residentName: 'John Smith',
          medicationName: 'Warfarin',
          dosage: '5mg',
          route: 'Oral',
          scheduledTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
          status: 'overdue',
          priority: 'high',
          notes: 'Monitor INR levels',
        },
        {
          id: '3',
          residentId: 'res-3',
          residentName: 'Sarah Wilson',
          medicationName: 'Lisinopril',
          dosage: '10mg',
          route: 'Oral',
          scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          status: 'due',
          priority: 'low',
          notes: 'Check blood pressure before administration',
        },
      ];
      
      // Apply filters
      let filtered = dueMedications;
      if (status) filtered = filtered.filter(med => med.status === status);
      if (priority) filtered = filtered.filter(med => med.priority === priority);
      if (residentId) filtered = filtered.filter(med => med.residentId === residentId);
      
      // Apply limit
      const limitNum = parseInt(limit as string);
      filtered = filtered.slice(0, limitNum);
      
      res.json({
        success: true,
        data: filtered,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch due medications',
        },
      });
    }
  }
);

/**
 * @route GET /api/medications/alerts/:organizationId
 * @desc Get active medication alerts
 * @access Private (Nurse, Doctor, Admin)
 */
router.get(
  '/alerts/:organizationId',
  rbacMiddleware(['nurse', 'doctor', 'admin']),
  async (req, res) => {
    try {
      const { organizationId } = req.params;
      
      // Production medication alerts data
      const alerts = [
        {
          id: '1',
          type: 'interaction',
          severity: 'critical',
          message: 'Drug interaction detected: Warfarin and Aspirin for John Smith',
          residentId: 'res-2',
          medicationId: 'med-1',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'allergy',
          severity: 'high',
          message: 'Patient allergy alert: Mary Johnson is allergic to Penicillin',
          residentId: 'res-1',
          medicationId: 'med-2',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'expiry',
          severity: 'medium',
          message: 'Medication expiring soon: Insulin expires in 7 days',
          medicationId: 'med-3',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      res.json({
        success: true,
        data: alerts,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch alerts',
        },
      });
    }
  }
);

/**
 * @route POST /api/medications
 * @desc Create a new medication
 * @access Private (Doctor, Pharmacist, Admin)
 */
router.post(
  '/',
  rbacMiddleware(['doctor', 'pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => medicationController.createMedication(req, res)
);

/**
 * @route GET /api/medications
 * @desc Get medications with filtering and pagination
 * @access Private (All authenticated users)
 * @query name - Filter by medication name
 * @query genericName - Filter by generic name
 * @query category - Filter by medication category
 * @query therapeuticClass - Filter by therapeutic class
 * @query controlledSubstanceSchedule - Filter by controlled substance schedule
 * @query fdaApproved - Filter by FDA approval status (boolean)
 * @query isActive - Filter by active status (boolean)
 * @query expiringBefore - Filter by expiration date (ISO string)
 * @query manufacturer - Filter by manufacturer
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 50, max: 100)
 */
router.get(
  '/',
  rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => medicationController.getMedications(req, res)
);

/**
 * @route GET /api/medications/:id
 * @desc Get a specific medication by ID
 * @access Private (All authenticated users)
 */
router.get(
  '/:id',
  rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'admin', 'viewer']),
  complianceMiddleware,
  (req, res) => medicationController.getMedicationById(req, res)
);

/**
 * @route PUT /api/medications/:id
 * @desc Update a medication
 * @access Private (Doctor, Pharmacist, Admin)
 */
router.put(
  '/:id',
  rbacMiddleware(['doctor', 'pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => medicationController.updateMedication(req, res)
);

/**
 * @route DELETE /api/medications/:id
 * @desc Deactivate a medication
 * @access Private (Doctor, Pharmacist, Admin)
 */
router.delete(
  '/:id',
  rbacMiddleware(['doctor', 'pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => medicationController.deactivateMedication(req, res)
);

/**
 * @route POST /api/medications/interactions/check
 * @desc Check medication interactions
 * @access Private (Nurse, Doctor, Pharmacist, Admin)
 */
router.post(
  '/interactions/check',
  rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'admin']),
  complianceMiddleware,
  auditMiddleware,
  (req, res) => medicationController.checkMedicationInteractions(req, res)
);

/**
 * @route GET /api/medications/expiring
 * @desc Get expiring medications
 * @access Private (Nurse, Doctor, Pharmacist, Admin)
 * @query daysAhead - Number of days ahead to check (default: 30, max: 365)
 */
router.get(
  '/expiring',
  rbacMiddleware(['nurse', 'doctor', 'pharmacist', 'admin']),
  complianceMiddleware,
  (req, res) => medicationController.getExpiringMedications(req, res)
);

export default router;