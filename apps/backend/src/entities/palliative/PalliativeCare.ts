import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum PalliativeStage {
  EARLY = 'early',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  END_OF_LIFE = 'end_of_life',
  BEREAVEMENT_SUPPORT = 'bereavement_support'
}

export enum ComfortLevel {
  COMFORTABLE = 'comfortable',
  MILD_DISCOMFORT = 'mild_discomfort',
  MODERATE_DISCOMFORT = 'moderate_discomfort',
  SEVERE_DISCOMFORT = 'severe_discomfort',
  DISTRESSED = 'distressed'
}

export enum SymptomSeverity {
  NONE = 'none',
  MILD = 'mild',
  MODERATE = 'moderate',
  SEVERE = 'severe',
  OVERWHELMING = 'overwhelming'
}

export interface AdvancedSymptomManagement {
  symptoms: Array<{
    symptomId: string;
    symptomName: string;
    severity: SymptomSeverity;
    frequency: 'rare' | 'occasional' | 'frequent' | 'constant';
    triggers: string[];
    relievingFactors: string[];
    impactOnQuality: number; // 1-10
    managementStrategies: Array<{
      strategy: string;
      effectiveness: number; // 0-100
      sideEffects: string[];
      evidenceBase: string;
    }>;
    lastAssessment: Date;
    nextAssessment: Date;
  }>;
  painManagement: {
    painScale: 'numeric' | 'faces' | 'behavioral';
    currentPainLevel: number; // 0-10
    painPattern: 'constant' | 'intermittent' | 'breakthrough';
    painMedications: Array<{
      medication: string;
      route: string;
      effectiveness: number;
      sideEffects: string[];
      adjustmentNeeded: boolean;
    }>;
    nonPharmacological: string[];
    painGoals: string[];
  };
  breathingSupport: {
    oxygenRequired: boolean;
    respiratoryRate: number;
    breathingPattern: string;
    supportDevices: string[];
    breathingExercises: string[];
    emergencyProtocols: string[];
  };
}

export interface ComfortCarePlan {
  planId: string;
  palliativeStage: PalliativeStage;
  comfortGoals: Array<{
    goalId: string;
    goalDescription: string;
    priority: 'high' | 'medium' | 'low';
    interventions: string[];
    successCriteria: string[];
    reviewDate: Date;
  }>;
  environmentalComfort: {
    roomPreferences: {
      lighting: string;
      temperature: number;
      noise: string;
      privacy: string;
    };
    personalItems: string[];
    familiarObjects: string[];
    spiritualItems: string[];
    musicPreferences: string[];
  };
  psychosocialSupport: {
    emotionalSupport: string[];
    spiritualCare: string[];
    familySupport: string[];
    peerSupport: string[];
    counselingServices: string[];
    bereavementPreparation: string[];
  };
  anticipatoryGuidance: {
    expectedSymptoms: string[];
    timeframes: string[];
    familyEducation: string[];
    staffPreparation: string[];
    emergencyPlanning: string[];
  };
}

export interface EndOfLifePreferences {
  advanceDirectives: {
    livingWill: boolean;
    powerOfAttorney: {
      health: string;
      financial: string;
    };
    dnr: boolean;
    treatmentPreferences: string[];
    locationPreferences: 'care_home' | 'hospital' | 'home' | 'hospice';
  };
  spiritualPreferences: {
    religiousAffiliation: string;
    spiritualPractices: string[];
    clergyContact: string;
    lastRites: boolean;
    funeralPreferences: string[];
  };
  familyInvolvement: {
    primaryDecisionMaker: string;
    familyMeetingFrequency: string;
    communicationPreferences: string[];
    visitingArrangements: string[];
    bereavementSupport: string[];
  };
  comfortMeasures: {
    painManagement: 'minimal' | 'moderate' | 'aggressive';
    nutritionSupport: 'comfort_feeding' | 'assisted_feeding' | 'no_artificial_nutrition';
    hydrationSupport: 'comfort_hydration' | 'assisted_hydration' | 'no_artificial_hydration';
    mobilitySupport: 'active' | 'assisted' | 'comfort_positioning';
  };
}

