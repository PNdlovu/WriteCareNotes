import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { LedgerAccount, LedgerAccountType, LedgerAccountCategory, LedgerAccountStatus } from '../../entities/financial/LedgerAccount';
import { AuditTrailService } from '../audit/AuditTrailService';
import { NotificationService } from '../notifications/NotificationService';
import { logger } from '../../utils/logger';
import { Decimal } from 'decimal.js';

export interface LedgerAccountRequest {
  accountCode: string;
  accountName: string;
  description?: string;
  accountType: LedgerAccountType;
  accountCategory: LedgerAccountCategory;
  parentAccountId?: string;
  level?: number;
  isSystemAccount?: boolean;
  isContraAccount?: boolean;
  isControlAccount?: boolean;
  requiresReconciliation?: boolean;
  careHomeId?: string;
  department?: string;
  costCenter?: string;
}

export interface LedgerAccountUpdate {
  accountName?: string;
  description?: string;
  accountCategory?: LedgerAccountCategory;
  parentAccountId?: string;
  level?: number;
  isSystemAccount?: boolean;
  isContraAccount?: boolean;
  isControlAccount?: boolean;
  requiresReconciliation?: boolean;
  department?: string;
  costCenter?: string;
}

export interface LedgerAccountSearchCriteria {
  accountCode?: string;
  accountName?: string;
  accountType?: LedgerAccountType;
  accountCategory?: LedgerAccountCategory;
  status?: LedgerAccountStatus;
  parentAccountId?: string;
  isActive?: boolean;
  isSystemAccount?: boolean;
  isContraAccount?: boolean;
  isControlAccount?: boolean;
  requiresReconciliation?: boolean;
  careHomeId?: string;
  department?: string;
  costCenter?: string;
  level?: number;
}

export interface LedgerAccountReport {
  totalAccounts: number;
  activeAccounts: number;
  inactiveAccounts: number;
  systemAccounts: number;
  contraAccounts: number;
  controlAccounts: number;
  accountsByType: { [key in LedgerAccountType]: number };
  accountsByCategory: { [key in LedgerAccountCategory]: number };
  accountsByStatus: { [key in LedgerAccountStatus]: number };
  departmentBreakdown: { [department: string]: number };
  costCenterBreakdown: { [costCenter: string]: number };
  levelBreakdown: { [level: number]: number };
  totalDebitBalance: number;
  totalCreditBalance: number;
  totalNetBalance: number;
  isBalanced: boolean;
}

export class LedgerAccountService {
  private ledgerAccountRepository: Repository<LedgerAccount>;
  private auditService: AuditTrailService;
  private notificationService: NotificationService;
  private eventEmitter: EventEmitter2;

  constructor() {
    this.ledgerAccountRepository = AppDataSource.getRepository(LedgerAccount);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Create a new ledger account
   */
  async createLedgerAccount(
    request: LedgerAccountRequest,
    createdBy: string
  ): Promise<LedgerAccount> {
    // Check if account code already exists
    const existingAccount = await this.ledgerAccountRepository.findOne({
      where: { accountCode: request.accountCode }
    });

    if (existingAccount) {
      throw new Error('Account code already exists');
    }

    // Validate parent account if provided
    if (request.parentAccountId) {
      const parentAccount = await this.ledgerAccountRepository.findOne({
        where: { id: request.parentAccountId }
      });

      if (!parentAccount) {
        throw new Error('Parent account not found');
      }

      if (!parentAccount.isActive) {
        throw new Error('Cannot create child account under inactive parent');
      }
    }

    // Create ledger account
    const ledgerAccount = this.ledgerAccountRepository.create({
      accountCode: request.accountCode,
      accountName: request.accountName,
      description: request.description,
      accountType: request.accountType,
      accountCategory: request.accountCategory,
      parentAccountId: request.parentAccountId,
      level: request.level || 0,
      isSystemAccount: request.isSystemAccount || false,
      isContraAccount: request.isContraAccount || false,
      isControlAccount: request.isControlAccount || false,
      requiresReconciliation: request.requiresReconciliation || false,
      careHomeId: request.careHomeId,
      department: request.department,
      costCenter: request.costCenter,
      createdBy
    });

    const savedAccount = await this.ledgerAccountRepository.save(ledgerAccount);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'LedgerAccount',
      entityType: 'LedgerAccount',
      entityId: savedAccount.id,
      action: 'CREATE',
      details: {
        accountCode: request.accountCode,
        accountName: request.accountName,
        accountType: request.accountType,
        accountCategory: request.accountCategory
      },
      userId: createdBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Ledger account created',
      type: 'ledger_account_created',
      recipients: ['finance_team', 'accounting_team'],
      data: {
        accountId: savedAccount.id,
        accountCode: request.accountCode,
        accountName: request.accountName,
        accountType: request.accountType
      }
    });

