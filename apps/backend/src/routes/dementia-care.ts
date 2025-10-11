import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { DementiaCareController } from '../controllers/dementia/DementiaCareController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const dementiaCareController = new DementiaCareController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Dementia Care Services
router.post('/care-plans', authorize(['dementia_specialist', 'care_manager', 'admin']), dementiaCareController.createCarePlan.bind(dementiaCareController));
router.get('/residents/:residentId/cognitive-prediction', authorize(['dementia_specialist', 'admin']), dementiaCareController.predictCognitiveDecline.bind(dementiaCareController));
router.post('/wandering-prevention', authorize(['dementia_specialist', 'admin']), dementiaCareController.implementWanderingPrevention.bind(dementiaCareController));
router.get('/analytics', authorize(['dementia_specialist', 'care_manager', 'admin']), dementiaCareController.getDementiaAnalytics.bind(dementiaCareController));
router.post('/cognitive-programs', authorize(['dementia_specialist', 'activities_coordinator', 'admin']), dementiaCareController.createCognitiveProgram.bind(dementiaCareController));

export default router;
