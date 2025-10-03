# Development Guide – WriteCareNotes

## Overview

This guide provides comprehensive documentation for developers working on the WriteCareNotes care home management system. It covers development setup, coding standards, testing procedures, and contribution guidelines.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Coding Standards](#coding-standards)
4. [Testing Guidelines](#testing-guidelines)
5. [API Development](#api-development)
6. [Database Development](#database-development)
7. [Frontend Development](#frontend-development)
8. [Mobile Development](#mobile-development)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Docker**: v20.0.0 or higher
- **Docker Compose**: v2.0.0 or higher
- **Git**: v2.30.0 or higher
- **PostgreSQL**: v14.0 or higher
- **Redis**: v6.0 or higher

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/writecarenotes/writecarenotes.git
   cd writecarenotes
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Environment**
   ```bash
   npm run dev
   ```

5. **Run Tests**
   ```bash
   npm test
   ```

## Development Environment

### Local Development Setup

#### Backend Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres redis

# View logs
docker-compose logs -f api-gateway
```

#### Frontend Development
```bash
# Start frontend development server
cd frontend
npm run dev

# Start with hot reload
npm run dev:watch
```

#### Mobile Development
```bash
# Start mobile development
cd mobile
npm run start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### IDE Configuration

#### VS Code Setup
1. **Install Extensions**
   - TypeScript and JavaScript Language Features
   - ESLint
   - Prettier
   - Docker
   - Kubernetes

2. **Workspace Settings**
   ```json
   {
     "typescript.preferences.importModuleSpecifier": "relative",
     "editor.formatOnSave": true,
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": true
     }
   }
   ```

#### IntelliJ IDEA Setup
1. **Install Plugins**
   - TypeScript
   - Docker
   - Kubernetes
   - Database Tools

2. **Configure Code Style**
   - Import project code style
   - Enable auto-formatting
   - Configure TypeScript settings

### Environment Variables

#### Required Variables
```bash
# Database
DATABASE_URL=postgresql://writecarenotes:password@localhost:5432/writecarenotes
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# API
API_PORT=3000
API_HOST=localhost

# External Services
NHS_API_KEY=your-nhs-api-key
SENDGRID_API_KEY=your-sendgrid-api-key
```

#### Optional Variables
```bash
# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Monitoring
PROMETHEUS_ENABLED=true
GRAFANA_ENABLED=true

# Development
DEBUG=true
HOT_RELOAD=true
```

## Coding Standards

### TypeScript Standards

#### Code Style
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

// Use enums for constants
enum UserRole {
  ADMIN = 'admin',
  NURSE = 'nurse',
  CARER = 'carer',
  MANAGER = 'manager'
}

// Use type aliases for unions
type Status = 'active' | 'inactive' | 'pending';

// Use generic types for reusable components
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
```

#### Naming Conventions
```typescript
// Use PascalCase for classes and interfaces
class UserService {
  // Use camelCase for methods and variables
  async getUserById(id: string): Promise<User> {
    // Use SCREAMING_SNAKE_CASE for constants
    const MAX_RETRY_ATTEMPTS = 3;
    
    // Use descriptive names
    const userRepository = this.getUserRepository();
    
    return await userRepository.findById(id);
  }
}

// Use kebab-case for file names
// user-service.ts
// medication-controller.ts
// care-plan-entity.ts
```

#### Error Handling
```typescript
// Use custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Use try-catch blocks
async function createUser(userData: CreateUserRequest): Promise<User> {
  try {
    const user = await userService.create(userData);
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException('Failed to create user');
  }
}
```

### API Standards

#### RESTful Design
```typescript
// Use proper HTTP methods
@Controller('users')
export class UserController {
  @Get()
  async getUsers(@Query() query: GetUsersQuery): Promise<ApiResponse<User[]>> {
    // GET /users
  }

  @Get(':id')
  async getUser(@Param('id') id: string): Promise<ApiResponse<User>> {
    // GET /users/:id
  }

  @Post()
  async createUser(@Body() userData: CreateUserRequest): Promise<ApiResponse<User>> {
    // POST /users
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    // PUT /users/:id
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string): Promise<void> {
    // DELETE /users/:id
  }
}
```

#### Request/Response Format
```typescript
// Standard response format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    version: string;
    correlationId: string;
  };
}

// Pagination format
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

### Database Standards

#### Entity Design
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CARER
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;
}
```

#### Migration Standards
```typescript
// Use descriptive migration names
export class CreateUsersTable1234567890 implements MigrationInterface {
  name = 'CreateUsersTable1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['admin', 'nurse', 'carer', 'manager'],
            default: "'carer'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

## Testing Guidelines

### Unit Testing

#### Test Structure
```typescript
describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('getUserById', () => {
    it('should return a user when found', async () => {
      const userId = 'user-123';
      const expectedUser = { id: userId, email: 'test@example.com', name: 'Test User' };
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(expectedUser);

      const result = await userService.getUserById(userId);

      expect(result).toEqual(expectedUser);
      expect(userRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should throw NotFoundException when user not found', async () => {
      const userId = 'user-123';
      
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(null);

      await expect(userService.getUserById(userId)).rejects.toThrow(NotFoundException);
    });
  });
});
```

#### Test Coverage
```bash
# Run tests with coverage
npm run test:coverage

# Coverage thresholds
# Statements: 90%
# Branches: 85%
# Functions: 90%
# Lines: 90%
```

### Integration Testing

#### API Testing
```typescript
describe('UserController (e2e)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        role: 'carer'
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(userData.email);
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: '',
        role: 'invalid-role'
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### End-to-End Testing

#### E2E Test Setup
```typescript
describe('WriteCareNotes E2E', () => {
  let app: INestApplication;
  let userService: UserService;
  let authService: AuthService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userService = moduleFixture.get<UserService>(UserService);
    authService = moduleFixture.get<AuthService>(AuthService);
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete User Workflow', () => {
    it('should handle complete user registration and login flow', async () => {
      // 1. Register user
      const userData = {
        email: 'e2e@example.com',
        name: 'E2E Test User',
        role: 'carer'
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // 2. Login user
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'default-password'
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.accessToken).toBeDefined();

      // 3. Access protected resource
      const token = loginResponse.body.data.accessToken;
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.email).toBe(userData.email);
    });
  });
});
```

## API Development

### Controller Development

#### Basic Controller
```typescript
@Controller('medications')
@UseGuards(JwtAuthGuard)
@ApiTags('medications')
export class MedicationController {
  constructor(private readonly medicationService: MedicationService) {}

  @Get()
  @ApiOperation({ summary: 'Get medications' })
  @ApiResponse({ status: 200, description: 'Medications retrieved successfully' })
  async getMedications(
    @Query() query: GetMedicationsQuery,
    @CurrentUser() user: User
  ): Promise<ApiResponse<PaginatedResponse<Medication>>> {
    const medications = await this.medicationService.getMedications(query, user);
    return {
      success: true,
      data: medications,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
        correlationId: generateCorrelationId()
      }
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create medication' })
  @ApiResponse({ status: 201, description: 'Medication created successfully' })
  async createMedication(
    @Body() medicationData: CreateMedicationRequest,
    @CurrentUser() user: User
  ): Promise<ApiResponse<Medication>> {
    const medication = await this.medicationService.createMedication(medicationData, user);
    return {
      success: true,
      data: medication,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1',
        correlationId: generateCorrelationId()
      }
    };
  }
}
```

### Service Development

#### Basic Service
```typescript
@Injectable()
export class MedicationService {
  constructor(
    @InjectRepository(Medication)
    private readonly medicationRepository: Repository<Medication>,
    private readonly auditService: AuditService
  ) {}

  async getMedications(
    query: GetMedicationsQuery,
    user: User
  ): Promise<PaginatedResponse<Medication>> {
    const { page, limit, residentId, status, search } = query;
    
    const queryBuilder = this.medicationRepository
      .createQueryBuilder('medication')
      .leftJoinAndSelect('medication.resident', 'resident')
      .where('medication.careHomeId = :careHomeId', { careHomeId: user.careHomeId });

    if (residentId) {
      queryBuilder.andWhere('medication.residentId = :residentId', { residentId });
    }

    if (status) {
      queryBuilder.andWhere('medication.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(medication.name ILIKE :search OR medication.genericName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [medications, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: medications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async createMedication(
    medicationData: CreateMedicationRequest,
    user: User
  ): Promise<Medication> {
    const medication = this.medicationRepository.create({
      ...medicationData,
      careHomeId: user.careHomeId,
      createdBy: user.id
    });

    const savedMedication = await this.medicationRepository.save(medication);

    // Audit log
    await this.auditService.log({
      eventType: 'medication_created',
      entityType: 'medication',
      entityId: savedMedication.id,
      userId: user.id,
      metadata: {
        medicationName: savedMedication.name,
        residentId: savedMedication.residentId
      }
    });

    return savedMedication;
  }
}
```

## Database Development

### Entity Development

#### Basic Entity
```typescript
@Entity('medications')
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  careHomeId: string;

  @Column()
  residentId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  genericName?: string;

  @Column()
  dosage: string;

  @Column()
  form: string;

  @Column()
  route: string;

  @Column()
  frequency: string;

  @Column({ nullable: true })
  instructions?: string;

  @Column({
    type: 'enum',
    enum: MedicationCategory,
    default: MedicationCategory.PRESCRIPTION
  })
  category: MedicationCategory;

  @Column({
    type: 'enum',
    enum: MedicationStatus,
    default: MedicationStatus.ACTIVE
  })
  status: MedicationStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'int', default: 0 })
  totalQuantity: number;

  @Column({ type: 'int', default: 0 })
  remainingQuantity: number;

  @Column({ type: 'int', default: 0 })
  refillsRemaining: number;

  @Column()
  prescriber: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  prescriptionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextDue?: Date;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  // Relationships
  @ManyToOne(() => Resident, resident => resident.medications)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @OneToMany(() => MedicationAdministration, administration => administration.medication)
  administrations: MedicationAdministration[];
}
```

### Migration Development

#### Creating Migrations
```bash
# Generate migration
npm run migration:generate -- CreateMedicationsTable

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

