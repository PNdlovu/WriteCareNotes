import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { RegulatoryPortalController } from '../controllers/regulatory/RegulatoryPortalController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const regulatoryController = new RegulatoryPortalController();

router.use(authenticate);
router.use(auditMiddleware);

// Regulatory Portal Integration Services
router.post('/integrations', authorize(['compliance_officer', 'admin']), regulatoryController.establishIntegration.bind(regulatoryController));
router.post('/evidence-collection', authorize(['compliance_officer', 'admin']), regulatoryController.implementEvidenceCollection.bind(regulatoryController));
router.post('/inspection-preparation', authorize(['compliance_officer', 'care_manager', 'admin']), regulatoryController.prepareInspection.bind(regulatoryController));
router.get('/analytics', authorize(['compliance_officer', 'care_manager', 'admin']), regulatoryController.getRegulatoryAnalytics.bind(regulatoryController));

export default router;
