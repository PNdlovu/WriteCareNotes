/**
 * @fileoverview Family Portal Validation Schemas
 * @module family-portal.schemas
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Validation schemas for family portal API endpoints
 */

import Joi from 'joi';

export const familyPortalSchemas = {
  getUpdates: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      limit: Joi.number().integer().min(1).max(100).default(10),
      type: Joi.string().valid('care', 'medical', 'activity', 'meal', 'social', 'incident').optional(),
    }),
  },

  submitConsent: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      consentType: Joi.string().valid(
        'photo_sharing',
        'medical_information_sharing',
        'emergency_contact_authorization',
        'care_plan_access',
        'video_call_participation',
        'data_processing',
        'marketing_communications'
      ).required(),
      granted: Joi.boolean().required(),
      digitalSignature: Joi.object({
        signature: Joi.string().required(),
        timestamp: Joi.date().required(),
        certificate: Joi.string().optional(),
      }).required(),
      witnessId: Joi.string().uuid().optional(),
      additionalNotes: Joi.string().max(500).optional(),
    }),
  },

  sendMessage: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      subject: Joi.string().min(1).max(200).required(),
      content: Joi.string().min(1).max(2000).required(),
      priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
      attachments: Joi.array().items(
        Joi.object({
          fileName: Joi.string().required(),
          fileType: Joi.string().required(),
          fileSize: Joi.number().max(10 * 1024 * 1024), // 10MB max
          content: Joi.string().base64().optional(),
        })
      ).max(5).optional(),
    }),
  },

  getCarePlan: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
    }),
  },

  getActivities: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      date: Joi.date().iso().optional(),
      days: Joi.number().integer().min(1).max(30).default(7),
    }),
  },

  getWellbeing: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      date: Joi.date().iso().optional(),
    }),
  },

  requestVideoCall: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      preferredTime: Joi.date().iso().greater('now').required(),
      duration: Joi.number().integer().min(15).max(120).default(30), // 15-120 minutes
      participants: Joi.array().items(Joi.string().email()).min(1).max(5).required(),
      reason: Joi.string().max(200).optional(),
      specialRequirements: Joi.string().max(500).optional(),
    }),
  },

  getMessages: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      limit: Joi.number().integer().min(1).max(100).default(20),
      unreadOnly: Joi.boolean().default(false),
    }),
  },

  submitFeedback: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      type: Joi.string().valid(
        'care_quality',
        'communication',
        'services',
        'facilities',
        'staff',
        'general'
      ).required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      comments: Joi.string().min(1).max(1000).required(),
      suggestions: Joi.string().max(500).optional(),
      anonymous: Joi.boolean().default(false),
      category: Joi.string().valid(
        'compliment',
        'suggestion',
        'complaint',
        'question'
      ).optional(),
    }),
  },

  getNotifications: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      limit: Joi.number().integer().min(1).max(50).default(10),
      unreadOnly: Joi.boolean().default(false),
      type: Joi.string().valid(
        'care_update',
        'medical_alert',
        'appointment_reminder',
        'emergency',
        'general'
      ).optional(),
    }),
  },

  getDocuments: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      documentType: Joi.string().valid(
        'care_plan',
        'medical_report',
        'assessment',
        'consent_form',
        'general'
      ).optional(),
      limit: Joi.number().integer().min(1).max(50).default(20),
    }),
  },

  updatePreferences: {
    body: Joi.object({
      communicationPreferences: Joi.object({
        preferredMethod: Joi.string().valid('email', 'sms', 'phone', 'portal').required(),
        frequency: Joi.string().valid('daily', 'weekly', 'monthly', 'as_needed').required(),
        emergencyOnly: Joi.boolean().default(false),
        language: Joi.string().length(2).default('en'),
        timezone: Joi.string().default('UTC'),
      }).required(),
      notificationSettings: Joi.object({
        carePlanUpdates: Joi.boolean().default(true),
        healthStatusChanges: Joi.boolean().default(true),
        medicationChanges: Joi.boolean().default(true),
        appointmentReminders: Joi.boolean().default(true),
        emergencyAlerts: Joi.boolean().default(true),
        photoUpdates: Joi.boolean().default(true),
        activityUpdates: Joi.boolean().default(true),
        videoCallRequests: Joi.boolean().default(true),
      }).required(),
      privacySettings: Joi.object({
        sharePhotos: Joi.boolean().default(true),
        shareHealthData: Joi.boolean().default(true),
        shareActivityData: Joi.boolean().default(true),
        shareLocationData: Joi.boolean().default(false),
        allowStaffContact: Joi.boolean().default(true),
        allowVideoCalls: Joi.boolean().default(true),
      }).required(),
      meetingPreferences: Joi.object({
        preferredTime: Joi.string().valid('morning', 'afternoon', 'evening', 'any').default('any'),
        preferredDay: Joi.string().valid('weekday', 'weekend', 'any').default('any'),
        preferredLocation: Joi.string().valid('in_person', 'video_call', 'phone_call', 'any').default('any'),
        advanceNotice: Joi.number().integer().min(1).max(168).default(24), // 1 hour to 1 week
      }).required(),
    }),
  },
};

