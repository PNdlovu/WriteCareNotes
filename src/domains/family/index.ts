/**
 * ============================================================================
 * Family Contact Module Exports
 * ============================================================================
 * 
 * @fileoverview Central export point for family contact domain module.
 * 
 * @module domains/family
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides consolidated exports for all family contact functionality including
 * entities, enumerations, services, controllers, and routes.
 * 
 * @exports
 * - Entities: FamilyMember, ContactSchedule, ContactSession, ContactRiskAssessment
 * - Enums: All relationship, status, and type enumerations
 * - Services: FamilyContactService
 * - Controllers: FamilyContactController
 * - Routes: familyRoutes
 * 
 * @compliance
 * - Children Act 1989 Section 22(4) & Section 34
 * - Adoption and Children Act 2002
 * - Human Rights Act 1998 Article 8
 * - Care Planning Regulations 2010
 * - Working Together to Safeguard Children 2018
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

// ========================================
// ENTITIES
// ========================================

export { FamilyMember } from './entities/FamilyMember';
export { ContactSchedule } from './entities/ContactSchedule';
export { ContactSession } from './entities/ContactSession';
export { ContactRiskAssessment } from './entities/ContactRiskAssessment';

// ========================================
// FAMILY MEMBER ENUMERATIONS
// ========================================

export {
  RelationshipType,
  FamilyMemberStatus,
  ParentalResponsibilityStatus,
  ContactRestrictionLevel
} from './entities/FamilyMember';

// ========================================
// CONTACT SCHEDULE ENUMERATIONS
// ========================================

export {
  ContactType,
  ContactFrequency,
  ContactScheduleStatus,
  SupervisionLevel
} from './entities/ContactSchedule';

// ========================================
// CONTACT SESSION ENUMERATIONS
// ========================================

export {
  ContactSessionStatus,
  AttendanceStatus,
  ChildEmotionalState,
  InteractionQuality
} from './entities/ContactSession';

// ========================================
// RISK ASSESSMENT ENUMERATIONS
// ========================================

export {
  RiskLevel,
  RiskAssessmentStatus,
  RiskCategory
} from './entities/ContactRiskAssessment';

// ========================================
// SERVICES
// ========================================

export { FamilyContactService } from './services/FamilyContactService';

// ========================================
// CONTROLLERS
// ========================================

export { FamilyContactController } from './controllers/FamilyContactController';

// ========================================
// ROUTES
// ========================================

export { default as familyRoutes } from './routes/family.routes';
