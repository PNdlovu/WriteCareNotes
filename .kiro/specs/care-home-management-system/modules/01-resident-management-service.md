# Resident Management Service

## Service Overview

The Resident Management Service is the core microservice responsible for managing the complete lifecycle of residents from admission to discharge. It handles all resident-related data, relationships, and workflows while ensuring compliance with healthcare regulations and data protection requirements.

## Business Capabilities

### Core Functions
- **Resident Lifecycle Management**: Complete admission to discharge workflow
- **Personal Information Management**: Secure handling of PII with encryption
- **Medical History Tracking**: Comprehensive medical record management
- **Family Relationship Management**: Complex family tree with consent management
- **Care Journey Tracking**: Visual timeline of resident's care progression
- **Emergency Contact Management**: Multiple emergency contacts with priority levels
- **Discharge Planning**: Comprehensive discharge workflows with follow-up coordination

### Advanced Features
- **NHS Integration**: Real-time patient data synchronization
- **GP Practice Integration**: Medical history and ongoing care coordination
- **Social Services Integration**: Care funding and support coordination
- **Predictive Analytics**: Risk prediction and early intervention alerts
- **Care Outcome Tracking**: Long-term care effectiveness measurement

## Technical Architecture

### Service Structure
```typescript
interface ResidentManagementService {
  // Core Services
  residentProfileService: ResidentProfileService;
  admissionService: AdmissionWorkflowService;
  dischargeService: DischargeWorkflowService;
  familyService: FamilyRelationshipService;
  careJourneyService: CareJourneyTrackingService;
  
  // Integration Services
  nhsIntegrationService: NHSDigitalIntegrationService;
  gpIntegrationService: GPPracticeIntegrationService;
  socialServicesService: SocialServicesIntegrationService;
  
  // Analytics Services
  riskAnalyticsService: ResidentRiskAnalyticsService;
  outcomeTrackingService: CareOutcomeTrackingService;
}
```

### Data Models

#### Resident Profile
```typescript
interface ResidentProfile {
  // Unique Identifiers
  id: UUID;
  residentNumber: string; // Care home specific identifier
  nhsNumber: EncryptedString; // NHS number (encrypted)
  
  // Personal Information (All Encrypted)
  personalDetails: EncryptedPersonalDetails;
  demographics: Demographics;
  preferences: ResidentPreferences;
  
  // Care Information
  careLevel: CareLevel;
  admissionDate: Date;
  dischargeDate?: Date;
  currentRoom: RoomAssignment;
  careStatus: ResidentStatus;
  
  // Medical Information
  medicalHistory: MedicalHistoryRecord[];
  allergies: AllergyRecord[];
  dietaryRequirements: DietaryRequirement[];
  mobilityAssessment: MobilityAssessment;
  cognitiveAssessment: CognitiveAssessment;
  
  // Legal and Financial
  mentalCapacityAssessment: MentalCapacityAssessment;
  powerOfAttorney: PowerOfAttorneyDetails[];
  advanceDirectives: AdvanceDirective[];
  fundingArrangements: FundingSource[];
  
  // Relationships
  familyMembers: FamilyMember[];
  emergencyContacts: EmergencyContact[];
  professionalContacts: ProfessionalContact[];
  
  // Care Journey
  careJourney: CareJourneyEvent[];
  carePlans: CarePlanReference[];
  assessments: AssessmentReference[];
  
  // GDPR and Compliance
  consentRecords: ConsentRecord[];
  dataProcessingAgreements: DataProcessingAgreement[];
  retentionSchedule: DataRetentionSchedule;
  
  // Audit Fields
  createdAt: DateTime;
  updatedAt: DateTime;
  createdBy: UserReference;
  updatedBy: UserReference;
  version: number;
}

interface EncryptedPersonalDetails {
  firstName: EncryptedString;
  lastName: EncryptedString;
  preferredName: EncryptedString;
  dateOfBirth: EncryptedDate;
  gender: Gender;
  nationality: string;
  religion: string;
  maritalStatus: MaritalStatus;
  previousAddress: EncryptedAddress;
  phoneNumber: EncryptedString;
  emailAddress: EncryptedString;
}

interface MedicalHistoryRecord {
  id: UUID;
  condition: string;
  diagnosisDate: Date;
  diagnosingPhysician: string;
  icd10Code: string;
  snomedCode: string;
  severity: Severity;
  status: ConditionStatus; // active, resolved, chronic
  treatmentHistory: TreatmentRecord[];
  notes: string;
  attachments: DocumentReference[];
}

interface FamilyMember {
  id: UUID;
  relationship: FamilyRelationship;
  personalDetails: EncryptedPersonalDetails;
  contactInformation: EncryptedContactInformation;
  emergencyContact: boolean;
  priority: number;
  consentToContact: boolean;
  consentToInformation: boolean;
  keyHolder: boolean;
  nextOfKin: boolean;
  powerOfAttorney: boolean;
  financialResponsibility: boolean;
}

interface CareJourneyEvent {
  id: UUID;
  eventType: CareJourneyEventType;
  eventDate: DateTime;
  description: string;
  outcome: string;
  involvedStaff: UserReference[];
  relatedDocuments: DocumentReference[];
  milestone: boolean;
  significance: EventSignificance;
}
```

