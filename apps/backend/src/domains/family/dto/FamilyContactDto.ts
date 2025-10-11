/**
 * ============================================================================
 * Family Contact DTOs
 * ============================================================================
 * 
 * @fileoverview Data Transfer Objects for family contact API requests.
 * 
 * @module domains/family/dto
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Defines request DTOs for family contact operations including:
 * - Family member registration and updates
 * - Contact schedule creation and management
 * - Contact session recording and cancellation
 * - Risk assessment creation and approval
 * 
 * These DTOs provide type safety and validation structure for API endpoints.
 * 
 * @features
 * - Type-safe request structures
 * - Optional fields for partial updates
 * - Nested object support for complex data
 * - Array handling for multi-value fields
 * - Validation-ready structure
 * 
 * @compliance
 * - Children Act 1989 Section 22(4) & Section 34
 * - Adoption and Children Act 2002
 * - Human Rights Act 1998 Article 8
 * - GDPR 2018 (data minimization and purpose limitation)
 * 
 * @author WCNotes Development Team
 * @copyright 2025 WCNotes. All rights reserved.
 * 
 * ============================================================================
 */

import {
  RelationshipType,
  ContactRestrictionLevel,
  ParentalResponsibilityStatus
} from '../entities/FamilyMember';
import {
  ContactType,
  ContactFrequency,
  SupervisionLevel
} from '../entities/ContactSchedule';
import {
  AttendanceStatus,
  ChildEmotionalState,
  InteractionQuality
} from '../entities/ContactSession';
import { RiskLevel } from '../entities/ContactRiskAssessment';

// ========================================
// FAMILY MEMBER DTOs
// ========================================

export interface RegisterFamilyMemberDto {
  childId: string;
  organizationId: string;
  relationshipType: RelationshipType;
  firstName: string;
  lastName: string;
  middleNames?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationalInsuranceNumber?: string;
  maidenName?: string;
  
  // Parental Responsibility
  hasParentalResponsibility?: boolean;
  parentalResponsibilityStatus?: ParentalResponsibilityStatus;
  parentalResponsibilityEvidence?: string;
  parentalResponsibilityGrantedDate?: Date;
  parentalResponsibilityExpiryDate?: Date;
  
  // Contact Restrictions
  contactRestrictionLevel?: ContactRestrictionLevel;
  contactRestrictionReason?: string;
  contactRestrictionStartDate?: Date;
  contactRestrictionReviewDate?: Date;
  courtOrderReference?: string;
  courtOrderType?: string;
  courtOrderDate?: Date;
  courtOrderExpiryDate?: Date;
  
  // Address & Contact
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  homePhone?: string;
  mobilePhone?: string;
  workPhone?: string;
  email?: string;
  preferredContactMethod?: string;
  interpreterRequired?: boolean;
  interpreterLanguage?: string;
  
  // Emergency Contact
  isEmergencyContact?: boolean;
  emergencyContactPriority?: number;
  emergencyContactNotes?: string;
  
  // Relationship Verification
  relationshipVerified?: boolean;
  relationshipVerificationDate?: Date;
  relationshipVerificationMethod?: string;
  relationshipVerificationDocuments?: Array<{
    documentType: string;
    documentNumber: string;
    issuer: string;
    issueDate: Date;
    expiryDate?: Date;
  }>;
  
  // Safeguarding
  safeguardingConcerns?: boolean;
  safeguardingDetails?: string;
  riskToChild?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  hasCriminalRecord?: boolean;
  criminalRecordDetails?: string;
  dbsCheckRequired?: boolean;
  dbsCheckStatus?: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'EXPIRED';
  dbsCheckDate?: Date;
  dbsCertificateNumber?: string;
  
  // Additional Information
  occupation?: string;
  employer?: string;
  healthConditions?: string;
  disabilities?: string;
  additionalNotes?: string;
  
  createdBy: string;
}

export interface UpdateFamilyMemberDto {
  relationshipType?: RelationshipType;
  firstName?: string;
  lastName?: string;
  middleNames?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationalInsuranceNumber?: string;
  maidenName?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'DECEASED' | 'CONTACT_PROHIBITED' | 'WHEREABOUTS_UNKNOWN';
  
  hasParentalResponsibility?: boolean;
  parentalResponsibilityStatus?: ParentalResponsibilityStatus;
  parentalResponsibilityEvidence?: string;
  parentalResponsibilityGrantedDate?: Date;
  parentalResponsibilityExpiryDate?: Date;
  
  contactRestrictionLevel?: ContactRestrictionLevel;
  contactRestrictionReason?: string;
  contactRestrictionStartDate?: Date;
  contactRestrictionReviewDate?: Date;
  courtOrderReference?: string;
  courtOrderType?: string;
  courtOrderDate?: Date;
  courtOrderExpiryDate?: Date;
  
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postcode?: string;
  country?: string;
  homePhone?: string;
  mobilePhone?: string;
  workPhone?: string;
  email?: string;
  preferredContactMethod?: string;
  interpreterRequired?: boolean;
  interpreterLanguage?: string;
  
