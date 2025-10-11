/**
 * @fileoverview Express middleware for comprehensive request validation
 * @module Validation-middleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Express middleware for comprehensive request validation
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Request Validation Middleware
 * @module ValidationMiddleware
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express middleware for comprehensive request validation
 * with schema validation and sanitization.
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Validation schemas
const validationSchemas = {
  createSafeguardingAlert: Joi.object({
    residentId: Joi.string().uuid().required(),
    alertType: Joi.string().valid(
      'physical_abuse', 'emotional_abuse', 'sexual_abuse', 'financial_abuse', 
      'neglect', 'discrimination', 'institutional_abuse', 'domestic_violence',
      'modern_slavery', 'self_neglect', 'cyberbullying', 'mate_crime'
    ).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical', 'emergency').required(),
    source: Joi.string().valid(
      'staff_observation', 'resident_disclosure', 'family_concern', 'visitor_report',
      'healthcare_professional', 'external_agency', 'automated_detection', 'whistleblower', 'anonymous_report'
    ).required(),
    description: Joi.string().min(10).max(5000).required(),
    circumstances: Joi.string().max(5000).optional(),
    incidentDateTime: Joi.date().required(),
    incidentLocation: Joi.string().max(200).optional(),
    reportedBy: Joi.string().uuid().required(),
    reportedByName: Joi.string().min(2).max(100).required(),
    reportedByRole: Joi.string().min(2).max(50).required(),
    witnessIds: Joi.array().items(Joi.string().uuid()).optional(),
    witnessNames: Joi.array().items(Joi.string().min(2).max(100)).optional(),
    immediateActionsRequired: Joi.array().items(Joi.string().max(200)).optional()
  }),

  createConsent: Joi.object({
    residentId: Joi.string().uuid().required(),
    consentType: Joi.string().valid(
      'care_treatment', 'data_processing', 'photography_video', 'medical_research',
      'marketing_communications', 'data_sharing', 'emergency_contact', 'family_involvement',
      'social_media', 'cctv_monitoring', 'medication_administration', 'personal_care',
      'mental_health_treatment', 'end_of_life_care', 'advance_directives', 'dnacpr',
      'organ_donation', 'post_mortem', 'financial_management', 'advocacy_services'
    ).required(),
    lawfulBasis: Joi.string().valid(
      'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    ).required(),
    specialCategoryBasis: Joi.string().valid(
      'explicit_consent', 'employment_law', 'vital_interests', 'legitimate_activities',
      'public_disclosure', 'legal_claims', 'substantial_public_interest', 'healthcare',
      'public_health', 'archiving_research'
    ).optional(),
    consentGivenBy: Joi.string().valid(
      'resident', 'power_of_attorney', 'court_appointed_deputy', 'next_of_kin',
      'advocate', 'best_interests_decision', 'emergency_consent'
    ).required(),
    consentGivenByName: Joi.string().min(2).max(100).required(),
    consentDescription: Joi.string().min(10).max(2000).required(),
    expiryDate: Joi.date().greater('now').optional(),
    capacityAssessment: Joi.object().required(),
    consentEvidence: Joi.object().required()
  }),

  createDocument: Joi.object({
    documentName: Joi.string().min(2).max(200).required(),
    documentType: Joi.string().valid(
      'care_plan', 'medical_record', 'policy', 'procedure', 'training_material',
      'regulatory_document', 'contract', 'incident_report'
    ).required(),
    contentType: Joi.string().valid('text', 'pdf', 'image', 'video', 'audio').required(),
    metadata: Joi.object({
      author: Joi.string().min(2).max(100).required(),
      department: Joi.string().min(2).max(100).required(),
      confidentiality: Joi.string().valid('public', 'internal', 'confidential', 'restricted').required(),
      tags: Joi.array().items(Joi.string().min(1).max(50)).required(),
      relatedEntities: Joi.array().items(Joi.string().uuid()).optional()
    }).required(),
    processingOptions: Joi.object({
      aiAnalysis: Joi.boolean().default(true),
      contentExtraction: Joi.boolean().default(true),
      qualityAssessment: Joi.boolean().default(true),
      complianceValidation: Joi.boolean().default(true),
      automaticClassification: Joi.boolean().default(true)
    }).optional(),
    workflowOptions: Joi.object({
      requiresApproval: Joi.boolean().default(false),
      approvers: Joi.array().items(Joi.string().uuid()).optional(),
      reviewCycle: Joi.number().min(1).max(120).default(12), // months
      retentionPeriod: Joi.number().min(1).max(50).default(7), // years
      accessControls: Joi.array().optional()
    }).optional()
  }),

  updateDocument: Joi.object({
    documentName: Joi.string().min(2).max(200).optional(),
    changeDescription: Joi.string().min(5).max(500).required(),
    majorChange: Joi.boolean().required(),
    metadata: Joi.object().optional()
  }),

  approveDocument: Joi.object({
    approvalComments: Joi.string().max(1000).optional(),
    digitalSignature: Joi.string().required()
  }),

  createDocumentVersion: Joi.object({
    changeDescription: Joi.string().min(5).max(500).required(),
    majorChange: Joi.boolean().required(),
    reviewRequired: Joi.boolean().default(false)
  }),

  archiveDocument: Joi.object({
    archiveReason: Joi.string().min(5).max(500).required(),
    retentionOverride: Joi.number().min(1).max(50).optional()
  }),

  semanticSearch: Joi.object({
    query: Joi.string().min(1).max(500).required(),
    documentTypes: Joi.array().items(Joi.string()).optional(),
    confidentialityLevels: Joi.array().items(Joi.string().valid('public', 'internal', 'confidential', 'restricted')).optional(),
    dateRange: Joi.object({
      from: Joi.date().required(),
      to: Joi.date().greater(Joi.ref('from')).required()
    }).optional(),
    maxResults: Joi.number().min(1).max(100).default(50)
  }),

  createEmergencyIncident: Joi.object({
    emergencyType: Joi.string().valid(
      'medical', 'fire', 'security', 'behavioral', 'safeguarding',
      'environmental', 'technical', 'evacuation', 'lockdown', 'external_threat'
    ).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical', 'catastrophic').required(),
    location: Joi.string().min(2).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    reportedBy: Joi.string().uuid().required(),
    reportedByName: Joi.string().min(2).max(100).required(),
    affectedResidents: Joi.array().items(Joi.string().uuid()).optional(),
    immediateActions: Joi.array().items(Joi.string().max(200)).optional()
  }),

  createNurseCall: Joi.object({
    residentId: Joi.string().uuid().required(),
    callType: Joi.string().valid(
      'assistance_request', 'medical_emergency', 'bathroom_assistance', 'medication_request',
      'pain_management', 'comfort_assistance', 'mobility_assistance', 'emotional_support',
      'technical_issue', 'safety_concern', 'fall_alert', 'wandering_alert',
      'medication_overdue', 'vital_signs_alert', 'behavioral_concern'
    ).required(),
    priority: Joi.string().valid('routine', 'standard', 'high', 'urgent', 'emergency').required(),
    location: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
    deviceId: Joi.string().max(100).optional()
  }),

  resolveNurseCall: Joi.object({
    notes: Joi.string().min(5).max(1000).required(),
    followUpRequired: Joi.boolean().optional()
  }),

  updateOnCallRota: Joi.object({
    staffId: Joi.string().uuid().required(),
    staffName: Joi.string().min(2).max(100).required(),
    role: Joi.string().valid(
      'primary', 'secondary', 'manager', 'senior_nurse', 'registered_nurse',
      'senior_carer', 'maintenance', 'security', 'clinical_lead'
    ).required(),
    shiftStart: Joi.date().required(),
    shiftEnd: Joi.date().greater(Joi.ref('shiftStart')).required(),
    contactDetails: Joi.object({
      primary: Joi.object({
        method: Joi.string().valid('mobile', 'landline', 'pager', 'radio', 'email', 'sms', 'mobile_app').required(),
        value: Joi.string().required(),
        priority: Joi.number().min(1).max(10).required()
      }).required(),
      secondary: Joi.object({
        method: Joi.string().valid('mobile', 'landline', 'pager', 'radio', 'email', 'sms', 'mobile_app').required(),
        value: Joi.string().required(),
        priority: Joi.number().min(1).max(10).required()
      }).optional(),
      emergency: Joi.object({
        method: Joi.string().valid('mobile', 'landline', 'pager', 'radio', 'email', 'sms', 'mobile_app').required(),
        value: Joi.string().required(),
        priority: Joi.number().min(1).max(10).required()
      }).required()
    }).required(),
    capabilities: Joi.object({
      emergencyTypes: Joi.array().items(Joi.string()).required(),
      specializations: Joi.array().items(Joi.string()).required(),
      certifications: Joi.array().items(Joi.string()).required(),
      equipmentAccess: Joi.array().items(Joi.string()).required(),
      responseRadius: Joi.number().min(0).max(50).required(), // km
      maxResponseTime: Joi.number().min(1).max(60).required() // minutes
    }).required()
  })
};

/**
 * Validation middleware factory
 */
export const validationMiddleware = (schemaName: keyof typeof validationSchemas) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const schema = validationSchemas[schemaName];
      if (!schema) {
        return res.status(500).json({
          success: false,
          error: `Validation schema not found: ${schemaName}`,
          code: 'SCHEMA_NOT_FOUND'
        });
      }

      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        });
      }

      // Replace request body with validated and sanitized data
      req.body = value;
      next();
    } catch (error: unknown) {
      console.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during validation',
        code: 'VALIDATION_MIDDLEWARE_ERROR'
      });
    }
  };
};