/**
 * ============================================================================
 * Care Planning Module Exports
 * ============================================================================
 * 
 * @fileoverview Central export point for care planning domain module.
 * 
 * @module domains/careplanning
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides consolidated exports for all care planning functionality including
 * entities, enumerations, services, controllers, and routes.
 * 
 * @exports
 * - Entities: CarePlan, CarePlanReview, CarePlanGoal
 * - Enums: All care planning enumerations
 * - Services: CarePlanningService
 * - Controllers: CarePlanningController
 * - Routes: carePlanningRoutes
 * 
 * @compliance
 * - Care Planning, Placement and Case Review Regulations 2010
 * - IRO Handbook 2010
 * - Children Act 1989, Section 22(3) & Section 26
 * - OFSTED Regulation 5
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

// ========================================
// ENTITIES
// ========================================

export { CarePlan } from './entities/CarePlan';
export { CarePlanReview } from './entities/CarePlanReview';
export { CarePlanGoal } from './entities/CarePlanGoal';

// ========================================
// CARE PLAN ENUMERATIONS
// ========================================

export {
  CarePlanType,
  CarePlanStatus,
  PermanenceGoal,
  ChildParticipationLevel
} from './entities/CarePlan';

// ========================================
// REVIEW ENUMERATIONS
// ========================================

export {
  ReviewType,
  ReviewStatus,
  ReviewOutcome,
  ParticipantAttendance
} from './entities/CarePlanReview';

// ========================================
// GOAL ENUMERATIONS
// ========================================

export {
  GoalDomain,
  GoalStatus,
  GoalPriority
} from './entities/CarePlanGoal';

// ========================================
// SERVICES
// ========================================

export { CarePlanningService } from './services/CarePlanningService';

// ========================================
// CONTROLLERS
// ========================================

export { CarePlanningController } from './controllers/CarePlanningController';

// ========================================
// ROUTES
// ========================================

export { default as carePlanningRoutes } from './routes/careplanning.routes';
