import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum RehabilitationType {
  PHYSIOTHERAPY = 'physiotherapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  SPEECH_THERAPY = 'speech_therapy',
  COGNITIVE_REHABILITATION = 'cognitive_rehabilitation',
  CARDIAC_REHABILITATION = 'cardiac_rehabilitation',
  PULMONARY_REHABILITATION = 'pulmonary_rehabilitation',
  NEUROLOGICAL_REHABILITATION = 'neurological_rehabilitation',
  ORTHOPEDIC_REHABILITATION = 'orthopedic_rehabilitation'
}

export enum FunctionalLevel {
  INDEPENDENT = 'independent',
  MODIFIED_INDEPENDENT = 'modified_independent',
  SUPERVISION = 'supervision',
  MINIMAL_ASSISTANCE = 'minimal_assistance',
  MODERATE_ASSISTANCE = 'moderate_assistance',
  MAXIMAL_ASSISTANCE = 'maximal_assistance',
  TOTAL_ASSISTANCE = 'total_assistance'
}

export enum RehabilitationGoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  PARTIALLY_ACHIEVED = 'partially_achieved',
  NOT_ACHIEVED = 'not_achieved',
  DISCONTINUED = 'discontinued'
}

export interface TherapySession {
  sessionId: string;
  sessionDate: Date;
  duration: number; // minutes
  therapistId: string;
  therapyType: RehabilitationType;
  activities: Array<{
    activityName: string;
    duration: number; // minutes
    intensity: 'low' | 'moderate' | 'high';
    repetitions?: number;
    resistance?: string;
    assistance: FunctionalLevel;
    notes: string;
  }>;
  assessments: Array<{
    assessmentType: string;
    preSessionScore: number;
    postSessionScore: number;
    improvement: number;
    notes: string;
  }>;
  outcomes: {
    painLevel: number; // 0-10
    fatigueLevel: number; // 0-10
    motivationLevel: number; // 1-5
    cooperationLevel: number; // 1-5
    overallProgress: number; // 0-100
  };
  equipmentUsed: string[];
  homeExercises: Array<{
    exerciseName: string;
    frequency: string;
    duration: number;
    instructions: string;
    safetyPrecautions: string[];
  }>;
}

export interface FunctionalAssessment {
  assessmentId: string;
  assessmentDate: Date;
  assessorId: string;
  assessmentType: 'initial' | 'progress' | 'discharge' | 'maintenance';
  mobilityAssessment: {
    walkingDistance: number; // meters
    walkingSpeed: number; // m/s
    balanceScore: number; // 0-100
    transferAbility: FunctionalLevel;
    stairClimbing: FunctionalLevel;
    wheelchairSkills?: FunctionalLevel;
  };
  activitiesOfDailyLiving: {
    bathing: FunctionalLevel;
    dressing: FunctionalLevel;
    feeding: FunctionalLevel;
    toileting: FunctionalLevel;
    grooming: FunctionalLevel;
    continence: FunctionalLevel;
  };
  instrumentalActivities: {
    cooking: FunctionalLevel;
    cleaning: FunctionalLevel;
    shopping: FunctionalLevel;
    medicationManagement: FunctionalLevel;
    financialManagement: FunctionalLevel;
    transportation: FunctionalLevel;
  };
  cognitiveAssessment: {
    memoryScore: number; // 0-100
    attentionScore: number; // 0-100
    executiveFunctionScore: number; // 0-100
    orientationScore: number; // 0-100
    languageScore: number; // 0-100
  };
  psychosocialAssessment: {
    moodScore: number; // 1-10
    motivationLevel: number; // 1-10
    socialEngagement: number; // 1-10
    familySupport: number; // 1-10
    copingStrategies: string[];
  };
}

