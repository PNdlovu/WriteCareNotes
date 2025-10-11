/**
 * @fileoverview ledger account Controller
 * @module Financial/LedgerAccountController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description ledger account Controller
 */

import { Request, Response } from 'express';
import { LedgerAccountService, LedgerAccountRequest, LedgerAccountUpdate, LedgerAccountSearchCriteria } from '../../services/financial/LedgerAccountService';
import { logger } from '../../utils/logger';

export class LedgerAccountController {
  privateledgerAccountService: LedgerAccountService;

  const ructor() {
    this.ledgerAccountService = new LedgerAccountService();
  }

  /**
   * Create a new ledger account
   */
  async createLedgerAccount(req: Request, res: Response): Promise<void> {
    try {
      const request: LedgerAccountRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const account = await this.ledgerAccountService.createLedgerAccount(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'Ledger account created successfully',
        data: account
      });
    } catch (error) {
      logger.error('Error creating ledger account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create ledger account'
      });
    }
  }

  /**
   * Get ledger account by ID
   */
  async getLedgerAccountById(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      const account = await this.ledgerAccountService.getLedgerAccountById(accountId);

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Ledger account not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('Error getting ledger account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: req.params.accountId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get ledger account'
      });
    }
  }

  /**
   * Get ledger account by code
   */
  async getLedgerAccountByCode(req: Request, res: Response): Promise<void> {
    try {
      const { accountCode } = req.params;

      const account = await this.ledgerAccountService.getLedgerAccountByCode(accountCode);

      if (!account) {
        res.status(404).json({
          success: false,
          message: 'Ledger account not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: account
      });
    } catch (error) {
      logger.error('Error getting ledger account by code', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountCode: req.params.accountCode
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get ledger account'
      });
    }
  }

  /**
   * Search ledger accounts
   */
  async searchLedgerAccounts(req: Request, res: Response): Promise<void> {
    try {
      const criteria: LedgerAccountSearchCriteria = req.query;

      const accounts = await this.ledgerAccountService.searchLedgerAccounts(criteria);

      res.status(200).json({
        success: true,
        data: accounts,
        count: accounts.length
      });
    } catch (error) {
      logger.error('Error searching ledger accounts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search ledger accounts'
      });
    }
  }

  /**
   * Update ledger account
   */
  async updateLedgerAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const updates: LedgerAccountUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const account = await this.ledgerAccountService.updateLedgerAccount(
        accountId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Ledger account updated successfully',
        data: account
      });
    } catch (error) {
      logger.error('Error updating ledger account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: req.params.accountId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update ledger account'
      });
    }
  }

  /**
   * Close ledger account
   */
  async closeLedgerAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const closedBy = req.user?.id || 'system';

      const account = await this.ledgerAccountService.closeLedgerAccount(
        accountId,
        closedBy
      );

      res.status(200).json({
        success: true,
        message: 'Ledger account closed successfully',
        data: account
      });
    } catch (error) {
      logger.error('Error closing ledger account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: req.params.accountId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to close ledger account'
      });
    }
  }

  /**
   * Get ledger account balance
   */
  async getLedgerAccountBalance(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      const balance = await this.ledgerAccountService.getLedgerAccountBalance(accountId);

      res.status(200).json({
        success: true,
        data: balance
      });
    } catch (error) {
      logger.error('Error getting ledger account balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: req.params.accountId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get ledger account balance'
      });
    }
  }

  /**
   * Get ledger account summary
   */
  async getLedgerAccountSummary(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;

      const summary = await this.ledgerAccountService.getLedgerAccountSummary(accountId);

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting ledger account summary', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: req.params.accountId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get ledger account summary'
      });
    }
  }

  /**
   * Get chart of accounts
   */
  async getChartOfAccounts(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId } = req.query;

      const chart = await this.ledgerAccountService.getChartOfAccounts(
        careHomeId as string
      );

      res.status(200).json({
        success: true,
        data: chart
      });
    } catch (error) {
      logger.error('Error getting chart of accounts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get chart of accounts'
      });
    }
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(req: Request, res: Response): Promise<void> {
    try {
      const { careHomeId, asOfDate } = req.query;

      const trialBalance = await this.ledgerAccountService.getTrialBalance(
        careHomeId as string,
        asOfDate ? new Date(asOfDate as string) : new Date()
      );

      res.status(200).json({
        success: true,
        data: trialBalance
      });
    } catch (error) {
      logger.error('Error getting trial balance', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get trial balance'
      });
    }
  }

  /**
   * Delete ledger account
   */
  async deleteLedgerAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.ledgerAccountService.deleteLedgerAccount(accountId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Ledger account deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting ledger account', {
        error: error instanceof Error ? error.message : 'Unknown error',
        accountId: req.params.accountId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete ledger account'
      });
    }
  }

  /**
   * Bulk update ledger account status
   */
  async bulkUpdateLedgerAccountStatus(req: Request, res: Response): Promise<void> {
    try {
      const { accountIds, status, notes } = req.body;
      const updatedBy = req.user?.id || 'system';

      if (!accountIds || !Array.isArray(accountIds) || !status) {
        res.status(400).json({
          success: false,
          message: 'Account IDs array and status are required'
        });
        return;
      }

      const updatedCount = await this.ledgerAccountService.bulkUpdateLedgerAccountStatus(
        accountIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} ledger accounts updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating ledger account status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update ledger account status'
      });
    }
  }
}

export default LedgerAccountController;
