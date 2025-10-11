import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';

export enum ClientStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DISCHARGED = 'discharged',
  DECEASED = 'deceased',
  TRANSFERRED = 'transferred'
}

export enum CarePackageType {
  PERSONAL_CARE = 'personal_care',
  DOMESTIC_SUPPORT = 'domestic_support',
  MEDICATION_SUPPORT = 'medication_support',
  COMPANIONSHIP = 'companionship',
  COMPLEX_CARE = 'complex_care',
  LIVE_IN_CARE = 'live_in_care',
  RESPITE_CARE = 'respite_care',
  END_OF_LIFE_CARE = 'end_of_life_care'
}

export enum FundingSource {
  PRIVATE_PAY = 'private_pay',
  LOCAL_AUTHORITY = 'local_authority',
  NHS_CHC = 'nhs_chc',
  DIRECT_PAYMENTS = 'direct_payments',
  PERSONAL_HEALTH_BUDGET = 'personal_health_budget',
  MIXED_FUNDING = 'mixed_funding'
}

export interface HomeEnvironmentAssessment {
  assessmentDate: Date;
  assessorId: string;
  overallSafetyScore: number; // 0-100
  accessibilityScore: number; // 0-100
  riskFactors: Array<{
    riskType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    mitigationRequired: boolean;
    mitigationPlan?: string;
    targetDate?: Date;
  }>;
  adaptationsRequired: Array<{
    adaptationType: string;
    urgency: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    estimatedCost: number;
    fundingSource: string;
    installationDate?: Date;
  }>;
  emergencyProcedures: {
    emergencyContacts: Array<{
      name: string;
      relationship: string;
      phone: string;
      availability: string;
    }>;
    emergencyEquipment: string[];
    evacuationPlan: string;
    medicalEmergencyProtocol: string;
  };
}

export interface AdvancedCarePackage {
  packageId: string;
  packageName: string;
  packageType: CarePackageType;
  weeklyHours: number;
  hourlyRate: number;
  totalWeeklyCost: number;
  fundingSource: FundingSource;
  careActivities: Array<{
    activityId: string;
    activityName: string;
    frequency: string;
    duration: number; // minutes
    skillLevel: 'basic' | 'intermediate' | 'advanced' | 'specialist';
    equipmentRequired: string[];
    riskLevel: 'low' | 'medium' | 'high';
    outcomeMetrics: string[];
  }>;
  specialRequirements: {
    medicalConditions: string[];
    cognitiveSupport: string[];
    mobilitySupport: string[];
    communicationNeeds: string[];
    culturalRequirements: string[];
    dietaryRequirements: string[];
  };
  qualityMetrics: {
    clientSatisfaction: number; // 1-5
    familySatisfaction: number; // 1-5
    outcomeAchievement: number; // percentage
    complianceScore: number; // 0-100
    costEffectiveness: number; // 0-100
  };
}

export interface GPSVisitVerification {
  visitId: string;
  scheduledArrival: Date;
  actualArrival?: Date;
  scheduledDeparture: Date;
  actualDeparture?: Date;
  gpsCoordinates: {
    arrival: { latitude: number; longitude: number; accuracy: number };
    departure?: { latitude: number; longitude: number; accuracy: number };
  };
  geofenceVerification: {
    withinGeofence: boolean;
    geofenceRadius: number; // meters
    distanceFromCenter: number; // meters
    verificationMethod: 'gps' | 'wifi' | 'cellular' | 'manual';
  };
  visitDuration: number; // minutes
  travelTime: {
    toPreviousClient: number; // minutes
    toNextClient: number; // minutes
    totalTravelDay: number; // minutes
  };
  mileageTracking: {
    startMileage: number;
    endMileage: number;
    totalMileage: number;
    routeOptimization: boolean;
    hmrcCompliant: boolean;
  };
}