export interface FamilyBereavement {
  bereavementSupport: {
    supportCoordinator: string;
    supportServices: string[];
    counselingOffered: boolean;
    memorialServices: string[];
    practicalSupport: string[];
  };
  griefAssessment: Array<{
    assessmentDate: Date;
    familyMember: string;
    griefStage: string;
    supportNeeds: string[];
    riskFactors: string[];
    interventions: string[];
    followUpDate: Date;
  }>;
  memorialActivities: Array<{
    activityType: string;
    description: string;
    participants: string[];
    scheduledDate: Date;
    meaningfulElements: string[];
  }>;
  continuedSupport: {
    supportDuration: number; // months
    supportFrequency: string;
    supportMethods: string[];
    anniversarySupport: boolean;
    resourcesProvided: string[];
  };
}

export interface QualityOfLifeAssessment {
  assessmentDate: Date;
  assessorId: string;
  physicalWellbeing: {
    painLevel: number; // 0-10
    fatigue: number; // 0-10
    appetite: number; // 0-10
    sleep: number; // 0-10
    mobility: number; // 0-10
  };
  psychologicalWellbeing: {
    mood: number; // 0-10
    anxiety: number; // 0-10
    depression: number; // 0-10
    hope: number; // 0-10
    peacefulness: number; // 0-10
  };
  socialWellbeing: {
    familyRelationships: number; // 0-10
    friendships: number; // 0-10
    socialActivities: number; // 0-10
    isolation: number; // 0-10 (reverse scored)
    communication: number; // 0-10
  };
  spiritualWellbeing: {
    meaningfulness: number; // 0-10
    spiritualPeace: number; // 0-10
    forgiveness: number; // 0-10
    transcendence: number; // 0-10
    connection: number; // 0-10
  };
  overallQualityOfLife: number; // 0-100
  qualityOfLifeTrend: 'improving' | 'stable' | 'declining';
  priorityAreas: string[];
  interventionRecommendations: string[];
}

