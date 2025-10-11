import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MaintenanceFacilitiesController } from '../controllers/maintenance/MaintenanceFacilitiesController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const maintenanceController = new MaintenanceFacilitiesController();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);

// Asset Management Routes
router.post('/assets',
  authorize(['facilities_manager', 'admin']),
  validateRequest({
    body: {
      assetName: { type: 'string', required: true },
      assetType: { type: 'string', required: true },
      location: { type: 'string', required: true },
      department: { type: 'string', required: true },
      specifications: { type: 'object', required: true },
      purchasePrice: { type: 'number', required: true },
      purchaseDate: { type: 'string', required: true }
    }
  }),
  maintenanceController.createAsset.bind(maintenanceController)
);

router.get('/assets',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  maintenanceController.getAllAssets.bind(maintenanceController)
);

router.get('/assets/type/:assetType',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  maintenanceController.getAssetsByType.bind(maintenanceController)
);

router.get('/assets/location/:location',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  maintenanceController.getAssetsByLocation.bind(maintenanceController)
);

// Work Order Management Routes
router.post('/work-orders',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  validateRequest({
    body: {
      assetId: { type: 'string', required: true },
      title: { type: 'string', required: true },
      description: { type: 'string', required: true },
      maintenanceType: { type: 'string', required: true },
      priority: { type: 'string', required: true },
      assignedTo: { type: 'string', required: true },
      requestedBy: { type: 'string', required: true },
      scheduledDate: { type: 'string', required: true }
    }
  }),
  maintenanceController.createWorkOrder.bind(maintenanceController)
);

router.get('/work-orders',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  maintenanceController.getAllWorkOrders.bind(maintenanceController)
);

router.post('/work-orders/:workOrderId/complete',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  validateRequest({
    body: {
      actualCost: { type: 'number', required: true },
      laborHours: { type: 'number', required: true },
      notes: { type: 'string', required: true }
    }
  }),
  maintenanceController.completeWorkOrder.bind(maintenanceController)
);

// Preventive Maintenance Routes
router.post('/preventive-maintenance/schedule',
  authorize(['facilities_manager', 'admin']),
  maintenanceController.schedulePreventiveMaintenance.bind(maintenanceController)
);

// Analytics Routes
router.get('/analytics/maintenance',
  authorize(['facilities_manager', 'admin']),
  maintenanceController.getMaintenanceAnalytics.bind(maintenanceController)
);

router.get('/calendar/maintenance',
  authorize(['maintenance_team', 'facilities_manager', 'admin']),
  maintenanceController.getMaintenanceCalendar.bind(maintenanceController)
);

// Emergency Management Routes
router.post('/emergency/report',
  authorize(['care_staff', 'maintenance_team', 'facilities_manager', 'admin']),
  validateRequest({
    body: {
      assetId: { type: 'string', required: true },
      title: { type: 'string', required: true },
      description: { type: 'string', required: true },
      reportedBy: { type: 'string', required: true },
      location: { type: 'string', required: true }
    }
  }),
  maintenanceController.reportEmergencyIssue.bind(maintenanceController)
);

// Compliance Routes
router.get('/compliance/status',
  authorize(['facilities_manager', 'compliance_officer', 'admin']),
  maintenanceController.getComplianceStatus.bind(maintenanceController)
);

export default router;