import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Financial Analytics API Routes for WriteCareNotes
 * @module FinancialAnalyticsRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express.js routes for Financial Analytics Service API endpoints
 * with comprehensive healthcare compliance, security, and audit features.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

import { FinancialAnalyticsService } from '@/services/financial/FinancialAnalyticsService';
import { authMiddleware } from '@/middleware/auth-middleware';
import { rbacMiddleware } from '@/middleware/rbac-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  TransactionQueryParams,
  BudgetCreationRequest,
  ForecastRequest,
  AnalyticsRequest,
  ReportGenerationRequest
} from '@/services/financial/interfaces/FinancialAnalyticsInterfaces';

import {
  TransactionCategory,
  TransactionStatus,
  Currency
} from '@/entities/financial/FinancialTransaction';

import { BudgetType, BudgetStatus } from '@/entities/financial/Budget';
import { logger } from '@/utils/logger';

/**
 * Financial Analytics Routes with enterprise security and compliance
 */
export class FinancialAnalyticsRoutes {
  privaterouter: Router;
  privatefinancialService: FinancialAnalyticsService;

  constructor(financialService: FinancialAnalyticsService) {
    this.router = Router();
    this.financialService = financialService;
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware for all financial routes
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

    // Rate limiting for financial operations
    const financialRateLimit = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many financial requests from this IP',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false
    });

    this.router.use(financialRateLimit);
  }

  /**
   * Setup all financial analytics routes
   */
  private setupRoutes(): void {
    // Transaction Management Routes
    this.setupTransactionRoutes();

    // Budget Management Routes
    this.setupBudgetRoutes();

    // Forecasting Routes
    this.setupForecastRoutes();

    // Analytics Routes
    this.setupAnalyticsRoutes();

    // Reporting Routes
    this.setupReportingRoutes();

    // Integration Routes
    this.setupIntegrationRoutes();
  }

  /**
   * Setup transaction management routes
   */
  private setupTransactionRoutes(): void {
    /**
     * @swagger
     * /api/v1/financial/transactions:
     *   post:
     *     summary: Create a new financial transaction
     *     tags: [Financial Transactions]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/CreateTransactionRequest'
     *     responses:
     *       201:
     *         description: Transaction created successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     *       403:
     *         description: Insufficient permissions
     */
    this.router.post(
      '/transactions',
      rbacMiddleware(['FINANCIAL_WRITE', 'TRANSACTION_CREATE']),
      [
        body('accountId').isUUID().withMessage('Account ID must be a valid UUID'),
        body('amount').isDecimal({ decimal_digits: '0,4' }).withMessage('Amount must be a valid decimal'),
        body('currency').isIn(Object.values(Currency)).withMessage('Invalid currency'),
        body('description').isLength({ min: 1, max: 500 }).withMessage('Description must be 1-500 characters'),
        body('category').isIn(Object.values(TransactionCategory)).withMessage('Invalid transaction category'),
        body('transactionDate').isISO8601().withMessage('Transaction date must be valid ISO 8601 date'),
        body('reference').optional().isLength({ max: 100 }).withMessage('Reference must be max 100 characters'),
        body('residentId').optional().isUUID().withMessage('Resident ID must be a valid UUID'),
        body('departmentId').optional().isUUID().withMessage('Department ID must be a valid UUID')
      ],
      this.createTransaction.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/transactions:
     *   get:
     *     summary: Retrieve financial transactions
     *     tags: [Financial Transactions]
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: accountId
     *         schema:
     *           type: string
     *           format: uuid
     *       - in: query
     *         name: category
     *         schema:
     *           type: string
     *           enum: [resident_fees, nhs_funding, staff_costs, medication_costs]
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
     *         description: Transactions retrieved successfully
     */
    this.router.get(
      '/transactions',
      rbacMiddleware(['FINANCIAL_READ', 'TRANSACTION_READ']),
      [
        query('accountId').optional().isUUID().withMessage('Account ID must be a valid UUID'),
        query('category').optional().isIn(Object.values(TransactionCategory)),
        query('status').optional().isIn(Object.values(TransactionStatus)),
        query('dateFrom').optional().isISO8601().withMessage('Date from must be valid ISO 8601 date'),
        query('dateTo').optional().isISO8601().withMessage('Date to must be valid ISO 8601 date'),
        query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
        query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
      ],
      this.getTransactions.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/transactions/{id}:
     *   get:
     *     summary: Get a specific financial transaction
     *     tags: [Financial Transactions]
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
     *         description: Transaction retrieved successfully
     *       404:
     *         description: Transaction not found
     */
    this.router.get(
      '/transactions/:id',
      rbacMiddleware(['FINANCIAL_READ', 'TRANSACTION_READ']),
      [
        param('id').isUUID().withMessage('Transaction ID must be a valid UUID')
      ],
      this.getTransaction.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/transactions/{id}:
     *   put:
     *     summary: Update a financial transaction
     *     tags: [Financial Transactions]
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
     *             $ref: '#/components/schemas/UpdateTransactionRequest'
     *     responses:
     *       200:
     *         description: Transaction updated successfully
     *       404:
     *         description: Transaction not found
     */
    this.router.put(
      '/transactions/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'TRANSACTION_UPDATE']),
      [
        param('id').isUUID().withMessage('Transaction ID must be a valid UUID'),
        body('amount').optional().isDecimal({ decimal_digits: '0,4' }),
        body('description').optional().isLength({ min: 1, max: 500 }),
        body('category').optional().isIn(Object.values(TransactionCategory)),
        body('status').optional().isIn(Object.values(TransactionStatus))
      ],
      this.updateTransaction.bind(this)
    );

    /**
     * @swagger
     * /api/v1/financial/transactions/{id}:
     *   delete:
     *     summary: Delete a financial transaction
     *     tags: [Financial Transactions]
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
     *         description: Transaction deleted successfully
     *       404:
     *         description: Transaction not found
     */
    this.router.delete(
      '/transactions/:id',
      rbacMiddleware(['FINANCIAL_WRITE', 'TRANSACTION_DELETE']),
      [
        param('id').isUUID().withMessage('Transaction ID must be a valid UUID')
      ],
      this.deleteTransaction.bind(this)
    );
  }

  /**
   * Setup budget management routes
   */
  private setupBudgetRoutes(): void {
    /**
     * @swagger
     * /api/v1/financial/budgets:
     *   post:
     *     summary: Create a new budget
     *     tags: [Budgets]
     *     security:
     *       - bearerAuth: []
     */
    this.router.post(
      '/budgets',
      rbacMiddleware(['FINANCIAL_WRITE', 'BUDGET_CREATE']),
      [
        body('budgetName').isLength({ min: 1, max: 255 }).withMessage('Budget name must be 1-255 characters'),
        body('budgetType').isIn(Object.values(BudgetType)).withMessage('Invalid budget type'),
        body('financialYear').matches(/^\d{4}(-\d{4})?$/).withMessage('Invalid financial year format'),
        body('startDate').isISO8601().withMessage('Start date must be valid ISO 8601 date'),
        body('endDate').isISO8601().withMessage('End date must be valid ISO 8601 date'),
        body('totalBudgetedRevenue').isDecimal({ decimal_digits: '0,4' }),
        body('totalBudgetedExpenses').isDecimal({ decimal_digits: '0,4' }),
        body('categories').isArray({ min: 1 }).withMessage('At least one budget category is required')
      ],
      this.createBudget.bind(this)
    );

    this.router.get(
      '/budgets',
      rbacMiddleware(['FINANCIAL_READ', 'BUDGET_READ']),
      this.getBudgets.bind(this)
    );

    this.router.get(
      '/budgets/:id',
      rbacMiddleware(['FINANCIAL_READ', 'BUDGET_READ']),
      [param('id').isUUID()],
      this.getBudget.bind(this)
    );
  }

  /**
   * Setup forecasting routes
   */
  private setupForecastRoutes(): void {
    this.router.post(
      '/forecasts',
      rbacMiddleware(['FINANCIAL_ANALYTICS', 'FORECAST_CREATE']),
      [
        body('forecastType').isIn(['revenue', 'expenses', 'cash_flow', 'occupancy', 'profitability']),
        body('entityType').isIn(['care_home', 'department', 'resident', 'service']),
        body('periodMonths').isInt({ min: 1, max: 60 }),
        body('dataTypes').isArray({ min: 1 })
      ],
      this.generateForecast.bind(this)
    );

    this.router.get(
      '/forecasts',
      rbacMiddleware(['FINANCIAL_ANALYTICS', 'FORECAST_READ']),
      this.getForecasts.bind(this)
    );

    this.router.get(
      '/forecasts/:id',
      rbacMiddleware(['FINANCIAL_ANALYTICS', 'FORECAST_READ']),
      [param('id').isUUID()],
      this.getForecast.bind(this)
    );
  }

  /**
   * Setup analytics routes
   */
  private setupAnalyticsRoutes(): void {
    this.router.post(
      '/analytics',
      rbacMiddleware(['FINANCIAL_ANALYTICS', 'ANALYTICS_GENERATE']),
      [
        body('analysisType').isIn(['profitability', 'cost_center', 'variance', 'trend', 'benchmark']),
        body('entityType').isIn(['care_home', 'department', 'resident', 'service']),
        body('dateFrom').isISO8601(),
        body('dateTo').isISO8601(),
        body('metrics').isArray({ min: 1 })
      ],
      this.generateAnalytics.bind(this)
    );

    this.router.get(
      '/kpis',
      rbacMiddleware(['FINANCIAL_ANALYTICS', 'KPI_READ']),
      this.getKPIs.bind(this)
    );
  }

  /**
   * Setup reporting routes
   */
  private setupReportingRoutes(): void {
    this.router.post(
      '/reports',
      rbacMiddleware(['FINANCIAL_REPORTS', 'REPORT_GENERATE']),
      [
        body('reportType').isIn(['profit_and_loss', 'balance_sheet', 'cash_flow', 'budget_variance']),
        body('format').isIn(['pdf', 'excel', 'csv', 'json']),
        body('entityType').isIn(['care_home', 'department', 'resident', 'service']),
        body('dateFrom').isISO8601(),
        body('dateTo').isISO8601()
      ],
      this.generateReport.bind(this)
    );

    this.router.get(
      '/reports',
      rbacMiddleware(['FINANCIAL_REPORTS', 'REPORT_READ']),
      this.getReports.bind(this)
    );
  }

  /**
   * Setup integration routes
   */
  private setupIntegrationRoutes(): void {
    this.router.get(
      '/banking/accounts',
      rbacMiddleware(['FINANCIAL_INTEGRATION', 'BANKING_READ']),
      this.getBankingAccounts.bind(this)
    );

    this.router.post(
      '/banking/reconcile',
      rbacMiddleware(['FINANCIAL_INTEGRATION', 'BANKING_RECONCILE']),
      this.reconcileBankTransactions.bind(this)
    );

    this.router.post(
      '/regulatory/cqc',
      rbacMiddleware(['FINANCIAL_COMPLIANCE', 'CQC_SUBMIT']),
      this.submitCQCReports.bind(this)
    );
  }

  /**
   * Route Handlers
   */

  private async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.financialService.createTransaction(
        req.body as CreateTransactionRequest,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      constqueryParams: TransactionQueryParams = {
        accountId: req.query['accountId'] as string,
        category: req.query['category'] as TransactionCategory,
        status: req.query['status'] as TransactionStatus,
        dateFrom: req.query['dateFrom'] ? new Date(req.query['dateFrom'] as string) : undefined,
        dateTo: req.query['dateTo'] ? new Date(req.query['dateTo'] as string) : undefined,
        page: req.query['page'] ? parseInt(req.query['page'] as string) : 1,
        limit: req.query['limit'] ? parseInt(req.query['limit'] as string) : 50
      };

      const result = await this.financialService.getTransactions(
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

  private async getTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.financialService.getTransaction(
        req.params['id'],
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.financialService.updateTransaction(
        req.params['id'],
        req.body as UpdateTransactionRequest,
        userId,
        correlationId
      );

      res.json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      await this.financialService.deleteTransaction(
        req.params['id'],
        userId,
        correlationId
      );

      res.status(204).send();
    } catch (error: unknown) {
      next(error);
    }
  }

  private async createBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.financialService.createBudget(
        req.body as BudgetCreationRequest,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getBudgets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for getting budgets
      res.json({ message: 'Get budgets endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getBudget(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for getting specific budget
      res.json({ message: 'Get budget endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async generateForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await this.financialService.generateForecast(
        req.body as ForecastRequest,
        userId,
        correlationId
      );

      res.status(201).json(result);
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getForecasts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for getting forecasts
      res.json({ message: 'Get forecasts endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getForecast(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for getting specific forecast
      res.json({ message: 'Get forecast endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async generateAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for generating analytics
      res.json({ message: 'Generate analytics endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getKPIs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for getting KPIs
      res.json({ message: 'Get KPIs endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async generateReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for generating reports
      res.json({ message: 'Generate report endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for getting reports
      res.json({ message: 'Get reports endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async getBankingAccounts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for banking integration
      res.json({ message: 'Banking accounts endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async reconcileBankTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for bank reconciliation
      res.json({ message: 'Bank reconciliation endpoint - implementation pending' });
    } catch (error: unknown) {
      next(error);
    }
  }

  private async submitCQCReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Implementation for CQC reporting
      res.json({ message: 'CQC reporting endpoint - implementation pending' });
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

export default FinancialAnalyticsRoutes;
