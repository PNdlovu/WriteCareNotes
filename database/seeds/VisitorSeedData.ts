import { Repository } from 'typeorm';
import AppDataSource from '../../config/database';
import { VisitorManagement, VisitorType, AccessLevel } from '../../entities/visitor/VisitorManagement';
import { BackgroundCheckService, BackgroundCheckType } from '../../services/compliance/BackgroundCheckService';
import { v4 as uuidv4 } from 'uuid';

export class VisitorSeedData {
  private visitorRepository: Repository<VisitorManagement>;
  private backgroundCheckService: BackgroundCheckService;

  constructor() {
    this.visitorRepository = AppDataSource.getRepository(VisitorManagement);
    this.backgroundCheckService = new BackgroundCheckService(
      null as any, // EventEmitter2
      null as any, // AuditTrailService
      null as any, // NotificationService
      null as any  // ComplianceService
    );
  }

  /**
   * Seed comprehensive visitor test data
   */
  async seedVisitorData(): Promise<void> {
    console.log('🌱 Seeding visitor management data...');

    try {
      // Clear existing data
      await this.clearExistingData();

      // Create family visitors
      const familyVisitors = await this.createFamilyVisitors();
      console.log(`✅ Created ${familyVisitors.length} family visitors`);

      // Create professional visitors
      const professionalVisitors = await this.createProfessionalVisitors();
      console.log(`✅ Created ${professionalVisitors.length} professional visitors`);

      // Create contractor visitors
      const contractorVisitors = await this.createContractorVisitors();
      console.log(`✅ Created ${contractorVisitors.length} contractor visitors`);

      // Create volunteer visitors
      const volunteerVisitors = await this.createVolunteerVisitors();
      console.log(`✅ Created ${volunteerVisitors.length} volunteer visitors`);

      // Create inspector visitors
      const inspectorVisitors = await this.createInspectorVisitors();
      console.log(`✅ Created ${inspectorVisitors.length} inspector visitors`);

      // Add visit histories
      await this.addVisitHistories(familyVisitors);
      console.log(`✅ Added visit histories for family visitors`);

      // Add security incidents
      await this.addSecurityIncidents();
      console.log(`✅ Added security incident test data`);

      // Add satisfaction feedback
      await this.addSatisfactionFeedback();
      console.log(`✅ Added satisfaction feedback data`);

      console.log('🎉 Visitor management seed data completed successfully!');

    } catch (error) {
      console.error('❌ Failed to seed visitor data:', error);
      throw error;
    }
  }

  private async clearExistingData(): Promise<void> {
    await this.visitorRepository.clear();
  }

