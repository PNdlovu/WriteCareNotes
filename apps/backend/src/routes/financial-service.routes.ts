/**
 * @fileoverview Financial Service API Routes for WriteCareNotes
 * @module FinancialServiceRoutes
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express.js routes for Financial Service API endpoints with
 * comprehensive validation, security, and healthcare compliance features.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - GDPR and Data Protection Act 2018
 * - Financial Conduct Authority (FCA) regulations
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import rateLimit from 'express-rate-limit';

import { FinancialServiceController } from '@/controllers/financial/FinancialServiceController';
import { authMiddleware } from '@/middleware/auth-middleware';
import { rbacMiddleware } from '@/middleware/rbac-middleware';
import { auditMiddleware } from '@/middleware/audit-middleware';
import { correlationMiddleware } from '@/middleware/correlation-middleware';
import { performanceMiddleware } from '@/middleware/performance-middleware';
import { complianceMiddleware } from '@/middleware/compliance-middleware';

import {
  Currency,
  PaymentMethod,
  BillingStatus,
  PaymentStatus,
  ClaimStatus,
  ReportType
} from '@/services/financial/interfaces/FinancialInterfaces';

/**
 * Financial Service Routes with enterprise security and compliance
 */
const router = Router();
const financialController = new FinancialServiceController();

/**
 * Middleware Setup
 */

// Apply correlation ID middleware
router.use(correlationMiddleware);

// Apply authentication middleware
router.use(authMiddleware);

// Apply performance monitoring
router.use(performanceMiddleware);

// Apply compliance middleware
router.use(complianceMiddleware);

// Apply audit middleware
router.use(auditMiddleware);

// Rate limiting for financial operations
const financialRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many financial requests from this IP'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.use(financialRateLimit);

/**
 * Resident Billing Routes
 */

/**
 * @swagger
 * /api/v1/financial/bills:
 *   post:
 *     summary: Create a new resident bill
 *     tags: [Financial - Billing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateResidentBillRequest'
 *     responses:
 *       201:
 *         description: Bill created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/bills',
  rbacMiddleware(['FINANCIAL_WRITE', 'BILLING_CREATE']),
  [
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('careHomeId')
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    body('billingPeriodStart')
      .isISO8601()
      .withMessage('Billing period start must be a valid date'),
    body('billingPeriodEnd')
      .isISO8601()
      .withMessage('Billing period end must be a valid date'),
    body('dueDate')
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('amount')
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Amount must be a valid decimal with up to 4 decimal places'),
    body('currency')
      .optional()
      .isIn(Object.values(Currency))
      .withMessage('Invalid currency'),
    body('description')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be 1-1000 characters'),
    body('lineItems')
      .isArray({ min: 1 })
      .withMessage('At least one line item is required'),
    body('lineItems.*.description')
      .isLength({ min: 1, max: 500 })
      .withMessage('Line item description must be 1-500 characters'),
    body('lineItems.*.quantity')
      .isInt({ min: 1 })
      .withMessage('Line item quantity must be a positive integer'),
    body('lineItems.*.unitPrice')
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Line item unit price must be a valid decimal'),
    body('lineItems.*.amount')
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Line item amount must be a valid decimal'),
    body('lineItems.*.category')
      .isLength({ min: 1, max: 100 })
      .withMessage('Line item category must be 1-100 characters'),
    body('includeVat')
      .optional()
      .isBoolean()
      .withMessage('Include VAT must be a boolean'),
    body('paymentTerms')
      .optional()
      .isInt({ min: 1, max: 365 })
      .withMessage('Payment terms must be between 1 and 365 days'),
    body('notes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Notes must be max 2000 characters')
  ],
  financialController.createResidentBill.bind(financialController)
);

/**
 * @swagger
 * /api/v1/financial/bills:
 *   get:
 *     summary: Get resident bills with filtering
 *     tags: [Financial - Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: residentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: careHomeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, sent, partially_paid, paid, overdue, cancelled, refunded]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: isOverdue
 *         schema:
 *           type: boolean
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
 *         description: Bills retrieved successfully
 */