  isEmergencyContact?: boolean;
  emergencyContactPriority?: number;
  emergencyContactNotes?: string;
  
  relationshipVerified?: boolean;
  relationshipVerificationDate?: Date;
  relationshipVerificationMethod?: string;
  
  safeguardingConcerns?: boolean;
  safeguardingDetails?: string;
  riskToChild?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  hasCriminalRecord?: boolean;
  criminalRecordDetails?: string;
  dbsCheckRequired?: boolean;
  dbsCheckStatus?: 'NOT_REQUIRED' | 'PENDING' | 'COMPLETED' | 'EXPIRED';
  dbsCheckDate?: Date;
  dbsCertificateNumber?: string;
  
  occupation?: string;
  employer?: string;
  healthConditions?: string;
  disabilities?: string;
  additionalNotes?: string;
  
  updatedBy: string;
}

// ========================================
// CONTACT SCHEDULE DTOs
// ========================================

export interface CreateContactScheduleDto {
  childId: string;
  familyMemberId: string;
  organizationId: string;
  contactType: ContactType;
  contactFrequency: ContactFrequency;
  
  supervisionRequired?: boolean;
  supervisionLevel?: SupervisionLevel;
  supervisorName?: string;
  supervisorRole?: string;
  supervisorOrganization?: string;
  supervisorContact?: string;
  supervisionRequirements?: string;
  
  durationMinutes?: number;
  preferredDayOfWeek?: string;
  preferredTime?: string;
  flexibleTiming?: boolean;
  advanceNoticeDays?: number;
  
  locationType?: string;
  venueName?: string;
  venueAddress?: string;
  venueContactNumber?: string;
  venueNotes?: string;
  
  transportRequired?: boolean;
  transportProvider?: string;
  transportFrom?: string;
  transportTo?: string;
  transportCost?: number;
  transportNotes?: string;
  
  contactConditions?: string[];
  prohibitedActivities?: string[];
  requiredActivities?: string[];
  permittedPersons?: string[];
  prohibitedPersons?: string[];
  
  courtOrdered?: boolean;
  courtOrderReference?: string;
  courtOrderType?: string;
  courtOrderDate?: Date;
  courtOrderExpiryDate?: Date;
  courtOrderConditions?: string;
  
  childWishesRecorded?: boolean;
  childWishesSummary?: string;
  childWishesRecordedDate?: Date;
  childWishesRecordedBy?: string;
  childConsentGiven?: boolean;
  
  contactPurpose?: string;
  contactGoals?: string;
  successIndicators?: string;
  
  reviewFrequencyMonths?: number;
  
  createdBy: string;
}

export interface SuspendContactScheduleDto {
  suspensionReason: string;
  suspendedBy: string;
}

// ========================================
// CONTACT SESSION DTOs
// ========================================

export interface ScheduleContactSessionDto {
  contactScheduleId: string;
  sessionDate: Date;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  
  locationType?: string;
  venueName?: string;
  venueAddress?: string;
  
  supervised?: boolean;
  supervisorName?: string;
  supervisorRole?: string;
  supervisionLevel?: SupervisionLevel;
  
  scheduledBy: string;
}

export interface RecordContactSessionDto {
  actualStartTime?: Date;
  actualEndTime?: Date;
  
  childAttendance: AttendanceStatus;
  childLatenessMinutes?: number;
  familyMemberAttendance: AttendanceStatus;
  familyMemberLatenessMinutes?: number;
  nonAttendanceReason?: string;
  
  additionalAttendees?: Array<{
    name: string;
    role: string;
    organization?: string;
    arrivalTime?: Date;
    departureTime?: Date;
  }>;
  
  venueSuitable?: boolean;
  venueComments?: string;
  
  supervisionNotes?: string;
  supervisionConditionsMet?: boolean;
  
  childEmotionalStateBefore?: ChildEmotionalState;
  childEmotionalStateDuring?: ChildEmotionalState;
  childEmotionalStateAfter?: ChildEmotionalState;
  childPresentationNotes?: string;
  childEngagementLevel?: 'VERY_HIGH' | 'HIGH' | 'MODERATE' | 'LOW' | 'VERY_LOW';
  childVerbalCommunication?: string;
  childNonVerbalCommunication?: string;
  
  interactionQuality?: InteractionQuality;
  interactionDescription?: string;
  positiveInteractions?: string;
  concerningInteractions?: string;
  familyMemberBehavior?: string;
  attachmentObserved?: boolean;
  attachmentNotes?: string;
  
  activitiesUndertaken?: Array<{
    activity: string;
    durationMinutes?: number;
    childEngagement?: 'HIGH' | 'MEDIUM' | 'LOW';
    notes?: string;
  }>;
  giftsExchanged?: boolean;
  giftsDescription?: string;
  
