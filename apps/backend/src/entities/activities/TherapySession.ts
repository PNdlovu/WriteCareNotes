import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Activity } from './Activity';
import { Resident } from '../resident/Resident';

export enum TherapyType {
  PHYSIOTHERAPY = 'physiotherapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  SPEECH_THERAPY = 'speech_therapy',
  MUSIC_THERAPY = 'music_therapy',
  ART_THERAPY = 'art_therapy',
  COGNITIVE_BEHAVIORAL_THERAPY = 'cognitive_behavioral_therapy',
  REMINISCENCE_THERAPY = 'reminiscence_therapy',
  PET_THERAPY = 'pet_therapy',
  GARDEN_THERAPY = 'garden_therapy',
  DRAMA_THERAPY = 'drama_therapy',
  DANCE_THERAPY = 'dance_therapy'
}

export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum ProgressLevel {
  SIGNIFICANT_DECLINE = 'significant_decline',
  DECLINE = 'decline',
  NO_CHANGE = 'no_change',
  IMPROVEMENT = 'improvement',
  SIGNIFICANT_IMPROVEMENT = 'significant_improvement'
}

export interface TherapyGoal {
  goalId: string;
  description: string;
  targetDate: Date;
  currentProgress: number; // 0-100
  measurementCriteria: string;
  isAchieved: boolean;
  achievedDate?: Date;
}

export interface SessionAssessment {
  cognitiveFunction: number; // 1-10 scale
  physicalFunction: number; // 1-10 scale
  emotionalState: number; // 1-10 scale
  socialEngagement: number; // 1-10 scale
  painLevel: number; // 1-10 scale
  fatigueLevel: number; // 1-10 scale
  overallWellbeing: number; // 1-10 scale
  notes: string;
}

export interface TherapeuticIntervention {
  interventionType: string;
  description: string;
  duration: number; // minutes
  effectiveness: number; // 1-5 scale
  residentResponse: string;
  modifications: string;
}

export interface SessionOutcome {
  goalsProgress: { [goalId: string]: number };
  overallProgress: ProgressLevel;
  keyAchievements: string[];
  challenges: string[];
  recommendations: string[];
  nextSessionFocus: string[];
  familyFeedback?: string;
  therapistNotes: string;
}

