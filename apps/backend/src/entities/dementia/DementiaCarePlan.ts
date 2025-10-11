import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum DementiaType {
  ALZHEIMERS = 'alzheimers',
  VASCULAR = 'vascular',
  LEWY_BODY = 'lewy_body',
  FRONTOTEMPORAL = 'frontotemporal',
  MIXED = 'mixed',
  EARLY_ONSET = 'early_onset',
  MILD_COGNITIVE_IMPAIRMENT = 'mild_cognitive_impairment'
}

export enum DementiaStage {
  VERY_MILD = 'very_mild',
  MILD = 'mild',
  MODERATE = 'moderate',
  MODERATELY_SEVERE = 'moderately_severe',
  SEVERE = 'severe',
  VERY_SEVERE = 'very_severe'
}

export enum WanderingRiskLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme'
}

export interface PersonalHistory {
  occupation: string;
  hobbies: string[];
  personalityTraits: string[];
  significantRelationships: Array<{
    name: string;
    relationship: string;
    significance: string;
    currentContact: boolean;
  }>;
  lifeAchievements: string[];
  traumaticEvents: string[];
  copingMechanisms: string[];
  culturalBackground: {
    ethnicity: string;
    religion: string;
    languages: string[];
    culturalTraditions: string[];
  };
}

export interface CarePreferences {
  communicationStyle: 'verbal' | 'non_verbal' | 'mixed';
  preferredActivities: string[];
  comfortItems: string[];
  routinePreferences: {
    wakeTime: string;
    mealTimes: string[];
    activityTimes: string[];
    bedTime: string;
  };
  environmentalPreferences: {
    lighting: 'bright' | 'dim' | 'natural';
    noise: 'quiet' | 'moderate' | 'stimulating';
    temperature: 'cool' | 'moderate' | 'warm';
    social: 'solitary' | 'small_group' | 'large_group';
  };
  behavioralTriggers: string[];
  calmingStrategies: string[];
}

export interface CognitiveGoal {
  goalId: string;
  goalDescription: string;
  cognitiveSkill: 'memory' | 'attention' | 'language' | 'executive' | 'visuospatial';
  targetLevel: string;
  interventions: string[];
  measurementTools: string[];
  reviewFrequency: 'daily' | 'weekly' | 'monthly';
  progress: number; // percentage
  achievabilityScore: number; // 1-100
}

export interface BehavioralIntervention {
  interventionId: string;
  targetBehavior: string;
  interventionType: 'environmental' | 'pharmacological' | 'behavioral' | 'social' | 'sensory';
  description: string;
  implementation: {
    frequency: string;
    duration: string;
    timing: string[];
    responsibleStaff: string[];
    requiredResources: string[];
  };
  effectiveness: {
    successRate: number;
    sideEffects: string[];
    contraindications: string[];
    monitoring: string[];
  };
  evidenceBase: string;
  lastReview: Date;
  nextReview: Date;
}

export interface SafetyMeasure {
  measureId: string;
  safetyRisk: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  preventiveMeasures: string[];
  monitoringRequirements: string[];
  emergencyProcedures: string[];
  equipmentRequired: string[];
  staffTrainingRequired: string[];
  environmentalModifications: string[];
  technologyAssistance: {
    wanderingAlerts: boolean;
    fallDetection: boolean;
    medicationReminders: boolean;
    locationTracking: boolean;
    behaviorMonitoring: boolean;
  };
}

export interface FamilyInvolvement {
  primaryContact: {
    name: string;
    relationship: string;
    contactDetails: string;
    availability: string;
    preferredCommunication: string;
  };
  familyMembers: Array<{
    name: string;
    relationship: string;
    involvementLevel: 'minimal' | 'moderate' | 'high' | 'primary_carer';
    visitFrequency: string;
    supportProvided: string[];
    trainingCompleted: string[];
    concernsExpressed: string[];
  }>;
  familyMeetings: Array<{
    meetingDate: Date;
    attendees: string[];
    topicsDiscussed: string[];
    decisionsAgreed: string[];
    nextMeetingDate: Date;
  }>;
  educationProvided: Array<{
    topic: string;
    dateProvided: Date;
    format: 'verbal' | 'written' | 'video' | 'demonstration';
    understanding: 'poor' | 'fair' | 'good' | 'excellent';
    followUpRequired: boolean;
  }>;
}

