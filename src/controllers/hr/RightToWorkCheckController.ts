/**
 * @fileoverview right to work check Controller
 * @module Hr/RightToWorkCheckController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description right to work check Controller
 */

import { Request, Response } from 'express';
import { RightToWorkCheckService, RightToWorkCheckRequest, RightToWorkCheckUpdate, RightToWorkCheckSearchCriteria } from '../../services/hr/RightToWorkCheckService';
import { logger } from '../../utils/logger';

export class RightToWorkCheckController {
  private rightToWorkCheckService: RightToWorkCheckService;

  constructor() {
    this.rightToWorkCheckService = new RightToWorkCheckService();
  }

  /**
   * Create a new Right to Work check request
   */
  async createRightToWorkCheck(req: Request, res: Response): Promise<void> {
    try {
      const request: RightToWorkCheckRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const check = await this.rightToWorkCheckService.createRightToWorkCheck(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'Right to Work check request created successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error creating Right to Work check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create Right to Work check'
      });
    }
  }

  /**
   * Get Right to Work check by ID
   */
  async getRightToWorkCheckById(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;

      const check = await this.rightToWorkCheckService.getRightToWorkCheckById(checkId);

      if (!check) {
        res.status(404).json({
          success: false,
          message: 'Right to Work check not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: check
      });
    } catch (error) {
      logger.error('Error getting Right to Work check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get Right to Work check'
      });
    }
  }

  /**
   * Get Right to Work checks by employee ID
   */
  async getRightToWorkChecksByEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;

      const checks = await this.rightToWorkCheckService.getRightToWorkChecksByEmployee(employeeId);

      res.status(200).json({
        success: true,
        data: checks
      });
    } catch (error) {
      logger.error('Error getting Right to Work checks by employee', {
        error: error instanceof Error ? error.message : 'Unknown error',
        employeeId: req.params.employeeId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get Right to Work checks'
      });
    }
  }

  /**
   * Search Right to Work checks
   */
  async searchRightToWorkChecks(req: Request, res: Response): Promise<void> {
    try {
      const criteria: RightToWorkCheckSearchCriteria = req.query;

      const checks = await this.rightToWorkCheckService.searchRightToWorkChecks(criteria);

      res.status(200).json({
        success: true,
        data: checks,
        count: checks.length
      });
    } catch (error) {
      logger.error('Error searching Right to Work checks', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search Right to Work checks'
      });
    }
  }

  /**
   * Update Right to Work check
   */
  async updateRightToWorkCheck(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const updates: RightToWorkCheckUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const check = await this.rightToWorkCheckService.updateRightToWorkCheck(
        checkId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Right to Work check updated successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error updating Right to Work check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update Right to Work check'
      });
    }
  }

  /**
   * Start Right to Work verification
   */
  async startRightToWorkVerification(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const startedBy = req.user?.id || 'system';

      const check = await this.rightToWorkCheckService.startRightToWorkVerification(
        checkId,
        startedBy
      );

      res.status(200).json({
        success: true,
        message: 'Right to Work verification started successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error starting Right to Work verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start Right to Work verification'
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

      const check = await this.rightToWorkCheckService.submitForVerification(
        checkId,
        submittedBy
      );

      res.status(200).json({
        success: true,
        message: 'Right to Work check submitted for verification successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error submitting Right to Work check for verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit Right to Work check for verification'
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

      const check = await this.rightToWorkCheckService.completeVerification(
        checkId,
        isValid,
        verifiedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'Right to Work verification completed successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error completing Right to Work verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete Right to Work verification'
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

      const check = await this.rightToWorkCheckService.rejectVerification(
        checkId,
        reason,
        rejectedBy
      );

      res.status(200).json({
        success: true,
        message: 'Right to Work verification rejected successfully',
        data: check
      });
    } catch (error) {
      logger.error('Error rejecting Right to Work verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject Right to Work verification'
      });
    }
  }

  /**
   * Get Right to Work compliance report
   */
  async getRightToWorkComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId } = req.query;

      const report = await this.rightToWorkCheckService.getRightToWorkComplianceReport(
        careHomeId as string
      );

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting Right to Work compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get Right to Work compliance report'
      });
    }
  }

  /**
   * Get expiring Right to Work checks
   */
  async getExpiringRightToWorkChecks(req: Request, res: Response): Promise<void> {
    try {
      const { withinDays = 30 } = req.query;

      const checks = await this.rightToWorkCheckService.getExpiringRightToWorkChecks(
        Number(withinDays)
      );

      res.status(200).json({
        success: true,
        data: checks,
        count: checks.length
      });
    } catch (error) {
      logger.error('Error getting expiring Right to Work checks', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get expiring Right to Work checks'
      });
    }
  }

  /**
   * Get expired Right to Work checks
   */
  async getExpiredRightToWorkChecks(req: Request, res: Response): Promise<void> {
    try {
      const checks = await this.rightToWorkCheckService.getExpiredRightToWorkChecks();

      res.status(200).json({
        success: true,
        data: checks,
        count: checks.length
      });
    } catch (error) {
      logger.error('Error getting expired Right to Work checks', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get expired Right to Work checks'
      });
    }
  }

  /**
   * Delete Right to Work check
   */
  async deleteRightToWorkCheck(req: Request, res: Response): Promise<void> {
    try {
      const { checkId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.rightToWorkCheckService.deleteRightToWorkCheck(checkId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Right to Work check deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting Right to Work check', {
        error: error instanceof Error ? error.message : 'Unknown error',
        checkId: req.params.checkId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete Right to Work check'
      });
    }
  }

  /**
   * Bulk update Right to Work check status
   */
  async bulkUpdateRightToWorkCheckStatus(req: Request, res: Response): Promise<void> {
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

      const updatedCount = await this.rightToWorkCheckService.bulkUpdateRightToWorkCheckStatus(
        checkIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} Right to Work checks updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating Right to Work check status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update Right to Work check status'
      });
    }
  }
}

export default RightToWorkCheckController;