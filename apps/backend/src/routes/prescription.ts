import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { PrescriptionController } from '../controllers/medication/PrescriptionController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const prescriptionController = new PrescriptionController();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);

// Prescription Management Routes
router.post('/prescriptions',
  authorize(['doctor', 'prescriber', 'admin']),
  validateRequest({
    body: {
      residentId: { type: 'string', required: true },
      medicationName: { type: 'string', required: true },
      dosage: { type: 'string', required: true },
      frequency: { type: 'string', required: true },
      prescribedBy: { type: 'string', required: true }
    }
  }),
  async (req, res) => {
    try {
      await prescriptionController.createPrescription(req, res);
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to create prescription',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

router.get('/prescriptions',
  authorize(['doctor', 'nurse', 'pharmacist', 'admin']),
  async (req, res) => {
    try {
      await prescriptionController.getAllPrescriptions(req, res);
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve prescriptions',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

router.get('/prescriptions/:prescriptionId',
  authorize(['doctor', 'nurse', 'pharmacist', 'admin']),
  async (req, res) => {
    try {
      await prescriptionController.getPrescriptionById(req, res);
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve prescription',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

router.put('/prescriptions/:prescriptionId',
  authorize(['doctor', 'prescriber', 'admin']),
  async (req, res) => {
    try {
      await prescriptionController.updatePrescription(req, res);
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to update prescription',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

router.post('/prescriptions/:prescriptionId/dispense',
  authorize(['pharmacist', 'nurse', 'admin']),
  async (req, res) => {
    try {
      await prescriptionController.dispensePrescription(req, res);
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        message: 'Failed to dispense prescription',
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

export default router;