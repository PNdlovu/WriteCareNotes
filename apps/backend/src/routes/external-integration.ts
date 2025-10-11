import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { ExternalIntegrationController } from '../controllers/external-integration/ExternalIntegrationController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const integrationController = new ExternalIntegrationController();

router.use(authenticate);
router.use(auditMiddleware);

// External Integration Services
router.post('/systems', authorize(['integration_admin', 'admin']), integrationController.createSystem.bind(integrationController));
router.get('/analytics', authorize(['integration_admin', 'admin']), integrationController.getAnalytics.bind(integrationController));

export default router;