export interface AdvancedMonitoring {
  wearableDevices: Array<{
    deviceType: 'smartwatch' | 'pendant' | 'wristband' | 'sensor_patch';
    metrics: string[];
    batteryLife: number;
    waterproof: boolean;
    gpsEnabled: boolean;
    fallDetection: boolean;
    heartRateMonitoring: boolean;
    activityTracking: boolean;
  }>;
  environmentalSensors: Array<{
    sensorType: 'motion' | 'door' | 'bed' | 'chair' | 'bathroom';
    location: string;
    alertThresholds: any;
    batteryLevel: number;
    lastMaintenance: Date;
    dataAccuracy: number;
  }>;
  aiAnalytics: {
    patternRecognition: boolean;
    anomalyDetection: boolean;
    predictiveAlerts: boolean;
    behaviorBaseline: boolean;
    riskPrediction: boolean;
  };
}

@Entity('dementia_care_plans')
export class DementiaCarePlan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  carePlanNumber: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({
    type: 'enum',
    enum: DementiaType
  })
  dementiaType: DementiaType;

  @Column({
    type: 'enum',
    enum: DementiaStage
  })
  stage: DementiaStage;

  @Column('date')
  diagnosisDate: Date;

  @Column()
  diagnosedBy: string;

  @Column('jsonb')
  personalHistory: PersonalHistory;

  @Column('jsonb')
  carePreferences: CarePreferences;

  @Column('jsonb')
  cognitiveGoals: CognitiveGoal[];

  @Column('jsonb')
  behavioralInterventions: BehavioralIntervention[];

  @Column('jsonb')
  safetyMeasures: SafetyMeasure[];

  @Column('jsonb')
  familyInvolvement: FamilyInvolvement;

  @Column('jsonb')
  advancedMonitoring: AdvancedMonitoring;

  @Column({
    type: 'enum',
    enum: WanderingRiskLevel,
    default: WanderingRiskLevel.LOW
  })
  wanderingRisk: WanderingRiskLevel;

  @Column('jsonb')
  wanderingPreventionPlan: {
    riskFactors: string[];
    preventiveMeasures: string[];
    monitoringProtocol: string;
    responseProtocol: string;
    technologySolutions: string[];
    environmentalModifications: string[];
  };

  @Column('jsonb')
  progressTracking: Array<{
    date: Date;
    cognitiveStatus: string;
    functionalStatus: string;
    behavioralStatus: string;
    qualityOfLife: number; // 1-10
    familySatisfaction: number; // 1-10
    caregiverStress: number; // 1-10
    interventionEffectiveness: { [intervention: string]: number };
  }>;

  @Column('timestamp')
  lastReview: Date;

  @Column('timestamp')
  nextReview: Date;

  @Column()
  reviewedBy: string;

  @Column('text', { nullable: true })
  planSummary?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isHighWanderingRisk(): boolean {
    return [WanderingRiskLevel.HIGH, WanderingRiskLevel.EXTREME].includes(this.wanderingRisk);
  }

  isAdvancedStage(): boolean {
    return [DementiaStage.MODERATELY_SEVERE, DementiaStage.SEVERE, DementiaStage.VERY_SEVERE].includes(this.stage);
  }

  requiresSpecializedCare(): boolean {
    return this.isAdvancedStage() || 
           this.behavioralInterventions.some(intervention => intervention.interventionType === 'pharmacological') ||
           this.safetyMeasures.some(measure => measure.riskLevel === 'critical');
  }

  getActiveCognitiveGoals(): CognitiveGoal[] {
    return this.cognitiveGoals.filter(goal => goal.progress < 100);
  }

  getEffectiveBehavioralInterventions(): BehavioralIntervention[] {
    return this.behavioralInterventions.filter(intervention => 
      intervention.effectiveness.successRate >= 70
    );
  }

  getCriticalSafetyMeasures(): SafetyMeasure[] {
    return this.safetyMeasures.filter(measure => measure.riskLevel === 'critical');
  }

  getRecentProgress(): any | null {
    if (this.progressTracking.length === 0) return null;
    
    return this.progressTracking.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }

  calculateOverallProgress(): number {
    if (this.progressTracking.length < 2) return 0;
    
    const recent = this.getRecentProgress();
    const baseline = this.progressTracking[0];
    
    if (!recent || !baseline) return 0;
    
    // Calculate composite progress score
    const cognitiveChange = this.calculateCognitiveChange(baseline, recent);
    const functionalChange = this.calculateFunctionalChange(baseline, recent);
    const qualityOfLifeChange = recent.qualityOfLife - baseline.qualityOfLife;
    
    return (cognitiveChange + functionalChange + qualityOfLifeChange) / 3;
  }

  isReviewDue(): boolean {
    return new Date() >= this.nextReview;
  }

  needsUrgentReview(): boolean {
    const recentProgress = this.getRecentProgress();
    
    return this.isReviewDue() ||
           (recentProgress && recentProgress.caregiverStress >= 8) ||
           this.progressTracking.some(progress => progress.qualityOfLife <= 3);
  }

  adaptForProgression(newStage: DementiaStage): void {
    this.stage = newStage;
    
    // Adjust care plan based on progression
    if (this.isAdvancedStage()) {
      // Increase safety measures
      this.safetyMeasures.forEach(measure => {
        if (measure.riskLevel === 'medium') {
          measure.riskLevel = 'high';
        }
      });
      
      // Adjust cognitive goals to be more realistic
      this.cognitiveGoals.forEach(goal => {
        if (goal.achievabilityScore > 50) {
          goal.achievabilityScore = Math.max(30, goal.achievabilityScore - 20);
        }
      });
      
      // Update review frequency
      this.nextReview = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Monthly reviews for advanced stages
    }
  }

  generatePersonCenteredApproach(): any {
    return {
      personalIdentity: {
        preferredName: this.personalHistory.significantRelationships[0]?.name || 'Resident',
        importantRelationships: this.personalHistory.significantRelationships,
        meaningfulActivities: this.carePreferences.preferredActivities,
        lifeStory: this.personalHistory.lifeAchievements
      },
      communicationStrategy: {
        bestTimes: this.carePreferences.routinePreferences.activityTimes,
        effectiveApproaches: this.carePreferences.calming,
        triggersToAvoid: this.carePreferences.behavioralTriggers,
        preferredTopics: this.personalHistory.hobbies
      },
      environmentalNeeds: {
        optimalEnvironment: this.carePreferences.environmentalPreferences,
        personalItems: this.carePreferences.comfortItems,
        familiarObjects: this.personalHistory.significantRelationships.map(rel => rel.name)
      },
      supportNeeds: {
        cognitiveSupport: this.getActiveCognitiveGoals().map(goal => goal.goalDescription),
        behavioralSupport: this.behavioralInterventions.map(intervention => intervention.description),
        safetySupport: this.safetyMeasures.map(measure => measure.preventiveMeasures).flat()
      }
    };
  }

  private calculateCognitiveChange(baseline: any, recent: any): number {
    // Simplified cognitive change calculation
    const baselineScore = this.parseStatusToScore(baseline.cognitiveStatus);
    const recentScore = this.parseStatusToScore(recent.cognitiveStatus);
    return recentScore - baselineScore;
  }

  private calculateFunctionalChange(baseline: any, recent: any): number {
    // Simplified functional change calculation
    const baselineScore = this.parseStatusToScore(baseline.functionalStatus);
    const recentScore = this.parseStatusToScore(recent.functionalStatus);
    return recentScore - baselineScore;
  }

  private parseStatusToScore(status: string): number {
    const statusScores = {
      'excellent': 10,
      'good': 8,
      'fair': 6,
      'poor': 4,
      'very_poor': 2
    };
    
    return statusScores[status] || 5;
  }
}
