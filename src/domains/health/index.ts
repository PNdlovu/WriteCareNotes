/**
 * ============================================================================
 * Health Module Index
 * ============================================================================
 * 
 * @fileoverview Central export point for health management module.
 * 
 * @module domains/health
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Exports all health management components including entities, services,
 * controllers, and routes. Provides a clean interface for importing health
 * functionality throughout the application.
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

// Entities
export { HealthAssessment, AssessmentType, AssessmentStatus } from './entities/HealthAssessment';
export { MedicalConsent, ConsentType, ConsentStatus, ConsentGivenBy } from './entities/MedicalConsent';

// Services
export { HealthService } from './services/HealthService';

// Controllers
export { HealthController } from './controllers/HealthController';

// Routes
export { default as healthRoutes } from './routes/health.routes';
