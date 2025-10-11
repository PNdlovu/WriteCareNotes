import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { EnhancedBedRoomManagementService } from '../services/enhanced-bed-room/EnhancedBedRoomManagementService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const bedRoomService = new EnhancedBedRoomManagementService();

router.use(authenticate);
router.use(auditMiddleware);

// Enhanced Bed Room Management Services
router.post('/rooms', authorize(['facilities_manager', 'admin']), async (req, res) => {
  try {
    const room = await bedRoomService.createEnhancedRoom(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/analytics', authorize(['facilities_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await bedRoomService.getRoomAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;