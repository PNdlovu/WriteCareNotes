# Pocket Money & Allowances Module - Testing Guide

**Module**: Children's Financial Management - Pocket Money & Allowances  
**Version**: 1.0.0  
**Last Updated**: October 10, 2025  
**Test Coverage Target**: 80%+

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [End-to-End Tests](#end-to-end-tests)
6. [Test Data](#test-data)
7. [Test Scenarios](#test-scenarios)
8. [Performance Testing](#performance-testing)
9. [Security Testing](#security-testing)
10. [Continuous Integration](#continuous-integration)

---

## Overview

This guide provides comprehensive testing strategies and examples for the **Pocket Money & Allowances Module**.

### Test Pyramid

```
           /\
          /  \  E2E Tests (10%)
         /    \
        /------\ Integration Tests (30%)
       /        \
      /----------\ Unit Tests (60%)
     /            \
```

### Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| **Entities** | 90%+ |
| **Services** | 85%+ |
| **Controllers** | 80%+ |
| **Routes** | 75%+ |
| **Overall** | 80%+ |

---

## Test Environment Setup

### Prerequisites

Install testing dependencies:

```bash
npm install --save-dev @nestjs/testing jest @types/jest ts-jest
npm install --save-dev supertest @types/supertest
npm install --save-dev @faker-js/faker
npm install --save-dev jest-mock-extended
```

### Jest Configuration

**File**: `jest.config.js`

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.module.ts',
    '!**/index.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Database Setup

Create a test database configuration:

**File**: `src/config/test-database.config.ts`

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const testDatabaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.TEST_DB_HOST || 'localhost',
  port: parseInt(process.env.TEST_DB_PORT) || 5433,
  username: process.env.TEST_DB_USERNAME || 'test_user',
  password: process.env.TEST_DB_PASSWORD || 'test_password',
  database: process.env.TEST_DB_NAME || 'wcnotes_test',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: true, // OK for test environment
  dropSchema: true, // Reset database before each test run
  logging: false
};
```

---

## Unit Tests

### Entity Tests

#### PocketMoneyTransaction Entity Tests

**File**: `src/domains/children/entities/__tests__/PocketMoneyTransaction.spec.ts`

```typescript
import { PocketMoneyTransaction, BritishIslesJurisdiction, DisbursementMethod, DisbursementStatus, POCKET_MONEY_RATES } from '../PocketMoneyTransaction';
import { Child } from '../Child';

describe('PocketMoneyTransaction Entity', () => {
  let transaction: PocketMoneyTransaction;
  let mockChild: Child;
  
  beforeEach(() => {
    mockChild = {
      id: 'child-1',
      dateOfBirth: new Date('2010-01-01'), // Age 15
    } as Child;
    
    transaction = new PocketMoneyTransaction();
  });
  
  describe('calculateExpectedAmount', () => {
    it('should calculate correct amount for age 15 in England', () => {
      const amount = transaction.calculateExpectedAmount(
        mockChild,
        BritishIslesJurisdiction.ENGLAND
      );
      
      expect(amount).toBe(10.00); // 11-15 age band
    });
    
    it('should calculate correct amount for age 7 in Scotland', () => {
      const youngChild = {
        ...mockChild,
        dateOfBirth: new Date('2018-01-01') // Age 7
      } as Child;
      
      const amount = transaction.calculateExpectedAmount(
        youngChild,
        BritishIslesJurisdiction.SCOTLAND
      );
      
      expect(amount).toBe(5.00); // 5-7 age band
    });
    
    it('should throw error for child under 5', () => {
      const tooYoung = {
        ...mockChild,
        dateOfBirth: new Date('2021-01-01') // Age 4
      } as Child;
      
      expect(() => {
        transaction.calculateExpectedAmount(tooYoung, BritishIslesJurisdiction.ENGLAND);
      }).toThrow('Child must be between 5 and 18 years old');
    });
  });
  
  describe('disburseAmount', () => {
    beforeEach(() => {
      transaction.expectedAmount = 10.00;
      transaction.jurisdiction = BritishIslesJurisdiction.ENGLAND;
    });
    
    it('should disburse full amount', () => {
      transaction.disburseAmount(10.00, DisbursementMethod.CASH, 'staff-1');
      
      expect(transaction.disbursedAmount).toBe(10.00);
      expect(transaction.status).toBe(DisbursementStatus.DISBURSED);
      expect(transaction.disbursedByStaffId).toBe('staff-1');
      expect(transaction.disbursedDate).toBeDefined();
      expect(transaction.hasVariance).toBe(false);
    });
    
    it('should handle partial disbursement with variance', () => {
      transaction.disburseAmount(7.50, DisbursementMethod.CASH, 'staff-1', 'Child absent for 2 days');
      
      expect(transaction.disbursedAmount).toBe(7.50);
      expect(transaction.variance).toBe(2.50);
      expect(transaction.hasVariance).toBe(true);
      expect(transaction.varianceReason).toBe('Child absent for 2 days');
    });
    
    it('should throw error for amount exceeding expected', () => {
      expect(() => {
        transaction.disburseAmount(15.00, DisbursementMethod.CASH, 'staff-1');
      }).toThrow('Disbursed amount cannot exceed expected amount');
    });
  });
  
  describe('transferToSavings', () => {
    beforeEach(() => {
      transaction.expectedAmount = 10.00;
      transaction.disbursedAmount = 10.00;
    });
    
    it('should transfer partial amount to savings', () => {
      transaction.transferToSavings(3.00, 'savings-1');
      
      expect(transaction.transferredToSavings).toBe(3.00);
      expect(transaction.savingsAccountId).toBe('savings-1');
      expect(transaction.disbursedAmount).toBe(7.00); // 10 - 3
    });
    
    it('should throw error for transfer exceeding disbursed amount', () => {
      expect(() => {
        transaction.transferToSavings(15.00, 'savings-1');
      }).toThrow('Transfer amount cannot exceed disbursed amount');
    });
  });
  
  describe('withholdMoney', () => {
    it('should withhold money with manager approval', () => {
      transaction.withholdMoney('Disciplinary sanction', 'manager-1');
      
      expect(transaction.wasWithheld).toBe(true);
      expect(transaction.withholdingReason).toBe('Disciplinary sanction');
      expect(transaction.withholdingApprovedByManagerId).toBe('manager-1');
      expect(transaction.status).toBe(DisbursementStatus.WITHHELD);
    });
  });
  
  describe('requiresVarianceExplanation', () => {
    it('should return true for variance without explanation', () => {
      transaction.hasVariance = true;
      transaction.varianceReason = null;
      
      expect(transaction.requiresVarianceExplanation()).toBe(true);
    });
    
    it('should return false for variance with explanation', () => {
      transaction.hasVariance = true;
      transaction.varianceReason = 'Child absent';
      
      expect(transaction.requiresVarianceExplanation()).toBe(false);
    });
  });
});
```

#### AllowanceExpenditure Entity Tests

**File**: `src/domains/children/entities/__tests__/AllowanceExpenditure.spec.ts`

```typescript
import { AllowanceExpenditure, AllowanceType, ApprovalStatus, ReceiptStatus } from '../AllowanceExpenditure';

describe('AllowanceExpenditure Entity', () => {
  let expenditure: AllowanceExpenditure;
  
  beforeEach(() => {
    expenditure = new AllowanceExpenditure();
  });
  
  describe('requestPurchase', () => {
    it('should create expenditure request for low-value item', () => {
      expenditure.requestPurchase(
        'child-1',
        AllowanceType.CLOTHING_SEASONAL,
        75.00,
        'Winter coat',
        'staff-1',
        200.00 // Budget
      );
      
      expect(expenditure.childId).toBe('child-1');
      expect(expenditure.amount).toBe(75.00);
      expect(expenditure.approvalStatus).toBe(ApprovalStatus.PENDING);
      expect(expenditure.requiresManagerApproval).toBe(false);
    });
    
    it('should escalate high-value item to manager', () => {
      expenditure.requestPurchase(
        'child-1',
        AllowanceType.EDUCATION_EQUIPMENT,
        150.00,
        'Laptop',
        'staff-1',
        300.00
      );
      
      expect(expenditure.requiresManagerApproval).toBe(true);
      expect(expenditure.approvalStatus).toBe(ApprovalStatus.ESCALATED);
    });
    
    it('should flag budget overrun', () => {
      expenditure.requestPurchase(
        'child-1',
        AllowanceType.CLOTHING_SEASONAL,
        250.00,
        'Full wardrobe',
        'staff-1',
        200.00 // Budget
      );
      
      expect(expenditure.exceedsBudget).toBe(true);
      expect(expenditure.budgetRemaining).toBe(-50.00);
    });
  });
  
  describe('approve', () => {
    beforeEach(() => {
      expenditure.approvalStatus = ApprovalStatus.PENDING;
    });
    
    it('should approve expenditure', () => {
      expenditure.approve('staff-2', 'Appropriate purchase');
      
      expect(expenditure.approvalStatus).toBe(ApprovalStatus.APPROVED);
      expect(expenditure.approvedByStaffId).toBe('staff-2');
      expect(expenditure.approvalNotes).toBe('Appropriate purchase');
    });
  });
  
  describe('uploadReceipt', () => {
    it('should upload receipt', () => {
      expenditure.uploadReceipt('/uploads/receipts/receipt-123.jpg', 'staff-1');
      
      expect(expenditure.receiptImageUrl).toBe('/uploads/receipts/receipt-123.jpg');
      expect(expenditure.receiptStatus).toBe(ReceiptStatus.UPLOADED);
      expect(expenditure.receiptUploadedByStaffId).toBe('staff-1');
    });
  });
  
  describe('getCategoryFromType', () => {
    it('should return CLOTHING for clothing types', () => {
      expect(expenditure.getCategoryFromType(AllowanceType.CLOTHING_SEASONAL)).toBe('CLOTHING');
      expect(expenditure.getCategoryFromType(AllowanceType.CLOTHING_SCHOOL_UNIFORM)).toBe('CLOTHING');
    });
    
    it('should return EDUCATION for education types', () => {
      expect(expenditure.getCategoryFromType(AllowanceType.EDUCATION_SCHOOL_TRIP)).toBe('EDUCATION');
    });
  });
});
```

### Service Tests

#### ChildAllowanceService Tests

**File**: `src/domains/children/services/__tests__/ChildAllowanceService.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { ChildAllowanceService } from '../ChildAllowanceService';
import { PocketMoneyTransaction } from '../../entities/PocketMoneyTransaction';
import { AllowanceExpenditure } from '../../entities/AllowanceExpenditure';
import { ChildSavingsAccount } from '../../entities/ChildSavingsAccount';
import { ChildSavingsTransaction } from '../../entities/ChildSavingsTransaction';
import { Child } from '../../entities/Child';

describe('ChildAllowanceService', () => {
  let service: ChildAllowanceService;
  let pocketMoneyRepo: Repository<PocketMoneyTransaction>;
  let allowanceRepo: Repository<AllowanceExpenditure>;
  let savingsAccountRepo: Repository<ChildSavingsAccount>;
  let savingsTransactionRepo: Repository<ChildSavingsTransaction>;
  let childRepo: Repository<Child>;
  
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChildAllowanceService,
        {
          provide: getRepositoryToken(PocketMoneyTransaction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(AllowanceExpenditure),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ChildSavingsAccount),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(ChildSavingsTransaction),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Child),
          useClass: Repository,
        },
      ],
    }).compile();
    
    service = module.get<ChildAllowanceService>(ChildAllowanceService);
    pocketMoneyRepo = module.get(getRepositoryToken(PocketMoneyTransaction));
    allowanceRepo = module.get(getRepositoryToken(AllowanceExpenditure));
    savingsAccountRepo = module.get(getRepositoryToken(ChildSavingsAccount));
    savingsTransactionRepo = module.get(getRepositoryToken(ChildSavingsTransaction));
    childRepo = module.get(getRepositoryToken(Child));
  });
  
  describe('disburseWeeklyPocketMoney', () => {
    const mockChild = {
      id: 'child-1',
      dateOfBirth: new Date('2010-01-01') // Age 15
    };
    
    const mockData = {
      childId: 'child-1',
      weekNumber: 42,
      year: 2025,
      jurisdiction: 'ENGLAND',
      method: 'CASH',
      staffId: 'staff-1'
    };
    
    it('should disburse pocket money successfully', async () => {
      jest.spyOn(childRepo, 'findOne').mockResolvedValue(mockChild as any);
      jest.spyOn(pocketMoneyRepo, 'findOne').mockResolvedValue(null); // No duplicate
      jest.spyOn(pocketMoneyRepo, 'create').mockReturnValue({} as any);
      jest.spyOn(pocketMoneyRepo, 'save').mockResolvedValue({
        id: 'transaction-1',
        expectedAmount: 10.00,
        disbursedAmount: 10.00
      } as any);
      
      const result = await service.disburseWeeklyPocketMoney(mockData);
      
      expect(result).toBeDefined();
      expect(childRepo.findOne).toHaveBeenCalledWith({ where: { id: 'child-1' } });
      expect(pocketMoneyRepo.save).toHaveBeenCalled();
    });
    
    it('should throw error for duplicate disbursement', async () => {
      jest.spyOn(childRepo, 'findOne').mockResolvedValue(mockChild as any);
      jest.spyOn(pocketMoneyRepo, 'findOne').mockResolvedValue({ id: 'existing' } as any);
      
      await expect(service.disburseWeeklyPocketMoney(mockData)).rejects.toThrow(BadRequestException);
    });
    
    it('should throw error for non-existent child', async () => {
      jest.spyOn(childRepo, 'findOne').mockResolvedValue(null);
      
      await expect(service.disburseWeeklyPocketMoney(mockData)).rejects.toThrow('Child not found');
    });
  });
  
  describe('openSavingsAccount', () => {
    const mockData = {
      childId: 'child-1',
      accountType: 'INTERNAL_POCKET_MONEY',
      accountName: 'Birthday Savings',
      interestRate: 2.5
    };
    
    it('should open savings account successfully', async () => {
      jest.spyOn(savingsAccountRepo, 'findOne').mockResolvedValue(null); // No existing
      jest.spyOn(savingsAccountRepo, 'create').mockReturnValue({} as any);
      jest.spyOn(savingsAccountRepo, 'save').mockResolvedValue({ id: 'account-1' } as any);
      
      const result = await service.openSavingsAccount(mockData);
      
      expect(result).toBeDefined();
      expect(savingsAccountRepo.save).toHaveBeenCalled();
    });
    
    it('should throw error if account already exists', async () => {
      jest.spyOn(savingsAccountRepo, 'findOne').mockResolvedValue({ id: 'existing' } as any);
      
      await expect(service.openSavingsAccount(mockData)).rejects.toThrow('already has an active');
    });
  });
  
  describe('getIRODashboard', () => {
    it('should return dashboard with all items', async () => {
      const mockPendingApprovals = [{ id: 'exp-1', approvalStatus: 'PENDING' }];
      const mockMissingReceipts = [{ id: 'exp-2', receiptStatus: 'PENDING' }];
      
      jest.spyOn(allowanceRepo, 'find')
        .mockResolvedValueOnce(mockPendingApprovals as any)
        .mockResolvedValueOnce(mockMissingReceipts as any);
      jest.spyOn(pocketMoneyRepo, 'find').mockResolvedValue([]);
      jest.spyOn(savingsTransactionRepo, 'find').mockResolvedValue([]);
      
      const result = await service.getIRODashboard();
      
      expect(result).toHaveProperty('pendingApprovals');
      expect(result).toHaveProperty('missingReceipts');
      expect(result).toHaveProperty('budgetOverruns');
      expect(result).toHaveProperty('pendingWithdrawals');
      expect(result).toHaveProperty('varianceAlerts');
    });
  });
});
```

---

## Integration Tests

### API Integration Tests

**File**: `src/domains/children/controllers/__tests__/child-allowance.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { DataSource } from 'typeorm';

