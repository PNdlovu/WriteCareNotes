/**
 * @fileoverview cash transaction Controller
 * @module Financial/CashTransactionController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description cash transaction Controller
 */

import { Request, Response } from 'express';
import { CashTransactionService, CashTransactionRequest, CashTransactionUpdate, CashTransactionSearchCriteria } from '../../services/financial/CashTransactionService';
import { logger } from '../../utils/logger';

export class CashTransactionController {
  private cashTransactionService: CashTransactionService;

  constructor() {
    this.cashTransactionService = new CashTransactionService();
  }

  /**
   * Create a new cash transaction
   */
  async createCashTransaction(req: Request, res: Response): Promise<void> {
    try {
      const request: CashTransactionRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const transaction = await this.cashTransactionService.createCashTransaction(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'Cash transaction created successfully',
        data: transaction
      });
    } catch (error) {
      logger.error('Error creating cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create cash transaction'
      });
    }
  }

  /**
   * Get cash transaction by ID
   */
  async getCashTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;

      const transaction = await this.cashTransactionService.getCashTransactionById(transactionId);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Cash transaction not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      logger.error('Error getting cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: req.params.transactionId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get cash transaction'
      });
    }
  }

  /**
   * Search cash transactions
   */
  async searchCashTransactions(req: Request, res: Response): Promise<void> {
    try {
      const criteria: CashTransactionSearchCriteria = req.query;

      const transactions = await this.cashTransactionService.searchCashTransactions(criteria);

      res.status(200).json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      logger.error('Error searching cash transactions', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search cash transactions'
      });
    }
  }

  /**
   * Update cash transaction
   */
  async updateCashTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const updates: CashTransactionUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const transaction = await this.cashTransactionService.updateCashTransaction(
        transactionId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Cash transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      logger.error('Error updating cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: req.params.transactionId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update cash transaction'
      });
    }
  }

  /**
   * Process cash transaction
   */
  async processCashTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const processedBy = req.user?.id || 'system';

      const transaction = await this.cashTransactionService.processCashTransaction(
        transactionId,
        processedBy
      );

      res.status(200).json({
        success: true,
        message: 'Cash transaction processed successfully',
        data: transaction
      });
    } catch (error) {
      logger.error('Error processing cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: req.params.transactionId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process cash transaction'
      });
    }
  }

  /**
   * Reject cash transaction
   */
  async rejectCashTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const rejectedBy = req.user?.id || 'system';

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
        return;
      }

      const transaction = await this.cashTransactionService.rejectCashTransaction(
        transactionId,
        reason,
        rejectedBy
      );

      res.status(200).json({
        success: true,
        message: 'Cash transaction rejected successfully',
        data: transaction
      });
    } catch (error) {
      logger.error('Error rejecting cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: req.params.transactionId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject cash transaction'
      });
    }
  }

  /**
   * Reverse cash transaction
   */
  async reverseCashTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const { reason } = req.body;
      const reversedBy = req.user?.id || 'system';

      if (!reason) {
        res.status(400).json({
          success: false,
          message: 'Reversal reason is required'
        });
        return;
      }

      const reversalTransaction = await this.cashTransactionService.reverseCashTransaction(
        transactionId,
        reason,
        reversedBy
      );

      res.status(200).json({
        success: true,
        message: 'Cash transaction reversed successfully',
        data: reversalTransaction
      });
    } catch (error) {
      logger.error('Error reversing cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: req.params.transactionId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reverse cash transaction'
      });
    }
  }

  /**
   * Get cash transaction report
   */
  async getCashTransactionReport(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId } = req.query;

      const report = await this.cashTransactionService.getCashTransactionReport(
        careHomeId as string
      );

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting cash transaction report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get cash transaction report'
      });
    }
  }

  /**
   * Delete cash transaction
   */
  async deleteCashTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.cashTransactionService.deleteCashTransaction(transactionId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Cash transaction deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting cash transaction', {
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: req.params.transactionId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete cash transaction'
      });
    }
  }

  /**
   * Bulk update cash transaction status
   */
  async bulkUpdateCashTransactionStatus(req: Request, res: Response): Promise<void> {
    try {
      const { transactionIds, status, notes } = req.body;
      const updatedBy = req.user?.id || 'system';

      if (!transactionIds || !Array.isArray(transactionIds) || !status) {
        res.status(400).json({
          success: false,
          message: 'Transaction IDs array and status are required'
        });
        return;
      }

      const updatedCount = await this.cashTransactionService.bulkUpdateCashTransactionStatus(
        transactionIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} cash transactions updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating cash transaction status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update cash transaction status'
      });
    }
  }
}

export default CashTransactionController;