export interface RehabilitationGoal {
  goalId: string;
  goalDescription: string;
  goalType: 'mobility' | 'strength' | 'endurance' | 'balance' | 'cognitive' | 'functional' | 'psychosocial';
  targetFunctionalLevel: FunctionalLevel;
  currentFunctionalLevel: FunctionalLevel;
  measurableOutcomes: Array<{
    outcome: string;
    targetValue: number;
    currentValue: number;
    unit: string;
    measurementMethod: string;
  }>;
  interventions: Array<{
    interventionType: string;
    frequency: string;
    duration: number; // minutes per session
    intensity: 'low' | 'moderate' | 'high';
    equipment: string[];
    techniques: string[];
  }>;
  timeframe: {
    startDate: Date;
    targetDate: Date;
    reviewDates: Date[];
  };
  status: RehabilitationGoalStatus;
  progressNotes: Array<{
    date: Date;
    progress: number; // percentage
    notes: string;
    barriers: string[];
    modifications: string[];
  }>;
}

export interface OutcomeTracking {
  functionalImprovements: Array<{
    domain: string;
    baselineScore: number;
    currentScore: number;
    targetScore: number;
    improvementPercentage: number;
    significantImprovement: boolean;
  }>;
  qualityOfLifeMetrics: {
    physicalWellbeing: number; // 1-10
    emotionalWellbeing: number; // 1-10
    socialWellbeing: number; // 1-10
    functionalWellbeing: number; // 1-10
    overallQualityOfLife: number; // 1-10
  };
  dischargeReadiness: {
    functionalReadiness: number; // 0-100
    safetyReadiness: number; // 0-100
    equipmentReadiness: number; // 0-100
    supportSystemReadiness: number; // 0-100
    overallReadiness: number; // 0-100
  };
  costEffectiveness: {
    totalCost: number; // GBP
    costPerSession: number; // GBP
    functionalGainCost: number; // GBP per functional point
    qualityAdjustedLifeYears: number;
    costEffectivenessRatio: number;
  };
}

