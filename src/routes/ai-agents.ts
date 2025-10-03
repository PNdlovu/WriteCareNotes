import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview AI Agents Routes
 * @module AIAgentsRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-14
 * 
 * @description Routes for both public and tenant AI agents with appropriate security measures
 */

import { Router } from 'express';
import { PublicAIAgentController } from '../controllers/ai-agents/PublicAIAgentController';
import { TenantAIAgentController } from '../controllers/ai-agents/TenantAIAgentController';
import {
  aiAgentSecurityMiddleware,
  publicAIRateLimit,
  tenantAIRateLimit,
  sanitizeTenantAIInput,
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction
} from '../middleware/ai-agent-security-middleware';
import { tenantIsolationMiddleware } from '../middleware/tenant-isolation-middleware';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();
const publicAIController = new PublicAIAgentController();
const tenantAIController = new TenantAIAgentController();

// =============================================================================
// PUBLIC AI AGENT ROUTES (No authentication required)
// =============================================================================

/**
 * Public customer support AI agent
 */
router.post('/public/inquiry',
  publicAIRateLimit,
  aiAgentSecurityMiddleware('PUBLIC'),
  auditAIInteraction,
  async (req, res) => await publicAIController.handleCustomerInquiry(req, res)
);

/**
 * Get public knowledge base summary
 */
router.get('/public/knowledge-base',
  publicAIRateLimit,
  aiAgentSecurityMiddleware('PUBLIC'),
  async (req, res) => await publicAIController.getKnowledgeBaseSummary(req, res)
);

/**
 * Public AI agent health check
 */
router.get('/public/health',
  async (req, res) => await publicAIController.healthCheck(req, res)
);

// =============================================================================
// TENANT AI AGENT ROUTES (Authentication and tenant isolation required)
// =============================================================================

/**
 * Tenant care assistant AI agent
 */
router.post('/tenant/care-inquiry',
  tenantAIRateLimit,
  authMiddleware,
  tenantIsolationMiddleware(),
  aiAgentSecurityMiddleware('TENANT'),
  sanitizeTenantAIInput,
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction,
  async (req, res) => await tenantAIController.handleTenantCareInquiry(req, res)
);

/**
 * Get care recommendations for specific resident
 */
router.get('/tenant/care-recommendations/:residentId',
  tenantAIRateLimit,
  authMiddleware,
  tenantIsolationMiddleware(),
  aiAgentSecurityMiddleware('TENANT'),
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction,
  async (req, res) => await tenantAIController.getCareRecommendations(req, res)
);

/**
 * Get compliance alerts for tenant
 */
router.get('/tenant/compliance-alerts',
  tenantAIRateLimit,
  authMiddleware,
  tenantIsolationMiddleware(),
  aiAgentSecurityMiddleware('TENANT'),
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction,
  async (req, res) => await tenantAIController.getComplianceAlerts(req, res)
);

/**
 * Get documentation assistance
 */
router.post('/tenant/documentation-assistance',
  tenantAIRateLimit,
  authMiddleware,
  tenantIsolationMiddleware(),
  aiAgentSecurityMiddleware('TENANT'),
  sanitizeTenantAIInput,
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction,
  async (req, res) => await tenantAIController.getDocumentationAssistance(req, res)
);

/**
 * Emergency care assistance
 */
router.post('/tenant/emergency',
  tenantAIRateLimit,
  authMiddleware,
  tenantIsolationMiddleware(),
  aiAgentSecurityMiddleware('TENANT'),
  sanitizeTenantAIInput,
  validateTenantAIIsolation,
  encryptAIResponse,
  auditAIInteraction,
  async (req, res) => await tenantAIController.handleEmergencyInquiry(req, res)
);

/**
 * Tenant AI agent health check
 */
router.get('/tenant/health',
  authMiddleware,
  tenantIsolationMiddleware(),
  async (req, res) => await tenantAIController.healthCheck(req, res)
);

export default router;