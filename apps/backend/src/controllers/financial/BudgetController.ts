/**
 * @fileoverview budget Controller
 * @module Financial/BudgetController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description budget Controller
 */

import { Request, Response } from 'express';
import { BudgetService, BudgetRequest, BudgetUpdate, BudgetSearchCriteria } from '../../services/financial/BudgetService';
import { logger } from '../../utils/logger';

export class BudgetController {
  privatebudgetService: BudgetService;

  constructor() {
    this.budgetService = new BudgetService();
  }

  /**
   * Create a new budget
   */
  async createBudget(req: Request, res: Response): Promise<void> {
    try {
      constrequest: BudgetRequest = req.body;
      const createdBy = req.user?.id || 'system';

      const budget = await this.budgetService.createBudget(request, createdBy);

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget
      });
    } catch (error) {
      logger.error('Error creating budget', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create budget'
      });
    }
  }

  /**
   * Get budget by ID
   */
  async getBudgetById(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;

      const budget = await this.budgetService.getBudgetById(budgetId);

      if (!budget) {
        res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: budget
      });
    } catch (error) {
      logger.error('Error getting budget', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get budget'
      });
    }
  }

  /**
   * Search budgets
   */
  async searchBudgets(req: Request, res: Response): Promise<void> {
    try {
      constcriteria: BudgetSearchCriteria = req.query;

      const budgets = await this.budgetService.searchBudgets(criteria);

      res.status(200).json({
        success: true,
        data: budgets,
        count: budgets.length
      });
    } catch (error) {
      logger.error('Error searching budgets', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Failed to search budgets'
      });
    }
  }

  /**
   * Update budget
   */
  async updateBudget(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      constupdates: BudgetUpdate = req.body;
      const updatedBy = req.user?.id || 'system';

      const budget = await this.budgetService.updateBudget(
        budgetId,
        updates,
        updatedBy
      );

      res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: budget
      });
    } catch (error) {
      logger.error('Error updating budget', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update budget'
      });
    }
  }

  /**
   * Submit budget for approval
   */
  async submitBudgetForApproval(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      const submittedBy = req.user?.id || 'system';

      const budget = await this.budgetService.submitBudgetForApproval(
        budgetId,
        submittedBy
      );

      res.status(200).json({
        success: true,
        message: 'Budget submitted for approval successfully',
        data: budget
      });
    } catch (error) {
      logger.error('Error submitting budget for approval', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit budget for approval'
      });
    }
  }

  /**
   * Approve budget
   */
  async approveBudget(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      const { approvalNotes } = req.body;
      const approvedBy = req.user?.id || 'system';

      const budget = await this.budgetService.approveBudget(
        budgetId,
        approvedBy,
        approvalNotes
      );

      res.status(200).json({
        success: true,
        message: 'Budget approved successfully',
        data: budget
      });
    } catch (error) {
      logger.error('Error approving budget', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve budget'
      });
    }
  }

  /**
   * Reject budget
   */
  async rejectBudget(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      const { rejectionNotes } = req.body;
      const rejectedBy = req.user?.id || 'system';

      if (!rejectionNotes) {
        res.status(400).json({
          success: false,
          message: 'Rejection notes are required'
        });
        return;
      }

      const budget = await this.budgetService.rejectBudget(
        budgetId,
        rejectedBy,
        rejectionNotes
      );

      res.status(200).json({
        success: true,
        message: 'Budget rejected successfully',
        data: budget
      });
    } catch (error) {
      logger.error('Error rejecting budget', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId,
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject budget'
      });
    }
  }

  /**
   * Get budget performance report
   */
  async getBudgetPerformanceReport(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;

      const report = await this.budgetService.getBudgetPerformanceReport(budgetId);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting budget performance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get budget performance report'
      });
    }
  }

  /**
   * Get budget variance report
   */
  async getBudgetVarianceReport(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;

      const report = await this.budgetService.getBudgetVarianceReport(budgetId);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Error getting budget variance report', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId
      });

      res.status(500).json({
        success: false,
        message: 'Failed to get budget variance report'
      });
    }
  }

  /**
   * Delete budget
   */
  async deleteBudget(req: Request, res: Response): Promise<void> {
    try {
      const { budgetId } = req.params;
      const deletedBy = req.user?.id || 'system';

      await this.budgetService.deleteBudget(budgetId, deletedBy);

      res.status(200).json({
        success: true,
        message: 'Budget deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting budget', {
        error: error instanceof Error ? error.message : 'Unknown error',
        budgetId: req.params.budgetId
      });

      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete budget'
      });
    }
  }

  /**
   * Bulk update budget status
   */
  async bulkUpdateBudgetStatus(req: Request, res: Response): Promise<void> {
    try {
      const { budgetIds, status, notes } = req.body;
      const updatedBy = req.user?.id || 'system';

      if (!budgetIds || !Array.isArray(budgetIds) || !status) {
        res.status(400).json({
          success: false,
          message: 'Budget IDs array and status are required'
        });
        return;
      }

      const updatedCount = await this.budgetService.bulkUpdateBudgetStatus(
        budgetIds,
        status,
        updatedBy,
        notes
      );

      res.status(200).json({
        success: true,
        message: `${updatedCount} budgets updated successfully`,
        data: { updatedCount }
      });
    } catch (error) {
      logger.error('Error bulk updating budget status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        body: req.body
      });

      res.status(400).json({
        success: false,
        message: 'Failed to bulk update budget status'
      });
    }
  }
}

export default BudgetController;
