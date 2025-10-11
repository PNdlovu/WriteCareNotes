/**
 * @fileoverview Comprehensive payment processing service with healthcare payment features,
 * @module Financial/PaymentService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description Comprehensive payment processing service with healthcare payment features,
 */

import { EventEmitter2 } from "eventemitter2";

/**
 * @fileoverview Payment Service for WriteCareNotes
 * @module PaymentService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive payment processing service with healthcare payment features,
 * reconciliation, and compliance reporting for care home operations.
 * 
 * @compliance
 * - PCI DSS (Payment Card Industry Data Security Standard)
 * - SOX (Sarbanes-Oxley Act) compliance
 * - GDPR Article 6 & 9 (Financial data processing)
 * - FCA (Financial Conduct Authority) regulations
 * - PSD2 (Payment Services Directive 2) compliance
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, Like, IsNull, Not } from 'typeorm';
import { Decimal } from 'decimal.js';
import * as dayjs from 'dayjs';

import { Payment, PaymentStatus, PaymentMethod, PaymentType } from '@/entities/financial/Payment';
import { Invoice, InvoiceStatus } from '@/entities/financial/Invoice';
import { ChartOfAccounts } from '@/entities/financial/ChartOfAccounts';
import { FinancialTransaction } from '@/entities/financial/FinancialTransaction';
import { HealthcareEncryption } from '@/utils/encryption';
import { logger as appLogger } from '@/utils/logger';

export interface CreatePaymentRequest {
  invoiceId?: string;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  description?: string;
  reference?: string;
  notes?: string;
  cardLastFour?: string;
  cardExpiry?: string;
  bankAccountLastFour?: string;
  sortCode?: string;
  providerTransactionId?: string;
  providerReference?: string;
  providerName?: string;
  accountId: string;
  processedBy: string;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  providerResponse?: string;
  processedBy: string;
}

export interface RefundPaymentRequest {
  paymentId: string;
  amount: number;
  reason: string;
  refundedBy: string;
}

export interface PaymentFilters {
  status?: PaymentStatus[];
  paymentMethod?: PaymentMethod[];
  paymentType?: PaymentType[];
  invoiceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  amountFrom?: number;
  amountTo?: number;
  isReconciled?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaymentListResponse {
  payments: Payment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalAmount: string;
    refundedAmount: string;
    netAmount: string;
    processingFees: string;
    reconciledCount: number;
    unreconciledCount: number;
  };
}

export interface PaymentReconciliationResult {
  reconciledPayments: Payment[];
  unreconciledPayments: Payment[];
  totalReconciled: string;
  totalUnreconciled: string;
  errors: string[];
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectRepository(Payment)
    privatepaymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    privateinvoiceRepository: Repository<Invoice>,
    @InjectRepository(ChartOfAccounts)
    privatechartOfAccountsRepository: Repository<ChartOfAccounts>,
    @InjectRepository(FinancialTransaction)
    privatefinancialTransactionRepository: Repository<FinancialTransaction>,
  ) {}

  /**
   * Create a new payment
   */
  async createPayment(request: CreatePaymentRequest): Promise<Payment> {
    this.logger.log(`Creating payment for ${request.paymentType}`);
    
    try {
      // Validate request
      this.validateCreatePaymentRequest(request);

      // Get account
      const account = await this.chartOfAccountsRepository.findOne({
        where: { id: request.accountId },
      });
      if (!account) {
        throw new Error('Account not found');
      }

      // Validate invoice if provided
      if (request.invoiceId) {
        const invoice = await this.invoiceRepository.findOne({
          where: { id: request.invoiceId },
        });
        if (!invoice) {
          throw new Error('Invoice not found');
        }
        if (invoice.status === InvoiceStatus.CANCELLED) {
          throw new Error('Cannot create payment for cancelled invoice');
        }
      }

      // Create payment
      const payment = this.paymentRepository.create({
        invoiceId: request.invoiceId,
        paymentType: request.paymentType,
        paymentMethod: request.paymentMethod,
        amount: new Decimal(request.amount),
        paymentDate: request.paymentDate,
        description: request.description,
        reference: request.reference,
        notes: request.notes,
        cardLastFour: request.cardLastFour,
        cardExpiry: request.cardExpiry,
        bankAccountLastFour: request.bankAccountLastFour,
        sortCode: request.sortCode,
        providerTransactionId: request.providerTransactionId,
        providerReference: request.providerReference,
        providerName: request.providerName,
        accountId: request.accountId,
        createdBy: request.processedBy,
        status: PaymentStatus.PENDING,
        currency: 'GBP',
      });

      const savedPayment = await this.paymentRepository.save(payment);

      // Create financial transaction
      await this.createFinancialTransaction(savedPayment);

      this.logger.log(`Payment created successfully: ${savedPayment.id}`);
      return savedPayment;

    } catch (error) {
      this.logger.error(`Failed to create payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a payment
   */
  async processPayment(request: ProcessPaymentRequest): Promise<Payment> {
    this.logger.log(`Processing payment: ${request.paymentId}`);
    
    try {
      const payment = await this.getPaymentById(request.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PENDING) {
        throw new Error('Only pending payments can be processed');
      }

      // Process payment
      payment.process();
      if (request.providerResponse) {
        payment.providerResponse = request.providerResponse;
      }
      payment.updatedBy = request.processedBy;

      const updatedPayment = await this.paymentRepository.save(payment);

      // Update invoice if applicable
      if (payment.invoiceId) {
        await this.updateInvoiceWithPayment(payment);
      }

      this.logger.log(`Payment processed successfully: ${request.paymentId}`);
      return updatedPayment;

    } catch (error) {
      this.logger.error(`Failed to process payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Complete a payment
   */
  async completePayment(paymentId: string, completedBy: string): Promise<Payment> {
    this.logger.log(`Completing payment: ${paymentId}`);
    
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== PaymentStatus.PROCESSING) {
        throw new Error('Only processing payments can be completed');
      }

      payment.complete();
      payment.updatedBy = completedBy;

      const updatedPayment = await this.paymentRepository.save(payment);

      // Update invoice if applicable
      if (payment.invoiceId) {
        await this.updateInvoiceWithPayment(payment);
      }

      this.logger.log(`Payment completed successfully: ${paymentId}`);
      return updatedPayment;

    } catch (error) {
      this.logger.error(`Failed to complete payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Fail a payment
   */
  async failPayment(paymentId: string, failedBy: string, reason: string): Promise<Payment> {
    this.logger.log(`Failing payment: ${paymentId}`);
    
    try {
      const payment = await this.getPaymentById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status === PaymentStatus.COMPLETED) {
        throw new Error('Completed payments cannot be failed');
      }

      payment.fail(reason);
      payment.updatedBy = failedBy;

      const updatedPayment = await this.paymentRepository.save(payment);

      this.logger.log(`Payment failed successfully: ${paymentId}`);
      return updatedPayment;

    } catch (error) {
      this.logger.error(`Failed to fail payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process refund for payment
   */
  async processRefund(request: RefundPaymentRequest): Promise<Payment> {
    this.logger.log(`Processing refund for payment: ${request.paymentId}`);
    
    try {
      const payment = await this.getPaymentById(request.paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (!payment.isCompleted()) {
        throw new Error('Only completed payments can be refunded');
      }

      const refundAmount = new Decimal(request.amount);
      if (refundAmount.lessThanOrEqualTo(0)) {
        throw new Error('Refund amount must be positive');
      }

      if (refundAmount.greaterThan(payment.getRefundableAmount())) {
        throw new Error('Refund amount cannot exceed refundable amount');
      }

      payment.processRefund(refundAmount, request.reason, request.refundedBy);
      payment.updatedBy = request.refundedBy;

      const updatedPayment = await this.paymentRepository.save(payment);

      // Update invoice if applicable
      if (payment.invoiceId) {
        await this.updateInvoiceWithRefund(payment, refundAmount);
      }

      // Create refund transaction
      await this.createRefundTransaction(updatedPayment, refundAmount);

      this.logger.log(`Refund processed successfully: ${request.paymentId}`);
      return updatedPayment;

    } catch (error) {
      this.logger.error(`Failed to process refund: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['invoice', 'account'],
    });
  }

  /**
   * List payments with filters and pagination
   */
  async listPayments(filters: PaymentFilters = {}): Promise<PaymentListResponse> {
    this.logger.log('Listing payments with filters');
    
    try {
      const query = this.paymentRepository.createQueryBuilder('payment')
        .leftJoinAndSelect('payment.invoice', 'invoice')
        .leftJoinAndSelect('payment.account', 'account');

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query.andWhere('payment.status IN (:...status)', { status: filters.status });
      }

      if (filters.paymentMethod && filters.paymentMethod.length > 0) {
        query.andWhere('payment.paymentMethod IN (:...paymentMethod)', { paymentMethod: filters.paymentMethod });
      }

      if (filters.paymentType && filters.paymentType.length > 0) {
        query.andWhere('payment.paymentType IN (:...paymentType)', { paymentType: filters.paymentType });
      }

      if (filters.invoiceId) {
        query.andWhere('payment.invoiceId = :invoiceId', { invoiceId: filters.invoiceId });
      }

      if (filters.dateFrom) {
        query.andWhere('payment.paymentDate >= :dateFrom', { dateFrom: filters.dateFrom });
      }

      if (filters.dateTo) {
        query.andWhere('payment.paymentDate <= :dateTo', { dateTo: filters.dateTo });
      }

      if (filters.amountFrom) {
        query.andWhere('payment.amount >= :amountFrom', { amountFrom: filters.amountFrom });
      }

      if (filters.amountTo) {
        query.andWhere('payment.amount <= :amountTo', { amountTo: filters.amountTo });
      }

      if (filters.isReconciled !== undefined) {
        query.andWhere('payment.isReconciled = :isReconciled', { isReconciled: filters.isReconciled });
      }

      if (filters.search) {
        query.andWhere(
          '(payment.paymentReference ILIKE :search OR payment.description ILIKE :search OR payment.reference ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'paymentDate';
      const sortOrder = filters.sortOrder || 'DESC';
      query.orderBy(`payment.${sortBy}`, sortOrder);

      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;

      query.skip(offset).take(limit);

      const [payments, total] = await query.getManyAndCount();

      // Calculate summary
      const summary = await this.calculatePaymentSummary(filters);

      return {
        payments,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        summary,
      };

    } catch (error) {
      this.logger.error(`Failed to list payments: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Reconcile payments
   */
  async reconcilePayments(paymentIds: string[], reconciledBy: string): Promise<PaymentReconciliationResult> {
    this.logger.log(`Reconciling ${paymentIds.length} payments`);
    
    try {
      const payments = await this.paymentRepository.find({
        where: { id: In(paymentIds) },
        relations: ['invoice'],
      });

      constreconciledPayments: Payment[] = [];
      constunreconciledPayments: Payment[] = [];
      consterrors: string[] = [];
      let totalReconciled = new Decimal(0);
      let totalUnreconciled = new Decimal(0);

      for (const payment of payments) {
        try {
          if (payment.status !== PaymentStatus.COMPLETED) {
            unreconciledPayments.push(payment);
            totalUnreconciled = totalUnreconciled.plus(payment.amount);
            errors.push(`Payment ${payment.paymentReference} is not completed`);
            continue;
          }

          if (payment.isReconciled) {
            unreconciledPayments.push(payment);
            totalUnreconciled = totalUnreconciled.plus(payment.amount);
            errors.push(`Payment ${payment.paymentReference} is already reconciled`);
            continue;
          }

          payment.reconcile(reconciledBy);
          await this.paymentRepository.save(payment);

          reconciledPayments.push(payment);
          totalReconciled = totalReconciled.plus(payment.amount);

        } catch (error) {
          unreconciledPayments.push(payment);
          totalUnreconciled = totalUnreconciled.plus(payment.amount);
          errors.push(`Failed to reconcile payment ${payment.paymentReference}: ${error.message}`);
        }
      }

      this.logger.log(`Reconciled ${reconciledPayments.length} payments successfully`);

      return {
        reconciledPayments,
        unreconciledPayments,
        totalReconciled: totalReconciled.toFixed(2),
        totalUnreconciled: totalUnreconciled.toFixed(2),
        errors,
      };

    } catch (error) {
      this.logger.error(`Failed to reconcile payments: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStatistics(period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    totalPayments: number;
    totalAmount: string;
    refundedAmount: string;
    netAmount: string;
    processingFees: string;
    averagePaymentAmount: string;
    successRate: number;
    reconciliationRate: number;
  }> {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const payments = await this.paymentRepository.find({
      where: {
        paymentDate: Between(startDate, now),
      },
    });

    const stats = {
      totalPayments: payments.length,
      totalAmount: '0.00',
      refundedAmount: '0.00',
      netAmount: '0.00',
      processingFees: '0.00',
      averagePaymentAmount: '0.00',
      successRate: 0,
      reconciliationRate: 0,
    };

    let totalAmount = new Decimal(0);
    let refundedAmount = new Decimal(0);
    let processingFees = new Decimal(0);
    let completedCount = 0;
    let reconciledCount = 0;

    payments.forEach(payment => {
      totalAmount = totalAmount.plus(payment.amount);
      refundedAmount = refundedAmount.plus(payment.refundedAmount);
      processingFees = processingFees.plus(payment.processingFee);

      if (payment.isCompleted()) {
        completedCount++;
      }

      if (payment.isReconciled) {
        reconciledCount++;
      }
    });

    const netAmount = totalAmount.minus(refundedAmount);

    stats.totalAmount = totalAmount.toFixed(2);
    stats.refundedAmount = refundedAmount.toFixed(2);
    stats.netAmount = netAmount.toFixed(2);
    stats.processingFees = processingFees.toFixed(2);
    stats.averagePaymentAmount = payments.length > 0 ? totalAmount.dividedBy(payments.length).toFixed(2) : '0.00';
    stats.successRate = payments.length > 0 ? (completedCount / payments.length) * 100 : 0;
    stats.reconciliationRate = payments.length > 0 ? (reconciledCount / payments.length) * 100 : 0;

    return stats;
  }

  /**
   * Validate create payment request
   */
  private validateCreatePaymentRequest(request: CreatePaymentRequest): void {
    if (!request.paymentType) {
      throw new Error('Payment type is required');
    }

    if (!request.paymentMethod) {
      throw new Error('Payment method is required');
    }

    if (!request.amount || request.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (!request.paymentDate) {
      throw new Error('Payment date is required');
    }

    if (!request.accountId) {
      throw new Error('Account ID is required');
    }

    if (request.paymentDate > new Date()) {
      throw new Error('Payment date cannot be in the future');
    }
  }

  /**
   * Update invoice with payment
   */
  private async updateInvoiceWithPayment(payment: Payment): Promise<void> {
    if (!payment.invoiceId) {
      return;
    }

    const invoice = await this.invoiceRepository.findOne({
      where: { id: payment.invoiceId },
    });

    if (invoice) {
      invoice.recordPayment(payment.amount, payment.id);
      await this.invoiceRepository.save(invoice);
    }
  }

  /**
   * Update invoice with refund
   */
  private async updateInvoiceWithRefund(payment: Payment, refundAmount: Decimal): Promise<void> {
    if (!payment.invoiceId) {
      return;
    }

    const invoice = await this.invoiceRepository.findOne({
      where: { id: payment.invoiceId },
    });

    if (invoice) {
      // Reverse the payment amount from invoice
      invoice.paidAmount = invoice.paidAmount.minus(refundAmount);
      invoice.balanceAmount = invoice.totalAmount.minus(invoice.paidAmount);
      
      if (invoice.isFullyPaid()) {
        invoice.status = InvoiceStatus.PAID;
      } else if (invoice.isPartiallyPaid()) {
        invoice.status = InvoiceStatus.PARTIALLY_PAID;
      } else {
        invoice.status = InvoiceStatus.SENT;
      }

      await this.invoiceRepository.save(invoice);
    }
  }

  /**
   * Create financial transaction for payment
   */
  private async createFinancialTransaction(payment: Payment): Promise<void> {
    const transaction = this.financialTransactionRepository.create({
      transactionDate: payment.paymentDate,
      amount: payment.amount,
      currency: payment.currency,
      description: `Payment ${payment.paymentReference}: ${payment.description}`,
      category: 'REVENUE',
      status: 'PROCESSED',
      reference: payment.paymentReference,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.providerReference,
      accountId: payment.accountId,
      correlationId: payment.correlationId,
      createdBy: payment.createdBy,
    });

    await this.financialTransactionRepository.save(transaction);
  }

  /**
   * Create refund transaction
   */
  private async createRefundTransaction(payment: Payment, refundAmount: Decimal): Promise<void> {
    const transaction = this.financialTransactionRepository.create({
      transactionDate: new Date(),
      amount: refundAmount.negated(), // Negative amount for refund
      currency: payment.currency,
      description: `Refund for payment ${payment.paymentReference}`,
      category: 'REVENUE',
      status: 'PROCESSED',
      reference: payment.refundReference,
      accountId: payment.accountId,
      correlationId: payment.correlationId,
      createdBy: payment.refundedBy,
    });

    await this.financialTransactionRepository.save(transaction);
  }

  /**
   * Calculate payment summary
   */
  private async calculatePaymentSummary(filters: PaymentFilters): Promise<{
    totalAmount: string;
    refundedAmount: string;
    netAmount: string;
    processingFees: string;
    reconciledCount: number;
    unreconciledCount: number;
  }> {
    const query = this.paymentRepository.createQueryBuilder('payment');

    // Apply same filters as main query
    if (filters.status && filters.status.length > 0) {
      query.andWhere('payment.status IN (:...status)', { status: filters.status });
    }

    if (filters.paymentMethod && filters.paymentMethod.length > 0) {
      query.andWhere('payment.paymentMethod IN (:...paymentMethod)', { paymentMethod: filters.paymentMethod });
    }

    if (filters.paymentType && filters.paymentType.length > 0) {
      query.andWhere('payment.paymentType IN (:...paymentType)', { paymentType: filters.paymentType });
    }

    if (filters.invoiceId) {
      query.andWhere('payment.invoiceId = :invoiceId', { invoiceId: filters.invoiceId });
    }

    if (filters.dateFrom) {
      query.andWhere('payment.paymentDate >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('payment.paymentDate <= :dateTo', { dateTo: filters.dateTo });
    }

    if (filters.amountFrom) {
      query.andWhere('payment.amount >= :amountFrom', { amountFrom: filters.amountFrom });
    }

    if (filters.amountTo) {
      query.andWhere('payment.amount <= :amountTo', { amountTo: filters.amountTo });
    }

    if (filters.isReconciled !== undefined) {
      query.andWhere('payment.isReconciled = :isReconciled', { isReconciled: filters.isReconciled });
    }

    if (filters.search) {
      query.andWhere(
        '(payment.paymentReference ILIKE :search OR payment.description ILIKE :search OR payment.reference ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    const payments = await query.getMany();

    let totalAmount = new Decimal(0);
    let refundedAmount = new Decimal(0);
    let processingFees = new Decimal(0);
    let reconciledCount = 0;
    let unreconciledCount = 0;

    payments.forEach(payment => {
      totalAmount = totalAmount.plus(payment.amount);
      refundedAmount = refundedAmount.plus(payment.refundedAmount);
      processingFees = processingFees.plus(payment.processingFee);

      if (payment.isReconciled) {
        reconciledCount++;
      } else {
        unreconciledCount++;
      }
    });

    const netAmount = totalAmount.minus(refundedAmount);

    return {
      totalAmount: totalAmount.toFixed(2),
      refundedAmount: refundedAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      processingFees: processingFees.toFixed(2),
      reconciledCount,
      unreconciledCount,
    };
  }
}

export default PaymentService;
