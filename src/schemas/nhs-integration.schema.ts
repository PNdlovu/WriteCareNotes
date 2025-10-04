import { EventEmitter2 } from "eventemitter2";

import Joi from 'joi';

/**
 * NHS Integration Validation Schemas
 * 
 * Comprehensive validation schemas for NHS Digital and GP Connect integration
 * Ensures data integrity and FHIR R4 compliance
 */

// NHS Credentials Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const nhsCredentialsSchema = Joi.object({
  clientId: Joi.string().required().min(10).max(100)
    .description('NHS Digital client ID'),
  clientSecret: Joi.string().required().min(20).max(200)
    .description('NHS Digital client secret'),
  asid: Joi.string().required().pattern(/^\d{12}$/)
    .description('NHS ASID (Accredited System ID) - 12 digits'),
  odsCode: Joi.string().required().pattern(/^[A-Z0-9]{3,5}$/)
    .description('Organization ODS code')
});

// FHIR Coding Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const fhirCodingSchema = Joi.object({
  system: Joi.string().uri().required()
    .description('Code system URL'),
  code: Joi.string().required()
    .description('Code value'),
  display: Joi.string().required()
    .description('Display name'),
  version: Joi.string().optional()
    .description('Code system version')
});

// FHIR CodeableConcept Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const fhirCodeableConceptSchema = Joi.object({
  coding: Joi.array().items(fhirCodingSchema).min(1).required()
    .description('Array of coding elements'),
  text: Joi.string().optional()
    .description('Plain text representation')
});

// Care Record Section Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const careRecordSectionSchema = Joi.object({
  title: Joi.string().required().min(1).max(200)
    .description('Section title'),
  code: fhirCodeableConceptSchema.required()
    .description('Section code'),
  text: Joi.string().required().min(1)
    .description('Section text content'),
  entry: Joi.array().items(Joi.object()).optional()
    .description('Section entries')
});

// Care Record Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const careRecordSchema = Joi.object({
  patientId: Joi.string().required().pattern(/^[a-zA-Z0-9-]+$/)
    .description('Patient identifier'),
  authorId: Joi.string().required().pattern(/^[a-zA-Z0-9-]+$/)
    .description('Author identifier'),
  date: Joi.string().isoDate().required()
    .description('Record date in ISO format'),
  type: fhirCodeableConceptSchema.required()
    .description('Record type'),
  sections: Joi.array().items(careRecordSectionSchema).min(1).required()
    .description('Care record sections')
});

// Medication Timing Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const medicationTimingSchema = Joi.object({
  frequency: Joi.number().integer().min(1).max(10).required()
    .description('Frequency of administration'),
  period: Joi.number().integer().min(1).max(365).required()
    .description('Period value'),
  periodUnit: Joi.string().valid('h', 'd', 'wk', 'mo', 'a').required()
    .description('Period unit (h=hour, d=day, wk=week, mo=month, a=year)')
});

// Medication Details Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const medicationDetailsSchema = Joi.object({
  id: Joi.string().required().pattern(/^[a-zA-Z0-9-]+$/)
    .description('Medication identifier'),
  name: Joi.string().required().min(1).max(200)
    .description('Medication name'),
  snomedCode: Joi.string().required().pattern(/^\d{6,18}$/)
    .description('SNOMED CT code'),
  dosageInstructions: Joi.string().required().min(1).max(500)
    .description('Dosage instructions'),
  timing: medicationTimingSchema.required()
    .description('Timing information'),
  route: Joi.string().optional().max(100)
    .description('Route of administration'),
  status: Joi.string().valid('active', 'inactive', 'entered-in-error', 'stopped', 'draft', 'unknown').required()
    .description('Medication status')
});

// Medication Transfer Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const medicationTransferSchema = Joi.object({
  patientId: Joi.string().required().pattern(/^[a-zA-Z0-9-]+$/)
    .description('Patient identifier'),
  transferType: Joi.string().valid('admission', 'discharge', 'transfer').required()
    .description('Type of transfer'),
  sourceOrganization: Joi.string().required().pattern(/^[A-Z0-9]{3,5}$/)
    .description('Source organization ODS code'),
  targetOrganization: Joi.string().required().pattern(/^[A-Z0-9]{3,5}$/)
    .description('Target organization ODS code'),
  medications: Joi.array().items(medicationDetailsSchema).min(1).required()
    .description('List of medications to transfer'),
  transferDate: Joi.string().isoDate().required()
    .description('Transfer date in ISO format'),
  clinicalNotes: Joi.string().optional().max(2000)
    .description('Additional clinical notes')
});

// DSCR Record Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const dscrRecordSchema = Joi.object({
  patientId: Joi.string().required().pattern(/^[a-zA-Z0-9-]+$/)
    .description('Patient identifier'),
  date: Joi.string().isoDate().required()
    .description('Record date in ISO format'),
  sections: Joi.array().items(careRecordSectionSchema).min(1).required()
    .description('Record sections')
});

