# WriteCareNotes Master Implementation Guide

## 🎯 **PRIMARY AI IMPLEMENTATION REFERENCE**

**This document serves as the definitive guide for AI implementation of WriteCareNotes modules.**

All AI agents implementing WriteCareNotes features MUST use this guide as the primary reference, supplemented by:
1. **Module-specific files** in `.kiro/specs/care-home-management-system/modules/`
2. **Healthcare compliance rules** in `.kiro/steering/healthcare-compliance.md`
3. **Development standards** in `.kiro/steering/development-standards.md`
4. **API design standards** in `.kiro/steering/api-design-standards.md`

## 📋 **IMPLEMENTATION HIERARCHY**

### **Priority 1: Core Care Management (MUST IMPLEMENT FIRST)**
1. **Resident Management Service** - Foundation for all care operations
2. **Medication Management Service** - Critical safety system with 10-step verification
3. **Risk Assessment Service** - Comprehensive risk management for all care types
4. **Care Planning Service** - Individualized care plan management

### **Priority 2: Operational Management**
5. **Staff Management Service** - Staff profiles, qualifications, scheduling
6. **Bed Management Service** - Occupancy optimization and revenue management
7. **Emergency Management Service** - Critical safety and response systems
8. **Communication Service** - Family portal and staff communication

### **Priority 3: Business Management**
9. **HR Management Service** - Complete employee lifecycle management
10. **Payroll Service** - Automated payroll with tax optimization
11. **Financial Management Service** - Accounting and financial operations
12. **Compliance Service** - Regulatory reporting and audit management

### **Priority 4: Advanced Features**
13. **Analytics Service** - Business intelligence and predictive analytics
14. **Integration Hub** - External system integrations
15. **AI Assistant Service** - Care notes automation and insights

## 🏗️ **MANDATORY IMPLEMENTATION STANDARDS**

### **Every Module MUST Include:**

#### **1. Complete Service Architecture**
```typescript
interface ModuleService {
  // Core business logic services
  mainService: MainBusinessService;
  dataService: DataManagementService;
  validationService: ValidationService;
  
  // Healthcare compliance services
  auditService: AuditTrailService;
  complianceService: ComplianceCheckService;
  securityService: DataSecurityService;
  
  // Integration services
  eventService: EventPublishingService;
  notificationService: NotificationService;
  integrationService: ExternalIntegrationService;
}
```

#### **2. Healthcare Compliance Implementation**
```typescript
interface HealthcareCompliance {
  // GDPR and Data Protection
  gdprCompliance: GDPRComplianceService;
  dataEncryption: FieldLevelEncryptionService;
  consentManagement: ConsentManagementService;
  
  // NHS and Clinical Standards
  nhsStandardsCompliance: NHSStandardsService;
  clinicalSafety: ClinicalSafetyService;
  medicationSafety: MedicationSafetyService;
  
  // Regulatory Compliance
  cqcCompliance: CQCComplianceService;
  careInspectorateCompliance: CareInspectorateService;
  ciwCompliance: CIWComplianceService;
  rqiaCompliance: RQIAComplianceService;
  
  // Audit and Monitoring
  auditTrail: ComprehensiveAuditService;
  complianceMonitoring: RealTimeComplianceService;
  riskManagement: RiskManagementService;
}
```

#### **3. Mandatory API Structure**
```typescript
// Every module MUST implement these API patterns:

// CRUD Operations (minimum 5 endpoints)
POST   /api/v1/{module}                    // Create
GET    /api/v1/{module}                    // List with filtering
GET    /api/v1/{module}/{id}               // Get by ID
PUT    /api/v1/{module}/{id}               // Update (full)
PATCH  /api/v1/{module}/{id}               // Update (partial)
DELETE /api/v1/{module}/{id}               // Soft delete

// Healthcare-Specific Operations (minimum 10 additional endpoints)
GET    /api/v1/{module}/{id}/audit-trail   // Audit history
POST   /api/v1/{module}/{id}/risk-assess   // Risk assessment
GET    /api/v1/{module}/compliance-status  // Compliance check
POST   /api/v1/{module}/bulk-operations    // Bulk operations
GET    /api/v1/{module}/analytics          // Analytics data
POST   /api/v1/{module}/export             // Data export
GET    /api/v1/{module}/search             // Advanced search
POST   /api/v1/{module}/validate           // Data validation
GET    /api/v1/{module}/reports            // Standard reports
POST   /api/v1/{module}/notifications      // Send notifications

// Integration Endpoints (minimum 5 endpoints)
POST   /api/v1/{module}/sync               // External sync
GET    /api/v1/{module}/integration-status // Integration health
POST   /api/v1/{module}/webhook            // Webhook handler
GET    /api/v1/{module}/events             // Event stream
POST   /api/v1/{module}/import             // Data import
```