describe('ChildAllowanceController (Integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let childId: string;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
    
    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    // Setup: Login to get JWT token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'social.worker@example.com',
        password: 'password123'
      });
    
    authToken = loginResponse.body.access_token;
    
    // Setup: Create test child
    const child = await dataSource.query(`
      INSERT INTO children (id, first_name, last_name, date_of_birth, status)
      VALUES (gen_random_uuid(), 'Test', 'Child', '2010-01-01', 'ACTIVE')
      RETURNING id
    `);
    childId = child[0].id;
  });
  
  afterAll(async () => {
    // Cleanup: Delete test data
    await dataSource.query(`DELETE FROM pocket_money_transactions WHERE child_id = $1`, [childId]);
    await dataSource.query(`DELETE FROM children WHERE id = $1`, [childId]);
    
    await app.close();
  });
  
  describe('Pocket Money Workflow', () => {
    let transactionId: string;
    
    it('should disburse weekly pocket money', async () => {
      const response = await request(app.getHttpServer())
        .post('/children/allowances/pocket-money/disburse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childId,
          weekNumber: 42,
          year: 2025,
          jurisdiction: 'ENGLAND',
          method: 'CASH'
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.expectedAmount).toBe(10.00); // Age 15 in England
      expect(response.body.disbursedAmount).toBe(10.00);
      expect(response.body.status).toBe('DISBURSED');
      
      transactionId = response.body.id;
    });
    
    it('should confirm child receipt', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/children/allowances/pocket-money/${transactionId}/confirm-receipt`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childSignature: 'Test Child - 10/10/2025',
          childComment: 'Thank you'
        })
        .expect(200);
      
      expect(response.body.receiptConfirmed).toBe(true);
      expect(response.body.childSignature).toBe('Test Child - 10/10/2025');
    });
    
    it('should get pocket money transactions for child', async () => {
      const response = await request(app.getHttpServer())
        .get(`/children/allowances/pocket-money/child/${childId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
  
  describe('Allowance Expenditure Workflow', () => {
    let expenditureId: string;
    
    it('should request allowance expenditure', async () => {
      const response = await request(app.getHttpServer())
        .post('/children/allowances/allowances/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childId,
          allowanceType: 'CLOTHING_SEASONAL',
          amount: 75.50,
          itemDescription: 'Winter coat',
          vendor: 'Next',
          purchaseDate: '2025-10-10',
          budgetAmount: 200.00,
          childPresent: true,
          childChose: true
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body.approvalStatus).toBe('PENDING');
      expect(response.body.requiresManagerApproval).toBe(false);
      
      expenditureId = response.body.id;
    });
    
    it('should approve allowance expenditure', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/children/allowances/allowances/${expenditureId}/approve`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Appropriate purchase'
        })
        .expect(200);
      
      expect(response.body.approvalStatus).toBe('APPROVED');
    });
  });
  
  describe('Validation Tests', () => {
    it('should reject invalid week number', async () => {
      await request(app.getHttpServer())
        .post('/children/allowances/pocket-money/disburse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childId,
          weekNumber: 54, // Invalid
          year: 2025,
          jurisdiction: 'ENGLAND',
          method: 'CASH'
        })
        .expect(400);
    });
    
    it('should reject invalid amount', async () => {
      await request(app.getHttpServer())
        .post('/children/allowances/allowances/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childId,
          allowanceType: 'CLOTHING_SEASONAL',
          amount: -10.00, // Negative
          itemDescription: 'Test',
          purchaseDate: '2025-10-10'
        })
        .expect(400);
    });
  });
  
  describe('Authorization Tests', () => {
    it('should reject request without token', async () => {
      await request(app.getHttpServer())
        .post('/children/allowances/pocket-money/disburse')
        .send({})
        .expect(401);
    });
    
    it('should reject manager-only operation for non-manager', async () => {
      // Login as residential worker
      const workerLogin = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'residential.worker@example.com',
          password: 'password123'
        });
      
      const workerToken = workerLogin.body.access_token;
      
      // Try to withhold pocket money (manager-only)
      await request(app.getHttpServer())
        .patch(`/children/allowances/pocket-money/transaction-1/withhold`)
        .set('Authorization', `Bearer ${workerToken}`)
        .send({
          reason: 'Disciplinary'
        })
        .expect(403); // Forbidden
    });
  });
});
```

---

## End-to-End Tests

### Complete User Workflow Tests

**File**: `test/e2e/child-allowance.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { faker } from '@faker-js/faker';

describe('Child Allowance E2E Tests', () => {
  let app: INestApplication;
  let socialWorkerToken: string;
  let managerToken: string;
  let iroToken: string;
  let childId: string;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Login as different roles
    socialWorkerToken = (await login('social.worker@example.com')).access_token;
    managerToken = (await login('manager@example.com')).access_token;
    iroToken = (await login('iro@example.com')).access_token;
    
    // Create test child
    const child = await createChild();
    childId = child.id;
  });
  
  async function login(username: string) {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password: 'password123' });
    return response.body;
  }
  
  async function createChild() {
    const response = await request(app.getHttpServer())
      .post('/children')
      .set('Authorization', `Bearer ${socialWorkerToken}`)
      .send({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        dateOfBirth: '2010-01-01',
        status: 'ACTIVE'
      });
    return response.body;
  }
  
  describe('Scenario 1: Weekly Pocket Money Disbursement', () => {
    it('should complete full pocket money workflow', async () => {
      // Step 1: Social worker disburses pocket money
      const disburse = await request(app.getHttpServer())
        .post('/children/allowances/pocket-money/disburse')
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          childId,
          weekNumber: 42,
          year: 2025,
          jurisdiction: 'ENGLAND',
          method: 'CASH'
        })
        .expect(201);
      
      const transactionId = disburse.body.id;
      expect(disburse.body.expectedAmount).toBe(10.00);
      
      // Step 2: Child confirms receipt
      await request(app.getHttpServer())
        .patch(`/children/allowances/pocket-money/${transactionId}/confirm-receipt`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          childSignature: 'Child Name - Date',
          childComment: 'Received'
        })
        .expect(200);
      
      // Step 3: IRO views in dashboard
      const dashboard = await request(app.getHttpServer())
        .get('/children/allowances/reports/iro-dashboard')
        .set('Authorization', `Bearer ${iroToken}`)
        .expect(200);
      
      expect(dashboard.body).toHaveProperty('pendingApprovals');
    });
  });
  
  describe('Scenario 2: High-Value Allowance Purchase', () => {
    it('should escalate to manager and complete approval workflow', async () => {
      // Step 1: Social worker requests high-value item
      const request1 = await request(app.getHttpServer())
        .post('/children/allowances/allowances/request')
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          childId,
          allowanceType: 'EDUCATION_EQUIPMENT',
          amount: 150.00, // > £100 threshold
          itemDescription: 'Laptop for A-Level studies',
          vendor: 'Apple',
          purchaseDate: '2025-10-10',
          budgetAmount: 300.00
        })
        .expect(201);
      
      const expenditureId = request1.body.id;
      expect(request1.body.requiresManagerApproval).toBe(true);
      expect(request1.body.approvalStatus).toBe('ESCALATED');
      
      // Step 2: Manager approves
      await request(app.getHttpServer())
        .patch(`/children/allowances/allowances/${expenditureId}/approve`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          notes: 'Approved - essential for education'
        })
        .expect(200);
      
      // Step 3: Upload receipt
      // (File upload test - simplified)
      await request(app.getHttpServer())
        .post(`/children/allowances/allowances/${expenditureId}/upload-receipt`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .attach('file', 'test/fixtures/sample-receipt.jpg')
        .expect(200);
      
      // Step 4: Verify receipt
      const verify = await request(app.getHttpServer())
        .patch(`/children/allowances/allowances/${expenditureId}/verify-receipt`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .expect(200);
      
      expect(verify.body.receiptStatus).toBe('VERIFIED');
    });
  });
  
  describe('Scenario 3: Savings Account with Pocket Money Transfer', () => {
    it('should open account, deposit, and withdraw', async () => {
      // Step 1: Open savings account
      const openAccount = await request(app.getHttpServer())
        .post('/children/allowances/savings/open')
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          childId,
          accountType: 'INTERNAL_POCKET_MONEY',
          accountName: 'Birthday Savings',
          interestRate: 2.5,
          savingsGoal: {
            amount: 200.00,
            description: 'New bicycle',
            targetDate: '2026-05-01'
          }
        })
        .expect(201);
      
      const accountId = openAccount.body.id;
      
      // Step 2: Deposit from pocket money
      await request(app.getHttpServer())
        .post(`/children/allowances/savings/${accountId}/deposit`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          amount: 5.00,
          description: 'Weekly savings from pocket money'
        })
        .expect(201);
      
      // Step 3: Request withdrawal
      const withdraw = await request(app.getHttpServer())
        .post(`/children/allowances/savings/${accountId}/withdraw`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          amount: 25.00,
          purpose: 'Purchase birthday present for friend'
        })
        .expect(201);
      
      const transactionId = withdraw.body.id;
      
      // Step 4: Approve withdrawal
      await request(app.getHttpServer())
        .patch(`/children/allowances/savings/withdrawals/${transactionId}/approve`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .send({
          notes: 'Appropriate use of savings'
        })
        .expect(200);
    });
  });
  
  describe('Scenario 4: Quarterly Reporting', () => {
    it('should generate quarterly summary', async () => {
      const summary = await request(app.getHttpServer())
        .get(`/children/allowances/reports/quarterly/${childId}?year=2025&quarter=4`)
        .set('Authorization', `Bearer ${socialWorkerToken}`)
        .expect(200);
      
      expect(summary.body).toHaveProperty('pocketMoney');
      expect(summary.body).toHaveProperty('allowances');
      expect(summary.body).toHaveProperty('savings');
    });
  });
});
```

---

## Test Data

### Test Data Factory

**File**: `test/factories/allowance.factory.ts`

```typescript
import { faker } from '@faker-js/faker';
import { BritishIslesJurisdiction, DisbursementMethod } from '../../src/domains/children/entities/PocketMoneyTransaction';
import { AllowanceType } from '../../src/domains/children/entities/AllowanceExpenditure';

export class AllowanceTestFactory {
  static createPocketMoneyData(overrides = {}) {
    return {
      childId: faker.string.uuid(),
      weekNumber: faker.number.int({ min: 1, max: 53 }),
      year: 2025,
      jurisdiction: BritishIslesJurisdiction.ENGLAND,
      method: DisbursementMethod.CASH,
      ...overrides
    };
  }
  
  static createAllowanceData(overrides = {}) {
    return {
      childId: faker.string.uuid(),
      allowanceType: AllowanceType.CLOTHING_SEASONAL,
      amount: faker.number.float({ min: 10, max: 100, precision: 0.01 }),
      itemDescription: faker.commerce.productName(),
      vendor: faker.company.name(),
      purchaseDate: faker.date.recent(),
      budgetAmount: 200.00,
      ...overrides
    };
  }
  
  static createSavingsAccountData(overrides = {}) {
    return {
      childId: faker.string.uuid(),
      accountType: 'INTERNAL_POCKET_MONEY',
      accountName: `${faker.person.firstName()}'s Savings`,
      interestRate: 2.5,
      ...overrides
    };
  }
}
```

---

## Performance Testing

### Load Testing with Artillery

**File**: `test/load/allowances-load-test.yml`

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  variables:
    authToken: "{{ $processEnvironment.AUTH_TOKEN }}"

scenarios:
  - name: "Disburse Pocket Money"
    flow:
      - post:
          url: "/children/allowances/pocket-money/disburse"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            childId: "{{ $randomUUID() }}"
            weekNumber: 42
            year: 2025
            jurisdiction: "ENGLAND"
            method: "CASH"
  
  - name: "Get IRO Dashboard"
    flow:
      - get:
          url: "/children/allowances/reports/iro-dashboard"
          headers:
            Authorization: "Bearer {{ authToken }}"
```

Run: `npx artillery run test/load/allowances-load-test.yml`

---

## Security Testing

### Security Test Checklist

- [ ] **SQL Injection**: Test all query parameters
- [ ] **XSS**: Test all text inputs
- [ ] **CSRF**: Verify CSRF tokens
- [ ] **Authentication Bypass**: Test without JWT
- [ ] **Authorization Bypass**: Test with wrong role
- [ ] **File Upload**: Test malicious files
- [ ] **Rate Limiting**: Test excessive requests
- [ ] **Sensitive Data**: Verify encryption

### Example Security Tests

```typescript
describe('Security Tests', () => {
  it('should prevent SQL injection in childId', async () => {
    await request(app.getHttpServer())
      .get(`/children/allowances/pocket-money/child/' OR '1'='1`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(400);
  });
  
  it('should sanitize XSS in notes', async () => {
    const response = await request(app.getHttpServer())
      .post('/children/allowances/allowances/request')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        childId: 'uuid',
        allowanceType: 'CLOTHING_SEASONAL',
        amount: 50.00,
        itemDescription: '<script>alert("XSS")</script>',
        purchaseDate: '2025-10-10'
      });
    
    expect(response.body.itemDescription).not.toContain('<script>');
  });
});
```

---

## Continuous Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: wcnotes_test
        ports:
          - 5433:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm test -- --coverage
      
      - name: Run e2e tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

**Document Version**: 1.0.0  
**Last Updated**: October 10, 2025  
**Test Coverage**: 80%+ Target