#### Migration Example
```typescript
export class CreateMedicationsTable1234567890 implements MigrationInterface {
  name = 'CreateMedicationsTable1234567890';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'medications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'care_home_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'resident_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'generic_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'dosage',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'form',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'route',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'frequency',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'instructions',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['prescription', 'over_the_counter', 'controlled', 'as_needed'],
            default: "'prescription'",
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'inactive', 'expired', 'discontinued'],
            default: "'active'",
          },
          {
            name: 'start_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'end_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'total_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'remaining_quantity',
            type: 'int',
            default: 0,
          },
          {
            name: 'refills_remaining',
            type: 'int',
            default: 0,
          },
          {
            name: 'prescriber',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'prescription_date',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'next_due',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deleted_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'medications',
      new ForeignKey({
        columnNames: ['care_home_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'care_homes',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'medications',
      new ForeignKey({
        columnNames: ['resident_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'residents',
        onDelete: 'CASCADE',
      })
    );

    // Add indexes
    await queryRunner.createIndex(
      'medications',
      new Index('IDX_MEDICATIONS_CARE_HOME_ID', ['care_home_id'])
    );

    await queryRunner.createIndex(
      'medications',
      new Index('IDX_MEDICATIONS_RESIDENT_ID', ['resident_id'])
    );

    await queryRunner.createIndex(
      'medications',
      new Index('IDX_MEDICATIONS_STATUS', ['status'])
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('medications');
  }
}
```

