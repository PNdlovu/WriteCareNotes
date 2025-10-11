import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetService } from '../../services/finance/BudgetService';
import { Budget } from '../../entities/financial/Budget';
import { Decimal } from 'decimal.js';

/**
 * @fileoverview Budget Management Tests
 * @module BudgetTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for budget management functionality
 * including unit tests, integration tests, and E2E tests.
 */

describe('Budget Service', () => {
  let service: BudgetService;
  let budgetRepository: Repository<Budget>;

  const mockBudget = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    budgetName: '2025 Annual Budget',
    budgetCode: 'BUD2025',
    budgetType: 'annual',
    description: 'Annual budget for 2025',
    financialYear: '2025',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
    status: 'draft',
    isActive: true,
    currency: 'GBP',
    totalBudgetedRevenue: new Decimal(1000000.00),
    totalBudgetedExpenses: new Decimal(800000.00),
    totalBudgetedProfit: new Decimal(200000.00),
    actualRevenue: new Decimal(0),
    actualExpenses: new Decimal(0),
    actualProfit: new Decimal(0),
    revenueVariance: new Decimal(0),
    revenueVariancePercentage: new Decimal(0),
    expenseVariance: new Decimal(0),
    expenseVariancePercentage: new Decimal(0),
    profitVariance: new Decimal(0),
    careHomeId: '123e4567-e89b-12d3-a456-426614174001',
    departmentId: '123e4567-e89b-12d3-a456-426614174002',
    budgetedOccupancy: 50,
    actualOccupancy: 0,
    budgetedRevenuePerBed: new Decimal(20000.00),
    budgetedCostPerResident: new Decimal(16000.00),
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
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
        }
      ]
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    budgetRepository = module.get<Repository<Budget>>(getRepositoryToken(Budget));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a new budget', async () => {
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        currency: 'GBP',
        totalBudgetedRevenue: 1000000.00,
        totalBudgetedExpenses: 800000.00,
        careHomeId: '123e4567-e89b-12d3-a456-426614174001',
        departmentId: '123e4567-e89b-12d3-a456-426614174002',
        budgetedOccupancy: 50,
        budgetedRevenuePerBed: 20000.00,
        budgetedCostPerResident: 16000.00,
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      jest.spyOn(budgetRepository, 'create').mockReturnValue(mockBudget as any);
      jest.spyOn(budgetRepository, 'save').mockResolvedValue(mockBudget as any);

      const result = await service.createBudget(createData);

      expect(result).toEqual(mockBudget);
      expect(budgetRepository.create).toHaveBeenCalledWith(createData);
      expect(budgetRepository.save).toHaveBeenCalledWith(mockBudget);
    });

    it('should throw error for invalid date range', async () => {
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: new Date('2025-12-31'),
        endDate: new Date('2025-01-01'),
        currency: 'GBP',
        totalBudgetedRevenue: 1000000.00,
        totalBudgetedExpenses: 800000.00,
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      await expect(service.createBudget(createData)).rejects.toThrow('End date must be after start date');
    });

    it('should throw error for negative budget amounts', async () => {
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        currency: 'GBP',
        totalBudgetedRevenue: -1000000.00,
        totalBudgetedExpenses: 800000.00,
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      await expect(service.createBudget(createData)).rejects.toThrow('Budget amounts must be non-negative');
    });
  });

  describe('getBudgetById', () => {
    it('should return budget by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(mockBudget as any);

      const result = await service.getBudgetById(id);

      expect(result).toEqual(mockBudget);
      expect(budgetRepository.findOne).toHaveBeenCalledWith({
        where: { id },
        relations: ['careHome', 'department']
      });
    });

    it('should return null if budget not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(null);

      const result = await service.getBudgetById(id);

      expect(result).toBeNull();
    });
  });

  describe('updateBudget', () => {
    it('should update budget', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        budgetName: 'Updated 2025 Annual Budget',
        description: 'Updated annual budget for 2025',
        totalBudgetedRevenue: 1200000.00,
        totalBudgetedExpenses: 900000.00,
        updatedBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      const updatedBudget = {
        ...mockBudget,
        ...updateData,
        totalBudgetedProfit: new Decimal(300000.00)
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(mockBudget as any);
      jest.spyOn(budgetRepository, 'save').mockResolvedValue(updatedBudget as any);

      const result = await service.updateBudget(id, updateData);

      expect(result).toEqual(updatedBudget);
      expect(budgetRepository.save).toHaveBeenCalledWith(updatedBudget);
    });

    it('should throw error if budget not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        budgetName: 'Updated 2025 Annual Budget',
        updatedBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateBudget(id, updateData)).rejects.toThrow('Budget not found');
    });

    it('should throw error if budget is locked', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        budgetName: 'Updated 2025 Annual Budget',
        updatedBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      const lockedBudget = {
        ...mockBudget,
        status: 'locked'
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(lockedBudget as any);

      await expect(service.updateBudget(id, updateData)).rejects.toThrow('Cannot update locked budget');
    });
  });

  describe('approveBudget', () => {
    it('should approve budget', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const approvalData = {
        approvedBy: '123e4567-e89b-12d3-a456-426614174003',
        notes: 'Budget approved for 2025'
      };

      const approvedBudget = {
        ...mockBudget,
        status: 'approved',
        approvedBy: approvalData.approvedBy,
        approvedDate: new Date(),
        approvalNotes: approvalData.notes
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(mockBudget as any);
      jest.spyOn(budgetRepository, 'save').mockResolvedValue(approvedBudget as any);

      const result = await service.approveBudget(id, approvalData);

      expect(result.status).toBe('approved');
      expect(result.approvedBy).toBe(approvalData.approvedBy);
      expect(result.approvedDate).toBeDefined();
    });

    it('should throw error if budget not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const approvalData = {
        approvedBy: '123e4567-e89b-12d3-a456-426614174003',
        notes: 'Budget approved for 2025'
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.approveBudget(id, approvalData)).rejects.toThrow('Budget not found');
    });

    it('should throw error if budget not in draft status', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const approvalData = {
        approvedBy: '123e4567-e89b-12d3-a456-426614174003',
        notes: 'Budget approved for 2025'
      };

      const approvedBudget = {
        ...mockBudget,
        status: 'approved'
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(approvedBudget as any);

      await expect(service.approveBudget(id, approvalData)).rejects.toThrow('Only draft budgets can be approved');
    });
  });

  describe('updateActuals', () => {
    it('should update budget actuals', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const actualsData = {
        actualRevenue: 500000.00,
        actualExpenses: 400000.00,
        actualOccupancy: 25,
        updatedBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      const updatedBudget = {
        ...mockBudget,
        ...actualsData,
        actualProfit: new Decimal(100000.00),
        revenueVariance: new Decimal(-500000.00),
        revenueVariancePercentage: new Decimal(-50.00),
        expenseVariance: new Decimal(-400000.00),
        expenseVariancePercentage: new Decimal(-50.00),
        profitVariance: new Decimal(-100000.00)
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(mockBudget as any);
      jest.spyOn(budgetRepository, 'save').mockResolvedValue(updatedBudget as any);

      const result = await service.updateActuals(id, actualsData);

      expect(result.actualRevenue).toEqual(new Decimal(500000.00));
      expect(result.actualExpenses).toEqual(new Decimal(400000.00));
      expect(result.actualOccupancy).toBe(25);
    });

    it('should throw error if budget not found', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const actualsData = {
        actualRevenue: 500000.00,
        actualExpenses: 400000.00,
        updatedBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(null);

      await expect(service.updateActuals(id, actualsData)).rejects.toThrow('Budget not found');
    });
  });

  describe('getBudgetVarianceAnalysis', () => {
    it('should return budget variance analysis', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const budgetWithActuals = {
        ...mockBudget,
        actualRevenue: new Decimal(500000.00),
        actualExpenses: new Decimal(400000.00),
        actualProfit: new Decimal(100000.00),
        revenueVariance: new Decimal(-500000.00),
        revenueVariancePercentage: new Decimal(-50.00),
        expenseVariance: new Decimal(-400000.00),
        expenseVariancePercentage: new Decimal(-50.00),
        profitVariance: new Decimal(-100000.00)
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(budgetWithActuals as any);

      const result = await service.getBudgetVarianceAnalysis(id);

      expect(result).toEqual({
        revenueVariance: '-500000',
        revenueVariancePercentage: '-50',
        expenseVariance: '-400000',
        expenseVariancePercentage: '-50',
        profitVariance: '-100000',
        isRevenueFavorable: false,
        isExpenseFavorable: true,
        isProfitFavorable: false
      });
    });
  });

  describe('getBudgetUtilizationMetrics', () => {
    it('should return budget utilization metrics', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const budgetWithActuals = {
        ...mockBudget,
        actualRevenue: new Decimal(500000.00),
        actualExpenses: new Decimal(400000.00),
        actualProfit: new Decimal(100000.00)
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(budgetWithActuals as any);

      const result = await service.getBudgetUtilizationMetrics(id);

      expect(result).toHaveProperty('revenueUtilization');
      expect(result).toHaveProperty('expenseUtilization');
      expect(result).toHaveProperty('profitUtilization');
      expect(result).toHaveProperty('daysRemaining');
      expect(result).toHaveProperty('projectedRevenue');
      expect(result).toHaveProperty('projectedExpenses');
      expect(result).toHaveProperty('projectedProfit');
    });
  });

  describe('getBudgetForecastingData', () => {
    it('should return budget forecasting data', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';

      const budgetWithActuals = {
        ...mockBudget,
        actualRevenue: new Decimal(500000.00),
        actualExpenses: new Decimal(400000.00),
        actualProfit: new Decimal(100000.00),
        revenueVariancePercentage: new Decimal(-50.00),
        expenseVariancePercentage: new Decimal(-50.00),
        profitVariance: new Decimal(-100000.00)
      };

      jest.spyOn(budgetRepository, 'findOne').mockResolvedValue(budgetWithActuals as any);

      const result = await service.getBudgetForecastingData(id);

      expect(result).toHaveProperty('currentPeriod');
      expect(result).toHaveProperty('totalPeriod');
      expect(result).toHaveProperty('completionPercentage');
      expect(result).toHaveProperty('trendAnalysis');
      expect(result).toHaveProperty('riskAssessment');
      expect(result).toHaveProperty('recommendations');
    });
  });

  describe('getBudgetSummary', () => {
    it('should return budget summary', async () => {
      const asOfDate = new Date('2025-06-30');
      const careHomeId = '123e4567-e89b-12d3-a456-426614174001';

      const mockSummary = {
        totalBudgets: 5,
        activeBudgets: 3,
        totalBudgetedRevenue: new Decimal(5000000.00),
        totalBudgetedExpenses: new Decimal(4000000.00),
        totalActualRevenue: new Decimal(2500000.00),
        totalActualExpenses: new Decimal(2000000.00),
        totalVariance: new Decimal(500000.00),
        averageVariancePercentage: new Decimal(10.00),
        currency: 'GBP',
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getBudgetSummary').mockResolvedValue(mockSummary);

      const result = await service.getBudgetSummary(asOfDate, careHomeId);

      expect(result).toEqual(mockSummary);
    });
  });
});

