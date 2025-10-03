import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { CommunicationEngagementController } from '../controllers/communication/CommunicationEngagementController';
import { authenticate } from '../middleware/auth-middleware';
import { authorize } from '../middleware/rbac-middleware';
import { auditMiddleware } from '../middleware/audit-middleware';

const router = Router();
const commController = new CommunicationEngagementController();

router.use(authenticate);
router.use(auditMiddleware);

// Advanced Communication Channels
router.post('/channels', authorize(['admin', 'care_manager']), commController.createChannel.bind(commController));
router.post('/messages', authorize(['staff', 'family', 'healthcare_provider']), commController.sendMessage.bind(commController));

// Video Calling & Telemedicine
router.post('/video-calls', authorize(['staff', 'family', 'healthcare_provider']), commController.scheduleVideoCall.bind(commController));
router.post('/telemedicine', authorize(['healthcare_provider', 'nurse', 'admin']), commController.initiateTelemedicine.bind(commController));

// Social Engagement
router.post('/social-groups', authorize(['activities_coordinator', 'admin']), commController.createSocialGroup.bind(commController));

// Analytics
router.get('/analytics/family-engagement', authorize(['admin', 'care_manager']), commController.getFamilyEngagementAnalytics.bind(commController));

// Emergency Communications
router.post('/emergency/broadcast', authorize(['admin', 'emergency_coordinator']), commController.broadcastEmergencyAlert.bind(commController));

export default router;