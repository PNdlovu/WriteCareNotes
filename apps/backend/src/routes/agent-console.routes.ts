import { Router } from 'express';
import { AgentConsoleController } from '../controllers/ai-agents/AgentConsoleController';
import { authenticateToken } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const agentConsoleController = new AgentConsoleController();

// Rate limiting for agent console endpoints
const agentConsoleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all routes
router.use(agentConsoleLimiter);
router.use(authenticateToken);

/**
 * @route GET /api/ai-agents/metrics
 * @desc Get agent metrics
 * @access Private (Admin, Manager)
 */
router.get('/metrics', 
  requireRole(['admin', 'manager']),
  (req, res) => agentConsoleController.getAgentMetrics(req, res)
);

/**
 * @route GET /api/ai-agents/performance
 * @desc Get agent performance data
 * @access Private (Admin, Manager)
 */
router.get('/performance',
  requireRole(['admin', 'manager']),
  (req, res) => agentConsoleController.getAgentPerformance(req, res)
);

/**
 * @route GET /api/ai-agents/configurations
 * @desc Get agent configurations
 * @access Private (Admin, Manager)
 */
router.get('/configurations',
  requireRole(['admin', 'manager']),
  (req, res) => agentConsoleController.getAgentConfigurations(req, res)
);

/**
 * @route GET /api/ai-agents/health
 * @desc Get system health
 * @access Private (Admin, Manager)
 */
router.get('/health',
  requireRole(['admin', 'manager']),
  (req, res) => agentConsoleController.getSystemHealth(req, res)
);

/**
 * @route POST /api/ai-agents/:agentId/toggle
 * @desc Toggle agent enabled/disabled
 * @access Private (Admin)
 */
router.post('/:agentId/toggle',
  requireRole(['admin']),
  (req, res) => agentConsoleController.toggleAgent(req, res)
);

/**
 * @route PUT /api/ai-agents/:agentId/configuration
 * @desc Update agent configuration
 * @access Private (Admin)
 */
router.put('/:agentId/configuration',
  requireRole(['admin']),
  (req, res) => agentConsoleController.updateAgentConfiguration(req, res)
);

/**
 * @route GET /api/ai-agents/:agentId/logs
 * @desc Get agent logs
 * @access Private (Admin, Manager)
 */
router.get('/:agentId/logs',
  requireRole(['admin', 'manager']),
  (req, res) => agentConsoleController.getAgentLogs(req, res)
);

export default router;