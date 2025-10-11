import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { JournalEntryService } from '../../../services/financial/JournalEntryService';
import { JournalEntry, JournalEntryType, JournalEntryStatus } from '../../../entities/financial/JournalEntry';
import { LedgerAccount } from '../../../entities/financial/LedgerAccount';
import { Decimal } from 'decimal.js';

// Mock the database and other dependencies
jest.mock('../../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    transaction: jest.fn()
  }
}));

jest.mock('../../../services/audit/AuditTrailService', () => ({
  AuditTrailService: jest.fn().mockImplementation(() => ({
    logEvent: jest.fn()
  }))
}));

jest.mock('../../../services/notifications/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendNotification: jest.fn()
  }))
}));

jest.mock('eventemitter2', () => ({
  EventEmitter2: jest.fn().mockImplementation(() => ({
    emit: jest.fn()
  }))
}));

describe('JournalEntryService', () => {
  let service: JournalEntryService;
  let mockJournalEntryRepository: any;
  let mockLedgerAccountRepository: any;

  beforeEach(() => {
    mockJournalEntryRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn()
    };

    mockLedgerAccountRepository = {
      findOne: jest.fn(),
      save: jest.fn()
    };

    const { AppDataSource } = require('../../../config/database');
    AppDataSource.getRepository.mockImplementation((entity) => {
      if (entity === JournalEntry) return mockJournalEntryRepository;
      if (entity === LedgerAccount) return mockLedgerAccountRepository;
      return mockJournalEntryRepository;
    });

    AppDataSource.transaction.mockImplementation(async (callback) => {
      return await callback({
        save: jest.fn(),
        getRepository: jest.fn().mockReturnValue(mockLedgerAccountRepository)
      });
    });

    service = new JournalEntryService();
  });

  describe('createJournalEntry', () => {
    it('should create a new journal entry successfully', async () => {
      const request = {
        entryNumber: 'JE-2024-001',
        entryType: JournalEntryType.MANUAL,
        description: 'Test journal entry',
        reference: 'REF-001',
        careHomeId: 'care-home-001',
        department: 'nursing',
        costCenter: 'nursing-001',
        notes: 'Test entry',
        entries: [
          {
            accountId: 'acc-001',
            debitAmount: new Decimal(1000),
            creditAmount: new Decimal(0),
            description: 'Debit entry',
            reference: 'REF-001',
            costCenter: 'nursing-001',
            department: 'nursing'
          },
          {
            accountId: 'acc-002',
            debitAmount: new Decimal(0),
            creditAmount: new Decimal(1000),
            description: 'Credit entry',
            reference: 'REF-001',
            costCenter: 'nursing-001',
            department: 'nursing'
          }
        ]
      };

      const mockJournalEntry = {
        id: 'je-001',
        ...request,
        status: JournalEntryStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockJournalEntryRepository.create.mockReturnValue(mockJournalEntry);
      mockJournalEntryRepository.save.mockResolvedValue(mockJournalEntry);

      const result = await service.createJournalEntry(request, 'user-001');

      expect(mockJournalEntryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...request,
          status: JournalEntryStatus.DRAFT,
          createdBy: 'user-001'
        })
      );
      expect(mockJournalEntryRepository.save).toHaveBeenCalledWith(mockJournalEntry);
      expect(result).toEqual(mockJournalEntry);
    });

    it('should throw error for unbalanced journal entry', async () => {
      const request = {
        entryNumber: 'JE-2024-001',
        entryType: JournalEntryType.MANUAL,
        description: 'Unbalanced journal entry',
        reference: 'REF-001',
        entries: [
          {
            accountId: 'acc-001',
            debitAmount: new Decimal(1000),
            creditAmount: new Decimal(0),
            description: 'Debit entry'
          },
          {
            accountId: 'acc-002',
            debitAmount: new Decimal(0),
            creditAmount: new Decimal(500), // Unbalanced
            description: 'Credit entry'
          }
        ]
      };

      await expect(service.createJournalEntry(request, 'user-001'))
        .rejects.toThrow('Journal entry is not balanced');
    });

    it('should throw error for invalid entry type', async () => {
      const request = {
        entryNumber: 'JE-2024-001',
        entryType: 'invalid-type' as any,
        description: 'Test journal entry',
        reference: 'REF-001',
        entries: []
      };

      await expect(service.createJournalEntry(request, 'user-001'))
        .rejects.toThrow('Invalid entry type');
    });
  });

  describe('getJournalEntryById', () => {
    it('should return journal entry by ID', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        entryNumber: 'JE-2024-001',
        status: JournalEntryStatus.DRAFT
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);

      const result = await service.getJournalEntryById('je-001');

      expect(mockJournalEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'je-001' }
      });
      expect(result).toEqual(mockJournalEntry);
    });

    it('should return null if journal entry not found', async () => {
      mockJournalEntryRepository.findOne.mockResolvedValue(null);

      const result = await service.getJournalEntryById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('searchJournalEntries', () => {
    it('should search journal entries with criteria', async () => {
      const criteria = {
        entryType: JournalEntryType.MANUAL,
        status: JournalEntryStatus.DRAFT,
        careHomeId: 'care-home-001'
      };

      const mockJournalEntries = [
        { id: 'je-001', entryType: JournalEntryType.MANUAL, status: JournalEntryStatus.DRAFT },
        { id: 'je-002', entryType: JournalEntryType.MANUAL, status: JournalEntryStatus.DRAFT }
      ];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockJournalEntries)
      };

      mockJournalEntryRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.searchJournalEntries(criteria);

      expect(mockJournalEntryRepository.createQueryBuilder).toHaveBeenCalledWith('entry');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.entryType = :entryType',
        { entryType: JournalEntryType.MANUAL }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.status = :status',
        { status: JournalEntryStatus.DRAFT }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'entry.careHomeId = :careHomeId',
        { careHomeId: 'care-home-001' }
      );
      expect(result).toEqual(mockJournalEntries);
    });
  });

  describe('postJournalEntry', () => {
    it('should post journal entry successfully', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        status: JournalEntryStatus.DRAFT,
        entries: [
          {
            accountId: 'acc-001',
            debitAmount: new Decimal(1000),
            creditAmount: new Decimal(0)
          },
          {
            accountId: 'acc-002',
            debitAmount: new Decimal(0),
            creditAmount: new Decimal(1000)
          }
        ]
      };

      const mockDebitAccount = {
        id: 'acc-001',
        postDebit: jest.fn()
      };

      const mockCreditAccount = {
        id: 'acc-002',
        postCredit: jest.fn()
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);
      mockLedgerAccountRepository.findOne
        .mockResolvedValueOnce(mockDebitAccount)
        .mockResolvedValueOnce(mockCreditAccount);
      mockJournalEntryRepository.save.mockResolvedValue({
        ...mockJournalEntry,
        status: JournalEntryStatus.POSTED
      });

      const result = await service.postJournalEntry('je-001', 'user-001');

      expect(mockDebitAccount.postDebit).toHaveBeenCalledWith(
        new Decimal(1000),
        expect.any(String),
        'user-001'
      );
      expect(mockCreditAccount.postCredit).toHaveBeenCalledWith(
        new Decimal(1000),
        expect.any(String),
        'user-001'
      );
      expect(result.status).toBe(JournalEntryStatus.POSTED);
    });

    it('should throw error if journal entry not found', async () => {
      mockJournalEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.postJournalEntry('non-existent', 'user-001'))
        .rejects.toThrow('Journal entry not found');
    });

    it('should throw error if journal entry already posted', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        status: JournalEntryStatus.POSTED
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);

      await expect(service.postJournalEntry('je-001', 'user-001'))
        .rejects.toThrow('Journal entry is already posted');
    });
  });

  describe('reverseJournalEntry', () => {
    it('should reverse journal entry successfully', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        status: JournalEntryStatus.POSTED,
        entryNumber: 'JE-2024-001',
        description: 'Original entry',
        entries: [
          {
            accountId: 'acc-001',
            debitAmount: new Decimal(1000),
            creditAmount: new Decimal(0)
          },
          {
            accountId: 'acc-002',
            debitAmount: new Decimal(0),
            creditAmount: new Decimal(1000)
          }
        ]
      };

      const mockDebitAccount = {
        id: 'acc-001',
        postCredit: jest.fn()
      };

      const mockCreditAccount = {
        id: 'acc-002',
        postDebit: jest.fn()
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);
      mockLedgerAccountRepository.findOne
        .mockResolvedValueOnce(mockDebitAccount)
        .mockResolvedValueOnce(mockCreditAccount);
      mockJournalEntryRepository.create.mockReturnValue({
        id: 'je-002',
        entryNumber: 'JE-2024-001-REV',
        status: JournalEntryStatus.DRAFT
      });
      mockJournalEntryRepository.save.mockResolvedValue({
        id: 'je-002',
        status: JournalEntryStatus.POSTED
      });

      const result = await service.reverseJournalEntry('je-001', 'user-001', 'Error in original entry');

      expect(mockDebitAccount.postCredit).toHaveBeenCalledWith(
        new Decimal(1000),
        expect.stringContaining('REVERSAL'),
        'user-001'
      );
      expect(mockCreditAccount.postDebit).toHaveBeenCalledWith(
        new Decimal(1000),
        expect.stringContaining('REVERSAL'),
        'user-001'
      );
      expect(result.status).toBe(JournalEntryStatus.POSTED);
    });

    it('should throw error if journal entry not found', async () => {
      mockJournalEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.reverseJournalEntry('non-existent', 'user-001', 'Reason'))
        .rejects.toThrow('Journal entry not found');
    });

    it('should throw error if journal entry not posted', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        status: JournalEntryStatus.DRAFT
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);

      await expect(service.reverseJournalEntry('je-001', 'user-001', 'Reason'))
        .rejects.toThrow('Only posted journal entries can be reversed');
    });
  });

  describe('deleteJournalEntry', () => {
    it('should delete journal entry successfully', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        status: JournalEntryStatus.DRAFT
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);
      mockJournalEntryRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.deleteJournalEntry('je-001', 'user-001');

      expect(mockJournalEntryRepository.softDelete).toHaveBeenCalledWith('je-001');
    });

    it('should throw error if journal entry not found', async () => {
      mockJournalEntryRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteJournalEntry('non-existent', 'user-001'))
        .rejects.toThrow('Journal entry not found');
    });

    it('should throw error if journal entry is posted', async () => {
      const mockJournalEntry = {
        id: 'je-001',
        status: JournalEntryStatus.POSTED
      };

      mockJournalEntryRepository.findOne.mockResolvedValue(mockJournalEntry);

      await expect(service.deleteJournalEntry('je-001', 'user-001'))
        .rejects.toThrow('Cannot delete posted journal entry');
    });
  });
});
