import { Router } from 'express';
import { EnhancedVoiceAssistantController } from '../controllers/voice-assistant/EnhancedVoiceAssistantController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const voiceAssistantController = new EnhancedVoiceAssistantController();

// Rate limiting for voice assistant endpoints
const voiceAssistantLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: 'Too many voice requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all routes
router.use(voiceAssistantLimiter);
router.use(authenticateToken);

/**
 * @route POST /api/voice-assistant/hands-free
 * @desc Process hands-free voice command
 * @access Private (All roles)
 */
router.post('/hands-free',
  (req, res) => voiceAssistantController.processHandsFreeCommand(req, res)
);

/**
 * @route POST /api/voice-assistant/medication-log
 * @desc Log medication using voice
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/medication-log',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => voiceAssistantController.logMedicationByVoice(req, res)
);

/**
 * @route POST /api/voice-assistant/care-plan-update
 * @desc Update care plan using voice
 * @access Private (Nurse, Manager, Admin)
 */
router.post('/care-plan-update',
  requireRole(['nurse', 'manager', 'admin']),
  (req, res) => voiceAssistantController.updateCarePlanByVoice(req, res)
);

/**
 * @route POST /api/voice-assistant/emergency-protocol
 * @desc Activate emergency protocol using voice
 * @access Private (All roles)
 */
router.post('/emergency-protocol',
  (req, res) => voiceAssistantController.activateEmergencyProtocol(req, res)
);

/**
 * @route POST /api/voice-assistant/resident-query
 * @desc Query resident information using voice
 * @access Private (All roles)
 */
router.post('/resident-query',
  (req, res) => voiceAssistantController.queryResidentInfo(req, res)
);

/**
 * @route GET /api/voice-assistant/settings
 * @desc Get voice settings
 * @access Private (All roles)
 */
router.get('/settings',
  (req, res) => voiceAssistantController.getVoiceSettings(req, res)
);

/**
 * @route PUT /api/voice-assistant/settings
 * @desc Update voice settings
 * @access Private (All roles)
 */
router.put('/settings',
  (req, res) => voiceAssistantController.updateVoiceSettings(req, res)
);

/**
 * @route GET /api/voice-assistant/history
 * @desc Get voice command history
 * @access Private (All roles)
 */
router.get('/history',
  (req, res) => voiceAssistantController.getVoiceCommandHistory(req, res)
);

/**
 * @route GET /api/voice-assistant/analytics
 * @desc Get voice analytics
 * @access Private (Manager, Admin)
 */
router.get('/analytics',
  requireRole(['manager', 'admin']),
  (req, res) => voiceAssistantController.getVoiceAnalytics(req, res)
);

/**
 * @route POST /api/voice-assistant/test-recognition
 * @desc Test voice recognition
 * @access Private (All roles)
 */
router.post('/test-recognition',
  (req, res) => voiceAssistantController.testVoiceRecognition(req, res)
);

export default router;