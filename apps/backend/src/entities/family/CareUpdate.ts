/**
 * @fileoverview Care Update Entity
 * @module CareUpdate
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-01-01
 * 
 * @description Entity representing daily care updates shared with family members
 * 
 * @compliance
 * - CQC Regulation 10 - Dignity and respect
 * - GDPR and Data Protection Act 2018
 */

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Resident } from '../resident/Resident';

export enum MoodLevel {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  CONCERNING = 'concerning',
}

export enum ActivityType {
  PHYSICAL = 'physical',
  COGNITIVE = 'cognitive',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  THERAPEUTIC = 'therapeutic',
  RECREATIONAL = 'recreational',
  EDUCATIONAL = 'educational',
  SPIRITUAL = 'spiritual',
}

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
  DRINK = 'drink',
}

export interface MealRecord {
  type: MealType;
  items: string[];
  quantity: 'none' | 'little' | 'some' | 'most' | 'all';
  enjoyment: 'disliked' | 'neutral' | 'liked' | 'loved';
  notes?: string;
  time?: string;
}

export interface ActivityRecord {
  type: ActivityType;
  name: string;
  duration: number; // minutes
  participation: 'full' | 'partial' | 'minimal' | 'none';
  enjoyment: 'disliked' | 'neutral' | 'liked' | 'loved';
  notes?: string;
  staffMember?: string;
}

export interface SocialInteraction {
  type: 'family' | 'staff' | 'resident' | 'visitor' | 'volunteer';
  duration: number; // minutes
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  participants: string[];
}

export interface PhysicalActivity {
  type: 'walk' | 'exercise' | 'therapy' | 'gardening' | 'dancing' | 'other';
  duration: number; // minutes
  intensity: 'light' | 'moderate' | 'vigorous';
  description: string;
  staffMember?: string;
}

