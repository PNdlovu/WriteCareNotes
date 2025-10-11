/**
 * @fileoverview Staff Controller - HTTP API Layer
 * @module Controllers/Staff/StaffController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-08
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * 
 * @description
 * Express controller for staff management endpoints.
 * Handles HTTP requests, validation, and response formatting.
 */

import { Request, Response } from 'express';
import { body, query, param, ValidationChain } from 'express-validator';
import { StaffService } from '../../services/staff/StaffService';
import { StaffStatus, EmploymentType, StaffRole } from '../../domains/staff/entities/StaffMember';

// Helper to get tenant context from request
function getTenantContext(req: Request): { userId: string; tenantId: string; organizationId: string } {
  return {
    userId: (req as any).user?.id || '',
    tenantId: (req as any).tenant?.id || '',
    organizationId: (req as any).tenant?.organizationId || '',
  };
}

export class StaffController {
  const ructor(private staffService: StaffService) {}

  /**
   * Create new staff member
   * POST /staff
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId, organizationId } = getTenantContext(req);
      const staff = await this.staffService.create(req.body, userId, tenantId, organizationId);

      res.status(201).json({
        status: 'success',
        data: staff,
        message: 'Staff member created successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to create staff member',
      });
    }
  }

  /**
   * Get staff member by ID
   * GET /staff/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const staff = await this.staffService.findById(req.params.id, tenantId);

      if (!staff) {
        res.status(404).json({
          status: 'error',
          message: 'Staff member not found',
        });
        return;
      }

      res.status(200).json({
        status: 'success',
        data: staff,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve staff member',
      });
    }
  }

  /**
   * Get all staff members with filters
   * GET /staff
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const filters = {
        status: req.query.status as StaffStatus,
        role: req.query.role as StaffRole,
        employmentType: req.query.employmentType as EmploymentType,
        department: req.query.department as string,
        searchTerm: req.query.searchTerm as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as string) || 'lastName',
        sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'ASC',
        organizationId: req.query.organizationId as string,
      };

      const result = await this.staffService.findAll(filters, tenantId);

      res.status(200).json({
        status: 'success',
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve staff members',
      });
    }
  }

  /**
   * Update staff member
   * PUT /staff/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const staff = await this.staffService.update(req.params.id, req.body, userId, tenantId);

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'Staff member updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to update staff member',
      });
    }
  }

  /**
   * Delete staff member (soft delete)
   * DELETE /staff/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      await this.staffService.delete(req.params.id, userId, tenantId);

      res.status(200).json({
        status: 'success',
        message: 'Staff member deleted successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to delete staff member',
      });
    }
  }

  /**
   * Restore deleted staff member
   * POST /staff/:id/restore
   */
  async restore(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const staff = await this.staffService.restore(req.params.id, userId, tenantId);

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'Staff member restored successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to restore staff member',
      });
    }
  }

  /**
   * Update staff status
   * PUT /staff/:id/status
   */
  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const { status, terminationDate } = req.body;

      const staff = await this.staffService.updateStatus(
        req.params.id,
        status,
        userId,
        tenantId,
        terminationDate ? new Date(terminationDate) : undefined
      );

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'Staff status updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to update staff status',
      });
    }
  }

  /**
   * Update certifications
   * PUT /staff/:id/certifications
   */
  async updateCertifications(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const staff = await this.staffService.updateCertifications(
        req.params.id,
        req.body.certifications,
        userId,
        tenantId
      );

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'Certifications updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to update certifications',
      });
    }
  }

  /**
   * Update DBS information
   * PUT /staff/:id/dbs
   */
  async updateDBS(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const { dbsNumber, dbsExpiry } = req.body;

      const staff = await this.staffService.updateDBS(
        req.params.id,
        dbsNumber,
        new Date(dbsExpiry),
        userId,
        tenantId
      );

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'DBS information updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to update DBS information',
      });
    }
  }

  /**
   * Update professional registration
   * PUT /staff/:id/registration
   */
  async updateRegistration(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const { registrationNumber, registrationExpiry } = req.body;

      const staff = await this.staffService.updateRegistration(
        req.params.id,
        registrationNumber,
        new Date(registrationExpiry),
        userId,
        tenantId
      );

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'Professional registration updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to update professional registration',
      });
    }
  }

  /**
   * Update availability schedule
   * PUT /staff/:id/availability
   */
  async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { userId, tenantId } = getTenantContext(req);
      const staff = await this.staffService.updateAvailability(
        req.params.id,
        req.body.availability,
        userId,
        tenantId
      );

      res.status(200).json({
        status: 'success',
        data: staff,
        message: 'Availability updated successfully',
      });
    } catch (error: any) {
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to update availability',
      });
    }
  }

  /**
   * Get staff with expiring certifications
   * GET /staff/compliance/expiring-certifications
   */
  async getExpiringCertifications(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead as string) : 30;
      const organizationId = req.query.organizationId as string;

      const result = await this.staffService.getExpiringCertifications(tenantId, daysAhead, organizationId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve expiring certifications',
      });
    }
  }

  /**
   * Get staff with expiring DBS
   * GET /staff/compliance/expiring-dbs
   */
  async getExpiringDBS(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const daysAhead = req.query.daysAhead ? parseInt(req.query.daysAhead as string) : 30;
      const organizationId = req.query.organizationId as string;

      const result = await this.staffService.getExpiringDBS(tenantId, daysAhead, organizationId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve expiring DBS',
      });
    }
  }

  /**
   * Get staff with invalid DBS
   * GET /staff/compliance/invalid-dbs
   */
  async getInvalidDBS(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const organizationId = req.query.organizationId as string;

      const result = await this.staffService.getInvalidDBS(tenantId, organizationId);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve invalid DBS',
      });
    }
  }

  /**
   * Get statistics
   * GET /staff/statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const organizationId = req.query.organizationId as string;

      const stats = await this.staffService.getStatistics(tenantId, organizationId);

      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve statistics',
      });
    }
  }

  /**
   * Get active staff count
   * GET /staff/count/active
   */
  async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const organizationId = req.query.organizationId as string;

      const count = await this.staffService.countActiveStaff(tenantId, organizationId);

      res.status(200).json({
        status: 'success',
        data: { count },
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve active staff count',
      });
    }
  }

  /**
   * Get staff by role
   * GET /staff/by-role/:role
   */
  async getByRole(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = getTenantContext(req);
      const role = req.params.role as StaffRole;
      const organizationId = req.query.organizationId as string;

      const staff = await this.staffService.findByRole(role, tenantId, organizationId);

      res.status(200).json({
        status: 'success',
        data: staff,
      });
    } catch (error: any) {
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to retrieve staff by role',
      });
    }
  }
}

