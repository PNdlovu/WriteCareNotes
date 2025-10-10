# Module Architecture - Children's Care System

## 🏗️ Architectural Overview

The Children's Care System follows **Domain-Driven Design (DDD)** principles with a **modular monolith** architecture, providing the benefits of microservices organization while maintaining deployment simplicity.

---

## 📁 Folder Structure

```
src/
├── domains/
│   ├── children/              # Module 1: Child Profile Management
│   │   ├── entities/
│   │   │   └── Child.entity.ts
│   │   ├── dto/
│   │   │   ├── create-child.dto.ts
│   │   │   ├── update-child.dto.ts
│   │   │   └── search-child.dto.ts
│   │   ├── services/
│   │   │   └── ChildService.ts
│   │   ├── controllers/
│   │   │   └── ChildProfileController.ts
│   │   └── routes/
│   │       └── children.routes.ts
│   │
│   ├── placements/            # Module 2: Placement Management
│   │   ├── entities/
│   │   │   ├── Placement.entity.ts
│   │   │   └── PlacementTransition.entity.ts
│   │   ├── dto/
│   │   │   ├── create-placement.dto.ts
│   │   │   ├── update-placement.dto.ts
│   │   │   └── placement-matching.dto.ts
│   │   ├── services/
│   │   │   ├── PlacementService.ts
│   │   │   ├── PlacementMatchingService.ts
│   │   │   └── MissingEpisodeService.ts
│   │   ├── controllers/
│   │   │   └── PlacementController.ts
│   │   └── routes/
│   │       └── placement.routes.ts
│   │
│   ├── safeguarding/          # Module 3: Safeguarding
│   │   ├── entities/
│   │   │   ├── SafeguardingConcern.entity.ts
│   │   │   ├── RiskAssessment.entity.ts
│   │   │   └── Investigation.entity.ts
│   │   ├── dto/
│   │   │   ├── create-concern.dto.ts
│   │   │   ├── create-risk-assessment.dto.ts
│   │   │   └── create-investigation.dto.ts
│   │   ├── services/
│   │   │   └── SafeguardingService.ts
│   │   ├── controllers/
│   │   │   └── SafeguardingController.ts
│   │   └── routes/
│   │       └── safeguarding.routes.ts
│   │
│   ├── education/             # Module 4: Education (PEP)
│   │   ├── entities/
│   │   │   ├── PersonalEducationPlan.entity.ts
│   │   │   └── EducationAttendance.entity.ts
│   │   ├── dto/
│   │   │   ├── create-pep.dto.ts
│   │   │   └── update-pep.dto.ts
│   │   ├── services/
│   │   │   └── EducationService.ts
│   │   ├── controllers/
│   │   │   └── EducationController.ts
│   │   └── routes/
│   │       └── education.routes.ts
│   │
│   ├── health/                # Module 5: Health Management
│   │   ├── entities/
│   │   │   ├── HealthInitialAssessment.entity.ts
│   │   │   └── HealthReviewAssessment.entity.ts
│   │   ├── dto/
│   │   │   ├── create-initial-assessment.dto.ts
│   │   │   └── create-review-assessment.dto.ts
│   │   ├── services/
│   │   │   └── ChildHealthService.ts
│   │   ├── controllers/
│   │   │   └── ChildHealthController.ts
│   │   └── routes/
│   │       └── health.routes.ts
│   │
│   ├── family/                # Module 6: Family & Contact
│   │   ├── entities/
│   │   │   ├── FamilyMember.entity.ts
│   │   │   └── ContactArrangement.entity.ts
│   │   ├── dto/
│   │   │   ├── create-family-member.dto.ts
│   │   │   └── create-contact-arrangement.dto.ts
│   │   ├── services/
│   │   │   ├── FamilyService.ts
│   │   │   └── ContactService.ts
│   │   ├── controllers/
│   │   │   └── FamilyContactController.ts
│   │   └── routes/
│   │       └── family.routes.ts
│   │
│   ├── careplanning/          # Module 7: Care Planning
│   │   ├── entities/
│   │   │   ├── CarePlan.entity.ts
│   │   │   └── CarePlanReview.entity.ts
│   │   ├── dto/
│   │   │   ├── create-care-plan.dto.ts
│   │   │   └── create-review.dto.ts
│   │   ├── services/
│   │   │   └── CarePlanningService.ts
│   │   ├── controllers/
│   │   │   └── CarePlanningController.ts
│   │   └── routes/
│   │       └── careplanning.routes.ts
│   │
│   ├── leavingcare/           # Module 8: Leaving Care
│   │   ├── entities/
│   │   │   ├── PathwayPlan.entity.ts
│   │   │   └── LeavingCareAssessment.entity.ts
│   │   ├── dto/
│   │   │   ├── create-pathway-plan.dto.ts
│   │   │   └── create-assessment.dto.ts
│   │   ├── services/
│   │   │   └── LeavingCareService.ts
│   │   ├── controllers/
│   │   │   └── LeavingCareController.ts
│   │   └── routes/
│   │       └── leavingcare.routes.ts
│   │
│   └── uasc/                  # Module 9: UASC
│       ├── entities/
│       │   ├── UASCProfile.entity.ts
│       │   ├── ImmigrationStatus.entity.ts
│       │   ├── AgeAssessment.entity.ts
│       │   ├── HomeOfficeReferral.entity.ts
│       │   └── AsylumApplication.entity.ts
│       ├── dto/
│       │   ├── create-uasc-profile.dto.ts
│       │   ├── create-immigration-status.dto.ts
│       │   └── create-age-assessment.dto.ts
│       ├── services/
│       │   ├── UASCService.ts
│       │   ├── ImmigrationService.ts
│       │   └── HomeOfficeService.ts
│       ├── controllers/
│       │   └── UASCController.ts
│       └── routes/
│           └── uasc.routes.ts
│
├── config/
│   └── typeorm.config.ts      # Database configuration with all entities
│
├── migrations/
│   └── 1728000000000-CreateChildrenCareTables.ts
│
└── routes/
    └── index.ts               # Main router with all module registrations
```

