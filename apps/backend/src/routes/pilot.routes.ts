import { Router } from 'express';
import { PilotController } from '../controllers/pilot/pilot.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { adminMiddleware } from '../middleware/admin.middleware';
import { validatePilotRegistration, validatePilotFeedback } from '../middleware/validation.middleware';

const router = Router();
const pilotController = new PilotController();

// Public routes (for pilot registration)
router.post('/register', validatePilotRegistration, pilotController.registerPilot.bind(pilotController));

// Protected routes (require authentication)
router.use(authMiddleware);

// Pilot status and metrics
router.get('/status/:tenantId', pilotController.getPilotStatus.bind(pilotController));
router.get('/metrics', pilotController.getPilotMetrics.bind(pilotController));
router.post('/feedback', validatePilotFeedback, pilotController.submitFeedback.bind(pilotController));

// Admin-only routes
router.use(adminMiddleware);

router.get('/list', pilotController.getAllPilots.bind(pilotController));
router.put('/:tenantId/status', pilotController.updatePilotStatus.bind(pilotController));

export default router;