@Entity('care_updates')
@Index(['residentId', 'careDate'])
@Index(['staffId', 'careDate'])
@Index(['mood', 'careDate'])
export class CareUpdate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  residentId!: string;

  @ManyToOne(() => Resident, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'residentId' })
  resident!: Resident;

  @Column({ type: 'date' })
  careDate!: Date;

  @Column({ type: 'jsonb' })
  activities!: ActivityRecord[];

  @Column({ type: 'jsonb' })
  meals!: MealRecord[];

  @Column({ type: 'enum', enum: MoodLevel })
  mood!: MoodLevel;

  @Column({ type: 'jsonb', nullable: true })
  socialInteraction?: SocialInteraction;

  @Column({ type: 'jsonb', nullable: true })
  physicalActivity?: PhysicalActivity;

  @Column({ type: 'text', nullable: true })
  encryptedMedicalNotes?: string;

  @Column({ type: 'text' })
  encryptedStaffNotes!: string;

  @Column({ type: 'jsonb', nullable: true })
  photos?: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    caption?: string;
    takenBy: string;
    takenAt: Date;
    tags?: string[];
  }>;

  @Column({ type: 'jsonb', nullable: true })
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    oxygenSaturation?: number;
    measuredAt: Date;
    measuredBy: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  medications?: Array<{
    name: string;
    dosage: string;
    time: string;
    given: boolean;
    notes?: string;
    givenBy?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  sleep?: {
    bedtime: string;
    wakeTime: string;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    disturbances: number;
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  hygiene?: {
    bathing: boolean;
    grooming: boolean;
    dressing: boolean;
    assistance: 'none' | 'minimal' | 'moderate' | 'full';
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  mobility?: {
    walking: boolean;
    wheelchair: boolean;
    assistance: 'none' | 'minimal' | 'moderate' | 'full';
    distance?: string;
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  communication?: {
    verbal: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    nonVerbal: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    hearing: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    vision: 'excellent' | 'good' | 'fair' | 'poor' | 'none';
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  behavior?: {
    mood: string;
    agitation: 'none' | 'mild' | 'moderate' | 'severe';
    confusion: 'none' | 'mild' | 'moderate' | 'severe';
    socialInteraction: 'excellent' | 'good' | 'fair' | 'poor';
    notes?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  incidents?: Array<{
    type: 'fall' | 'injury' | 'illness' | 'behavior' | 'other';
    description: string;
    severity: 'minor' | 'moderate' | 'major';
    time: string;
    actionTaken: string;
    reportedTo: string[];
    followUpRequired: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  familyUpdates?: Array<{
    type: 'visit' | 'call' | 'message' | 'video_call';
    description: string;
    time: string;
    participants: string[];
    notes?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  goals?: Array<{
    id: string;
    description: string;
    progress: number; // percentage
    notes?: string;
  }>;

  @Column({ type: 'var char', length: 100 })
  staffId!: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  staffName?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  staffRole?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  shiftType?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'boolean', default: false })
  isComplete!: boolean;

  @Column({ type: 'boolean', default: false })
  isReviewed!: boolean;

  @Column({ type: 'var char', length: 100, nullable: true })
  reviewedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt?: Date;

  @Column({ type: 'var char', length: 500, nullable: true })
  reviewNotes?: string;

  @Column({ type: 'boolean', default: false })
  isSharedWithFamily!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sharedWithFamilyAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  sharedBy?: string;

  @Column({ type: 'boolean', default: false })
  familyAcknowledged!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  familyAcknowledgedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  acknowledgedBy?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  familyComments?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    weather?: string;
    specialEvents?: string[];
    visitors?: string[];
    appointments?: string[];
    changes?: string[];
    concerns?: string[];
    achievements?: string[];
  };

  @Column({ type: 'jsonb', nullable: true })
  qualityMetrics?: {
    engagement: number; // 1-10
    comfort: number; // 1-10
    safety: number; // 1-10
    socialInteraction: number; // 1-10
    physicalActivity: number; // 1-10
    overall: number; // 1-10
  };

  @Column({ type: 'boolean', default: false })
  isArchived!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  archivedBy?: string;

  @Column({ type: 'var char', length: 500, nullable: true })
  archiveReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Methods
  getOverallMoodScore(): number {
    const moodScores = {
      [MoodLevel.EXCELLENT]: 5,
      [MoodLevel.GOOD]: 4,
      [MoodLevel.FAIR]: 3,
      [MoodLevel.CONCERNING]: 2,
    };
    return moodScores[this.mood] || 3;
  }

  getActivityParticipationRate(): number {
    if (!this.activities || this.activities.length === 0) return 0;
    
    const totalActivities = this.activities.length;
    const participatedActivities = this.activities.filter(
      activity => activity.participation !== 'none'
    ).length;
    
    return (participatedActivities / totalActivities) * 100;
  }

  getMealEnjoymentRate(): number {
    if (!this.meals || this.meals.length === 0) return 0;
    
    const totalMeals = this.meals.length;
    const enjoyedMeals = this.meals.filter(
      meal => meal.enjoyment === 'liked' || meal.enjoyment === 'loved'
    ).length;
    
    return (enjoyedMeals / totalMeals) * 100;
  }

  getOverallQualityScore(): number {
    if (this.qualityMetrics?.overall) {
      return this.qualityMetrics.overall;
    }
    
    // Calculate based on available metrics
    const metrics = this.qualityMetrics;
    if (!metrics) return this.getOverallMoodScore();
    
    const scores = [
      metrics.engagement,
      metrics.comfort,
      metrics.safety,
      metrics.socialInteraction,
      metrics.physicalActivity,
    ].filter(score => score !== undefined);
    
    if (scores.length === 0) return this.getOverallMoodScore();
    
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  hasIncidents(): boolean {
    return !!(this.incidents && this.incidents.length > 0);
  }

  hasSeriousIncidents(): boolean {
    return this.hasIncidents() && 
           this.incidents!.some(incident => incident.severity === 'major');
  }

  getIncidentCount(): number {
    return this.incidents ? this.incidents.length : 0;
  }

  getPhotoCount(): number {
    return this.photos ? this.photos.length : 0;
  }

  getActivityCount(): number {
    return this.activities ? this.activities.length : 0;
  }

  getMealCount(): number {
    return this.meals ? this.meals.length : 0;
  }

  getMedicationCount(): number {
    return this.medications ? this.medications.length : 0;
  }

  isPositiveDay(): boolean {
    return this.getOverallMoodScore() >= 4 && 
           this.getActivityParticipationRate() >= 50 &&
           !this.hasSeriousIncidents();
  }

  needsAttention(): boolean {
    return this.getOverallMoodScore() <= 2 || 
           this.hasSeriousIncidents() ||
           this.getActivityParticipationRate() <= 25;
  }

  markAsComplete(completedBy: string): void {
    this.isComplete = true;
    this.metadata = {
      ...this.metadata,
      completedBy,
      completedAt: new Date(),
    };
  }

  markAsReviewed(reviewedBy: string, notes?: string): void {
    this.isReviewed = true;
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.reviewNotes = notes;
  }

  shareWithFamily(sharedBy: string): void {
    this.isSharedWithFamily = true;
    this.sharedWithFamilyAt = new Date();
    this.sharedBy = sharedBy;
  }

  acknowledgeByFamily(acknowledgedBy: string, comments?: string): void {
    this.familyAcknowledged = true;
    this.familyAcknowledgedAt = new Date();
    this.acknowledgedBy = acknowledgedBy;
    this.familyComments = comments;
  }

  archive(archivedBy: string, reason?: string): void {
    this.isArchived = true;
    this.archivedAt = new Date();
    this.archivedBy = archivedBy;
    this.archiveReason = reason;
  }

  getSummary(): any {
    return {
      id: this.id,
      date: this.careDate,
      mood: this.mood,
      moodScore: this.getOverallMoodScore(),
      activityCount: this.getActivityCount(),
      activityParticipation: this.getActivityParticipationRate(),
      mealCount: this.getMealCount(),
      mealEnjoyment: this.getMealEnjoymentRate(),
      photoCount: this.getPhotoCount(),
      incidentCount: this.getIncidentCount(),
      hasSeriousIncidents: this.hasSeriousIncidents(),
      qualityScore: this.getOverallQualityScore(),
      isPositive: this.isPositiveDay(),
      needsAttention: this.needsAttention(),
      isComplete: this.isComplete,
      isShared: this.isSharedWithFamily,
      familyAcknowledged: this.familyAcknowledged,
    };
  }

  toJSON(): any {
    const { 
      encryptedMedicalNotes, 
      encryptedStaffNotes, 
      ...safeData 
    } = this;
    return safeData;
  }
}
