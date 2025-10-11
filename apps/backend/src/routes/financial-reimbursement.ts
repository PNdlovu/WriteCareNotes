import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { FinancialReimbursementController } from '../controllers/financial-reimbursement/FinancialReimbursementController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const reimbursementController = new FinancialReimbursementController();

router.use(authenticate);
router.use(auditMiddleware);

// Financial Reimbursement Services
router.post('/claims', authorize(['finance_manager', 'admin']), reimbursementController.createClaim.bind(reimbursementController));
router.post('/claims/:claimId/submit', authorize(['finance_manager', 'admin']), reimbursementController.submitClaim.bind(reimbursementController));
router.get('/analytics', authorize(['finance_manager', 'admin']), reimbursementController.getAnalytics.bind(reimbursementController));

export default router;
