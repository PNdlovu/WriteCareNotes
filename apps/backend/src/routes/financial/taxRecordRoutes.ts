import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { TaxRecordController } from '@/controllers/financial/TaxRecordController';
import { authMiddleware } from '@/middleware/auth-middleware';
import { rbacMiddleware } from '@/middleware/rbac-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

import { TaxType, TaxRecordStatus } from '@/entities/financial/TaxRecord';
import { logger } from '@/utils/logger';

/**
 * Tax Record Routes with enterprise security and compliance
 */
export class TaxRecordRoutes {
  privaterouter: Router;
  privatetaxRecordController: TaxRecordController;

  const ructor(taxRecordController: TaxRecordController) {
    this.router = Router();
    this.taxRecordController = taxRecordController;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware for all tax record routes
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

    // Rate limiting for tax record operations
    const taxRecordRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many tax record requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.router.use(taxRecordRateLimit);
  }

  /**
   * Setup all tax record routes
   */
  private setupRoutes(): void {
    // Tax Record Management Routes
    this.setupTaxRecordRoutes();
  }

  /**
   * Setup tax record management routes
   */
  private setupTaxRecordRoutes(): void {
    /**
     * @swagger
     * /api/v1/financial/tax-records:
     *   post:
     *     summary: Create a new tax record
     *     tags: [Tax Records]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - taxYear
     *               - taxType
     *               - amountDue
     *               - dueDate
     *             properties:
     *               taxYear:
     *                 type: string
     *                 pattern: '^\d{4}(-\d{4})?$'
     *               taxPeriodStart:
     *                 type: string
     *                 format: date
     *               taxPeriodEnd:
     *                 type: string
     *                 format: date
     *               taxType:
     *                 type: string
     *                 enum: [corporation_tax, vat, payroll_tax, income_tax, national_insurance, pension_contributions, other]
     *               amountDue:
     *                 type: number
     *                 format: decimal
     *               amountPaid:
     *                 type: number
     *                 format: decimal
     *               dueDate:
     *                 type: string
     *                 format: date
     *               paymentDate:
     *                 type: string
     *                 format: date
     *               status:
     *                 type: string
     *                 enum: [pending, paid, overdue, partially_paid, waived, under_review]
     *               submissionReference:
     *                 type: string
     *               notes:
     *                 type: string
     *               relatedPayrollRunId:
     *                 type: string
     *                 format: uuid
     *     responses:
     *       201:
     *         description: Tax record created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     */
    this.router.post(
      '/',
      rbacMiddleware(['FINANCIAL_WRITE', 'TAX_RECORD_CREATE']),
      [
        body('taxYear').matches(/^\d{4}(-\d{4})?$/).withMessage('Tax year must be in format YYYY or YYYY-YYYY'),
        body('taxPeriodStart').optional().isISO8601().withMessage('Tax period start must be valid ISO 8601 date'),
        body('taxPeriodEnd').optional().isISO8601().withMessage('Tax period end must be valid ISO 8601 date'),
        body('taxType').isIn(Object.values(TaxType)).withMessage('Invalid tax type'),
        body('amountDue').isDecimal({ decimal_digits: '0,4' }).withMessage('Amount due must be a valid decimal'),
        body('amountPaid').optional().isDecimal({ decimal_digits: '0,4' }).withMessage('Amount paid must be a valid decimal'),
        body('dueDate').isISO8601().withMessage('Due date must be valid ISO 8601 date'),
        body('paymentDate').optional().isISO8601().withMessage('Payment date must be valid ISO 8601 date'),
        body('status').optional().isIn(Object.values(TaxRecordStatus)).withMessage('Invalid tax record status'),
        body('submissionReference').optional().isLength({ max: 100 }).withMessage('Submission reference must be max 100 characters'),
        body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be max 1000 characters'),
        body('relatedPayrollRunId').optional().isUUID().withMessage('Related payroll run ID must be a valid UUID')
      ],
      this.createTaxRecord.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/tax-records:
     *   get:
     *     summary: Retrieve tax records
     *     tags: [Tax Records]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [pending, paid, overdue, partially_paid, waived, under_review]
     *       - in: query
     *         name: taxType
     *         schema:
     *           type: string
     *           enum: [corporation_tax, vat, payroll_tax, income_tax, national_insurance, pension_contributions, other]
     *       - in: query
     *         name: taxYear
     *         schema:
     *           type: string
     *           pattern: '^\d{4}(-\d{4})?$'
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
     *         description: Tax records retrieved successfully
     */
    this.router.get(
      '/',
      rbacMiddleware(['FINANCIAL_READ', 'TAX_RECORD_READ']),
      [
        query('status').optional().isIn(Object.values(TaxRecordStatus)),
        query('taxType').optional().isIn(Object.values(TaxType)),
        query('taxYear').optional().matches(/^\d{4}(-\d{4})?$/),
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
      ],
      this.listTaxRecords.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/tax-records/{id}:
     *   get:
     *     summary: Get a specific tax record
     *     tags: [Tax Records]
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
     *         description: Tax record retrieved successfully
     *       404:
     *         description: Tax record not found
     */
    this.router.get(
      '/:id',
      rbacMiddleware(['FINANCIAL_READ', 'TAX_RECORD_READ']),
      [
        param('id').isUUID().withMessage('Tax record ID must be a valid UUID')
      ],
      this.getTaxRecordById.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/tax-records/{id}:
     *   put:
     *     summary: Update a tax record
     *     tags: [Tax Records]
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
     *               amountPaid:
     *                 type: number
     *                 format: decimal
     *               status:
     *                 type: string
     *                 enum: [pending, paid, overdue, partially_paid, waived, under_review]
     *               submissionReference:
     *                 type: string
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Tax record updated successfully
     *       404:
     *         description: Tax record not found
     */
    this.router.put(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'TAX_RECORD_UPDATE']),
      [
        param('id').isUUID().withMessage('Tax record ID must be a valid UUID'),
        body('amountDue').optional().isDecimal({ decimal_digits: '0,4' }),
        body('amountPaid').optional().isDecimal({ decimal_digits: '0,4' }),
        body('status').optional().isIn(Object.values(TaxRecordStatus)),
        body('submissionReference').optional().isLength({ max: 100 }),
        body('notes').optional().isLength({ max: 1000 })
      ],
      this.updateTaxRecord.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/tax-records/{id}:
     *   delete:
     *     summary: Delete a tax record
     *     tags: [Tax Records]
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
     *         description: Tax record deleted successfully
     *       404:
     *         description: Tax record not found
     */
    this.router.delete(
      '/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'TAX_RECORD_DELETE']),
      [
        param('id').isUUID().withMessage('Tax record ID must be a valid UUID')
      ],
      this.deleteTaxRecord.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/tax-records/{id}/record-payment:
     *   post:
     *     summary: Record a tax payment
     *     tags: [Tax Records]
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
     *               - paymentAmount
     *               - paymentDate
     *             properties:
     *               paymentAmount:
     *                 type: number
     *                 format: decimal
     *               paymentDate:
     *                 type: string
     *                 format: date
     *               paymentReference:
     *                 type: string
     *               notes:
     *                 type: string
     *     responses:
     *       200:
     *         description: Tax payment recorded successfully
     *       404:
     *         description: Tax record not found
     */
    this.router.post(
      '/:id/record-payment',
      rbacMiddleware(['FINANCIAL_WRITE', 'TAX_RECORD_UPDATE']),
      [
        param('id').isUUID().withMessage('Tax record ID must be a valid UUID'),
        body('paymentAmount').isDecimal({ decimal_digits: '0,4' }).withMessage('Payment amount must be a valid decimal'),
        body('paymentDate').isISO8601().withMessage('Payment date must be valid ISO 8601 date'),
        body('paymentReference').optional().isLength({ max: 100 }),
        body('notes').optional().isLength({ max: 1000 })
      ],
      this.recordTaxPayment.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/tax-records/compliance-summary:
     *   get:
     *     summary: Get tax compliance summary
     *     tags: [Tax Records]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: taxYear
     *         schema:
     *           type: string
     *           pattern: '^\d{4}(-\d{4})?$'
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
     *         description: Tax compliance summary retrieved successfully
     */
    this.router.get(
      '/compliance-summary',
      rbacMiddleware(['FINANCIAL_READ', 'TAX_RECORD_READ']),
      [
        query('taxYear').optional().matches(/^\d{4}(-\d{4})?$/),
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date')
      ],
      this.getTaxComplianceSummary.bind(this)
    );
  }

  /**
   * Route Handlers
   */

  private async createTaxRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.taxRecordController.createTaxRecord(
        req.body,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async listTaxRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        status: req.query['status'] as TaxRecordStatus,
        taxType: req.query['taxType'] as TaxType,
        taxYear: req.query['taxYear'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 50
      };

      const result = await this.taxRecordController.listTaxRecords(
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

  private async getTaxRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.taxRecordController.getTaxRecordById(
        req.params['id'],
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async updateTaxRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.taxRecordController.updateTaxRecord(
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

  private async deleteTaxRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      await this.taxRecordController.deleteTaxRecord(
        req.params['id'],
        userId,
        correlationId
      );

      res.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  }

  private async recordTaxPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.taxRecordController.recordTaxPayment(
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

  private async getTaxComplianceSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        taxYear: req.query['taxYear'] as string,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined
      };

      const result = await this.taxRecordController.getTaxComplianceSummary(
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

export default TaxRecordRoutes;