### API Endpoints

#### Resident Management APIs
```typescript
// Resident CRUD Operations
POST   /api/v1/residents                    // Create new resident
GET    /api/v1/residents                    // List residents with filtering
GET    /api/v1/residents/{id}               // Get resident details
PUT    /api/v1/residents/{id}               // Update resident (full)
PATCH  /api/v1/residents/{id}               // Update resident (partial)
DELETE /api/v1/residents/{id}               // Soft delete resident

// Admission Workflow
POST   /api/v1/residents/admission          // Start admission process
GET    /api/v1/residents/{id}/admission     // Get admission status
PUT    /api/v1/residents/{id}/admission     // Update admission details
POST   /api/v1/residents/{id}/admission/complete // Complete admission

// Discharge Workflow
POST   /api/v1/residents/{id}/discharge     // Start discharge process
GET    /api/v1/residents/{id}/discharge     // Get discharge status
PUT    /api/v1/residents/{id}/discharge     // Update discharge details
POST   /api/v1/residents/{id}/discharge/complete // Complete discharge

// Family Management
GET    /api/v1/residents/{id}/family        // Get family members
POST   /api/v1/residents/{id}/family        // Add family member
PUT    /api/v1/residents/{id}/family/{familyId} // Update family member
DELETE /api/v1/residents/{id}/family/{familyId} // Remove family member

// Care Journey
GET    /api/v1/residents/{id}/journey       // Get care journey timeline
POST   /api/v1/residents/{id}/journey       // Add journey event
GET    /api/v1/residents/{id}/milestones    // Get care milestones

// Medical History
GET    /api/v1/residents/{id}/medical-history // Get medical history
POST   /api/v1/residents/{id}/medical-history // Add medical record
PUT    /api/v1/residents/{id}/medical-history/{recordId} // Update record

// Emergency Contacts
GET    /api/v1/residents/{id}/emergency-contacts // Get emergency contacts
POST   /api/v1/residents/{id}/emergency-contacts // Add emergency contact
PUT    /api/v1/residents/{id}/emergency-contacts/{contactId} // Update contact

// Analytics and Reporting
GET    /api/v1/residents/analytics          // Resident analytics
GET    /api/v1/residents/{id}/risk-assessment // Risk assessment
GET    /api/v1/residents/{id}/care-outcomes // Care outcome metrics
```

### Business Logic

#### Admission Workflow
```typescript
class AdmissionWorkflowService {
  async startAdmission(admissionRequest: AdmissionRequest): Promise<AdmissionProcess> {
    // 1. Validate admission request
    await this.validateAdmissionRequest(admissionRequest);
    
    // 2. Check bed availability
    const availableBed = await this.bedManagementService.findAvailableBed(
      admissionRequest.careLevel,
      admissionRequest.preferredRoom
    );
    
    // 3. Create resident profile
    const resident = await this.createResidentProfile(admissionRequest);
    
    // 4. Generate admission checklist
    const checklist = await this.generateAdmissionChecklist(resident);
    
    // 5. Schedule initial assessments
    await this.scheduleInitialAssessments(resident.id);
    
    // 6. Notify relevant staff
    await this.notificationService.notifyAdmissionTeam(resident);
    
    // 7. Create admission process record
    return await this.createAdmissionProcess(resident, checklist);
  }
  
  async completeAdmission(residentId: UUID, completionData: AdmissionCompletionData): Promise<void> {
    // 1. Validate all required documents
    await this.validateRequiredDocuments(residentId);
    
    // 2. Complete initial assessments
    await this.validateInitialAssessments(residentId);
    
    // 3. Assign to room
    await this.assignToRoom(residentId, completionData.roomId);
    
    // 4. Create initial care plan
    await this.carePlanningService.createInitialCarePlan(residentId);
    
    // 5. Update resident status
    await this.updateResidentStatus(residentId, ResidentStatus.ACTIVE);
    
    // 6. Generate welcome pack for family
    await this.generateWelcomePack(residentId);
    
    // 7. Schedule follow-up assessments
    await this.scheduleFollowUpAssessments(residentId);
  }
}
```

