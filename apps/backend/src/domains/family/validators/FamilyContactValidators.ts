/**
 * ============================================================================
 * Family Contact Validators
 * ============================================================================
 * 
 * @fileoverview Validation functions for family contact API requests.
 * 
 * @module domains/family/validators
 * @version 1.0.0
 * @since 2025-01-10
 * 
 * @description
 * Provides comprehensive validation for family contactoperations:
 * - Family member registration and updates
 * - Contact schedule creation and management
 * - Contact session recording and cancellation
 * - Risk assessment creation and approval
 * 
 * Validates required fields, data types, business rules, and compliance requirements.
 * 
 * @features
 * - Required field validation
 * - Type checking and format validation
 * - Business rule enforcement
 * - Relationship type validation
 * - Contact frequency and duration validation
 * - Risk level validation
 * - Date range validation
 * - Email and phone format validation
 * 
 * @compliance
 * - Children Act 1989 Section 22(4) & Section 34
 * - Adoption and Children Act 2002
 * - Human Rights Act 1998 Article 8
 * - GDPR 2018 (data validation and quality)
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
import { RiskLevel } from '../entities/ContactRiskAssessment';

// ========================================
// VALIDATION ERROR CLASS
// ========================================

export class ValidationError extends Error {
  const ructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ========================================
// COMMON VALIDATORS
// ========================================

/**
 * Validates that a required field is present
 */
export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(fieldName, `${fieldName} is required`);
  }
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates UK postcode format
 */
export function validatePostcode(postcode: string): boolean {
  const postcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
  return postcodeRegex.test(postcode);
}

/**
 * Validates phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validates National Insurance number format
 */
export function validateNINO(nino: string): boolean {
  const ninoRegex = /^[A-Z]{2}\d{6}[A-Z]$/i;
  return ninoRegex.test(nino.replace(/\s/g, ''));
}

/**
 * Validates date is not in the future
 */
export function validatePastDate(date: Date, fieldName: string): void {
  if (new Date(date) > new Date()) {
    throw new ValidationError(fieldName, `${fieldName} cannot be in the future`);
  }
}

/**
 * Validates date is not in the past
 */
export function validateFutureDate(date: Date, fieldName: string): void {
  if (new Date(date) < new Date()) {
    throw new ValidationError(fieldName, `${fieldName} cannot be in the past`);
  }
}

/**
 * Validates enum value
 */