#### **4. Required Data Models (Minimum 5 per module)**
```typescript
// Core Entity Model
interface CoreEntity {
  id: UUID;
  version: number;
  createdAt: DateTime;
  updatedAt: DateTime;
  createdBy: UserReference;
  updatedBy: UserReference;
  deletedAt?: DateTime;
  deletedBy?: UserReference;
}

// Audit Trail Model
interface AuditTrail {
  id: UUID;
  entityType: string;
  entityId: UUID;
  action: AuditAction;
  userId: UUID;
  timestamp: DateTime;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  correlationId: UUID;
  ipAddress: string;
  userAgent: string;
  clinicalJustification?: string;
  gdprLawfulBasis: GDPRLawfulBasis;
}

// Compliance Record Model
interface ComplianceRecord {
  id: UUID;
  entityId: UUID;
  complianceType: ComplianceType;
  status: ComplianceStatus;
  checkDate: DateTime;
  nextCheckDate: DateTime;
  findings: ComplianceFinding[];
  remedialActions: RemedialAction[];
  verifiedBy: UserReference;
}

// Risk Assessment Model
interface RiskAssessment {
  id: UUID;
  entityId: UUID;
  riskType: RiskType;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: RiskFactor[];
  mitigationStrategies: MitigationStrategy[];
  assessmentDate: DateTime;
  nextReviewDate: DateTime;
  assessedBy: UserReference;
}

// Integration Event Model
interface IntegrationEvent {
  id: UUID;
  eventType: string;
  entityType: string;
  entityId: UUID;
  payload: Record<string, any>;
  timestamp: DateTime;
  source: string;
  destination?: string;
  status: EventStatus;
  retryCount: number;
  correlationId: UUID;
}
```

## 🏥 **HEALTHCARE-SPECIFIC IMPLEMENTATION REQUIREMENTS**

### **Medication Management (CRITICAL SAFETY)**
```typescript
// 10-Step Medication Verification Process
interface MedicationVerification {
  step1_patientIdentification: PatientVerification;
  step2_medicationVerification: MedicationVerification;
  step3_dosageVerification: DosageVerification;
  step4_routeVerification: RouteVerification;
  step5_timeVerification: TimeVerification;
  step6_allergyCheck: AllergyVerification;
  step7_interactionCheck: InteractionVerification;
  step8_contraIndicationCheck: ContraIndicationVerification;
  step9_clinicalReview: ClinicalReviewVerification;
  step10_doubleCheck: SecondPersonVerification;
}

// Medication Safety Implementation
class MedicationSafetyService {
  async administerMedication(request: MedicationAdministrationRequest): Promise<MedicationAdministrationResult> {
    // MANDATORY: All 10 steps must pass before administration
    const verification = await this.performTenStepVerification(request);
    
    if (!verification.allStepsPassed) {
      throw new MedicationSafetyError('Medication verification failed', verification.failedSteps);
    }
    
    // Record administration with complete audit trail
    const administration = await this.recordAdministration(request, verification);
    
    // Send real-time notifications for critical medications
    if (request.medication.isCritical) {
      await this.notificationService.sendCriticalMedicationAlert(administration);
    }
    
    return administration;
  }
}
```

### **NHS Number Validation (MANDATORY)**
```typescript
class NHSNumberValidator {
  validateNHSNumber(nhsNumber: string): ValidationResult {
    // Remove spaces and validate format
    const cleanNumber = nhsNumber.replace(/\s/g, '');
    
    if (!/^\d{10}$/.test(cleanNumber)) {
      return { valid: false, error: 'NHS number must be 10 digits' };
    }
    
    // Validate check digit using NHS algorithm
    const digits = cleanNumber.split('').map(Number);
    const checkDigit = digits[9];
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += digits[i] * (10 - i);
    }
    
    const remainder = sum % 11;
    const calculatedCheckDigit = 11 - remainder;
    
    if (calculatedCheckDigit === 11 && checkDigit === 0) return { valid: true };
    if (calculatedCheckDigit === 10) return { valid: false, error: 'Invalid NHS number' };
    if (calculatedCheckDigit === checkDigit) return { valid: true };
    
    return { valid: false, error: 'NHS number check digit validation failed' };
  }
}
```

