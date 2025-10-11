import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { FacilitiesController } from '../controllers/facilities/FacilitiesController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const facilitiesController = new FacilitiesController();

router.use(authenticate);
router.use(auditMiddleware);

// Facilities Management Services
router.post('/assets', authorize(['facilities_manager', 'admin']), facilitiesController.createAsset.bind(facilitiesController));
router.get('/analytics', authorize(['facilities_manager', 'admin']), facilitiesController.getAnalytics.bind(facilitiesController));

export default router;