// Validation rules
export const createStaffValidation: ValidationChain[] = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
  body('employmentType').isIn(Object.values(EmploymentType)).withMessage('Valid employment type is required'),
  body('role').isIn(Object.values(StaffRole)).withMessage('Valid role is required'),
  body('hireDate').isISO8601().withMessage('Valid hire date is required'),
];

export const updateStaffValidation: ValidationChain[] = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('dateOfBirth').optional().isISO8601().withMessage('Valid date of birth is required'),
  body('employmentType').optional().isIn(Object.values(EmploymentType)).withMessage('Valid employment type is required'),
  body('role').optional().isIn(Object.values(StaffRole)).withMessage('Valid role is required'),
  body('status').optional().isIn(Object.values(StaffStatus)).withMessage('Valid status is required'),
];

export const updateStatusValidation: ValidationChain[] = [
  body('status').isIn(Object.values(StaffStatus)).withMessage('Valid status is required'),
  body('terminationDate').optional().isISO8601().withMessage('Valid termination date is required'),
];

export const updateDBSValidation: ValidationChain[] = [
  body('dbsNumber').trim().notEmpty().withMessage('DBS number is required'),
  body('dbsExpiry').isISO8601().withMessage('Valid DBS expiry date is required'),
];

export const updateRegistrationValidation: ValidationChain[] = [
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('registrationExpiry').isISO8601().withMessage('Valid registration expiry date is required'),
];

export const updateCertificationsValidation: ValidationChain[] = [
  body('certifications').isArray().withMessage('Certifications must be an array'),
  body('certifications.*.name').trim().notEmpty().withMessage('Certification name is required'),
  body('certifications.*.issuingBody').trim().notEmpty().withMessage('Issuing body is required'),
  body('certifications.*.dateIssued').isISO8601().withMessage('Valid date issued is required'),
];

export default StaffController;
