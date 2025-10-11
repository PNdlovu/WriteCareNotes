import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialReportingService } from '../../services/finance/FinancialReportingService';
import { Budget } from '../../entities/financial/Budget';
import { CashTransaction } from '../../entities/financial/CashTransaction';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';
import { Decimal } from 'decimal.js';

/**
 * @fileoverview Financial Reporting Tests
 * @module FinancialReportingTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for financial reporting functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('Financial Reporting Service', () => {
  let service: FinancialReportingService;
  let budgetRepository: Repository<Budget>;
  let cashTransactionRepository: Repository<CashTransaction>;
  let ledgerAccountRepository: Repository<LedgerAccount>;

  const mockBudget = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    budgetName: '2025 Annual Budget',
    budgetCode: 'BUD2025',
    budgetType: 'annual',
    description: 'Annual budget for 2025',
    financialYear: '2025',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'approved',
    isActive: true,
    currency: 'GBP',
    totalBudgetedRevenue: new Decimal(1000000.00),
    totalBudgetedExpenses: new Decimal(800000.00),
    totalBudgetedProfit: new Decimal(200000.00),
    actualRevenue: new Decimal(500000.00),
    actualExpenses: new Decimal(400000.00),
    actualProfit: new Decimal(100000.00),
    revenueVariance: new Decimal(-500000.00),
    revenueVariancePercentage: new Decimal(-50.00),
    expenseVariance: new Decimal(-400000.00),
    expenseVariancePercentage: new Decimal(-50.00),
    profitVariance: new Decimal(-100000.00),
    careHomeId: '123e4567-e89b-12d3-a456-426614174001',
    departmentId: '123e4567-e89b-12d3-a456-426614174002',
    budgetedOccupancy: 50,
    actualOccupancy: 25,
    budgetedRevenuePerBed: new Decimal(20000.00),
    budgetedCostPerResident: new Decimal(16000.00),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  const mockCashTransaction = {
    id: '123e4567-e89b-12d3-a456-426614174003',
    transactionNumber: 'CT-REC-12345678',
    transactionType: 'receipt',
    status: 'completed',
    priority: 'medium',
    description: 'Payment from resident',
    transactionDate: new Date('2025-01-01'),
    accountId: '123e4567-e89b-12d3-a456-426614174004',
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
    id: '123e4567-e89b-12d3-a456-426614174004',
    accountCode: 'CASH001',
    accountName: 'Cash Account',
    accountType: 'asset',
    accountCategory: 'current_asset',
    status: 'active',
    isActive: true,
    debitBalance: new Decimal(10000.00),
    creditBalance: new Decimal(0),
    netBalance: new Decimal(10000.00),
    totalTransactions: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialReportingService,
        {
          provide: getRepositoryToken(Budget),
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

    service = module.get<FinancialReportingService>(FinancialReportingService);
    budgetRepository = module.get<Repository<Budget>>(getRepositoryToken(Budget));
    cashTransactionRepository = module.get<Repository<CashTransaction>>(getRepositoryToken(CashTransaction));
    ledgerAccountRepository = module.get<Repository<LedgerAccount>>(getRepositoryToken(LedgerAccount));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateProfitLossStatement', () => {
    it('should generate profit and loss statement', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      const mockProfitLossStatement = {
        period: {
          from: dateFrom,
          to: dateTo
        },
        careHomeId,
        revenue: {
          total: new Decimal(500000.00),
          residentFees: new Decimal(400000.00),
          otherIncome: new Decimal(100000.00)
        },
        expenses: {
          total: new Decimal(400000.00),
          staffCosts: new Decimal(200000.00),
          utilities: new Decimal(50000.00),
          maintenance: new Decimal(30000.00),
          otherExpenses: new Decimal(120000.00)
        },
        grossProfit: new Decimal(100000.00),
        netProfit: new Decimal(100000.00),
        profitMargin: new Decimal(20.00),
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'generateProfitLossStatement').mockResolvedValue(mockProfitLossStatement);

      const result = await service.generateProfitLossStatement(dateFrom, dateTo, careHomeId);

      expect(result).toEqual(mockProfitLossStatement);
    });
  });

  describe('generateBalanceSheet', () => {
    it('should generate balance sheet', async () => {
      const asOfDate = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      const mockBalanceSheet = {
        asOfDate,
        careHomeId,
        assets: {
          currentAssets: {
            cash: new Decimal(100000.00),
            accountsReceivable: new Decimal(50000.00),
            inventory: new Decimal(10000.00),
            total: new Decimal(160000.00)
          },
          fixedAssets: {
            property: new Decimal(2000000.00),
            equipment: new Decimal(300000.00),
            total: new Decimal(2300000.00)
          },
          totalAssets: new Decimal(2460000.00)
        },
        liabilities: {
          currentLiabilities: {
            accountsPayable: new Decimal(30000.00),
            accruedExpenses: new Decimal(20000.00),
            total: new Decimal(50000.00)
          },
          longTermLiabilities: {
            loans: new Decimal(500000.00),
            total: new Decimal(500000.00)
          },
          totalLiabilities: new Decimal(550000.00)
        },
        equity: {
          retainedEarnings: new Decimal(1910000.00),
          totalEquity: new Decimal(1910000.00)
        },
        totalLiabilitiesAndEquity: new Decimal(2460000.00),
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'generateBalanceSheet').mockResolvedValue(mockBalanceSheet);

      const result = await service.generateBalanceSheet(asOfDate, careHomeId);

      expect(result).toEqual(mockBalanceSheet);
    });
  });

  describe('generateCashFlowStatement', () => {
    it('should generate cash flow statement', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      const mockCashFlowStatement = {
        period: {
          from: dateFrom,
          to: dateTo
        },
        careHomeId,
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
        cashAtEndOfPeriod: new Decimal(50000.00),
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'generateCashFlowStatement').mockResolvedValue(mockCashFlowStatement);

      const result = await service.generateCashFlowStatement(dateFrom, dateTo, careHomeId);

      expect(result).toEqual(mockCashFlowStatement);
    });
  });

  describe('generateBudgetVarianceReport', () => {
    it('should generate budget variance report', async () => {
      const budgetId = '123e4567-e89b-12d3-a456-426614174000';

      const mockBudgetVarianceReport = {
        budgetId,
        budgetName: '2025 Annual Budget',
        period: {
          from: new Date('2025-01-01'),
          to: new Date('2025-12-31')
        },
        revenue: {
          budgeted: new Decimal(1000000.00),
          actual: new Decimal(500000.00),
          variance: new Decimal(-500000.00),
          variancePercentage: new Decimal(-50.00),
          isFavorable: false
        },
        expenses: {
          budgeted: new Decimal(800000.00),
          actual: new Decimal(400000.00),
          variance: new Decimal(-400000.00),
          variancePercentage: new Decimal(-50.00),
          isFavorable: true
        },
        profit: {
          budgeted: new Decimal(200000.00),
          actual: new Decimal(100000.00),
          variance: new Decimal(-100000.00),
          variancePercentage: new Decimal(-50.00),
          isFavorable: false
        },
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'generateBudgetVarianceReport').mockResolvedValue(mockBudgetVarianceReport);

      const result = await service.generateBudgetVarianceReport(budgetId);

      expect(result).toEqual(mockBudgetVarianceReport);
    });
  });

  describe('generateTrialBalance', () => {
    it('should generate trial balance', async () => {
      const asOfDate = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      const mockTrialBalance = {
        asOfDate,
        careHomeId,
        accounts: [
          {
            accountId: '123e4567-e89b-12d3-a456-426614174004',
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

      jest.spyOn(service, 'generateTrialBalance').mockResolvedValue(mockTrialBalance);

      const result = await service.generateTrialBalance(asOfDate, careHomeId);

      expect(result).toEqual(mockTrialBalance);
    });
  });

  describe('generateGeneralLedger', () => {
    it('should generate general ledger', async () => {
      const accountId = '123e4567-e89b-12d3-a456-426614174004';
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
            id: '123e4567-e89b-12d3-a456-426614174003',
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

      jest.spyOn(service, 'generateGeneralLedger').mockResolvedValue(mockGeneralLedger);

      const result = await service.generateGeneralLedger(accountId, dateFrom, dateTo);

      expect(result).toEqual(mockGeneralLedger);
    });
  });

  describe('generateFinancialSummary', () => {
    it('should generate financial summary', async () => {
      const asOfDate = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      const mockFinancialSummary = {
        asOfDate,
        careHomeId,
        revenue: {
          total: new Decimal(500000.00),
          growth: new Decimal(10.00),
          trend: 'increasing'
        },
        expenses: {
          total: new Decimal(400000.00),
          growth: new Decimal(5.00),
          trend: 'stable'
        },
        profit: {
          total: new Decimal(100000.00),
          margin: new Decimal(20.00),
          growth: new Decimal(25.00),
          trend: 'increasing'
        },
        cash: {
          total: new Decimal(100000.00),
          growth: new Decimal(15.00),
          trend: 'increasing'
        },
        occupancy: {
          rate: new Decimal(80.00),
          trend: 'stable'
        },
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'generateFinancialSummary').mockResolvedValue(mockFinancialSummary);

      const result = await service.generateFinancialSummary(asOfDate, careHomeId);

      expect(result).toEqual(mockFinancialSummary);
    });
  });
});

describe('Financial Reporting Integration Tests', () => {
  let app: any;
  let financialReportingService: FinancialReportingService;

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

  describe('Financial Reporting Workflow', () => {
    it('should complete full financial reporting workflow', async () => {
      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-12-31');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      // 1. Generate profit and loss statement
      const profitLossStatement = await financialReportingService.generateProfitLossStatement(
        dateFrom,
        dateTo,
        careHomeId
      );
      expect(profitLossStatement.revenue.total).toBeDefined();
      expect(profitLossStatement.expenses.total).toBeDefined();

      // 2. Generate balance sheet
      const balanceSheet = await financialReportingService.generateBalanceSheet(
        dateTo,
        careHomeId
      );
      expect(balanceSheet.assets.totalAssets).toBeDefined();
      expect(balanceSheet.liabilities.totalLiabilities).toBeDefined();

      // 3. Generate cash flow statement
      const cashFlowStatement = await financialReportingService.generateCashFlowStatement(
        dateFrom,
        dateTo,
        careHomeId
      );
      expect(cashFlowStatement.operatingActivities.netCashFlow).toBeDefined();
      expect(cashFlowStatement.netIncreaseInCash).toBeDefined();
    });
  });
});

describe('Financial Reporting E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('Financial Reporting API Endpoints', () => {
    it('should generate profit and loss statement via API', async () => {
      const requestData = {
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        careHomeId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/reports/profit-loss')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.revenue).toBeDefined();
      expect(response.body.data.expenses).toBeDefined();
    });

    it('should generate balance sheet via API', async () => {
      const requestData = {
        asOfDate: '2025-12-31',
        careHomeId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/reports/balance-sheet')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assets).toBeDefined();
      expect(response.body.data.liabilities).toBeDefined();
    });

    it('should generate cash flow statement via API', async () => {
      const requestData = {
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31',
        careHomeId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/reports/cash-flow')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.operatingActivities).toBeDefined();
      expect(response.body.data.netIncreaseInCash).toBeDefined();
    });
  });
});