import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum VisitorType {
  FAMILY_MEMBER = 'family_member',
  FRIEND = 'friend',
  HEALTHCARE_PROFESSIONAL = 'healthcare_professional',
  CONTRACTOR = 'contractor',
  OFFICIAL_VISITOR = 'official_visitor',
  VOLUNTEER = 'volunteer',
  STUDENT = 'student',
  INSPECTOR = 'inspector',
  EMERGENCY_SERVICES = 'emergency_services'
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESTRICTED = 'restricted'
}

export enum AccessLevel {
  UNRESTRICTED = 'unrestricted',
  SUPERVISED = 'supervised',
  RESTRICTED_AREAS = 'restricted_areas',
  SPECIFIC_RESIDENT_ONLY = 'specific_resident_only',
  PROFESSIONAL_AREAS_ONLY = 'professional_areas_only',
  DENIED = 'denied'
}

export interface AdvancedVisitorScreening {
  identityVerification: {
    photoId: boolean;
    biometricScan: boolean;
    backgroundCheck: boolean;
    dbsCheck: boolean;
    professionalRegistration?: string;
    verificationScore: number; // 0-100
  };
  healthScreening: {
    temperatureCheck: boolean;
    symptomScreening: boolean;
    vaccinationStatus: string;
    healthDeclaration: boolean;
    covidTestRequired: boolean;
    covidTestResult?: 'negative' | 'positive' | 'pending';
    healthRiskScore: number; // 0-100
  };
  securityScreening: {
    metalDetector: boolean;
    bagSearch: boolean;
    prohibitedItems: string[];
    securityClearance?: string;
    watchListCheck: boolean;
    riskAssessment: 'low' | 'medium' | 'high' | 'critical';
  };
  behavioralAssessment: {
    previousVisitBehavior: 'excellent' | 'good' | 'concerning' | 'problematic';
    riskIndicators: string[];
    specialRequirements: string[];
    communicationNeeds: string[];
    culturalConsiderations: string[];
  };
}

export interface DigitalVisitingPlatform {
  virtualVisitCapabilities: {
    videoCallQuality: 'standard' | 'hd' | '4k';
    multiParticipantSupport: boolean;
    recordingCapability: boolean;
    screenSharing: boolean;
    documentSharing: boolean;
    languageTranslation: boolean;
    accessibilityFeatures: string[];
  };
  schedulingSystem: {
    advanceBooking: number; // days
    flexibleScheduling: boolean;
    recurringVisits: boolean;
    groupVisits: boolean;
    emergencyVisits: boolean;
    timeSlotManagement: boolean;
  };
  familyEngagement: {
    familyPortalAccess: boolean;
    careUpdatesSharing: boolean;
    photoVideoSharing: boolean;
    eventParticipation: boolean;
    carePlanInvolvement: boolean;
    feedbackCollection: boolean;
  };
  technicalSupport: {
    deviceSupport: string[];
    troubleshooting: boolean;
    userTraining: boolean;
    technicalHelpdesk: boolean;
    accessibilitySupport: boolean;
  };
}

export interface VisitorAnalytics {
  visitFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
    averageVisitDuration: number; // minutes
    peakVisitingHours: string[];
    seasonalPatterns: { [month: string]: number };
  };
  visitorDemographics: {
    ageGroups: { [ageGroup: string]: number };
    relationships: { [relationship: string]: number };
    geographicDistribution: { [region: string]: number };
    visitingFrequency: { [frequency: string]: number };
  };
  satisfactionMetrics: {
    overallSatisfaction: number; // 1-5
    facilityRating: number; // 1-5
    staffRating: number; // 1-5
    communicationRating: number; // 1-5
    improvementSuggestions: string[];
  };
  securityMetrics: {
    securityIncidents: number;
    accessViolations: number;
    screeningFailures: number;
    emergencyActivations: number;
    averageProcessingTime: number; // minutes
  };
}