@Entity('therapy_sessions')
export class TherapySession extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionNumber: number;

  @Column({
    type: 'enum',
    enum: TherapyType
  })
  therapyType: TherapyType;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.SCHEDULED
  })
  status: SessionStatus;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column('uuid', { nullable: true })
  activityId?: string;

  @ManyToOne(() => Activity, { nullable: true })
  @JoinColumn({ name: 'activityId' })
  activity?: Activity;

  @Column()
  therapistId: string;

  @Column()
  therapistName: string;

  @Column()
  therapistQualification: string;

  @Column('timestamp')
  scheduledStartTime: Date;

  @Column('timestamp')
  scheduledEndTime: Date;

  @Column('timestamp', { nullable: true })
  actualStartTime?: Date;

  @Column('timestamp', { nullable: true })
  actualEndTime?: Date;

  @Column('integer')
  plannedDuration: number; // minutes

  @Column('integer', { nullable: true })
  actualDuration?: number; // minutes

  @Column()
  location: string;

  @Column('jsonb')
  therapyGoals: TherapyGoal[];

  @Column('jsonb', { nullable: true })
  preSessionAssessment?: SessionAssessment;

  @Column('jsonb', { nullable: true })
  postSessionAssessment?: SessionAssessment;

  @Column('jsonb')
  interventions: TherapeuticIntervention[];

  @Column('jsonb', { nullable: true })
  sessionOutcome?: SessionOutcome;

  @Column('text', { nullable: true })
  sessionNotes?: string;

  @Column('text', { nullable: true })
  therapistReflections?: string;

  @Column('text', { nullable: true })
  residentFeedback?: string;

  @Column('text', { nullable: true })
  familyFeedback?: string;

  @Column('text', { nullable: true })
  cancellationReason?: string;

  @Column('boolean', { default: false })
  requiresFollowUp: boolean;

  @Column('text', { nullable: true })
  followUpNotes?: string;

  @Column('timestamp', { nullable: true })
  nextSessionDate?: Date;

  @Column('jsonb', { nullable: true })
  equipmentUsed?: {
    equipmentName: string;
    condition: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  }[];

  @Column('jsonb', { nullable: true })
  safetyIncidents?: {
    incidentType: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    actionTaken: string;
    reportedTo: string[];
    reportedAt: Date;
  }[];

  @Column('boolean', { default: false })
  consentObtained: boolean;

  @Column('timestamp', { nullable: true })
  consentObtainedAt?: Date;

  @Column('text', { nullable: true })
  consentNotes?: string;

  @Column('jsonb', { nullable: true })
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    recordedAt: Date;
    recordedBy: string;
  }[];

  @Column('jsonb', { nullable: true })
  medicationChanges?: {
    medicationName: string;
    changeType: 'started' | 'stopped' | 'dose_increased' | 'dose_decreased';
    reason: string;
    prescriber: string;
    date: Date;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isScheduled(): boolean {
    return this.status === SessionStatus.SCHEDULED;
  }

  isInProgress(): boolean {
    return this.status === SessionStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === SessionStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === SessionStatus.CANCELLED;
  }

  getDuration(): number {
    if (this.actualStartTime && this.actualEndTime) {
      return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60));
    }
    return this.plannedDuration;
  }

  getProgressPercentage(): number {
    if (this.therapyGoals.length === 0) return 0;
    
    const totalProgress = this.therapyGoals.reduce((sum, goal) => sum + goal.currentProgress, 0);
    return totalProgress / this.therapyGoals.length;
  }

  getAchievedGoalsCount(): number {
    return this.therapyGoals.filter(goal => goal.isAchieved).length;
  }

  getOverallProgressLevel(): ProgressLevel {
    if (!this.sessionOutcome) return ProgressLevel.NO_CHANGE;
    return this.sessionOutcome.overallProgress;
  }

  hasSafetyIncidents(): boolean {
    return this.safetyIncidents && this.safetyIncidents.length > 0;
  }

  getHighSeverityIncidents(): any[] {
    if (!this.safetyIncidents) return [];
    return this.safetyIncidents.filter(incident => 
      incident.severity === 'high' || incident.severity === 'critical'
    );
  }

  requiresImmediateFollowUp(): boolean {
    return this.requiresFollowUp || this.hasHighSeverityIncidents();
  }

  hasHighSeverityIncidents(): boolean {
    return this.getHighSeverityIncidents().length > 0;
  }

  getAverageAssessmentScore(): number {
    if (!this.postSessionAssessment) return 0;
    
    const scores = [
      this.postSessionAssessment.cognitiveFunction,
      this.postSessionAssessment.physicalFunction,
      this.postSessionAssessment.emotionalState,
      this.postSessionAssessment.socialEngagement,
      this.postSessionAssessment.overallWellbeing
    ];
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  getInterventionEffectiveness(): number {
    if (this.interventions.length === 0) return 0;
    
    const totalEffectiveness = this.interventions.reduce((sum, intervention) => 
      sum + intervention.effectiveness, 0
    );
    
    return totalEffectiveness / this.interventions.length;
  }

  isOverdue(): boolean {
    if (this.isCompleted() || this.isCancelled()) return false;
    
    const now = new Date();
    return now > this.scheduledStartTime;
  }

  getDaysUntilNextSession(): number | null {
    if (!this.nextSessionDate) return null;
    
    const now = new Date();
    const diffTime = this.nextSessionDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  canBeRescheduled(): boolean {
    return this.isScheduled() && !this.isOverdue();
  }

  getSessionSummary(): string {
    const duration = this.getDuration();
    const progress = this.getProgressPercentage();
    const goalsAchieved = this.getAchievedGoalsCount();
    const totalGoals = this.therapyGoals.length;
    
    return `Session ${this.sessionNumber}: ${duration}min, ${progress.toFixed(1)}% progress, ${goalsAchieved}/${totalGoals} goals achieved`;
  }

  addIntervention(intervention: TherapeuticIntervention): void {
    this.interventions.push(intervention);
  }

  updateGoalProgress(goalId: string, progress: number): void {
    const goal = this.therapyGoals.find(g => g.goalId === goalId);
    if (goal) {
      goal.currentProgress = Math.min(100, Math.max(0, progress));
      if (goal.currentProgress >= 100 && !goal.isAchieved) {
        goal.isAchieved = true;
        goal.achievedDate = new Date();
      }
    }
  }

  recordSafetyIncident(incident: any): void {
    if (!this.safetyIncidents) {
      this.safetyIncidents = [];
    }
    this.safetyIncidents.push({
      ...incident,
      reportedAt: new Date()
    });
  }

  recordVitalSigns(vitalSigns: any): void {
    if (!this.vitalSigns) {
      this.vitalSigns = [];
    }
    this.vitalSigns.push({
      ...vitalSigns,
      recordedAt: new Date()
    });
  }
}