#### Risk Analytics
```typescript
class ResidentRiskAnalyticsService {
  async calculateRiskScore(residentId: UUID): Promise<RiskAssessment> {
    const resident = await this.getResident(residentId);
    
    // Calculate various risk factors
    const fallsRisk = await this.calculateFallsRisk(resident);
    const medicationRisk = await this.calculateMedicationRisk(resident);
    const nutritionalRisk = await this.calculateNutritionalRisk(resident);
    const cognitiveRisk = await this.calculateCognitiveRisk(resident);
    const socialRisk = await this.calculateSocialRisk(resident);
    
    // Use ML model for overall risk prediction
    const overallRisk = await this.mlRiskModel.predict({
      fallsRisk,
      medicationRisk,
      nutritionalRisk,
      cognitiveRisk,
      socialRisk,
      demographics: resident.demographics,
      medicalHistory: resident.medicalHistory
    });
    
    return {
      residentId,
      overallRiskScore: overallRisk.score,
      riskLevel: this.categorizeRisk(overallRisk.score),
      riskFactors: {
        falls: fallsRisk,
        medication: medicationRisk,
        nutritional: nutritionalRisk,
        cognitive: cognitiveRisk,
        social: socialRisk
      },
      recommendations: overallRisk.recommendations,
      nextReviewDate: this.calculateNextReviewDate(overallRisk.score),
      calculatedAt: new Date()
    };
  }
}
```

### Integration Points

#### NHS Digital Integration
```typescript
class NHSDigitalIntegrationService {
  async syncPatientData(nhsNumber: string): Promise<NHSPatientData> {
    // 1. Authenticate with NHS Digital API
    const accessToken = await this.authenticateWithNHS();
    
    // 2. Retrieve patient demographics
    const demographics = await this.nhsApiClient.getPatientDemographics(
      nhsNumber,
      accessToken
    );
    
    // 3. Retrieve medical history
    const medicalHistory = await this.nhsApiClient.getMedicalHistory(
      nhsNumber,
      accessToken
    );
    
    // 4. Retrieve current medications
    const medications = await this.nhsApiClient.getCurrentMedications(
      nhsNumber,
      accessToken
    );
    
    // 5. Transform data to internal format
    return this.transformNHSData({
      demographics,
      medicalHistory,
      medications
    });
  }
  
  async updateNHSRecords(residentId: UUID, updates: NHSUpdateData): Promise<void> {
    // Update NHS records with care home information
    const resident = await this.getResident(residentId);
    
    await this.nhsApiClient.updatePatientCareProvider(
      resident.nhsNumber,
      {
        careProvider: this.careHomeDetails,
        admissionDate: resident.admissionDate,
        careLevel: resident.careLevel
      }
    );
  }
}
```

### Data Security and Privacy

#### Encryption Strategy
```typescript
class ResidentDataEncryption {
  // Field-level encryption for PII
  async encryptPersonalData(data: PersonalDetails): Promise<EncryptedPersonalDetails> {
    return {
      firstName: await this.encryptionService.encrypt(data.firstName),
      lastName: await this.encryptionService.encrypt(data.lastName),
      dateOfBirth: await this.encryptionService.encrypt(data.dateOfBirth.toISOString()),
      nhsNumber: await this.encryptionService.encrypt(data.nhsNumber),
      phoneNumber: await this.encryptionService.encrypt(data.phoneNumber),
      emailAddress: await this.encryptionService.encrypt(data.emailAddress),
      address: await this.encryptionService.encrypt(JSON.stringify(data.address))
    };
  }
  
  async decryptPersonalData(encryptedData: EncryptedPersonalDetails): Promise<PersonalDetails> {
    return {
      firstName: await this.encryptionService.decrypt(encryptedData.firstName),
      lastName: await this.encryptionService.decrypt(encryptedData.lastName),
      dateOfBirth: new Date(await this.encryptionService.decrypt(encryptedData.dateOfBirth)),
      nhsNumber: await this.encryptionService.decrypt(encryptedData.nhsNumber),
      phoneNumber: await this.encryptionService.decrypt(encryptedData.phoneNumber),
      emailAddress: await this.encryptionService.decrypt(encryptedData.emailAddress),
      address: JSON.parse(await this.encryptionService.decrypt(encryptedData.address))
    };
  }
}
```

