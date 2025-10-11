/**
 * @fileoverview Tenant Controller
 * @module Controllers/Tenant/TenantController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-09
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Handles tenant CRUD operations with multi-tenancy support
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import {
  TenantService,
  CreateTenantDto,
  UpdateTenantDto,
} from '../../services/tenant/TenantService';
import { body, param, validationResult } from 'express-validator';

export class TenantController {
  privatetenantService: TenantService;

  const ructor(dataSource: DataSource) {
    this.tenantService = new TenantService(dataSource);
  }

  /**
   * POST /tenants
   * Create new tenant
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
        return;
      }

      const dto: CreateTenantDto = req.body;
      const tenant = await this.tenantService.create(dto);

      res.status(201).json({
        success: true,
        data: tenant,
      });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_CREATE_FAILED',
          message: err.message,
        },
      });
    }
  };

  /**
   * GET /tenants/:id
   * Get tenant by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const tenant = await this.tenantService.findById(id);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: `Tenant with ID ${id} not found`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_FETCH_FAILED',
          message: err.message,
        },
      });
    }
  };

  /**
   * GET /tenants/subdomain/:subdomain
   * Get tenant by subdomain
   */
  getBySubdomain = async (req: Request, res: Response): Promise<void> => {
    try {
      const { subdomain } = req.params;

      const tenant = await this.tenantService.findBySubdomain(subdomain);

      if (!tenant) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: `Tenant with subdomain '${subdomain}' not found`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_FETCH_FAILED',
          message: err.message,
        },
      });
    }
  };

  /**
   * GET /tenants
   * Get all tenants
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const includeInactive = req.query.includeInactive === 'true';

      const tenants = await this.tenantService.findAll(includeInactive);

      res.status(200).json({
        success: true,
        data: tenants,
        meta: {
          total: tenants.length,
        },
      });
    } catch (error: unknown) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        error: {
          code: 'TENANTS_FETCH_FAILED',
          message: err.message,
        },
      });
    }
  };

  /**
   * PUT /tenants/:id
   * Update tenant
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const dto: UpdateTenantDto = req.body;

      const tenant = await this.tenantService.update(id, dto);

      res.status(200).json({
        success: true,
        data: tenant,
      });
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_UPDATE_FAILED',
          message: err.message,
        },
      });
    }
  };

  /**
   * DELETE /tenants/:id
   * Soft delete tenant
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      await this.tenantService.softDelete(id);

      res.status(200).json({
        success: true,
        message: `Tenant ${id} deleted successfully`,
      });
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'TENANT_DELETE_FAILED',
          message: err.message,
        },
      });
    }
  };

  /**
   * GET /tenants/:id/statistics
   * Get tenant statistics
   */
  getStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const statistics = await this.tenantService.getStatistics(id);

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error: unknown) {
      const err = error as Error;
      if (err.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TENANT_NOT_FOUND',
            message: err.message,
          },
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'STATISTICS_FETCH_FAILED',
          message: err.message,
        },
      });
    }
  };
}

/**
 * Validation rules for tenant creation
 */
export const createTenantValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('subdomain')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain must contain only lowercase let ters, numbers, and hyphens'),
  body('subscriptionPlan')
    .optional()
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Invalid subscription plan'),
];

/**
 * Validation rules for tenant update
 */
export const updateTenantValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Name must be between 2 and 255 characters'),
  body('subdomain')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Subdomain must contain only lowercase let ters, numbers, and hyphens'),
  body('subscriptionPlan')
    .optional()
    .isIn(['starter', 'professional', 'enterprise'])
    .withMessage('Invalid subscription plan'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
];

/**
 * Validation rules for tenant ID parameter
 */
export const tenantIdValidation = [
  param('id').isUUID().withMessage('Invalid tenant ID format'),
];