  incidentsOccurred?: boolean;
  incidentDetails?: Array<{
    incidentTime: Date;
    incidentType: string;
    incidentDescription: string;
    actionTaken: string;
    incidentSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    reportedTo?: string;
  }>;
  
  safeguardingConcernsRaised?: boolean;
  safeguardingDetails?: string;
  
  contactTerminatedEarly?: boolean;
  terminationReason?: string;
  terminationTime?: Date;
  
  childViewsSought?: boolean;
  childViewsSummary?: string;
  childWishesNextContact?: string;
  childEnjoyedContact?: boolean;
  
  sessionObjectivesMet?: boolean;
  objectivesSummary?: string;
  overallAssessment?: string;
  positiveOutcomes?: string;
  areasOfConcern?: string;
  
  followUpRequired?: boolean;
  followUpActions?: Array<{
    action: string;
    assignedTo: string;
    dueDate: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  }>;
  recommendations?: string;
  scheduleChangesRecommended?: boolean;
  scheduleChangeDetails?: string;
  
  socialWorkerNotified?: boolean;
  notificationDate?: Date;
  reportSentTo?: string[];
  
  recordedBy: string;
}

export interface CancelContactSessionDto {
  cancellationReason: string;
  cancelledBy: string;
  noticePeriodMet?: boolean;
  rescheduled?: boolean;
  rescheduledDate?: Date;
}

// ========================================
// RISK ASSESSMENT DTOs
// ========================================

export interface CreateRiskAssessmentDto {
  childId: string;
  familyMemberId: string;
  organizationId: string;
  
  overallRiskLevel: RiskLevel;
  overallRiskScore?: number;
  riskSummary: string;
  keyConcerns?: string;
  protectiveFactors?: string;
  
  identifiedRisks?: Array<{
    category: string;
    riskLevel: RiskLevel;
    description: string;
    evidence?: string;
    likelihood: 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'HIGHLY_LIKELY';
    impact: 'MINOR' | 'MODERATE' | 'SIGNIFICANT' | 'SEVERE';
    mitigationRequired: boolean;
  }>;
  
  childAgeConsideration?: string;
  childVulnerabilities?: string;
  childPreviousTrauma?: string;
  childEmotionalWellbeing?: string;
  childWishesConsidered?: boolean;
  childWishesSummary?: string;
  gillickCompetenceAssessed?: boolean;
  gillickCompetent?: boolean;
  
  familyMemberHistory?: string;
  previousConcerns?: string;
  criminalHistoryRelevant?: boolean;
  criminalDetails?: string;
  substanceMisuseConcerns?: boolean;
  substanceMisuseDetails?: string;
  mentalHealthConcerns?: boolean;
  mentalHealthDetails?: string;
  domesticViolenceHistory?: boolean;
  domesticViolenceDetails?: string;
  complianceWithConditions?: 'EXCELLENT' | 'GOOD' | 'SATISFACTORY' | 'POOR' | 'NON_COMPLIANT';
  
  venueSafetyAssessed?: boolean;
  venueSafetyConcerns?: string;
  otherHouseholdMembers?: Array<{
    name: string;
    relationship: string;
    age?: number;
    riskLevel?: RiskLevel;
    concerns?: string;
  }>;
  neighbourhoodSafety?: 'SAFE' | 'MODERATE_CONCERN' | 'HIGH_CONCERN';
  
  previousContactReviewed?: boolean;
  previousContactSummary?: string;
  previousIncidents?: Array<{
    incidentDate: Date;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    actionTaken: string;
  }>;
  contactPatterns?: string;
  
  mitigationStrategies?: Array<{
    strategy: string;
    targetRisk: string;
    implementation: string;
    responsiblePerson: string;
    effectivenessRating?: 'VERY_EFFECTIVE' | 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'INEFFECTIVE';
  }>;
  
  supervisionRecommendation?: SupervisionLevel;
  supervisionRationale?: string;
  contactFrequencyRecommendation?: string;
  contactDurationRecommendation?: string;
  venueRecommendation?: string;
  conditionsForContact?: string[];
  
  professionalsConsulted?: string[];
  multiAgencyInput?: string;
  legalAdviceSought?: boolean;
  legalAdviceSummary?: string;
  
  courtOrdersConsidered?: boolean;
  courtOrderDetails?: string;
  legalRestrictions?: string;
  parentalResponsibilityImpact?: string;
  
  contactRecommended: boolean;
  recommendationRationale: string;
  alternativeArrangements?: string;
  contingencyPlans?: string;
  triggersForReview?: string[];
  
  monitoringRequirements?: string;
  reviewFrequencyMonths?: number;
  earlyReviewTriggers?: string;
  
  assessedBy: string;
}

export interface ApproveRiskAssessmentDto {
  approvedByName: string;
  approvedByRole: string;
  approvalComments?: string;
}