router.get(
  '/bills',
  rbacMiddleware(['FINANCIAL_READ', 'BILLING_READ']),
  [
    query('residentId')
      .optional()
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    query('careHomeId')
      .optional()
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(Object.values(BillingStatus))
      .withMessage('Invalid billing status'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),
    query('isOverdue')
      .optional()
      .isBoolean()
      .withMessage('Is overdue must be a boolean'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000')
  ],
  financialController.getResidentBills.bind(financialController)
);

/**
 * @swagger
 * /api/v1/financial/bills/{id}:
 *   get:
 *     summary: Get a specific resident bill
 *     tags: [Financial - Billing]
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
 *         description: Bill retrieved successfully
 *       404:
 *         description: Bill not found
 */
router.get(
  '/bills/:id',
  rbacMiddleware(['FINANCIAL_READ', 'BILLING_READ']),
  [
    param('id')
      .isUUID()
      .withMessage('Bill ID must be a valid UUID')
  ],
  financialController.getResidentBill.bind(financialController)
);

/**
 * Payment Processing Routes
 */

/**
 * @swagger
 * /api/v1/financial/payments:
 *   post:
 *     summary: Process a payment
 *     tags: [Financial - Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProcessPaymentRequest'
 *     responses:
 *       201:
 *         description: Payment processed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/payments',
  rbacMiddleware(['FINANCIAL_WRITE', 'PAYMENT_PROCESS']),
  [
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('careHomeId')
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    body('amount')
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Amount must be a valid decimal with up to 4 decimal places'),
    body('currency')
      .optional()
      .isIn(Object.values(Currency))
      .withMessage('Invalid currency'),
    body('paymentMethod')
      .isIn(Object.values(PaymentMethod))
      .withMessage('Invalid payment method'),
    body('description')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Description must be 1-1000 characters'),
    body('billId')
      .optional()
      .isUUID()
      .withMessage('Bill ID must be a valid UUID'),
    body('notes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Notes must be max 2000 characters')
  ],
  financialController.processPayment.bind(financialController)
);

/**
 * @swagger
 * /api/v1/financial/payments:
 *   get:
 *     summary: Get payments with filtering
 *     tags: [Financial - Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: residentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: careHomeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: billId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, failed, cancelled, refunded]
 *       - in: query
 *         name: paymentMethod
 *         schema:
 *           type: string
 *           enum: [cash, credit_card, debit_card, bank_transfer, direct_debit, cheque, bacs, faster_payments]
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get(
  '/payments',
  rbacMiddleware(['FINANCIAL_READ', 'PAYMENT_READ']),
  [
    query('residentId')
      .optional()
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    query('careHomeId')
      .optional()
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    query('billId')
      .optional()
      .isUUID()
      .withMessage('Bill ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(Object.values(PaymentStatus))
      .withMessage('Invalid payment status'),
    query('paymentMethod')
      .optional()
      .isIn(Object.values(PaymentMethod))
      .withMessage('Invalid payment method')
  ],
  financialController.getPayments.bind(financialController)
);

/**
 * Insurance Claims Routes
 */

/**
 * @swagger
 * /api/v1/financial/claims:
 *   post:
 *     summary: Create an insurance claim
 *     tags: [Financial - Insurance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInsuranceClaimRequest'
 *     responses:
 *       201:
 *         description: Insurance claim created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/claims',
  rbacMiddleware(['FINANCIAL_WRITE', 'INSURANCE_CLAIM_CREATE']),
  [
    body('residentId')
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    body('careHomeId')
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    body('insuranceProvider')
      .isLength({ min: 1, max: 255 })
      .withMessage('Insurance provider must be 1-255 characters'),
    body('policyNumber')
      .isLength({ min: 1, max: 100 })
      .withMessage('Policy number must be 1-100 characters'),
    body('claimType')
      .isLength({ min: 1, max: 100 })
      .withMessage('Claim type must be 1-100 characters'),
    body('claimAmount')
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Claim amount must be a valid decimal'),
    body('deductible')
      .optional()
      .isDecimal({ decimal_digits: '0,4' })
      .withMessage('Deductible must be a valid decimal'),
    body('currency')
      .optional()
      .isIn(Object.values(Currency))
      .withMessage('Invalid currency'),
    body('incidentDate')
      .isISO8601()
      .withMessage('Incident date must be a valid date'),
    body('description')
      .isLength({ min: 1, max: 2000 })
      .withMessage('Description must be 1-2000 characters'),
    body('supportingDocuments')
      .optional()
      .isArray()
      .withMessage('Supporting documents must be an array'),
    body('notes')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Notes must be max 2000 characters')
  ],
  financialController.createInsuranceClaim.bind(financialController)
);

/**
 * @swagger
 * /api/v1/financial/claims:
 *   get:
 *     summary: Get insurance claims with filtering
 *     tags: [Financial - Insurance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: residentId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: careHomeId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: insuranceProvider
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, under_review, approved, rejected, paid, cancelled]
 *     responses:
 *       200:
 *         description: Insurance claims retrieved successfully
 */
router.get(
  '/claims',
  rbacMiddleware(['FINANCIAL_READ', 'INSURANCE_CLAIM_READ']),
  [
    query('residentId')
      .optional()
      .isUUID()
      .withMessage('Resident ID must be a valid UUID'),
    query('careHomeId')
      .optional()
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(Object.values(ClaimStatus))
      .withMessage('Invalid claim status')
  ],
  financialController.getInsuranceClaims.bind(financialController)
);

/**
 * Financial Reporting Routes
 */

/**
 * @swagger
 * /api/v1/financial/reports:
 *   post:
 *     summary: Generate a financial report
 *     tags: [Financial - Reporting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FinancialReportRequest'
 *     responses:
 *       201:
 *         description: Financial report generated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 */
router.post(
  '/reports',
  rbacMiddleware(['FINANCIAL_REPORTS', 'REPORT_GENERATE']),
  [
    body('reportType')
      .isIn(Object.values(ReportType))
      .withMessage('Invalid report type'),
    body('careHomeId')
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    body('startDate')
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    body('endDate')
      .isISO8601()
      .withMessage('End date must be a valid date'),
    body('format')
      .optional()
      .isIn(['json', 'pdf', 'excel', 'csv'])
      .withMessage('Invalid report format'),
    body('parameters')
      .optional()
      .isObject()
      .withMessage('Parameters must be an object')
  ],
  financialController.generateFinancialReport.bind(financialController)
);

/**
 * Financial Metrics Routes
 */

/**
 * @swagger
 * /api/v1/financial/metrics:
 *   get:
 *     summary: Get financial metrics and KPIs
 *     tags: [Financial - Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: careHomeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [month, quarter, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Financial metrics retrieved successfully
 *       400:
 *         description: Validation error
 */
router.get(
  '/metrics',
  rbacMiddleware(['FINANCIAL_READ', 'METRICS_READ']),
  [
    query('careHomeId')
      .isUUID()
      .withMessage('Care Home ID must be a valid UUID'),
    query('period')
      .optional()
      .isIn(['month', 'quarter', 'year'])
      .withMessage('Period must be month, quarter, or year')
  ],
  financialController.getFinancialMetrics.bind(financialController)
);

export default router;
