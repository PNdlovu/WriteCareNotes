import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { SeededDataController } from '../controllers/seeding/SeededDataController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';

const router = Router();
const seededDataController = new SeededDataController();

// Apply middleware to all routes
router.use(authenticate);

// Seeded Data Management Routes (Admin only)
router.post('/seed',
  authorize(['admin', 'system_admin']),
  seededDataController.seedAllData.bind(seededDataController)
);

router.delete('/clear',
  authorize(['admin', 'system_admin']),
  seededDataController.clearAllData.bind(seededDataController)
);

router.get('/summary',
  authorize(['admin', 'system_admin', 'care_manager']),
  seededDataController.getSeededDataSummary.bind(seededDataController)
);

export default router;
