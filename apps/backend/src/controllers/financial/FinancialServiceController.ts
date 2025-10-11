/**
 * @fileoverview Financial Service Controller for WriteCareNotes
 * @module FinancialServiceController
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Express.js controller for Financial Service operations including
 * resident billing, payment processing, insurance claims, and financial reporting
 * with comprehensive healthcare compliance and audit trails.
 * 
 * @compliance
 * - CQC (Care Quality Commission) - England
 * - Care Inspectorate - Scotland  
 * - CIW (Care Inspectorate Wales) - Wales
 * - RQIA (Regulation and Quality Improvement Authority) - Northern Ireland
 * - GDPR and Data Protection Act 2018
 * - Financial Conduct Authority (FCA) regulations
 */

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';

import { FinancialService } from '@/services/financial/FinancialService';
import { FinancialRepository } from '@/repositories/financial/FinancialRepository';
import { AuditService } from '@/services/audit/AuditService';
import { EncryptionService } from '@/services/security/EncryptionService';
import { NotificationService } from '@/services/notification/NotificationService';
import { CacheService } from '@/services/caching/CacheService';
import { DatabaseService } from '@/services/database/DatabaseService';

import {
  CreateResidentBillRequest,
  ProcessPaymentRequest,
  CreateInsuranceClaimRequest,
  FinancialReportRequest,
  BillQueryFilters,
  PaymentQueryFilters,
  ClaimQueryFilters
} from '@/services/financial/interfaces/FinancialInterfaces';

import { logger } from '@/utils/logger';

/**
 * Financial Service Controller with comprehensive healthcare compliance
 */
export class FinancialServiceController {
  privatefinancialService: FinancialService;

  constructor() {
    // Initialize dependencies
    const databaseService = new DatabaseService();
    const repository = new FinancialRepository(databaseService.getPool());
    const auditService = new AuditService();
    const encryptionService = new EncryptionService();
    const notificationService = new NotificationService();
    const cacheService = new CacheService();

    this.financialService = new FinancialService(
      repository,
      auditService,
      encryptionService,
      notificationService,
      cacheService
    );
  }

  /**
   * Create a new resident bill
   */
  async createResidentBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.array(),
            correlationId: req.headers['x-correlation-id'] as string
          }
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId
          }
        });
        return;
      }

      logger.info('Creating resident bill', {
        correlationId,
        userId,
        residentId: req.body.residentId
      });

      const bill = await this.financialService.createResidentBill(
        req.body as CreateResidentBillRequest,
        userId,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: bill,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to create resident bill', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Get resident bills with filtering
   */
  async getResidentBills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      constfilters: BillQueryFilters = {
        residentId: req.query.residentId as string,
        careHomeId: req.query.careHomeId as string,
        status: req.query.status as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        isOverdue: req.query.isOverdue === 'true',
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const bills = await this.financialService.getResidentBills(filters, userId, correlationId);

      res.json({
        success: true,
        data: bills,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to get resident bills', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Get a specific resident bill
   */
  async getResidentBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;
      const billId = req.params.id;

      const bill = await this.financialService.getResidentBill(billId, userId, correlationId);

      if (!bill) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resident bill not found',
            correlationId
          }
        });
        return;
      }

      res.json({
        success: true,
        data: bill,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to get resident bill', {
        error: error.message,
        billId: req.params.id,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Process a payment
   */
  async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.array(),
            correlationId: req.headers['x-correlation-id'] as string
          }
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId
          }
        });
        return;
      }

      logger.info('Processing payment', {
        correlationId,
        userId,
        amount: req.body.amount
      });

      const payment = await this.financialService.processPayment(
        req.body as ProcessPaymentRequest,
        userId,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: payment,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to process payment', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Get payments with filtering
   */
  async getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      constfilters: PaymentQueryFilters = {
        residentId: req.query.residentId as string,
        careHomeId: req.query.careHomeId as string,
        billId: req.query.billId as string,
        status: req.query.status as any,
        paymentMethod: req.query.paymentMethod as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const payments = await this.financialService.getPayments(filters, userId, correlationId);

      res.json({
        success: true,
        data: payments,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to get payments', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Create an insurance claim
   */
  async createInsuranceClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.array(),
            correlationId: req.headers['x-correlation-id'] as string
          }
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId
          }
        });
        return;
      }

      logger.info('Creating insurance claim', {
        correlationId,
        userId,
        residentId: req.body.residentId
      });

      const claim = await this.financialService.createInsuranceClaim(
        req.body as CreateInsuranceClaimRequest,
        userId,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: claim,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to create insurance claim', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Get insurance claims with filtering
   */
  async getInsuranceClaims(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      constfilters: ClaimQueryFilters = {
        residentId: req.query.residentId as string,
        careHomeId: req.query.careHomeId as string,
        insuranceProvider: req.query.insuranceProvider as string,
        status: req.query.status as any,
        claimType: req.query.claimType as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
        maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50
      };

      const claims = await this.financialService.getInsuranceClaims(filters, userId, correlationId);

      res.json({
        success: true,
        data: claims,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to get insurance claims', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Generate financial report
   */
  async generateFinancialReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: errors.array(),
            correlationId: req.headers['x-correlation-id'] as string
          }
        });
        return;
      }

      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User authentication required',
            correlationId
          }
        });
        return;
      }

      logger.info('Generating financial report', {
        correlationId,
        userId,
        reportType: req.body.reportType
      });

      const report = await this.financialService.generateFinancialReport(
        req.body as FinancialReportRequest,
        userId,
        correlationId
      );

      res.status(201).json({
        success: true,
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to generate financial report', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }

  /**
   * Get financial metrics
   */
  async getFinancialMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
      const userId = req.user?.id;
      const careHomeId = req.query.careHomeId as string;
      const period = (req.query.period as 'month' | 'quarter' | 'year') || 'month';

      if (!careHomeId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PARAMETER',
            message: 'Care Home ID is required',
            correlationId
          }
        });
        return;
      }

      logger.info('Getting financial metrics', {
        correlationId,
        userId,
        careHomeId,
        period
      });

      const metrics = await this.financialService.getFinancialMetrics(
        careHomeId,
        period,
        userId,
        correlationId
      );

      res.json({
        success: true,
        data: metrics,
        meta: {
          timestamp: new Date().toISOString(),
          correlationId
        }
      });

    } catch (error) {
      logger.error('Failed to get financial metrics', {
        error: error.message,
        correlationId: req.headers['x-correlation-id']
      });
      next(error);
    }
  }
}