---

## 🎨 Design Patterns

### 1. **Domain-Driven Design (DDD)**

Each module represents a bounded context with:
- **Entities**: Database models with TypeORM decorators
- **DTOs**: Data Transfer Objects for validation
- **Services**: Business logic layer
- **Controllers**: HTTP request handlers
- **Routes**: Express route definitions

**Benefits**:
- Clear separation of concerns
- Easy to understand and maintain
- Scalable to microservices if needed
- Team can work independently on modules

---

### 2. **Repository Pattern (via TypeORM)**

```typescript
// TypeORM provides repository abstraction
const childRepository = AppDataSource.getRepository(Child);

// Standard CRUD operations
await childRepository.find();
await childRepository.findOne({ where: { id } });
await childRepository.save(child);
await childRepository.remove(child);
```

**Benefits**:
- Database abstraction
- Easy to test (mock repositories)
- Consistent data access patterns
- Query builder for complex queries

---

### 3. **Service Layer Pattern**

```typescript
// Business logic encapsulated in services
export class ChildService {
  async createChild(dto: CreateChildDto): Promise<Child> {
    // Validation
    // Business rules
    // Data transformation
    // Database operation
  }
}
```

**Benefits**:
- Reusable business logic
- Easy to test
- Controller stays thin
- Consistent error handling

---

### 4. **DTO Pattern with Validation**

```typescript
export class CreateChildDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @IsNotEmpty()
  @IsEnum(LegalStatus)
  legalStatus: LegalStatus;

  @IsOptional()
  @IsDate()
  placementStartDate?: Date;
}
```

**Benefits**:
- Input validation at API boundary
- Type safety
- Auto-generated API documentation
- Prevents invalid data

---

### 5. **Factory Pattern (for Complex Objects)**

```typescript
export class PlacementFactory {
  static createEmergencyPlacement(
    child: Child,
    provider: PlacementProvider
  ): Placement {
    return {
      type: PlacementType.EMERGENCY,
      startDate: new Date(),
      status: PlacementStatus.ACTIVE,
      // ... emergency-specific configuration
    };
  }
}
```

---

## 🔄 Request Flow

```
Client Request
     ↓
[Express Router] (src/routes/index.ts)
     ↓
[Module Router] (e.g., children.routes.ts)
     ↓
[Controller] (e.g., ChildProfileController.ts)
     ↓
[DTO Validation] (class-validator)
     ↓
[Service Layer] (e.g., ChildService.ts)
     ↓
[Business Logic]
     ↓
[Repository] (TypeORM)
     ↓
[Database] (PostgreSQL)
     ↓
[Response] ← [Controller] ← [Service]
     ↓
Client Response
```

---

## 📦 Module Dependencies

### Dependency Graph

```
┌─────────────────────────────────────────────┐
│         Child Profile (Core)                │
│  - Base entity for all other modules        │
└─────────────────┬───────────────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ↓             ↓             ↓
┌─────────┐ ┌──────────┐ ┌─────────────┐
│Placement│ │Safeguard.│ │Education    │
└────┬────┘ └─────┬────┘ └──────┬──────┘
     │            │              │
     └────────────┼──────────────┘
                  ↓
         ┌────────────────┐
         │  Care Planning │
         │   (Aggregates) │
         └────────────────┘
```

### Module Relationships

