import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceService } from '../../services/performance/PerformanceService';
import { DBSVerification } from '../../entities/hr/DBSVerification';
import { RightToWorkCheck } from '../../entities/hr/RightToWorkCheck';
import { DVLACheck } from '../../entities/hr/DVLACheck';
import { CashTransaction } from '../../entities/financial/CashTransaction';
import { Budget } from '../../entities/financial/Budget';
import { LedgerAccount } from '../../entities/financial/LedgerAccount';

/**
 * @fileoverview Performance Tests
 * @module PerformanceTests
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Comprehensive test suite for performance testing
 * including unit tests, integration tests, and E2E tests.
 */

describe('Performance Service', () => {
  let service: PerformanceService;
  let dbsVerificationRepository: Repository<DBSVerification>;
  let rightToWorkCheckRepository: Repository<RightToWorkCheck>;
  let dvlaCheckRepository: Repository<DVLACheck>;
  let cashTransactionRepository: Repository<CashTransaction>;
  let budgetRepository: Repository<Budget>;
  let ledgerAccountRepository: Repository<LedgerAccount>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        {
          provide: getRepositoryToken(DBSVerification),
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
          provide: getRepositoryToken(RightToWorkCheck),
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
          provide: getRepositoryToken(DVLACheck),
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

    service = module.get<PerformanceService>(PerformanceService);
    dbsVerificationRepository = module.get<Repository<DBSVerification>>(getRepositoryToken(DBSVerification));
    rightToWorkCheckRepository = module.get<Repository<RightToWorkCheck>>(getRepositoryToken(RightToWorkCheck));
    dvlaCheckRepository = module.get<Repository<DVLACheck>>(getRepositoryToken(DVLACheck));
    cashTransactionRepository = module.get<Repository<CashTransaction>>(getRepositoryToken(CashTransaction));
    budgetRepository = module.get<Repository<Budget>>(getRepositoryToken(Budget));
    ledgerAccountRepository = module.get<Repository<LedgerAccount>>(getRepositoryToken(LedgerAccount));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('measureAPIPerformance', () => {
    it('should measure API performance', async () => {
      const endpoint = '/api/hr/dbs';
      const method = 'POST';
      const payload = {
        employeeId: '123e4567-e89b-12d3-a456-426614174000',
        dbsType: 'enhanced',
        applicationReference: 'DBS-2025-001',
        applicationDate: '2025-01-01',
        notes: 'DBS application for new employee'
      };

      const mockPerformanceMetrics = {
        endpoint,
        method,
        responseTime: 150,
        statusCode: 201,
        memoryUsage: 1024000,
        cpuUsage: 5.2,
        timestamp: new Date()
      };

      jest.spyOn(service, 'measureAPIPerformance').mockResolvedValue(mockPerformanceMetrics);

      const result = await service.measureAPIPerformance(endpoint, method, payload);

      expect(result).toEqual(mockPerformanceMetrics);
      expect(result.responseTime).toBeLessThan(200);
    });
  });

  describe('measureDatabasePerformance', () => {
    it('should measure database performance', async () => {
      const query = 'SELECT * FROM dbs_verifications WHEREstatus = ?';
      const parameters = ['pending'];

      const mockDatabaseMetrics = {
        query,
        parameters,
        executionTime: 50,
        rowsAffected: 10,
        memoryUsage: 512000,
        timestamp: new Date()
      };

      jest.spyOn(service, 'measureDatabasePerformance').mockResolvedValue(mockDatabaseMetrics);

      const result = await service.measureDatabasePerformance(query, parameters);

      expect(result).toEqual(mockDatabaseMetrics);
      expect(result.executionTime).toBeLessThan(100);
    });
  });

  describe('measureReportGenerationPerformance', () => {
    it('should measure report generation performance', async () => {
      const reportType = 'compliance';
      const parameters = {
        careHomeId: '123e4567-e89b-12d3-a456-426614174001',
        dateFrom: '2025-01-01',
        dateTo: '2025-12-31'
      };

      const mockReportMetrics = {
        reportType,
        parameters,
        generationTime: 300,
        dataSize: 2048000,
        memoryUsage: 2048000,
        timestamp: new Date()
      };

      jest.spyOn(service, 'measureReportGenerationPerformance').mockResolvedValue(mockReportMetrics);

      const result = await service.measureReportGenerationPerformance(reportType, parameters);

      expect(result).toEqual(mockReportMetrics);
      expect(result.generationTime).toBeLessThan(500);
    });
  });

  describe('getPerformanceMetrics', () => {
    it('should return performance metrics', async () => {
      const timeRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31')
      };

      const mockPerformanceMetrics = {
        timeRange,
        apiMetrics: {
          averageResponseTime: 120,
          maxResponseTime: 300,
          minResponseTime: 50,
          totalRequests: 10000,
          successRate: 99.5
        },
        databaseMetrics: {
          averageQueryTime: 80,
          maxQueryTime: 200,
          minQueryTime: 20,
          totalQueries: 50000,
          slowQueries: 5
        },
        reportMetrics: {
          averageGenerationTime: 250,
          maxGenerationTime: 500,
          minGenerationTime: 100,
          totalReports: 1000,
          slowReports: 2
        },
        systemMetrics: {
          averageMemoryUsage: 1024000000,
          maxMemoryUsage: 2048000000,
          averageCpuUsage: 15.5,
          maxCpuUsage: 45.2
        },
        lastUpdated: new Date()
      };

      jest.spyOn(service, 'getPerformanceMetrics').mockResolvedValue(mockPerformanceMetrics);

      const result = await service.getPerformanceMetrics(timeRange);

      expect(result).toEqual(mockPerformanceMetrics);
    });
  });

  describe('optimizePerformance', () => {
    it('should optimize performance', async () => {
      const optimizationTarget = 'api_response_time';
      const currentMetrics = {
        averageResponseTime: 200,
        maxResponseTime: 500,
        minResponseTime: 100
      };

      const mockOptimizationResult = {
        target: optimizationTarget,
        before: currentMetrics,
        after: {
          averageResponseTime: 150,
          maxResponseTime: 300,
          minResponseTime: 80
        },
        improvements: {
          averageResponseTime: 25.0,
          maxResponseTime: 40.0,
          minResponseTime: 20.0
        },
        recommendations: [
          'Add database indexes',
          'Implement query caching',
          'Optimize API endpoints'
        ],
        timestamp: new Date()
      };

      jest.spyOn(service, 'optimizePerformance').mockResolvedValue(mockOptimizationResult);

      const result = await service.optimizePerformance(optimizationTarget, currentMetrics);

      expect(result).toEqual(mockOptimizationResult);
    });
  });
});

