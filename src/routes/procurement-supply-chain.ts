import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { ProcurementSupplyChainController } from '../controllers/procurement/ProcurementSupplyChainController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const procurementController = new ProcurementSupplyChainController();

router.use(authenticate);
router.use(auditMiddleware);

// AI-Driven Procurement
router.post('/purchase-requests', authorize(['procurement', 'department_manager', 'admin']), procurementController.createPurchaseRequest.bind(procurementController));
router.post('/suppliers', authorize(['procurement_manager', 'admin']), procurementController.registerSupplier.bind(procurementController));

// Advanced Analytics
router.get('/analytics/demand-forecast', authorize(['procurement', 'finance', 'admin']), procurementController.getDemandForecast.bind(procurementController));
router.get('/analytics/supply-chain', authorize(['procurement_manager', 'admin']), procurementController.getSupplyChainAnalytics.bind(procurementController));
router.get('/analytics/risk-analysis', authorize(['procurement_manager', 'admin']), procurementController.performRiskAnalysis.bind(procurementController));

// Supplier Management
router.get('/suppliers/:supplierId/evaluation', authorize(['procurement', 'admin']), procurementController.performSupplierEvaluation.bind(procurementController));
router.get('/contracts/optimization', authorize(['procurement_manager', 'admin']), procurementController.optimizeContracts.bind(procurementController));

export default router;