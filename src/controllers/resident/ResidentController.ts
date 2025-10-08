/**
 * @fileoverview REST API controller for resident management with comprehensive
 * @module Resident/ResidentController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description REST API controller for resident management with comprehensive
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Resident Controller for WriteCareNotes Healthcare Management
 * @module ResidentController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description REST API controller for resident management with comprehensive
 * healthcare operations, security, and compliance features.
 * 
 * @compliance
 * - RESTful API standards
 * - Healthcare data protection
 * - GDPR compliance
 * - Audit trail requirements
 * 
 * @security
 * - JWT authentication required
 * - Role-based access control
 * - Input validation and sanitization
 * - Rate limiting protection
 */

import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';

import { ResidentService, CreateResidentRequest, UpdateResidentRequest, ResidentSearchFilters } from '@/services/resident/ResidentService';
import { AuthenticatedRequest } from '@/middleware/auth-middleware';
import { requirePermission, Permission } from '@/middleware/auth-middleware';
import { requireCareHomeAccess } from '@/middleware/auth-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { rateLimitMiddleware } from '@/middleware/rate-limit-middleware';
import { healthcareLogger } from '@/utils/logger';

@ApiTags('Residents')
@ApiBearerAuth()
@Controller('api/v1/residents')
@UseGuards(requirePermission(Permission.RESIDENT_READ))
@UseInterceptors(auditMiddleware, rateLimitMiddleware)
export class ResidentController {
  constructor(private readonly residentService: ResidentService) {}

