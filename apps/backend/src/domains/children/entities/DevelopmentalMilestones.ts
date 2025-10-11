/**
 * Developmental Milestones Entity
 * 
 * TRACKS EARLY YEARS DEVELOPMENT (0-5 YEARS)
 * 
 * DOMAINS:
 * 1. Motor Skills (gross & fine)
 * 2. Language & Communication
 * 3. Social & Emotional
 * 4. Cognitive Development
 * 5. Self-Care & Independence
 * 
 * ASSESSMENTFRAMEWORK:
 * - Ages & Stages Questionnaires (ASQ)
 * - Early Years Foundation Stage (EYFS) Profile
 * - Healthy Child Programme (0-5)
 * - NICE Guidelines NG43 (Social, emotional and mental wellbeing)
 * 
 * COMPLIANCE:
 * - Promoting the health and wellbeing of looked-after children (Statutory guidance 2015)
 * - Working Together to Safeguard Children 2018
 * - SEND Code of Practice 0-25 years
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Child } from '../../children/entities/Child';

export enum DevelopmentalDomain {
  MOTOR_SKILLS = 'motor_skills',
  LANGUAGE = 'language',
  SOCIAL_EMOTIONAL = 'social_emotional',
  COGNITIVE = 'cognitive',
  SELF_CARE = 'self_care'
}

export enum AgeGroup {
  BIRTH_TO_3_MONTHS = '0-3m',
  THREE_TO_6_MONTHS = '3-6m',
  SIX_TO_9_MONTHS = '6-9m',
  NINE_TO_12_MONTHS = '9-12m',
  TWELVE_TO_18_MONTHS = '12-18m',
  EIGHTEEN_TO_24_MONTHS = '18-24m',
  TWO_TO_THREE_YEARS = '2-3y',
  THREE_TO_FOUR_YEARS = '3-4y',
  FOUR_TO_FIVE_YEARS = '4-5y'
}

export enum MilestoneStatus {
  NOT_ASSESSED = 'not_assessed',
  ON_TRACK = 'on_track',
  EMERGING = 'emerging',
  DELAYED = 'delayed',
  CONCERN = 'concern'
}

@Entity('developmental_milestones')
export class DevelopmentalMilestones {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  childId!: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== MILESTONEDETAILS ====================

  @Column({ type: 'var char', length: 50 })
  domain!: DevelopmentalDomain;

  @Column({ type: 'var char', length: 20 })
  ageGroup!: AgeGroup;

  @Column({ type: 'var char', length: 200 })
  milestoneName!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'var char', length: 50, default: MilestoneStatus.NOT_ASSESSED })
  status!: MilestoneStatus;

  // ==================== ASSESSMENT ====================

  @Column({ type: 'boolean', default: false })
  achieved!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  achievedDate?: Date;

  @Column({ type: 'int', nullable: true })
  achievedAtAgeMonths?: number; // Age in months when achieved

  @Column({ type: 'timestamptz', nullable: true })
  expectedByDate?: Date;

  @Column({ type: 'boolean', default: false })
  isDelayed!: boolean;

  @Column({ type: 'int', default: 0 })
  delayInMonths!: number; // How many months behind

  // ==================== OBSERVATION ====================

  @Column({ type: 'timestamptz', nullable: true })
  lastObservationDate?: Date;

  @Column({ type: 'text', nullable: true })
  observationNotes?: string;

  @Column({ type: 'var char', length: 100, nullable: true })
  observedBy?: string; // Care staff member

  @Column({ type: 'var char', length: 50, nullable: true })
  observationMethod?: string; // direct_observation, parent_report, formal_assessment

  // ==================== INTERVENTION ====================

  @Column({ type: 'boolean', default: false })
  requiresIntervention!: boolean;

  @Column({ type: 'text', nullable: true })
  interventionPlan?: string;

  @Column({ type: 'var char', length: 200, nullable: true })
  specialist?: string; // Speech therapist, occupational therapist, etc.

  @Column({ type: 'timestamptz', nullable: true })
  specialistReferralDate?: Date;

  @Column({ type: 'var char', length: 50, nullable: true })
  interventionStatus?: string; // planned, in_progress, completed

  // ==================== PROGRESSTRACKING ====================

  @Column({ type: 'jsonb', nullable: true })
  progressNotes?: Array<{
    date: Date;
    note: string;
    assessor: string;
  }>;

  @Column({ type: 'int', default: 0 })
  progressScore!: number; // 0-100

  @Column({ type: 'var char', length: 50, nullable: true })
  trend?: string; // improving, stable, declining

  // ==================== COMPARISON TONORMS ====================

  @Column({ type: 'boolean', default: true })
  withinNormalRange!: boolean;

  @Column({ type: 'text', nullable: true })
  normativeComparison?: string;

  @Column({ type: 'int', default: 50 })
  percentileRank!: number; // 1-99

  // ==================== REDFLAGS ====================

  @Column({ type: 'boolean', default: false })
  redFlag!: boolean; // Serious concern requiring immediate action

  @Column({ type: 'text', nullable: true })
  redFlagReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  redFlagReportedDate?: Date;

  @Column({ type: 'var char', length: 100, nullable: true })
  redFlagReportedTo?: string; // Social worker, pediatrician

  // ==================== SUPPORTINGACTIVITIES ====================

  @Column({ type: 'jsonb', nullable: true })
  supportingActivities?: Array<{
    activity: string;
    frequency: string;
    startDate: Date;
    effectiveness: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  resources?: Array<{
    title: string;
    type: string; // book, toy, app, video
    url?: string;
  }>;

  // ==================== AUDIT ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  // ==================== METHODS ====================

  /**
   * Check if milestone is overdue
   */
  get isOverdue(): boolean {
    if (!this.expectedByDate || this.achieved) return false;
    return new Date() > this.expectedByDate;
  }

  /**
   * Calculate delay severity (0-3: 0=none, 1=mild, 2=moderate, 3=severe)
   */
  get delaySeverity(): number {
    if (this.delayInMonths === 0) return 0;
    if (this.delayInMonths <= 2) return 1; // Mild delay
    if (this.delayInMonths <= 4) return 2; // Moderate delay
    return 3; // Severe delay (>4 months)
  }

  /**
   * Check if requires urgent attention
   */
  get requiresUrgentAttention(): boolean {
    return (
      this.redFlag ||
      this.delaySeverity === 3 ||
      (this.isDelayed && this.domain === DevelopmentalDomain.LANGUAGE && this.delayInMonths > 3)
    );
  }
}

