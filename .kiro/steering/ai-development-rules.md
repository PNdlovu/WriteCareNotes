---
inclusion: always
---

# WriteCareNotes AI Development Rules - Anti-Hallucination Framework

## Core AI Behavior Rules

### 1. Strict File Creation Verification
**RULE**: Every file created MUST be verified to exist and contain expected content
```typescript
// Before marking any task complete, verify:
interface FileVerification {
  fileExists: boolean;
  contentMatches: boolean;
  testsPass: boolean;
  documentationComplete: boolean;
  complianceChecked: boolean;
}
```

**Implementation**:
- Always use `readFile` to verify created files
- Check file content matches the intended implementation
- Verify all imports and exports work correctly
- Ensure no placeholder or TODO comments remain

### 2. No Placeholder Code Policy
**RULE**: Never create placeholder, stub, or incomplete implementations

**Forbidden Patterns**:
```typescript
// ❌ NEVER DO THIS
function createResident() {
  // TODO: Implement this
  throw new Error('Not implemented');
}

// ❌ NEVER DO THIS
const ResidentService = {
  // Implementation coming soon
};

// ❌ NEVER DO THIS
// This will be implemented later
```

**Required Pattern**:
```typescript
// ✅ ALWAYS DO THIS - Complete implementation
/**
 * @fileoverview Resident service for WriteCareNotes
 * @module ResidentService
 * @compliance CQC, Care Inspectorate, CIW, RQIA
 */
class ResidentService {
  async createResident(data: CreateResidentRequest): Promise<Resident> {
    // Full implementation with validation, error handling, audit logging
    const validatedData = await this.validateResidentData(data);
    const resident = await this.repository.create(validatedData);
    await this.auditLogger.log('RESIDENT_CREATED', resident.id);
    return resident;
  }
}
```

### 3. Complete Module Implementation Rule
**RULE**: When implementing a module, create ALL required files in one task

**Required Files for Each Module**:
- Service class with full business logic
- Repository with database operations
- API routes with all endpoints
- Validation schemas
- TypeScript types and interfaces
- Unit tests (90%+ coverage)
- Integration tests
- API documentation
- Frontend components (if applicable)

### 4. Healthcare Compliance Verification
**RULE**: Every implementation MUST include healthcare compliance checks

**Required Compliance Elements**:
```typescript
interface ComplianceRequirements {
  gdprCompliance: {
    consentTracking: boolean;
    dataSubjectRights: boolean;
    auditTrail: boolean;
  };
  
  nhsStandards: {
    nhsNumberValidation: boolean;
    snomedCoding: boolean;
    dataStandards: boolean;
  };
  
  regulatoryCompliance: {
    cqcRequirements: boolean;
    careInspectorateStandards: boolean;
    ciwCompliance: boolean;
    rqiaStandards: boolean;
  };
  
  securityCompliance: {
    dataEncryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
  };
}
```

### 5. Test-Driven Development Enforcement
**RULE**: Tests MUST be written and passing before implementation is considered complete

**Required Test Coverage**:
- Unit tests: 90%+ code coverage
- Integration tests: All API endpoints
- E2E tests: Critical user workflows
- Security tests: Authentication, authorization, data protection
- Performance tests: Response time requirements

**Test Verification Process**:
```bash
# These commands MUST pass before task completion
npm run test:unit
npm run test:integration  
npm run test:e2e
npm run test:security
npm run test:performance
npm run test:coverage
```

### 6. API Documentation Verification
**RULE**: All API endpoints MUST have complete OpenAPI documentation

**Required Documentation Elements**:
- Complete request/response schemas
- All possible HTTP status codes
- Authentication requirements
- Rate limiting information
- Healthcare-specific validation rules
- Example requests and responses
- Error response formats

### 7. Database Integration Verification
**RULE**: All database operations MUST be tested and verified

**Required Database Elements**:
- Migration files that run successfully
- Proper indexes for performance
- Foreign key constraints
- Audit trail columns
- Seed data for testing
- Rollback procedures

### 8. Security Implementation Verification
**RULE**: All security measures MUST be implemented and tested

**Required Security Elements**:
```typescript
interface SecurityChecklist {
  inputValidation: boolean;        // Joi/Zod validation
  sqlInjectionPrevention: boolean; // Parameterized queries
  xssProtection: boolean;          // Input sanitization
  csrfProtection: boolean;         // CSRF tokens
  dataEncryption: boolean;         // AES-256 for PII
  auditLogging: boolean;           // All operations logged
  rbacImplementation: boolean;     // Role-based access control
  rateLimit: boolean;             // API rate limiting
}
```