**Child Profile** (1) → (Many) **Placements**
**Child Profile** (1) → (Many) **Safeguarding Concerns**
**Child Profile** (1) → (Many) **Education Plans**
**Child Profile** (1) → (Many) **Health Assessments**
**Child Profile** (1) → (Many) **Family Members**
**Child Profile** (1) → (Many) **Care Plans**

**UASC** extends **Child Profile** with additional fields

**Leaving Care** operates on **Child** aged 16+

---

## 🗄️ Entity Relationships

### Core Entities (23 Total)

```typescript
// Module 1: Child Profile
Child {
  id: uuid
  firstName: string
  lastName: string
  dateOfBirth: Date
  legalStatus: LegalStatus
  // ... 80+ fields
}

// Module 2: Placement Management
Placement {
  id: uuid
  child: Child           // ManyToOne
  type: PlacementType
  startDate: Date
  endDate?: Date
  transitions: []        // OneToMany
}

PlacementTransition {
  id: uuid
  placement: Placement   // ManyToOne
  fromPlacement?: Placement
  transitionDate: Date
  riskLevel: RiskLevel
}

// Module 3: Safeguarding
SafeguardingConcern {
  id: uuid
  child: Child          // ManyToOne
  category: ConcernCategory
  riskLevel: RiskLevel
  reportedDate: Date
  investigation?: Investigation
}

RiskAssessment {
  id: uuid
  child: Child          // ManyToOne
  concern: SafeguardingConcern
  riskScore: number
  mitigatingFactors: string[]
}

Investigation {
  id: uuid
  concern: SafeguardingConcern  // OneToOne
  investigationType: string
  outcome?: string
}

// Module 4: Education
PersonalEducationPlan {
  id: uuid
  child: Child          // ManyToOne
  academicYear: string
  targets: PEPTarget[]
  attendance: EducationAttendance[]
}

EducationAttendance {
  id: uuid
  pep: PersonalEducationPlan
  attendancePercentage: number
  exclusions: number
}

// Module 5: Health
HealthInitialAssessment {
  id: uuid
  child: Child          // ManyToOne
  assessmentDate: Date
  healthConditions: string[]
  medications: string[]
}

HealthReviewAssessment {
  id: uuid
  child: Child          // ManyToOne
  reviewDate: Date
  previousAssessment: HealthInitialAssessment
}

// Module 6: Family & Contact
FamilyMember {
  id: uuid
  child: Child          // ManyToOne
  relationship: RelationshipType
  parentalResponsibility: boolean
  contactArrangements: ContactArrangement[]
}

ContactArrangement {
  id: uuid
  child: Child          // ManyToOne
  familyMember: FamilyMember
  frequency: ContactFrequency
  supervised: boolean
}

// Module 7: Care Planning
CarePlan {
  id: uuid
  child: Child          // ManyToOne
  planDate: Date
  reviews: CarePlanReview[]
  status: PlanStatus
}

CarePlanReview {
  id: uuid
  carePlan: CarePlan    // ManyToOne
  reviewDate: Date
  nextReviewDate: Date
  iroName: string
}

// Module 8: Leaving Care
PathwayPlan {
  id: uuid
  youngPerson: Child    // ManyToOne (16-25)
  personalAdvisor: string
  accommodationPlan: string
  financialSupport: string[]
}

LeavingCareAssessment {
  id: uuid
  youngPerson: Child    // ManyToOne
  assessmentDate: Date
  needsIdentified: string[]
}

// Module 9: UASC
UASCProfile {
  id: uuid
  child: Child          // OneToOne
  countryOfOrigin: string
  arrivalDate: Date
  nationalTransferScheme: boolean
  immigrationStatus: ImmigrationStatus
}

ImmigrationStatus {
  id: uuid
  uascProfile: UASCProfile
  currentStatus: string
  homeOfficeReference: string
  applications: AsylumApplication[]
}

AgeAssessment {
  id: uuid
  uascProfile: UASCProfile
  assessmentDate: Date
  assessedAge: number
  mertonCompliant: boolean
}

HomeOfficeReferral {
  id: uuid
  uascProfile: UASCProfile
  referralDate: Date
  referenceNumber: string
  status: string
}

AsylumApplication {
  id: uuid
  immigrationStatus: ImmigrationStatus
  applicationDate: Date
  decisionDate?: Date
  outcome?: string
  appeals: Appeal[]
}

Appeal {
  id: uuid
  application: AsylumApplication
  appealDate: Date
  grounds: string
  outcome?: string
}
```

---

## 🔌 API Layer

### Route Registration

