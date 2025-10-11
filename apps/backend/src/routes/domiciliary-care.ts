import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { DomiciliaryCareService } from '../services/domiciliary/DomiciliaryCareService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const domiciliaryService = new DomiciliaryCareService();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Domiciliary Care Services
router.post('/clients', authorize(['care_coordinator', 'admin']), async (req, res) => {
  try {
    const client = await domiciliaryService.createAdvancedDomiciliaryClient(req.body);
    res.status(201).json({ success: true, data: client });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.post('/routes/optimize', authorize(['care_coordinator', 'admin']), async (req, res) => {
  try {
    const optimization = await domiciliaryService.optimizeAdvancedRoutes(req.body);
    res.json({ success: true, data: optimization });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.post('/safety/implement', authorize(['care_coordinator', 'admin']), async (req, res) => {
  try {
    const safety = await domiciliaryService.implementAdvancedLoneWorkerSafety(req.body);
    res.status(201).json({ success: true, data: safety });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/quality-assurance', authorize(['quality_manager', 'admin']), async (req, res) => {
  try {
    const qa = await domiciliaryService.performAdvancedQualityAssurance();
    res.json({ success: true, data: qa });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
