import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { MobileSelfServiceController } from '../controllers/mobile/MobileSelfServiceController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const mobileController = new MobileSelfServiceController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Mobile Services
router.post('/sessions', authorize(['staff', 'family', 'admin']), mobileController.createSession.bind(mobileController));
router.post('/sessions/:sessionId/sync', authorize(['staff', 'family', 'admin']), mobileController.performSync.bind(mobileController));
router.post('/sessions/:sessionId/assistance', authorize(['staff', 'admin']), mobileController.getContextualAssistance.bind(mobileController));
router.post('/sessions/:sessionId/biometric-auth', authorize(['staff', 'admin']), mobileController.performBiometricAuth.bind(mobileController));
router.get('/analytics', authorize(['admin', 'it_manager']), mobileController.getMobileAnalytics.bind(mobileController));
router.post('/pwa/deploy', authorize(['admin', 'it_manager']), mobileController.deployPWA.bind(mobileController));

export default router;