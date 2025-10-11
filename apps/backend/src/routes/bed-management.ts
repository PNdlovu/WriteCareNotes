import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { BedManagementController } from '../controllers/bed/BedManagementController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const bedController = new BedManagementController();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);

// Bed Management Routes
router.get('/beds', 
  authorize(['bed_manager', 'care_manager', 'admin']),
  bedController.getAllBeds.bind(bedController)
);

router.get('/beds/available',
  authorize(['bed_manager', 'care_manager', 'admin', 'admissions']),
  bedController.getAvailableBeds.bind(bedController)
);

router.get('/beds/:bedId',
  authorize(['bed_manager', 'care_manager', 'admin']),
  bedController.getBedById.bind(bedController)
);

router.post('/beds/:bedId/allocate',
  authorize(['bed_manager', 'care_manager', 'admin']),
  validateRequest({
    body: {
      residentId: { type: 'string', required: true }
    }
  }),
  bedController.allocateBed.bind(bedController)
);

router.post('/beds/:bedId/deallocate',
  authorize(['bed_manager', 'care_manager', 'admin']),
  validateRequest({
    body: {
      reason: { type: 'string', required: true }
    }
  }),
  bedController.deallocateBed.bind(bedController)
);

// Waiting List Management Routes
router.post('/waiting-list',
  authorize(['admissions', 'bed_manager', 'care_manager', 'admin']),
  validateRequest({
    body: {
      prospectiveResidentName: { type: 'string', required: true },
      dateOfBirth: { type: 'string', required: true }, // ISO date string
      nhsNumber: { type: 'string', required: true },
      contactDetails: { type: 'array', required: true },
      fundingSource: { type: 'string', required: true },
      medicalRequirements: { type: 'object', required: true },
      roomPreferences: { type: 'object', required: true }
    }
  }),
  bedController.addToWaitingList.bind(bedController)
);

router.get('/waiting-list',
  authorize(['admissions', 'bed_manager', 'care_manager', 'admin']),
  bedController.getWaitingList.bind(bedController)
);

router.get('/waiting-list/matches',
  authorize(['admissions', 'bed_manager', 'care_manager', 'admin']),
  bedController.matchBedToWaitingList.bind(bedController)
);

// Analytics Routes
router.get('/analytics/occupancy',
  authorize(['bed_manager', 'care_manager', 'admin', 'finance']),
  bedController.getOccupancyAnalytics.bind(bedController)
);

router.get('/analytics/revenue-optimization',
  authorize(['bed_manager', 'finance', 'admin']),
  bedController.getRevenueOptimization.bind(bedController)
);

router.get('/analytics/capacity-forecast',
  authorize(['bed_manager', 'care_manager', 'admin', 'finance']),
  bedController.getCapacityForecast.bind(bedController)
);

// Maintenance Routes
router.post('/beds/:bedId/maintenance/schedule',
  authorize(['bed_manager', 'maintenance', 'admin']),
  validateRequest({
    body: {
      maintenanceType: { type: 'string', required: true },
      scheduledDate: { type: 'string', required: true } // ISO date string
    }
  }),
  bedController.scheduleMaintenance.bind(bedController)
);

router.post('/beds/:bedId/maintenance/complete',
  authorize(['maintenance', 'bed_manager', 'admin']),
  validateRequest({
    body: {
      maintenanceNotes: { type: 'string', required: true }
    }
  }),
  bedController.completeMaintenance.bind(bedController)
);

router.post('/beds/:bedId/clean',
  authorize(['housekeeping', 'bed_manager', 'admin']),
  bedController.markBedAsClean.bind(bedController)
);

// Rate Management Routes
router.put('/beds/:bedId/rate',
  authorize(['finance', 'bed_manager', 'admin']),
  validateRequest({
    body: {
      newRate: { type: 'number', required: true },
      reason: { type: 'string', required: true }
    }
  }),
  bedController.updateBedRate.bind(bedController)
);

export default router;
