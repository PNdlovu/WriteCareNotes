import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { ZeroTrustController } from '../controllers/zero-trust/ZeroTrustController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const zeroTrustController = new ZeroTrustController();

router.use(authenticate);
router.use(auditMiddleware);

// Zero Trust & Multi-Tenant Services
router.post('/architecture/implement', authorize(['security_admin', 'admin']), zeroTrustController.implementZeroTrust.bind(zeroTrustController));
router.post('/tenancy/create', authorize(['system_admin', 'admin']), zeroTrustController.createMultiTenant.bind(zeroTrustController));
router.post('/certifications/manage', authorize(['compliance_officer', 'admin']), zeroTrustController.manageCertifications.bind(zeroTrustController));
router.post('/verification/continuous', authorize(['security_system', 'admin']), zeroTrustController.performContinuousVerification.bind(zeroTrustController));

export default router;