  /**
   * Create family visitors with realistic profiles
   */
  private async createFamilyVisitors(): Promise<VisitorManagement[]> {
    const familyProfiles = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+44 7700 900123',
        relationship: 'daughter',
        residentId: 'RES-001',
        frequencyType: 'frequent'
      },
      {
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@email.com',
        phone: '+44 7700 900124',
        relationship: 'son',
        residentId: 'RES-002',
        frequencyType: 'regular'
      },
      {
        firstName: 'Emma',
        lastName: 'Williams',
        email: 'emma.williams@email.com',
        phone: '+44 7700 900125',
        relationship: 'granddaughter',
        residentId: 'RES-003',
        frequencyType: 'occasional'
      },
      {
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@email.com',
        phone: '+44 7700 900126',
        relationship: 'spouse',
        residentId: 'RES-001',
        frequencyType: 'frequent'
      },
      {
        firstName: 'Jennifer',
        lastName: 'Davis',
        email: 'jennifer.davis@email.com',
        phone: '+44 7700 900127',
        relationship: 'daughter',
        residentId: 'RES-004',
        frequencyType: 'regular'
      },
      {
        firstName: 'Robert',
        lastName: 'Wilson',
        email: 'robert.wilson@email.com',
        phone: '+44 7700 900128',
        relationship: 'son',
        residentId: 'RES-005',
        frequencyType: 'frequent'
      },
      {
        firstName: 'Lisa',
        lastName: 'Taylor',
        email: 'lisa.taylor@email.com',
        phone: '+44 7700 900129',
        relationship: 'daughter-in-law',
        residentId: 'RES-006',
        frequencyType: 'occasional'
      },
      {
        firstName: 'James',
        lastName: 'Anderson',
        email: 'james.anderson@email.com',
        phone: '+44 7700 900130',
        relationship: 'nephew',
        residentId: 'RES-007',
        frequencyType: 'occasional'
      }
    ];

    const visitors: VisitorManagement[] = [];

    for (const profile of familyProfiles) {
      const visitor = await this.createFamilyVisitor(profile);
      visitors.push(visitor);
    }

    return visitors;
  }

  /**
   * Create professional visitors (nurses, doctors, social workers)
   */
  private async createProfessionalVisitors(): Promise<VisitorManagement[]> {
    const professionalProfiles = [
      {
        firstName: 'Dr. Helen',
        lastName: 'Smith',
        email: 'helen.smith@nhs.uk',
        phone: '+44 1234 567890',
        profession: 'doctor',
        organization: 'NHS Foundation Trust',
        registrationNumber: 'GMC123456'
      },
      {
        firstName: 'Nurse Janet',
        lastName: 'Thompson',
        email: 'janet.thompson@nhs.uk',
        phone: '+44 1234 567891',
        profession: 'nurse',
        organization: 'Community Health Services',
        registrationNumber: 'NMC789012'
      },
      {
        firstName: 'Sarah',
        lastName: 'Mitchell',
        email: 'sarah.mitchell@council.gov.uk',
        phone: '+44 1234 567892',
        profession: 'social_worker',
        organization: 'Local Authority Social Services',
        registrationNumber: 'SWE345678'
      },
      {
        firstName: 'Dr. Ahmed',
        lastName: 'Hassan',
        email: 'ahmed.hassan@pharmacy.uk',
        phone: '+44 1234 567893',
        profession: 'pharmacist',
        organization: 'Community Pharmacy',
        registrationNumber: 'GPhC901234'
      },
      {
        firstName: 'Claire',
        lastName: 'Roberts',
        email: 'claire.roberts@physio.uk',
        phone: '+44 1234 567894',
        profession: 'physiotherapist',
        organization: 'Allied Health Services',
        registrationNumber: 'HCPC567890'
      }
    ];

    const visitors: VisitorManagement[] = [];

    for (const profile of professionalProfiles) {
      const visitor = await this.createProfessionalVisitor(profile);
      visitors.push(visitor);
    }

    return visitors;
  }

  /**
   * Create contractor visitors (maintenance, cleaning, suppliers)
   */
  private async createContractorVisitors(): Promise<VisitorManagement[]> {
    const contractorProfiles = [
      {
        firstName: 'Tom',
        lastName: 'Builder',
        email: 'tom@buildingworks.co.uk',
        phone: '+44 1234 567895',
        company: 'Building Works Ltd',
        contractorType: 'maintenance',
        clearanceLevel: 'standard'
      },
      {
        firstName: 'Maria',
        lastName: 'Cleaner',
        email: 'maria@cleanservices.co.uk',
        phone: '+44 1234 567896',
        company: 'Clean Services Ltd',
        contractorType: 'cleaning',
        clearanceLevel: 'standard'
      },
      {
        firstName: 'John',
        lastName: 'Electrician',
        email: 'john@powertech.co.uk',
        phone: '+44 1234 567897',
        company: 'Power Tech Solutions',
        contractorType: 'electrical',
        clearanceLevel: 'enhanced'
      },
      {
        firstName: 'Sophie',
        lastName: 'Supplier',
        email: 'sophie@medsupply.co.uk',
        phone: '+44 1234 567898',
        company: 'Medical Supply Co',
        contractorType: 'supplier',
        clearanceLevel: 'standard'
      }
    ];

    const visitors: VisitorManagement[] = [];

    for (const profile of contractorProfiles) {
      const visitor = await this.createContractorVisitor(profile);
      visitors.push(visitor);
    }

    return visitors;
  }

  /**
   * Create volunteer visitors
   */
  private async createVolunteerVisitors(): Promise<VisitorManagement[]> {
    const volunteerProfiles = [
      {
        firstName: 'Grace',
        lastName: 'Helper',
        email: 'grace@volunteers.org.uk',
        phone: '+44 1234 567899',
        volunteerType: 'activities',
        organization: 'Local Volunteer Group'
      },
      {
        firstName: 'Peter',
        lastName: 'Reader',
        email: 'peter@readingvolunteers.org.uk',
        phone: '+44 1234 567800',
        volunteerType: 'reading',
        organization: 'Reading Volunteers'
      },
      {
        firstName: 'Mary',
        lastName: 'Musician',
        email: 'mary@musictherapy.org.uk',
        phone: '+44 1234 567801',
        volunteerType: 'music_therapy',
        organization: 'Music Therapy Volunteers'
      }
    ];

    const visitors: VisitorManagement[] = [];

    for (const profile of volunteerProfiles) {
      const visitor = await this.createVolunteerVisitor(profile);
      visitors.push(visitor);
    }

    return visitors;
  }

  /**
   * Create inspector visitors (CQC, Fire Safety, etc.)
   */
  private async createInspectorVisitors(): Promise<VisitorManagement[]> {
    const inspectorProfiles = [
      {
        firstName: 'Inspector Jane',
        lastName: 'Regulator',
        email: 'jane.regulator@cqc.org.uk',
        phone: '+44 20 7347 5000',
        inspectorType: 'cqc',
        organization: 'Care Quality Commission',
        badge: 'CQC-INS-001'
      },
      {
        firstName: 'Chief Robert',
        lastName: 'Safety',
        email: 'robert.safety@fire.gov.uk',
        phone: '+44 1234 567802',
        inspectorType: 'fire_safety',
        organization: 'Fire and Rescue Service',
        badge: 'FIRE-INS-001'
      },
      {
        firstName: 'Dr. Environmental',
        lastName: 'Health',
        email: 'env.health@council.gov.uk',
        phone: '+44 1234 567803',
        inspectorType: 'environmental_health',
        organization: 'Local Authority',
        badge: 'EH-INS-001'
      }
    ];

    const visitors: VisitorManagement[] = [];

    for (const profile of inspectorProfiles) {
      const visitor = await this.createInspectorVisitor(profile);
      visitors.push(visitor);
    }

    return visitors;
  }

  private async createFamilyVisitor(profile: any): Promise<VisitorManagement> {
    const visitorId = `VIS-FAM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const visitor = this.visitorRepository.create({
      visitorId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      visitorType: VisitorType.FAMILY_MEMBER,
      residentRelationships: [{
        residentId: profile.residentId,
        relationship: profile.relationship,
        relationshipStartDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000), // Up to 1 year ago
        isEmergencyContact: Math.random() > 0.7, // 30% chance of being emergency contact
        canMakeDecisions: profile.relationship === 'spouse' || profile.relationship === 'daughter' || profile.relationship === 'son',
        visitingFrequency: profile.frequencyType,
        specialArrangements: []
      }],
      advancedScreening: {
        identityVerification: {
          photoId: true,
          biometricScan: false,
          backgroundCheck: true,
          dbsCheck: false, // Family members don't typically need DBS
          professionalRegistration: null,
          verificationScore: Math.floor(Math.random() * 20) + 80 // 80-100
        },
        healthScreening: {
          temperatureCheck: true,
          symptomScreening: true,
          vaccinationStatus: 'verified',
          healthDeclaration: true,
          covidTestRequired: false,
          covidTestResult: null,
          healthRiskScore: Math.floor(Math.random() * 30) // 0-30 (low risk)
        },
        securityScreening: {
          metalDetector: false,
          bagSearch: false,
          prohibitedItems: [],
          securityClearance: 'standard',
          watchListCheck: true,
          riskAssessment: 'low'
        },
        behavioralAssessment: {
          previousVisitBehavior: Math.random() > 0.1 ? 'excellent' : 'good', // 90% excellent
          communicationStyle: 'friendly',
          specialNeeds: [],
          riskFactors: [],
          recommendedApproach: 'standard'
        }
      },
      accessPermissions: {
        accessLevel: AccessLevel.RESIDENT_AREAS,
        authorizedAreas: ['reception', 'common_areas', 'garden', 'dining_room', `resident_room_${profile.residentId}`],
        restrictedAreas: ['medication_room', 'staff_areas', 'kitchen', 'admin_office'],
        timeRestrictions: [],
        escortRequired: false,
        specialPermissions: [],
        permissionGrantedBy: 'SYSTEM',
        permissionGrantedDate: new Date(),
        permissionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      },
      visitHistory: [],
      digitalVisitingPlatform: {
        platformEnabled: true,
        videoCallingSetup: {
          platformPreference: ['zoom', 'teams', 'facetime'][Math.floor(Math.random() * 3)],
          accountLinked: Math.random() > 0.3, // 70% have linked accounts
          deviceTested: Math.random() > 0.2, // 80% have tested devices
          bandwidthTested: Math.random() > 0.4, // 60% have tested bandwidth
          schedulingEnabled: true
        },
        virtualRealityAccess: {
          vrEnabled: false,
          headsetCompatibility: [],
          experiencesAvailable: []
        },
        recordingPermissions: {
          canRecord: true,
          familyConsent: Math.random() > 0.2, // 80% give consent
          residentConsent: Math.random() > 0.3, // 70% give consent
          storagePolicy: 'encrypt_and_retain_30_days'
        },
        accessibilityFeatures: {
          closedCaptions: Math.random() > 0.8, // 20% need captions
          signLanguageInterpreter: false,
          largeText: Math.random() > 0.9, // 10% need large text
          highContrast: false
        }
      },
      contactTracingSystem: {
        contactTracing: {
          enabled: true,
          retentionPeriod: 21,
          privacyCompliant: true,
          automatedAlerts: true
        },
        exposureNotification: {
          rapidNotification: true,
          contactIdentification: true,
          riskAssessment: true,
          isolationProtocols: true,
          testingCoordination: true
        },
        healthMonitoring: {
          preVisitScreening: true,
          postVisitMonitoring: true,
          symptomTracking: true,
          healthStatusUpdates: true,
          quarantineManagement: true
        }
      },
      emergencyProcedures: {
        emergencyContactPerson: `${profile.firstName} ${profile.lastName}`,
        emergencyContactPhone: profile.phone,
        medicalConditions: [],
        medications: [],
        allergies: [],
        emergencyInstructions: [
          'Notify emergency contact immediately',
          'Contact emergency services if required',
          'Document all emergency procedures taken'
        ]
      },
      isActive: true,
      totalVisits: this.getVisitCountByFrequency(profile.frequencyType),
      missedVisits: Math.floor(Math.random() * 3), // 0-2 missed visits
      version: 1
    });

    return await this.visitorRepository.save(visitor);
  }

  private async createProfessionalVisitor(profile: any): Promise<VisitorManagement> {
    const visitorId = `VIS-PROF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const visitor = this.visitorRepository.create({
      visitorId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      visitorType: VisitorType.PROFESSIONAL,
      residentRelationships: [], // Professionals may visit multiple residents
      advancedScreening: {
        identityVerification: {
          photoId: true,
          biometricScan: true,
          backgroundCheck: true,
          dbsCheck: true, // Professionals need DBS checks
          professionalRegistration: profile.registrationNumber,
          verificationScore: Math.floor(Math.random() * 10) + 90 // 90-100 (high verification)
        },
        healthScreening: {
          temperatureCheck: true,
          symptomScreening: true,
          vaccinationStatus: 'verified',
          healthDeclaration: true,
          covidTestRequired: true,
          covidTestResult: 'negative',
          healthRiskScore: Math.floor(Math.random() * 20) // 0-20 (very low risk)
        },
        securityScreening: {
          metalDetector: false,
          bagSearch: true, // Check professional equipment
          prohibitedItems: [],
          securityClearance: 'enhanced',
          watchListCheck: true,
          riskAssessment: 'low'
        },
        behavioralAssessment: {
          previousVisitBehavior: 'excellent',
          communicationStyle: 'professional',
          specialNeeds: [],
          riskFactors: [],
          recommendedApproach: 'professional'
        }
      },
      accessPermissions: {
        accessLevel: AccessLevel.PROFESSIONAL_AREAS_ONLY,
        authorizedAreas: ['reception', 'common_areas', 'resident_areas', 'office_areas', 'meeting_rooms'],
        restrictedAreas: ['admin_office', 'kitchen'],
        timeRestrictions: [{
          dayOfWeek: 'monday-friday',
          startTime: '09:00',
          endTime: '17:00'
        }],
        escortRequired: false,
        specialPermissions: ['medical_equipment_access'],
        permissionGrantedBy: 'CLINICAL_DIRECTOR',
        permissionGrantedDate: new Date(),
        permissionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      visitHistory: [],
      digitalVisitingPlatform: {
        platformEnabled: true,
        videoCallingSetup: {
          platformPreference: 'teams', // Professionals typically use Teams
          accountLinked: true,
          deviceTested: true,
          bandwidthTested: true,
          schedulingEnabled: true
        },
        virtualRealityAccess: {
          vrEnabled: false,
          headsetCompatibility: [],
          experiencesAvailable: []
        },
        recordingPermissions: {
          canRecord: true,
          familyConsent: true,
          residentConsent: true,
          storagePolicy: 'encrypt_and_retain_7_years' // Medical records retention
        },
        accessibilityFeatures: {
          closedCaptions: false,
          signLanguageInterpreter: false,
          largeText: false,
          highContrast: false
        }
      },
      contactTracingSystem: {
        contactTracing: {
          enabled: true,
          retentionPeriod: 21,
          privacyCompliant: true,
          automatedAlerts: true
        },
        exposureNotification: {
          rapidNotification: true,
          contactIdentification: true,
          riskAssessment: true,
          isolationProtocols: true,
          testingCoordination: true
        },
        healthMonitoring: {
          preVisitScreening: true,
          postVisitMonitoring: true,
          symptomTracking: true,
          healthStatusUpdates: true,
          quarantineManagement: true
        }
      },
      emergencyProcedures: {
        emergencyContactPerson: `${profile.firstName} ${profile.lastName}`,
        emergencyContactPhone: profile.phone,
        medicalConditions: [],
        medications: [],
        allergies: [],
        emergencyInstructions: [
          'Notify professional registration body if required',
          'Contact employer organization',
          'Follow professional conduct guidelines'
        ]
      },
      isActive: true,
      totalVisits: Math.floor(Math.random() * 20) + 5, // 5-25 visits
      missedVisits: Math.floor(Math.random() * 2), // 0-1 missed visits (very reliable)
      version: 1
    });

    return await this.visitorRepository.save(visitor);
  }

  private async createContractorVisitor(profile: any): Promise<VisitorManagement> {
    const visitorId = `VIS-CONT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const visitor = this.visitorRepository.create({
      visitorId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      visitorType: VisitorType.CONTRACTOR,
      residentRelationships: [],
      advancedScreening: {
        identityVerification: {
          photoId: true,
          biometricScan: false,
          backgroundCheck: true,
          dbsCheck: profile.clearanceLevel === 'enhanced',
          professionalRegistration: null,
          verificationScore: Math.floor(Math.random() * 15) + 75 // 75-90
        },
        healthScreening: {
          temperatureCheck: true,
          symptomScreening: true,
          vaccinationStatus: 'verified',
          healthDeclaration: true,
          covidTestRequired: false,
          covidTestResult: null,
          healthRiskScore: Math.floor(Math.random() * 40) // 0-40 (low-medium risk)
        },
        securityScreening: {
          metalDetector: true, // Contractors carry tools
          bagSearch: true,
          prohibitedItems: [],
          securityClearance: profile.clearanceLevel,
          watchListCheck: true,
          riskAssessment: profile.clearanceLevel === 'enhanced' ? 'low' : 'medium'
        },
        behavioralAssessment: {
          previousVisitBehavior: Math.random() > 0.2 ? 'good' : 'excellent', // 80% good, 20% excellent
          communicationStyle: 'professional',
          specialNeeds: [],
          riskFactors: [],
          recommendedApproach: 'supervised'
        }
      },
      accessPermissions: {
        accessLevel: AccessLevel.RESTRICTED_AREAS,
        authorizedAreas: ['reception', 'maintenance_areas', 'external_areas'],
        restrictedAreas: ['resident_areas', 'medication_room', 'admin_office'],
        timeRestrictions: [{
          dayOfWeek: 'monday-friday',
          startTime: '08:00',
          endTime: '18:00'
        }],
        escortRequired: true, // Contractors always need escort
        specialPermissions: ['tool_access', 'equipment_access'],
        permissionGrantedBy: 'FACILITIES_MANAGER',
        permissionGrantedDate: new Date(),
        permissionExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },
      visitHistory: [],
      digitalVisitingPlatform: {
        platformEnabled: false, // Contractors don't typically use digital visiting
        videoCallingSetup: {
          platformPreference: 'none',
          accountLinked: false,
          deviceTested: false,
          bandwidthTested: false,
          schedulingEnabled: false
        },
        virtualRealityAccess: {
          vrEnabled: false,
          headsetCompatibility: [],
          experiencesAvailable: []
        },
        recordingPermissions: {
          canRecord: false,
          familyConsent: false,
          residentConsent: false,
          storagePolicy: 'no_recording'
        },
        accessibilityFeatures: {
          closedCaptions: false,
          signLanguageInterpreter: false,
          largeText: false,
          highContrast: false
        }
      },
      contactTracingSystem: {
        contactTracing: {
          enabled: true,
          retentionPeriod: 21,
          privacyCompliant: true,
          automatedAlerts: true
        },
        exposureNotification: {
          rapidNotification: true,
          contactIdentification: true,
          riskAssessment: true,
          isolationProtocols: true,
          testingCoordination: true
        },
        healthMonitoring: {
          preVisitScreening: true,
          postVisitMonitoring: false,
          symptomTracking: false,
          healthStatusUpdates: false,
          quarantineManagement: true
        }
      },
      emergencyProcedures: {
        emergencyContactPerson: `${profile.firstName} ${profile.lastName}`,
        emergencyContactPhone: profile.phone,
        medicalConditions: [],
        medications: [],
        allergies: [],
        emergencyInstructions: [
          'Contact employer immediately',
          'Secure any tools or equipment',
          'Follow contractor safety protocols'
        ]
      },
      isActive: true,
      totalVisits: Math.floor(Math.random() * 10) + 2, // 2-12 visits
      missedVisits: Math.floor(Math.random() * 3), // 0-2 missed visits
      version: 1
    });

    return await this.visitorRepository.save(visitor);
  }

  private async createVolunteerVisitor(profile: any): Promise<VisitorManagement> {
    const visitorId = `VIS-VOL-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const visitor = this.visitorRepository.create({
      visitorId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      visitorType: VisitorType.VOLUNTEER,
      residentRelationships: [],
      advancedScreening: {
        identityVerification: {
          photoId: true,
          biometricScan: false,
          backgroundCheck: true,
          dbsCheck: true, // Volunteers need DBS checks
          professionalRegistration: null,
          verificationScore: Math.floor(Math.random() * 15) + 80 // 80-95
        },
        healthScreening: {
          temperatureCheck: true,
          symptomScreening: true,
          vaccinationStatus: 'verified',
          healthDeclaration: true,
          covidTestRequired: false,
          covidTestResult: null,
          healthRiskScore: Math.floor(Math.random() * 25) // 0-25 (low risk)
        },
        securityScreening: {
          metalDetector: false,
          bagSearch: false,
          prohibitedItems: [],
          securityClearance: 'standard',
          watchListCheck: true,
          riskAssessment: 'low'
        },
        behavioralAssessment: {
          previousVisitBehavior: 'excellent',
          communicationStyle: 'caring',
          specialNeeds: [],
          riskFactors: [],
          recommendedApproach: 'supportive'
        }
      },
      accessPermissions: {
        accessLevel: AccessLevel.GENERAL_AREAS,
        authorizedAreas: ['reception', 'common_areas', 'garden', 'activity_rooms'],
        restrictedAreas: ['resident_rooms', 'medication_room', 'staff_areas', 'admin_office'],
        timeRestrictions: [{
          dayOfWeek: 'all',
          startTime: '10:00',
          endTime: '16:00'
        }],
        escortRequired: false,
        specialPermissions: ['activity_equipment_access'],
        permissionGrantedBy: 'ACTIVITY_COORDINATOR',
        permissionGrantedDate: new Date(),
        permissionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      visitHistory: [],
      digitalVisitingPlatform: {
        platformEnabled: true,
        videoCallingSetup: {
          platformPreference: 'zoom',
          accountLinked: Math.random() > 0.5,
          deviceTested: Math.random() > 0.3,
          bandwidthTested: Math.random() > 0.4,
          schedulingEnabled: true
        },
        virtualRealityAccess: {
          vrEnabled: false,
          headsetCompatibility: [],
          experiencesAvailable: []
        },
        recordingPermissions: {
          canRecord: true,
          familyConsent: true,
          residentConsent: true,
          storagePolicy: 'encrypt_and_retain_30_days'
        },
        accessibilityFeatures: {
          closedCaptions: false,
          signLanguageInterpreter: false,
          largeText: false,
          highContrast: false
        }
      },
      contactTracingSystem: {
        contactTracing: {
          enabled: true,
          retentionPeriod: 21,
          privacyCompliant: true,
          automatedAlerts: true
        },
        exposureNotification: {
          rapidNotification: true,
          contactIdentification: true,
          riskAssessment: true,
          isolationProtocols: true,
          testingCoordination: true
        },
        healthMonitoring: {
          preVisitScreening: true,
          postVisitMonitoring: true,
          symptomTracking: true,
          healthStatusUpdates: true,
          quarantineManagement: true
        }
      },
      emergencyProcedures: {
        emergencyContactPerson: `${profile.firstName} ${profile.lastName}`,
        emergencyContactPhone: profile.phone,
        medicalConditions: [],
        medications: [],
        allergies: [],
        emergencyInstructions: [
          'Contact volunteer coordinator',
          'Follow volunteer safety guidelines',
          'Notify volunteer organization'
        ]
      },
      isActive: true,
      totalVisits: Math.floor(Math.random() * 30) + 10, // 10-40 visits (regular volunteers)
      missedVisits: Math.floor(Math.random() * 5), // 0-4 missed visits
      version: 1
    });

    return await this.visitorRepository.save(visitor);
  }

  private async createInspectorVisitor(profile: any): Promise<VisitorManagement> {
    const visitorId = `VIS-INS-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    const visitor = this.visitorRepository.create({
      visitorId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      visitorType: VisitorType.INSPECTOR,
      residentRelationships: [],
      advancedScreening: {
        identityVerification: {
          photoId: true,
          biometricScan: true,
          backgroundCheck: true,
          dbsCheck: true,
          professionalRegistration: profile.badge,
          verificationScore: 100 // Inspectors have full verification
        },
        healthScreening: {
          temperatureCheck: true,
          symptomScreening: true,
          vaccinationStatus: 'verified',
          healthDeclaration: true,
          covidTestRequired: true,
          covidTestResult: 'negative',
          healthRiskScore: 0 // Inspectors are low risk
        },
        securityScreening: {
          metalDetector: false,
          bagSearch: false, // Inspectors have authority
          prohibitedItems: [],
          securityClearance: 'government',
          watchListCheck: false, // Not required for official inspectors
          riskAssessment: 'low'
        },
        behavioralAssessment: {
          previousVisitBehavior: 'excellent',
          communicationStyle: 'official',
          specialNeeds: [],
          riskFactors: [],
          recommendedApproach: 'formal'
        }
      },
      accessPermissions: {
        accessLevel: AccessLevel.FULL_ACCESS,
        authorizedAreas: ['all_areas'], // Inspectors can access all areas
        restrictedAreas: [],
        timeRestrictions: [],
        escortRequired: false, // Inspectors work independently
        specialPermissions: ['inspection_authority', 'document_access', 'interview_authority'],
        permissionGrantedBy: 'REGULATORY_AUTHORITY',
        permissionGrantedDate: new Date(),
        permissionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      visitHistory: [],
      digitalVisitingPlatform: {
        platformEnabled: false, // Inspectors don't use digital visiting
        videoCallingSetup: {
          platformPreference: 'none',
          accountLinked: false,
          deviceTested: false,
          bandwidthTested: false,
          schedulingEnabled: false
        },
        virtualRealityAccess: {
          vrEnabled: false,
          headsetCompatibility: [],
          experiencesAvailable: []
        },
        recordingPermissions: {
          canRecord: true,
          familyConsent: true,
          residentConsent: true,
          storagePolicy: 'regulatory_retention'
        },
        accessibilityFeatures: {
          closedCaptions: false,
          signLanguageInterpreter: false,
          largeText: false,
          highContrast: false
        }
      },
      contactTracingSystem: {
        contactTracing: {
          enabled: true,
          retentionPeriod: 21,
          privacyCompliant: true,
          automatedAlerts: true
        },
        exposureNotification: {
          rapidNotification: true,
          contactIdentification: true,
          riskAssessment: true,
          isolationProtocols: true,
          testingCoordination: true
        },
        healthMonitoring: {
          preVisitScreening: true,
          postVisitMonitoring: false,
          symptomTracking: false,
          healthStatusUpdates: false,
          quarantineManagement: true
        }
      },
      emergencyProcedures: {
        emergencyContactPerson: `${profile.firstName} ${profile.lastName}`,
        emergencyContactPhone: profile.phone,
        medicalConditions: [],
        medications: [],
        allergies: [],
        emergencyInstructions: [
          'Contact regulatory authority immediately',
          'Maintain inspection documentation',
          'Follow official protocols'
        ]
      },
      isActive: true,
      totalVisits: Math.floor(Math.random() * 5) + 1, // 1-6 visits (infrequent but important)
      missedVisits: 0, // Inspectors don't miss visits
      version: 1
    });

    return await this.visitorRepository.save(visitor);
  }

  private async addVisitHistories(visitors: VisitorManagement[]): Promise<void> {
    for (const visitor of visitors) {
      const numberOfVisits = visitor.totalVisits;
      const visits = [];

      for (let i = 0; i < numberOfVisits; i++) {
        const visitDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000); // Random date in last year
        const visit = this.generateVisitHistory(visitor, visitDate, i === 0);
        visits.push(visit);
      }

      visitor.visitHistory = visits.sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
      await this.visitorRepository.save(visitor);
    }
  }

  private generateVisitHistory(visitor: VisitorManagement, visitDate: Date, isCompleted: boolean): any {
    const checkInTime = new Date(visitDate.getTime() + Math.random() * 10 * 60 * 60 * 1000); // Random time during day
    const visitDuration = Math.floor(Math.random() * 180) + 30; // 30-210 minutes
    const checkOutTime = isCompleted ? new Date(checkInTime.getTime() + visitDuration * 60000) : undefined;

    const residentToVisit = visitor.residentRelationships.length > 0 
      ? [visitor.residentRelationships[0].residentId]
      : ['RES-GENERAL'];

    return {
      visitId: uuidv4(),
      visitDate,
      checkInTime,
      checkOutTime,
      visitDuration: isCompleted ? visitDuration : undefined,
      residentVisited: residentToVisit,
      areasAccessed: this.getRandomAreasAccessed(visitor.accessPermissions.authorizedAreas),
      escortedBy: visitor.accessPermissions.escortRequired ? 'STAFF-001' : undefined,
      visitPurpose: this.getVisitPurpose(visitor.visitorType),
      visitNotes: this.generateVisitNotes(visitor.visitorType),
      incidentsReported: Math.random() > 0.95 ? [this.generateIncident()] : [], // 5% chance of incident
      satisfactionRating: isCompleted ? Math.floor(Math.random() * 2) + 4 : null // 4-5 rating for completed visits
    };
  }

  private getRandomAreasAccessed(authorizedAreas: string[]): string[] {
    const numberOfAreas = Math.floor(Math.random() * Math.min(authorizedAreas.length, 3)) + 1;
    const shuffled = [...authorizedAreas].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, numberOfAreas);
  }

  private getVisitPurpose(visitorType: VisitorType): string {
    const purposes = {
      [VisitorType.FAMILY_MEMBER]: ['Family visit', 'Birthday celebration', 'Holiday visit', 'Routine visit'],
      [VisitorType.PROFESSIONAL]: ['Medical consultation', 'Health assessment', 'Therapy session', 'Care review'],
      [VisitorType.CONTRACTOR]: ['Maintenance work', 'Equipment repair', 'Safety inspection', 'Delivery'],
      [VisitorType.VOLUNTEER]: ['Activity session', 'Reading to residents', 'Music therapy', 'Companionship'],
      [VisitorType.INSPECTOR]: ['Regulatory inspection', 'Compliance review', 'Safety assessment', 'Quality audit']
    };

    const typePurposes = purposes[visitorType] || ['General visit'];
    return typePurposes[Math.floor(Math.random() * typePurposes.length)];
  }

  private generateVisitNotes(visitorType: VisitorType): string {
    const notes = {
      [VisitorType.FAMILY_MEMBER]: [
        'Pleasant visit with resident. Good mood and engagement.',
        'Brought flowers and spent time in garden.',
        'Discussed upcoming family events.',
        'Resident enjoyed the visit and asked about next visit.'
      ],
      [VisitorType.PROFESSIONAL]: [
        'Completed assessment as scheduled. No concerns noted.',
        'Resident cooperative during examination.',
        'Medication review completed. No changes required.',
        'Follow-up appointment scheduled.'
      ],
      [VisitorType.CONTRACTOR]: [
        'Work completed as scheduled. No disruption to residents.',
        'Equipment serviced and tested. All functioning correctly.',
        'Safety checks completed. All standards met.',
        'Next maintenance scheduled in 6 months.'
      ],
      [VisitorType.VOLUNTEER]: [
        'Residents enjoyed the activity session.',
        'Great participation in music therapy.',
        'Reading session well received.',
        'Positive interaction with all participants.'
      ],
      [VisitorType.INSPECTOR]: [
        'Inspection completed. Documentation reviewed.',
        'Standards compliance verified.',
        'Minor recommendations noted for improvement.',
        'Overall assessment satisfactory.'
      ]
    };

    const typeNotes = notes[visitorType] || ['Visit completed successfully.'];
    return typeNotes[Math.floor(Math.random() * typeNotes.length)];
  }

  private generateIncident(): string {
    const incidents = [
      'Minor delay at security checkpoint',
      'Visitor arrived without proper identification',
      'Wrong area accessed briefly - redirected',
      'Visitor brought prohibited item - secured at reception',
      'Fire alarm during visit - evacuation completed safely'
    ];
    return incidents[Math.floor(Math.random() * incidents.length)];
  }

  private getVisitCountByFrequency(frequency: string): number {
    switch (frequency) {
      case 'frequent': return Math.floor(Math.random() * 30) + 20; // 20-50 visits
      case 'regular': return Math.floor(Math.random() * 15) + 10; // 10-25 visits
      case 'occasional': return Math.floor(Math.random() * 8) + 2; // 2-10 visits
      default: return Math.floor(Math.random() * 5) + 1; // 1-6 visits
    }
  }

  private async addSecurityIncidents(): Promise<void> {
    // Add some security incidents for testing
    const visitors = await this.visitorRepository.find({ take: 5 });
    
    for (const visitor of visitors) {
      if (Math.random() > 0.8) { // 20% chance of having a security incident
        if (visitor.visitHistory.length > 0) {
          const randomVisit = visitor.visitHistory[Math.floor(Math.random() * visitor.visitHistory.length)];
          randomVisit.incidentsReported.push(this.generateSecurityIncident());
          await this.visitorRepository.save(visitor);
        }
      }
    }
  }

  private generateSecurityIncident(): string {
    const securityIncidents = [
      'Visitor attempted to access restricted area - staff intervention required',
      'Security alert triggered by unknown item in bag - resolved after inspection',
      'Visitor exhibited concerning behavior - de-escalated by staff',
      'Unauthorized photography attempted - visitor educated on policy',
      'Escort required but visitor attempted independent movement'
    ];
    return securityIncidents[Math.floor(Math.random() * securityIncidents.length)];
  }

  private async addSatisfactionFeedback(): Promise<void> {
    const visitors = await this.visitorRepository.find();
    
    for (const visitor of visitors) {
      // Add satisfaction ratings to recent visits
      visitor.visitHistory.forEach(visit => {
        if (visit.checkOutTime && Math.random() > 0.3) { // 70% of completed visits have ratings
          visit.satisfactionRating = Math.floor(Math.random() * 2) + 4; // 4-5 star ratings mostly
          if (Math.random() > 0.9) { // 10% chance of lower rating
            visit.satisfactionRating = Math.floor(Math.random() * 3) + 2; // 2-4 star ratings
          }
        }
      });
      
      await this.visitorRepository.save(visitor);
    }
  }

  /**
   * Generate sample background check data
   */
  async generateBackgroundCheckData(): Promise<void> {
    console.log('🔍 Generating background check sample data...');

    const sampleRequests = [
      {
        firstName: 'Jane',
        lastName: 'Professional',
        dateOfBirth: new Date('1985-06-15'),
        identificationNumber: 'AB123456C',
        checkTypes: [BackgroundCheckType.DBS_ENHANCED, BackgroundCheckType.PROFESSIONAL_REGISTRATION, BackgroundCheckType.RIGHT_TO_WORK],
        requestedBy: 'HR-ADMIN'
      },
      {
        firstName: 'John',
        lastName: 'Contractor',
        dateOfBirth: new Date('1978-03-22'),
        identificationNumber: 'CD789012E',
        checkTypes: [BackgroundCheckType.DBS_BASIC, BackgroundCheckType.IDENTITY_VERIFICATION, BackgroundCheckType.RIGHT_TO_WORK],
        requestedBy: 'FACILITIES-MANAGER'
      },
      {
        firstName: 'Mary',
        lastName: 'Volunteer',
        dateOfBirth: new Date('1992-11-08'),
        identificationNumber: 'EF345678G',
        checkTypes: [BackgroundCheckType.DBS_STANDARD, BackgroundCheckType.IDENTITY_VERIFICATION],
        requestedBy: 'VOLUNTEER-COORDINATOR'
      }
    ];

    for (const request of sampleRequests) {
      try {
        const result = await this.backgroundCheckService.performComprehensiveCheck(request);
        console.log(`✅ Generated background check: ${result.checkId} for ${request.firstName} ${request.lastName}`);
      } catch (error) {
        console.error(`❌ Failed to generate background check for ${request.firstName} ${request.lastName}:`, error);
      }
    }
  }
}

// Export function to run seeding
export async function seedVisitorManagementData(): Promise<void> {
  const seeder = new VisitorSeedData();
  await seeder.seedVisitorData();
  await seeder.generateBackgroundCheckData();
}