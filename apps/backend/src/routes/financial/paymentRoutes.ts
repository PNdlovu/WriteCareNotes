import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { PaymentController } from '@/controllers/financial/PaymentController';
import { authMiddleware } from '@/middleware/auth-middleware';
import { rbacMiddleware } from '@/middleware/rbac-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

import { PaymentMethod, PaymentStatus, Currency } from '@/entities/financial/Payment';
import { logger } from '@/utils/logger';

/**
 * Payment Routes with enterprise security and compliance
 */
export class PaymentRoutes {
  private router: Router;
  private paymentController: PaymentController;

  constructor(paymentController: PaymentController) {
    this.router = Router();
    this.paymentController = paymentController;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware for all payment routes
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

    // Rate limiting for payment operations
    const paymentRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many payment requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.router.use(paymentRateLimit);
  }

  /**
   * Setup all payment routes
   */
  private setupRoutes(): void {
    // Payment Management Routes
    this.setupPaymentRoutes();
  }

  /**
   * Setup payment management routes
   */
  private setupPaymentRoutes(): void {
    /**
     * @swagger
     * /api/v1/financial/payments:
     *   post:
     *     summary: Record a new payment
     *     tags: [Payments]
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
     *               - paymentMethod
     *               - paymentDate
     *             properties:
     *               amount:
     *                 type: number
     *                 format: decimal
     *               currency:
     *                 type: string
     *                 enum: [GBP, USD, EUR]
     *               paymentMethod:
     *                 type: string
     *                 enum: [bank_transfer, card, cash, cheque, direct_debit, standing_order]
     *               paymentDate:
     *                 type: string
     *                 format: date
     *               transactionReference:
     *                 type: string
     *               status:
     *                 type: string
     *                 enum: [pending, completed, failed, cancelled, refunded]
     *               payerId:
     *                 type: string
     *                 format: uuid
     *               invoiceId:
     *                 type: string
     *                 format: uuid
     *               expenseId:
     *                 type: string
     *                 format: uuid
     *               salaryId:
     *                 type: string
     *                 format: uuid
     *               taxRecordId:
     *                 type: string
     *                 format: uuid
     *               notes:
     *                 type: string
     *               metadata:
     *                 type: object
     *     responses:
     *       201:
     *         description: Payment recorded successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     */
    this.router.post(
      '/',
      rbacMiddleware(['FINANCIAL_WRITE', 'PAYMENT_CREATE']),
      [
        body('amount').isDecimal({ decimal_digits: '0,4' }).withMessage('Amount must be a valid decimal'),
        body('currency').isIn(Object.values(Currency)).withMessage('Invalid currency'),
        body('paymentMethod').isIn(Object.values(PaymentMethod)).withMessage('Invalid payment method'),
        body('paymentDate').isISO8601().withMessage('Payment date must be valid ISO 8601 date'),
        body('transactionReference').optional().isLength({ max: 100 }).withMessage('Transaction reference must be max 100 characters'),
        body('status').optional().isIn(Object.values(PaymentStatus)).withMessage('Invalid payment status'),
        body('payerId').optional().isUUID().withMessage('Payer ID must be a valid UUID'),
        body('invoiceId').optional().isUUID().withMessage('Invoice ID must be a valid UUID'),
        body('expenseId').optional().isUUID().withMessage('Expense ID must be a valid UUID'),
        body('salaryId').optional().isUUID().withMessage('Salary ID must be a valid UUID'),
        body('taxRecordId').optional().isUUID().withMessage('Tax record ID must be a valid UUID'),
        body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
        body('metadata').optional().isObject().withMessage('Metadata must be an object')
      ],
      this.recordPayment.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/payments:
     *   get:
     *     summary: Retrieve payments
     *     tags: [Payments]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, completed, failed, cancelled, refunded]
     *       - in: query
     *         name: paymentMethod
     *         schema:
     *           type: string
     *           enum: [bank_transfer, card, cash, cheque, direct_debit, standing_order]
     *       - in: query
     *         name: payerId
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
     *         description: Payments retrieved successfully
     */
    this.router.get(
      '/',
      rbacMiddleware(['FINANCIAL_READ', 'PAYMENT_READ']),
      [
        query('status').optional().isIn(Object.values(PaymentStatus)),
        query('paymentMethod').optional().isIn(Object.values(PaymentMethod)),
        query('payerId').optional().isUUID().withMessage('Payer ID must be a valid UUID'),
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
      ],
      this.listPayments.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/payments/{id}:
     *   get:
     *     summary: Get a specific payment
     *     tags: [Payments]
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
     *         description: Payment retrieved successfully
     *       404:
     *         description: Payment not found
     */
    this.router.get(
      '/:id',
      rbacMiddleware(['FINANCIAL_READ', 'PAYMENT_READ']),
      [
        param('id').isUUID().withMessage('Payment ID must be a valid UUID')
      ],
      this.getPaymentById.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/payments/{id}:
     *   put:
     *     summary: Update a payment
     *     tags: [Payments]
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
     *               status:
     *                 type: string
     *                 enum: [pending, completed, failed, cancelled, refunded]
     *               notes:
     *                 type: string
     *               metadata:
     *                 type: object
     *     responses:
     *       200:
     *         description: Payment updated successfully
     *       404:
     *         description: Payment not found
     */
    this.router.put(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'PAYMENT_UPDATE']),
      [
        param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
        body('amount').optional().isDecimal({ decimal_digits: '0,4' }),
        body('status').optional().isIn(Object.values(PaymentStatus)),
        body('notes').optional().isLength({ max: 1000 }),
        body('metadata').optional().isObject()
      ],
      this.updatePayment.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/payments/{id}:
     *   delete:
     *     summary: Delete a payment
     *     tags: [Payments]
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
     *         description: Payment deleted successfully
     *       404:
     *         description: Payment not found
     */
    this.router.delete(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'PAYMENT_DELETE']),
      [
        param('id').isUUID().withMessage('Payment ID must be a valid UUID')
      ],
      this.deletePayment.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/payments/{id}/reconcile:
     *   post:
     *     summary: Reconcile a payment
     *     tags: [Payments]
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
     *               reconciledAmount:
     *                 type: number
     *                 format: decimal
     *               reconciliationNotes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Payment reconciled successfully
     *       404:
     *         description: Payment not found
     */
    this.router.post(
      '/:id/reconcile',
      rbacMiddleware(['FINANCIAL_WRITE', 'PAYMENT_RECONCILE']),
      [
        param('id').isUUID().withMessage('Payment ID must be a valid UUID'),
        body('reconciledAmount').optional().isDecimal({ decimal_digits: '0,4' }),
        body('reconciliationNotes').optional().isLength({ max: 1000 })
      ],
      this.reconcilePayment.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/payments/summary:
     *   get:
     *     summary: Get payment summary
     *     tags: [Payments]
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
     *         description: Payment summary retrieved successfully
     */
    this.router.get(
      '/summary',
      rbacMiddleware(['FINANCIAL_READ', 'PAYMENT_READ']),
      [
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date')
      ],
      this.getPaymentSummary.bind(this)
    );
  }

  /**
   * Route Handlers
   */

  private async recordPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.paymentController.recordPayment(
        req.body,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async listPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        status: req.query['status'] as PaymentStatus,
        paymentMethod: req.query['paymentMethod'] as PaymentMethod,
        payerId: req.query['payerId'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 50
      };

      const result = await this.paymentController.listPayments(
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

  private async getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.paymentController.getPaymentById(
        req.params['id'],
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async updatePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.paymentController.updatePayment(
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

  private async deletePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      await this.paymentController.deletePayment(
        req.params['id'],
        userId,
        correlationId
      );

      res.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  }

  private async reconcilePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.paymentController.reconcilePayment(
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

  private async getPaymentSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.paymentController.getPaymentSummary(
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

export default PaymentRoutes;