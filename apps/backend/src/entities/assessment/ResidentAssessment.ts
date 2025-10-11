import { EventEmitter2 } from "eventemitter2";

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { BaseEntity } from '../BaseEntity';
import { Resident } from '../resident/Resident';

export enum AssessmentType {
  INITIAL_ASSESSMENT = 'initial_assessment',
  COMPREHENSIVE_GERIATRIC_ASSESSMENT = 'comprehensive_geriatric_assessment',
  FALLS_RISK_ASSESSMENT = 'falls_risk_assessment',
  NUTRITION_ASSESSMENT = 'nutrition_assessment',
  COGNITIVE_ASSESSMENT = 'cognitive_assessment',
  MENTAL_HEALTH_ASSESSMENT = 'mental_health_assessment',
  PAIN_ASSESSMENT = 'pain_assessment',
  MEDICATION_REVIEW = 'medication_review',
  CARE_NEEDS_ASSESSMENT = 'care_needs_assessment',
  DISCHARGE_ASSESSMENT = 'discharge_assessment'
}

export enum AssessmentStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEWED = 'reviewed',
  APPROVED = 'approved',
  CANCELLED = 'cancelled'
}

@Entity('resident_assessments')
export class ResidentAssessment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  assessmentId: string;

  @Column('uuid')
  residentId: string;

  @ManyToOne(() => Resident)
  @JoinColumn({ name: 'residentId' })
  resident: Resident;

  @Column({
    type: 'enum',
    enum: AssessmentType
  })
  assessmentType: AssessmentType;

  @Column({
    type: 'enum',
    enum: AssessmentStatus,
    default: AssessmentStatus.SCHEDULED
  })
  status: AssessmentStatus;

  @Column()
  assessorId: string;

  @Column('timestamp')
  scheduledDate: Date;

  @Column('timestamp', { nullable: true })
  completedDate?: Date;

  @Column('jsonb')
  assessmentData: {
    scores: { [domain: string]: number };
    observations: string[];
    recommendations: string[];
    riskFactors: string[];
    interventions: string[];
  };

  @Column('jsonb')
  followUpPlan: {
    nextAssessmentDate?: Date;
    interventionsRequired: string[];
    monitoringPlan: string[];
    referralsNeeded: string[];
  };

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  isCompleted(): boolean {
    return this.status === AssessmentStatus.COMPLETED ||
           this.status === AssessmentStatus.REVIEWED ||
           this.status === AssessmentStatus.APPROVED;
  }

  isOverdue(): boolean {
    return new Date() > this.scheduledDate && !this.isCompleted();
  }

  calculateOverallScore(): number {
    const scores = Object.values(this.assessmentData.scores);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }
}