```typescript
// src/routes/index.ts
import { Router } from 'express';

// Import all module routes
import childrenRoutes from '../domains/children/routes/children.routes';
import placementRoutes from '../domains/placements/routes/placement.routes';
// ... other imports

const router = Router();

// Register module routes
router.use('/v1/children', childrenRoutes);
router.use('/v1/placements', placementRoutes);
router.use('/v1/safeguarding', safeguardingRoutes);
router.use('/v1/education', educationRoutes);
router.use('/v1/child-health', childHealthRoutes);
router.use('/v1/family-contact', familyContactRoutes);
router.use('/v1/care-planning', carePlanningRoutes);
router.use('/v1/leaving-care', leavingCareRoutes);
router.use('/v1/uasc', uascRoutes);

export default router;
```

### Controller Structure

```typescript
// Example: ChildProfileController.ts
export class ChildProfileController {
  private childService: ChildService;

  constructor() {
    this.childService = new ChildService();
  }

  // Create child
  async create(req: Request, res: Response): Promise<Response> {
    try {
      const dto: CreateChildDto = req.body;
      const child = await this.childService.createChild(dto);
      return res.status(201).json(child);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Get child by ID
  async getById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const child = await this.childService.getChildById(id);
      return res.status(200).json(child);
    } catch (error) {
      return res.status(404).json({ error: 'Child not found' });
    }
  }

  // List all children
  async list(req: Request, res: Response): Promise<Response> {
    const children = await this.childService.getAllChildren();
    return res.status(200).json(children);
  }

  // Update child
  async update(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const dto: UpdateChildDto = req.body;
      const child = await this.childService.updateChild(id, dto);
      return res.status(200).json(child);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  // Soft delete child
  async delete(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      await this.childService.softDeleteChild(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Services)

```typescript
describe('ChildService', () => {
  let service: ChildService;
  let mockRepository: jest.Mocked<Repository<Child>>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    } as any;

    service = new ChildService(mockRepository);
  });

  it('should create a child', async () => {
    const dto: CreateChildDto = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('2010-01-01'),
    };

    mockRepository.save.mockResolvedValue({ id: '123', ...dto } as Child);

    const result = await service.createChild(dto);

    expect(result.firstName).toBe('John');
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### Integration Tests (Controllers + Services)

```typescript
describe('ChildProfileController Integration', () => {
  let app: Express;

  beforeAll(async () => {
    await setupTestDatabase();
    app = createTestApp();
  });

  it('POST /v1/children should create a child', async () => {
    const response = await request(app)
      .post('/api/v1/children')
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '2012-05-15',
      })
      .expect(201);

    expect(response.body.id).toBeDefined();
    expect(response.body.firstName).toBe('Jane');
  });
});
```

---

## 📊 Performance Considerations

### Database Indexes

```typescript
@Entity('child')
@Index(['lastName', 'firstName']) // Common search pattern
@Index(['dateOfBirth'])
@Index(['legalStatus'])
@Index(['deleted'], { where: 'deleted = false' }) // Active children
export class Child {
  // ...
}
```

### Query Optimization

```typescript
// Eager loading related entities
await childRepository.findOne({
  where: { id },
  relations: ['placements', 'safeguardingConcerns', 'carePlans'],
});

// Lazy loading for large datasets
const children = await childRepository.find({
  select: ['id', 'firstName', 'lastName'], // Only needed fields
  where: { deleted: false },
  order: { lastName: 'ASC' },
  skip: offset,
  take: limit,
});
```

### Caching Strategy

```typescript
// Redis cache for frequently accessed data
const cacheKey = `child:${childId}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const child = await childRepository.findOne({ where: { id: childId } });
await redis.setex(cacheKey, 3600, JSON.stringify(child)); // 1 hour TTL

return child;
```

---

## 🔐 Security Architecture

### Authentication Flow

```
Client → JWT Token in Authorization header
         ↓
Middleware validates token
         ↓
Extract user info (id, role, organization)
         ↓
Attach to request object
         ↓
Controller has access to authenticated user
         ↓
Service applies tenant isolation
```

### Authorization (RBAC)

```typescript
// Role-based permissions
enum Permission {
  CHILDREN_CREATE = 'children:create',
  CHILDREN_READ = 'children:read',
  CHILDREN_UPDATE = 'children:update',
  CHILDREN_DELETE = 'children:delete',
  SAFEGUARDING_MANAGE = 'safeguarding:manage',
  // ... more permissions
}

// Middleware checks permissions
const requirePermission = (permission: Permission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};

// Usage in routes
router.post(
  '/children',
  authenticateJWT,
  requirePermission(Permission.CHILDREN_CREATE),
  controller.create
);
```

---

## 📝 Code Quality Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### Code Standards
- ✅ Zero mocks in production code
- ✅ Zero placeholders (no `// TODO: implement`)
- ✅ Zero `any` types (use proper TypeScript types)
- ✅ Comprehensive JSDoc comments
- ✅ Consistent naming conventions
- ✅ Error handling in all async functions

---

**Document Version**: 1.0  
**Last Updated**: October 10, 2025  
**Status**: Production Ready ✅
