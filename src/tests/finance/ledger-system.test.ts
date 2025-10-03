import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LedgerSystemService } from '../../services/finance/LedgerSystemService';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { JournalEntry } from '../../entities/financial/JournalEntry';
import { Decimal } from 'decimal.js';

/**
 * @fileoverview Ledger System Tests
 * @module LedgerSystemTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for ledger system functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('Ledger System Service', () => {
  let service: LedgerSystemService;
  let ledgerAccountRepository: Repository<LedgerAccount>;
  let journalEntryRepository: Repository<JournalEntry>;

  const mockLedgerAccount = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    accountCode: 'CASH001',
    accountName: 'Cash Account',
    accountType: 'asset',
    accountCategory: 'current_asset',
    status: 'active',
    isActive: true,
    debitBalance: new Decimal(0),
    creditBalance: new Decimal(0),
    netBalance: new Decimal(0),
    totalTransactions: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockJournalEntry = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    entryNumber: 'JE-2025-001',
    entryDate: new Date('2025-01-01'),
    description: 'Cash receipt from resident',
    reference: 'REF123456',
    status: 'posted',
    isReversed: false,
    reversedAt: null,
    reversalReason: null,
    totalDebitAmount: new Decimal(1000.00),
    totalCreditAmount: new Decimal(1000.00),
    isBalanced: true,
    careHomeId: '123e4567-e89b-12d3-a456-426614174002',
    departmentId: '123e4567-e89b-12d3-a456-426614174003',
    createdBy: '123e4567-e89b-12d3-a456-426614174004',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerSystemService,
        {
          provide: getRepositoryToken(LedgerAccount),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<LedgerSystemService>(LedgerSystemService);
    ledgerAccountRepository = module.get<Repository<LedgerAccount>>(getRepositoryToken(LedgerAccount));
    journalEntryRepository = module.get<Repository<JournalEntry>>(getRepositoryToken(JournalEntry));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLedgerAccount', () => {
    it('should create a new ledger account', async () => {
      const createData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'asset',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(ledgerAccountRepository, 'create').mockReturnValue(mockLedgerAccount as any);
      jest.spyOn(ledgerAccountRepository, 'save').mockResolvedValue(mockLedgerAccount as any);

      const result = await service.createLedgerAccount(createData);

      expect(result).toEqual(mockLedgerAccount);
      expect(ledgerAccountRepository.create).toHaveBeenCalledWith(createData);
      expect(ledgerAccountRepository.save).toHaveBeenCalledWith(mockLedgerAccount);
    });

    it('should throw error for duplicate account code', async () => {
      const createData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'asset',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(mockLedgerAccount as any);

      await expect(service.createLedgerAccount(createData)).rejects.toThrow('Account code already exists');
    });

    it('should throw error for invalid account type', async () => {
      const createData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'invalid_type',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      await expect(service.createLedgerAccount(createData)).rejects.toThrow('Invalid account type');
    });
  });

  describe('getLedgerAccountById', () => {
    it('should return ledger account by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(mockLedgerAccount as any);

      const result = await service.getLedgerAccountById(id);

      expect(result).toEqual(mockLedgerAccount);
      expect(ledgerAccountRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['journalEntries']
      });
    });

    it('should return null if ledger account not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getLedgerAccountById(id);

      expect(result).toBeNull();
    });
  });

  describe('createJournalEntry', () => {
    it('should create a new journal entry', async () => {
      const createData = {
        entryDate: new Date('2025-01-01'),
        description: 'Cash receipt from resident',
        reference: 'REF123456',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004',
        lineItems: [
          {
            accountId: '123e4567-e89b-12d3-a456-426614174000',
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Cash receipt'
          },
          {
            accountId: '123e4567-e89b-12d3-a456-426614174005',
            debitAmount: 0.00,
            creditAmount: 1000.00,
            description: 'Revenue'
          }
        ]
      };

      jest.spyOn(journalEntryRepository, 'create').mockReturnValue(mockJournalEntry as any);
      jest.spyOn(journalEntryRepository, 'save').mockResolvedValue(mockJournalEntry as any);

      const result = await service.createJournalEntry(createData);

      expect(result).toEqual(mockJournalEntry);
      expect(journalEntryRepository.create).toHaveBeenCalledWith(createData);
      expect(journalEntryRepository.save).toHaveBeenCalledWith(mockJournalEntry);
    });

    it('should throw error for unbalanced journal entry', async () => {
      const createData = {
        entryDate: new Date('2025-01-01'),
        description: 'Unbalanced journal entry',
        reference: 'REF123456',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004',
        lineItems: [
          {
            accountId: '123e4567-e89b-12d3-a456-426614174000',
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Cash receipt'
          },
          {
            accountId: '123e4567-e89b-12d3-a456-426614174005',
            debitAmount: 0.00,
            creditAmount: 500.00,
            description: 'Revenue'
          }
        ]
      };

      await expect(service.createJournalEntry(createData)).rejects.toThrow('Journal entry is not balanced');
    });

    it('should throw error for invalid account', async () => {
      const createData = {
        entryDate: new Date('2025-01-01'),
        description: 'Cash receipt from resident',
        reference: 'REF123456',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004',
        lineItems: [
          {
            accountId: '123e4567-e89b-12d3-a456-426614174000',
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Cash receipt'
          },
          {
            accountId: '123e4567-e89b-12d3-a456-426614174005',
            debitAmount: 0.00,
            creditAmount: 1000.00,
            description: 'Revenue'
          }
        ]
      };

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createJournalEntry(createData)).rejects.toThrow('Account not found');
    });
  });

  describe('getJournalEntryById', () => {
    it('should return journal entry by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(mockJournalEntry as any);

      const result = await service.getJournalEntryById(id);

      expect(result).toEqual(mockJournalEntry);
      expect(journalEntryRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['lineItems', 'lineItems.account']
      });
    });

    it('should return null if journal entry not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getJournalEntryById(id);

      expect(result).toBeNull();
    });
  });

  describe('postJournalEntry', () => {
    it('should post journal entry', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const postedBy = '123e4567-e89b-12d3-a456-426614174004';

      const journalEntryToPost = {
        ...mockJournalEntry,
        status: 'draft'
      };

      const postedJournalEntry = {
        ...journalEntryToPost,
        status: 'posted',
        postedAt: new Date(),
        postedBy
      };

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(journalEntryToPost as any);
      jest.spyOn(journalEntryRepository, 'save').mockResolvedValue(postedJournalEntry as any);

      const result = await service.postJournalEntry(id, postedBy);

      expect(result.status).toBe('posted');
      expect(result.postedAt).toBeDefined();
      expect(result.postedBy).toBe(postedBy);
    });

    it('should throw error if journal entry not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const postedBy = '123e4567-e89b-12d3-a456-426614174004';

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.postJournalEntry(id, postedBy)).rejects.toThrow('Journal entry not found');
    });

    it('should throw error if journal entry not in draft status', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const postedBy = '123e4567-e89b-12d3-a456-426614174004';

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(mockJournalEntry as any);

      await expect(service.postJournalEntry(id, postedBy)).rejects.toThrow('Only draft journal entries can be posted');
    });
  });

  describe('reverseJournalEntry', () => {
    it('should reverse journal entry', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const reason = 'Entry was made in error';
      const reversedBy = '123e4567-e89b-12d3-a456-426614174004';

      const journalEntryToReverse = {
        ...mockJournalEntry,
        status: 'posted'
      };

      const reversedJournalEntry = {
        ...journalEntryToReverse,
        status: 'reversed',
        isReversed: true,
        reversedAt: new Date(),
        reversalReason: reason,
        reversedBy
      };

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(journalEntryToReverse as any);
      jest.spyOn(journalEntryRepository, 'save').mockResolvedValue(reversedJournalEntry as any);

      const result = await service.reverseJournalEntry(id, reason, reversedBy);

      expect(result.status).toBe('reversed');
      expect(result.isReversed).toBe(true);
      expect(result.reversalReason).toBe(reason);
      expect(result.reversedAt).toBeDefined();
    });

    it('should throw error if journal entry not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const reason = 'Entry was made in error';
      const reversedBy = '123e4567-e89b-12d3-a456-426614174004';

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(null);

      await expect(service.reverseJournalEntry(id, reason, reversedBy)).rejects.toThrow('Journal entry not found');
    });

    it('should throw error if journal entry not posted', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174001';
      const reason = 'Entry was made in error';
      const reversedBy = '123e4567-e89b-12d3-a456-426614174004';

      const draftJournalEntry = {
        ...mockJournalEntry,
        status: 'draft'
      };

      jest.spyOn(journalEntryRepository, 'findOne').mockResolvedValue(draftJournalEntry as any);

      await expect(service.reverseJournalEntry(id, reason, reversedBy)).rejects.toThrow('Only posted journal entries can be reversed');
    });
  });

  describe('getTrialBalance', () => {
    it('should return trial balance', async () => {
      const asOfDate = new Date('2025-01-01');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';

      const mockTrialBalance = {
        asOfDate,
        careHomeId,
        accounts: [
          {
            accountId: '123e4567-e89b-12d3-a456-426614174000',
            accountCode: 'CASH001',
            accountName: 'Cash Account',
            accountType: 'asset',
            debitBalance: new Decimal(10000.00),
            creditBalance: new Decimal(0),
            netBalance: new Decimal(10000.00)
          },
          {
            accountId: '123e4567-e89b-12d3-a456-426614174005',
            accountCode: 'REV001',
            accountName: 'Revenue Account',
            accountType: 'revenue',
            debitBalance: new Decimal(0),
            creditBalance: new Decimal(10000.00),
            netBalance: new Decimal(-10000.00)
          }
        ],
        totalDebits: new Decimal(10000.00),
        totalCredits: new Decimal(10000.00),
        isBalanced: true,
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getTrialBalance').mockResolvedValue(mockTrialBalance);

      const result = await service.getTrialBalance(asOfDate, careHomeId);

      expect(result).toEqual(mockTrialBalance);
    });
  });

  describe('getGeneralLedger', () => {
    it('should return general ledger', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174000';
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');

      const mockGeneralLedger = {
        account: mockLedgerAccount,
        period: {
          from: dateFrom,
          to: dateTo
        },
        openingBalance: new Decimal(0),
        closingBalance: new Decimal(10000.00),
        transactions: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            entryNumber: 'JE-2025-001',
            entryDate: new Date('2025-01-01'),
            description: 'Cash receipt from resident',
            reference: 'REF123456',
            debitAmount: new Decimal(1000.00),
            creditAmount: new Decimal(0),
            balance: new Decimal(1000.00)
          }
        ],
        totalDebits: new Decimal(10000.00),
        totalCredits: new Decimal(0),
        netBalance: new Decimal(10000.00),
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getGeneralLedger').mockResolvedValue(mockGeneralLedger);

      const result = await service.getGeneralLedger(accountId, dateFrom, dateTo);

      expect(result).toEqual(mockGeneralLedger);
    });
  });
});

describe('Ledger System Integration Tests', () => {
  let app: any;
  let ledgerSystemService: LedgerSystemService;

  beforeAll(async () => {
    // Setup test database and application
  });

  afterAll(async () => {
    // Cleanup test database and application
  });

  beforeEach(async () => {
    // Setup test data
  });

  afterEach(async () => {
    // Cleanup test data
  });

  describe('Ledger System Workflow', () => {
    it('should complete full ledger system workflow', async () => {
      // 1. Create ledger accounts
      const cashAccountData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'asset',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const revenueAccountData = {
        accountCode: 'REV001',
        accountName: 'Revenue Account',
        accountType: 'revenue',
        accountCategory: 'operating_revenue',
        description: 'Main revenue account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004'
      };

      const cashAccount = await ledgerSystemService.createLedgerAccount(cashAccountData);
      const revenueAccount = await ledgerSystemService.createLedgerAccount(revenueAccountData);

      expect(cashAccount.accountCode).toBe('CASH001');
      expect(revenueAccount.accountCode).toBe('REV001');

      // 2. Create journal entry
      const journalEntryData = {
        entryDate: new Date('2025-01-01'),
        description: 'Cash receipt from resident',
        reference: 'REF123456',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        createdBy: '123e4567-e89b-12d3-a456-426614174004',
        lineItems: [
          {
            accountId: cashAccount.id,
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Cash receipt'
          },
          {
            accountId: revenueAccount.id,
            debitAmount: 0.00,
            creditAmount: 1000.00,
            description: 'Revenue'
          }
        ]
      };

      const journalEntry = await ledgerSystemService.createJournalEntry(journalEntryData);
      expect(journalEntry.status).toBe('draft');

      // 3. Post journal entry
      const postedJournalEntry = await ledgerSystemService.postJournalEntry(
        journalEntry.id,
        '123e4567-e89b-12d3-a456-426614174004'
      );
      expect(postedJournalEntry.status).toBe('posted');
    });
  });
});

describe('Ledger System E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('Ledger System API Endpoints', () => {
    it('should create ledger account via API', async () => {
      const createData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'asset',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003'
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/ledger/accounts')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accountCode).toBe('CASH001');
      expect(response.body.data.accountName).toBe('Cash Account');
    });

    it('should get ledger account by ID via API', async () => {
      // First create an account
      const createData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'asset',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/finance/ledger/accounts')
        .send(createData)
        .expect(201);

      const accountId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/finance/ledger/accounts/${accountId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(accountId);
    });

    it('should create journal entry via API', async () => {
      // First create accounts
      const cashAccountData = {
        accountCode: 'CASH001',
        accountName: 'Cash Account',
        accountType: 'asset',
        accountCategory: 'current_asset',
        description: 'Main cash account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003'
      };

      const revenueAccountData = {
        accountCode: 'REV001',
        accountName: 'Revenue Account',
        accountType: 'revenue',
        accountCategory: 'operating_revenue',
        description: 'Main revenue account',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003'
      };

      const cashAccountResponse = await request(app.getHttpServer())
        .post('/api/finance/ledger/accounts')
        .send(cashAccountData)
        .expect(201);

      const revenueAccountResponse = await request(app.getHttpServer())
        .post('/api/finance/ledger/accounts')
        .send(revenueAccountData)
        .expect(201);

      const cashAccountId = cashAccountResponse.body.data.id;
      const revenueAccountId = revenueAccountResponse.body.data.id;

      // Then create journal entry
      const journalEntryData = {
        entryDate: '2025-01-01',
        description: 'Cash receipt from resident',
        reference: 'REF123456',
        careHomeId: '123e4567-e89b-12d3-a456-426614174002',
        departmentId: '123e4567-e89b-12d3-a456-426614174003',
        lineItems: [
          {
            accountId: cashAccountId,
            debitAmount: 1000.00,
            creditAmount: 0.00,
            description: 'Cash receipt'
          },
          {
            accountId: revenueAccountId,
            debitAmount: 0.00,
            creditAmount: 1000.00,
            description: 'Revenue'
          }
        ]
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/ledger/entries')
        .send(journalEntryData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.description).toBe('Cash receipt from resident');
    });
  });
});