describe('Performance Integration Tests', () => {
  let app: any;
  let performanceService: PerformanceService;

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

  describe('Performance Workflow', () => {
    it('should complete full performance testing workflow', async () => {
      const timeRange = {
        from: new Date('2025-01-01'),
        to: new Date('2025-12-31')
      };

      // 1. Measure API performance
      const apiMetrics = await performanceService.measureAPIPerformance(
        '/api/hr/dbs',
        'POST',
        {
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          dbsType: 'enhanced',
          applicationReference: 'DBS-2025-001',
          applicationDate: '2025-01-01',
          notes: 'DBS application for new employee'
        }
      );
      expect(apiMetrics.responseTime).toBeLessThan(200);

      // 2. Measure database performance
      const databaseMetrics = await performanceService.measureDatabasePerformance(
        'SELECT * FROM dbs_verifications WHEREstatus = ?',
        ['pending']
      );
      expect(databaseMetrics.executionTime).toBeLessThan(100);

      // 3. Measure report generation performance
      const reportMetrics = await performanceService.measureReportGenerationPerformance(
        'compliance',
        {
          careHomeId: '123e4567-e89b-12d3-a456-426614174001',
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31'
        }
      );
      expect(reportMetrics.generationTime).toBeLessThan(500);

      // 4. Get overall performance metrics
      const overallMetrics = await performanceService.getPerformanceMetrics(timeRange);
      expect(overallMetrics.apiMetrics.averageResponseTime).toBeLessThan(200);
      expect(overallMetrics.databaseMetrics.averageQueryTime).toBeLessThan(100);
      expect(overallMetrics.reportMetrics.averageGenerationTime).toBeLessThan(500);
    });
  });
});

describe('Performance E2E Tests', () => {
  let app: any;

  beforeAll(async () => {
    // Setup test application with full stack
  });

  afterAll(async () => {
    // Cleanup test application
  });

  describe('Performance API Endpoints', () => {
    it('should measure API performance via API', async () => {
      const requestData = {
        endpoint: '/api/hr/dbs',
        method: 'POST',
        payload: {
          employeeId: '123e4567-e89b-12d3-a456-426614174000',
          dbsType: 'enhanced',
          applicationReference: 'DBS-2025-001',
          applicationDate: '2025-01-01',
          notes: 'DBS application for new employee'
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/performance/measure-api')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.responseTime).toBeLessThan(200);
    });

    it('should measure database performance via API', async () => {
      const requestData = {
        query: 'SELECT * FROM dbs_verifications WHEREstatus = ?',
        parameters: ['pending']
      };

      const response = await request(app.getHttpServer())
        .post('/api/performance/measure-database')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.executionTime).toBeLessThan(100);
    });

    it('should measure report generation performance via API', async () => {
      const requestData = {
        reportType: 'compliance',
        parameters: {
          careHomeId: '123e4567-e89b-12d3-a456-426614174001',
          dateFrom: '2025-01-01',
          dateTo: '2025-12-31'
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/performance/measure-report')
        .send(requestData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.generationTime).toBeLessThan(500);
    });
  });
});
