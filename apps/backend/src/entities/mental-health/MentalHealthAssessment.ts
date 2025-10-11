import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum AssessmentType {
  INITIAL = 'initial',
  ROUTINE = 'routine',
  CRISIS = 'crisis',
  DISCHARGE = 'discharge',
  INCIDENT_FOLLOW_UP = 'incident_follow_up',
  MEDICATION_REVIEW = 'medication_review',
  COGNITIVE_DECLINE = 'cognitive_decline'
}

export enum RiskLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  SEVERE = 'severe',
  CRITICAL = 'critical'
}

export enum MentalHealthDiagnosis {
  DEPRESSION = 'depression',
  ANXIETY = 'anxiety',
  DEMENTIA = 'dementia',
  ALZHEIMERS = 'alzheimers',
  BIPOLAR = 'bipolar',
  SCHIZOPHRENIA = 'schizophrenia',
  PTSD = 'ptsd',
  DELIRIUM = 'delirium',
  BEHAVIORAL_DISTURBANCE = 'behavioral_disturbance',
  ADJUSTMENT_DISORDER = 'adjustment_disorder'
}

export interface AssessmentTool {
  toolName: string;
  toolType: 'standardized' | 'custom' | 'observational' | 'digital';
  version: string;
  administeredBy: string;
  administrationTime: number; // minutes
  validityPeriod: number; // days
  reliability: number; // percentage
  culturallyAppropriate: boolean;
  cognitiveLoadRequired: 'minimal' | 'low' | 'moderate' | 'high';
}

export interface AssessmentScore {
  toolName: string;
  rawScore: number;
  standardizedScore: number;
  percentileRank: number;
  interpretationLevel: 'normal' | 'mild' | 'moderate' | 'severe' | 'profound';
  clinicalSignificance: boolean;
  comparisonToPrevious?: {
    previousScore: number;
    changeDirection: 'improved' | 'stable' | 'declined';
    changeSignificance: 'minimal' | 'notable' | 'significant' | 'concerning';
  };
}

export interface ClinicalObservation {
  observationType: 'mood' | 'behavior' | 'cognition' | 'social' | 'physical' | 'environmental';
  observation: string;
  severity: 'mild' | 'moderate' | 'severe';
  frequency: 'rare' | 'occasional' | 'frequent' | 'const ant';
  triggers: string[];
  interventionsTriedPreviously: string[];
  responseToInterventions: string[];
  impactOnDailyLiving: 'minimal' | 'mild' | 'moderate' | 'severe';
  familyConcerns: string[];
  staffConcerns: string[];
}

export interface ClinicalRecommendation {
  recommendationType: 'medication' | 'therapy' | 'environmental' | 'behavioral' | 'family_support' | 'specialist_referral';
  recommendation: string;
  evidenceBase: string;
  priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
  timeframe: string;
  responsiblePerson: string;
  expectedOutcome: string;
  measurementCriteria: string[];
  reviewDate: Date;
  contraindications: string[];
  alternativeOptions: string[];
}

export interface PsychosocialFactors {
  socialSupport: {
    familyInvolvement: 'minimal' | 'moderate' | 'high' | 'very_high';
    friendships: string[];
    communityConnections: string[];
    socialIsolationRisk: RiskLevel;
  };
  lifeHistory: {
    significantLifeEvents: string[];
    copingMechanisms: string[];
    previousMentalHealthHistory: string[];
    traumaHistory: string[];
    personalityFactors: string[];
  };
  environmentalFactors: {
    physicalEnvironment: string[];
    socialEnvironment: string[];
    culturalFactors: string[];
    spiritualNeeds: string[];
    communicationPreferences: string[];
  };
}

export interface CognitiveProfile {
  overallCognitiveStatus: 'intact' | 'mild_impairment' | 'moderate_impairment' | 'severe_impairment';
  domainSpecificScores: {
    memory: { immediate: number; delayed: number; working: number };
    attention: { sustained: number; selective: number; divided: number };
    executiveFunction: { planning: number; problemSolving: number; flexibility: number };
    language: { comprehension: number; expression: number; naming: number };
    visuospatial: { const ruction: number; perception: number; navigation: number };
  };
  functionalImpact: {
    adlsAffected: string[];
    iadlsAffected: string[];
    safetyRisks: string[];
    supervisionNeeded: 'none' | 'minimal' | 'moderate' | 'const ant';
  };
  progressionMarkers: {
    rateOfDecline: 'stable' | 'slow' | 'moderate' | 'rapid';
    predictedTrajectory: string;
    protectiveFactors: string[];
    riskFactors: string[];
  };
}

