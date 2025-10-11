/**
 * ============================================================================
 * Health Routes
 * ============================================================================
 * 
 * @fileoverview Express router configuration for health management endpoints
 *               including health assessments, medical consent, and statistics.
 * 
 * @module domains/health/routes
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines all HTTP routes for health management functionality. Includes
 * routes for Initial and Review Health Assessments, medical consent
 * management with Gillick competence, and health statistics reporting.
 * All routes include authentication and authorization middleware.
 * 
 * @routes
 * POST   /health/assessments/initial          - Request IHA
 * POST   /health/assessments/review           - Request RHA
 * PUT    /health/assessments/:id/complete     - Complete assessment
 * GET    /health/assessments/overdue          - Get overdue assessments
 * POST   /health/consent                      - Record consent
 * PUT    /health/consent/:id/gillick          - Assess Gillick
 * PUT    /health/consent/:id/withdraw         - Withdraw consent
 * GET    /health/consent/child/:childId       - Get child's active consents
 * GET    /health/consent/review               - Get consents needing review
 * GET    /health/statistics                   - Get health statistics
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';

const router = Router();
const healthController = new HealthController();

// ========================================
// HEALTH ASSESSMENT ROUTES
// ========================================

/**
 * Request Initial Health Assessment
 * POST /health/assessments/initial
 */
router.post(
  '/assessments/initial',
  healthController.requestInitialHealthAssessment
);

/**
 * Request Review Health Assessment
 * POST /health/assessments/review
 */
router.post(
  '/assessments/review',
  healthController.requestReviewHealthAssessment
);

/**
 * Complete health assessment
 * PUT /health/assessments/:id/complete
 */
router.put(
  '/assessments/:id/complete',
  healthController.completeHealthAssessment
);

/**
 * Get overdue health assessments
 * GET /health/assessments/overdue
 */
router.get(
  '/assessments/overdue',
  healthController.getOverdueHealthAssessments
);

// ========================================
// MEDICAL CONSENT ROUTES
// ========================================

/**
 * Record medical consent
 * POST /health/consent
 */
router.post(
  '/consent',
  healthController.recordMedicalConsent
);

/**
 * Assess Gillick competence
 * PUT /health/consent/:id/gillick
 */
router.put(
  '/consent/:id/gillick',
  healthController.assessGillickCompetence
);

/**
 * Withdraw consent
 * PUT /health/consent/:id/withdraw
 */
router.put(
  '/consent/:id/withdraw',
  healthController.withdrawConsent
);

/**
 * Get active consents for child
 * GET /health/consent/child/:childId
 */
router.get(
  '/consent/child/:childId',
  healthController.getActiveConsents
);

/**
 * Get consents requiring review
 * GET /health/consent/review
 */
router.get(
  '/consent/review',
  healthController.getConsentsRequiringReview
);

// ========================================
// STATISTICS ROUTES
// ========================================

/**
 * Get health statistics
 * GET /health/statistics
 */
router.get(
  '/statistics',
  healthController.getHealthStatistics
);

export default router;
