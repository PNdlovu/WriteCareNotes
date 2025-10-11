/**
 * Life Skills Progress Entity
 * 
 * TRACKS INDEPENDENT LIVING SKILLS FOR CARE LEAVERS
 * 
 * SKILLSCATEGORIES:
 * 1. Cooking & Nutrition
 * 2. Budgeting & Money Management
 * 3. Job Search & Employment
 * 4. Independent Living
 * 5. Health & Wellbeing
 * 6. Relationships & Social Skills
 * 
 * COMPLIANCE:
 * - Care Planning, Placement and Case Review (England) Regulations 2010
 * - Statutory guidance on promoting the health and wellbeing of looked-after children
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

export enum LifeSkillCategory {
  COOKING = 'cooking',
  BUDGETING = 'budgeting',
  JOB_SEARCH = 'jobSearch',
  INDEPENDENT_LIVING = 'independentLiving',
  HEALTH = 'health',
  RELATIONSHIPS = 'relationships'
}

export enum SkillLevel {
  NOT_STARTED = 'not_started',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  PROFICIENT = 'proficient',
  EXPERT = 'expert'
}

@Entity('life_skills_progress')
export class LifeSkillsProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  childId!: string;

  @ManyToOne(() => Child, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'childId' })
  child!: Child;

  // ==================== SKILLDETAILS ====================

  @Column({ type: 'var char', length: 100 })
  skillName!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'var char', length: 50 })
  category!: LifeSkillCategory;

  @Column({ type: 'var char', length: 50, default: SkillLevel.NOT_STARTED })
  skillLevel!: SkillLevel;

  @Column({ type: 'int', default: 0 })
  priority!: number; // 1-5, higher = more important

  // ==================== PROGRESS ====================

  @Column({ type: 'boolean', default: false })
  completed!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  completedDate?: Date;

  @Column({ type: 'int', default: 0 })
  progressPercentage!: number; // 0-100

  @Column({ type: 'timestamptz', nullable: true })
  startedDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  targetCompletionDate?: Date;

  // ==================== TRAINING & SUPPORT ====================

  @Column({ type: 'boolean', default: false })
  trainingProvided!: boolean;

  @Column({ type: 'var char', length: 200, nullable: true })
  trainingProvider?: string;

  @Column({ type: 'timestamptz', nullable: true })
  trainingDate?: Date;

  @Column({ type: 'var char', length: 200, nullable: true })
  trainingCertificate?: string; // File path or URL

  @Column({ type: 'var char', length: 200, nullable: true })
  supportWorker?: string; // Who's helping with this skill

  // ==================== ASSESSMENT ====================

  @Column({ type: 'var char', length: 50, nullable: true })
  assessmentMethod?: string; // observation, practical_test, self_assessment

  @Column({ type: 'timestamptz', nullable: true })
  lastAssessmentDate?: Date;

  @Column({ type: 'text', nullable: true })
  assessmentNotes?: string;

  @Column({ type: 'int', default: 0 })
  assessmentScore!: number; // 0-100

  // ==================== PRACTICERECORDS ====================

  @Column({ type: 'int', default: 0 })
  practiceCount!: number; // Number of times practiced

  @Column({ type: 'timestamptz', nullable: true })
  lastPracticeDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  practiceRecords?: Array<{
    date: Date;
    activity: string;
    outcome: string;
    notes: string;
  }>;

  // ==================== YOUNG PERSONNOTES ====================

  @Column({ type: 'text', nullable: true })
  notes?: string; // Young person can add their own notes

  @Column({ type: 'text', nullable: true })
  challenges?: string; // What's difficult

  @Column({ type: 'text', nullable: true })
  achievements?: string; // What went well

  @Column({ type: 'int', default: 5 })
  confidenceLevel!: number; // 1-10 self-rated confidence

  // ==================== RESOURCES ====================

  @Column({ type: 'jsonb', nullable: true })
  resources?: Array<{
    title: string;
    type: string; // video, guide, website, app
    url: string;
    helpful: boolean;
  }>;

  // ==================== AUDIT ====================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string; // Can be young person or staff

  // ==================== METHODS ====================

  /**
   * Check if skill is overdue
   */
  get isOverdue(): boolean {
    if (!this.targetCompletionDate) return false;
    return new Date() > this.targetCompletionDate && !this.completed;
  }

  /**
   * Calculate time to complete (in days)
   */
  get daysToComplete(): number | null {
    if (!this.targetCompletionDate) return null;
    const diff = this.targetCompletionDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if skill needs attention (low progress, approaching deadline)
   */
  get needsAttention(): boolean {
    return (
      (this.isOverdue) ||
      (this.daysToComplete !== null && this.daysToComplete < 7 && this.progressPercentage < 80) ||
      (this.confidenceLevel < 4)
    );
  }
}
