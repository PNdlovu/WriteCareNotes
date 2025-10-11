/**
 * Update Child DTO
 * Data transfer object for updating a child profile
 * 
 * @description
 * Supports all British Islesjurisdictions:
 * - England (OFSTED)
 * - Wales (CIW)
 * - Scotland (Care Inspectorate)
 * - Northern Ireland (RQIA)
 * - Republic of Ireland (HIQA)
 * - Jersey, Guernsey, Isle of Man
 * 
 * IMPORTANT: Changing jurisdiction requires authorization.
 * Legal status must be valid for the jurisdiction.
 * 
 * @see docs/childrens-care-system/BRITISH-ISLES-COMPLIANCE.md
 */

import { LegalStatus, PlacementType, ChildStatus, Jurisdiction } from '../entities/Child';
import { BritishIslesComplianceUtil } from '../utils/BritishIslesComplianceUtil';

export class UpdateChildDto {
  // British Isles Jurisdiction
  /**
   * WARNING: Changing jurisdiction should only be done with proper authorization
   * (e.g., cross-border placement). Legal status must be valid for new jurisdiction.
   */
  jurisdiction?: Jurisdiction;
  
  // Legal Status
  /**
   * Legal status must be valid for the child's jurisdiction.
   * Use BritishIslesComplianceUtil.getValidLegalStatuses(jurisdiction) to get valid options.
   */
  legalStatus?: LegalStatus;
  legalStatusStartDate?: Date;
  legalStatusReviewDate?: Date;
  courtOrderDetails?: string;
  
  // Basic Information
  firstName?: string;
  middleNames?: string;
  lastName?: string;
  preferredName?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  
  // NHS and Unique Identifiers
  nhsNumber?: string;
  uniquePupilNumber?: string;
  
  // Local Authority Details
  localAuthority?: string;
  localAuthorityId?: string;
  
  // Social Worker Details
  socialWorkerName?: string;
  socialWorkerEmail?: string;
  socialWorkerPhone?: string;
  
  // IRO Details
  iroName?: string;
  iroEmail?: string;
  iroPhone?: string;
  
  // Education Details
  currentSchool?: string;
  hasEHCP?: boolean;
  hasSENSupport?: boolean;
  isNEET?: boolean;
  
  // Personal Education Plan
  pepReviewDue?: Date;
  nextPEPReviewDate?: Date;
  
  // Health Details
  gpName?: string;
  gpPractice?: string;
  gpPhone?: string;
  hasCAMHSInvolvement?: boolean;
  hasGillickCompetence?: boolean;
  
  // Health Assessments
  lastHealthAssessmentDate?: Date;
  nextHealthAssessment?: Date;
  
  // LAC Reviews
  lastLACReviewDate?: Date;
  nextLACReviewDate?: Date;
  
  // Cultural and Identity
  ethnicity?: string;
  firstLanguage?: string;
  religion?: string;
  dietaryRequirements?: string;
  
  // Disabilities and Support Needs
  hasPhysicalDisability?: boolean;
  hasLearningDisability?: boolean;
  mobilityAids?: string[];
  accessibilityNeeds?: string;
  
  // Safeguarding
  hasChildProtectionPlan?: boolean;
  childProtectionCategory?: string;
  cseRiskIdentified?: boolean;
  cceRiskIdentified?: boolean;
  gangAffiliation?: string;
  
  // Leaving Care (16+)
  hasPathwayPlan?: boolean;
  pathwayPlanDate?: Date;
  personalAdvisorName?: string;
  personalAdvisorEmail?: string;
  
  // UASC
  isUASC?: boolean;
  homeOfficeReference?: string;
  immigrationStatus?: string;
  arrivalDate?: Date;
  
  // Placement
  expectedDischargeDate?: Date;
  
  // Updated by
  updatedBy?: string;
}
