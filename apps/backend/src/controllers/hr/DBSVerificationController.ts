/**
 * @fileoverview d b s verification Controller
 * @module Hr/DBSVerificationController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description d b s verification Controller
 */

import { Request, Response } from 'express';
import { DBSVerificationService, DBSVerificationRequest, DBSVerificationUpdate, DBSVerificationSearchCriteria } from '../../services/hr/DBSVerificationService';
import { logger } from '../../utils/logger';

export class DBSVerificationController {
  privatedbsVerificationService: DBSVerificationService;

  constructor() {
    this.dbsVerificationService = new DBSVerificationService();
  }

  /**
   * Create a new DBS verification request
   */
  async createDBSVerification(req: Request, res: Response): Promise<void> {
    try {
      constrequest: DBSVerificationRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const verification = await this.dbsVerificationService.createDBSVerification(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'DBS verification request created successfully',
        data: verification
      });
    } catch (error) {
      logger.error('Error creating DBS verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create DBS verification'
      });
    }
  }

  /**
   * Get DBS verification by ID
   */
  async getDBSVerificationById(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;

      const verification = await this.dbsVerificationService.getDBSVerificationById(verificationId);

      if (!verification) {
        res.status(404).json({
          success: false,
          message: 'DBS verification not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: verification
      });
    } catch (error) {
      logger.error('Error getting DBS verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get DBS verification'
      });
    }
  }

  /**
   * Get DBS verifications by employee ID
   */
  async getDBSVerificationsByEmployee(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;

      const verifications = await this.dbsVerificationService.getDBSVerificationsByEmployee(employeeId);

      res.status(200).json({
        success: true,
        data: verifications
      });
    } catch (error) {
      logger.error('Error getting DBS verifications by employee', {
        error: error instanceof Error ? error.message : 'Unknown error',
        employeeId: req.params.employeeId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get DBS verifications'
      });
    }
  }

  /**
   * Search DBS verifications
   */
  async searchDBSVerifications(req: Request, res: Response): Promise<void> {
    try {
      constcriteria: DBSVerificationSearchCriteria = req.query;

      const verifications = await this.dbsVerificationService.searchDBSVerifications(criteria);

      res.status(200).json({
        success: true,
        data: verifications,
        count: verifications.length
      });
    } catch (error) {
      logger.error('Error searching DBS verifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search DBS verifications'
      });
    }
  }

  /**
   * Update DBS verification
   */
  async updateDBSVerification(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;
      constupdates: DBSVerificationUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const verification = await this.dbsVerificationService.updateDBSVerification(
        verificationId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'DBS verification updated successfully',
        data: verification
      });
    } catch (error) {
      logger.error('Error updating DBS verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update DBS verification'
      });
    }
  }

  /**
   * Start DBS application process
   */
  async startDBSApplication(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;
      const { applicationReference } = req.body;
      const startedBy = req.user?.id || 'system';

      if (!applicationReference) {
        res.status(400).json({
          success: false,
          message: 'Application reference is required'
        });
        return;
      }

      const verification = await this.dbsVerificationService.startDBSApplication(
        verificationId,
        applicationReference,
        startedBy
      );

      res.status(200).json({
        success: true,
        message: 'DBS application started successfully',
        data: verification
      });
    } catch (error) {
      logger.error('Error starting DBS application', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to start DBS application'
      });
    }
  }

  /**
   * Submit DBS application
   */
  async submitDBSApplication(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;
      const { dbsReferenceNumber } = req.body;
      const submittedBy = req.user?.id || 'system';

      if (!dbsReferenceNumber) {
        res.status(400).json({
          success: false,
          message: 'DBS reference number is required'
        });
        return;
      }

      const verification = await this.dbsVerificationService.submitDBSApplication(
        verificationId,
        dbsReferenceNumber,
        submittedBy
      );

      res.status(200).json({
        success: true,
        message: 'DBS application submitted successfully',
        data: verification
      });
    } catch (error) {
      logger.error('Error submitting DBS application', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit DBS application'
      });
    }
  }

  /**
   * Complete DBS verification
   */
  async completeDBSVerification(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;
      const { certificateNumber, isCleared, notes } = req.body;
      const completedBy = req.user?.id || 'system';

      if (!certificateNumber || typeof isCleared !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'Certificate number and isCleared status are required'
        });
        return;
      }

      const verification = await this.dbsVerificationService.completeDBSVerification(
        verificationId,
        certificateNumber,
        isCleared,
        completedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: 'DBS verification completed successfully',
        data: verification
      });
    } catch (error) {
      logger.error('Error completing DBS verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to complete DBS verification'
      });
    }
  }

  /**
   * Reject DBS verification
   */
  async rejectDBSVerification(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;
      const { reason } = req.body;
      const rejectedBy = req.user?.id || 'system';

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
        return;
      }

      const verification = await this.dbsVerificationService.rejectDBSVerification(
        verificationId,
        reason,
        rejectedBy
      );

      res.status(200).json({
        success: true,
        message: 'DBS verification rejected successfully',
        data: verification
      });
    } catch (error) {
      logger.error('Error rejecting DBS verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject DBS verification'
      });
    }
  }

  /**
   * Get DBS compliance report
   */
  async getDBSComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId } = req.query;

      const report = await this.dbsVerificationService.getDBSComplianceReport(
        careHomeId as string
      );

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting DBS compliance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get DBS compliance report'
      });
    }
  }

  /**
   * Get expiring DBS verifications
   */
  async getExpiringDBSVerifications(req: Request, res: Response): Promise<void> {
    try {
      const { withinDays = 30 } = req.query;

      const verifications = await this.dbsVerificationService.getExpiringDBSVerifications(
        Number(withinDays)
      );

      res.status(200).json({
        success: true,
        data: verifications,
        count: verifications.length
      });
    } catch (error) {
      logger.error('Error getting expiring DBS verifications', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get expiring DBS verifications'
      });
    }
  }

  /**
   * Get expired DBS verifications
   */
  async getExpiredDBSVerifications(req: Request, res: Response): Promise<void> {
    try {
      const verifications = await this.dbsVerificationService.getExpiredDBSVerifications();

      res.status(200).json({
        success: true,
        data: verifications,
        count: verifications.length
      });
    } catch (error) {
      logger.error('Error getting expired DBS verifications', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get expired DBS verifications'
      });
    }
  }

  /**
   * Delete DBS verification
   */
  async deleteDBSVerification(req: Request, res: Response): Promise<void> {
    try {
      const { verificationId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.dbsVerificationService.deleteDBSVerification(verificationId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'DBS verification deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting DBS verification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationId: req.params.verificationId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete DBS verification'
      });
    }
  }

  /**
   * Bulk update DBS verification status
   */
  async bulkUpdateDBSVerificationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { verificationIds, status, notes } = req.body;
      const updatedBy = req.user?.id || 'system';

      if (!verificationIds || !Array.isArray(verificationIds) || !status) {
        res.status(400).json({
          success: false,
          message: 'Verification IDs array and status are required'
        });
        return;
      }

      const updatedCount = await this.dbsVerificationService.bulkUpdateDBSVerificationStatus(
        verificationIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} DBS verifications updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating DBS verification status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update DBS verification status'
      });
    }
  }
}

export default DBSVerificationController;
