import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { TechnicalCommunicationService } from '../services/communication/TechnicalCommunicationService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const commService = new TechnicalCommunicationService();

router.use(authenticate);
router.use(auditMiddleware);

// Technical Communication Services
router.post('/messaging/implement', authorize(['communication_admin', 'admin']), async (req, res) => {
  try {
    const messaging = await commService.implementTechnicalMessaging(req.body);
    res.status(201).json({ success: true, data: messaging });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

export default router;