export function validateEnum<T>(value: T, enumType: any, fieldName: string): void {
  if (!Object.values(enumType).includes(value)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be oneof: ${Object.values(enumType).join(', ')}`
    );
  }
}

// ========================================
// FAMILY MEMBER VALIDATORS
// ========================================

export function validateRegisterFamilyMember(dto: any): void {
  // Required fields
  validateRequired(dto.childId, 'childId');
  validateRequired(dto.organizationId, 'organizationId');
  validateRequired(dto.relationshipType, 'relationshipType');
  validateRequired(dto.firstName, 'firstName');
  validateRequired(dto.lastName, 'lastName');
  validateRequired(dto.createdBy, 'createdBy');

  // Validate relationship type
  validateEnum(dto.relationshipType, RelationshipType, 'relationshipType');

  // Validate contact restriction level if provided
  if (dto.contactRestrictionLevel) {
    validateEnum(dto.contactRestrictionLevel, ContactRestrictionLevel, 'contactRestrictionLevel');
  }

  // Validate parental responsibility status if provided
  if (dto.parentalResponsibilityStatus) {
    validateEnum(dto.parentalResponsibilityStatus, ParentalResponsibilityStatus, 'parentalResponsibilityStatus');
  }

  // Validate email format if provided
  if (dto.email && !validateEmail(dto.email)) {
    throw new ValidationError('email', 'Invalid email format');
  }

  // Validate postcode if provided
  if (dto.postcode && !validatePostcode(dto.postcode)) {
    throw new ValidationError('postcode', 'Invalid UK postcode format');
  }

  // Validate phone numbers if provided
  if (dto.homePhone && !validatePhoneNumber(dto.homePhone)) {
    throw new ValidationError('homePhone', 'Invalid phone number format');
  }
  if (dto.mobilePhone && !validatePhoneNumber(dto.mobilePhone)) {
    throw new ValidationError('mobilePhone', 'Invalid phone number format');
  }
  if (dto.workPhone && !validatePhoneNumber(dto.workPhone)) {
    throw new ValidationError('workPhone', 'Invalid phone number format');
  }

  // Validate National Insurance number if provided
  if (dto.nationalInsuranceNumber && !validateNINO(dto.nationalInsuranceNumber)) {
    throw new ValidationError('nationalInsuranceNumber', 'Invalid National Insurance number format');
  }

  // Validate date of birth is in the past if provided
  if (dto.dateOfBirth) {
    validatePastDate(dto.dateOfBirth, 'dateOfBirth');
  }

  // Validate DBS check date is in the past if provided
  if (dto.dbsCheckDate) {
    validatePastDate(dto.dbsCheckDate, 'dbsCheckDate');
  }

  // Validate court order dates if court ordered
  if (dto.courtOrderReference) {
    if (!dto.courtOrderDate) {
      throw new ValidationError('courtOrderDate', 'Court order date is required when court order reference is provided');
    }
    validatePastDate(dto.courtOrderDate, 'courtOrderDate');
  }
}

export function validateUpdateFamilyMember(dto: any): void {
  validateRequired(dto.updatedBy, 'updatedBy');

  // Validate relationship type if provided
  if (dto.relationshipType) {
    validateEnum(dto.relationshipType, RelationshipType, 'relationshipType');
  }

  // Validate contact restriction level if provided
  if (dto.contactRestrictionLevel) {
    validateEnum(dto.contactRestrictionLevel, ContactRestrictionLevel, 'contactRestrictionLevel');
  }

  // Validate parental responsibility status if provided
  if (dto.parentalResponsibilityStatus) {
    validateEnum(dto.parentalResponsibilityStatus, ParentalResponsibilityStatus, 'parentalResponsibilityStatus');
  }

  // Validate email format if provided
  if (dto.email && !validateEmail(dto.email)) {
    throw new ValidationError('email', 'Invalid email format');
  }

  // Validate postcode if provided
  if (dto.postcode && !validatePostcode(dto.postcode)) {
    throw new ValidationError('postcode', 'Invalid UK postcode format');
  }

  // Validate phone numbers if provided
  if (dto.homePhone && !validatePhoneNumber(dto.homePhone)) {
    throw new ValidationError('homePhone', 'Invalid phone number format');
  }
  if (dto.mobilePhone && !validatePhoneNumber(dto.mobilePhone)) {
    throw new ValidationError('mobilePhone', 'Invalid phone number format');
  }
  if (dto.workPhone && !validatePhoneNumber(dto.workPhone)) {
    throw new ValidationError('workPhone', 'Invalid phone number format');
  }

  // Validate National Insurance number if provided
  if (dto.nationalInsuranceNumber && !validateNINO(dto.nationalInsuranceNumber)) {
    throw new ValidationError('nationalInsuranceNumber', 'Invalid National Insurance number format');
  }
}

// ========================================
// CONTACT SCHEDULE VALIDATORS
// ========================================

export function validateCreateContactSchedule(dto: any): void {
  // Required fields
  validateRequired(dto.childId, 'childId');
  validateRequired(dto.familyMemberId, 'familyMemberId');
  validateRequired(dto.organizationId, 'organizationId');
  validateRequired(dto.contactType, 'contactType');
  validateRequired(dto.contactFrequency, 'contactFrequency');
  validateRequired(dto.createdBy, 'createdBy');

  // Validate contact type
  validateEnum(dto.contactType, ContactType, 'contactType');

  // Validate contact frequency
  validateEnum(dto.contactFrequency, ContactFrequency, 'contactFrequency');

  // Validate supervision level if provided
  if (dto.supervisionLevel) {
    validateEnum(dto.supervisionLevel, SupervisionLevel, 'supervisionLevel');
  }

  // Validate duration is positive if provided
  if (dto.durationMinutes !== undefined && dto.durationMinutes <= 0) {
    throw new ValidationError('durationMinutes', 'Duration must be greater than 0');
  }

  // Validate transport cost is non-negative if provided
  if (dto.transportCost !== undefined && dto.transportCost < 0) {
    throw new ValidationError('transportCost', 'Transport cost cannot be negative');
  }

  // Validate review frequency is positive if provided
  if (dto.reviewFrequencyMonths !== undefined && dto.reviewFrequencyMonths <= 0) {
    throw new ValidationError('reviewFrequencyMonths', 'Review frequency must be greater than 0');
  }

  // Validate court order dates if court ordered
  if (dto.courtOrdered) {
    if (!dto.courtOrderReference) {
      throw new ValidationError('courtOrderReference', 'Court order reference is required when court ordered');
    }
    if (!dto.courtOrderDate) {
      throw new ValidationError('courtOrderDate', 'Court order date is required when court ordered');
    }
    validatePastDate(dto.courtOrderDate, 'courtOrderDate');
  }
}

export function validateSuspendContactSchedule(dto: any): void {
  validateRequired(dto.suspensionReason, 'suspensionReason');
  validateRequired(dto.suspendedBy, 'suspendedBy');
}

// ========================================
// CONTACT SESSION VALIDATORS
// ========================================

export function validateScheduleContactSession(dto: any): void {
  // Required fields
  validateRequired(dto.contactScheduleId, 'contactScheduleId');
  validateRequired(dto.sessionDate, 'sessionDate');
  validateRequired(dto.scheduledStartTime, 'scheduledStartTime');
  validateRequired(dto.scheduledEndTime, 'scheduledEndTime');
  validateRequired(dto.scheduledBy, 'scheduledBy');

  // Validate session date is not in the past
  const sessionDate = new Date(dto.sessionDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (sessionDate < today) {
    throw new ValidationError('sessionDate', 'Session date cannot be in the past');
  }

  // Validate end time is after start time
  const startTime = new Date(dto.scheduledStartTime);
  const endTime = new Date(dto.scheduledEndTime);
  if (endTime <= startTime) {
    throw new ValidationError('scheduledEndTime', 'End time must be after start time');
  }

  // Validate supervision level if provided
  if (dto.supervisionLevel) {
    validateEnum(dto.supervisionLevel, SupervisionLevel, 'supervisionLevel');
  }
}

export function validateRecordContactSession(dto: any): void {
  validateRequired(dto.childAttendance, 'childAttendance');
  validateRequired(dto.familyMemberAttendance, 'familyMemberAttendance');
  validateRequired(dto.recordedBy, 'recordedBy');

  // Validate actual times if provided
  if (dto.actualStartTime && dto.actualEndTime) {
    const startTime = new Date(dto.actualStartTime);
    const endTime = new Date(dto.actualEndTime);
    if (endTime <= startTime) {
      throw new ValidationError('actualEndTime', 'End time must be after start time');
    }
  }

  // Validate lateness minutes are non-negative if provided
  if (dto.childLatenessMinutes !== undefined && dto.childLatenessMinutes < 0) {
    throw new ValidationError('childLatenessMinutes', 'Lateness minutes cannot be negative');
  }
  if (dto.familyMemberLatenessMinutes !== undefined && dto.familyMemberLatenessMinutes < 0) {
    throw new ValidationError('familyMemberLatenessMinutes', 'Lateness minutes cannot be negative');
  }

  // Validate incident severity if incidents occurred
  if (dto.incidentsOccurred && dto.incidentDetails) {
    dto.incidentDetails.forEach((incident: any, index: number) => {
      if (!incident.incidentTime) {
        throw new ValidationError(`incidentDetails[${index}].incidentTime`, 'Incident time is required');
      }
      if (!incident.incidentType) {
        throw new ValidationError(`incidentDetails[${index}].incidentType`, 'Incident type is required');
      }
      if (!incident.incidentDescription) {
        throw new ValidationError(`incidentDetails[${index}].incidentDescription`, 'Incident description is required');
      }
      if (!incident.actionTaken) {
        throw new ValidationError(`incidentDetails[${index}].actionTaken`, 'Action taken is required');
      }
      if (!incident.incidentSeverity) {
        throw new ValidationError(`incidentDetails[${index}].incidentSeverity`, 'Incident severity is required');
      }
    });
  }

  // Validate follow-up actions if required
  if (dto.followUpRequired && dto.followUpActions) {
    dto.followUpActions.forEach((action: any, index: number) => {
      if (!action.action) {
        throw new ValidationError(`followUpActions[${index}].action`, 'Action is required');
      }
      if (!action.assignedTo) {
        throw new ValidationError(`followUpActions[${index}].assignedTo`, 'Assigned to is required');
      }
      if (!action.dueDate) {
        throw new ValidationError(`followUpActions[${index}].dueDate`, 'Due date is required');
      }
      if (!action.priority) {
        throw new ValidationError(`followUpActions[${index}].priority`, 'Priority is required');
      }
    });
  }
}

export function validateCancelContactSession(dto: any): void {
  validateRequired(dto.cancellationReason, 'cancellationReason');
  validateRequired(dto.cancelledBy, 'cancelledBy');

  // Validate rescheduled date is in the future if rescheduled
  if (dto.rescheduled && dto.rescheduledDate) {
    validateFutureDate(dto.rescheduledDate, 'rescheduledDate');
  }
}

// ========================================
// RISK ASSESSMENT VALIDATORS
// ========================================

export function validateCreateRiskAssessment(dto: any): void {
  // Required fields
  validateRequired(dto.childId, 'childId');
  validateRequired(dto.familyMemberId, 'familyMemberId');
  validateRequired(dto.organizationId, 'organizationId');
  validateRequired(dto.overallRiskLevel, 'overallRiskLevel');
  validateRequired(dto.riskSummary, 'riskSummary');
  validateRequired(dto.contactRecommended, 'contactRecommended');
  validateRequired(dto.recommendationRationale, 'recommendationRationale');
  validateRequired(dto.assessedBy, 'assessedBy');

  // Validate overall risk level
  validateEnum(dto.overallRiskLevel, RiskLevel, 'overallRiskLevel');

  // Validate risk score is within range if provided
  if (dto.overallRiskScore !== undefined) {
    if (dto.overallRiskScore < 0 || dto.overallRiskScore > 100) {
      throw new ValidationError('overallRiskScore', 'Risk score must be between 0 and 100');
    }
  }

  // Validate identified risks if provided
  if (dto.identifiedRisks) {
    dto.identifiedRisks.forEach((risk: any, index: number) => {
      if (!risk.category) {
        throw new ValidationError(`identifiedRisks[${index}].category`, 'Risk category is required');
      }
      if (!risk.riskLevel) {
        throw new ValidationError(`identifiedRisks[${index}].riskLevel`, 'Risk level is required');
      }
      validateEnum(risk.riskLevel, RiskLevel, `identifiedRisks[${index}].riskLevel`);
      if (!risk.description) {
        throw new ValidationError(`identifiedRisks[${index}].description`, 'Risk description is required');
      }
      if (!risk.likelihood) {
        throw new ValidationError(`identifiedRisks[${index}].likelihood`, 'Likelihood is required');
      }
      if (!risk.impact) {
        throw new ValidationError(`identifiedRisks[${index}].impact`, 'Impact is required');
      }
    });
  }

  // Validate mitigation strategies if provided
  if (dto.mitigationStrategies) {
    dto.mitigationStrategies.forEach((strategy: any, index: number) => {
      if (!strategy.strategy) {
        throw new ValidationError(`mitigationStrategies[${index}].strategy`, 'Strategy is required');
      }
      if (!strategy.targetRisk) {
        throw new ValidationError(`mitigationStrategies[${index}].targetRisk`, 'Target risk is required');
      }
      if (!strategy.implementation) {
        throw new ValidationError(`mitigationStrategies[${index}].implementation`, 'Implementation is required');
      }
      if (!strategy.responsiblePerson) {
        throw new ValidationError(`mitigationStrategies[${index}].responsiblePerson`, 'Responsible person is required');
      }
    });
  }

  // Validate supervision recommendation if provided
  if (dto.supervisionRecommendation) {
    validateEnum(dto.supervisionRecommendation, SupervisionLevel, 'supervisionRecommendation');
  }

  // Validate review frequency is positive if provided
  if (dto.reviewFrequencyMonths !== undefined && dto.reviewFrequencyMonths <= 0) {
    throw new ValidationError('reviewFrequencyMonths', 'Review frequency must be greater than 0');
  }
}

export function validateApproveRiskAssessment(dto: any): void {
  validateRequired(dto.approvedByName, 'approvedByName');
  validateRequired(dto.approvedByRole, 'approvedByRole');
}
