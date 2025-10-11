import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { AIAutomationController } from '../controllers/ai-automation/AIAutomationController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const aiController = new AIAutomationController();

router.use(authenticate);
router.use(auditMiddleware);

// AI Automation & Copilot Services
router.post('/summaries/generate', authorize(['care_staff', 'nurses', 'admin']), aiController.generateSummary.bind(aiController));
router.post('/copilot/assistance', authorize(['care_staff', 'nurses', 'admin']), aiController.provideCopilotAssistance.bind(aiController));
router.post('/voice-to-text', authorize(['care_staff', 'nurses', 'admin']), aiController.processVoiceToText.bind(aiController));
router.post('/clinical-decision-support', authorize(['nurses', 'doctors', 'admin']), aiController.provideClinicalDecisionSupport.bind(aiController));
router.post('/automation/execute', authorize(['care_managers', 'admin']), aiController.executeAutomation.bind(aiController));
router.get('/insights/dashboard', authorize(['care_managers', 'admin']), aiController.getAIInsights.bind(aiController));

export default router;
