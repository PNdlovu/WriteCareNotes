/**
 * ============================================================================
 * UASC Domain Module Exports
 * ============================================================================
 * 
 * @fileoverview Central export point for UASC domain.
 * 
 * @module domains/uasc
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Exports all UASC (Unaccompanied Asylum Seeking Children) domain entities,
 * services, controllers, and routes for use across the application.
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
  UASCProfile,
  UASCStatus,
  ReferralSource,
  ArrivalRoute,
  TraffickinRiskLevel
} from './entities/UASCProfile';

export {
  AgeAssessment,
  AssessmentStatus,
  AssessmentOutcome,
  AssessmentMethod
} from './entities/AgeAssessment';

export {
  ImmigrationStatus,
  ImmigrationStatusType,
  AsylumClaimStatus,
  AppealStage,
  AppealStatus
} from './entities/ImmigrationStatus';

export {
  HomeOfficeCorrespondence,
  CorrespondenceType,
  CorrespondenceDirection,
  CorrespondenceMethod,
  CorrespondenceStatus
} from './entities/HomeOfficeCorrespondence';

// ========================================
// SERVICES
// ========================================

export { UASCService } from './services/UASCService';

// ========================================
// CONTROLLERS
// ========================================

export { UASCController } from './controllers/UASCController';

// ========================================
// ROUTES
// ========================================

export { default as uascRoutes } from './routes/uasc.routes';