## Frontend Development

### React Component Development

#### Component Structure
```typescript
// MedicationList.tsx
import React, { useState, useEffect } from 'react';
import { Medication, GetMedicationsQuery } from '../types';
import { medicationService } from '../services';
import { MedicationCard } from './MedicationCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorMessage } from './ErrorMessage';

interface MedicationListProps {
  residentId?: string;
  onMedicationSelect?: (medication: Medication) => void;
}

export const MedicationList: React.FC<MedicationListProps> = ({
  residentId,
  onMedicationSelect
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<GetMedicationsQuery>({
    page: 1,
    limit: 20,
    residentId,
    status: 'active'
  });

  useEffect(() => {
    loadMedications();
  }, [query]);

  const loadMedications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await medicationService.getMedications(query);
      setMedications(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicationClick = (medication: Medication) => {
    onMedicationSelect?.(medication);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadMedications} />;
  }

  return (
    <div className="medication-list">
      <div className="medication-list__header">
        <h2>Medications</h2>
        <div className="medication-list__filters">
          {/* Filter components */}
        </div>
      </div>
      <div className="medication-list__content">
        {medications.map((medication) => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            onClick={() => handleMedicationClick(medication)}
          />
        ))}
      </div>
    </div>
  );
};
```

### State Management

#### Redux Toolkit Setup
```typescript
// store/medicationSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Medication, GetMedicationsQuery } from '../types';
import { medicationService } from '../services';

interface MedicationState {
  medications: Medication[];
  loading: boolean;
  error: string | null;
  query: GetMedicationsQuery;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: MedicationState = {
  medications: [],
  loading: false,
  error: null,
  query: {
    page: 1,
    limit: 20,
    status: 'active'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
};

export const fetchMedications = createAsyncThunk(
  'medications/fetchMedications',
  async (query: GetMedicationsQuery) => {
    const response = await medicationService.getMedications(query);
    return response;
  }
);

export const createMedication = createAsyncThunk(
  'medications/createMedication',
  async (medicationData: CreateMedicationRequest) => {
    const response = await medicationService.createMedication(medicationData);
    return response;
  }
);

const medicationSlice = createSlice({
  name: 'medications',
  initialState,
  reducers: {
    setQuery: (state, action: PayloadAction<Partial<GetMedicationsQuery>>) => {
      state.query = { ...state.query, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMedications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMedications.fulfilled, (state, action) => {
        state.loading = false;
        state.medications = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMedications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch medications';
      })
      .addCase(createMedication.fulfilled, (state, action) => {
        state.medications.unshift(action.payload);
      });
  }
});

export const { setQuery, clearError } = medicationSlice.actions;
export default medicationSlice.reducer;
```

