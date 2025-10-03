import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { VisitorManagementService } from '../services/visitor/VisitorManagementService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const visitorService = new VisitorManagementService();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Visitor Management Services
router.post('/visitors/register', authorize(['reception', 'security', 'admin']), async (req, res) => {
  try {
    const visitor = await visitorService.registerAdvancedVisitor(req.body);
    res.status(201).json({ success: true, data: visitor });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

router.get('/analytics', authorize(['security_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await visitorService.getVisitorAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" });
  }
});

export default router;