import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { RiskAssessmentService } from '../services/risk-assessment/RiskAssessmentService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const riskService = new RiskAssessmentService();

router.use(authenticate);
router.use(auditMiddleware);

router.post('/assessments', authorize(['risk_manager', 'admin']), async (req, res) => {
  try {
    const assessment = await riskService.createRiskAssessment(req.body);
    res.status(201).json({ success: true, data: assessment });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/analytics', authorize(['risk_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await riskService.getRiskAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;