#### GDPR Compliance
```typescript
class GDPRComplianceService {
  async processDataSubjectRequest(residentId: UUID, requestType: DataSubjectRequestType): Promise<DataSubjectResponse> {
    switch (requestType) {
      case 'ACCESS':
        return await this.handleAccessRequest(residentId);
      case 'RECTIFICATION':
        return await this.handleRectificationRequest(residentId);
      case 'ERASURE':
        return await this.handleErasureRequest(residentId);
      case 'PORTABILITY':
        return await this.handlePortabilityRequest(residentId);
      case 'RESTRICTION':
        return await this.handleRestrictionRequest(residentId);
    }
  }
  
  async handleAccessRequest(residentId: UUID): Promise<PersonalDataExport> {
    const resident = await this.getResidentWithAllData(residentId);
    
    // Decrypt personal data for export
    const decryptedData = await this.decryptAllPersonalData(resident);
    
    // Remove system-internal data
    const sanitizedData = this.sanitizeForExport(decryptedData);
    
    // Generate comprehensive data export
    return {
      personalData: sanitizedData,
      processingActivities: await this.getProcessingActivities(residentId),
      dataRetentionPeriods: await this.getRetentionSchedule(residentId),
      thirdPartySharing: await this.getThirdPartySharing(residentId),
      exportDate: new Date(),
      format: 'JSON'
    };
  }
}
```

### Performance Optimization

#### Caching Strategy
```typescript
class ResidentCacheService {
  // Cache frequently accessed resident data
  async getCachedResident(residentId: UUID): Promise<ResidentProfile | null> {
    const cacheKey = `resident:${residentId}`;
    const cached = await this.redisClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const resident = await this.residentRepository.findById(residentId);
    if (resident) {
      await this.redisClient.setex(cacheKey, 300, JSON.stringify(resident)); // 5 min TTL
    }
    
    return resident;
  }
  
  // Invalidate cache on updates
  async invalidateResidentCache(residentId: UUID): Promise<void> {
    const cacheKeys = [
      `resident:${residentId}`,
      `resident:${residentId}:family`,
      `resident:${residentId}:medical-history`,
      `resident:${residentId}:care-journey`
    ];
    
    await this.redisClient.del(...cacheKeys);
  }
}
```

### Monitoring and Analytics

#### Service Metrics
```typescript
interface ResidentServiceMetrics {
  // Operational Metrics
  totalResidents: number;
  activeResidents: number;
  admissionsThisMonth: number;
  dischargesThisMonth: number;
  occupancyRate: number;
  
  // Performance Metrics
  averageAdmissionTime: number; // hours
  averageDischargeTime: number; // hours
  dataCompleteness: number; // percentage
  
  // Quality Metrics
  careJourneyCompleteness: number;
  familyEngagementRate: number;
  riskAssessmentCoverage: number;
  
  // Compliance Metrics
  gdprComplianceRate: number;
  dataRetentionCompliance: number;
  consentManagementCompliance: number;
}
```

### Testing Strategy

#### Unit Tests
```typescript
describe('ResidentManagementService', () => {
  describe('createResident', () => {
    it('should create resident with encrypted PII', async () => {
      const residentData = createTestResidentData();
      const result = await residentService.createResident(residentData);
      
      expect(result.id).toBeDefined();
      expect(result.personalDetails.firstName).not.toBe(residentData.firstName);
      expect(await encryptionService.decrypt(result.personalDetails.firstName))
        .toBe(residentData.firstName);
    });
    
    it('should validate NHS number format', async () => {
      const invalidData = { ...createTestResidentData(), nhsNumber: 'invalid' };
      
      await expect(residentService.createResident(invalidData))
        .rejects.toThrow('Invalid NHS number format');
    });
  });
});
```

This comprehensive Resident Management Service provides the foundation for all resident-related operations in WriteCareNotes, ensuring security, compliance, and scalability while maintaining the highest standards of healthcare data management.