import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { NotificationController } from '../controllers/notifications/NotificationController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticate);
router.use(auditMiddleware);

// Enterprise Notification Services
router.post('/send', authorize(['admin', 'care_manager', 'nurse']), notificationController.sendNotification.bind(notificationController));
router.post('/campaigns', authorize(['admin', 'communication_manager']), notificationController.createCampaign.bind(notificationController));
router.get('/analytics', authorize(['admin', 'communication_manager']), notificationController.getAnalytics.bind(notificationController));

export default router;
