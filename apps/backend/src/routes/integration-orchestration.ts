import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { IntegrationOrchestrationController } from '../controllers/integration-orchestration/IntegrationOrchestrationController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const orchestrationController = new IntegrationOrchestrationController();

router.use(authenticate);
router.use(auditMiddleware);

// Integration Orchestration Services
router.post('/workflows', authorize(['integration_admin', 'admin']), orchestrationController.createWorkflow.bind(orchestrationController));
router.get('/analytics', authorize(['integration_admin', 'admin']), orchestrationController.getAnalytics.bind(orchestrationController));

export default router;