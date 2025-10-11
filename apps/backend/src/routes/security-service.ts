import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { DigitalSecurityService } from '../services/security/DigitalSecurityService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const securityService = new DigitalSecurityService();

router.use(authenticate);
router.use(auditMiddleware);

// Digital Security Services
router.post('/framework/implement', authorize(['security_admin', 'admin']), async (req, res) => {
  try {
    const framework = await securityService.implementDigitalSecurityFramework(req.body);
    res.status(201).json({ success: true, data: framework });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

export default router;