import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { SecurityAccessControlController } from '../controllers/security/SecurityAccessControlController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const securityController = new SecurityAccessControlController();

router.use(authenticate);
router.use(auditMiddleware);

// Biometric Authentication
router.post('/biometric/authenticate', authorize(['security_admin', 'system']), securityController.performBiometricAuth.bind(securityController));

// Access Control Management
router.post('/access/grant', authorize(['security_admin', 'admin']), securityController.grantAccess.bind(securityController));

// Advanced Security Analytics
router.get('/threats/detect', authorize(['security_admin', 'admin']), securityController.detectThreats.bind(securityController));
router.get('/metrics/comprehensive', authorize(['security_admin', 'admin']), securityController.getSecurityMetrics.bind(securityController));
router.get('/assessment/cybersecurity', authorize(['security_admin', 'admin']), securityController.performCybersecurityAssessment.bind(securityController));

// Surveillance Integration
router.post('/surveillance/integrate', authorize(['security_admin', 'admin']), securityController.integrateSurveillance.bind(securityController));

export default router;