export interface LoneWorkerSafety {
  safetyProtocols: {
    checkInFrequency: number; // minutes
    panicButtonEnabled: boolean;
    gpsTrackingEnabled: boolean;
    buddySystemActive: boolean;
    emergencyContactsConfigured: boolean;
  };
  riskAssessment: {
    clientRiskLevel: 'low' | 'medium' | 'high' | 'extreme';
    environmentalRisks: string[];
    timeOfDayRisks: string[];
    weatherRisks: string[];
    personalSafetyRisks: string[];
    mitigationMeasures: string[];
  };
  safetyMonitoring: {
    lastCheckIn: Date;
    nextCheckInDue: Date;
    missedCheckIns: number;
    panicButtonActivations: number;
    emergencyResponseTime: number; // minutes
    safetyIncidents: Array<{
      incidentDate: Date;
      incidentType: string;
      severity: string;
      resolution: string;
      preventionMeasures: string[];
    }>;
  };
  emergencyProcedures: {
    escalationMatrix: Array<{
      level: number;
      timeframe: number; // minutes
      contacts: string[];
      actions: string[];
    }>;
    emergencyServices: {
      police: string;
      ambulance: string;
      fire: string;
      localAuthority: string;
    };
    familyNotification: {
      primaryContact: string;
      notificationMethod: string[];
      timeframe: number; // minutes
    };
  };
}

export interface ClinicalGovernance {
  clinicalOversight: {
    clinicalLead: string;
    supervisionFrequency: string;
    competencyAssessments: Array<{
      assessmentDate: Date;
      assessor: string;
      competencyAreas: string[];
      scores: { [area: string]: number };
      developmentNeeds: string[];
      nextAssessment: Date;
    }>;
  };
  qualityAssurance: {
    spotChecks: Array<{
      checkDate: Date;
      checker: string;
      areasChecked: string[];
      findings: string[];
      actionPlan: string[];
      followUpDate: Date;
    }>;
    clientFeedback: Array<{
      feedbackDate: Date;
      satisfactionRating: number; // 1-5
      comments: string;
      compliments: string[];
      concerns: string[];
      actionTaken: string[];
    }>;
  };
  outcomeMonitoring: {
    careGoals: Array<{
      goalId: string;
      goalDescription: string;
      targetDate: Date;
      progress: number; // percentage
      barriers: string[];
      interventions: string[];
    }>;
    healthOutcomes: {
      independenceLevel: number; // 1-10
      wellbeingScore: number; // 1-10
      healthStability: 'improving' | 'stable' | 'declining';
      qualityOfLife: number; // 1-10
    };
  };
}

