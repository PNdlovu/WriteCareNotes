/**
 * Create Child DTO
 * Data transfer object for creating a new child profile
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
 * @see docs/childrens-care-system/BRITISH-ISLES-COMPLIANCE.md
 */

import { LegalStatus, PlacementType, ChildStatus, Jurisdiction } from '../entities/Child';
import { BritishIslesComplianceUtil } from '../utils/BritishIslesComplianceUtil';

export class CreateChildDto {
  // Basic Information
  firstName: string;
  middleNames?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
  
  // Organization
  organizationId: string;
  
  // British Isles Jurisdiction
  /**
   * Jurisdiction determines which regulatory framework applies.
   * Must be oneof: ENGLAND, WALES, SCOTLAND, NORTHERN_IRELAND, IRELAND, JERSEY, GUERNSEY, ISLE_OF_MAN
   * Legal status must be valid for the selected jurisdiction.
   */
  jurisdiction: Jurisdiction;
  
  // NHS and Unique Identifiers
  nhsNumber?: string;
  uniquePupilNumber?: string;
  
  // Local Authority Details
  localAuthority: string;
  localAuthorityId?: string;
  
  // Legal Status
  /**
   * Legal status must be valid for the specified jurisdiction.
   * Use BritishIslesComplianceUtil.getValidLegalStatuses(jurisdiction) to get valid options.
   */
  legalStatus: LegalStatus;
  legalStatusStartDate?: Date;
  legalStatusReviewDate?: Date;
  courtOrderDetails?: string;
  
  // Placement Information
  placementType: PlacementType;
  admissionDate: Date;
  expectedDischargeDate?: Date;
  
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
  
  // Health Details
  gpName?: string;
  gpPractice?: string;
  gpPhone?: string;
  hasCAMHSInvolvement?: boolean;
  
  // Cultural and Identity
  ethnicity?: string;
  firstLanguage?: string;
  religion?: string;
  
  // Safeguarding
  hasChildProtectionPlan?: boolean;
  cseRiskIdentified?: boolean;
  cceRiskIdentified?: boolean;
  
  // UASC (Unaccompanied Asylum-Seeking Children)
  isUASC?: boolean;
  homeOfficeReference?: string;
  immigrationStatus?: string;
  
  // Created by
  createdBy?: string;
}