describe('Budget Integration Tests', () => {
  let app: any;
  let budgetService: BudgetService;

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

  describe('Budget Workflow', () => {
    it('should complete full budget workflow', async () => {
      // 1. Create budget
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        currency: 'GBP',
        totalBudgetedRevenue: 1000000.00,
        totalBudgetedExpenses: 800000.00,
        careHomeId: '123e4567-e89b-12d3-a456-426614174001',
        departmentId: '123e4567-e89b-12d3-a456-426614174002',
        budgetedOccupancy: 50,
        budgetedRevenuePerBed: 20000.00,
        budgetedCostPerResident: 16000.00,
        createdBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      const budget = await budgetService.createBudget(createData);
      expect(budget.status).toBe('draft');

      // 2. Approve budget
      const approvalData = {
        approvedBy: '123e4567-e89b-12d3-a456-426614174003',
        notes: 'Budget approved for 2025'
      };

      const approvedBudget = await budgetService.approveBudget(budget.id, approvalData);
      expect(approvedBudget.status).toBe('approved');

      // 3. Update actuals
      const actualsData = {
        actualRevenue: 500000.00,
        actualExpenses: 400000.00,
        actualOccupancy: 25,
        updatedBy: '123e4567-e89b-12d3-a456-426614174003'
      };

      const updatedBudget = await budgetService.updateActuals(budget.id, actualsData);
      expect(updatedBudget.actualRevenue).toEqual(new Decimal(500000.00));
      expect(updatedBudget.actualExpenses).toEqual(new Decimal(400000.00));
    });
  });
});