// Additional validation schemas for specific use cases
export const familyPortalAdvancedSchemas = {
  emergencyContact: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      contactType: Joi.string().valid('primary', 'secondary', 'emergency').required(),
      name: Joi.string().min(1).max(100).required(),
      relationship: Joi.string().min(1).max(50).required(),
      phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required(),
      email: Joi.string().email().optional(),
      address: Joi.object({
        street: Joi.string().max(100).optional(),
        city: Joi.string().max(50).optional(),
        postcode: Joi.string().max(10).optional(),
        country: Joi.string().max(50).optional(),
      }).optional(),
      available24h: Joi.boolean().default(false),
      notes: Joi.string().max(500).optional(),
    }),
  },

  visitRequest: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      visitType: Joi.string().valid('in_person', 'video_call', 'phone_call').required(),
      preferredDate: Joi.date().iso().greater('now').required(),
      preferredTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      duration: Joi.number().integer().min(15).max(240).default(60), // 15 minutes to 4 hours
      participants: Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          relationship: Joi.string().required(),
          email: Joi.string().email().optional(),
          phone: Joi.string().optional(),
        })
      ).min(1).max(10).required(),
      reason: Joi.string().max(200).optional(),
      specialRequirements: Joi.string().max(500).optional(),
      emergencyContact: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        relationship: Joi.string().required(),
      }).optional(),
    }),
  },

  photoSharing: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      photos: Joi.array().items(
        Joi.object({
          fileName: Joi.string().required(),
          fileType: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp').required(),
          fileSize: Joi.number().max(5 * 1024 * 1024), // 5MB max per photo
          content: Joi.string().base64().required(),
          caption: Joi.string().max(200).optional(),
          tags: Joi.array().items(Joi.string().max(20)).max(10).optional(),
        })
      ).min(1).max(10).required(),
      event: Joi.string().max(100).optional(),
      description: Joi.string().max(500).optional(),
      allowComments: Joi.boolean().default(true),
      allowLikes: Joi.boolean().default(true),
    }),
  },

  carePlanAccess: {
    query: Joi.object({
      residentId: Joi.string().uuid().required(),
      sections: Joi.array().items(
        Joi.string().valid(
          'overview',
          'goals',
          'medications',
          'activities',
          'dietary_requirements',
          'mobility',
          'social_needs',
          'medical_history',
          'assessments'
        )
      ).optional(),
      includeHistory: Joi.boolean().default(false),
      dateRange: Joi.object({
        startDate: Joi.date().iso().optional(),
        endDate: Joi.date().iso().optional(),
      }).optional(),
    }),
  },

  realTimeSubscription: {
    body: Joi.object({
      residentId: Joi.string().uuid().required(),
      updateTypes: Joi.array().items(
        Joi.string().valid(
          'care_plan',
          'health_status',
          'activities',
          'medications',
          'appointments',
          'incidents',
          'photos',
          'messages'
        )
      ).min(1).required(),
      notificationMethods: Joi.array().items(
        Joi.string().valid('email', 'sms', 'push', 'portal')
      ).min(1).required(),
      frequency: Joi.string().valid('immediate', 'hourly', 'daily', 'weekly').default('immediate'),
      webhookUrl: Joi.string().uri().optional(),
    }),
  },
};

// Validation middleware factory
export const createValidationMiddleware = (schema: any) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body || req.query, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
        timestamp: new Date().toISOString(),
      });
    }

    // Replace the request data with validated and sanitized data
    if (req.body) req.body = value;
    if (req.query) req.query = value;
    
    next();
  };
};

export default familyPortalSchemas;