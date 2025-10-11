import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { RehabilitationController } from '../controllers/rehabilitation/RehabilitationController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const rehabilitationController = new RehabilitationController();

router.use(authenticate);
router.use(auditMiddleware);

// Rehabilitation Services
router.post('/plans', authorize(['physiotherapist', 'occupational_therapist', 'doctor', 'admin']), rehabilitationController.createRehabilitationPlan.bind(rehabilitationController));
router.get('/analytics', authorize(['rehabilitation_manager', 'admin']), rehabilitationController.getRehabilitationAnalytics.bind(rehabilitationController));

export default router;
