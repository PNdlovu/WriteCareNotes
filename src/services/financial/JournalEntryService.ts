import { EventEmitter2 } from "eventemitter2";
import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { JournalEntry, JournalEntryStatus, JournalEntryType } from '../../entities/financial/JournalEntry';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { AuditTrailService } from '../audit/AuditTrailService';
import { NotificationService } from '../notifications/NotificationService';
import { logger } from '../../utils/logger';
import { Decimal } from 'decimal.js';

export interface JournalEntryRequest {
  entryNumber: string;
  entryType: JournalEntryType;
  description: string;
  reference?: string;
  careHomeId?: string;
  department?: string;
  costCenter?: string;
  entries: JournalEntryLineRequest[];
  notes?: string;
  attachments?: string[];
}

export interface JournalEntryLineRequest {
  accountId: string;
  debitAmount?: number;
  creditAmount?: number;
  description: string;
  reference?: string;
  costCenter?: string;
  department?: string;
}

export interface JournalEntryUpdate {
  status?: JournalEntryStatus;
  description?: string;
  reference?: string;
  notes?: string;
  attachments?: string[];
}

export interface JournalEntrySearchCriteria {
  entryNumber?: string;
  status?: JournalEntryStatus;
  entryType?: JournalEntryType;
  careHomeId?: string;
  department?: string;
  costCenter?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  postedAfter?: Date;
  postedBefore?: Date;
  createdBy?: string;
  postedBy?: string;
}

export interface JournalEntryReport {
  totalEntries: number;
  postedEntries: number;
  pendingEntries: number;
  rejectedEntries: number;
  totalDebitAmount: number;
  totalCreditAmount: number;
  isBalanced: boolean;
  averageProcessingTime: number;
  entriesByType: { [key in JournalEntryType]: number };
  entriesByStatus: { [key in JournalEntryStatus]: number };
  departmentBreakdown: { [department: string]: number };
  costCenterBreakdown: { [costCenter: string]: number };
}

export class JournalEntryService {
  private journalEntryRepository: Repository<JournalEntry>;
  private ledgerAccountRepository: Repository<LedgerAccount>;
  private auditService: AuditTrailService;
  private notificationService: NotificationService;
  private eventEmitter: EventEmitter2;

  constructor() {
    this.journalEntryRepository = AppDataSource.getRepository(JournalEntry);
    this.ledgerAccountRepository = AppDataSource.getRepository(LedgerAccount);
    this.auditService = new AuditTrailService();
    this.notificationService = new NotificationService(new EventEmitter2());
    this.eventEmitter = new EventEmitter2();
  }

  /**
   * Create a new journal entry
   */
  async createJournalEntry(
    request: JournalEntryRequest,
    createdBy: string
  ): Promise<JournalEntry> {
    // Validate that debits equal credits
    const totalDebits = request.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredits = request.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new Error('Journal entry is not balanced. Total debits must equal total credits.');
    }

    // Validate all accounts exist and are active
    const accountIds = request.entries.map(entry => entry.accountId);
    const accounts = await this.ledgerAccountRepository.findByIds(accountIds);
    
    if (accounts.length !== accountIds.length) {
      throw new Error('One or more ledger accounts not found');
    }

    const inactiveAccounts = accounts.filter(account => !account.isActive);
    if (inactiveAccounts.length > 0) {
      throw new Error('Cannot post to inactive accounts');
    }

    // Create journal entry
    const journalEntry = this.journalEntryRepository.create({
      entryNumber: request.entryNumber,
      entryType: request.entryType,
      description: request.description,
      reference: request.reference,
      careHomeId: request.careHomeId,
      department: request.department,
      costCenter: request.costCenter,
      notes: request.notes,
      attachments: request.attachments,
      createdBy,
      status: JournalEntryStatus.DRAFT
    });

    const savedEntry = await this.journalEntryRepository.save(journalEntry);

    // Create journal entry lines
    for (const lineRequest of request.entries) {
      const account = accounts.find(acc => acc.id === lineRequest.accountId);
      if (!account) continue;

      const journalEntryLine = {
        journalEntryId: savedEntry.id,
        accountId: lineRequest.accountId,
        debitAmount: lineRequest.debitAmount ? new Decimal(lineRequest.debitAmount) : new Decimal(0),
        creditAmount: lineRequest.creditAmount ? new Decimal(lineRequest.creditAmount) : new Decimal(0),
        description: lineRequest.description,
        reference: lineRequest.reference,
        costCenter: lineRequest.costCenter,
        department: lineRequest.department,
        createdBy
      };

      // This would be saved to a JournalEntryLine entity
      // For now, we'll store it in the journal entry
      if (!savedEntry.entries) {
        savedEntry.entries = [];
      }
      savedEntry.entries.push(journalEntryLine as any);
    }

