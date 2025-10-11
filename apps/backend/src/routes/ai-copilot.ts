import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { AdvancedAICopilotCareNotesService } from '../services/ai-copilot/AdvancedAICopilotCareNotesService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const copilotService = new AdvancedAICopilotCareNotesService();

router.use(authenticate);
router.use(auditMiddleware);

// AI Copilot Care Notes Services
router.post('/assistance', authorize(['care_staff', 'nurses', 'admin']), async (req, res) => {
  try {
    const assistance = await copilotService.provideAdvancedRealTimeAssistance(req.body);
    res.status(201).json({ success: true, data: assistance });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.post('/voice-to-text', authorize(['care_staff', 'nurses', 'admin']), async (req, res) => {
  try {
    const result = await copilotService.processAdvancedVoiceToText(req.body);
    res.json({ success: true, data: result });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/analytics', authorize(['care_managers', 'admin']), async (req, res) => {
  try {
    const analytics = await copilotService.getAdvancedAICopilotAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;