export interface BehavioralAnalysis {
  behaviorPatterns: Array<{
    behaviorType: string;
    frequency: string;
    triggers: string[];
    antecedents: string[];
    consequences: string[];
    interventionsEffective: string[];
    interventionsIneffective: string[];
  }>;
  challengingBehaviors: Array<{
    behavior: string;
    severity: 'mild' | 'moderate' | 'severe';
    riskToSelf: boolean;
    riskToOthers: boolean;
    interventionStrategies: string[];
    successRate: number;
  }>;
  positiveEngagements: Array<{
    activity: string;
    engagementLevel: 'low' | 'moderate' | 'high';
    duration: number;
    socialInteraction: boolean;
    therapeuticValue: string[];
  }>;
}

@Entity('mental_health_assessments')
export class MentalHealthAssessment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assessmentNumber: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column()
  assessorId: string;

  @Column({
    type: 'enum',
    enum: AssessmentType
  })
  assessmentType: AssessmentType;

  @Column('timestamp')
  assessmentDate: Date;

  @Column('jsonb')
  tools: AssessmentTool[];

  @Column('jsonb')
  scores: AssessmentScore[];

  @Column('jsonb')
  observations: ClinicalObservation[];

  @Column('jsonb')
  recommendations: ClinicalRecommendation[];

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.LOW
  })
  riskLevel: RiskLevel;

  @Column('simple-array')
  diagnoses: MentalHealthDiagnosis[];

  @Column('jsonb')
  psychosocialFactors: PsychosocialFactors;

  @Column('jsonb')
  cognitiveProfile: CognitiveProfile;

  @Column('jsonb')
  behavioralAnalysis: BehavioralAnalysis;

  @Column({ default: false })
  followUpRequired: boolean;

  @Column('timestamp', { nullable: true })
  nextAssessmentDue?: Date;

  @Column('text', { nullable: true })
  assessmentSummary?: string;

  @Column('jsonb')
  riskFactors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    modifiable: boolean;
    interventionRequired: boolean;
    monitoringFrequency: string;
  }>;

  @Column('jsonb')
  protectiveFactors: Array<{
    factor: string;
    strength: 'low' | 'medium' | 'high';
    maintainable: boolean;
    enhancementPossible: boolean;
  }>;

  @Column('jsonb')
  treatmentGoals: Array<{
    goalId: string;
    goalDescription: string;
    targetDate: Date;
    measurementCriteria: string[];
    progress: number; // percentage
    barriers: string[];
    supportStrategies: string[];
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isHighRisk(): boolean {
    return [RiskLevel.HIGH, RiskLevel.SEVERE, RiskLevel.CRITICAL].includes(this.riskLevel);
  }

  requiresImmediateIntervention(): boolean {
    return this.riskLevel === RiskLevel.CRITICAL ||
           this.assessmentType === AssessmentType.CRISIS ||
           this.observations.some(obs => obs.severity === 'severe');
  }

  hasSignificantCognitiveImpairment(): boolean {
    return this.cognitiveProfile.overallCognitiveStatus === 'moderate_impairment' ||
           this.cognitiveProfile.overallCognitiveStatus === 'severe_impairment';
  }

  hasChallengingBehaviors(): boolean {
    return this.behavioralAnalysis.challengingBehaviors.length > 0;
  }

  getOverallMentalHealthScore(): number {
    // Calculate composite mental health score
    const toolScores = this.scores.map(score => score.standardizedScore);
    if (toolScores.length === 0) return 50; // Neutral score
    
    return toolScores.reduce((sum, score) => sum + score, 0) / toolScores.length;
  }

  getCognitiveFunctioningLevel(): 'intact' | 'mild_decline' | 'moderate_decline' | 'severe_decline' {
    const cognitiveScore = this.calculateCognitiveCompositeScore();
    
    if (cognitiveScore >= 85) return 'intact';
    if (cognitiveScore >= 70) return 'mild_decline';
    if (cognitiveScore >= 50) return 'moderate_decline';
    return 'severe_decline';
  }

  private calculateCognitiveCompositeScore(): number {
    const domains = this.cognitiveProfile.domainSpecificScores;
    const scores = [
      domains.memory.immediate,
      domains.memory.delayed,
      domains.attention.sustained,
      domains.executiveFunction.planning,
      domains.language.comprehension,
      domains.visuospatial.const ruction
    ];
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getHighestPriorityRecommendations(): ClinicalRecommendation[] {
    return this.recommendations
      .filter(rec => rec.priorityLevel === 'urgent' || rec.priorityLevel === 'high')
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priorityLevel] - priorityOrder[a.priorityLevel];
      });
  }

  getModifiableRiskFactors(): any[] {
    return this.riskFactors.filter(factor => factor.modifiable);
  }

  calculateTreatmentComplexity(): 'low' | 'medium' | 'high' | 'very_high' {
    let complexityScore = 0;
    
    // Multiple diagnoses increase complexity
    complexityScore += this.diagnoses.length * 10;
    
    // High-risk factors increase complexity
    complexityScore += this.riskFactors.filter(f => f.severity === 'high').length * 15;
    
    // Cognitive impairment increases complexity
    if (this.hasSignificantCognitiveImpairment()) complexityScore += 20;
    
    // Challenging behaviors increase complexity
    complexityScore += this.behavioralAnalysis.challengingBehaviors.length * 10;
    
    if (complexityScore >= 80) return 'very_high';
    if (complexityScore >= 60) return 'high';
    if (complexityScore >= 40) return 'medium';
    return 'low';
  }

  needsSpecialistReferral(): boolean {
    return this.isHighRisk() ||
           this.calculateTreatmentComplexity() === 'very_high' ||
           this.recommendations.some(rec => rec.recommendationType === 'specialist_referral');
  }

  generateClinicalSummary(): string {
    const riskDescription = this.riskLevel === RiskLevel.CRITICAL ? 'CRITICAL RISK' :
                           this.riskLevel === RiskLevel.HIGH ? 'HIGH RISK' :
                           this.riskLevel === RiskLevel.MODERATE ? 'MODERATE RISK' : 'LOW RISK';
    
    const cognitiveDescription = this.getCognitiveFunctioningLevel().replace('_', ' ').toUpperCase();
    const complexityDescription = this.calculateTreatmentComplexity().replace('_', ' ').toUpperCase();
    
    return `Mental Health AssessmentSummary:
Risk Level: ${riskDescription}
Cognitive Status: ${cognitiveDescription}
Treatment Complexity: ${complexityDescription}
Primary Diagnoses: ${this.diagnoses.join(', ')}
Key Concerns: ${this.observations.filter(obs => obs.severity === 'severe').map(obs => obs.observation).join('; ')}
Immediate ActionsRequired: ${this.getHighestPriorityRecommendations().length > 0 ? 'YES' : 'NO'}`;
  }

  updateProgress(goalId: string, progressPercentage: number, barriers: string[], supports: string[]): void {
    const goal = this.treatmentGoals.find(g => g.goalId === goalId);
    if (goal) {
      goal.progress = progressPercentage;
      goal.barriers = barriers;
      goal.supportStrategies = supports;
    }
  }

  addRiskFactor(factor: string, severity: string, modifiable: boolean, interventionRequired: boolean): void {
    this.riskFactors.push({
      factor,
      severity: severity as any,
      modifiable,
      interventionRequired,
      monitoringFrequency: interventionRequired ? 'daily' : 'weekly'
    });
  }

  addProtectiveFactor(factor: string, strength: string, maintainable: boolean, enhancementPossible: boolean): void {
    this.protectiveFactors.push({
      factor,
      strength: strength as any,
      maintainable,
      enhancementPossible
    });
  }

  scheduleFollowUp(daysFromNow: number): void {
    this.followUpRequired = true;
    this.nextAssessmentDue = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  }

  isFollowUpOverdue(): boolean {
    return this.followUpRequired && 
           this.nextAssessmentDue && 
           new Date() > this.nextAssessmentDue;
  }

  getAssessmentAge(): number {
    const now = new Date();
    const assessmentDate = new Date(this.assessmentDate);
    return Math.floor((now.getTime() - assessmentDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  isAssessmentCurrent(): boolean {
    const maxAgeByType = {
      [AssessmentType.INITIAL]: 90,     // 3 months
      [AssessmentType.ROUTINE]: 180,    // 6 months
      [AssessmentType.CRISIS]: 30,      // 1 month
      [AssessmentType.DISCHARGE]: 7,    // 1 week
      [AssessmentType.INCIDENT_FOLLOW_UP]: 14, // 2 weeks
      [AssessmentType.MEDICATION_REVIEW]: 90,  // 3 months
      [AssessmentType.COGNITIVE_DECLINE]: 60   // 2 months
    };
    
    const maxAge = maxAgeByType[this.assessmentType];
    return this.getAssessmentAge() <= maxAge;
  }
}
