/**
 * Child Response DTOs
 * Data transfer objects for child API responses
 */

import { Child, LegalStatus, PlacementType, ChildStatus } from '../entities/Child';

export class ChildResponseDto {
  id: string;
  firstName: string;
  middleNames?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth: Date;
  age: number;
  gender: string;
  
  // Organization
  organizationId: string;
  organizationName?: string;
  
  // Identifiers
  nhsNumber?: string;
  uniquePupilNumber?: string;
  localAuthority: string;
  localAuthorityId?: string;
  
  // Status
  status: ChildStatus;
  legalStatus: LegalStatus;
  placementType: PlacementType;
  
  // Dates
  admissionDate: Date;
  expectedDischargeDate?: Date;
  actualDischargeDate?: Date;
  
  // Key Contacts
  socialWorkerName?: string;
  socialWorkerEmail?: string;
  iroName?: string;
  
  // Education
  currentSchool?: string;
  hasEHCP?: boolean;
  isNEET?: boolean;
  
  // Health
  hasCAMHSInvolvement?: boolean;
  
  // Safeguarding
  hasChildProtectionPlan?: boolean;
  cseRiskIdentified?: boolean;
  cceRiskIdentified?: boolean;
  
  // Review Dates
  nextHealthAssessment?: Date;
  nextLACReviewDate?: Date;
  nextPEPReviewDate?: Date;
  
  // Alerts
  isOverdueHealth: boolean;
  isOverdueLAC: boolean;
  isOverduePEP: boolean;
  requiresUrgentAttention: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  const ructor(child: Child) {
    this.id = child.id;
    this.firstName = child.firstName;
    this.middleNames = child.middleNames;
    this.lastName = child.lastName;
    this.preferredName = child.preferredName;
    this.dateOfBirth = child.dateOfBirth;
    this.age = child.calculateAge();
    this.gender = child.gender;
    
    this.organizationId = child.organizationId;
    this.organizationName = child.organization?.name;
    
    this.nhsNumber = child.nhsNumber;
    this.uniquePupilNumber = child.uniquePupilNumber;
    this.localAuthority = child.localAuthority;
    this.localAuthorityId = child.localAuthorityId;
    
    this.status = child.status;
    this.legalStatus = child.legalStatus;
    this.placementType = child.placementType;
    
    this.admissionDate = child.admissionDate;
    this.expectedDischargeDate = child.expectedDischargeDate;
    this.actualDischargeDate = child.actualDischargeDate;
    
    this.socialWorkerName = child.socialWorkerName;
    this.socialWorkerEmail = child.socialWorkerEmail;
    this.iroName = child.iroName;
    
    this.currentSchool = child.currentSchool;
    this.hasEHCP = child.hasEHCP;
    this.isNEET = child.isNEET;
    
    this.hasCAMHSInvolvement = child.hasCAMHSInvolvement;
    
    this.hasChildProtectionPlan = child.hasChildProtectionPlan;
    this.cseRiskIdentified = child.cseRiskIdentified;
    this.cceRiskIdentified = child.cceRiskIdentified;
    
    this.nextHealthAssessment = child.nextHealthAssessment;
    this.nextLACReviewDate = child.nextLACReviewDate;
    this.nextPEPReviewDate = child.nextPEPReviewDate;
    
    this.isOverdueHealth = child.isHealthAssessmentOverdue();
    this.isOverdueLAC = child.isLACReviewOverdue();
    this.isOverduePEP = child.isPEPReviewOverdue();
    this.requiresUrgentAttention = child.requiresUrgentAttention();
    
    this.createdAt = child.createdAt;
    this.updatedAt = child.updatedAt;
  }
}

export interface ChildFilters {
  page?: number;
  limit?: number;
  status?: ChildStatus;
  placementType?: PlacementType;
  legalStatus?: LegalStatus;
  jurisdiction?: Jurisdiction; // BRITISH ISLESCOMPLIANCE: Filter by jurisdiction
  localAuthority?: string;
  socialWorkerEmail?: string;
  ageMin?: number;
  ageMax?: number;
  gender?: string;
  hasEHCP?: boolean;
  hasSENSupport?: boolean;
  hasCAMHSInvolvement?: boolean;
  isNEET?: boolean;
  hasChildProtectionPlan?: boolean;
  cseRiskIdentified?: boolean;
  cceRiskIdentified?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ChildListResponseDto {
  data: Child[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
