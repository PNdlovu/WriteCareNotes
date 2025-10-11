import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { InvoiceController } from '@/controllers/financial/InvoiceController';
import { authMiddleware } from '@/middleware/auth-middleware';
import { rbacMiddleware } from '@/middleware/rbac-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

import { InvoiceStatus, PaymentTerms } from '@/entities/financial/Invoice';
import { logger } from '@/utils/logger';

/**
 * Invoice Routes with enterprise security and compliance
 */
export class InvoiceRoutes {
  private router: Router;
  private invoiceController: InvoiceController;

  constructor(invoiceController: InvoiceController) {
    this.router = Router();
    this.invoiceController = invoiceController;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware for all invoice routes
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

    // Rate limiting for invoice operations
    const invoiceRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many invoice requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.router.use(invoiceRateLimit);
  }

  /**
   * Setup all invoice routes
   */
  private setupRoutes(): void {
    // Invoice Management Routes
    this.setupInvoiceRoutes();
  }

  /**
   * Setup invoice management routes
   */
  private setupInvoiceRoutes(): void {
    /**
     * @swagger
     * /api/v1/financial/invoices:
     *   post:
     *     summary: Create a new invoice
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - recipientId
     *               - amountDue
     *               - currency
     *               - invoiceDate
     *               - dueDate
     *             properties:
     *               recipientId:
     *                 type: string
     *                 format: uuid
     *               careRecipientId:
     *                 type: string
     *                 format: uuid
     *               amountDue:
     *                 type: number
     *                 format: decimal
     *               currency:
     *                 type: string
     *                 enum: [GBP, USD, EUR]
     *               invoiceDate:
     *                 type: string
     *                 format: date
     *               dueDate:
     *                 type: string
     *                 format: date
     *               status:
     *                 type: string
     *                 enum: [draft, sent, paid, overdue, cancelled]
     *               paymentTerms:
     *                 type: string
     *                 enum: [net_15, net_30, net_60, net_90, due_on_receipt]
     *               items:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     description:
     *                       type: string
     *                     quantity:
     *                       type: number
     *                     unitPrice:
     *                       type: number
     *                     totalPrice:
     *                       type: number
     *               notes:
     *                 type: string
     *               attachments:
     *                 type: array
     *                 items:
     *                   type: string
     *     responses:
     *       201:
     *         description: Invoice created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     */
    this.router.post(
      '/',
      rbacMiddleware(['FINANCIAL_WRITE', 'INVOICE_CREATE']),
      [
        body('recipientId').isUUID().withMessage('Recipient ID must be a valid UUID'),
        body('careRecipientId').optional().isUUID().withMessage('Care recipient ID must be a valid UUID'),
        body('amountDue').isDecimal({ decimal_digits: '0,4' }).withMessage('Amount due must be a valid decimal'),
        body('currency').isIn(['GBP', 'USD', 'EUR']).withMessage('Invalid currency'),
        body('invoiceDate').isISO8601().withMessage('Invoice date must be valid ISO 8601 date'),
        body('dueDate').isISO8601().withMessage('Due date must be valid ISO 8601 date'),
        body('status').optional().isIn(Object.values(InvoiceStatus)).withMessage('Invalid invoice status'),
        body('paymentTerms').optional().isIn(Object.values(PaymentTerms)).withMessage('Invalid payment terms'),
        body('items').optional().isArray().withMessage('Items must be an array'),
        body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
        body('attachments').optional().isArray().withMessage('Attachments must be an array')
      ],
      this.createInvoice.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices:
     *   get:
     *     summary: Retrieve invoices
     *     tags: [Invoices]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [draft, sent, paid, overdue, cancelled]
     *       - in: query
     *         name: recipientId
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
     *         description: Invoices retrieved successfully
     */
    this.router.get(
      '/',
      rbacMiddleware(['FINANCIAL_READ', 'INVOICE_READ']),
      [
        query('status').optional().isIn(Object.values(InvoiceStatus)),
        query('recipientId').optional().isUUID().withMessage('Recipient ID must be a valid UUID'),
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
      ],
      this.listInvoices.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices/{id}:
     *   get:
     *     summary: Get a specific invoice
     *     tags: [Invoices]
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
     *         description: Invoice retrieved successfully
     *       404:
     *         description: Invoice not found
     */
    this.router.get(
      '/:id',
      rbacMiddleware(['FINANCIAL_READ', 'INVOICE_READ']),
      [
        param('id').isUUID().withMessage('Invoice ID must be a valid UUID')
      ],
      this.getInvoiceById.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices/{id}:
     *   put:
     *     summary: Update an invoice
     *     tags: [Invoices]
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
     *               amountDue:
     *                 type: number
     *                 format: decimal
     *               status:
     *                 type: string
     *                 enum: [draft, sent, paid, overdue, cancelled]
     *               paymentTerms:
     *                 type: string
     *                 enum: [net_15, net_30, net_60, net_90, due_on_receipt]
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Invoice updated successfully
     *       404:
     *         description: Invoice not found
     */
    this.router.put(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'INVOICE_UPDATE']),
      [
        param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
        body('amountDue').optional().isDecimal({ decimal_digits: '0,4' }),
        body('status').optional().isIn(Object.values(InvoiceStatus)),
        body('paymentTerms').optional().isIn(Object.values(PaymentTerms)),
        body('notes').optional().isLength({ max: 1000 })
      ],
      this.updateInvoice.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices/{id}:
     *   delete:
     *     summary: Delete an invoice
     *     tags: [Invoices]
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
     *         description: Invoice deleted successfully
     *       404:
     *         description: Invoice not found
     */
    this.router.delete(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'INVOICE_DELETE']),
      [
        param('id').isUUID().withMessage('Invoice ID must be a valid UUID')
      ],
      this.deleteInvoice.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices/{id}/mark-paid:
     *   post:
     *     summary: Mark an invoice as paid
     *     tags: [Invoices]
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
     *             required:
     *               - paymentId
     *             properties:
     *               paymentId:
     *                 type: string
     *                 format: uuid
     *               paymentDate:
     *                 type: string
     *                 format: date
     *     responses:
     *       200:
     *         description: Invoice marked as paid successfully
     *       404:
     *         description: Invoice not found
     */
    this.router.post(
      '/:id/mark-paid',
      rbacMiddleware(['FINANCIAL_WRITE', 'INVOICE_UPDATE']),
      [
        param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
        body('paymentId').isUUID().withMessage('Payment ID must be a valid UUID'),
        body('paymentDate').optional().isISO8601().withMessage('Payment date must be valid ISO 8601 date')
      ],
      this.markInvoiceAsPaid.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices/{id}/reconcile:
     *   post:
     *     summary: Reconcile an invoice payment
     *     tags: [Invoices]
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
     *             required:
     *               - paymentId
     *             properties:
     *               paymentId:
     *                 type: string
     *                 format: uuid
     *               reconciledAmount:
     *                 type: number
     *                 format: decimal
     *     responses:
     *       200:
     *         description: Invoice payment reconciled successfully
     *       404:
     *         description: Invoice not found
     */
    this.router.post(
      '/:id/reconcile',
      rbacMiddleware(['FINANCIAL_WRITE', 'INVOICE_RECONCILE']),
      [
        param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
        body('paymentId').isUUID().withMessage('Payment ID must be a valid UUID'),
        body('reconciledAmount').optional().isDecimal({ decimal_digits: '0,4' })
      ],
      this.reconcileInvoicePayment.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/invoices/summary:
     *   get:
     *     summary: Get invoice summary
     *     tags: [Invoices]
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
     *         description: Invoice summary retrieved successfully
     */
    this.router.get(
      '/summary',
      rbacMiddleware(['FINANCIAL_READ', 'INVOICE_READ']),
      [
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date')
      ],
      this.getInvoiceSummary.bind(this)
    );
  }

  /**
   * Route Handlers
   */

  private async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.invoiceController.createInvoice(
        req.body,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async listInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        status: req.query['status'] as InvoiceStatus,
        recipientId: req.query['recipientId'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 50
      };

      const result = await this.invoiceController.listInvoices(
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

  private async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.invoiceController.getInvoiceById(
        req.params['id'],
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.invoiceController.updateInvoice(
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

  private async deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      await this.invoiceController.deleteInvoice(
        req.params['id'],
        userId,
        correlationId
      );

      res.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  }

  private async markInvoiceAsPaid(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.invoiceController.markInvoiceAsPaid(
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

  private async reconcileInvoicePayment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.invoiceController.reconcileInvoicePayment(
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

  private async getInvoiceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.invoiceController.getInvoiceSummary(
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

export default InvoiceRoutes;