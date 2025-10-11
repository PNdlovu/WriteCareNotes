/**/**

 * @fileoverview Resident Controller - HTTP API Endpoints * @fileoverview REST API controller for resident management with comprehensive

 * @module Controllers/Resident * @module Resident/ResidentController

 * @version 1.0.0 * @version 1.0.0

 * @author WriteCareNotes Team * @author WriteCareNotes Team

 * @since 2025-10-08 * @since 2025-10-07

 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR

 * @stability stable * @stability stable

 *  * 

 * @description Production-ready REST API controller for resident management * @description REST API controller for resident management with comprehensive

 */ */



import { Request, Response } from 'express';import { EventEmitter2 } from "eventemitter2";

import { body, param, query, validationResult } from 'express-validator';

import { ResidentService, CreateResidentDto, UpdateResidentDto } from '../../services/resident/ResidentService';/**

import { ResidentStatus, AdmissionType } from '../../domains/care/entities/Resident'; * @fileoverview Resident Controller for WriteCareNotes Healthcare Management

import { getTenantContext } from '../../middleware/tenant-isolation.middleware'; * @module ResidentController

import { logger } from '../../utils/logger'; * @version 1.0.0

 * @author WriteCareNotes Team

export class ResidentController { * @since 2025-01-01

  constructor(private residentService: ResidentService) {} * 

 * @description REST API controller for resident management with comprehensive

  /** * healthcare operations, security, and compliance features.

   * Create a new resident * 

   * POST /residents * @compliance

   */ * - RESTful API standards

  async create(req: Request, res: Response): Promise<void> { * - Healthcare data protection

    try { * - GDPR compliance

      // Validate request * - Audit trail requirements

      const errors = validationResult(req); * 

      if (!errors.isEmpty()) { * @security

        res.status(400).json({ errors: errors.array() }); * - JWT authentication required

        return; * - Role-based access control

      } * - Input validation and sanitization

 * - Rate limiting protection

      // Get tenant context */

      const tenantContext = getTenantContext(req);

      if (!tenantContext) {import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, Res, HttpStatus, UseGuards, UseInterceptors } from '@nestjs/common';

        res.status(401).json({ error: 'Unauthorized - Tenant context missing' });import { Request, Response } from 'express';

        return;import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

      }import { v4 as uuidv4 } from 'uuid';



      // Create DTOimport { ResidentService, CreateResidentRequest, UpdateResidentRequest, ResidentSearchFilters } from '@/services/resident/ResidentService';

      const dto: CreateResidentDto = {import { AuthenticatedRequest } from '@/middleware/auth-middleware';

        ...req.body,import { requirePermission, Permission } from '@/middleware/auth-middleware';

        organizationId: req.body.organizationId || tenantContext.organizationId,import { requireCareHomeAccess } from '@/middleware/auth-middleware';

        tenantId: tenantContext.tenantId,import { auditMiddleware } from '@/middleware/audit-middleware';

      };import { rateLimitMiddleware } from '@/middleware/rate-limit-middleware';

import { healthcareLogger } from '@/utils/logger';

      // Create resident

      const resident = await this.residentService.create(dto, tenantContext.userId);@ApiTags('Residents')

@ApiBearerAuth()

      logger.info('Resident created via API', {@Controller('api/v1/residents')

        residentId: resident.id,@UseGuards(requirePermission(Permission.RESIDENT_READ))

        userId: tenantContext.userId,@UseInterceptors(auditMiddleware, rateLimitMiddleware)

      });export class ResidentController {

  constructor(private readonly residentService: ResidentService) {}

      res.status(201).json(resident);

    } catch (error: unknown) {  /**

      logger.error('Failed to create resident via API', {   * Create a new resident

        error: error instanceof Error ? error.message : 'Unknown error',   */

      });  @Post()

      res.status(500).json({  @UseGuards(requirePermission(Permission.RESIDENT_CREATE))

        error: 'Failed to create resident',  @ApiOperation({ 

        message: error instanceof Error ? error.message : 'Unknown error',    summary: 'Create a new resident',

      });    description: 'Creates a new resident record with comprehensive healthcare information and compliance validation'

    }  })

  }  @ApiResponse({ 

    status: 201, 

  /**    description: 'Resident created successfully',

   * Get resident by ID    schema: {

   * GET /residents/:id      type: 'object',

   */      properties: {

  async getById(req: Request, res: Response): Promise<void> {        success: { type: 'boolean', example: true },

    try {        data: { type: 'object' },

      const errors = validationResult(req);        message: { type: 'string', example: 'Resident created successfully' }

      if (!errors.isEmpty()) {      }

        res.status(400).json({ errors: errors.array() });    }

        return;  })

      }  @ApiResponse({ status: 400, description: 'Invalid input data or validation failed' })

  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing authentication' })

      const tenantContext = getTenantContext(req);  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })

      if (!tenantContext) {  @ApiResponse({ status: 409, description: 'Conflict - Resident with NHS number already exists' })

        res.status(401).json({ error: 'Unauthorized' });  async createResident(

        return;    @Body() createRequest: CreateResidentRequest,

      }    @Req() req: AuthenticatedRequest,

    @Res() res: Response

      const { id } = req.params;  ): Promise<void> {

      const resident = await this.residentService.findById(id, tenantContext.tenantId);    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

    const startTime = Date.now();

      if (!resident) {

        res.status(404).json({ error: 'Resident not found' });    try {

        return;      healthcareLogger.api('info', 'Creating new resident', {

      }        userId: req.user?.id,

        organizationId: createRequest.organizationId,

      res.status(200).json(resident);        correlationId,

    } catch (error: unknown) {        auditTrail: true

      logger.error('Failed to get resident by ID', {      });

        error: error instanceof Error ? error.message : 'Unknown error',

      });      const resident = await this.residentService.createResident(

      res.status(500).json({        createRequest,

        error: 'Failed to retrieve resident',        req.user!.id,

        message: error instanceof Error ? error.message : 'Unknown error',        correlationId

      });      );

    }

  }      const duration = Date.now() - startTime;



  /**      healthcareLogger.performance('info', 'Resident creation completed', {

   * Search residents with filters        residentId: resident.id,

   * GET /residents        duration,

   */        userId: req.user?.id,

  async search(req: Request, res: Response): Promise<void> {        correlationId

    try {      });

      const errors = validationResult(req);

      if (!errors.isEmpty()) {      res.status(HttpStatus.CREATED).json({

        res.status(400).json({ errors: errors.array() });        success: true,

        return;        data: resident,

      }        message: 'Resident created successfully',

        meta: {

      const tenantContext = getTenantContext(req);          correlationId,

      if (!tenantContext) {          timestamp: new Date().toISOString(),

        res.status(401).json({ error: 'Unauthorized' });          duration

        return;        }

      }      });



      const organizationId = (req.query.organizationId as string) || tenantContext.organizationId;    } catch (error: unknown) {

      const duration = Date.now() - startTime;

      const filters = {

        status: req.query.status as ResidentStatus | undefined,      healthcareLogger.api('error', 'Resident creation failed', {

        admissionType: req.query.admissionType as AdmissionType | undefined,        error: (error as Error).message,

        searchTerm: req.query.searchTerm as string | undefined,        userId: req.user?.id,

        roomNumber: req.query.roomNumber as string | undefined,        organizationId: createRequest.organizationId,

        careLevel: req.query.careLevel as string | undefined,        duration,

        page: req.query.page ? parseInt(req.query.page as string) : 1,        correlationId,

        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,        auditTrail: true

        sortBy: (req.query.sortBy as string) || 'createdAt',      });

        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',

      };      const statusCode = this.getErrorStatusCode(error as Error);

      res.status(statusCode).json({

      const result = await this.residentService.search(        success: false,

        organizationId,        error: {

        tenantContext.tenantId,          code: this.getErrorCode(error as Error),

        filters          message: (error as Error).message,

      );          timestamp: new Date().toISOString(),

          correlationId

      res.status(200).json(result);        }

    } catch (error: unknown) {      });

      logger.error('Failed to search residents', {    }

        error: error instanceof Error ? error.message : 'Unknown error',  }

      });

      res.status(500).json({  /**

        error: 'Failed to search residents',   * Get resident by ID

        message: error instanceof Error ? error.message : 'Unknown error',   */

      });  @Get(':id')

    }  @ApiOperation({ 

  }    summary: 'Get resident by ID',

    description: 'Retrieves detailed information for a specific resident with security and access control'

  /**  })

   * Update resident  @ApiParam({ name: 'id', description: 'Resident UUID', type: 'string' })

   * PUT /residents/:id  @ApiResponse({ 

   */    status: 200, 

  async update(req: Request, res: Response): Promise<void> {    description: 'Resident retrieved successfully',

    try {    schema: {

      const errors = validationResult(req);      type: 'object',

      if (!errors.isEmpty()) {      properties: {

        res.status(400).json({ errors: errors.array() });        success: { type: 'boolean', example: true },

        return;        data: { type: 'object' }

      }      }

    }

      const tenantContext = getTenantContext(req);  })

      if (!tenantContext) {  @ApiResponse({ status: 404, description: 'Resident not found' })

        res.status(401).json({ error: 'Unauthorized' });  @ApiResponse({ status: 401, description: 'Unauthorized' })

        return;  @ApiResponse({ status: 403, description: 'Forbidden' })

      }  async getResidentById(

    @Param('id') id: string,

      const { id } = req.params;    @Query('organizationId') organizationId: string,

      const dto: UpdateResidentDto = req.body;    @Req() req: AuthenticatedRequest,

    @Res() res: Response

      const updatedResident = await this.residentService.update(  ): Promise<void> {

        id,    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

        dto,

        tenantContext.tenantId,    try {

        tenantContext.userId      const resident = await this.residentService.getResidentById(

      );        id,

        req.user!.id,

      logger.info('Resident updated via API', {        organizationId,

        residentId: id,        correlationId

        userId: tenantContext.userId,      );

      });

      res.status(HttpStatus.OK).json({

      res.status(200).json(updatedResident);        success: true,

    } catch (error: unknown) {        data: resident,

      logger.error('Failed to update resident', {        meta: {

        error: error instanceof Error ? error.message : 'Unknown error',          correlationId,

      });          timestamp: new Date().toISOString()

        }

      if (error instanceof Error && error.message === 'Resident not found') {      });

        res.status(404).json({ error: 'Resident not found' });

        return;    } catch (error: unknown) {

      }      healthcareLogger.api('error', 'Failed to retrieve resident', {

        error: (error as Error).message,

      res.status(500).json({        residentId: id,

        error: 'Failed to update resident',        userId: req.user?.id,

        message: error instanceof Error ? error.message : 'Unknown error',        correlationId

      });      });

    }

  }      const statusCode = this.getErrorStatusCode(error as Error);

      res.status(statusCode).json({

  /**        success: false,

   * Delete resident (soft delete)        error: {

   * DELETE /residents/:id          code: this.getErrorCode(error as Error),

   */          message: (error as Error).message,

  async delete(req: Request, res: Response): Promise<void> {          timestamp: new Date().toISOString(),

    try {          correlationId

      const errors = validationResult(req);        }

      if (!errors.isEmpty()) {      });

        res.status(400).json({ errors: errors.array() });    }

        return;  }  /**

      }   

* Update resident information

      const tenantContext = getTenantContext(req);   */

      if (!tenantContext) {  @Put(':id')

        res.status(401).json({ error: 'Unauthorized' });  @UseGuards(requirePermission(Permission.RESIDENT_UPDATE))

        return;  @ApiOperation({ 

      }    summary: 'Update resident information',

    description: 'Updates resident information with validation, audit trail, and notifications'

      const { id } = req.params;  })

  @ApiParam({ name: 'id', description: 'Resident UUID', type: 'string' })

      await this.residentService.delete(id, tenantContext.tenantId, tenantContext.userId);  @ApiResponse({ status: 200, description: 'Resident updated successfully' })

  @ApiResponse({ status: 400, description: 'Invalid input data' })

      logger.info('Resident deleted via API', {  @ApiResponse({ status: 404, description: 'Resident not found' })

        residentId: id,  @ApiResponse({ status: 401, description: 'Unauthorized' })

        userId: tenantContext.userId,  @ApiResponse({ status: 403, description: 'Forbidden' })

      });  async updateResident(

    @Param('id') id: string,

      res.status(200).json({ message: 'Resident deleted successfully' });    @Body() updateRequest: Omit<UpdateResidentRequest, 'id'>,

    } catch (error: unknown) {    @Req() req: AuthenticatedRequest,

      logger.error('Failed to delete resident', {    @Res() res: Response

        error: error instanceof Error ? error.message : 'Unknown error',  ): Promise<void> {

      });    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();



      if (error instanceof Error && error.message === 'Resident not found') {    try {

        res.status(404).json({ error: 'Resident not found' });      const resident = await this.residentService.updateResident(

        return;        { ...updateRequest, id },

      }        req.user!.id,

        correlationId

      res.status(500).json({      );

        error: 'Failed to delete resident',

        message: error instanceof Error ? error.message : 'Unknown error',      res.status(HttpStatus.OK).json({

      });        success: true,

    }        data: resident,

  }        message: 'Resident updated successfully',

        meta: {

  /**          correlationId,

   * Restore soft-deleted resident          timestamp: new Date().toISOString()

   * POST /residents/:id/restore        }

   */      });

  async restore(req: Request, res: Response): Promise<void> {

    try {    } catch (error: unknown) {

      const errors = validationResult(req);      healthcareLogger.api('error', 'Failed to update resident', {

      if (!errors.isEmpty()) {        error: (error as Error).message,

        res.status(400).json({ errors: errors.array() });        residentId: id,

        return;        userId: req.user?.id,

      }        correlationId

      });

      const tenantContext = getTenantContext(req);

      if (!tenantContext) {      const statusCode = this.getErrorStatusCode(error as Error);

        res.status(401).json({ error: 'Unauthorized' });      res.status(statusCode).json({

        return;        success: false,

      }        error: {

          code: this.getErrorCode(error as Error),

      const { id } = req.params;          message: (error as Error).message,

          timestamp: new Date().toISOString(),

      const restoredResident = await this.residentService.restore(          correlationId

        id,        }

        tenantContext.tenantId,      });

        tenantContext.userId    }

      );  }



      logger.info('Resident restored via API', {  /**

        residentId: id,   * Search residents with advanced filtering

        userId: tenantContext.userId,   */

      });  @Get()

  @ApiOperation({ 

      res.status(200).json(restoredResident);    summary: 'Search residents',

    } catch (error: unknown) {    description: 'Search and filter residents with pagination, sorting, and advanced filters'

      logger.error('Failed to restore resident', {  })

        error: error instanceof Error ? error.message : 'Unknown error',  @ApiQuery({ name: 'status', required: false, description: 'Filter by resident status' })

      });  @ApiQuery({ name: 'careLevel', required: false, description: 'Filter by care level' })

  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization' })

      if (error instanceof Error && error.message.includes('not found')) {  @ApiQuery({ name: 'searchTerm', required: false, description: 'Search by name, NHS number, or room' })

        res.status(404).json({ error: 'Resident not found' });  @ApiQuery({ name: 'page', required: false, type: 'number', description: 'Page number (default: 1)' })

        return;  @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'Items per page (default: 20, max: 100)' })

      }  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: lastName)' })

  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'], description: 'Sort order (default: ASC)' })

      res.status(500).json({  @ApiResponse({ 

        error: 'Failed to restore resident',    status: 200, 

        message: error instanceof Error ? error.message : 'Unknown error',    description: 'Residents retrieved successfully',

      });    schema: {

    }      type: 'object',

  }      properties: {

        success: { type: 'boolean', example: true },

  /**        data: {

   * Update resident status          type: 'object',

   * PUT /residents/:id/status          properties: {

   */            residents: { type: 'array', items: { type: 'object' } },

  async updateStatus(req: Request, res: Response): Promise<void> {            total: { type: 'number' },

    try {            page: { type: 'number' },

      const errors = validationResult(req);            limit: { type: 'number' },

      if (!errors.isEmpty()) {            totalPages: { type: 'number' },

        res.status(400).json({ errors: errors.array() });            hasNext: { type: 'boolean' },

        return;            hasPrevious: { type: 'boolean' }

      }          }

        }

      const tenantContext = getTenantContext(req);      }

      if (!tenantContext) {    }

        res.status(401).json({ error: 'Unauthorized' });  })

        return;  async searchResidents(

      }    @Query() filters: ResidentSearchFilters,

    @Req() req: AuthenticatedRequest,

      const { id } = req.params;    @Res() res: Response

      const { status } = req.body;  ): Promise<void> {

    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

      const updatedResident = await this.residentService.updateStatus(

        id,    try {

        status as ResidentStatus,      const result = await this.residentService.searchResidents(

        tenantContext.tenantId,        filters,

        tenantContext.userId        req.user!.id,

      );        correlationId

      );

      logger.info('Resident status updated via API', {

        residentId: id,      res.status(HttpStatus.OK).json({

        status,        success: true,

        userId: tenantContext.userId,        data: result,

      });        meta: {

          correlationId,

      res.status(200).json(updatedResident);          timestamp: new Date().toISOString()

    } catch (error: unknown) {        }

      logger.error('Failed to update resident status', {      });

        error: error instanceof Error ? error.message : 'Unknown error',

      });    } catch (error: unknown) {

      healthcareLogger.api('error', 'Failed to search residents', {

      if (error instanceof Error && error.message === 'Resident not found') {        error: (error as Error).message,

        res.status(404).json({ error: 'Resident not found' });        filters,

        return;        userId: req.user?.id,

      }        correlationId

      });

      res.status(500).json({

        error: 'Failed to update resident status',      const statusCode = this.getErrorStatusCode(error as Error);

        message: error instanceof Error ? error.message : 'Unknown error',      res.status(statusCode).json({

      });        success: false,

    }        error: {

  }          code: this.getErrorCode(error as Error),

          message: (error as Error).message,

  /**          timestamp: new Date().toISOString(),

   * Get resident count by organization          correlationId

   * GET /residents/count        }

   */      });

  async getCount(req: Request, res: Response): Promise<void> {    }

    try {  }

      const tenantContext = getTenantContext(req);

      if (!tenantContext) {  /**

        res.status(401).json({ error: 'Unauthorized' });   * Discharge resident

        return;   */

      }  @Put(':id/discharge')

  @UseGuards(requirePermission(Permission.RESIDENT_DISCHARGE))

      const organizationId = (req.query.organizationId as string) || tenantContext.organizationId;  @ApiOperation({ 

    summary: 'Discharge resident',

      const count = await this.residentService.countByOrganization(    description: 'Discharge a resident with proper workflow, notifications, and audit trail'

        organizationId,  })

        tenantContext.tenantId  @ApiParam({ name: 'id', description: 'Resident UUID', type: 'string' })

      );  @ApiResponse({ status: 200, description: 'Resident discharged successfully' })

  @ApiResponse({ status: 400, description: 'Invalid discharge request' })

      res.status(200).json({ count });  @ApiResponse({ status: 404, description: 'Resident not found' })

    } catch (error: unknown) {  @ApiResponse({ status: 401, description: 'Unauthorized' })

      logger.error('Failed to get resident count', {  @ApiResponse({ status: 403, description: 'Forbidden' })

        error: error instanceof Error ? error.message : 'Unknown error',  async dischargeResident(

      });    @Param('id') id: string,

      res.status(500).json({    @Body() dischargeRequest: { dischargeDate: string; reason: string },

        error: 'Failed to get resident count',    @Req() req: AuthenticatedRequest,

        message: error instanceof Error ? error.message : 'Unknown error',    @Res() res: Response

      });  ): Promise<void> {

    }    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();

  }

    try {

  /**      if (!dischargeRequest.dischargeDate || !dischargeRequest.reason) {

   * Get active resident count        throw new Error('Discharge date and reason are required');

   * GET /residents/count/active      }

   */

  async getActiveCount(req: Request, res: Response): Promise<void> {      const resident = await this.residentService.dischargeResident(

    try {        id,

      const tenantContext = getTenantContext(req);        dischargeRequest.dischargeDate,

      if (!tenantContext) {        dischargeRequest.reason,

        res.status(401).json({ error: 'Unauthorized' });        req.user!.id,

        return;        correlationId

      }      );



      const organizationId = (req.query.organizationId as string) || tenantContext.organizationId;      res.status(HttpStatus.OK).json({

        success: true,

      const count = await this.residentService.countActiveResidents(        data: resident,

        organizationId,        message: 'Resident discharged successfully',

        tenantContext.tenantId        meta: {

      );          correlationId,

          timestamp: new Date().toISOString()

      res.status(200).json({ count });        }

    } catch (error: unknown) {      });

      logger.error('Failed to get active resident count', {

        error: error instanceof Error ? error.message : 'Unknown error',    } catch (error: unknown) {

      });      healthcareLogger.api('error', 'Failed to discharge resident', {

      res.status(500).json({        error: (error as Error).message,

        error: 'Failed to get active resident count',        residentId: id,

        message: error instanceof Error ? error.message : 'Unknown error',        userId: req.user?.id,

      });        correlationId

    }      });

  }

}      const statusCode = this.getErrorStatusCode(error as Error);

      res.status(statusCode).json({

// Validation rules for create resident        success: false,

export const createResidentValidation = [        error: {

  body('firstName').notEmpty().trim().isLength({ min: 1, max: 100 }),          code: this.getErrorCode(error as Error),

  body('lastName').notEmpty().trim().isLength({ min: 1, max: 100 }),          message: (error as Error).message,

  body('preferredName').optional().trim().isLength({ max: 50 }),          timestamp: new Date().toISOString(),

  body('title').optional().trim().isLength({ max: 10 }),          correlationId

  body('dateOfBirth').notEmpty().isISO8601(),        }

  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']),      });

  body('email').optional().isEmail().normalizeEmail(),    }

  body('phone').optional().trim().isLength({ max: 50 }),  }

  body('admissionType').notEmpty().isIn(['PERMANENT', 'RESPITE', 'DAY_CARE', 'TEMPORARY']),

  body('admissionDate').notEmpty().isISO8601(),  /**

  body('organizationId').notEmpty().isUUID(),   * Get resident statistics

];   */

  @Get('statistics/:organizationId')

// Validation rules for update resident  @UseGuards(requirePermission(Permission.RESIDENT_READ))

export const updateResidentValidation = [  @ApiOperation({ 

  param('id').isUUID(),    summary: 'Get resident statistics',

  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),    description: 'Retrieve comprehensive statistics for residents in an organization'

  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),  })

  body('preferredName').optional().trim().isLength({ max: 50 }),  @ApiParam({ name: 'organizationId', description: 'Organization UUID', type: 'string' })

  body('email').optional().isEmail().normalizeEmail(),  @ApiResponse({ 

  body('phone').optional().trim().isLength({ max: 50 }),    status: 200, 

  body('status').optional().isIn(['ACTIVE', 'ON_LEAVE', 'DISCHARGED', 'DECEASED', 'TRANSFERRED']),    description: 'Statistics retrieved successfully',

];    schema: {

      type: 'object',

// Validation rules for update status      properties: {

export const updateStatusValidation = [        success: { type: 'boolean', example: true },

  param('id').isUUID(),        data: {

  body('status').notEmpty().isIn(['ACTIVE', 'ON_LEAVE', 'DISCHARGED', 'DECEASED', 'TRANSFERRED']),          type: 'object',

];          properties: {

            totalResidents: { type: 'number' },

// Validation rules for get by ID            activeResidents: { type: 'number' },

export const getByIdValidation = [param('id').isUUID()];            dischargedResidents: { type: 'number' },

            careDistribution: { type: 'object' },

// Validation rules for delete            highRiskResidents: { type: 'number' },

export const deleteValidation = [param('id').isUUID()];            averageAge: { type: 'number' },

            averageLengthOfStay: { type: 'number' }

// Validation rules for search          }

export const searchValidation = [        }

  query('page').optional().isInt({ min: 1 }),      }

  query('limit').optional().isInt({ min: 1, max: 100 }),    }

  query('status').optional().isIn(['ACTIVE', 'ON_LEAVE', 'DISCHARGED', 'DECEASED', 'TRANSFERRED']),  })

  query('admissionType').optional().isIn(['PERMANENT', 'RESPITE', 'DAY_CARE', 'TEMPORARY']),  async getResidentStatistics(

];    @Param('organizationId') organizationId: string,

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