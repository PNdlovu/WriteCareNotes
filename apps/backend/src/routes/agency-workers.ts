import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { AgencyWorkerService } from '../services/agency/AgencyWorkerService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const agencyService = new AgencyWorkerService();

router.use(authenticate);
router.use(auditMiddleware);

router.post('/workers', authorize(['hr_manager', 'admin']), async (req, res) => {
  try {
    const worker = await agencyService.createAgencyWorker(req.body);
    res.status(201).json({ success: true, data: worker });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/analytics', authorize(['hr_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await agencyService.getAgencyAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
