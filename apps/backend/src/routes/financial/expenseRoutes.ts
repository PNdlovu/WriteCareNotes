import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { ExpenseController } from '@/controllers/financial/ExpenseController';
import { authMiddleware } from '@/middleware/auth-middleware';
import { rbacMiddleware } from '@/middleware/rbac-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

import { ExpenseCategory, ExpenseStatus, Currency } from '@/entities/financial/Expense';
import { logger } from '@/utils/logger';

/**
 * Expense Routes with enterprise security and compliance
 */
export class ExpenseRoutes {
  privaterouter: Router;
  privateexpenseController: ExpenseController;

  constructor(expenseController: ExpenseController) {
    this.router = Router();
    this.expenseController = expenseController;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware for all expense routes
   */
  private setupMiddleware(): void {
    // Apply correlation ID middleware
    this.router.use(correlationMiddleware);

    // Apply authentication middleware
    this.router.use(authMiddleware);

    // Apply performance monitoring
    this.router.use(performanceMiddleware);

    // Apply compliance middleware
    this.router.use(complianceMiddleware);

    // Apply audit middleware
    this.router.use(auditMiddleware);

    // Rate limiting for expense operations
    const expenseRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many expense requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.router.use(expenseRateLimit);
  }

  /**
   * Setup all expense routes
   */
  private setupRoutes(): void {
    // Expense Management Routes
    this.setupExpenseRoutes();
  }

  /**
   * Setup expense management routes
   */
  private setupExpenseRoutes(): void {
    /**
     * @swagger
     * /api/v1/financial/expenses:
     *   post:
     *     summary: Create a new expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - amount
     *               - currency
     *               - category
     *               - description
     *               - expenseDate
     *             properties:
     *               amount:
     *                 type: number
     *                 format: decimal
     *               currency:
     *                 type: string
     *                 enum: [GBP, USD, EUR]
     *               category:
     *                 type: string
     *                 enum: [office_supplies, travel, meals, training, equipment, maintenance, utilities, insurance, legal, marketing, other]
     *               description:
     *                 type: string
     *               expenseDate:
     *                 type: string
     *                 format: date
     *               receiptUrl:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [pending, approved, rejected, paid]
     *               incurredById:
     *                 type: string
     *                 format: uuid
     *               approvedById:
     *                 type: string
     *                 format: uuid
     *               paymentId:
     *                 type: string
     *                 format: uuid
     *               costCenter:
     *                 type: string
     *               departmentId:
     *                 type: string
     *                 format: uuid
     *               notes:
     *                 type: string
     *               metadata:
     *                 type: object
     *     responses:
     *       201:
     *         description: Expense created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     */
    this.router.post(
      '/',
      rbacMiddleware(['FINANCIAL_WRITE', 'EXPENSE_CREATE']),
      [
        body('amount').isDecimal({ decimal_digits: '0,4' }).withMessage('Amount must be a valid decimal'),
        body('currency').isIn(Object.values(Currency)).withMessage('Invalid currency'),
        body('category').isIn(Object.values(ExpenseCategory)).withMessage('Invalid expense category'),
        body('description').isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
        body('expenseDate').isISO8601().withMessage('Expense date must be valid ISO 8601 date'),
        body('receiptUrl').optional().isURL().withMessage('Receipt URL must be a valid URL'),
        body('status').optional().isIn(Object.values(ExpenseStatus)).withMessage('Invalid expense status'),
        body('incurredById').optional().isUUID().withMessage('Incurred by ID must be a valid UUID'),
        body('approvedById').optional().isUUID().withMessage('Approved by ID must be a valid UUID'),
        body('paymentId').optional().isUUID().withMessage('Payment ID must be a valid UUID'),
        body('costCenter').optional().isLength({ max: 100 }).withMessage('Cost center must be max 100 characters'),
        body('departmentId').optional().isUUID().withMessage('Department ID must be a valid UUID'),
        body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
        body('metadata').optional().isObject().withMessage('Metadata must be an object')
      ],
      this.createExpense.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/expenses:
     *   get:
     *     summary: Retrieve expenses
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, approved, rejected, paid]
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *           enum: [office_supplies, travel, meals, training, equipment, maintenance, utilities, insurance, legal, marketing, other]
     *       - in: query
     *         name: incurredById
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: dateFrom
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: dateTo
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 1000
     *     responses:
     *       200:
     *         description: Expenses retrieved successfully
     */
    this.router.get(
      '/',
      rbacMiddleware(['FINANCIAL_READ', 'EXPENSE_READ']),
      [
        query('status').optional().isIn(Object.values(ExpenseStatus)),
        query('category').optional().isIn(Object.values(ExpenseCategory)),
        query('incurredById').optional().isUUID().withMessage('Incurred by ID must be a valid UUID'),
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
      ],
      this.listExpenses.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/expenses/{id}:
     *   get:
     *     summary: Get a specific expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       200:
     *         description: Expense retrieved successfully
     *       404:
     *         description: Expense not found
     */
    this.router.get(
      '/:id',
      rbacMiddleware(['FINANCIAL_READ', 'EXPENSE_READ']),
      [
        param('id').isUUID().withMessage('Expense ID must be a valid UUID')
      ],
      this.getExpenseById.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/expenses/{id}:
     *   put:
     *     summary: Update an expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               amount:
     *                 type: number
     *                 format: decimal
     *               category:
     *                 type: string
     *                 enum: [office_supplies, travel, meals, training, equipment, maintenance, utilities, insurance, legal, marketing, other]
     *               description:
     *                 type: string
     *               receiptUrl:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [pending, approved, rejected, paid]
     *               notes:
     *                 type: string
     *               metadata:
     *                 type: object
     *     responses:
     *       200:
     *         description: Expense updated successfully
     *       404:
     *         description: Expense not found
     */
    this.router.put(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'EXPENSE_UPDATE']),
      [
        param('id').isUUID().withMessage('Expense ID must be a valid UUID'),
        body('amount').optional().isDecimal({ decimal_digits: '0,4' }),
        body('category').optional().isIn(Object.values(ExpenseCategory)),
        body('description').optional().isLength({ min: 1, max: 500 }),
        body('receiptUrl').optional().isURL(),
        body('status').optional().isIn(Object.values(ExpenseStatus)),
        body('notes').optional().isLength({ max: 1000 }),
        body('metadata').optional().isObject()
      ],
      this.updateExpense.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/expenses/{id}:
     *   delete:
     *     summary: Delete an expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     responses:
     *       204:
     *         description: Expense deleted successfully
     *       404:
     *         description: Expense not found
     */
    this.router.delete(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'EXPENSE_DELETE']),
      [
        param('id').isUUID().withMessage('Expense ID must be a valid UUID')
      ],
      this.deleteExpense.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/expenses/{id}/approve:
     *   post:
     *     summary: Approve an expense
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               approvalNotes:
     *                 type: string
     *               approvedAmount:
     *                 type: number
     *                 format: decimal
     *     responses:
     *       200:
     *         description: Expense approved successfully
     *       404:
     *         description: Expense not found
     */
    this.router.post(
      '/:id/approve',
      rbacMiddleware(['FINANCIAL_WRITE', 'EXPENSE_APPROVE']),
      [
        param('id').isUUID().withMessage('Expense ID must be a valid UUID'),
        body('approvalNotes').optional().isLength({ max: 1000 }),
        body('approvedAmount').optional().isDecimal({ decimal_digits: '0,4' })
      ],
      this.approveExpense.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/expenses/summary:
     *   get:
     *     summary: Get expense summary
     *     tags: [Expenses]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: dateFrom
     *         schema:
     *           type: string
     *           format: date
     *       - in: query
     *         name: dateTo
     *         schema:
     *           type: string
     *           format: date
     *     responses:
     *       200:
     *         description: Expense summary retrieved successfully
     */
    this.router.get(
      '/summary',
      rbacMiddleware(['FINANCIAL_READ', 'EXPENSE_READ']),
      [
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date')
      ],
      this.getExpenseSummary.bind(this)
    );
  }

  /**
   * Route Handlers
   */

  private async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      const result = await this.expenseController.createExpense(
        req.body,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async listExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      const queryParams = {
        status: req.query['status'] as ExpenseStatus,
        category: req.query['category'] as ExpenseCategory,
        incurredById: req.query['incurredById'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 50
      };

      const result = await this.expenseController.listExpenses(
        queryParams,
        userId,
        correlationId
      );

      res.json({
        success: true,
        data: result,
        correlationId
      });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      const result = await this.expenseController.getExpenseById(
        req.params['id'],
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      const result = await this.expenseController.updateExpense(
        req.params['id'],
        req.body,
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      await this.expenseController.deleteExpense(
        req.params['id'],
        userId,
        correlationId
      );

      res.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  }

  private async approveExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      const result = await this.expenseController.approveExpense(
        req.params['id'],
        req.body,
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getExpenseSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      const queryParams = {
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined
      };

      const result = await this.expenseController.getExpenseSummary(
        queryParams,
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  /**
   * Get the configured router
   */
  public getRouter(): Router {
    return this.router;
  }
}

export default ExpenseRoutes;
