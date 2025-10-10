/**
 * ============================================================================
 * Leaving Care Module Exports
 * ============================================================================
 * 
 * @fileoverview Central export point for leaving care domain module.
 * 
 * @module domains/leavingcare
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides consolidated exports for all leaving care functionality including
 * entities, enumerations, services, controllers, and routes.
 * 
 * @exports
 * - Entities: PathwayPlan
 * - Enums: All leaving care enumerations
 * - Services: LeavingCareService
 * - Controllers: LeavingCareController
 * - Routes: leavingCareRoutes
 * 
 * @compliance
 * - Children (Leaving Care) Act 2000
 * - Care Leavers (England) Regulations 2010
 * - Children and Social Work Act 2017
 * - OFSTED Regulation 6
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

// ========================================
// ENTITIES
// ========================================

export { PathwayPlan } from './entities/PathwayPlan';

// ========================================
// PATHWAY PLAN ENUMERATIONS
// ========================================

export {
  PathwayPlanStatus,
  LeavingCareStatus,
  AccommodationType,
  EducationEmploymentStatus
} from './entities/PathwayPlan';

// ========================================
// SERVICES
// ========================================

export { LeavingCareService } from './services/LeavingCareService';

// ========================================
// CONTROLLERS
// ========================================

export { LeavingCareController } from './controllers/LeavingCareController';

// ========================================
// ROUTES
// ========================================

export { default as leavingCareRoutes } from './routes/leavingcare.routes';