/**
 * STANDARD DEVELOPMENTAL MILESTONES BY AGE GROUP
 * 
 * These are loaded as seed data
 */
export const STANDARD_MILESTONES = {
  // 0-3 MONTHS
  '0-3m': {
    motor_skills: [
      'Lifts head when lying on tummy',
      'Opens and closes hands',
      'Brings hands to mouth',
      'Swipes at dangling objects'
    ],
    language: [
      'Makes cooing sounds',
      'Turns head toward sounds',
      'Cries differently for different needs'
    ],
    social_emotional: [
      'Begins to smile at people',
      'Tries to look at parents',
      'Can calm when picked up'
    ],
    cognitive: [
      'Watches faces closely',
      'Follows objects with eyes',
      'Recognizes familiar people'
    ]
  },

  // 6-9 MONTHS
  '6-9m': {
    motor_skills: [
      'Sits without support',
      'Rolls over in both directions',
      'Begins to crawl',
      'Transfers objects from hand to hand'
    ],
    language: [
      'Babbles (mama, dada)',
      'Responds to own name',
      'Makes different sounds to express feelings'
    ],
    social_emotional: [
      'Shows fear of strangers',
      'May be clingy with familiar adults',
      'Has favorite toys'
    ],
    cognitive: [
      'Looks for dropped objects',
      'Plays peek-a-boo',
      'Explores objects with hands and mouth'
    ]
  },

  // 12-18 MONTHS
  '12-18m': {
    motor_skills: [
      'Walks independently',
      'Climbs stairs',
      'Drinks from cup',
      'Uses spoon'
    ],
    language: [
      'Says several single words',
      'Points to familiar objects',
      'Follows simple directions',
      'Shakes head "no"'
    ],
    social_emotional: [
      'Plays simple pretend games',
      'Shows affection to familiar people',
      'May have temper tantrums'
    ],
    cognitive: [
      'Finds hidden objects',
      'Explores in different ways',
      'Points to show things to others'
    ],
    self_care: [
      'Drinks from cup',
      'Eats with fingers',
      'Helps with getting dressed'
    ]
  },

  // 2-3 YEARS
  '2-3y': {
    motor_skills: [
      'Runs easily',
      'Kicks ball',
      'Climbs well',
      'Uses pencil to copy simple shapes'
    ],
    language: [
      'Uses 2-3 word sentences',
      'Names pictures in book',
      'Strangers can understand most speech',
      'Uses pronouns (I, you, me)'
    ],
    social_emotional: [
      'Copies other children',
      'Shows defiant behavior',
      'Separates easily from parents',
      'Shows wide range of emotions'
    ],
    cognitive: [
      'Sorts shapes and colors',
      'Completes simple puzzles',
      'Understands "in", "on", "under"',
      'Plays make-believe'
    ],
    self_care: [
      'Uses toilet with help',
      'Washes hands',
      'Helps undress self'
    ]
  },

  // 4-5 YEARS
  '4-5y': {
    motor_skills: [
      'Hops on one foot',
      'Catches bounced ball',
      'Uses scissors',
      'Draws person with 2-4 body parts'
    ],
    language: [
      'Tells stories',
      'Sings songs',
      'Speaks clearly',
      'Uses future tense'
    ],
    social_emotional: [
      'Wants to please friends',
      'Cooperates with other children',
      'More independent',
      'Understands rules'
    ],
    cognitive: [
      'Counts to 10',
      'Names colors and numbers',
      'Understands concept of "same" and "different"',
      'Draws recognizable pictures'
    ],
    self_care: [
      'Uses toilet independently',
      'Brushes teeth',
      'Dresses self',
      'Pours, cuts with supervision'
    ]
  }
};