### 9. Integration Testing Rules
**RULE**: All external integrations MUST be tested with proper mocking

**Required Integration Tests**:
- NHS Digital API integration
- CQC/regulatory body integrations
- Pharmacy system integrations
- Insurance system integrations
- Email/SMS notification services

### 10. Performance Verification Rules
**RULE**: All implementations MUST meet performance requirements

**Performance Targets**:
```typescript
const PERFORMANCE_REQUIREMENTS = {
  apiResponseTime: '< 200ms',
  databaseQueryTime: '< 100ms',
  pageLoadTime: '< 2000ms',
  concurrentUsers: 500,
  throughput: '1000 requests/second',
};
```

## AI Behavior Constraints

### 11. No Assumption Making
**RULE**: Never assume implementation details not explicitly specified

**When Uncertain**:
- Ask specific questions about requirements
- Reference the requirements document
- Check the design document
- Consult healthcare compliance guidelines
- Verify with file structure map
- Review module specifications document
- Check system design document

### 11.1 Module Implementation Requirements
**RULE**: Every module MUST follow the specifications in module-specifications.md

**Required Module Components**:
```typescript
interface ModuleImplementation {
  // Core Service Layer
  mainService: ModuleMainService;
  businessLogic: BusinessLogicServices[];
  dataAccess: RepositoryServices[];
  
  // API Layer
  controllers: ControllerClasses[];
  routes: RouteDefinitions[];
  validators: ValidationSchemas[];
  middleware: MiddlewareComponents[];
  
  // Frontend Layer
  components: ReactComponents[];
  pages: PageComponents[];
  hooks: CustomHooks[];
  services: FrontendServices[];
  
  // Testing Layer
  unitTests: UnitTestSuites[];
  integrationTests: IntegrationTestSuites[];
  e2eTests: E2ETestSuites[];
  
  // Documentation
  apiDocs: OpenAPISpecification;
  moduleReadme: ModuleDocumentation;
  userGuide: UserDocumentation;
}
```

### 11.2 Enterprise Feature Requirements
**RULE**: All implementations MUST meet enterprise-grade standards

**Enterprise Standards Checklist**:
- [ ] Scalability: Support for 1000+ concurrent users
- [ ] Performance: API responses < 200ms, database queries < 100ms
- [ ] Security: Field-level encryption, RBAC, audit trails
- [ ] Compliance: GDPR, healthcare regulations, financial regulations
- [ ] Reliability: 99.9% uptime, automated failover, disaster recovery
- [ ] Monitoring: Comprehensive logging, metrics, alerting
- [ ] Integration: RESTful APIs, event-driven architecture, external system integration

### 12. Incremental Verification
**RULE**: Verify each step before proceeding to the next

**Verification Process**:
1. Create file
2. Verify file exists with `readFile`
3. Check content is complete and correct
4. Run tests to ensure functionality
5. Verify integration with existing code
6. Check compliance requirements
7. Update documentation
8. Mark task as complete

### 13. Error Handling Requirements
**RULE**: All code MUST include comprehensive error handling

**Required Error Handling**:
```typescript
interface ErrorHandling {
  inputValidation: 'Joi schema validation with healthcare rules';
  businessLogicErrors: 'Custom error classes with error codes';
  databaseErrors: 'Connection, constraint, and transaction errors';
  externalApiErrors: 'Network, timeout, and service errors';
  authenticationErrors: 'JWT, session, and permission errors';
  complianceErrors: 'GDPR, regulatory, and audit errors';
}
```

### 14. Documentation Completeness Rule
**RULE**: All code MUST include comprehensive documentation

**Required Documentation**:
- JSDoc comments for all functions and classes
- README files for each module
- API documentation with examples
- Database schema documentation
- Deployment and configuration guides
- Troubleshooting guides

### 15. Compliance Audit Trail
**RULE**: All operations MUST be auditable for regulatory compliance

**Audit Requirements**:
```typescript
interface AuditTrail {
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  correlationId: string;
  complianceFlags: ComplianceFlag[];
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}
```

### 16. Module-Specific Implementation Rules

#### 16.1 Financial Module Rules
**RULE**: All financial calculations MUST be precise and auditable

