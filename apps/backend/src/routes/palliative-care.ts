import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { PalliativeCareService } from '../services/palliative/PalliativeCareService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const palliativeService = new PalliativeCareService();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Palliative Care Services
router.post('/care-plans', authorize(['palliative_specialist', 'doctor', 'admin']), async (req, res) => {
  try {
    const carePlan = await palliativeService.createAdvancedPalliativeCare(req.body);
    res.status(201).json({ success: true, data: carePlan });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

router.get('/analytics', authorize(['palliative_specialist', 'care_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await palliativeService.getPalliativeAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

export default router;