import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { KnowledgeBaseService } from '../services/knowledge-base/KnowledgeBaseService';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const knowledgeService = new KnowledgeBaseService();

router.use(authenticate);
router.use(auditMiddleware);

router.post('/articles', authorize(['content_manager', 'admin']), async (req, res) => {
  try {
    const article = await knowledgeService.createArticle(req.body);
    res.status(201).json({ success: true, data: article });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get('/analytics', authorize(['content_manager', 'admin']), async (req, res) => {
  try {
    const analytics = await knowledgeService.getKnowledgeAnalytics();
    res.json({ success: true, data: analytics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
  }
});

export default router;
