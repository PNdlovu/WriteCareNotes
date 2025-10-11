/**
 * @fileoverview cash transaction Service
 * @module Financial/CashTransactionService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description cash transaction Service
 */

import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { CashTransaction, CashTransactionType, CashTransactionStatus } from '../../entities/financial/CashTransaction';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { AuditService,  AuditTrailService } from '../audit';
import { NotificationService } from '../notifications/NotificationService';
import { logger } from '../../utils/logger';
import { Decimal } from 'decimal.js';

export interface CashTransactionRequest {
  transactionType: CashTransactionType;
  amount: number;
  accountId: string;
  description: string;
  reference?: string;
  careHomeId?: string;
  department?: string;
  costCenter?: string;
  paymentMethod?: string;
  bankReference?: string;
  checkNumber?: string;
  notes?: string;
  attachments?: string[];
}

export interface CashTransactionUpdate {
  status?: CashTransactionStatus;
  description?: string;
  reference?: string;
  notes?: string;
  attachments?: string[];
}

export interface CashTransactionSearchCriteria {
  transactionType?: CashTransactionType;
  status?: CashTransactionStatus;
  accountId?: string;
  careHomeId?: string;
  department?: string;
  costCenter?: string;
  paymentMethod?: string;
  amountMin?: number;
  amountMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  processedAfter?: Date;
  processedBefore?: Date;
  createdBy?: string;
  processedBy?: string;
}

export interface CashTransactionReport {
  totalTransactions: number;
  totalAmount: number;
  processedTransactions: number;
  pendingTransactions: number;
  rejectedTransactions: number;
  transactionsByType: { [key in CashTransactionType]: number };
  transactionsByStatus: { [key in CashTransactionStatus]: number };
  amountByType: { [key in CashTransactionType]: number };
  departmentBreakdown: { [department: string]: number };
  costCenterBreakdown: { [costCenter: string]: number };
  paymentMethodBreakdown: { [method: string]: number };
  averageProcessingTime: number;
}

export class CashTransactionService {
  private cashTransactionRepository: Repository<CashTransaction>;
  private ledgerAccountRepository: Repository<LedgerAccount>;
  private auditService: AuditService;
  private notificationService: NotificationService;
  private eventEmitter: EventEmitter2;

  constructor() {
    this.cashTransactionRepository = AppDataSource.getRepository(CashTransaction);
    this.ledgerAccountRepository = AppDataSource.getRepository(LedgerAccount);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Create a new cash transaction
   */
  async createCashTransaction(
    request: CashTransactionRequest,
    createdBy: string
  ): Promise<CashTransaction> {
    // Validate account exists and is active
    const account = await this.ledgerAccountRepository.findOne({
      where: { id: request.accountId }
    });

    if (!account) {
      throw new Error('Ledger account not found');
    }

    if (!account.isActive) {
      throw new Error('Cannot post to inactive account');
    }

    // Create cash transaction
    const cashTransaction = this.cashTransactionRepository.create({
      transactionType: request.transactionType,
      amount: new Decimal(request.amount),
      accountId: request.accountId,
      description: request.description,
      reference: request.reference,
      careHomeId: request.careHomeId,
      department: request.department,
      costCenter: request.costCenter,
      paymentMethod: request.paymentMethod,
      bankReference: request.bankReference,
      checkNumber: request.checkNumber,
      notes: request.notes,
      attachments: request.attachments,
      createdBy,
      status: CashTransactionStatus.PENDING
    });

    const savedTransaction = await this.cashTransactionRepository.save(cashTransaction);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'CashTransaction',
      entityType: 'CashTransaction',
      entityId: savedTransaction.id,
      action: 'CREATE',
      details: {
        transactionType: request.transactionType,
        amount: request.amount,
        accountId: request.accountId,
        description: request.description
      },
      userId: createdBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Cash transaction created',
      type: 'cash_transaction_created',
      recipients: ['finance_team', 'accounting_team'],
      data: {
        transactionId: savedTransaction.id,
        transactionType: request.transactionType,
        amount: request.amount
      }
    });

    // Emit event
    this.eventEmitter.emit('cash_transaction.created', {
      transactionId: savedTransaction.id,
      transactionType: request.transactionType,
      amount: request.amount
    });

    logger.info('Cash transaction created', {
      transactionId: savedTransaction.id,
      transactionType: request.transactionType,
      amount: request.amount,
      createdBy
    });