    const finalEntry = await this.journalEntryRepository.save(savedEntry);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'JournalEntry',
      entityType: 'JournalEntry',
      entityId: finalEntry.id,
      action: 'CREATE',
      details: {
        entryNumber: request.entryNumber,
        entryType: request.entryType,
        totalDebits,
        totalCredits
      },
      userId: createdBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Journal entry created',
      type: 'journal_entry_created',
      recipients: ['finance_team', 'accounting_team'],
      data: {
        entryId: finalEntry.id,
        entryNumber: request.entryNumber,
        entryType: request.entryType
      }
    });

    // Emit event
    this.eventEmitter.emit('journal_entry.created', {
      entryId: finalEntry.id,
      entryNumber: request.entryNumber,
      entryType: request.entryType
    });

    logger.info('Journal entry created', {
      entryId: finalEntry.id,
      entryNumber: request.entryNumber,
      entryType: request.entryType,
      createdBy
    });

    return finalEntry;
  }

  /**
   * Get journal entry by ID
   */
  async getJournalEntryById(entryId: string): Promise<JournalEntry | null> {
    return await this.journalEntryRepository.findOne({
      where: { id: entryId },
      relations: ['entries']
    });
  }

  /**
   * Get journal entry by entry number
   */
  async getJournalEntryByNumber(entryNumber: string): Promise<JournalEntry | null> {
    return await this.journalEntryRepository.findOne({
      where: { entryNumber },
      relations: ['entries']
    });
  }

  /**
   * Search journal entries with criteria
   */
  async searchJournalEntries(criteria: JournalEntrySearchCriteria): Promise<JournalEntry[]> {
    const queryBuilder = this.journalEntryRepository.createQueryBuilder('je');

    if (criteria.entryNumber) {
      queryBuilder.andWhere('je.entryNumber = :entryNumber', { entryNumber: criteria.entryNumber });
    }

    if (criteria.status) {
      queryBuilder.andWhere('je.status = :status', { status: criteria.status });
    }

    if (criteria.entryType) {
      queryBuilder.andWhere('je.entryType = :entryType', { entryType: criteria.entryType });
    }

    if (criteria.careHomeId) {
      queryBuilder.andWhere('je.careHomeId = :careHomeId', { careHomeId: criteria.careHomeId });
    }

    if (criteria.department) {
      queryBuilder.andWhere('je.department = :department', { department: criteria.department });
    }

    if (criteria.costCenter) {
      queryBuilder.andWhere('je.costCenter = :costCenter', { costCenter: criteria.costCenter });
    }

    if (criteria.createdAfter) {
      queryBuilder.andWhere('je.createdAt >= :createdAfter', { createdAfter: criteria.createdAfter });
    }

    if (criteria.createdBefore) {
      queryBuilder.andWhere('je.createdAt <= :createdBefore', { createdBefore: criteria.createdBefore });
    }

    if (criteria.postedAfter) {
      queryBuilder.andWhere('je.postedAt >= :postedAfter', { postedAfter: criteria.postedAfter });
    }

    if (criteria.postedBefore) {
      queryBuilder.andWhere('je.postedAt <= :postedBefore', { postedBefore: criteria.postedBefore });
    }

    if (criteria.createdBy) {
      queryBuilder.andWhere('je.createdBy = :createdBy', { createdBy: criteria.createdBy });
    }

    if (criteria.postedBy) {
      queryBuilder.andWhere('je.postedBy = :postedBy', { postedBy: criteria.postedBy });
    }

    return await queryBuilder
      .leftJoinAndSelect('je.entries', 'entries')
      .orderBy('je.createdAt', 'DESC')
      .getMany();
  }

  /**
   * Update journal entry
   */
  async updateJournalEntry(
    entryId: string,
    updates: JournalEntryUpdate,
    updatedBy: string
  ): Promise<JournalEntry> {
    const entry = await this.getJournalEntryById(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status === JournalEntryStatus.POSTED) {
      throw new Error('Cannot update posted journal entry');
    }

    // Update fields
    Object.assign(entry, updates);
    entry.updatedBy = updatedBy;

    const updatedEntry = await this.journalEntryRepository.save(entry);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'JournalEntry',
      entityType: 'JournalEntry',
      entityId: entryId,
      action: 'UPDATE',
      details: updates,
      userId: updatedBy
    });

    // Emit event
    this.eventEmitter.emit('journal_entry.updated', {
      entryId,
      updates,
      updatedBy
    });

    logger.info('Journal entry updated', {
      entryId,
      updates,
      updatedBy
    });

    return updatedEntry;
  }

  /**
   * Post journal entry
   */
  async postJournalEntry(
    entryId: string,
    postedBy: string
  ): Promise<JournalEntry> {
    const entry = await this.getJournalEntryById(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== JournalEntryStatus.DRAFT) {
      throw new Error('Only draft journal entries can be posted');
    }

    // Validate entry is balanced
    if (!entry.isBalanced()) {
      throw new Error('Journal entry is not balanced and cannot be posted');
    }

    // Post to ledger accounts
    for (const line of entry.entries || []) {
      const account = await this.ledgerAccountRepository.findOne({
        where: { id: line.accountId }
      });

      if (!account) continue;

      if (line.debitAmount.greaterThan(0)) {
        account.postDebit(line.debitAmount, line.description, postedBy);
      }

      if (line.creditAmount.greaterThan(0)) {
        account.postCredit(line.creditAmount, line.description, postedBy);
      }

      await this.ledgerAccountRepository.save(account);
    }

    // Update journal entry status
    entry.status = JournalEntryStatus.POSTED;
    entry.postedAt = new Date();
    entry.postedBy = postedBy;

    const postedEntry = await this.journalEntryRepository.save(entry);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'JournalEntry',
      entityType: 'JournalEntry',
      entityId: entryId,
      action: 'POST',
      details: { postedBy },
      userId: postedBy
    });

    // Send notification
    await this.notificationService.sendNotification({
      message: 'Journal entry posted',
      type: 'journal_entry_posted',
      recipients: ['finance_team', 'accounting_team'],
      data: {
        entryId,
        entryNumber: entry.entryNumber,
        postedBy
      }
    });

    // Emit event
    this.eventEmitter.emit('journal_entry.posted', {
      entryId,
      entryNumber: entry.entryNumber,
      postedBy
    });

    logger.info('Journal entry posted', {
      entryId,
      entryNumber: entry.entryNumber,
      postedBy
    });

    return postedEntry;
  }

  /**
   * Reverse journal entry
   */
  async reverseJournalEntry(
    entryId: string,
    reversedBy: string,
    reason: string
  ): Promise<JournalEntry> {
    const entry = await this.getJournalEntryById(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status !== JournalEntryStatus.POSTED) {
      throw new Error('Only posted journal entries can be reversed');
    }

    // Create reversal entry
    const reversalEntry = this.journalEntryRepository.create({
      entryNumber: `${entry.entryNumber}-REV`,
      entryType: entry.entryType,
      description: `REVERSAL: ${entry.description}`,
      reference: entry.reference,
      careHomeId: entry.careHomeId,
      department: entry.department,
      costCenter: entry.costCenter,
      notes: `Reversal of ${entry.entryNumber}. Reason: ${reason}`,
      createdBy: reversedBy,
      status: JournalEntryStatus.DRAFT,
      reversalOf: entryId
    });

    const savedReversal = await this.journalEntryRepository.save(reversalEntry);

    // Create reversal lines (opposite amounts)
    for (const line of entry.entries || []) {
      const reversalLine = {
        journalEntryId: savedReversal.id,
        accountId: line.accountId,
        debitAmount: line.creditAmount,
        creditAmount: line.debitAmount,
        description: `REVERSAL: ${line.description}`,
        reference: line.reference,
        costCenter: line.costCenter,
        department: line.department,
        createdBy: reversedBy
      };

      if (!savedReversal.entries) {
        savedReversal.entries = [];
      }
      savedReversal.entries.push(reversalLine as any);
    }

    const finalReversal = await this.journalEntryRepository.save(savedReversal);

    // Post the reversal
    await this.postJournalEntry(finalReversal.id, reversedBy);

    // Mark original entry as reversed
    entry.status = JournalEntryStatus.REVERSED;
    entry.reversedAt = new Date();
    entry.reversedBy = reversedBy;
    entry.reversalReason = reason;

    await this.journalEntryRepository.save(entry);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'JournalEntry',
      entityType: 'JournalEntry',
      entityId: entryId,
      action: 'REVERSE',
      details: { reason, reversalEntryId: finalReversal.id },
      userId: reversedBy
    });

    logger.info('Journal entry reversed', {
      entryId,
      reversalEntryId: finalReversal.id,
      reason,
      reversedBy
    });

    return finalReversal;
  }

  /**
   * Get journal entry report
   */
  async getJournalEntryReport(careHomeId?: string): Promise<JournalEntryReport> {
    const queryBuilder = this.journalEntryRepository.createQueryBuilder('je');

    if (careHomeId) {
      queryBuilder.andWhere('je.careHomeId = :careHomeId', { careHomeId });
    }

    const entries = await queryBuilder.getMany();

    const totalEntries = entries.length;
    const postedEntries = entries.filter(e => e.status === JournalEntryStatus.POSTED).length;
    const pendingEntries = entries.filter(e => e.status === JournalEntryStatus.DRAFT).length;
    const rejectedEntries = entries.filter(e => e.status === JournalEntryStatus.REJECTED).length;

    const totalDebitAmount = entries.reduce((sum, entry) => {
      return sum + (entry.entries?.reduce((lineSum, line) => lineSum + line.debitAmount.toNumber(), 0) || 0);
    }, 0);

    const totalCreditAmount = entries.reduce((sum, entry) => {
      return sum + (entry.entries?.reduce((lineSum, line) => lineSum + line.creditAmount.toNumber(), 0) || 0);
    }, 0);

    const isBalanced = Math.abs(totalDebitAmount - totalCreditAmount) < 0.01;

    // Calculate average processing time
    const postedEntriesWithTimes = entries.filter(e => e.status === JournalEntryStatus.POSTED && e.postedAt);
    const averageProcessingTime = postedEntriesWithTimes.length > 0
      ? postedEntriesWithTimes.reduce((sum, e) => {
          const processingTime = e.postedAt!.getTime() - e.createdAt.getTime();
          return sum + processingTime;
        }, 0) / postedEntriesWithTimes.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;

    // Entries by type
    const entriesByType = Object.values(JournalEntryType).reduce((acc, type) => {
      acc[type] = entries.filter(e => e.entryType === type).length;
      return acc;
    }, {} as { [key in JournalEntryType]: number });

    // Entries by status
    const entriesByStatus = Object.values(JournalEntryStatus).reduce((acc, status) => {
      acc[status] = entries.filter(e => e.status === status).length;
      return acc;
    }, {} as { [key in JournalEntryStatus]: number });

    // Department breakdown
    const departmentBreakdown = entries.reduce((acc, e) => {
      const dept = e.department || 'Unknown';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as { [department: string]: number });

    // Cost center breakdown
    const costCenterBreakdown = entries.reduce((acc, e) => {
      const costCenter = e.costCenter || 'Unknown';
      acc[costCenter] = (acc[costCenter] || 0) + 1;
      return acc;
    }, {} as { [costCenter: string]: number });

    return {
      totalEntries,
      postedEntries,
      pendingEntries,
      rejectedEntries,
      totalDebitAmount,
      totalCreditAmount,
      isBalanced,
      averageProcessingTime,
      entriesByType,
      entriesByStatus,
      departmentBreakdown,
      costCenterBreakdown
    };
  }

  /**
   * Delete journal entry
   */
  async deleteJournalEntry(entryId: string, deletedBy: string): Promise<void> {
    const entry = await this.getJournalEntryById(entryId);
    if (!entry) {
      throw new Error('Journal entry not found');
    }

    if (entry.status === JournalEntryStatus.POSTED) {
      throw new Error('Cannot delete posted journal entry');
    }

    // Soft delete
    await this.journalEntryRepository.softDelete(entryId);

    // Log audit trail
    await this.auditService.logEvent({
      resource: 'JournalEntry',
      entityType: 'JournalEntry',
      entityId: entryId,
      action: 'DELETE',
      details: { entryNumber: entry.entryNumber },
      userId: deletedBy
    });

    logger.info('Journal entry deleted', {
      entryId,
      entryNumber: entry.entryNumber,
      deletedBy
    });
  }

  /**
   * Bulk update journal entry status
   */
  async bulkUpdateJournalEntryStatus(
    entryIds: string[],
    status: JournalEntryStatus,
    updatedBy: string,
    notes?: string
  ): Promise<number> {
    let updatedCount = 0;

    for (const entryId of entryIds) {
      try {
        await this.updateJournalEntry(entryId, { status, notes }, updatedBy);
        updatedCount++;
      } catch (error) {
        logger.error('Failed to update journal entry', {
          entryId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return updatedCount;
  }
}

export default JournalEntryService;