### **GDPR Compliance (MANDATORY)**
```typescript
class GDPRComplianceService {
  async processPersonalData(data: PersonalData, purpose: ProcessingPurpose): Promise<ProcessingResult> {
    // Check lawful basis for processing
    const lawfulBasis = await this.determineLawfulBasis(purpose);
    
    // Verify consent if required
    if (lawfulBasis === 'consent') {
      const consent = await this.verifyConsent(data.subjectId, purpose);
      if (!consent.valid) {
        throw new GDPRComplianceError('Valid consent required for processing');
      }
    }
    
    // Apply data minimization
    const minimizedData = this.applyDataMinimization(data, purpose);
    
    // Encrypt sensitive data
    const encryptedData = await this.encryptSensitiveFields(minimizedData);
    
    // Log processing activity
    await this.logProcessingActivity({
      subjectId: data.subjectId,
      purpose,
      lawfulBasis,
      dataTypes: Object.keys(minimizedData),
      timestamp: new Date(),
      retentionPeriod: this.calculateRetentionPeriod(purpose)
    });
    
    return { processedData: encryptedData, lawfulBasis };
  }
}
```

## 🔒 **SECURITY IMPLEMENTATION REQUIREMENTS**

### **Field-Level Encryption (MANDATORY for PII)**
```typescript
class FieldLevelEncryption {
  // Encrypt all PII fields
  async encryptPII(data: PersonalData): Promise<EncryptedPersonalData> {
    return {
      firstName: await this.encrypt(data.firstName),
      lastName: await this.encrypt(data.lastName),
      dateOfBirth: await this.encrypt(data.dateOfBirth.toISOString()),
      nhsNumber: await this.encrypt(data.nhsNumber),
      address: await this.encrypt(JSON.stringify(data.address)),
      phoneNumber: await this.encrypt(data.phoneNumber),
      emailAddress: await this.encrypt(data.emailAddress)
    };
  }
  
  private async encrypt(value: string): Promise<string> {
    // Use AES-256-GCM with unique IV for each field
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', this.encryptionKey);
    cipher.setAAD(Buffer.from('healthcare-pii'));
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }
}
```

### **Audit Trail Implementation (MANDATORY)**
```typescript
class ComprehensiveAuditService {
  async logOperation(operation: AuditableOperation): Promise<void> {
    const auditEntry: AuditTrail = {
      id: generateUUID(),
      entityType: operation.entityType,
      entityId: operation.entityId,
      action: operation.action,
      userId: operation.userId,
      timestamp: new Date(),
      oldValues: operation.oldValues,
      newValues: operation.newValues,
      correlationId: operation.correlationId,
      ipAddress: operation.ipAddress,
      userAgent: operation.userAgent,
      clinicalJustification: operation.clinicalJustification,
      gdprLawfulBasis: operation.gdprLawfulBasis
    };
    
    // Store in audit database (separate from operational data)
    await this.auditRepository.create(auditEntry);
    
    // Send to audit event stream for real-time monitoring
    await this.eventPublisher.publish('audit.operation', auditEntry);
    
    // Check for compliance violations
    await this.complianceMonitor.checkViolations(auditEntry);
  }
}
```

## 📊 **PERFORMANCE REQUIREMENTS**

### **Response Time Targets**
```typescript
interface PerformanceTargets {
  // API Response Times (95th percentile)
  simpleQueries: '< 100ms';
  complexQueries: '< 200ms';
  reportGeneration: '< 2000ms';
  dataExport: '< 5000ms';
  
  // Database Performance
  simpleDbQueries: '< 50ms';
  complexDbQueries: '< 100ms';
  bulkOperations: '< 1000ms';
  
  // Frontend Performance
  pageLoad: '< 2000ms';
  componentRender: '< 100ms';
  formSubmission: '< 500ms';
  
  // Concurrent Users
  supportedUsers: 1000;
  peakLoadCapacity: 2000;
}
```

### **Caching Strategy (MANDATORY)**
```typescript
class CachingService {
  // Multi-level caching strategy
  async getCachedData<T>(key: string, fetchFunction: () => Promise<T>, ttl: number = 300): Promise<T> {
    // Level 1: In-memory cache
    let data = this.memoryCache.get(key);
    if (data) return data;
    
    // Level 2: Redis cache
    data = await this.redisCache.get(key);
    if (data) {
      this.memoryCache.set(key, data, ttl / 10); // Shorter TTL for memory
      return JSON.parse(data);
    }
    
    // Level 3: Database fetch
    data = await fetchFunction();
    
    // Cache at both levels
    await this.redisCache.setex(key, ttl, JSON.stringify(data));
    this.memoryCache.set(key, data, ttl / 10);
    
    return data;
  }
}
```

## 🧪 **TESTING REQUIREMENTS**

