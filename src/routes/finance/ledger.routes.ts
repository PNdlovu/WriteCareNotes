import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { LedgerAccountService } from '../../services/finance/LedgerAccountService';
import { JournalEntryService } from '../../services/finance/JournalEntryService';
import { logger } from '../../utils/logger';

const router = Router();
const ledgerAccountService = new LedgerAccountService();
const journalEntryService = new JournalEntryService();

/**
 * @fileoverview Ledger Management API Routes
 * @module LedgerRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for ledger account and journal entry management
 * including double-entry accounting, real-time posting, and audit trails.
 */

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Ledger Account Routes

/**
 * @route GET /api/finance/ledger/accounts
 * @desc Get all ledger accounts with optional filtering
 * @access Private
 */
router.get('/accounts', [
  query('accountType').optional().isIn(['asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_sales', 'other_income', 'other_expense']),
  query('accountCategory').optional().isIn(['current_asset', 'fixed_asset', 'current_liability', 'long_term_liability', 'owners_equity', 'operating_revenue', 'non_operating_revenue', 'operating_expense', 'non_operating_expense', 'direct_cost', 'indirect_cost']),
  query('status').optional().isIn(['active', 'inactive', 'suspended', 'closed']),
  query('parentAccountId').optional().isUUID(),
  query('isActive').optional().isBoolean(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      accountType: req.query.accountType as string,
      accountCategory: req.query.accountCategory as string,
      status: req.query.status as string,
      parentAccountId: req.query.parentAccountId as string,
      isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await ledgerAccountService.getAllLedgerAccounts(filters);
    
    res.json({
      success: true,
      data: result.accounts,
      pagination: result.pagination,
      message: 'Ledger accounts retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving ledger accounts:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/ledger/accounts/:id
 * @desc Get ledger account by ID
 * @access Private
 */
router.get('/accounts/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await ledgerAccountService.getLedgerAccountById(req.params.id);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Ledger account not found'
      });
    }

    res.json({
      success: true,
      data: account,
      message: 'Ledger account retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving ledger account:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/ledger/accounts
 * @desc Create new ledger account
 * @access Private
 */
router.post('/accounts', [
  body('accountCode').isString().isLength({ min: 3, max: 20 }),
  body('accountName').isString().isLength({ min: 3, max: 255 }),
  body('description').optional().isString(),
  body('accountType').isIn(['asset', 'liability', 'equity', 'revenue', 'expense', 'cost_of_sales', 'other_income', 'other_expense']),
  body('accountCategory').isIn(['current_asset', 'fixed_asset', 'current_liability', 'long_term_liability', 'owners_equity', 'operating_revenue', 'non_operating_revenue', 'operating_expense', 'non_operating_expense', 'direct_cost', 'indirect_cost']),
  body('parentAccountId').optional().isUUID(),
  body('level').optional().isInt({ min: 0 }),
  body('isSystemAccount').optional().isBoolean(),
  body('isContraAccount').optional().isBoolean(),
  body('isControlAccount').optional().isBoolean(),
  body('requiresReconciliation').optional().isBoolean(),
  body('careHomeId').optional().isUUID(),
  body('department').optional().isString().isLength({ min: 1, max: 100 }),
  body('costCenter').optional().isString().isLength({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const account = await ledgerAccountService.createLedgerAccount(accountData);
    
    res.status(201).json({
      success: true,
      data: account,
      message: 'Ledger account created successfully'
    });
  } catch (error) {
    logger.error('Error creating ledger account:', error);
    next(error);
  }
});

/**
 * @route PUT /api/finance/ledger/accounts/:id
 * @desc Update ledger account
 * @access Private
 */
router.put('/accounts/:id', [
  param('id').isUUID(),
  body('accountName').optional().isString().isLength({ min: 3, max: 255 }),
  body('description').optional().isString(),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'closed']),
  body('isActive').optional().isBoolean(),
  body('isSystemAccount').optional().isBoolean(),
  body('isContraAccount').optional().isBoolean(),
  body('isControlAccount').optional().isBoolean(),
  body('requiresReconciliation').optional().isBoolean(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    const account = await ledgerAccountService.updateLedgerAccount(req.params.id, updateData);
    
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Ledger account not found'
      });
    }

    res.json({
      success: true,
      data: account,
      message: 'Ledger account updated successfully'
    });
  } catch (error) {
    logger.error('Error updating ledger account:', error);
    next(error);
  }
});

/**
 * @route DELETE /api/finance/ledger/accounts/:id
 * @desc Delete ledger account
 * @access Private
 */
router.delete('/accounts/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await ledgerAccountService.deleteLedgerAccount(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Ledger account not found'
      });
    }

    res.json({
      success: true,
      message: 'Ledger account deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting ledger account:', error);
    next(error);
  }
});

