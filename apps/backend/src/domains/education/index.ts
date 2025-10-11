/**
 * ============================================================================
 * Education Module Exports
 * ============================================================================
 * 
 * @fileoverview Central export point for education domain components.
 * 
 * @module domains/education
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides a single import point for all education-related entities, services,
 * controllers, and routes. Simplifies imports across the application and maintains
 * clean module boundaries for Personal Education Plans, school placements, and
 * Virtual School coordination.
 * 
 * @example
 * // Import specific components
 * import { EducationService, PersonalEducationPlan } from '@/domains/education';
 * 
 * // Import routes for Express app
 * import educationRoutes from '@/domains/education';
 * app.use('/api/v1/education', educationRoutes);
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
  PersonalEducationPlan,
  PEPStatus,
  AcademicYear,
  Term
} from './entities/PersonalEducationPlan';

export {
  SchoolPlacement,
  PlacementType,
  PlacementStatus,
  OfstedRating
} from './entities/SchoolPlacement';

// ========================================
// SERVICES
// ========================================

export { EducationService } from './services/EducationService';

// ========================================
// CONTROLLERS
// ========================================

export { EducationController } from './controllers/EducationController';

// ========================================
// ROUTES
// ========================================

export { default as educationRoutes } from './routes/education.routes';
