import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { CashTransactionService } from '../../services/finance/CashTransactionService';
import { logger } from '../../utils/logger';

const router = Router();
const cashTransactionService = new CashTransactionService();

/**
 * @fileoverview Cash Transaction API Routes
 * @module CashRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description API routes for cash transaction management including
 * real-time posting, transaction validation, and audit trails.
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

// Cash Transaction Routes

/**
 * @route GET /api/finance/cash/transactions
 * @desc Get all cash transactions with optional filtering
 * @access Private
 */
router.get('/transactions', [
  query('transactionType').optional().isIn(['receipt', 'payment', 'transfer', 'adjustment', 'reversal', 'refund', 'deposit', 'withdrawal', 'interest', 'fee']),
  query('status').optional().isIn(['pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent', 'critical']),
  query('accountId').optional().isUUID(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      transactionType: req.query.transactionType as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      accountId: req.query.accountId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await cashTransactionService.getAllCashTransactions(filters);
    
    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
      message: 'Cash transactions retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving cashtransactions:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/cash/transactions/:id
 * @desc Get cash transaction by ID
 * @access Private
 */
router.get('/transactions/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.getCashTransactionById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Cash transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions
 * @desc Create new cash transaction
 * @access Private
 */
router.post('/transactions', [
  body('transactionType').isIn(['receipt', 'payment', 'transfer', 'adjustment', 'reversal', 'refund', 'deposit', 'withdrawal', 'interest', 'fee']),
  body('description').isString().isLength({ min: 1, max: 255 }),
  body('notes').optional().isString(),
  body('transactionDate').isISO8601(),
  body('accountId').isUUID(),
  body('amount').isDecimal(),
  body('currency').optional().isString().isLength({ min: 3, max: 3 }),
  body('exchangeRate').optional().isDecimal(),
  body('referenceNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceDocument').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceSystem').optional().isString().isLength({ min: 1, max: 100 }),
  body('paymentMethod').optional().isString().isLength({ min: 1, max: 100 }),
  body('paymentReference').optional().isString().isLength({ min: 1, max: 100 }),
  body('bankAccount').optional().isString().isLength({ min: 1, max: 100 }),
  body('bankReference').optional().isString().isLength({ min: 1, max: 100 }),
  body('requiresApproval').optional().isBoolean(),
  body('careHomeId').optional().isUUID(),
  body('department').optional().isString().isLength({ min: 1, max: 100 }),
  body('costCenter').optional().isString().isLength({ min: 1, max: 100 }),
  body('residentId').optional().isUUID(),
  body('employeeId').optional().isUUID(),
  body('supplierId').optional().isUUID(),
  body('customerId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transactionData = {
      ...req.body,
      createdBy: req.user?.id
    };

    const transaction = await cashTransactionService.createCashTransaction(transactionData);
    
    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Cash transaction created successfully'
    });
  } catch (error) {
    logger.error('Error creating cashtransaction:', error);
    next(error);
  }
});

/**
 * @route PUT /api/finance/cash/transactions/:id
 * @desc Update cash transaction
 * @access Private
 */
router.put('/transactions/:id', [
  param('id').isUUID(),
  body('description').optional().isString().isLength({ min: 1, max: 255 }),
  body('notes').optional().isString(),
  body('transactionDate').optional().isISO8601(),
  body('amount').optional().isDecimal(),
  body('exchangeRate').optional().isDecimal(),
  body('referenceNumber').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceDocument').optional().isString().isLength({ min: 1, max: 100 }),
  body('sourceSystem').optional().isString().isLength({ min: 1, max: 100 }),
  body('paymentMethod').optional().isString().isLength({ min: 1, max: 100 }),
  body('paymentReference').optional().isString().isLength({ min: 1, max: 100 }),
  body('bankAccount').optional().isString().isLength({ min: 1, max: 100 }),
  body('bankReference').optional().isString().isLength({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user?.id
    };

    const transaction = await cashTransactionService.updateCashTransaction(req.params.id, updateData);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Cash transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction updated successfully'
    });
  } catch (error) {
    logger.error('Error updating cashtransaction:', error);
    next(error);
  }
});

/**
 * @route DELETE /api/finance/cash/transactions/:id
 * @desc Delete cash transaction
 * @access Private
 */
router.delete('/transactions/:id', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await cashTransactionService.deleteCashTransaction(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Cash transaction not found'
      });
    }

    res.json({
      success: true,
      message: 'Cash transaction deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting cashtransaction:', error);
    next(error);
  }
});

// Cash Transaction Actions

