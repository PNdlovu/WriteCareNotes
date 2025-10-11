/**
 * @fileoverview REST API controller for care plan management with comprehensive
 * @module Care-planning/CarePlanController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for care plan management with comprehensive
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Care Plan Controller for WriteCareNotes
 * @module CarePlanController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description REST API controller for care plan management with comprehensive
 * validation, error handling, and healthcare compliance.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * 
 * @security
 * - Implements comprehensive input validation
 * - Role-based access control integration
 * - Audit trail logging for all operations
 */

import { Request, Response, NextFunction } from 'express';
import { validate } from 'class-validator';
import Joi from 'joi';
import { CarePlanService, CreateCarePlanRequest, UpdateCarePlanRequest, CarePlanApprovalRequest, CarePlanValidationError, CarePlanNotFoundError, CarePlanApprovalError } from '../../services/care-planning/CarePlanService';
import { CarePlanType, CarePlanStatus, ReviewFrequency } from '../../entities/care-planning/CarePlan';
import { AuthenticatedRequest } from '../../middleware/auth-middleware';
import { logger } from '../../utils/logger';

export interface CarePlanResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
    correlationId: string;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    version: string;
  };
}

// Validation schemas
const createCarePlanSchema = Joi.object({
  residentId: Joi.string().uuid().required()
    .messages({
      'string.uuid': 'Resident ID must be a valid UUID',
      'any.required': 'Resident ID is required'
    }),
  planName: Joi.string().min(1).max(255).required()
    .messages({
      'string.min': 'Plan name cannot be empty',
      'string.max': 'Plan name cannot exceed 255 characters',
      'any.required': 'Plan name is required'
    }),
  planType: Joi.string().valid(...Object.values(CarePlanType)).required()
    .messages({
      'any.only': 'Plan type must be one of: initial, review, emergency, discharge',
      'any.required': 'Plan type is required'
    }),
  reviewFrequency: Joi.string().valid(...Object.values(ReviewFrequency)).required()
    .messages({
      'any.only': 'Review frequency must be one of: weekly, monthly, quarterly, annually',
      'any.required': 'Review frequency is required'
    }),
  effectiveFrom: Joi.date().iso().required()
    .messages({
      'date.format': 'Effective from date must be in ISO format',
      'any.required': 'Effective from date is required'
    }),
  careGoals: Joi.array().items(
    Joi.object({
      description: Joi.string().min(1).max(1000).required(),
      category: Joi.string().min(1).max(100).required(),
      targetDate: Joi.date().iso().required(),
      status: Joi.string().valid('active', 'achieved', 'modified', 'discontinued').default('active'),
      measurableOutcome: Joi.string().min(1).max(500).required(),
      responsibleStaff: Joi.array().items(Joi.string().uuid()).min(1).required()
    })
  ).optional(),
  riskAssessments: Joi.array().items(
    Joi.object({
      riskType: Joi.string().min(1).max(100).required(),
      riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
      description: Joi.string().min(1).max(1000).required(),
      mitigationStrategies: Joi.array().items(Joi.string().min(1).max(500)).min(1).required(),
      reviewDate: Joi.date().iso().required(),
      assessedBy: Joi.string().uuid().required()
    })
  ).optional(),
  emergencyProcedures: Joi.array().items(Joi.object()).optional(),
  residentPreferences: Joi.array().items(Joi.object()).optional()
});

const updateCarePlanSchema = Joi.object({
  planName: Joi.string().min(1).max(255).optional(),
  reviewFrequency: Joi.string().valid(...Object.values(ReviewFrequency)).optional(),
  effectiveFrom: Joi.date().iso().optional(),
  effectiveTo: Joi.date().iso().optional(),
  careGoals: Joi.array().items(Joi.object()).optional(),
  riskAssessments: Joi.array().items(Joi.object()).optional(),
  emergencyProcedures: Joi.array().items(Joi.object()).optional(),
  residentPreferences: Joi.array().items(Joi.object()).optional()
});

const approveCarePlanSchema = Joi.object({
  approvalNotes: Joi.string().max(1000).optional(),
  effectiveFrom: Joi.date().iso().optional()
});

const searchCarePlansSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  residentId: Joi.string().uuid().optional(),
  status: Joi.string().valid(...Object.values(CarePlanStatus)).optional(),
  planType: Joi.string().valid(...Object.values(CarePlanType)).optional(),
  reviewDueBefore: Joi.date().iso().optional(),
  createdBy: Joi.string().uuid().optional(),
  approvedBy: Joi.string().uuid().optional(),
  isOverdueForReview: Joi.boolean().optional(),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional()
});

export class CarePlanController {
  constructor(private carePlanService: CarePlanService) {}

  /**
   * Create a new care plan
   */
  async createCarePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-create-${Date.now()}`;
    
    try {
      console.info('Creating care plan', { 
        userId: req.user?.id,
        correlationId 
      });

      // Validate request body
      const { error, value } = createCarePlanSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            })),
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Create care plan request
      const createRequest: CreateCarePlanRequest = {
        ...value,
        createdBy: req.user!.id
      };

      // Create care plan
      const carePlan = await this.carePlanService.createCarePlan(createRequest);

      const response: CarePlanResponse = {
        success: true,
        data: carePlan.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(201).json(response);

    } catch (error: unknown) {
      console.error('Failed to create care plan', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      if (error instanceof CarePlanValidationError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_VALIDATION_ERROR',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            details: error.validationErrors,
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(422).json(response);
        return;
      }

      next(error);
    }
  }

  /**
   * Get care plan by ID
   */
  async getCarePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-get-${Date.now()}`;
    
