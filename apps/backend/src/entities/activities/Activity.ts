import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum ActivityType {
  PHYSICAL = 'physical',
  COGNITIVE = 'cognitive',
  SOCIAL = 'social',
  CREATIVE = 'creative',
  THERAPEUTIC = 'therapeutic',
  RECREATIONAL = 'recreational',
  SPIRITUAL = 'spiritual',
  EDUCATIONAL = 'educational'
}

export enum ActivityCategory {
  PHYSIOTHERAPY = 'physiotherapy',
  OCCUPATIONAL_THERAPY = 'occupational_therapy',
  SPEECH_THERAPY = 'speech_therapy',
  MUSIC_THERAPY = 'music_therapy',
  ART_THERAPY = 'art_therapy',
  REMINISCENCE = 'reminiscence',
  COGNITIVE_STIMULATION = 'cognitive_stimulation',
  EXERCISE_CLASS = 'exercise_class',
  SOCIAL_INTERACTION = 'social_interaction',
  RELIGIOUS_SERVICE = 'religious_service',
  ENTERTAINMENT = 'entertainment',
  EDUCATION = 'education',
  GARDENING = 'gardening',
  COOKING = 'cooking',
  GAMES = 'games',
  OUTINGS = 'outings'
}

export enum ActivityDifficulty {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ADAPTIVE = 'adaptive'
}

export enum ParticipationLevel {
  INDIVIDUAL = 'individual',
  SMALL_GROUP = 'small_group',
  LARGE_GROUP = 'large_group',
  ONE_ON_ONE = 'one_on_one'
}

export interface ActivityRequirements {
  minimumMobility: string;
  cognitiveLevel: string;
  equipmentNeeded: string[];
  spaceRequirements: string;
  staffRatio: number;
  duration: number; // minutes
}

export interface TherapeuticGoals {
  primary: string[];
  secondary: string[];
  measurableOutcomes: string[];
  targetTimeframe: string;
}

export interface ActivityOutcome {
  participantId: string;
  participationLevel: 'full' | 'partial' | 'observer' | 'declined';
  enjoymentLevel: number; // 1-5 scale
  engagementLevel: number; // 1-5 scale
  behavioralObservations: string[];
  therapeuticProgress: string[];
  notes: string;
  recordedBy: string;
  recordedAt: Date;
}

export interface ActivityResource {
  resourceType: 'equipment' | 'material' | 'space' | 'staff';
  name: string;
  quantity: number;
  availability: 'available' | 'reserved' | 'maintenance' | 'unavailable';
  cost?: number;
}

