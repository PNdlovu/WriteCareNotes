import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { InventoryManagementController } from '../controllers/inventory/InventoryManagementController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const inventoryController = new InventoryManagementController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Inventory Management
router.post('/items', authorize(['inventory_manager', 'admin']), inventoryController.createItem.bind(inventoryController));
router.post('/rfid/scan', authorize(['inventory_staff', 'admin']), inventoryController.scanRFID.bind(inventoryController));
router.get('/analytics', authorize(['inventory_manager', 'admin']), inventoryController.getAnalytics.bind(inventoryController));

export default router;