## Mobile Development

### React Native Component

#### Basic Component
```typescript
// MedicationListScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl
} from 'react-native';
import { Medication } from '../types';
import { medicationService } from '../services';
import { MedicationCard } from '../components/MedicationCard';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface MedicationListScreenProps {
  navigation: any;
  route: any;
}

export const MedicationListScreen: React.FC<MedicationListScreenProps> = ({
  navigation,
  route
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { residentId } = route.params || {};

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);
      const response = await medicationService.getMedications({
        page: 1,
        limit: 50,
        residentId,
        status: 'active'
      });
      setMedications(response.data);
    } catch (error) {
      console.error('Failed to load medications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const handleMedicationPress = (medication: Medication) => {
    navigation.navigate('MedicationDetail', { medicationId: medication.id });
  };

  const renderMedication = ({ item }: { item: Medication }) => (
    <MedicationCard
      medication={item}
      onPress={() => handleMedicationPress(item)}
    />
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={medications}
        renderItem={renderMedication}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  list: {
    padding: 16
  }
});
```

## Deployment

### Local Development

#### Docker Compose
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: writecarenotes
      POSTGRES_USER: writecarenotes
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://writecarenotes:password@postgres:5432/writecarenotes
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - .:/app
      - /app/node_modules

volumes:
  postgres_data:
```

#### Development Scripts
```json
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "dev:docker": "docker-compose -f docker-compose.dev.yml up",
    "dev:build": "docker-compose -f docker-compose.dev.yml up --build",
    "dev:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f"
  }
}
```

### Production Deployment

#### Kubernetes Deployment
```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: writecarenotes
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: writecarenotes/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Contributing

### Pull Request Process

1. **Fork Repository**
   ```bash
   git clone https://github.com/your-username/writecarenotes.git
   cd writecarenotes
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow coding standards
   - Write tests
   - Update documentation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add medication administration tracking"
   ```

5. **Push Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Use descriptive title
   - Provide detailed description
   - Link related issues

### Code Review Process

1. **Automated Checks**
   - Tests must pass
   - Code coverage maintained
   - Linting rules satisfied

2. **Manual Review**
   - Code quality
   - Security considerations
   - Performance impact

3. **Approval Process**
   - At least 2 approvals required
   - No outstanding comments
   - All checks passing

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

#### Examples
```
feat(medication): add medication administration tracking

- Add medication administration entity
- Add administration service
- Add administration controller
- Add administration tests

Closes #123
```

```
fix(auth): resolve JWT token validation issue

The JWT token validation was failing for tokens with special characters.
This fix properly escapes special characters in the token validation process.

Fixes #456
```

---

## Document Control

**Version**: 1.0  
**Last Updated**: January 15, 2025  
**Next Review**: April 15, 2025  
**Approved By**: Technical Director  
**Distribution**: Development Team

**Change Log**:
- v1.0: Initial creation with comprehensive development guidelines

---

*This development guide is a living document and should be updated regularly to reflect changes in technology stack, coding standards, and development practices.*