  /**
   * Create a new resident
   */
  @Post()
  @UseGuards(requirePermission(Permission.RESIDENT_CREATE))
  @ApiOperation({ 
    summary: 'Create a new resident',
    description: 'Creates a new resident record with comprehensive healthcare information and compliance validation'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Resident created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        message: { type: 'string', example: 'Resident created successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 409, description: 'Conflict - Resident with NHS number already exists' })
  async createResident(
    @Body() createRequest: CreateResidentRequest,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    const startTime = Date.now();

    try {
      healthcareLogger.api('info', 'Creating new resident', {
        userId: req.user?.id,
        organizationId: createRequest.organizationId,
        correlationId,
        auditTrail: true
      });

      const resident = await this.residentService.createResident(
        createRequest,
        req.user!.id,
        correlationId
      );

      const duration = Date.now() - startTime;

      healthcareLogger.performance('info', 'Resident creation completed', {
        residentId: resident.id,
        duration,
        userId: req.user?.id,
        correlationId
      });

      res.status(HttpStatus.CREATED).json({
        success: true,
        data: resident,
        message: 'Resident created successfully',
        meta: {
          correlationId,
          timestamp: new Date().toISOString(),
          duration
        }
      });

    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      healthcareLogger.api('error', 'Resident creation failed', {
        error: (error as Error).message,
        userId: req.user?.id,
        organizationId: createRequest.organizationId,
        duration,
        correlationId,
        auditTrail: true
      });

      const statusCode = this.getErrorStatusCode(error as Error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          correlationId
        }
      });
    }
  }

  /**
   * Get resident by ID
   */
  @Get(':id')
  @ApiOperation({ 
    summary: 'Get resident by ID',
    description: 'Retrieves detailed information for a specific resident with security and access control'
  })
  @ApiParam({ name: 'id', description: 'Resident UUID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Resident retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getResidentById(
    @Param('id') id: string,
    @Query('organizationId') organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const resident = await this.residentService.getResidentById(
        id,
        req.user!.id,
        organizationId,
        correlationId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: resident,
        meta: {
          correlationId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: unknown) {
      healthcareLogger.api('error', 'Failed to retrieve resident', {
        error: (error as Error).message,
        residentId: id,
        userId: req.user?.id,
        correlationId
      });

      const statusCode = this.getErrorStatusCode(error as Error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          correlationId
        }
      });
    }
  }  /**
   
* Update resident information
   */
  @Put(':id')
  @UseGuards(requirePermission(Permission.RESIDENT_UPDATE))
  @ApiOperation({ 
    summary: 'Update resident information',
    description: 'Updates resident information with validation, audit trail, and notifications'
  })
  @ApiParam({ name: 'id', description: 'Resident UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Resident updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateResident(
    @Param('id') id: string,
    @Body() updateRequest: Omit<UpdateResidentRequest, 'id'>,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const resident = await this.residentService.updateResident(
        { ...updateRequest, id },
        req.user!.id,
        correlationId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: resident,
        message: 'Resident updated successfully',
        meta: {
          correlationId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: unknown) {
      healthcareLogger.api('error', 'Failed to update resident', {
        error: (error as Error).message,
        residentId: id,
        userId: req.user?.id,
        correlationId
      });

      const statusCode = this.getErrorStatusCode(error as Error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          correlationId
        }
      });
    }
  }

  /**
   * Search residents with advanced filtering
   */
  @Get()
  @ApiOperation({ 
    summary: 'Search residents',
    description: 'Search and filter residents with pagination, sorting, and advanced filters'
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by resident status' })
  @ApiQuery({ name: 'careLevel', required: false, description: 'Filter by care level' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization' })
  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search by name, NHS number, or room' })
  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: lastName)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Residents retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            residents: { type: 'array', items: { type: 'object' } },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrevious: { type: 'boolean' }
          }
        }
      }
    }
  })
  async searchResidents(
    @Query() filters: ResidentSearchFilters,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const result = await this.residentService.searchResidents(
        filters,
        req.user!.id,
        correlationId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: result,
        meta: {
          correlationId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: unknown) {
      healthcareLogger.api('error', 'Failed to search residents', {
        error: (error as Error).message,
        filters,
        userId: req.user?.id,
        correlationId
      });

      const statusCode = this.getErrorStatusCode(error as Error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          correlationId
        }
      });
    }
  }

  /**
   * Discharge resident
   */
  @Put(':id/discharge')
  @UseGuards(requirePermission(Permission.RESIDENT_DISCHARGE))
  @ApiOperation({ 
    summary: 'Discharge resident',
    description: 'Discharge a resident with proper workflow, notifications, and audit trail'
  })
  @ApiParam({ name: 'id', description: 'Resident UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Resident discharged successfully' })
  @ApiResponse({ status: 400, description: 'Invalid discharge request' })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async dischargeResident(
    @Param('id') id: string,
    @Body() dischargeRequest: { dischargeDate: string; reason: string },
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      if (!dischargeRequest.dischargeDate || !dischargeRequest.reason) {
        throw new Error('Discharge date and reason are required');
      }

      const resident = await this.residentService.dischargeResident(
        id,
        dischargeRequest.dischargeDate,
        dischargeRequest.reason,
        req.user!.id,
        correlationId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: resident,
        message: 'Resident discharged successfully',
        meta: {
          correlationId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: unknown) {
      healthcareLogger.api('error', 'Failed to discharge resident', {
        error: (error as Error).message,
        residentId: id,
        userId: req.user?.id,
        correlationId
      });

      const statusCode = this.getErrorStatusCode(error as Error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          correlationId
        }
      });
    }
  }

  /**
   * Get resident statistics
   */
  @Get('statistics/:organizationId')
  @UseGuards(requirePermission(Permission.RESIDENT_READ))
  @ApiOperation({ 
    summary: 'Get resident statistics',
    description: 'Retrieve comprehensive statistics for residents in an organization'
  })
  @ApiParam({ name: 'organizationId', description: 'Organization UUID', type: 'string' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            totalResidents: { type: 'number' },
            activeResidents: { type: 'number' },
            dischargedResidents: { type: 'number' },
            careDistribution: { type: 'object' },
            highRiskResidents: { type: 'number' },
            averageAge: { type: 'number' },
            averageLengthOfStay: { type: 'number' }
          }
        }
      }
    }
  })
  async getResidentStatistics(
    @Param('organizationId') organizationId: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: Response
  ): Promise<void> {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    try {
      const statistics = await this.residentService.getResidentStatistics(
        organizationId,
        req.user!.id,
        correlationId
      );

      res.status(HttpStatus.OK).json({
        success: true,
        data: statistics,
        meta: {
          correlationId,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: unknown) {
      healthcareLogger.api('error', 'Failed to get resident statistics', {
        error: (error as Error).message,
        organizationId,
        userId: req.user?.id,
        correlationId
      });

      const statusCode = this.getErrorStatusCode(error as Error);
      res.status(statusCode).json({
        success: false,
        error: {
          code: this.getErrorCode(error as Error),
          message: (error as Error).message,
          timestamp: new Date().toISOString(),
          correlationId
        }
      });
    }
  }

  /**
   * Private helper methods for error handling
   */
  private getErrorStatusCode(error: Error): number {
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found') || error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Not found')) {
      return HttpStatus.NOT_FOUND;
    }
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('already exists') || error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('duplicate')) {
      return HttpStatus.CONFLICT;
    }
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Validation failed') || error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Invalid')) {
      return HttpStatus.BAD_REQUEST;
    }
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Unauthorized') || error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('authentication')) {
      return HttpStatus.UNAUTHORIZED;
    }
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Forbidden') || error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('permission')) {
      return HttpStatus.FORBIDDEN;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorCode(error: Error): string {
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('not found')) return 'RESIDENT_NOT_FOUND';
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('already exists')) return 'RESIDENT_ALREADY_EXISTS';
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Validation failed')) return 'VALIDATION_ERROR';
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('NHS number')) return 'INVALID_NHS_NUMBER';
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Unauthorized')) return 'UNAUTHORIZED';
    if (error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error".includes('Forbidden')) return 'FORBIDDEN';
    return 'INTERNAL_ERROR';
  }
}

export default ResidentController;