// Ledger Account Actions

/**
 * @route POST /api/finance/ledger/accounts/:id/close
 * @desc Close ledger account
 * @access Private
 */
router.post('/accounts/:id/close', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await ledgerAccountService.closeAccount(req.params.id, req.user?.id);
    
    res.json({
      success: true,
      data: account,
      message: 'Ledger account closed successfully'
    });
  } catch (error) {
    logger.error('Error closing ledger account:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/ledger/accounts/:id/balance
 * @desc Get ledger account balance
 * @access Private
 */
router.get('/accounts/:id/balance', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const balance = await ledgerAccountService.getAccountBalance(req.params.id);
    
    res.json({
      success: true,
      data: balance,
      message: 'Account balance retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving account balance:', error);
    next(error);
  }
});

// Journal Entry Routes

/**
 * @route GET /api/finance/ledger/journal-entries
 * @desc Get all journal entries with optional filtering
 * @access Private
 */
router.get('/journal-entries', [
  query('entryType').optional().isIn(['manual', 'automatic', 'adjustment', 'reversal', 'closing', 'opening', 'transfer', 'payroll', 'billing', 'payment', 'receipt']),
  query('status').optional().isIn(['draft', 'pending', 'posted', 'reversed', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  query('debitAccountId').optional().isUUID(),
  query('creditAccountId').optional().isUUID(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      entryType: req.query.entryType as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      debitAccountId: req.query.debitAccountId as string,
      creditAccountId: req.query.creditAccountId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await journalEntryService.getAllJournalEntries(filters);
    
    res.json({
      success: true,
      data: result.entries,
      pagination: result.pagination,
      message: 'Journal entries retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving journal entries:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/ledger/journal-entries/:id
 * @desc Get journal entry by ID
 * @access Private
 */
router.get('/journal-entries/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.getJournalEntryById(req.params.id);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      data: entry,
      message: 'Journal entry retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving journal entry:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/ledger/journal-entries
 * @desc Create new journal entry
 * @access Private
 */
router.post('/journal-entries', [
  body('entryType').isIn(['manual', 'automatic', 'adjustment', 'reversal', 'closing', 'opening', 'transfer', 'payroll', 'billing', 'payment', 'receipt']),
  body('description').isString().isLength({ min: 1, max: 255 }),
  body('notes').optional().isString(),
  body('entryDate').isISO8601(),
  body('debitAccountId').isUUID(),
  body('creditAccountId').isUUID(),
  body('debitAmount').isDecimal(),
  body('creditAmount').isDecimal(),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('referenceNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceDocument').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceSystem').optional().isString().isLength({ min: 1, max: 100 }),
  body('requiresApproval').optional().isBoolean(),
  body('careHomeId').optional().isUUID(),
  body('department').optional().isString().isLength({ min: 1, max: 100 }),
  body('costCenter').optional().isString().isLength({ min: 1, max: 100 }),
  body('residentId').optional().isUUID(),
  body('employeeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entryData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const entry = await journalEntryService.createJournalEntry(entryData);
    
    res.status(201).json({
      success: true,
      data: entry,
      message: 'Journal entry created successfully'
    });
  } catch (error) {
    logger.error('Error creating journal entry:', error);
    next(error);
  }
});

/**
 * @route PUT /api/finance/ledger/journal-entries/:id
 * @desc Update journal entry
 * @access Private
 */
router.put('/journal-entries/:id', [
  param('id').isUUID(),
  body('description').optional().isString().isLength({ min: 1, max: 255 }),
  body('notes').optional().isString(),
  body('entryDate').optional().isISO8601(),
  body('debitAmount').optional().isDecimal(),
  body('creditAmount').optional().isDecimal(),
  body('referenceNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceDocument').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceSystem').optional().isString().isLength({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    const entry = await journalEntryService.updateJournalEntry(req.params.id, updateData);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      data: entry,
      message: 'Journal entry updated successfully'
    });
  } catch (error) {
    logger.error('Error updating journal entry:', error);
    next(error);
  }
});

/**
 * @route DELETE /api/finance/ledger/journal-entries/:id
 * @desc Delete journal entry
 * @access Private
 */
router.delete('/journal-entries/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await journalEntryService.deleteJournalEntry(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Journal entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Journal entry deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting journal entry:', error);
    next(error);
  }
});

// Journal Entry Actions

/**
 * @route POST /api/finance/ledger/journal-entries/:id/post
 * @desc Post journal entry
 * @access Private
 */
router.post('/journal-entries/:id/post', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.postJournalEntry(req.params.id, req.user?.id);
    
    res.json({
      success: true,
      data: entry,
      message: 'Journal entry posted successfully'
    });
  } catch (error) {
    logger.error('Error posting journal entry:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/ledger/journal-entries/:id/reverse
 * @desc Reverse journal entry
 * @access Private
 */
router.post('/journal-entries/:id/reverse', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.reverseJournalEntry(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: entry,
      message: 'Journal entry reversed successfully'
    });
  } catch (error) {
    logger.error('Error reversing journal entry:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/ledger/journal-entries/:id/cancel
 * @desc Cancel journal entry
 * @access Private
 */
router.post('/journal-entries/:id/cancel', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.cancelJournalEntry(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: entry,
      message: 'Journal entry cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling journal entry:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/ledger/journal-entries/:id/approve
 * @desc Approve journal entry
 * @access Private
 */
router.post('/journal-entries/:id/approve', [
  param('id').isUUID(),
  body('notes').optional().isString(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await journalEntryService.approveJournalEntry(
      req.params.id,
      req.user?.id,
      req.body.notes
    );
    
    res.json({
      success: true,
      data: entry,
      message: 'Journal entry approved successfully'
    });
  } catch (error) {
    logger.error('Error approving journal entry:', error);
    next(error);
  }
});

// Ledger Reporting Routes

/**
 * @route GET /api/finance/ledger/trial-balance
 * @desc Get trial balance
 * @access Private
 */
router.get('/trial-balance', [
  query('asOfDate').optional().isISO8601(),
  query('careHomeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
    const careHomeId = req.query.careHomeId as string;

    const trialBalance = await ledgerAccountService.getTrialBalance(asOfDate, careHomeId);
    
    res.json({
      success: true,
      data: trialBalance,
      message: 'Trial balance retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving trial balance:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/ledger/balance-sheet
 * @desc Get balance sheet
 * @access Private
 */
router.get('/balance-sheet', [
  query('asOfDate').optional().isISO8601(),
  query('careHomeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
    const careHomeId = req.query.careHomeId as string;

    const balanceSheet = await ledgerAccountService.getBalanceSheet(asOfDate, careHomeId);
    
    res.json({
      success: true,
      data: balanceSheet,
      message: 'Balance sheet retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving balance sheet:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/ledger/income-statement
 * @desc Get income statement
 * @access Private
 */
router.get('/income-statement', [
  query('dateFrom').isISO8601(),
  query('dateTo').isISO8601(),
  query('careHomeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateFrom = new Date(req.query.dateFrom as string);
    const dateTo = new Date(req.query.dateTo as string);
    const careHomeId = req.query.careHomeId as string;

    const incomeStatement = await ledgerAccountService.getIncomeStatement(dateFrom, dateTo, careHomeId);
    
    res.json({
      success: true,
      data: incomeStatement,
      message: 'Income statement retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving income statement:', error);
    next(error);
  }
});

export default router;