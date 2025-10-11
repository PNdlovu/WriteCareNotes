/**
 * @fileoverview d v l a check Controller
 * @module Hr/DVLACheckController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description d v l a check Controller
 */

import { Request, Response } from 'express';
import { DVLACheckService, DVLACheckRequest, DVLACheckUpdate, DVLACheckSearchCriteria } from '../../services/hr/DVLACheckService';
import { logger } from '../../utils/logger';

export class DVLACheckController {
  privatedvlaCheckService: DVLACheckService;

  const ructor() {
    this.dvlaCheckService = new DVLACheckService();
  }

  /**
   * Create a new DVLA check request
   */
  async createDVLACheck(req: Request, res: Response): Promise<void> {
    try {
      const request: DVLACheckRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const check = await this.dvlaCheckService.createDVLACheck(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'DVLA check request created successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error creating DVLA check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create DVLA check'
      });
    }
  }

  /**
   * Get DVLA check by ID
   */
  async getDVLACheckById(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;

      const check = await this.dvlaCheckService.getDVLACheckById(checkId);

      if (!check) {
        res.status(404).json({
          success: false,
          message: 'DVLA check not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: check
      });
    } catch (error) {
      logger.error('Error getting DVLA check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get DVLA check'
      });
    }
  }

  /**
   * Get DVLA checks by employee ID
   */
  async getDVLAChecksByEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;

      const checks = await this.dvlaCheckService.getDVLAChecksByEmployee(employeeId);

      res.status(200).json({
        success: true,
        data: checks
      });
    } catch (error) {
      logger.error('Error getting DVLA checks by employee', {
        error: error instanceof Error ? error.message : 'Unknown error',
        employeeId: req.params.employeeId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get DVLA checks'
      });
    }
  }

  /**
   * Search DVLA checks
   */
  async searchDVLAChecks(req: Request, res: Response): Promise<void> {
    try {
      const criteria: DVLACheckSearchCriteria = req.query;

      const checks = await this.dvlaCheckService.searchDVLAChecks(criteria);

      res.status(200).json({
        success: true,
        data: checks,
        count: checks.length
      });
    } catch (error) {
      logger.error('Error searching DVLA checks', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search DVLA checks'
      });
    }
  }

  /**
   * Update DVLA check
   */
  async updateDVLACheck(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const updates: DVLACheckUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const check = await this.dvlaCheckService.updateDVLACheck(
        checkId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'DVLA check updated successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error updating DVLA check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update DVLA check'
      });
    }
  }

  /**
   * Start DVLA verification
   */
  async startDVLACheckVerification(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const startedBy = req.user?.id || 'system';

      const check = await this.dvlaCheckService.startDVLACheckVerification(
        checkId,
        startedBy
      );

      res.status(200).json({
        success: true,
        message: 'DVLA verification started successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error starting DVLA verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start DVLA verification'
      });
    }
  }

  /**
   * Submit for verification
   */
  async submitForVerification(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const submittedBy = req.user?.id || 'system';

      const check = await this.dvlaCheckService.submitForVerification(
        checkId,
        submittedBy
      );

      res.status(200).json({
        success: true,
        message: 'DVLA check submitted for verification successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error submitting DVLA check for verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit DVLA check for verification'
      });
    }
  }

  /**
   * Complete verification
   */
  async completeVerification(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const { isValid, notes } = req.body;
      const verifiedBy = req.user?.id || 'system';

      if (typeof isValid !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isValid status is required and must be a boolean'
        });
        return;
      }

      const check = await this.dvlaCheckService.completeVerification(
        checkId,
        isValid,
        verifiedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'DVLA verification completed successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error completing DVLA verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete DVLA verification'
      });
    }
  }

  /**
   * Reject verification
   */
  async rejectVerification(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const { reason } = req.body;
      const rejectedBy = req.user?.id || 'system';

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
        return;
      }

      const check = await this.dvlaCheckService.rejectVerification(
        checkId,
        reason,
        rejectedBy
      );

      res.status(200).json({
        success: true,
        message: 'DVLA verification rejected successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error rejecting DVLA verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject DVLA verification'
      });
    }
  }

  /**
   * Check license category
   */
  async checkLicenseCategory(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const { requiredCategory } = req.body;

      if (!requiredCategory) {
        res.status(400).json({
          success: false,
          message: 'Required category is required'
        });
        return;
      }

      const hasCategory = await this.dvlaCheckService.checkLicenseCategory(
        checkId,
        requiredCategory
      );

      res.status(200).json({
        success: true,
        data: { hasCategory, requiredCategory }
      });
    } catch (error) {
      logger.error('Error checking license category', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check license category'
      });
    }
  }

  /**
   * Check license categories
   */
  async checkLicenseCategories(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const { requiredCategories } = req.body;

      if (!requiredCategories || !Array.isArray(requiredCategories)) {
        res.status(400).json({
          success: false,
          message: 'Required categories array is required'
        });
        return;
      }

      const hasCategories = await this.dvlaCheckService.checkLicenseCategories(
        checkId,
        requiredCategories
      );

      res.status(200).json({
        success: true,
        data: { hasCategories, requiredCategories }
      });
    } catch (error) {
      logger.error('Error checking license categories', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to check license categories'
      });
    }
  }

  /**
   * Get DVLA compliance report
   */
  async getDVLACheckComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId } = req.query;

      const report = await this.dvlaCheckService.getDVLACheckComplianceReport(
        careHomeId as string
      );

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting DVLA compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get DVLA compliance report'
      });
    }
  }

  /**
   * Get expiring DVLA checks
   */
  async getExpiringDVLAChecks(req: Request, res: Response): Promise<void> {
    try {
      const { withinDays = 30 } = req.query;

      const checks = await this.dvlaCheckService.getExpiringDVLAChecks(
        Number(withinDays)
      );

      res.status(200).json({
        success: true,
        data: checks,
        count: checks.length
      });
    } catch (error) {
      logger.error('Error getting expiring DVLA checks', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get expiring DVLA checks'
      });
    }
  }

  /**
   * Get expired DVLA checks
   */
  async getExpiredDVLAChecks(req: Request, res: Response): Promise<void> {
    try {
      const checks = await this.dvlaCheckService.getExpiredDVLAChecks();

      res.status(200).json({
        success: true,
        data: checks,
        count: checks.length
      });
    } catch (error) {
      logger.error('Error getting expired DVLA checks', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get expired DVLA checks'
      });
    }
  }

  /**
   * Delete DVLA check
   */
  async deleteDVLACheck(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.dvlaCheckService.deleteDVLACheck(checkId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'DVLA check deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting DVLA check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete DVLA check'
      });
    }
  }

  /**
   * Bulk update DVLA check status
   */
  async bulkUpdateDVLACheckStatus(req: Request, res: Response): Promise<void> {
    try {
      const { checkIds, status, notes } = req.body;
      const updatedBy = req.user?.id || 'system';

      if (!checkIds || !Array.isArray(checkIds) || !status) {
        res.status(400).json({
          success: false,
          message: 'Check IDs array and status are required'
        });
        return;
      }

      const updatedCount = await this.dvlaCheckService.bulkUpdateDVLACheckStatus(
        checkIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} DVLA checks updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating DVLA check status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update DVLA check status'
      });
    }
  }
}

export default DVLACheckController;
