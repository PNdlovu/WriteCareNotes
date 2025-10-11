import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { BusinessIntelligenceController } from '../controllers/business-intelligence/BusinessIntelligenceController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const biController = new BusinessIntelligenceController();

router.use(authenticate);
router.use(auditMiddleware);

// Enterprise Business Intelligence
router.post('/data-warehouse', authorize(['data_analyst', 'admin']), biController.createDataWarehouse.bind(biController));
router.post('/ml-models/deploy', authorize(['data_scientist', 'admin']), biController.deployMLModel.bind(biController));
router.get('/dashboards/executive', authorize(['senior_management', 'admin']), biController.getExecutiveDashboard.bind(biController));
router.post('/predictive-models/deploy', authorize(['data_scientist', 'admin']), biController.deployPredictiveModels.bind(biController));
router.post('/real-time/process', authorize(['system', 'data_analyst', 'admin']), biController.processRealTimeBI.bind(biController));
router.post('/queries/advanced', authorize(['data_analyst', 'care_manager', 'admin']), biController.executeAdvancedQuery.bind(biController));

export default router;