// DSCR Data Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const dscrDataSchema = Joi.object({
  facilityId: Joi.string().required().pattern(/^[a-zA-Z0-9-]+$/)
    .description('Facility identifier'),
  submissionType: Joi.string().valid('initial', 'update', 'correction', 'final').required()
    .description('Type of DSCR submission'),
  records: Joi.array().items(dscrRecordSchema).min(1).max(1000).required()
    .description('Array of DSCR records'),
  metadata: Joi.object({
    submittedBy: Joi.string().required()
      .description('ID of user submitting the data'),
    submissionDate: Joi.string().isoDate().required()
      .description('Submission date in ISO format'),
    version: Joi.string().pattern(/^\d+\.\d+$/).required()
      .description('DSCR version (e.g., "1.0")')
  }).optional().description('Submission metadata')
});

// NHS Number Validation Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const nhsNumberSchema = Joi.string()
  .pattern(/^\d{10}$/)
  .custom((value, helpers) => {
    // NHS number checksum validation
    const digits = value.split('').map(Number);
    const checkDigit = digits.pop();
    
    let total = 0;
    for (let i = 0; i < 9; i++) {
      total += digits[i] || 0 * (10 - i);
    }
    
    const remainder = total % 11;
    const calculatedCheckDigit = remainder === 0 ? 0 : 11 - remainder;
    
    if (calculatedCheckDigit === 10 || calculatedCheckDigit !== checkDigit) {
      return helpers.error('any.invalid');
    }
    
    return value;
  }, 'NHS number validation')
  .required()
  .description('Valid NHS number (10 digits with valid checksum)');

// Patient Search Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const patientSearchSchema = Joi.object({
  nhsNumber: nhsNumberSchema.optional(),
  familyName: Joi.string().min(2).max(50).optional(),
  givenName: Joi.string().min(1).max(50).optional(),
  birthDate: Joi.string().isoDate().optional(),
  gender: Joi.string().valid('male', 'female', 'other', 'unknown').optional(),
  postcode: Joi.string().pattern(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i).optional()
}).or('nhsNumber', 'familyName', 'givenName')
  .description('Patient search criteria - must include at least one search parameter');

// GP Connect Query Parameters Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const gpConnectQuerySchema = Joi.object({
  includeResolvedAllergies: Joi.boolean().optional().default(false)
    .description('Include resolved allergies in the response'),
  includePrescriptionIssues: Joi.boolean().optional().default(true)
    .description('Include prescription issues in the response'),
  includeConsultations: Joi.boolean().optional().default(true)
    .description('Include consultation records'),
  includeProblems: Joi.boolean().optional().default(true)
    .description('Include problem records'),
  includeImmunisations: Joi.boolean().optional().default(false)
    .description('Include immunisation records'),
  includeUncategorisedData: Joi.boolean().optional().default(false)
    .description('Include uncategorised data'),
  includeInvestigations: Joi.boolean().optional().default(false)
    .description('Include investigation results'),
  includeReferrals: Joi.boolean().optional().default(false)
    .description('Include referral records'),
  timePeriod: Joi.object({
    start: Joi.string().isoDate().required()
      .description('Start date for data retrieval'),
    end: Joi.string().isoDate().required()
      .description('End date for data retrieval')
  }).optional().description('Time period for data retrieval')
});

// Integration Configuration Schema
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const integrationConfigSchema = Joi.object({
  enabled: Joi.boolean().required()
    .description('Enable NHS integration'),
  gpConnectEndpoint: Joi.string().uri().required()
    .description('GP Connect API endpoint'),
  eRedBagEndpoint: Joi.string().uri().required()
    .description('eRedBag API endpoint'),
  dscrEndpoint: Joi.string().uri().required()
    .description('DSCR API endpoint'),
  autoSyncInterval: Joi.number().integer().min(5).max(1440).required()
    .description('Auto-sync interval in minutes (5-1440)'),
  realTimeUpdates: Joi.boolean().required()
    .description('Enable real-time updates'),
  retryAttempts: Joi.number().integer().min(1).max(10).optional().default(3)
    .description('Number of retry attempts for failed requests'),
  timeoutMs: Joi.number().integer().min(1000).max(60000).optional().default(30000)
    .description('Request timeout in milliseconds')
});

// Audit Log Schema for NHS Operations
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
/**
 * TODO: Add proper documentation
 */
export const nhsAuditSchema = Joi.object({
  operation: Joi.string().required()
    .description('NHS operation performed'),
  patientId: Joi.string().optional()
    .description('Patient identifier (if applicable)'),
  userId: Joi.string().required()
    .description('User performing the operation'),
  timestamp: Joi.string().isoDate().required()
    .description('Operation timestamp'),
  success: Joi.boolean().required()
    .description('Operation success status'),
  details: Joi.object().optional()
    .description('Additional operation details'),
  errorMessage: Joi.string().optional()
    .description('Error message if operation failed')
});

// Export all schemas
export {
  fhirCodingSchema,
  fhirCodeableConceptSchema,
  careRecordSectionSchema,
  medicationTimingSchema,
  medicationDetailsSchema,
  dscrRecordSchema,
  patientSearchSchema,
  gpConnectQuerySchema,
  integrationConfigSchema,
  nhsAuditSchema
};