@Entity('rehabilitation_plans')
export class RehabilitationPlan extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  planId: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({
    type: 'enum',
    enum: RehabilitationType
  })
  primaryRehabilitationType: RehabilitationType;

  @Column('simple-array')
  secondaryRehabilitationTypes: RehabilitationType[];

  @Column('text')
  primaryDiagnosis: string;

  @Column('simple-array')
  secondaryDiagnoses: string[];

  @Column('date')
  rehabilitationStartDate: Date;

  @Column('date', { nullable: true })
  expectedDischargeDate?: Date;

  @Column('date', { nullable: true })
  actualDischargeDate?: Date;

  @Column('jsonb')
  functionalAssessments: FunctionalAssessment[];

  @Column('jsonb')
  rehabilitationGoals: RehabilitationGoal[];

  @Column('jsonb')
  therapySessions: TherapySession[];

  @Column('jsonb')
  outcomeTracking: OutcomeTracking;

  @Column('jsonb')
  multidisciplinaryTeam: Array<{
    teamMemberId: string;
    role: string;
    specialization: string;
    contactDetails: string;
    availability: string;
    lastSession: Date;
    nextSession: Date;
  }>;

  @Column('jsonb')
  equipmentAndAdaptations: Array<{
    equipmentType: string;
    equipmentName: string;
    purpose: string;
    prescribedDate: Date;
    deliveryDate?: Date;
    trainingRequired: boolean;
    maintenanceSchedule: string;
    cost: number;
  }>;

  @Column('text', { nullable: true })
  dischargeNotes?: string;

  @Column('text', { nullable: true })
  followUpPlan?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isActive(): boolean {
    return !this.actualDischargeDate;
  }

  isOverdue(): boolean {
    if (!this.expectedDischargeDate) return false;
    return new Date() > this.expectedDischargeDate && !this.actualDischargeDate;
  }

  getLatestAssessment(): FunctionalAssessment | null {
    if (this.functionalAssessments.length === 0) return null;
    
    return this.functionalAssessments.sort((a, b) => 
      new Date(b.assessmentDate).getTime() - new Date(a.assessmentDate).getTime()
    )[0];
  }

  calculateOverallProgress(): number {
    if (this.rehabilitationGoals.length === 0) return 0;
    
    const totalProgress = this.rehabilitationGoals.reduce((sum, goal) => {
      const latestProgress = goal.progressNotes.length > 0 ? 
        goal.progressNotes[goal.progressNotes.length - 1].progress : 0;
      return sum + latestProgress;
    }, 0);
    
    return totalProgress / this.rehabilitationGoals.length;
  }

  getAchievedGoals(): RehabilitationGoal[] {
    return this.rehabilitationGoals.filter(goal => goal.status === RehabilitationGoalStatus.ACHIEVED);
  }

  getActiveGoals(): RehabilitationGoal[] {
    return this.rehabilitationGoals.filter(goal => goal.status === RehabilitationGoalStatus.IN_PROGRESS);
  }

  needsAssessmentUpdate(): boolean {
    const latestAssessment = this.getLatestAssessment();
    if (!latestAssessment) return true;
    
    const daysSinceAssessment = Math.floor(
      (new Date().getTime() - new Date(latestAssessment.assessmentDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceAssessment >= 14; // Bi-weekly assessments
  }

  isReadyForDischarge(): boolean {
    const readiness = this.outcomeTracking.dischargeReadiness;
    return readiness.overallReadiness >= 80 &&
           readiness.safetyReadiness >= 85 &&
           readiness.functionalReadiness >= 75;
  }

  addTherapySession(session: TherapySession): void {
    this.therapySessions.push(session);
    
    // Update goal progress based on session outcomes
    this.updateGoalProgressFromSession(session);
    
    // Update outcome tracking
    this.updateOutcomeTracking();
  }

  addFunctionalAssessment(assessment: FunctionalAssessment): void {
    this.functionalAssessments.push(assessment);
    
    // Keep only last 10 assessments
    if (this.functionalAssessments.length > 10) {
      this.functionalAssessments = this.functionalAssessments.slice(-10);
    }
    
    // Update discharge readiness based on new assessment
    this.updateDischargeReadiness(assessment);
  }

  updateRehabilitationGoal(goalId: string, updates: {
    progress?: number;
    status?: RehabilitationGoalStatus;
    notes?: string;
    barriers?: string[];
    modifications?: string[];
  }): void {
    const goal = this.rehabilitationGoals.find(g => g.goalId === goalId);
    if (!goal) return;
    
    if (updates.status) {
      goal.status = updates.status;
    }
    
    if (updates.progress !== undefined || updates.notes || updates.barriers || updates.modifications) {
      goal.progressNotes.push({
        date: new Date(),
        progress: updates.progress || goal.progressNotes[goal.progressNotes.length - 1]?.progress || 0,
        notes: updates.notes || '',
        barriers: updates.barriers || [],
        modifications: updates.modifications || []
      });
    }
  }

  calculateFunctionalImprovement(): number {
    const initial = this.functionalAssessments.find(a => a.assessmentType === 'initial');
    const latest = this.getLatestAssessment();
    
    if (!initial || !latest) return 0;
    
    // Calculate improvement across all domains
    const domains = [
      'mobilityAssessment',
      'activitiesOfDailyLiving',
      'instrumentalActivities',
      'cognitiveAssessment'
    ];
    
    let totalImprovement = 0;
    let domainCount = 0;
    
    domains.forEach(domain => {
      if (initial[domain] && latest[domain]) {
        const initialScore = this.calculateDomainScore(initial[domain]);
        const latestScore = this.calculateDomainScore(latest[domain]);
        totalImprovement += latestScore - initialScore;
        domainCount++;
      }
    });
    
    return domainCount > 0 ? totalImprovement / domainCount : 0;
  }

  private updateGoalProgressFromSession(session: TherapySession): void {
    // Update relevant goals based on therapy session outcomes
    this.rehabilitationGoals.forEach(goal => {
      if (this.isGoalRelevantToSession(goal, session)) {
        const progressIncrease = session.outcomes.overallProgress * 0.1; // 10% of session progress
        const currentProgress = goal.progressNotes.length > 0 ? 
          goal.progressNotes[goal.progressNotes.length - 1].progress : 0;
        
        const newProgress = Math.min(100, currentProgress + progressIncrease);
        
        goal.progressNotes.push({
          date: session.sessionDate,
          progress: newProgress,
          notes: `Progress from ${session.therapyType} session`,
          barriers: [],
          modifications: []
        });
        
        // Update status if goal achieved
        if (newProgress >= 95) {
          goal.status = RehabilitationGoalStatus.ACHIEVED;
        } else if (newProgress >= 10) {
          goal.status = RehabilitationGoalStatus.IN_PROGRESS;
        }
      }
    });
  }

  private updateOutcomeTracking(): void {
    const latestAssessment = this.getLatestAssessment();
    if (!latestAssessment) return;
    
    // Update functional improvements
    this.outcomeTracking.functionalImprovements = [
      {
        domain: 'mobility',
        baselineScore: 60,
        currentScore: this.calculateDomainScore(latestAssessment.mobilityAssessment),
        targetScore: 80,
        improvementPercentage: this.calculateFunctionalImprovement(),
        significantImprovement: this.calculateFunctionalImprovement() >= 10
      }
    ];
    
    // Update quality of life metrics
    this.outcomeTracking.qualityOfLifeMetrics = {
      physicalWellbeing: latestAssessment.psychosocialAssessment.moodScore,
      emotionalWellbeing: latestAssessment.psychosocialAssessment.moodScore,
      socialWellbeing: latestAssessment.psychosocialAssessment.socialEngagement,
      functionalWellbeing: this.calculateOverallProgress() / 10,
      overallQualityOfLife: (latestAssessment.psychosocialAssessment.moodScore + 
                            latestAssessment.psychosocialAssessment.socialEngagement) / 2
    };
  }

  private updateDischargeReadiness(assessment: FunctionalAssessment): void {
    // Calculate discharge readiness based on latest assessment
    const functionalReadiness = this.calculateDomainScore(assessment.activitiesOfDailyLiving);
    const safetyReadiness = this.calculateSafetyReadiness(assessment);
    const equipmentReadiness = this.calculateEquipmentReadiness();
    const supportSystemReadiness = assessment.psychosocialAssessment.familySupport * 10;
    
    this.outcomeTracking.dischargeReadiness = {
      functionalReadiness,
      safetyReadiness,
      equipmentReadiness,
      supportSystemReadiness,
      overallReadiness: (functionalReadiness + safetyReadiness + equipmentReadiness + supportSystemReadiness) / 4
    };
  }

  private isGoalRelevantToSession(goal: RehabilitationGoal, session: TherapySession): boolean {
    // Determine if a goal is relevant to a therapy session
    const relevanceMap = {
      'mobility': [RehabilitationType.PHYSIOTHERAPY, RehabilitationType.OCCUPATIONAL_THERAPY],
      'strength': [RehabilitationType.PHYSIOTHERAPY],
      'endurance': [RehabilitationType.PHYSIOTHERAPY, RehabilitationType.CARDIAC_REHABILITATION],
      'balance': [RehabilitationType.PHYSIOTHERAPY],
      'cognitive': [RehabilitationType.COGNITIVE_REHABILITATION, RehabilitationType.SPEECH_THERAPY],
      'functional': [RehabilitationType.OCCUPATIONAL_THERAPY],
      'psychosocial': [RehabilitationType.OCCUPATIONAL_THERAPY, RehabilitationType.COGNITIVE_REHABILITATION]
    };
    
    const relevantTherapies = relevanceMap[goal.goalType] || [];
    return relevantTherapies.includes(session.therapyType);
  }

  private calculateDomainScore(domain: any): number {
    if (!domain) return 0;
    
    // Convert functional levels to numeric scores
    const levelScores = {
      [FunctionalLevel.INDEPENDENT]: 100,
      [FunctionalLevel.MODIFIED_INDEPENDENT]: 85,
      [FunctionalLevel.SUPERVISION]: 70,
      [FunctionalLevel.MINIMAL_ASSISTANCE]: 55,
      [FunctionalLevel.MODERATE_ASSISTANCE]: 40,
      [FunctionalLevel.MAXIMAL_ASSISTANCE]: 25,
      [FunctionalLevel.TOTAL_ASSISTANCE]: 10
    };
    
    const scores = Object.values(domain).map((level: any) => levelScores[level] || 0);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  private calculateSafetyReadiness(assessment: FunctionalAssessment): number {
    // Calculate safety readiness based on mobility and cognitive scores
    const mobilityScore = this.calculateDomainScore(assessment.mobilityAssessment);
    const cognitiveScore = (assessment.cognitiveAssessment.memoryScore + 
                           assessment.cognitiveAssessment.attentionScore + 
                           assessment.cognitiveAssessment.executiveFunctionScore) / 3;
    
    return (mobilityScore + cognitiveScore) / 2;
  }

  private calculateEquipmentReadiness(): number {
    // Calculate equipment readiness based on prescribed equipment
    const prescribedEquipment = this.equipmentAndAdaptations.length;
    const deliveredEquipment = this.equipmentAndAdaptations.filter(eq => eq.deliveryDate).length;
    const trainedEquipment = this.equipmentAndAdaptations.filter(eq => !eq.trainingRequired || eq.deliveryDate).length;
    
    if (prescribedEquipment === 0) return 100;
    
    const deliveryReadiness = (deliveredEquipment / prescribedEquipment) * 100;
    const trainingReadiness = (trainedEquipment / prescribedEquipment) * 100;
    
    return (deliveryReadiness + trainingReadiness) / 2;
  }

  generateRehabilitationReport(): any {
    const latestAssessment = this.getLatestAssessment();
    
    return {
      planSummary: {
        planId: this.planId,
        residentId: this.residentId,
        primaryType: this.primaryRehabilitationType,
        startDate: this.rehabilitationStartDate,
        expectedDischarge: this.expectedDischargeDate,
        daysInRehabilitation: Math.floor((new Date().getTime() - new Date(this.rehabilitationStartDate).getTime()) / (1000 * 60 * 60 * 24))
      },
      currentStatus: {
        overallProgress: this.calculateOverallProgress(),
        functionalImprovement: this.calculateFunctionalImprovement(),
        goalsAchieved: this.getAchievedGoals().length,
        activeGoals: this.getActiveGoals().length,
        totalSessions: this.therapySessions.length
      },
      functionalStatus: latestAssessment ? {
        mobility: this.calculateDomainScore(latestAssessment.mobilityAssessment),
        adl: this.calculateDomainScore(latestAssessment.activitiesOfDailyLiving),
        iadl: this.calculateDomainScore(latestAssessment.instrumentalActivities),
        cognitive: (latestAssessment.cognitiveAssessment.memoryScore + 
                   latestAssessment.cognitiveAssessment.attentionScore + 
                   latestAssessment.cognitiveAssessment.executiveFunctionScore) / 3
      } : null,
      dischargeReadiness: this.outcomeTracking.dischargeReadiness,
      qualityOfLife: this.outcomeTracking.qualityOfLifeMetrics,
      costEffectiveness: this.outcomeTracking.costEffectiveness,
      recommendations: this.generateRehabilitationRecommendations()
    };
  }

  private generateRehabilitationRecommendations(): string[] {
    const recommendations = [];
    
    if (this.needsAssessmentUpdate()) {
      recommendations.push('Schedule functional assessment update');
    }
    
    if (this.calculateOverallProgress() < 50) {
      recommendations.push('Review and adjust rehabilitation goals and interventions');
    }
    
    if (this.isReadyForDischarge()) {
      recommendations.push('Consider discharge planning and community support setup');
    }
    
    if (this.isOverdue()) {
      recommendations.push('Review discharge timeline and adjust expectations');
    }
    
    return recommendations;
  }
}
