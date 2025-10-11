import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { IncidentManagementService } from '../services/incident/IncidentManagementService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const incidentService = new IncidentManagementService();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Incident Management
router.post('/incidents', authorize(['staff', 'care_manager', 'admin']), async (req, res) => {
  try {
    const incident = await incidentService.createAdvancedIncidentReport(req.body);
    res.status(201).json({ success: true, data: incident });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/analytics', authorize(['quality_manager', 'care_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await incidentService.getIncidentAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;