@Entity('palliative_care')
export class PalliativeCare extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  palliativeCareId: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({
    type: 'enum',
    enum: PalliativeStage
  })
  palliativeStage: PalliativeStage;

  @Column('date')
  palliativeStartDate: Date;

  @Column('text')
  primaryDiagnosis: string;

  @Column('simple-array')
  secondaryDiagnoses: string[];

  @Column('text', { nullable: true })
  prognosis?: string;

  @Column('int', { nullable: true })
  estimatedLifeExpectancy?: number; // days

  @Column('jsonb')
  symptomManagement: AdvancedSymptomManagement;

  @Column('jsonb')
  comfortCarePlan: ComfortCarePlan;

  @Column('jsonb')
  endOfLifePreferences: EndOfLifePreferences;

  @Column('jsonb')
  familyBereavement: FamilyBereavement;

  @Column('jsonb')
  qualityOfLifeAssessments: QualityOfLifeAssessment[];

  @Column({
    type: 'enum',
    enum: ComfortLevel,
    default: ComfortLevel.COMFORTABLE
  })
  currentComfortLevel: ComfortLevel;

  @Column('jsonb')
  multidisciplinaryTeam: Array<{
    teamMemberId: string;
    role: string;
    specialization: string;
    contactDetails: string;
    availability: string;
    lastContact: Date;
    nextScheduledContact: Date;
  }>;

  @Column('jsonb')
  spiritualCare: {
    spiritualAssessment: {
      assessmentDate: Date;
      spiritualNeeds: string[];
      religiousRequirements: string[];
      culturalConsiderations: string[];
      existentialConcerns: string[];
    };
    spiritualInterventions: Array<{
      intervention: string;
      frequency: string;
      provider: string;
      effectiveness: number;
      meaningfulness: number;
    }>;
    ritualAndTraditions: {
      importantRituals: string[];
      culturalTraditions: string[];
      familyTraditions: string[];
      personalMeaningfulActivities: string[];
    };
  };

  @Column('timestamp')
  lastComfortAssessment: Date;

  @Column('timestamp')
  nextComfortAssessment: Date;

  @Column('timestamp', { nullable: true })
  dateOfDeath?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActivelyDying(): boolean {
    return this.palliativeStage === PalliativeStage.END_OF_LIFE &&
           this.estimatedLifeExpectancy !== null &&
           this.estimatedLifeExpectancy <= 7; // 7 days or less
  }

  isComfortable(): boolean {
    return [ComfortLevel.COMFORTABLE, ComfortLevel.MILD_DISCOMFORT].includes(this.currentComfortLevel);
  }

  hasUncontrolledSymptoms(): boolean {
    return this.symptomManagement.symptoms.some(symptom => 
      symptom.severity === SymptomSeverity.SEVERE || symptom.severity === SymptomSeverity.OVERWHELMING
    );
  }

  needsUrgentSymptomReview(): boolean {
    return this.hasUncontrolledSymptoms() ||
           this.currentComfortLevel === ComfortLevel.DISTRESSED ||
           this.symptomManagement.painManagement.currentPainLevel >= 7;
  }

  getLatestQualityOfLifeAssessment(): QualityOfLifeAssessment | null {
    if (this.qualityOfLifeAssessments.length === 0) return null;
    
    return this.qualityOfLifeAssessments.sort((a, b) => 
      new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
    )[0];
  }

  getQualityOfLifeTrend(): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    if (this.qualityOfLifeAssessments.length < 2) return 'insufficient_data';
    
    const recent = this.qualityOfLifeAssessments.slice(-3); // Last 3 assessments
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const change = last.overallQualityOfLife - first.overallQualityOfLife;
    
    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }

  isComfortAssessmentDue(): boolean {
    return new Date() >= this.nextComfortAssessment;
  }

  hasAdvanceDirectives(): boolean {
    return this.endOfLifePreferences.advanceDirectives.livingWill ||
           !!this.endOfLifePreferences.advanceDirectives.powerOfAttorney.health;
  }

  isDNR(): boolean {
    return this.endOfLifePreferences.advanceDirectives.dnr;
  }

  getFamilyInvolvementLevel(): 'minimal' | 'moderate' | 'high' | 'very_high' {
    const involvement = this.endOfLifePreferences.familyInvolvement;
    
    if (involvement.familyMeetingFrequency === 'daily' || involvement.visitingArrangements.includes('constant_presence')) {
      return 'very_high';
    }
    if (involvement.familyMeetingFrequency === 'weekly' || involvement.visitingArrangements.includes('daily_visits')) {
      return 'high';
    }
    if (involvement.familyMeetingFrequency === 'monthly' || involvement.visitingArrangements.includes('regular_visits')) {
      return 'moderate';
    }
    return 'minimal';
  }

  addSymptomAssessment(symptomId: string, severity: SymptomSeverity, notes: string): void {
    const symptom = this.symptomManagement.symptoms.find(s => s.symptomId === symptomId);
    if (symptom) {
      symptom.severity = severity;
      symptom.lastAssessment = new Date();
      symptom.nextAssessment = new Date(Date.now() + this.getAssessmentInterval(severity));
    }
    
    // Update comfort level based on symptoms
    this.updateComfortLevel();
  }

  updateComfortLevel(): void {
    const severestSymptom = this.symptomManagement.symptoms.reduce((max, symptom) => {
      const severityScores = {
        [SymptomSeverity.NONE]: 0,
        [SymptomSeverity.MILD]: 1,
        [SymptomSeverity.MODERATE]: 2,
        [SymptomSeverity.SEVERE]: 3,
        [SymptomSeverity.OVERWHELMING]: 4
      };
      
      return severityScores[symptom.severity] > severityScores[max.severity] ? symptom : max;
    });

    // Map symptom severity to comfort level
    const comfortMapping = {
      [SymptomSeverity.NONE]: ComfortLevel.COMFORTABLE,
      [SymptomSeverity.MILD]: ComfortLevel.MILD_DISCOMFORT,
      [SymptomSeverity.MODERATE]: ComfortLevel.MODERATE_DISCOMFORT,
      [SymptomSeverity.SEVERE]: ComfortLevel.SEVERE_DISCOMFORT,
      [SymptomSeverity.OVERWHELMING]: ComfortLevel.DISTRESSED
    };

    this.currentComfortLevel = comfortMapping[severestSymptom.severity];
  }

  addQualityOfLifeAssessment(assessment: QualityOfLifeAssessment): void {
    this.qualityOfLifeAssessments.push(assessment);
    
    // Keep only last 20 assessments
    if (this.qualityOfLifeAssessments.length > 20) {
      this.qualityOfLifeAssessments = this.qualityOfLifeAssessments.slice(-20);
    }
  }

  scheduleComfortAssessment(): void {
    // Schedule next comfort assessment based on stage and condition
    const intervals = {
      [PalliativeStage.EARLY]: 7, // days
      [PalliativeStage.INTERMEDIATE]: 3, // days
      [PalliativeStage.ADVANCED]: 1, // day
      [PalliativeStage.END_OF_LIFE]: 0.25, // 6 hours
      [PalliativeStage.BEREAVEMENT_SUPPORT]: 7 // days
    };
    
    const interval = intervals[this.palliativeStage];
    this.nextComfortAssessment = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);
  }

  progressToNextStage(newStage: PalliativeStage, reason: string): void {
    this.palliativeStage = newStage;
    
    // Adjust care plan for new stage
    this.adaptCarePlanForStage(newStage);
    
    // Update assessment frequency
    this.scheduleComfortAssessment();
    
    // Update family communication if progressing to end-of-life
    if (newStage === PalliativeStage.END_OF_LIFE) {
      this.activateEndOfLifeProtocols();
    }
  }

  private adaptCarePlanForStage(stage: PalliativeStage): void {
    // Adapt comfort care plan based on palliative stage
    switch (stage) {
      case PalliativeStage.EARLY:
        this.comfortCarePlan.comfortGoals = this.comfortCarePlan.comfortGoals.filter(goal => 
          goal.priority === 'high' || goal.priority === 'medium'
        );
        break;
      
      case PalliativeStage.INTERMEDIATE:
        this.comfortCarePlan.comfortGoals.forEach(goal => {
          if (goal.priority === 'low') goal.priority = 'medium';
        });
        break;
      
      case PalliativeStage.ADVANCED:
        this.comfortCarePlan.comfortGoals.forEach(goal => {
          goal.priority = 'high';
        });
        break;
      
      case PalliativeStage.END_OF_LIFE:
        // Focus only on comfort and dignity
        this.comfortCarePlan.comfortGoals = [{
          goalId: crypto.randomUUID(),
          goalDescription: 'Maintain comfort and dignity',
          priority: 'high',
          interventions: ['Pain management', 'Positioning', 'Family presence'],
          successCriteria: ['Peaceful appearance', 'Family satisfaction'],
          reviewDate: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours
        }];
        break;
    }
  }

  private activateEndOfLifeProtocols(): void {
    // Activate end-of-life care protocols
    this.comfortCarePlan.anticipatoryGuidance = {
      expectedSymptoms: [
        'Decreased appetite',
        'Increased drowsiness',
        'Changes in breathing',
        'Decreased urine output',
        'Cool extremities'
      ],
      timeframes: ['Hours to days'],
      familyEducation: [
        'Normal dying process',
        'Comfort measures',
        'When to call for help',
        'Spiritual care options'
      ],
      staffPreparation: [
        'Comfort care protocols',
        'Family support strategies',
        'Documentation requirements',
        'Bereavement procedures'
      ],
      emergencyPlanning: [
        'After-death procedures',
        'Family notification protocols',
        'Spiritual care activation',
        'Bereavement support initiation'
      ]
    };
  }

  private getAssessmentInterval(severity: SymptomSeverity): number {
    // Assessment interval in milliseconds based on symptom severity
    const intervals = {
      [SymptomSeverity.NONE]: 7 * 24 * 60 * 60 * 1000, // 7 days
      [SymptomSeverity.MILD]: 3 * 24 * 60 * 60 * 1000, // 3 days
      [SymptomSeverity.MODERATE]: 24 * 60 * 60 * 1000, // 1 day
      [SymptomSeverity.SEVERE]: 8 * 60 * 60 * 1000, // 8 hours
      [SymptomSeverity.OVERWHELMING]: 2 * 60 * 60 * 1000 // 2 hours
    };
    
    return intervals[severity];
  }

  calculateComfortScore(): number {
    // Calculate overall comfort score based on symptoms and comfort level
    let score = 100;
    
    // Deduct for symptom severity
    this.symptomManagement.symptoms.forEach(symptom => {
      const severityDeductions = {
        [SymptomSeverity.NONE]: 0,
        [SymptomSeverity.MILD]: 5,
        [SymptomSeverity.MODERATE]: 15,
        [SymptomSeverity.SEVERE]: 30,
        [SymptomSeverity.OVERWHELMING]: 50
      };
      score -= severityDeductions[symptom.severity];
    });
    
    // Deduct for comfort level
    const comfortDeductions = {
      [ComfortLevel.COMFORTABLE]: 0,
      [ComfortLevel.MILD_DISCOMFORT]: 10,
      [ComfortLevel.MODERATE_DISCOMFORT]: 25,
      [ComfortLevel.SEVERE_DISCOMFORT]: 40,
      [ComfortLevel.DISTRESSED]: 60
    };
    score -= comfortDeductions[this.currentComfortLevel];
    
    return Math.max(0, score);
  }

  generateComfortReport(): any {
    const latestQoL = this.getLatestQualityOfLifeAssessment();
    
    return {
      palliativeCareSummary: {
        palliativeCareId: this.palliativeCareId,
        residentId: this.residentId,
        stage: this.palliativeStage,
        daysSincePalliativeStart: Math.floor((new Date().getTime() - new Date(this.palliativeStartDate).getTime()) / (1000 * 60 * 60 * 24)),
        estimatedLifeExpectancy: this.estimatedLifeExpectancy,
        currentComfortLevel: this.currentComfortLevel
      },
      symptomStatus: {
        totalSymptoms: this.symptomManagement.symptoms.length,
        uncontrolledSymptoms: this.symptomManagement.symptoms.filter(s => s.severity === SymptomSeverity.SEVERE || s.severity === SymptomSeverity.OVERWHELMING).length,
        painLevel: this.symptomManagement.painManagement.currentPainLevel,
        comfortScore: this.calculateComfortScore()
      },
      qualityOfLife: latestQoL ? {
        overallScore: latestQoL.overallQualityOfLife,
        trend: latestQoL.qualityOfLifeTrend,
        priorityAreas: latestQoL.priorityAreas,
        lastAssessment: latestQoL.assessmentDate
      } : null,
      careStatus: {
        comfortGoalsAchieved: this.comfortCarePlan.comfortGoals.filter(goal => 
          goal.successCriteria.length > 0
        ).length,
        familyInvolvement: this.getFamilyInvolvementLevel(),
        spiritualCareActive: this.spiritualCare.spiritualInterventions.length > 0,
        multidisciplinaryTeamActive: this.multidisciplinaryTeam.length > 0
      },
      recommendations: this.generateComfortRecommendations(),
      urgentActions: this.getUrgentComfortActions()
    };
  }

  private generateComfortRecommendations(): string[] {
    const recommendations = [];
    
    if (this.needsUrgentSymptomReview()) {
      recommendations.push('Urgent symptom review and management adjustment required');
    }
    
    if (!this.isComfortable()) {
      recommendations.push('Enhance comfort measures and reassess in 2 hours');
    }
    
    if (this.isActivelyDying()) {
      recommendations.push('Activate end-of-life care protocols');
      recommendations.push('Ensure family presence and support');
      recommendations.push('Consider spiritual care needs');
    }
    
    const latestQoL = this.getLatestQualityOfLifeAssessment();
    if (latestQoL && latestQoL.qualityOfLifeTrend === 'declining') {
      recommendations.push('Review and adjust care plan to improve quality of life');
    }
    
    return recommendations;
  }

  private getUrgentComfortActions(): Array<{ action: string; timeframe: string; responsible: string }> {
    const actions = [];
    
    if (this.currentComfortLevel === ComfortLevel.DISTRESSED) {
      actions.push({
        action: 'Immediate comfort assessment and intervention',
        timeframe: 'Within 30 minutes',
        responsible: 'Senior Nurse'
      });
    }
    
    if (this.symptomManagement.painManagement.currentPainLevel >= 8) {
      actions.push({
        action: 'Pain management review and adjustment',
        timeframe: 'Within 1 hour',
        responsible: 'Clinical Lead'
      });
    }
    
    if (this.isActivelyDying() && this.getFamilyInvolvementLevel() === 'minimal') {
      actions.push({
        action: 'Contact family for end-of-life support',
        timeframe: 'Immediately',
        responsible: 'Care Manager'
      });
    }
    
    return actions;
  }
}