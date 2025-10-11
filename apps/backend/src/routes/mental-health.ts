import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MentalHealthController } from '../controllers/mental-health/MentalHealthController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const mentalHealthController = new MentalHealthController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Mental Health Services
router.post('/assessments', authorize(['mental_health_nurse', 'psychiatrist', 'admin']), mentalHealthController.createAssessment.bind(mentalHealthController));
router.post('/crisis-detection', authorize(['care_staff', 'mental_health_nurse', 'admin']), mentalHealthController.performCrisisDetection.bind(mentalHealthController));
router.post('/therapeutic-programs', authorize(['mental_health_nurse', 'psychiatrist', 'admin']), mentalHealthController.createTherapeuticProgram.bind(mentalHealthController));
router.get('/analytics', authorize(['mental_health_nurse', 'care_manager', 'admin']), mentalHealthController.getMentalHealthAnalytics.bind(mentalHealthController));
router.post('/crisis-intervention', authorize(['mental_health_nurse', 'care_manager', 'admin']), mentalHealthController.manageCrisisIntervention.bind(mentalHealthController));

export default router;