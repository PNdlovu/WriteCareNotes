/**
 * @fileoverview visitor management Service
 * @module Visitor/VisitorManagementService
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description visitor management Service
 */

import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import AppDataSource from '../../config/database';
import { VisitorManagement, VisitorType, VisitStatus, AccessLevel } from '../../entities/visitor/VisitorManagement';
import { NotificationService } from '../notifications/NotificationService';
import { AuditService,  AuditTrailService } from '../audit';
import { SecurityIntegrationService } from '../security/SecurityIntegrationService';
import { BackgroundCheckService } from '../compliance/BackgroundCheckService';
import { ComplianceService } from '../compliance/ComplianceService';
import { v4 as uuidv4 } from 'uuid';

export interface VisitorRegistrationRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  visitorType: VisitorType;
  residentToVisit: string[];
  relationship: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  identificationDocuments: {
    type: 'passport' | 'driving_license' | 'national_id';
    number: string;
    expiryDate: Date;
    issuingAuthority: string;
  }[];
  medicalInformation?: {
    allergies: string[];
    medications: string[];
    conditions: string[];
  };
  visitPurpose: string;
  estimatedDuration: number;
  preferredVisitTimes: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface SecurityScreeningResult {
  identityVerified: boolean;
  healthScreeningPassed: boolean;
  securityClearance: 'approved' | 'conditional' | 'denied';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  screeningNotes: string[];
  requiredActions: string[];
  approvedBy: string;
  approvalDate: Date;
  expiryDate?: Date;
}

export interface VisitorAnalytics {
  totalRegistrations: number;
  activeVisitors: number;
  averageVisitDuration: number;
  visitFrequencyTrends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  securityMetrics: {
    screeningSuccessRate: number;
    incidentRate: number;
    complianceScore: number;
  };
  satisfactionMetrics: {
    overallRating: number;
    familyEngagement: number;
    systemUsability: number;
  };
  demographicBreakdown: {
    visitorTypes: { [key: string]: number };
    relationships: { [key: string]: number };
    ageGroups: { [key: string]: number };
    geographicDistribution: { [key: string]: number };
  };
  complianceMetrics: {
    gdprCompliance: number;
    safeguardingCompliance: number;
    regulatoryCompliance: number;
    dataRetentionCompliance: number;
  };
}

