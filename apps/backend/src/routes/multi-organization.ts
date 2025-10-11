import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MultiOrganizationController } from '../controllers/multi-org/MultiOrganizationController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const orgController = new MultiOrganizationController();

router.use(authenticate);
router.use(auditMiddleware);

router.post('/organizations', authorize(['system_admin', 'admin']), orgController.createOrganization.bind(orgController));
router.get('/analytics', authorize(['system_admin', 'admin']), orgController.getAnalytics.bind(orgController));

export default router;