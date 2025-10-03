import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { PainManagementController } from '../controllers/pain/PainManagementController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const painController = new PainManagementController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Pain Management
router.post('/assessments', authorize(['nurse', 'doctor', 'pain_specialist', 'admin']), painController.createAssessment.bind(painController));
router.get('/assessments/:assessmentId/3d-visualization', authorize(['healthcare_provider', 'admin']), painController.generate3DVisualization.bind(painController));
router.get('/analytics', authorize(['pain_specialist', 'care_manager', 'admin']), painController.getPainAnalytics.bind(painController));

export default router;