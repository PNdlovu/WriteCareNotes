/**
 * ============================================================================
 * Safeguarding Module Exports
 * ============================================================================
 * 
 * @fileoverview Central export point for safeguarding domain components.
 * 
 * @module domains/safeguarding
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides a single import point for all safeguarding-related entities,
 * services, controllers, and routes. Simplifies imports across the
 * application and maintains clean module boundaries.
 * 
 * @example
 * // Import specific components
 * import { SafeguardingService, SafeguardingIncident } from '@/domains/safeguarding';
 * 
 * // Import routes for Express app
 * import safeguardingRoutes from '@/domains/safeguarding';
 * app.use('/api/v1/safeguarding', safeguardingRoutes);
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

// ========================================
// ENTITIES
// ========================================

export { 
  SafeguardingIncident,
  IncidentType,
  Severity,
  IncidentStatus
} from './entities/SafeguardingIncident';

export {
  SafeguardingConcern,
  ConcernType,
  ConcernSeverity,
  ConcernStatus
} from './entities/SafeguardingConcern';

export {
  ChildProtectionPlan,
  CPPCategory,
  CPPStatus
} from './entities/ChildProtectionPlan';

// ========================================
// SERVICES
// ========================================

export { SafeguardingService } from './services/SafeguardingService';

// ========================================
// CONTROLLERS
// ========================================

export { SafeguardingController } from './controllers/SafeguardingController';

// ========================================
// ROUTES
// ========================================

export { default as safeguardingRoutes } from './routes/safeguarding.routes';
