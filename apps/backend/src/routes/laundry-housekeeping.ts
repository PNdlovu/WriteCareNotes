import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { LaundryHousekeepingController } from '../controllers/laundry/LaundryHousekeepingController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const laundryController = new LaundryHousekeepingController();

router.use(authenticate);
router.use(auditMiddleware);

// Laundry Management
router.post('/items', authorize(['laundry_staff', 'care_staff', 'admin']), laundryController.createLaundryItem.bind(laundryController));
router.post('/batch/process', authorize(['laundry_staff', 'admin']), laundryController.processLaundryBatch.bind(laundryController));
router.put('/items/:itemId/quality-control', authorize(['laundry_staff', 'quality_inspector', 'admin']), laundryController.performQualityControl.bind(laundryController));

// Housekeeping Management
router.post('/housekeeping/schedule', authorize(['housekeeping_manager', 'admin']), laundryController.scheduleHousekeeping.bind(laundryController));

// Analytics and Reporting
router.get('/analytics', authorize(['laundry_manager', 'housekeeping_manager', 'admin']), laundryController.getLaundryAnalytics.bind(laundryController));

export default router;