/**
 * @route POST /api/finance/cash/transactions/:id/process
 * @desc Process cash transaction
 * @access Private
 */
router.post('/transactions/:id/process', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.processTransaction(req.params.id, req.user?.id);
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction processed successfully'
    });
  } catch (error) {
    logger.error('Error processing cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions/:id/complete
 * @desc Complete cash transaction
 * @access Private
 */
router.post('/transactions/:id/complete', [
  param('id').isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.completeTransaction(req.params.id, req.user?.id);
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction completed successfully'
    });
  } catch (error) {
    logger.error('Error completing cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions/:id/fail
 * @desc Fail cash transaction
 * @access Private
 */
router.post('/transactions/:id/fail', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.failTransaction(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction failed successfully'
    });
  } catch (error) {
    logger.error('Error failing cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions/:id/reverse
 * @desc Reverse cash transaction
 * @access Private
 */
router.post('/transactions/:id/reverse', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.reverseTransaction(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction reversed successfully'
    });
  } catch (error) {
    logger.error('Error reversing cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions/:id/cancel
 * @desc Cancel cash transaction
 * @access Private
 */
router.post('/transactions/:id/cancel', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.cancelTransaction(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions/:id/approve
 * @desc Approve cash transaction
 * @access Private
 */
router.post('/transactions/:id/approve', [
  param('id').isUUID(),
  body('notes').optional().isString(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.approveTransaction(
      req.params.id,
      req.user?.id,
      req.body.notes
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction approved successfully'
    });
  } catch (error) {
    logger.error('Error approving cashtransaction:', error);
    next(error);
  }
});

/**
 * @route POST /api/finance/cash/transactions/:id/void
 * @desc Void cash transaction
 * @access Private
 */
router.post('/transactions/:id/void', [
  param('id').isUUID(),
  body('reason').isString().isLength({ min: 1, max: 500 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await cashTransactionService.voidTransaction(
      req.params.id,
      req.body.reason,
      req.user?.id
    );
    
    res.json({
      success: true,
      data: transaction,
      message: 'Cash transaction voided successfully'
    });
  } catch (error) {
    logger.error('Error voiding cashtransaction:', error);
    next(error);
  }
});

// Cash Reporting Routes

/**
 * @route GET /api/finance/cash/summary
 * @desc Get cash summary
 * @access Private
 */
router.get('/summary', [
  query('asOfDate').optional().isISO8601(),
  query('careHomeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();
    const careHomeId = req.query.careHomeId as string;

    const summary = await cashTransactionService.getCashSummary(asOfDate, careHomeId);
    
    res.json({
      success: true,
      data: summary,
      message: 'Cash summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving cashsummary:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/cash/flow-statement
 * @desc Get cash flow statement
 * @access Private
 */
router.get('/flow-statement', [
  query('dateFrom').isISO8601(),
  query('dateTo').isISO8601(),
  query('careHomeId').optional().isUUID(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dateFrom = new Date(req.query.dateFrom as string);
    const dateTo = new Date(req.query.dateTo as string);
    const careHomeId = req.query.careHomeId as string;

    const cashFlowStatement = await cashTransactionService.getCashFlowStatement(dateFrom, dateTo, careHomeId);
    
    res.json({
      success: true,
      data: cashFlowStatement,
      message: 'Cash flow statement retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving cash flowstatement:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/cash/transactions-by-account
 * @desc Get transactions by account
 * @access Private
 */
router.get('/transactions-by-account', [
  query('accountId').isUUID(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('transactionType').optional().isIn(['receipt', 'payment', 'transfer', 'adjustment', 'reversal', 'refund', 'deposit', 'withdrawal', 'interest', 'fee']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters = {
      accountId: req.query.accountId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      transactionType: req.query.transactionType as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20
    };

    const result = await cashTransactionService.getTransactionsByAccount(filters);
    
    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
      message: 'Transactions by account retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving transactions byaccount:', error);
    next(error);
  }
});

/**
 * @route GET /api/finance/cash/reconciliation
 * @desc Get cash reconciliation
 * @access Private
 */
router.get('/reconciliation', [
  query('accountId').isUUID(),
  query('asOfDate').optional().isISO8601(),
  validateRequest
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accountId = req.query.accountId as string;
    const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : new Date();

    const reconciliation = await cashTransactionService.getCashReconciliation(accountId, asOfDate);
    
    res.json({
      success: true,
      data: reconciliation,
      message: 'Cash reconciliation retrieved successfully'
    });
  } catch (error) {
    logger.error('Error retrieving cashreconciliation:', error);
    next(error);
  }
});

export default router;
