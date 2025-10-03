import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { TransportLogisticsController } from '../controllers/transport/TransportLogisticsController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { validateRequest } from '../middleware/validation-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const transportController = new TransportLogisticsController();

// Apply middleware to all routes
router.use(authenticate);
router.use(auditMiddleware);

// Vehicle Fleet Management Routes
router.post('/vehicles',
  authorize(['transport_manager', 'admin']),
  validateRequest({
    body: {
      vehicleType: { type: 'string', required: true },
      specifications: { type: 'object', required: true },
      insurance: { type: 'object', required: true },
      purchaseDate: { type: 'string', required: true },
      purchasePrice: { type: 'number', required: true }
    }
  }),
  transportController.addVehicle.bind(transportController)
);

router.get('/vehicles',
  authorize(['transport_coordinator', 'transport_manager', 'admin']),
  transportController.getAllVehicles.bind(transportController)
);

router.get('/vehicles/available',
  authorize(['transport_coordinator', 'transport_manager', 'care_staff', 'admin']),
  transportController.getAvailableVehicles.bind(transportController)
);

router.get('/vehicles/type/:vehicleType',
  authorize(['transport_coordinator', 'transport_manager', 'admin']),
  transportController.getVehiclesByType.bind(transportController)
);

// Transport Request Management Routes
router.post('/requests',
  authorize(['care_staff', 'transport_coordinator', 'care_manager', 'admin']),
  validateRequest({
    body: {
      residentId: { type: 'string', required: true },
      requestType: { type: 'string', required: true },
      destination: { type: 'string', required: true },
      requestedBy: { type: 'string', required: true },
      specialRequirements: { type: 'array', required: true },
      priority: { type: 'string', required: true }
    }
  }),
  transportController.createTransportRequest.bind(transportController)
);

router.get('/requests',
  authorize(['transport_coordinator', 'transport_manager', 'care_manager', 'admin']),
  transportController.getAllTransportRequests.bind(transportController)
);

router.post('/requests/:requestId/approve',
  authorize(['transport_manager', 'care_manager', 'admin']),
  validateRequest({
    body: {
      approvedBy: { type: 'string', required: true }
    }
  }),
  transportController.approveTransportRequest.bind(transportController)
);

// Emergency Transport Routes
router.post('/emergency',
  authorize(['care_staff', 'nurses', 'care_manager', 'admin']),
  validateRequest({
    body: {
      residentId: { type: 'string', required: true },
      destination: { type: 'string', required: false },
      requestedBy: { type: 'string', required: true },
      wheelchairRequired: { type: 'boolean', required: false }
    }
  }),
  transportController.requestEmergencyTransport.bind(transportController)
);

// Journey Management Routes
router.post('/vehicles/:vehicleId/journeys/start',
  authorize(['driver', 'transport_coordinator', 'admin']),
  validateRequest({
    body: {
      destination: { type: 'string', required: true },
      purpose: { type: 'string', required: true },
      driverId: { type: 'string', required: true },
      passengers: { type: 'array', required: true }
    }
  }),
  transportController.startJourney.bind(transportController)
);

router.post('/vehicles/:vehicleId/journeys/:journeyId/complete',
  authorize(['driver', 'transport_coordinator', 'admin']),
  validateRequest({
    body: {
      endMileage: { type: 'number', required: true },
      driverId: { type: 'string', required: true }
    }
  }),
  transportController.completeJourney.bind(transportController)
);

// Route Optimization Routes
router.get('/routes/optimize',
  authorize(['transport_coordinator', 'transport_manager', 'admin']),
  transportController.optimizeRoutes.bind(transportController)
);

// Analytics Routes
router.get('/analytics/fleet',
  authorize(['transport_manager', 'admin']),
  transportController.getFleetAnalytics.bind(transportController)
);

router.get('/alerts/maintenance',
  authorize(['transport_coordinator', 'transport_manager', 'maintenance_team', 'admin']),
  transportController.getMaintenanceAlerts.bind(transportController)
);

// Vehicle Maintenance Routes
router.post('/vehicles/:vehicleId/maintenance/schedule',
  authorize(['transport_manager', 'maintenance_team', 'admin']),
  validateRequest({
    body: {
      maintenanceType: { type: 'string', required: true },
      scheduledDate: { type: 'string', required: true }
    }
  }),
  transportController.scheduleVehicleMaintenance.bind(transportController)
);

router.post('/vehicles/:vehicleId/maintenance/complete',
  authorize(['maintenance_team', 'transport_manager', 'admin']),
  validateRequest({
    body: {
      type: { type: 'string', required: true },
      description: { type: 'string', required: true },
      cost: { type: 'number', required: true },
      performedBy: { type: 'string', required: true }
    }
  }),
  transportController.completeVehicleMaintenance.bind(transportController)
);

export default router;