    return savedTransaction;
  }

  /**
   * Get cash transaction by ID
   */
  async getCashTransactionById(transactionId: string): Promise<CashTransaction | null> {
    return await this.cashTransactionRepository.findOne({
      where: { id: transactionId },
      relations: ['account']
    });
  }

  /**
   * Search cash transactions with criteria
   */
  async searchCashTransactions(criteria: CashTransactionSearchCriteria): Promise<CashTransaction[]> {
    const queryBuilder = this.cashTransactionRepository.createQueryBuilder('ct');

    if (criteria.transactionType) {
      queryBuilder.andWhere('ct.transactionType = :transactionType', { transactionType: criteria.transactionType });
    }

    if (criteria.status) {
      queryBuilder.andWhere('ct.status = :status', { status: criteria.status });
    }

    if (criteria.accountId) {
      queryBuilder.andWhere('ct.accountId = :accountId', { accountId: criteria.accountId });
    }

    if (criteria.careHomeId) {
      queryBuilder.andWhere('ct.careHomeId = :careHomeId', { careHomeId: criteria.careHomeId });
    }

    if (criteria.department) {
      queryBuilder.andWhere('ct.department = :department', { department: criteria.department });
    }

    if (criteria.costCenter) {
      queryBuilder.andWhere('ct.costCenter = :costCenter', { costCenter: criteria.costCenter });
    }

    if (criteria.paymentMethod) {
      queryBuilder.andWhere('ct.paymentMethod = :paymentMethod', { paymentMethod: criteria.paymentMethod });
    }

    if (criteria.amountMin !== undefined) {
      queryBuilder.andWhere('ct.amount >= :amountMin', { amountMin: criteria.amountMin });
    }

    if (criteria.amountMax !== undefined) {
      queryBuilder.andWhere('ct.amount <= :amountMax', { amountMax: criteria.amountMax });
    }

    if (criteria.createdAfter) {
      queryBuilder.andWhere('ct.createdAt >= :createdAfter', { createdAfter: criteria.createdAfter });
    }

    if (criteria.createdBefore) {
      queryBuilder.andWhere('ct.createdAt <= :createdBefore', { createdBefore: criteria.createdBefore });
    }

    if (criteria.processedAfter) {
      queryBuilder.andWhere('ct.processedAt >= :processedAfter', { processedAfter: criteria.processedAfter });
    }

    if (criteria.processedBefore) {
      queryBuilder.andWhere('ct.processedAt <= :processedBefore', { processedBefore: criteria.processedBefore });
    }

    if (criteria.createdBy) {
      queryBuilder.andWhere('ct.createdBy = :createdBy', { createdBy: criteria.createdBy });
    }

    if (criteria.processedBy) {
      queryBuilder.andWhere('ct.processedBy = :processedBy', { processedBy: criteria.processedBy });
    }

    return await queryBuilder
      .leftJoinAndSelect('ct.account', 'account')
      .orderBy('ct.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update cash transaction
   */
  async updateCashTransaction(
    transactionId: string,
    updates: CashTransactionUpdate,
    updatedBy: string
  ): Promise<CashTransaction> {
    const transaction = await this.getCashTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Cash transaction not found');
    }

    if (transaction.status === CashTransactionStatus.PROCESSED) {
      throw new Error('Cannot update processed cash transaction');
    }

    // Update fields
    Object.assign(transaction, updates);
    transaction.updatedBy = updatedBy;

    const updatedTransaction = await this.cashTransactionRepository.save(transaction);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'CashTransaction',
      entityType: 'CashTransaction',
      entityId: transactionId,
      action: 'UPDATE',
      details: updates,
      userId: updatedBy
    });

    // Emit event
    this.eventEmitter.emit('cash_transaction.updated', {
      transactionId,
      updates,
      updatedBy
    });

    logger.info('Cash transaction updated', {
      transactionId,
      updates,
      updatedBy
    });

    return updatedTransaction;
  }

  /**
   * Process cash transaction
   */
  async processCashTransaction(
    transactionId: string,
    processedBy: string
  ): Promise<CashTransaction> {
    const transaction = await this.getCashTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Cash transaction not found');
    }

    if (transaction.status !== CashTransactionStatus.PENDING) {
      throw new Error('Only pending cash transactions can be processed');
    }

    // Get the ledger account
    const account = await this.ledgerAccountRepository.findOne({
      where: { id: transaction.accountId }
    });

    if (!account) {
      throw new Error('Ledger account not found');
    }

    // Post to ledger account
    if (transaction.transactionType === CashTransactionType.RECEIPT) {
      account.postCredit(transaction.amount, transaction.description, processedBy);
    } else if (transaction.transactionType === CashTransactionType.PAYMENT) {
      account.postDebit(transaction.amount, transaction.description, processedBy);
    }

    await this.ledgerAccountRepository.save(account);

    // Update transaction status
    transaction.status = CashTransactionStatus.PROCESSED;
    transaction.processedAt = new Date();
    transaction.processedBy = processedBy;

    const processedTransaction = await this.cashTransactionRepository.save(transaction);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'CashTransaction',
      entityType: 'CashTransaction',
      entityId: transactionId,
      action: 'PROCESS',
      details: { processedBy },
      userId: processedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Cash transaction processed',
      type: 'cash_transaction_processed',
      recipients: ['finance_team', 'accounting_team'],
      data: {
        transactionId,
        transactionType: transaction.transactionType,
        amount: transaction.amount.toString(),
        processedBy
      }
    });

    // Emit event
    this.eventEmitter.emit('cash_transaction.processed', {
      transactionId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      processedBy
    });

    logger.info('Cash transaction processed', {
      transactionId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      processedBy
    });

    return processedTransaction;
  }

  /**
   * Reject cash transaction
   */
  async rejectCashTransaction(
    transactionId: string,
    reason: string,
    rejectedBy: string
  ): Promise<CashTransaction> {
    const transaction = await this.getCashTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Cash transaction not found');
    }

    if (transaction.status !== CashTransactionStatus.PENDING) {
      throw new Error('Only pending cash transactions can be rejected');
    }

    // Update transaction status
    transaction.status = CashTransactionStatus.REJECTED;
    transaction.rejectedAt = new Date();
    transaction.rejectedBy = rejectedBy;
    transaction.rejectionReason = reason;

    const rejectedTransaction = await this.cashTransactionRepository.save(transaction);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'CashTransaction',
      entityType: 'CashTransaction',
      entityId: transactionId,
      action: 'REJECT',
      details: { reason },
      userId: rejectedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Cash transaction rejected',
      type: 'cash_transaction_rejected',
      recipients: ['finance_team', 'accounting_team'],
      data: {
        transactionId,
        reason,
        rejectedBy
      }
    });

    logger.info('Cash transaction rejected', {
      transactionId,
      reason,
      rejectedBy
    });

    return rejectedTransaction;
  }

  /**
   * Reverse cash transaction
   */
  async reverseCashTransaction(
    transactionId: string,
    reason: string,
    reversedBy: string
  ): Promise<CashTransaction> {
    const transaction = await this.getCashTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Cash transaction not found');
    }

    if (transaction.status !== CashTransactionStatus.PROCESSED) {
      throw new Error('Only processed cash transactions can be reversed');
    }

    // Get the ledger account
    const account = await this.ledgerAccountRepository.findOne({
      where: { id: transaction.accountId }
    });

    if (!account) {
      throw new Error('Ledger account not found');
    }

    // Reverse the posting
    if (transaction.transactionType === CashTransactionType.RECEIPT) {
      account.postDebit(transaction.amount, `REVERSAL: ${transaction.description}`, reversedBy);
    } else if (transaction.transactionType === CashTransactionType.PAYMENT) {
      account.postCredit(transaction.amount, `REVERSAL: ${transaction.description}`, reversedBy);
    }

    await this.ledgerAccountRepository.save(account);

    // Create reversal transaction
    const reversalTransaction = this.cashTransactionRepository.create({
      transactionType: transaction.transactionType === CashTransactionType.RECEIPT 
        ? CashTransactionType.PAYMENT 
        : CashTransactionType.RECEIPT,
      amount: transaction.amount,
      accountId: transaction.accountId,
      description: `REVERSAL: ${transaction.description}`,
      reference: transaction.reference,
      careHomeId: transaction.careHomeId,
      department: transaction.department,
      costCenter: transaction.costCenter,
      paymentMethod: transaction.paymentMethod,
      bankReference: transaction.bankReference,
      checkNumber: transaction.checkNumber,
      notes: `Reversal of ${transaction.id}. Reason: ${reason}`,
      createdBy: reversedBy,
      status: CashTransactionStatus.PROCESSED,
      processedAt: new Date(),
      processedBy: reversedBy,
      reversalOf: transactionId
    });

    const savedReversal = await this.cashTransactionRepository.save(reversalTransaction);

    // Mark original transaction as reversed
    transaction.status = CashTransactionStatus.REVERSED;
    transaction.reversedAt = new Date();
    transaction.reversedBy = reversedBy;
    transaction.reversalReason = reason;

    await this.cashTransactionRepository.save(transaction);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'CashTransaction',
      entityType: 'CashTransaction',
      entityId: transactionId,
      action: 'REVERSE',
      details: { reason, reversalTransactionId: savedReversal.id },
      userId: reversedBy
    });

    logger.info('Cash transaction reversed', {
      transactionId,
      reversalTransactionId: savedReversal.id,
      reason,
      reversedBy
    });

    return savedReversal;
  }

  /**
   * Get cash transaction report
   */
  async getCashTransactionReport(careHomeId?: string): Promise<CashTransactionReport> {
    const queryBuilder = this.cashTransactionRepository.createQueryBuilder('ct');

    if (careHomeId) {
      queryBuilder.andWhere('ct.careHomeId = :careHomeId', { careHomeId });
    }

    const transactions = await queryBuilder.getMany();

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount.toNumber(), 0);
    const processedTransactions = transactions.filter(t => t.status === CashTransactionStatus.PROCESSED).length;
    const pendingTransactions = transactions.filter(t => t.status === CashTransactionStatus.PENDING).length;
    const rejectedTransactions = transactions.filter(t => t.status === CashTransactionStatus.REJECTED).length;

    // Transactions by type
    const transactionsByType = Object.values(CashTransactionType).reduce((acc, type) => {
      acc[type] = transactions.filter(t => t.transactionType === type).length;
      return acc;
    }, {} as { [key in CashTransactionType]: number });

    // Transactions by status
    const transactionsByStatus = Object.values(CashTransactionStatus).reduce((acc, status) => {
      acc[status] = transactions.filter(t => t.status === status).length;
      return acc;
    }, {} as { [key in CashTransactionStatus]: number });

    // Amount by type
    const amountByType = Object.values(CashTransactionType).reduce((acc, type) => {
      acc[type] = transactions
        .filter(t => t.transactionType === type)
        .reduce((sum, t) => sum + t.amount.toNumber(), 0);
      return acc;
    }, {} as { [key in CashTransactionType]: number });

    // Department breakdown
    const departmentBreakdown = transactions.reduce((acc, t) => {
      const dept = t.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as { [department: string]: number });

    // Cost center breakdown
    const costCenterBreakdown = transactions.reduce((acc, t) => {
      const costCenter = t.costCenter || 'Unknown';
      acc[costCenter] = (acc[costCenter] || 0) + 1;
      return acc;
    }, {} as { [costCenter: string]: number });

    // Payment method breakdown
    const paymentMethodBreakdown = transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {} as { [method: string]: number });

    // Calculate average processing time
    const processedTransactionsWithTimes = transactions.filter(t => 
      t.status === CashTransactionStatus.PROCESSED && t.processedAt
    );
    const averageProcessingTime = processedTransactionsWithTimes.length > 0
      ? processedTransactionsWithTimes.reduce((sum, t) => {
          const processingTime = t.processedAt!.getTime() - t.createdAt.getTime();
          return sum + processingTime;
        }, 0) / processedTransactionsWithTimes.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    return {
      totalTransactions,
      totalAmount,
      processedTransactions,
      pendingTransactions,
      rejectedTransactions,
      transactionsByType,
      transactionsByStatus,
      amountByType,
      departmentBreakdown,
      costCenterBreakdown,
      paymentMethodBreakdown,
      averageProcessingTime
    };
  }

  /**
   * Delete cash transaction
   */
  async deleteCashTransaction(transactionId: string, deletedBy: string): Promise<void> {
    const transaction = await this.getCashTransactionById(transactionId);
    if (!transaction) {
      throw new Error('Cash transaction not found');
    }

    if (transaction.status === CashTransactionStatus.PROCESSED) {
      throw new Error('Cannot delete processed cash transaction');
    }

    // Soft delete
    await this.cashTransactionRepository.softDelete(transactionId);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'CashTransaction',
      entityType: 'CashTransaction',
      entityId: transactionId,
      action: 'DELETE',
      details: { transactionType: transaction.transactionType, amount: transaction.amount.toString() },
      userId: deletedBy
    });

    logger.info('Cash transaction deleted', {
      transactionId,
      transactionType: transaction.transactionType,
      amount: transaction.amount.toString(),
      deletedBy
    });
  }

  /**
   * Bulk update cash transaction status
   */
  async bulkUpdateCashTransactionStatus(
    transactionIds: string[],
    status: CashTransactionStatus,
    updatedBy: string,
    notes?: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const transactionId of transactionIds) {
      try {
        await this.updateCashTransaction(transactionId, { status, notes }, updatedBy);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update cash transaction', {
          transactionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return updatedCount;
  }
}

export default CashTransactionService;