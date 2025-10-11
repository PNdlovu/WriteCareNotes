import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { IntegrationService } from '../services/integration/IntegrationService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const integrationService = new IntegrationService();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Integration Services
router.post('/integrations', authorize(['admin', 'it_manager']), async (req, res) => {
  try {
    const integration = await integrationService.createAdvancedIntegration(req.body);
    res.status(201).json({ success: true, data: integration });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

router.get('/health', authorize(['admin', 'it_manager']), async (req, res) => {
  try {
    const health = await integrationService.getIntegrationHealth();
    res.json({ success: true, data: health });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

export default router;