@Entity('activities')
export class Activity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  activityName: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ActivityType
  })
  activityType: ActivityType;

  @Column({
    type: 'enum',
    enum: ActivityCategory
  })
  category: ActivityCategory;

  @Column({
    type: 'enum',
    enum: ActivityDifficulty,
    default: ActivityDifficulty.MEDIUM
  })
  difficulty: ActivityDifficulty;

  @Column({
    type: 'enum',
    enum: ParticipationLevel,
    default: ParticipationLevel.SMALL_GROUP
  })
  participationLevel: ParticipationLevel;

  @Column('jsonb')
  requirements: ActivityRequirements;

  @Column('jsonb')
  therapeuticGoals: TherapeuticGoals;

  @Column('jsonb')
  resources: ActivityResource[];

  @Column()
  facilitator: string;

  @Column()
  location: string;

  @Column('timestamp')
  scheduledStartTime: Date;

  @Column('timestamp')
  scheduledEndTime: Date;

  @Column('timestamp', { nullable: true })
  actualStartTime?: Date;

  @Column('timestamp', { nullable: true })
  actualEndTime?: Date;

  @Column()
  maxParticipants: number;

  @Column({ default: 0 })
  currentParticipants: number;

  @Column('simple-array')
  targetResidents: string[]; // Resident IDs

  @Column('jsonb')
  outcomes: ActivityOutcome[];

  @Column('text', { nullable: true })
  preparationNotes?: string;

  @Column('text', { nullable: true })
  sessionNotes?: string;

  @Column({
    type: 'enum',
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  })
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ default: true })
  isRecurring: boolean;

  @Column('jsonb', { nullable: true })
  recurrencePattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: string[];
    endDate?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: 1 })
  version: number;

  // Business Methods
  isScheduled(): boolean {
    return this.status === 'scheduled';
  }

  isInProgress(): boolean {
    return this.status === 'in_progress';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  canAcceptMoreParticipants(): boolean {
    return this.currentParticipants < this.maxParticipants;
  }

  getDuration(): number {
    if (this.actualStartTime && this.actualEndTime) {
      return Math.floor((this.actualEndTime.getTime() - this.actualStartTime.getTime()) / (1000 * 60));
    }
    return Math.floor((this.scheduledEndTime.getTime() - this.scheduledStartTime.getTime()) / (1000 * 60));
  }

  getParticipationRate(): number {
    if (this.outcomes.length === 0) return 0;
    
    const activeParticipants = this.outcomes.filter(outcome => 
      outcome.participationLevel === 'full' || outcome.participationLevel === 'partial'
    ).length;
    
    return (activeParticipants / this.outcomes.length) * 100;
  }

  getAverageEnjoymentLevel(): number {
    if (this.outcomes.length === 0) return 0;
    
    const totalEnjoyment = this.outcomes.reduce((sum, outcome) => sum + outcome.enjoymentLevel, 0);
    return totalEnjoyment / this.outcomes.length;
  }

  getAverageEngagementLevel(): number {
    if (this.outcomes.length === 0) return 0;
    
    const totalEngagement = this.outcomes.reduce((sum, outcome) => sum + outcome.engagementLevel, 0);
    return totalEngagement / this.outcomes.length;
  }

  isTherapeutic(): boolean {
    return this.activityType === ActivityType.THERAPEUTIC || 
           [ActivityCategory.PHYSIOTHERAPY, ActivityCategory.OCCUPATIONAL_THERAPY, 
            ActivityCategory.SPEECH_THERAPY, ActivityCategory.MUSIC_THERAPY, 
            ActivityCategory.ART_THERAPY].includes(this.category);
  }

  requiresSpecialEquipment(): boolean {
    return this.resources.some(resource => 
      resource.resourceType === 'equipment' && resource.name !== 'standard'
    );
  }

  getRequiredStaffCount(): number {
    return Math.ceil(this.maxParticipants / this.requirements.staffRatio);
  }

  isResourceAvailable(): boolean {
    return this.resources.every(resource => resource.availability === 'available');
  }

  addParticipantOutcome(outcome: ActivityOutcome): void {
    this.outcomes.push(outcome);
  }

  getOutcomeForParticipant(participantId: string): ActivityOutcome | null {
    return this.outcomes.find(outcome => outcome.participantId === participantId) || null;
  }

  hasTherapeuticGoal(goal: string): boolean {
    return this.therapeuticGoals.primary.includes(goal) || 
           this.therapeuticGoals.secondary.includes(goal);
  }

  isScheduledForToday(): boolean {
    const today = new Date();
    const scheduledDate = new Date(this.scheduledStartTime);
    
    return today.getDate() === scheduledDate.getDate() &&
           today.getMonth() === scheduledDate.getMonth() &&
           today.getFullYear() === scheduledDate.getFullYear();
  }

  getNextOccurrence(): Date | null {
    if (!this.isRecurring || !this.recurrencePattern) {
      return null;
    }

    const pattern = this.recurrencePattern;
    const nextDate = new Date(this.scheduledStartTime);

    switch (pattern.frequency) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + pattern.interval);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (pattern.interval * 7));
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
        break;
    }

    if (pattern.endDate && nextDate > pattern.endDate) {
      return null;
    }

    return nextDate;
  }
}