### **Mandatory Test Coverage**
```typescript
interface TestingRequirements {
  unitTestCoverage: '90%+';
  integrationTestCoverage: '80%+';
  e2eTestCoverage: '70%+';
  
  // Healthcare-Specific Tests
  medicationSafetyTests: 'All 10 steps verified';
  gdprComplianceTests: 'All data processing scenarios';
  auditTrailTests: 'Complete audit coverage';
  securityTests: 'Penetration testing passed';
  
  // Performance Tests
  loadTesting: '1000 concurrent users';
  stressTesting: '2000 concurrent users';
  enduranceTesting: '24 hour continuous operation';
}
```

### **Test Implementation Pattern**
```typescript
// Every service MUST have comprehensive tests
describe('ResidentManagementService', () => {
  describe('Healthcare Compliance', () => {
    it('should encrypt all PII fields', async () => {
      const resident = await service.createResident(testData);
      expect(resident.personalDetails.firstName).not.toBe(testData.firstName);
      expect(await encryption.decrypt(resident.personalDetails.firstName)).toBe(testData.firstName);
    });
    
    it('should validate NHS number format', async () => {
      const invalidData = { ...testData, nhsNumber: 'invalid' };
      await expect(service.createResident(invalidData)).rejects.toThrow('Invalid NHS number');
    });
    
    it('should create complete audit trail', async () => {
      await service.createResident(testData);
      const auditEntries = await auditService.getAuditTrail(testData.id);
      expect(auditEntries).toHaveLength(1);
      expect(auditEntries[0].action).toBe('CREATE');
    });
  });
});
```

## 🚀 **DEPLOYMENT REQUIREMENTS**

### **Infrastructure Standards**
```typescript
interface DeploymentStandards {
  // Container Requirements
  dockerImage: 'Node.js 18 Alpine with security patches';
  resourceLimits: {
    cpu: '500m - 2000m';
    memory: '512Mi - 4Gi';
  };
  
  // Health Checks
  livenessProbe: '/health/live';
  readinessProbe: '/health/ready';
  startupProbe: '/health/startup';
  
  // Security
  runAsNonRoot: true;
  readOnlyRootFilesystem: true;
  allowPrivilegeEscalation: false;
  
  // Monitoring
  metricsEndpoint: '/metrics';
  loggingFormat: 'structured JSON';
  tracingEnabled: true;
}
```

## 📋 **IMPLEMENTATION CHECKLIST**

### **Before Starting Any Module:**
- [ ] Read this Master Implementation Guide completely
- [ ] Review module-specific requirements in `/modules/{module-name}.md`
- [ ] Understand healthcare compliance requirements
- [ ] Set up development environment with all required tools
- [ ] Create comprehensive test plan

### **During Implementation:**
- [ ] Implement all mandatory API endpoints (minimum 20)
- [ ] Create all required data models (minimum 5)
- [ ] Add field-level encryption for all PII
- [ ] Implement complete audit trail logging
- [ ] Add NHS number validation where applicable
- [ ] Ensure GDPR compliance for all data processing
- [ ] Implement caching strategy
- [ ] Add comprehensive error handling
- [ ] Write unit tests (90%+ coverage)
- [ ] Write integration tests
- [ ] Add performance monitoring

### **Before Completion:**
- [ ] Run all tests and ensure they pass
- [ ] Verify performance meets targets
- [ ] Complete security review
- [ ] Validate healthcare compliance
- [ ] Generate API documentation
- [ ] Create deployment configuration
- [ ] Update module status to completed

## 🎯 **SUCCESS CRITERIA**

A module is considered **COMPLETE** only when:

1. **Functionality**: All required features implemented and tested
2. **Compliance**: Passes all healthcare compliance checks
3. **Security**: Passes security audit and penetration testing
4. **Performance**: Meets all performance targets
5. **Quality**: 90%+ test coverage with all tests passing
6. **Documentation**: Complete API documentation and user guides
7. **Integration**: Successfully integrates with other modules
8. **Deployment**: Successfully deploys and runs in production environment

## 📞 **SUPPORT AND ESCALATION**

If you encounter issues during implementation:

1. **Technical Issues**: Refer to development standards and API design guides
2. **Healthcare Compliance**: Refer to healthcare compliance documentation
3. **Security Concerns**: Refer to security implementation guides
4. **Performance Issues**: Refer to performance optimization guides
5. **Integration Problems**: Refer to integration architecture documentation

This Master Implementation Guide ensures consistent, compliant, and high-quality implementation across all WriteCareNotes modules while maintaining the highest standards of healthcare software development.