@Entity('domiciliary_clients')
export class DomiciliaryClient extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  clientNumber: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column('date')
  dateOfBirth: Date;

  @Column()
  nhsNumber: string;

  @Column({
    type: 'enum',
    enum: ClientStatus,
    default: ClientStatus.ACTIVE
  })
  status: ClientStatus;

  @Column('jsonb')
  homeAddress: {
    line1: string;
    line2?: string;
    city: string;
    county: string;
    postcode: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    accessInstructions: string;
    keyHolderDetails: Array<{
      name: string;
      relationship: string;
      phone: string;
      availability: string;
    }>;
  };

  @Column('jsonb')
  homeEnvironmentAssessment: HomeEnvironmentAssessment;

  @Column('jsonb')
  carePackage: AdvancedCarePackage;

  @Column('jsonb')
  visitVerification: GPSVisitVerification[];

  @Column('jsonb')
  loneWorkerSafety: LoneWorkerSafety;

  @Column('jsonb')
  clinicalGovernance: ClinicalGovernance;

  @Column('jsonb')
  emergencyContacts: Array<{
    contactId: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address?: string;
    isPrimary: boolean;
    hasKey: boolean;
    availability: string;
    notificationPreferences: string[];
  }>;

  @Column('jsonb')
  medicalInformation: {
    conditions: string[];
    medications: Array<{
      medicationName: string;
      dosage: string;
      frequency: string;
      administrationMethod: 'self' | 'prompted' | 'administered';
      specialInstructions: string;
    }>;
    allergies: string[];
    mobilityAids: string[];
    cognitiveStatus: string;
    communicationNeeds: string[];
  };

  @Column('date')
  careStartDate: Date;

  @Column('date', { nullable: true })
  careEndDate?: Date;

  @Column('timestamp')
  lastVisit: Date;

  @Column('timestamp')
  nextScheduledVisit: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return this.status === ClientStatus.ACTIVE;
  }

  isHighRisk(): boolean {
    return this.loneWorkerSafety.riskAssessment.clientRiskLevel === 'high' ||
           this.loneWorkerSafety.riskAssessment.clientRiskLevel === 'extreme';
  }

  requiresSpecialistCare(): boolean {
    return this.carePackage.careActivities.some(activity => activity.skillLevel === 'specialist') ||
           this.carePackage.packageType === CarePackageType.COMPLEX_CARE ||
           this.carePackage.packageType === CarePackageType.END_OF_LIFE_CARE;
  }

  getWeeklyCareHours(): number {
    return this.carePackage.weeklyHours;
  }

  getWeeklyCareCost(): number {
    return this.carePackage.totalWeeklyCost;
  }

  hasValidHomeEnvironment(): boolean {
    return this.homeEnvironmentAssessment.overallSafetyScore >= 70 &&
           this.homeEnvironmentAssessment.riskFactors.filter(risk => risk.severity === 'critical').length === 0;
  }

  needsEnvironmentalAdaptations(): boolean {
    return this.homeEnvironmentAssessment.adaptationsRequired.some(adaptation => 
      adaptation.urgency === 'urgent' || adaptation.urgency === 'high'
    );
  }

  getLastVisitVerification(): GPSVisitVerification | null {
    if (this.visitVerification.length === 0) return null;
    
    return this.visitVerification.sort((a, b) => 
      new Date(b.scheduledArrival).getTime() - new Date(a.scheduledArrival).getTime()
    )[0];
  }

  calculateVisitComplianceRate(): number {
    if (this.visitVerification.length === 0) return 100;
    
    const verifiedVisits = this.visitVerification.filter(visit => 
      visit.geofenceVerification.withinGeofence && visit.actualArrival && visit.actualDeparture
    ).length;
    
    return (verifiedVisits / this.visitVerification.length) * 100;
  }

  isVisitOverdue(): boolean {
    return new Date() > this.nextScheduledVisit;
  }

  hasRecentSafetyIncidents(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.loneWorkerSafety.safetyMonitoring.safetyIncidents.some(incident => 
      new Date(incident.incidentDate) >= thirtyDaysAgo
    );
  }

  getClientSatisfactionTrend(): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    const recentFeedback = this.clinicalGovernance.qualityAssurance.clientFeedback
      .filter(feedback => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(feedback.feedbackDate) >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(a.feedbackDate).getTime() - new Date(b.feedbackDate).getTime());

    if (recentFeedback.length < 2) return 'insufficient_data';
    
    const firstRating = recentFeedback[0].satisfactionRating;
    const lastRating = recentFeedback[recentFeedback.length - 1].satisfactionRating;
    
    if (lastRating > firstRating + 0.5) return 'improving';
    if (lastRating < firstRating - 0.5) return 'declining';
    return 'stable';
  }

  getCareGoalProgress(): number {
    const goals = this.clinicalGovernance.outcomeMonitoring.careGoals;
    if (goals.length === 0) return 100;
    
    const totalProgress = goals.reduce((sum, goal) => sum + goal.progress, 0);
    return totalProgress / goals.length;
  }

  needsClinicalReview(): boolean {
    const lastAssessment = this.clinicalGovernance.clinicalOversight.competencyAssessments
      .sort((a, b) => new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime())[0];
    
    if (!lastAssessment) return true;
    
    return new Date() >= new Date(lastAssessment.nextAssessment);
  }

  addVisitVerification(verification: GPSVisitVerification): void {
    this.visitVerification.push(verification);
    
    // Keep only last 100 visits
    if (this.visitVerification.length > 100) {
      this.visitVerification = this.visitVerification.slice(-100);
    }
    
    // Update last visit time
    if (verification.actualArrival) {
      this.lastVisit = verification.actualArrival;
    }
  }

  updateCarePackage(packageUpdates: Partial<AdvancedCarePackage>): void {
    this.carePackage = {
      ...this.carePackage,
      ...packageUpdates
    };
    
    // Recalculate total cost if hours or rate changed
    if (packageUpdates.weeklyHours || packageUpdates.hourlyRate) {
      this.carePackage.totalWeeklyCost = this.carePackage.weeklyHours * this.carePackage.hourlyRate;
    }
  }

  addSafetyIncident(incident: {
    incidentType: string;
    severity: string;
    description: string;
    resolution: string;
    preventionMeasures: string[];
  }): void {
    this.loneWorkerSafety.safetyMonitoring.safetyIncidents.push({
      incidentDate: new Date(),
      incidentType: incident.incidentType,
      severity: incident.severity,
      resolution: incident.resolution,
      preventionMeasures: incident.preventionMeasures
    });
    
    // Update safety monitoring based on incident
    if (incident.severity === 'high' || incident.severity === 'critical') {
      this.loneWorkerSafety.riskAssessment.clientRiskLevel = 'high';
    }
  }

  addClientFeedback(feedback: {
    satisfactionRating: number;
    comments: string;
    compliments: string[];
    concerns: string[];
  }): void {
    this.clinicalGovernance.qualityAssurance.clientFeedback.push({
      feedbackDate: new Date(),
      satisfactionRating: feedback.satisfactionRating,
      comments: feedback.comments,
      compliments: feedback.compliments,
      concerns: feedback.concerns,
      actionTaken: []
    });
    
    // Update care package quality metrics
    this.updateQualityMetrics();
  }

  private updateQualityMetrics(): void {
    const recentFeedback = this.clinicalGovernance.qualityAssurance.clientFeedback
      .filter(feedback => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(feedback.feedbackDate) >= thirtyDaysAgo;
      });

    if (recentFeedback.length > 0) {
      const avgSatisfaction = recentFeedback.reduce((sum, feedback) => 
        sum + feedback.satisfactionRating, 0
      ) / recentFeedback.length;
      
      this.carePackage.qualityMetrics.clientSatisfaction = avgSatisfaction;
    }
    
    // Update outcome achievement based on care goals
    this.carePackage.qualityMetrics.outcomeAchievement = this.getCareGoalProgress();
    
    // Update compliance score based on visit verification
    this.carePackage.qualityMetrics.complianceScore = this.calculateVisitComplianceRate();
  }

  generateCareReport(): any {
    return {
      clientSummary: {
        clientNumber: this.clientNumber,
        name: `${this.firstName} ${this.lastName}`,
        status: this.status,
        careStartDate: this.careStartDate,
        careDuration: this.calculateCareDuration()
      },
      carePackageInfo: {
        packageType: this.carePackage.packageType,
        weeklyHours: this.carePackage.weeklyHours,
        weeklyCost: this.carePackage.totalWeeklyCost,
        fundingSource: this.carePackage.fundingSource
      },
      qualityMetrics: this.carePackage.qualityMetrics,
      safetyStatus: {
        homeEnvironmentSafe: this.hasValidHomeEnvironment(),
        loneWorkerSafetyActive: this.loneWorkerSafety.safetyProtocols.panicButtonEnabled,
        recentIncidents: this.hasRecentSafetyIncidents(),
        riskLevel: this.loneWorkerSafety.riskAssessment.clientRiskLevel
      },
      visitCompliance: {
        complianceRate: this.calculateVisitComplianceRate(),
        lastVisit: this.lastVisit,
        nextVisit: this.nextScheduledVisit,
        visitOverdue: this.isVisitOverdue()
      },
      clinicalStatus: {
        needsReview: this.needsClinicalReview(),
        careGoalProgress: this.getCareGoalProgress(),
        satisfactionTrend: this.getClientSatisfactionTrend(),
        healthOutcomes: this.clinicalGovernance.outcomeMonitoring.healthOutcomes
      }
    };
  }

  private calculateCareDuration(): number {
    const startDate = new Date(this.careStartDate);
    const endDate = this.careEndDate ? new Date(this.careEndDate) : new Date();
    return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)); // days
  }
}