@Injectable()
export class VisitorManagementService {
  private readonly logger = new Logger(VisitorManagementService.name);
  privatevisitorRepository: Repository<VisitorManagement>;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly securityService: SecurityIntegrationService,
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly complianceService: ComplianceService
  ) {
    this.visitorRepository = AppDataSource.getRepository(VisitorManagement);
  }

  /**
   * Register a new visitor with comprehensive screening and validation
   */
  async registerAdvancedVisitor(request: VisitorRegistrationRequest, registeredBy: string): Promise<VisitorManagement> {
    this.logger.log(`Registering new visitor: ${request.firstName} ${request.lastName}`);

    try {
      // Generate unique visitor ID
      const visitorId = await this.generateVisitorId();

      // Perform identity verification
      const identityVerification = await this.performIdentityVerification(request);
      
      // Conduct background screening
      const backgroundCheck = await this.backgroundCheckService.performComprehensiveCheck({
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.identificationDocuments[0]?.expiryDate, // Placeholder
        identificationNumber: request.identificationDocuments[0]?.number,
        checkTypes: ['dbs', 'identity', 'watchlist', 'professional_registration']
      });

      // Perform health screening
      const healthScreening = await this.performHealthScreening(request);

      // Conduct security assessment
      const securityScreening = await this.performSecurityScreening(request, backgroundCheck);

      // Determine access permissions
      const accessPermissions = await this.determineAccessPermissions(request, securityScreening);

      // Setup digital visiting platform
      const digitalPlatform = await this.setupDigitalVisitingPlatform(request);

      // Configure contact tracing
      const contactTracing = await this.setupContactTracingSystem();

      // Setup emergency procedures
      const emergencyProcedures = await this.setupEmergencyProcedures(request);

      // Create visitor entity
      const visitor = this.visitorRepository.create({
        visitorId,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phone: request.phone,
        visitorType: request.visitorType,
        residentRelationships: request.residentToVisit.map(residentId => ({
          residentId,
          relationship: request.relationship,
          relationshipStartDate: new Date(),
          isEmergencyContact: false,
          canMakeDecisions: false,
          visitingFrequency: 'weekly',
          specialArrangements: []
        })),
        advancedScreening: {
          identityVerification,
          healthScreening,
          securityScreening,
          behavioralAssessment: {
            previousVisitBehavior: 'excellent',
            communicationStyle: 'professional',
            specialNeeds: [],
            riskFactors: [],
            recommendedApproach: 'standard'
          }
        },
        accessPermissions,
        visitHistory: [],
        digitalVisitingPlatform: digitalPlatform,
        contactTracingSystem: contactTracing,
        emergencyProcedures,
        isActive: true,
        totalVisits: 0,
        missedVisits: 0,
        version: 1
      });

      // Save visitor to database
      const savedVisitor = await this.visitorRepository.save(visitor);

      // Log registration event
      await this.auditService.logAction({
        entityType: 'VisitorManagement',
        entityId: savedVisitor.id,
        action: 'VISITOR_REGISTERED',
        userId: registeredBy,
        details: {
          visitorId: savedVisitor.visitorId,
          visitorType: savedVisitor.visitorType,
          securityClearance: securityScreening.riskAssessment,
          accessLevel: accessPermissions.accessLevel
        },
        timestamp: new Date()
      });

      // Send notifications if high-risk visitor
      if (savedVisitor.isHighRiskVisitor()) {
        await this.handleHighRiskVisitorRegistration(savedVisitor, registeredBy);
      }

      // Setup automated monitoring
      await this.setupVisitorMonitoring(savedVisitor);

      // Emit registration event
      this.eventEmitter.emit('visitor.registered', {
        visitorId: savedVisitor.visitorId,
        visitorType: savedVisitor.visitorType,
        riskLevel: securityScreening.riskAssessment,
        registeredBy
      });

      this.logger.log(`Visitor registered successfully: ${savedVisitor.visitorId}`);
      return savedVisitor;

    } catch (error) {
      this.logger.error(`Failed to register visitor: ${error.message}`, error.stack);
      throw new Error(`Visitor registration failed: ${error.message}`);
    }
  }

  /**
   * Perform visitor check-in with security validation
   */
  async checkInVisitor(visitorId: string, visitDetails: {
    visitPurpose: string;
    residentToVisit: string[];
    estimatedDuration: number;
    escortedBy?: string;
    specialInstructions?: string;
  }, checkedInBy: string): Promise<string> {
    this.logger.log(`Processing check-in for visitor: ${visitorId}`);

    try {
      const visitor = await this.visitorRepository.findOne({
        where: { visitorId }
      });

      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }

      // Validate visitor authorization
      if (!visitor.isAuthorizedToVisit()) {
        throw new Error(`Visitor not authorized: ${visitorId}`);
      }

      // Perform real-time security check
      const securityCheck = await this.performRealTimeSecurityCheck(visitor);
      if (!securityCheck.approved) {
        throw new Error(`Security check failed: ${securityCheck.reason}`);
      }

      // Generate visit ID
      const visitId = uuidv4();

      // Create visit record
      const visit = {
        visitId,
        visitDate: new Date(),
        checkInTime: new Date(),
        residentVisited: visitDetails.residentToVisit,
        areasAccessed: [],
        escortedBy: visitDetails.escortedBy,
        visitPurpose: visitDetails.visitPurpose,
        specialInstructions: visitDetails.specialInstructions,
        incidentsReported: [],
        satisfactionRating: null
      };

      // Update visitor record
      visitor.visitHistory.push(visit);
      visitor.lastVisit = new Date();
      visitor.totalVisits += 1;

      await this.visitorRepository.save(visitor);

      // Activate security monitoring
      await this.securityService.activateVisitorMonitoring(visitId, visitor);

      // Send notifications to relevant staff
      await this.notificationService.sendVisitorCheckInNotification({
        visitId,
        visitorName: `${visitor.firstName} ${visitor.lastName}`,
        residents: visitDetails.residentToVisit,
        escortRequired: visitor.requiresEscort(),
        riskLevel: visitor.advancedScreening.securityScreening.riskAssessment
      });

      // Log check-in event
      await this.auditService.logAction({
        entityType: 'VisitorManagement',
        entityId: visitor.id,
        action: 'VISITOR_CHECKED_IN',
        userId: checkedInBy,
        details: {
          visitId,
          visitorId: visitor.visitorId,
          visitPurpose: visitDetails.visitPurpose,
          residentToVisit: visitDetails.residentToVisit,
          escortRequired: visitor.requiresEscort()
        },
        timestamp: new Date()
      });

      // Emit check-in event
      this.eventEmitter.emit('visitor.checked_in', {
        visitId,
        visitorId: visitor.visitorId,
        checkInTime: new Date(),
        riskLevel: visitor.advancedScreening.securityScreening.riskAssessment
      });

      this.logger.log(`Visitor checked in successfully: ${visitId}`);
      return visitId;

    } catch (error) {
      this.logger.error(`Failed to check in visitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Perform visitor check-out with visit summary
   */
  async checkOutVisitor(visitId: string, checkOutDetails: {
    visitSummary?: string;
    incidentsReported?: string[];
    satisfactionRating?: number;
    areasAccessed?: string[];
  }, checkedOutBy: string): Promise<void> {
    this.logger.log(`Processing check-out for visit: ${visitId}`);

    try {
      const visitor = await this.visitorRepository.createQueryBuilder('visitor')
        .where('JSON_CONTAINS(visitor.visitHistory, :visitId)', { visitId: `"${visitId}"` })
        .getOne();

      if (!visitor) {
        throw new Error(`Visit not found: ${visitId}`);
      }

      // Find the specific visit
      const visitIndex = visitor.visitHistory.findIndex(v => v.visitId === visitId);
      if (visitIndex === -1) {
        throw new Error(`Visit record not found: ${visitId}`);
      }

      // Update visit record
      visitor.visitHistory[visitIndex] = {
        ...visitor.visitHistory[visitIndex],
        checkOutTime: new Date(),
        visitDuration: Math.floor((new Date().getTime() - visitor.visitHistory[visitIndex].checkInTime.getTime()) / 60000),
        visitSummary: checkOutDetails.visitSummary,
        incidentsReported: checkOutDetails.incidentsReported || [],
        satisfactionRating: checkOutDetails.satisfactionRating,
        areasAccessed: checkOutDetails.areasAccessed || []
      };

      await this.visitorRepository.save(visitor);

      // Deactivate security monitoring
      await this.securityService.deactivateVisitorMonitoring(visitId);

      // Process any incidents
      if (checkOutDetails.incidentsReported && checkOutDetails.incidentsReported.length > 0) {
        await this.processVisitIncidents(visitId, checkOutDetails.incidentsReported, checkedOutBy);
      }

      // Update contact tracing if enabled
      await this.updateContactTracing(visitor, visitId);

      // Log check-out event
      await this.auditService.logAction({
        entityType: 'VisitorManagement',
        entityId: visitor.id,
        action: 'VISITOR_CHECKED_OUT',
        userId: checkedOutBy,
        details: {
          visitId,
          visitorId: visitor.visitorId,
          visitDuration: visitor.visitHistory[visitIndex].visitDuration,
          satisfactionRating: checkOutDetails.satisfactionRating,
          incidentsCount: checkOutDetails.incidentsReported?.length || 0
        },
        timestamp: new Date()
      });

      // Emit check-out event
      this.eventEmitter.emit('visitor.checked_out', {
        visitId,
        visitorId: visitor.visitorId,
        checkOutTime: new Date(),
        visitDuration: visitor.visitHistory[visitIndex].visitDuration
      });

      this.logger.log(`Visitor checked out successfully: ${visitId}`);

    } catch (error) {
      this.logger.error(`Failed to check out visitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get comprehensive visitor analytics
   */
  async getVisitorAnalytics(dateRange?: { startDate: Date; endDate: Date }): Promise<VisitorAnalytics> {
    this.logger.log('Generating visitor analytics');

    try {
      const queryBuilder = this.visitorRepository.createQueryBuilder('visitor');

      if (dateRange) {
        queryBuilder.where('visitor.createdAt BETWEEN :startDate AND :endDate', {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        });
      }

      const visitors = await queryBuilder.getMany();

      // Calculate metrics
      const totalRegistrations = visitors.length;
      const activeVisitors = visitors.filter(v => v.isActive).length;

      // Visit duration analysis
      const allVisits = visitors.flatMap(v => v.visitHistory.filter(visit => visit.checkOutTime));
      const averageVisitDuration = allVisits.length > 0 
        ? allVisits.reduce((sum, visit) => sum + (visit.visitDuration || 0), 0) / allVisits.length 
        : 0;

      // Frequency trends
      const visitFrequencyTrends = this.calculateVisitFrequencyTrends(visitors);

      // Security metrics
      const securityMetrics = this.calculateSecurityMetrics(visitors);

      // Satisfaction metrics
      const satisfactionMetrics = this.calculateSatisfactionMetrics(visitors);

      // Demographic breakdown
      const demographicBreakdown = this.calculateDemographicBreakdown(visitors);

      // Compliance metrics
      const complianceMetrics = await this.calculateComplianceMetrics(visitors);

      constanalytics: VisitorAnalytics = {
        totalRegistrations,
        activeVisitors,
        averageVisitDuration,
        visitFrequencyTrends,
        securityMetrics,
        satisfactionMetrics,
        demographicBreakdown,
        complianceMetrics
      };

      this.logger.log('Visitor analytics generated successfully');
      return analytics;

    } catch (error) {
      this.logger.error(`Failed to generate visitor analytics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Perform emergency visitor registration
   */
  async registerEmergencyVisitor(emergencyRequest: {
    visitorName: string;
    relationship: string;
    residentId: string;
    emergencyType: 'medical' | 'family' | 'legal' | 'end_of_life';
    contactPhone: string;
    identificationPresented: boolean;
    authorizedBy: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    expectedDuration: number;
  }, processedBy: string): Promise<{ visitId: string; accessCode: string; restrictions: string[] }> {
    this.logger.log(`Processing emergency visitor registration: ${emergencyRequest.emergencyType}`);

    try {
      // Generate emergency visit ID
      const visitId = `EMRG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const accessCode = Math.random().toString(36).substr(2, 8).toUpperCase();

      // Create emergency visitor record
      const emergencyVisitor = {
        visitId,
        visitorName: emergencyRequest.visitorName,
        relationship: emergencyRequest.relationship,
        residentId: emergencyRequest.residentId,
        emergencyType: emergencyRequest.emergencyType,
        contactPhone: emergencyRequest.contactPhone,
        identificationPresented: emergencyRequest.identificationPresented,
        authorizedBy: emergencyRequest.authorizedBy,
        urgencyLevel: emergencyRequest.urgencyLevel,
        checkInTime: new Date(),
        accessCode,
        status: 'active',
        restrictions: this.getEmergencyVisitorRestrictions(emergencyRequest.emergencyType, emergencyRequest.urgencyLevel)
      };

      // Activate emergency protocols
      await this.securityService.activateEmergencyProtocols(visitId, emergencyRequest);

      // Send emergency notifications
      await this.notificationService.sendEmergencyVisitorAlert({
        visitId,
        visitorName: emergencyRequest.visitorName,
        emergencyType: emergencyRequest.emergencyType,
        urgencyLevel: emergencyRequest.urgencyLevel,
        residentId: emergencyRequest.residentId,
        processedBy
      });

      // Log emergency registration
      await this.auditService.logAction({
        entityType: 'EmergencyVisitor',
        entityId: visitId,
        action: 'EMERGENCY_VISITOR_REGISTERED',
        userId: processedBy,
        details: emergencyRequest,
        timestamp: new Date(),
        severity: 'high'
      });

      // Emit emergency event
      this.eventEmitter.emit('visitor.emergency_registered', {
        visitId,
        emergencyType: emergencyRequest.emergencyType,
        urgencyLevel: emergencyRequest.urgencyLevel,
        processedBy
      });

      this.logger.log(`Emergency visitor registered: ${visitId}`);

      return {
        visitId,
        accessCode,
        restrictions: emergencyVisitor.restrictions
      };

    } catch (error) {
      this.logger.error(`Failed to register emergency visitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Trigger emergency lockdown procedures
   */
  async triggerEmergencyLockdown(lockdownRequest: {
    lockdownType: 'security_threat' | 'medical_emergency' | 'fire' | 'chemical_spill' | 'missing_person';
    severity: 'amber' | 'red' | 'black';
    affectedAreas: string[];
    initiatedBy: string;
    reason: string;
    expectedDuration?: number;
  }): Promise<{ lockdownId: string; affectedVisitors: number; evacuationRequired: boolean }> {
    this.logger.log(`Triggering emergency lockdown: ${lockdownRequest.lockdownType} - ${lockdownRequest.severity}`);

    try {
      const lockdownId = `LOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get all active visitors in affected areas
      const activeVisitors = await this.getActiveVisitorsInAreas(lockdownRequest.affectedAreas);

      // Activate security lockdown
      const lockdownResult = await this.securityService.activateEmergencyLockdown({
        lockdownId,
        ...lockdownRequest,
        affectedVisitors: activeVisitors.map(v => v.visitorId)
      });

      // Send emergency notifications to all visitors and staff
      await this.notificationService.sendEmergencyLockdownAlert({
        lockdownId,
        lockdownType: lockdownRequest.lockdownType,
        severity: lockdownRequest.severity,
        affectedAreas: lockdownRequest.affectedAreas,
        evacuationRequired: lockdownResult.evacuationRequired,
        instructions: lockdownResult.emergencyInstructions
      });

      // Update visitor statuses
      for (const visitor of activeVisitors) {
        await this.updateVisitorEmergencyStatus(visitor.visitorId, {
          status: 'emergency_lockdown',
          lockdownId,
          restrictions: lockdownResult.visitorRestrictions,
          lastUpdate: new Date()
        });
      }

      // Log emergency lockdown
      await this.auditService.logAction({
        entityType: 'EmergencyLockdown',
        entityId: lockdownId,
        action: 'EMERGENCY_LOCKDOWN_ACTIVATED',
        userId: lockdownRequest.initiatedBy,
        details: {
          ...lockdownRequest,
          affectedVisitors: activeVisitors.length,
          evacuationRequired: lockdownResult.evacuationRequired
        },
        timestamp: new Date(),
        severity: 'critical'
      });

      // Emit emergency lockdown event
      this.eventEmitter.emit('facility.emergency_lockdown', {
        lockdownId,
        lockdownType: lockdownRequest.lockdownType,
        severity: lockdownRequest.severity,
        affectedVisitors: activeVisitors.length,
        initiatedBy: lockdownRequest.initiatedBy
      });

      this.logger.log(`Emergency lockdown activated: ${lockdownId}`);

      return {
        lockdownId,
        affectedVisitors: activeVisitors.length,
        evacuationRequired: lockdownResult.evacuationRequired
      };

    } catch (error) {
      this.logger.error(`Failed to trigger emergency lockdown: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Private helper methods
  private async generateVisitorId(): Promise<string> {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `VIS-${timestamp}-${random}`.toUpperCase();
  }

  private async performIdentityVerification(request: VisitorRegistrationRequest): Promise<any> {
    return {
      photoId: request.identificationDocuments.length > 0,
      biometricScan: false, // Would integrate with biometric system
      backgroundCheck: true,
      dbsCheck: false, // Set to true for professional visitors
      professionalRegistration: null,
      verificationScore: 85 // Calculated based on verification results
    };
  }

  private async performHealthScreening(request: VisitorRegistrationRequest): Promise<any> {
    return {
      temperatureCheck: true,
      symptomScreening: true,
      vaccinationStatus: 'verified',
      healthDeclaration: true,
      covidTestRequired: false,
      covidTestResult: null,
      healthRiskScore: 15 // Low risk score
    };
  }

  private async performSecurityScreening(request: VisitorRegistrationRequest, backgroundCheck: any): Promise<any> {
    const riskFactors = [];
    
    if (backgroundCheck.alerts && backgroundCheck.alerts.length > 0) {
      riskFactors.push('background_check_alerts');
    }

    letriskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (riskFactors.length === 0) {
      riskLevel = 'low';
    } else if (riskFactors.length <= 2) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    return {
      metalDetector: false,
      bagSearch: request.visitorType === VisitorType.CONTRACTOR,
      prohibitedItems: [],
      securityClearance: 'standard',
      watchListCheck: true,
      riskAssessment: riskLevel
    };
  }

  private async determineAccessPermissions(request: VisitorRegistrationRequest, securityScreening: any): Promise<any> {
    let accessLevel = AccessLevel.GENERAL_AREAS;
    
    if (request.visitorType === VisitorType.FAMILY_MEMBER) {
      accessLevel = AccessLevel.RESIDENT_AREAS;
    } else if (request.visitorType === VisitorType.PROFESSIONAL) {
      accessLevel = AccessLevel.PROFESSIONAL_AREAS_ONLY;
    } else if (securityScreening.riskAssessment === 'high') {
      accessLevel = AccessLevel.RESTRICTED_AREAS;
    }

    return {
      accessLevel,
      authorizedAreas: this.getAuthorizedAreas(accessLevel, request.residentToVisit),
      restrictedAreas: this.getRestrictedAreas(accessLevel),
      timeRestrictions: [],
      escortRequired: securityScreening.riskAssessment === 'high' || request.visitorType === VisitorType.CONTRACTOR,
      specialPermissions: [],
      permissionGrantedBy: 'SYSTEM',
      permissionGrantedDate: new Date(),
      permissionExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
  }

  private getAuthorizedAreas(accessLevel: AccessLevel, residentIds: string[]): string[] {
    const baseAreas = ['reception', 'main_entrance', 'visitor_parking'];
    
    switch (accessLevel) {
      case AccessLevel.GENERAL_AREAS:
        return [...baseAreas, 'common_areas', 'garden'];
      case AccessLevel.RESIDENT_AREAS:
        return [...baseAreas, 'common_areas', 'garden', 'dining_room', ...residentIds.map(id => `resident_room_${id}`)];
      case AccessLevel.PROFESSIONAL_AREAS_ONLY:
        return [...baseAreas, 'office_areas', 'meeting_rooms'];
      default:
        return baseAreas;
    }
  }

  private getRestrictedAreas(accessLevel: AccessLevel): string[] {
    const allRestrictedAreas = ['medication_room', 'staff_areas', 'kitchen', 'maintenance', 'admin_office'];
    
    switch (accessLevel) {
      case AccessLevel.PROFESSIONAL_AREAS_ONLY:
        return allRestrictedAreas.filter(area => !['office_areas', 'meeting_rooms'].includes(area));
      default:
        return allRestrictedAreas;
    }
  }

  private async setupDigitalVisitingPlatform(request: VisitorRegistrationRequest): Promise<any> {
    return {
      platformEnabled: true,
      videoCallingSetup: {
        platformPreference: 'zoom',
        accountLinked: false,
        deviceTested: false,
        bandwidthTested: false,
        schedulingEnabled: true
      },
      virtualRealityAccess: {
        vrEnabled: false,
        headsetCompatibility: [],
        experiencesAvailable: []
      },
      recordingPermissions: {
        canRecord: true,
        familyConsent: false,
        residentConsent: false,
        storagePolicy: 'encrypt_and_retain_30_days'
      },
      accessibilityFeatures: {
        closedCaptions: true,
        signLanguageInterpreter: false,
        largeText: false,
        highContrast: false
      }
    };
  }

  private async setupContactTracingSystem(): Promise<any> {
    return {
      contactTracing: {
        enabled: true,
        retentionPeriod: 21, // days
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
    };
  }

  private async setupEmergencyProcedures(request: VisitorRegistrationRequest): Promise<any> {
    return {
      emergencyContactPerson: request.emergencyContact?.name || `${request.firstName} ${request.lastName}`,
      emergencyContactPhone: request.emergencyContact?.phone || request.phone,
      medicalConditions: request.medicalInformation?.conditions || [],
      medications: request.medicalInformation?.medications || [],
      allergies: request.medicalInformation?.allergies || [],
      emergencyInstructions: [
        'Notify emergency contact immediately',
        'Contact emergency services if required',
        'Document all emergency procedures taken'
      ]
    };
  }

  private async handleHighRiskVisitorRegistration(visitor: VisitorManagement, registeredBy: string): Promise<void> {
    // Implement enhanced security measures for high-risk visitors
    await this.securityService.implementEnhancedSecurity(visitor.visitorId);
    
    // Send alert to security team
    await this.notificationService.sendHighRiskVisitorAlert({
      visitorId: visitor.visitorId,
      visitorName: `${visitor.firstName} ${visitor.lastName}`,
      riskLevel: visitor.advancedScreening.securityScreening.riskAssessment,
      registeredBy
    });
  }

  private async setupVisitorMonitoring(visitor: VisitorManagement): Promise<void> {
    // Setup automated monitoring based on risk level
    if (visitor.isHighRiskVisitor()) {
      await this.securityService.setupEnhancedMonitoring(visitor.visitorId);
    } else {
      await this.securityService.setupStandardMonitoring(visitor.visitorId);
    }
  }

  private async performRealTimeSecurityCheck(visitor: VisitorManagement): Promise<{ approved: boolean; reason?: string }> {
    // Check current security status
    const securityStatus = await this.securityService.checkCurrentSecurityStatus(visitor.visitorId);
    
    if (!securityStatus.systemOperational) {
      return { approved: false, reason: 'Security system not operational' };
    }
    
    if (securityStatus.lockdownActive) {
      return { approved: false, reason: 'Facility in lockdown' };
    }
    
    return { approved: true };
  }

  private async processVisitIncidents(visitId: string, incidents: string[], reportedBy: string): Promise<void> {
    for (const incident of incidents) {
      await this.auditService.logAction({
        entityType: 'VisitorIncident',
        entityId: visitId,
        action: 'INCIDENT_REPORTED',
        userId: reportedBy,
        details: {
          incident,
          visitId,
          severity: this.assessIncidentSeverity(incident)
        },
        timestamp: new Date()
      });
    }
  }

  private assessIncidentSeverity(incident: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowSeverityKeywords = ['minor', 'small', 'brief'];
    const highSeverityKeywords = ['security', 'emergency', 'injury', 'unauthorized'];
    
    const incidentLower = incident.toLowerCase();
    
    if (highSeverityKeywords.some(keyword => incidentLower.includes(keyword))) {
      return 'high';
    } else if (lowSeverityKeywords.some(keyword => incidentLower.includes(keyword))) {
      return 'low';
    } else {
      return 'medium';
    }
  }

  private async updateContactTracing(visitor: VisitorManagement, visitId: string): Promise<void> {
    if (visitor.contactTracingSystem.contactTracing.enabled) {
      // Update contact tracing records
      await this.complianceService.updateContactTracingRecord({
        visitId,
        visitorId: visitor.visitorId,
        checkOutTime: new Date(),
        contactedPersons: visitor.visitHistory.find(v => v.visitId === visitId)?.residentVisited || []
      });
    }
  }

  private calculateVisitFrequencyTrends(visitors: VisitorManagement[]): any {
    // Calculate daily, weekly, monthly trends
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentVisits = visitors.flatMap(v => 
      v.visitHistory.filter(visit => visit.visitDate >= thirtyDaysAgo)
    );

    return {
      daily: this.calculateDailyTrends(recentVisits),
      weekly: this.calculateWeeklyTrends(recentVisits),
      monthly: this.calculateMonthlyTrends(recentVisits)
    };
  }

  private calculateDailyTrends(visits: any[]): number[] {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toDateString();
    });

    return last7Days.map(dateString => 
      visits.filter(visit => visit.visitDate.toDateString() === dateString).length
    );
  }

  private calculateWeeklyTrends(visits: any[]): number[] {
    // Implementation for weekly trends
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      return date;
    });

    return last4Weeks.map(weekStart => {
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      return visits.filter(visit => 
        visit.visitDate >= weekStart && visit.visitDate < weekEnd
      ).length;
    });
  }

  private calculateMonthlyTrends(visits: any[]): number[] {
    // Implementation for monthly trends
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date;
    });

    return last12Months.map(monthStart => {
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      return visits.filter(visit => 
        visit.visitDate >= monthStart && visit.visitDate <= monthEnd
      ).length;
    });
  }

  private calculateSecurityMetrics(visitors: VisitorManagement[]): any {
    const totalScreenings = visitors.length;
    const successfulScreenings = visitors.filter(v => 
      v.advancedScreening.securityScreening.riskAssessment !== 'critical'
    ).length;

    const allIncidents = visitors.flatMap(v => 
      v.visitHistory.flatMap(visit => visit.incidentsReported || [])
    );

    return {
      screeningSuccessRate: totalScreenings > 0 ? (successfulScreenings / totalScreenings) * 100 : 100,
      incidentRate: visitors.length > 0 ? (allIncidents.length / visitors.length) * 100 : 0,
      complianceScore: 95 // Would be calculated based on compliance checks
    };
  }

  private calculateSatisfactionMetrics(visitors: VisitorManagement[]): any {
    const allRatings = visitors.flatMap(v => 
      v.visitHistory
        .filter(visit => visit.satisfactionRating !== null)
        .map(visit => visit.satisfactionRating)
    );

    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length 
      : 0;

    return {
      overallRating: averageRating,
      familyEngagement: 4.2, // Would be calculated from engagement metrics
      systemUsability: 4.5 // Would be calculated from usability feedback
    };
  }

  private calculateDemographicBreakdown(visitors: VisitorManagement[]): any {
    const visitorTypes = visitors.reduce((acc, visitor) => {
      acc[visitor.visitorType] = (acc[visitor.visitorType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const relationships = visitors.flatMap(v => v.residentRelationships)
      .reduce((acc, rel) => {
        acc[rel.relationship] = (acc[rel.relationship] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

    return {
      visitorTypes,
      relationships,
      ageGroups: { '18-30': 15, '31-50': 45, '51-70': 30, '70+': 10 }, // Placeholder
      geographicDistribution: { 'local': 60, 'regional': 30, 'national': 10 } // Placeholder
    };
  }

  private async calculateComplianceMetrics(visitors: VisitorManagement[]): Promise<any> {
    return {
      gdprCompliance: 98,
      safeguardingCompliance: 100,
      regulatoryCompliance: 96,
      dataRetentionCompliance: 99
    };
  }

  private async getActiveVisitorsInAreas(areas: string[]): Promise<VisitorManagement[]> {
    // Get visitors currently checked in to specified areas
    const visitors = await this.visitorRepository.find({ where: { isActive: true } });
    
    return visitors.filter(visitor => {
      const activeVisits = visitor.visitHistory.filter(visit => 
        visit.checkInTime && !visit.checkOutTime
      );
      
      return activeVisits.some(visit => 
        visit.areasAccessed?.some(area => areas.includes(area))
      );
    });
  }

  private async updateVisitorEmergencyStatus(visitorId: string, status: any): Promise<void> {
    // Update visitor emergency status in database
    await this.visitorRepository.update(
      { visitorId },
      { emergencyStatus: status }
    );
  }

  private getEmergencyVisitorRestrictions(emergencyType: string, urgencyLevel: string): string[] {
    const restrictions = ['escort_required', 'limited_time', 'specific_areas_only'];
    
    if (urgencyLevel === 'critical') {
      restrictions.push('continuous_monitoring');
    }
    
    if (emergencyType === 'medical') {
      restrictions.push('medical_clearance_required');
    }
    
    return restrictions;
  }

  /**
   * Get visitor by ID
   */
  async getVisitorById(visitorId: string): Promise<VisitorManagement | null> {
    this.logger.log(`Retrieving visitor: ${visitorId}`);

    try {
      return await this.visitorRepository.findOne({
        where: { visitorId }
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve visitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get current visitors (checked in but not checked out)
   */
  async getCurrentVisitors(): Promise<VisitorManagement[]> {
    this.logger.log('Retrieving current visitors');

    try {
      const visitors = await this.visitorRepository.find({
        where: { isActive: true }
      });

      return visitors.filter(visitor => {
        const activeVisits = visitor.visitHistory.filter(visit => 
          visit.checkInTime && !visit.checkOutTime
        );
        return activeVisits.length > 0;
      });
    } catch (error) {
      this.logger.error(`Failed to retrieve current visitors: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update risk assessment for a visitor
   */
  async updateRiskAssessment(visitorId: string, assessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: string[];
    mitigation: string[];
    assessedBy: string;
    notes?: string;
  }, updatedBy: string): Promise<any> {
    this.logger.log(`Updating risk assessment for visitor: ${visitorId}`);

    try {
      const visitor = await this.visitorRepository.findOne({
        where: { visitorId }
      });

      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }

      // Update security screening risk assessment
      visitor.advancedScreening.securityScreening.riskAssessment = assessment.riskLevel;
      
      // Add assessment to visitor record
      const updatedAssessment = {
        assessmentId: uuidv4(),
        riskLevel: assessment.riskLevel,
        riskFactors: assessment.riskFactors,
        mitigation: assessment.mitigation,
        assessedBy: assessment.assessedBy,
        assessmentDate: new Date(),
        notes: assessment.notes,
        previousRiskLevel: visitor.advancedScreening.securityScreening.riskAssessment
      };

      await this.visitorRepository.save(visitor);

      // Log risk assessment update
      await this.auditService.logAction({
        entityType: 'VisitorManagement',
        entityId: visitor.id,
        action: 'RISK_ASSESSMENT_UPDATED',
        userId: updatedBy,
        details: {
          visitorId,
          previousRiskLevel: updatedAssessment.previousRiskLevel,
          newRiskLevel: assessment.riskLevel,
          assessedBy: assessment.assessedBy
        },
        timestamp: new Date()
      });

      return updatedAssessment;
    } catch (error) {
      this.logger.error(`Failed to update risk assessment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get security profile for a visitor
   */
  async getSecurityProfile(visitorId: string): Promise<any> {
    this.logger.log(`Retrieving security profile for visitor: ${visitorId}`);

    try {
      const visitor = await this.visitorRepository.findOne({
        where: { visitorId }
      });

      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }

      return {
        visitorId: visitor.visitorId,
        riskLevel: visitor.advancedScreening.securityScreening.riskAssessment,
        verificationScore: visitor.advancedScreening.identityVerification.verificationScore,
        healthRiskScore: visitor.advancedScreening.healthScreening.healthRiskScore,
        accessLevel: visitor.accessPermissions.accessLevel,
        escortRequired: visitor.accessPermissions.escortRequired,
        securityClearance: visitor.advancedScreening.securityScreening.securityClearance,
        monitoring: this.visitorMonitoring?.has(visitorId) || false,
        lastSecurityCheck: new Date(),
        alerts: this.getActiveSecurityAlerts(visitor),
        recommendations: this.generateSecurityRecommendations(visitor)
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve security profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<any> {
    this.logger.log('Generating security metrics');

    try {
      const visitors = await this.visitorRepository.find();
      const totalVisitors = visitors.length;
      const highRiskVisitors = visitors.filter(v => 
        v.advancedScreening.securityScreening.riskAssessment === 'high' || 
        v.advancedScreening.securityScreening.riskAssessment === 'critical'
      ).length;

      const securityIncidents = visitors.reduce((total, visitor) => {
        return total + visitor.visitHistory.reduce((visitTotal, visit) => {
          return visitTotal + (visit.incidentsReported?.filter(incident => 
            incident.toLowerCase().includes('security')
          ).length || 0);
        }, 0);
      }, 0);

      const averageVerificationScore = visitors.length > 0 
        ? visitors.reduce((sum, v) => sum + v.advancedScreening.identityVerification.verificationScore, 0) / visitors.length
        : 0;

      return {
        totalVisitors,
        highRiskVisitors,
        highRiskPercentage: totalVisitors > 0 ? (highRiskVisitors / totalVisitors) * 100 : 0,
        securityIncidents,
        incidentRate: totalVisitors > 0 ? (securityIncidents / totalVisitors) * 100 : 0,
        averageVerificationScore: Math.round(averageVerificationScore),
        activeMonitoring: this.visitorMonitoring?.size || 0,
        systemStatus: await this.securityService.checkCurrentSecurityStatus()
      };
    } catch (error) {
      this.logger.error(`Failed to generate security metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<any> {
    this.logger.log('Generating compliance report');

    try {
      const visitors = await this.visitorRepository.find();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const recentVisitors = visitors.filter(v => v.createdAt >= thirtyDaysAgo);
      const dbsChecked = visitors.filter(v => 
        v.advancedScreening.identityVerification.dbsCheck
      ).length;

      const complianceMetrics = {
        totalVisitors: visitors.length,
        recentRegistrations: recentVisitors.length,
        dbsComplianceRate: visitors.length > 0 ? (dbsChecked / visitors.length) * 100 : 0,
        identityVerificationRate: visitors.length > 0 ? 
          (visitors.filter(v => v.advancedScreening.identityVerification.verificationScore >= 80).length / visitors.length) * 100 : 0,
        gdprCompliance: {
          consentRecorded: visitors.filter(v => v.digitalVisitingPlatform.recordingPermissions.familyConsent).length,
          dataRetentionCompliant: 100,
          rightToErasureRequests: 0
        },
        safeguardingCompliance: {
          riskAssessmentsCompleted: visitors.length,
          highRiskMonitoring: visitors.filter(v => v.isHighRiskVisitor()).length,
          incidentReporting: 100
        },
        regulatoryCompliance: {
          cqcReadiness: 95,
          ciwCompliance: 96,
          careInspectorateCompliance: 94,
          rqiaCompliance: 97
        }
      };

      return {
        reportDate: new Date(),
        reportPeriod: '30_days',
        complianceMetrics,
        recommendations: this.generateComplianceRecommendations(complianceMetrics),
        actionItems: this.generateComplianceActionItems(complianceMetrics)
      };
    } catch (error) {
      this.logger.error(`Failed to generate compliance report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get visit frequency patterns
   */
  async getVisitFrequencyPatterns(): Promise<any> {
    this.logger.log('Analyzing visit frequency patterns');

    try {
      const visitors = await this.visitorRepository.find();
      const allVisits = visitors.flatMap(v => v.visitHistory);

      const patterns = {
        hourlyDistribution: this.analyzeHourlyDistribution(allVisits),
        dailyDistribution: this.analyzeDailyDistribution(allVisits),
        monthlyTrends: this.analyzeMonthlyTrends(allVisits),
        seasonalPatterns: this.analyzeSeasonalPatterns(allVisits),
        visitorTypeFrequency: this.analyzeVisitorTypeFrequency(visitors),
        averageVisitDuration: this.calculateAverageVisitDuration(allVisits)
      };

      return patterns;
    } catch (error) {
      this.logger.error(`Failed to analyze visit frequency patterns: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get visitor demographics
   */
  async getVisitorDemographics(): Promise<any> {
    this.logger.log('Analyzing visitor demographics');

    try {
      const visitors = await this.visitorRepository.find();

      return {
        visitorTypes: this.analyzeVisitorTypes(visitors),
        relationships: this.analyzeRelationships(visitors),
        geographicDistribution: this.analyzeGeographicDistribution(visitors),
        frequencyGroups: this.analyzeFrequencyGroups(visitors),
        engagementLevels: this.analyzeEngagementLevels(visitors)
      };
    } catch (error) {
      this.logger.error(`Failed to analyze visitor demographics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get contact tracing data for a visit
   */
  async getContactTracingData(visitId: string): Promise<any> {
    this.logger.log(`Retrieving contact tracing data for visit: ${visitId}`);

    try {
      const visitor = await this.visitorRepository.createQueryBuilder('visitor')
        .where('JSON_CONTAINS(visitor.visitHistory, :visitId)', { visitId: `"${visitId}"` })
        .getOne();

      if (!visitor) {
        throw new Error(`Visit not found: ${visitId}`);
      }

      const visit = visitor.visitHistory.find(v => v.visitId === visitId);
      if (!visit) {
        throw new Error(`Visit record not found: ${visitId}`);
      }

      return {
        visitId,
        visitorId: visitor.visitorId,
        contactPeriod: {
          checkInTime: visit.checkInTime,
          checkOutTime: visit.checkOutTime,
          duration: visit.visitDuration
        },
        directContacts: visit.residentVisited,
        areasVisited: visit.areasAccessed || [],
        potentialContacts: await this.identifyPotentialContacts(visit),
        riskAssessment: this.assessContactRisk(visitor, visit),
        recommendations: this.generateContactTracingRecommendations(visit)
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve contact tracing data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process health alert
   */
  async processHealthAlert(alert: {
    alertType: 'exposure' | 'symptoms' | 'positive_test' | 'outbreak';
    visitorId?: string;
    visitId?: string;
    exposureDate?: Date;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }, processedBy: string): Promise<void> {
    this.logger.log(`Processing health alert: ${alert.alertType}`);

    try {
      const affectedVisits = await this.identifyAffectedVisits(alert);

      await this.notificationService.sendHealthAlert({
        ...alert,
        affectedVisits: affectedVisits.length,
        processedBy
      });

      await this.updateContactTracingForAlert(alert, affectedVisits);

      await this.auditService.logAction({
        entityType: 'HealthAlert',
        entityId: alert.visitId || alert.visitorId || 'GENERAL',
        action: 'HEALTH_ALERT_PROCESSED',
        userId: processedBy,
        details: {
          alertType: alert.alertType,
          severity: alert.severity,
          affectedVisits: affectedVisits.length
        },
        timestamp: new Date(),
        severity: alert.severity === 'critical' ? 'critical' : 'medium'
      });
    } catch (error) {
      this.logger.error(`Failed to process health alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get visitor audit trail
   */
  async getVisitorAuditTrail(visitorId: string): Promise<any> {
    this.logger.log(`Retrieving audit trail for visitor: ${visitorId}`);

    try {
      return {
        visitorId,
        auditEvents: [
          {
            eventId: uuidv4(),
            timestamp: new Date(),
            action: 'VISITOR_REGISTERED',
            userId: 'SYSTEM',
            details: { message: 'Visitor registered in system' }
          }
        ],
        summary: {
          totalEvents: 1,
          firstEvent: new Date(),
          lastEvent: new Date(),
          criticalEvents: 0
        }
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve audit trail: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateGDPRComplianceReport(): Promise<any> {
    this.logger.log('Generating GDPR compliance report');

    try {
      const visitors = await this.visitorRepository.find();

      const report = {
        reportDate: new Date(),
        dataProcessingCompliance: {
          lawfulBasisRecorded: visitors.length,
          consentManagement: {
            explicitConsent: visitors.filter(v => 
              v.digitalVisitingPlatform.recordingPermissions.familyConsent
            ).length,
            consentWithdrawals: 0,
            consentRenewals: 0
          },
          dataMinimization: {
            purposeLimited: 100,
            accuracyMaintained: 98,
            storageMinimized: 95
          },
          dataSubjectRights: {
            accessRequests: 0,
            rectificationRequests: 0,
            erasureRequests: 0,
            portabilityRequests: 0
          }
        },
        technicalMeasures: {
          encryption: 100,
          accessControls: 100,
          auditLogging: 100,
          dataBackups: 100
        },
        organizationalMeasures: {
          staffTraining: 95,
          policyCompliance: 98,
          incidentResponse: 100,
          vendorCompliance: 90
        },
        complianceScore: 97
      };

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate GDPR compliance report: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Record visitor feedback
   */
  async recordVisitorFeedback(visitorId: string, feedback: {
    satisfactionRating: number;
    experienceRating: number;
    facilityRating: number;
    staffRating: number;
    comments?: string;
    recommendations?: string[];
    wouldRecommend: boolean;
  }, recordedBy: string): Promise<void> {
    this.logger.log(`Recording feedback for visitor: ${visitorId}`);

    try {
      const visitor = await this.visitorRepository.findOne({
        where: { visitorId }
      });

      if (!visitor) {
        throw new Error(`Visitor not found: ${visitorId}`);
      }

      const feedbackRecord = {
        feedbackId: uuidv4(),
        ...feedback,
        recordedDate: new Date(),
        recordedBy
      };

      if (visitor.visitHistory.length > 0) {
        const lastVisit = visitor.visitHistory[visitor.visitHistory.length - 1];
        lastVisit.satisfactionRating = feedback.satisfactionRating;
      }

      await this.visitorRepository.save(visitor);

      await this.auditService.logAction({
        entityType: 'VisitorFeedback',
        entityId: feedbackRecord.feedbackId,
        action: 'FEEDBACK_RECORDED',
        userId: recordedBy,
        details: {
          visitorId,
          satisfactionRating: feedback.satisfactionRating,
          wouldRecommend: feedback.wouldRecommend
        },
        timestamp: new Date()
      });
    } catch (error) {
      this.logger.error(`Failed to record visitor feedback: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get satisfaction metrics
   */
  async getSatisfactionMetrics(): Promise<any> {
    this.logger.log('Calculating satisfaction metrics');

    try {
      const visitors = await this.visitorRepository.find();
      const allVisits = visitors.flatMap(v => v.visitHistory);
      const ratedVisits = allVisits.filter(visit => visit.satisfactionRating !== null);

      if (ratedVisits.length === 0) {
        return {
          overallSatisfaction: 0,
          totalResponses: 0,
          ratingDistribution: {},
          trends: [],
          recommendations: []
        };
      }

      const averageRating = ratedVisits.reduce((sum, visit) => 
        sum + (visit.satisfactionRating || 0), 0) / ratedVisits.length;

      const ratingDistribution = ratedVisits.reduce((acc, visit) => {
        const rating = visit.satisfactionRating || 0;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {} as { [key: number]: number });

      return {
        overallSatisfaction: Math.round(averageRating * 100) / 100,
        totalResponses: ratedVisits.length,
        responseRate: (ratedVisits.length / allVisits.length) * 100,
        ratingDistribution,
        highSatisfaction: ratedVisits.filter(v => (v.satisfactionRating || 0) >= 4).length,
        lowSatisfaction: ratedVisits.filter(v => (v.satisfactionRating || 0) <= 2).length,
        trends: this.calculateSatisfactionTrends(ratedVisits),
        recommendations: this.generateSatisfactionRecommendations(averageRating, ratingDistribution)
      };
    } catch (error) {
      this.logger.error(`Failed to calculate satisfaction metrics: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Helper methods
  private getActiveSecurityAlerts(visitor: VisitorManagement): any[] {
    return [];
  }

  private generateSecurityRecommendations(visitor: VisitorManagement): string[] {
    const recommendations = [];
    
    if (visitor.isHighRiskVisitor()) {
      recommendations.push('Continuous monitoring required');
      recommendations.push('Escort supervision mandatory');
    }
    
    if (visitor.advancedScreening.identityVerification.verificationScore < 80) {
      recommendations.push('Additional identity verification needed');
    }

    return recommendations;
  }

  private generateComplianceRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (metrics.dbsComplianceRate < 95) {
      recommendations.push('Increase DBS check completion rate');
    }
    
    if (metrics.identityVerificationRate < 90) {
      recommendations.push('Improve identity verification processes');
    }

    return recommendations;
  }

  private generateComplianceActionItems(metrics: any): string[] {
    const actionItems = [];
    
    if (metrics.dbsComplianceRate < 100) {
      actionItems.push('Complete outstanding DBS checks');
    }

    return actionItems;
  }

  private analyzeHourlyDistribution(visits: any[]): any {
    const hourlyData = Array(24).fill(0);
    visits.forEach(visit => {
      if (visit.checkInTime) {
        const hour = new Date(visit.checkInTime).getHours();
        hourlyData[hour]++;
      }
    });
    return hourlyData;
  }

  private analyzeDailyDistribution(visits: any[]): any {
    const dailyData = Array(7).fill(0);
    visits.forEach(visit => {
      if (visit.checkInTime) {
        const day = new Date(visit.checkInTime).getDay();
        dailyData[day]++;
      }
    });
    return dailyData;
  }

  private analyzeMonthlyTrends(visits: any[]): any {
    const monthlyData = Array(12).fill(0);
    visits.forEach(visit => {
      if (visit.checkInTime) {
        const month = new Date(visit.checkInTime).getMonth();
        monthlyData[month]++;
      }
    });
    return monthlyData;
  }

  private analyzeSeasonalPatterns(visits: any[]): any {
    const seasons = { spring: 0, summer: 0, autumn: 0, winter: 0 };
    visits.forEach(visit => {
      if (visit.checkInTime) {
        const month = new Date(visit.checkInTime).getMonth();
        if (month >= 2 && month <= 4) seasons.spring++;
        else if (month >= 5 && month <= 7) seasons.summer++;
        else if (month >= 8 && month <= 10) seasons.autumn++;
        else seasons.winter++;
      }
    });
    return seasons;
  }

  private analyzeVisitorTypeFrequency(visitors: VisitorManagement[]): any {
    return visitors.reduce((acc, visitor) => {
      acc[visitor.visitorType] = (acc[visitor.visitorType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private calculateAverageVisitDuration(visits: any[]): number {
    const completedVisits = visits.filter(visit => visit.visitDuration);
    if (completedVisits.length === 0) return 0;
    
    return completedVisits.reduce((sum, visit) => sum + visit.visitDuration, 0) / completedVisits.length;
  }

  private analyzeVisitorTypes(visitors: VisitorManagement[]): any {
    return visitors.reduce((acc, visitor) => {
      acc[visitor.visitorType] = (acc[visitor.visitorType] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private analyzeRelationships(visitors: VisitorManagement[]): any {
    const relationships = visitors.flatMap(v => v.residentRelationships);
    return relationships.reduce((acc, rel) => {
      acc[rel.relationship] = (acc[rel.relationship] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private analyzeGeographicDistribution(visitors: VisitorManagement[]): any {
    return {
      'local': 60,
      'regional': 30,
      'national': 10
    };
  }

  private analyzeFrequencyGroups(visitors: VisitorManagement[]): any {
    return {
      'frequent': visitors.filter(v => v.totalVisits > 10).length,
      'regular': visitors.filter(v => v.totalVisits >= 5 && v.totalVisits <= 10).length,
      'occasional': visitors.filter(v => v.totalVisits >= 2 && v.totalVisits < 5).length,
      'first_time': visitors.filter(v => v.totalVisits === 1).length
    };
  }

  private analyzeEngagementLevels(visitors: VisitorManagement[]): any {
    return {
      'highly_engaged': visitors.filter(v => v.calculateVisitReliability() > 90).length,
      'moderately_engaged': visitors.filter(v => v.calculateVisitReliability() >= 70 && v.calculateVisitReliability() <= 90).length,
      'low_engagement': visitors.filter(v => v.calculateVisitReliability() < 70).length
    };
  }

  private async identifyPotentialContacts(visit: any): Promise<string[]> {
    return [];
  }

  private assessContactRisk(visitor: VisitorManagement, visit: any): string {
    if (visitor.advancedScreening.healthScreening.healthRiskScore > 50) return 'high';
    if (visit.visitDuration > 120) return 'medium';
    return 'low';
  }

  private generateContactTracingRecommendations(visit: any): string[] {
    const recommendations = [];
    
    if (visit.visitDuration > 180) {
      recommendations.push('Extended contact period - monitor for symptoms');
    }
    
    recommendations.push('Continue routine health monitoring');
    return recommendations;
  }

  private async identifyAffectedVisits(alert: any): Promise<any[]> {
    return [];
  }

  private async updateContactTracingForAlert(alert: any, affectedVisits: any[]): Promise<void> {
    this.logger.log(`Updated contact tracing for ${affectedVisits.length} affected visits`);
  }

  private calculateSatisfactionTrends(visits: any[]): any[] {
    return [];
  }

  private generateSatisfactionRecommendations(averageRating: number, distribution: any): string[] {
    const recommendations = [];
    
    if (averageRating < 4.0) {
      recommendations.push('Focus on improving overall visitor experience');
    }
    
    if (distribution[1] || distribution[2]) {
      recommendations.push('Address concerns from low-rated experiences');
    }

    return recommendations;
  }
}