export interface ContactTracingSystem {
  contactTracing: {
    enabled: boolean;
    retentionPeriod: number; // days
    privacyCompliant: boolean;
    automatedAlerts: boolean;
  };
  exposureNotification: {
    rapidNotification: boolean;
    contactIdentification: boolean;
    riskAssessment: boolean;
    isolationProtocols: boolean;
    testingCoordination: boolean;
  };
  healthMonitoring: {
    preVisitScreening: boolean;
    postVisitMonitoring: boolean;
    symptomTracking: boolean;
    healthStatusUpdates: boolean;
    quarantineManagement: boolean;
  };
}

@Entity('visitor_management')
export class VisitorManagement extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  visitorId: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column('date')
  dateOfBirth: Date;

  @Column()
  phoneNumber: string;

  @Column({ nullable: true })
  email?: string;

  @Column({
    type: 'enum',
    enum: VisitorType
  })
  visitorType: VisitorType;

  @Column('jsonb')
  address: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
  };

  @Column('jsonb')
  residentRelationships: Array<{
    residentId: string;
    relationship: string;
    relationshipStrength: 'close' | 'moderate' | 'distant';
    visitingFrequency: 'daily' | 'weekly' | 'monthly' | 'occasional';
    preferredVisitTimes: string[];
    specialArrangements: string[];
  }>;

  @Column('jsonb')
  advancedScreening: AdvancedVisitorScreening;

  @Column('jsonb')
  accessPermissions: {
    accessLevel: AccessLevel;
    authorizedAreas: string[];
    restrictedAreas: string[];
    timeRestrictions: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    escortRequired: boolean;
    specialPermissions: string[];
    permissionGrantedBy: string;
    permissionGrantedDate: Date;
    permissionExpiryDate?: Date;
  };

  @Column('jsonb')
  visitHistory: Array<{
    visitId: string;
    visitDate: Date;
    checkInTime: Date;
    checkOutTime?: Date;
    visitDuration?: number; // minutes
    residentVisited: string[];
    areasAccessed: string[];
    escortedBy?: string;
    visitPurpose: string;
    visitNotes?: string;
    incidentsReported: string[];
    satisfactionRating?: number; // 1-5
  }>;

  @Column('jsonb')
  digitalVisitingPlatform: DigitalVisitingPlatform;

  @Column('jsonb')
  contactTracingSystem: ContactTracingSystem;

  @Column('jsonb')
  emergencyProcedures: {
    emergencyContactPerson: string;
    emergencyContactPhone: string;
    medicalConditions: string[];
    medications: string[];
    allergies: string[];
    emergencyInstructions: string[];
  };

  @Column({ default: true })
  isActive: boolean;

  @Column('timestamp', { nullable: true })
  lastVisit?: Date;

  @Column('timestamp', { nullable: true })
  nextScheduledVisit?: Date;

  @Column('int', { default: 0 })
  totalVisits: number;

  @Column('int', { default: 0 })
  missedVisits: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isAuthorizedToVisit(): boolean {
    return this.isActive &&
           this.accessPermissions.accessLevel !== AccessLevel.DENIED &&
           this.hasValidPermissions() &&
           this.passesSecurityScreening();
  }

  hasValidPermissions(): boolean {
    if (!this.accessPermissions.permissionExpiryDate) return true;
    return new Date() <= new Date(this.accessPermissions.permissionExpiryDate);
  }

  passesSecurityScreening(): boolean {
    return this.advancedScreening.securityScreening.riskAssessment !== 'critical' &&
           this.advancedScreening.identityVerification.verificationScore >= 70 &&
           this.advancedScreening.healthScreening.healthRiskScore <= 30;
  }

  canVisitResident(residentId: string): boolean {
    if (!this.isAuthorizedToVisit()) return false;
    
    const relationship = this.residentRelationships.find(rel => rel.residentId === residentId);
    return !!relationship;
  }

  canAccessArea(areaName: string): boolean {
    if (!this.isAuthorizedToVisit()) return false;
    
    return this.accessPermissions.authorizedAreas.includes(areaName) &&
           !this.accessPermissions.restrictedAreas.includes(areaName);
  }

  canVisitAtTime(visitTime: Date): boolean {
    if (!this.isAuthorizedToVisit()) return false;
    
    const dayOfWeek = visitTime.toLocaleDateString('en-US', { weekday: 'lowercase' });
    const timeString = visitTime.toTimeString().substring(0, 5);
    
    const timeRestriction = this.accessPermissions.timeRestrictions.find(restriction => 
      restriction.dayOfWeek === dayOfWeek
    );
    
    if (!timeRestriction) return true; // No restrictions for this day
    
    return timeString >= timeRestriction.startTime && timeString <= timeRestriction.endTime;
  }

  isFrequentVisitor(): boolean {
    return this.totalVisits >= 10 &&
           this.calculateVisitReliability() >= 80;
  }

  calculateVisitReliability(): number {
    if (this.totalVisits === 0) return 100;
    const completedVisits = this.totalVisits - this.missedVisits;
    return (completedVisits / this.totalVisits) * 100;
  }

  isHighRiskVisitor(): boolean {
    return this.advancedScreening.securityScreening.riskAssessment === 'high' ||
           this.advancedScreening.securityScreening.riskAssessment === 'critical' ||
           this.advancedScreening.behavioralAssessment.previousVisitBehavior === 'problematic';
  }

  requiresEscort(): boolean {
    return this.accessPermissions.escortRequired ||
           this.isHighRiskVisitor() ||
           this.visitorType === VisitorType.CONTRACTOR ||
           this.visitorType === VisitorType.INSPECTOR;
  }

  checkIn(visitDetails: {
    visitPurpose: string;
    residentToVisit: string[];
    estimatedDuration: number;
    escortedBy?: string;
  }): string {
    const visitId = crypto.randomUUID();
    
    const visit = {
      visitId,
      visitDate: new Date(),
      checkInTime: new Date(),
      residentVisited: visitDetails.residentToVisit,
      areasAccessed: [],
      escortedBy: visitDetails.escortedBy,
      visitPurpose: visitDetails.visitPurpose,
      incidentsReported: []
    };
    
    this.visitHistory.push(visit);
    this.lastVisit = new Date();
    
    return visitId;
  }

  checkOut(visitId: string, visitNotes?: string, satisfactionRating?: number): void {
    const visit = this.visitHistory.find(v => v.visitId === visitId);
    if (visit) {
      visit.checkOutTime = new Date();
      visit.visitDuration = Math.floor((visit.checkOutTime.getTime() - visit.checkInTime.getTime()) / (1000 * 60));
      visit.visitNotes = visitNotes;
      visit.satisfactionRating = satisfactionRating;
      
      this.totalVisits++;
    }
  }

  addVisitIncident(visitId: string, incidentDescription: string): void {
    const visit = this.visitHistory.find(v => v.visitId === visitId);
    if (visit) {
      visit.incidentsReported.push(incidentDescription);
      
      // Update behavioral assessment if incident is concerning
      if (incidentDescription.toLowerCase().includes('concerning') || 
          incidentDescription.toLowerCase().includes('inappropriate')) {
        this.advancedScreening.behavioralAssessment.previousVisitBehavior = 'concerning';
        this.advancedScreening.behavioralAssessment.riskIndicators.push(incidentDescription);
      }
    }
  }

  updateAccessPermissions(newPermissions: {
    accessLevel: AccessLevel;
    authorizedAreas: string[];
    restrictedAreas: string[];
    escortRequired: boolean;
    grantedBy: string;
    expiryDate?: Date;
  }): void {
    this.accessPermissions = {
      ...this.accessPermissions,
      ...newPermissions,
      permissionGrantedBy: newPermissions.grantedBy,
      permissionGrantedDate: new Date(),
      permissionExpiryDate: newPermissions.expiryDate
    };
  }

  scheduleVirtualVisit(visitDetails: {
    residentId: string;
    scheduledTime: Date;
    duration: number;
    visitType: 'video_call' | 'phone_call' | 'virtual_reality';
    technicalSupport: boolean;
  }): string {
    const visitId = crypto.randomUUID();
    
    // Add to visit history as scheduled virtual visit
    this.visitHistory.push({
      visitId,
      visitDate: visitDetails.scheduledTime,
      checkInTime: visitDetails.scheduledTime,
      residentVisited: [visitDetails.residentId],
      areasAccessed: ['virtual_visiting_room'],
      visitPurpose: `Virtual visit - ${visitDetails.visitType}`,
      incidentsReported: []
    });
    
    this.nextScheduledVisit = visitDetails.scheduledTime;
    
    return visitId;
  }

  getVisitAnalytics(): VisitorAnalytics {
    const recentVisits = this.visitHistory.filter(visit => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(visit.visitDate) >= thirtyDaysAgo;
    });

    const visitDurations = recentVisits
      .filter(visit => visit.visitDuration)
      .map(visit => visit.visitDuration!);

    const averageVisitDuration = visitDurations.length > 0 
      ? visitDurations.reduce((sum, duration) => sum + duration, 0) / visitDurations.length 
      : 0;

    const satisfactionRatings = recentVisits
      .filter(visit => visit.satisfactionRating)
      .map(visit => visit.satisfactionRating!);

    const averageSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((sum, rating) => sum + rating, 0) / satisfactionRatings.length
      : 0;

    return {
      visitFrequency: {
        daily: recentVisits.filter(visit => this.isVisitToday(visit.visitDate)).length,
        weekly: recentVisits.length,
        monthly: this.visitHistory.filter(visit => this.isVisitThisMonth(visit.visitDate)).length,
        averageVisitDuration,
        peakVisitingHours: this.calculatePeakVisitingHours(),
        seasonalPatterns: this.calculateSeasonalPatterns()
      },
      visitorDemographics: {
        ageGroups: this.calculateAgeGroups(),
        relationships: this.calculateRelationshipDistribution(),
        geographicDistribution: { 'local': 70, 'regional': 25, 'distant': 5 },
        visitingFrequency: { 'regular': 60, 'occasional': 30, 'rare': 10 }
      },
      satisfactionMetrics: {
        overallSatisfaction: averageSatisfaction,
        facilityRating: 4.3,
        staffRating: 4.5,
        communicationRating: 4.2,
        improvementSuggestions: this.extractImprovementSuggestions()
      },
      securityMetrics: {
        securityIncidents: this.countSecurityIncidents(),
        accessViolations: this.countAccessViolations(),
        screeningFailures: this.countScreeningFailures(),
        emergencyActivations: 0,
        averageProcessingTime: 8 // minutes
      }
    };
  }

  private isVisitToday(visitDate: Date): boolean {
    const today = new Date();
    const visit = new Date(visitDate);
    return today.toDateString() === visit.toDateString();
  }

  private isVisitThisMonth(visitDate: Date): boolean {
    const thisMonth = new Date();
    const visit = new Date(visitDate);
    return thisMonth.getMonth() === visit.getMonth() && thisMonth.getFullYear() === visit.getFullYear();
  }

  private calculatePeakVisitingHours(): string[] {
    const hourCounts = this.visitHistory.reduce((acc, visit) => {
      const hour = new Date(visit.checkInTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as { [hour: number]: number });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  private calculateSeasonalPatterns(): { [month: string]: number } {
    const monthCounts = this.visitHistory.reduce((acc, visit) => {
      const month = new Date(visit.visitDate).toLocaleDateString('en-US', { month: 'long' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as { [month: string]: number });

    return monthCounts;
  }

  private calculateAgeGroups(): { [ageGroup: string]: number } {
    const age = new Date().getFullYear() - new Date(this.dateOfBirth).getFullYear();
    const ageGroup = age < 18 ? 'Under 18' :
                   age < 30 ? '18-29' :
                   age < 50 ? '30-49' :
                   age < 70 ? '50-69' : '70+';
    
    return { [ageGroup]: 1 };
  }

  private calculateRelationshipDistribution(): { [relationship: string]: number } {
    return this.residentRelationships.reduce((acc, rel) => {
      acc[rel.relationship] = (acc[rel.relationship] || 0) + 1;
      return acc;
    }, {} as { [relationship: string]: number });
  }

  private extractImprovementSuggestions(): string[] {
    const suggestions = [];
    
    if (this.calculateVisitReliability() < 80) {
      suggestions.push('Improve visit scheduling flexibility');
    }
    
    const avgSatisfaction = this.getVisitAnalytics().satisfactionMetrics.overallSatisfaction;
    if (avgSatisfaction < 4.0) {
      suggestions.push('Enhance visitor experience and facilities');
    }
    
    if (this.countSecurityIncidents() > 0) {
      suggestions.push('Review and strengthen security procedures');
    }
    
    return suggestions;
  }

  private countSecurityIncidents(): number {
    return this.visitHistory.reduce((count, visit) => 
      count + visit.incidentsReported.filter(incident => 
        incident.toLowerCase().includes('security') || 
        incident.toLowerCase().includes('unauthorized')
      ).length, 0
    );
  }

  private countAccessViolations(): number {
    return this.visitHistory.reduce((count, visit) => 
      count + visit.incidentsReported.filter(incident => 
        incident.toLowerCase().includes('access') || 
        incident.toLowerCase().includes('restricted')
      ).length, 0
    );
  }

  private countScreeningFailures(): number {
    return this.visitHistory.filter(visit => 
      visit.incidentsReported.some(incident => 
        incident.toLowerCase().includes('screening') || 
        incident.toLowerCase().includes('identification')
      )
    ).length;
  }

  generateVisitorProfile(): any {
    return {
      visitorSummary: {
        visitorId: this.visitorId,
        name: `${this.firstName} ${this.lastName}`,
        visitorType: this.visitorType,
        totalVisits: this.totalVisits,
        visitReliability: this.calculateVisitReliability(),
        lastVisit: this.lastVisit
      },
      securityProfile: {
        riskLevel: this.advancedScreening.securityScreening.riskAssessment,
        verificationScore: this.advancedScreening.identityVerification.verificationScore,
        healthRiskScore: this.advancedScreening.healthScreening.healthRiskScore,
        behaviorRating: this.advancedScreening.behavioralAssessment.previousVisitBehavior
      },
      accessProfile: {
        accessLevel: this.accessPermissions.accessLevel,
        authorizedAreas: this.accessPermissions.authorizedAreas.length,
        escortRequired: this.accessPermissions.escortRequired,
        permissionsValid: this.hasValidPermissions()
      },
      relationshipProfile: {
        residentConnections: this.residentRelationships.length,
        primaryRelationships: this.residentRelationships.filter(rel => rel.relationshipStrength === 'close').length,
        visitingPatterns: this.residentRelationships.map(rel => rel.visitingFrequency)
      },
      analytics: this.getVisitAnalytics(),
      recommendations: this.generateVisitorRecommendations()
    };
  }

  private generateVisitorRecommendations(): string[] {
    const recommendations = [];
    
    if (this.isFrequentVisitor() && this.requiresEscort()) {
      recommendations.push('Consider reducing escort requirements for trusted frequent visitor');
    }
    
    if (this.calculateVisitReliability() < 70) {
      recommendations.push('Provide visit scheduling support and reminders');
    }
    
    if (this.isHighRiskVisitor()) {
      recommendations.push('Enhanced security screening and monitoring required');
    }
    
    const avgSatisfaction = this.getVisitAnalytics().satisfactionMetrics.overallSatisfaction;
    if (avgSatisfaction < 3.5) {
      recommendations.push('Investigate visitor concerns and improve experience');
    }
    
    return recommendations;
  }
}