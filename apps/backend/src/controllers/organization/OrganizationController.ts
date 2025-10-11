/**
 * @fileoverview Organization Controller
 * @module Controllers/Organization/OrganizationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Handles organization CRUD operations with tenant isolation
 */

import { Request, Response } from 'express';
import { DataSource } from 'typeorm';
import {
  OrganizationService,
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from '../../services/organization/OrganizationService';
import { getTenantContext } from '../../middleware/tenant-isolation.middleware';
import { body, param, validationResult } from 'express-validator';
import { OrganizationType } from '../../entities/Organization';

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor(dataSource: DataSource) {
    this.organizationService = new OrganizationService(dataSource);
  }

  /**
   * POST /organizations
   * Create new organization
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

      const tenantContext = getTenantContext(req);
      if (!tenantContext) {
        res.status(403).json({
          success: false,
          error: { code: 'TENANT_REQUIRED', message: 'Tenant context required' },
        });
        return;
      }

      const dto: CreateOrganizationDto = {
        ...req.body,
        tenantId: tenantContext.tenantId,
        createdBy: tenantContext.userId,
      };

      const organization = await this.organizationService.create(dto);

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_CREATE_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * GET /organizations/:id
   * Get organization by ID
   */
  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantContext = getTenantContext(req);
      const { id } = req.params;

      const organization = await this.organizationService.findById(
        id,
        tenantContext?.tenantId
      );

      if (!organization) {
        res.status(404).json({
          success: false,
          error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_FETCH_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * GET /organizations
   * Get all organizations (tenant-scoped)
   */
  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantContext = getTenantContext(req);
      const { type, name } = req.query;

      const organizations = await this.organizationService.findAll({
        tenantId: tenantContext?.tenantId,
        type: type as OrganizationType,
        name: name as string,
      });

      res.status(200).json({
        success: true,
        data: organizations,
        meta: {
          total: organizations.length,
        },
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_LIST_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * PUT /organizations/:id
   * Update organization
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

      const tenantContext = getTenantContext(req);
      const { id } = req.params;

      const dto: UpdateOrganizationDto = {
        ...req.body,
        updatedBy: tenantContext?.userId,
      };

      const organization = await this.organizationService.update(
        id,
        dto,
        tenantContext?.tenantId
      );

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_UPDATE_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * DELETE /organizations/:id
   * Soft delete organization
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantContext = getTenantContext(req);
      const { id } = req.params;

      await this.organizationService.delete(
        id,
        tenantContext?.tenantId,
        tenantContext?.userId
      );

      res.status(200).json({
        success: true,
        message: 'Organization deleted successfully',
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_DELETE_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * PUT /organizations/:id/settings
   * Update organization settings
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantContext = getTenantContext(req);
      const { id } = req.params;

      const organization = await this.organizationService.updateSettings(
        id,
        req.body,
        tenantContext?.tenantId
      );

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_SETTINGS_UPDATE_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };

  /**
   * PUT /organizations/:id/compliance
   * Update compliance status
   */
  updateComplianceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const tenantContext = getTenantContext(req);
      const { id } = req.params;

      const organization = await this.organizationService.updateComplianceStatus(
        id,
        req.body,
        tenantContext?.tenantId
      );

      res.status(200).json({
        success: true,
        data: organization,
      });
    } catch (error: unknown) {
      res.status(500).json({
        success: false,
        error: {
          code: 'ORG_COMPLIANCE_UPDATE_FAILED',
          message: (error as Error).message,
        },
      });
    }
  };
}

// Validation middleware
export const createOrganizationValidation = [
  body('name').notEmpty().withMessage('Organization name is required').trim(),
  body('type')
    .isIn(Object.values(OrganizationType))
    .withMessage('Invalid organization type'),
  body('cqcRegistration').optional().trim(),
  body('ofstedRegistration').optional().trim(),
  body('address').optional().isObject(),
  body('contactInfo').optional().isObject(),
  body('settings').optional().isObject(),
];

export const updateOrganizationValidation = [
  param('id').isUUID().withMessage('Invalid organization ID'),
  body('name').optional().trim(),
  body('type').optional().isIn(Object.values(OrganizationType)),
  body('cqcRegistration').optional().trim(),
  body('address').optional().isObject(),
  body('contactInfo').optional().isObject(),
  body('settings').optional().isObject(),
];

export const organizationIdValidation = [
  param('id').isUUID().withMessage('Invalid organization ID'),
];