    // Emit event
    this.eventEmitter.emit('ledger_account.created', {
      accountId: savedAccount.id,
      accountCode: request.accountCode,
      accountName: request.accountName,
      accountType: request.accountType
    });

    logger.info('Ledger account created', {
      accountId: savedAccount.id,
      accountCode: request.accountCode,
      accountName: request.accountName,
      accountType: request.accountType,
      createdBy
    });

    return savedAccount;
  }

  /**
   * Get ledger account by ID
   */
  async getLedgerAccountById(accountId: string): Promise<LedgerAccount | null> {
    return await this.ledgerAccountRepository.findOne({
      where: { id: accountId },
      relations: ['parentAccount', 'childAccounts']
    });
  }

  /**
   * Get ledger account by code
   */
  async getLedgerAccountByCode(accountCode: string): Promise<LedgerAccount | null> {
    return await this.ledgerAccountRepository.findOne({
      where: { accountCode },
      relations: ['parentAccount', 'childAccounts']
    });
  }

  /**
   * Search ledger accounts with criteria
   */
  async searchLedgerAccounts(criteria: LedgerAccountSearchCriteria): Promise<LedgerAccount[]> {
    const queryBuilder = this.ledgerAccountRepository.createQueryBuilder('la');

    if (criteria.accountCode) {
      queryBuilder.andWhere('la.accountCode ILIKE :accountCode', { accountCode: `%${criteria.accountCode}%` });
    }

    if (criteria.accountName) {
      queryBuilder.andWhere('la.accountName ILIKE :accountName', { accountName: `%${criteria.accountName}%` });
    }

    if (criteria.accountType) {
      queryBuilder.andWhere('la.accountType = :accountType', { accountType: criteria.accountType });
    }

    if (criteria.accountCategory) {
      queryBuilder.andWhere('la.accountCategory = :accountCategory', { accountCategory: criteria.accountCategory });
    }

    if (criteria.status) {
      queryBuilder.andWhere('la.status = :status', { status: criteria.status });
    }

    if (criteria.parentAccountId) {
      queryBuilder.andWhere('la.parentAccountId = :parentAccountId', { parentAccountId: criteria.parentAccountId });
    }

    if (criteria.isActive !== undefined) {
      queryBuilder.andWhere('la.isActive = :isActive', { isActive: criteria.isActive });
    }

    if (criteria.isSystemAccount !== undefined) {
      queryBuilder.andWhere('la.isSystemAccount = :isSystemAccount', { isSystemAccount: criteria.isSystemAccount });
    }

    if (criteria.isContraAccount !== undefined) {
      queryBuilder.andWhere('la.isContraAccount = :isContraAccount', { isContraAccount: criteria.isContraAccount });
    }

    if (criteria.isControlAccount !== undefined) {
      queryBuilder.andWhere('la.isControlAccount = :isControlAccount', { isControlAccount: criteria.isControlAccount });
    }

    if (criteria.requiresReconciliation !== undefined) {
      queryBuilder.andWhere('la.requiresReconciliation = :requiresReconciliation', { 
        requiresReconciliation: criteria.requiresReconciliation 
      });
    }

    if (criteria.careHomeId) {
      queryBuilder.andWhere('la.careHomeId = :careHomeId', { careHomeId: criteria.careHomeId });
    }

    if (criteria.department) {
      queryBuilder.andWhere('la.department = :department', { department: criteria.department });
    }

    if (criteria.costCenter) {
      queryBuilder.andWhere('la.costCenter = :costCenter', { costCenter: criteria.costCenter });
    }

    if (criteria.level !== undefined) {
      queryBuilder.andWhere('la.level = :level', { level: criteria.level });
    }

    return await queryBuilder
      .leftJoinAndSelect('la.parentAccount', 'parentAccount')
      .leftJoinAndSelect('la.childAccounts', 'childAccounts')
      .orderBy('la.accountCode', 'ASC')
      .getMany();
  }

  /**
   * Update ledger account
   */
  async updateLedgerAccount(
    accountId: string,
    updates: LedgerAccountUpdate,
    updatedBy: string
  ): Promise<LedgerAccount> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    if (account.isSystemAccount) {
      throw new Error('Cannot update system accounts');
    }

    // Validate parent account if changing
    if (updates.parentAccountId && updates.parentAccountId !== account.parentAccountId) {
      const parentAccount = await this.ledgerAccountRepository.findOne({
        where: { id: updates.parentAccountId }
      });

      if (!parentAccount) {
        throw new Error('Parent account not found');
      }

      if (!parentAccount.isActive) {
        throw new Error('Cannot set inactive account as parent');
      }
    }

    // Update fields
    Object.assign(account, updates);
    account.updatedBy = updatedBy;

    const updatedAccount = await this.ledgerAccountRepository.save(account);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'LedgerAccount',
      entityType: 'LedgerAccount',
      entityId: accountId,
      action: 'UPDATE',
      details: updates,
      userId: updatedBy
    });

    // Emit event
    this.eventEmitter.emit('ledger_account.updated', {
      accountId,
      updates,
      updatedBy
    });

    logger.info('Ledger account updated', {
      accountId,
      updates,
      updatedBy
    });

    return updatedAccount;
  }

  /**
   * Activate ledger account
   */
  async activateLedgerAccount(
    accountId: string,
    activatedBy: string
  ): Promise<LedgerAccount> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    if (account.isActive) {
      throw new Error('Account is already active');
    }

    account.isActive = true;
    account.status = LedgerAccountStatus.ACTIVE;
    account.updatedBy = activatedBy;

    const activatedAccount = await this.ledgerAccountRepository.save(account);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'LedgerAccount',
      entityType: 'LedgerAccount',
      entityId: accountId,
      action: 'ACTIVATE',
      details: { activatedBy },
      userId: activatedBy
    });

    logger.info('Ledger account activated', {
      accountId,
      accountCode: account.accountCode,
      activatedBy
    });

    return activatedAccount;
  }

  /**
   * Deactivate ledger account
   */
  async deactivateLedgerAccount(
    accountId: string,
    deactivatedBy: string
  ): Promise<LedgerAccount> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    if (!account.isActive) {
      throw new Error('Account is already inactive');
    }

    if (account.isSystemAccount) {
      throw new Error('Cannot deactivate system accounts');
    }

    // Check if account has children
    if (account.childAccounts && account.childAccounts.length > 0) {
      throw new Error('Cannot deactivate account with child accounts');
    }

    // Check if account has non-zero balance
    if (!account.isBalanced()) {
      throw new Error('Cannot deactivate account with non-zero balance');
    }

    account.isActive = false;
    account.status = LedgerAccountStatus.INACTIVE;
    account.updatedBy = deactivatedBy;

    const deactivatedAccount = await this.ledgerAccountRepository.save(account);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'LedgerAccount',
      entityType: 'LedgerAccount',
      entityId: accountId,
      action: 'DEACTIVATE',
      details: { deactivatedBy },
      userId: deactivatedBy
    });

    logger.info('Ledger account deactivated', {
      accountId,
      accountCode: account.accountCode,
      deactivatedBy
    });

    return deactivatedAccount;
  }

  /**
   * Close ledger account
   */
  async closeLedgerAccount(
    accountId: string,
    closedBy: string
  ): Promise<LedgerAccount> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    if (account.isSystemAccount) {
      throw new Error('Cannot close system accounts');
    }

    // Check if account has children
    if (account.childAccounts && account.childAccounts.length > 0) {
      throw new Error('Cannot close account with child accounts');
    }

    // Check if account has non-zero balance
    if (!account.isBalanced()) {
      throw new Error('Cannot close account with non-zero balance');
    }

    account.status = LedgerAccountStatus.CLOSED;
    account.isActive = false;
    account.updatedBy = closedBy;

    const closedAccount = await this.ledgerAccountRepository.save(account);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'LedgerAccount',
      entityType: 'LedgerAccount',
      entityId: accountId,
      action: 'CLOSE',
      details: { closedBy },
      userId: closedBy
    });

    logger.info('Ledger account closed', {
      accountId,
      accountCode: account.accountCode,
      closedBy
    });

    return closedAccount;
  }

  /**
   * Get account hierarchy
   */
  async getAccountHierarchy(accountId: string): Promise<LedgerAccount[]> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    const hierarchy: LedgerAccount[] = [];
    let current = account;

    // Build path to root
    while (current) {
      hierarchy.unshift(current);
      if (current.parentAccount) {
        current = current.parentAccount;
      } else {
        break;
      }
    }

    return hierarchy;
  }

  /**
   * Get all child accounts recursively
   */
  async getAllChildAccounts(accountId: string): Promise<LedgerAccount[]> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    const children: LedgerAccount[] = [];
    
    if (account.childAccounts) {
      for (const child of account.childAccounts) {
        children.push(child);
        const grandChildren = await this.getAllChildAccounts(child.id);
        children.push(...grandChildren);
      }
    }

    return children;
  }

  /**
   * Get ledger account report
   */
  async getLedgerAccountReport(careHomeId?: string): Promise<LedgerAccountReport> {
    const queryBuilder = this.ledgerAccountRepository.createQueryBuilder('la');

    if (careHomeId) {
      queryBuilder.andWhere('la.careHomeId = :careHomeId', { careHomeId });
    }

    const accounts = await queryBuilder.getMany();

    const totalAccounts = accounts.length;
    const activeAccounts = accounts.filter(a => a.isActive).length;
    const inactiveAccounts = accounts.filter(a => !a.isActive).length;
    const systemAccounts = accounts.filter(a => a.isSystemAccount).length;
    const contraAccounts = accounts.filter(a => a.isContraAccount).length;
    const controlAccounts = accounts.filter(a => a.isControlAccount).length;

    // Accounts by type
    const accountsByType = Object.values(LedgerAccountType).reduce((acc, type) => {
      acc[type] = accounts.filter(a => a.accountType === type).length;
      return acc;
    }, {} as { [key in LedgerAccountType]: number });

    // Accounts by category
    const accountsByCategory = Object.values(LedgerAccountCategory).reduce((acc, category) => {
      acc[category] = accounts.filter(a => a.accountCategory === category).length;
      return acc;
    }, {} as { [key in LedgerAccountCategory]: number });

    // Accounts by status
    const accountsByStatus = Object.values(LedgerAccountStatus).reduce((acc, status) => {
      acc[status] = accounts.filter(a => a.status === status).length;
      return acc;
    }, {} as { [key in LedgerAccountStatus]: number });

    // Department breakdown
    const departmentBreakdown = accounts.reduce((acc, a) => {
      const dept = a.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as { [department: string]: number });

    // Cost center breakdown
    const costCenterBreakdown = accounts.reduce((acc, a) => {
      const costCenter = a.costCenter || 'Unknown';
      acc[costCenter] = (acc[costCenter] || 0) + 1;
      return acc;
    }, {} as { [costCenter: string]: number });

    // Level breakdown
    const levelBreakdown = accounts.reduce((acc, a) => {
      acc[a.level] = (acc[a.level] || 0) + 1;
      return acc;
    }, {} as { [level: number]: number });

    // Balance totals
    const totalDebitBalance = accounts.reduce((sum, a) => sum + a.debitBalance.toNumber(), 0);
    const totalCreditBalance = accounts.reduce((sum, a) => sum + a.creditBalance.toNumber(), 0);
    const totalNetBalance = accounts.reduce((sum, a) => sum + a.netBalance.toNumber(), 0);
    const isBalanced = Math.abs(totalNetBalance) < 0.01;

    return {
      totalAccounts,
      activeAccounts,
      inactiveAccounts,
      systemAccounts,
      contraAccounts,
      controlAccounts,
      accountsByType,
      accountsByCategory,
      accountsByStatus,
      departmentBreakdown,
      costCenterBreakdown,
      levelBreakdown,
      totalDebitBalance,
      totalCreditBalance,
      totalNetBalance,
      isBalanced
    };
  }

  /**
   * Delete ledger account
   */
  async deleteLedgerAccount(accountId: string, deletedBy: string): Promise<void> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found');
    }

    if (account.isSystemAccount) {
      throw new Error('Cannot delete system accounts');
    }

    // Check if account has children
    if (account.childAccounts && account.childAccounts.length > 0) {
      throw new Error('Cannot delete account with child accounts');
    }

    // Check if account has transactions
    if (account.totalTransactions > 0) {
      throw new Error('Cannot delete account with transactions');
    }

    // Soft delete
    await this.ledgerAccountRepository.softDelete(accountId);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'LedgerAccount',
      entityType: 'LedgerAccount',
      entityId: accountId,
      action: 'DELETE',
      details: { accountCode: account.accountCode, accountName: account.accountName },
      userId: deletedBy
    });

    logger.info('Ledger account deleted', {
      accountId,
      accountCode: account.accountCode,
      accountName: account.accountName,
      deletedBy
    });
  }

  /**
   * Bulk update ledger account status
   */
  async bulkUpdateLedgerAccountStatus(
    accountIds: string[],
    status: LedgerAccountStatus,
    updatedBy: string,
    notes?: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const accountId of accountIds) {
      try {
        await this.updateLedgerAccount(accountId, { status, notes }, updatedBy);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update ledger account', {
          accountId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return updatedCount;
  }

  /**
   * Get ledger account balance
   */
  async getLedgerAccountBalance(accountId: string): Promise<{ balance: number; debitBalance: number; creditBalance: number; netBalance: number }> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found.');
    }

    return {
      balance: account.getAccountBalance().toNumber(),
      debitBalance: account.debitBalance.toNumber(),
      creditBalance: account.creditBalance.toNumber(),
      netBalance: account.netBalance.toNumber()
    };
  }

  /**
   * Get ledger account summary
   */
  async getLedgerAccountSummary(accountId: string): Promise<{ account: LedgerAccount; balance: number; transactionCount: number; lastTransactionDate?: Date }> {
    const account = await this.getLedgerAccountById(accountId);
    if (!account) {
      throw new Error('Ledger account not found.');
    }

    return {
      account,
      balance: account.getAccountBalance().toNumber(),
      transactionCount: account.totalTransactions,
      lastTransactionDate: account.lastTransactionDate
    };
  }

  /**
   * Get chart of accounts
   */
  async getChartOfAccounts(careHomeId?: string): Promise<LedgerAccount[]> {
    const queryBuilder = this.ledgerAccountRepository.createQueryBuilder('account');

    if (careHomeId) {
      queryBuilder.andWhere('account.careHomeId = :careHomeId', { careHomeId });
    }

    return queryBuilder
      .leftJoinAndSelect('account.parentAccount', 'parentAccount')
      .leftJoinAndSelect('account.childAccounts', 'childAccounts')
      .orderBy('account.accountCode', 'ASC')
      .getMany();
  }

  /**
   * Get trial balance
   */
  async getTrialBalance(careHomeId?: string, asOfDate?: Date): Promise<{ accounts: Array<{ account: LedgerAccount; debitBalance: number; creditBalance: number; netBalance: number }>; totalDebits: number; totalCredits: number; isBalanced: boolean }> {
    const queryBuilder = this.ledgerAccountRepository.createQueryBuilder('account');

    if (careHomeId) {
      queryBuilder.andWhere('account.careHomeId = :careHomeId', { careHomeId });
    }

    const accounts = await queryBuilder.getMany();

    const accountBalances = accounts.map(account => ({
      account,
      debitBalance: account.debitBalance.toNumber(),
      creditBalance: account.creditBalance.toNumber(),
      netBalance: account.netBalance.toNumber()
    }));

    const totalDebits = accountBalances.reduce((sum, acc) => sum + acc.debitBalance, 0);
    const totalCredits = accountBalances.reduce((sum, acc) => sum + acc.creditBalance, 0);
    const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

    return {
      accounts: accountBalances,
      totalDebits,
      totalCredits,
      isBalanced
    };
  }
}

export default LedgerAccountService;