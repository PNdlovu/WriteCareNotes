import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { AdvancedAnalyticsController } from '../controllers/analytics/AdvancedAnalyticsController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const analyticsController = new AdvancedAnalyticsController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Analytics & BI
router.post('/datasets', authorize(['data_analyst', 'admin']), analyticsController.createDataset.bind(analyticsController));
router.get('/dashboards/executive', authorize(['senior_management', 'admin']), analyticsController.getExecutiveDashboard.bind(analyticsController));
router.post('/predictive/:analysisType', authorize(['data_analyst', 'care_manager', 'admin']), analyticsController.performPredictiveAnalysis.bind(analyticsController));

export default router;