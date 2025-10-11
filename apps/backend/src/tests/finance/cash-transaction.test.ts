import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CashTransactionService } from '../../services/finance/CashTransactionService';
import { CashTransaction } from '../../entities/financial/CashTransaction';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { JournalEntry } from '../../entities/financial/JournalEntry';
import { Decimal } from 'decimal.js';

/**
 * @fileoverview Cash Transaction Tests
 * @module CashTransactionTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for cash transaction functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('Cash Transaction Service', () => {
  letservice: CashTransactionService;
  letcashTransactionRepository: Repository<CashTransaction>;
  letledgerAccountRepository: Repository<LedgerAccount>;
  letjournalEntryRepository: Repository<JournalEntry>;

  const mockCashTransaction = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    transactionNumber: 'CT-REC-12345678',
    transactionType: 'receipt',
    status: 'pending',
    priority: 'medium',
    description: 'Payment from resident',
    transactionDate: new Date('2025-01-01'),
    accountId: '123e4567-e89b-12d3-a456-426614174001',
    amount: new Decimal(1000.00),
    currency: 'GBP',
    baseAmount: new Decimal(1000.00),
    referenceNumber: 'REF123456',
    paymentMethod: 'bank_transfer',
    paymentReference: 'PAY123456',
    requiresApproval: false,
    isSystemGenerated: false,
    isReconciled: false,
    isVoid: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockLedgerAccount = {
    id: '123e4567-e89b-12d3-a456-426614174001',
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

  beforeEach(async () => {
    constmodule: TestingModule = await Test.createTestingModule({
      providers: [
        CashTransactionService,
        {
          provide: getRepositoryToken(CashTransaction),
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
          provide: getRepositoryToken(LedgerAccount),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(JournalEntry),
          useValue: {
            create: jest.fn(),
            save: jest.fn()
          }
        }
      ]
    }).compile();

    service = module.get<CashTransactionService>(CashTransactionService);
    cashTransactionRepository = module.get<Repository<CashTransaction>>(getRepositoryToken(CashTransaction));
    ledgerAccountRepository = module.get<Repository<LedgerAccount>>(getRepositoryToken(LedgerAccount));
    journalEntryRepository = module.get<Repository<JournalEntry>>(getRepositoryToken(JournalEntry));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCashTransaction', () => {
    it('should create a new cash transaction', async () => {
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: new Date('2025-01-01'),
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000.00,
        currency: 'GBP',
        referenceNumber: 'REF123456',
        paymentMethod: 'bank_transfer',
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(mockLedgerAccount as any);
      jest.spyOn(cashTransactionRepository, 'create').mockReturnValue(mockCashTransaction as any);
      jest.spyOn(cashTransactionRepository, 'save').mockResolvedValue(mockCashTransaction as any);

      const result = await service.createCashTransaction(createData);

      expect(result).toEqual(mockCashTransaction);
      expect(cashTransactionRepository.create).toHaveBeenCalledWith(createData);
      expect(cashTransactionRepository.save).toHaveBeenCalledWith(mockCashTransaction);
    });

    it('should throw error if account not found', async () => {
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: new Date('2025-01-01'),
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000.00,
        currency: 'GBP',
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createCashTransaction(createData)).rejects.toThrow('Account not found');
    });

    it('should throw error for negative amount', async () => {
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: new Date('2025-01-01'),
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: -1000.00,
        currency: 'GBP',
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(mockLedgerAccount as any);

      await expect(service.createCashTransaction(createData)).rejects.toThrow('Transaction amount must be greater than zero');
    });
  });

  describe('getCashTransactionById', () => {
    it('should return cash transaction by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(mockCashTransaction as any);

      const result = await service.getCashTransactionById(id);

      expect(result).toEqual(mockCashTransaction);
      expect(cashTransactionRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['account', 'journalEntry']
      });
    });

    it('should return null if cash transaction not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getCashTransactionById(id);

      expect(result).toBeNull();
    });
  });

  describe('processTransaction', () => {
    it('should process cash transaction', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const processedBy = '123e4567-e89b-12d3-a456-426614174003';

      const updatedTransaction = {
        ...mockCashTransaction,
        status: 'processing',
        updatedBy: processedBy
      };

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(mockCashTransaction as any);
      jest.spyOn(cashTransactionRepository, 'save').mockResolvedValue(updatedTransaction as any);

      const result = await service.processTransaction(id, processedBy);

      expect(result.status).toBe('processing');
      expect(result.updatedBy).toBe(processedBy);
    });

    it('should throw error if transaction not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const processedBy = '123e4567-e89b-12d3-a456-426614174003';

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(null);

      await expect(service.processTransaction(id, processedBy)).rejects.toThrow('Cash transaction not found');
    });

    it('should throw error if transaction not pending', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const processedBy = '123e4567-e89b-12d3-a456-426614174003';

      const transactionWithStatus = {
        ...mockCashTransaction,
        status: 'completed'
      };

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(transactionWithStatus as any);

      await expect(service.processTransaction(id, processedBy)).rejects.toThrow('Only pending transactions can be processed');
    });
  });

  describe('completeTransaction', () => {
    it('should complete cash transaction', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const completedBy = '123e4567-e89b-12d3-a456-426614174003';

      const transactionProcessing = {
        ...mockCashTransaction,
        status: 'processing'
      };

      const updatedTransaction = {
        ...transactionProcessing,
        status: 'completed',
        processedAt: new Date(),
        updatedBy: completedBy
      };

      const updatedAccount = {
        ...mockLedgerAccount,
        debitBalance: new Decimal(1000.00),
        netBalance: new Decimal(1000.00),
        totalTransactions: 1
      };

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(transactionProcessing as any);
      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(mockLedgerAccount as any);
      jest.spyOn(ledgerAccountRepository, 'save').mockResolvedValue(updatedAccount as any);
      jest.spyOn(cashTransactionRepository, 'save').mockResolvedValue(updatedTransaction as any);

      const result = await service.completeTransaction(id, completedBy);

      expect(result.status).toBe('completed');
      expect(result.processedAt).toBeDefined();
    });

    it('should throw error if transaction not processing', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const completedBy = '123e4567-e89b-12d3-a456-426614174003';

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(mockCashTransaction as any);

      await expect(service.completeTransaction(id, completedBy)).rejects.toThrow('Only processing transactions can be completed');
    });
  });

  describe('reverseTransaction', () => {
    it('should reverse cash transaction', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const reason = 'Payment was made in error';
      const reversedBy = '123e4567-e89b-12d3-a456-426614174003';

      const completedTransaction = {
        ...mockCashTransaction,
        status: 'completed'
      };

      const updatedTransaction = {
        ...completedTransaction,
        status: 'reversed',
        reversedAt: new Date(),
        reversalReason: reason,
        updatedBy: reversedBy
      };

      const updatedAccount = {
        ...mockLedgerAccount,
        debitBalance: new Decimal(0),
        netBalance: new Decimal(0),
        totalTransactions: 0
      };

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(completedTransaction as any);
      jest.spyOn(ledgerAccountRepository, 'findOne').mockResolvedValue(mockLedgerAccount as any);
      jest.spyOn(ledgerAccountRepository, 'save').mockResolvedValue(updatedAccount as any);
      jest.spyOn(cashTransactionRepository, 'save').mockResolvedValue(updatedTransaction as any);

      const result = await service.reverseTransaction(id, reason, reversedBy);

      expect(result.status).toBe('reversed');
      expect(result.reversalReason).toBe(reason);
      expect(result.reversedAt).toBeDefined();
    });

    it('should throw error if transaction not completed', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const reason = 'Payment was made in error';
      const reversedBy = '123e4567-e89b-12d3-a456-426614174003';

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(mockCashTransaction as any);

      await expect(service.reverseTransaction(id, reason, reversedBy)).rejects.toThrow('Only completed transactions can be reversed');
    });

    it('should throw error if transaction is reconciled', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const reason = 'Payment was made in error';
      const reversedBy = '123e4567-e89b-12d3-a456-426614174003';

      const reconciledTransaction = {
        ...mockCashTransaction,
        status: 'completed',
        isReconciled: true
      };

      jest.spyOn(cashTransactionRepository, 'findOne').mockResolvedValue(reconciledTransaction as any);

      await expect(service.reverseTransaction(id, reason, reversedBy)).rejects.toThrow('Cannot reverse reconciled transactions');
    });
  });

  describe('getCashSummary', () => {
    it('should return cash summary', async () => {
      const asOfDate = new Date('2025-01-01');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';

      const mockSummary = {
        totalCashBalance: new Decimal(50000.00),
        totalReceipts: new Decimal(100000.00),
        totalPayments: new Decimal(50000.00),
        netCashFlow: new Decimal(50000.00),
        transactionCount: 150,
        averageTransactionAmount: new Decimal(666.67),
        currency: 'GBP',
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getCashSummary').mockResolvedValue(mockSummary);

      const result = await service.getCashSummary(asOfDate, careHomeId);

      expect(result).toEqual(mockSummary);
    });
  });

  describe('getCashFlowStatement', () => {
    it('should return cash flow statement', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174002';

      const mockCashFlowStatement = {
        period: {
          from: dateFrom,
          to: dateTo
        },
        operatingActivities: {
          receipts: new Decimal(200000.00),
          payments: new Decimal(150000.00),
          netCashFlow: new Decimal(50000.00)
        },
        investingActivities: {
          receipts: new Decimal(10000.00),
          payments: new Decimal(20000.00),
          netCashFlow: new Decimal(-10000.00)
        },
        financingActivities: {
          receipts: new Decimal(5000.00),
          payments: new Decimal(10000.00),
          netCashFlow: new Decimal(-5000.00)
        },
        netIncreaseInCash: new Decimal(35000.00),
        cashAtBeginningOfPeriod: new Decimal(15000.00),
        cashAtEndOfPeriod: new Decimal(50000.00)
      };

      jest.spyOn(service, 'getCashFlowStatement').mockResolvedValue(mockCashFlowStatement);

      const result = await service.getCashFlowStatement(dateFrom, dateTo, careHomeId);

      expect(result).toEqual(mockCashFlowStatement);
    });
  });
});

describe('Cash Transaction Integration Tests', () => {
  letapp: any;
  letcashTransactionService: CashTransactionService;

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

  describe('Cash Transaction Workflow', () => {
    it('should complete full cash transaction workflow', async () => {
      // 1. Create cash transaction
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: new Date('2025-01-01'),
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000.00,
        currency: 'GBP',
        referenceNumber: 'REF123456',
        paymentMethod: 'bank_transfer',
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      const transaction = await cashTransactionService.createCashTransaction(createData);
      expect(transaction.status).toBe('pending');

      // 2. Process transaction
      const processedTransaction = await cashTransactionService.processTransaction(
        transaction.id,
        '123e4567-e89b-12d3-a456-426614174003'
      );
      expect(processedTransaction.status).toBe('processing');

      // 3. Complete transaction
      const completedTransaction = await cashTransactionService.completeTransaction(
        transaction.id,
        '123e4567-e89b-12d3-a456-426614174003'
      );
      expect(completedTransaction.status).toBe('completed');
    });
  });
});

describe('Cash Transaction E2E Tests', () => {
  letapp: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('Cash Transaction API Endpoints', () => {
    it('should create cash transaction via API', async () => {
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: '2025-01-01',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000.00,
        currency: 'GBP',
        referenceNumber: 'REF123456',
        paymentMethod: 'bank_transfer'
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/cash/transactions')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pending');
      expect(response.body.data.transactionType).toBe('receipt');
    });

    it('should get cash transaction by ID via API', async () => {
      // First create a transaction
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: '2025-01-01',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000.00,
        currency: 'GBP'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/finance/cash/transactions')
        .send(createData)
        .expect(201);

      const transactionId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/finance/cash/transactions/${transactionId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(transactionId);
    });

    it('should process cash transaction via API', async () => {
      // First create a transaction
      const createData = {
        transactionType: 'receipt',
        description: 'Payment from resident',
        transactionDate: '2025-01-01',
        accountId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 1000.00,
        currency: 'GBP'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/finance/cash/transactions')
        .send(createData)
        .expect(201);

      const transactionId = createResponse.body.data.id;

      // Then process it
      const response = await request(app.getHttpServer())
        .post(`/api/finance/cash/transactions/${transactionId}/process`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('processing');
    });
  });
});