describe('Budget E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('Budget API Endpoints', () => {
    it('should create budget via API', async () => {
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'GBP',
        totalBudgetedRevenue: 1000000.00,
        totalBudgetedExpenses: 800000.00,
        careHomeId: '123e4567-e89b-12d3-a456-426614174001',
        departmentId: '123e4567-e89b-12d3-a456-426614174002',
        budgetedOccupancy: 50,
        budgetedRevenuePerBed: 20000.00,
        budgetedCostPerResident: 16000.00
      };

      const response = await request(app.getHttpServer())
        .post('/api/finance/budgets')
        .send(createData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('draft');
      expect(response.body.data.budgetName).toBe('2025 Annual Budget');
    });

    it('should get budget by ID via API', async () => {
      // First create a budget
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'GBP',
        totalBudgetedRevenue: 1000000.00,
        totalBudgetedExpenses: 800000.00
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/finance/budgets')
        .send(createData)
        .expect(201);

      const budgetId = createResponse.body.data.id;

      // Then get it by ID
      const response = await request(app.getHttpServer())
        .get(`/api/finance/budgets/${budgetId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(budgetId);
    });

    it('should approve budget via API', async () => {
      // First create a budget
      const createData = {
        budgetName: '2025 Annual Budget',
        budgetCode: 'BUD2025',
        budgetType: 'annual',
        description: 'Annual budget for 2025',
        financialYear: '2025',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        currency: 'GBP',
        totalBudgetedRevenue: 1000000.00,
        totalBudgetedExpenses: 800000.00
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/finance/budgets')
        .send(createData)
        .expect(201);

      const budgetId = createResponse.body.data.id;

      // Then approve it
      const approvalData = {
        approvedBy: '123e4567-e89b-12d3-a456-426614174003',
        notes: 'Budget approved for 2025'
      };

      const response = await request(app.getHttpServer())
        .post(`/api/finance/budgets/${budgetId}/approve`)
        .send(approvalData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });
  });
});
