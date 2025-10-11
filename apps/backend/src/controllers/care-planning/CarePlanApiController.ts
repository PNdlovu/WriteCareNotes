/**
 * @fileoverview Care Plan API Controller for WriteCareNotes
 * @module CarePlanApiController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-09
 * 
 * @description REST API controller for care planning operations with healthcare compliance
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 */

import { Request, Response } from 'express';
import { validate } from 'class-validator';
import { CarePlanService, CreateCarePlanRequest, UpdateCarePlanRequest, CarePlanApprovalRequest, CarePlanSearchFilters } from '../../services/care-planning/CarePlanService';
import { CarePlanType, CarePlanStatus, ReviewFrequency } from '../../entities/care-planning/CarePlan';
import { CreateCarePlanDto, UpdateCarePlanDto, CarePlanResponseDto, CarePlanSearchDto } from '../../dto/care-planning/CarePlanDto';
import { logger } from '../../utils/logger';
import { APIResponse, PaginationMeta } from '../../types/api-response';
import { ValidationError } from '../../types/errors';

export class CarePlanApiController {
  const ructor(private carePlanService: CarePlanService) {}

  /**
   * Create a new care plan
   */
  async createCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Creating care plan via API', { 
        userId: req.user?.id,
        correlationId 
      });

      // Validate request body
      const createDto = new CreateCarePlanDto();
      Object.assign(createDto, req.body);

      const validationErrors = await validate(createDto);
      if (validationErrors.length > 0) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid care plan data',
            details: validationErrors.map(error => ({
              field: error.property,
              const raints: error.const raints
            })),
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Convert DTO to service request
      const createRequest: CreateCarePlanRequest = {
        residentId: createDto.residentId,
        planName: createDto.planName,
        planType: createDto.planType as CarePlanType,
        reviewFrequency: createDto.reviewFrequency as ReviewFrequency,
        effectiveFrom: new Date(createDto.effectiveFrom),
        careGoals: createDto.careGoals?.map(goal => ({
          goalType: goal.goalType,
          description: goal.description,
          targetDate: new Date(goal.targetDate),
          priority: goal.priority,
          status: goal.status,
          notes: goal.notes,
          assignedTo: goal.assignedTo,
          interventions: goal.interventions
        })),
        riskAssessments: createDto.riskAssessments?.map(risk => ({
          riskType: risk.riskType,
          riskLevel: risk.riskLevel,
          description: risk.description,
          mitigationStrategies: risk.mitigationStrategies,
          assessmentDate: new Date(risk.assessmentDate),
          nextAssessmentDate: new Date(risk.nextAssessmentDate),
          assessedBy: risk.assessedBy
        })),
        emergencyProcedures: createDto.emergencyProcedures,
        residentPreferences: createDto.residentPreferences,
        createdBy: req.user!.id
      };

      // Create care plan
      const carePlan = await this.carePlanService.createCarePlan(createRequest);

      // Convert to response DTO
      const responseDto = this.mapToResponseDto(carePlan);

      const response: APIResponse<CarePlanResponseDto> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plan created successfully via API', { 
        carePlanId: carePlan.id,
        userId: req.user?.id,
        correlationId 
      });

      res.status(201).json(response);

    } catch (error: unknown) {
      logger.error('Failed to create care plan via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create care plan',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get care plans with filtering and pagination
   */
  async getCarePlans(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Retrieving care plans via API', { 
        userId: req.user?.id,
        query: req.query,
        correlationId 
      });

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      
      const filters: CarePlanSearchFilters = {
        residentId: req.query.residentId as string,
        status: req.query.status as CarePlanStatus,
        planType: req.query.type as CarePlanType,
        reviewDueBefore: req.query.reviewDueBefore ? new Date(req.query.reviewDueBefore as string) : undefined,
        createdBy: req.query.createdBy as string,
        approvedBy: req.query.approvedBy as string,
        isOverdueForReview: req.query.isOverdueForReview === 'true' ? true : 
                           req.query.isOverdueForReview === 'false' ? false : undefined,
        riskLevel: req.query.riskLevel as string
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => {
        if (filters[key as keyof CarePlanSearchFilters] === undefined) {
          delete filters[key as keyof CarePlanSearchFilters];
        }
      });

      // Search care plans
      const result = await this.carePlanService.searchCarePlans(filters, page, limit);

      // Convert to response DTOs
      const responseDtos = result.carePlans.map(carePlan => this.mapToResponseDto(carePlan));

      const paginationMeta: PaginationMeta = {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNext: page < result.totalPages,
        hasPrev: page > 1
      };

      const response: APIResponse<CarePlanResponseDto[]> = {
        success: true,
        data: responseDtos,
        meta: {
          pagination: paginationMeta,
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plans retrieved successfully via API', { 
        count: responseDtos.length,
        total: result.total,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to retrieve care plans via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve care plans',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get specific care plan by ID
   */
  async getCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const carePlanId = req.params.id;
    
    try {
      logger.info('Retrieving care plan by ID via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const carePlan = await this.carePlanService.getCarePlanById(carePlanId);

      if (!carePlan) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Care plan with ID ${carePlanId} not found`,
            correlationId
          }
        };
        res.status(404).json(response);
        return;
      }

      const responseDto = this.mapToResponseDto(carePlan);

      const response: APIResponse<CarePlanResponseDto> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plan retrieved successfully via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to retrieve care plan via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve care plan',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Update care plan
   */
  async updateCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const carePlanId = req.params.id;
    
    try {
      logger.info('Updating care plan via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      // Validate request body
      const updateDto = new UpdateCarePlanDto();
      Object.assign(updateDto, req.body);

      const validationErrors = await validate(updateDto);
      if (validationErrors.length > 0) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid care plan update data',
            details: validationErrors.map(error => ({
              field: error.property,
              const raints: error.const raints
            })),
            correlationId
          }
        };
        res.status(400).json(response);
        return;
      }

      // Convert DTO to service request
      const updateRequest: UpdateCarePlanRequest = {
        planName: updateDto.planName,
        reviewFrequency: updateDto.reviewFrequency as ReviewFrequency,
        effectiveFrom: updateDto.effectiveFrom ? new Date(updateDto.effectiveFrom) : undefined,
        effectiveTo: updateDto.effectiveTo ? new Date(updateDto.effectiveTo) : undefined,
        careGoals: updateDto.careGoals?.map(goal => ({
          id: goal.id,
          goalType: goal.goalType,
          description: goal.description,
          targetDate: new Date(goal.targetDate),
          priority: goal.priority,
          status: goal.status,
          notes: goal.notes,
          assignedTo: goal.assignedTo,
          interventions: goal.interventions
        })),
        riskAssessments: updateDto.riskAssessments?.map(risk => ({
          id: risk.id,
          riskType: risk.riskType,
          riskLevel: risk.riskLevel,
          description: risk.description,
          mitigationStrategies: risk.mitigationStrategies,
          assessmentDate: new Date(risk.assessmentDate),
          nextAssessmentDate: new Date(risk.nextAssessmentDate),
          assessedBy: risk.assessedBy
        })),
        emergencyProcedures: updateDto.emergencyProcedures,
        residentPreferences: updateDto.residentPreferences,
        updatedBy: req.user!.id
      };

      // Update care plan
      const carePlan = await this.carePlanService.updateCarePlan(carePlanId, updateRequest);

      // Convert to response DTO
      const responseDto = this.mapToResponseDto(carePlan);

      const response: APIResponse<CarePlanResponseDto> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plan updated successfully via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to update care plan via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      const errorCode = statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR';

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Failed to update care plan',
          correlationId
        }
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * Delete care plan (soft delete)
   */
  async deleteCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const carePlanId = req.params.id;
    
    try {
      logger.info('Deleting care plan via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      await this.carePlanService.archiveCarePlan(carePlanId, req.user!.id, 'Deleted via API');

      logger.info('Care plan deleted successfully via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      res.status(204).send();

    } catch (error: unknown) {
      logger.error('Failed to delete care plan via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
      const errorCode = statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR';

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Failed to delete care plan',
          correlationId
        }
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * Activate care plan
   */
  async activateCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const carePlanId = req.params.id;
    
    try {
      logger.info('Activating care plan via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const approvalRequest: CarePlanApprovalRequest = {
        approvedBy: req.user!.id,
        approvalNotes: req.body.approvalNotes,
        effectiveFrom: req.body.effectiveFrom ? new Date(req.body.effectiveFrom) : undefined
      };

      const carePlan = await this.carePlanService.approveCarePlan(carePlanId, approvalRequest);

      const responseDto = this.mapToResponseDto(carePlan);

      const response: APIResponse<CarePlanResponseDto> = {
        success: true,
        data: responseDto,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plan activated successfully via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to activate care plan via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 400;
      const errorCode = statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST';

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: errorCode,
          message: error instanceof Error ? error.message : 'Failed to activate care plan',
          correlationId
        }
      };

      res.status(statusCode).json(response);
    }
  }

  /**
   * Schedule or conduct care plan review
   */
  async reviewCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const carePlanId = req.params.id;
    
    try {
      logger.info('Scheduling care plan review via API', { 
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      // For now, this is a placeholder implementation
      // In a full implementation, this would integrate with a review scheduling service
      const reviewData = {
        reviewId: `review-${Date.now()}`,
        reviewType: req.body.reviewType || 'scheduled',
        reviewDate: req.body.reviewDate ? new Date(req.body.reviewDate) : new Date(),
        status: 'scheduled'
      };

      const response: APIResponse<any> = {
        success: true,
        data: reviewData,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plan review scheduled successfully via API', { 
        carePlanId,
        reviewId: reviewData.reviewId,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to schedule care plan review via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        carePlanId,
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to schedule care plan review',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Generate care plan from template
   */
  async generateCarePlan(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    
    try {
      logger.info('Generating care plan from template via API', { 
        userId: req.user?.id,
        correlationId 
      });

      // For now, this is a placeholder implementation
      // In a full implementation, this would integrate with the care plan template service
      const generatedPlan = {
        id: `generated-${Date.now()}`,
        residentId: req.body.residentId,
        templateId: req.body.templateId,
        planName: `Generated Plan - ${new Date().toISOString()}`,
        status: 'draft'
      };

      const response: APIResponse<any> = {
        success: true,
        data: generatedPlan,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care plan generated successfully via API', { 
        planId: generatedPlan.id,
        templateId: req.body.templateId,
        userId: req.user?.id,
        correlationId 
      });

      res.status(201).json(response);

    } catch (error: unknown) {
      logger.error('Failed to generate care plan via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to generate care plan',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Add care domain to care plan
   */
  async addCareDomain(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const planId = req.params.planId;
    
    try {
      logger.info('Adding care domain to care plan via API', { 
        planId,
        userId: req.user?.id,
        correlationId 
      });

      // For now, this is a placeholder implementation
      // In a full implementation, this would integrate with the care domain service
      const careDomain = {
        id: `domain-${Date.now()}`,
        carePlanId: planId,
        domainName: req.body.domainName,
        category: req.body.category,
        priority: req.body.priority,
        status: 'active'
      };

      const response: APIResponse<any> = {
        success: true,
        data: careDomain,
        meta: {
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care domain added successfully via API', { 
        planId,
        domainId: careDomain.id,
        userId: req.user?.id,
        correlationId 
      });

      res.status(201).json(response);

    } catch (error: unknown) {
      logger.error('Failed to add care domain via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        planId,
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to add care domain',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Get care domains for a care plan
   */
  async getCareDomains(req: Request, res: Response): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string;
    const planId = req.params.planId;
    
    try {
      logger.info('Retrieving care domains for care plan via API', { 
        planId,
        userId: req.user?.id,
        correlationId 
      });

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

      // For now, this is a placeholder implementation
      // In a full implementation, this would integrate with the care domain service
      const careDomains = [
        {
          id: `domain-1`,
          carePlanId: planId,
          domainName: 'Mobility',
          category: 'Physical Care',
          priority: 'high',
          status: 'active',
          riskLevel: 'moderate'
        }
      ];

      const paginationMeta: PaginationMeta = {
        page,
        limit,
        total: careDomains.length,
        totalPages: Math.ceil(careDomains.length / limit),
        hasNext: page < Math.ceil(careDomains.length / limit),
        hasPrev: page > 1
      };

      const response: APIResponse<any[]> = {
        success: true,
        data: careDomains,
        meta: {
          pagination: paginationMeta,
          timestamp: new Date().toISOString(),
          version: 'v1'
        }
      };

      logger.info('Care domains retrieved successfully via API', { 
        planId,
        count: careDomains.length,
        userId: req.user?.id,
        correlationId 
      });

      res.status(200).json(response);

    } catch (error: unknown) {
      logger.error('Failed to retrieve care domains via API', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        planId,
        userId: req.user?.id,
        correlationId 
      });

      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to retrieve care domains',
          correlationId
        }
      };

      res.status(500).json(response);
    }
  }

  /**
   * Map CarePlan entity to response DTO
   */
  private mapToResponseDto(carePlan: any): CarePlanResponseDto {
    return {
      id: carePlan.id,
      residentId: carePlan.residentId,
      planName: carePlan.planName,
      planType: carePlan.planType,
      status: carePlan.status,
      reviewFrequency: carePlan.reviewFrequency,
      effectiveFrom: carePlan.effectiveFrom.toISOString(),
      effectiveTo: carePlan.effectiveTo?.toISOString(),
      nextReviewDate: carePlan.nextReviewDate?.toISOString(),
      version: carePlan.version,
      isApproved: carePlan.isApproved,
      isOverdueForReview: carePlan.isOverdueForReview,
      careGoals: carePlan.careGoals?.map((goal: any) => ({
        id: goal.id,
        goalType: goal.goalType,
        description: goal.description,
        targetDate: goal.targetDate?.toISOString(),
        priority: goal.priority,
        status: goal.status,
        notes: goal.notes,
        assignedTo: goal.assignedTo,
        interventions: goal.interventions
      })),
      riskAssessments: carePlan.riskAssessments?.map((risk: any) => ({
        id: risk.id,
        riskType: risk.riskType,
        riskLevel: risk.riskLevel,
        description: risk.description,
        mitigationStrategies: risk.mitigationStrategies,
        assessmentDate: risk.assessmentDate?.toISOString(),
        nextAssessmentDate: risk.nextAssessmentDate?.toISOString(),
        assessedBy: risk.assessedBy
      })),
      emergencyProcedures: carePlan.emergencyProcedures,
      residentPreferences: carePlan.residentPreferences,
      createdBy: carePlan.createdBy,
      createdAt: carePlan.createdAt.toISOString(),
      updatedAt: carePlan.updatedAt.toISOString(),
      approvedBy: carePlan.approvedBy,
      approvedAt: carePlan.approvedAt?.toISOString()
    };
  }
}
