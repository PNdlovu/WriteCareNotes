import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { Enterprise5SMethodologyService } from '../services/methodology/Enterprise5SMethodologyService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const methodologyService = new Enterprise5SMethodologyService();

router.use(authenticate);
router.use(auditMiddleware);

// 5S Methodology Services
router.post('/5s/implement', authorize(['methodology_manager', 'admin']), async (req, res) => {
  try {
    const implementation = await methodologyService.implementAdvanced5SMethodology(req.body);
    res.status(201).json({ success: true, data: implementation });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

router.get('/5s/analytics', authorize(['methodology_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await methodologyService.getAdvanced5SAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

export default router;