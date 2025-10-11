import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { AssessmentController } from '../controllers/assessment/AssessmentController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const assessmentController = new AssessmentController();

router.use(authenticate);
router.use(auditMiddleware);

// Assessment Services
router.post('/assessments', authorize(['nurse', 'doctor', 'care_assessor', 'admin']), assessmentController.createAssessment.bind(assessmentController));
router.get('/analytics', authorize(['care_manager', 'admin']), assessmentController.getAnalytics.bind(assessmentController));

export default router;