    try {
      const { id } = req.params;
      const includeRelations = req.query['include'] === 'relations';

      // Validate UUID format
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid care plan ID format',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      const carePlan = await this.carePlanService.getCarePlanById(id, includeRelations);

      if (!carePlan) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_NOT_FOUND',
            message: 'Care plan not found',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(404).json(response);
        return;
      }

      const response: CarePlanResponse = {
        success: true,
        data: carePlan.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to get care plan', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        carePlanId: req.params['id'],
        userId: req.user?.id,
        correlationId 
      });
      next(error);
    }
  }

  /**
   * Search care plans with filters
   */
  async searchCarePlans(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-search-${Date.now()}`;
    
    try {
      // Validate query parameters
      const { error, value } = searchCarePlansSchema.validate(req.query, { abortEarly: false });
      if (error) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            })),
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      const { page, limit, ...filters } = value;

      // Search care plans
      const result = await this.carePlanService.searchCarePlans(filters, page, limit);

      const response: CarePlanResponse = {
        success: true,
        data: result.carePlans.map(plan => plan.toJSON()),
        meta: {
          pagination: {
            page,
            limit,
            total: result.total,
            totalPages: result.totalPages
          },
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to search care plans', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });
      next(error);
    }
  }

  /**
   * Update care plan
   */
  async updateCarePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-update-${Date.now()}`;
    
    try {
      const { id } = req.params;

      // Validate UUID format
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid care plan ID format',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Validate request body
      const { error, value } = updateCarePlanSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            })),
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Create update request
      const updateRequest: UpdateCarePlanRequest = {
        ...value,
        updatedBy: req.user!.id
      };

      // Update care plan
      const carePlan = await this.carePlanService.updateCarePlan(id, updateRequest);

      const response: CarePlanResponse = {
        success: true,
        data: carePlan.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to update care plan', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        carePlanId: req.params['id'],
        userId: req.user?.id,
        correlationId 
      });

      if (error instanceof CarePlanNotFoundError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_NOT_FOUND',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(404).json(response);
        return;
      }

      if (error instanceof CarePlanValidationError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_VALIDATION_ERROR',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            details: error.validationErrors,
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(422).json(response);
        return;
      }

      next(error);
    }
  }

  /**
   * Approve care plan
   */
  async approveCarePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-approve-${Date.now()}`;
    
    try {
      const { id } = req.params;

      // Validate UUID format
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid care plan ID format',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Validate request body
      const { error, value } = approveCarePlanSchema.validate(req.body, { abortEarly: false });
      if (error) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.details.map(detail => ({
              field: detail.path.join('.'),
              message: detail.message,
              value: detail.context?.value
            })),
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Create approval request
      const approvalRequest: CarePlanApprovalRequest = {
        ...value,
        approvedBy: req.user!.id
      };

      // Approve care plan
      const carePlan = await this.carePlanService.approveCarePlan(id, approvalRequest);

      const response: CarePlanResponse = {
        success: true,
        data: carePlan.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to approve care plan', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        carePlanId: req.params['id'],
        userId: req.user?.id,
        correlationId 
      });

      if (error instanceof CarePlanNotFoundError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_NOT_FOUND',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(404).json(response);
        return;
      }

      if (error instanceof CarePlanApprovalError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_APPROVAL_ERROR',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(422).json(response);
        return;
      }

      next(error);
    }
  }

  /**
   * Archive care plan
   */
  async archiveCarePlan(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-archive-${Date.now()}`;
    
    try {
      const { id } = req.params;
      const { reason } = req.body;

      // Validate UUID format
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid care plan ID format',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      // Archive care plan
      const carePlan = await this.carePlanService.archiveCarePlan(id, req.user!.id, reason);

      const response: CarePlanResponse = {
        success: true,
        data: carePlan.toJSON(),
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to archive care plan', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        carePlanId: req.params['id'],
        userId: req.user?.id,
        correlationId 
      });

      if (error instanceof CarePlanNotFoundError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_NOT_FOUND',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(404).json(response);
        return;
      }

      next(error);
    }
  }

  /**
   * Get care plans due for review
   */
  async getCarePlansDueForReview(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-due-review-${Date.now()}`;
    
    try {
      const daysAhead = parseInt(req.query['daysAhead'] as string) || 7;

      if (daysAhead < 0 || daysAhead > 365) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Days ahead must be between 0 and 365',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      const carePlans = await this.carePlanService.getCarePlansDueForReview(daysAhead);

      const response: CarePlanResponse = {
        success: true,
        data: carePlans.map(plan => plan.toJSON()),
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to get care plans due for review', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });
      next(error);
    }
  }

  /**
   * Get care plan version history
   */
  async getCarePlanVersionHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || `care-plan-history-${Date.now()}`;
    
    try {
      const { id } = req.params;

      // Validate UUID format
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'INVALID_ID',
            message: 'Invalid care plan ID format',
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(400).json(response);
        return;
      }

      const versionHistory = await this.carePlanService.getCarePlanVersionHistory(id);

      const response: CarePlanResponse = {
        success: true,
        data: {
          currentVersion: versionHistory.currentVersion.toJSON(),
          previousVersions: versionHistory.previousVersions.map(v => v.toJSON()),
          versionHistory: versionHistory.versionHistory
        },
        meta: {
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      res.status(200).json(response);

    } catch (error: unknown) {
      console.error('Failed to get care plan version history', { 
        error: error instanceof Error ? error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" : 'Unknown error',
        carePlanId: req.params['id'],
        userId: req.user?.id,
        correlationId 
      });

      if (error instanceof CarePlanNotFoundError) {
        const response: CarePlanResponse = {
          success: false,
          error: {
            code: 'CARE_PLAN_NOT_FOUND',
            message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
            correlationId
          },
          meta: {
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          }
        };
        res.status(404).json(response);
        return;
      }

      next(error);
    }
  }
}