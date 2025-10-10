# Pocket Money & Allowances Module - Integration Guide

**Module**: Children's Financial Management - Pocket Money & Allowances  
**Version**: 1.0.0  
**Last Updated**: October 10, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Module Registration](#module-registration)
4. [Database Setup](#database-setup)
5. [Route Registration](#route-registration)
6. [Environment Configuration](#environment-configuration)
7. [Integration with Existing Modules](#integration-with-existing-modules)
8. [Testing Integration](#testing-integration)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## Overview

This guide provides step-by-step instructions for integrating the **Pocket Money & Allowances Module** into your existing WCNotes application.

### What This Module Provides

- **3 Entity Classes**: PocketMoneyTransaction, AllowanceExpenditure, ChildSavingsAccount (+ ChildSavingsTransaction)
- **3 Database Migrations**: Complete schema with indexes, foreign keys, triggers
- **1 Service**: ChildAllowanceService with 40+ methods
- **1 Controller**: ChildAllowanceController with 24 REST endpoints
- **1 Router**: Express routes with authentication and RBAC

### Integration Approach

This module follows a **non-intrusive integration** approach:
- No modifications to existing entities
- No modifications to existing services
- No modifications to existing controllers
- Clean separation of concerns
- Zero duplication (verified)

---

## Prerequisites

### System Requirements

- **Node.js**: v18.0.0 or higher
- **TypeScript**: v5.0.0 or higher
- **NestJS**: v10.0.0 or higher
- **TypeORM**: v0.3.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Express**: v4.18.0 or higher

### Dependencies

Install required dependencies:

```bash
npm install @nestjs/common @nestjs/core @nestjs/typeorm typeorm class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install multer @types/multer
npm install express-validator
npm install pg
```

### Existing Modules Required

Ensure these modules are already configured:
- **AuthModule**: JWT authentication
- **ChildModule**: Child entity and basic operations
- **StaffModule**: Staff entity and basic operations
- **DatabaseModule**: TypeORM configuration

---

## Module Registration

### Step 1: Register Entities

Add the new entities to your TypeORM configuration.

**File**: `src/config/database.config.ts` or `app.module.ts`

```typescript
import { PocketMoneyTransaction } from './domains/children/entities/PocketMoneyTransaction';
import { AllowanceExpenditure } from './domains/children/entities/AllowanceExpenditure';
import { ChildSavingsAccount } from './domains/children/entities/ChildSavingsAccount';
import { ChildSavingsTransaction } from './domains/children/entities/ChildSavingsTransaction';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        // ... existing entities
        PocketMoneyTransaction,
        AllowanceExpenditure,
        ChildSavingsAccount,
        ChildSavingsTransaction
      ],
      migrations: ['dist/migrations/**/*.js'],
      synchronize: false, // Always use migrations in production
    }),
  ],
})
export class AppModule {}
```

### Step 2: Create Child Allowance Module

Create a dedicated NestJS module for the allowance functionality.

**File**: `src/domains/children/modules/child-allowance.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PocketMoneyTransaction } from '../entities/PocketMoneyTransaction';
import { AllowanceExpenditure } from '../entities/AllowanceExpenditure';
import { ChildSavingsAccount } from '../entities/ChildSavingsAccount';
import { ChildSavingsTransaction } from '../entities/ChildSavingsTransaction';
import { Child } from '../entities/Child';
import { ChildAllowanceService } from '../services/ChildAllowanceService';
import { ChildAllowanceController } from '../controllers/childAllowanceController';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PocketMoneyTransaction,
      AllowanceExpenditure,
      ChildSavingsAccount,
      ChildSavingsTransaction,
      Child
    ])
  ],
  providers: [ChildAllowanceService],
  controllers: [ChildAllowanceController],
  exports: [ChildAllowanceService]
})
export class ChildAllowanceModule {}
```

### Step 3: Import Module

Import the ChildAllowanceModule in your main application module.

**File**: `src/domains/children/children.module.ts` or `src/app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ChildAllowanceModule } from './modules/child-allowance.module';

@Module({
  imports: [
    // ... existing modules
    ChildAllowanceModule
  ],
})
export class ChildrenModule {}
```

---

## Database Setup

### Step 1: Copy Migration Files

Copy the migration files to your migrations directory:

```bash
cp src/migrations/1728518400000-CreatePocketMoneyTransactionsTable.ts dist/migrations/
cp src/migrations/1728518500000-CreateAllowanceExpendituresTable.ts dist/migrations/
cp src/migrations/1728518600000-CreateChildSavingsAccountsTable.ts dist/migrations/
```

### Step 2: Run Migrations

Execute the migrations in order:

```bash
# Run all pending migrations
npm run migration:run

# Or run individually
npx typeorm migration:run --dataSource=dist/config/ormconfig.js
```

**Expected Output**:
```
Migration CreatePocketMoneyTransactionsTable1728518400000 has been executed successfully.
Migration CreateAllowanceExpendituresTable1728518500000 has been executed successfully.
Migration CreateChildSavingsAccountsTable1728518600000 has been executed successfully.
```

### Step 3: Verify Database Schema

Connect to your PostgreSQL database and verify the tables were created:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'pocket_money_transactions',
  'allowance_expenditures',
  'child_savings_accounts',
  'child_savings_transactions'
);

-- Check enum types exist
SELECT typname FROM pg_type 
WHERE typname IN (
  'british_isles_jurisdiction_enum',
  'disbursement_method_enum',
  'disbursement_status_enum',
  'allowance_type_enum',
  'approval_status_enum',
  'receipt_status_enum',
  'savings_account_type_enum',
  'savings_transaction_type_enum',
  'withdrawal_status_enum'
);

-- Check indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename IN (
  'pocket_money_transactions',
  'allowance_expenditures',
  'child_savings_accounts',
  'child_savings_transactions'
);

-- Check foreign keys exist
SELECT conname FROM pg_constraint 
WHERE contype = 'f' 
AND conrelid IN (
  'pocket_money_transactions'::regclass,
  'allowance_expenditures'::regclass,
  'child_savings_accounts'::regclass,
  'child_savings_transactions'::regclass
);
```

### Step 4: Seed British Isles Configuration (Optional)

If you need to seed pocket money rates or allowance types:

**File**: `src/seeds/seed-allowance-config.ts`

```typescript
import { DataSource } from 'typeorm';
import { POCKET_MONEY_RATES } from '../domains/children/entities/PocketMoneyTransaction';

async function seedAllowanceConfig(dataSource: DataSource) {
  // Seed pocket money rates (stored in application config, not database)
  console.log('Pocket money rates configured:', POCKET_MONEY_RATES);
  
  // Optionally seed initial savings accounts for existing children
  const children = await dataSource.query('SELECT id FROM children WHERE status = $1', ['ACTIVE']);
  
  for (const child of children) {
    // Check if child already has a savings account
    const existing = await dataSource.query(
      'SELECT id FROM child_savings_accounts WHERE child_id = $1 AND status = $2',
      [child.id, 'ACTIVE']
    );
    
    if (existing.length === 0) {
      console.log(`Creating savings account for child ${child.id}...`);
      // Create initial savings account
      await dataSource.query(`
        INSERT INTO child_savings_accounts (
          id, child_id, account_type, account_name, status, current_balance, 
          currency, opened_date, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, 'INTERNAL_POCKET_MONEY', 'General Savings', 'ACTIVE', 0,
          'GBP', CURRENT_DATE, NOW(), NOW()
        )
      `, [child.id]);
    }
  }
  
  console.log('Allowance configuration seeded successfully');
}

// Run: npx ts-node src/seeds/seed-allowance-config.ts
```

---

## Route Registration

### Step 1: Register Express Routes

If using Express alongside NestJS, register the Express routes.

**File**: `src/app.ts` or `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import childAllowanceRoutes from './domains/children/routes/childAllowanceRoutes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get Express instance
  const expressApp = app.getHttpAdapter().getInstance();
  
  // Register child allowance routes
  expressApp.use('/api/children/allowances', childAllowanceRoutes);
  
  await app.listen(3000);
}
bootstrap();
```

### Step 2: Configure Swagger (Optional)

Add Swagger documentation for the new endpoints.

**File**: `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('WCNotes API')
    .setDescription('WCNotes - Children\'s Services Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Child Allowances', 'Pocket money, allowances, and savings management')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  await app.listen(3000);
  console.log('Swagger documentation available at http://localhost:3000/api/docs');
}
bootstrap();
```

### Step 3: Create Upload Directory

Create the uploads directory for receipt images:

```bash
# Windows PowerShell
New-Item -ItemType Directory -Path "uploads/receipts" -Force

# Linux/Mac
mkdir -p uploads/receipts
chmod 755 uploads/receipts
```

### Step 4: Configure Static File Serving

Serve uploaded receipt images.

**File**: `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  await app.listen(3000);
}
bootstrap();
```

---

## Environment Configuration

### Step 1: Add Environment Variables

Add required environment variables to your `.env` file.

**File**: `.env`

```bash
# Database Configuration (existing)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=wcnotes_user
DB_PASSWORD=your_password
DB_DATABASE=wcnotes_db

# JWT Configuration (existing)
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d

# Child Allowances Configuration (new)
ALLOWANCES_UPLOAD_DIR=uploads/receipts
ALLOWANCES_MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWANCES_ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
ALLOWANCES_HIGH_VALUE_THRESHOLD=100.00
ALLOWANCES_SAVINGS_WITHDRAWAL_THRESHOLD=50.00
ALLOWANCES_DEFAULT_INTEREST_RATE=2.5
ALLOWANCES_DEFAULT_JURISDICTION=ENGLAND

# Notification Configuration (optional)
ALLOWANCES_NOTIFY_PENDING_APPROVALS=true
ALLOWANCES_NOTIFY_MISSING_RECEIPTS=true
ALLOWANCES_NOTIFY_BUDGET_OVERRUNS=true
```

### Step 2: Create Configuration Service

Create a configuration service for allowance settings.

**File**: `src/config/allowances.config.ts`

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('allowances', () => ({
  upload: {
    directory: process.env.ALLOWANCES_UPLOAD_DIR || 'uploads/receipts',
    maxFileSize: parseInt(process.env.ALLOWANCES_MAX_FILE_SIZE) || 5 * 1024 * 1024,
    allowedTypes: (process.env.ALLOWANCES_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,application/pdf').split(',')
  },
  thresholds: {
    highValue: parseFloat(process.env.ALLOWANCES_HIGH_VALUE_THRESHOLD) || 100.00,
    savingsWithdrawal: parseFloat(process.env.ALLOWANCES_SAVINGS_WITHDRAWAL_THRESHOLD) || 50.00
  },
  defaults: {
    interestRate: parseFloat(process.env.ALLOWANCES_DEFAULT_INTEREST_RATE) || 2.5,
    jurisdiction: process.env.ALLOWANCES_DEFAULT_JURISDICTION || 'ENGLAND'
  },
  notifications: {
    pendingApprovals: process.env.ALLOWANCES_NOTIFY_PENDING_APPROVALS === 'true',
    missingReceipts: process.env.ALLOWANCES_NOTIFY_MISSING_RECEIPTS === 'true',
    budgetOverruns: process.env.ALLOWANCES_NOTIFY_BUDGET_OVERRUNS === 'true'
  }
}));
```

### Step 3: Load Configuration

Load the configuration in your module.

**File**: `src/domains/children/modules/child-allowance.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import allowancesConfig from '../../../config/allowances.config';

@Module({
  imports: [
    ConfigModule.forFeature(allowancesConfig),
    // ... other imports
  ],
  // ... providers, controllers, exports
})
export class ChildAllowanceModule {}
```

---

## Integration with Existing Modules

### Integration 1: PlacementAgreement (Budget Reference)

Link pocket money disbursements to placement agreement budgets.

**File**: `src/domains/children/services/placement.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ChildAllowanceService } from './ChildAllowanceService';

@Injectable()
export class PlacementService {
  constructor(
    private readonly allowanceService: ChildAllowanceService
  ) {}
  
  async getPlacementFinancialSummary(placementId: string) {
    const placement = await this.placementRepo.findOne({ where: { id: placementId } });
    
    // Get actual disbursements
    const disbursements = await this.allowanceService.getPocketMoneyTransactions(
      placement.childId,
      { year: new Date().getFullYear() }
    );
    
    const budgetedAmount = placement.pocketMoneyAmount * 52; // Annual budget
    const actualDisbursed = disbursements.reduce((sum, t) => sum + t.disbursedAmount, 0);
    
    return {
      budgeted: budgetedAmount,
      actual: actualDisbursed,
      variance: budgetedAmount - actualDisbursed,
      utilizationRate: (actualDisbursed / budgetedAmount) * 100
    };
  }
}
```

### Integration 2: ChildBilling (Allowance Budget)

Link allowance expenditures to child billing records.

**File**: `src/domains/finance/services/billing.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ChildAllowanceService } from '../../children/services/ChildAllowanceService';

@Injectable()
export class BillingService {
  constructor(
    private readonly allowanceService: ChildAllowanceService
  ) {}
  
  async generateMonthlyInvoice(childId: string, month: number, year: number) {
    const billing = await this.billingRepo.findOne({ where: { childId } });
    
    // Get actual allowance expenditures for the month
    const expenditures = await this.allowanceService.getAllowanceExpenditures(
      childId,
      { year, /* month filter */ }
    );
    
    const budgetedAllowances = billing.personalAllowances;
    const actualSpent = expenditures.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      childId,
      month,
      year,
      allowances: {
        budgeted: budgetedAllowances,
        actual: actualSpent,
        variance: budgetedAllowances - actualSpent
      }
    };
  }
}
```

### Integration 3: LeavingCareFinances (Care Leavers Transition)

Transfer savings when child transitions to care leaver status.

**File**: `src/domains/children/services/leaving-care.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ChildAllowanceService } from './ChildAllowanceService';

@Injectable()
export class LeavingCareService {
  constructor(
    private readonly allowanceService: ChildAllowanceService
  ) {}
  
  async transitionToCarLeaver(childId: string) {
    const child = await this.childRepo.findOne({ where: { id: childId } });
    
    if (child.age < 16) {
      throw new BadRequestException('Child must be 16+ to transition to care leaver');
    }
    
    // Get current savings balance
    const savingsAccount = await this.allowanceService.getSavingsAccount(childId);
    
    // Create leaving care finance record
    const leavingCareFinance = await this.leavingCareFinanceRepo.save({
      youngPersonId: childId,
      initialSavingsTransfer: savingsAccount.currentBalance,
      transferDate: new Date(),
      source: 'CHILD_SAVINGS_ACCOUNT'
    });
    
    // Close child savings account
    await this.allowanceService.closeSavingsAccount(
      savingsAccount.id,
      'Transferred to leaving care finances'
    );
    
    return leavingCareFinance;
  }
}
```

### Integration 4: IRO Review (Financial Section)

Include financial summary in IRO review reports.

**File**: `src/domains/children/services/iro-review.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ChildAllowanceService } from './ChildAllowanceService';

@Injectable()
export class IROReviewService {
  constructor(
    private readonly allowanceService: ChildAllowanceService
  ) {}
  
  async generateReviewReport(childId: string) {
    const child = await this.childRepo.findOne({ where: { id: childId } });
    
    // Get financial summary
    const currentQuarter = Math.floor((new Date().getMonth() / 3)) + 1;
    const currentYear = new Date().getFullYear();
    
    const quarterlySummary = await this.allowanceService.getQuarterlySummary(
      childId,
      currentYear,
      currentQuarter
    );
    
    const dashboard = await this.allowanceService.getIRODashboard();
    const childDashboard = {
      pendingApprovals: dashboard.pendingApprovals.filter(a => a.childId === childId),
      missingReceipts: dashboard.missingReceipts.filter(a => a.childId === childId),
      budgetOverruns: dashboard.budgetOverruns.filter(a => a.childId === childId)
    };
    
    return {
      child,
      financialSummary: quarterlySummary,
      itemsRequiringAttention: childDashboard,
      // ... other review sections
    };
  }
}
```

---

## Testing Integration

### Step 1: Unit Tests

Create unit tests for the service layer.

**File**: `src/domains/children/services/__tests__/child-allowance.service.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChildAllowanceService } from '../ChildAllowanceService';
import { PocketMoneyTransaction } from '../../entities/PocketMoneyTransaction';
import { AllowanceExpenditure } from '../../entities/AllowanceExpenditure';
import { ChildSavingsAccount } from '../../entities/ChildSavingsAccount';

describe('ChildAllowanceService', () => {
  let service: ChildAllowanceService;
  let pocketMoneyRepo: Repository<PocketMoneyTransaction>;
  
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
        // ... other repositories
      ],
    }).compile();
    
    service = module.get<ChildAllowanceService>(ChildAllowanceService);
    pocketMoneyRepo = module.get<Repository<PocketMoneyTransaction>>(
      getRepositoryToken(PocketMoneyTransaction)
    );
  });
  
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  describe('disburseWeeklyPocketMoney', () => {
    it('should disburse pocket money successfully', async () => {
      const mockChild = { id: 'child-1', dateOfBirth: new Date('2010-01-01') };
      const mockData = {
        childId: 'child-1',
        weekNumber: 42,
        year: 2025,
        jurisdiction: 'ENGLAND',
        method: 'CASH'
      };
      
      jest.spyOn(pocketMoneyRepo, 'findOne').mockResolvedValue(null); // No duplicate
      jest.spyOn(pocketMoneyRepo, 'create').mockReturnValue({} as any);
      jest.spyOn(pocketMoneyRepo, 'save').mockResolvedValue({} as any);
      
      const result = await service.disburseWeeklyPocketMoney(mockData);
      
      expect(result).toBeDefined();
      expect(pocketMoneyRepo.save).toHaveBeenCalled();
    });
    
    it('should throw error for duplicate disbursement', async () => {
      const mockExisting = { id: 'existing-1' };
      jest.spyOn(pocketMoneyRepo, 'findOne').mockResolvedValue(mockExisting as any);
      
      await expect(
        service.disburseWeeklyPocketMoney({} as any)
      ).rejects.toThrow('Already disbursed');
    });
  });
});
```

### Step 2: Integration Tests

Create integration tests for the API endpoints.

**File**: `src/domains/children/controllers/__tests__/child-allowance.controller.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';

describe('ChildAllowanceController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    
    // Login to get JWT token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'test@example.com', password: 'password' });
    
    authToken = loginResponse.body.access_token;
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('POST /children/allowances/pocket-money/disburse', () => {
    it('should disburse pocket money', () => {
      return request(app.getHttpServer())
        .post('/children/allowances/pocket-money/disburse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          childId: 'uuid',
          weekNumber: 42,
          year: 2025,
          jurisdiction: 'ENGLAND',
          method: 'CASH'
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.expectedAmount).toBeDefined();
        });
    });
    
    it('should return 401 without auth token', () => {
      return request(app.getHttpServer())
        .post('/children/allowances/pocket-money/disburse')
        .send({})
        .expect(401);
    });
  });
});
```

### Step 3: Run Tests

Execute the test suites:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- child-allowance.service.spec.ts

# Run e2e tests
npm run test:e2e
```

**Expected Coverage**:
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

---

## Troubleshooting

### Issue 1: Migration Fails

**Error**: `relation "children" does not exist`

**Solution**: Ensure the Child entity and table exist before running allowance migrations.

```bash
# Check if children table exists
psql -U wcnotes_user -d wcnotes_db -c "\dt children"

# If not, run core migrations first
npm run migration:run
```

### Issue 2: Foreign Key Violations

**Error**: `insert or update on table "pocket_money_transactions" violates foreign key constraint`

**Solution**: Ensure referenced data exists (children, staff).

```sql
-- Check child exists
SELECT id, first_name, last_name FROM children WHERE id = 'uuid';

-- Check staff exists
SELECT id, first_name, last_name FROM staff WHERE id = 'uuid';
```

### Issue 3: File Upload Fails

**Error**: `ENOENT: no such file or directory, open 'uploads/receipts/...'`

**Solution**: Create the uploads directory.

```bash
# Windows PowerShell
New-Item -ItemType Directory -Path "uploads/receipts" -Force

# Linux/Mac
mkdir -p uploads/receipts
chmod 755 uploads/receipts
```

### Issue 4: JWT Authentication Fails

**Error**: `401 Unauthorized`

**Solution**: Verify JWT configuration.

```typescript
// Check JWT secret is configured
console.log('JWT Secret:', process.env.JWT_SECRET);

// Verify token in request header
Authorization: Bearer <your-token-here>
```

### Issue 5: RBAC Authorization Fails

**Error**: `403 Forbidden`

**Solution**: Verify user has required role.

```typescript
// Check user roles
const user = await authService.validateToken(token);
console.log('User roles:', user.roles);

// Endpoint requires MANAGER role
@Roles(UserRole.MANAGER, UserRole.ADMIN)
```

---

## Rollback Procedures

### Rollback Migrations

If you need to rollback the migrations:

```bash
# Rollback last migration
npm run migration:revert

# Or use TypeORM CLI
npx typeorm migration:revert --dataSource=dist/config/ormconfig.js
```

**Rollback Order** (reverse of installation):
1. Revert `CreateChildSavingsAccountsTable`
2. Revert `CreateAllowanceExpendituresTable`
3. Revert `CreatePocketMoneyTransactionsTable`

### Manual Rollback

If automatic rollback fails, manually drop tables:

```sql
-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS child_savings_transactions CASCADE;
DROP TABLE IF EXISTS child_savings_accounts CASCADE;
DROP TABLE IF EXISTS allowance_expenditures CASCADE;
DROP TABLE IF EXISTS pocket_money_transactions CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS british_isles_jurisdiction_enum;
DROP TYPE IF EXISTS disbursement_method_enum;
DROP TYPE IF EXISTS disbursement_status_enum;
DROP TYPE IF EXISTS allowance_type_enum;
DROP TYPE IF EXISTS approval_status_enum;
DROP TYPE IF EXISTS receipt_status_enum;
DROP TYPE IF EXISTS savings_account_type_enum;
DROP TYPE IF EXISTS savings_transaction_type_enum;
DROP TYPE IF EXISTS withdrawal_status_enum;
```

### Remove Module

To completely remove the module:

1. **Rollback migrations** (see above)
2. **Remove module imports**:
   ```typescript
   // Remove from app.module.ts
   // imports: [ChildAllowanceModule]
   ```
3. **Remove route registration**:
   ```typescript
   // Remove from main.ts
   // app.use('/api/children/allowances', childAllowanceRoutes);
   ```
4. **Delete files**:
   ```bash
   rm -rf src/domains/children/entities/PocketMoneyTransaction.ts
   rm -rf src/domains/children/entities/AllowanceExpenditure.ts
   rm -rf src/domains/children/entities/ChildSavingsAccount.ts
   rm -rf src/domains/children/services/ChildAllowanceService.ts
   rm -rf src/domains/children/controllers/childAllowanceController.ts
   rm -rf src/domains/children/routes/childAllowanceRoutes.ts
   rm -rf src/migrations/1728518400000-CreatePocketMoneyTransactionsTable.ts
   rm -rf src/migrations/1728518500000-CreateAllowanceExpendituresTable.ts
   rm -rf src/migrations/1728518600000-CreateChildSavingsAccountsTable.ts
   ```

---

## Next Steps

After successful integration:

1. **User Acceptance Testing (UAT)**
   - Create test accounts (social workers, managers, IRO)
   - Test complete workflows (disburse → receipt → savings)
   - Test approval workflows
   - Test receipt upload
   - Test IRO dashboard

2. **Staff Training**
   - Train social workers on pocket money disbursement
   - Train residential workers on daily operations
   - Train managers on approval workflows
   - Train IRO on dashboard and reporting

3. **Production Deployment**
   - Deploy to staging environment
   - Run smoke tests
   - Monitor for 48 hours
   - Deploy to production
   - Monitor metrics

4. **Post-Deployment**
   - Monitor error logs
   - Monitor API performance
   - Monitor file storage usage
   - Gather user feedback
   - Iterate on improvements

---

**Document Version**: 1.0.0  
**Last Updated**: October 10, 2025  
**Maintained By**: Development Team