**Financial Implementation Requirements**:
```typescript
interface FinancialCalculation {
  calculation: DecimalCalculation; // Use decimal.js for precision
  auditTrail: CalculationAuditTrail;
  validation: FinancialValidation;
  compliance: FinancialCompliance;
}

// Required for all financial calculations
const FINANCIAL_PRECISION = 4; // 4 decimal places
const CURRENCY_PRECISION = 2; // 2 decimal places for currency
```

#### 16.2 Healthcare Module Rules
**RULE**: All healthcare data MUST follow NHS standards and clinical safety

**Healthcare Implementation Requirements**:
```typescript
interface HealthcareData {
  nhsNumberValidation: NHSNumberValidator;
  clinicalSafety: ClinicalSafetyChecker;
  medicationSafety: MedicationSafetyValidator;
  gdprCompliance: GDPRComplianceChecker;
}
```

#### 16.3 HR and Payroll Module Rules
**RULE**: All HR and payroll operations MUST comply with UK employment law

**HR/Payroll Implementation Requirements**:
```typescript
interface HRPayrollCompliance {
  employmentLaw: EmploymentLawChecker;
  taxCompliance: TaxComplianceValidator;
  pensionCompliance: PensionComplianceChecker;
  workingTimeRegulations: WorkingTimeValidator;
}
```

### 17. Performance and Scalability Rules

#### 17.1 Database Performance Rules
**RULE**: All database operations MUST be optimized for enterprise scale

**Database Optimization Requirements**:
- Use proper indexing for all query patterns
- Implement connection pooling with appropriate limits
- Use prepared statements to prevent SQL injection
- Implement query timeout and retry mechanisms
- Use database partitioning for large tables (audit logs, historical data)

#### 17.2 API Performance Rules
**RULE**: All APIs MUST meet performance targets

**API Performance Requirements**:
```typescript
interface APIPerformanceTargets {
  responseTime: '< 200ms for 95th percentile';
  throughput: '> 1000 requests per minute';
  concurrency: '> 500 concurrent users';
  availability: '99.9% uptime';
}
```

### 18. Integration Rules

#### 18.1 External System Integration Rules
**RULE**: All external integrations MUST be resilient and secure

**Integration Requirements**:
```typescript
interface ExternalIntegration {
  circuitBreaker: CircuitBreakerPattern;
  retryMechanism: ExponentialBackoffRetry;
  authentication: SecureAuthentication;
  dataValidation: InputOutputValidation;
  errorHandling: ComprehensiveErrorHandling;
}
```

#### 18.2 Event-Driven Architecture Rules
**RULE**: All inter-service communication MUST use events where appropriate

**Event Architecture Requirements**:
```typescript
interface EventDrivenCommunication {
  eventSourcing: EventSourcingPattern;
  eventStore: EventStoreImplementation;
  eventHandlers: EventHandlerServices;
  eventValidation: EventSchemaValidation;
}
```

## Quality Gates

### Before Task Completion Checklist
- [ ] All files created and verified to exist
- [ ] No placeholder or TODO code
- [ ] All tests written and passing (90%+ coverage)
- [ ] API documentation complete and accurate
- [ ] Database migrations tested
- [ ] Security measures implemented and tested
- [ ] Healthcare compliance verified
- [ ] Performance requirements met
- [ ] Error handling comprehensive
- [ ] Documentation complete
- [ ] Integration with existing code verified
- [ ] Audit trail implemented

### Verification Commands
```bash
# Run these commands to verify task completion
npm run lint                    # Code quality check
npm run test:all               # All tests pass
npm run test:coverage          # 90%+ coverage
npm run build                  # Build succeeds
npm run security:scan          # Security scan passes
npm run docs:generate          # Documentation generates
npm run db:migrate:test        # Database migrations work
npm run api:test               # API tests pass
```

## Anti-Hallucination Measures

### 1. Fact Verification
- Always reference existing documentation
- Verify against healthcare standards
- Check regulatory requirements
- Confirm with established patterns

### 2. Implementation Verification
- Test all code before claiming completion
- Verify file creation with read operations
- Check integration points work correctly
- Validate against requirements

### 3. Compliance Verification
- Check against CQC/Care Inspectorate/CIW/RQIA standards
- Verify GDPR compliance
- Ensure NHS data standards compliance
- Validate security requirements

### 4. Quality Verification
- Run all tests and verify they pass
- Check code coverage meets 90% requirement
- Verify performance benchmarks
- Ensure documentation is complete and accurate

This framework ensures that AI development remains focused, accurate, and compliant with healthcare industry standards while preventing hallucination and ensuring real, working implementations.